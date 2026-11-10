# Grafo da biblioteca

Liga as peças curadas da biblioteca para que um agente (ou você) descubra **onde olhar** sem
abrir pastas inteiras. Design e decisões: `docs/plans/2026-11-09-fase2-grafo-curado.md`.

## Arquivos

| Arquivo | O que é | Editar à mão? |
|---|---|---|
| `grafo.json` | O grafo gerado: um nó ou aresta por linha, ordenado, com o hash das entradas | **não** — rode `gerar` |
| `curado.json` | Áreas (palavras-chave e pastas), arestas confirmadas, arestas a remover, notas por nó | **sim** |
| `grafo.mjs` | Comando: `gerar`, `checar`, `resumo`, `busca`, `no`, `vizinhos` (`--json` em todos) | — |
| `lib/` | Funções puras com teste ao lado. Reaproveita `desktop/electron/mapaDependencias.js` e `catalogoFontes.js` | — |

Testes: `node --test "biblioteca/_GRAFO/**/*.test.mjs"` (na raiz do repositório).

## Nós

| Tipo | Id | De onde vem |
|---|---|---|
| `area` | `area:itbi` | `curado.json` |
| `template` | `template:Exporta_Debitos_Completo_por_Credito` (nome sem `_BASE`) | `_BIBLIOTECA/Templates/`; validação lida do README (`validado` com ou sem data, `nao-validado`, `sem-registro`) |
| `funcao` | `funcao:busca-de-indexador-numa-data` | `_BIBLIOTECA/Funcoes Prontas/` |
| `tipo-formula` | `tipo-formula:ITBI` | `_BIBLIOTECA/Dicionario de Formulas/` |
| `conhecimento` | `conhecimento:itbi-transferencias/casos/...` | `_CONHECIMENTO/**/*.md` (`_bruto/` fica com status `bruto`) |
| `fonte` | `fonte:imoveis.camposAdicionais` (nome usado no script) | `FontesDeDados/catalogo_v2.json` + `mapa_bfc_rest.json`; fonte usada em código e ausente do catálogo vira `fora-do-catalogo` |
| `endpoint` | `endpoint:imoveis` (recurso de `/api/...`) | `FontesDeDados/swagger/tributos-openapi.json` |

## Arestas

| Tipo | Sentido | Inferida por |
|---|---|---|
| `usa-fonte` | template/função → fonte | `Dados.<sistema>.v2.<cadeia>` no código, fora de comentário |
| `mapeia` | fonte → endpoint | 1º trecho do path da fonte com as mesmas letras do recurso REST |
| `depende` | endpoint → endpoint | campo `id<Outro>` no POST + `pais` de `FontesDeDados/dependencias_confirmadas.json` (mesma regra do Mapa do App) |
| `documenta` | conhecimento → peça | o texto cita o arquivo do template, um `TIPO_DE_FORMULA` (ou subtipo `ITBI_*`), `Dados.*.v2.x` ou `/api/x` |
| `pertence` | peça → área | pasta do conhecimento; senão palavra-chave casando com o começo de uma palavra do id/rótulo |

Toda aresta tem `origem`: `inferida` ou `curada`. A curada sempre vence.

## Corpus de produção (`corpus.json`, fora do git)

Quando `Formulas/`, `Scripts/` e `Relatorios/` existem na máquina, o `gerar` também grava
`corpus.json` (~11 MB, ~20 s). A consulta junta os dois em memória; `--sem-corpus` ignora. Sem o
corpus, tudo funciona só com o curado e `exemplos` avisa.

| Nó | Id | O que traz |
|---|---|---|
| `peca` | `peca:formulas/debitos-gerais/andradas-formula_acrescimo_debito-48611-1900` (colisão de nome: `~2`) | `subtipo` (formula, script, fonte-dinamica, critica, componente, relatorio), `municipio`, `arquivo`, e do nome/info: `tipoFormula`, `ano`, `especializacao`, `cadastro`/`evento` (crítica), `chaveNatureza` (relatório); `familia` (hash do código sem comentários) e quantas peças/municípios têm o mesmo código |
| `municipio` | `municipio:jaragua-do-sul` | "Bom Jesus" com ⚠: dois municípios misturados no mesmo prefixo |
| `tipo-formula` | (status `sem-dicionario`) | tipos do corpus que o Dicionário de Fórmulas ainda não cobre |

Arestas: `de-municipio`, `tipo` (subtipo `ITBI_*` → `tipo-formula:ITBI`), `usa-fonte`, `pertence`,
`variante-de` (Jaccard de trechos de 5 tokens ≥ **0,40** com um template; calibrado em 2026-11-09:
variantes reais 0,77–1,00, não relacionados ≤ 0,35, nenhum par entre 0,35 e 0,50).

Código idêntico em várias cidades **não** é duplicata (CONTEXTO, decisão 5): é a mesma família.

## Como curar

1. Confirmou na prática (Studio, tela, chamado) uma ligação que o grafo não tem? Acrescente em
   `curado.json` → `arestas`, com `nota` dizendo de onde veio e a data.
2. Achou uma aresta inferida errada? `remover`.
3. Algo que quem consulta precisa saber sobre um nó? `notas` (comece com ⚠ para alerta).
4. Área nova ou palavra-chave nova? `areas`.
5. Rode `node biblioteca/_GRAFO/grafo.mjs gerar` e depois `checar`. `checar` só aponta pendências
   (template sem registro de validação, fonte fora do catálogo, citação sem nó, curado com id que
   não existe); **não corrija dado para zerar aviso** — resolva a causa ou deixe registrado.

Regerar sem mudança nas entradas deixa o `grafo.json` idêntico (sem data de geração), então o
diff no git mostra só o que mudou de verdade.
