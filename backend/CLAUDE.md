# Backend do Krakion

Express 4 + Prisma + PostgreSQL. Atende o Krakion web (porta 3001; produção na VPS via PM2)
e o Krakion App, que roda este mesmo código como processo filho (porta 3101, `KRAKION_DESKTOP=1`).

- Rotas: `docs/api.md`. Regras de cada módulo: `docs/<módulo>.md`.
- Skills: `banco-de-dados`, `backend`, `seguranca`, `betha-api`, `swagger-parser`.

## Comandos

```bash
npm install
npx prisma db push          # cria/atualiza tabelas no PostgreSQL
node prisma/seed.js         # dados iniciais + admin/admin123 + usuário-sistema "portal" — DESTRUTIVO: apaga municípios/scripts/endpoints
node prisma/seed-regras-checagem.js   # regras da Checagem (idempotente) — rodar na VPS após mudar
npm run dev                 # nodemon, porta 3001
npm test                    # node --test "src/**/*.test.js"
```

`.env`: `DATABASE_URL`, `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `HCAPTCHA_SECRET`,
`SMTP_HOST/PORT/SECURE/USER/PASS/FROM`, `APP_URL`, `CORS_ORIGINS` (opcional), `HOST` (o App usa `127.0.0.1`).

## Regras do banco

- **Banco PostgreSQL (migrado de SQLite em 2026-06-11)**: regras obrigatórias — (1) toda rota usa `const prisma = require('../lib/prisma')`, **nunca** `new PrismaClient()` (cada instância abre um pool; esgota conexões); (2) todo `contains` de busca leva `mode: 'insensitive'` (Postgres é case-sensitive por padrão; SQLite não era); (3) `$queryRaw` em sintaxe Postgres com identificadores entre aspas (`"Chamado"`, `"criadoEm"`). Campos JSON continuam `String` com parse/stringify manual. Detalhes na skill `banco-de-dados`. O setup Docker (`docker-compose.yml`) ainda **não** foi atualizado para Postgres — produção usa PM2.
- `prisma/schema.prisma`: 28 modelos. Mudança no schema também chega ao banco do Krakion App na próxima abertura (`db push` sem `--accept-data-loss`).
- `prisma/migrar-sqlite-postgres.js` e `prisma/dev.db` são legado da migração (Node ≥ 22.5). `prisma/backfill-numero.js` preencheu `Chamado.numero`.

## Regras de rota

- **Rotas nomeadas ANTES de /:id** no Express (ex.: `/swagger`, `/limpar-tudo`, `/ordem`, `/estatisticas`, `/dashboard` vêm antes de `/:id`).
- Leitura pública e escrita só admin (`exigirAdmin`): sistemas, endpoints, portfólio, catálogo. Isolado por usuário: municípios, tokens, histórico de requisições, notas. Global: chamados, solicitantes, conhecimento, checagem.
- `express.json` global de `1mb`; parser de `8mb` só nas rotas de anexo (interno e portal); `importar-swagger` aceita até 32 MB.

## Segurança — regras ativas

Documentação completa na skill `seguranca`.

- **JWT**: middleware `autenticar.js` aplicado APÓS `/api/auth` e `/api/health`; payload `{ id, login, nome, role }`; interceptor 401 → logout + redirect
- **Roles**: `admin` = acesso total; não-admin = apenas próprios dados; middleware `exigirAdmin` protege escrita global
- **Multi-tenant**: municípios sempre filtrados por `req.usuario.id`; municípios alheios retornam 404 (não 403); proxy verifica ownership antes de usar token
- **Lockout**: 5 falhas → bloqueio 15min; hCaptcha aparece no frontend após 3 falhas
- **Contas novas**: criadas com `ativo: false`; admin ativa via `PUT /api/usuarios/:id`
- **Credenciais seed**: `admin / admin123` — trocar após primeiro acesso
- **Portal externo**: trilho JWT paralelo (`tipo: 'externo'` + `sid`); `autenticar` rejeita token externo e `autenticarExterno` rejeita interno. Histórico das fases em `docs/chamados.md`.
- **CORS (vuln #8, 2026-06-12)**: `cors()` aberto substituído por allowlist — por padrão nenhuma origem cross-origin é permitida (frontend é same-origin via Vite proxy/Nginx); origens extras via env `CORS_ORIGINS` (separadas por vírgula). Requisições sem header `Origin` (same-origin, curl) seguem permitidas.
- **Senha mínima 8 (vuln #9, 2026-06-12)**: aplicada em registro interno, redefinição por token, CRUD de usuários (admin) e registro/redefinição do portal. Senhas existentes seguem válidas no login.
- **Fase 0 (hardening de segurança)**: (1) credenciais Twilio removidas do `.env`; `JWT_SECRET` provisionado no container via `env_file: ./backend/.env` no `docker-compose.yml`. (2) `numero` de chamado persistido (ver "Chamados — numeração" em `docs/chamados.md`). (3) Upload de anexos validado em `chamados.js`: whitelist de MIME (PNG/JPEG/GIF/WebP/PDF → 415), 5 MB/anexo + 25 MB/chamado (tamanho real calculado do base64 → 413), nome sanitizado; `express.json` global reduzido para `1mb`, com parser de `8mb` só na rota de anexos (`index.js`). (4) Token de recuperação armazenado como **hash SHA-256** (`hashToken`); `/esqueci-senha` sempre retorna resposta genérica (não vaza usuário sem email); `/registrar` com `registroRateLimit` (5/15min) + hCaptcha. (5) Nginx repassa `X-Forwarded-For` para o rate limit por IP. Error handler global respeita `err.status` (413 propaga) e não vaza mais `detail`/`err.message`.
- **Ação manual pendente**: rotacionar o token Twilio no painel da Twilio (esteve em texto puro no `.env`).

## `src/lib/` — regras puras e helpers

| Arquivo | O que faz |
|---|---|
| `prisma.js` | Instância **única** do PrismaClient |
| `authUtils.js` | `hashToken` (SHA-256), `captchaValido`, `criarTransporter` (SMTP) — auth interno e portal |
| `numeroChamado.js` | `prefixoMunicipio()` + `gerarNumero()` — protocolo `PREFIXO-YYYY-NNNNN` em transação |
| `checagem.js` | Motor de spec da Checagem Por API: `achatarCampos()`, `validarPayload()` |
| `regrasChecagem.js` | Motor de regras: `avaliarRegras()`, `vazio()` (0 = ausência), `desembrulhar()` (enum `{valor,descricao}`) |
| `parseEntrada.js` | Parser tolerante: array, envelope `{data}`, JSONL, log do Studio com hora |
| `setupLocal.js` | Conta local do Krakion App: só com `KRAKION_DESKTOP=1` e banco vazio |
| `importacaoWeb.js` / `clienteKrakionWeb.js` | Importação VPS → App (regras puras) e cliente HTTP da VPS |
| `mascararHeaders.js` | `Authorization` → `Bearer abcdef12••••` no histórico |
| `swaggerSpec.js` | `metadadosSpec(spec)` → versão, urlBase, título (OpenAPI 3 e Swagger 2) |

`src/routes/`: uma rota por módulo (lista em `docs/api.md`). `importacao.js` só existe para o
Krakion App (admin). `portalAuth.js` e `portalChamados.js` formam o portal externo.
`src/index.js`: Helmet, CORS allowlist, rate limit global (50000 req/15min), monta
`/api/portal/*` antes do `autenticar` global.

## Testes

- **Testes**: `npm test` roda `node --test "src/**/*.test.js"` (runner nativo do Node, sem dependência) — 77 no total: `checagem.test.js` (19, motor de spec), `regrasChecagem.test.js` (19, motor de regras + regras do seed contra o formato real da fonte), `parseEntrada.test.js` (10), `setupLocal.test.js` (3), `importacaoWeb.test.js` (14), `clienteKrakionWeb.test.js` (4), `swaggerSpec.test.js` (3) e `mascararHeaders.test.js` (5). O `desktop/` tem seus próprios testes.
