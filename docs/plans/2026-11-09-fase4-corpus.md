# Plano: Fase 4 — Corpus no grafo

**Goal:** os ~10 mil arquivos de produção (fórmulas, scripts, fontes dinâmicas, críticas,
componentes, relatórios de 36 municípios) entram no grafo como **exemplos consultáveis**. Um
executor que precisa de "como 3 municípios fizeram acréscimo de débito" recebe 3 caminhos em
vez de listar pastas; o grafo diz quantos municípios usam cada fonte e quais peças derivam de um
template.
**Architecture:** design em `docs/plans/2026-11-09-estrutura-agentes-grafo.md` (D4, G8). O mesmo
gerador (`_GRAFO/grafo.mjs gerar`) lê o corpus quando ele existe e grava um **arquivo separado**,
`_GRAFO/corpus.json`, **fora do git** (é material de prefeitura). A consulta junta os dois em
memória. Sem o corpus (outra máquina, clone novo), tudo continua funcionando só com o curado.
**Tech Stack:** Node ESM, `node --test`, sem dependências.

---

## Decisões desta fase

| # | Decisão | Por quê |
|---|---|---|
| K1 | `corpus.json` separado e no `.gitignore`; `grafo.json` não muda por causa do corpus | Corpus é de cliente; o curado continua versionado e igual em qualquer máquina |
| K2 | Nó `peca:<caminho em slug>` por arquivo (fórmula/script) ou pasta (relatório), com `subtipo`, `municipio`, `especializacao`, e o que o nome/arquivo diz (`tipoFormula`, `ano`, `cadastro`+`evento` da crítica, `chaveNatureza` do relatório) | Tudo isso já está no nome ou no `relatorio_info.txt`; não precisa IA |
| K3 | Nó `municipio:<slug>` (36); "Bom Jesus" leva nota ⚠ (dois municípios misturados no mesmo prefixo, ver README) | A ambiguidade já é conhecida; o grafo não pode escondê-la |
| K4 | Arestas: `de-municipio`, `usa-fonte`, `tipo` (fórmula → `tipo-formula`), `pertence` (área pela especialização e palavra-chave), `variante-de` (peça → template) | Liga o corpus ao que já existe |
| K5 | **Família** = hash do código normalizado (sem comentários e espaços). Código idêntico em várias cidades fica como atributo (`familia`, `qtdFamilia`), **não** como aresta nem como "duplicata" | CONTEXTO, decisão 5: igual entre cidades é multi-tenant normal; N² arestas seria peso morto |
| K6 | `variante-de` por semelhança (Jaccard de trechos de 5 tokens) entre a peça e cada template, com limiar **calibrado no gabarito**: templates que sabidamente vieram de scripts do corpus (BB PIX de Rurópolis, Relatório por Uso de Congonhas, Exporta Campos Adicionais) | Mesmo princípio do revisor: o número sai do dado, não do chute |
| K7 | `busca` padrão **não** mostra peças do corpus (seriam milhares); `--corpus` ou `--tipo peca` mostram. `no <id>` resume as peças por contagem. Comando novo: `exemplos <id> [--municipio m] [--limite 5]` | Economia de tokens continua sendo o objetivo |
| K8 | Não ler `createdBy` nem dados pessoais dos metadados; do relatório só título, descrição e `chaveNatureza` | Corpus já tem dado de cliente demais para espalhar |

## Tasks

### Bloco A — Leitores do corpus (TDD)

- **A1 `lib/corpus.mjs` · `lerNomeFormula(nome)`** → `{ municipio, tipoFormula, descricao, ano }` para
  `Andradas - GERACAO_CREDITO_IMOVEIS - IPTU - Valor Venal - 2026.txt` e
  `Andradas - FORMULA_ACRESCIMO_DEBITO - 48611 - 1900.txt`.
- **A2 `lerNomeScript(pasta, nome)`** → `{ municipio, subtipo, titulo, cadastro?, evento? }`; crítica:
  `Atibaia - IMOVEIS - {'identificador'_ 'ALTERACAO', …} - Alteração de proprietários.txt`.
- **A3 `lerInfoRelatorio(texto)`** → `{ titulo, descricao, chaveNatureza }` (ignora `createdBy` e ids).
- **A4 `normalizarCodigo(texto)` + `familia(texto)`** → hash estável a comentário, espaço e quebra de linha.
- **A5 `trechos(texto)` + `jaccard(a, b)`** → semelhança entre duas peças.
- **A6 `municipioDe(prefixo, municipios)`** → slug + nome; `Bom Jesus` marcado ambíguo.

### Bloco B — Montagem e consulta

- **B1 `montarCorpus(entradas, grafo)`** → `{ hash, nos, arestas }`: peças, municípios, famílias e as 5
  arestas. Fonte resolvida contra os nós de fonte do grafo (mesma regra do `montarGrafo`).
- **B2 `variantes(pecas, templates, limiar)`** → arestas `variante-de` com a semelhança em `via`.
- **B3 `consulta.mjs`**: carregar grafo + corpus juntos; `buscar` ignora peças sem `--corpus`;
  `exemplos(id)` → peças ligadas ao nó (por `usa-fonte`, `tipo`, `variante-de`, `de-municipio`),
  uma por família, de municípios diferentes primeiro.
- **B4 `formatar.mjs`**: peça (`municipio · subtipo · tipo/ano · arquivo · mesmo código em N municípios`),
  e grupos de peças em `no` só com contagem e os 5 primeiros.
- **B5 `grafo.mjs`**: `gerar` lê o corpus se existir e grava `corpus.json`; comando `exemplos`;
  `--corpus`/`--sem-corpus`. `.gitignore` ganha `biblioteca/_GRAFO/corpus.json`.

### Bloco C — Calibrar e verificar

- **C1** Limiar do `variante-de`: medir a semelhança dos scripts que deram origem aos templates
  (gabarito) contra a de pares sabidamente diferentes; escolher o limiar que separa os dois e
  registrar os números.
- **C2** Contagens contra o disco: 2.035 fórmulas, 5.393 scripts, 2.304 relatórios, 36 municípios.
- **C3** Perguntas reais, conferidas nos arquivos:
  1. `exemplos tipo-formula:FORMULA_ACRESCIMO_DEBITO` → peças de municípios diferentes (37 no disco).
  2. `no fonte:tabelaAuxiliar.registros` → quantas peças usam (o mapa diz 889 usos em produção).
  3. `exemplos template:Guia_Registrada_BB_PIX_V2_Referente_Imovel` → as variantes nos municípios.
- **C4** Tempo de `gerar`, tamanho do `corpus.json`, e `grafo.json` idêntico com e sem corpus.
- **C5** Testes: `_GRAFO`, `_FERRAMENTAS` e `desktop` (as funções do App seguem iguais).

### Bloco D — Usar e documentar

- **D1** Agentes: `bfc-formulas` e `bfc-scripts` trocam o `ls`/`grep` no corpus por
  `grafo.mjs exemplos …`; `bfc-relatorios` usa `exemplos` por `chaveNatureza`.
- **D2** `biblioteca/CLAUDE.md` e `_GRAFO/LEIAME.md`: o corpus no grafo, `exemplos`, `--corpus`.
- **D3** Design: resultado da Fase 4. Commit único (sem `corpus.json`).

## Fora do escopo

- Separar os dois "Bom Jesus" (exige identificar a UF de cada arquivo).
- Metadados de `Municipios/*/metadados` (situação ativa/inativa das peças): só se a prática pedir.
- O App mostrar o corpus.
