# Plano: Fase 2 — Grafo curado

**Goal:** um grafo que liga áreas, templates, funções prontas, tipos de fórmula, fontes BFC,
endpoints REST e conhecimento, consultado por comando. Um agente pergunta "o que existe para
exportar débitos?" e recebe 15 linhas, não 12 MB de catálogo.
**Architecture:** design em `docs/plans/2026-11-09-estrutura-agentes-grafo.md` (D1, D4).
Gerador e consulta em Node (ESM), dentro de `biblioteca/_GRAFO/`, **reaproveitando** as funções
puras do App (`desktop/electron/mapaDependencias.js` e `catalogoFontes.js`). Nada no App muda
nesta fase.
**Tech Stack:** Node ≥ 22 (ESM, `node --test`), sem dependências novas.

---

## Decisões desta fase

| # | Decisão | Por quê |
|---|---|---|
| G1 | Gerador em Node, importando `extrairRecursos`, `indexarDependentes`, `alvoDoCampo` e `nomeBfc` do App | Uma lógica só para o Mapa do App e para o grafo |
| G2 | Um arquivo gerado, `biblioteca/_GRAFO/grafo.json`, versionado no git, ordenado e **sem data de geração** (leva o hash das entradas) | Regerar sem mudança não suja o diff |
| G3 | `biblioteca/_GRAFO/curado.json` à mão: áreas e palavras-chave, arestas confirmadas, arestas inferidas a remover, notas por nó | Mesma ideia do `dependencias_confirmadas.json`: o curado sempre vence |
| G4 | Nó de fonte BFC = **um por nome no editor** (ex.: `fonte:imoveis`), com as operações dentro | É o nome que o script usa; 574 operações viram ~190 nós |
| G5 | Nó de endpoint = **um por recurso REST** (`endpoint:imoveis`), com os métodos dentro | 1.776 operações viram 358 nós |
| G6 | Detalhe de campos e filtros **não** entra no grafo: continua no `fonte.py` e no catálogo | O grafo diz *onde olhar*; o catálogo diz *o que tem lá* |
| G7 | Saída da consulta em texto curto; `--json` para máquina | Economia de tokens é o objetivo |
| G8 | Corpus (Formulas/, Scripts/, Relatorios/) fica de fora | É a Fase 4 |

## Modelo

Nós (`{ id, tipo, rotulo, arquivo?, area?, status?, validadoEm?, extra? }`):

| Tipo | Origem | Qtde aprox. |
|---|---|---|
| `area` | `curado.json` (ITBI e Transferências, Imóveis/IPTU, Dívida Ativa, Débitos e Créditos, Registro Bancário, Econômicos/ISS, Receitas Diversas, Acréscimos e Descontos) | 8 |
| `template` | `_BIBLIOTECA/Templates/*_BASE.*` + `README - *.md` (status `validado` com data, ou `sem-registro`) | 17 |
| `funcao` | `_BIBLIOTECA/Funcoes Prontas/*.txt` | 7 |
| `tipo-formula` | `_BIBLIOTECA/Dicionario de Formulas/<TIPO> - contexto da formula.md` | 10 |
| `conhecimento` | `_CONHECIMENTO/**/*.md` (status `bruto` para `_bruto/`) | 26 |
| `fonte` | `catalogo_v2.json` + `mapa_bfc_rest.json` | ~190 |
| `endpoint` | Swagger tributos (`extrairRecursos`) | 358 |

Arestas (`{ de, tipo, para, origem: 'inferida'|'curada', via? }`):

| Tipo | De → Para | Como é inferida |
|---|---|---|
| `usa-fonte` | template/função → fonte | `Dados.tributos.v2.<x>` e `Dados.procuradoria.v2.<x>` no código |
| `mapeia` | fonte → endpoint | mesmas letras do path da fonte e do recurso (regra do `fonteDoRecurso`) |
| `depende` | endpoint → endpoint | campo `id<Outro>` no POST (`indexarDependentes`) + `pais` do `dependencias_confirmadas.json` |
| `documenta` | conhecimento → qualquer | o texto cita o nome do arquivo do template, `TIPO_DE_FORMULA`, `Dados.*.v2.<x>` ou `/api/<recurso>` |
| `pertence` | qualquer → área | pasta do conhecimento; palavras-chave da área no nome/rótulo |

## Comando de consulta

```
node biblioteca/_GRAFO/grafo.mjs <comando>

  gerar                      regera grafo.json a partir das fontes
  checar                     aponta problemas (aresta órfã, curado com id inexistente, template sem README)
  resumo                     contagem por tipo de nó e de aresta
  busca <termo> [--tipo t] [--area a]     até 20 nós, sem acento e sem caixa
  no <id>                    o nó + vizinhos agrupados por tipo de aresta (1 nível)
  vizinhos <id> [--aresta t] [--profundidade 2] [--area a]
  (qualquer comando) --json  saída para máquina
```

Exemplo de saída esperada de `no template:Exporta_Debitos_Completo_por_Credito`:

```
template:Exporta_Debitos_Completo_por_Credito — Exporta Débitos Completo por Crédito
  validado em 05/10/2026 · _BIBLIOTECA/Templates/Exporta_Debitos_Completo_por_Credito_BASE.txt
  área: Débitos e Créditos
  usa-fonte → fonte:debitos, fonte:creditosTributarios
  ← documenta: conhecimento:... (se houver)
```

---

## Tasks

Arquivos: `biblioteca/_GRAFO/lib/*.mjs` (funções puras, com `*.test.mjs` ao lado),
`biblioteca/_GRAFO/grafo.mjs` (CLI, só leitura de arquivo + chamada das funções),
`biblioteca/_GRAFO/curado.json`, `biblioteca/_GRAFO/grafo.json` (gerado).
Testes: `node --test biblioteca/_GRAFO/`. Cada task segue o ciclo teste → falha → código → passa.

### Bloco A — Leitores puros (TDD)

- **A1 `lib/codigo.mjs` · `fontesUsadas(texto)`** → nomes BFC citados (`Dados.tributos.v2.imoveis.busca` → `imoveis`; procuradoria também; ignora comentário `//`). Teste com trechos reais de template.
- **A2 `lib/biblioteca.mjs` · `lerTemplate(base, readme)`** → `{ id, rotulo, arquivo, readme, validadoEm, status }`. `validadoEm` aceita "validado em produção em 05/10/2026" e "Validado em produção:** Congonhas/MG, 09/11/2026" → `2026-10-05`. Sem README → `status: 'sem-registro'`. O id sai do nome sem `_BASE`.
- **A3 `lib/biblioteca.mjs` · `lerConhecimento(rel, texto)`** → nó + referências citadas (nomes de template, `TIPO_FORMULA`, `Dados.*.v2.x`, `/api/x`). Título do 1º `#`.
- **A4 `lib/fontes.mjs` · `nosDeFonte(catalogo, mapa)`** → um nó por nome BFC (usa `nomeBfc` do App), com `operacoes: [{ operacao, path, natureza }]` e `usos` em produção. Fonte sem nome BFC confirmado fica com `confirmado: false`.
- **A5 `lib/fontes.mjs` · `arestasMapeia(nosFonte, recursos)`** → fonte → endpoint pelas letras do path.
- **A6 `lib/areas.mjs` · `areaDe(no, areas)`** → id da área pelas palavras-chave (sem acento); pasta do conhecimento vence a palavra-chave.

### Bloco B — Montagem

- **B1 `lib/montar.mjs` · `montarGrafo(entradas)`** → `{ hash, nos, arestas }` ordenados por id; aplica o curado por último (acrescenta, remove, anota). Teste com fixture mínima (2 templates, 3 fontes, 2 recursos, 1 conhecimento, curado com 1 aresta extra e 1 removida).
- **B2 `lib/checar.mjs` · `checar(grafo, curado)`** → lista de avisos. Testes: aresta para id inexistente, curado citando id inexistente, template sem README, fonte usada por template mas sem nó.
- **B3 `curado.json` inicial**: as 8 áreas com palavras-chave; nenhuma aresta curada ainda (elas vêm do uso).

### Bloco C — Consulta

- **C1 `lib/consulta.mjs` · `buscar(grafo, termo, filtros)`** → ranking: id exato > rótulo começa com > contém; sem acento.
- **C2 `lib/consulta.mjs` · `vizinhos(grafo, id, opcoes)`** → saída e entrada, por tipo de aresta, até a profundidade pedida.
- **C3 `lib/formatar.mjs`** → texto curto dos comandos `no`, `busca`, `vizinhos`, `resumo`, com limite de linhas e "+N" quando passa.
- **C4 `grafo.mjs`** → CLI: lê os arquivos, chama as funções, `--json`. Sem lógica própria.

### Bloco D — Rodar de verdade e verificar

- **D1** `gerar` sobre a biblioteca real; `resumo` confere as quantidades da tabela "Modelo" (diferença grande = investigar, não ajustar o número).
- **D2** `checar`: os avisos viram a lista de pendências da curadoria (ex.: os 8 templates sem README). Não corrigir dado na mão para zerar aviso.
- **D3** Três perguntas reais, conferidas contra os arquivos:
  1. `busca debitos` → acha o template de exportação, a fonte e o endpoint.
  2. `no area:itbi` → traz os 14 arquivos de conhecimento e o tipo de fórmula ITBI.
  3. `vizinhos endpoint:imoveis --aresta depende` → bate com o Mapa de dependências do App.
- **D4** Medir: tamanho do `grafo.json` e tamanho da saída de cada pergunta (em tokens estimados) contra o que seria abrir os arquivos.
- **D5** `node --test biblioteca/_GRAFO/` e `npm test` no `desktop/` (as funções importadas não podem ter mudado).

### Bloco E — Documentar

- **E1** `biblioteca/CLAUDE.md`: seção "Consultar o grafo" (quando usar, os comandos, regerar depois de mudar template/conhecimento/curado).
- **E2** `biblioteca/_GRAFO/LEIAME.md`: modelo de nós e arestas, como curar.
- **E3** Design: marcar a Fase 2 entregue com a medida.
- **E4** Commit (um só, como na Fase 1, só com os arquivos desta fase).

---

## Fora do escopo

- Mapa, Biblioteca ou Gerador do App lendo o grafo: fase própria, quando houver algo novo para mostrar (decidido em 2026-11-09).
- Corpus (Fase 4) e agentes executores (Fase 3).
- Detalhe de campo/filtro de fonte (continua no `fonte.py`).
