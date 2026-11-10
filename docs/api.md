# API do backend

Todas as rotas do `backend/src/routes/`. Regras de quem pode o quê ficam em `backend/CLAUDE.md` e no `docs/<módulo>.md` de cada módulo.

## Rotas da API (backend)

> Trazido do CLAUDE.md da raiz em 2026-11-09 (Fase 1 da economia de contexto — ver docs/plans/2026-11-09-fase1-economia-contexto.md).

> Todas as rotas abaixo de `/api/auth` exigem header `Authorization: Bearer <token>`.

### Autenticação (públicas)
| Método | Rota                        | Descrição                                                                                      |
|--------|-----------------------------|-----------------------------------------------------------------------------------------------|
| POST   | /api/auth/login             | Login — retorna JWT (rate limit 10/15min + lockout); atualiza `ultimoLogin`                   |
| POST   | /api/auth/logout            | Logout (stateless — cliente descarta token)                                                   |
| GET    | /api/auth/me                | Retorna dados do usuário logado incl. `email`, `funcao`, `ultimoLogin` (requer token)         |
| POST   | /api/auth/registrar         | Auto-cadastro: cria conta com `ativo: false`, aguarda aprovação                               |
| POST   | /api/auth/esqueci-senha     | Gera token de recuperação e envia email (rate limit 5/15min). Sempre retorna sucesso genérico |
| POST   | /api/auth/redefinir-senha   | Valida token + expiry, atualiza senha, limpa `recuperacaoToken`/`recuperacaoExpira`           |
| GET    | /api/auth/setup-local       | Krakion Desktop: `{ disponivel }` — true só com `KRAKION_DESKTOP=1` e banco sem usuários       |
| POST   | /api/auth/setup-local       | Krakion Desktop: cria a conta local (admin, ativa) e devolve token; fora das condições → 404   |
| POST   | /api/importacao/conectar    | Krakion Desktop (admin, autenticado): entra na VPS e devolve `{ url, tokenRemoto, resumo }`    |
| POST   | /api/importacao/executar    | Krakion Desktop (admin, autenticado): copia sistemas/endpoints, municípios/tokens, notas, conhecimento e/ou checagem da VPS |
| GET    | /api/health                 | Health check                                                                                   |

### Usuários
> **Admin**: acesso completo. **Não-admin**: `GET` retorna só si mesmo; `PUT` e `PATCH /senha` permitidos apenas no próprio id; `POST` e `DELETE` bloqueados (403).

| Método | Rota                        | Descrição                                                                                        |
|--------|-----------------------------|--------------------------------------------------------------------------------------------------|
| GET    | /api/usuarios               | Admin: lista todos; não-admin: retorna apenas o próprio registro                                 |
| POST   | /api/usuarios               | Cria usuário inativo — **somente admin**                                                         |
| PUT    | /api/usuarios/:id           | Admin: atualiza nome/role/ativo/email/funcao; não-admin: só nome, email, funcao e `filaFiltro` do próprio id |
| PATCH  | /api/usuarios/:id/senha     | Admin: redefine qualquer senha; não-admin: só a própria                                          |
| DELETE | /api/usuarios/:id           | Remove — **somente admin** (impede auto-exclusão e último admin)                                 |

### Sistemas
> **Leitura pública** (qualquer autenticado), **escrita restrita a admin**.

| Método | Rota              | Descrição                                            |
|--------|-------------------|------------------------------------------------------|
| GET    | /api/sistemas     | Lista todos (com contagem de endpoints e specs)      |
| GET    | /api/sistemas/:id | Detalhe com specs (sem conteúdo JSON)                |
| POST   | /api/sistemas     | Cria sistema — **somente admin**                     |
| PUT    | /api/sistemas/:id | Atualiza — **somente admin**                         |
| DELETE | /api/sistemas/:id | Remove — **somente admin**                           |

### Municípios
> **Isolamento por usuário**: todas as rotas filtram/operam apenas nos municípios do usuário logado (`usuarioId = req.usuario.id`). Tokens também são protegidos — o proxy verifica posse do município antes de executar.

| Método | Rota                                   | Descrição                                                          |
|--------|----------------------------------------|--------------------------------------------------------------------|
| GET    | /api/municipios                        | Lista municípios **do usuário logado**                             |
| GET    | /api/municipios/ativo                  | Retorna o ativo **do usuário logado** (com tokens de sistema)      |
| POST   | /api/municipios                        | Cria município vinculado ao usuário logado (`usuarioId`)           |
| PUT    | /api/municipios/:id                    | Atualiza (somente dono)                                            |
| PATCH  | /api/municipios/:id/ativar             | Ativa (desativa apenas os demais do mesmo usuário)                 |
| DELETE | /api/municipios/:id                    | Remove (somente dono)                                              |
| GET    | /api/municipios/:id/tokens             | Lista tokens (somente dono do município)                           |
| POST   | /api/municipios/:id/tokens             | Upsert token (somente dono do município)                           |
| DELETE | /api/municipios/:id/tokens/:sistemaId  | Remove token (somente dono do município)                           |

### Endpoints / Swagger
> **Leitura pública** (qualquer autenticado), **escrita restrita a admin**.

| Método | Rota                                   | Descrição                                                   |
|--------|----------------------------------------|-------------------------------------------------------------|
| GET    | /api/endpoints                         | Lista (filtro ?modulo=) — todos os usuários                 |
| GET    | /api/endpoints/modulos                 | Lista módulos únicos — todos os usuários                    |
| GET    | /api/endpoints/swagger                 | Lista specs importadas — todos os usuários                  |
| GET    | /api/endpoints/:id                     | Obtém endpoint por ID — todos os usuários                   |
| POST   | /api/endpoints                         | Cria endpoint manual — **somente admin**                    |
| PUT    | /api/endpoints/:id                     | Atualiza — **somente admin**                                |
| DELETE | /api/endpoints/limpar-tudo             | Apaga TODOS endpoints + specs — **somente admin**           |
| DELETE | /api/endpoints/swagger/:id             | Remove spec do histórico — **somente admin**                |
| DELETE | /api/endpoints/:id                     | Remove endpoint — **somente admin**                         |
| POST   | /api/endpoints/importar                | Importa array JSON de endpoints — **somente admin**         |
| POST   | /api/endpoints/importar-swagger        | Importa spec OpenAPI (upload JSON) — **somente admin**      |
| POST   | /api/endpoints/fetch-swagger           | Fetch server-side de URL (suporta HTML do Swagger UI) — **somente admin** |

### Scripts
| Método | Rota                  | Descrição                                    |
|--------|-----------------------|----------------------------------------------|
| GET    | /api/scripts          | Lista scripts (filtro ?categoria=, ?tag=, ?pagina=, ?limite=) — retorna `{ data, total, pagina, limite, totalPaginas }` |
| GET    | /api/scripts/tags     | Lista tags                                   |
| POST   | /api/scripts          | Cria script com tags                         |
| PUT    | /api/scripts/:id      | Atualiza                                     |
| DELETE | /api/scripts/:id      | Remove                                       |
| POST   | /api/scripts/importar | Importa JSON                                 |

### Relatórios
| Método | Rota                       | Descrição                                        |
|--------|----------------------------|--------------------------------------------------|
| GET    | /api/relatorios            | Lista (filtro ?busca=, ?tag=, ?municipioId=)     |
| GET    | /api/relatorios/:id        | Obtém relatório por ID (sem jxrmlConteudo)       |
| GET    | /api/relatorios/:id/jxrml  | Download do arquivo JRXML (base64 → buffer)      |
| POST   | /api/relatorios            | Cria relatório (com ou sem JRXML anexado)        |
| PUT    | /api/relatorios/:id        | Atualiza                                         |
| DELETE | /api/relatorios/:id        | Remove                                           |

### Portfólio
> **Leitura pública** (qualquer autenticado), **escrita restrita a admin**. Dados globais — sem isolamento por usuário.

| Método | Rota                                        | Descrição                                                                 |
|--------|---------------------------------------------|---------------------------------------------------------------------------|
| GET    | /api/portfolio                              | Lista municípios (filtro ?busca=, ?pagina=, ?limite=) — retorna `{ data, total, pagina, limite, totalPaginas }` |
| POST   | /api/portfolio                              | Cria município — **somente admin**                                        |
| GET    | /api/portfolio/:id                          | Detalhe do município com entidades (contagem sistemas/stakeholders)        |
| PUT    | /api/portfolio/:id                          | Atualiza município — **somente admin**                                    |
| DELETE | /api/portfolio/:id                          | Remove município (cascade completo) — **somente admin**                   |
| GET    | /api/portfolio/:id/entidades                | Lista entidades com sistemas e stakeholders completos                     |
| POST   | /api/portfolio/:id/entidades                | Cria entidade no município — **somente admin**                            |
| GET    | /api/portfolio/entidades/:eid               | Detalhe da entidade com sistemas e stakeholders                           |
| PUT    | /api/portfolio/entidades/:eid               | Atualiza entidade — **somente admin**                                     |
| DELETE | /api/portfolio/entidades/:eid               | Remove entidade (cascade) — **somente admin**                             |
| GET    | /api/portfolio/entidades/:eid/sistemas      | Lista sistemas da entidade                                                |
| POST   | /api/portfolio/entidades/:eid/sistemas      | Cria sistema na entidade — **somente admin**                              |
| PUT    | /api/portfolio/sistemas/:sid                | Atualiza sistema (nome/vertical/ativo/observacoes) — **somente admin**    |
| DELETE | /api/portfolio/sistemas/:sid                | Remove sistema (cascade M2M) — **somente admin**                          |
| GET    | /api/portfolio/entidades/:eid/stakeholders  | Lista stakeholders com sistemas vinculados                                |
| POST   | /api/portfolio/entidades/:eid/stakeholders  | Cria stakeholder com sistemas[] (M2M) — **somente admin**                 |
| PUT    | /api/portfolio/stakeholders/:shid           | Atualiza stakeholder + recria vínculos M2M — **somente admin**            |
| DELETE | /api/portfolio/stakeholders/:shid           | Remove stakeholder — **somente admin**                                    |

### Catálogo de Verticais
> **Leitura pública** (qualquer autenticado), **escrita restrita a admin**. Seed automático na 1ª chamada GET se a tabela estiver vazia.

| Método | Rota              | Descrição                                                                         |
|--------|-------------------|-----------------------------------------------------------------------------------|
| GET    | /api/catalogo     | Lista verticais ordenadas por `ordem` — popula seed Betha se vazio               |
| POST   | /api/catalogo     | Cria vertical (nome, cor hex, sistemas[], ordem) — **somente admin**              |
| PUT    | /api/catalogo/:id | Atualiza vertical — **somente admin**                                             |
| DELETE | /api/catalogo/:id | Remove vertical — retorna 409 se há `EntidadeSistema` vinculados — **somente admin** |

### Chamados
> Acesso público (qualquer autenticado). `DELETE /:id` somente admin. Sem isolamento por usuário — todos veem todos.

| Método | Rota                          | Descrição                                                                             |
|--------|-------------------------------|---------------------------------------------------------------------------------------|
| GET    | /api/chamados                 | Lista chamados (filtros ?busca=, ?status=, ?classificacao=, ?responsavelId=, ?vertical=, ?verticais=, ?sistemas=, ?prioridade=, ?municipio=, ?semResponsavel=, ?excluirEncerrados=, ?pagina=, ?limite=) — retorna `{ data, total, pagina, limite, totalPaginas }` |
| GET    | /api/chamados/estatisticas    | Contagem por status (objeto `{ status: count }`)                                      |
| GET    | /api/chamados/dashboard       | Dados agregados: resumo, porStatus, porMunicipio, porVertical, porClassificacao, porPrioridade, semResponsavel, porDia (14 dias) |
| POST   | /api/chamados                 | Cria chamado + registra entrada `criacao` no histórico                                |
| GET    | /api/chamados/anexos/:aid     | Download de anexo (base64 → buffer, Content-Disposition: attachment)                  |
| DELETE | /api/chamados/anexos/:aid     | Remove anexo                                                                          |
| DELETE | /api/chamados/comentarios/:cid | Remove comentário — somente autor ou admin                                           |
| GET    | /api/chamados/:id/historico   | Histórico de alterações do chamado (ordenado por criadoEm desc)                       |
| GET    | /api/chamados/:id             | Detalhe completo com comentários, anexos e contagens                                  |
| PUT    | /api/chamados/:id             | Atualiza campos + detecta alterações e registra no histórico automaticamente          |
| DELETE | /api/chamados/:id             | Remove chamado (cascade) — **somente admin**                                          |
| POST   | /api/chamados/:id/comentarios | Adiciona comentário (aceita `pendingAnexoIds[]` para vincular imagens inline)         |
| POST   | /api/chamados/:id/anexos      | Upload de anexo (base64 no body: nomeArquivo, tipo, conteudo, tamanho, comentarioId?) |

### Solicitantes
> Acesso público (qualquer autenticado). `DELETE /:id` somente admin. Sem isolamento por usuário.

| Método | Rota                        | Descrição                                                       |
|--------|-----------------------------|-----------------------------------------------------------------|
| GET    | /api/solicitantes           | Lista (filtros ?busca=, ?municipio=, ?contaPendente=true) — retorna array com `temConta` derivado |
| POST   | /api/solicitantes           | Cria solicitante externo — email já usado → 409                |
| PUT    | /api/solicitantes/:id       | Atualiza — email já usado → 409                                |
| PATCH  | /api/solicitantes/:id/conta | Aprova/desativa conta do portal `{ contaAtiva: bool }` (aprovar zera lockout) — **somente admin** |
| DELETE | /api/solicitantes/:id       | Remove — **somente admin**                                      |

### Portal Externo (`/api/portal/*`) — Fase 2
> Trilho de autenticação **paralelo e isolado** sobre o modelo `Solicitante`. JWT com claim `tipo: 'externo'` + `sid`; rejeitado nas rotas internas (e vice-versa). Rotas de chamados protegidas por `autenticarExterno` e SEMPRE filtradas por `solicitanteId` do token (não-dono → 404).

| Método | Rota                                   | Descrição                                                                      |
|--------|----------------------------------------|---------------------------------------------------------------------------------|
| POST   | /api/portal/auth/registrar             | Cria conta (hCaptcha + rate limit 5/15min); `contaAtiva: false` (aprovação manual); email com conta → 409 |
| POST   | /api/portal/auth/login                 | Login por email (lockout 5/15min + rate limit 10/15min); conta não aprovada → 401 |
| POST   | /api/portal/auth/logout                | Stateless                                                                       |
| GET    | /api/portal/auth/me                    | Dados da própria conta (token externo)                                          |
| POST   | /api/portal/auth/esqueci-senha         | Token hash SHA-256 + expiry 1h; resposta sempre genérica (rate limit 5/15min)   |
| POST   | /api/portal/auth/redefinir-senha       | Valida token/expiry, redefine senha, limpa lockout                              |
| GET    | /api/portal/chamados                   | Lista chamados do solicitante (?busca=, ?status=, paginação) — sem campos internos |
| GET    | /api/portal/chamados/anexos/:aid       | Download — 404 se não dono ou anexo de comentário interno                       |
| GET    | /api/portal/chamados/:id               | Detalhe com timeline pública (filtra comentários `interno` e seus anexos)       |
| POST   | /api/portal/chamados                   | Abre chamado: `origem: 'portal'`, criadoPorId = usuário-sistema portal, numero persistido + histórico |
| POST   | /api/portal/chamados/:id/comentarios   | Comentário externo (`autorSolicitanteId`, sempre `interno: false`, aceita pendingAnexoIds) |
| POST   | /api/portal/chamados/:id/anexos        | Upload com validação da Fase 0 (MIME/5MB/25MB); `comentarioId` do cliente ignorado |

### Notas
> **Isolamento por usuário**: cada usuário vê apenas suas notas + notas compartilhadas com ele. Ordem das rotas Express: `/ordem` ANTES de `/:id`.

| Método | Rota                              | Descrição                                                                              |
|--------|-----------------------------------|----------------------------------------------------------------------------------------|
| GET    | /api/notas                        | Lista notas próprias + compartilhadas; `?busca=`, `?etiqueta=`, `?tipo=`               |
| POST   | /api/notas                        | Cria nota (`usuarioId = req.usuario.id`)                                               |
| PATCH  | /api/notas/ordem                  | Reordenação batch: `{ itens: [{id, ordem}] }` — só atualiza notas do usuário           |
| GET    | /api/notas/:id                    | Detalhe com lista de compartilhamentos                                                 |
| PUT    | /api/notas/:id                    | Atualiza (dono ou compartilhado com acesso)                                            |
| DELETE | /api/notas/:id                    | Remove — somente dono                                                                  |
| PATCH  | /api/notas/:id/fixar              | Toggle `fixada` — somente dono                                                         |
| POST   | /api/notas/:id/compartilhar       | Compartilha com `{ usuarioId }` (upsert) — somente dono                                |
| DELETE | /api/notas/:id/compartilhar/:uid  | Remove compartilhamento de um usuário — somente dono                                   |

### Conhecimento
> Acesso público (qualquer autenticado). Dados globais — sem isolamento por usuário. Edição restrita ao autor ou admin. Exclusão somente admin.

| Método | Rota                    | Descrição                                                                                  |
|--------|-------------------------|--------------------------------------------------------------------------------------------|
| GET    | /api/conhecimento       | Lista (filtros `?busca=`, `?tipo=`, `?vertical=`, `?sistema=`, `?pagina=`, `?limite=`) — retorna `{ data, total, pagina, limite, totalPaginas }` |
| GET    | /api/conhecimento/:id   | Detalhe com `autor`                                                                        |
| POST   | /api/conhecimento       | Cria artigo (`autorId = req.usuario.id`) — qualquer autenticado                            |
| PUT    | /api/conhecimento/:id   | Atualiza — somente autor ou admin (403 para outros)                                        |
| DELETE | /api/conhecimento/:id   | Remove — **somente admin**                                                                 |

### Checagem de Cadastros
> Acesso público (qualquer autenticado). Dados **globais** — o catálogo de obrigatoriedade vale para todos os municípios e usuários. Documentação completa: `docs/checagem.md`.

| Método | Rota                          | Descrição                                                                              |
|--------|-------------------------------|----------------------------------------------------------------------------------------|
| GET    | /api/checagem/cadastros       | Lista cadastros (endpoints POST/PUT/PATCH, um por path, POST preferido) + nº de marcações |
| GET    | /api/checagem/campos          | `?sistemaId=&path=` — campos achatados com `obrigatorio` já mesclado das marcações      |
| PUT    | /api/checagem/campos          | Upsert da marcação por `sistemaId+path+campo` (toggle + observação)                      |
| DELETE | /api/checagem/campos          | Remove a marcação — volta ao que a spec diz                                             |
| POST   | /api/checagem/validar         | `{ sistemaId, path, payload }` → `{ resumo, achados[] }` (motor de spec antigo)          |
| GET/POST/PUT/DELETE | /api/checagem/regras[/:id] | CRUD de `RegraChecagem` (`?frente=&cadastro=`; aceita `comoCorrigir`)            |
| GET/POST/PUT/DELETE | /api/checagem/notas[/:id]  | CRUD de `NotaChecagem` (observações do cadastro, por `path`)                     |
| POST   | /api/checagem/verificar       | `{ sistemaId, frente, cadastro, texto }` → laudo por regra (+ spec na frente api). **Stateless** — não grava nada |
| POST   | /api/checagem/fontes/importar | Importa `catalogo_v2.json` (fontes BFC) — **somente admin**                             |
| GET    | /api/checagem/fontes[/:id]    | Lista fontes / detalhe com filtros, campos de retorno e `enums`                         |

### Outros
| Método | Rota                  | Descrição                                                                     |
|--------|-----------------------|-------------------------------------------------------------------------------|
| POST   | /api/proxy/executar   | Executa requisição via proxy — verifica posse do município antes de usar token |
| GET    | /api/requisicoes      | Histórico do usuário logado (filtro ?municipioId=) — isolado por usuário      |
| DELETE | /api/requisicoes      | Limpa histórico do usuário logado (filtro ?municipioId=) — isolado por usuário |
