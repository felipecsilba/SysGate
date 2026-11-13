# Estrutura de contexto, agentes e grafo

Referência da reestruturação de 2026-11-09: como o Krakion organiza o contexto que o Claude
carrega, quem pensa e quem executa, e o grafo que liga a biblioteca BFC. O histórico das
decisões e os números de cada fase estão nos planos (seção "Histórico" no fim).

Visualização (privada, foto de 2026-11-09): https://claude.ai/artifact/KcdZYbfJUcZLBvcf6R6iq7
— antes × depois, fluxo de um pedido e o grafo para explorar.

---

## 1. Por que mudou

| Antes | Depois |
|---|---|
| `CLAUDE.md` da raiz com 739 linhas (~25.500 tokens), carregado em **toda** conversa e em **todo** subagente | Raiz com 50 linhas; regras de cada pasta só entram quando se trabalha nela. Conversa nova na raiz: ~26.400 → ~1.700 tokens (−93%) |
| Sistema Krakion e implantação BFC misturados no mesmo arquivo | Dois mundos, cada um com sua porta de entrada |
| Fórmulas, scripts, fontes BFC, endpoints e conhecimento sem ligação entre si | Grafo consultado por comando (100–900 tokens por resposta) |
| O Opus fazia tudo | Opus pensa e revisa; Sonnet executa; Haiku lê |
| Armadilha de BFC descoberta no Studio | Revisor automático antes da entrega |
| Exemplo de produção achado com `ls`/`grep` em 62 MB | `grafo.mjs exemplos <id>` |

## 2. Contexto: um `CLAUDE.md` por pasta

O Claude Code carrega o `CLAUDE.md` da pasta atual **e de todas acima**; um `CLAUDE.md` de
subpasta só entra quando se trabalha em arquivos dela. Por isso a raiz é curta.

| Arquivo | Conteúdo |
|---|---|
| `CLAUDE.md` | Os dois mundos, regras para tudo, onde está cada coisa, comandos |
| `backend/CLAUDE.md` | Postgres/Prisma, rotas, segurança ativa, `lib/`, testes |
| `frontend/CLAUDE.md` | Safelist do Tailwind, identidade visual, stores, chunks após deploy |
| `desktop/CLAUDE.md` | Krakion App: portas, banco embutido, armadilhas; índice em `docs/desktop.md` e um arquivo por módulo em `docs/desktop/` (dividido em 2026-11-12) |
| `biblioteca/CLAUDE.md` | Mundo BFC: regras, armadilhas, grafo, agentes, revisor, git × fora do git |
| `docs/api.md` | Todas as rotas do backend |
| `docs/<módulo>.md` | Regras e armadilhas de cada módulo (seção trazida do CLAUDE.md antigo) |

**Skills** ficam em `.claude/skills/<nome>/SKILL.md` (15 da pasta antiga `skills/` + `pedido-bfc`).
A `description` de cada uma diz quando usar; o Claude chama sozinho pelo assunto.

**Manutenção do contexto**
- O `CLAUDE.md` da raiz vai junto para qualquer pasta: só entra o que vale para tudo. Detalhe de
  módulo vai para `docs/<módulo>.md`; regra de camada, para o `CLAUDE.md` da pasta.
- `node scripts/conferir-contexto.js` mede o que é carregado numa conversa nova e confere que os
  454 itens do CLAUDE.md antigo (arquivado em `docs/plans/arquivo/CLAUDE-2026-11-09.md`) continuam
  em algum destino. `--sem-raiz` mostra o que só existe na raiz. Exceções com motivo em
  `scripts/conferir-contexto.excecoes.json`.

## 3. Quem pensa, quem executa

| Papel | Onde | Modelo | Faz | Não faz |
|---|---|---|---|---|
| Orquestrador | sessão principal + skill `pedido-bfc` | Opus | Entende, consulta o grafo, decide quem faz, revisa, entrega, promove depois de validado | Ler corpus inteiro; peça grande sozinho |
| `bfc-scripts` | `.claude/agents/` | Sonnet | Scripts, fontes dinâmicas, críticas, componentes | Estratégia; API |
| `bfc-formulas` | idem | Sonnet | Fórmulas por tipo (dicionário do tipo + funções prontas) | Sintaxe de Script em fórmula |
| `bfc-relatorios` | idem | Sonnet | `.jrxml` + fonte dinâmica + parâmetros (roteiro de Congonhas) | Código sem estratégia aprovada |
| `bfc-api` | idem | Sonnet | Payloads, ordem pelas dependências, roteiro com ⛔/⚠ | **Chamar a API** (nem GET) |
| `bfc-leitor` | idem | Haiku | Acha e resume o que a base tem | Escrever qualquer coisa |
| `itbi-transferencias` | idem | da sessão | Diagnóstico de ITBI/transferências (consulta o grafo primeiro) | — |

Regra comum dos agentes fica no `biblioteca/CLAUDE.md` (cada agente lê); o arquivo do agente traz
só o que é do seu tipo de peça (420–770 tokens). Agente novo só aparece numa conversa nova.

**Fluxo de um pedido** (`pedido-bfc`): entender (relatório/script novo: estratégia antes) →
grafo (até 3 consultas) → decidir (ajuste pequeno: o Opus faz; peça nova: executor; "o que existe":
leitor) → resumo curto para o executor → `revisar-bfc` + leitura do diff contra o template →
entregar com "conferir no Studio" → **depois de validado**: template BASE + README com a data,
lição no CONTEXTO/conhecimento, `grafo gerar`.

Rascunho de município vai para `biblioteca/_RASCUNHOS-TESTES/<Município>/` (fora do git).

## 4. Grafo da biblioteca (`biblioteca/_GRAFO/`)

```bash
node biblioteca/_GRAFO/grafo.mjs busca <termo> [--tipo t] [--area a] [--corpus]
node biblioteca/_GRAFO/grafo.mjs no <id>
node biblioteca/_GRAFO/grafo.mjs exemplos <id> [--municipio m] [--subtipo s] [--limite n]
node biblioteca/_GRAFO/grafo.mjs vizinhos <id> [--aresta t] [--profundidade n]
node biblioteca/_GRAFO/grafo.mjs gerar && node biblioteca/_GRAFO/grafo.mjs checar
```

| Arquivo | O que é | Git |
|---|---|---|
| `grafo.json` | Grafo curado gerado: 716 nós, 1.308 arestas (2026-11-09) | sim |
| `curado.json` | Áreas e palavras-chave, arestas confirmadas, remoções, notas — **sempre vence a inferência** | sim |
| `corpus.json` | Peças de produção (9.732 de 36 municípios, ~11 MB) | **não** |
| `grafo.mjs` + `lib/` | Comando e funções puras com testes | sim |

- **Nós**: área, template, função pronta, tipo de fórmula, conhecimento, fonte BFC (inclusive
  `so-producao`: vista em produção e fora do catálogo), endpoint REST; com o corpus, peça e município.
- **Arestas**: `usa-fonte`, `mapeia` (fonte → endpoint), `depende` (endpoint → endpoint, mesma regra
  do Mapa do App), `documenta`, `pertence`; com o corpus, `de-municipio`, `tipo`, `variante-de`.
- Template tem situação lida do README: `validado` (com ou sem data), `nao-validado`, `sem-registro`.
- `variante-de`: semelhança (Jaccard de trechos de 5 tokens) ≥ 0,40 com um template. Calibrado:
  variantes reais 0,77–1,00, não relacionados ≤ 0,35.
- Código idêntico em vários municípios é **família**, não duplicata (CONTEXTO, decisão 5).
- Reaproveita `extrairRecursos`, `indexarDependentes` e `nomeBfc` do App
  (`desktop/electron/mapaDependencias.js`, `catalogoFontes.js`). O App **ainda não** lê o grafo.
- Detalhes do modelo e de como curar: `biblioteca/_GRAFO/LEIAME.md`.

**Quando regerar**: depois de mudar template/README, conhecimento, `curado.json`, catálogo ou
corpus. Regerar sem mudança deixa `grafo.json` idêntico (sem data de geração).

## 5. Revisor de BFC (`biblioteca/_FERRAMENTAS/revisar-bfc.mjs`)

`node biblioteca/_FERRAMENTAS/revisar-bfc.mjs <arquivo>... [--formula] [--tipo TIPO] [--json] [--resumo]` — linha,
nível, regra e correção; sai com 1 se houver erro. Ignora comentários e conteúdo de strings.

| Nível | Regras |
|---|---|
| erro | `cast-as`, `json-minusculo`, `imprimir-soma`, `zip-no-script`, `metodo-sistema`, `busca-isempty`; com `--formula`: `formula-def` (só `def nome(`), `formula-find`, `formula-dados`; com o tipo da fórmula (`--tipo` ou pelo nome do arquivo): `formula-classe-tipo` |
| aviso | `se-lista` (variável que recebeu lista), `it-em-se`, `zero-ausencia`, `metodo-rest` (`busca<Algo>` do catálogo como método), `fonte-desconhecida`, `averbacao-dh`, `formula-metodo-tipo` |

**Calibrado contra o gabarito** (2026-11-09): 0 erros em 24 templates/funções validados, 300 scripts
e 100 fórmulas de produção. Regra nova só entra com teste e passando de novo por essa calibração —
regra que acusa peça que roda em produção está errada.

**Recalibrado no corpus inteiro** (2026-11-12, depois de `busca-isempty` e `averbacao-dh`): gabarito
(16 templates + 7 funções) com 0 erro; as duas regras novas, 0 falso positivo (`busca-isempty` não aparece
em produção; `averbacao-dh` dá 4 avisos, todos enviando o campo). A amostra de 2026-11-09 escondia
defeitos das regras antigas, que acusavam 166 erros em peças de produção. Corrigidos:
- O leitor de código (`varrerCodigo` em `_GRAFO/lib/codigo.mjs`, usado pelo revisor e pelo grafo) não
  entendia `${...}` com aspas dentro nem string sem fechar: um `join(",")` dentro de GString fazia o
  resto do arquivo trocar código por comentário. O corpus perdeu 4 `usa-fonte` falsos (código comentado).
- `formula-def` acusava `def x` declarando variável (97 de 98 casos, IPTU de produção). Agora só `def nome(`.

**Regras de tipo de fórmula** (2026-11-13): conferem `Classe.metodo(` contra o catálogo do editor
(`biblioteca/_CONHECIMENTO/_bruto/formula-catalogo/`, 21 contextos; `lib/catalogoFormulas.mjs`). Classe que o
tipo não libera é erro; método fora da classe é aviso, porque o catálogo não lista tudo (`Numeros.inteiro`
roda em produção sem estar nele: exceção em `METODOS_SEM_CATALOGO`). Nas 2.035 fórmulas de produção: 0 achado.
Variável de contexto ficou de fora (`receitaDiversa.agrupamento` roda em 245 lugares sem estar no catálogo).

Ficaram **66 erros em 5 casos**, à espera do Felipe dizer se a regra ou a peça está errada:

| Regra | Onde | Pergunta |
|---|---|---|
| `formula-find` | TLF de Criciúma 2026 (`.find { it == codigoCnae }`, 10×) | `.find{}` roda em fórmula de GERACAO_CREDITO_ECONOMICOS? |
| `metodo-sistema` | 20 relatórios/fontes de Lagoa Santa: `Dados.procuradoria.v2.resumoDivida.busca(` | Na procuradoria, `resumoDivida` usa `.busca` e não `.buscar`? |
| `zip-no-script` | Componentes SisObra (Jaraguá do Sul, Balneário Rincão): `Arquivo.novo(…'.zip', 'zip')` | Zip para enviar a sistema externo é permitido (a regra só deveria valer para o resultado)? |
| `cast-as` | Validação e-Sfinge 2026 de Florianópolis e Campos Novos (`txt as Long`) | Essas fontes rodam? A lição diz que o Studio proíbe cast |
| `formula-def` | Florianópolis, FORMULA_ACRESCIMO_PARCELAMENTO 15451 (`def ajustaParaDiaUtil(`) | Essa fórmula roda? |

## 6. Testes

| Onde | Comando | Quantos (2026-11-09) |
|---|---|---|
| Grafo + revisor | `node --test "biblioteca/_GRAFO/**/*.test.mjs" "biblioteca/_FERRAMENTAS/**/*.test.mjs"` | 58 |
| Backend | `cd backend && npm test` | 77 |
| Desktop | `cd desktop && npm test` | 316 |

## 7. Pendências

- **Curadoria de templates**: 8 sem registro de validação no README (4 Varreduras, Diagnóstico e
  Lista de campos adicionais, Lista de ids por código, Levantamento de débitos sem sistema de
  origem) e 1 que o README diz não validado (Receitas com Descrição Repetida). Ao validar no Studio,
  registrar a data no README e rodar `grafo gerar`.
- **Fontes fora do catálogo**: `dinamico/novo` (usada em template, sem catálogo nem uso em produção registrado).
- **Ensaio real**: os agentes foram ensaiados só com casos de resposta conhecida. Desde 2026-11-12, cada
  peça entregue ganha uma linha em `biblioteca/_REGISTRO/pedidos.md` (quem fez, base, revisor, rodadas no
  Studio, o que falhou). Com ~10 pedidos: um resumo (acerto de primeira por tipo de peça e por agente,
  falhas que se repetem) para decidir ajustes nos agentes com dado.
- **Bom Jesus**: dois municípios no mesmo prefixo; o grafo marca com ⚠.
- **App lendo o grafo** (Mapa, Biblioteca, Gerador): fase própria, quando houver algo novo para mostrar.

## Histórico

| Data | Commit | Entrega | Plano |
|---|---|---|---|
| 2026-11-09 | `43a5cfa` | Fase 1 — CLAUDE.md por pasta, skills registradas | `docs/plans/2026-11-09-fase1-economia-contexto.md` |
| 2026-11-09 | `6c93bd1` | Fase 2 — grafo curado | `docs/plans/2026-11-09-fase2-grafo-curado.md` |
| 2026-11-09 | `e690dd6` | Fase 3 — agentes, revisor, `pedido-bfc` | `docs/plans/2026-11-09-fase3-agentes.md` |
| 2026-11-09 | `503ec0a` | Template BB PIX V2 com `gerar-pix` (achado no ensaio) | — |
| 2026-11-09 | `da99fb0` | Fase 4 — corpus no grafo | `docs/plans/2026-11-09-fase4-corpus.md` |

Design, decisões D1–D6 e resultado medido de cada fase: `docs/plans/2026-11-09-estrutura-agentes-grafo.md`.
