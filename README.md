# SysGate

Ferramenta interna para implantadores de sistemas tributários municipais da **SysGate**.

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Gerenciador de Municípios** | CRUD de municípios com gerenciamento de tokens Bearer por sistema (um token por par município × sistema) |
| **Sistemas** | Cadastro de sistemas com URL base, importação de Swagger, listagem e edição de endpoints em painel de 3 abas |
| **Cliente API** | Proxy local para APIs — grid 360px+1fr, body builder com checkboxes SVG, badges de tipo, campo `idIntegracao` fixo, preview JSON em tempo real, histórico. [Documentação detalhada](docs/cliente-api.md) |
| **Envio em Lote** | Upload de CSV com mapeamento híbrido CSV/Fixo por campo, preview das primeiras linhas, envio sequencial com delay configurável, log e exportação de relatório. [Documentação detalhada](docs/envio-lote.md) |
| **Scripts & Ferramentas** | Repositório de SQL, comandos, fontes de acesso e anotações com tags e categorias |
| **Dashboard** | Visão geral com município ativo e últimas requisições |
| **Histórico** | Tabela completa de todas as requisições executadas — município, sistema, endpoint, método, status HTTP, ID gerado pela API e tipo (individual/lote). Filtros por município, sistema, tipo e método. Suporta até 200 registros por município. [Documentação detalhada](docs/historico.md) |

---

## Instalação local (desenvolvimento)

### Pré-requisitos

- Node.js 18+
- npm 9+

### 1. Backend

```bash
cd backend

# Instala dependências
npm install

# Cria o banco e aplica o schema
npm run db:push

# Inicia o servidor de desenvolvimento (porta 3001)
npm run dev
```

### 2. Frontend

```bash
cd frontend

# Instala dependências
npm install

# Inicia o servidor de desenvolvimento (porta 3000)
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Deploy com Docker

### Pré-requisitos

- Docker 24+
- Docker Compose v2

```bash
# Na raiz do projeto
docker compose up --build -d

# Verificar status
docker compose ps

# Logs
docker compose logs -f

# Parar
docker compose down
```

Acesse:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001/api/health](http://localhost:3001/api/health)

> O banco SQLite é persistido em um volume Docker (`backend-db`).

---

## Estrutura do projeto

```
sysgate/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # Schema do banco (Prisma ORM)
│   ├── src/
│   │   ├── index.js                # Entry point Express
│   │   └── routes/
│   │       ├── municipios.js       # CRUD municípios + tokens por sistema
│   │       ├── sistemas.js         # CRUD sistemas
│   │       ├── endpoints.js        # CRUD endpoints + importação Swagger/JSON
│   │       ├── proxy.js            # Proxy para APIs
│   │       ├── requisicoes.js      # Histórico de chamadas
│   │       └── scripts.js          # CRUD scripts + tags
│   ├── .env                        # Variáveis de ambiente
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MunicipioBadge.jsx
│   │   │   ├── SwaggerImport.jsx
│   │   │   └── SearchSelect.jsx    # Combobox com busca filtrável (Módulo e Recurso)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Municipios.jsx
│   │   │   ├── Sistemas.jsx
│   │   │   ├── ClienteAPI.jsx
│   │   │   ├── EnvioLote.jsx
│   │   │   ├── Scripts.jsx
│   │   │   └── Historico.jsx
│   │   ├── stores/
│   │   │   └── municipioStore.js   # Zustand — município ativo
│   │   └── lib/
│   │       └── api.js              # Cliente axios centralizado
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DATABASE_URL` | `file:./dev.db` | Caminho do banco SQLite (ou URL PostgreSQL) |
| `PORT` | `3001` | Porta do servidor Express |

### Migrar para PostgreSQL

1. Altere `backend/.env`:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/sysgate"
   ```
2. No `schema.prisma`, mude:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Execute:
   ```bash
   npx prisma migrate dev --name init
   ```

---

## API Reference

### Municípios
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/municipios` | Lista todos |
| GET | `/api/municipios/ativo` | Retorna o ativo (com vínculos de sistema) |
| GET | `/api/municipios/:id` | Retorna um município com vínculos |
| POST | `/api/municipios` | Cria |
| PUT | `/api/municipios/:id` | Atualiza |
| PATCH | `/api/municipios/:id/ativar` | Define como ativo |
| DELETE | `/api/municipios/:id` | Remove |
| GET | `/api/municipios/:id/tokens` | Lista tokens do município por sistema |
| POST | `/api/municipios/:id/tokens` | Cria ou atualiza token de um sistema |
| DELETE | `/api/municipios/:id/tokens/:sistemaId` | Remove vínculo de sistema |

**Body POST `/api/municipios`:** `{ nome, observacoes? }`

**Body POST `/api/municipios/:id/tokens`:** `{ sistemaId, token, ambiente }` onde `ambiente` é `"homologacao"` ou `"producao"`

### Sistemas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/sistemas` | Lista todos |
| GET | `/api/sistemas/:id` | Retorna um sistema com endpoints |
| POST | `/api/sistemas` | Cria |
| PUT | `/api/sistemas/:id` | Atualiza |
| DELETE | `/api/sistemas/:id` | Remove |

**Body POST `/api/sistemas`:** `{ nome, urlBase, descricao? }`

### Endpoints
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/endpoints` | Lista (filtros: `?modulo=ISS&sistemaId=1`) |
| GET | `/api/endpoints/modulos` | Lista módulos únicos (filtro: `?sistemaId=1`) |
| POST | `/api/endpoints` | Cria |
| PUT | `/api/endpoints/:id` | Atualiza |
| DELETE | `/api/endpoints/:id` | Remove |
| POST | `/api/endpoints/importar` | Importa array JSON |
| GET | `/api/endpoints/swagger` | Lista specs importadas |
| POST | `/api/endpoints/importar-swagger` | Importa spec OpenAPI |
| POST | `/api/endpoints/fetch-swagger` | Busca e importa spec por URL |
| DELETE | `/api/endpoints/swagger/:id` | Remove spec e seus endpoints |
| DELETE | `/api/endpoints/limpar-tudo` | Remove todos endpoints e specs |

### Proxy
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/proxy/executar` | Executa chamada para a API |

**Body:** `{ municipioId, sistemaId, path, metodo, body?, endpointId?, tipo? }`

- `tipo`: `"individual"` (padrão, enviado pelo Cliente API) ou `"lote"` (enviado pelo Envio em Lote)
- O proxy extrai automaticamente o `idGerado` da resposta tentando os campos `id`, `idGerado` e `idEconomico`

> O proxy busca `Sistema.urlBase` + `MunicipioSistema.token` automaticamente com base no par `municipioId + sistemaId`.

### Requisições (Histórico)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/requisicoes` | Lista histórico (filtros: `municipioId`, `sistemaId`, `tipo`, `limite`) |
| DELETE | `/api/requisicoes` | Limpa histórico (filtro opcional: `municipioId`) |

**Filtros GET:** `?municipioId=1&sistemaId=2&tipo=lote&limite=100` (máx. 500, padrão 100)

### Scripts
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/scripts` | Lista (filtros: `busca`, `categoria`, `tag`) |
| GET | `/api/scripts/tags` | Lista todas as tags |
| POST | `/api/scripts` | Cria |
| PUT | `/api/scripts/:id` | Atualiza |
| DELETE | `/api/scripts/:id` | Remove |
| POST | `/api/scripts/importar` | Importa array JSON |

---

## Schema do banco de dados

```
Municipio         — nome, ativo, observacoes
Sistema           — nome, urlBase, descricao
MunicipioSistema  — municipioId, sistemaId, token, ambiente  (chave única: municipio+sistema)
Endpoint          — modulo, nome, path, metodo, bodySchema (JSON), sistemaId?
SwaggerSpec       — nome, urlBase, spec (JSON), sistemaId?
Requisicao        — municipioId, sistemaId?, endpointId?, metodo, url, statusCode, resposta,
                    duracaoMs, tipo ("individual"|"lote"), idGerado?
Script            — titulo, conteudo, categoria, tags (M2M), municipio (opcional)
Tag               — nome (único)
```

### Relacionamentos principais

- Um **Município** pode ter tokens em múltiplos **Sistemas** (via `MunicipioSistema`)
- Um **Sistema** define a `urlBase` — o proxy usa `Sistema.urlBase + path`
- O token Bearer é armazenado por par `município + sistema`, com o ambiente (`homologacao`/`producao`) também por par
- **Endpoints** podem ser vinculados a um **Sistema** para filtragem
- **Requisicao** referencia diretamente `sistemaId` (além de `endpointId`) para que o sistema seja sempre rastreável mesmo quando o endpoint for nulo ou removido

---

## Fluxo de uso

1. Cadastre os **Sistemas** (nome + URL base) em **Sistemas**
2. Importe os endpoints via Swagger: clique em um sistema → aba **Specs** → **+ Importar nova spec**
3. Gerencie endpoints importados: aba **Endpoints** → botão **Editar** (aparece ao passar o mouse)
4. Cadastre os **Municípios** (nome + observações) em **Municípios**
5. Configure os tokens: clique em um município → painel lateral → **+ Adicionar sistema**
6. Ative um município como padrão (botão **Ativar**)
7. Use o **Cliente API**: busque o módulo e o recurso, selecione o método, marque os campos desejados no painel Campos, preencha os valores no painel Valores e clique em **Executar requisição**
8. Para envio em lote: **Envio em Lote** → selecione município, sistema, módulo e recurso → suba o CSV → no painel Valores, defina cada campo como **CSV** (mapeia para uma coluna do arquivo) ou **Fixo** (valor estático para todas as linhas) → clique em **Iniciar envio**
9. Consulte o **Histórico** para ver todas as requisições executadas, filtrando por município, sistema, tipo (individual/lote) ou método HTTP

---

## Interface — padrões de UX

### Layout das telas ClienteAPI e EnvioLote
- Grid `grid-cols-[360px_1fr]`: coluna esquerda (360px) com cards de configuração, coluna direita (1fr) com conteúdo principal
- Selects de Município e Sistema: `appearance-none` + seta SVG customizada + tint sysgate quando selecionado
- Módulo e Recurso: empilhados verticalmente com `<SearchSelect>` (busca filtrável, insensível a acentos)
- Preview da URL em dois níveis: base truncada (cinza) + path destacado (azul sysgate)

### SearchSelect
- Substitui `<select>` estático por combobox com busca em tempo real
- Sem texto: mostra a lista completa; digitando: filtra por substring insensível a acentos
- "— Limpar seleção —" aparece quando há valor selecionado

### Botões de método HTTP
- GET=azul · POST=verde · PUT=amarelo · PATCH=laranja · DELETE=vermelho
- Ao clicar, atualiza o `endpointSel` para o par path+método correspondente

### Painel de campos — Body Builder (ClienteAPI e EnvioLote)
- Grid `grid-cols-2 h-96`: esquerda=checkboxes, direita=valores/mapeamento
- Checkboxes SVG customizados com badges de tipo coloridos: `string`=verde · `number`=azul · `object`=roxo · `boolean`=laranja · `array`=índigo
- Campos `object` expandidos automaticamente (um nível) usando o `_exemplo` do Swagger
- Campos aninhados agrupados com header de seção e indentação
- Botão **Selecionar todos / Desmarcar todos** (exclui `idIntegracao`)
- **`idIntegracao`**: sempre selecionado, visual âmbar, badge "obrigatório", separador abaixo

### ClienteAPI — painel Valores
- Input de texto por campo selecionado
- `idIntegracao` pré-preenchido com `"INTEGRACAO1"` (editável)
- Preview JSON completo abaixo dos painéis, atualizado em tempo real
- Botão Executar entre os painéis e o preview, alinhado à direita

### EnvioLote — painel Valores (mapeamento CSV/Fixo)
- Cada campo tem toggle **CSV | Fixo**:
  - **CSV**: select de coluna do arquivo — valor varia por linha
  - **Fixo**: input de texto — mesmo valor em todas as linhas
- Preview das primeiras 3 linhas já montadas como JSON real
- Desmarcar um campo remove imediatamente da prévia e do body enviado

---

### Histórico — tela Histórico
- Tabela com colunas: Data/Hora · Município · Sistema · Endpoint · Método · Status · ID Gerado · Tipo · Duração
- Filtros combinados no topo: Município, Sistema, Tipo, Método
- Badge **⚡ Individual** (azul sysgate) para requisições do Cliente API
- Badge **📦 Lote** (índigo) para requisições do Envio em Lote
- ID Gerado em destaque sysgate quando presente na resposta da API
- Botão **Limpar histórico** com confirmação inline
- Limite: 200 registros por município (configurável via `HISTORICO_MAX` em `proxy.js`)

---

Desenvolvido para uso interno — SysGate © 2025
