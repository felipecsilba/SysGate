# Plano: Chamados — Minha Fila, Painel e Fila Personalizável

**Goal:** Reformular o módulo Chamados para ter 3 abas principais (Minha Fila, Painel, Dashboard), corrigir o filtro de "Meus" para usar responsavelId, melhorar o card da lista e adicionar a Fila personalizável por usuário salva no servidor.

**Architecture:** Mudança de schema (campo `filaFiltro` em `Usuario`) + novos parâmetros no GET de chamados + refatoração do `index.jsx` com sub-abas + novo `ModalFilaConfig.jsx` + novo `AbaPainel.jsx`.

**Tech Stack:** Node.js + Express + Prisma + SQLite + React + Vite + Tailwind

---

## Visão Geral da Estrutura Final

```
[ Minha Fila ]  [ Painel ]  [ Dashboard ]

Dentro de "Minha Fila":
  ┌ Meus ──┐  ┌ Fila ──┐  ┌ Sem dono ●N ─┐
```

| Sub-aba | Filtro backend |
|---------|---------------|
| Meus | `responsavelId=<me>&excluirEncerrados=true` |
| Fila | `verticais=V1,V2&sistemas=S1,S2&status=...` (salvo em `usuario.filaFiltro`) |
| Sem dono | `semResponsavel=true&excluirEncerrados=true` |

---

## Tasks

---

### Task 1 — Schema: adicionar `filaFiltro` ao modelo `Usuario`

**Arquivo:** `backend/prisma/schema.prisma`

**Steps:**
1. Localizar o modelo `Usuario` (linha ~133)
2. Adicionar o campo após `bloqueadoAte`:
```prisma
filaFiltro  String?   // JSON: { verticais[], sistemas[], status[] }
```
3. Rodar no diretório backend:
```bash
npx prisma db push
```
4. Confirmar que não houve erro e o campo aparece no `dev.db`

---

### Task 2 — Backend: novos parâmetros no `GET /api/chamados`

**Arquivo:** `backend/src/routes/chamados.js`

**Parâmetros novos a adicionar** (após a linha `const { busca, status, ... } = req.query`):

| Param | Tipo | Comportamento |
|-------|------|---------------|
| `semResponsavel` | `'true'` | `where.responsavelId = null` |
| `excluirEncerrados` | `'true'` | `where.status = { notIn: ['Concluido', 'Cancelado'] }` |
| `verticais` | `'V1,V2'` | `where.vertical = { in: ['V1','V2'] }` |
| `sistemas` | `'S1,S2'` | `where.sistema = { in: ['S1','S2'] }` |
| `prioridade` | string | `where.prioridade = prioridade` |
| `municipio` | string | `where.municipio = { contains: municipio }` |

**Fix adicional:** adicionar `municipio` ao `OR` da busca textual existente:
```js
where.OR = [
  { titulo: { contains: busca } },
  { descricao: { contains: busca } },
  { municipio: { contains: busca } },  // ← adicionar
]
```

**Código a inserir** logo após o bloco de desestruturação existente:
```js
const { busca, status, classificacao, responsavelId, vertical, pagina, limite,
        semResponsavel, excluirEncerrados, verticais, sistemas, prioridade, municipio } = req.query

// ... código existente de where ...

if (semResponsavel === 'true') where.responsavelId = null
if (excluirEncerrados === 'true') where.status = { notIn: ['Concluido', 'Cancelado'] }
if (verticais) where.vertical = { in: verticais.split(',') }
if (sistemas)  where.sistema  = { in: sistemas.split(',') }
if (prioridade) where.prioridade = prioridade
if (municipio) where.municipio = { contains: municipio }
```

> **Atenção:** `excluirEncerrados` sobrescreve `where.status` se `status` também for passado. Garantir que `excluirEncerrados` seja aplicado APENAS se `status` não estiver presente, ou usar lógica AND separada.

**Lógica correta:**
```js
if (status) {
  where.status = status
} else if (excluirEncerrados === 'true') {
  where.status = { notIn: ['Concluido', 'Cancelado'] }
}
```

**Commit:** `feat(chamados): adiciona filtros semResponsavel, excluirEncerrados, verticais, sistemas, prioridade`

---

### Task 3 — Backend: aceitar `filaFiltro` no `PUT /api/usuarios/:id`

**Arquivo:** `backend/src/routes/usuarios.js`

**Linha ~74:** O handler `PUT /:id` extrai `{ nome, role, ativo }` do body.

**Mudança:**
```js
// Antes:
const { nome, role, ativo } = req.body

// Depois:
const { nome, role, ativo, filaFiltro } = req.body
```

No bloco do não-admin (linha ~80), adicionar `filaFiltro` ao update:
```js
data: {
  ...(nome !== undefined && { nome }),
  ...(filaFiltro !== undefined && { filaFiltro }),  // ← adicionar
},
```

No bloco do admin (linha ~99), também adicionar:
```js
data: {
  ...(nome       !== undefined && { nome }),
  ...(role       !== undefined && { role }),
  ...(ativo      !== undefined && { ativo }),
  ...(filaFiltro !== undefined && { filaFiltro }),  // ← adicionar
},
```

`CAMPOS_PUBLICOS` (linha 10) não precisa incluir `filaFiltro` — esse campo não é retornado no GET de usuários, apenas no `/auth/me`.

> **Verificar:** `GET /api/auth/me` retorna o objeto completo do usuário. Confirmar que `filaFiltro` será retornado ali para o frontend ler na inicialização.

Se `/auth/me` usa `CAMPOS_PUBLICOS`, adicionar `filaFiltro: true` a esse objeto.

**Commit:** `feat(usuarios): aceita filaFiltro no PUT /:id`

---

### Task 4 — Frontend: atualizar `chamadosApi.listar()` em `lib/api.js`

**Arquivo:** `frontend/src/lib/api.js`

Verificar como `chamadosApi.listar()` está implementado. Se passa os params como objeto para axios (`.get('/chamados', { params })`), os novos campos (`semResponsavel`, `excluirEncerrados`, `verticais`, `sistemas`, `prioridade`, `municipio`) já funcionarão automaticamente — basta passar no objeto de chamada.

Se houver serialização manual, adicionar os novos campos.

**Commit:** `feat(api): suporte a novos params em chamadosApi.listar`

---

### Task 5 — Frontend: criar `ModalFilaConfig.jsx`

**Arquivo:** `frontend/src/pages/Chamados/ModalFilaConfig.jsx`

**Props:**
```js
{ aberto, onFechar, configAtual, catalogo, onSalvar }
// configAtual = { verticais: [], sistemas: [], status: [] }
// catalogo = array de CatalogoVertical com { nome, sistemas[] }
// onSalvar(config) → chama PUT /api/usuarios/:id com filaFiltro = JSON.stringify(config)
```

**Layout do modal:**
```
┌─ Configurar minha Fila ───────────────────┐
│                                           │
│  Verticais  (multi-select chips)          │
│  [Arrecadação ✓] [Contábil] [Pessoal]    │
│                                           │
│  Sistemas   (chips filtrados pelas        │
│              verticais selecionadas)      │
│  [IPTU ✓] [ISS] [Folha de Pagamento]     │
│                                           │
│  Status a incluir  (padrão: todos ativos) │
│  [✓ Nao Analisado] [✓ Em Analise] ...    │
│                                           │
│  [Cancelar]    [Salvar]                   │
└───────────────────────────────────────────┘
```

**Lógica de chips de sistemas:**
- Quando nenhuma vertical selecionada → mostra todos os sistemas de todas as verticais
- Quando verticals selecionadas → mostra apenas sistemas das verticais selecionadas
- Se um sistema estava selecionado e a vertical é desmarcada → remover o sistema dos selecionados

**Padrão visual:** chips `sysgate-100/sysgate-700` quando ativo, `border border-gray-200` quando inativo. Seguir padrão de `ModalGerenciarSistemas.jsx`.

**Commit:** `feat(chamados): adiciona ModalFilaConfig para configurar fila personalizada`

---

### Task 6 — Frontend: criar `AbaPainel.jsx`

**Arquivo:** `frontend/src/pages/Chamados/AbaPainel.jsx`

**Props:**
```js
{ usuarios, catalogo, onSelecionarChamado, chamadoSelId }
```

**Estado interno:**
```js
const [chamados, setChamados] = useState([])
const [total, setTotal] = useState(0)
const [pagina, setPagina] = useState(1)
const [filtros, setFiltros] = useState({
  busca: '', status: '', vertical: '', sistema: '',
  responsavelId: '', classificacao: '', prioridade: '',
  municipio: '', dataInicio: '', dataFim: ''
})
```

**Layout:**
```
┌─ Barra de filtros ───────────────────────────────────────────────────────┐
│ [Busca...] [Status▾] [Vertical▾] [Sistema▾] [Responsável▾] [Mais▾] [✕] │
└─────────────────────────────────────────────────────────────────────────┘
┌─ Tabela ────────────────────────────────────────────────────────────────┐
│ Nº           Título          Status        Responsável  Município  Data │
│ RURO-00003   Config fiscal   Em Andamento  Felipe       Rurópolis  hoje │
│ BELE-00001   Bug relatório   Aguardando    —            Belém      3d   │
└─────────────────────────────────────────────────────────────────────────┘
┌─ Paginação ──────────────────────────────────────────────────────────────┐
│  < 1 2 3 4 >                               Mostrando 20 de 87          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Colunas da tabela:**
| Coluna | Campo | Observação |
|--------|-------|------------|
| Nº | `ticketNum(c, chamados)` | função importada de index.jsx |
| Título | `c.titulo` | truncado com `line-clamp-1` |
| Status | `Badge` com `STATUS_CORES` | |
| Prioridade | `Badge` com `PRIORIDADE_CORES` | |
| Responsável | `c.responsavel?.nome` | "—" se null |
| Município | `c.municipio` | |
| Data | `tempoRelativo(c.criadoEm)` | |

- Clicar em linha → chama `onSelecionarChamado(c.id)` — abre painel de detalhe na direita (mesmo do index.jsx)
- O painel de detalhe é reutilizado do `index.jsx` via props; ou `AbaPainel` recebe `detalhe` e renderiza ele internamente

> **Atenção de arquitetura:** o painel de detalhe é grande e está inline no `index.jsx`. A abordagem mais simples é: `AbaPainel` só controla a lista/tabela + filtros, e ao clicar num chamado, chama o handler do pai (`onSelecionarChamado`) que atualiza o `chamadoSelId` e `detalhe` no `index.jsx`. O pai então exibe o painel de detalhe ao lado de `AbaPainel`.

**Filtro "Mais▾":** dropdown com campos menos usados: Classificação, Prioridade, Município, Período (data início / data fim).

> **Nota:** o backend ainda não suporta filtro por data. Para o período, filtrar client-side inicialmente (carregar a página e filtrar por `criadoEm`). Ou adicionar `dataInicio`/`dataFim` ao backend — avaliar se necessário nesta iteração.

**Commit:** `feat(chamados): adiciona aba Painel com tabela filtrada`

---

### Task 7 — Frontend: refatorar `Chamados/index.jsx`

**Arquivo:** `frontend/src/pages/Chamados/index.jsx`

Esta é a task mais extensa. Mudanças:

#### 7.1 — Renomear aba "Gestão" → "Minha Fila"
```js
// Antes:
{ key: 'lista', label: 'Gestão', ... }

// Depois:
{ key: 'lista', label: 'Minha Fila', ... }
```

#### 7.2 — Adicionar sub-abas dentro de "Minha Fila"
Novo state:
```js
const [subAba, setSubAba] = useState('meus') // 'meus' | 'fila' | 'semdono'
const [contSemDono, setContSemDono] = useState(0)
const [filaConfig, setFilaConfig] = useState(null) // null = não configurado
const [modalFilaConfig, setModalFilaConfig] = useState(false)
```

Carregar `filaConfig` do usuário logado:
```js
// No useEffect inicial, após carregar usuario:
if (usuario?.filaFiltro) {
  try { setFilaConfig(JSON.parse(usuario.filaFiltro)) } catch {}
}
```

Sub-tab pills dentro do painel esquerdo (substituem os pills atuais Todos/Meus/Aguardando):
```jsx
<div className="flex gap-0.5 px-2 pt-2.5 pb-2 border-b border-gray-200">
  {/* Meus */}
  <button onClick={() => setSubAba('meus')} ...>
    <svg ...person icon.../> Meus
  </button>
  {/* Fila */}
  <button onClick={() => setSubAba('fila')} ...>
    <svg ...queue icon.../> Fila
  </button>
  {/* Sem dono — com badge */}
  <button onClick={() => setSubAba('semdono')} ...>
    <svg ...warning icon./>
    Sem dono
    {contSemDono > 0 && (
      <span className="ml-1 bg-orange-500 text-white text-[10px] rounded-full px-1.5">
        {contSemDono}
      </span>
    )}
  </button>
</div>
```

#### 7.3 — Função `carregar` refatorada por sub-aba
```js
const carregar = async () => {
  setCarregando(true)
  try {
    const params = { limite: 100 }

    if (busca) params.busca = busca

    if (subAba === 'meus') {
      params.responsavelId = usuario.id
      params.excluirEncerrados = 'true'
    } else if (subAba === 'semdono') {
      params.semResponsavel = 'true'
      params.excluirEncerrados = 'true'
    } else if (subAba === 'fila' && filaConfig) {
      if (filaConfig.verticais?.length)  params.verticais = filaConfig.verticais.join(',')
      if (filaConfig.sistemas?.length)   params.sistemas  = filaConfig.sistemas.join(',')
      if (filaConfig.status?.length) {
        // Se apenas 1 status selecionado, usar params.status = value
        // Se múltiplos, usar verticais approach — enviar como comma-sep e adaptar backend
        // Simplificação: se todos ativos, usar excluirEncerrados; caso contrário enviar status[0]
        if (filaConfig.status.length === 1) params.status = filaConfig.status[0]
        else params.excluirEncerrados = 'true'
      } else {
        params.excluirEncerrados = 'true'
      }
    }

    const { data: result } = await chamadosApi.listar(params)
    setChamados(result)

    // Atualizar contagem sem dono (sempre, independente da sub-aba)
    const { data: sdResult } = await chamadosApi.listar({
      semResponsavel: 'true', excluirEncerrados: 'true', limite: 1
    })
    setContSemDono(sdResult.total ?? 0)

  } catch (e) { console.error(e) }
  finally { setCarregando(false) }
}

useEffect(() => { carregar() }, [subAba, busca, filaConfig])
```

> **Nota:** `chamadosApi.listar()` retorna `{ data, total, pagina, limite, totalPaginas }`. Para `contSemDono` usar `total` da resposta com `limite: 1`.

#### 7.4 — Empty state da sub-aba Fila
```jsx
{subAba === 'fila' && !filaConfig && (
  <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
    <svg ...filter icon 48px cinza.../>
    <p className="text-sm font-medium text-gray-700">Fila não configurada</p>
    <p className="text-xs text-gray-400">
      Configure os filtros de vertical e sistema para montar sua fila de trabalho.
    </p>
    <button onClick={() => setModalFilaConfig(true)}
      className="btn bg-sysgate-600 text-white hover:bg-sysgate-700 text-sm px-4 py-2">
      Configurar minha fila
    </button>
  </div>
)}
```

Botão de editar fila (quando já configurada) — no header da sub-lista:
```jsx
{subAba === 'fila' && filaConfig && (
  <button onClick={() => setModalFilaConfig(true)} title="Editar filtro da fila"
    className="ml-auto p-1 text-gray-400 hover:text-sysgate-600">
    <svg ...settings icon.../>
  </button>
)}
```

#### 7.5 — Corrigir card: responsável em vez de criador
```jsx
// Antes:
<Avatar nome={c.criadoPor?.nome} size={5} />
<span className="text-xs text-gray-500 truncate flex-1">{c.criadoPor?.nome}</span>

// Depois:
{c.responsavel ? (
  <>
    <Avatar nome={c.responsavel.nome} size={5} />
    <span className="text-xs text-gray-500 truncate flex-1">{c.responsavel.nome}</span>
  </>
) : (
  <>
    <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
      <svg className="w-3 h-3 text-orange-500" ...dash/exclamation icon.../>
    </span>
    <span className="text-xs text-orange-500 truncate flex-1">sem responsável</span>
  </>
)}
```

#### 7.6 — Adicionar aba "Painel" (nova aba principal)

Nas abas principais do header:
```js
{ key: 'lista',     label: 'Minha Fila', icon: ...person... },
{ key: 'painel',    label: 'Painel',     icon: ...table...  },
{ key: 'dashboard', label: 'Dashboard',  icon: ...grid...   },
```

No render:
```jsx
{aba === 'painel' && (
  <AbaPainel
    usuarios={usuarios}
    catalogo={catalogo}
    chamadoSelId={chamadoSelId}
    onSelecionarChamado={selecionarChamado}
  />
)}
```

O painel de detalhe (coluna direita) deve aparecer também quando `aba === 'painel'`.

#### 7.7 — Montar ModalFilaConfig no return

```jsx
{modalFilaConfig && (
  <ModalFilaConfig
    aberto={modalFilaConfig}
    onFechar={() => setModalFilaConfig(false)}
    configAtual={filaConfig}
    catalogo={catalogo}
    onSalvar={async (config) => {
      const filaFiltroStr = JSON.stringify(config)
      await api.put(`/usuarios/${usuario.id}`, { filaFiltro: filaFiltroStr })
      setFilaConfig(config)
      setModalFilaConfig(false)
    }}
  />
)}
```

**Commit:** `feat(chamados): refatora index com sub-abas Minha Fila, adiciona aba Painel`

---

### Task 8 — Backend: incluir `filaFiltro` no retorno de `/auth/me`

**Arquivo:** `backend/src/routes/auth.js`

Verificar o handler `GET /me`. Se ele usa `CAMPOS_PUBLICOS` ou select explícito, adicionar `filaFiltro: true` ao select para que o frontend receba o valor ao carregar.

**Commit:** `feat(auth): retorna filaFiltro no GET /me`

---

## Ordem de execução recomendada

```
Task 1 → Task 2 → Task 3 → Task 8   (backend primeiro, um commit cada)
Task 4                               (api.js — verificação rápida)
Task 5                               (ModalFilaConfig — componente isolado)
Task 6                               (AbaPainel — componente isolado)
Task 7                               (index.jsx — integração final)
```

---

## Checklist de verificação final

- [ ] `GET /api/chamados?semResponsavel=true&excluirEncerrados=true` retorna apenas chamados sem responsável não encerrados
- [ ] `GET /api/chamados?responsavelId=<id>&excluirEncerrados=true` retorna apenas chamados do usuário ativos
- [ ] `GET /api/chamados?verticais=Arrecadação,Contábil` retorna chamados dessas verticais
- [ ] `PUT /api/usuarios/:id` com `{ filaFiltro: "{...}" }` salva no banco
- [ ] `GET /api/auth/me` retorna `filaFiltro` no payload
- [ ] Sub-aba "Meus" mostra apenas chamados com `responsavelId = usuario.id`, sem encerrados
- [ ] Sub-aba "Sem dono" mostra badge com contagem + lista correta
- [ ] Sub-aba "Fila" mostra empty state quando não configurada
- [ ] Sub-aba "Fila" mostra chamados filtrados quando configurada
- [ ] Card mostra responsável (ou "sem responsável" em laranja)
- [ ] Aba "Painel" mostra tabela com todos os chamados + filtros funcionando
- [ ] Aba "Dashboard" sem alteração

---

## Arquivos impactados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `backend/prisma/schema.prisma` | Novo campo `filaFiltro` em `Usuario` |
| `backend/src/routes/chamados.js` | Novos parâmetros no GET / |
| `backend/src/routes/usuarios.js` | Aceitar `filaFiltro` no PUT /:id |
| `backend/src/routes/auth.js` | Retornar `filaFiltro` no GET /me |
| `frontend/src/lib/api.js` | Verificar suporte a novos params |
| `frontend/src/pages/Chamados/index.jsx` | Refatoração principal |
| `frontend/src/pages/Chamados/ModalFilaConfig.jsx` | Novo componente |
| `frontend/src/pages/Chamados/AbaPainel.jsx` | Novo componente |
