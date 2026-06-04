# Krakion

Ferramenta interna fullstack para implantadores Betha. Gerencia municípios, executa chamadas API via proxy, importa specs Swagger/OpenAPI, envia requisições em lote, organiza scripts e mantém o portfólio de clientes (municípios atendidos com entidades, sistemas e contatos).

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

## Skills de Desenvolvimento

Workflow de desenvolvimento adaptado do [obra/superpowers](https://github.com/obra/superpowers):

| Situação | Skill |
|----------|-------|
| Bug reportado, erro inesperado, teste falhando | `skills/superpowers/systematic-debugging.md` |
| Nova feature ou mudança significativa | `skills/superpowers/brainstorming.md` → `writing-plans.md` |
| Implementando qualquer código | `skills/superpowers/test-driven-development.md` |
| Antes de afirmar que algo está funcionando | `skills/superpowers/verification-before-completion.md` |
| Alterando autenticação, rotas ou permissões | `skills/seguranca.md` |
| Fazendo deploy ou configurando o tunnel SSH | `skills/deploy.md` |
| Trabalhando com proxy, envio em lote, IDs Betha | `skills/betha-api.md` |
| Dúvida sobre qual skill usar | `skills/superpowers/using-superpowers.md` |

**Regra geral:** bugs → debug primeiro; nova feature → design primeiro; código → TDD; conclusão → verificar primeiro.

## Estrutura do projeto

```
krakion/
├── CLAUDE.md                  # Este arquivo
├── docker-compose.yml
├── sysgate.bat                # Gerenciador Windows: iniciar/parar/reiniciar backend+frontend
├── deploy.bat                 # Deploy para produção: git pull + build + pm2 restart no servidor
├── docs/                      # Documentação por módulo
│   ├── sandbox-unificado.md   # Plano e registro da unificação Sandbox + EnvioLote
│   ├── historico.md
│   ├── municipios.md
│   ├── sistemas.md
│   ├── portfolio.md
│   ├── chamados.md
│   └── analisador-json.md
├── skills/                    # Referências de domínio e processo
│   ├── backend.md
│   ├── frontend.md
│   ├── swagger-parser.md
│   ├── fluxos.md
│   ├── banco-de-dados.md
│   ├── seguranca.md           # JWT, multi-tenant, rate limit, hCaptcha, lockout
│   ├── deploy.md              # VPS, PM2, Nginx, tunnel SSH
│   ├── betha-api.md           # IDs Betha, URL base, Swagger quirks, proxy, envio em lote
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
    │   ├── nova-logo.webp     # Logo Krakion (sem fundo, usada na tela de login) — WebP 500px, 23 KB
    │   ├── logo-com-nome.webp # Logo Krakion Labs com nome (uso em dashboards) — WebP 500px, 48 KB
    │   └── favicon.png        # Favicon 256px gerado da nova-logo
    └── src/
        ├── main.jsx
        ├── App.jsx            # BrowserRouter: /login pública + PrivateRoute; todas as páginas carregadas com React.lazy + Suspense (code splitting por rota)
        ├── index.css          # Classes Tailwind custom: .btn, .card, .input, .badge, .label
        ├── lib/
        │   └── api.js         # Axios centralizado + interceptor JWT (Bearer) + interceptor 401→logout; exporta scriptsApi, relatoriosApi, portfolioApi, catalogoApi e chamadosApi
        ├── stores/
        │   ├── municipioStore.js  # Zustand + persist (localStorage, key: krakion-municipio)
        │   └── authStore.js       # Zustand + persist (krakion-auth) — token + usuario; suporta lembrar (30d); logout limpa krakion-municipio do localStorage
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
            ├── Sandbox/
            │   ├── index.jsx               # Rota: /sandbox — container com estado compartilhado + painel esquerdo (cards 1–4) + toggle de abas
            │   ├── AbaRequisicao.jsx       # Aba "Requisição única" — body editor, executar, resposta, histórico
            │   ├── AbaEnvioLote.jsx        # Aba "Envio em Lote" — cards 5–6 (CSV + sliders) + mapeamento + BatchProgress
            │   ├── CsvPreview.jsx          # Tabela de preview do CSV carregado
            │   ├── BatchProgress.jsx       # Progresso/resultados de lotes + consultas GET por ID
            │   └── utils.js               # extrairId(), extrairIds(), nomeRecurso(), highlightJson(), METODOS, METODO_COLORS, METODO_ACTIVE, TIPO_COR, tipoCor()
            ├── Scripts.jsx        # 4 abas: Scripts BFC / Fórmulas BFC / Anotações / Relatórios (JRXML + fonte dinâmica)
            ├── Portfolio.jsx      # re-export → Portfolio/index.jsx
            ├── Portfolio/
            │   ├── index.jsx               # Componente principal — layout 2 colunas, CRUD, modais inline
            │   ├── AccordionEntidade.jsx   # Accordion de entidade com sistemas por vertical e stakeholders
            │   ├── ModalGerenciarSistemas.jsx # Modal picker do Catálogo Betha (chips por vertical)
            │   ├── ModalCatalogo.jsx       # Modal admin para configurar verticais/sistemas do catálogo
            │   └── utils.js               # CORES_VERTICAIS, corVertical(), hexToRgb()
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

## Segurança — resumo

> Documentação completa: `skills/seguranca.md`

- **JWT**: middleware `autenticar.js` aplicado APÓS `/api/auth` e `/api/health`; payload `{ id, login, nome, role }`; interceptor 401 → logout + redirect
- **Roles**: `admin` = acesso total; não-admin = apenas próprios dados; middleware `exigirAdmin` protege escrita global
- **Multi-tenant**: municípios sempre filtrados por `req.usuario.id`; municípios alheios retornam 404 (não 403); proxy verifica ownership antes de usar token
- **Lockout**: 5 falhas → bloqueio 15min; hCaptcha aparece no frontend após 3 falhas
- **Contas novas**: criadas com `ativo: false`; admin ativa via `PUT /api/usuarios/:id`
- **Logout**: limpa `localStorage.removeItem('krakion-municipio')` para isolar sessões no mesmo browser
- **Credenciais seed**: `admin / admin123` — trocar após primeiro acesso

## Identidade Visual — Krakion Labs

A UI usa a marca **Krakion Labs** com paleta de **índigo/violeta** (estilo Linear.app) mapeada na chave `sysgate` do Tailwind:

| Token         | Hex       | Uso principal                          |
|---------------|-----------|----------------------------------------|
| sysgate-600   | `#4f46e5` | Botões primários, links, foco          |
| sysgate-700   | `#4338ca` | Hover de botões                        |
| sysgate-500   | `#6366f1` | Acentos, ícones ativos                 |
| sysgate-100   | `#e0e7ff` | Badges, hover de itens                 |
| sysgate-50    | `#eef2ff` | Fundos suaves de itens selecionados    |

- **Logo login**: `frontend/public/nova-logo.webp` — WebP 500px sem fundo, 23 KB
- **Logo dashboards**: `frontend/public/logo-com-nome.webp` — WebP 500px, 48 KB
- **Tela de login**: gradiente `from-indigo-50 via-white to-violet-50`, logo `w-64`, card branco com sombra
- **Modal de cadastro**: 2 etapas — (1) nome/login/senha → POST `/api/auth/registrar` → (2) tela de sucesso informando aguarda ativação
- A paleta `sysgate` NÃO foi renomeada no Tailwind para não quebrar todos os componentes existentes

## Padrões importantes

- **Tailwind safelist obrigatório**: `tailwind.config.js` tem `safelist: [{ pattern: /sysgate/ }]` — sem isso, `@apply bg-sysgate-600` falha no `index.css` porque o JIT não gera a classe antes do `@layer components` ser processado. NÃO remover. A paleta `sysgate` usa índigo/violeta Krakion Labs (sysgate-600 = `#4f46e5`).
- **Rotas nomeadas ANTES de /:id** no Express (ex: `/swagger`, `/limpar-tudo` devem vir antes de `/:id`)
- **bodySchema** é armazenado como `String` (JSON serializado) no SQLite, parseado/stringificado manualmente
- **Sentinel `_exemplo`** no bodySchema: o primeiro elemento `{ _exemplo: true, json: {...} }` contém o exemplo completo do request body da spec. Frontend filtra com `.filter(c => !c._exemplo)`
- **Swagger parser** resolve `$ref`, `allOf`, `anyOf/oneOf` com limite de 5 níveis de profundidade
- **Array bodies**: quando o requestBody é `type: array`, os campos são extraídos do `items`
- **HTML auto-detection**: `/fetch-swagger` detecta se a URL retornou HTML do Swagger UI e tenta extrair o URL do JSON automaticamente
- **Sistema urlBase**: NÃO deve terminar com `/api` ou `/api/` — os paths dos endpoints importados do Swagger já incluem `/api/...`. URL final = `urlBase + endpoint.path`. Ex correto: `https://tributos.betha.cloud/service-layer-tributos`. Ex errado: `...service-layer-tributos/api` → URL ficaria `...api/api/imoveis` (duplo `/api`) → 404 no Betha.
- **Zustand persist**: município ativo persiste em `localStorage` (key: `krakion-municipio`)
- **Município sem codigoIBGE**: campo removido do schema, validação e UI — apenas `nome` e `observacoes`
- **Tokens por município**: painel lateral em `Municipios.jsx` — abre ao clicar na linha da tabela; um token por par (município × sistema). Campo `ambiente` removido da UI (default `"producao"` no banco). Painel exibe token mascarado (primeiros 8 chars + `••••`) com botão de olho para revelar e botão de copiar. Backend retorna token real (sem mascaramento). Tokens isolados por usuário — o proxy verifica `usuarioId` antes de executar
- **Validade do token (`dataVencimento`)**: campo `DateTime?` opcional em `MunicipioSistema`. Cadastrado no modal "Adicionar token" com `<input type="date">` (min = hoje, max = hoje + 15 dias — duração máxima real de um token Betha). Exibe badge colorido abaixo do nome do sistema no painel de tokens: verde (> 30 dias), amarelo (8–30 dias), laranja (1–7 dias / "Vence hoje"), vermelho ("Expirado há X dias"). Apenas informativo — não bloqueia uso do token. Tokens sem data não exibem badge. Para atualizar a data de um token existente: re-salvar o mesmo sistema via "+ Adicionar sistema" (upsert).
- **Municípios isolados por usuário**: campo `usuarioId Int?` em `Municipio`; queries sempre filtradas por `req.usuario.id`. Municípios de outros usuários são invisíveis e inacessíveis (404 em vez de 403 para não vazar informação de existência)
- **Swagger exclusivo em Sistemas**: `SwaggerImport` só é usado em `Sistemas.jsx` — aba Specs ou botão na aba Informações; `Sandbox (pages/Sandbox/)` não tem esse botão; botões de importação visíveis **apenas para admin**
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
- **Chamados — numeração**: formato `#CH-{ano}-{id com 4 zeros}`, calculado no frontend via `ticketNum(c)`. Sem campo no banco.
- **Chamados — histórico automático**: `PUT /api/chamados/:id` compara estado antes/depois e cria entradas `ChamadoHistorico` via `createMany` para cada campo alterado (`status`, `responsavel`, `classificacao`, `prioridade`, `titulo`, `vertical`). Ver `docs/chamados.md`.
- **Chamados — ordem das rotas**: `/estatisticas`, `/dashboard`, `/anexos/:aid`, `/comentarios/:cid` registrados ANTES de `/:id`.
- **Analisador JSON**: módulo 100% client-side, sem rotas de backend. Ver `docs/analisador-json.md`.
- **localStorage keys**: `krakion-auth` (authStore), `krakion-municipio` (municipioStore), `krakion-json-viewerDark` (AnalisadorJson)

## UI — Sandbox (padrões compartilhados entre abas)

A página `/sandbox` tem um **painel esquerdo compartilhado** (cards 1–4: município, sistema, endpoint, método/path) e alterna entre duas abas no painel direito: **Requisição única** (`AbaRequisicao.jsx`) e **Envio em Lote** (`AbaEnvioLote.jsx`). O estado da seleção (município, sistema, módulo, recurso, endpoint, camposSelecionados) vive em `index.jsx` e é passado como props para ambas as abas. Ao trocar de aba, o estado local da aba anterior é descartado (comportamento intencional — CSV e resposta resetam).

### Arquitetura de estado — Sandbox/index.jsx (pai) vs abas (filhos)

| Estado | Dono | Como passa |
|--------|------|------------|
| `municipioSel, sistemaSel, moduloSel, recursoSel, endpointSel` | `index.jsx` | props read-only |
| `metodo, pathCustom` | `index.jsx` | props read-only (editáveis no painel esquerdo) |
| `camposSelecionados` | `index.jsx` | prop + setter (filhos chamam `setCamposSelecionados` só para eventos de usuário) |
| `schema, schemaExpanded` | `index.jsx` (useMemo) | props read-only |
| `valoresCampos, bodyRaw, modoBody, resposta, historico` | `AbaRequisicao` | local |
| `csvData, csvArquivo, mapeamentoCampo, progresso` | `AbaEnvioLote` | local |

`camposSelecionados` é inicializado pelo pai no `useEffect([endpointSel])`. Os filhos NÃO devem reinicializá-lo ao mudar de endpoint — apenas o pai faz isso. Filhos podem chamar `setCamposSelecionados` para toggles de checkbox (AbaRequisicao) e auto-mapping CSV (AbaEnvioLote).

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

### Auto-mapeamento CSV (aba Envio em Lote)
- Ao fazer upload do CSV, compara `_displayCampo` (nome curto do sub-campo) com o nome da coluna CSV (case-insensitive)
- Se houver match: pré-seleciona o checkbox e pré-preenche o dropdown

## Sandbox — aba Envio em Lote (padrões específicos)

### CSV sem cabeçalho
- Toggle "Sem cabeçalho" na seção CSV (card 5 dentro de `AbaEnvioLote.jsx`)
- Estados: `csvArquivo` (guarda o `File` para re-parse) + `csvSemCabecalho` (boolean)
- `useEffect` com deps `[csvArquivo, csvSemCabecalho]` re-parseia o arquivo ao mudar o toggle
- Com `csvSemCabecalho: false` → PapaParse com `header: true`, colunas = `meta.fields`
- Com `csvSemCabecalho: true` → PapaParse com `header: false`, colunas geradas automaticamente como letras `A`, `B`, `C`, ... (até 26; depois `Col1`, `Col2`, ...)
- Dropdown de mapeamento exibe: `A — valor` (sem cabeçalho) ou `NomeColuna — valor` (com cabeçalho)
- Tabela de preview: cabeçalho = letras das colunas, linhas = dados do CSV (não transposto)

### Envio em lote (array body)
- **Não envia uma requisição por linha** — agrupa linhas em batches e envia um array JSON por batch
- `tamanhoBatch` (state, padrão 50): configurável via slider 1–200 no card de configuração (card 6 dentro de `AbaEnvioLote.jsx`)
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

## Deploy — resumo

> Documentação completa (Nginx, PM2, tunnel SSH, proxy.js): `skills/deploy.md`

```bash
# Deploy padrão após git push
ssh root@187.77.230.138
cd /var/www/krakion && git pull && cd frontend && npm run build && cd ../backend && pm2 restart krakion-backend
```

> **Atenção:** chamadas à API Betha em produção exigem o tunnel SSH ativo no PC do implantador. Ver `skills/deploy.md`.
