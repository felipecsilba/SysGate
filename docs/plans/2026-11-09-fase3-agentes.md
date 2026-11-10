# Plano: Fase 3 — Agentes (quem pensa, quem executa, quem confere)

**Goal:** pedidos de fórmula, script, relatório e payload de API passam por um fluxo fixo. O
Opus (sessão principal) entende o pedido, consulta o grafo e decide. Um executor em Sonnet
escreve a peça a partir do template certo. Um revisor automático pega as armadilhas de BFC antes
de chegar ao Studio. Cada etapa recebe só o contexto de que precisa.
**Architecture:** design em `docs/plans/2026-11-09-estrutura-agentes-grafo.md` (D2, D3).
Agentes em `.claude/agents/`, fluxo do orquestrador como skill em `.claude/skills/`, revisor em
`biblioteca/_FERRAMENTAS/` (Node, testado, reaproveita `_GRAFO/lib`).
**Tech Stack:** definições de agente e skill em Markdown; revisor em Node ESM com `node --test`.

---

## Decisões desta fase

| # | Decisão | Por quê |
|---|---|---|
| A1 | **4 executores em Sonnet**: `bfc-formulas`, `bfc-scripts` (scripts, fontes dinâmicas, críticas, componentes), `bfc-relatorios` (`.jrxml` + fonte dinâmica), `bfc-api` (payloads e lotes) | Divisão por tipo de peça (D2) |
| A2 | **1 leitor em Haiku**: `bfc-leitor` — consulta o grafo e resume arquivos; só lê | Trabalho mecânico no modelo mais barato (D3) |
| A3 | Regras comuns **não** se repetem nos agentes: todos começam lendo `biblioteca/CLAUDE.md` (~2 mil tokens); o arquivo do agente traz só o que é do seu tipo de peça | Uma regra, um lugar; corrigir uma armadilha vale para todos |
| A4 | **Revisor automático** `revisar-bfc`: script que aponta as armadilhas conhecidas, com linha e correção. Executores rodam antes de devolver; o Opus roda de novo na revisão | Armadilha conhecida não pode custar mais uma rodada no Studio |
| A5 | O revisor é **calibrado contra o gabarito**: rodar nos 25 templates/funções validados e numa amostra do corpus em produção. Regra que acusa peça validada está errada | Mesma lição da Checagem ("calibrar regras com gabarito") |
| A6 | Fluxo do orquestrador vira a skill **`pedido-bfc`**, disparada sozinha em pedido de fórmula, script, relatório ou payload | Opus segue o mesmo roteiro toda vez, sem depender de memória |
| A7 | **Delegar só quando compensa.** Ajuste de poucas linhas o Opus faz direto; peça nova ou grande vai para o executor | Cada agente começa do zero (lê CLAUDE.md + resumo): delegar coisa pequena custa mais |
| A8 | Rascunho de executor vai para `biblioteca/_RASCUNHOS-TESTES/<Município>/` (fora do git). Só vira template depois de validado no Studio | Código de município não vai para o git; regra "só scripts validados" |
| A9 | `bfc-api` **não tem como chamar a API**: sem WebFetch, e a regra proíbe `curl`, `fetch` e a helper `tools/krakion-api.js`. Entrega o pacote para o Felipe colar no Sandbox | "API: o Felipe envia", inclusive GET |
| A10 | O especialista `itbi-transferencias` passa a consultar o grafo primeiro; continua consultivo, com o modelo da sessão | Mesmo molde; a divisão por área fica para quando a prática pedir |

## O contrato entre orquestrador e executor

**Resumo que o Opus manda** (curto, sem colar arquivo inteiro):

```
Pedido: <o que o Felipe quer, nas palavras dele>
Município: <nome> · Área: <area:x> · Tipo de peça: <fórmula TIPO | script | fonte dinâmica | relatório | payload>
Base: <ids do grafo + caminhos> (template a adaptar, função pronta, conhecimento a ler)
Fontes: <fonte:x, fonte:y> (rodar fonte.py ver antes de usar)
Decisões já tomadas com o Felipe: <estratégia aprovada, parâmetros, o que fica de fora>
Salvar em: biblioteca/_RASCUNHOS-TESTES/<Município>/<AAAA-MM-DD> <nome>.txt
```

**O que o executor devolve** (e nada mais):

```
Arquivo: <caminho do rascunho>
Partiu de: <template/função usada> · Mudou: <3–6 linhas>
revisar-bfc: <limpo | avisos que ficaram e por quê>
Conferir no Studio: <o que olhar no log/print>
Não sei / perguntar ao município: <lista curta>
```

## O revisor `revisar-bfc`

`node biblioteca/_FERRAMENTAS/revisar-bfc.mjs <arquivo> [--formula]` → uma linha por achado:
`L42 [erro] cast-as: "x as BigDecimal" — o Studio proíbe cast; use Math.round(v * 100)`.
Sai com código 1 se houver erro. Ignora comentários (`semComentarios` do grafo).

| Regra | Nível | Detecta | Origem |
|---|---|---|---|
| `cast-as` | erro | ` as Tipo` fora de string | memória bfc-script-armadilhas (2 rodadas perdidas) |
| `json-minusculo` | erro | `Json.` | idem |
| `imprimir-soma` | erro | `imprimir (a) + b` | idem |
| `zip-no-script` | erro | `Arquivo.novo(…, 'zip')` / `Resultado.arquivos(` | CONTEXTO, lição 12 |
| `metodo-sistema` | erro | `.buscar(` em `Dados.tributos` ou `.busca(` em `Dados.procuradoria` | memória |
| `se-lista` | aviso | `se (variavel)` sem comparação | lição 14 |
| `it-em-se` | aviso | `it.` dentro de bloco `se (…) { }` | memória |
| `zero-ausencia` | aviso | `id… == nulo` / `!= nulo` sem tratar `0` na mesma condição | memória (Viseu) |
| `metodo-rest` | aviso | método que não é `busca`/`buscar`/escrita conhecida (ex.: `.buscaTestadas(`) | memória |
| `fonte-desconhecida` | aviso | fonte usada que não está no grafo | grafo |
| `formula-*` (com `--formula`) | erro | `def`, `.find{`, `Dados.` | "Fórmula vs Script" |

---

## Tasks

### Bloco A — Revisor (TDD)

- **A1** `biblioteca/_FERRAMENTAS/lib/regras.mjs` + teste: uma função por regra da tabela, cada uma
  com um caso que acusa, um que não acusa e um em comentário (não acusa).
- **A2** `revisar(texto, { formula, fontesConhecidas })` → achados ordenados por linha.
- **A3** `revisar-bfc.mjs` (CLI): lê o arquivo, carrega as fontes do `grafo.json`, imprime e sai 0/1.
- **A4** Calibração (gabarito): rodar nos 18 templates + 7 funções e numa amostra de 300 scripts
  e 100 fórmulas do corpus. Todo **erro** numa peça validada é falso positivo → corrigir a regra
  (com teste novo) até zerar; avisos ficam contados e anotados no plano. Os números entram no design.

### Bloco B — Agentes

- **B1** `.claude/agents/bfc-leitor.md` (haiku; Read, Glob, Grep, Bash): pergunta → grafo → abre
  só o que o grafo apontar → resposta em até 15 linhas com caminhos. Não escreve arquivo.
- **B2** `bfc-scripts.md` (sonnet): scripts, fontes dinâmicas, críticas, componentes. Regras do tipo:
  partir do template que o grafo indicar; `fonte.py ver` antes de usar fonte; constantes de teste
  no topo; sem zip; rodar `revisar-bfc` antes de devolver.
- **B3** `bfc-formulas.md` (sonnet): por tipo de fórmula, lendo o `Dicionario de Formulas/<TIPO>` e as
  funções prontas; `revisar-bfc --formula`; o que não é portável entre municípios marcado.
- **B4** `bfc-relatorios.md` (sonnet): o roteiro que funcionou em Congonhas (estratégia antes; começo
  sem parâmetro; faixa interna; lista + resumo; versão oficial limpa); fields do `.jrxml` achatados
  com `_`; pasta atômica (jrxml + fonte + parâmetros).
- **B5** `bfc-api.md` (sonnet; sem WebFetch): payload no formato do Service Layer, ordem pelas
  arestas `depende`, `idIntegracao` rastreável, limite de itens do endpoint, ciclo do `idLote`
  (`NAO_PROCESSADO` não é erro), 429. Entrega pacote para o Sandbox; **nunca chama a API**.
- **B6** `itbi-transferencias.md`: passo 0 "consulte o grafo" (`no area:itbi`, `busca`), e o resto igual.

### Bloco C — Orquestração

- **C1** `.claude/skills/pedido-bfc/SKILL.md`: entender → estratégia antes (relatório/script novo) →
  grafo (até 3 consultas) → decidir (responder, especialista, executor ou fazer direto) → resumo
  no formato do contrato → revisar (`revisar-bfc` + ler o diff contra o template) → entregar ao
  Felipe com "conferir no Studio" → **depois de validado**: promover (template BASE + README com
  "validado em produção em DD/MM/AAAA", `grafo gerar`, lições no CONTEXTO/conhecimento).
- **C2** `biblioteca/CLAUDE.md`: seção curta "Quem faz o quê" (tabela dos agentes) apontando para a skill.

### Bloco D — Ensaio com casos reais (sem enviar nada, sem Studio)

Um pedido por executor, escolhido entre peças que **já existem validadas**, para conferir se o
executor chega ao mesmo lugar. Para cada um: achou a base certa pelo grafo? `revisar-bfc` limpo?
O que mudou faz sentido? Tokens gastos (o resultado do Agent informa).

| Executor | Pedido de ensaio | Gabarito |
|---|---|---|
| `bfc-leitor` | "O que a base sabe sobre guia BB PIX sem QR code?" | caso em `_CONHECIMENTO/Registro-Bancario/casos/` |
| `bfc-scripts` | "Exportar os campos adicionais de imóvel de um município, último valor de cada campo" | `Exporta_Campos_Adicionais_Imoveis` + lição 13 |
| `bfc-formulas` | "Acréscimo com IGPM mensal e juros por mês ou fração" | função pronta de mesmo nome |
| `bfc-relatorios` | "Relação de imóveis por uso com valor venal e total no fim" | `Relatorio_Imoveis_por_Uso` |
| `bfc-api` | "Excluir um imóvel migrado errado e o que depende dele" | `Excluir imovel por API` + `dependencias_confirmadas.json` |

Rascunhos do ensaio vão para `biblioteca/_RASCUNHOS-TESTES/_ensaio-agentes/` e são apagados ao fim.
Resultado (acertos, falhas, tokens) entra no design. Falha de agente → ajustar o arquivo do agente
e repetir só aquele caso, no máximo duas vezes; depois disso, registrar como limitação.

### Bloco E — Fechar

- **E1** `CLAUDE.md` raiz: linha dos agentes em "Onde está cada coisa".
- **E2** Design: resultado da Fase 3 (calibração do revisor + ensaio).
- **E3** Commit único, só com os arquivos desta fase.

---

## Fora do escopo

- Executar peça no Studio ou chamar a API (o Felipe faz).
- Especialistas novos por área (Registro Bancário, Imóveis): quando a prática pedir.
- Corpus no grafo (Fase 4).
