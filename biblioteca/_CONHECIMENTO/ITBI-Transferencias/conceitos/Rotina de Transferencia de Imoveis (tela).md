# A rotina de transferência de imóveis — na tela

> **Origem:** central de ajuda Betha —
> https://arrecadacao.ajuda.betha.cloud/tributos/ajuda/executando#transferência-de-imóveis
> (lido em 2026-08-20)
> **Vale para:** todos os municípios

**Onde:** Módulo Imobiliário →
`Executando > Movimentação Cadastral > Transferência de imóveis`

**"Transferência de imóveis" é o cadastro de um ITBI.** Os dois nomes falam da
mesma tela. Fato gerador: a transmissão de imóveis (CF) — toda transmissão
gera tributação.

---

## O fluxo em uma frase

Venda → identificar imóvel, vendedores e compradores → levantar valores →
aplicar alíquota → gerar ITBI → contribuinte paga → sistema troca o
proprietário (ou o usuário troca à mão, conforme a configuração).

Mas a ajuda avisa: **o processo é específico e varia por caso** — vários
imóveis num mesmo ITBI, um imóvel para vários compradores, vários responsáveis
numa venda, venda de percentual, leilão judicial, transferência sem cobrança.

---

## Cadastro — o assistente de 4 guias

### 1. Informar dados

`Data` · `Situação` · **`Forma de cobrança`** · `Data de vencimento` ·
`Processo` (opcional) · `Observações` (opcional)

A **forma de cobrança** é a decisão mais consequente da tela — define quantos
lançamentos nascem. Ver `../campos/Dominios e Situacoes.md`.

`Data de vencimento` vem sugerida da configuração, e é editável.

### 2. Definir imóveis

`+Imóvel`, N imóveis por transferência. Exige o `Tipo` (**Urbano** ou
**Rural**). Por imóvel dá pra vincular **processos**, **comentários** e
**anexos**.

### 3. Configurar transferência

Clica no imóvel e abrem três sub-guias:

**Dados da transferência**
- **`Motivo`** (obrigatório) — cadastrado em `Administrando > Cadastros
  auxiliares > Motivos`. **Traz alíquota própria, desconto e benefício.**
- `Benefício` — se houver
- `Tipo de venda` — Parcial ou Total. Importa quando há mais de um proprietário
- `Unidade futura?` — **Sim** para imóvel na planta, ainda não construído
- `Financiado?` · `Benfeitorias?` · `Outros?`
- **`Pagador`** (obrigatório) · `Cartório` (o de registro de imóveis responsável)
- **`Vendedor é proprietário do imóvel?`** — ver abaixo
- A tela mostra as quatro alíquotas aplicadas, e o Valor ITBI por imóvel

**Dados da venda** — vendedor(es), `Terreno (m²)`, `Construído (m²)`,
`% venda`, `Nº de compradores`. Botão `+Vendedor` para mais transmitentes.

> ⚠️ A ajuda diz que **os dados desta guia não devem ser alterados pelo
> usuário** — só a guia *Dados da compra* é editável. Se `Tipo de venda` =
> Total, o `% da venda` vira 100% sozinho.

**Dados da compra** — comprador(es), metragem, `% compra`, `Declarado (R$)`,
`À vista (R$)`, `ITBI (R$)`, e **`Proprietário principal`** (obrigatório).
`À vista` e `ITBI` são calculados a partir do declarado. Se `Financiado?` =
Sim, informa-se aqui o valor financiado.

### 4. Visualizar resumo

Mostra tudo, com botão **Emitir** para simulação em PDF. Ao **Salvar**, o
sistema oferece emitir a **certidão** e a **guia**.

---

## Três regras que não são óbvias

### Vendedor ≠ proprietário

Marcar `Vendedor é proprietário do imóvel?` = **Não** libera trocar e inserir
vendedores.

Por quê: em compra e venda por **alienação ou cessão de direito**, o cadastro
do imóvel pode ter mudado de proprietário **sem cobrança de ITBI**, porque não
houve transferência do registro. Quando o registro enfim muda, o ITBI é devido
— e aí é preciso informar o(s) proprietário(s)/vendedor(es) **antigos, os que
constam no registro**, não quem está no cadastro hoje.

### Transferência fracionada em processos simultâneos

Dá pra ter **múltiplas transferências abertas para o mesmo imóvel**, mesmo sem
encerrar a anterior — desde que:

1. os proprietários atuais tenham percentual disponível (não venderam 100%);
2. só entrem no processo vendedores com percentual disponível;
3. a soma dos percentuais vendidos nos cadastros **ativos, não encerrados**,
   fique **abaixo de 100%**.

Em venda parcial com vendedor ≠ proprietário, os novos vendedores ficam
limitados aos 100%, **sem** considerar percentuais de outras transferências
ativas.

### Endereço de correspondência ao trocar o proprietário

Regra do sistema, não do município:

1. Correspondência = **Corresponsável** ou **Imobiliária** → **não altera**
2. Imóvel **baldio** (unidade = zero) → passa para o **endereço principal do
   novo contribuinte**
3. Correspondência = **Proprietário** e imóvel **não** baldio → passa para o
   **endereço do imóvel**. Se o novo proprietário não tiver endereço, vai para
   o endereço do imóvel de qualquer forma

Útil quando aparecer "por que a correspondência do IPTU mudou/não mudou depois
da transferência".

---

## Emissão

- **Certidão de ITBI** — só para transferência **calculada** ou **encerrada**,
  em `Executando > Movimentação Cadastral > Transferência de imóveis`
- **Guia de pagamento do ITBI** — pelo **módulo atendimento do comprador**

---

## Armadilhas

1. **Sem cobrança + valor no `Declarado` = ITBI aparece mesmo assim** na
   certidão ou em tela. A ajuda alerta explicitamente: deixe o declarado vazio.
2. **O motivo carrega alíquota, desconto e benefício.** Valor divergente? olhe
   o motivo antes da alíquota geral.
3. **São quatro alíquotas**, não uma: à vista, financiado, outros, benfeitoria.
4. **"Outros" pode ter outro nome** neste município (configurável).
5. **`Proprietário principal` é obrigatório** em Dados da compra — com vários
   compradores, alguém precisa ser o principal.
6. **Dados da venda não se edita** — se o número está errado ali, a origem é
   outra guia ou o cadastro do imóvel.
