# Krakion — Diagnóstico e Plano de Painel Externo
> Análise gerada pelo modelo Fable 5 via Claude Code · Junho 2026

---

## 1. Estrutura e Arquitetura

**Stack:**
- **Frontend:** React 18 + Vite + Tailwind + Zustand
- **Backend:** Node/Express 4 + Prisma + SQLite
- **Infraestrutura:** Docker Compose (2 serviços) + Nginx como proxy no container do frontend

**Backend (`backend/src/`):** 1 entry (`index.js`), 1 middleware (`autenticar.js` com `exigirAdmin`), 15 routers.

**Schema Prisma — 24 modelos em 6 domínios:**
- Sandbox/API: `Sistema`, `Endpoint`, `Requisicao`, `SwaggerSpec`, `Municipio`, `MunicipioSistema`
- Usuários
- Portfólio
- Chamados: `Chamado`, `ChamadoComentario`, `ChamadoAnexo`, `ChamadoHistorico`, `Solicitante`
- Notas
- Conhecimento

**Frontend (`frontend/src/`):** ~14 páginas com lazy loading, API centralizada em `lib/api.js` (interceptor JWT + 401→logout), auth em Zustand persistido no localStorage.

### Modelo de permissões atual

| Recurso | Isolamento |
|---|---|
| Municípios, requisições, notas | Isolados por usuário ✅ |
| Chamados, solicitantes, conhecimento, portfólio | Qualquer autenticado vê **tudo** ⚠️ |

> **Ponto crítico:** o sistema foi desenhado assumindo que todo usuário autenticado é da equipe interna.

---

## 2. Vulnerabilidades de Segurança

> **Status pós-Fase 0 (2026-06-10):**
> - ✅ **Resolvidas:** #1 (Twilio removido — falta rotação manual), #2 (JWT_SECRET no compose), #3 (token de recuperação com hash), #5 (rate limit + captcha no /registrar), #6 (vazamento no /esqueci-senha), #7 (validação de upload), #10 (error handler não vaza `err.message`), #11 (parcial — Nginx repassa X-Forwarded-For).
> - ✅ **#13 resolvida (2026-06-11):** instância única de PrismaClient (`src/lib/prisma.js`), junto com a migração para Postgres.
> - ✅ **#8 e #9 resolvidas (2026-06-12):** CORS restrito a allowlist via `CORS_ORIGINS` (commit `e8ac8bf`); senha mínima aumentada para 8 caracteres (commit `a134bca`).
> - ⬜ **Pendentes:** #4 (revogação de JWT contra o banco), #12 (JWT no localStorage).

### 🔴 Críticas

1. **Credenciais Twilio expostas** em `backend/.env:6-8` (`TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`). O Twilio nem está no `package.json` — é resíduo. Mesmo com `.env` no `.gitignore`, se esse arquivo já passou por algum commit ou backup, o token está comprometido. **Ação: rotacionar no painel Twilio e remover as linhas.**

2. **Docker quebra a autenticação:** o `docker-compose.yml` só injeta `DATABASE_URL` e `PORT`, e o `Dockerfile` não copia o `.env`. Dentro do container, `JWT_SECRET` é `undefined` — `jwt.sign` lança erro e o login retorna 500. Além de bug funcional, é sinal de que o secret não tem estratégia de provisionamento em produção.

3. **Token de recuperação de senha armazenado em texto puro** (`auth.js:198-204`). Quem obtiver leitura do banco (ou um backup do `dev.db`) toma qualquer conta gerando o link de redefinição. **Deve-se armazenar o hash SHA-256 do token.**

4. **JWT nunca é revalidado contra o banco:** desativar um usuário (`ativo: false`) ou revogar admin não tem efeito — o token continua válido por até 30 dias (login com "lembrar"). Não há mecanismo de revogação.

### 🟠 Altas

5. `POST /api/auth/registrar` sem rate limit e sem captcha (`auth.js:141`) — permite criação em massa de contas e enumeração de logins (retorna "Login X já está em uso").

6. **Enumeração de usuários em `/esqueci-senha`:** a resposta genérica existe, mas `auth.js:194` retorna um `400` distinto quando o usuário existe sem email cadastrado — vaza existência da conta.

7. **Upload de anexos sem nenhuma validação** (`chamados.js:444-464`): aceita qualquer conteúdo base64 sem limite de tamanho próprio, sem whitelist de MIME, sem sanitizar `nomeArquivo`. Combinado com `express.json({ limit: '50mb' })` global (`index.js:44`), qualquer autenticado pode inflar o SQLite indefinidamente.

8. **CORS totalmente aberto** (`app.use(cors())`) — qualquer origem pode chamar a API. Com Bearer token o CSRF clássico não se aplica, mas é exposição desnecessária, grave se a API for publicada para externos.

### 🟡 Médias

9. Senha mínima de 6 caracteres (registro e redefinição).
10. Error handler global vaza `err.message` (`index.js:74`) — pode expor detalhes do Prisma/internals.
11. Rate limit global de 50.000 req/15min é decorativo. O `nginx.conf` não repassa `X-Forwarded-For` — com `trust proxy 1`, todos os clientes atrás do Nginx compartilham o mesmo bucket de IP.
12. JWT no localStorage — qualquer XSS rouba o token. Há `dangerouslySetInnerHTML` no linkify de comentários (escapado antes, mas é superfície frágil).
13. 15 instâncias de `PrismaClient` (uma por arquivo de rota) — esgota conexões/file handles sob carga; deve haver uma única instância compartilhada.

### Observações estruturais

- `GET /api/chamados/anexos/:aid` permite a qualquer autenticado baixar qualquer anexo — aceitável no modelo interno atual, inaceitável se externos entrarem no mesmo guarda-chuva de autenticação.
- Seed cria `admin/admin123` a cada start do container (`CMD` roda `seed.js` sempre).
- Sem validação estruturada de entrada (zod/joi) e sem nenhum teste automatizado.

---

## 3. Arquitetura — Pontos de Atenção

| Ponto | Impacto |
|---|---|
| **SQLite** | ✅ **Resolvido (2026-06-11):** migrado para PostgreSQL (16 na VPS, 18 no dev local) com dados preservados e contagens verificadas. Ver `skills/banco-de-dados.md`. |
| **Anexos base64 dentro do banco** | Já infla o `dev.db`; com uploads externos fica insustentável. Mover para filesystem/objeto com referência no banco. |
| **Número do chamado calculado no frontend** | O número muda se um chamado for deletado. Para uso interno é tolerável; como protocolo exibido a um cliente externo, é inaceitável — precisa ser persistido no banco na criação. |
| **`ChamadoComentario.autorId` obrigatório → `Usuario`** | O schema não comporta comentário de autor externo. Precisa de ajuste para o portal. |
| **Sem distinção comentário público/interno** | Hoje todo comentário é da equipe. Ao expor a timeline ao cliente, a equipe precisa poder comentar internamente sem o cliente ver. |

### Pontos positivos ✅
Helmet, bcrypt cost 10, lockout de login, rate limit no login, isolamento multi-tenant bem feito em municípios/tokens, histórico de alterações de chamados, documentação interna (`CLAUDE.md`/`docs`/`skills`) excelente.

---

## 4. Plano — Painel de Usuários Externos

### Decisão arquitetural central

> Usuários externos **NÃO** podem entrar no modelo `Usuario`. O middleware atual dá a qualquer JWT válido acesso a todos os chamados, conhecimento, portfólio e solicitantes. A base correta já existe: o modelo `Solicitante` (que já tem `Chamado.solicitanteId`). O plano é dar credenciais ao `Solicitante` e criar um trilho de autenticação paralelo e isolado.

---

### Fase 0 — Pré-requisitos de segurança (bloqueantes) — ✅ CONCLUÍDA (deploy em produção 2026-06-10, commit `80c08a8`)

> Antes de expor qualquer coisa à internet:

1. ✅ Rotacionar/remover credenciais Twilio; provisionar `JWT_SECRET` via environment no compose. → Twilio removido do `.env`; `env_file` no compose. *(Rotação manual do token Twilio segue pendente com o usuário.)*
2. ✅ Persistir o número do chamado no banco: campo `numero String? @unique` em `Chamado`, gerado na criação (transação, retry P2002), com backfill dos existentes (`backend/src/lib/numeroChamado.js` + `prisma/backfill-numero.js`). 9 chamados de produção numerados.
3. ✅ Validação de upload: 5 MB/anexo + 25 MB/chamado, whitelist de MIME (imagens + PDF), nome sanitizado. `express.json` global → 1 MB; parser de 8 MB só na rota de anexos.
4. ✅ Hash SHA-256 do token de recuperação; corrigida a resposta `400` que vazava existência de usuário (agora genérica); rate limit 5/15min + hCaptcha no `/registrar`.
5. ✅ Nginx: `proxy_set_header X-Forwarded-For` adicionado (no `/etc/nginx/sites-available/krakion` de produção, recarregado).

> **Bônus:** error handler global passou a respeitar `err.status` (413 propaga) e não vaza mais `err.message`/`detail` (item 10 das Médias).
>
> Documentação registrada em: `docs/chamados.md`, `docs/usuarios.md`, `skills/seguranca.md`, `skills/deploy.md`, `CLAUDE.md`.

---

### Fase 1 — Modelo de dados — ✅ CONCLUÍDA (deploy em produção 2026-06-11, commit `04962de`)

> **Decisões tomadas:** `criadoPorId` permanece obrigatório — usuário-sistema **"portal"** (inativo, sem login) criado no seed e nos bancos local/produção (prod: id 5). Escopo incluiu ajustes mínimos: `solicitantes.js` trata email duplicado com **409** (P2002) e usa select público (não vaza `senhaHash`/tokens; expõe `contaAtiva`); `chamados.js` inclui `autorSolicitante` nos comentários do detalhe. Produção verificada antes do `db push`: 0 solicitantes, nenhum email duplicado. Smoke test local passou (P2002, autor externo, default de `origem`). Docs registradas em `docs/chamados.md`, `CLAUDE.md`, `skills/seguranca.md`.

```prisma
model Solicitante {
  // campos existentes...
  email                String?   @unique      // passa a ser único
  senhaHash            String?               // null = solicitante sem conta (cadastrado pela equipe)
  contaAtiva           Boolean   @default(false)  // aprovação pela equipe
  emailVerificado      Boolean   @default(false)
  tentativasLogin      Int       @default(0)
  bloqueadoAte         DateTime?
  recuperacaoTokenHash String?
  recuperacaoExpira    DateTime?
}

model Chamado {
  numero  String @unique   // protocolo persistido (Fase 0)
  origem  String @default("interno")  // "interno" | "portal"
}

model ChamadoComentario {
  autorId            Int?   // passa a ser opcional
  autorSolicitanteId Int?   // autor externo
  interno            Boolean @default(false)  // true = invisível no portal
}
```

> **Regra:** todo comentário tem exatamente um autor (interno OU externo). Comentários da equipe nascem com escolha "responder ao cliente" vs "nota interna".

---

### Fase 2 — Backend do portal (`/api/portal/*`) — ✅ CONCLUÍDA (local, commit `3843f4a`, 2026-06-11)

> **Implementado conforme o plano**, com os seguintes detalhes de escopo: helpers de auth (`hashToken`/`captchaValido`/`criarTransporter`) extraídos para `backend/src/lib/authUtils.js` (reuso entre `auth.js` e `portalAuth.js`); upload de anexos do portal (`POST /portal/chamados/:id/anexos`) com a mesma validação da Fase 0 (parser de 8 MB estendido no `index.js`); rota interna `POST /api/chamados/:id/comentarios` já aceita a flag `interno` (suporte antecipado ao toggle da Fase 4); aprovação de contas via `GET /api/solicitantes?contaPendente=true` + `PATCH /api/solicitantes/:id/conta` (admin) — a tela interna fica para a Fase 4. Listagem/detalhe do portal não expõem prioridade/classificação/vertical/responsável. Smoke test local com 33 checks passou (isolamento por solicitante, separação dos trilhos, filtro de comentários internos e de seus anexos, lockout, recuperação). **Postgres migrado na sequência** (mesmo dia, dev + produção — decisão #1 resolvida). Docs em `docs/chamados.md`, `skills/seguranca.md`, `skills/banco-de-dados.md`, `CLAUDE.md`.

- **Middleware `autenticarExterno`:** JWT com claim `tipo: 'externo'` e `sid` (solicitanteId). Crucial: o `autenticar.js` interno passa a rejeitar tokens com `tipo: 'externo'` — sem isso, um externo logado acessaria todas as rotas internas.

**Rotas de Auth:**
- `POST /portal/auth/registrar` (com hCaptcha obrigatório + rate limit 5/15min; conta nasce `contaAtiva: false`)
- `POST /portal/auth/login` (lockout igual ao interno)
- `POST /portal/auth/esqueci-senha` / `redefinir-senha` (reusando o padrão corrigido da Fase 0)

**Rotas de Chamados:**
- `GET /portal/chamados` — sempre `where: { solicitanteId: token.sid }`, sem exceção
- `GET /portal/chamados/:id` — 404 se não for dono (padrão já usado em municípios)
- `POST /portal/chamados` — cria com `solicitanteId` do token, `origem: 'portal'`, status "Não Analisado", registra histórico
- `POST /:id/comentarios` — autor externo, sempre `interno: false`
- Comentários e anexos retornados filtram `interno: true` e anexos de comentários internos

**Aprovação:** tela interna (admin) lista contas pendentes e ativa — reusa o padrão `ativo: false` já existente para usuários internos.

---

### Fase 3 — Frontend do portal — ✅ CONCLUÍDA (deploy em produção 2026-06-12, commit `0bc153f`)

> **Implementado conforme o plano.** Rotas `/portal/*` no mesmo SPA com lazy loading; cliente HTTP separado (`lib/portalApi.js`) que injeta apenas o token do solicitante (401 com sessão ativa → logout só do portal); telas Login (hCaptcha após 3 falhas + "Manter conectado" 30d + recuperação de senha), Registro (sucesso informa aprovação pendente), RedefinirSenha, Meus Chamados (busca debounced + filtro de status traduzido + paginação), Novo Chamado (anexos validados client-side espelhando a Fase 0) e Detalhe (timeline "Conversa" com badge Equipe, resposta com `pendingAnexoIds`, chamado encerrado bloqueia resposta). Smoke test de 13 checks contra o backend local passou. **No caminho também foram corrigidas as vulns #8 (CORS allowlist via `CORS_ORIGINS`, commit `e8ac8bf`) e #9 (senha mínima 8, commit `a134bca`).** Docs em `docs/chamados.md` e `CLAUDE.md`.
>
> **Deploy verificado em produção (2026-06-12):** portal público em `https://krakionlabs.cloud/portal/login`; health/SPA/APIs respondendo; CORS testado com `Origin` same-origin nos dois trilhos. **Lacunas de configuração da VPS encontradas na verificação** (não bloqueiam, mas devem ser tratadas):
> 1. Sem `HCAPTCHA_SECRET` no `.env` e sem `frontend/.env` (sitekey) → o captcha do registro **não é verificado server-side** em produção (anti-bot desligado). Ligar = copiar secret/sitekey do `.env` local, autorizar o domínio na sitekey (painel hCaptcha) e rebuildar o frontend.
> 2. Sem `SMTP_*`/`APP_URL` → emails de recuperação de senha (interno e portal) não são enviados (já era assim antes do portal). `APP_URL=https://krakionlabs.cloud` quando configurar.
> 3. DNS do domínio tem registro AAAA (IPv6) que não responde — browsers caem para IPv4, mas vale remover o AAAA ou habilitar IPv6 no Nginx.

- Rotas `/portal/login`, `/portal/registro`, `/portal/*` protegidas por um `PortalRoute` com store separado (`krakion-portal-auth`) — sessões interna e externa coexistem sem conflito.
- **Layout próprio simplificado** (sem sidebar interna):
  - Meus Chamados (lista com status, busca)
  - Novo Chamado (título, descrição, anexos)
  - Detalhe (timeline pública, responder, acompanhar status)
- Status traduzidos para linguagem do cliente (ex.: "Nao Analisado" → "Recebido").

---

### Fase 4 — Integração no sistema interno — ✅ CONCLUÍDA (local, 2026-06-12)

> **Implementado conforme o plano**, mais a tela de aprovação adiada da Fase 2. Backend: `GET /api/chamados/:id` passou a expor `contaAtiva`/`temConta` do solicitante (derivado de `senhaHash`, removido antes da resposta) e o `GET /dashboard` inclui `origem` em `semResponsavel` — todo o resto já existia desde as Fases 1–2. Smoke test local com 11 checks passou (temConta/contaAtiva sem vazar senhaHash, `?contaPendente=true`, aprovação via PATCH, `origem` na listagem/dashboard, flag `interno` persistida). Docs em `docs/chamados.md`, `docs/usuarios.md`, `skills/seguranca.md`, `CLAUDE.md`.

- ✅ Badge "Portal" nos chamados de `origem: 'portal'` — cards da Minha Fila, tabela do Painel, lista do Dashboard e cabeçalho do detalhe.
- ✅ Toggle **"Resposta ao cliente"** (default) vs **"Nota interna"** no formulário de comentário — nota interna renderiza em âmbar com badge; o modo não reseta após enviar (evita vazar nota ao cliente), só ao trocar de chamado. Comentários de autor externo exibem badge "Cliente".
- ✅ Card do solicitante no detalhe indica conta no portal: "Conta no portal" (ativa) / "Conta pendente" (registrada sem aprovação).
- ✅ **Aprovação de contas** (pendência da Fase 2): seção "Contas do Portal" em `Usuarios.jsx` (admin) lista contas registradas, com Aprovar/Desativar via `PATCH /api/solicitantes/:id/conta` (`solicitantesApi.atualizarConta`).

---

## 5. Riscos e Decisões em Aberto

| # | Decisão | Recomendação |
|---|---|---|
| 1 | **SQLite → Postgres** | ✅ **Decidido e executado (2026-06-11):** migrado junto com a Fase 2, em dev e produção, antes de o portal ganhar frontend público. |
| 2 | **`criadoPorId` obrigatório em `Chamado`** | Usuário-sistema "Portal" (menos invasivo) ou tornar o campo opcional (mais limpo, mais migração). |
| 3 | **Auto-registro vs convite** | Dado o público (servidores de prefeituras), cadastro por convite/aprovação manual é mais seguro que registro aberto. O plano assume **aprovação manual**. |
