# Plano: Checagem de Cadastros

**Goal:** Ferramenta que recebe o JSON de um cadastro (dívidas, imóveis, econômicos…) e aponta o que está faltando ou inconsistente, antes de migrar. Resolve o problema de que a spec Betha marca como opcional campos que na prática são obrigatórios — o sistema aceita a migração incompleta e só quebra depois (ex.: dívida sem `sistemaOrigem` não permite cancelar o débito).

**Architecture:** Duas camadas de validação sobre o `bodySchema` já importado do Swagger:
1. **Automática** (sai da spec, vale para todos os endpoints desde o dia 1): enum inválido, tipo incorreto, campo inexistente.
2. **Ensinada** (catálogo global de marcações): campo marcado como obrigatório pelo implantador + observação do que quebra sem ele.

**Escopo global:** as marcações valem para todos os municípios e usuários — é regra do sistema Betha, não do município.

**Tech Stack:** Node.js + Express + Prisma + React + Vite + Tailwind

---

## Evidência que motivou o desenho

Medido na spec `tributos-openapi.json` (5,8 MB, 716 paths, 1070 schemas):

| Fato | Valor |
|---|---|
| `dividasPost > dividas` | 58 campos, apenas 15 `required` |
| `sistemaOrigem` | `integer`, "Código do sistema origem", **`required: false`** |
| `parcelamentosPost > parcelamentos` | 15 campos, 9 `required`; `tipoEntrada`/`vlEntrada`/`percEntrada` todos opcionais |
| GETs de coleção na API | 4 (nenhum de dados) — API **não permite varrer**, só `GET /{id}` |

A última linha é a razão de não existir auditoria em massa: o único parâmetro de query em toda a API é `id` (354×).

---

## Modelo de dados

```prisma
model CampoChecagem {
  id           Int      @id @default(autoincrement())
  sistemaId    Int
  path         String   // "/api/dividas" — estável entre reimportações do Swagger
  campo        String   // "dividas.sistemaOrigem" — caminho pontilhado
  obrigatorio  Boolean  @default(true)
  observacao   String?  // "sem isso o débito não cancela pela rotina"
  autorId      Int?
  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt

  sistema Sistema @relation(fields: [sistemaId], references: [id], onDelete: Cascade)

  @@unique([sistemaId, path, campo])
}
```

**Chave por `path`, não por `endpointId`** — reimportar o Swagger troca todos os ids; o path não muda. Sem isso o conhecimento ensinado se perderia a cada reimportação.

---

## Tasks

### Task 1 — Motor de validação (TDD)

**Files:** `backend/src/lib/checagem.js`, `backend/src/lib/checagem.test.js`

`achatarCampos(bodySchema)` → lista plana com caminhos pontilhados, percorrendo `subFields` recursivamente e descartando o sentinel `_exemplo`.

`validarPayload({ payload, campos, marcacoes })` → `{ resumo, achados[] }`

Checagens:

| # | Checagem | Severidade | Origem |
|---|---|---|---|
| 1 | Obrigatório ausente | erro | spec (`obrigatorio: true`) ou marcação do usuário |
| 2 | Valor fora do enum | erro | spec |
| 3 | Tipo incorreto | erro se não coercível, alerta se coercível | spec |
| 4 | Campo desconhecido | alerta (+ sugestão de campo parecido) | spec |

**Regra do pai ausente:** se um objeto pai não existe no payload, reporta o pai e **não** reporta os filhos — evita 43 achados por um único campo faltando.

**Array:** payload array valida cada item, prefixando o achado com o índice.

**Steps:**
1. Escrever `checagem.test.js` cobrindo as 4 checagens + pai ausente + array
2. `node --test` → confirmar RED
3. Implementar `checagem.js`
4. `node --test` → confirmar GREEN

### Task 2 — Schema Prisma

**Files:** `backend/prisma/schema.prisma`

Adicionar `CampoChecagem` + back-relation `camposChecagem` em `Sistema`. Rodar `npx prisma db push`.

### Task 3 — Rotas

**Files:** `backend/src/routes/checagem.js`, `backend/src/index.js`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/checagem/cadastros?sistemaId=` | Lista os cadastros (endpoints POST) do sistema |
| GET | `/api/checagem/campos?sistemaId=&path=` | Campos achatados + marcações mescladas |
| PUT | `/api/checagem/campos` | Salva marcação (upsert por sistemaId+path+campo) |
| POST | `/api/checagem/validar` | `{ sistemaId, path, payload }` → laudo |

Rotas nomeadas antes de `/:id` (não há `/:id` aqui). Usa `require('../lib/prisma')`.

### Task 4 — Frontend

**Files:** `frontend/src/pages/Checagem/{index,AbaChecar,AbaCampos}.jsx`, `frontend/src/lib/api.js`, `App.jsx`, `Sidebar.jsx`

- `index.jsx` — seletor de sistema + cadastro, toggle de abas
- `AbaChecar.jsx` — editor JSON à esquerda, laudo à direita
- `AbaCampos.jsx` — tabela de campos com toggle obrigatório + observação inline
- Rota `/checagem` (lazy) + link em Ferramentas na Sidebar

### Task 5 — Documentação

**Files:** `docs/checagem.md`, `CLAUDE.md`

---

## Fora de escopo (decidido no brainstorming)

- **Gerador de BFC-Script** — descartado pelo usuário.
- **Auditoria varrendo dados do município** — impossível: a API REST não tem GET de coleção nem filtro.
- **Regras condicionais** (`se tipoEntrada=VALOR então vlEntrada obrigatório`) — o toggle simples cobre o caso pedido; condicional só se provar necessário.
