# Catálogo de contexto das fórmulas — capturas brutas

Salve aqui o JSON cru de cada tipo de fórmula, um arquivo por tipo:
`ITBI.json`, `GERACAO_CREDITO_IMOVEIS.json`, `FORMULA_ACRESCIMO_DIVIDA_ATIVA.json`...

## Como capturar

1. Abrir a fórmula no editor do Tributos, DevTools na aba **Network**, filtro **Fetch/XHR**
2. Achar a requisição cujo **Preview** mostra `variables: [...]` e `classes: [...]`
   (a URL é `/tributos/v1/api/core/scriptArrecadacao/{id}/script`, mas NÃO é o GET —
   o GET devolve só o código-fonte com `variables` vazio)
3. Botão direito na requisição -> **Copy** -> **Copy response**
4. Colar num arquivo aqui, com o nome do tipo

Alternativa: botão direito -> **Copy as cURL (bash)** e colar no chat — assim dá
pra descobrir o método/corpo exato e automatizar o resto.

## Por que um arquivo por tipo

Cada tipo de fórmula tem contexto próprio. O tipo ITBI recebe `imovel` e
`transfImoveisItens`, mas NÃO recebe `lancamento`. E as classes utilitárias
liberadas mudam: `Creditos` só existe em ITBI.

## Cuidado

O `Authorization: Bearer ...` e os cookies das requisições são credenciais de
sessão. **Não colar em arquivo do projeto.** Só o corpo da resposta.
