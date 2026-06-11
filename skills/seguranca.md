# Segurança — padrões e decisões

---

## Autenticação JWT

- Token com expiração `JWT_EXPIRES_IN=8h` (configurável no `.env`)
- Gerar `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Payload do token: `{ id, login, nome, role }` — injetado em `req.usuario` pelo middleware `autenticar.js`
- Interceptor Axios no frontend: adiciona `Authorization: Bearer <token>` em toda requisição; 401 → logout automático + redirect para `/login`
- **authStore**: Zustand + persist (`krakion-auth`) — persiste apenas `token` e `usuario`
- `lembrar = true` → JWT com `expiresIn = 30d`; padrão = 8h

---

## Proteção de rotas

- `autenticar.js`: middleware global aplicado em `index.js` **APÓS** montar `/api/auth` e `/api/health`
- `PrivateRoute`: redireciona para `/login` se não autenticado
- `AdminRoute`: redireciona para `/` se `role !== 'admin'` — usado apenas onde necessário
- Sidebar: exibe "Usuários" para admin e "Meu Perfil" para não-admin; a rota `/usuarios` é acessível a todos autenticados, mas a página se adapta ao role

---

## Isolamento de dados por usuário (multi-tenant)

- **Municípios e tokens**: campo `usuarioId Int?` em `Municipio` vincula cada município ao seu criador
  - Todas as queries de `municipios.js` filtram por `WHERE usuarioId = req.usuario.id`
  - Helper `verificarDono(id, usuarioId)` retorna `null` se não pertencer → 404 (nunca 403, para não vazar existência)
  - Ativação (`PATCH /:id/ativar`) desativa apenas os municípios do mesmo usuário
  - Proxy (`POST /executar`) verifica `municipioId` pertence ao usuário antes de buscar o token → 403 se não for dono
- **Sistemas e endpoints**: globais, mas escrita/exclusão via `exigirAdmin`
- **Histórico de requisições**: filtro `WHERE municipio.usuarioId = req.usuario.id` — cada usuário vê/limpa apenas o próprio
- **Logout seguro**: `authStore.logout()` chama `localStorage.removeItem('krakion-municipio')` para evitar vazamento entre usuários no mesmo browser

---

## Script de migração de municípios sem dono

Ao adicionar `usuarioId` ao schema, municípios existentes com `null` devem ser atribuídos ao admin:

```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
prisma.usuario.findFirst({ where: { role: 'admin', ativo: true } })
  .then(admin => prisma.municipio.updateMany({ where: { usuarioId: null }, data: { usuarioId: admin.id } }))
  .then(r => { console.log('Migrados:', r.count); prisma.\$disconnect() })
"
```

---

## Rate limiting

- **Global**: 50.000 req/15min por IP (todas as rotas)
- **Login**: 10 tentativas/15min por IP (`skipSuccessfulRequests: true`)
- **Registro** (`/auth/registrar`): 5/15min por IP (`registroRateLimit`) — Fase 0
- **Recuperação** (`/auth/esqueci-senha`, `/auth/redefinir-senha`): 5/15min por IP
- Resposta 429 com mensagem em português
- **Depende do IP real**: o Nginx de produção repassa `X-Forwarded-For` (ver `skills/deploy.md`) e o Express usa `trust proxy 1`. Sem o header, todos os clientes atrás do proxy compartilham o mesmo bucket de IP.

---

## Lockout de conta

- Campos no modelo `Usuario`: `tentativasLogin Int @default(0)` e `bloqueadoAte DateTime?`
- 5 falhas consecutivas → bloqueio de 15 minutos
- Login bem-sucedido → zera `tentativasLogin` e `bloqueadoAte`
- Mensagem de bloqueio exibe minutos restantes

---

## hCaptcha

- **Login**: aparece no frontend após 3 falhas consecutivas
- **Registro** (`/auth/registrar`): widget hCaptcha sempre presente no modal de cadastro (Fase 0); backend valida via helper `captchaValido()` — obrigatório quando `HCAPTCHA_SECRET` está configurado, ignorado em dev (secret vazio)
- Sitekey em `frontend/.env` → `VITE_HCAPTCHA_SITEKEY`
- Backend verifica token via `fetch('https://hcaptcha.com/siteverify')` — só se `HCAPTCHA_SECRET` estiver no `.env`
- Sitekey de teste (dev): `10000000-ffff-ffff-ffff-000000000001`
- Produção: registrar em hcaptcha.com, adicionar domínio da VPS

---

## Aprovação de contas

- `POST /api/auth/registrar` (auto-cadastro) e `POST /api/usuarios` (admin) criam com `ativo: false`
- Usuário não loga até admin ativar via `PUT /api/usuarios/:id` com `{ ativo: true }`
- UI exibe aviso em âmbar ao criar novo usuário
- Impede desativar/excluir o último admin ativo

---

## Senhas

- bcryptjs com salt rounds 10
- Endpoint separado `PATCH /api/usuarios/:id/senha` para troca de senha
- Mínimo 6 caracteres validado no backend

---

## Recuperação de senha — token com hash (Fase 0)

- `recuperacaoToken` no `Usuario` armazena o **hash SHA-256** do token (`hashToken()` em `auth.js`), nunca o texto puro. O token puro só viaja no email; o `redefinir-senha` faz lookup por `hashToken(token)`.
- **Motivo**: leitura do banco (ou backup do `dev.db`) não permite mais forjar um link de reset.
- `esqueci-senha` retorna **sempre** a mesma resposta genérica (200), inclusive quando o usuário existe mas não tem email cadastrado — antes um `400` distinto vazava a existência da conta.

---

## Hardening de payload e upload (Fase 0)

- **`express.json` global = 1 MB** (`index.js`); parser dedicado de **8 MB** só na rota `POST /api/chamados/:id/anexos`. Antes era 50 MB global — qualquer autenticado podia inflar o SQLite.
- **Upload de anexos** valida MIME (whitelist imagens + PDF → 415), tamanho real do base64 (5 MB/anexo, 25 MB/chamado → 413) e sanitiza o nome do arquivo. Ver `docs/chamados.md` → Anexos.
- **Error handler global** (`index.js`) respeita `err.status` (413 do body-parser propaga corretamente) e **não vaza** mais `err.message`/`detail` em respostas 500.

---

## Protocolo de chamado persistido (Fase 0)

- `Chamado.numero String? @unique` — gerado no backend (`backend/src/lib/numeroChamado.js`, em transação). Antes era calculado no frontend e mudava ao deletar chamados; agora é estável. Ver `docs/chamados.md` → Numeração.

---

## Provisionamento de segredos no Docker (Fase 0)

- `docker-compose.yml` usa `env_file: ./backend/.env` no serviço backend — sem isso o container ficava com `JWT_SECRET` undefined e o login retornava 500. **(Produção real usa PM2 + `.env` próprio, não Docker.)**
- Credenciais Twilio (resíduo) **removidas** do `.env`. Se um token desse tipo já esteve versionado/em backup, considere-o comprometido e **rotacione na origem**.

---

## Portal externo — Fase 1: modelo de dados (2026-06-11)

Fundação do portal de atendimento para solicitantes externos (plano completo em `krakion-analise-fable5.md`). **Decisão central: externos NÃO entram no modelo `Usuario`** — o trilho de autenticação será paralelo, sobre o `Solicitante`.

- **`Solicitante` com credenciais próprias**: `email @unique` (identifica a conta), `senhaHash` (null = sem conta), `contaAtiva` default `false` (aprovação manual pela equipe), `emailVerificado`, lockout (`tentativasLogin`/`bloqueadoAte`, mesmo padrão do `Usuario`) e recuperação de senha **já nascendo com hash** (`recuperacaoTokenHash`/`recuperacaoExpira`).
- **A API interna nunca expõe credenciais**: `solicitantes.js` usa `SELECT_PUBLICO` em todas as respostas — `senhaHash` e tokens de recuperação não saem; `contaAtiva` é exposto para a UI. Email duplicado → **409** (P2002 tratado no POST/PUT).
- **`ChamadoComentario.interno`**: `true` = nota interna invisível no portal. Rotas internas exibem tudo; o filtro obrigatório será nas rotas `/api/portal/*` (Fase 2). Autor duplo: `autorId` (interno, agora opcional) XOR `autorSolicitanteId` (externo).
- **Usuário-sistema `portal`**: login `portal`, `ativo: false` (não loga), senha aleatória — criado pelo seed (idempotente). Serve só para `criadoPorId` de chamados de origem portal.

---

## Portal externo — Fase 2: backend `/api/portal/*` (2026-06-11)

Trilho de autenticação paralelo implementado (`routes/portalAuth.js` + `routes/portalChamados.js`, montados no `index.js` ANTES do `autenticar` global):

- **Separação dos trilhos (crítico)**: JWT externo carrega `{ sid, nome, email, tipo: 'externo' }`. O `autenticar.js` interno **rejeita** payload com `tipo: 'externo'` (401); o novo `autenticarExterno` exige `tipo: 'externo'` e injeta `req.solicitante` — token interno é rejeitado nas rotas do portal. Validado por smoke test nos dois sentidos.
- **Isolamento por solicitante**: toda query de `/api/portal/chamados` usa `where { solicitanteId: req.solicitante.sid }`; chamado/anexo alheio → **404** (nunca 403 — mesmo padrão de municípios).
- **Comentários internos invisíveis**: detalhe do portal filtra `interno: false` e exclui anexos vinculados a comentários internos (inclusive no download `GET /portal/chamados/anexos/:aid`). Comentário do portal nasce sempre `interno: false` com `autorSolicitanteId`.
- **Registro/aprovação**: `POST /portal/auth/registrar` (hCaptcha + rate limit 5/15min) cria conta `contaAtiva: false`; login só após admin aprovar via `PATCH /api/solicitantes/:id/conta` (a aprovação zera o lockout). Email que já tem conta → 409.
- **Login com lockout**: 5 falhas → bloqueio 15min (campos `tentativasLogin`/`bloqueadoAte` do `Solicitante`); rate limit 10/15min; `lembrar` → 30d.
- **Recuperação de senha**: mesmo padrão da Fase 0 — token hex 64 com hash SHA-256 no banco (`recuperacaoTokenHash`), expiry 1h, resposta sempre genérica, email só com SMTP configurado; link → `/portal/redefinir-senha`.
- **Uploads do portal**: mesma validação da Fase 0 (whitelist MIME, 5 MB/anexo, 25 MB/chamado, nome sanitizado); parser de 8 MB também em `POST /api/portal/chamados/:id/anexos`; `comentarioId` enviado pelo cliente é ignorado (vínculo só via `pendingAnexoIds`, restrito a anexos soltos do próprio chamado).
- **Resposta enxuta**: listagem/detalhe do portal não expõem prioridade, classificação, vertical, responsável nem origem.
- **Helpers compartilhados**: `hashToken`/`captchaValido`/`criarTransporter` extraídos para `backend/src/lib/authUtils.js` (usados por `auth.js` e `portalAuth.js`).
- **Erros 500 do portal não vazam `err.message`** — respostas genéricas + `console.error` no servidor.
- **Pendência (decisão #1 do plano)**: migrar SQLite → Postgres antes de abrir o portal ao público na internet.

---

## Variáveis de ambiente

**backend/.env**
```
DATABASE_URL="file:./dev.db"
PORT=3001
JWT_SECRET=<string aleatória longa>
JWT_EXPIRES_IN=8h
HCAPTCHA_SECRET=<secret hcaptcha.com — vazio = desativa verificação>
```

**frontend/.env** (não vai ao git)
```
VITE_HCAPTCHA_SITEKEY=10000000-ffff-ffff-ffff-000000000001
```

---

## Credenciais iniciais (seed)

```
login: admin
senha: admin123
```

**Trocar a senha após o primeiro acesso.**

---

## Resetar senha via terminal (emergência)

```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()
bcrypt.hash('novaSenha123', 10).then(hash =>
  prisma.usuario.update({ where: { login: 'admin' }, data: { senhaHash: hash, tentativasLogin: 0, bloqueadoAte: null } })
).then(() => { console.log('Senha resetada!'); prisma.\$disconnect() })
"
```
