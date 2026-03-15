# Fluxos e Padrões

## Fluxo 1: Importar Swagger do sistema

```
Usuário abre ClienteAPI → clica "Importar Swagger"
  → Modal SwaggerImport abre
  → Cola URL: https://tributos.betha.cloud/service-layer-tributos/docs
  → Clica "Pré-visualizar"
  → Frontend chama endpointsApi.swaggerFetchUrlPreview(url, nome, headers)
  → Backend:
    1. GET na URL → recebe HTML ou JSON
    2. Se HTML: extrai URL do JSON via regex → faz segundo GET
    3. Parseia spec com parsearSwagger()
    4. Retorna { total, endpoints[], info, versao }
  → Frontend mostra preview (endpoints agrupados por módulo)
  → Usuário clica "Importar para o banco"
  → Backend salva SwaggerSpec + cria Endpoints no banco
  → Modal fecha, módulos recarregam
```

## Fluxo 2: Executar requisição via proxy

```
Usuário na página ClienteAPI:
  1. Seleciona município (tem urlBase + token)
  2. Seleciona módulo → endpoint (preenche método, path, body)
  3. Edita body se necessário (JSON raw pré-preenchido)
  4. Clica "Executar requisição"
  → Frontend chama proxyApi.executar({
      municipioId, endpointId, path, metodo, body
    })
  → Backend (proxy.js):
    a. Carrega município (inclui token)
    b. Monta URL: municipio.urlBase + path
    c. Faz request com Authorization: Bearer {token}
    d. Salva no histórico (max 20)
    e. Retorna statusCode, duracaoMs, headers, data
  → Frontend exibe resposta no painel direito
```

## Fluxo 3: Envio em lote (CSV)

```
Usuário na página EnvioLote:
  1. Seleciona município + endpoint (POST/PUT/PATCH)
  2. Upload CSV (Papa Parse no browser)
  3. Mapeia colunas do CSV → campos do JSON body
  4. Preview da primeira linha montada
  5. Clica "Iniciar envio"
  → Para cada linha do CSV:
    a. Monta body JSON com o mapeamento
    b. Chama proxyApi.executar()
    c. Log de sucesso/erro na timeline
    d. Atualiza barra de progresso
  6. Ao terminar: exibe resumo (total/sucesso/erro)
  7. Pode exportar relatório CSV com resultado por linha
```

## Fluxo 4: Limpar e reimportar

```
Usuário quer reimportar a spec do Swagger:
  1. Abre "Importar Swagger" → aba "Specs salvas"
  2. Clica "Limpar tudo"
  → Backend: DELETE /api/endpoints/limpar-tudo
    a. Seta endpointId = null em todas requisições
    b. Deleta todas SwaggerSpec
    c. Deleta todos Endpoint
  3. Volta para aba "Importar" → cola URL → importa novamente
```

## Fluxo 5: Troca de método com auto-sync

```
Usuário selecionou endpoint PATCH /api/economicos
  → Body mostra o exemplo do PATCH
  → Clica no botão "POST"
  → ClienteAPI busca: endpoints.find(ep => ep.path === '/api/economicos' && ep.metodo === 'POST')
  → Se encontrou: setEndpointSel(match)
  → useEffect dispara: carrega novo bodySchema, exemplo e path
  → Body raw atualiza automaticamente com o exemplo do POST
```

## Padrões recorrentes

### Sentinel `_exemplo` no bodySchema
O primeiro elemento do array `bodySchema` pode ser um sentinel:
```json
{ "_exemplo": true, "json": [{ "idIntegracao": "...", ... }] }
```
- **Backend**: adiciona ao parsear a spec quando há exemplo disponível
- **Frontend**: filtra com `.filter(c => !c._exemplo)` ao renderizar campos
- **Uso**: pré-preenche o textarea "JSON raw" quando um endpoint é selecionado

### JSON como String no SQLite
Prisma com SQLite não tem tipo JSON nativo. Campos como `bodySchema`, `headers`, `body`, `resposta` são `String`:
- **Salvar**: `JSON.stringify(obj)`
- **Ler**: `JSON.parse(str)`
- Feito manualmente em cada rota

### Express: rotas nomeadas antes de /:id
Rotas como `/swagger`, `/modulos`, `/limpar-tudo` DEVEM ser registradas antes de `/:id` no Express Router, senão são capturadas como parâmetro dinâmico.

### Proxy com Bearer token
O backend nunca expõe o token do sistema para o frontend. O proxy:
1. Recebe `municipioId` do frontend
2. Carrega o município com token do banco
3. Injeta `Authorization: Bearer {token}` no request para o sistema
4. Retorna apenas os dados de resposta

### CSS: classes Tailwind custom
Sempre usar as classes definidas em `index.css`:
- `btn-primary`, `btn-secondary`, `btn-ghost` para botões
- `card` para containers
- `input` para inputs/selects
- `badge` + variantes de cor para tags
- `code-area` para textareas de código

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Port 3001 EADDRINUSE | `netstat -ano \| findstr :3001` → `taskkill /PID X /F` |
| Prisma DLL locked | Parar backend → `npx prisma generate` → reiniciar |
| `/swagger` retorna 404 | Verificar se rota está ANTES de `/:id` em endpoints.js |
| URL duplica `/api/api/` | Município urlBase deve ser SEM `/api` no final (paths já têm) |
| Swagger retorna 422 | URL aponta para HTML; usar URL do JSON ou deixar auto-detection |
| Body vazio em endpoints | Verificar se `extrairCampos` trata arrays e schemas sem `type` |
| `cmd` no bash (Windows) | Usar `cmd //c "comando"` para comandos Windows como `taskkill` |
