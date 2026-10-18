# Plano: Krakion App — Sistemas

**Goal:** tela de Sistemas no visual novo (lista + detalhe com abas Visão geral / Endpoints / Specs) e importação de Swagger por URL ou arquivo, sem duplicar endpoints ao reimportar. Entrega 2 de 4 (depois: Sandbox requisição única, Sandbox lote).

**Architecture:** usa as rotas existentes de `/api/sistemas` e `/api/endpoints`. Dois ajustes no backend, sem mudar o comportamento atual do web: (1) `importar-swagger` e `fetch-swagger` aceitam `substituir: true` — apaga os endpoints do sistema e grava os novos numa transação; a gravação das duas rotas vira uma função só; (2) `POST /api/endpoints/importar-swagger` aceita corpo de até 32 MB (só admin), como o catálogo de fontes.

**Fora:** Catálogo de verticais (Portfólio/Chamados), "Limpar tudo" global.

---

## Tasks

### Task 1: Metadados da spec (TDD)
**Files:** `backend/src/lib/swaggerSpec.js`, `backend/src/lib/swaggerSpec.test.js`
- `metadadosSpec(spec)` → `{ versao, urlBase, titulo }` — OpenAPI 3 (`servers[0].url`) e Swagger 2 (`schemes[0]://host + basePath`, `https` padrão).

### Task 2: Gravação única com `substituir`
**Files:** `backend/src/routes/endpoints.js`, `backend/src/index.js`
- `gravarSpec({ spec, nome, sistemaId, endpointsParsados, substituir })` em `$transaction`: `substituir && sistemaId` → `endpoint.deleteMany({ sistemaId })`; cria `SwaggerSpec`; cria endpoints. Resposta igual à atual (`spec`, `importados`, `endpoints`) + `removidos`.
- `importar-swagger` e `fetch-swagger` passam a usar `gravarSpec`.
- `index.js`: `importar-swagger` no parser de 32 MB.

### Task 3: API do desktop + utilitários
**Files:** `desktop/src/lib/api.js` (`sistemasApi`, `endpointsApi`), `desktop/src/lib/endpoints.js` + `.test.js`
- `agruparPorModulo(endpoints, busca)` → `[{ modulo, itens }]` ordenado, busca sem acento em módulo/nome/path/método.
- `avisoUrlBase(url)` → texto quando termina em `/api` (vira `/api/api` → 404 na Betha).

### Task 4: Componentes
**Files:** `desktop/src/components/Abas.jsx`, `desktop/src/components/MetodoBadge.jsx`

### Task 5: Tela Sistemas
**Files:** `desktop/src/pages/Sistemas/index.jsx`, `ListaSistemas.jsx`, `DetalheSistema.jsx`, `AbaEndpoints.jsx`, `AbaSpecs.jsx`, `ModalSistema.jsx`, `ModalEndpoint.jsx`, `ModalSwagger.jsx`; `desktop/src/App.jsx`
- Swagger: URL (+ cabeçalhos opcionais) ou arquivo `.json` → prévia (nº de endpoints) → "Substituir os endpoints atuais deste sistema" (marcado) → importar.

### Task 6: Verificação + docs
- `npm test` (backend e desktop); app de teste: criar sistema, importar spec por arquivo (> 1 MB) e por URL (servidor local de teste), reimportar com substituir (sem duplicar), editar/excluir endpoint, remover spec, aviso de `/api`. `npm run atalho`; docs.
