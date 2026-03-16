# SysGate

Ferramenta interna fullstack para implantadores da SysGate. Gerencia municípios, executa chamadas API via proxy, importa specs Swagger/OpenAPI, envia requisições em lote e organiza scripts.

## Stack

| Camada   | Tecnologia                                                         |
|----------|--------------------------------------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS 3 + Zustand 4 + React Router 6     |
| Backend  | Node.js + Express 4 + Prisma ORM + SQLite                         |
| CSV      | Papa Parse (parsing de CSV no frontend)                            |
| HTTP     | Axios (frontend→backend e backend→APIs)                     |
| Docker   | docker-compose com 2 serviços (backend + frontend)                |

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
│   ├── .env                   # DATABASE_URL="file:./dev.db", PORT=3001
│   ├── prisma/
│   │   ├── schema.prisma      # 7 modelos: Municipio (sem codigoIBGE), Sistema, MunicipioSistema, Endpoint, Requisicao, Script, Tag, SwaggerSpec
│   │   ├── seed.js            # Dados iniciais (2 municípios, 3 endpoints, 2 scripts)
│   │   └── dev.db             # SQLite (gerado)
│   └── src/
│       ├── index.js           # Express server, monta rotas, porta 3001
│       └── routes/
│           ├── municipios.js  # CRUD (sem codigoIBGE) + PATCH /:id/ativar + tokens por sistema
│           ├── sistemas.js    # CRUD sistemas
│           ├── endpoints.js   # CRUD + importar JSON + Swagger parser + fetch-swagger + limpar-tudo
│           ├── proxy.js       # POST /executar — proxy para APIs com token
│           ├── requisicoes.js # GET (últimas 20) + DELETE histórico
│           └── scripts.js     # CRUD com tags + importar/exportar JSON
└── frontend/
    ├── package.json
    ├── vite.config.js         # Porta 3000, proxy /api → localhost:3001
    ├── tailwind.config.js     # Paleta customizada "sysgate" + safelist [/sysgate/] (obrigatório para @apply funcionar)
    └── src/
        ├── main.jsx
        ├── App.jsx            # BrowserRouter com 5 rotas
        ├── index.css          # Classes Tailwind custom: .btn, .card, .input, .badge, .label
        ├── lib/
        │   └── api.js         # Cliente Axios centralizado com interceptors
        ├── stores/
        │   └── municipioStore.js  # Zustand + persist (localStorage)
        ├── components/
        │   ├── Layout.jsx         # Sidebar fixa + main scrollável + header
        │   ├── Sidebar.jsx        # NavLinks com estado ativo
        │   ├── MunicipioBadge.jsx # Badge do município ativo (alerta vermelho para produção)
        │   ├── SwaggerImport.jsx  # Modal: fetch por URL / upload arquivo / specs salvas / limpar tudo
        │   └── SearchSelect.jsx   # Combobox com busca filtrável (usado em Módulo e Recurso)
        └── pages/
            ├── Dashboard.jsx      # Resumo + atalhos + últimas requisições (sem codigoIBGE)
            ├── Municipios.jsx     # CRUD + painel lateral de tokens (clique na linha para abrir)
            ├── Sistemas.jsx       # CRUD + painel detalhe com 3 abas: Informações / Specs / Endpoints
            ├── ClienteAPI.jsx     # Seletor endpoint + body editor 2 colunas + proxy + resposta
            ├── EnvioLote.jsx      # Upload CSV + mapeamento colunas 2 colunas + envio sequencial
            └── Scripts.jsx        # CRUD com categorias + tags + copiar + importar/exportar
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

| Método | Rota                                   | Descrição                                    |
|--------|----------------------------------------|----------------------------------------------|
| GET    | /api/municipios                        | Lista todos                                  |
| GET    | /api/municipios/ativo                  | Retorna o ativo (com token)                  |
| POST   | /api/municipios                        | Cria município                               |
| PUT    | /api/municipios/:id                    | Atualiza                                     |
| PATCH  | /api/municipios/:id/ativar             | Ativa (desativa demais)                      |
| DELETE | /api/municipios/:id                    | Remove                                       |
| GET    | /api/endpoints                         | Lista (filtro ?modulo=)                      |
| GET    | /api/endpoints/modulos                 | Lista módulos únicos                         |
| GET    | /api/endpoints/swagger                 | Lista specs importadas                       |
| GET    | /api/endpoints/:id                     | Obtém endpoint por ID                        |
| POST   | /api/endpoints                         | Cria endpoint manual                         |
| PUT    | /api/endpoints/:id                     | Atualiza                                     |
| DELETE | /api/endpoints/limpar-tudo             | Apaga TODOS endpoints + specs (preserva municípios/scripts) |
| DELETE | /api/endpoints/swagger/:id             | Remove spec do histórico                     |
| DELETE | /api/endpoints/:id                     | Remove endpoint                              |
| POST   | /api/endpoints/importar                | Importa array JSON de endpoints              |
| POST   | /api/endpoints/importar-swagger        | Importa spec OpenAPI (upload JSON)           |
| POST   | /api/endpoints/fetch-swagger           | Fetch server-side de URL (suporta HTML do Swagger UI) |
| POST   | /api/proxy/executar                    | Executa requisição via proxy com token       |
| GET    | /api/requisicoes                       | Histórico (últimas 20, filtro ?municipioId=) |
| DELETE | /api/requisicoes                       | Limpa histórico                              |
| GET    | /api/scripts                           | Lista scripts (filtro ?categoria=, ?tag=)    |
| POST   | /api/scripts                           | Cria script com tags                         |
| PUT    | /api/scripts/:id                       | Atualiza                                     |
| DELETE | /api/scripts/:id                       | Remove                                       |
| POST   | /api/scripts/importar                  | Importa JSON                                 |
| GET    | /api/scripts/tags                      | Lista tags                                   |

## Padrões importantes

- **Tailwind safelist obrigatório**: `tailwind.config.js` tem `safelist: [{ pattern: /sysgate/ }]` — sem isso, `@apply bg-sysgate-600` falha no `index.css` porque o JIT não gera a classe antes do `@layer components` ser processado. NÃO remover.
- **Rotas nomeadas ANTES de /:id** no Express (ex: `/swagger`, `/limpar-tudo` devem vir antes de `/:id`)
- **bodySchema** é armazenado como `String` (JSON serializado) no SQLite, parseado/stringificado manualmente
- **Sentinel `_exemplo`** no bodySchema: o primeiro elemento `{ _exemplo: true, json: {...} }` contém o exemplo completo do request body da spec. Frontend filtra com `.filter(c => !c._exemplo)`
- **Swagger parser** resolve `$ref`, `allOf`, `anyOf/oneOf` com limite de 5 níveis de profundidade
- **Array bodies**: quando o requestBody é `type: array`, os campos são extraídos do `items`
- **HTML auto-detection**: `/fetch-swagger` detecta se a URL retornou HTML do Swagger UI e tenta extrair o URL do JSON automaticamente
- **Município urlBase**: NÃO deve terminar com `/api` — os paths dos endpoints já incluem `/api/...`
- **Zustand persist**: município ativo persiste em `localStorage` (key: `sysgate-municipio`)
- **Município sem codigoIBGE**: campo removido do schema, validação e UI — apenas `nome` e `observacoes`
- **Tokens por município**: painel lateral em `Municipios.jsx` — abre ao clicar na linha da tabela; um token por par (município × sistema). Campo `ambiente` removido da UI (default `"producao"` no banco). Painel exibe token mascarado (primeiros 8 chars + `••••`) com botão de olho para revelar e botão de copiar. Backend retorna token real (sem mascaramento)
- **Swagger exclusivo em Sistemas**: `SwaggerImport` só é usado em `Sistemas.jsx` — aba Specs ou botão na aba Informações; `ClienteAPI.jsx` não tem mais esse botão
- **Painel detalhe Sistemas**: 3 abas — Informações (stats + editar + importar swagger), Specs (listar/remover specs), Endpoints (listar/editar endpoints do sistema)

## UI — ClienteAPI e EnvioLote (padrões compartilhados)

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
  - **Direita** (ClienteAPI): campos marcados + inputs de valor + preview JSON verde em tempo real
  - **Direita** (EnvioLote): campos marcados + `<select>` da coluna CSV correspondente + preview das primeiras 2 linhas
- Auto-switch para "JSON raw": apenas quando há campos `array<...>` (não mais para `object`)
- Reconstrução do body ao enviar: campos `number`/`integer` → `Number(val)`; campos `_wrapAsIdObject` → `{ id: Number(val) }`; campos `_parent` → `body[_parent][_displayCampo]`

### Auto-mapeamento CSV (EnvioLote)
- Ao fazer upload do CSV, compara `_displayCampo` (nome curto do sub-campo) com o nome da coluna CSV (case-insensitive)
- Se houver match: pré-seleciona o checkbox e pré-preenche o dropdown
