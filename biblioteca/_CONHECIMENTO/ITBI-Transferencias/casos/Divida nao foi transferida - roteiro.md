# "A dívida não foi junto para o novo proprietário"

> **Origem:** roteiro montado a partir do corpus (28 fórmulas
> `ITBI_TRANSFERENCIA_CREDITOS`) em 21/08/2026, durante teste do agente
> **Revisado em 21/08/2026** com contagem sobre o **código ativo** (comentários
> removidos) dos 28 arquivos: hipótese 3 reescrita, hipótese 3b criada, e dois
> precedentes de chamado real encontrados no próprio corpus (Ilhota BTHSC-308553,
> Lagoa Santa BTHSC-205387) — os dois são "a dívida não vai, **de propósito**,
> quando o motivo é X".
> **⚠️ Status: HIPÓTESES, não caso confirmado.** Nenhuma dessas causas foi
> vista fechando um chamado real. Quando um chamado de verdade for resolvido,
> atualizar este arquivo com o que era, e promover a causa confirmada ao topo.

Sintoma: transferiram o imóvel, o proprietário mudou, mas a dívida ativa
antiga continuou no nome do antigo dono.

---

## Resposta rápida

**Este arquivo basta.** Não varra o corpus de novo — o levantamento já foi
feito sobre os 28 arquivos, com comentários removidos.

**Onde olhar, nesta ordem:**

1. **O motivo escolhido no item da transferência.** Causa mais provável. Vários
   municípios só deixam de levar a dívida **de propósito**, em certos motivos —
   dois com chamado registrado no próprio código (Ilhota, Lagoa Santa).
2. **`dtArrematacao` preenchida sem leilão.** O corte vira a data do arremate e
   tudo que é anterior fica com o antigo dono. Se for isso, o sistema acertou e
   o erro está no cadastro.
3. **A fórmula, no exercício da transferência** — `Fórmulas > ITBI`, tipo
   `TRANSFERENCIA_CREDITOS`. Ler **só o que está fora de comentário**.

**Primeira pergunta ao município:** é **um** caso ou **todos** desde certa
data? Um → cadastro. Todos → fórmula.

**Antes de prometer conserto:** não dá por Script (não existe fonte de escrita
de transferência) e corrigir a fórmula provavelmente **não reprocessa o
histórico**.

Detalhamento e precedentes abaixo — abrir só se o acima não resolver.

---

## O mecanismo (isso é fato)

Quem decide o que acompanha o imóvel é a fórmula
**`ITBI_TRANSFERENCIA_CREDITOS`** — e só ela. Não existe parâmetro na Central
de configurações que faça isso. Três métodos, nenhum outro no corpus:

```groovy
Creditos.transferirDebitosComVencimentoAPartirDe(data)   // 60 usos
Creditos.transferirDividas()                             // 36 usos
Creditos.transferirDividasComVencimentoAPartirDe(data)   // 30 usos
```

**Débito ≠ dívida.** Débito é crédito do exercício; dívida é o que já foi
inscrito. Chamar só `transferirDebitos...` leva o débito e **deixa a dívida
ativa para trás** — exatamente este sintoma.

---

## Ordem de investigação

**1. A fórmula existe, no exercício da transferência?**
`Fórmulas > ITBI`, tipo `TRANSFERENCIA_CREDITOS`. Toda fórmula é carimbada por
ano no cabeçalho, e o motor entrega `anoDaTransferencia`. Fórmula cadastrada só
em 2025 e transferência lançada em 2026 é candidata forte.
⚠️ **Não se sabe o que o sistema faz sem fórmula cadastrada** — transfere tudo,
ou nada? A base não responde. Confirmar na tela.

**2. As chamadas estão fora de comentário?**
Vício comum na base: a versão boa comentada, outra ativa. Florianópolis tem o
bloco inteiro de arrematação comentado; Atibaia e São João Batista têm blocos
comentados no fim. **Ler só o que executa.**

**3. Só transfere débito, e não dívida — num *ramo* da fórmula?**
Se o arquivo tem `transferirDebitos...` e nenhum `transferirDividas*`, achou.

> ✅ **Contado no corpus em 21/08/2026 (código ativo, comentários removidos):**
> **nenhum** dos 28 arquivos `TRANSFERENCIA_CREDITOS` deixa de chamar
> `transferirDividas*` no arquivo inteiro. Então **não procure o arquivo sem
> dívida — procure o *ramo* sem dívida.** Dois casos reais achados:
>
> **Ilhota** (`Formulas/ITBI/Ilhota - ITBI_TRANSFERENCIA_CREDITOS ... 2026.txt`,
> comentário `//Chamado - BTHSC-308553`) — é o sintoma exato, e é **de
> propósito**:
> ```groovy
> se(transfImoveisItens.motivos.descricao == 'Transferência Por Ato Legal'){
>   Creditos.transferirDebitosComVencimentoAPartirDe(Datas.data(anoTransferencia, 01, 01));
> }senao{ ... }
> ```
> Motivo "Transferência Por Ato Legal" → transfere **só débito, e só do ano
> corrente**. **Nenhuma dívida ativa** vai junto. Chamado do próprio município.
> ⚠️ E a variável ali é `anoTransferencia` — a do motor é **`anoDaTransferencia`**
> (141 usos no corpus; `anoTransferencia` aparece **1 vez**, só nesse arquivo).
> Se o nome estiver errado mesmo, esse ramo pode estar quebrando em silêncio.
> Conferir no editor.
>
> **Lagoa Santa** (`Formulas/ITBI/Lagoa Santa - ...`, `//Referente ao chamado
> BTHSC-205387`) — o "não transferir nada" escrito como data no futuro:
> ```groovy
> se (transfImoveisItens.motivos.descricao == "Acerto Cadastral"){
>   Creditos.transferirDividasComVencimentoAPartirDe(Datas.data(3000, 01, 01));
>   Creditos.transferirDebitosComVencimentoAPartirDe(Datas.data(3000, 01, 01));
> }
> ```
> Corte em **3000** = nada tem vencimento depois disso = nada transfere. E esse
> `se` roda **depois** do bloco padrão, sobrescrevendo-o.
> 👉 **Lição:** procurar `3000`, ou qualquer data de corte no futuro, é teste de
> 5 segundos e explica o sintoma inteiro.

**3b. A data de corte é a do arremate, disparada pela data e não pelo arrematante?**
**Atibaia** (código **ativo**; o bloco por `arrematante.codigo` está comentado)
testa a **data**, não o arrematante:
```groovy
se(transfImoveisItens.dtArrematacao){
  Creditos.transferirDebitosComVencimentoAPartirDe(transfImoveisItens.dtArrematacao);
  Creditos.transferirDividasComVencimentoAPartirDe(transfImoveisItens.dtArrematacao);
}senao{ ...1900... }
```
Basta **`dtArrematacao` preenchida** — sem arrematante nenhum — para toda a
dívida anterior a essa data ficar com o antigo dono. `dtArrematacao` é
filtrável em `transferenciasImoveis.itens`: dá pra checar por fonte de dados.

**4. A fórmula cai num ramo que não transfere nada?**
Florianópolis:
```groovy
se (motivo != "Hasta Pública"){ ...transfere... }   // sem senao!
```
Motivo "Hasta Pública" → **nada** transfere. E a comparação é por **string da
descrição do motivo**: renomear o motivo, ou grafia diferente ("Hasta
pública"), quebra o teste em silêncio.

**5. O ramo de arrematação disparou sem ser leilão?**
O padrão testa `se (transfImoveisItens.arrematante.codigo > 0)` e troca a data
de corte de 1900 para `dtArrematacao` — deixando **de propósito** a dívida
anterior ao arremate com o antigo dono (CTN 130, § único). Se alguém preencheu
arrematante num caso comum, o sistema fez o certo e o cadastro é que está
errado.
👉 O sintoma ser "a dívida **antiga**" aponta para data de corte.
⚠️ Não se sabe o que `arrematante.codigo` devolve sem arrematante (`0`, `nulo`
ou erro). Se for `nulo`, `nulo > 0` pode derrubar a fórmula e nada transferir.

**6. A dívida foi inscrita depois da efetivação?**
A fórmula roda no momento da troca de proprietário. O que virou dívida ativa
depois não retroage. Comparar `dtInscricao` × data de efetivação.
*(dedução, não confirmado)*

**7. Venda parcial?**
`Tipo de venda = Parcial`, ou processo fracionado — o antigo dono continua
coproprietário e o passivo dele fica. ⚠️ **A base não sabe** como débito/dívida
se comportam em venda de percentual: proporcional, inteiro, ou nada.

**8. A transferência chegou a se efetivar?**
Calculada ≠ Encerrada. Com `Transferir automaticamente após o pagamento do
ITBI` desligado, a troca é manual. Se o proprietário já mudou no cadastro,
descartado.

---

## Confirmar onde a dívida está hoje

```groovy
fonte = Dados.tributos.v2.dividas
criterio = "idImovel = " + imovel.id + " and situacaoDivida = 'ABERTO'"
```

⚠️ Em `dividas` o campo é **`situacaoDivida`**; em `debitos` é `situacao`.
`imovel.id` no filtro, `imovel.codigo` na mensagem.
Valores de `situacaoDivida`: `ABERTO` · `PAGA` · `CANCELADA` · `SUSPENSA` ·
`INSCRITA` · `PARCELADA` · `PRESCRITA` · `REMIDA` · … (lista completa em
`../campos/Modelo de Dados e Enums (Swagger).md`).

---

## O que dizer ao município antes de prometer conserto

- **Não dá pra corrigir por Script.** Não existe fonte de criação/alteração de
  transferência. Reapontar dívida é tela.
- **Corrigir a fórmula provavelmente só vale pra frente.** Alíquotas ficam
  congeladas no item; se créditos também congelam, o histórico não se
  reprocessa. ⚠️ **Não confirmado** — verificar antes de prometer.
- **Estorno pode não estar disponível:** solicitação deferida cujo lançamento
  foi pago, inscrito ou parcelado não estorna.

## Perguntas pro município

1. Tem leilão/arrematante envolvido? Qual motivo foi escolhido?
2. Arrematação deve levar a dívida anterior, ou cortar na data do arremate?
   (decisão jurídica, não técnica)
3. Venda total ou parcial?
4. A dívida já estava inscrita quando a transferência foi efetivada?
5. **Um caso ou todos desde certa data?** Um → cadastro. Todos → fórmula.

---

## Lacunas que este roteiro expôs

- Comportamento sem fórmula cadastrada
- Diferença real entre `transferirDividas()` e
  `transferirDividasComVencimentoAPartirDe(1900)` — **21 dos 28 arquivos
  chamam os dois**
- Se dá pra reprocessar créditos de transferência já encerrada
- Débito/dívida em venda parcial
- Existe simulação/log de execução da fórmula?
