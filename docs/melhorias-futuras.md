# Melhorias Futuras — Backlog de Ideias

Documento para registrar sugestões de melhoria identificadas durante o desenvolvimento.
Não representa comprometimento de prazo — serve como referência para sessões futuras de planejamento.

---

> Adicione novas melhorias abaixo seguindo o mesmo formato `[MELHORIA-NNN]`.

---

## Módulo: Chamados

---

### [MELHORIA-005] Numeração de chamado por município (prefixo)

**Descrição:**
Chamados exibem um código derivado do município, ex: `RURO-001` (Rurópolis) ou `VISE-001` (Viseu), em vez do código global `#CH-2026-NNNN`.

**Complexidade:** Média

**Estratégia recomendada (sem coluna extra no banco):**
Manter o `id` global como referência interna. O número de exibição é calculado no frontend:
1. Ao listar chamados de um município, ordenar por `id ASC` e usar o índice de posição como número sequencial local.
2. O prefixo são as 4 primeiras letras do nome do município em maiúsculas, sem acento (`RURO`, `VISE`, `BELE`).

**Função `ticketNum` atual** (`index.jsx:44`):
```js
// ATUAL
return `#CH-${new Date(c.criadoEm).getFullYear()}-${String(c.id).padStart(4, '0')}`

// PROPOSTO — requer lista completa ordenada para calcular posição
function ticketMunicipio(c, listaMunicipio) {
  const prefixo = (c.municipio || 'SEM')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
  const pos = listaMunicipio.findIndex(x => x.id === c.id) + 1
  return `${prefixo}-${String(pos).padStart(3, '0')}`
}
```

**Limitação:** o número muda se chamados forem deletados (não é sequência persistida). Se isso for problema, a alternativa é adicionar coluna `sequenciaLocal Int?` no banco e preenchê-la no backend ao criar (COUNT + 1 por município).

**Opção simplificada sem DB:** manter `#CH-YYYY-NNNN` como código oficial e exibir o prefixo do município (`RURO`) como tag visual no chamado, sem ser um número sequencial.

---

### [MELHORIA-006] Imagens inline nos comentários (estilo Jira)

**Descrição:**
Quando um comentário contém uma imagem anexada, ela é exibida em miniatura diretamente no fluxo de comentários, sem precisar baixar o arquivo separadamente.

**Complexidade:** Média

**Estratégia recomendada:**

**Opção A — Vincular anexos ao comentário (mais completa):**
- Adicionar `comentarioId Int?` em `ChamadoAnexo` (`prisma/schema.prisma`)
- Ao fazer upload de imagem em um comentário, associar o `anexoId` ao `comentarioId`
- No frontend, ao renderizar o comentário, verificar se `detalhe.anexos` contém imagens com aquele `comentarioId` e exibir como `<img>` inline

**Opção B — Detectar URL de imagem no texto (mais simples, sem DB):**
- No texto do comentário, detectar URLs que terminam em `.jpg`, `.png`, `.gif`, `.webp`
- Renderizar `<img src="..." className="max-w-xs rounded mt-1">` abaixo do texto

**Recomendação:** Opção A para fidelidade ao fluxo Jira. Opção B como passo intermediário rápido.

---

### [MELHORIA-007] Mencionar usuários (@mention) nos comentários

**Descrição:**
Ao digitar `@` em um comentário, exibir dropdown com os usuários internos para selecionar. O nome fica destacado no comentário publicado.

**Complexidade:** Média-Alta

**Frontend:**
- No textarea de comentário, monitorar digitação de `@`
- Ao digitar `@`, exibir dropdown posicionado com lista de `usuarios` (já disponível no estado)
- Ao selecionar: inserir `@nome` no texto
- Na renderização do comentário publicado: regex para detectar `@nome` e envolver em `<span className="text-sysgate-600 font-medium bg-sysgate-50 rounded px-1">@nome</span>`

**Backend:** Sem mudança no MVP — menções são apenas visuais (texto com `@nome`). Notificações podem ser adicionadas em versão futura.

**Dependência:** A lista de usuários já é passada como prop `usuarios` para o componente de detalhe — disponível para o dropdown.

---

### [MELHORIA-004] Usuários externos como solicitantes

**Descrição:**
Cadastrar pessoas externas (colaboradores da prefeitura) que podem ser vinculados como solicitantes de chamados. Diferente dos usuários internos (implantadores), são contatos do cliente.

**Complexidade:** Alta

**Mudanças no banco (`prisma/schema.prisma`):**
```prisma
model Solicitante {
  id       Int       @id @default(autoincrement())
  nome     String
  cargo    String?
  email    String?
  telefone String?
  municipio String?  // município ao qual este contato pertence (texto livre)
  chamados  Chamado[]
  criadoEm DateTime  @default(now())
}
// Em Chamado: adicionar campo
solicitanteId Int?
solicitante   Solicitante? @relation(fields: [solicitanteId], references: [id])
```

**Backend — nova rota `routes/solicitantes.js`:**
- `GET /api/solicitantes` — lista (filtro `?municipio=`, `?busca=`)
- `POST /api/solicitantes` — cria (admin ou qualquer autenticado — definir)
- `PUT /api/solicitantes/:id` — atualiza
- `DELETE /api/solicitantes/:id` — remove (somente admin)
- Registrar em `index.js` e proteger com `autenticar`

**Backend — `routes/chamados.js`:**
- Incluir `solicitanteId` no `create`/`update`
- No `GET /:id` incluir `include: { solicitante: true }`

**Frontend:**
- `ModalChamado.jsx`: adicionar campo `SearchSelect` para buscar/selecionar solicitante
- `index.jsx`: exibir nome do solicitante no painel de detalhes do chamado
- Criar página ou modal `Solicitantes.jsx` para CRUD (ou integrar no detalhe do chamado com inline-create)
- `lib/api.js`: adicionar `solicitantesApi`

---

## Ordem sugerida de implementação

Agrupada por esforço × valor:

| Prioridade | ID | Melhoria | Esforço |
|---|---|---|---|
| 1 | MELHORIA-005 | Numeração por município (prefixo visual) | Médio |
| 2 | MELHORIA-007 | Mencionar usuários (@mention) | Médio |
| 3 | MELHORIA-006 | Imagens inline nos comentários | Médio |
| 4 | MELHORIA-004 | Usuários externos (solicitantes) | Alto |

---

> Última atualização: 2026-06-05
