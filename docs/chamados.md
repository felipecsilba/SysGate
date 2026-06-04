# Chamados — Documentação da Tela

**Arquivo:** `frontend/src/pages/Chamados/index.jsx`

---

## Visão Geral

O módulo **Chamados** é um sistema interno de gestão de atendimentos/tickets. Registra chamados abertos pelos implantadores durante o ciclo de vida de uma implantação municipal — com histórico automático de alterações, comentários, anexos e dashboard analítico. Os dados são **globais** — todos os usuários veem todos os chamados. Exclusão restrita a admins.

---

## Sub-abas do módulo

Toggle estilo pill no header, junto ao título:

| Aba | Conteúdo |
|-----|----------|
| **Gestão** | Lista de chamados + filtros + painel de detalhe |
| **Dashboard** | Gráficos analíticos agregados |

---

## Aba Gestão

### Layout

Tela dividida em duas colunas:

| Coluna | Conteúdo |
|--------|----------|
| Lista (esquerda) | Filtros + tabela de chamados paginada |
| Painel detalhe (direita) | Detalhe completo do chamado selecionado |

O painel de detalhe pode exibir uma terceira coluna lateral (histórico) ativada pelo botão de relógio no cabeçalho.

### Filtros disponíveis

| Filtro | Campo |
|--------|-------|
| Busca textual | título ou município |
| Status | Em Aberto, Em Andamento, Aguardando, Concluído |
| Classificação | tipo do chamado |
| Responsável | usuário atribuído |
| Vertical | vertical Betha |

### Numeração dos chamados

Formato: `#CH-{ano}-{id com 4 zeros}` — calculado no frontend via `ticketNum(c)`.

**Exemplo:** chamado com `id = 42`, criado em 2026 → `#CH-2026-0042`

Não há campo dedicado no banco; o número é derivado em tempo real.

---

## Painel de Detalhe

### Cabeçalho

- Número do ticket + título
- Badges de status, classificação e prioridade
- Botões: editar, histórico, excluir (admin)

### Campos do chamado

| Campo | Origem dos dados |
|-------|-----------------|
| `titulo` | Texto livre |
| `descricao` | Texto livre (suporta multiline) |
| `status` | Em Aberto / Em Andamento / Aguardando / Concluído |
| `classificacao` | tipo do atendimento |
| `prioridade` | Baixa / Média / Alta / Urgente |
| `vertical` | Select populado pelo catálogo (`catalogoApi.listar()`) |
| `sistema` | Dependente da vertical selecionada |
| `municipio` | Texto livre com sugestões do portfólio (`portfolioApi.listar()`) |
| `entidade` | Texto livre com sugestões da entidade do município selecionado |
| `responsavelId` | Select de usuários ativos (`GET /api/usuarios`) |

### Comentários

- Input com botão Enviar — adiciona comentário vinculado ao usuário logado
- Cada comentário exibe: avatar de iniciais, nome do autor, data/hora, texto
- Exclusão pelo autor ou admin

### Anexos

- Upload em base64 — armazenado no campo `conteudo String` do modelo `ChamadoAnexo`
- Download via `GET /api/chamados/anexos/:aid` (base64 → buffer → `application/octet-stream`)
- Exibição como lista com nome do arquivo, tamanho e botão de download/exclusão

---

## Painel de Histórico (PainelHistorico)

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

## Aba Dashboard

Componente `ChamadosDashboard` que busca `chamadosApi.dashboard()` no mount.

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
chamadosApi.listar({ busca?, status?, classificacao?, responsavelId?, vertical?, pagina?, limite? })
chamadosApi.estatisticas()
chamadosApi.dashboard()
chamadosApi.detalhe(id)
chamadosApi.criar(dados)
chamadosApi.atualizar(id, dados)
chamadosApi.remover(id)                  // somente admin
chamadosApi.historico(id)
chamadosApi.adicionarComentario(id, { texto })
chamadosApi.removerComentario(cid)
chamadosApi.adicionarAnexo(id, { nomeArquivo, tipo, conteudo, tamanho })
chamadosApi.removerAnexo(aid)
chamadosApi.downloadAnexo(aid)
```

---

## Estado React (principais)

| State | Tipo | Descrição |
|-------|------|-----------|
| `chamados` | array | Lista de chamados (paginada) |
| `selecionado` | object \| null | Chamado com painel de detalhe aberto |
| `aba` | string | `'lista'` \| `'dashboard'` |
| `mostrarHistorico` | boolean | Painel de histórico visível |
| `historicoKey` | number | Incrementado após update para forçar re-fetch do histórico |
| `filtros` | object | Todos os filtros ativos |
| `showModal` | boolean | Modal criar/editar chamado |
| `editando` | object \| null | Chamado em edição |
| `pagina` | number | Página atual da lista |

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
```
