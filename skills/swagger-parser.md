# Swagger/OpenAPI Parser

## Localização

`backend/src/routes/endpoints.js` — funções auxiliares no topo do arquivo.

## Funções

### `resolveRef(spec, ref)`
Resolve referências `$ref` internas da spec.

- Suporta: `#/components/schemas/Foo` (OAS3) e `#/definitions/Foo` (Swagger 2)
- Retorna o objeto referenciado ou `null`

### `resolveSchema(spec, schema, _depth)`
Resolve recursivamente `$ref`, `allOf`, `anyOf`, `oneOf`.

- **$ref**: resolve e chama recursivamente
- **allOf**: mescla `type`, `description`, `required[]`, `properties{}` de todos os items. Também mescla `properties` e `required` que estejam fora do allOf no mesmo nível
- **anyOf/oneOf**: usa o primeiro schema da lista
- **Limite**: 5 níveis de profundidade (evita loops infinitos)
- Retorna um schema "achatado" com `{ type, properties, required, description, example }`

### `extrairCampos(spec, schema)`
Extrai campos do body a partir de um schema.

- **Array body**: se `type === 'array'`, chama recursivamente com `schema.items` (o sistema usa arrays em 698 dos 1046 endpoints POST/PUT/PATCH)
- **Object sem type explícito**: aceita schemas com `properties` mesmo sem `type: 'object'` declarado
- **Objeto aninhado**: marca como `tipo: 'object'` quando tem `properties` mas sem `type`
- Retorna: `[{ campo, tipo, obrigatorio, descricao, exemplo }]`

### `parsearSwagger(spec)`
Função principal que extrai todos os endpoints da spec.

Para cada `path + metodo`:
1. Extrai `modulo` (primeira tag), `nome` (summary), `descricao`
2. Extrai `bodySchema` via `extrairCampos`
3. **Captura exemplo completo** do requestBody:
   - Prioridade: `jsonContent.example` → `jsonContent.examples[0].value` → `resolvedSchema.example` → `items.example` (wrapped em array)
   - Se encontrado, prepend sentinel: `[{ _exemplo: true, json: exemploCompleto }, ...campos]`
4. Retorna array de `{ modulo, nome, path, metodo, descricao, bodySchema }`

### `extrairSpecUrlDoHtml(html, paginaUrl)`
Detecta URL do JSON da spec em páginas HTML do Swagger UI.

Padrões testados:
- `SwaggerUIBundle({ url: "..." })` — padrão mais comum
- `url: "...swagger.json..."` em contexto JS
- `configUrl=` em query strings
- `href="...json..."` em links
- Referências a `/swagger.json`, `/openapi.json`, `/api-docs`

Se o URL encontrado for relativo, resolve contra `paginaUrl`.

## Fluxo do `/fetch-swagger`

```
1. POST /api/endpoints/fetch-swagger
   Body: { url, nome?, headers? }

2. Faz GET na URL fornecida
   Headers: Accept: application/json, User-Agent: SysGate/1.0, + headersExtras

3. Se resposta é HTML:
   a. Extrai URL do JSON via extrairSpecUrlDoHtml()
   b. Se achou → faz segundo GET nessa URL
   c. Se não achou → retorna 422 com instrução para usar F12 Network

4. Se resposta não é 200 → retorna 502

5. Parseia JSON, valida se tem paths/swagger/openapi

6. Se ?preview=true → retorna { total, endpoints[], info, versao }

7. Se não preview:
   a. Salva spec no SwaggerSpec
   b. Cria cada endpoint no banco
   c. Retorna { spec, importados, endpoints }
```

## Dados da Tributos

A spec do Tributos (URL: `https://tributos.betha.cloud/service-layer-tributos/docs`):
- **OpenAPI 3.0.1**
- **1746 endpoints** (704 paths × ~2.5 métodos/path)
- **1046 POST/PUT/PATCH** (todos com bodySchema extraído)
- **1394 com exemplo** completo do requestBody
- **698 bodies são arrays** (`type: array` com `items.$ref`)
- **348 bodies são $ref diretos** para schemas de objeto
- Server URL: `https://tributos.betha.cloud/service-layer-tributos/api`
- Paths começam com `/api/...` (ex: `/api/economicos`)
