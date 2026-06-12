# Chamados — Documentação da Tela

**Arquivos principais:**
- `frontend/src/pages/Chamados/index.jsx` — container principal
- `frontend/src/pages/Chamados/AbaPainel.jsx` — aba Painel (tabela densa de todos os chamados)
- `frontend/src/pages/Chamados/ModalFilaConfig.jsx` — modal de configuração da Fila personalizada
- `frontend/src/pages/Chamados/ModalChamado.jsx` — modal criar/editar chamado
- `frontend/src/pages/Chamados/ChamadosDashboard.jsx` — aba Dashboard (gráficos Recharts)
- `frontend/src/pages/Chamados/PainelHistorico.jsx` — painel lateral de histórico de alterações

---

## Visão Geral

O módulo **Chamados** é um sistema interno de gestão de atendimentos/tickets. Registra chamados abertos pelos implantadores durante o ciclo de vida de uma implantação municipal — com histórico automático de alterações, comentários, anexos e dashboard analítico. Os dados são **globais** — todos os usuários veem todos os chamados. Exclusão restrita a admins.

---

## Estrutura de abas

Toggle estilo pill no header:

| Aba | Conteúdo |
|-----|----------|
| **Minha Fila** | Visão pessoal: sub-abas Meus, Fila e Sem Responsável |
| **Painel** | Tabela densa de todos os chamados com filtros completos (`AbaPainel`) |
| **Dashboard** | Gráficos analíticos agregados (`ChamadosDashboard`) |

---

## Aba Minha Fila

### Layout

Tela dividida em duas colunas:

| Coluna | Conteúdo |
|--------|----------|
| Lista (esquerda, `w-80`) | Sub-abas + filtro de busca + cards de chamados + paginação |
| Painel detalhe (direita) | Detalhe completo do chamado selecionado |

### Sub-abas

| Sub-aba | Filtro aplicado | Descrição |
|---------|-----------------|-----------|
| **Meus** | `responsavelId = usuario.id` + `excluirEncerrados = true` | Chamados atribuídos ao usuário logado, excluindo Concluído e Cancelado |
| **Fila** | Config salva em `filaFiltro` no servidor | Chamados filtrados pela configuração personalizada do usuário (verticais, sistemas, status) |
| **Sem Responsável** | `semResponsavel = true` + `excluirEncerrados = true` | Chamados sem responsável atribuído; badge laranja com contagem no tab |

### Minha Fila — configuração

- Botão de engrenagem no tab "Fila" abre `ModalFilaConfig`
- Configuração salva em `PUT /api/usuarios/:id` no campo `filaFiltro` (JSON string)
- Ao entrar no módulo, `GET /api/auth/me` retorna o `filaFiltro` salvo e o estado é restaurado
- Se a Fila não estiver configurada: exibe empty state orientando o usuário a configurar

### Paginação e busca

- Padrão: 20 chamados por página; opção de 50 via botão "Por pág: 20 | 50"
- Busca com debounce de 400ms — só dispara a query após pausa na digitação
- Controles de navegação ← → na base do painel esquerdo

### Contagem "Sem Responsável"

- `contSemDono` é buscado separadamente via `carregarContSemDono` (1 request com `limite: 1`)
- Chamado apenas no mount e após mutações que alteram responsável (`atualizarCampo('responsavelId')`) ou excluem chamado (`deletarChamado`)
- Não é recalculado em cada load da lista principal

### Numeração dos chamados

Formato: `PREFIXO-YYYY-NNNNN` — **persistido no banco** no campo `Chamado.numero String? @unique` (Fase 0).

- **Prefixo**: primeiras 4 letras do município em maiúsculas, sem acentos (ex: Rurópolis → `RURO`, Belém → `BELE`). Sem município → `CH`.
- **Ano (`YYYY`)**: ano de `criadoEm`.
- **Sequencial (`NNNNN`)**: por **prefixo+ano** (5 dígitos com zeros à esquerda), reseta a cada virada de ano.

**Geração:** `backend/src/lib/numeroChamado.js` (`prefixoMunicipio`, `gerarNumero`). O `POST /api/chamados` gera o número dentro de `prisma.$transaction`, com retry em colisão `P2002`. Como é persistido, **o número não muda mais** se chamados forem deletados.

**Backfill:** `backend/prisma/backfill-numero.js` numera chamados antigos (idempotente, ordem `id ASC`). Rodar uma vez após o `prisma db push` que adiciona o campo.

**Frontend (legado):** `ticketMapMF` (useMemo O(n)) e `ticketNum()` ainda calculam o número client-side a partir da lista carregada. Devem migrar para consumir `c.numero` do backend (fica para fase posterior); enquanto coexistem, o valor persistido é a fonte de verdade.

---

## Aba Painel (`AbaPainel.jsx`)

Componente independente com seu próprio estado de filtros e paginação (não compartilha estado com a aba Minha Fila).

### Filtros disponíveis

| Filtro | Campo |
|--------|-------|
| Busca textual | título, descrição ou município |
| Status | todos os status incluindo Cancelado |
| Vertical | catálogo de verticais Betha |
| Sistema | dependente da vertical selecionada |
| Responsável | usuário atribuído |
| Classificação | tipo do chamado (filtros extras "Mais") |
| Prioridade | Baixa / Média / Alta / Urgente (filtros extras "Mais") |
| Município | texto livre (filtros extras "Mais") |

- Limite padrão: 30 chamados por página
- "Mais" expande segunda linha de filtros (classificação, prioridade, município)
- Botão "Limpar" aparece quando há filtro ativo

### Layout

Tabela densa com colunas: Nº · Título/Classificação · Status · Prioridade · Responsável · Município · Data.

Ao clicar em uma linha, abre o painel de detalhe à direita (painel compartilhado com a aba Minha Fila).

---

## Painel de Detalhe

Painel direito compartilhado entre as abas Minha Fila e Painel. Mostrando detalhes do chamado selecionado (`chamadoSelId`).

Quando `aba === 'painel'` e não há chamado selecionado, o painel fica oculto (`hidden`).

### Cabeçalho

- Número do ticket + título
- Badges de status, classificação e prioridade
- Botões: editar, histórico, excluir (admin)
- **Botão "Delegar para mim"** (abaixo dos badges, visível quando o chamado não está encerrado e não pertence ao usuário logado):
  - Sem responsável → botão verde **"Delegar para mim"** — delega diretamente sem confirmação
  - Com outro responsável → botão âmbar **"Delegar para mim"** — abre `ConfirmDialog` antes de reatribuir
  - Chamado já atribuído ao usuário logado ou status Concluído/Cancelado → botão não exibe

### Campos do chamado

| Campo | Origem dos dados |
|-------|-----------------|
| `titulo` | Texto livre |
| `descricao` | Texto livre (suporta multiline; URLs são auto-linkificadas) |
| `status` | Em Aberto / Em Andamento / Aguardando / Concluído / Cancelado |
| `classificacao` | tipo do atendimento |
| `prioridade` | Baixa / Média / Alta / Urgente |
| `vertical` | Select populado pelo catálogo (`catalogoApi.listar()`) |
| `sistema` | Dependente da vertical selecionada |
| `municipio` | Texto livre com sugestões do portfólio (`portfolioApi.listar()`) |
| `entidade` | Texto livre com sugestões da entidade do município selecionado |
| `responsavelId` | Select de usuários ativos (`GET /api/usuarios`) |
| `solicitanteId` | SearchSelect de solicitantes externos (`solicitantesApi.listar()`) |

### Comentários

- Input com botão Enviar — adiciona comentário vinculado ao usuário logado
- Cada comentário exibe: avatar de iniciais, nome do autor, data/hora, texto
- Exclusão pelo autor ou admin
- **Toggle "Resposta ao cliente" / "Nota interna" (Fase 4)**: pills no rodapé do formulário de comentário. "Resposta ao cliente" (default, `interno: false`) é visível no portal externo; "Nota interna" (`interno: true`) é invisível para o cliente. No modo nota interna o editor ganha tint âmbar, o placeholder muda e o botão vira "Anotar" (âmbar). O modo **não reseta após enviar** (evita vazar a nota seguinte ao cliente por engano) — reseta só ao trocar de chamado. State: `comentarioInterno`.
- **Renderização por tipo de comentário (Fase 4)**: nota interna renderiza com fundo `bg-amber-50` + borda âmbar + badge "Nota interna" (cadeado); comentário de autor externo (`autorSolicitanteId`) exibe o nome do solicitante (`autorSolicitante.nome`) + badge violeta "Cliente"
- **Auto-linkify**: URLs no texto dos comentários são convertidas em `<a>` clicáveis
- **@mention**: ao digitar `@` no textarea, exibe dropdown com lista de usuários internos; ao selecionar insere `@Nome` no texto; no comentário publicado, menções ficam destacadas com fundo `sysgate-50`
- **Imagens inline**: botão de câmera no formulário de comentário faz upload de imagem em base64; a imagem é exibida em miniatura abaixo do texto do comentário (vinculada via `comentarioId` no anexo)

### Anexos

- Upload em base64 — armazenado no campo `conteudo String` do modelo `ChamadoAnexo`
- Download via `GET /api/chamados/anexos/:aid` (base64 → buffer → `application/octet-stream`)
- Exibição como lista com nome do arquivo, tamanho e botão de download/exclusão
- Anexos de imagem vinculados a comentários (`comentarioId ≠ null`) são exibidos inline no comentário e também na lista geral de anexos

#### Validação de upload (Fase 0)

`POST /api/chamados/:id/anexos` valida no backend (`chamados.js`):

- **Whitelist de MIME**: apenas `image/png`, `image/jpeg`, `image/jpg`, `image/gif`, `image/webp`, `application/pdf` — outros tipos → **415**.
- **Tamanho real**: calculado do base64 (`bytesDeBase64`, ignora prefixo `data:` e padding), **não** confia no campo `tamanho` do cliente — que passa a ser sobrescrito pelo valor real.
- **Limite por anexo**: 5 MB → **413** (`MAX_ANEXO_BYTES`).
- **Limite por chamado**: soma de todos os anexos ≤ 25 MB → **413** (`MAX_CHAMADO_BYTES`, via `aggregate _sum`).
- **Nome sanitizado**: remove `/` `\` e caracteres de controle, limita a 255 chars (evita path traversal).

**Limite de payload HTTP** (`index.js`): `express.json` global reduzido para **1 MB**; um parser dedicado de **8 MB** é aplicado só na rota `POST /api/chamados/:id/anexos` (5 MB binário ≈ 6.7 MB em base64). Payload acima do limite → **413** (error handler global respeita `err.status`).

### Solicitante

- Campo opcional no chamado que vincula um contato externo (colaborador da prefeitura)
- Cadastrado via `SearchSelect` no `ModalChamado` — busca por nome/cargo/município
- Criação inline no próprio modal (botão "+ Novo Solicitante")
- Exibido como card de metadados no painel de detalhe: nome, cargo, email, telefone, município
- Diferente de `responsavelId` (usuário interno): solicitante é um contato do cliente, sem acesso ao sistema interno
- **Email único (Fase 1)**: `email` tem constraint `@unique` (identifica a futura conta do portal). POST/PUT com email já usado → **409**. As respostas da API usam select público (`SELECT_PUBLICO`) — os campos de credencial (`senhaHash`, tokens de recuperação etc.) nunca são retornados; `contaAtiva` é exposto para a UI indicar se o solicitante tem conta no portal.
- **Indicador de conta no portal (Fase 4)**: o `GET /api/chamados/:id` retorna o solicitante com `contaAtiva` e `temConta` (derivado de `senhaHash` no backend, removido antes da resposta). O card SOLICITANTE no grid de informações exibe badge: violeta "Conta no portal" (`contaAtiva`), âmbar "Conta pendente" (`temConta` sem aprovação), nada se sem conta.

### Preparação para o portal externo (Fase 1)

Mudanças de modelo que fundamentam o portal de atendimento (Fases 2–4 do plano em `krakion-analise-fable5.md`):

- **`Chamado.origem`**: `"interno"` (default) ou `"portal"` — chamados abertos pelo cliente no portal são marcados na criação.
- **Comentários com autor duplo**: `ChamadoComentario.autorId` passou a ser opcional; `autorSolicitanteId` identifica autor externo. Todo comentário tem exatamente um dos dois. O `GET /api/chamados/:id` já inclui `autorSolicitante { id, nome }` nos comentários.
- **`ChamadoComentario.interno`**: `true` = nota interna da equipe, invisível no portal. As rotas internas exibem todos os comentários; o filtro é aplicado nas rotas `/api/portal/*` (Fase 2).
- **Usuário-sistema "portal"**: usuário interno especial (login `portal`, inativo, sem login possível) criado pelo seed — chamados de origem portal usam o id dele em `criadoPorId`, que continua obrigatório.

### Portal externo — backend (Fase 2)

Rotas `/api/portal/*` em `backend/src/routes/portalAuth.js` e `portalChamados.js`, protegidas pelo middleware `autenticarExterno` (JWT com claim `tipo: 'externo'` + `sid`). Detalhes de segurança em `skills/seguranca.md`.

**Auth do portal (`/api/portal/auth`)** — trilho paralelo sobre o modelo `Solicitante`:

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/registrar` | Cria conta (hCaptcha + rate limit 5/15min); se o email já existe sem conta, só vincula `senhaHash`; conta nasce `contaAtiva: false` (aprovação manual); email com conta → 409 |
| POST | `/login` | Login por email (lockout 5 falhas → 15min); conta não aprovada → 401; retorna JWT `{ sid, nome, email, tipo: 'externo' }` |
| POST | `/logout` | Stateless |
| GET | `/me` | Dados da própria conta (requer token externo) |
| POST | `/esqueci-senha` | Token hash SHA-256 + expiry 1h; resposta sempre genérica; link aponta para `/portal/redefinir-senha` |
| POST | `/redefinir-senha` | Valida token/expiry, redefine senha, limpa lockout |

**Chamados do portal (`/api/portal/chamados`)** — todas as rotas operam SEMPRE com `where { solicitanteId: token.sid }`; não-dono recebe **404** (nunca 403):

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Lista chamados do solicitante (`?busca=`, `?status=`, paginação) — sem campos internos (prioridade/classificação/vertical/responsável/origem) |
| GET | `/anexos/:aid` | Download — 404 se não for dono ou se o anexo pertencer a comentário interno |
| GET | `/:id` | Detalhe com timeline pública: comentários `interno: false` e anexos não vinculados a comentários internos |
| POST | `/` | Abre chamado (`titulo` + `descricao`): `origem: 'portal'`, status `Nao Analisado`, município herdado do solicitante, `criadoPorId` = usuário-sistema portal, número persistido em transação + histórico de criação |
| POST | `/:id/comentarios` | Comentário com `autorSolicitanteId`, sempre `interno: false`; aceita `pendingAnexoIds` (vincula só anexos soltos do próprio chamado) |
| POST | `/:id/anexos` | Upload com a mesma validação da Fase 0 (MIME, 5 MB/anexo, 25 MB/chamado, nome sanitizado); `comentarioId` do cliente é ignorado |

**Impactos nas rotas internas:**

- `POST /api/chamados/:id/comentarios` aceita a flag **`interno`** (boolean) — nota da equipe invisível no portal (toggle de UI implementado na Fase 4).
- `GET /api/solicitantes` retorna **`temConta`** (derivado de `senhaHash`, que nunca sai na resposta) e aceita **`?contaPendente=true`** (registrou mas não foi aprovado).
- **`PATCH /api/solicitantes/:id/conta`** (somente admin) — body `{ contaAtiva: boolean }`; aprovar também zera o lockout.

### Portal externo — frontend (Fase 3)

Rotas `/portal/*` no mesmo SPA (App.jsx), com trilho de sessão totalmente separado do interno:

| Arquivo | Papel |
|---------|-------|
| `frontend/src/stores/portalAuthStore.js` | Zustand + persist (`krakion-portal-auth`) — `token` + `solicitante`; `login(email, senha, hcaptchaToken, lembrar)` |
| `frontend/src/lib/portalApi.js` | Axios separado com `baseURL: /api/portal`; injeta só o token do solicitante; 401 com sessão ativa → logout do portal + redirect `/portal/login` (401 sem token só propaga, para a tela de login tratar); exporta `portalAuthApi` e `portalChamadosApi` |
| `frontend/src/components/PortalRoute.jsx` | Guarda das rotas protegidas — redireciona para `/portal/login` se sem sessão |
| `frontend/src/pages/Portal/constants.js` | `STATUS_PORTAL` (tradução status interno → linguagem do cliente, ex.: "Nao Analisado" → "Recebido"), `validarArquivo` (espelha MIME/5MB da Fase 0), `arquivoParaBase64`, formatadores |
| `frontend/src/pages/Portal/Layout.jsx` | Layout simplificado (sem sidebar): header com logo + chip do solicitante + Sair, conteúdo `max-w-4xl` |
| `frontend/src/pages/Portal/Login.jsx` | Login por email; hCaptcha após 3 falhas; "Manter conectado" (30d); modal Esqueci minha senha |
| `frontend/src/pages/Portal/Registro.jsx` | Cadastro (nome/email/senha + cargo/telefone/município opcionais) com hCaptcha; tela de sucesso informa aprovação pendente |
| `frontend/src/pages/Portal/RedefinirSenha.jsx` | Rota pública `/portal/redefinir-senha?token=...` (destino do link do email) |
| `frontend/src/pages/Portal/MeusChamados.jsx` | Lista com busca debounced 400ms, filtro de status traduzido e paginação (20/pág) |
| `frontend/src/pages/Portal/NovoChamado.jsx` | Título + descrição + anexos (validados client-side); cria o chamado e sobe os anexos na sequência |
| `frontend/src/pages/Portal/DetalheChamado.jsx` | Timeline pública ("Conversa") com badge Equipe, resposta com anexos via `pendingAnexoIds`, download por blob; chamado encerrado (Concluído/Cancelado) bloqueia resposta |

Comportamentos importantes:

- **Sessões coexistem**: `krakion-portal-auth` é independente de `krakion-auth` — implantador e solicitante podem estar logados no mesmo browser sem conflito.
- **Status nunca vazam no vocabulário interno**: toda exibição passa por `statusPortal()`; valores desconhecidos caem em fallback cinza com o texto original.
- **Validação de anexos espelhada**: o client valida MIME e 5 MB antes do upload (a fonte da verdade continua sendo o backend da Fase 0).

### Integração no sistema interno (Fase 4)

Visibilidade do portal dentro do módulo interno de Chamados:

| Item | Onde | Comportamento |
|------|------|---------------|
| Badge "Portal" | Cards da Minha Fila, tabela do Painel (coluna Título), lista "Abertos sem responsável" do Dashboard e cabeçalho do painel de detalhe | Exibido quando `chamado.origem === 'portal'` — badge violeta com ícone de globo (`bg-violet-100 text-violet-700`). O `GET /chamados/dashboard` passou a incluir `origem` no select de `semResponsavel` |
| Toggle Nota interna | Formulário de comentário do painel de detalhe | Ver seção "Comentários" acima — envia a flag `interno` que as rotas `/api/portal/*` filtram |
| Badge "Cliente" | Comentários da timeline | Comentário com `autorSolicitanteId` exibe nome do solicitante + badge violeta |
| Conta no portal | Card SOLICITANTE do detalhe | Badge "Conta no portal" / "Conta pendente" (ver seção "Solicitante") |
| Aprovação de contas | `Usuarios.jsx` (admin) | Seção "Contas do Portal" — ver `docs/usuarios.md` |

---

## Painel de Histórico (`PainelHistorico`)

Coluna lateral direita (`w-72`) dentro do painel de detalhe, ativada pelo botão de relógio.

### Tipos de alterações rastreados

| Tipo | Cor |
|------|-----|
| `criacao` | `#22C55E` (verde) |
| `status` | `#3B82F6` (azul) |
| `responsavel` | `#8B5CF6` (roxo) |
| `classificacao` | `#6366F1` (índigo) |
| `prioridade` | `#F59E0B` (âmbar) |
| `titulo` | `#64748B` (cinza) |
| `vertical` | `#EC4899` (rosa) |

### Como o histórico é gerado

- `POST /api/chamados` cria automaticamente uma entrada `criacao` após criar o chamado
- `PUT /api/chamados/:id` busca o estado **antes** do update, compara campo a campo e cria entradas via `createMany` para cada campo alterado
- Para `responsavel`: o nome legível é armazenado em `valorDepois` (não apenas o ID)
- `valorAntes`/`valorDepois` = `null` quando o campo era/ficou sem valor — exibido como "removido" no frontend

---

## Aba Dashboard (`ChamadosDashboard`)

Componente independente que busca `chamadosApi.dashboard()` no mount.

### Gráficos (Recharts)

| Gráfico | Tipo | Dados |
|---------|------|-------|
| Chamados por dia (14 dias) | AreaChart | `porDia` — raw SQL SQLite |
| Por status | PieChart | `porStatus` |
| Por classificação | PieChart | `porClassificacao` |
| Por município (top 10) | BarChart horizontal | `porMunicipio` |
| Por vertical | BarChart horizontal | `porVertical` |
| Por prioridade | BarChart vertical | `porPrioridade` |

### Cards de resumo

- Total de chamados
- Criados hoje
- Criados no mês
- Concluídos no mês

### Tabela "Abertos sem responsável"

Chamados com `responsavelId = null` e `status ≠ 'Concluido'`, com dot pulsante laranja no cabeçalho.

---

## API utilizada

```js
// Listagem com todos os filtros suportados
chamadosApi.listar({
  busca?,
  status?,
  classificacao?,
  responsavelId?,
  vertical?,
  verticais?,          // vírgula-separado — ex: "Contábil,Pessoal"
  sistemas?,           // vírgula-separado — ex: "e-Pessoal,e-Folha"
  prioridade?,
  municipio?,
  semResponsavel?,     // 'true' — chamados sem responsável
  excluirEncerrados?,  // 'true' — exclui status Concluido e Cancelado
  pagina?,
  limite?,
})

chamadosApi.estatisticas()
chamadosApi.dashboard()
chamadosApi.obter(id)
chamadosApi.criar(dados)
chamadosApi.atualizar(id, dados)
chamadosApi.deletar(id)                  // somente admin
chamadosApi.historico(id)
chamadosApi.criarComentario(id, { texto, pendingAnexoIds?, interno? })  // interno: nota da equipe (Fase 2)
chamadosApi.deletarComentario(cid)
chamadosApi.criarAnexo(id, { nomeArquivo, tipo, conteudo, tamanho, comentarioId? })
chamadosApi.deletarAnexo(aid)

// Solicitantes externos — respostas incluem temConta (derivado, sem credenciais)
solicitantesApi.listar({ busca?, municipio?, contaPendente? })
solicitantesApi.criar({ nome, cargo?, email?, telefone?, municipio? })
solicitantesApi.atualizar(id, data)
solicitantesApi.atualizarConta(id, contaAtiva)  // PATCH /:id/conta — aprovar/desativar conta do portal (admin, Fase 4)
solicitantesApi.deletar(id)   // somente admin

// Fila personalizada — salva em campo filaFiltro do usuário
// Formato: JSON string '{ "verticais": [], "sistemas": [], "status": [] }'
// Leitura: GET /api/auth/me → r.data.filaFiltro
// Escrita: PUT /api/usuarios/:id → body.filaFiltro
```

---

## Estado React (principais — `index.jsx`)

| State | Tipo | Descrição |
|-------|------|-----------|
| `chamados` | array | Lista de chamados da aba Minha Fila (paginada) |
| `selecionado` | object \| null | Chamado com painel de detalhe aberto |
| `aba` | string | `'lista'` \| `'painel'` \| `'dashboard'` |
| `subAba` | string | `'meus'` \| `'fila'` \| `'semdono'` |
| `filaConfig` | object \| null | Config da Fila: `{ verticais[], sistemas[], status[] }` |
| `modalFilaConfig` | boolean | Modal de configuração da Fila aberto |
| `contSemDono` | number | Contagem de chamados sem responsável (badge no tab) |
| `totalMF` | number | Total de resultados da aba Minha Fila (para paginação) |
| `paginaMF` | number | Página atual da Minha Fila |
| `limiteMF` | number | Itens por página: 20 (padrão) ou 50 |
| `buscaInput` | string | Valor do input de busca (exibição imediata) |
| `busca` | string | Valor debounced enviado à API (400ms delay) |
| `mostrarHistorico` | boolean | Painel de histórico visível |
| `historicoKey` | number | Incrementado após update para forçar re-fetch do histórico |
| `showModal` | boolean | Modal criar/editar chamado |
| `editando` | object \| null | Chamado em edição |
| `novoComentario` | string | Texto do comentário em digitação |
| `comentarioInterno` | boolean | Toggle do formulário: `true` = nota interna (invisível no portal). Não reseta após enviar; reseta ao trocar de chamado |
| `mostrarMention` | boolean | Dropdown de @mention visível |
| `mentionQuery` | string | Texto após `@` para filtrar usuários no dropdown |
| `pendingCommentAnexos` | array | IDs de anexos de imagem aguardando vinculação ao comentário |
| `comentarioImgs` | object | `{ [comentarioId]: blobUrl }` — URLs de blob para imagens inline |

---

## Schema do banco (modelos relevantes)

```prisma
model Chamado {
  id             Int                 @id @default(autoincrement())
  numero         String?             @unique  // protocolo persistido PREFIXO-YYYY-NNNNN (Fase 0)
  titulo         String
  descricao      String?
  status         String              @default("Em Aberto")
  classificacao  String?
  prioridade     String?
  vertical       String?
  sistema        String?
  municipio      String?
  entidade       String?
  origem         String              @default("interno")  // "interno" | "portal" (Fase 1)
  criadoPorId    Int
  responsavelId  Int?
  solicitanteId  Int?
  solicitante    Solicitante?        @relation(fields: [solicitanteId], references: [id])
  comentarios    ChamadoComentario[]
  anexos         ChamadoAnexo[]
  historico      ChamadoHistorico[]
  criadoEm      DateTime            @default(now())
  atualizadoEm  DateTime            @updatedAt
}

model ChamadoComentario {
  id                 Int          @id @default(autoincrement())
  conteudo           String
  chamadoId          Int
  autorId            Int?         // autor interno (equipe) — null quando autor externo (Fase 1)
  autorSolicitanteId Int?         // autor externo (portal) — null quando autor interno (Fase 1)
  interno            Boolean      @default(false)  // true = invisível no portal (Fase 1)
  criadoEm           DateTime     @default(now())
}

model ChamadoAnexo {
  id           Int      @id @default(autoincrement())
  chamadoId    Int
  comentarioId Int?     // null = anexo geral; preenchido = imagem inline de comentário
  nomeArquivo  String
  tipo         String
  conteudo     String   // base64
  tamanho      Int
  criadoEm    DateTime @default(now())
}

model ChamadoHistorico {
  id          Int      @id @default(autoincrement())
  chamadoId   Int
  usuarioId   Int
  tipo        String
  valorAntes  String?
  valorDepois String?
  criadoEm   DateTime @default(now())
}

model Solicitante {
  id        Int       @id @default(autoincrement())
  nome      String
  cargo     String?
  email     String?   @unique   // Fase 1: identifica a conta do portal
  telefone  String?
  municipio String?
  // Credenciais do portal externo (Fase 1) — nunca retornadas pela API interna
  senhaHash            String?    // null = sem conta (cadastrado pela equipe)
  contaAtiva           Boolean    @default(false)  // aprovação pela equipe
  emailVerificado      Boolean    @default(false)
  tentativasLogin      Int        @default(0)
  bloqueadoAte         DateTime?
  recuperacaoTokenHash String?
  recuperacaoExpira    DateTime?
  chamados     Chamado[]
  comentarios  ChamadoComentario[]
  criadoEm  DateTime  @default(now())
}

// filaFiltro em Usuario:
model Usuario {
  // ...
  filaFiltro  String?   // JSON: { "verticais": [], "sistemas": [], "status": [] }
  // ...
}
```
