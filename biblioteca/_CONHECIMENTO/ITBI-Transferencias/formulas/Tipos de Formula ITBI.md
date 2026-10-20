# Tipos de fórmula ITBI

> **Origem:** contagem no corpus — `Formulas/ITBI/`, 36 arquivos de 27 municípios
> **Corrigido em 21/08/2026:** a versão anterior dizia "15 municípios" — errado.
> São **27** (de 35 na base). Erro pego em teste do agente.
> **Confirmado em:** os próprios arquivos de produção
> **Vale para:** todos os municípios (o *tipo* é do sistema; o *conteúdo* é de cada um)

Existem **exatamente três** tipos de fórmula ITBI na base. São fórmulas
curtas — mediana bem abaixo das de IPTU — porque cada uma responde uma
pergunta só.

| Tipo | Arquivos | O que responde |
|---|---|---|
| `ITBI_TRANSFERENCIA_CREDITOS` | 28 | O que acontece com os débitos/dívidas do imóvel quando ele troca de dono |
| `ITBI_VALOR_VENAL_TERRITORIAL` | 5 | Qual valor venal do terreno o sistema usa como base do ITBI |
| `ITBI_VALOR_VENAL_CONSTRUCAO` | 3 | Idem, para a construção |

**27 dos 35 municípios** da base têm fórmula ITBI — é a regra, não a exceção.
Dos 27, **22 têm só `TRANSFERENCIA_CREDITOS`**, sem fórmula de valor venal: o
comum é personalizar o que acontece com débito/dívida e deixar a base de
cálculo no padrão do sistema.

⚠️ Nos 8 municípios sem fórmula, ou o cálculo é o padrão, ou o export não
pegou. **Não concluir que o município "não usa ITBI" pela ausência do
arquivo** — e, principalmente, **não se sabe o que o sistema faz com os
créditos quando não há fórmula cadastrada** (transfere tudo? nada?). É a
hipótese nº 1 de qualquer chamado de "a dívida não foi junto" e a base **não
responde** — confirmar na tela.

---

## Contexto que o motor entrega

Diferente do IPTU, aqui o contexto é o da **transferência**, não o do
lançamento:

| Variável | Usos | O que é |
|---|---|---|
| `anoDaTransferencia` | 141 | Exercício da transferência — é a competência usada pra ler campo adicional |
| `transfImoveisItens` | 127+ | O item da transferência sendo processado |
| `imovel` | 111 | O imóvel do item |
| `retorno` | 6 | **Só nas fórmulas de valor venal** — é o valor devolvido pro sistema |

Propriedades de `transfImoveisItens` confirmadas em uso:
`.dtArrematacao` (127) · `.arrematante.codigo` (20) · `.motivos.descricao` (3)

---

## `ITBI_TRANSFERENCIA_CREDITOS`

Decide o que vai junto com o imóvel pro novo proprietário. Um namespace só,
`Creditos`, com três métodos — e nenhum outro apareceu na base:

```groovy
Creditos.transferirDebitosComVencimentoAPartirDe(data)   // 60 usos
Creditos.transferirDividas()                             // 36 usos
Creditos.transferirDividasComVencimentoAPartirDe(data)   // 30 usos
```

**Débito** e **dívida** são coisas separadas e transferem separado: débito é
o crédito ainda no exercício; dívida é o que já foi inscrito em dívida ativa.

⚠️ **`transferirDividas()` × `transferirDividasComVencimentoAPartirDe(1900)`.**
O texto abaixo trata data 1900 como "transfere tudo", equivalente ao método sem
parâmetro — mas **21 dos 28 arquivos chamam os dois**, às vezes em sequência no
mesmo ramo. Ou existe diferença semântica não documentada (vencimento × data de
inscrição?), ou é redundância copiada. **A base não sabe qual** — e num chamado
de "a dívida não foi junto" isso importa. Confirmar com a Betha.

### O padrão dominante

```groovy
Creditos.transferirDebitosComVencimentoAPartirDe(Datas.data(1900, 01, 01));
Creditos.transferirDividas();
```

Data 1900 = "transfere tudo". É o comportamento padrão: o comprador herda o
passivo do imóvel, que é o que o CTN prevê (art. 130) salvo prova de quitação.

### ⚠️ O `se` sem `senao` — armadilha real

Florianópolis (confirmado no arquivo de 2026):

```groovy
motivo = transfImoveisItens.motivos.descricao
se (motivo != "Hasta Pública"){
  Creditos.transferirDebitosComVencimentoAPartirDe(Datas.data(1900, 01, 01));
  Creditos.transferirDividas()
}
```

**Não tem `senao`.** Se o motivo for "Hasta Pública", **nada é transferido** —
nem débito, nem dívida. Pode ser intencional (arremate leva o imóvel livre),
mas está implícito no silêncio, não escrito.

Dois agravantes:
- a comparação é com a **string da descrição do motivo**. Renomear o motivo no
  cadastro, ou cadastrar "Hasta pública" em outra caixa, quebra o teste **em
  silêncio** — volta a transferir tudo, inclusive em arremate;
- no mesmo arquivo, o bloco de arrematação por `arrematante.codigo` está
  **inteiro comentado**. Ou seja: a lógica "boa" existe no arquivo mas não roda.
  Conferir sempre o que está **fora** de comentário antes de concluir.

### A variação que importa — arrematação

Confirmada em Criciúma (e replicada em outros como comentário/adaptação):

```groovy
se (transfImoveisItens.arrematante.codigo > 0) {
  Creditos.transferirDebitosComVencimentoAPartirDe(Datas.data(
    Datas.ano(transfImoveisItens.dtArrematacao),
    Datas.mes(transfImoveisItens.dtArrematacao),
    Datas.dia(transfImoveisItens.dtArrematacao)));
  Creditos.transferirDividasComVencimentoAPartirDe(Datas.data(
    Datas.ano(transfImoveisItens.dtArrematacao),
    Datas.mes(transfImoveisItens.dtArrematacao),
    Datas.dia(transfImoveisItens.dtArrematacao)))
} senao {
  Creditos.transferirDebitosComVencimentoAPartirDe(Datas.data(1900, 01, 01));
  Creditos.transferirDividas();
}
```

⚠️ **`arrematante.codigo` × `idArrematante`.** A fórmula testa
`transfImoveisItens.arrematante.codigo` (objeto no contexto do motor); o campo
da entidade no Swagger é `idArrematante`. São a mesma coisa por caminhos
diferentes. **Não se sabe o que `arrematante.codigo` devolve sem arrematante**
— `0`, `nulo`, ou erro. Se for `nulo`, `nulo > 0` pode derrubar a fórmula e
**nada** transferir. Não confirmado; testar antes de replicar.

**Por que:** na arrematação em hasta pública o CTN (art. 130, parágrafo
único) faz a dívida sub-rogar no preço — o arrematante recebe o imóvel
livre do que é anterior ao arremate. Por isso a data de corte vira a
`dtArrematacao` em vez de 1900.

Essa distinção é a pergunta nº 1 a fazer num município novo: **"como vocês
tratam arrematação?"**

---

## `ITBI_VALOR_VENAL_TERRITORIAL` / `_CONSTRUCAO`

Devolvem um número via `retorno`. O caso simples (Bom Jesus) é ler direto
do campo adicional que o cálculo do IPTU já gravou:

```groovy
vvt = CamposAdicionais.valor(imovel, "VALOR DO TERRENO", anoDaTransferencia);
retorno = vvt;
```

⚠️ **Acoplamento importante:** a fórmula de ITBI depende do que a fórmula de
IPTU gravou. Se o IPTU não gravou o campo adicional daquele exercício, o ITBI
lê `nulo`. Ver a fase 8 do documento de IPTU (gravação de campos adicionais).

O caso complexo (Fazenda Rio Grande, 1.413 linhas) recalcula o valor venal
do zero dentro da própria fórmula de ITBI, em vez de ler o gravado —
provavelmente porque a base de cálculo do ITBI diverge da do IPTU naquele
município. Vale conferir a lei antes de assumir que dá pra só ler o campo.

---

## Perguntas pra um município novo

- [ ] Arrematação tem tratamento próprio? Qual a data de corte?
- [ ] Débito e dívida transferem os dois, ou só um?
- [ ] A base de cálculo do ITBI é o mesmo valor venal do IPTU, ou tem
      avaliação própria?
- [ ] Se for própria: é campo adicional preenchido pelo fiscal, ou recálculo?
- [ ] Existe pauta/valor mínimo de referência acima do valor da transação?
