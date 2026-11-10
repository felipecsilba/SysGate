# Estrutura de agentes, grafo e contexto — design

> Data: 2026-11-09 · Status: **design aprovado · Fases 1 e 2 entregues em 2026-11-09** (ver "Resultado da Fase 1" e "Resultado da Fase 2").
> Próximo passo: plano da Fase 3 (agentes executores) com a skill `writing-plans`.

## Objetivo

1. Gastar menos tokens em toda conversa e em todo subagente.
2. Separar quem pensa de quem executa.
3. Ligar as estruturas que hoje não se conhecem (fórmulas, scripts, fontes dinâmicas,
   relatórios, fontes BFC, endpoints, conhecimento) num grafo que os agentes e o
   Krakion App consultam.

## Ponto de partida (medido em 2026-11-09)

| Estrutura | Tamanho |
|---|---|
| `CLAUDE.md` | 739 linhas, 102 KB (~25 mil tokens) carregados em toda conversa e em todo subagente |
| `docs/desktop.md` | 84 KB |
| `biblioteca/Formulas` | 2.035 arquivos |
| `biblioteca/Scripts` | 5.393 arquivos (Componentes, Críticas, Fontes Dinâmicas, Scripts) |
| `biblioteca/Relatorios` | 2.304 pastas (6.471 .txt + 2.255 .jrxml) |
| `biblioteca/Municipios` | 37 pastas |
| Fontes BFC | 574 (`catalogo_v2.json`, 12,6 MB) + `mapa_bfc_rest.json` |
| Endpoints REST tributos | 716 paths, 1.776 operações (Swagger) + `dependencias_confirmadas.json` |
| Conhecimento curado | 26 .md em `_CONHECIMENTO`, 17 templates, 7 funções prontas, 10 tipos no dicionário de fórmulas |

O corpus tem cerca de 10 mil arquivos brutos e umas 50 peças curadas. As ligações
entre eles estão espalhadas em JSONs e .md.

## Decisões tomadas

| # | Decisão | Alternativas descartadas |
|---|---|---|
| D1 | O grafo atende **os agentes e o Krakion App** (uma fonte de verdade) | Só agentes; só App |
| D2 | Executores **por tipo de peça**; divisão por área tributária só quando a prática pedir (mesmo grafo, com filtro `area`) | Por área desde já; matriz área × tipo |
| D3 | **Opus pensa** (orquestra, revisa), **Sonnet executa**, **Haiku** faz o mecânico. Indexação do corpus é script, sem IA | Tudo Opus; Opus + Haiku |
| D4 | Grafo em **arquivos JSON + consulta por comando**; curado no git, índice do corpus fora do git | Banco do App; notas .md com links |
| D5 | Ordem: **economia → grafo curado → agentes → corpus** | Grafo primeiro; corpus primeiro |
| D6 | **Dois mundos no mesmo repositório**, cada um com seu `CLAUDE.md` por pasta | Repositórios separados; um CLAUDE.md com duas seções |

## Os dois mundos

| | Mundo 1 — Sistema Krakion | Mundo 2 — Implantação BFC |
|---|---|---|
| O que é | Código: web, backend, portal, App desktop | Fórmulas, scripts, fontes dinâmicas, relatórios e payloads de API a partir da biblioteca |
| Pastas | `backend/`, `frontend/`, `desktop/`, `docs/` | `biblioteca/` |
| Agentes | Os que já existem (Plan, Explore, General-purpose) | Orquestrador + executores + leitor + especialistas de área |
| Grafo | O App **mostra** o grafo (Biblioteca, Mapa, Gerador) | Os agentes **consultam** o grafo |

O Claude Code carrega o `CLAUDE.md` da pasta atual e de todas as pastas acima dela.
Um `CLAUDE.md` em subpasta só é carregado quando se trabalha em arquivos daquela
subpasta. Por isso a raiz tem que ser curta: ela vai junto para qualquer lugar.

## Papéis (Mundo 2)

| Papel | Modelo | Faz | Não faz |
|---|---|---|---|
| Orquestrador (sessão principal) | Opus | Conversa, consulta o grafo, monta um resumo curto do pedido, delega, revisa | Ler o corpus inteiro; escrever peça grande sozinho |
| Executor · Fórmulas | Sonnet | Fórmulas BFC por tipo | |
| Executor · Scripts | Sonnet | Scripts, fontes dinâmicas, críticas, componentes | |
| Executor · Relatórios | Sonnet | `.jrxml` + fonte dinâmica | |
| Executor · API | Sonnet | Payloads, lotes, ordem de dependência entre endpoints | **Disparar chamada** — quem envia é o Felipe |
| Leitor | Haiku | Buscar no grafo, resumir arquivo do corpus | Decidir |
| Especialistas de área | herdam | Consultivos (ITBI já existe) | |

Fluxo de um pedido:

```
Felipe ─► Orquestrador (Opus)
            1. consulta o grafo: nós da área, template, fonte, endpoint
            2. monta um resumo curto: só esses nós + caminhos dos arquivos
          ─► Executor da peça (Sonnet) ─► rascunho
          ─► Orquestrador revisa (armadilhas BFC, regras da casa)
          ─► Felipe valida no Studio ─► peça curada no grafo, com data
```

## Grafo (Fase 2 — desenho preliminar)

- Pasta: `biblioteca/_GRAFO/`. `nos.json` e `arestas.json` gerados + `curado.json` à mão (git).
  Índice do corpus em `biblioteca/_GRAFO/corpus/` (fora do git).
- Nós: área, tipo de fórmula, template, função pronta, fonte BFC, endpoint, conhecimento,
  caso, município, peça do corpus (Fase 4).
- Arestas: `usa_fonte`, `mapeia` (fonte ↔ endpoint), `depende` (endpoint → endpoint),
  `documenta`, `pertence` (→ área), `variante_de` (corpus → template), `validado_em`.
- Matéria-prima: `catalogo_v2.json`, `mapa_bfc_rest.json`, Swagger,
  `dependencias_confirmadas.json`, `_CONHECIMENTO/`, `_BIBLIOTECA/`.
- Consulta: `grafo busca`, `grafo vizinhos <id> --area X`, `grafo resumo <id>` — saída curta em texto.
- O Mapa de dependências do App (`desktop/electron/mapaDependencias.js`) passa a ler o grafo.
- Em aberto: linguagem do gerador (tendência: Node, para App e comando usarem o mesmo código).

## Fase 1 — Economia de contexto (detalhada)

### Metas

- `CLAUDE.md` da raiz: **≤ 80 linhas**.
- Cada `CLAUDE.md` de subpasta: **≤ 150 linhas**.
- **Nenhuma informação perdida**: só mover, nunca apagar sem achar o destino. Fatos que
  já estão em `docs/<módulo>.md` saem do CLAUDE.md sem cópia.

### Para onde vai cada seção do CLAUDE.md atual

| Seção atual (linhas) | Destino |
|---|---|
| Stack (12) | Raiz, compactada |
| Skills de Desenvolvimento (18) | Somem da raiz: viram skills registradas (ver abaixo); a raiz fica com 1 linha |
| Estrutura do projeto (223) | Raiz fica só com o mapa de 1º nível. Árvore de cada pasta vai para o `CLAUDE.md` dela, só com o que não é óbvio pelo nome do arquivo |
| Comandos (22) | Raiz: os comandos de subir tudo. Cada subpasta: os seus |
| Rotas da API (225) | `docs/api.md` (novo). `backend/CLAUDE.md` aponta para ele |
| Segurança — resumo (25) | Regras ativas → `backend/CLAUDE.md`. Histórico das Fases 0–4 do portal → `docs/chamados.md` / `skills/seguranca.md` |
| Identidade Visual (18) | `frontend/CLAUDE.md` |
| Padrões importantes (82) | Banco, rotas, Swagger, proxy, testes → `backend/CLAUDE.md`. Tailwind, Zustand, localStorage, chunks → `frontend/CLAUDE.md`. Portfólio, Chamados, Notas, Conhecimento, Checagem, Municípios/tokens → `docs/<módulo>.md`. Krakion Desktop → `desktop/CLAUDE.md` |
| UI — Sandbox (57) + Envio em Lote (42) | `docs/sandbox-unificado.md` e `docs/envio-lote.md` |
| Deploy — resumo (11) | Raiz: 2 linhas + ponteiro para `skills/deploy.md` |

### Conteúdo de cada CLAUDE.md novo

- **Raiz**: o que é o repositório; os dois mundos e onde fica cada um; regras que valem
  para tudo (idioma, commits, "API Betha quem dispara é o Felipe"); onde estão docs, skills e
  plans; comandos de subir e de deploy.
- **`backend/CLAUDE.md`**: Prisma singleton, `mode: 'insensitive'`, `$queryRaw` com aspas,
  rotas nomeadas antes de `/:id`, JSON como String, segurança (JWT, multi-tenant, 404 em vez
  de 403), Swagger/proxy, testes, ponteiro para `docs/api.md`.
- **`frontend/CLAUDE.md`**: safelist do Tailwind, paleta sysgate, padrões visuais, stores e
  chaves de localStorage, chunks após deploy, portal externo (store separado).
- **`desktop/CLAUDE.md`**: o essencial de `docs/desktop.md` (portas, banco embutido, pasta de
  dados, armadilhas) com ponteiro para o resto. `docs/desktop.md` continua sendo o diário.
- **`biblioteca/CLAUDE.md`**: o mundo BFC — o que está no git e o que não está, regras
  (não renomear pastas, template novo com README, conhecimento pelo protocolo), armadilhas
  de BFC-Script, onde está cada coisa. Absorve o `LEIAME-KRAKION.md`; `CONTEXTO.md` continua
  como referência lida sob demanda.

### Skills registradas

As 15 de `skills/` passam para `.claude/skills/<nome>/SKILL.md`, com `name` e
`description` no frontmatter escritos para disparar sozinhos (ex.: `betha-api` quando o
assunto é proxy, lote ou IDs Betha). Referências a `skills/...` no repositório são atualizadas.

### Verificação da Fase 1

1. Script de conferência: cada item de "Padrões importantes", cada rota e cada arquivo da
   árvore antiga tem que aparecer em algum destino. Item sem destino = falha.
2. Tamanho antes × depois de tudo o que é carregado numa conversa nova na raiz.
3. Abrir uma sessão em `biblioteca/` e conferir que as regras de backend não vieram junto.
4. Testes do backend (`npm test`) e do desktop continuam passando. Nenhum código muda,
   mas antes de mover qualquer arquivo é preciso conferir se algum teste ou script lê
   caminho de `docs/` ou `skills/`.

### Resultado da Fase 1 (2026-11-09)

Plano executado: `docs/plans/2026-11-09-fase1-economia-contexto.md`.

| Medida | Antes | Depois |
|---|---|---|
| `CLAUDE.md` da raiz | 739 linhas, 102.096 B (~25.500 tokens) | 50 linhas, 3.369 B (~840 tokens) |
| Carregado numa conversa nova na raiz (`CLAUDE.md` + `MEMORY.md`) | ~26.400 tokens | ~1.700 tokens |
| `backend/` · `frontend/` · `desktop/` · `biblioteca/` `CLAUDE.md` | — | ~1.700 · ~1.000 · ~1.000 · ~1.400 tokens, só quando se trabalha ali |

- Conferência (`node scripts/conferir-contexto.js`): 454 itens do CLAUDE.md antigo (133 rotas,
  103 regras, 11 seções de UI, 207 arquivos da árvore), **0 sem destino**, 1 exceção registrada
  (`LEIAME-KRAKION.md`, absorvido pelo `biblioteca/CLAUDE.md`).
- Testes: backend 77/77, desktop 316/316.
- 15 skills registradas em `.claude/skills/`; `skills/` removida.
- Pendente com o Felipe: conferência manual com `/memory` numa sessão aberta em `biblioteca/`.

## Resultado da Fase 2 (2026-11-09)

Plano executado: `docs/plans/2026-11-09-fase2-grafo-curado.md`. Como usar: `biblioteca/_GRAFO/LEIAME.md`.

- `biblioteca/_GRAFO/grafo.json`: 650 nós (8 áreas, 18 templates, 7 funções, 10 tipos de fórmula,
  28 conhecimentos, 223 fontes, 356 endpoints) e 1.259 arestas (632 depende, 416 pertence,
  145 mapeia, 36 documenta, 30 usa-fonte). 302 KB, gerado em 0,3 s, idêntico ao regerar.
- Testes: 34/34 no grafo; desktop 316/316 (as funções reaproveitadas do App não mudaram).
- O App **não** lê o grafo ainda: fase própria, quando houver algo novo para mostrar.

| Pergunta | Pelo grafo | Abrindo arquivos |
|---|---|---|
| Que templates usam a fonte `debitos`? | `no fonte:debitos` ~80 tokens | templates + READMEs ~45.000 |
| O que existe sobre ITBI? | `no area:itbi` ~450 | pasta ITBI inteira ~23.600 (índice sozinho ~1.800) |
| O que depende de `imoveis` na API? | `vizinhos … --aresta depende` ~880 | Swagger ~1,5 milhão |

Pendências de curadoria apontadas pelo `checar` (não corrigidas à mão):
- 8 templates sem registro de validação (as 4 Varreduras, Diagnóstico e Lista de campos
  adicionais, Lista de ids por código, Levantamento de débitos sem sistema de origem).
- 1 template que o README diz **não validado**: Receitas com Descrição Repetida.
- 2 fontes fora do catálogo: `tabelaAuxiliar.registros` e `dinamico/novo`.
- 1 citação sem nó: `/api/core` no LEIAME do `_bruto/formula-catalogo`.

## Fases seguintes (resumo)

- **Fase 2 — Grafo curado**: gerador, `curado.json`, comando de consulta, Mapa do App lendo o grafo.
- **Fase 3 — Agentes**: 4 executores (Sonnet), leitor (Haiku), orquestrador seguindo o fluxo;
  especialista de ITBI no mesmo molde.
- **Fase 4 — Corpus**: indexar ~10 mil arquivos por área, município e tipo; duplicatas;
  `variante_de` para o template.

Cada fase ganha o seu próprio plano (`writing-plans`) só quando a anterior estiver entregue.
