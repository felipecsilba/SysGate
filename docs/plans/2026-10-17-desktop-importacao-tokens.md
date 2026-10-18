# Plano: Krakion Desktop — Importar do Krakion web + Central de Tokens

**Goal:** trazer os dados reais do implantador (sistemas, endpoints, municípios, tokens) da VPS para o banco local do app, e entregar a Central de Tokens no visual novo. Primeiras duas de quatro entregas (depois: Sistemas, Sandbox requisição única, Sandbox lote).

**Architecture:** quem fala com a VPS é o **backend local** (rota nova `/api/importacao`, só com `KRAKION_DESKTOP=1` + admin) — a tela não chama a VPS (o CORS de lá bloquearia) e a senha só trafega PC → VPS. Fluxo stateless em 2 chamadas: `conectar` (login remoto + resumo) devolve o JWT da VPS; `executar` usa esse JWT para buscar de novo e gravar numa transação. A regra de mesclagem é pura (`lib/importacaoWeb.js`) e testada. A Central de Tokens usa as rotas de `/api/municipios` que já existem.

**Tech Stack:** backend Express + Prisma (fetch nativo do Node para a VPS); desktop React + Tailwind (tokens do tema), `node --test`.

**Decisões fechadas**
- Importar = copiar. Depois da importação o app não depende da VPS; mudanças não sincronizam (fase futura).
- Reimportar não duplica: sistema e município casam por **nome normalizado** (trim, minúsculas, sem acento); endpoints de cada sistema importado são **substituídos** pelos da VPS (como reimportar Swagger); token faz upsert por município × sistema. Mesmo nome → a VPS vence.
- Municípios importados ficam do usuário local logado. Ativo: se não há ativo local, herda o ativo da VPS.
- Fora: specs Swagger (a API não expõe o conteúdo — endpoints bastam), histórico de requisições, endpoints sem sistema (contados e informados).

---

## Tasks

### Task 1: Regra de mesclagem pura (TDD)
**Files:** `backend/src/lib/importacaoWeb.js`, `backend/src/lib/importacaoWeb.test.js`
- `normalizarNome(s)` — trim, minúsculas, sem acento.
- `casarPorNome(remotos, locais)` → `[{ remoto, localId|null }]`.
- `prepararEndpoint(ep, sistemaId)` → dados do Prisma (`bodySchema` array → `JSON.stringify`, vazio → `null`; sem `id`).
- `prepararTokens(municipiosRemotos, mapaSistemas, mapaMunicipios)` → `{ tokens: [{municipioId, sistemaId, token, dataVencimento}], ignorados }` (sistema não mapeado → ignorado).
- `resumir(dados)` → contagens para a tela (sistemas, endpoints, endpointsSemSistema, municipios, tokens).

### Task 2: Cliente da VPS
**Files:** `backend/src/lib/clienteKrakionWeb.js`
- `normalizarUrl(url)` — só http/https, sem barra final (erro amigável se inválida).
- `entrar(url, login, senha)` → JWT (401 → "Login ou senha inválidos no Krakion web").
- `buscarTudo(url, token)` → `{ sistemas, endpoints, municipios: [{...m, tokens}] }` (`GET /api/sistemas`, `/api/endpoints`, `/api/municipios`, `/api/municipios/:id/tokens`). Timeout 30 s por chamada.

### Task 3: Rota `/api/importacao`
**Files:** `backend/src/routes/importacao.js`, `backend/src/index.js`
- Guarda: `KRAKION_DESKTOP !== '1'` → 404; `exigirAdmin`.
- `POST /conectar { url, login, senha }` → `{ tokenRemoto, resumo }`.
- `POST /executar { url, tokenRemoto, sistemas: bool, municipios: bool }` → `$transaction` (timeout 120 s): sistemas (create/update + deleteMany/createMany de endpoints) → municípios (create/update) → tokens (upsert) → ativo. Sem `sistemas`, os tokens casam só com sistemas locais de mesmo nome. Devolve contagens.
- Verificação manual: contra o backend web local (3001) como "VPS" de teste.

### Task 4: Validade do token (TDD)
**Files:** `desktop/src/lib/validade.js`, `desktop/src/lib/validade.test.js`
- `diasRestantes(dataVencimento, hoje)` — usa só `AAAA-MM-DD` (corrige o off-by-one do web em UTC−3).
- `estadoValidade(dias)` → `{ rotulo, tom }`: `null` → sem selo; `<0` "Expirado há N dias" (vermelho); `0` "Vence hoje" (laranja); `1–7` laranja; `8–30` amarelo; `>30` verde.
- `limitesData(hoje)` → `{ min, max }` (hoje … hoje+15).

### Task 5: Componentes base
**Files:** `desktop/src/components/Modal.jsx`, `Confirmar.jsx`, `Busca.jsx`; `desktop/src/lib/api.js` (`municipiosApi`, `sistemasApi`, `importacaoApi`)

### Task 6: Tela Importar dados
**Files:** `desktop/src/pages/ImportarDados.jsx`, `desktop/src/modulos.js` (+ item `importar` em Configurações), `desktop/src/modulos.test.js`, `desktop/src/App.jsx` (mapa id → página)
- 3 etapas: Conectar → Escolher (contagens + checkboxes + aviso "mesmo nome: a VPS vence") → Pronto (contagens + "Ir para Central de Tokens").

### Task 7: Central de Tokens
**Files:** `desktop/src/pages/CentralTokens/index.jsx`, `ListaMunicipios.jsx`, `DetalheMunicipio.jsx`, `ModalMunicipio.jsx`, `ModalToken.jsx`
- Lista com busca (sem acento) + "+ Município"; ativo marcado.
- Detalhe: nome, observações, "Tornar ativo", editar, excluir (confirmação); tokens com sistema, token mascarado (8 chars + ••••) + revelar + copiar, selo de validade, remover; "+ Token" (sistema, token, validade ≤ 15 dias — upsert).
- Empty state sem municípios → atalho para "Importar dados".

### Task 8: Verificação + docs
1. `npm test` (backend e desktop).
2. App de teste (portas alternativas): importar do backend web local, conferir contagens, reimportar (sem duplicar), CRUD da Central de Tokens, fotos claro/escuro.
3. `npm run atalho`; docs (`docs/desktop.md`, `CLAUDE.md`, `skills/seguranca.md`).
