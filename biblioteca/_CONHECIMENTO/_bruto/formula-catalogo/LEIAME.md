# Catálogo de contexto das fórmulas — capturas brutas

Salve aqui o JSON cru de cada tipo de fórmula, um arquivo por tipo:
`ITBI.json`, `GERACAO_CREDITO_IMOVEIS.json`, `FORMULA_ACRESCIMO_DIVIDA_ATIVA.json`...

## Como capturar

A chamada é **`OPTIONS /tributos/v1/api/core/scriptArrecadacao/{id}/script`** (resposta
202 com `variables`, `classes` e `scaffolds`). O `GET` na mesma URL devolve só o código-fonte,
com `variables` vazio. Confirmado em 2026-11-13: não é preflight, é a chamada real.

Jeito recomendado: `tools/betha-capture/4-escutar-formulas.cmd` e abrir uma fórmula de cada
tipo no Betha. A captura grava em `tools/betha-capture/capturas/formulas/` e o JSON de cada
tipo é separado de lá para cá.

Manual: DevTools → Network → Fetch/XHR → a requisição `script` com método `OPTIONS` →
**Copy response** → colar num arquivo aqui, com o nome do tipo.

## Por que um arquivo por tipo

Cada tipo de fórmula tem contexto próprio. O tipo ITBI recebe `imovel` e
`transfImoveisItens`, mas NÃO recebe `lancamento`. E as classes utilitárias
liberadas mudam: `Creditos` só existe em ITBI.

## Cuidado

O `Authorization: Bearer ...` e os cookies das requisições são credenciais de
sessão. **Não colar em arquivo do projeto.** Só o corpo da resposta.
