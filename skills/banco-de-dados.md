# Banco de Dados — Prisma + PostgreSQL

## Configuração

- **ORM**: Prisma 5.x
- **Provider**: PostgreSQL (migrado do SQLite em 2026-06-11, junto com a Fase 2 do portal externo)
- **Schema**: `backend/prisma/schema.prisma`
- **Migrations**: Usa `prisma db push` (sem migrations formais)
- **Dev local**: PostgreSQL 18 nativo no Windows, porta 5432 — `DATABASE_URL="postgresql://krakion:krakion123@localhost:5432/krakion"` (a porta 5433 é outra instância, de outro projeto — não usar)
- **Produção**: PostgreSQL 16 na VPS (localhost), credenciais no `.env` do servidor

## Regras pós-migração (IMPORTANTE)

1. **Instância única de PrismaClient**: toda rota usa `const prisma = require('../lib/prisma')`. **NUNCA** criar `new PrismaClient()` em arquivo de rota — no Postgres cada instância abre um pool próprio e esgota o `max_connections`.
2. **Buscas com `contains`**: sempre incluir `mode: 'insensitive'` — no Postgres o `contains` é case-sensitive por padrão (no SQLite era insensitive; o comportamento foi preservado adicionando o mode em todos os filtros de busca).
3. **SQL cru (`$queryRaw`)**: sintaxe Postgres. Tabelas e colunas precisam de aspas duplas por causa do case (`"Chamado"`, `"criadoEm"`). Datas: `NOW() - INTERVAL '14 days'`, `to_char(...)`. Nada de `datetime('now')`/`date()` do SQLite.
4. **Migração de dados**: `backend/prisma/migrar-sqlite-postgres.js` copia um `dev.db` para o Postgres apontado pelo `DATABASE_URL` preservando IDs (converte DateTime epoch-ms e Boolean 0/1 via DMMF, copia as pivots `_ScriptToTag`/`_RelatorioToTag`, ressincroniza sequences e confere contagens). Requer Node ≥ 22.5 (`node:sqlite`) e destino vazio. Os `dev.db.bak-*` no servidor são o fallback pré-migração.

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
npx prisma db push        # Aplica schema no Postgres (sem migration)
npx prisma studio         # Interface visual para explorar dados (porta 5555)
npx prisma generate       # Regenera o Prisma Client
node prisma/seed.js       # Popula dados iniciais (CUIDADO: apaga municípios/scripts/endpoints)

# psql local (Windows):
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U krakion -h localhost -p 5432 -d krakion

# psql produção (na VPS):
sudo -u postgres psql -d krakion

# Recriar banco local do zero:
# (como superuser postgres) DROP DATABASE krakion; CREATE DATABASE krakion OWNER krakion;
# depois: npx prisma db push && node prisma/seed.js

# Backup produção:
sudo -u postgres pg_dump krakion | gzip > /root/krakion-$(date +%Y%m%d).sql.gz
```

## Cuidados

- **Não use `prisma migrate`** — o projeto usa `db push` sem migrations
- **DLL lock (Windows)**: Se o Prisma falhar com EPERM, mate o processo do backend antes de rodar `db push` ou `generate`
- **JSON fields**: os campos JSON continuam `String` (parse/stringify manual no código) — padrão herdado do SQLite e mantido na migração
- **Seed destrutivo**: `seed.js` faz `deleteMany` em requisições/scripts/tags/endpoints/municípios — nunca rodar em produção
