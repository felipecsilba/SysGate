# Dicionário de Fórmulas

**O que dá pra usar dentro de cada tipo de fórmula** — direto da fonte, não
do que alguém já escreveu.

> ⚠️ **Não confundir com `../Dicionario de Funcoes BFC-Script.md`.**
> Aquele foi extraído do **corpus** (7.428 arquivos): mostra o que *se usa*.
> Este vem do **próprio sistema**: mostra o que *se pode usar*. São coisas
> diferentes, e a diferença é grande — ver abaixo.

---

## De onde vem

O editor de fórmulas do Tributos carrega um catálogo de contexto ao abrir uma
fórmula: as **variáveis** disponíveis (com todos os seus métodos, tipo de
retorno e descrição) e as **classes** utilitárias liberadas naquele tipo.

```
https://tributos.betha.cloud/tributos/v1/api/core/scriptArrecadacao/{id}/script
```

⚠️ **`GET` nessa URL devolve o código-fonte da fórmula, com `variables` vazio.**
O catálogo cheio vem de outra chamada do editor na mesma URL (o payload traz um
snapshot de avaliação com `dataBase` do instante da requisição). O `Copy as
cURL` do DevTools captura só o **preflight OPTIONS**, que não revela o método
real. **Captura continua manual**, pelo DevTools — o que é aceitável: é uma vez
por tipo de fórmula, não por dia.

### Como capturar

1. Abrir a fórmula no editor, com o DevTools na aba **Network**, filtro Fetch/XHR
2. Achar a requisição cujo **Preview** mostra `variables: [...]` e `classes: [...]`
3. Botão direito → **Copy response**
4. Salvar em `_CONHECIMENTO/_bruto/formula-catalogo/<TIPO>.json`

Repetir **uma vez por tipo de fórmula** — cada tipo tem catálogo próprio.

---

## Por que isso importa (medido, não achismo)

Comparando o catálogo do tipo `ITBI` com os 2.035 arquivos de `Formulas/`:

**13 dos 32 métodos de `imovel` têm ZERO uso na base inteira:**
`matricula` · `latitude` · `longitude` · `cep` · `agrupamento` · `localidade` ·
`inscricaoIncra` · `denominacao` · `apartamento` · `bloco` · `complemento` ·
`nroImovel` · `inscricaoAnterior`

E o catálogo do ITBI expõe `Utilitarios.imovelEhEnglobado(imovel.codigo)` —
**0 ocorrências** em 7.428 arquivos. O que a base usa é
`UtilitariosImoveis.ehEnglobado` (124 arquivos): **namespace e nome
diferentes**. Ou são duas funções distintas, ou uma é o nome novo da outra.

### O número final: **94 métodos com zero uso**, só no tipo ITBI

Os mais gritantes, todos em `Utilitarios` e todos prontos:

```
Utilitarios.existemDebitosPorSituacao(imovel.codigo, situacao)      → Boolean
Utilitarios.existemDividasPorSituacao(imovel.codigo, situacao)      → Boolean
Utilitarios.existeParcelamentoPorSituacao(imovel.codigo, situacao)  → Boolean
Utilitarios.existemDebitosVencidos(imovel.codigo, situacao, dataBase)     → Boolean
Utilitarios.existemDividasVencidas(imovel.codigo, situacao, dataBase)     → Boolean
Utilitarios.existeParcelamentoVencido(imovel.codigo, situacao, dataBase)  → Boolean
```

São **exatamente** as três verificações que a crítica de Campos Novos monta à
mão com `Dados.tributos.v2.debitos/dividas/parcelamentos.metadados(...)`, e o
que 12 dos 33 municípios de IPTU aproximam com
`Utilitarios.existeLancamento(...)` + flags. Existem prontas, nunca foram usadas.

👉 Conclusão: **o dicionário extraído do corpus subestima o que existe.**
Quem só olha o corpus reescreve à mão coisa que o sistema já entrega.

---

## Gerar o dicionário

Capturado o JSON, é um comando:

```bash
cd "_BIBLIOTECA/Dicionario de Formulas"
python _gerar.py ITBI
```

Lê `_CONHECIMENTO/_bruto/formula-catalogo/ITBI.json`, cruza com os 2.035
arquivos de `Formulas/` e grava `ITBI - contexto da formula.md`, com cada
método ordenado por uso real. **O `.md` é gerado — não editar à mão.**

## Estado da captura — 10 de ~17 tipos

| Tipo | | Observação |
|---|:-:|---|
| `GERACAO_CREDITO_IMOVEIS` | ✅ | 264 fórmulas — IPTU |
| `GERACAO_CREDITO_ECONOMICOS` | ✅ | 302 fórmulas — ISS |
| `GERACAO_CREDITO_RECEITAS_DIVERSAS` | ✅ | 1.009 fórmulas — o maior volume |
| `CALCULO_PROJETOS_OBRAS` | ✅ | sem equivalente em `Formulas/` |
| `ITBI` | ✅ | 27 fórmulas |
| `FORMULA_ACRESCIMO_DEBITO` | ✅ | 37 |
| `FORMULA_ACRESCIMO_DIVIDA_ATIVA` | ✅ | 38 — o contexto mais rico (19 variáveis) |
| `FORMULA_ACRESCIMO_PARCELAMENTO` | ✅ | 37 |
| `DESCONTO_GUIA` | ✅ | 21 |
| `CONVENIO_BANCARIO` | ✅ | 67 |
| `GERACAO_CREDITO_PARCELAMENTOS` | ⬜ | 49 — o Felipe adiciona depois |
| `GERACAO_CREDITO_CONTRIBUICAO_MELHORIAS` | ⬜ | 5 — idem |
| `DESCONTO_PARCELAMENTO_*` | ⬜ | 117 fórmulas em 4 subtipos |
| `GERACAO_CREDITO_NOTA_FISCAL_AVULSA` | ⬜ | 28 |
| `ACRESCIMO_PARCELAMENTO` / `ACRESCIMO_PRE_FIXADA` | ⬜ | 25 — tipos distintos dos `FORMULA_ACRESCIMO_*` |
| `ITBI_VALOR_VENAL_*` | ⬜ | 7 |

## ⚠️ Leia antes de adaptar código entre tipos

`_COMPARATIVO por tipo.md` — a mesma classe `Utilitarios` tem **conteúdo
diferente** em cada tipo. Só 2 dos 21 métodos existem nos quatro tipos já
capturados. Isso já produziu **uma recomendação errada** na biblioteca
(a função de indexador), corrigida em 21/08/2026.

---

## Formato

Cada arquivo documenta um tipo, em duas partes:

1. **Variáveis de contexto** — o que o motor injeta (`imovel`, `lancamento`,
   `transfImoveisItens`…), com os métodos de cada uma
2. **Classes disponíveis** — os namespaces utilitários liberados naquele tipo

E, para cada método: nome canônico, tipo de retorno, descrição oficial, e
**quantas vezes aparece no corpus** — porque "existe" e "é usado" são
informações diferentes, e as duas ajudam.
