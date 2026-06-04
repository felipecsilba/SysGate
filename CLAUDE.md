# SysGate

Ferramenta interna fullstack para implantadores da SysGate. Gerencia municípios, executa chamadas API via proxy, importa specs Swagger/OpenAPI, envia requisições em lote, organiza scripts e mantém o portfólio de clientes (municípios atendidos com entidades, sistemas e contatos).

## Stack

| Camada    | Tecnologia                                                                        |
|-----------|-----------------------------------------------------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS 3 + Zustand 4 + React Router 6 + Recharts         |
| Backend   | Node.js + Express 4 + Prisma ORM + SQLite                                         |
| Segurança | Helmet.js + express-rate-limit + bcryptjs + jsonwebtoken + hCaptcha               |
| CSV       | Papa Parse (parsing de CSV no frontend)                                           |
| HTTP      | Axios (frontend→backend e backend→APIs)                                           |
| Gráficos  | Recharts (BarChart, PieChart, AreaChart — usado no Dashboard de Chamados)         |
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
│   │   ├── schema.prisma      # 20 modelos: Script, Tag, Relatorio, Municipio (+ usuarioId), MunicipioSistema (+ dataVencimento), Sistema, Endpoint, Requisicao, SwaggerSpec, Usuario, PortfolioMunicipio, Entidade, EntidadeSistema (+ vertical), Stakeholder, StakeholderSistema, CatalogoVertical, Chamado, ChamadoComentario, ChamadoAnexo, ChamadoHistorico
│   │   ├── seed.js            # Dados iniciais + cria usuário admin padrão (admin/admin123)
│   │   └── dev.db             # SQLite (gerado)
│   └── src/
│       ├── index.js           # Express server + Helmet + rate limiter global (50000 req/15min)
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
│           ├── relatorios.js  # CRUD + GET /:id/jxrml (download base64→buffer) — modelo Relatorio
│           ├── portfolio.js   # CRUD Portfólio — PortfolioMunicipio + Entidade + EntidadeSistema + Stakeholder (M2M) — leitura pública; escrita/exclusão somente admin
│           ├── catalogo.js   # CRUD CatalogoVertical — verticais Betha com nome/cor/sistemas/ordem; seed automático na 1ª chamada GET — leitura pública; escrita somente admin
│           └── chamados.js   # CRUD Chamados + comentários + anexos + histórico de alterações + dashboard agregado; acesso público (autenticados); DELETE somente admin
└── frontend/
    ├── package.json
    ├── .env                   # VITE_HCAPTCHA_SITEKEY (não vai ao git)
    ├── vite.config.js         # Porta 3000, proxy /api → localhost:3001; manualChunks: recharts, papaparse, react-vendor, app-vendor
    ├── tailwind.config.js     # Paleta "sysgate" índigo/violeta Krakion Labs + safelist [/sysgate/] (obrigatório)
    ├── public/
    │   ├── logo-com-nome.webp # Logo Krakion Labs com nome (uso em dashboards) — WebP 500px, 48 KB
    │   └── logo-sem-nome.webp # Logo Krakion Labs sem nome (usada na tela de login) — WebP 500px, 40 KB
    └── src/
        ├── main.jsx
        ├── App.jsx            # BrowserRouter: /login pública + PrivateRoute; todas as páginas carregadas com React.lazy + Suspense (code splitting por rota)
        ├── index.css          # Classes Tailwind custom: .btn, .card, .input, .badge, .label
        ├── lib/
        │   └── api.js         # Axios centralizado + interceptor JWT (Bearer) + interceptor 401→logout; exporta scriptsApi, relatoriosApi, portfolioApi, catalogoApi e chamadosApi
        ├── stores/
        │   ├── municipioStore.js  # Zustand + persist (localStorage, key: sysgate-municipio)
        │   └── authStore.js       # Zustand + persist (sysgate-auth) — token + usuario; suporta lembrar (30d); logout limpa sysgate-municipio do localStorage
        ├── components/
        │   ├── Layout.jsx         # Sidebar + barra acento gradiente no topo + header: chip usuário + botão Sair
        │   ├── Sidebar.jsx        # NavLinks com SVG icons; entrada "Usuários" (admin) ou "Meu Perfil" (não-admin) sempre visível
        │   ├── PrivateRoute.jsx   # Redireciona para /login se não autenticado; AdminRoute para role
        │   ├── MunicipioBadge.jsx # Badge do município ativo (alerta vermelho para produção)
        │   ├── SwaggerImport.jsx  # Modal: fetch por URL / upload arquivo / specs salvas / limpar tudo
        │   ├── SearchSelect.jsx   # Combobox com busca filtrável (usado em Módulo e Recurso)
        │   ├── ConfirmDialog.jsx  # Modal de confirmação genérico — substitui window.confirm()
        │   ├── CopyButton.jsx     # Botão copiar com feedback "Copiado!" por 2s
        │   ├── JsonHighlight.jsx  # Syntax highlight JSON dark/light; exporta highlightJson e highlightJsonLight
        │   ├── MethodBadge.jsx    # Badge colorido por método HTTP (GET=azul, POST=verde, PUT=amarelo, PATCH=laranja, DELETE=vermelho)
        │   ├── StatusBadge.jsx    # Badge colorido por status code HTTP (2xx=verde, 3xx=azul, 4xx=amarelo, 5xx=vermelho)
        │   └── Toast.jsx          # Notificação inline reutilizável (success/info/warning/error)
        └── pages/
            ├── Login.jsx          # Layout Krakion Labs; hCaptcha após 3 falhas; modal cadastro 2 etapas
            ├── Usuarios.jsx       # Admin: CRUD completo + resetar senha de outros; Não-admin: só próprio perfil (nome + senha)
            ├── Dashboard.jsx      # Cards de módulos com SVG icons + município ativo + últimas requisições
            ├── Municipios.jsx     # CRUD + painel lateral de tokens com gradiente + ícones de ação — dados isolados por usuário
            ├── Sistemas.jsx       # CRUD + painel detalhe com 3 abas + busca de endpoints + ícones de ação — edição/exclusão/import visíveis só para admin
            ├── ClienteAPI.jsx     # Rota: /sandbox — Seletor endpoint + CodeBlock JSON + body editor + proxy
            ├── Scripts.jsx        # 4 abas: Scripts BFC / Fórmulas BFC / Anotações / Relatórios (JRXML + fonte dinâmica)
            ├── Portfolio.jsx      # re-export → Portfolio/index.jsx
            ├── Portfolio/
            │   ├── index.jsx               # Componente principal — layout 2 colunas, CRUD, modais inline
            │   ├── AccordionEntidade.jsx   # Accordion de entidade com sistemas por vertical e stakeholders
            │   ├── ModalGerenciarSistemas.jsx # Modal picker do Catálogo Betha (chips por vertical)
            │   ├── ModalCatalogo.jsx       # Modal admin para configurar verticais/sistemas do catálogo
            │   └── utils.js               # CORES_VERTICAIS, corVertical(), hexToRgb()
            ├── EnvioLote.jsx      # re-export → EnvioLote/index.jsx
            ├── EnvioLote/
            │   ├── index.jsx               # Componente principal — upload CSV, mapeamento, envio em lote
            │   ├── CsvPreview.jsx          # Tabela de preview do CSV carregado
            │   ├── BatchProgress.jsx       # Progresso/resultados de lotes + consultas GET por ID
            │   └── utils.js               # extrairIds(), nomeRecurso(), highlightJson()
            ├── Chamados.jsx       # re-export → Chamados/index.jsx
            ├── Chamados/
            │   ├── index.jsx               # Componente principal — lista, detalhe, filtros
            │   ├── ChamadosDashboard.jsx   # Dashboard Recharts (AreaChart, PieChart, BarChart)
            │   ├── PainelHistorico.jsx     # Painel lateral de histórico de alterações (timeline)
            │   ├── ModalChamado.jsx        # Modal criar/editar chamado
            │   └── constants.js           # STATUS_CORES, CLASSIF_CORES, PRIORIDADE_CORES, helpers
            ├── AnalisadorJson.jsx # re-export → AnalisadorJson/index.jsx
            └── AnalisadorJson/
                ├── index.jsx               # Componente principal — EditorLinhas, layout, toolbar
                ├── JsonGrafo.jsx           # Visualização grafo com pan/zoom e arestas SVG bézier
                ├── JsonTabela.jsx          # Tabela com ordenação por coluna e exportar CSV
                ├── JsonNode.jsx            # Árvore colapsável recursiva com cópia de JSON path
                ├── DiffViewer.jsx          # Painel de diff estrutural (modo Comparador)
                ├── BuscaResultados.jsx     # Lista de resultados da busca no JSON
                ├── constants.js           # EXEMPLO_JSON, ABAS
                └── utils.js               # DARK palette, highlightJson, analyzeJson, diffJson, buscaJson
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
| GET    | /api/scripts          | Lista scripts (filtro ?categoria=, ?tag=, ?pagina=, ?limite=) — retorna `{ data, total, pagina, limite, totalPaginas }` |
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

### Portfólio
> **Leitura pública** (qualquer autenticado), **escrita restrita a admin**. Dados globais — sem isolamento por usuário.

| Método | Rota                                        | Descrição                                                                 |
|--------|---------------------------------------------|---------------------------------------------------------------------------|
| GET    | /api/portfolio                              | Lista municípios (filtro ?busca=, ?pagina=, ?limite=) — retorna `{ data, total, pagina, limite, totalPaginas }` |
| POST   | /api/portfolio                              | Cria município — **somente admin**                                        |
| GET    | /api/portfolio/:id                          | Detalhe do município com entidades (contagem sistemas/stakeholders)        |
| PUT    | /api/portfolio/:id                          | Atualiza município — **somente admin**                                    |
| DELETE | /api/portfolio/:id                          | Remove município (cascade completo) — **somente admin**                   |
| GET    | /api/portfolio/:id/entidades                | Lista entidades com sistemas e stakeholders completos                     |
| POST   | /api/portfolio/:id/entidades                | Cria entidade no município — **somente admin**                            |
| GET    | /api/portfolio/entidades/:eid               | Detalhe da entidade com sistemas e stakeholders                           |
| PUT    | /api/portfolio/entidades/:eid               | Atualiza entidade — **somente admin**                                     |
| DELETE | /api/portfolio/entidades/:eid               | Remove entidade (cascade) — **somente admin**                             |
| GET    | /api/portfolio/entidades/:eid/sistemas      | Lista sistemas da entidade                                                |
| POST   | /api/portfolio/entidades/:eid/sistemas      | Cria sistema na entidade — **somente admin**                              |
| PUT    | /api/portfolio/sistemas/:sid                | Atualiza sistema (nome/vertical/ativo/observacoes) — **somente admin**    |
| DELETE | /api/portfolio/sistemas/:sid                | Remove sistema (cascade M2M) — **somente admin**                          |
| GET    | /api/portfolio/entidades/:eid/stakeholders  | Lista stakeholders com sistemas vinculados                                |
| POST   | /api/portfolio/entidades/:eid/stakeholders  | Cria stakeholder com sistemas[] (M2M) — **somente admin**                 |
| PUT    | /api/portfolio/stakeholders/:shid           | Atualiza stakeholder + recria vínculos M2M — **somente admin**            |
| DELETE | /api/portfolio/stakeholders/:shid           | Remove stakeholder — **somente admin**                                    |

### Catálogo de Verticais
> **Leitura pública** (qualquer autenticado), **escrita restrita a admin**. Seed automático na 1ª chamada GET se a tabela estiver vazia.

| Método | Rota              | Descrição                                                                         |
|--------|-------------------|-----------------------------------------------------------------------------------|
| GET    | /api/catalogo     | Lista verticais ordenadas por `ordem` — popula seed Betha se vazio               |
| POST   | /api/catalogo     | Cria vertical (nome, cor hex, sistemas[], ordem) — **somente admin**              |
| PUT    | /api/catalogo/:id | Atualiza vertical — **somente admin**                                             |
| DELETE | /api/catalogo/:id | Remove vertical — retorna 409 se há `EntidadeSistema` vinculados — **somente admin** |

### Chamados
> Acesso público (qualquer autenticado). `DELETE /:id` somente admin. Sem isolamento por usuário — todos veem todos.

| Método | Rota                          | Descrição                                                                             |
|--------|-------------------------------|---------------------------------------------------------------------------------------|
| GET    | /api/chamados                 | Lista chamados (filtros ?busca=, ?status=, ?classificacao=, ?responsavelId=, ?vertical=, ?pagina=, ?limite=) — retorna `{ data, total, pagina, limite, totalPaginas }` |
| GET    | /api/chamados/estatisticas    | Contagem por status (objeto `{ status: count }`)                                      |
| GET    | /api/chamados/dashboard       | Dados agregados: resumo, porStatus, porMunicipio, porVertical, porClassificacao, porPrioridade, semResponsavel, porDia (14 dias) |
| POST   | /api/chamados                 | Cria chamado + registra entrada `criacao` no histórico                                |
| GET    | /api/chamados/anexos/:aid     | Download de anexo (base64 → buffer, Content-Disposition: attachment)                  |
| DELETE | /api/chamados/anexos/:aid     | Remove anexo                                                                          |
| DELETE | /api/chamados/comentarios/:cid | Remove comentário — somente autor ou admin                                           |
| GET    | /api/chamados/:id/historico   | Histórico de alterações do chamado (ordenado por criadoEm desc)                       |
| GET    | /api/chamados/:id             | Detalhe completo com comentários, anexos e contagens                                  |
| PUT    | /api/chamados/:id             | Atualiza campos + detecta alterações e registra no histórico automaticamente          |
| DELETE | /api/chamados/:id             | Remove chamado (cascade) — **somente admin**                                          |
| POST   | /api/chamados/:id/comentarios | Adiciona comentário                                                                   |
| POST   | /api/chamados/:id/anexos      | Upload de anexo (base64 no body: nomeArquivo, tipo, conteudo, tamanho)               |

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
- **Global**: 50000 req/15min por IP (todas as rotas)
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

- **Logos**: `frontend/public/logo-sem-nome.webp` (tela de login) e `logo-com-nome.webp` (uso geral) — formato WebP, ~40-48 KB cada (originais PNG de 5 MB convertidos)
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
- **Validade do token (`dataVencimento`)**: campo `DateTime?` opcional em `MunicipioSistema`. Cadastrado no modal "Adicionar token" com `<input type="date">` (min = hoje, max = hoje + 15 dias — duração máxima real de um token Betha). Exibe badge colorido abaixo do nome do sistema no painel de tokens: verde (> 30 dias), amarelo (8–30 dias), laranja (1–7 dias / "Vence hoje"), vermelho ("Expirado há X dias"). Apenas informativo — não bloqueia uso do token. Tokens sem data não exibem badge. Para atualizar a data de um token existente: re-salvar o mesmo sistema via "+ Adicionar sistema" (upsert).
- **Municípios isolados por usuário**: campo `usuarioId Int?` em `Municipio`; queries sempre filtradas por `req.usuario.id`. Municípios de outros usuários são invisíveis e inacessíveis (404 em vez de 403 para não vazar informação de existência)
- **Swagger exclusivo em Sistemas**: `SwaggerImport` só é usado em `Sistemas.jsx` — aba Specs ou botão na aba Informações; `Sandbox (ClienteAPI.jsx)` não tem mais esse botão; botões de importação visíveis **apenas para admin**
- **Painel detalhe Sistemas**: 3 abas — Informações (stats + editar + importar swagger), Specs (listar/remover specs), Endpoints (listar/editar endpoints do sistema); ações de escrita visíveis **apenas para admin** (`isAdmin = useAuthStore(state => state.usuario)?.role === 'admin'`)
- **idGerado no proxy**: `proxy.js` extrai `idGerado` de resposta array (mapeia `item.id ?? item.idGerado ?? item.idEconomico ?? item.idLote`, filtra nulos, une com vírgula) e de objeto simples (`.id`, `.idGerado`, `.idEconomico`). Salvo no histórico de requisições.
- **Relatórios JRXML**: `Relatorio.jxrmlConteudo` armazena o arquivo como base64 no SQLite. A listagem (`GET /`) omite o campo por performance — apenas `temJxrml: bool`. Download via `GET /:id/jxrml` faz `Buffer.from(base64)` → `Content-Type: application/octet-stream`. Frontend faz download via `atob()` → `Uint8Array` → `Blob`.
- **Scripts BFC vs Relatórios**: `Script` (modelo) cobre categorias `script`, `formula`, `anotacao` — exibidas em 3 das 4 abas de Scripts.jsx. `Relatorio` é modelo separado, exibido na 4ª aba, com suporte a JRXML + scriptFonte (fonte dinâmica BFC).
- **UI — padrões visuais consistentes**: header com barra acento vertical (`w-1 h-6 rounded-full bg-sysgate-600`); botões de ação como ícones SVG (pencil/trash) em vez de texto; painel lateral com cabeçalho gradiente (`from-white to-sysgate-50/30`) + label "X selecionado" + botão X para fechar.
- **Portfólio — dados globais (sem isolamento)**: `PortfolioMunicipio` não possui `usuarioId`; todos os usuários autenticados veem o mesmo portfólio. Diferente do módulo `Municipios` que é isolado por usuário. Escrita/exclusão restrita a admin via `exigirAdmin`.
- **Portfólio — hierarquia**: `PortfolioMunicipio` → `Entidade[]` → `EntidadeSistema[]` + `Stakeholder[]` → `StakeholderSistema[]` (M2M). Os sistemas do portfólio são independentes dos modelos `Sistema`/`Endpoint` usados no Sandbox — são listas simples de nomes para documentar quais sistemas cada entidade utiliza.
- **Portfólio — M2M Stakeholder ↔ EntidadeSistema**: tabela pivot `StakeholderSistema` com `@@id([stakeholderId, entidadeSistemaId])`. Update = `deleteMany` todos os vínculos do stakeholder + `createMany` com os novos IDs (padrão "replace all"). Frontend envia `sistemas: [id1, id2]` (array de IDs de `EntidadeSistema`).
- **Portfólio — cascade delete manual**: SQLite não executa cascades automáticos via Prisma para relações M2M explícitas. Handlers deletam na ordem correta: `StakeholderSistema` → `Stakeholder` → `EntidadeSistema` → `Entidade` → `PortfolioMunicipio`.
- **Portfólio — ordem de rotas Express**: segmentos literais (`/entidades/:eid`, `/sistemas/:sid`, `/stakeholders/:shid`) registrados ANTES de `/:id` e `/:id/entidades` para evitar conflito de captura. Regra geral já documentada em "Rotas nomeadas ANTES de /:id".
- **Portfólio — layout Portfolio.jsx**: duas colunas — lista de municípios (`w-72 shrink-0`) com busca local + painel de entidades (`flex-1`) com accordion. Município selecionado: highlight `bg-sysgate-50 border-l-2 border-sysgate-500`. Mobile: colunas empilham, painel substitui lista com botão "← Voltar".
- **Portfólio — accordion de entidades**: estado `entidadesAbertas` é um `Set<number>` de IDs. Toggle: se ID está no Set → remove; senão → adiciona. Seção "Sistemas" exibe badge ativo/inativo com toggle direto (admin). Seção "Contatos" exibe cards com avatar de iniciais, dados de contato e chips dos sistemas vinculados.
- **Portfólio — verticais**: `EntidadeSistema` possui campo `vertical String?` que referencia o nome de uma `CatalogoVertical`. No accordion, sistemas são agrupados por vertical (cada vertical = card com header colorido + fundo tingido). Sistemas sem vertical ficam no grupo "Outros".
- **Portfólio — CatalogoVertical**: modelo `CatalogoVertical` (nome único, cor hex, sistemas JSON array, ordem int) armazena o catálogo de verticais Betha no banco. Na 1ª chamada `GET /api/catalogo` a tabela é populada com as 9 verticais oficiais (Contábil, Contratos, Arrecadação, Pessoal, Atendimento, NoPaper, Educação, Saúde, Gestão Municipal) e suas cores. `sistemas` é armazenado como `JSON.stringify(array)` e retornado como `JSON.parse(array)`.
- **Portfólio — cores de verticais**: mapa `CORES_VERTICAIS` em `Portfolio.jsx` (hardcoded, cores oficiais Betha) mapeia nome → hex. `corVertical(v)` faz lookup e retorna `COR_OUTROS_HEX = '#94A3B8'` para verticais não mapeadas. `hexToRgb(hex)` converte para `"r, g, b"` usado em `rgba(...)` para fundos com opacidade. Cabeçalhos de cards usam cor sólida + texto branco; fundos de cards usam `rgba(..., 0.05/0.15)`.
- **Portfólio — modal picker (ModalGerenciarSistemas)**: aceita prop `catalogo` (array da API). Chips de sistemas usam `getChipStyle(vertical, sis)` que retorna `{ cls, sty }` — chips ativos têm cor da vertical (inline style), chips fantasma têm borda pontilhada cinza, chips pendentes de ativação têm fundo sólido da vertical + texto branco. A API retorna `nome` (não `vertical`) — desestruturar como `{ nome: vertical, sistemas }`.
- **Portfólio — modal catálogo (ModalCatalogo)**: admin only, acessível pelo botão de engrenagem no header. Lista cards editáveis: nome (input), cor (`<input type="color">`), sistemas (chips com × para remover + input Enter para adicionar). "+ Nova vertical" adiciona entrada com `_novo: true`. Ao salvar: itera `deletados[]` (DELETE), depois itera `itens` (POST para `_novo`, PUT para existentes). `onSaved()` recarrega o catálogo no componente pai via `catalogoApi.listar().then(setCatalogo)`.

## Módulo Chamados — padrões e decisões

### Modelos de dados
- **`Chamado`**: campos `titulo`, `descricao`, `status`, `classificacao`, `prioridade`, `vertical`, `sistema`, `municipio` (texto livre), `entidade` (texto livre), `criadoPorId`, `responsavelId`. Sem isolamento por usuário (dados globais).
- **`ChamadoComentario`**: vínculo com `Chamado` (cascade delete) e `Usuario` (autor).
- **`ChamadoAnexo`**: armazena arquivo como base64 em `conteudo String`. Download via `GET /api/chamados/anexos/:aid` — converte `Buffer.from(base64)` e envia como `application/octet-stream`.
- **`ChamadoHistorico`**: registra cada alteração relevante. Campos: `tipo` (string), `valorAntes` (String?), `valorDepois` (String?), `usuarioId`, `chamadoId`, `criadoEm`. Sempre ordenado `desc` na listagem.

### Histórico automático de alterações
- Tipos rastreados: `criacao`, `status`, `responsavel`, `classificacao`, `prioridade`, `titulo`, `vertical`
- `POST /` cria entrada `criacao` após criar o chamado
- `PUT /:id` busca o estado atual ANTES do update, compara campo a campo, cria entradas via `createMany` para cada campo que mudou
- Para `responsavel`: faz lookup do nome do novo usuário para armazenar o nome legível (não só o ID) em `valorDepois`
- `valorAntes`/`valorDepois` armazenam `null` quando campo era/ficou sem valor — exibidos como "removido" no frontend

### Painel de histórico (PainelHistorico)
- Componente interno de `Chamados.jsx`, lazy — só busca dados quando aberto (`useEffect` no mount)
- Toggle via botão de relógio no cabeçalho do detalhe — estado `mostrarHistorico` (boolean)
- Aparece como coluna lateral direita (`w-72`) dentro do painel de detalhe (flex row)
- `historicoKey` (counter) é incrementado após qualquer atualização — passado como `key` ao componente para forçar re-fetch
- Timeline com linha vertical cinza + dot colorido por tipo + descrição + nome do usuário + data/hora completa
- Cores por tipo: `criacao`=#22C55E, `status`=#3B82F6, `responsavel`=#8B5CF6, `classificacao`=#6366f1, `prioridade`=#F59E0B, `titulo`=#64748B, `vertical`=#EC4899

### Sub-abas do módulo (Gestão | Dashboard)
- Estado `aba` no componente principal: `'lista'` ou `'dashboard'`
- Toggle estilo pill/tab no header, junto ao título — não substitui o botão "Novo Chamado"
- Ao criar um chamado via modal, `onSalvo` força `setAba('lista')` para o usuário ver o chamado criado

### Dashboard de chamados
- Componente `Dashboard` dentro de `Chamados.jsx` — busca `chamadosApi.dashboard()` no mount
- Endpoint `GET /api/chamados/dashboard` usa `Promise.all` com 10 queries paralelas: porStatus, porMunicipio (top 10), porVertical, porClassificacao, porPrioridade, semResponsavel (abertos, limit 8), criadosHoje, criadosMes, concluidosMes, porDia (raw SQL SQLite, últimos 14 dias)
- `porDia` usa `prisma.$queryRaw` com template literal — retorna BigInt; convertido com `Number(r.total)` antes de serializar
- Gráficos Recharts: `AreaChart` (por dia), `PieChart` (por status, por classificação), `BarChart` horizontal (por município, por vertical), `BarChart` vertical (por prioridade)
- Cores dos gráficos reutilizam `STATUS_CORES`, `CLASSIF_CORES`, `PRIORIDADE_CORES` + paleta `PALETTE` para séries sem cor semântica
- `CustomTooltip`: componente único de tooltip para todos os gráficos (fundo branco, borda cinza, fonte xs)
- Tabela "Abertos sem responsável": exibe chamados com `responsavelId = null` e `status ≠ 'Concluido'` com dot pulsante laranja no header

### Campos do chamado — origem dos dados
- `municipio` e `entidade`: texto livre no banco, mas o modal busca opções do portfólio via `portfolioApi.listar()` e `portfolioApi.entidades(id)` para oferecer selects dinâmicos. O usuário pode selecionar ou digitar livremente.
- `vertical` e `sistema`: dropdown populado pelo catálogo (`catalogoApi.listar()`). Sistema dependente da vertical selecionada — filtrado por `catalogo.find(v => v.nome === form.vertical)?.sistemas`.
- `responsavelId`: lista de usuários ativos buscados de `GET /api/usuarios`.

### Numeração de chamados
- Formato: `#CH-{ano}-{id com 4 zeros}` — ex: `#CH-2026-0042`
- Calculado no frontend via função `ticketNum(c)` (sem campo dedicado no banco)

### Ordem das rotas em chamados.js
Rotas literais registradas ANTES de `/:id`:
1. `GET /estatisticas`
2. `GET /dashboard`
3. `GET /anexos/:aid`
4. `DELETE /anexos/:aid`
5. `DELETE /comentarios/:cid`
6. `GET /:id/historico` ← sub-rota de `:id`, não conflita
7. `GET /:id`, `PUT /:id`, `DELETE /:id`
8. `POST /:id/comentarios`, `POST /:id/anexos`

## Módulo Analisador JSON — padrões e decisões

### Visão geral
- Módulo **100% client-side** — sem rotas de backend, sem banco de dados
- Rota: `/analisador-json` → `frontend/src/pages/AnalisadorJson.jsx`
- Item na sidebar após "Chamados", ícone SVG de chaves `{ }` (`ICONS.analisadorJson`)
- Inspirado no JSON Crack e JSON Formatter

### Layout da página
- Tema escuro global (`bg-slate-900`) — independente do tema do restante da aplicação
- Split horizontal: painel esquerdo 34% (entrada) + painel direito 66% (visualizador)
- Painel de entrada: textarea monoespaçada dark, barra de números de linhas sincronizada, macOS dots decorativos (vermelho=Limpar, amarelo=Minificar, verde=Formatar)
- Painel de visualizador: toggle dark/light independente + 5 abas de visualização

### Abas do visualizador
| Aba | Descrição |
|-----|-----------|
| `formatado` | JSON formatado com syntax highlight; dark (slate-950) ou light (white) |
| `arvore` | Árvore colapsável recursiva via `JsonNode`; clicar numa chave copia o JSON path |
| `grafo` | Visualização estilo JSON Crack — cards conectados por setas SVG bézier, pan/zoom |
| `tabela` | Tabela responsiva para arrays de objetos; cabeçalho dinâmico com todas as chaves únicas; ordenação por coluna + exportar CSV |
| `stats` | Grid de cards coloridos com métricas: tamanho, profundidade, contagem por tipo |

### Componentes internos (todos em AnalisadorJson.jsx)

**`EditorLinhas`** — número de linhas sincronizado com o textarea
- `useRef` para `divRef` e `textareaRef`; `onScroll` do textarea atualiza `scrollTop` da div de números
- Calcula quantidade de linhas a partir de `value.split('\n').length`

**`JsonNode`** — árvore colapsável recursiva
- Estado local `expanded` (padrão `depth < 2`)
- Chevron ▶/▼ clicável
- Linha vertical cinza `border-l border-slate-600` entre pai e filhos
- Clicar na chave ou valor copia o JSON path no formato `$.user.address.city` / `$.items[0].id`
- Toast inline "Path copiado!" exibido por 2 s

**`JsonTabela`** — tabela para arrays de objetos
- Só ativa quando `parsed` é `Array` de objetos no root
- `objetos` e `colunas` calculados via `useMemo` (antes dos early returns, para não violar Rules of Hooks)
- Células com tratamento por tipo: objetos/arrays renderizados como código compacto; booleans coloridos
- **Ordenação por coluna**: `sortCol` + `sortDir` estados locais; clicar no `<th>` alterna asc/desc; segundo clique na mesma coluna inverte direção; `objetosOrdenados` useMemo aplica `localeCompare` pt-BR (numérico) ou comparação numérica direta; coluna ativa destacada em índigo
- **Exportar CSV**: botão "↓ Exportar CSV" no footer; `escape(v)` lida com vírgulas/aspas/newlines (RFC 4180); BOM `\ufeff` para compatibilidade Excel; exporta na ordem atual (`objetosOrdenados`)
- Footer: "N registros · M colunas [· sortCol ▲/▼] [· N não-objeto ignorado(s)]"

**`JsonEstatisticas`** — painel de métricas
- Depende de `analyzeJson(parsed)` que percorre o JSON recursivamente
- Retorna `{ keys, strings, numbers, booleans, nulls, arrays, objects, maxDepth }`
- Grid 3 colunas com cards coloridos por tipo de dado

**`BuscaResultados`** — lista de resultados da busca no JSON
- Recebe `results[]`, `termo` (string) e `dark` (boolean)
- Cada resultado exibe: badge `chave` (índigo) ou `valor` (verde), path JSONPath completo, preview do valor com cores por tipo
- Estado vazio: placeholder estilizado "Nenhum resultado para…"
- Limite de exibição: 300 resultados (a função `buscaJson` já limita coleta a 500)
- Substitui o conteúdo das abas quando `busca.trim()` é não-vazio (condição `!busca.trim()` adicionada em todos os renders de aba)

**`JsonGrafo`** — visualização tipo grafo (estilo JSON Crack)
- **Sem bibliotecas externas** (sem react-flow, d3, etc.)
- Construção do grafo: `gBuild(value, key, depth)` transforma o JSON numa árvore de nós `{ id, label, rows, children }`
  - `rows`: propriedades/elementos exibidos dentro do card (máx. 8, demais truncados com "…+N")
  - Nós com filhos: objetos aninhados e arrays se tornam nós filhos conectados por arestas
- Layout: `gLayout(node, x, y)` — algoritmo Reingold-Tilford simplificado
  - Posiciona filhos de cima para baixo, calcula span total e centraliza o pai sobre os filhos
  - `gShift(nodes, dy)` desloca subtrees recursivamente para resolver sobreposições
  - `gCollect(node, list)` achata a árvore em lista de nós com `{ id, x, y, ... }`
  - `gHeight(node)` calcula altura do card com base no número de rows
- Constantes: `GW=230` (largura card), `GHH=34` (altura header), `GRH=24` (altura por row), `GHGAP=90` (gap horizontal), `GVGAP=18` (gap vertical)
- Arestas: linhas SVG bézier cúbicas (`C`) saindo da direita do card pai para a esquerda do card filho
- Pan/zoom: `onMouseDown/Move/Up` para arrastar, `onWheel` para zoom (0.2–3×), `transform: translate + scale`
- Auto-fit no mount: `useEffect` com `getBoundingClientRect()` calcula zoom e offset para encaixar o grafo na viewport
- Background: grid de pontos com `radial-gradient` CSS

**`DiffViewer`** — painel de resultado da comparação (Modo Comparador)
- Recebe `parsedA`, `erroA`, `parsedB`, `erroB`
- Calcula `diffs = diffJson(parsedA, parsedB)` via `useMemo`
- Estados exibidos: vazio (sem entrada), aguardando (um dos lados faltando), idêntico (0 diffs), diferenças (lista)
- Barra de resumo: total de diffs + badges coloridos (verde adicionados, vermelho removidos, amarelo modificados)
- Lista de diferenças: cada item mostra path em roxo + tipo (badge circular) + valor(es)
  - `added`: badge verde `+`, valor em verde
  - `removed`: badge vermelho `−`, valor em vermelho
  - `changed`: badge amarelo `≠`, valor antigo (vermelho) → valor novo (verde)
- Limite de exibição: 500 diffs — aviso se exceder
- `fmtDiffVal(v)`: formata valores para exibição (trunca a 80 chars, strings entre aspas, objetos como JSON compacto)

**`diffJson(a, b, path, out)`** — algoritmo de diff estrutural recursivo
- Fast path: `Object.is(a, b)` retorna sem adicionar nada (idênticos)
- Tipos incompatíveis (primitivo vs objeto, array vs objeto, null vs valor): adiciona entrada `changed`
- Objetos/arrays: percorre `Set` de todas as chaves de A e B
  - Chave só em B → `added`; só em A → `removed`; em ambos → recursão
- Arrays: paths como `$.items[0]`, objetos como `$.user.nome`
- Acumula em `out[]` passado por referência para evitar spreads desnecessários

**`buscaJson(value, termo, path, results)`** — busca recursiva em todo o JSON
- Percorre arrays (paths `[i]`), objetos (paths `.chave`) e primitivos
- Para cada chave de objeto: se nome da chave contiver o termo → `results.push({ matchIn: 'key', key, value })`
- Para primitivos: se `String(value)` contiver o termo → `results.push({ matchIn: 'value', value })`
- Paths no formato JSONPath: `$.usuario.endereco.cidade`, `$.items[0].id`
- Limite de 500 resultados (`results.length >= 500` short-circuits recursão)
- `null` é tratado como a string `'null'` para fins de correspondência

### Estado principal (AnalisadorJson)
```
input: string            — texto bruto do JSON A no textarea
parsed: any | null       — resultado do JSON.parse do JSON A (null = inválido/vazio)
erro: string | null      — mensagem de erro do JSON.parse do JSON A
aba: string              — 'formatado' | 'arvore' | 'grafo' | 'tabela' | 'stats'
pathCopiado: string      — caminho copiado (exibe toast por 2s no JsonNode)
copiado: boolean         — feedback do botão Copiar na toolbar
cursor: {line,col}       — posição do cursor no textarea A (barra de status)
viewerDark: boolean      — toggle dark/light do painel de visualização (persiste em localStorage)
modo: string             — 'analisar' | 'comparar' — controla o layout principal
busca: string            — termo de busca no visualizador; '' = busca inativa
inputB: string           — texto bruto do JSON B (somente no modo comparador)
parsedB: any | null      — resultado do JSON.parse do JSON B
erroB: string | null     — mensagem de erro do JSON.parse do JSON B
```

### Busca no visualizador
- Barra de busca aparece entre as abas e o conteúdo, **somente quando `parsed !== null`**
- Input controlado `busca` + `onChange={(e) => setBusca(e.target.value)}` — sem debounce (busca síncrona)
- `resultadosBusca` computado via `useMemo([parsed, busca])` chamando `buscaJson(parsed, busca.trim())`
- Quando `busca.trim()` é não-vazio: renderiza `<BuscaResultados>` em vez do conteúdo da aba ativa (condição `!busca.trim()` em todos os cinco blocos de aba)
- Badge com contador de resultados (índigo) e botão `✕` para limpar aparecem no input quando há texto
- A barra de busca **não aparece no modo Comparador** (está dentro do bloco `modo === 'analisar'`)

### Persistência do tema (viewerDark)
- Inicializado via `useState(() => localStorage.getItem('sysgate-json-viewerDark') === 'true')`
- Atualizado via `toggleViewerDark()` que chama `localStorage.setItem(...)` antes de mudar o state
- Chave: `sysgate-json-viewerDark` (string `'true'` ou `'false'`)
- Persiste entre navegações e recargas de página

### Modo Comparador
- Toggle pill no canto superior direito da barra de título: "Analisador" | "Comparador"
- **Pill sempre visível**: container do toggle tem `flexShrink: 0` + `whiteSpace: nowrap`; subtítulo tem `flex: 1` + `overflow: hidden` + `text-overflow: ellipsis` para ceder espaço ao toggle em telas menores — sem isso, o subtítulo empurrava o toggle para fora da área visível (cortado pelo `overflow-hidden` do container)
- Borda do pill: `#4f46e5` (índigo) para destacar dos outros elementos da barra
- Layout no modo `comparar`: dois editores (50%/50%) lado a lado ocupando 46% da altura + painel DiffViewer abaixo (flex-1)
- JSON A reutiliza `input`/`parsed`/`erro`/`taRef` e `processarInput`
- JSON B usa `inputB`/`parsedB`/`erroB`/`taRefB` e `processarInputB`
- Cada editor tem seu próprio header com label colorido (A=índigo `#818cf8`, B=rosa `#f472b6`) + badges Válido/Inválido + dots macOS
- Toolbar se adapta ao modo: em `comparar` mostra controles de JSON A + controles de JSON B + botão "A ⇄ B"
- Botão "A ⇄ B": salva `input` e `inputB` em temporários, chama `processarInput(tmpInputB)` e `processarInputB(tmpInput)` — re-parseia ambos corretamente

### Syntax highlight
- Duas funções separadas com paletas diferentes:
  - `highlightJson(str)` — paleta dark: chaves azul-300, strings verde-400, números amarelo-300, booleans roxo-400, null cinza-500
  - `highlightJsonLight(str)` — paleta light: chaves azul-700, strings verde-700, números âmbar-600, booleans roxo-600, null cinza-400
- Ambas usam regex com `dangerouslySetInnerHTML` + `pre` para preservar espaçamento

### Toolbar e ações
| Ação | Comportamento |
|------|---------------|
| Exemplo | Carrega JSON de exemplo pré-definido (objeto com arrays aninhados) |
| Formatar | `JSON.stringify(parsed, null, 2)` → substitui `input` |
| Minificar | `JSON.stringify(parsed)` → substitui `input` |
| Copiar | `navigator.clipboard.writeText(formatado \|\| input)`; feedback visual 2s |
| Baixar | Cria `Blob` JSON e dispara download como `dados.json` |
| Abrir arquivo | `<input type="file" accept=".json,.txt">` → `FileReader.readAsText` |
| Limpar | Reseta `input` para `''` |
| macOS dot vermelho | Atalho para Limpar |
| macOS dot amarelo | Atalho para Minificar |
| macOS dot verde | Atalho para Formatar |
| A ⇄ B (comparador) | Troca os conteúdos do JSON A e JSON B |
| Exemplo em A (comparador) | Carrega o exemplo pré-definido no JSON A |

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
PROXY_URL=http://127.0.0.1:8888
```

### Proxy de saída — túnel SSH pelo PC do implantador

**Contexto:** O IP da VPS Hostinger (187.77.230.138) está bloqueado pela Betha Cloud para requisições de API. IPs de data center (incluindo proxies comerciais Webshare) também são bloqueados. A solução é rotear as chamadas pelo PC do implantador (IP residencial) via túnel SSH reverso.

**Como funciona:**
```
Backend (VPS) → SSH tunnel (127.0.0.1:8888) → proxy.js (PC) → Betha Cloud
```

**Arquivo proxy.js** — salvo em `C:\Users\Felipe\Desktop\proxy.js`:
```javascript
const net = require('net')
const http = require('http')
const server = http.createServer((req, res) => { res.writeHead(404); res.end() })
server.on('connect', (req, clientSocket, head) => {
  const [hostname, port] = req.url.split(':')
  const serverSocket = net.connect(parseInt(port) || 443, hostname, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
    if (head && head.length) serverSocket.write(head)
    serverSocket.pipe(clientSocket)
    clientSocket.pipe(serverSocket)
  })
  serverSocket.on('error', () => clientSocket.destroy())
  clientSocket.on('error', () => serverSocket.destroy())
})
server.listen(8888, '127.0.0.1', () => console.log('Proxy rodando em localhost:8888'))
```

**Ativar o túnel (toda vez que for usar o sistema em produção):**

CMD 1 — Iniciar o proxy HTTP no PC:
```cmd
node C:\Users\Felipe\Desktop\proxy.js
```

CMD 2 — Criar túnel SSH reverso (deixar aberto):
```cmd
ssh -R 8888:127.0.0.1:8888 root@187.77.230.138 -N
```

**Verificar se está funcionando (na SSH da VPS):**
```bash
curl -x "http://127.0.0.1:8888" "https://api.ipify.org?format=json"
# Deve retornar o IP residencial do PC (ex: 179.216.24.94), não 187.77.230.138
```

**Importante:**
- O túnel só funciona enquanto o PC do implantador estiver ligado e os 2 CMDs abertos
- Se o PC desligar ou a conexão cair, o sistema para de conseguir chamar a Betha
- O `PROXY_URL=http://127.0.0.1:8888` já está no `.env` da VPS

**Nota técnica — axios 1.x + HTTPS:**
O backend usa axios 1.13.x que não suporta o campo `proxy` para HTTPS corretamente. A solução foi usar `httpsAgent: new HttpsProxyAgent(PROXY_URL)` com `proxy: false`, usando o pacote `https-proxy-agent` (já presente como dependência transitória). Essa configuração está em `buildProxyConfig()` nos arquivos `proxy.js` e `endpoints.js`.
