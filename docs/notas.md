# Módulo Notas

Módulo de anotações pessoais estilo Google Keep. Cards coloridos em grid arrastável, com 4 tipos de conteúdo, etiquetas, fixar e compartilhamento por usuário.

**Rota:** `/notas` | **Sidebar:** Ferramentas → Notas

---

## Modelos do banco

### `Nota`

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| id | Int | autoincrement | PK |
| titulo | String | "Sem título" | Título da nota |
| tipo | String | "texto" | `texto` \| `checklist` \| `lista` \| `codigo` |
| conteudo | String | "" | Conteúdo para tipos `texto` e `codigo` |
| itens | String | "[]" | JSON serializado: `[{texto: string, feito?: boolean}]` — usado por `checklist` e `lista` |
| cor | String | "#FFFDE7" | Cor de fundo do card (hex da paleta de 10 cores) |
| fixada | Boolean | false | Se true, aparece na seção "Fixadas" acima das demais |
| ordem | Int | 0 | Posição no grid; atualizada via drag & drop |
| etiquetas | String | "[]" | JSON serializado: `string[]` — etiquetas livres para filtro |
| usuarioId | Int | — | FK → Usuario (dono da nota) |
| criadoEm | DateTime | now() | — |
| atualizadoEm | DateTime | updatedAt | — |

**Índice:** `[usuarioId, ordem]`

### `NotaCompartilhamento`

Tabela pivot para compartilhamento de nota entre usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK |
| notaId | Int | FK → Nota (onDelete: Cascade) |
| usuarioId | Int | FK → Usuario — usuário com quem foi compartilhado |
| criadoEm | DateTime | — |

**Constraint:** `@@unique([notaId, usuarioId])`

---

## API utilizada

Base: `/api/notas` — todas as rotas exigem token JWT.

| Método | Rota | Quem acessa | Descrição |
|--------|------|-------------|-----------|
| GET | `/api/notas` | Autenticado | Lista notas próprias + compartilhadas com o usuário; `?busca=`, `?etiqueta=`, `?tipo=` |
| POST | `/api/notas` | Autenticado | Cria nota (usuarioId = req.usuario.id) |
| GET | `/api/notas/:id` | Dono ou compartilhado | Detalhe com lista de compartilhamentos |
| PUT | `/api/notas/:id` | Dono ou compartilhado | Atualiza campos |
| DELETE | `/api/notas/:id` | Só dono | Remove nota (cascade deleta compartilhamentos) |
| PATCH | `/api/notas/ordem` | Autenticado | Reordenação em batch: `{ itens: [{id, ordem}] }` — só atualiza notas do usuário |
| PATCH | `/api/notas/:id/fixar` | Só dono | Toggle do campo `fixada` |
| POST | `/api/notas/:id/compartilhar` | Só dono | Compartilha com `{ usuarioId }` — upsert |
| DELETE | `/api/notas/:id/compartilhar/:uid` | Só dono | Remove compartilhamento de um usuário |

> **Ordem das rotas Express:** `/ordem` registrada ANTES de `/:id` para evitar conflito.

---

## Estado React (`Notas/index.jsx`)

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `notas` | `Nota[]` | Lista completa (próprias + compartilhadas) |
| `carregando` | boolean | Exibe spinner durante fetch |
| `busca` | string | Filtra via API (`?busca=`) |
| `filtroEtiqueta` | string | Filtra via API (`?etiqueta=`) |
| `filtroTipo` | string | Filtra via API (`?tipo=`) |
| `modalAberto` | boolean | Controla visibilidade do `ModalNota` |
| `editando` | `Nota \| null` | Nota sendo editada; `null` = criação |
| `confirmDeletar` | `Nota \| null` | Nota aguardando confirmação de deleção |
| `draggingId` | `number \| null` | ID da nota sendo arrastada |
| `dragOverId` | `number \| null` | ID da nota sobre a qual o cursor está |

---

## Componentes

### `Notas/index.jsx`
Componente principal. Grid responsivo `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. Separa notas em duas seções: **Fixadas** (ícone pin + label) e **Outras**. Drag & drop via HTML5 Drag and Drop API nativa (sem dependência). Ao soltar (`onDrop`), reordena o array localmente e persiste via `PATCH /notas/ordem` com debounce de 800ms.

### `Notas/NotaCard.jsx`
Card draggable (`draggable` HTML5). Fundo com `style={{ backgroundColor: nota.cor }}`. Ações (pin, editar, deletar) aparecem apenas no hover via `opacity`. Corpo renderizado por tipo:
- `texto` → `<p className="whitespace-pre-wrap line-clamp-8">`
- `checklist` → checkboxes visuais com tachado nos itens `feito`; contador "X/Y concluídos"
- `lista` → bullets `•`
- `codigo` → `<pre className="font-mono text-xs bg-black/10">`

Itens truncados em 8 com contador `+ N itens`. Footer com chips de etiquetas e ícone de compartilhada (se a nota pertence a outro usuário).

### `Notas/ModalNota.jsx`
Modal com fundo dinâmico (`backgroundColor: cor`). Abas de tipo no topo (Texto / Checklist / Lista / Código). Ao trocar de tipo, converte conteúdo ↔ itens automaticamente (linhas ↔ array de objetos). Campos: título, conteúdo/itens, seletor de 10 cores (círculos clicáveis), etiquetas (chips com Enter / vírgula). Seção de compartilhamento visível só para o dono da nota: lista usuários com acesso + select para adicionar novos.

---

## Paleta de cores

10 cores post-it disponíveis para seleção:

| Hex | Nome |
|-----|------|
| `#FFFDE7` | Amarelo (padrão) |
| `#F3E5F5` | Lilás |
| `#E8F5E9` | Verde |
| `#E3F2FD` | Azul |
| `#FBE9E7` | Salmão |
| `#FFF3E0` | Laranja |
| `#E8EAF6` | Índigo |
| `#FCE4EC` | Rosa |
| `#E0F2F1` | Teal |
| `#FAFAFA` | Branco/neutro |

---

## Comportamentos importantes

- **Isolamento por usuário:** queries filtram por `usuarioId = req.usuario.id` (notas próprias) OR `compartilhamentos.some({ usuarioId })` (compartilhadas). Notas de outros usuários não aparecem e retornam 404.
- **Compartilhamento:** o dono pode compartilhar com qualquer usuário via modal. O usuário compartilhado vê a nota com ícone de compartilhada e `donoNome` no card. Não pode deletar a nota (só o dono pode). Pode editar conteúdo.
- **Drag & drop:** reordena apenas notas não-fixadas e fixadas entre si (qualquer nota pode ser arrastada para qualquer posição). A posição é salva no campo `ordem`. Ao recarregar, a ordenação é `fixada desc, ordem asc, atualizadoEm desc`.
- **Fixar/Desafixar:** toggle via `PATCH /:id/fixar`. Notas fixadas são exibidas em seção separada acima das demais, com label "Fixadas" e ícone de marcador.
- **itens / etiquetas como JSON:** armazenados como `String` no SQLite (mesmo padrão de `bodySchema` nos Endpoints). Helper `parseNota(n)` no backend faz `JSON.parse` antes de retornar.
- **Conversão de tipo:** ao mudar tipo de texto→lista no modal, as linhas do `conteudo` são convertidas em `itens[]`. O inverso também ocorre (lista→texto converte itens de volta em texto separado por `\n`).

---

## Fluxo de deploy

Inclui mudança de schema — ao fazer deploy, `npx prisma db push` cria as tabelas `Nota` e `NotaCompartilhamento` no banco de produção.
