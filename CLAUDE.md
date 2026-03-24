# SysGate

Ferramenta interna fullstack para implantadores da SysGate. Gerencia municípios, executa chamadas API via proxy, importa specs Swagger/OpenAPI, envia requisições em lote e organiza scripts.

## Stack

| Camada    | Tecnologia                                                                        |
|-----------|-----------------------------------------------------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS 3 + Zustand 4 + React Router 6                    |
| Backend   | Node.js + Express 4 + Prisma ORM + SQLite                                         |
| Segurança | Helmet.js + express-rate-limit + bcryptjs + jsonwebtoken + hCaptcha               |
| CSV       | Papa Parse (parsing de CSV no frontend)                                           |
| HTTP      | Axios (frontend→backend e backend→APIs)                                           |
| Docker    | docker-compose com 2 serviços (backend + frontend)                                |

## Skills de Desenvolvimento (Superpowers)

Workflow de desenvolvimento adaptado do [obra/superpowers](https://github.com/obra/superpowers):

| Situação | Skill |
|----------|-------|
| Bug reportado, erro inesperado, teste falhando | `skills/superpowers/systematic-debugging.md` |
| Nova feature ou mudança significativa | `skills/superpowers/brainstorming.md` → `writing-plans.md` |
| Implementando qualquer código | `skills/superpowers/test-driven-development.md` |
| Antes de afirmar que algo está funcionando | `skills/superpowers/verification-before-completion.md` |
| Dúvida sobre qual skill usar | `skills/superpowers/using-superpowers.md` |

**Regra geral:** bugs → debug primeiro; nova feature → design primeiro; código → TDD; conclusão → verificar primeiro.

## Estrutura do projeto

```
sysgate/
├── CLAUDE.md                  # Este arquivo
├── docker-compose.yml
├── sysgate.bat                # Gerenciador Windows: iniciar/parar/reiniciar backend+frontend
├── deploy.bat                 # Deploy para produção: git pull + build + pm2 restart no servidor
├── skills/                    # Documentação detalhada por domínio
│   ├── backend.md
│   ├── frontend.md
│   ├── swagger-parser.md
│   ├── fluxos.md
│   ├── banco-de-dados.md
│   └── superpowers/           # Skills de processo (obra/superpowers)
│       ├── using-superpowers.md
│       ├── brainstorming.md
│       ├── writing-plans.md
│       ├── test-driven-development.md
│       ├── systematic-debugging.md
│       └── verification-before-completion.md
├── backend/
│   ├── package.json
│   ├── .env                   # DATABASE_URL, PORT, JWT_SECRET, JWT_EXPIRES_IN, HCAPTCHA_SECRET
│   ├── prisma/
│   │   ├── schema.prisma      # 9 modelos: Script, Tag, Relatorio, Municipio (+ usuarioId), Sistema, Endpoint, Requisicao, SwaggerSpec, Usuario (+ municipios[])
│   │   ├── seed.js            # Dados iniciais + cria usuário admin padrão (admin/admin123)
│   │   └── dev.db             # SQLite (gerado)
│   └── src/
│       ├── index.js           # Express server + Helmet + rate limiter global (200 req/15min)
│       ├── middleware/
│       │   └── autenticar.js  # Verifica JWT Bearer; injeta req.usuario; exporta exigirAdmin
│       └── routes/
│           ├── auth.js        # POST /login (rate limit 10/15min + lockout + hCaptcha) + /logout + /me + /registrar
│           ├── usuarios.js    # CRUD usuários — GET/PUT/PATCH permitidos ao próprio usuário; POST/DELETE somente admin
│           ├── municipios.js  # CRUD (sem codigoIBGE) + PATCH /:id/ativar + tokens por sistema — ESCOPO DO USUÁRIO (cada usuário vê só os seus)
│           ├── sistemas.js    # CRUD sistemas — leitura pública; escrita/exclusão somente admin
│           ├── endpoints.js   # CRUD + importar JSON + Swagger parser + fetch-swagger + limpar-tudo — leitura pública; escrita/exclusão somente admin
│           ├── proxy.js       # POST /executar — proxy para APIs com token; verifica posse do município; extrai idGerado de respostas array e objeto
│           ├── requisicoes.js # GET + DELETE histórico — filtrado por municípios do usuário logado (isolamento por usuário)
│           ├── scripts.js     # CRUD com tags (categoria: script|formula|anotacao) + importar JSON
│           └── relatorios.js  # CRUD + GET /:id/jxrml (download base64→buffer) — modelo Relatorio
└── frontend/
    ├── package.json
    ├── .env                   # VITE_HCAPTCHA_SITEKEY (não vai ao git)
    ├── vite.config.js         # Porta 3000, proxy /api → localhost:3001
    ├── tailwind.config.js     # Paleta "sysgate" índigo/violeta Krakion Labs + safelist [/sysgate/] (obrigatório)
    ├── public/
    │   ├── logo-com-nome.png  # Logo Krakion Labs com nome (uso em dashboards)
    │   └── logo-sem-nome.png  # Logo Krakion Labs sem nome (usada na tela de login)
    └── src/
        ├── main.jsx
        ├── App.jsx            # BrowserRouter: /login pública + PrivateRoute (todas as rotas autenticadas)
        ├── index.css          # Classes Tailwind custom: .btn, .card, .input, .badge, .label
        ├── lib/
        │   └── api.js         # Axios centralizado + interceptor JWT (Bearer) + interceptor 401→logout; exporta scriptsApi e relatoriosApi
        ├── stores/
        │   ├── municipioStore.js  # Zustand + persist (localStorage, key: sysgate-municipio)
        │   └── authStore.js       # Zustand + persist (sysgate-auth) — token + usuario; suporta lembrar (30d); logout limpa sysgate-municipio do localStorage
        ├── components/
        │   ├── Layout.jsx         # Sidebar + barra acento gradiente no topo + header: chip usuário + botão Sair
        │   ├── Sidebar.jsx        # NavLinks com SVG icons; entrada "Usuários" (admin) ou "Meu Perfil" (não-admin) sempre visível
        │   ├── PrivateRoute.jsx   # Redireciona para /login se não autenticado; AdminRoute para role
        │   ├── MunicipioBadge.jsx # Badge do município ativo (alerta vermelho para produção)
        │   ├── SwaggerImport.jsx  # Modal: fetch por URL / upload arquivo / specs salvas / limpar tudo
        │   └── SearchSelect.jsx   # Combobox com busca filtrável (usado em Módulo e Recurso)
        └── pages/
            ├── Login.jsx          # Layout Krakion Labs; hCaptcha após 3 falhas; modal cadastro 2 etapas
            ├── Usuarios.jsx       # Admin: CRUD completo + resetar senha de outros; Não-admin: só próprio perfil (nome + senha)
            ├── Dashboard.jsx      # Cards de módulos com SVG icons + município ativo + últimas requisições
            ├── Municipios.jsx     # CRUD + painel lateral de tokens com gradiente + ícones de ação — dados isolados por usuário
            ├── Sistemas.jsx       # CRUD + painel detalhe com 3 abas + busca de endpoints + ícones de ação — edição/exclusão/import visíveis só para admin
            ├── ClienteAPI.jsx     # Rota: /sandbox — Seletor endpoint + CodeBlock JSON + body editor + proxy
            ├── EnvioLote.jsx      # Upload CSV + toggle sem cabeçalho + mapeamento colunas 2 colunas + envio em lote (array body) + IDs gerados + consulta GET por ID + exportar CSV com IDs
            └── Scripts.jsx        # 4 abas: Scripts BFC / Fórmulas BFC / Anotações / Relatórios (JRXML + fonte dinâmica)
```

## Comandos

```bash
# Backend
cd backend
npm install
npx prisma db push          # Cria/atualiza tabelas no SQLite
node prisma/seed.js         # Popula dados iniciais
npm run dev                 # Inicia com nodemon (porta 3001)

# Frontend
cd frontend
npm install
npm run dev                 # Inicia Vite (porta 3000, proxy → 3001)

# Atalho Windows (duplo clique)
sysgate.bat                 # Menu: Iniciar / Parar / Reiniciar / Status

# Docker
docker-compose up --build
```

## Rotas da API (backend)

> Todas as rotas abaixo de `/api/auth` exigem header `Authorization: Bearer <token>`.

### Autenticação (públicas)
| Método | Rota                  | Descrição                                                        |
|--------|-----------------------|------------------------------------------------------------------|
| POST   | /api/auth/login       | Login — retorna JWT (rate limit 10/15min + lockout)              |
| POST   | /api/auth/logout      | Logout (stateless — cliente descarta token)                      |
| GET    | /api/auth/me          | Retorna dados do usuário logado (requer token)                   |
| POST   | /api/auth/registrar   | Auto-cadastro: cria conta com `ativo: false`, aguarda aprovação  |
| GET    | /api/health           | Health check                                                     |

### Usuários
> **Admin**: acesso completo. **Não-admin**: `GET` retorna só si mesmo; `PUT` e `PATCH /senha` permitidos apenas no próprio id; `POST` e `DELETE` bloqueados (403).

| Método | Rota                        | Descrição                                                              |
|--------|-----------------------------|------------------------------------------------------------------------|
| GET    | /api/usuarios               | Admin: lista todos; não-admin: retorna apenas o próprio registro       |
| POST   | /api/usuarios               | Cria usuário inativo — **somente admin**                               |
| PUT    | /api/usuarios/:id           | Admin: atualiza nome/role/ativo; não-admin: só próprio nome            |
| PATCH  | /api/usuarios/:id/senha     | Admin: redefine qualquer senha; não-admin: só a própria                |
| DELETE | /api/usuarios/:id           | Remove — **somente admin** (impede auto-exclusão e último admin)       |

### Sistemas
> **Leitura pública** (qualquer autenticado), **escrita restrita a admin**.

| Método | Rota              | Descrição                                            |
|--------|-------------------|------------------------------------------------------|
| GET    | /api/sistemas     | Lista todos (com contagem de endpoints e specs)      |
| GET    | /api/sistemas/:id | Detalhe com specs (sem conteúdo JSON)                |
| POST   | /api/sistemas     | Cria sistema — **somente admin**                     |
| PUT    | /api/sistemas/:id | Atualiza — **somente admin**                         |
| DELETE | /api/sistemas/:id | Remove — **somente admin**                           |

### Municípios
> **Isolamento por usuário**: todas as rotas filtram/operam apenas nos municípios do usuário logado (`usuarioId = req.usuario.id`). Tokens também são protegidos — o proxy verifica posse do município antes de executar.

| Método | Rota                                   | Descrição                                                          |
|--------|----------------------------------------|--------------------------------------------------------------------|
| GET    | /api/municipios                        | Lista municípios **do usuário logado**                             |
| GET    | /api/municipios/ativo                  | Retorna o ativo **do usuário logado** (com tokens de sistema)      |
| POST   | /api/municipios                        | Cria município vinculado ao usuário logado (`usuarioId`)           |
| PUT    | /api/municipios/:id                    | Atualiza (somente dono)                                            |
| PATCH  | /api/municipios/:id/ativar             | Ativa (desativa apenas os demais do mesmo usuário)                 |
| DELETE | /api/municipios/:id                    | Remove (somente dono)                                              |
| GET    | /api/municipios/:id/tokens             | Lista tokens (somente dono do município)                           |
| POST   | /api/municipios/:id/tokens             | Upsert token (somente dono do município)                           |
| DELETE | /api/municipios/:id/tokens/:sistemaId  | Remove token (somente dono do município)                           |

### Endpoints / Swagger
> **Leitura pública** (qualquer autenticado), **escrita restrita a admin**.

| Método | Rota                                   | Descrição                                                   |
|--------|----------------------------------------|-------------------------------------------------------------|
| GET    | /api/endpoints                         | Lista (filtro ?modulo=) — todos os usuários                 |
| GET    | /api/endpoints/modulos                 | Lista módulos únicos — todos os usuários                    |
| GET    | /api/endpoints/swagger                 | Lista specs importadas — todos os usuários                  |
| GET    | /api/endpoints/:id                     | Obtém endpoint por ID — todos os usuários                   |
| POST   | /api/endpoints                         | Cria endpoint manual — **somente admin**                    |
| PUT    | /api/endpoints/:id                     | Atualiza — **somente admin**                                |
| DELETE | /api/endpoints/limpar-tudo             | Apaga TODOS endpoints + specs — **somente admin**           |
| DELETE | /api/endpoints/swagger/:id             | Remove spec do histórico — **somente admin**                |
| DELETE | /api/endpoints/:id                     | Remove endpoint — **somente admin**                         |
| POST   | /api/endpoints/importar                | Importa array JSON de endpoints — **somente admin**         |
| POST   | /api/endpoints/importar-swagger        | Importa spec OpenAPI (upload JSON) — **somente admin**      |
| POST   | /api/endpoints/fetch-swagger           | Fetch server-side de URL (suporta HTML do Swagger UI) — **somente admin** |

### Scripts
| Método | Rota                  | Descrição                                    |
|--------|-----------------------|----------------------------------------------|
| GET    | /api/scripts          | Lista scripts (filtro ?categoria=, ?tag=)    |
| GET    | /api/scripts/tags     | Lista tags                                   |
| POST   | /api/scripts          | Cria script com tags                         |
| PUT    | /api/scripts/:id      | Atualiza                                     |
| DELETE | /api/scripts/:id      | Remove                                       |
| POST   | /api/scripts/importar | Importa JSON                                 |

### Relatórios
| Método | Rota                       | Descrição                                        |
|--------|----------------------------|--------------------------------------------------|
| GET    | /api/relatorios            | Lista (filtro ?busca=, ?tag=, ?municipioId=)     |
| GET    | /api/relatorios/:id        | Obtém relatório por ID (sem jxrmlConteudo)       |
| GET    | /api/relatorios/:id/jxrml  | Download do arquivo JRXML (base64 → buffer)      |
| POST   | /api/relatorios            | Cria relatório (com ou sem JRXML anexado)        |
| PUT    | /api/relatorios/:id        | Atualiza                                         |
| DELETE | /api/relatorios/:id        | Remove                                           |

### Outros
| Método | Rota                  | Descrição                                                                     |
|--------|-----------------------|-------------------------------------------------------------------------------|
| POST   | /api/proxy/executar   | Executa requisição via proxy — verifica posse do município antes de usar token |
| GET    | /api/requisicoes      | Histórico do usuário logado (filtro ?municipioId=) — isolado por usuário      |
| DELETE | /api/requisicoes      | Limpa histórico do usuário logado (filtro ?municipioId=) — isolado por usuário |

## Segurança — padrões e decisões

### Autenticação JWT
- Token JWT com expiração `JWT_EXPIRES_IN=8h` (configurável no `.env`)
- `JWT_SECRET` deve ser string longa e aleatória — gerar com `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Payload do token: `{ id, login, nome, role }` — injetado em `req.usuario` pelo middleware
- Interceptor Axios no frontend: adiciona `Authorization: Bearer <token>` em toda requisição; 401 → logout automático + redirect para `/login`
- **authStore**: Zustand + persist (`sysgate-auth`) — persiste apenas `token` e `usuario`

### Proteção de rotas
- `autenticar.js`: middleware global aplicado em `index.js` APÓS montar `/api/auth` e `/api/health`
- `PrivateRoute`: redireciona para `/login` se não autenticado
- `AdminRoute`: redireciona para `/` se role !== 'admin' — usado apenas onde necessário (ex: futuras rotas exclusivas)
- Sidebar: exibe "Usuários" para admin e "Meu Perfil" para não-admin; a rota `/usuarios` é acessível a todos autenticados, mas a página se adapta ao role

### Isolamento de dados por usuário (multi-tenant)
- **Municípios e tokens**: o campo `usuarioId Int?` em `Municipio` vincula cada município ao seu criador
  - Todas as queries de `municipios.js` filtram por `WHERE usuarioId = req.usuario.id`
  - Helper `verificarDono(id, usuarioId)` retorna `null` se o município não pertencer ao usuário → 404
  - Ativação (`PATCH /:id/ativar`) desativa apenas os municípios do mesmo usuário, não todos
  - Operações de token (`GET/POST/DELETE /:id/tokens`) verificam posse do município via `verificarDono`
  - Proxy (`POST /executar`) verifica `municipioId` pertence ao usuário antes de buscar o token no banco — impede uso indevido de tokens alheios (403)
- **Sistemas e endpoints**: globais (sem dono), mas escrita/exclusão restrita a admin via `exigirAdmin`
  - `sistemas.js`: GET público; POST/PUT/DELETE exigem `exigirAdmin`
  - `endpoints.js`: GET público; POST/PUT/DELETE/importar/fetch-swagger/importar-swagger exigem `exigirAdmin`
  - `Sistemas.jsx`: botões "Novo Sistema", editar/excluir sistema, importar Swagger, editar endpoint visíveis **apenas para admin** (`isAdmin = usuario?.role === 'admin'`)
- **Histórico de requisições**: `requisicoes.js` sempre filtra `WHERE municipio.usuarioId = req.usuario.id` — cada usuário vê e limpa apenas o próprio histórico, mesmo sem filtro de município
- **Logout seguro**: `authStore.logout()` limpa `localStorage.removeItem('sysgate-municipio')` para evitar que o próximo usuário (no mesmo browser) veja dados do anterior
- **Migração**: ao adicionar `usuarioId` ao schema, municípios existentes com `null` devem ser atribuídos ao admin com o script abaixo

```bash
# Migrar municípios sem dono para o primeiro admin ativo
cd backend
node -e "
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
prisma.usuario.findFirst({ where: { role: 'admin', ativo: true } })
  .then(admin => prisma.municipio.updateMany({ where: { usuarioId: null }, data: { usuarioId: admin.id } }))
  .then(r => { console.log('Migrados:', r.count); prisma.\$disconnect() })
"
```

### Rate limiting
- **Global**: 200 req/15min por IP (todas as rotas)
- **Login**: 10 tentativas/15min por IP (`skipSuccessfulRequests: true`)
- Resposta 429 com mensagem em português

### Lockout de conta
- Campos no modelo `Usuario`: `tentativasLogin Int @default(0)` e `bloqueadoAte DateTime?`
- 5 falhas consecutivas → bloqueio de 15 minutos
- Login bem-sucedido → zera `tentativasLogin` e `bloqueadoAte`
- Mensagem de bloqueio exibe minutos restantes

### hCaptcha
- Aparece no frontend após **3 falhas consecutivas** de login
- Sitekey configurada em `frontend/.env` → `VITE_HCAPTCHA_SITEKEY`
- Backend verifica token via `fetch('https://hcaptcha.com/siteverify')` — só se `HCAPTCHA_SECRET` estiver no `.env`
- Sitekey de teste (dev sem cadastro): `10000000-ffff-ffff-ffff-000000000001`
- Para produção: registrar em hcaptcha.com, adicionar domínio da VPS

### Aprovação de contas
- `POST /api/auth/registrar` (auto-cadastro público) e `POST /api/usuarios` (admin) criam com `ativo: false`
- Usuário não consegue logar até admin ativar via `PUT /api/usuarios/:id` com `{ ativo: true }`
- UI exibe aviso em âmbar ao criar novo usuário
- Impede desativar/excluir o último admin ativo

### "Manter conectado"
- Checkbox na tela de login; envia `{ lembrar: true }` para o backend
- Backend: `expiresIn = lembrar ? '30d' : (JWT_EXPIRES_IN || '8h')`
- Implementado em `authStore.login(loginStr, senha, hcaptchaToken, lembrar)`

### Senhas
- bcryptjs com salt rounds 10
- Endpoint separado `PATCH /api/usuarios/:id/senha` para troca de senha
- Mínimo 6 caracteres validado no backend

### Variáveis de ambiente (backend/.env)
```
DATABASE_URL="file:./dev.db"
PORT=3001
JWT_SECRET=<string aleatória longa — gerar com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=8h
HCAPTCHA_SECRET=<secret do hcaptcha.com — deixar vazio para desativar verificação>
```

### Variáveis de ambiente (frontend/.env — não vai ao git)
```
VITE_HCAPTCHA_SITEKEY=10000000-ffff-ffff-ffff-000000000001  # chave de teste
# Para produção: registrar em hcaptcha.com e substituir pela sitekey real
```

### Credenciais iniciais (seed)
```
login: admin
senha: admin123
```
**Trocar a senha após o primeiro acesso.**

### Resetar senha via terminal (emergência)
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

---

## Identidade Visual — Krakion Labs

A UI usa a marca **Krakion Labs** com paleta de **índigo/violeta** (estilo Linear.app) mapeada na chave `sysgate` do Tailwind:

| Token         | Hex       | Uso principal                          |
|---------------|-----------|----------------------------------------|
| sysgate-600   | `#4f46e5` | Botões primários, links, foco          |
| sysgate-700   | `#4338ca` | Hover de botões                        |
| sysgate-500   | `#6366f1` | Acentos, ícones ativos                 |
| sysgate-100   | `#e0e7ff` | Badges, hover de itens                 |
| sysgate-50    | `#eef2ff` | Fundos suaves de itens selecionados    |

- **Logos**: `frontend/public/logo-sem-nome.png` (tela de login) e `logo-com-nome.png` (uso geral)
- **Tela de login**: gradiente `from-indigo-50 via-white to-violet-50`, logo centralizada, card branco com sombra
- **Modal de cadastro**: 2 etapas — (1) nome/login/senha → POST `/api/auth/registrar` → (2) tela de sucesso informando aguarda ativação
- A paleta `sysgate` NÃO foi renomeada no Tailwind para não quebrar todos os componentes existentes que usam `sysgate-600`, `sysgate-700` etc.

---

## Padrões importantes

- **Tailwind safelist obrigatório**: `tailwind.config.js` tem `safelist: [{ pattern: /sysgate/ }]` — sem isso, `@apply bg-sysgate-600` falha no `index.css` porque o JIT não gera a classe antes do `@layer components` ser processado. NÃO remover. A paleta `sysgate` usa índigo/violeta Krakion Labs (sysgate-600 = `#4f46e5`).
- **Rotas nomeadas ANTES de /:id** no Express (ex: `/swagger`, `/limpar-tudo` devem vir antes de `/:id`)
- **bodySchema** é armazenado como `String` (JSON serializado) no SQLite, parseado/stringificado manualmente
- **Sentinel `_exemplo`** no bodySchema: o primeiro elemento `{ _exemplo: true, json: {...} }` contém o exemplo completo do request body da spec. Frontend filtra com `.filter(c => !c._exemplo)`
- **Swagger parser** resolve `$ref`, `allOf`, `anyOf/oneOf` com limite de 5 níveis de profundidade
- **Array bodies**: quando o requestBody é `type: array`, os campos são extraídos do `items`
- **HTML auto-detection**: `/fetch-swagger` detecta se a URL retornou HTML do Swagger UI e tenta extrair o URL do JSON automaticamente
- **Sistema urlBase**: NÃO deve terminar com `/api` ou `/api/` — os paths dos endpoints importados do Swagger já incluem `/api/...`. URL final = `urlBase + endpoint.path`. Ex correto: `https://tributos.betha.cloud/service-layer-tributos`. Ex errado: `...service-layer-tributos/api` → URL ficaria `...api/api/imoveis` (duplo `/api`) → 404 no Betha.
- **Zustand persist**: município ativo persiste em `localStorage` (key: `sysgate-municipio`)
- **Município sem codigoIBGE**: campo removido do schema, validação e UI — apenas `nome` e `observacoes`
- **Tokens por município**: painel lateral em `Municipios.jsx` — abre ao clicar na linha da tabela; um token por par (município × sistema). Campo `ambiente` removido da UI (default `"producao"` no banco). Painel exibe token mascarado (primeiros 8 chars + `••••`) com botão de olho para revelar e botão de copiar. Backend retorna token real (sem mascaramento). Tokens isolados por usuário — o proxy verifica `usuarioId` antes de executar
- **Municípios isolados por usuário**: campo `usuarioId Int?` em `Municipio`; queries sempre filtradas por `req.usuario.id`. Municípios de outros usuários são invisíveis e inacessíveis (404 em vez de 403 para não vazar informação de existência)
- **Swagger exclusivo em Sistemas**: `SwaggerImport` só é usado em `Sistemas.jsx` — aba Specs ou botão na aba Informações; `Sandbox (ClienteAPI.jsx)` não tem mais esse botão; botões de importação visíveis **apenas para admin**
- **Painel detalhe Sistemas**: 3 abas — Informações (stats + editar + importar swagger), Specs (listar/remover specs), Endpoints (listar/editar endpoints do sistema); ações de escrita visíveis **apenas para admin** (`isAdmin = useAuthStore(state => state.usuario)?.role === 'admin'`)
- **idGerado no proxy**: `proxy.js` extrai `idGerado` de resposta array (mapeia `item.id ?? item.idGerado ?? item.idEconomico ?? item.idLote`, filtra nulos, une com vírgula) e de objeto simples (`.id`, `.idGerado`, `.idEconomico`). Salvo no histórico de requisições.
- **Relatórios JRXML**: `Relatorio.jxrmlConteudo` armazena o arquivo como base64 no SQLite. A listagem (`GET /`) omite o campo por performance — apenas `temJxrml: bool`. Download via `GET /:id/jxrml` faz `Buffer.from(base64)` → `Content-Type: application/octet-stream`. Frontend faz download via `atob()` → `Uint8Array` → `Blob`.
- **Scripts BFC vs Relatórios**: `Script` (modelo) cobre categorias `script`, `formula`, `anotacao` — exibidas em 3 das 4 abas de Scripts.jsx. `Relatorio` é modelo separado, exibido na 4ª aba, com suporte a JRXML + scriptFonte (fonte dinâmica BFC).
- **UI — padrões visuais consistentes**: header com barra acento vertical (`w-1 h-6 rounded-full bg-sysgate-600`); botões de ação como ícones SVG (pencil/trash) em vez de texto; painel lateral com cabeçalho gradiente (`from-white to-sysgate-50/30`) + label "X selecionado" + botão X para fechar.

## UI — Sandbox e EnvioLote (padrões compartilhados)

Ambas as telas seguem o mesmo padrão de interação para seleção de endpoints e campos:

### Seleção de Módulo e Recurso — SearchSelect
- Componente `SearchSelect.jsx` substitui o `<select>` estático
- Exibe campo de texto; ao focar mostra **lista completa**
- Ao digitar filtra por substring, **insensível a acentos** (normaliza NFD)
  - Ex: digitar "eco" encontra "econômicos", "Econômicos", etc.
- Item selecionado fica destacado (fundo `sysgate-100`)
- Opção "— Limpar seleção —" aparece no topo quando há valor selecionado
- Prop `disabled` bloqueia interação (ex: Recurso fica desabilitado sem Módulo escolhido)

### Agrupamento de Recursos — nomeRecurso()
- Função `nomeRecurso(ep, moduleBase)` extrai nome legível do endpoint
  - Prefere o trecho após " - " no nome (ex: "Econômicos - Informação Complementar" → "Informação Complementar")
  - Fallback: último segmento do path em camelCase, sem o prefixo do módulo
- `recursos` (useMemo): deduplica endpoints do mesmo path, prefere path sem `{params}` (coleção > item)
- Clicar em um método button após selecionar recurso atualiza `endpointSel` para o endpoint com aquele método + path

### Botões de Método HTTP
- Renderizados como `<button>` com cores semânticas: GET=azul, POST=verde, PUT=amarelo, PATCH=laranja, DELETE=vermelho
- Estado ativo: fundo sólido com texto branco (`METODO_ACTIVE`)
- Estado inativo: borda cinza fina, hover sutil
- Ao clicar: atualiza `metodo` e busca `endpointSel` pelo par path+método

### Seletor de campos do Body — schemaExpanded
- `schema`: campos do `bodySchema` sem o sentinel `_exemplo`
- `schemaExpanded` (useMemo): expande campos `tipo === 'object'` usando as chaves do `_exemplo.json`
  - Cada sub-campo vira entrada com `campo: "parent.subKey"`, `_displayCampo: "subKey"`, `_parent: "parent"`
  - Sub-campos de tipo `object` aninhado (2+ níveis) não são expandidos automaticamente — ficam como `object` simples
  - Campos sem exemplo ou cujo valor de exemplo não seja objeto ficam como entrada única
  - **`idGerado` especial**: quando o exemplo da spec é `{id: N}`, o sub-campo recebe `tipo: 'number'` e `_wrapAsIdObject: true`. O input exibe apenas o número `N`, mas ao enviar é reembalado como `{ id: N }` conforme esperado pela API
- Layout 2 colunas:
  - **Esquerda**: lista com checkboxes; campos filhos ficam indentados (`ml-3`) sob cabeçalho de seção `UPPERCASE` do parent
  - **Direita** (Sandbox): campos marcados + inputs de valor + preview JSON verde em tempo real
  - **Direita** (EnvioLote): campos marcados + `<select>` da coluna CSV correspondente + preview das primeiras 2 linhas
- Auto-switch para "JSON raw": apenas quando há campos `array<...>` (não mais para `object`)
- Reconstrução do body ao enviar: campos `number`/`integer` → `Number(val)`; campos `_wrapAsIdObject` → `{ id: Number(val) }`; campos `_parent` → `body[_parent][_displayCampo]`

### Auto-mapeamento CSV (EnvioLote)
- Ao fazer upload do CSV, compara `_displayCampo` (nome curto do sub-campo) com o nome da coluna CSV (case-insensitive)
- Se houver match: pré-seleciona o checkbox e pré-preenche o dropdown

## EnvioLote — padrões específicos

### CSV sem cabeçalho
- Toggle "Sem cabeçalho" na seção 5 do formulário
- Estados: `csvArquivo` (guarda o `File` para re-parse) + `csvSemCabecalho` (boolean)
- `useEffect` com deps `[csvArquivo, csvSemCabecalho]` re-parseia o arquivo ao mudar o toggle
- Com `csvSemCabecalho: false` → PapaParse com `header: true`, colunas = `meta.fields`
- Com `csvSemCabecalho: true` → PapaParse com `header: false`, colunas geradas automaticamente como letras `A`, `B`, `C`, ... (até 26; depois `Col1`, `Col2`, ...)
- Dropdown de mapeamento exibe: `A — valor` (sem cabeçalho) ou `NomeColuna — valor` (com cabeçalho)
- Tabela de preview: cabeçalho = letras das colunas, linhas = dados do CSV (não transposto)

### Envio em lote (array body)
- **Não envia uma requisição por linha** — agrupa linhas em batches e envia um array JSON por batch
- `tamanhoBatch` (state, padrão 50): configurável via slider 1–200 na seção 6
- `delayLotes` (state, padrão 0): delay em ms entre batches, configurável via slider
- `construirBodyLinha(linha)`: função extraída que monta o body de uma linha CSV → objeto JS
- `iniciarEnvio`: divide `linhas` em grupos de `tamanhoBatch`, envia cada grupo como array `[{...}, {...}, ...]`
- Botão exibe: `▶ Iniciar envio (N lotes · M itens)`
- Barra de progresso exibe: `Lote X/Y`
- Log exibe por entrada: `Lote X/Y · N itens`, status badge, mensagem de resposta, IDs gerados

### IDs gerados por lote
- Backend (`proxy.js`): extrai `idGerado` de respostas array (join de todos os IDs por vírgula) e de objetos (campo `id`/`idGerado`/`idEconomico`)
- Frontend: extrai `idsGerados[]` da resposta de cada batch — suporta array de objetos e resposta única
- **Badges por ID**: cada ID gerado exibe um badge com split-button:
  - Lado esquerdo: copia o ID para clipboard
  - Lado direito `▼ GET`: dispara consulta GET para `pathCustom/{id}` via proxy
- **Painel de resultado**: expande abaixo do badge com JSON destacado (syntax highlight) + statusCode
- `consultasResultado` (state): `{ [chave]: { consultando, aberto, statusCode, data } }` onde `chave = "${loteIdx}-${idIdx}"`
- Após conclusão: contador `X IDs gerados` na barra de progresso + botão "Copiar N IDs" (copia todos separados por vírgula)
- Painel "IDs gerados" ao final: lista todos os IDs de todos os batches agrupados

### Syntax highlight JSON (EnvioLote)
- Função `highlightJson(obj)`: `JSON.stringify(obj, null, 2)` + regex colorizer via `dangerouslySetInnerHTML`
- Cores: chaves = azul, strings = verde, números = amarelo, booleanos = roxo, `null`/comentários = cinza itálico
- Preview de bodies: fundo `bg-gray-950`, max-h 320px com scroll, mostrando até 5 exemplos com contador `mostrando X/Y`

### Exportar CSV com IDs
- Botão "Exportar CSV" gera arquivo com colunas: `lote`, `itens`, `status`, `mensagem`, `ids_gerados` (vírgula-separados), `total_ids`
- Disponível após conclusão do envio

---

## Deploy — VPS Hostinger

**Servidor:** 187.77.230.138 | **Domínio:** krakionlabs.cloud | **OS:** Ubuntu 24.04 LTS
**Repositório:** https://github.com/felipecsilba/SysGate | **Diretório:** `/var/www/krakion`

### Stack de produção
- **PM2** — gerencia o processo Node.js do backend (reinicia automaticamente)
- **Nginx** — serve o frontend (`/dist`) e faz proxy `/api` → porta 3001
- **Let's Encrypt (Certbot)** — certificado SSL gratuito (HTTPS)

### Comandos úteis na VPS (via SSH)

```bash
# Conectar
ssh root@187.77.230.138

# Status do backend
pm2 status
pm2 logs krakion-backend

# Parar tudo (site fica fora do ar)
pm2 stop krakion-backend && systemctl stop nginx

# Religar tudo
pm2 start krakion-backend && systemctl start nginx

# Atualizar após git push
cd /var/www/krakion && git pull && cd frontend && npm run build && cd ../backend && pm2 restart krakion-backend

# Renovar SSL (automático, mas pode forçar)
certbot renew
```

### Configuração do Nginx
Arquivo: `/etc/nginx/sites-available/krakion`
```nginx
server {
    listen 80;
    server_name krakionlabs.cloud www.krakionlabs.cloud;
    root /var/www/krakion/frontend/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Variáveis de ambiente na VPS
Arquivo: `/var/www/krakion/backend/.env`
```
DATABASE_URL="file:./dev.db"
PORT=3001
JWT_SECRET=krakion_secret_super_seguro_2026
JWT_EXPIRES_IN=8h
```
