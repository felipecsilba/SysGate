# Especificacao: Modulo Chamados (Tickets/Tarefas)

> Documento de referencia para implementacao. Segue todos os padroes do SysGate.

---

## 1. Resumo

Modulo para organizar tarefas e chamados da equipe de implantacao. Visibilidade global (todos autenticados veem tudo). Permite cadastrar chamados com descricao, anexos, status, classificacao, atribuir responsavel, adicionar comentarios e filtrar por diversos criterios. Layout semelhante ao Portfolio (duas colunas, accordion/expansao ao clicar).

---

## 2. Modelos de Dados

Adicionar ao final de `backend/prisma/schema.prisma`:

```prisma
// ── Modulo Chamados ─────────────────────────────────────────────────────────

model Chamado {
  id              Int                @id @default(autoincrement())
  titulo          String
  descricao       String?
  status          String             @default("Nao Analisado")
  classificacao   String?
  prioridade      String             @default("Normal")
  vertical        String?
  sistema         String?
  criadoPorId     Int
  criadoPor       Usuario            @relation("chamadosCriados", fields: [criadoPorId], references: [id])
  responsavelId   Int?
  responsavel     Usuario?           @relation("chamadosResponsavel", fields: [responsavelId], references: [id])
  comentarios     ChamadoComentario[]
  anexos          ChamadoAnexo[]
  criadoEm        DateTime           @default(now())
  atualizadoEm    DateTime           @updatedAt
}

model ChamadoComentario {
  id          Int      @id @default(autoincrement())
  conteudo    String
  chamadoId   Int
  chamado     Chamado  @relation(fields: [chamadoId], references: [id], onDelete: Cascade)
  autorId     Int
  autor       Usuario  @relation("comentariosChamado", fields: [autorId], references: [id])
  criadoEm    DateTime @default(now())
}

model ChamadoAnexo {
  id          Int      @id @default(autoincrement())
  nomeArquivo String
  tipo        String?
  conteudo    String
  tamanho     Int?
  chamadoId   Int
  chamado     Chamado  @relation(fields: [chamadoId], references: [id], onDelete: Cascade)
  criadoEm    DateTime @default(now())
}
```

Adicionar ao modelo `Usuario` existente (dentro do bloco, antes do `}`):

```prisma
  chamadosCriados      Chamado[]           @relation("chamadosCriados")
  chamadosResponsavel  Chamado[]           @relation("chamadosResponsavel")
  comentariosChamado   ChamadoComentario[] @relation("comentariosChamado")
```

### Campos explicados

**status** — valores possiveis:
- `"Nao Analisado"` (default)
- `"Em Analise"`
- `"Em Atendimento"`
- `"Aguardando Retorno"`
- `"Concluido"`

**classificacao** — valores possiveis:
- `"Pendencia de Migracao"`
- `"Configuracao"`
- `"Bug"`
- `"Duvida"`

**prioridade** — valores possiveis:
- `"Baixa"`, `"Normal"` (default), `"Alta"`, `"Urgente"`

**vertical** — String livre que referencia `CatalogoVertical.nome` (mesmo padrao de `EntidadeSistema.vertical`). Sem FK.

**sistema** — String livre com nome do sistema. Quando o usuario seleciona uma vertical, o frontend mostra os sistemas daquela vertical (via `catalogoApi.listar()`) como opcoes.

**conteudo (ChamadoAnexo)** — arquivo codificado em base64, mesmo padrao de `Relatorio.jxrmlConteudo`.

---

## 3. Rotas da API

Criar arquivo: `backend/src/routes/chamados.js`

Todas protegidas pelo middleware `autenticar` (global). Delete de chamado exige `exigirAdmin`.

**IMPORTANTE**: Rotas literais ANTES de `/:id` (padrao Express do projeto).

```
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { exigirAdmin } = require('../middleware/autenticar')

const prisma = new PrismaClient()
const router = express.Router()
```

### Endpoints

| # | Metodo | Rota | Descricao | Acesso |
|---|--------|------|-----------|--------|
| 1 | GET | / | Lista chamados com filtros | Todos |
| 2 | GET | /estatisticas | Contagem por status | Todos |
| 3 | POST | / | Cria chamado | Todos |
| 4 | GET | /anexos/:aid | Download anexo | Todos |
| 5 | DELETE | /anexos/:aid | Remove anexo | Todos |
| 6 | DELETE | /comentarios/:cid | Remove comentario | Autor ou Admin |
| 7 | GET | /:id | Detalhe completo | Todos |
| 8 | PUT | /:id | Atualiza chamado | Todos |
| 9 | DELETE | /:id | Remove chamado | Admin only |
| 10 | POST | /:id/comentarios | Adiciona comentario | Todos |
| 11 | POST | /:id/anexos | Upload anexo | Todos |

### Detalhes de cada endpoint

#### GET / — Listar

Query params: `?busca=`, `?status=`, `?classificacao=`, `?responsavelId=`, `?vertical=`

```js
router.get('/', async (req, res) => {
  const { busca, status, classificacao, responsavelId, vertical } = req.query
  const where = {}
  if (status) where.status = status
  if (classificacao) where.classificacao = classificacao
  if (responsavelId) where.responsavelId = Number(responsavelId)
  if (vertical) where.vertical = vertical
  if (busca) {
    where.OR = [
      { titulo: { contains: busca } },
      { descricao: { contains: busca } }
    ]
  }

  const chamados = await prisma.chamado.findMany({
    where,
    orderBy: { criadoEm: 'desc' },
    include: {
      criadoPor: { select: { id: true, nome: true } },
      responsavel: { select: { id: true, nome: true } },
      _count: { select: { comentarios: true, anexos: true } }
    }
  })

  // Omitir descricao longa na listagem (enviar apenas primeiros 200 chars)
  res.json(chamados.map(c => ({
    ...c,
    descricao: c.descricao ? c.descricao.substring(0, 200) : null,
    descricaoTruncada: c.descricao ? c.descricao.length > 200 : false
  })))
})
```

#### GET /estatisticas

```js
router.get('/estatisticas', async (req, res) => {
  const todos = await prisma.chamado.groupBy({
    by: ['status'],
    _count: { id: true }
  })
  const stats = {}
  todos.forEach(g => { stats[g.status] = g._count.id })
  res.json(stats)
})
```

#### POST / — Criar

```js
router.post('/', async (req, res) => {
  const { titulo, descricao, status, classificacao, prioridade, vertical, sistema, responsavelId } = req.body
  if (!titulo?.trim()) return res.status(400).json({ error: 'Titulo e obrigatorio' })

  const chamado = await prisma.chamado.create({
    data: {
      titulo: titulo.trim(),
      descricao: descricao?.trim() || null,
      status: status || 'Nao Analisado',
      classificacao: classificacao || null,
      prioridade: prioridade || 'Normal',
      vertical: vertical || null,
      sistema: sistema || null,
      criadoPorId: req.usuario.id,
      responsavelId: responsavelId ? Number(responsavelId) : null
    },
    include: {
      criadoPor: { select: { id: true, nome: true } },
      responsavel: { select: { id: true, nome: true } },
      _count: { select: { comentarios: true, anexos: true } }
    }
  })
  res.status(201).json(chamado)
})
```

#### GET /anexos/:aid — Download

```js
router.get('/anexos/:aid', async (req, res) => {
  const anexo = await prisma.chamadoAnexo.findUnique({ where: { id: Number(req.params.aid) } })
  if (!anexo) return res.status(404).json({ error: 'Anexo nao encontrado' })

  const buffer = Buffer.from(anexo.conteudo, 'base64')
  res.setHeader('Content-Type', anexo.tipo || 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="${anexo.nomeArquivo}"`)
  res.send(buffer)
})
```

#### DELETE /anexos/:aid

```js
router.delete('/anexos/:aid', async (req, res) => {
  try {
    await prisma.chamadoAnexo.delete({ where: { id: Number(req.params.aid) } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Anexo nao encontrado' })
    res.status(500).json({ error: err.message })
  }
})
```

#### DELETE /comentarios/:cid

```js
router.delete('/comentarios/:cid', async (req, res) => {
  const cid = Number(req.params.cid)
  const comentario = await prisma.chamadoComentario.findUnique({ where: { id: cid } })
  if (!comentario) return res.status(404).json({ error: 'Comentario nao encontrado' })

  // Apenas autor ou admin pode deletar
  if (comentario.autorId !== req.usuario.id && req.usuario.role !== 'admin') {
    return res.status(403).json({ error: 'Sem permissao' })
  }

  await prisma.chamadoComentario.delete({ where: { id: cid } })
  res.json({ ok: true })
})
```

#### GET /:id — Detalhe

```js
router.get('/:id', async (req, res) => {
  const chamado = await prisma.chamado.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      criadoPor: { select: { id: true, nome: true } },
      responsavel: { select: { id: true, nome: true } },
      comentarios: {
        orderBy: { criadoEm: 'asc' },
        include: { autor: { select: { id: true, nome: true } } }
      },
      anexos: {
        select: { id: true, nomeArquivo: true, tipo: true, tamanho: true, criadoEm: true }
        // NAO incluir conteudo (base64) na listagem
      },
      _count: { select: { comentarios: true, anexos: true } }
    }
  })
  if (!chamado) return res.status(404).json({ error: 'Chamado nao encontrado' })
  res.json(chamado)
})
```

#### PUT /:id — Atualizar

```js
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { titulo, descricao, status, classificacao, prioridade, vertical, sistema, responsavelId } = req.body

  try {
    const chamado = await prisma.chamado.update({
      where: { id },
      data: {
        ...(titulo !== undefined && { titulo: titulo.trim() }),
        ...(descricao !== undefined && { descricao: descricao?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(classificacao !== undefined && { classificacao: classificacao || null }),
        ...(prioridade !== undefined && { prioridade }),
        ...(vertical !== undefined && { vertical: vertical || null }),
        ...(sistema !== undefined && { sistema: sistema || null }),
        ...(responsavelId !== undefined && { responsavelId: responsavelId ? Number(responsavelId) : null })
      },
      include: {
        criadoPor: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
        _count: { select: { comentarios: true, anexos: true } }
      }
    })
    res.json(chamado)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Chamado nao encontrado' })
    res.status(500).json({ error: err.message })
  }
})
```

#### DELETE /:id — Remover (admin only)

```js
router.delete('/:id', exigirAdmin, async (req, res) => {
  try {
    await prisma.chamado.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Chamado nao encontrado' })
    res.status(500).json({ error: err.message })
  }
})
```

#### POST /:id/comentarios

```js
router.post('/:id/comentarios', async (req, res) => {
  const chamadoId = Number(req.params.id)
  const { conteudo } = req.body
  if (!conteudo?.trim()) return res.status(400).json({ error: 'Conteudo e obrigatorio' })

  const chamado = await prisma.chamado.findUnique({ where: { id: chamadoId } })
  if (!chamado) return res.status(404).json({ error: 'Chamado nao encontrado' })

  const comentario = await prisma.chamadoComentario.create({
    data: {
      conteudo: conteudo.trim(),
      chamadoId,
      autorId: req.usuario.id
    },
    include: { autor: { select: { id: true, nome: true } } }
  })
  res.status(201).json(comentario)
})
```

#### POST /:id/anexos

```js
router.post('/:id/anexos', async (req, res) => {
  const chamadoId = Number(req.params.id)
  const { nomeArquivo, tipo, conteudo, tamanho } = req.body
  if (!nomeArquivo || !conteudo) return res.status(400).json({ error: 'nomeArquivo e conteudo sao obrigatorios' })

  const chamado = await prisma.chamado.findUnique({ where: { id: chamadoId } })
  if (!chamado) return res.status(404).json({ error: 'Chamado nao encontrado' })

  const anexo = await prisma.chamadoAnexo.create({
    data: {
      nomeArquivo,
      tipo: tipo || null,
      conteudo, // base64
      tamanho: tamanho ? Number(tamanho) : null,
      chamadoId
    },
    select: { id: true, nomeArquivo: true, tipo: true, tamanho: true, criadoEm: true }
  })
  res.status(201).json(anexo)
})

module.exports = router
```

### Montar em index.js

No arquivo `backend/src/index.js`, adicionar:

```js
// No topo, junto com os outros requires:
const chamadosRouter = require('./routes/chamados')

// Na secao de rotas protegidas, junto com as outras:
app.use('/api/chamados', chamadosRouter)
```

---

## 4. Frontend — API Module

No arquivo `frontend/src/lib/api.js`, adicionar antes do `export default api`:

```js
export const chamadosApi = {
  listar:            (params) => api.get('/chamados', { params }).then(r => r.data),
  obter:             (id) => api.get(`/chamados/${id}`).then(r => r.data),
  criar:             (data) => api.post('/chamados', data).then(r => r.data),
  atualizar:         (id, data) => api.put(`/chamados/${id}`, data).then(r => r.data),
  deletar:           (id) => api.delete(`/chamados/${id}`).then(r => r.data),
  estatisticas:      () => api.get('/chamados/estatisticas').then(r => r.data),
  criarComentario:   (id, data) => api.post(`/chamados/${id}/comentarios`, data).then(r => r.data),
  deletarComentario: (cid) => api.delete(`/chamados/comentarios/${cid}`).then(r => r.data),
  criarAnexo:        (id, data) => api.post(`/chamados/${id}/anexos`, data).then(r => r.data),
  deletarAnexo:      (aid) => api.delete(`/chamados/anexos/${aid}`).then(r => r.data),
}
```

---

## 5. Frontend — Pagina Chamados.jsx

Criar arquivo: `frontend/src/pages/Chamados.jsx`

### Layout

Duas colunas (mesmo padrao Portfolio.jsx):

```
+-------------------------------+------------------------------------------+
| Lista (w-80 shrink-0)         | Detalhe (flex-1)                         |
|                               |                                          |
| [Campo busca]                 | Titulo + badges status/classificacao     |
| [Filtro status ▼]             | + contador "ha X dias"                   |
| [Filtro classificacao ▼]      |                                          |
|                               | Metadados: criado por, responsavel,      |
| Card chamado 1          [sel] |   vertical, sistema, prioridade          |
|  ● titulo                     |                                          |
|  criado por · ha X dias       | ─────────────────────────────────────    |
|  badge classif.               | Descricao                                |
|                               |                                          |
| Card chamado 2                | ─────────────────────────────────────    |
| Card chamado 3                | Anexos (upload + lista)                  |
| ...                           |                                          |
|                               | ─────────────────────────────────────    |
| [+ Novo Chamado]              | Comentarios (timeline)                   |
|                               |   [textarea + botao enviar]              |
+-------------------------------+------------------------------------------+
```

### Cores de Status

```js
const STATUS_CORES = {
  'Nao Analisado':      '#94A3B8', // cinza
  'Em Analise':         '#3B82F6', // azul
  'Em Atendimento':     '#F59E0B', // amarelo
  'Aguardando Retorno': '#F97316', // laranja
  'Concluido':          '#22C55E', // verde
}
```

### Cores de Classificacao

```js
const CLASSIF_CORES = {
  'Pendencia de Migracao': '#8B5CF6', // roxo
  'Configuracao':          '#3B82F6', // azul
  'Bug':                   '#EF4444', // vermelho
  'Duvida':                '#F59E0B', // amarelo
}
```

### Cores de Prioridade

```js
const PRIORIDADE_CORES = {
  'Baixa':   '#94A3B8', // cinza
  'Normal':  '#3B82F6', // azul
  'Alta':    '#F59E0B', // amarelo
  'Urgente': '#EF4444', // vermelho
}
```

### Estado (useState)

```js
const [chamados, setChamados] = useState([])
const [chamadoSelId, setChamadoSelId] = useState(null)
const [detalhe, setDetalhe] = useState(null)
const [busca, setBusca] = useState('')
const [filtroStatus, setFiltroStatus] = useState('')
const [filtroClassificacao, setFiltroClassificacao] = useState('')
const [carregando, setCarregando] = useState(true)
const [modalNovo, setModalNovo] = useState(false)
const [usuarios, setUsuarios] = useState([])
const [catalogo, setCatalogo] = useState([])
const [novoComentario, setNovoComentario] = useState('')
```

### Carregar dados

```js
const carregar = async () => {
  setCarregando(true)
  try {
    const params = {}
    if (busca) params.busca = busca
    if (filtroStatus) params.status = filtroStatus
    if (filtroClassificacao) params.classificacao = filtroClassificacao
    const data = await chamadosApi.listar(params)
    setChamados(data)
  } catch (e) { console.error(e) }
  finally { setCarregando(false) }
}

useEffect(() => { carregar() }, [busca, filtroStatus, filtroClassificacao])

// Carregar usuarios e catalogo na montagem
useEffect(() => {
  api.get('/usuarios').then(r => setUsuarios(r.data.filter(u => u.ativo)))
  catalogoApi.listar().then(setCatalogo)
}, [])
```

### Selecionar chamado (carregar detalhe)

```js
const selecionarChamado = async (id) => {
  setChamadoSelId(id)
  const data = await chamadosApi.obter(id)
  setDetalhe(data)
}
```

### Contador de dias

```js
function diasDesde(data) {
  return Math.floor((Date.now() - new Date(data).getTime()) / 86400000)
}
```

### Card do chamado (painel esquerdo)

Cada card exibe:
- Dot colorido do status (circulo 8px com a cor do STATUS_CORES)
- Titulo (truncado com `truncate`)
- Badge da classificacao (se houver)
- "Criado por NomeDoUsuario · ha X dias"
- Nome do responsavel (se atribuido)
- Contagem de comentarios/anexos em chips pequenos

Item selecionado: `bg-sysgate-50 border-l-2 border-sysgate-500` (padrao Portfolio)

### Painel de detalhe (direita)

Quando um chamado esta selecionado:

**Header:**
- Titulo grande (h2)
- Badge do status (colorido, clicavel para abrir dropdown de mudanca de status)
- "ha X dias" badge
- Botao editar (abre modal de edicao)
- Botao deletar (admin only, com confirm)

**Metadados (grid ou flex row):**
- Criado por: nome (somente leitura)
- Responsavel: dropdown dos usuarios ativos. onChange -> chamadosApi.atualizar(id, { responsavelId })
- Classificacao: dropdown. onChange -> chamadosApi.atualizar(id, { classificacao })
- Prioridade: dropdown. onChange -> chamadosApi.atualizar(id, { prioridade })
- Vertical: dropdown do catalogo. onChange -> atualiza e filtra sistemas
- Sistema: dropdown dos sistemas da vertical selecionada

**Descricao:**
- Texto com `whitespace-pre-wrap` (preserva quebras de linha)
- Se nao tiver descricao: texto cinza "Sem descricao"

**Secao Anexos:**
- Header "Anexos" + botao "+ Anexar"
- Botao abre file input (multiple). Para cada arquivo: FileReader -> readAsDataURL -> extrai base64 -> chamadosApi.criarAnexo
- Lista de anexos: icone por tipo (imagem/pdf/generico) + nome + tamanho + botao download + botao delete
- Download: `window.open('/api/chamados/anexos/' + aid)` ou fetch + blob (melhor, pois tem auth)

**Secao Comentarios:**
- Header "Comentarios (N)"
- Timeline vertical: cada comentario com:
  - Avatar circular com iniciais do autor (2 primeiras letras maiusculas, fundo sysgate-100, texto sysgate-600)
  - Nome do autor em bold
  - Data relativa ("ha X dias", "ha 2 horas", etc.)
  - Texto do comentario
  - Botao delete (X) — visivel apenas se autor ou admin
- Input no final: textarea + botao "Comentar"

### Modal Novo Chamado

Mesma estrutura de modais do projeto (fixed inset-0 bg-black/40 backdrop-blur-sm):

```
Titulo *          [input text]
Descricao         [textarea]
Classificacao     [select: vazio, Pendencia de Migracao, Configuracao, Bug, Duvida]
Prioridade        [select: Baixa, Normal, Alta, Urgente]
Vertical          [select: vazio + verticais do catalogo]
Sistema           [select: vazio + sistemas da vertical selecionada]
Responsavel       [select: vazio + usuarios ativos]
Anexos            [input file multiple]

[Cancelar]  [Criar Chamado]
```

### Responsivo (mobile)

Mesmo padrao Portfolio:
- Em telas pequenas, colunas empilham
- Quando um chamado esta selecionado, o painel de detalhe substitui a lista
- Botao "← Voltar" no topo do detalhe para voltar a lista

---

## 6. Navegacao

### Sidebar.jsx

Adicionar icone no objeto ICONS:

```jsx
chamados: (
  <Icon>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </Icon>
),
```

Adicionar entrada no `BASE_NAV_ITEMS` entre Portfolio e Sistemas:

```js
const BASE_NAV_ITEMS = [
  { to: '/',            label: 'Dashboard',             icon: ICONS.dashboard,  exact: true },
  { to: '/municipios',  label: 'Municipios',            icon: ICONS.municipios },
  { to: '/portfolio',   label: 'Portfolio',              icon: ICONS.portfolio },
  { to: '/chamados',    label: 'Chamados',              icon: ICONS.chamados },    // <-- NOVO
  { to: '/sistemas',    label: 'Sistemas',              icon: ICONS.sistemas },
  { to: '/sandbox',     label: 'Sandbox',               icon: ICONS.sandbox },
  { to: '/envio-lote',  label: 'Envio em Lote',         icon: ICONS.envioLote },
  { to: '/scripts',     label: 'Scripts & Ferramentas', icon: ICONS.scripts },
  { to: '/historico',   label: 'Historico',              icon: ICONS.historico },
]
```

### App.jsx

```jsx
import Chamados from './pages/Chamados'

// Dentro das rotas protegidas, apos portfolio:
<Route path="chamados" element={<Chamados />} />
```

---

## 7. Arquivos a Criar/Modificar

### Criar (2 arquivos)
| Arquivo | Descricao |
|---------|-----------|
| `backend/src/routes/chamados.js` | Router Express com todos os endpoints |
| `frontend/src/pages/Chamados.jsx` | Pagina completa |

### Modificar (5 arquivos)
| Arquivo | O que mudar |
|---------|-------------|
| `backend/prisma/schema.prisma` | Adicionar 3 modelos (Chamado, ChamadoComentario, ChamadoAnexo) + 3 relations em Usuario |
| `backend/src/index.js` | Adicionar require + app.use('/api/chamados', chamadosRouter) |
| `frontend/src/lib/api.js` | Adicionar export chamadosApi |
| `frontend/src/components/Sidebar.jsx` | Adicionar icone + nav item |
| `frontend/src/App.jsx` | Adicionar import + Route |

---

## 8. Pos-criacao

```bash
cd backend
npx prisma db push    # Cria as 3 novas tabelas no SQLite
```

Nao precisa de seed — modulo comeca vazio.

---

## 9. Verificacao

1. `npx prisma db push` executa sem erros
2. Backend inicia sem erros (`npm run dev`)
3. Frontend inicia sem erros (`npm run dev`)
4. Criar chamado via modal → aparece na lista esquerda
5. Clicar no chamado → detalhe carrega no painel direito
6. Mudar status via dropdown → badge atualiza cor
7. Atribuir responsavel → nome aparece no card
8. Adicionar comentario → aparece na timeline
9. Upload anexo → aparece na lista, download funciona
10. Filtros (busca, status, classificacao) funcionam
11. Delete chamado (admin) → remove tudo (cascade)
12. Delete comentario (autor) → remove apenas o comentario
13. Mobile: layout responsivo, botao voltar funciona

---

## 10. Notas Tecnicas

- **Limite de anexo**: Express ja esta com `express.json({ limit: '10mb' })` em index.js. Isso suporta ~7.5MB de arquivo real (overhead base64 ~33%). Validar no frontend.
- **onDelete: Cascade**: funciona para relacoes 1:N simples no SQLite/Prisma. Ao deletar um Chamado, comentarios e anexos sao removidos automaticamente. Diferente do Portfolio que precisa de cascade manual (M2M).
- **Sem Zustand store**: estado local com useState (mesmo padrao Portfolio). Nao precisa persistir entre navegacoes.
- **Vertical/Sistema do catalogo**: reutiliza `catalogoApi.listar()` que ja existe. Quando o usuario seleciona uma vertical, mostrar os sistemas daquela vertical como opcoes no dropdown de sistema.
