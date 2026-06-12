# Krakion

Ferramenta interna fullstack para implantadores Betha. Gerencia municípios, executa chamadas API via proxy, importa specs Swagger/OpenAPI, envia requisições em lote, organiza scripts e mantém o portfólio de clientes (municípios atendidos com entidades, sistemas e contatos).

## Stack

| Camada    | Tecnologia                                                                        |
|-----------|-----------------------------------------------------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS 3 + Zustand 4 + React Router 6 + Recharts         |
| Backend   | Node.js + Express 4 + Prisma ORM + PostgreSQL (migrado de SQLite em 2026-06-11)   |
| Segurança | Helmet.js + express-rate-limit + bcryptjs + jsonwebtoken + hCaptcha               |
| CSV       | Papa Parse (parsing de CSV no frontend)                                           |
| HTTP      | Axios (frontend→backend e backend→APIs)                                           |
| Gráficos  | Recharts (BarChart, PieChart, AreaChart — usado no Dashboard de Chamados)         |
| Docker    | docker-compose com 2 serviços (backend + frontend)                                |

## Skills de Desenvolvimento

Workflow de desenvolvimento adaptado do [obra/superpowers](https://github.com/obra/superpowers):

| Situação | Skill |
|----------|-------|
| Trabalhando com backlog de melhorias (ler → planejar → implementar → registrar) | `skills/melhorias.md` |
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
│   ├── notas.md               # Módulo Notas (Google Keep): modelos, API, comportamentos
│   ├── usuarios.md            # Módulo Usuários e Perfil: schema, rotas, recuperação de senha, MeuPerfil
│   ├── conhecimento.md        # Módulo Conhecimento: base colaborativa de FAQs, erros, passo a passo
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
│   ├── .env                   # DATABASE_URL, PORT, JWT_SECRET, JWT_EXPIRES_IN, HCAPTCHA_SECRET, SMTP_HOST/PORT/SECURE/USER/PASS/FROM, APP_URL, CORS_ORIGINS (opcional)
│   ├── prisma/
│   │   ├── schema.prisma      # 24 modelos: Script, Tag, Relatorio, Municipio (+ usuarioId), MunicipioSistema (+ dataVencimento), Sistema, Endpoint, Requisicao, SwaggerSpec, Usuario (+ filaFiltro, email, funcao, ultimoLogin, recuperacaoToken, recuperacaoExpira, conhecimentosAutor), PortfolioMunicipio, Entidade, EntidadeSistema (+ vertical), Stakeholder, StakeholderSistema, CatalogoVertical, Chamado (+ solicitanteId, numero, origem), ChamadoComentario (+ autorId opcional, autorSolicitanteId, interno), ChamadoAnexo (+ comentarioId), ChamadoHistorico, Solicitante (+ email único e credenciais do portal: senhaHash, contaAtiva, emailVerificado, lockout, recuperação), Nota, NotaCompartilhamento, Conhecimento
│   │   ├── seed.js            # Dados iniciais + cria usuário admin padrão (admin/admin123) + usuário-sistema "portal" (inativo, p/ criadoPorId de chamados do portal) — DESTRUTIVO: apaga municípios/scripts/endpoints
│   │   ├── migrar-sqlite-postgres.js # Migração de dados dev.db → Postgres preservando IDs (DMMF, pivots M2M, sequences, verificação de contagens) — requer Node ≥ 22.5
│   │   └── dev.db             # SQLite LEGADO (fallback pré-migração; banco atual é PostgreSQL)
│   └── src/
│       ├── index.js           # Express server + Helmet + CORS allowlist (env CORS_ORIGINS; same-origin sempre permitido) + rate limiter global (50000 req/15min); monta /api/portal/* antes do autenticar global
│       ├── middleware/
│       │   └── autenticar.js  # Verifica JWT Bearer; injeta req.usuario; exporta exigirAdmin; rejeita tokens tipo "externo"; exporta autenticarExterno (portal — injeta req.solicitante)
│       ├── lib/
│       │   ├── prisma.js      # Instância ÚNICA de PrismaClient — TODA rota usa require('../lib/prisma'); NUNCA new PrismaClient() em rota (esgota pool do Postgres)
│       │   ├── numeroChamado.js # prefixoMunicipio() + gerarNumero() — protocolo persistido PREFIXO-YYYY-NNNNN em transação
│       │   └── authUtils.js   # hashToken (SHA-256), captchaValido (hCaptcha), criarTransporter (SMTP) — compartilhados entre auth interno e portal
│       └── routes/
│           ├── auth.js        # POST /login (rate limit 10/15min + lockout + hCaptcha + atualiza ultimoLogin) + /logout + /me + /registrar + /esqueci-senha (rate limit 5/15min) + /redefinir-senha
│           ├── usuarios.js    # CRUD usuários — GET/PUT/PATCH permitidos ao próprio usuário; POST/DELETE somente admin; PUT aceita email/funcao além de nome/filaFiltro
│           ├── municipios.js  # CRUD (sem codigoIBGE) + PATCH /:id/ativar + tokens por sistema — ESCOPO DO USUÁRIO (cada usuário vê só os seus)
│           ├── sistemas.js    # CRUD sistemas — leitura pública; escrita/exclusão somente admin
│           ├── endpoints.js   # CRUD + importar JSON + Swagger parser + fetch-swagger + limpar-tudo — leitura pública; escrita/exclusão somente admin
│           ├── proxy.js       # POST /executar — proxy para APIs com token; verifica posse do município; extrai idGerado de respostas array e objeto
│           ├── requisicoes.js # GET + DELETE histórico — filtrado por municípios do usuário logado (isolamento por usuário)
│           ├── scripts.js     # CRUD com tags (categoria: script|formula|anotacao) + importar JSON
│           ├── relatorios.js  # CRUD + GET /:id/jxrml (download base64→buffer) — modelo Relatorio
│           ├── portfolio.js   # CRUD Portfólio — PortfolioMunicipio + Entidade + EntidadeSistema + Stakeholder (M2M) — leitura pública; escrita/exclusão somente admin
│           ├── catalogo.js   # CRUD CatalogoVertical — verticais Betha com nome/cor/sistemas/ordem; seed automático na 1ª chamada GET — leitura pública; escrita somente admin
│           ├── chamados.js   # CRUD Chamados + comentários (aceita flag interno) + anexos (+ comentarioId) + histórico de alterações + dashboard agregado (semResponsavel inclui origem); detalhe expõe solicitante.contaAtiva/temConta (sem senhaHash); filtros: semResponsavel, excluirEncerrados, verticais (CSV), sistemas (CSV), prioridade, municipio; acesso público (autenticados); DELETE somente admin
│           ├── solicitantes.js # CRUD Solicitantes externos (contatos do cliente) — leitura/escrita pública (autenticados); DELETE somente admin; email duplicado → 409; select público (não vaza credenciais do portal); temConta derivado; ?contaPendente=true; PATCH /:id/conta (admin) aprova conta do portal
│           ├── portalAuth.js  # Auth do PORTAL EXTERNO (/api/portal/auth) — registrar (hCaptcha + rate limit, contaAtiva: false), login por email (lockout), me, esqueci/redefinir-senha (hash SHA-256); JWT { sid, tipo: 'externo' }
│           ├── portalChamados.js # Chamados do PORTAL (/api/portal/chamados) — autenticarExterno; sempre where solicitanteId=sid (404 se não dono); criação origem "portal" + numero + histórico; filtra comentários internos e seus anexos; upload validado
│           ├── notas.js      # CRUD Notas + PATCH /ordem (batch reorder) + PATCH /:id/fixar + compartilhamento por usuário — isolado por usuário
│           └── conhecimento.js # CRUD Conhecimento — todos criam; autor/admin editam; somente admin deleta; dados globais
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
        ├── main.jsx           # Entry React + listener vite:preloadError — recarrega a página quando um chunk lazy falha após deploy (guard de 10s contra loop)
        ├── App.jsx            # BrowserRouter: /login e /redefinir-senha públicas + PrivateRoute; rotas do portal externo (/portal/login, /portal/registro, /portal/redefinir-senha públicas + /portal/* via PortalRoute); rota /perfil protegida; todas as páginas carregadas com React.lazy + Suspense (code splitting por rota)
        ├── index.css          # Classes Tailwind custom: .btn, .card, .input, .badge, .label
        ├── lib/
        │   ├── api.js         # Axios centralizado + interceptor JWT (Bearer) + interceptor 401→logout; exporta scriptsApi, relatoriosApi, portfolioApi, catalogoApi, chamadosApi, solicitantesApi, notasApi e conhecimentoApi; authApi inclui esquecerSenha() e redefinirSenha()
        │   └── portalApi.js   # Axios do PORTAL EXTERNO (baseURL /api/portal) — injeta só o token do solicitante; 401 com sessão ativa → logout do portal; exporta portalAuthApi e portalChamadosApi
        ├── stores/
        │   ├── municipioStore.js  # Zustand + persist (localStorage, key: krakion-municipio)
        │   ├── authStore.js       # Zustand + persist (krakion-auth) — token + usuario; suporta lembrar (30d); logout limpa krakion-municipio do localStorage
        │   └── portalAuthStore.js # Zustand + persist (krakion-portal-auth) — token + solicitante do portal externo; coexiste com a sessão interna no mesmo browser
        ├── components/
        │   ├── Layout.jsx         # Sidebar + barra acento gradiente no topo + header: chip usuário + botão Sair
        │   ├── Sidebar.jsx        # NavLinks com SVG icons; grupo Ferramentas: Scripts, Analisador JSON, Notas, Conhecimento, Sandbox, Histórico; admin vê grupo "Configuração" completo (Sistemas + Central de Tokens + Usuários); não-admin vê apenas "Central de Tokens"; "Meu Perfil" visível para todos os usuários (fora do grupo)
        │   ├── PrivateRoute.jsx   # Redireciona para /login se não autenticado; AdminRoute para role
        │   ├── PortalRoute.jsx    # Guarda das rotas /portal/* — redireciona para /portal/login se sem sessão do solicitante
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
            ├── Login.jsx          # Layout Krakion Labs; hCaptcha após 3 falhas; modal cadastro 2 etapas; link "Esqueci minha senha" abre ModalEsqueceuSenha (campo loginOuEmail + tela de confirmação)
            ├── MeuPerfil.jsx      # Tela /perfil — full-width; card de identidade (avatar com iniciais + câmera, nome, badges funcao/role, membro desde, último acesso); form Informações pessoais (Login readonly + Nome / Email / Função); card Segurança (alterar senha inline); card Atividades; banner Proteção de Dados
            ├── RedefinirSenha.jsx # Rota pública /redefinir-senha?token=... — lê token via useSearchParams, formulário nova senha, tela de sucesso; usa authApi.redefinirSenha()
            ├── Portal/            # PORTAL EXTERNO (solicitantes) — Fase 3; trilho separado, sem sidebar interna
            │   ├── constants.js            # STATUS_PORTAL (tradução status → linguagem do cliente), validarArquivo (MIME/5MB da Fase 0), arquivoParaBase64, formatadores
            │   ├── Layout.jsx              # Header com logo + chip do solicitante + Sair; conteúdo max-w-4xl; Outlet
            │   ├── Login.jsx               # Login por email; hCaptcha após 3 falhas; "Manter conectado" (30d); modal Esqueci minha senha
            │   ├── Registro.jsx            # Cadastro com hCaptcha; conta nasce pendente — tela de sucesso informa aprovação manual
            │   ├── RedefinirSenha.jsx      # Rota pública /portal/redefinir-senha?token=... (destino do link de email do portal)
            │   ├── MeusChamados.jsx        # Lista do solicitante: busca debounced 400ms + filtro de status traduzido + paginação (20/pág)
            │   ├── NovoChamado.jsx         # Título + descrição + anexos validados client-side; cria chamado e sobe anexos na sequência
            │   └── DetalheChamado.jsx      # Timeline "Conversa" (badge Equipe), resposta com pendingAnexoIds, download de anexo via blob; encerrado bloqueia resposta
            ├── Usuarios.jsx       # Admin: CRUD completo + toggleAdmin (alterna role admin↔operador) + seção "Contas do Portal" (aprovar/desativar contas de solicitantes externos — Fase 4); Não-admin: redireciona para /perfil via useEffect + useNavigate
            ├── Dashboard.jsx      # Tela "Início": saudação personalizada (bom dia/tarde/noite + nome + data) + 4 cards de stats verticais (Minha Fila, Sem Responsável, Em Aberto, Portfólio) + tabela Minha Fila (5 chamados atribuídos ao usuário, com status pill, prioridade, município, tempo relativo) + Acesso Rápido (grade 2x3 com 6 módulos principais) + Notas Fixadas (condicional — exibido apenas se houver notas fixadas); removidos: card município ativo e tabela últimas requisições
            ├── Municipios.jsx     # CRUD + painel lateral de tokens com gradiente + ícones de ação — dados isolados por usuário
            ├── Sistemas.jsx       # CRUD + painel detalhe com 3 abas + busca de endpoints + ícones de ação — edição/exclusão/import visíveis só para admin; botão "Catálogo" (admin) abre ModalCatalogo para gerenciar verticais Betha
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
            │   ├── index.jsx               # Componente principal — 3 abas: Minha Fila (sub-abas Meus/Fila/Sem Responsável), Painel, Dashboard; painel de detalhe compartilhado; badge "Portal" (origem portal) + toggle Nota interna/Resposta ao cliente + badge Cliente em comentários externos (Fase 4)
            │   ├── AbaPainel.jsx           # Aba Painel — tabela densa de todos os chamados com filtros completos e paginação independente
            │   ├── ModalFilaConfig.jsx     # Modal de configuração da Fila personalizada (verticais + sistemas + status)
            │   ├── ChamadosDashboard.jsx   # Dashboard Recharts (AreaChart, PieChart, BarChart)
            │   ├── PainelHistorico.jsx     # Painel lateral de histórico de alterações (timeline)
            │   ├── ModalChamado.jsx        # Modal criar/editar chamado; inclui SearchSelect de solicitante + inline-create de novo solicitante
            │   └── constants.js           # STATUS_CORES (inclui Cancelado=#6B7280), CLASSIF_CORES, PRIORIDADE_CORES, STATUS_OPTS, helpers
            ├── Notas/
            │   ├── index.jsx               # Componente principal — grid responsivo, seções Fixadas/Outras, drag & drop HTML5 nativo, filtros por busca/tipo/etiqueta
            │   ├── NotaCard.jsx            # Card draggable com fundo colorido; ações no hover; renderização por tipo; chips de etiquetas
            │   └── ModalNota.jsx           # Modal criar/editar; abas de tipo; editor de itens checklist/lista; seletor de 10 cores; compartilhamento por usuário
            ├── Conhecimento/
            │   ├── index.jsx               # Componente principal — lista esquerda (w-80, bg-gray-50/70, cards rounded-xl com shadow-sm e margem lateral) + painel detalhe direito (bg-white); filtros busca/tipo/vertical/sistema; paginação; `RenderBlocos` renderiza blocos (texto/subtítulo/código/nota)
            │   ├── constants.js            # TIPO_CONFIG, TIPO_OPTS e `parseConteudo(str)` — detecta JSON de blocos ou texto plano e retorna array de blocos
            │   └── ModalConhecimento.jsx   # Modal criar/editar; editor de blocos (BlocoEditorList + BlocoItem + AddBlocoMenu); suporte a blocos ricos dentro de cada passo (passo-a-passo)
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
npx prisma db push          # Cria/atualiza tabelas no PostgreSQL
node prisma/seed.js         # Popula dados iniciais (CUIDADO: destrutivo — apaga municípios/scripts/endpoints)
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
| Método | Rota                        | Descrição                                                                                      |
|--------|-----------------------------|-----------------------------------------------------------------------------------------------|
| POST   | /api/auth/login             | Login — retorna JWT (rate limit 10/15min + lockout); atualiza `ultimoLogin`                   |
| POST   | /api/auth/logout            | Logout (stateless — cliente descarta token)                                                   |
| GET    | /api/auth/me                | Retorna dados do usuário logado incl. `email`, `funcao`, `ultimoLogin` (requer token)         |
| POST   | /api/auth/registrar         | Auto-cadastro: cria conta com `ativo: false`, aguarda aprovação                               |
| POST   | /api/auth/esqueci-senha     | Gera token de recuperação e envia email (rate limit 5/15min). Sempre retorna sucesso genérico |
| POST   | /api/auth/redefinir-senha   | Valida token + expiry, atualiza senha, limpa `recuperacaoToken`/`recuperacaoExpira`           |
| GET    | /api/health                 | Health check                                                                                   |

### Usuários
> **Admin**: acesso completo. **Não-admin**: `GET` retorna só si mesmo; `PUT` e `PATCH /senha` permitidos apenas no próprio id; `POST` e `DELETE` bloqueados (403).

| Método | Rota                        | Descrição                                                                                        |
|--------|-----------------------------|--------------------------------------------------------------------------------------------------|
| GET    | /api/usuarios               | Admin: lista todos; não-admin: retorna apenas o próprio registro                                 |
| POST   | /api/usuarios               | Cria usuário inativo — **somente admin**                                                         |
| PUT    | /api/usuarios/:id           | Admin: atualiza nome/role/ativo/email/funcao; não-admin: só nome, email, funcao e `filaFiltro` do próprio id |
| PATCH  | /api/usuarios/:id/senha     | Admin: redefine qualquer senha; não-admin: só a própria                                          |
| DELETE | /api/usuarios/:id           | Remove — **somente admin** (impede auto-exclusão e último admin)                                 |

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
| GET    | /api/chamados                 | Lista chamados (filtros ?busca=, ?status=, ?classificacao=, ?responsavelId=, ?vertical=, ?verticais=, ?sistemas=, ?prioridade=, ?municipio=, ?semResponsavel=, ?excluirEncerrados=, ?pagina=, ?limite=) — retorna `{ data, total, pagina, limite, totalPaginas }` |
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
| POST   | /api/chamados/:id/comentarios | Adiciona comentário (aceita `pendingAnexoIds[]` para vincular imagens inline)         |
| POST   | /api/chamados/:id/anexos      | Upload de anexo (base64 no body: nomeArquivo, tipo, conteudo, tamanho, comentarioId?) |

### Solicitantes
> Acesso público (qualquer autenticado). `DELETE /:id` somente admin. Sem isolamento por usuário.

| Método | Rota                        | Descrição                                                       |
|--------|-----------------------------|-----------------------------------------------------------------|
| GET    | /api/solicitantes           | Lista (filtros ?busca=, ?municipio=, ?contaPendente=true) — retorna array com `temConta` derivado |
| POST   | /api/solicitantes           | Cria solicitante externo — email já usado → 409                |
| PUT    | /api/solicitantes/:id       | Atualiza — email já usado → 409                                |
| PATCH  | /api/solicitantes/:id/conta | Aprova/desativa conta do portal `{ contaAtiva: bool }` (aprovar zera lockout) — **somente admin** |
| DELETE | /api/solicitantes/:id       | Remove — **somente admin**                                      |

### Portal Externo (`/api/portal/*`) — Fase 2
> Trilho de autenticação **paralelo e isolado** sobre o modelo `Solicitante`. JWT com claim `tipo: 'externo'` + `sid`; rejeitado nas rotas internas (e vice-versa). Rotas de chamados protegidas por `autenticarExterno` e SEMPRE filtradas por `solicitanteId` do token (não-dono → 404).

| Método | Rota                                   | Descrição                                                                      |
|--------|----------------------------------------|---------------------------------------------------------------------------------|
| POST   | /api/portal/auth/registrar             | Cria conta (hCaptcha + rate limit 5/15min); `contaAtiva: false` (aprovação manual); email com conta → 409 |
| POST   | /api/portal/auth/login                 | Login por email (lockout 5/15min + rate limit 10/15min); conta não aprovada → 401 |
| POST   | /api/portal/auth/logout                | Stateless                                                                       |
| GET    | /api/portal/auth/me                    | Dados da própria conta (token externo)                                          |
| POST   | /api/portal/auth/esqueci-senha         | Token hash SHA-256 + expiry 1h; resposta sempre genérica (rate limit 5/15min)   |
| POST   | /api/portal/auth/redefinir-senha       | Valida token/expiry, redefine senha, limpa lockout                              |
| GET    | /api/portal/chamados                   | Lista chamados do solicitante (?busca=, ?status=, paginação) — sem campos internos |
| GET    | /api/portal/chamados/anexos/:aid       | Download — 404 se não dono ou anexo de comentário interno                       |
| GET    | /api/portal/chamados/:id               | Detalhe com timeline pública (filtra comentários `interno` e seus anexos)       |
| POST   | /api/portal/chamados                   | Abre chamado: `origem: 'portal'`, criadoPorId = usuário-sistema portal, numero persistido + histórico |
| POST   | /api/portal/chamados/:id/comentarios   | Comentário externo (`autorSolicitanteId`, sempre `interno: false`, aceita pendingAnexoIds) |
| POST   | /api/portal/chamados/:id/anexos        | Upload com validação da Fase 0 (MIME/5MB/25MB); `comentarioId` do cliente ignorado |

### Notas
> **Isolamento por usuário**: cada usuário vê apenas suas notas + notas compartilhadas com ele. Ordem das rotas Express: `/ordem` ANTES de `/:id`.

| Método | Rota                              | Descrição                                                                              |
|--------|-----------------------------------|----------------------------------------------------------------------------------------|
| GET    | /api/notas                        | Lista notas próprias + compartilhadas; `?busca=`, `?etiqueta=`, `?tipo=`               |
| POST   | /api/notas                        | Cria nota (`usuarioId = req.usuario.id`)                                               |
| PATCH  | /api/notas/ordem                  | Reordenação batch: `{ itens: [{id, ordem}] }` — só atualiza notas do usuário           |
| GET    | /api/notas/:id                    | Detalhe com lista de compartilhamentos                                                 |
| PUT    | /api/notas/:id                    | Atualiza (dono ou compartilhado com acesso)                                            |
| DELETE | /api/notas/:id                    | Remove — somente dono                                                                  |
| PATCH  | /api/notas/:id/fixar              | Toggle `fixada` — somente dono                                                         |
| POST   | /api/notas/:id/compartilhar       | Compartilha com `{ usuarioId }` (upsert) — somente dono                                |
| DELETE | /api/notas/:id/compartilhar/:uid  | Remove compartilhamento de um usuário — somente dono                                   |

### Conhecimento
> Acesso público (qualquer autenticado). Dados globais — sem isolamento por usuário. Edição restrita ao autor ou admin. Exclusão somente admin.

| Método | Rota                    | Descrição                                                                                  |
|--------|-------------------------|--------------------------------------------------------------------------------------------|
| GET    | /api/conhecimento       | Lista (filtros `?busca=`, `?tipo=`, `?vertical=`, `?sistema=`, `?pagina=`, `?limite=`) — retorna `{ data, total, pagina, limite, totalPaginas }` |
| GET    | /api/conhecimento/:id   | Detalhe com `autor`                                                                        |
| POST   | /api/conhecimento       | Cria artigo (`autorId = req.usuario.id`) — qualquer autenticado                            |
| PUT    | /api/conhecimento/:id   | Atualiza — somente autor ou admin (403 para outros)                                        |
| DELETE | /api/conhecimento/:id   | Remove — **somente admin**                                                                 |

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
- **Fase 0 (hardening de segurança)**: (1) credenciais Twilio removidas do `.env`; `JWT_SECRET` provisionado no container via `env_file: ./backend/.env` no `docker-compose.yml`. (2) `numero` de chamado persistido (ver "Chamados — numeração"). (3) Upload de anexos validado em `chamados.js`: whitelist de MIME (PNG/JPEG/GIF/WebP/PDF → 415), 5 MB/anexo + 25 MB/chamado (tamanho real calculado do base64 → 413), nome sanitizado; `express.json` global reduzido para `1mb`, com parser de `8mb` só na rota de anexos (`index.js`). (4) Token de recuperação armazenado como **hash SHA-256** (`hashToken` em `auth.js`); `/esqueci-senha` sempre retorna resposta genérica (não vaza usuário sem email); `/registrar` com `registroRateLimit` (5/15min) + hCaptcha. (5) Nginx repassa `X-Forwarded-For` para o rate limit por IP. Error handler global respeita `err.status` (413 propaga) e não vaza mais `detail`/`err.message`.
- **Ação manual pendente**: rotacionar o token Twilio no painel da Twilio (esteve em texto puro no `.env`).
- **Fase 1 (modelo de dados do portal externo)**: `Solicitante` ganhou credenciais de portal (`email @unique`, `senhaHash`, `contaAtiva` default false, `emailVerificado`, lockout `tentativasLogin`/`bloqueadoAte`, `recuperacaoTokenHash`/`recuperacaoExpira` — já nasce com hash); `Chamado.origem` (`"interno"`/`"portal"`); `ChamadoComentario` com autor duplo (`autorId` opcional XOR `autorSolicitanteId`) + flag `interno` (invisível no portal). Usuário-sistema `portal` (inativo) no seed para `criadoPorId`. A API interna nunca retorna os campos de credencial do Solicitante. Ver `krakion-analise-fable5.md` (plano) e `docs/chamados.md`.
- **Fase 2 (backend do portal externo)**: rotas `/api/portal/auth` + `/api/portal/chamados` (`portalAuth.js`/`portalChamados.js`) com trilho JWT paralelo (`tipo: 'externo'` + `sid`) — `autenticar.js` interno rejeita tokens externos e `autenticarExterno` rejeita internos. Chamados do portal sempre filtrados por `solicitanteId` do token (404 se não dono); comentários `interno: true` e seus anexos invisíveis no portal; registro com aprovação manual (`PATCH /api/solicitantes/:id/conta`, admin); lockout/rate limit/recuperação com hash iguais ao trilho interno; uploads com validação da Fase 0. Helpers compartilhados em `lib/authUtils.js`. Ver `skills/seguranca.md` e `docs/chamados.md`. A migração SQLite → Postgres (pré-requisito de exposição pública) foi concluída em 2026-06-11.
- **Fase 3 (frontend do portal externo)**: rotas `/portal/*` no mesmo SPA com store separado (`portalAuthStore.js`, key `krakion-portal-auth`) e Axios próprio (`lib/portalApi.js` — injeta só o token do solicitante; 401 com sessão ativa desloga apenas o portal). Telas: Login (hCaptcha após 3 falhas), Registro (aprovação manual), RedefinirSenha, Meus Chamados, Novo Chamado e Detalhe (timeline pública). Status internos traduzidos para a linguagem do cliente (`STATUS_PORTAL` em `pages/Portal/constants.js`). Ver `docs/chamados.md`.
- **Fase 4 (integração do portal no sistema interno, 2026-06-12)**: badge "Portal" em chamados de `origem: 'portal'` (Minha Fila, Painel, Dashboard, detalhe); toggle "Resposta ao cliente" / "Nota interna" no formulário de comentário (envia flag `interno` — o modo não reseta após enviar, só ao trocar de chamado, para não vazar nota ao cliente por engano); comentários de autor externo exibem badge "Cliente"; card SOLICITANTE indica conta no portal (`GET /api/chamados/:id` expõe `contaAtiva`/`temConta` do solicitante, sem `senhaHash`); seção "Contas do Portal" em `Usuarios.jsx` (admin) aprova/desativa contas via `PATCH /api/solicitantes/:id/conta` (`solicitantesApi.atualizarConta`). Ver `docs/chamados.md` e `docs/usuarios.md`.
- **CORS (vuln #8, 2026-06-12)**: `cors()` aberto substituído por allowlist — por padrão nenhuma origem cross-origin é permitida (frontend é same-origin via Vite proxy/Nginx); origens extras via env `CORS_ORIGINS` (separadas por vírgula). Requisições sem header `Origin` (same-origin, curl) seguem permitidas.
- **Senha mínima 8 (vuln #9, 2026-06-12)**: aplicada em registro interno, redefinição por token, CRUD de usuários (admin) e registro/redefinição do portal. Senhas existentes seguem válidas no login.
- **Recuperação de senha**: `POST /auth/esqueci-senha` aceita `loginOuEmail`; gera token hex 64 chars com expiry 1h; envia email só se SMTP configurado no `.env`; sempre retorna 200 com mensagem genérica. `POST /auth/redefinir-senha` valida token e expiry, atualiza senha, limpa campos de recuperação.
- **funcao vs role**: `role` (`admin`/`operador`) controla permissões de acesso; `funcao` (`Suporte`, `Analista de Implantação`, `Gerente`, `Administrador`) é apenas label de exibição, sem efeito em permissões.
- **ultimoLogin**: atualizado automaticamente em cada `POST /auth/login` com sucesso. Exibido na tela Meu Perfil com tempo relativo.
- **MeuPerfil.jsx**: tela em `/perfil`, acessível a todos. Card de identidade com banner gradiente `from-sysgate-600 to-violet-500` (`h-20`) no topo; avatar (`w-20 h-20`, `border-4 border-white`) sobrepõe o banner via `-mt-10`; nome, badges e login abaixo; stats (Membro desde / Último acesso) no rodapé com divisor. Cards Informações pessoais, Segurança e Atividades com `p-5`. Atividades: Login efetuado + Perfil atualizado (`atualizadoEm`) + link "Ver histórico completo". Avatar com cor determinística por hash do nome. Ícone câmera decorativo (sem upload). Alteração de senha inline (expande no card Segurança). Campos `email` e `funcao` editáveis pelo próprio usuário.
- **toggleAdmin em Usuarios.jsx**: botão "Tornar Admin"/"Revogar Admin" alterna `role` entre `admin` e `operador`. Visível apenas para admin, e não aparece na própria linha do usuário logado.

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

- **Banco PostgreSQL (migrado de SQLite em 2026-06-11)**: regras obrigatórias — (1) toda rota usa `const prisma = require('../lib/prisma')`, **nunca** `new PrismaClient()` (cada instância abre um pool; esgota conexões); (2) todo `contains` de busca leva `mode: 'insensitive'` (Postgres é case-sensitive por padrão; SQLite não era); (3) `$queryRaw` em sintaxe Postgres com identificadores entre aspas (`"Chamado"`, `"criadoEm"`). Campos JSON continuam `String` com parse/stringify manual. Detalhes em `skills/banco-de-dados.md`. O setup Docker (`docker-compose.yml`) ainda **não** foi atualizado para Postgres — produção usa PM2.
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
- **ModalCatalogo (`Portfolio/ModalCatalogo.jsx`)**: admin only, acessível pelo botão "Catálogo" em `Sistemas.jsx` (Configuração → Sistemas). O arquivo do componente permanece em `Portfolio/` por conveniência. Lista cards editáveis: nome (input), cor (`<input type="color">`), sistemas (chips com × para remover + input Enter para adicionar). "+ Nova vertical" adiciona entrada com `_novo: true`. Ao salvar: itera `deletados[]` (DELETE), depois itera `itens` (POST para `_novo`, PUT para existentes). Em `Sistemas.jsx` o `onSaved` é no-op (Sistemas não consome estado do catálogo). Em `Portfolio/index.jsx` o catálogo ainda é lido via `catalogoApi.listar()` para exibição no accordion — apenas o gatilho de edição foi removido.
- **Chamados — numeração**: formato `PREFIXO-YYYY-NNNNN`, **persistido** em `Chamado.numero String? @unique` (Fase 0). Gerado no backend via `backend/src/lib/numeroChamado.js` (`gerarNumero` em `prisma.$transaction`, retry em P2002), sequencial por prefixo+ano. Prefixo = 4 primeiras letras do município sem acentos (ex: `RURO`, `BELE`) ou `CH`. Backfill: `backend/prisma/backfill-numero.js`. Como é persistido, o número **não muda** mais ao deletar chamados. Frontend ainda calcula client-side (`ticketMapMF`/`ticketNum()`) — migração para `c.numero` pendente. Ver `docs/chamados.md`.
- **Chamados — status Cancelado**: `STATUS_CORES` e `STATUS_OPTS` em `constants.js` incluem `'Cancelado'` (cor `#6B7280`). Aparece no filtro de status e nos badges.
- **Chamados — solicitante**: modelo `Solicitante` (nome, cargo, email, telefone, municipio) armazena contatos externos do cliente. Campo `solicitanteId Int?` em `Chamado`. Rota `/api/solicitantes` CRUD completo (DELETE somente admin). Exibido como card de metadados no detalhe do chamado. **Fase 1**: `email` é `@unique` (409 em duplicidade) e o modelo carrega credenciais do futuro portal externo — respostas da API usam `SELECT_PUBLICO` (expõe `contaAtiva`, nunca `senhaHash`/tokens).
- **Chamados — preparação portal (Fase 1)**: `Chamado.origem` (`"interno"` default | `"portal"`); `ChamadoComentario.autorId` opcional + `autorSolicitanteId` (autor externo) + `interno Boolean` (nota da equipe invisível no portal — rotas internas exibem tudo; filtro aplicado nas rotas `/api/portal/*` da Fase 2). `GET /api/chamados/:id` inclui `autorSolicitante { id, nome }` nos comentários. Chamados do portal usam o usuário-sistema `portal` em `criadoPorId`.
- **Chamados — portal externo (Fase 2)**: `POST /api/chamados/:id/comentarios` interno aceita flag `interno` (nota da equipe — toggle de UI fica para a Fase 4). Rotas do portal em `portalChamados.js` reutilizam `gerarNumero` (transação + retry P2002) e a validação de anexos da Fase 0; o parser de 8 MB do `index.js` cobre também `POST /api/portal/chamados/:id/anexos`.
- **Chamados — portal externo (Fase 3, frontend)**: rotas `/portal/*` no mesmo SPA (lazy), guardadas por `PortalRoute` + store `krakion-portal-auth` — sessão coexiste com a interna no mesmo browser. Toda exibição de status passa por `statusPortal()` (`pages/Portal/constants.js`) — o vocabulário interno nunca aparece para o cliente. Anexos validados client-side (`validarArquivo` espelha MIME/5MB da Fase 0); resposta no detalhe sobe anexos antes e vincula via `pendingAnexoIds`; chamado Concluído/Cancelado bloqueia novas respostas. Ver `docs/chamados.md`.
- **Chamados — integração do portal (Fase 4)**: badge violeta "Portal" exibido quando `c.origem === 'portal'` (cards Minha Fila, coluna Título do Painel, lista sem responsável do Dashboard, cabeçalho do detalhe). Formulário de comentário tem toggle pills "Resposta ao cliente" (default) / "Nota interna" (state `comentarioInterno`); nota interna renderiza em âmbar com badge + cadeado e o editor ganha tint âmbar. Comentário de `autorSolicitanteId` exibe nome do solicitante + badge "Cliente". Card SOLICITANTE exibe "Conta no portal" (contaAtiva) ou "Conta pendente" (temConta). Aprovação de contas na seção "Contas do Portal" de `Usuarios.jsx` (admin).
- **Chamados — Minha Fila / AbaPainel**: módulo tem 3 abas (Minha Fila, Painel, Dashboard). Minha Fila tem 3 sub-abas: Meus (atribuídos ao usuário logado, excluindo encerrados), Fila (filtro personalizado por vertical/sistema/status salvo no servidor) e Sem Responsável (sem responsável + excluindo encerrados). Aba Painel usa `AbaPainel.jsx` com estado de filtros independente e limite de 30 por página. Ambas compartilham o mesmo painel de detalhe à direita.
- **Chamados — filaFiltro**: campo `filaFiltro String?` no modelo `Usuario`. Armazena JSON `{ "verticais": [], "sistemas": [], "status": [] }`. Escrito via `PUT /api/usuarios/:id`; lido via `GET /api/auth/me`. Configurado via `ModalFilaConfig.jsx` (chips de verticais/sistemas/status). Se não configurado, exibe empty state na sub-aba Fila.
- **Chamados — paginação Minha Fila**: padrão 20 itens por página, opção 50 via botão "Por pág: 20 | 50". Estados `totalMF`, `paginaMF`, `limiteMF`. `ticketMapMF` é useMemo calculado em O(n) uma vez por load — evita O(n²) de calcular por card.
- **Chamados — contSemDono separado**: `carregarContSemDono` é useCallback próprio, chamado apenas no mount e após mutações que alteram responsável ou excluem chamado — nunca dentro de `carregar()`. Usa `limite: 1` para custo mínimo.
- **Chamados — busca debounced**: campo `buscaInput` (exibido imediatamente) + `busca` (debounced 400ms via `useRef` + `setTimeout`) — evita requests a cada tecla.
- **Chamados — Delegar para mim**: botão no cabeçalho do painel de detalhe (abaixo dos badges). Sem responsável → verde "Delegar para mim" (delega direto). Com outro responsável → âmbar "Delegar para mim" (abre `ConfirmDialog`). Não exibe se já é do usuário logado ou chamado encerrado. Usa `atualizarCampo('responsavelId', usuario.id)` — badge da sub-aba Sem Responsável atualiza automaticamente.
- **Chamados — comentários @mention**: ao digitar `@` no textarea de comentário, dropdown lista usuários internos para seleção. `@Nome` inserido no texto fica destacado no comentário publicado (fundo `sysgate-50`). States: `mostrarMention`, `mentionQuery`. Refs: `textareaRef`.
- **Chamados — imagens inline**: botão de câmera no formulário de comentário faz upload da imagem como anexo com `comentarioId` associado. A imagem é carregada como blob URL (auth header) e exibida abaixo do texto do comentário. `pendingCommentAnexos` guarda IDs de anexos antes de enviar o comentário; ao enviar, `POST /:id/comentarios` recebe `pendingAnexoIds` e faz `updateMany` para vincular. `comentarioImgs` state armazena `{ [comentarioId]: blobUrl }`.
- **Chamados — auto-linkify**: função `linkify(texto)` escapa HTML e converte URLs em `<a target="_blank">` e `@mentions` em `<span>` destacado. Aplicada na descrição e em cada comentário via `dangerouslySetInnerHTML`.
- **Chamados — histórico automático**: `PUT /api/chamados/:id` compara estado antes/depois e cria entradas `ChamadoHistorico` via `createMany` para cada campo alterado (`status`, `responsavel`, `classificacao`, `prioridade`, `titulo`, `vertical`). Ver `docs/chamados.md`.
- **Chamados — ordem das rotas**: `/estatisticas`, `/dashboard`, `/anexos/:aid`, `/comentarios/:cid` registrados ANTES de `/:id`.
- **Analisador JSON**: módulo 100% client-side, sem rotas de backend. Ver `docs/analisador-json.md`.
- **Chunks obsoletos após deploy (2026-06-12)**: cada deploy troca os hashes dos chunks do Vite — abas abertas com o bundle antigo quebravam em tela branca ao navegar (React.lazy recebia o index.html do fallback SPA no lugar do JS). Defesa em duas camadas: `main.jsx` escuta `vite:preloadError` e recarrega a página (guard de 10s em sessionStorage); Nginx de produção serve `/assets/` com `try_files $uri =404` + cache imutável e `index.html` com `no-cache`. Ver `skills/deploy.md`.
- **localStorage keys**: `krakion-auth` (authStore), `krakion-municipio` (municipioStore), `krakion-portal-auth` (portalAuthStore — sessão do solicitante externo), `krakion-json-viewerDark` (AnalisadorJson)
- **Notas — isolamento e compartilhamento**: `Nota.usuarioId` obrigatório; queries filtram `usuarioId = req.usuario.id OR compartilhamentos.some({ usuarioId })`. Dono pode compartilhar com usuários específicos via `NotaCompartilhamento` (unique por nota+usuário). Notas alheias sem compartilhamento retornam 404.
- **Notas — itens e etiquetas como JSON String**: `Nota.itens` e `Nota.etiquetas` armazenados como `JSON.stringify(array)` no SQLite (mesmo padrão de `bodySchema`). Helper `parseNota(n)` no backend faz `JSON.parse` antes de retornar.
- **Notas — drag & drop**: HTML5 Drag and Drop API nativa (sem dependência). Campo `ordem Int` armazena posição. Ao soltar, `index.jsx` reordena o array localmente e persiste via `PATCH /notas/ordem` com debounce de 800ms. Ordenação padrão: `fixada desc, ordem asc, atualizadoEm desc`.
- **Notas — fixar**: `Nota.fixada Boolean`. Notas fixadas aparecem em seção "Fixadas" acima das demais (ícone pin + label). Toggle via `PATCH /:id/fixar` (só dono).
- **Notas — tipos**: `texto` (textarea livre), `checklist` (itens com `feito: boolean`), `lista` (bullets), `codigo` (monospace). Ao mudar tipo no modal, conteúdo ↔ itens são convertidos automaticamente (linhas ↔ array de objetos).
- **Notas — paleta de cores**: 10 cores post-it em hex (amarelo `#FFFDE7` padrão, lilás, verde, azul, salmão, laranja, índigo, rosa, teal, branco). Card usa `style={{ backgroundColor: nota.cor }}` e borda `rgba(0,0,0,0.12)`. Modal tem fundo dinâmico com a cor selecionada.
- **Conhecimento — dados globais (sem isolamento)**: `Conhecimento` não possui `usuarioId`; todos os usuários autenticados veem todos os artigos. Diferente de `Notas` (isolado). `autorId` é só para permissão de edição.
- **Conhecimento — permissões**: criar = qualquer autenticado; editar = autor (`autorId`) ou admin; deletar = somente admin. Backend verifica `req.usuario.role === 'admin' || existente.autorId === req.usuario.id` no PUT.
- **Conhecimento — editor de blocos**: `conteudo` e `passos[].texto` armazenam JSON de blocos: `[{tipo: 'texto'|'subtitulo'|'codigo'|'nota', valor: string}]`. O modal usa `BlocoEditorList` (lista editável de blocos com ↑ ↓ ✕ no hover). Bloco `codigo` no **view** usa syntax highlight estilo VS Code Dark+ via `highlightCode()` em `index.jsx` (fundo `#1e1e1e`, keywords azul `#569cd6`, strings salmão `#ce9178`, números `#b5cea8`, comentários `#6a9955`, funções amarelo `#dcdcaa`, texto padrão `#d4d4d4`); no **editor** (textarea) exibe fundo `#1e1e1e` + texto `#d4d4d4` neutro (textarea não suporta spans). Cada passo do tipo `passo-a-passo` também suporta blocos ricos internamente.
- **Conhecimento — retrocompatibilidade de blocos**: `parseConteudo(str)` em `constants.js` tenta `JSON.parse` — se for array de blocos válido usa diretamente; senão envolve o texto plano em `[{tipo:'texto', valor: str}]`. Garante que artigos criados antes dos blocos continuem funcionando.
- **Conhecimento — tipos e campos**: `conteudo` (JSON de blocos) usado por FAQ/Erro/Dica/Outro; `passos` (JSON array `[{texto: string}]` onde `texto` é JSON de blocos) usado por passo-a-passo. Ao salvar, o campo não usado é sempre zerado. `TIPO_CONFIG`, `TIPO_OPTS` e `parseConteudo` exportados de `constants.js` (extraídos para evitar dependência circular entre `index.jsx` e `ModalConhecimento.jsx`).
- **Conhecimento — sistema como texto (igual a Chamados)**: `Conhecimento.sistema String?` é texto livre populado do `CatalogoVertical.sistemas`. Diferente de `sistemaId FK` — não há relação com o modelo `Sistema` (sandbox). No modal, ao selecionar vertical o dropdown de sistema filtra automaticamente pelos sistemas daquela vertical no catálogo Betha.
- **Conhecimento — serialização JSON**: `passos` e `etiquetas` armazenados como `JSON.stringify` no SQLite. Helper `parseConhecimento(c)` no backend faz `JSON.parse` antes de retornar (mesmo padrão de `parseNota`).

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
