# ClienteAPI — Documentação da Tela

**Arquivo:** `frontend/src/pages/ClienteAPI.jsx`

---

## Visão Geral

A tela **Cliente API** é o client HTTP interno do SysGate. Permite montar, configurar e executar requisições contra as APIs Betha diretamente pela interface, sem precisar de ferramentas externas como Postman.

---

## Layout Geral

A tela usa um **grid de duas colunas fixas** (`grid-cols-[360px_1fr]`) com altura plena da viewport:

| Coluna | Largura | Conteúdo |
|--------|---------|----------|
| Esquerda | 360 px fixo | Cards de configuração (Município, Sistema, Endpoint, Requisição) |
| Direita | `1fr` | Body (se aplicável) + Resposta / Histórico |

---

## Coluna Esquerda — Cards de Configuração

### 1. Município
- `<SearchSelect>` estilizado com seta SVG customizada e tint sysgate quando há valor selecionado
- Inicializa automaticamente com o município ativo do `useMunicipioStore` (localStorage key: `sysgate-municipio`)

### 2. Sistema
- Mesmo estilo do Município

### 3. Endpoint
- **Módulo** e **Recurso** empilhados verticalmente (stacked, não side-by-side)
- Recurso é deduplificado por nome legível via `nomeRecurso()` — agrupa paths como `/recurso` e `/recurso/{id}` sob o mesmo nome

### 4. Requisição
- Botões de método HTTP com cores por método:
  - GET → azul, POST → verde, PUT → amarelo, PATCH → laranja, DELETE → vermelho
- Campo **Path** editável manualmente
- **Preview da URL** em dois níveis:
  - Linha 1: URL base do sistema, cinza, truncada com reticências (`truncate`)
  - Linha 2: path do recurso em azul sysgate, sem quebra mid-word
  - Algoritmo de deduplicação: remove segmentos que já existem no final da URL base (evita `/api/api`)

---

## Coluna Direita

### 5. Body (apenas POST, PUT, PATCH)

Dois modos alternáveis via toggle no cabeçalho do card:

#### Modo Schema
Grid `grid-cols-2 h-96` com duas colunas de altura fixa:

**Painel Campos (esquerda) — branco/cinza**
- Lista todos os campos do `bodySchema` do endpoint
- Checkboxes customizados com SVG
- Badges de tipo coloridos:
  - `string` → verde esmeralda
  - `number` → azul
  - `object` → roxo
  - `boolean` → laranja
  - `array<...>` → índigo
- Campos de objetos aninhados são expandidos um nível com indentação (`pl-5`) e header de grupo
- Botão **Selecionar todos / Desmarcar todos** no cabeçalho (exclui `idIntegracao` e `idGerado`)
- **Campo de busca** no header do painel: filtra os campos em tempo real pelo `_displayCampo` (case-insensitive). Campos fixos (`idIntegracao`, `idGerado`) são sempre exibidos independente da busca. Botão ✕ para limpar o filtro. State: `campoBusca` (string), resetado ao trocar de endpoint.
- **`idIntegracao`** e **`idGerado`** são campos fixos/obrigatórios (ver seção abaixo)

**Painel Valores (direita) — fundo sysgate-50/40**
- Exibe inputs apenas para os campos marcados no painel esquerdo
- Campos com enum recebem `<select>` com as opções válidas ao invés de `<input type="text">`
- Campos com `_parent` são agrupados como sub-chaves do objeto pai
- **`idIntegracao`** e **`idGerado`** têm estilo âmbar especial (ver seção abaixo)

**Preview JSON** (abaixo dos dois painéis)
- Pré-visualização do body que será enviado em tempo real
- Renderizado como `<pre>` com fundo escuro (`bg-gray-900 text-green-300`)
- Sem limite de altura

**Botão Executar** — posicionado entre os painéis e o preview JSON, alinhado à direita

#### Modo JSON raw
- `<textarea>` com auto-resize (sem limite de altura, cresce com o conteúdo)
- Classe `code-area` (fonte mono, fundo escuro)
- Auto-resize usa `requestAnimationFrame` + dependência em `modoBody` para funcionar ao trocar de modo
- Botão Executar logo abaixo do textarea, alinhado à direita

---

## Campos Fixos/Obrigatórios: `idIntegracao` e `idGerado`

Ambos os campos são sempre obrigatórios e recebem tratamento diferenciado idêntico:

| Aspecto | Comportamento |
|---------|--------------|
| Seleção | Sempre marcado, não pode ser desmarcado |
| "Selecionar todos" | Não afeta estes campos |
| Visual no painel Campos | Fundo âmbar (`bg-amber-50`), checkbox âmbar fixo, badge "obrigatório" |
| Visual no painel Valores | Fundo âmbar (`bg-amber-50`), borda âmbar, label em `text-amber-800` |
| Separador | Linha divisória (`h-px bg-gray-200`) entre os campos fixos e os demais |

**Valores padrão:**
- `idIntegracao`: `"INTEGRACAO1"` (editável pelo usuário)
- `idGerado`: `"1"` — extraído do exemplo do Swagger. Quando o exemplo vem como objeto `{id: N}`, o sistema extrai apenas o valor numérico para exibição no input (`subVal.id ?? subVal.idGerado ?? 1`)

**Identificação de `idGerado`:** o campo pode estar tanto no nível raiz (`campo === 'idGerado'`) quanto aninhado (e.g. `guias.idGerado`). A detecção usa `_displayCampo === 'idGerado'` para cobrir ambos os casos.

**Serialização no envio:** campos `idGerado` que vêm como `{id: N}` na spec recebem `_wrapAsIdObject: true` e `tipo: 'number'` em `schemaExpanded`. Na hora de montar o body, são reembalados como `{ id: Number(val) }` para corresponder ao formato esperado pela API.

---

## Execução da Requisição

Botão "Executar requisição" → chama `proxyApi.executar()` com:
```js
{
  municipioId,
  sistemaId,
  endpointId,   // pode ser null se path manual
  path,
  metodo,
  body,         // undefined para GET/DELETE
  tipo: 'individual',
}
```

O body é montado a partir de `schemaExpanded` + `camposSelecionados` + `valoresCampos`:
- Campos `number` **ou** `integer` são convertidos com `Number(val)`
- Campos com `_wrapAsIdObject: true` (i.e. `idGerado` extraído de `{id: N}`) são embrulhados como `{ id: Number(val) }` antes do envio
- Campos com `_parent` são agrupados sob a chave pai

---

## Resposta e Consulta de Resultado

Card com abas:
- **Resposta** — exibe o resultado da última requisição via `<JsonViewer>`
- **Histórico** — carregado via `requisicoesApi.listar()` ao acessar a aba ou após cada execução

### Botão "Consultar resultado"

Após uma execução bem-sucedida de POST/PUT/PATCH, se a resposta contiver um ID identificável, aparece uma seção abaixo do JSON de resposta com:

- O **ID gerado** destacado em `<code>` (`bg-gray-100`)
- Botão **↻ Consultar resultado** — executa um GET em `{path}/{idGerado}` e exibe a resposta imediatamente abaixo (com statusCode + JSON)
- O botão é **re-clicável** para polling (ideal para APIs assíncronas que demoram a processar)

**Extração do ID** — função `extrairId(data)` tenta as chaves na ordem:
```js
['id', 'idGerado', 'idEconomico', 'idLote']
```
Se o valor for um objeto com `.id`, extrai `.id`. Retorna `null` se nenhum for encontrado.

---

## Estado React (principais)

| State | Tipo | Descrição |
|-------|------|-----------|
| `camposSelecionados` | `{ [campo]: boolean }` | Campos marcados no painel Campos |
| `valoresCampos` | `{ [campo]: string }` | Valores digitados no painel Valores |
| `schemaExpanded` | array | Schema expandido (objetos aninhados → campos flat com `_parent`) |
| `schemaSelecionado` | array | `schemaExpanded` filtrado pelos marcados |
| `bodyPreview` | string | JSON.stringify do body montado (memo) |
| `modoBody` | `'schema' \| 'raw'` | Modo ativo do body builder |
| `campoBusca` | string | Texto de filtro do painel Campos (resetado ao trocar endpoint) |
| `idConsulta` | `string \| null` | ID extraído da última resposta (para consulta GET) |
| `consultandoResultado` | boolean | Flag de GET de consulta em andamento |
| `respostaConsulta` | object \| null | Resposta do GET de consulta |

---

## Fontes e Estilo

- Fonte principal: **Plus Jakarta Sans** (Google Fonts)
- Fonte mono: **JetBrains Mono** (Google Fonts)
- Paleta: `sysgate` (azul, tons 50–900) — ver `tailwind.config.js`
- Safelist Tailwind obrigatório: `{ pattern: /sysgate/ }` — nunca remover
