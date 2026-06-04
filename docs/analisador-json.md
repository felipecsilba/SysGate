# Analisador JSON — Documentação da Tela

**Arquivo:** `frontend/src/pages/AnalisadorJson/index.jsx`

---

## Visão Geral

O módulo **Analisador JSON** é uma ferramenta de inspeção, formatação, visualização e comparação de JSONs — 100% client-side, sem backend. Permite colar um JSON e visualizá-lo em 5 formatos diferentes, além de um modo comparador para diff estrutural entre dois JSONs. Inspirado no JSON Crack e JSON Formatter.

---

## Layout Geral

- Tema escuro global (`bg-slate-900`) — independente do tema do restante da aplicação
- Split horizontal: painel esquerdo **34%** (entrada) + painel direito **66%** (visualizador)
- O painel de entrada tem barra de números de linhas sincronizada com o scroll do textarea

---

## Modos

Toggle pill no canto superior direito do header:

| Modo | Layout |
|------|--------|
| **Analisador** (padrão) | Um editor + visualizador de 5 abas |
| **Comparador** | Dois editores (50%/50%) + painel de diff abaixo |

---

## Painel de Entrada (Analisador)

- Textarea monoespaçada dark com barra de números de linhas
- Decoração macOS dots no header:

| Dot | Atalho |
|-----|--------|
| Vermelho | Limpar |
| Amarelo | Minificar |
| Verde | Formatar |

### Barra de status

Exibe: linha e coluna do cursor + "Válido / Inválido" com badge colorido.

---

## Toolbar (Analisador)

| Ação | Comportamento |
|------|---------------|
| Exemplo | Carrega JSON de exemplo com objetos e arrays aninhados |
| Formatar | `JSON.stringify(parsed, null, 2)` |
| Minificar | `JSON.stringify(parsed)` |
| Copiar | `navigator.clipboard.writeText()`; feedback visual 2s |
| Baixar | Cria `Blob` e dispara download como `dados.json` |
| Abrir arquivo | `<input type="file" accept=".json,.txt">` → `FileReader` |
| Limpar | Reseta o editor para `''` |

---

## Abas do Visualizador

### Aba Formatado

JSON com syntax highlight. Toggle dark/light no cabeçalho do painel (persiste em `localStorage` com a chave `krakion-json-viewerDark`).

**Paleta dark:** chaves azul-300 · strings verde-400 · números amarelo-300 · booleans roxo-400 · null cinza-500

**Paleta light:** chaves azul-700 · strings verde-700 · números âmbar-600 · booleans roxo-600 · null cinza-400

### Aba Árvore

Árvore colapsável recursiva (`JsonNode`):

- Nós expandidos por padrão até profundidade 2
- Chevron ▶/▼ para colapsar/expandir
- Clicar em uma chave copia o **JSON path** no formato `$.usuario.endereco.cidade` / `$.items[0].id`
- Toast inline "Path copiado!" por 2s
- Linha vertical cinza entre pai e filhos

### Aba Grafo

Visualização tipo JSON Crack — cards conectados por arestas SVG:

- **Sem bibliotecas externas** (sem react-flow, d3)
- Cada nó é um card com: header (chave/índice) + linhas de propriedades (máx. 8 rows — demais truncados com "…+N")
- Objetos e arrays aninhados viram nós filhos conectados por arestas bézier
- Layout Reingold-Tilford simplificado: filhos posicionados de cima para baixo, pai centralizado sobre eles
- **Pan/zoom:** arrastar com mouse + scroll para zoom (0.2× a 3×)
- **Auto-fit no mount:** calcula zoom e offset para encaixar o grafo na viewport
- Background: grid de pontos com `radial-gradient` CSS

### Aba Tabela

Tabela responsiva para arrays de objetos:

- Cabeçalho dinâmico com todas as chaves únicas de todos os objetos do array
- **Ordenação por coluna:** clicar no `<th>` alterna asc/desc; coluna ativa destacada em índigo
- Células por tipo: objetos/arrays → código compacto; booleans → coloridos
- **Exportar CSV:** botão no footer; BOM `\ufeff` para compatibilidade Excel; exporta na ordem de ordenação atual
- Footer: `N registros · M colunas [· sortCol ▲/▼] [· N não-objeto(s) ignorado(s)]`
- Só ativa quando `parsed` é um array de objetos no root

### Aba Stats

Grid de cards coloridos com métricas do JSON:

| Métrica | Descrição |
|---------|-----------|
| Tamanho | Bytes do JSON formatado |
| Profundidade máxima | Nível de aninhamento mais fundo |
| Strings | Contagem de valores string |
| Números | Contagem de valores numéricos |
| Booleans | Contagem de true/false |
| Nulls | Contagem de null |
| Arrays | Contagem de arrays |
| Objetos | Contagem de objetos |

---

## Busca no Visualizador

Barra de busca entre as abas e o conteúdo (visível somente quando há JSON válido):

- Campo controlado `busca` — busca síncrona (sem debounce)
- Quando ativo, substitui o conteúdo da aba por `BuscaResultados`
- Badge com contador de resultados + botão ✕ para limpar
- Busca em chaves **e** valores recursivamente (JSONPath completo em cada resultado)
- Limite de 500 resultados (short-circuit após atingir)
- `null` é tratado como a string `'null'` para fins de correspondência
- Busca não aparece no modo Comparador

---

## Modo Comparador

Dois editores lado a lado com painel de diff abaixo:

### Toolbar no modo Comparador

- Controles de JSON A + controles de JSON B separados
- Botão **A ⇄ B** — troca os conteúdos dos dois editores

### Painel DiffViewer

| Estado | Exibição |
|--------|----------|
| Sem entrada | Placeholder instrucional |
| Um lado faltando | "Aguardando JSON B..." |
| JSONs idênticos | "0 diferenças — JSONs idênticos" |
| Com diferenças | Lista de diffs com path + tipo + valores |

**Tipos de diff:**

| Tipo | Badge | Visual |
|------|-------|--------|
| `added` | Verde `+` | Valor novo em verde |
| `removed` | Vermelho `−` | Valor removido em vermelho |
| `changed` | Amarelo `≠` | Valor antigo (vermelho) → valor novo (verde) |

- Barra de resumo: total + badges por tipo
- Limite de exibição: 500 diffs — aviso se exceder
- Paths no formato JSONPath: `$.items[0].nome`

---

## Persistência

| Chave localStorage | Valor | Descrição |
|-------------------|-------|-----------|
| `krakion-json-viewerDark` | `'true'` \| `'false'` | Preferência de tema do visualizador |

---

## Estrutura de arquivos

```
frontend/src/pages/AnalisadorJson/
├── index.jsx          — componente principal, estado, layout, toolbar
├── JsonGrafo.jsx      — visualização grafo com pan/zoom e arestas SVG bézier
├── JsonTabela.jsx     — tabela com ordenação por coluna e exportar CSV
├── JsonNode.jsx       — árvore colapsável recursiva com cópia de JSON path
├── DiffViewer.jsx     — painel de diff estrutural (modo Comparador)
├── BuscaResultados.jsx — lista de resultados da busca
├── constants.js       — EXEMPLO_JSON, ABAS
└── utils.js           — DARK palette, highlightJson, analyzeJson, diffJson, buscaJson
```

---

## Estado React (principais)

| State | Tipo | Descrição |
|-------|------|-----------|
| `input` | string | Texto bruto do JSON A |
| `parsed` | any \| null | Resultado do `JSON.parse` do JSON A |
| `erro` | string \| null | Mensagem de erro do parse do JSON A |
| `aba` | string | `'formatado'` \| `'arvore'` \| `'grafo'` \| `'tabela'` \| `'stats'` |
| `viewerDark` | boolean | Tema do painel de visualização |
| `modo` | string | `'analisar'` \| `'comparar'` |
| `busca` | string | Termo de busca no visualizador |
| `cursor` | `{linha, coluna}` | Posição do cursor no textarea |
| `pathCopiado` | string | Caminho copiado (exibe toast por 2s) |
| `inputB` | string | Texto bruto do JSON B (modo comparador) |
| `parsedB` | any \| null | Resultado do `JSON.parse` do JSON B |
| `erroB` | string \| null | Erro do parse do JSON B |
