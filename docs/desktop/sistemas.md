# Krakion App — Sistemas

Parte da documentação do Krakion App. Índice e "Retomar aqui": `docs/desktop.md`.

## Sistemas (Configurações → Sistemas)

`pages/Sistemas/` — lista de sistemas + detalhe com abas **Visão geral** (descrição, contagens, aviso de URL base terminando em `/api`), **Endpoints** (agrupados por módulo, busca sem acento em módulo/nome/path/método, editar/excluir no hover) e **Specs** (histórico de importações; remover só tira o registro). Plano: `docs/plans/2026-10-17-desktop-sistemas.md`.

- **Importar Swagger** (`ModalSwagger.jsx`): por URL (o backend baixa; aceita a página do Swagger UI e cabeçalhos extras) ou arquivo `.json` (lido no navegador e enviado como JSON) → **Verificar** (prévia: nº de endpoints, título, versão) → **Importar**. "Substituir os endpoints atuais deste sistema" vem marcado.
- Backend: `importar-swagger` e `fetch-swagger` usam uma gravação única (`gravarSpec` em `routes/endpoints.js`, transação) e aceitam `substituir: true` — apaga os endpoints do sistema antes de criar os novos (antes, reimportar **duplicava**). Sem `substituir`, o comportamento do web não mudou. `importar-swagger` aceita até **32 MB** (specs Betha passam de 1 MB; antes o upload por arquivo dava 413). Metadados da spec em `lib/swaggerSpec.js` (testado).
- Excluir sistema: os endpoints ficam órfãos (`SetNull`, somem do Sandbox) e os tokens do sistema nos municípios são apagados (`Cascade`).
- Fora: Catálogo de verticais (Portfólio/Chamados) e "Limpar tudo".
- Teste: spec sintética de 1,58 MB (600 endpoints) por arquivo + Swagger 2 servido localmente via página HTML estilo Swagger UI; reimportar com substituir manteve 600 (sem duplicar). `DOM.setFileInputFiles` (CDP) escolhe o arquivo no `<input type=file>` nos testes de UI.
