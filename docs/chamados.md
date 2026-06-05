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
| **Minha Fila** | Visão pessoal: sub-abas Meus, Fila e Sem Dono |
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
| **Sem Dono** | `semResponsavel = true` + `excluirEncerrados = true` | Chamados sem responsável atribuído; badge laranja com contagem no tab |

### Minha Fila — configuração

- Botão de engrenagem no tab "Fila" abre `ModalFilaConfig`
- Configuração salva em `PUT /api/usuarios/:id` no campo `filaFiltro` (JSON string)
- Ao entrar no módulo, `GET /api/auth/me` retorna o `filaFiltro` salvo e o estado é restaurado
- Se a Fila não estiver configurada: exibe empty state orientando o usuário a configurar

### Paginação e busca

- Padrão: 20 chamados por página; opção de 50 via botão "Por pág: 20 | 50"
- Busca com debounce de 400ms — só dispara a query após pausa na digitação
- Controles de navegação ← → na base do painel esquerdo

### Contagem "Sem Dono"

- `contSemDono` é buscado separadamente via `carregarContSemDono` (1 request com `limite: 1`)
- Chamado apenas no mount e após mutações que alteram responsável (`atualizarCampo('responsavelId')`) ou excluem chamado (`deletarChamado`)
- Não é recalculado em cada load da lista principal

### Numeração dos chamados

Formato: `MUNI-YYYY-NNNNN` — calculado no frontend via `ticketMapMF` (useMemo).

- **Prefixo (`MUNI`)**: primeiras 4 letras do município em maiúsculas, sem acentos (ex: Rurópolis → `RURO`, Belém → `BELE`). Sem município → `CH`.
- **Ano (`YYYY`)**: ano de `criadoEm`.
- **Sequencial (`NNNNN`)**: contagem por município+ano, ordenada por `id ASC` (5 dígitos com zeros à esquerda). Reseta a cada virada de ano.

**Performance:** `ticketMapMF` é um `useMemo` que itera a lista **uma vez** (O(n)) e retorna `{ [id]: "MUNI-YYYY-NNNNN" }`. Cada card consulta `ticketMapMF[c.id]` em O(1) — em vez do cálculo anterior que era O(n) **por card** (total O(n²)).

**Cuidado:** o número pode mudar se chamados forem deletados (sequência não é persistida no banco).

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
- **Botão Pegar / Delegar para mim** (abaixo dos badges, visível quando o chamado não está encerrado e não pertence ao usuário logado):
  - Sem responsável → botão verde **"Pegar para mim"** — delega diretamente sem confirmação
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
- **Auto-linkify**: URLs no texto dos comentários são convertidas em `<a>` clicáveis
- **@mention**: ao digitar `@` no textarea, exibe dropdown com lista de usuários internos; ao selecionar insere `@Nome` no texto; no comentário publicado, menções ficam destacadas com fundo `sysgate-50`
- **Imagens inline**: botão de câmera no formulário de comentário faz upload de imagem em base64; a imagem é exibida em miniatura abaixo do texto do comentário (vinculada via `comentarioId` no anexo)

### Anexos

- Upload em base64 — armazenado no campo `conteudo String` do modelo `ChamadoAnexo`
- Download via `GET /api/chamados/anexos/:aid` (base64 → buffer → `application/octet-stream`)
- Exibição como lista com nome do arquivo, tamanho e botão de download/exclusão
- Anexos de imagem vinculados a comentários (`comentarioId ≠ null`) são exibidos inline no comentário e também na lista geral de anexos

### Solicitante

- Campo opcional no chamado que vincula um contato externo (colaborador da prefeitura)
- Cadastrado via `SearchSelect` no `ModalChamado` — busca por nome/cargo/município
- Criação inline no próprio modal (botão "+ Novo Solicitante")
- Exibido como card de metadados no painel de detalhe: nome, cargo, email, telefone, município
- Diferente de `responsavelId` (usuário interno): solicitante é um contato do cliente, sem acesso ao sistema

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
chamadosApi.criarComentario(id, { texto, pendingAnexoIds? })
chamadosApi.deletarComentario(cid)
chamadosApi.criarAnexo(id, { nomeArquivo, tipo, conteudo, tamanho, comentarioId? })
chamadosApi.deletarAnexo(aid)

// Solicitantes externos
solicitantesApi.listar({ busca?, municipio? })
solicitantesApi.criar({ nome, cargo?, email?, telefone?, municipio? })
solicitantesApi.atualizar(id, data)
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
| `mostrarMention` | boolean | Dropdown de @mention visível |
| `mentionQuery` | string | Texto após `@` para filtrar usuários no dropdown |
| `pendingCommentAnexos` | array | IDs de anexos de imagem aguardando vinculação ao comentário |
| `comentarioImgs` | object | `{ [comentarioId]: blobUrl }` — URLs de blob para imagens inline |

---

## Schema do banco (modelos relevantes)

```prisma
model Chamado {
  id             Int                 @id @default(autoincrement())
  titulo         String
  descricao      String?
  status         String              @default("Em Aberto")
  classificacao  String?
  prioridade     String?
  vertical       String?
  sistema        String?
  municipio      String?
  entidade       String?
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
  id        Int      @id @default(autoincrement())
  chamadoId Int
  usuarioId Int
  texto     String
  criadoEm DateTime @default(now())
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
  email     String?
  telefone  String?
  municipio String?
  chamados  Chamado[]
  criadoEm DateTime  @default(now())
}

// filaFiltro em Usuario:
model Usuario {
  // ...
  filaFiltro  String?   // JSON: { "verticais": [], "sistemas": [], "status": [] }
  // ...
}
```
