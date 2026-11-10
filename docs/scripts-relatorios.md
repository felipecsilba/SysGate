# Scripts BFC e Relatórios (web)

Módulo `Scripts.jsx` do Krakion web: abas Scripts BFC, Fórmulas BFC, Anotações e Relatórios. Rotas em `docs/api.md` (Scripts, Relatórios).

## Regras e armadilhas

> Trazido do CLAUDE.md da raiz em 2026-11-09 (Fase 1 da economia de contexto — ver docs/plans/2026-11-09-fase1-economia-contexto.md).

- **Relatórios JRXML**: `Relatorio.jxrmlConteudo` armazena o arquivo como base64 no SQLite. A listagem (`GET /`) omite o campo por performance — apenas `temJxrml: bool`. Download via `GET /:id/jxrml` faz `Buffer.from(base64)` → `Content-Type: application/octet-stream`. Frontend faz download via `atob()` → `Uint8Array` → `Blob`.
- **Scripts BFC vs Relatórios**: `Script` (modelo) cobre categorias `script`, `formula`, `anotacao` — exibidas em 3 das 4 abas de Scripts.jsx. `Relatorio` é modelo separado, exibido na 4ª aba, com suporte a JRXML + scriptFonte (fonte dinâmica BFC).
