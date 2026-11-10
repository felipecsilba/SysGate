# Biblioteca BFC — o mundo da implantação

Base de fórmulas, scripts, fontes dinâmicas e relatórios Jasper do sistema tributário da
**Betha**, extraída de ~34 municípios reais. Serve para adaptar o padrão conhecido às regras
de cada município: não existe fórmula universal.

Era `Desktop/Scripts Formulas e Relatorios` e veio para dentro do Krakion em 2026-10-19, com
a estrutura intacta, para proteger o conhecimento com o git e levar o Krakion App a outras
máquinas. Todos os caminhos citados aqui são relativos a `biblioteca/`.

**Antes de criar ou corrigir fórmula/script, ler `CONTEXTO.md`** (vocabulário, decisões que
não se re-litigam, lições aprendidas, fatos já verificados na tela). `README.md` descreve a
estrutura das pastas e a convenção de nomes.

## Regras de trabalho

- **O Felipe conhece o sistema melhor do que qualquer inferência tirada dos arquivos.** Checar contra os dados antes de afirmar.
- **Fórmula e Script são linguagens diferentes.** Fórmula não aceita `def funcao(){}`, `.find{}` nem `Dados.tributos.*`. Ver `_BIBLIOTECA/Formula vs Script - o que cada uma aceita.md`.
- **Só entra no App/biblioteca o que rodou no Studio.** Script validado ganha data no registro curado.
- **Chamada à API Betha (inclusive GET) quem dispara é o Felipe.** Aqui se organizam payloads.
- Template ou script BFC novo vai para `_BIBLIOTECA/Templates/` com um `README - <nome>.md`. Não vai para `docs/` do Krakion.
- Conhecimento novo de uma área entra pelo `_CONHECIMENTO/_PROTOCOLO-DE-INGESTAO.md`.
- Não renomeie `Formulas/`, `Scripts/`, `Relatorios/`, `Municipios/` nem `FontesDeDados/`. O App e os scripts Python dependem desses nomes.
- `Relatorios/` são pastas atômicas (jrxml + fonte dinâmica + parâmetros + info). Nunca separar.
- Texto de regra ou de laudo explica o motivo sem citar o município de origem do caso.

## Antes de entregar um script BFC

Armadilhas que já custaram rodada (lista completa na memória `bfc-script-armadilhas` e nas
"Lições aprendidas" do `CONTEXTO.md`):

- `JSON.escrever(...)` em maiúsculas; `Json` não existe.
- Zero é ausência em id de base migrada: `v == nulo || v == 0`.
- Enum vem como objeto `{ valor, descricao }`: comparar `.valor`.
- `se (lista)` é verdadeiro com lista vazia; `it` é nulo dentro de `se`. Usar `if`.
- Procurar ` as ` no código: cast é proibido no Studio.
- Filtro de campo String vai entre aspas, mesmo sendo número.
- Tributos usa `.busca(...)`; procuradoria usa `.buscar(...)`.
- Não zipar no script: o Studio já entrega zip. Um `Resultado.arquivo(...)` por arquivo.
- `imprimir (a) + b` não soma: montar a linha numa variável antes.

## Consultar o grafo antes de abrir arquivo

O grafo (`_GRAFO/grafo.json`) liga áreas, templates, funções prontas, tipos de fórmula,
conhecimento, fontes BFC e endpoints REST. **Para saber o que existe e onde, pergunte ao grafo
primeiro** e abra só os arquivos que ele apontar. Uma consulta custa ~100 a 900 tokens; abrir a
pasta de ITBI inteira custa ~23 mil, e o catálogo de fontes, milhões.

```bash
node _GRAFO/grafo.mjs busca <termo> [--tipo template|fonte|endpoint|conhecimento…] [--area itbi] [--corpus]
node _GRAFO/grafo.mjs no <id>                   # ficha: arquivo, validação, notas e vizinhos
node _GRAFO/grafo.mjs exemplos <id> [--municipio m]   # peças de PRODUÇÃO ligadas ao nó (fonte, tipo de fórmula, template, município)
node _GRAFO/grafo.mjs vizinhos <id> [--aresta depende] [--profundidade 2]
node _GRAFO/grafo.mjs gerar && node _GRAFO/grafo.mjs checar   # depois de mudar template, conhecimento, curado.json ou o corpus
```

O corpus (9.732 peças de 36 municípios) entra no grafo pelo `_GRAFO/corpus.json`, **fora do git**
e só nesta máquina: em `exemplos`, uma peça por código distinto, municípios diferentes primeiro, e
`variante-de` liga a peça ao template de que ela deriva. Para exemplo de produção, use `exemplos`;
**não varra** `Formulas/`, `Scripts/` ou `Relatorios/`.

- Template com `[sem registro]` ou `[NÃO validado no Studio]` não é base confiável: avise antes de usar.
- Fonte `[fora do catálogo]`: conferir o nome no editor da Betha.
- O grafo diz **onde** olhar. Campos, filtros e parâmetros de uma fonte continuam no `fonte.py`.
- Confirmou uma ligação na prática? Registre em `_GRAFO/curado.json` (com data na nota) e rode `gerar`. Como funciona: `_GRAFO/LEIAME.md`.

## Consultar fontes de dados

```bash
cd FontesDeDados
python fonte.py ver <fonte>        # 4 dimensões + esqueleto de código
python fonte.py campo <termo>      # onde o campo existe (filtro? param? retorno?)
python fonte.py rel <fonte>        # relacionamentos, nos dois sentidos
python fonte.py buscar <termo> [leitura|criacao|alteracao|exclusao]
python fonte.py obrigatorios       # fontes que exigem parâmetro
python _validar.py                 # regressão do mapeamento
```

Aceita o nome do catálogo ou o nome do editor da Betha. O catálogo (`catalogo_v2.json`,
574 fontes) cobre só o tributos.

## Onde fica cada coisa

| Pasta | Conteúdo | No git? |
|---|---|---|
| `CONTEXTO.md`, `README.md`, este arquivo | Handoff da base | sim |
| `_GRAFO/` | Grafo da biblioteca: `grafo.json` (gerado), `curado.json` (à mão), `grafo.mjs` (consulta) e `lib/` (testes: `node --test "_GRAFO/**/*.test.mjs"`) | sim |
| `_BIBLIOTECA/` | Templates BASE (17), funções prontas (7), dicionário de fórmulas (10 tipos), dicionário de funções BFC-Script, Fórmula vs Script. `Exporta_Debitos_Completo_por_Credito_BASE` gera o `.jsonl` da Checagem Por Fonte | sim |
| `_CONHECIMENTO/` | O que os agentes leem, por área (ITBI-Transferencias, Imoveis, Registro-Bancario, `_COMUM`, `_FUNDAMENTOS`) + `_bruto/` ainda não digerido | sim |
| `FontesDeDados/` (scripts, `.md`, `catalogo_v2.json`, `mapa_bfc_rest.json`, `nomes_bfc.json`) | `fonte.py` e o Gerador do App precisam deles | sim |
| `FontesDeDados/swagger/tributos-openapi.json` (5,6 MB, público) | Lido pelo Mapa de dependências do App | sim |
| `FontesDeDados/dependencias_confirmadas.json` | Camada curada do Mapa: o que a prática confirmou | sim |
| `FontesDeDados/raw/`, `_obsoleto/`, `fontes_catalog_completo.json` | Brutos grandes e regeneráveis (pipeline no `CONTEXTO.md`) | não |
| `Formulas/` (2.035), `Scripts/` (5.393: Componentes, Criticas, Fontes Dinamicas, Scripts), `Relatorios/` (2.304 pastas), `Municipios/` (37), `_RASCUNHOS-TESTES/`, PDFs e `.jrxml` soltos na raiz | Corpus de prefeituras, ~450 MB. O repositório vai para o GitHub e a VPS faz `git pull` | **não** |

**O corpus fora do git não tem proteção contra exclusão.** Precisa de backup próprio: um zip
da pasta fora desta máquina (Drive ou HD externo). Para levar a outra máquina, clone o
repositório e copie o corpus por esse mesmo zip. O corpus tem dados de contribuintes: nunca
publicar nem mandar para serviço externo.

## Quem lê esta pasta

- **Krakion App** (`desktop/electron/biblioteca.js`): por padrão `biblioteca/` na raiz do
  repositório (Configurações → pasta da Biblioteca troca). Biblioteca, Municípios (escreve em
  `Municipios/<cidade>/Legislacao/`), Gerador de Extensões e Mapa (`FontesDeDados/`).
- **Agentes** (`.claude/agents/` na raiz do Krakion): leem `_CONHECIMENTO/`, `_BIBLIOTECA/` e
  rodam `FontesDeDados/fonte.py`. Hoje: `itbi-transferencias`.

## Quem faz o quê

Roteiro de todo pedido de peça: skill `pedido-bfc`. O Opus (sessão principal) entende, consulta o
grafo, decide e revisa; os agentes em `.claude/agents/` executam com contexto mínimo.

| Agente | Modelo | Faz |
|---|---|---|
| `bfc-leitor` | Haiku | Acha e resume o que a base tem (só lê) |
| `bfc-scripts` | Sonnet | Scripts, fontes dinâmicas, críticas, componentes |
| `bfc-formulas` | Sonnet | Fórmulas por tipo |
| `bfc-relatorios` | Sonnet | `.jrxml` + fonte dinâmica + parâmetros |
| `bfc-api` | Sonnet | Payloads e roteiro de envio — **nunca envia** |
| `itbi-transferencias` | da sessão | Diagnóstico e consulta de ITBI/transferências |

Revisor de armadilhas (rodar antes de entregar qualquer BFC):
`node _FERRAMENTAS/revisar-bfc.mjs <arquivo> [--formula]`. Calibrado: 0 erros em 424 peças
validadas ou em produção. Rascunho de município vai para `_RASCUNHOS-TESTES/<Município>/`.

## Referência

Visão completa da estrutura (contexto, agentes, grafo, revisor, testes, pendências):
`../docs/estrutura-agentes-e-grafo.md`.
