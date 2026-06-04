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
- Resposta 429 com mensagem em português

---

## Lockout de conta

- Campos no modelo `Usuario`: `tentativasLogin Int @default(0)` e `bloqueadoAte DateTime?`
- 5 falhas consecutivas → bloqueio de 15 minutos
- Login bem-sucedido → zera `tentativasLogin` e `bloqueadoAte`
- Mensagem de bloqueio exibe minutos restantes

---

## hCaptcha

- Aparece no **frontend** após 3 falhas consecutivas de login
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
