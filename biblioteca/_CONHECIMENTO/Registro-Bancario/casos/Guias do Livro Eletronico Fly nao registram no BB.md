# "As guias do Livro Eletrônico Fly não estão registrando no banco"

> **Origem:** chamado real resolvido em **25/08/2026**, Rurópolis/PA, primeira
> configuração do zero feita pelo Felipe. Diagnóstico feito com o script de
> registro instrumentado com `imprimir`, comparando contra uma entidade que
> funcionava.
> **Status: CAUSA CONFIRMADA.** O ajuste descrito abaixo resolveu o caso.

Sintoma: o script agendado "Registro Guias Fly BB PIX V2" roda a cada 15 min,
não dá erro, e nenhuma guia vinda do Livro Eletrônico é registrada. As guias
emitidas pelo próprio Tributos registram normalmente.

---

## Resposta rápida

**Causa confirmada: o campo `Cedente` do convênio, no Tributos, estava vazio.**

`Configurando > Convênios > (editar) > Cedente / DV`.

Sem o Cedente preenchido, o número de baixa gerado pelo Livro Eletrônico nasce
**sem o número do convênio** (`nroConvenio` nulo). O script filtra as guias
comparando o convênio da baixa com o do parâmetro, nada casa, e ele termina
sem registrar nada e sem mensagem de erro.

**Como preencher:** o Cedente é o **número do convênio sem o último dígito**, e
o DV é esse último dígito.

| Convênio | Cedente | DV |
|---|---|---|
| `2878741` (Rurópolis) | `287874` | `1` |
| `2837646` (entidade de referência) | `283764` | `6` |

Depois de preencher, **as baixas antigas continuam sem convênio** — elas já
foram gravadas assim. Só guia nova nasce corrigida.

---

## Como confirmar que é este o caso

Rodar em Script (só leitura):

```groovy
FonteTributos = Dados.tributos.v2
percorrer (FonteTributos.convenios.busca(campos: "id, nroConvenio, cedente, dvCedente, carteira, disponivel")) { c ->
  imprimir 'convenio ' + c.nroConvenio + ' cedente=[' + c.cedente + '] dv=[' + c.dvCedente + '] carteira=' + c.carteira
}
percorrer (FonteTributos.numerosBaixa.busca(criterio: "dtVencimento > '1800-01-02'", campos: "id, sistemaOrigem, nroConvenio, cedente, dtVencimento", ordenacao: 'id desc')) { nb ->
  imprimir nb.sistemaOrigem?.valor + ' baixa=' + nb.id + ' nroConvenio=[' + nb.nroConvenio + '] cedente=[' + nb.cedente + ']'
}
```

É o caso quando: o convênio aparece com `cedente=[]` **e** as baixas de
`LIVRO_ELETRONICO` com vencimento real aparecem com `nroConvenio=[]`.

**Atenção ao ler a lista de baixas:** número de baixa com vencimento
`1800-01-01` é número **reservado e ainda não usado** — é normal estar sem
convênio. Só interessa a baixa com vencimento real. Foi por não separar os dois
que o diagnóstico quase foi para o lado errado.

---

## O funil do script, para diagnosticar variações deste caso

O script só registra a baixa que passa em **todos** estes filtros:

1. `sistemaOrigem` fora de PROTOCOLO / TRIBUTOS / GESTAO_FISCAL, `integrado = false`,
   `guiaUnificada.id is null`, `dtVencimento >= hoje`;
2. dentro do laço, origem em `LIVRO_ELETRONICO`, `E_NOTA`, `PROTOCOLO` ou `CIDADAO_WEB`
   — **as variantes `_CLOUD` não são aceitas**;
3. `nroConvenio` da baixa (ou da `guiaEmitida`) igual ao do convênio do parâmetro.

O jeito rápido de achar onde zera é instrumentar o script original com
`imprimir` nos três filtros e um resumo no fim (quantas entraram, quantas
passaram em cada etapa). Foi assim que este caso foi fechado em uma execução.

---

## Descartado neste caso (não perca tempo)

- **O script.** É o padrão, byte a byte igual ao de outros municípios que
  funcionam. A linha do `criterios` é o ponto de customização por município
  (Ilhota quebrou em cópias por origem, Paulo Lopes usa `PROCURADORIA`).
- **Vínculo de crédito tributário em mais de um convênio.** Parece anomalia mas
  é normal — a entidade de referência tem o `ISS LIVRO ELETRONICO` vinculado a
  dois convênios e registra sem problema.
- **Credenciais / tabelas auxiliares.** Se a emissão pelo próprio Tributos
  registra, a AppKey, o Client ID, o ambiente e as duas tabelas auxiliares estão ok.
- **Tamanho do "nosso número".** O `numeroTituloCliente` é `"000"` + convênio de
  7 dígitos + 10 dígitos do nº de baixa = 20 posições, que é o que o BB exige.
  Só vira problema se o convênio não tiver 7 dígitos.

---

## Outros ajustes de cadastro vistos junto (não eram a causa)

Não bloquearam o registro, mas estavam divergentes da entidade de referência:

- **"Usa validade para número de baixa" = Sim com "Validade = 0 dias".** Na
  entidade de referência é 1 dia. Contraditório: ou liga a validade com prazo
  real, ou desliga.
- **Convênio duplicado.** Rurópolis tinha `287874` (carteira 0, indisponível)
  além do `2878741` (carteira 17, em uso), com três créditos amarrados no morto.
- **"Layout de cobrança" em branco** no cadastro do convênio do lado do Fly.

---

## O que o `Cedente` afeta e o que não afeta

- **Não** vai no JSON enviado ao BB. O payload usa `numeroTituloBeneficiario`,
  que é o nº da baixa ou o cedente dependendo do script. Por isso a emissão pelo
  Tributos registrava mesmo com o campo vazio — foi o que fez a pista ser
  rebaixada no meio do diagnóstico, indevidamente.
- **Afeta** a geração do número de baixa pelos sistemas de origem (Livro
  Eletrônico, Nota Eletrônica), que é onde o convênio deixa de ser gravado.
- **Afeta** a impressão do boleto: o relatório usa `cedente` do convênio.
