# Portfólio — Documentação da Tela

**Arquivo:** `frontend/src/pages/Portfolio/index.jsx`

---

## Visão Geral

A tela **Portfólio** documenta o portfólio de clientes atendidos pela empresa. Registra municípios, suas entidades (prefeitura, câmara, fundação etc.), os sistemas Betha que cada entidade utiliza e os stakeholders (contatos) de cada entidade. Os dados são **globais** — todos os usuários veem o mesmo portfólio. A escrita é restrita a admins.

---

## Permissões

| Ação | Quem pode |
|------|-----------|
| Visualizar | Qualquer usuário autenticado |
| Criar / editar / excluir qualquer dado | Somente admin |

---

## Hierarquia de dados

```
PortfolioMunicipio
└── Entidade[]
    ├── EntidadeSistema[]     (sistemas que a entidade utiliza)
    └── Stakeholder[]
        └── StakeholderSistema[]  (M2M: quais sistemas o contato é responsável)
```

> Os sistemas do portfólio (`EntidadeSistema`) são independentes dos modelos `Sistema`/`Endpoint` usados no Sandbox — são listas simples de nomes para documentar quais sistemas cada entidade utiliza.

---

## Layout Geral

Duas colunas fixas lado a lado:

| Coluna | Largura | Conteúdo |
|--------|---------|----------|
| Lista de municípios | `w-72` | Busca local + lista com highlight do selecionado |
| Painel de entidades | `flex-1` | Accordion de entidades do município selecionado |

**Mobile:** colunas empilham; o painel de entidades substitui a lista com botão "← Voltar".

**Município selecionado:** destaque com `bg-sysgate-50 border-l-2 border-sysgate-500`.

---

## Accordion de Entidades

Cada entidade é exibida em um card expansível com duas seções internas:

### Seção Sistemas

- Cards agrupados por vertical (cada vertical = header colorido + fundo tingido)
- Sistemas sem vertical ficam no grupo **Outros**
- Badge **Ativo / Inativo** com toggle direto (admin)
- Campo `observacoes` exibido abaixo do nome do sistema

### Seção Contatos (Stakeholders)

- Cards com avatar de iniciais gerado a partir do nome
- Dados: nome, cargo, email, telefone
- Chips dos sistemas vinculados (M2M) com cor da vertical

---

## Verticais (CatálogoVertical)

O catálogo de verticais Betha é armazenado no banco no modelo `CatalogoVertical`. Na primeira chamada `GET /api/catalogo` a tabela é populada automaticamente com as 9 verticais oficiais:

| Vertical | Cor |
|----------|-----|
| Contábil | `#3B82F6` |
| Contratos | `#8B5CF6` |
| Arrecadação | `#10B981` |
| Pessoal | `#F59E0B` |
| Atendimento | `#EC4899` |
| NoPaper | `#6366F1` |
| Educação | `#14B8A6` |
| Saúde | `#EF4444` |
| Gestão Municipal | `#64748B` |

A cor da vertical é usada nos cabeçalhos dos cards (cor sólida + texto branco) e nos fundos (rgba com opacidade 0.05–0.15).

---

## Modal — Gerenciar Sistemas (ModalGerenciarSistemas)

Abre ao clicar em "Gerenciar sistemas" de uma entidade (admin). Exibe chips de sistemas agrupados por vertical. Estados dos chips:

| Estado | Visual |
|--------|--------|
| Ativo (já vinculado) | Cor sólida da vertical + texto branco |
| Inativo (vinculado mas desativado) | Borda pontilhada cinza |
| Pendente de ativação | Fundo sólido da vertical + texto branco |

---

## Modal — Catálogo (ModalCatalogo)

Acessível pelo botão de engrenagem no header (admin). Permite criar, editar e excluir verticais e seus sistemas. Campos por vertical:

| Campo | Tipo |
|-------|------|
| Nome | input text |
| Cor | `<input type="color">` |
| Sistemas | chips com × para remover + input Enter para adicionar |

Ao salvar: processa deletados (DELETE), depois cria novos (`_novo: true` → POST) ou atualiza existentes (PUT).

---

## M2M Stakeholder ↔ EntidadeSistema

A tabela pivot `StakeholderSistema` com `@@id([stakeholderId, entidadeSistemaId])` armazena quais sistemas um contato é responsável.

**Padrão de atualização:** `deleteMany` de todos os vínculos do stakeholder + `createMany` com os novos IDs (replace all). O frontend envia `sistemas: [id1, id2]` (array de IDs de `EntidadeSistema`).

---

## API utilizada

```js
portfolioApi.listar({ busca?, pagina?, limite? })
portfolioApi.criar({ nome, observacoes })
portfolioApi.detalhe(id)
portfolioApi.atualizar(id, dados)
portfolioApi.remover(id)

portfolioApi.entidades(municipioId)
portfolioApi.criarEntidade(municipioId, { nome, tipo, observacoes })
portfolioApi.atualizarEntidade(eid, dados)
portfolioApi.removerEntidade(eid)

portfolioApi.sistemas(eid)
portfolioApi.criarSistema(eid, { nome, vertical, ativo, observacoes })
portfolioApi.atualizarSistema(sid, dados)
portfolioApi.removerSistema(sid)

portfolioApi.stakeholders(eid)
portfolioApi.criarStakeholder(eid, { nome, cargo, email, telefone, sistemas[] })
portfolioApi.atualizarStakeholder(shid, dados)
portfolioApi.removerStakeholder(shid)

catalogoApi.listar()
catalogoApi.criar(dados)
catalogoApi.atualizar(id, dados)
catalogoApi.remover(id)
```

---

## Estado React (principais)

| State | Tipo | Descrição |
|-------|------|-----------|
| `municipios` | array | Lista de municípios do portfólio |
| `selecionado` | object \| null | Município com painel de entidades aberto |
| `entidades` | array | Entidades do município selecionado (com sistemas e stakeholders) |
| `entidadesAbertas` | `Set<number>` | IDs das entidades com accordion aberto |
| `catalogo` | array | Verticais do catálogo Betha |
| `busca` | string | Filtro de texto na lista de municípios |
| `showModalMunicipio` | boolean | Modal criar/editar município |
| `showModalSistemas` | object \| null | Entidade cujo modal de sistemas está aberto |
| `showModalCatalogo` | boolean | Modal de catálogo aberto |

---

## Schema do banco (modelos relevantes)

```prisma
model PortfolioMunicipio {
  id          Int        @id @default(autoincrement())
  nome        String
  observacoes String?
  entidades   Entidade[]
  criadoEm   DateTime   @default(now())
}

model Entidade {
  id           Int               @id @default(autoincrement())
  municipioId  Int
  nome         String
  tipo         String?
  observacoes  String?
  municipio    PortfolioMunicipio @relation(...)
  sistemas     EntidadeSistema[]
  stakeholders Stakeholder[]
}

model EntidadeSistema {
  id           Int                  @id @default(autoincrement())
  entidadeId   Int
  nome         String
  vertical     String?
  ativo        Boolean              @default(true)
  observacoes  String?
  entidade     Entidade             @relation(...)
  stakeholders StakeholderSistema[]
}

model Stakeholder {
  id         Int                  @id @default(autoincrement())
  entidadeId Int
  nome       String
  cargo      String?
  email      String?
  telefone   String?
  entidade   Entidade             @relation(...)
  sistemas   StakeholderSistema[]
}

model StakeholderSistema {
  stakeholderId     Int
  entidadeSistemaId Int
  stakeholder       Stakeholder     @relation(...)
  entidadeSistema   EntidadeSistema @relation(...)
  @@id([stakeholderId, entidadeSistemaId])
}

model CatalogoVertical {
  id       Int    @id @default(autoincrement())
  nome     String @unique
  cor      String           // hex, ex: "#3B82F6"
  sistemas String           // JSON.stringify(string[])
  ordem    Int    @default(0)
}
```

## Regras e armadilhas

> Trazido do CLAUDE.md da raiz em 2026-11-09 (Fase 1 da economia de contexto — ver docs/plans/2026-11-09-fase1-economia-contexto.md).

- **Portfólio — dados globais (sem isolamento)**: `PortfolioMunicipio` não possui `usuarioId`; todos os usuários autenticados veem o mesmo portfólio. Diferente do módulo `Municipios` que é isolado por usuário. Escrita/exclusão restrita a admin via `exigirAdmin`.
- **Portfólio — hierarquia**: `PortfolioMunicipio` → `Entidade[]` → `EntidadeSistema[]` + `Stakeholder[]` → `StakeholderSistema[]` (M2M). Os sistemas do portfólio são independentes dos modelos `Sistema`/`Endpoint` usados no Sandbox — são listas simples de nomes para documentar quais sistemas cada entidade utiliza.
- **Portfólio — M2M Stakeholder ↔ EntidadeSistema**: tabela pivot `StakeholderSistema` com `@@id([stakeholderId, entidadeSistemaId])`. Update = `deleteMany` todos os vínculos do stakeholder + `createMany` com os novos IDs (padrão "replace all"). Frontend envia `sistemas: [id1, id2]` (array de IDs de `EntidadeSistema`).
- **Portfólio — cascade delete manual**: SQLite não executa cascades automáticos via Prisma para relações M2M explícitas. Handlers deletam na ordem correta: `StakeholderSistema` → `Stakeholder` → `EntidadeSistema` → `Entidade` → `PortfolioMunicipio`.
- **Portfólio — ordem de rotas Express**: segmentos literais (`/entidades/:eid`, `/sistemas/:sid`, `/stakeholders/:shid`) registrados ANTES de `/:id` e `/:id/entidades` para evitar conflito de captura. Regra geral já documentada em "Rotas nomeadas ANTES de /:id".
- **Portfólio — layout Portfolio.jsx**: duas colunas — lista de municípios (`w-72 shrink-0`) com busca local + painel de entidades (`flex-1`) com accordion. Município selecionado: highlight `bg-sysgate-50 border-l-2 border-sysgate-500`. Mobile: colunas empilham, painel substitui lista com botão "← Voltar".
- **Portfólio — accordion de entidades**: estado `entidadesAbertas` é um `Set<number>` de IDs. Toggle: se ID está no Set → remove; senão → adiciona. Seção "Sistemas" exibe badge ativo/inativo com toggle direto (admin). Seção "Contatos" exibe cards com avatar de iniciais, dados de contato e chips dos sistemas vinculados.
- **Portfólio — verticais**: `EntidadeSistema` possui campo `vertical String?` que referencia o nome de uma `CatalogoVertical`. No accordion, sistemas são agrupados por vertical (cada vertical = card com header colorido + fundo tingido). Sistemas sem vertical ficam no grupo "Outros".
- **Portfólio — CatalogoVertical**: modelo `CatalogoVertical` (nome único, cor hex, sistemas JSON array, ordem int) armazena o catálogo de verticais Betha no banco. Na 1ª chamada `GET /api/catalogo` a tabela é populada com as 9 verticais oficiais (Contábil, Contratos, Arrecadação, Pessoal, Atendimento, NoPaper, Educação, Saúde, Gestão Municipal) e suas cores. `sistemas` é armazenado como `JSON.stringify(array)` e retornado como `JSON.parse(array)`.
- **Portfólio — cores de verticais**: mapa `CORES_VERTICAIS` em `Portfolio.jsx` (hardcoded, cores oficiais Betha) mapeia nome → hex. `corVertical(v)` faz lookup e retorna `COR_OUTROS_HEX = '#94A3B8'` para verticais não mapeadas. `hexToRgb(hex)` converte para `"r, g, b"` usado em `rgba(...)` para fundos com opacidade. Cabeçalhos de cards usam cor sólida + texto branco; fundos de cards usam `rgba(..., 0.05/0.15)`.
- **Portfólio — modal picker (ModalGerenciarSistemas)**: aceita prop `catalogo` (array da API). Chips de sistemas usam `getChipStyle(vertical, sis)` que retorna `{ cls, sty }` — chips ativos têm cor da vertical (inline style), chips fantasma têm borda pontilhada cinza, chips pendentes de ativação têm fundo sólido da vertical + texto branco. A API retorna `nome` (não `vertical`) — desestruturar como `{ nome: vertical, sistemas }`.
- **ModalCatalogo (`Portfolio/ModalCatalogo.jsx`)**: admin only, acessível pelo botão "Catálogo" em `Sistemas.jsx` (Configuração → Sistemas). O arquivo do componente permanece em `Portfolio/` por conveniência. Lista cards editáveis: nome (input), cor (`<input type="color">`), sistemas (chips com × para remover + input Enter para adicionar). "+ Nova vertical" adiciona entrada com `_novo: true`. Ao salvar: itera `deletados[]` (DELETE), depois itera `itens` (POST para `_novo`, PUT para existentes). Em `Sistemas.jsx` o `onSaved` é no-op (Sistemas não consome estado do catálogo). Em `Portfolio/index.jsx` o catálogo ainda é lido via `catalogoApi.listar()` para exibição no accordion — apenas o gatilho de edição foi removido.
