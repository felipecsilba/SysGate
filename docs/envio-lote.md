# EnvioLote — Documentação da Tela

**Arquivo:** `frontend/src/pages/EnvioLote.jsx`

---

## Visão Geral

A tela **Envio em Lote** permite enviar múltiplas requisições sequenciais a partir de um arquivo CSV. Cada linha do CSV gera uma chamada à API, com suporte a mapeamento de colunas CSV para campos do body e valores fixos para campos que não variam por linha.

---

## Layout Geral

Grid de duas colunas (`grid-cols-[360px_1fr]`), mesmo padrão do ClienteAPI:

| Coluna | Largura | Conteúdo |
|--------|---------|----------|
| Esquerda | 360 px fixo | Cards de configuração (1–6) |
| Direita | `1fr` | Mapeamento de campos + botão + progresso |

---

## Coluna Esquerda — Cards de Configuração

### 1. Município
- Select customizado com `appearance-none` + seta SVG + tint sysgate quando selecionado
- Auto-inicializado com município ativo do `useMunicipioStore`

### 2. Sistema
- Mesmo padrão do Município

### 3. Endpoint
- **Módulo** e **Recurso** empilhados verticalmente com `<SearchSelect>`
- Deduplificação de recursos por nome legível via `nomeRecurso()`

### 4. Requisição
- Botões de método HTTP coloridos (GET=azul, POST=verde, PUT=amarelo, PATCH=laranja, DELETE=vermelho)
- Campo **Path** editável manualmente
- **Preview da URL** em dois níveis:
  - Linha 1: URL base truncada em cinza
  - Linha 2: path do recurso em azul sysgate (sem `break-all`)
  - Algoritmo de deduplicação evita `/api/api`

### 5. Arquivo CSV
- Área de upload com drag-and-drop estilizada
- Após upload: badge verde mostrando quantidade de linhas e colunas detectadas
- Parsing via **PapaParse** (`header: true`, `skipEmptyLines: true`)
- Ao carregar CSV: auto-detecta colunas com nomes iguais (case-insensitive) aos campos do schema e pré-mapeia automaticamente

### 6. Configuração
- Slider de **delay entre requisições** (0ms a 5000ms, step 100ms)
- Valor atual exibido em tempo real

---

## Coluna Direita

### 7. Mapeamento de Campos

**Card principal** com grid `grid-cols-2 h-96`:

#### Painel Campos (esquerda) — branco/cinza

Idêntico ao ClienteAPI:
- Checkboxes SVG customizados
- Badges de tipo coloridos (string=verde, number=azul, object=roxo, boolean=laranja, array=índigo)
- Headers de grupo para campos aninhados (`_parent`)
- Botão **Selecionar todos / Desmarcar todos** (exclui `idIntegracao` e `idGerado`)
- **Campo de busca** no header do painel: filtra campos em tempo real pelo `_displayCampo` (case-insensitive). Campos fixos (`idIntegracao`, `idGerado`) são sempre exibidos. Botão ✕ para limpar. State: `campoBusca` (string), resetado ao trocar de endpoint.
- `idIntegracao` e `idGerado` fixos/obrigatórios com visual âmbar (ver seção abaixo)
- Separador visual após os campos fixos

#### Painel Valores (direita) — fundo sysgate-50/40

Cada campo selecionado exibe uma linha com três elementos:

```
[nome do campo] [CSV | Fixo] [select de coluna OU input/select de valor]
```

**Toggle CSV / Fixo:**
- **Modo CSV** (padrão): exibe `<select>` com as colunas do arquivo CSV. A coluna selecionada é lida linha a linha durante o envio
- **Modo Fixo**: exibe `<input>` de texto (ou `<select>` se o campo tiver enum). O valor digitado é enviado em **todas** as linhas, sem variar

Isso permite combinar campos dinâmicos (do CSV) com campos estáticos (valor único para todo o lote).

**Campos com `enum`:** no modo Fixo, exibem `<select>` com as opções válidas da spec ao invés de input livre.

**Exemplo:**
- `idEconomico` → Modo **CSV** → coluna `id_economico` do arquivo
- `idAgrupamento` → Modo **Fixo** → valor `42` enviado em todas as linhas
- `situacaoEconomico` → Modo **Fixo** → dropdown com valores `ATIVADO`, `DESATIVADO`, etc.
- `idIntegracao` → Sempre presente (âmbar), pode ser CSV ou Fixo

#### Preview JSON (abaixo dos painéis)

- Exibe as primeiras 3 linhas do CSV já montadas como JSON real
- Respeita os modos CSV/Fixo de cada campo
- Só aparece quando há pelo menos um campo com valor configurado
- Itera apenas sobre `camposMapeados` (campos selecionados) — desmarcar um campo o remove imediatamente da prévia

---

## Campos Fixos/Obrigatórios: `idIntegracao` e `idGerado`

Ambos os campos são sempre obrigatórios e recebem tratamento diferenciado idêntico:

| Aspecto | Comportamento |
|---------|--------------|
| Seleção | Sempre marcado, não pode ser desmarcado |
| "Selecionar todos" | Não afeta estes campos |
| Visual painel Campos | Fundo âmbar, checkbox âmbar fixo, badge "obrigatório" |
| Visual painel Valores | Fundo âmbar, borda âmbar, label em `text-amber-800` |
| Toggle CSV/Fixo | Disponível (botões âmbar quando ativo) |
| Separador | Linha divisória antes dos demais campos |

A seleção de ambos é forçada `true` tanto no `useEffect([endpointSel])` quanto no `handleUploadCSV`.

---

## Botão Iniciar / Abortar

- Posicionado na coluna direita, entre o card de Mapeamento e o Progresso
- **Alinhado à direita**, tamanho automático (não full-width)
- Durante execução: mostra spinner + contador `enviando X/total`
- Botão **Abortar** aparece ao lado durante a execução — define `abortRef.current = true`

---

## Execução (`iniciarEnvio`)

Para cada linha do CSV:

1. **Monta o body** iterando sobre `schemaExpanded` com verificação `camposSelecionados`:
   - `modoMapeamento[campo] === 'fixo'` → usa `valoresFixos[campo]`
   - `modoMapeamento[campo] === 'csv'` → usa `linha[mapeamentoCampo[campo]]`
   - Campos desmarcados são ignorados (mesmo com valores armazenados)
   - Campos `number` ou `integer` são convertidos com `Number(valor)`
   - Campos com `_wrapAsIdObject: true` (e.g. `idGerado`) são embrulhados como `{ id: Number(valor) }` antes do envio
2. **Substitui parâmetros no path** — ex: `/economicos/{idEconomico}` → `/economicos/123`
3. **Chama `proxyApi.executar()`** com delay configurado entre chamadas
4. **Extrai `idGerado`** da resposta via `extrairId(res.data)` e armazena no item do progresso junto com `pathEnviado`
5. **Registra resultado** em `progresso`: status `ok`, `erro` ou `abortado`

---

## Progresso e Log

Após iniciar o envio:

**Card Progresso:**
- Barra de progresso (`bg-sysgate-500`)
- Contador de sucessos e erros
- Botão "Exportar relatório CSV" ao concluir (via PapaParse + Blob)

**Card Log de execução:**
- Lista cada linha processada com indicador colorido (verde=ok, vermelho=erro)
- Mostra status HTTP + duração (ms) por linha
- Auto-scroll para o fim durante a execução
- Até 3 valores de dados da linha como texto resumido

### Botão "↻ GET /{id}" por linha

Para cada linha que retornou um `idGerado` identificável, aparece no canto direito da linha de log um botão **↻ GET /{id}**:

- Ao clicar, executa um GET em `{pathEnviado}/{idGerado}` via `consultarLinhaLote()`
- Exibe o **statusCode** colorido + resumo do JSON da resposta diretamente na linha do log
- O botão é **re-clicável** para polling (ideal para APIs assíncronas)
- State: `consultasLote` — `{ [linha]: { consultando, statusCode, data } }`
- Resetado ao iniciar um novo envio

---

## Extração de ID da Resposta

Função `extrairId(data)` compartilhada com o ClienteAPI — tenta as chaves na ordem:
```js
['id', 'idGerado', 'idEconomico', 'idLote']
```
Se o valor for um objeto com `.id`, extrai `.id`. Retorna `null` se nenhum for encontrado.

---

## Estado React (principais)

| State | Tipo | Descrição |
|-------|------|-----------|
| `csvData` | `{ colunas, linhas }` | Dados do CSV parseado |
| `camposSelecionados` | `{ [campo]: boolean }` | Campos marcados no painel Campos |
| `mapeamentoCampo` | `{ [campo]: string }` | Coluna CSV mapeada por campo (modo CSV) |
| `modoMapeamento` | `{ [campo]: 'csv' \| 'fixo' }` | Modo de cada campo (padrão: `'csv'`) |
| `valoresFixos` | `{ [campo]: string }` | Valor estático por campo (modo Fixo) |
| `progresso` | array | Resultados acumulados linha a linha (`{ linha, status, msg, dados, idGerado?, pathEnviado? }`) |
| `executando` | boolean | Flag de execução ativa |
| `concluido` | boolean | Flag de conclusão do lote |
| `consultasLote` | `{ [linha]: { consultando, statusCode, data } }` | Estado das consultas GET por linha |
| `campoBusca` | string | Texto de filtro do painel Campos (resetado ao trocar endpoint) |
| `schemaExpanded` | array | Schema expandido com `_parent` para campos aninhados |
| `camposMapeados` | array | `schemaExpanded.filter(c => camposSelecionados[c.campo])` |

---

## Dependências externas

- **PapaParse** — parsing e exportação de CSV
- **proxyApi** — mesmo proxy do ClienteAPI
- **SearchSelect** — combobox com busca para Módulo e Recurso
