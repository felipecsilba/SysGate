# Plano: Krakion App — Sandbox (requisição única)

**Goal:** Sandbox no visual novo: escolher município/sistema/endpoint, montar o body (Campos ou JSON), executar pelo backend local (sai do IP do PC, sem túnel), ver resposta, ID gerado e histórico. Entrega 3 de 4 (depois: envio em lote).

**Architecture:** usa `POST /api/proxy/executar` e `GET /api/requisicoes` como estão. A lógica de body (expandir schema, seleção/valores iniciais, montar o JSON), path (`{param}`), busca de endpoint e extração de ID vira funções puras testadas em `desktop/src/lib/` — no web ela está duplicada em 3 lugares. Backend: o token deixa de ser gravado/devolvido em texto puro no histórico.

**Regra fixa:** nos testes, nenhuma chamada vai à Betha — o sistema de teste aponta para um servidor falso local. Chamadas reais são do Felipe.

---

## Tasks

### Task 1: Mascarar token no histórico (TDD)
**Files:** `backend/src/lib/mascararHeaders.js` + `.test.js`, `backend/src/routes/proxy.js`, `backend/src/routes/requisicoes.js`
- `mascararHeaders(headers)` → `Authorization: Bearer <8 primeiros>••••` (case-insensitive; sem token → igual). Aplicado ao gravar (`proxy.js`) e ao ler (`requisicoes.js`, cobre registros antigos).

### Task 2: Lógica pura do Sandbox (TDD)
**Files:** `desktop/src/lib/corpo.js`, `caminho.js`, `ids.js` + testes; `endpoints.js` (+ `buscarEndpoints`)
- `corpo.js`: `expandirSchema(bodySchema)` (objeto 1 nível via `_exemplo`, `idGerado` → número + `_wrapAsIdObject`), `selecaoInicial`, `valoresIniciais`, `montarBody`, `exemploJson`, `pedeJsonLivre` (campos `array<…>`).
- `caminho.js`: `parametrosDoPath('/a/{id}/b/{x}')` → `['id','x']`, `preencherPath` (encodeURIComponent), `urlFinal(base, path)`.
- `ids.js`: `extrairId(resposta)` (id/idGerado/idEconomico/idLote, objeto `{id}`).
- `buscarEndpoints(endpoints, termo, limite)` — cada palavra do termo precisa casar (sem acento) com método/path/nome/módulo.

### Task 3: Componentes
**Files:** `desktop/src/components/JsonColorido.jsx` (escapa HTML antes de colorir + copiar), `desktop/src/pages/Sandbox/SeletorEndpoint.jsx`, `EditorBody.jsx`, `PainelResposta.jsx`, `Historico.jsx`, `index.jsx`; `lib/api.js` (`proxyApi`, `requisicoesApi`); `App.jsx`.

### Task 4: Verificação + docs
- `npm test` (backend e desktop). Servidor falso "Betha" local (201 com id, 400 com erro, GET /{id}); sistema de teste com `urlBase` local; executar POST (Campos e JSON), GET com `{id}`, consultar resultado, histórico (token mascarado), sem token no município → aviso. `npm run atalho`; docs.
