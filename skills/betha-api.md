# Betha API — Quirks e Padrões

---

## Autenticação

- Bearer Token: `Authorization: Bearer <TOKEN>`
- Token armazenado em `MunicipioSistema.token` (SQLite), vinculado a `municipioId + sistemaId`
- Tokens têm `dataVencimento` opcional (duração máxima real ~15 dias)
- O proxy verifica que o `municipioId` pertence ao usuário logado antes de buscar o token — retorna 403 caso contrário (impede uso de tokens alheios)
- Headers fixos em toda requisição: `Content-Type: application/json`, `Accept: application/json`

---

## URL Base — Regra crítica

**NÃO deve terminar com `/api` ou `/api/`**

Os paths dos endpoints importados do Swagger já incluem `/api/...`. A URL final é:
```
url = sistema.urlBase + endpoint.path
```

| Cenário | urlBase | path | URL final |
|---------|---------|------|-----------|
| Correto | `https://tributos.betha.cloud/service-layer-tributos` | `/api/imoveis` | `.../service-layer-tributos/api/imoveis` |
| Errado | `https://tributos.betha.cloud/service-layer-tributos/api` | `/api/imoveis` | `.../tributos/api/api/imoveis` ← 404 |

---

## Extração de IDs de respostas

A API Betha retorna IDs em estruturas variadas. O sistema usa uma cascata de busca:

### Resposta tipo Array
```javascript
// proxy.js — resposta é um array
ids = resposta.map(item =>
  item?.id ?? item?.idGerado ?? item?.idEconomico ?? item?.idLote
).filter(v => v != null)
idGerado = ids.join(',')  // Ex: "42,43,44"
```

### Resposta tipo Objeto — campos na raiz
```javascript
// Ordem de prioridade
resposta.id           // mais comum
resposta.idGerado     // ID gerado no servidor
resposta.idEconomico  // usado em Arrecadação/IPTU
resposta.idLote       // processamento em lote
```

### Resposta tipo Objeto — campo `retorno[]`
Algumas APIs Betha retornam um array `retorno` dentro do objeto:
```json
{ "retorno": [ { "idGerado": 42 }, { "idGerado": 43 } ] }
```
O campo `idGerado` dentro de `retorno` pode ser um número escalar **ou** um objeto `{ id: N }`.

```javascript
// extrairIds (EnvioLote/utils.js) — lida com ambos
if (typeof v === 'number' || typeof v === 'string') {
  val = String(v)
} else if (typeof v === 'object' && v.id != null) {
  val = String(v.id)  // desembala o objeto
}
```

### Campo especial `_wrapAsIdObject`
Quando a spec tem `idGerado: { id: N }` como objeto no exemplo, o campo recebe `_wrapAsIdObject: true`. O input da UI mostra apenas o número, mas ao enviar é reembalado:
```javascript
// ao construir o body
typedVal = c._wrapAsIdObject ? { id: Number(valor) } : numVal
```

---

## Swagger / OpenAPI — Parser

### Versões suportadas
- **OpenAPI 3.x**: `spec.openapi`, URL base em `spec.servers[0].url`
- **Swagger 2.x**: `spec.swagger`, URL base montada com `scheme + host + basePath`

### Resolução de `$ref`
Suporta `#/components/schemas/Nome` (3.x) e `#/definitions/Nome` (2.x):
```javascript
function resolveRef(spec, ref) {
  const parts = ref.replace('#/', '').split('/')
  return parts.reduce((cur, p) => cur?.[decodeURIComponent(p)], spec)
}
```
Limite de **5 níveis de profundidade** para evitar loops em schemas circulares.

### Schemas compostos
| Schema | Comportamento |
|--------|---------------|
| `allOf` | Mescla todas as entradas (type, required, properties) |
| `anyOf` / `oneOf` | Usa o primeiro elemento |
| `type: array` | Extrai campos dos `items` |
| `properties` sem `type` | Tratado como `object` |

### Sentinel `_exemplo`
O primeiro elemento do `bodySchema` é um sentinel com o exemplo completo do request body:
```javascript
bodySchema = [{ _exemplo: true, json: bodyExemplo }, ...campos]
```
- Frontend filtra com `.filter(c => !c._exemplo)`
- Usado para pré-preencher o body raw no Sandbox e inferir tipos de sub-campos de objetos aninhados

### Auto-detecção de HTML do Swagger UI
Quando a URL retorna HTML em vez de JSON, o backend tenta extrair a URL real do spec com estes padrões:
```
SwaggerUIBundle({ url: "..." })
{ url: "...swagger..." }
configUrl=...
href="...json"
href="...swagger.json"
href="...openapi.json"
href="...api-docs.json"
```
Se nenhum padrão funcionar, retorna 422 com instrução para copiar a URL direta do JSON.

### User-Agent
O backend envia `User-Agent: Krakion/1.0` em todos os fetches de Swagger.

---

## Campos do Body Schema

### Tipos retornados pelo parser
| Tipo | Descrição |
|------|-----------|
| `string` | Texto livre |
| `number` / `integer` | Numérico |
| `boolean` | true/false |
| `object` | Objeto aninhado (expandido pelo `schemaExpanded`) |
| `array<string>` | Array de strings |
| `array<number>` | Array de números |
| `array<object>` | Array de objetos |

### Expansão de objetos (`schemaExpanded`)
Campos `tipo === 'object'` são expandidos em sub-campos usando o exemplo da spec:
```javascript
// entrada: { campo: "endereco", tipo: "object" }
// exemplo: { endereco: { rua: "X", numero: 10 } }
// saída expandida:
[
  { campo: "endereco.rua", _displayCampo: "rua", _parent: "endereco", tipo: "string" },
  { campo: "endereco.numero", _displayCampo: "numero", _parent: "endereco", tipo: "number" },
]
```

### Reconstrução do body no envio
```javascript
// casting numérico
const numVal = (c.tipo === 'number' || c.tipo === 'integer') ? Number(val) : val
// wrap especial
const typedVal = c._wrapAsIdObject ? { id: numVal } : numVal
// aninhamento
if (c._parent) {
  body[c._parent][c._displayCampo] = typedVal
} else {
  body[c.campo] = typedVal
}
```

---

## Envio em Lote

A API Betha aceita arrays no request body — o envio em lote usa isso para eficiência:

```
POST /api/imoveis
Body: [ { objeto1 }, { objeto2 }, ..., { objetoN } ]
```

### Parâmetros
- `tamanhoBatch`: 1–200 itens por lote (padrão 50)
- `delayLotes`: delay em ms entre lotes (padrão 200ms)

### Construção por linha CSV
```javascript
const bodyArray = linhasDoLote.map(linha => construirBodyLinha(linha))
// Cada linha vira um objeto com os campos mapeados da UI
```

### CSV sem cabeçalho
Colunas geradas automaticamente como `A`, `B`, `C`, ... (até 26; depois `Col1`, `Col2`, ...).

---

## Proxy de saída — contorno do bloqueio de IP

O IP da VPS Hostinger (187.77.230.138) é bloqueado pela Betha Cloud. Solução: túnel SSH reverso pelo PC do implantador.

```
Backend (VPS) → httpsAgent → 127.0.0.1:8888 → SSH tunnel → PC do implantador → Betha Cloud
```

### Configuração
```javascript
// buildProxyConfig() em proxy.js e endpoints.js
const { HttpsProxyAgent } = require('https-proxy-agent')
return {
  httpsAgent: new HttpsProxyAgent(process.env.PROXY_URL),
  proxy: false,  // desativa proxy padrão do axios (bug no axios 1.x com HTTPS)
}
```

> **Nota axios 1.x**: o campo `proxy` do axios não suporta HTTPS corretamente na versão 1.x. Usar sempre `httpsAgent` + `proxy: false`.

### Ativar o túnel
```cmd
:: CMD 1 — proxy HTTP no PC
node C:\Users\Felipe\Desktop\proxy.js

:: CMD 2 — túnel SSH reverso (deixar aberto)
ssh -R 8888:127.0.0.1:8888 root@187.77.230.138 -N
```

Documentação completa: `skills/deploy.md`

---

## Comportamentos da API Betha

| Situação | O que fazer |
|----------|------------|
| 404 com `/api/api/...` no log | URL base termina com `/api` incorretamente — remover o sufixo |
| Timeout após 30s | Verificar se o túnel SSH está ativo (`pm2 logs` mostra o erro) |
| 401 na requisição | Token expirado ou inválido — atualizar token no painel de tokens do município |
| Swagger retorna HTML | Copiar manualmente a URL do spec JSON (visível no DevTools → Network da página do Swagger) |
| `idGerado` é `{ id: N }` | Comportamento normal em alguns módulos — o parser já lida com isso automaticamente |
| Array `retorno[]` vazio | Operação pode ter sido enfileirada — ID disponível somente após processamento assíncrono |

---

## Debug e Logs

```bash
# Ver todas as requisições proxy em tempo real
pm2 logs krakion-backend

# Output por requisição:
# [proxy] ▶ POST https://tributos.betha.cloud/.../api/imoveis
# [proxy] Token: eyJhbGci...
# [proxy] Body: { ... }
# [proxy] ◀ Status: 201
# [proxy] Resposta: { "id": 42, ... }
```

Tokens são exibidos apenas com os primeiros 12 caracteres no log.

---

## Erros retornados pelo proxy interno

| Status | Motivo |
|--------|--------|
| 400 | municipioId, sistemaId, metodo ou path não fornecidos |
| 403 | Município não pertence ao usuário logado |
| 404 | Token não configurado para este município+sistema |
| 502 | Erro na chamada à API Betha (timeout, host inatingível, etc.) |
