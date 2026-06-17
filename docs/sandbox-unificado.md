# Unificação: Sandbox + Envio em Lote

## Status do progresso

| Passo | Descrição | Status |
|-------|-----------|--------|
| 1 | Criar `pages/Sandbox/utils.js` | ✅ Concluído |
| 2 | Copiar `CsvPreview.jsx` e `BatchProgress.jsx` para `Sandbox/` | ✅ Concluído |
| 3 | Criar `pages/Sandbox/AbaRequisicao.jsx` | ✅ Concluído |
| 4 | Criar `pages/Sandbox/AbaEnvioLote.jsx` | ✅ Concluído |
| 5 | Criar `pages/Sandbox/index.jsx` | ✅ Concluído |
| 6 | Atualizar `App.jsx` | ✅ Concluído |
| 7 | Atualizar `Sidebar.jsx` | ✅ Concluído |
| 8 | Deletar arquivos antigos | ✅ Concluído |
| 9 | Verificação final (build + teste manual) | ✅ Build OK — aguarda teste manual |

> Legenda: ⬜ Pendente · 🔄 Em andamento · ✅ Concluído · ❌ Bloqueado

---

## Contexto

Atualmente existem dois itens no menu "Ferramentas" para funcionalidades muito parecidas — **Sandbox** (`/sandbox`) e **Envio em Lote** (`/envio-lote`). Ambas as páginas compartilham ~60% do código: o painel esquerdo inteiro (cards 1–4 de seleção de município/sistema/endpoint/método), toda a lógica de `schemaExpanded`, os cascade effects e os utilitários de highlight. A unificação elimina a duplicação, simplifica a sidebar e permite que o usuário selecione o endpoint uma vez e alterne entre modo unitário e modo lote.

## Estrutura alvo

```
pages/Sandbox/
├── index.jsx          # Container: estado compartilhado + painel esquerdo + toggle de aba
├── AbaRequisicao.jsx  # Painel direito: requisição única (extraído de ClienteAPI.jsx)
├── AbaEnvioLote.jsx   # Painel direito: envio em lote (extraído de EnvioLote/index.jsx)
├── CsvPreview.jsx     # Copiado de EnvioLote/CsvPreview.jsx (sem mudanças)
├── BatchProgress.jsx  # Copiado de EnvioLote/BatchProgress.jsx (sem mudanças)
└── utils.js           # Utilitários consolidados das duas fontes
```

## Arquivos a criar/modificar/deletar

| Ação    | Arquivo |
|---------|---------|
| Criar   | `pages/Sandbox/utils.js` |
| Criar   | `pages/Sandbox/CsvPreview.jsx` |
| Criar   | `pages/Sandbox/BatchProgress.jsx` |
| Criar   | `pages/Sandbox/AbaRequisicao.jsx` |
| Criar   | `pages/Sandbox/AbaEnvioLote.jsx` |
| Criar   | `pages/Sandbox/index.jsx` |
| Modificar | `App.jsx` |
| Modificar | `Sidebar.jsx` |
| Deletar | `pages/ClienteAPI.jsx` |
| Deletar | `pages/EnvioLote.jsx` |
| Deletar | `pages/EnvioLote/` (pasta inteira) |

---

## Passo a passo de implementação

### Passo 1 — `pages/Sandbox/utils.js`

Consolidar de `EnvioLote/utils.js` + constantes de `ClienteAPI.jsx`:

```javascript
export function nomeRecurso(ep, moduleBase = '') { ... }   // de EnvioLote/utils.js
export function extrairIds(data) { ... }                   // de EnvioLote/utils.js (plural, array + retorno[])
export function extrairId(data) { ... }                    // de ClienteAPI.jsx linhas 81-91 (singular)
export function highlightJson(obj) { ... }                 // de EnvioLote/utils.js (entrada = objeto)
export const METODOS = ['GET','POST','PUT','PATCH','DELETE']
export const METODO_COLORS = { ... }                       // de ClienteAPI.jsx linhas 27-37
export const METODO_ACTIVE = { ... }                       // de ClienteAPI.jsx linhas 38-45
export const TIPO_COR = { ... }                            // de EnvioLote/index.jsx
export function tipoCor(tipo) { ... }                      // de EnvioLote/index.jsx
```

> **Atenção:** `highlightJson` exportada recebe objeto (assinatura de `EnvioLote/utils.js`).
> `AbaRequisicao.jsx` precisará de uma versão local `highlightJsonStr(str)` que recebe string — copiar as 13 linhas de `ClienteAPI.jsx` (linhas 41–54) como função local interna.

---

### Passo 2 — Copiar `CsvPreview.jsx` e `BatchProgress.jsx`

- Copiar `EnvioLote/CsvPreview.jsx` → `Sandbox/CsvPreview.jsx` sem alterações.
- Copiar `EnvioLote/BatchProgress.jsx` → `Sandbox/BatchProgress.jsx` — apenas o import de `highlightJson` permanece `'./utils'` (mesmo caminho relativo, sem mudança de lógica). **Nota:** `BatchProgress.jsx` foi evoluído após a cópia: `consultarTodosPendentes` → `consultarLista(lista)` com `Promise.allSettled`; adicionado botão "↺ Reconsultar X erros" para IDs com status `erro`.

---

### Passo 3 — `pages/Sandbox/AbaRequisicao.jsx`

Extraído do painel direito de `ClienteAPI.jsx` (a partir da linha ~553, tudo que renderiza à direita do grid).

**Estado local (tab-específico):**
```javascript
valoresCampos, bodyRaw, modoBody, campoBusca
resposta, idConsulta, consultandoResultado, respostaConsulta
executando, historico, subAba ('resposta'|'historico'), bodyRawRef
```

**Props recebidas do pai:**
```javascript
{ municipioSel, sistemaSel, endpointSel, metodo, pathCustom,
  schema, schemaExpanded, camposSelecionados, setCamposSelecionados,
  municipios, sistemas }
```

**`useEffect([endpointSel])`:** inicializa `valoresCampos`, `bodyRaw`, `modoBody`, `campoBusca` — NÃO chama `setCamposSelecionados` (o pai cuida disso).

**`bodyPreview` useMemo:** permanece local (depende de `schemaExpanded` prop + `valoresCampos` + `camposSelecionados`).

---

### Passo 4 — `pages/Sandbox/AbaEnvioLote.jsx`

Extraído do painel direito + configuração de `EnvioLote/index.jsx`.

**Estado local (tab-específico):**
```javascript
csvData, csvArquivo, csvSemCabecalho
mapeamentoCampo, modoMapeamento, valoresFixos
tamanhoBatch (padrão 50)
executando, progresso, concluido, campoBusca
progressoRef
```

**Props recebidas do pai:** mesmas de `AbaRequisicao` exceto `setPathCustom`.

**Gotcha — Cards 5 e 6 (CSV upload + sliders):** no EnvioLote original ficavam na coluna esquerda. Na nova estrutura, essa coluna esquerda pertence ao pai (cards 1–4). Os cards 5 e 6 passam para o painel direito desta aba, empilhados acima do mapeamento de campos.

**`iniciarEnvio`:** dispara todos os lotes simultaneamente via `Promise.allSettled` (não sequencial). Cada promise atualiza `progresso` via `.finally()` conforme resolve. Sem delay entre lotes — modelo paralelo evita bloqueio do rate limiter de janela fixa da API Betha.

**`useEffect([endpointSel])`:** resetar estado CSV-específico. O pai já reseta `camposSelecionados`.

**Auto-mapping:** o `useEffect([csvArquivo, csvSemCabecalho])` ainda chama `setCamposSelecionados(autoSel)` — disparado pelo usuário (upload), o filho pode chamar diretamente.

---

### Passo 5 — `pages/Sandbox/index.jsx`

**Estado compartilhado:**
```javascript
// Arrays de dados
municipios, sistemas, modulos, endpoints
// Cadeia de seleção
municipioSel, sistemaSel, moduloSel, recursoSel, endpointSel, metodo, pathCustom
// Campos compartilhados
camposSelecionados
// Aba ativa
const [abaAtiva, setAbaAtiva] = useState('requisicao') // 'requisicao' | 'lote'
```

**Effects compartilhados** (movidos de ambas as páginas):
- mount: carregar municipios, sistemas, modulos; sincronizar `municipioAtivo`
- `[sistemaSel]`: resetar modulo/recurso/endpoint, recarregar modulos filtrados
- `[moduloSel]`: carregar endpoints do módulo
- `[endpointSel]`: inicializar `camposSelecionados`, definir `metodo` e `pathCustom`

**`camposSelecionados` init no pai:**
```javascript
useEffect(() => {
  if (!endpointSel) { setCamposSelecionados({}); return }
  // inicializar com campos obrigatórios = true, idIntegracao = true, idGerado = true
  // schemaExpanded já está computado via useMemo quando o effect roda
}, [endpointSel])
```

**useMemos compartilhados:** `recursos`, `schema`, `schemaExpanded` — calculados uma vez, passados como props.

**Toggle de abas** (no header da página):
```jsx
<div className="flex gap-1 bg-gray-800 rounded-xl p-1">
  <button onClick={() => setAbaAtiva('requisicao')} className={abaAtiva === 'requisicao' ? 'bg-sysgate-600 text-white ...' : '...'}>
    Requisição única
  </button>
  <button onClick={() => setAbaAtiva('lote')} className={abaAtiva === 'lote' ? 'bg-sysgate-600 text-white ...' : '...'}>
    Envio em Lote
  </button>
</div>
```

**Layout (mantém o grid `[360px_1fr]`):**
```jsx
<div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
  {/* Coluna esquerda: cards 1–4 (renderizados uma vez, compartilhados) */}
  <div>...</div>
  {/* Coluna direita: aba ativa (mount/unmount ao trocar) */}
  <div>
    {abaAtiva === 'requisicao'
      ? <AbaRequisicao {...sharedProps} />
      : <AbaEnvioLote {...sharedProps} />}
  </div>
</div>
```

> **Rendering condicional (mount/unmount):** ao trocar de aba, o estado local da aba anterior é limpo. Comportamento intencional — CSV uploadado e resposta da requisição não precisam persistir entre abas.

> **`metodo` padrão único:** o pai usa `'GET'` como padrão (ambas as abas herdam).

---

### Passo 6 — Atualizar `App.jsx`

```javascript
// Antes:
const Sandbox   = lazy(() => import('./pages/ClienteAPI'))
const EnvioLote = lazy(() => import('./pages/EnvioLote'))
// + rota /envio-lote

// Depois:
const Sandbox = lazy(() => import('./pages/Sandbox'))
// remover EnvioLote e sua <Route>
// opcional: <Route path="envio-lote" element={<Navigate to="/sandbox" replace />} />
```

---

### Passo 7 — Atualizar `Sidebar.jsx`

```javascript
// childRoutes do NavGroup "Ferramentas":
// Antes: ['/scripts', '/analisador-json', '/sandbox', '/envio-lote', '/historico']
// Depois: ['/scripts', '/analisador-json', '/sandbox', '/historico']

// Remover NavItem:
// <NavItem to="/envio-lote" label="Envio em Lote" icon={ICONS.envioLote} />
```

---

### Passo 8 — Deletar arquivos antigos

Após confirmar que o app funciona:
- `pages/ClienteAPI.jsx`
- `pages/EnvioLote.jsx`
- `pages/EnvioLote/index.jsx`
- `pages/EnvioLote/CsvPreview.jsx`
- `pages/EnvioLote/BatchProgress.jsx`
- `pages/EnvioLote/utils.js`

---

## Armadilhas conhecidas

| # | Ponto | Resolução |
|---|-------|-----------|
| 1 | `camposSelecionados` era inicializado em cada filho | Inicializar no pai em `useEffect([endpointSel])`, usando `schemaExpanded` (já computado via useMemo) |
| 2 | `highlightJson` tem duas assinaturas (string vs objeto) | Exportar versão objeto de `utils.js`; manter versão string como `highlightJsonStr` local em `AbaRequisicao` |
| 3 | Cards 5–6 do EnvioLote estavam na coluna esquerda | Mover para o painel direito de `AbaEnvioLote` |
| 4 | `recursos` useMemo depende de `endpoints` + `moduloSel` | Calcular no pai e passar como prop; o pai já precisa de `recursos` para o SearchSelect do painel esquerdo |
| 5 | `metodo` padrão era 'GET' no Sandbox e 'POST' no EnvioLote | Usar 'GET' no pai; usuário do lote clica no método desejado |

---

## Verificação após implementação

1. `npm run build` no `frontend/` — sem erros de import
2. Sidebar: "Envio em Lote" sumiu; "Sandbox" acende em `/sandbox`
3. **Painel esquerdo compartilhado:** selecionar município → sistema → endpoint → trocar de aba → seleções persistem
4. **Aba "Requisição única":** executar GET, executar POST com body, checar histórico, checar "Consultar resultado"
5. **Aba "Envio em Lote":** upload CSV, auto-mapping funciona, preview renderiza, batch executa, exportar CSV
6. **Troca de aba limpa estado local** (CSV e resposta resetam — comportamento esperado)
7. Sem erros de console (props undefined, hooks fora de ordem)
