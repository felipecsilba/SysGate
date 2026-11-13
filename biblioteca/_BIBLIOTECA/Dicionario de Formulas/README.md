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
**O catálogo vem de `OPTIONS` na mesma URL** (resposta 202 com o JSON; confirmado em
2026-11-13). Não é o preflight do navegador: a Betha usa `OPTIONS` para servir o catálogo.
Em 2026-08 isso foi lido como preflight, e a captura ficou manual por causa disso.

### Como capturar

Pelo `tools/betha-capture` (grava `OPTIONS` desde 2026-11-13): `1-abrir-chrome.cmd`,
depois `4-escutar-formulas.cmd`, e abrir no Betha uma fórmula de cada tipo. As respostas
ficam em `tools/betha-capture/capturas/formulas/` (fora do git).

Manual, pelo DevTools: aba **Network**, filtro Fetch/XHR, a requisição `script` com método
`OPTIONS` → **Preview** mostra `variables`, `classes` e `scaffolds` → **Copy response** →
salvar em `_CONHECIMENTO/_bruto/formula-catalogo/<TIPO>.json`.

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

## Estado da captura — 21 contextos (2026-11-13)

A lista oficial de tipos do sistema está em `_CONHECIMENTO/_bruto/formula-catalogo/_TIPOS-do-sistema.json`
(enums do recurso `scriptArrecadacao`: `TipoScript` com 12 tipos, e os subtipos `TiposFormulas`,
`TipoAcrescimo`, `TipoJuro`, `TipoCorrecao`, `TiposLancamentosDescontosParcelamentos`, `TipoCadastro`).
Em 2026-11-13 os 10 tipos de agosto foram recapturados e estão **idênticos** (mesmas variáveis,
classes e métodos).

| Tipo (arquivo) | Menu do Betha / tipo no sistema | | Corpus |
|---|---|:-:|---|
| `GERACAO_CREDITO_IMOVEIS` | Cálculo · `GERACAO_CREDITO` / Imóveis | ✅ | 264 — IPTU |
| `GERACAO_CREDITO_ECONOMICOS` | Cálculo · Econômicos | ✅ | 302 — ISS |
| `GERACAO_CREDITO_RECEITAS_DIVERSAS` | Cálculo · Receitas diversas | ✅ | 1.009 |
| `GERACAO_CREDITO_PARCELAMENTOS` | Cálculo · Parcelamentos | ✅ 11/13 | 49 |
| `CALCULO_PROJETOS_OBRAS` | Cálculo · Projetos | ✅ | — |
| `ITBI` | ITBI · Transferência de créditos | ✅ | 27 (`ITBI_TRANSFERENCIA_CREDITOS`) |
| `ITBI_VALOR_VENAL` | ITBI · Valor venal territorial / construção / benfeitorias (mesmo contexto) | ✅ 11/13 | 8 |
| `FORMULA_ACRESCIMO_DEBITO` | Acréscimos · Débito | ✅ | 37 |
| `FORMULA_ACRESCIMO_DIVIDA_ATIVA` | Acréscimos · Dívida ativa | ✅ | 38 — o contexto mais rico (19 variáveis) |
| `FORMULA_ACRESCIMO_PARCELAMENTO` | Acréscimos · Parcelamento | ✅ | 37 |
| `ACRESCIMO_PARCELAMENTO` | Acréscimos · `ACRESCIMO` juro de parcelamento **e** correção pré-fixada (mesmo contexto) | ✅ 11/13 | 25 (`ACRESCIMO_PARCELAMENTO` + `ACRESCIMO_PRE_FIXADA`; o corpus pode misturar antecipação) |
| `ACRESCIMO_PARCELAMENTO_ANTECIPACAO` | Acréscimos · antecipação de juro **e** antecipação de correção (mesmo contexto, 3 variáveis) | ✅ 11/13 | o corpus não separa |
| `DESCONTO_GUIA` | Desconto para guia unificada | ✅ | 21 |
| `DESCONTO_PARCELAMENTO` | Desconto para parcelamentos · Todos / Dívidas / Lançamentos do exercício / Parcelamentos anteriores (mesmo contexto) | ✅ 11/13 | 117 |
| `CONVENIO_BANCARIO` | Convênio bancário | ✅ | 67 |
| `CREDITO_INSCRITO_DIVIDA_ATIVA` | Dívida ativa · `DIVIDA_ATIVA` "Validar inscrição de créditos em dívida" | ✅ 11/13 | — |
| `MANUTENCAO_DIVIDA` | Manutenção de dívida ativa (anistia, cancelamento, prescrição, remissão, suspensão: mesmo contexto) | ✅ 11/13 | — |
| `IMPOSTOS_FEDERAIS` | Impostos federais | ✅ 11/13 | — |
| `REDUCAO_BASE_CALC_ISSQN` | Redução da base de cálculo do ISSQN | ✅ 11/13 | — |
| `REQUERIMENTO_MANUTENCAO_CALCULO` | Requerimento da manutenção de cálculo · `BENEFICIO_FISCAL` | ✅ 11/13 | — |
| `GERACAO_CREDITO_CONTRIBUICAO_MELHORIAS` | Cálculo · Contribuição de melhorias ("Cálculo de contribuição") | ✅ 11/13 | 5 |
| `GERACAO_CREDITO_NOTA_FISCAL_AVULSA` | Cálculo · Nota fiscal avulsa | — | 28 no corpus; **a nota fiscal avulsa foi extinta** no sistema (Felipe, 2026-11-13) |
| `VALIDACAO_CADASTRAL` | está no enum `TipoScript`; a tela "validação cadastral" abriu a lista de `DIVIDA_ATIVA` | ❓ | — |

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
