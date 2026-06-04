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
