# Backend — Node.js + Express + Prisma

## Visão geral

Servidor Express na porta 3001 que serve como:
1. **API REST** para CRUD de municípios, endpoints, scripts
2. **Proxy** para APIs externas (injeta token Bearer, evita CORS)
3. **Parser de Swagger/OpenAPI** (importa specs e extrai endpoints + body schemas)

## Arquitetura

```
backend/src/
├── index.js              # Express app, middleware, montagem de rotas
└── routes/
    ├── municipios.js     # CRUD municípios + ativar/desativar
    ├── endpoints.js      # CRUD + Swagger parser + import + fetch URL + limpar-tudo
    ├── proxy.js          # POST /executar — proxy com Bearer token
    ├── requisicoes.js    # Histórico de requisições
    └── scripts.js        # CRUD scripts com tags
```

## Rota: municipios.js

| Verbo  | Path                        | Função                                |
|--------|-----------------------------|---------------------------------------|
| GET    | /                           | Lista todos (sem token)               |
| GET    | /ativo                      | Retorna o ativo **com token**         |
| GET    | /:id                        | Obtém por ID                          |
| POST   | /                           | Cria (campos: nome, codigoIBGE, urlBase, token, ambiente) |
| PUT    | /:id                        | Atualiza                              |
| PATCH  | /:id/ativar                 | Ativa este e desativa todos os outros |
| DELETE | /:id                        | Remove (cascade em requisições)       |

**Importante**: GET `/ativo` retorna o município com o campo `token`. GET `/` e GET `/:id` também retornam o token (usado pelo proxy).

## Rota: endpoints.js

### CRUD básico
- GET `/` — lista (filtro `?modulo=`)
- GET `/modulos` — lista módulos distintos
- GET `/:id` — obtém por ID
- POST `/` — cria manual
- PUT `/:id` — atualiza
- DELETE `/:id` — remove (seta `endpointId = null` nas requisições primeiro)

### Swagger/OpenAPI
- GET `/swagger` — lista specs importadas (SwaggerSpec)
- DELETE `/swagger/:id` — remove spec do histórico
- POST `/importar` — importa array JSON de endpoints
- POST `/importar-swagger` — importa spec JSON (upload). `?preview=true` só analisa
- POST `/fetch-swagger` — **fetch server-side** de URL. `?preview=true` só analisa
- DELETE `/limpar-tudo` — apaga TODOS endpoints + specs (preserva municípios/scripts)

### Ordem das rotas (CRÍTICO)

Rotas nomeadas DEVEM vir ANTES de `/:id` no Express, senão `/swagger`, `/limpar-tudo` etc. são capturadas como parâmetro `:id`.

```
// Ordem correta:
router.get('/modulos', ...)
router.get('/swagger', ...)
router.get('/:id', ...)           // por último
router.delete('/limpar-tudo', ...)
router.delete('/swagger/:id', ...)
router.delete('/:id', ...)        // por último
```

## Rota: proxy.js

POST `/executar` — recebe `{ municipioId, endpointId?, path, metodo, body?, queryParams?, headersExtras? }`

Fluxo:
1. Carrega município por ID (com token)
2. Monta URL: `municipio.urlBase + path`
3. Faz request com `Authorization: Bearer {token}`
4. Salva no histórico (max 20 por município)
5. Retorna `{ statusCode, duracaoMs, url, metodo, headers, data }`

## Rota: requisicoes.js

- GET `/` — últimas 20 (`?municipioId=` filtra)
- DELETE `/` — limpa histórico (`?municipioId=` filtra)

## Rota: scripts.js

- CRUD padrão com suporte a tags (many-to-many)
- Tags são criadas via `connectOrCreate` ao criar/atualizar script
- POST `/importar` — importa array JSON de scripts com tags
- GET `/tags` — lista todas as tags existentes

## Middleware e configuração

```js
app.use(cors())
app.use(express.json({ limit: '10mb' }))  // specs grandes
```

## Variáveis de ambiente (.env)

```
DATABASE_URL="file:./dev.db"
PORT=3001
```
