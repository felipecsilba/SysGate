# Solicitação de transferência — o fluxo que vem de fora

> **Origem:** central de ajuda Betha —
> https://arrecadacao.ajuda.betha.cloud/tributos/ajuda/executando#transferência-de-imóveis
> (lido em 2026-08-20)
> **Vale para:** todos os municípios

**Onde:** Módulo Imobiliário →
`Executando > Movimentação Cadastral > Solicitação de Transferência de Imóveis`

Quem abre a solicitação são **cartórios, proprietários ou compradores**, pelo
sistema **Protocolo (Cloud)**. Ou seja: é a transferência **antes** de existir —
o pedido entra de fora e a entidade analisa.

Diferença que importa: **solicitação ≠ transferência.** A transferência só
nasce no deferimento (ou automaticamente, conforme configuração). São entidades
separadas também nas fontes de dados — ver
`../fontes/Mapa de Fontes - Transferencias e ITBI.md`.

---

## A tela

Menu lateral com uma aba por situação, cada uma com contador:

```
Não analisada → Em análise → Aguardando resposta → Resposta recebida
                     ↓
              Deferida  |  Indeferida
```

Listagem: `código` · `data/hora` · `nº processo` · `solicitante` · `cartório` ·
`imóvel(is)`. Ordenada por data/hora **decrescente**.

## As quatro ações por linha

| Ícone | Ação | Azul significa |
|---|---|---|
| 1º | Parecer / comentário (**limite 4.000 caracteres**) | já existem comentários ou pareceres |
| 2º | Anexos | existem documentos anexados |
| 3º | Movimentar situação — inclusive **estornar** a última movimentação | — |
| 4º | Detalhar — motivo da transferência, valor do ITBI, motivo da solicitação | — |

Um ícone extra marca **retificação**: o requerente alterou a solicitação. Ao
clicar, sai o histórico completo, campo a campo, com o que foi retirado
(vermelho), acrescentado (verde) e o que ficou sem informação — protocolo,
motivo, anexos, solicitante, cartório, data/hora, código de terceiro, e por
imóvel.

---

## Análise: comparação lado a lado

Ao detalhar, aparecem **duas colunas**: *Informações do sistema* × *Informações
da solicitação* (o que o cartório mandou), para cada imóvel:

| Linha comparada |
|---|
| Terreno (m²) · Construção (m²) |
| Valor venal do terreno · Valor venal da construção |
| Total declarado |
| Valor à vista · Valor financiado · Benfeitorias · Valor de outros |

**Divergência em terreno ou construção acende alerta amarelo.** É o mecanismo
anti-subavaliação da rotina: o cartório declara, o sistema mostra o que tem em
cadastro, e o analista decide.

Também aparecem endereço do imóvel, vendedor e comprador com **percentual de
cada um**, e um indicativo de quem é responsável. Uma solicitação pode ter
vários imóveis — o bloco se repete por imóvel.

### Ajuste de valores — só em "Em análise"

Regra de precedência, e é onde se erra:

- **Sem ajuste** → o cálculo usa **sempre os valores da coluna da solicitação**
  (o que o cartório declarou), não os do sistema.
- **Com ajuste** → passam a valer os valores ajustados.

Existe **`Usar o valor para o ajuste`**, que copia o valor da solicitação para
a coluna de ajuste sem redigitar, e **`Cancelar ajustes`**.

> Consequência: se ninguém ajustar, **o valor declarado pelo cartório é o que
> vira base do ITBI**. O alerta amarelo avisa, mas não impede.

---

## Pendência financeira não impede

Imóvel com pendência mostra o aviso *"Este imóvel possui pendências financeiras
em aberto — isso não impede que o andamento da solicitação continue
normalmente"*, com link **Consultar pendências**. A decisão de seguir é do
usuário.

Bate com o que os municípios fazem nas críticas: pendência financeira costuma
ser **aviso**, não bloqueio. Ver
`Criticas de Transferencia (validacao no cadastro).md`.

---

## Contribuinte sem cadastro

Se o solicitante não tem cadastro no município, aparece alerta na listagem. Dá
pra criar na hora **ou não** — no deferimento o cadastro é criado
automaticamente.

**Mas:** se faltar informação obrigatória, o deferimento falha com mensagem
(ex.: *"É obrigatório informar o CEP!"*) e é preciso completar antes de seguir.
É o mesmo mecanismo que, no modo automático, joga a solicitação de volta para
*Não analisada*.

---

## Deferimento

Deferida → gera o **lançamento** do imposto e habilita as abas **Lançamentos**
e **Transferência**, onde dá pra detalhar a transferência criada.

### O estorno que não existe

Solicitação deferida cujo lançamento foi **pago**, **inscrito em dívida ativa**
ou **vinculado a parcelamento**: **não dá pra estornar o deferimento**. Ponto
sem volta da rotina — vale saber antes de deferir em lote.

Indeferimento equivocado, esse sim, se estorna: aba *Indeferida* →
*Movimentações* → *Movimentar para* → situação desejada.

### Emissão depois de deferir

- **Certidão de ITBI**: `Executando > Movimentação Cadastral > Transferência de imóveis`
- **Guia do ITBI**: módulo **atendimento do comprador**

(a ajuda diz "por momento", sugerindo que deve mudar — conferir na página de
melhorias quando ela for ingerida)

---

## Perguntas úteis num diagnóstico

- A solicitação está em qual aba? *Não analisada* pode significar crítica
  cadastral barrando, não fila.
- Alguém ajustou valores, ou o cálculo usou o declarado pelo cartório?
- Houve retificação? o histórico mostra o que mudou.
- O deferimento é automático ou manual neste município?
- O lançamento já foi pago/inscrito/parcelado? (define se ainda dá pra estornar)
