# Banco de Dados — Prisma + SQLite

## Configuração

- **ORM**: Prisma 5.x
- **Provider**: SQLite (`file:./dev.db`)
- **Schema**: `backend/prisma/schema.prisma`
- **Migrations**: Usa `prisma db push` (sem migrations formais)

## Modelos

### Municipio
Representa um município/entidade no SysGate com credenciais de acesso.

| Campo        | Tipo      | Notas                                |
|--------------|-----------|--------------------------------------|
| id           | Int (PK)  | Autoincrement                        |
| nome         | String    | Nome do município                    |
| codigoIBGE   | String    | Unique                               |
| urlBase      | String    | Ex: `https://tributos.betha.cloud/service-layer-tributos` (sem `/api` no final) |
| token        | String    | Bearer token para autenticação       |
| ambiente     | String    | `"producao"` ou `"homologacao"`      |
| observacoes  | String?   | Opcional                             |
| ativo        | Boolean   | Default false. Apenas 1 ativo por vez |
| criadoEm     | DateTime  | Auto                                 |
| atualizadoEm | DateTime  | Auto                                 |

**Relações**: `requisicoes Requisicao[]`, `scripts Script[]`

### Endpoint
Endpoint de API importado do Swagger ou criado manualmente.

| Campo      | Tipo     | Notas                                           |
|------------|----------|-------------------------------------------------|
| id         | Int (PK) | Autoincrement                                   |
| modulo     | String   | Tag/módulo (ex: "economicos (Econômicos)")       |
| nome       | String   | Summary do Swagger ou nome manual               |
| path       | String   | Ex: `/api/economicos` (já inclui `/api/`)       |
| metodo     | String   | `GET`, `POST`, `PUT`, `PATCH`, `DELETE`         |
| descricao  | String?  | Description do Swagger                          |
| bodySchema | String?  | **JSON serializado** — array de campos + sentinel `_exemplo` |
| criadoEm   | DateTime | Auto                                            |

**bodySchema format**:
```json
[
  { "_exemplo": true, "json": [{"idIntegracao": "INTEGRACAO01", ...}] },
  { "campo": "idIntegracao", "tipo": "string", "obrigatorio": false, "descricao": "...", "exemplo": "" },
  { "campo": "economicos", "tipo": "object", "obrigatorio": false, "descricao": "", "exemplo": "" }
]
```
O primeiro elemento com `_exemplo: true` contém o exemplo completo do request body (vem da spec). O frontend filtra com `.filter(c => !c._exemplo)`.

### Requisicao
Histórico de requisições executadas via proxy.

| Campo       | Tipo     | Notas                    |
|-------------|----------|--------------------------|
| id          | Int (PK) |                          |
| municipioId | Int (FK) | → Municipio              |
| endpointId  | Int? (FK)| → Endpoint (SetNull)     |
| metodo      | String   |                          |
| url         | String   | URL completa chamada     |
| headers     | String?  | JSON serializado         |
| body        | String?  | JSON serializado         |
| statusCode  | Int?     |                          |
| resposta    | String?  | JSON serializado         |
| duracaoMs   | Int?     |                          |
| criadoEm    | DateTime |                          |

**Limite**: máximo 20 por município (limpeza automática no proxy).

### Script
Scripts SQL, comandos, fontes e anotações dos implantadores.

| Campo        | Tipo      | Notas                                    |
|--------------|-----------|------------------------------------------|
| id           | Int (PK)  |                                          |
| titulo       | String    |                                          |
| conteudo     | String    | Corpo do script                          |
| categoria    | String    | `"sql"`, `"comando"`, `"fonte"`, `"anotacao"` |
| municipioId  | Int? (FK) | → Municipio (opcional)                   |
| tags         | Tag[]     | Relação many-to-many implícita do Prisma |
| criadoEm     | DateTime  |                                          |
| atualizadoEm | DateTime  |                                          |

### Tag
Tags para categorizar scripts.

| Campo   | Tipo     | Notas  |
|---------|----------|--------|
| id      | Int (PK) |        |
| nome    | String   | Unique |
| scripts | Script[] |        |

### SwaggerSpec
Specs OpenAPI/Swagger importadas (armazena o JSON bruto completo).

| Campo          | Tipo     | Notas                          |
|----------------|----------|--------------------------------|
| id             | Int (PK) |                                |
| nome           | String   | Título da spec                 |
| versao         | String?  | Ex: `"3.0.1"`, `"2.0"`        |
| urlBase        | String?  | URL base da API descrita       |
| conteudo       | String   | JSON completo da spec inteira  |
| totalEndpoints | Int      | Contagem de endpoints          |
| criadoEm       | DateTime |                                |

## Comandos úteis

```bash
npx prisma db push        # Aplica schema no SQLite (sem migration)
npx prisma studio         # Interface visual para explorar dados (porta 5555)
npx prisma generate       # Regenera o Prisma Client
node prisma/seed.js       # Popula dados iniciais

# Limpar e recriar do zero:
rm prisma/dev.db && npx prisma db push && node prisma/seed.js
```

## Cuidados

- **Não use `prisma migrate`** — o projeto usa `db push` sem migrations
- **DLL lock**: Se o Prisma falhar com EPERM, mate o processo do backend antes de rodar `db push` ou `generate`
- **JSON fields**: SQLite não tem tipo JSON nativo. Todos os campos JSON são `String` e são parseados/stringificados manualmente no código
