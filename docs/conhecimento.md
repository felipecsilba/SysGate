# Módulo Conhecimento

Base de conhecimento colaborativa para implantadores Betha. Centraliza FAQs, correções de erros, tutoriais passo a passo e dicas, organizados por vertical e sistema.

**Rota:** `/conhecimento` | **Sidebar:** Ferramentas → Conhecimento

---

## Visão Geral

Todos os usuários autenticados podem **criar** artigos. O próprio autor ou um admin pode **editar**. Somente admins podem **excluir**. Dados globais — todos os usuários veem todos os artigos.

---

## Modelo do banco

### `Conhecimento`

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| id | Int | autoincrement | PK |
| titulo | String | — | Título do artigo (obrigatório) |
| tipo | String | `"faq"` | `faq` \| `erro` \| `passo-a-passo` \| `dica` \| `outro` |
| descricao | String? | null | Resumo curto exibido nos cards da lista |
| conteudo | String | `""` | Conteúdo principal (tipos FAQ, Erro, Dica, Outro) |
| passos | String | `"[]"` | JSON serializado: `[{texto: string}]` — somente tipo `passo-a-passo` |
| vertical | String? | null | Nome da vertical (referência ao `CatalogoVertical`) |
| sistemaId | Int? | null | FK → `Sistema` (onDelete: SetNull) |
| etiquetas | String | `"[]"` | JSON serializado: `string[]` |
| autorId | Int | — | FK → `Usuario` (autor do artigo) |
| criadoEm | DateTime | now() | — |
| atualizadoEm | DateTime | updatedAt | — |

**Índices:** `[tipo]`, `[vertical]`, `[sistemaId]`, `[autorId]`

**Notas de serialização:** `passos` e `etiquetas` são armazenados como `JSON.stringify(array)` no SQLite. Helper `parseConhecimento(c)` no backend faz `JSON.parse` antes de retornar.

---

## API utilizada

Base: `/api/conhecimento` — todas as rotas exigem token JWT.

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/api/conhecimento` | Todos autenticados | Lista com paginação; filtros: `busca`, `tipo`, `vertical`, `sistemaId`, `pagina`, `limite` |
| GET | `/api/conhecimento/:id` | Todos autenticados | Detalhe completo com `autor` e `sistema` |
| POST | `/api/conhecimento` | Todos autenticados | Cria artigo (`autorId = req.usuario.id`) |
| PUT | `/api/conhecimento/:id` | Autor ou admin | Atualiza campos |
| DELETE | `/api/conhecimento/:id` | Somente admin | Remove artigo |

```js
conhecimentoApi.listar({ busca?, tipo?, vertical?, sistemaId?, pagina?, limite? })
// retorna { data, total, pagina, limite, totalPaginas }

conhecimentoApi.obter(id)
conhecimentoApi.criar({ titulo, tipo, descricao?, conteudo, passos, vertical?, sistemaId?, etiquetas })
conhecimentoApi.atualizar(id, data)
conhecimentoApi.deletar(id)  // somente admin
```

---

## Tipos de artigo

| Tipo | Label | Cor |
|------|-------|-----|
| `faq` | FAQ | Azul (`bg-blue-100 text-blue-700`) |
| `erro` | Erro | Vermelho (`bg-red-100 text-red-700`) |
| `passo-a-passo` | Passo a Passo | Verde (`bg-green-100 text-green-700`) |
| `dica` | Dica | Âmbar (`bg-amber-100 text-amber-700`) |
| `outro` | Outro | Cinza (`bg-gray-100 text-gray-600`) |

---

## Componentes

### `Conhecimento/index.jsx`

Componente principal. Layout dois painéis: lista esquerda (`w-80`) + detalhe direito (`flex-1`).

**Estado React:**

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `artigos` | `Conhecimento[]` | Lista paginada |
| `selecionado` | `Conhecimento \| null` | Artigo com painel de detalhe aberto |
| `carregando` | boolean | Spinner durante fetch |
| `total` | number | Total de resultados (paginação) |
| `pagina` | number | Página atual |
| `buscaInput` | string | Valor do input (exibição imediata) |
| `busca` | string | Valor debounced 400ms enviado à API |
| `filtroTipo` | string | Filtro de tipo |
| `filtroVertical` | string | Filtro de vertical |
| `filtroSistema` | string | ID do sistema filtrado |
| `showModal` | boolean | Modal de criar/editar visível |
| `editando` | `Conhecimento \| null` | Artigo em edição; null = criação |
| `confirmDeletar` | `Conhecimento \| null` | Artigo aguardando confirmação de exclusão |
| `catalogo` | array | Verticais do `CatalogoVertical` |
| `sistemas` | array | Sistemas do modelo `Sistema` |

**Painel de detalhe:** exibe tipo passo-a-passo como lista numerada (etapas com círculos `sysgate-600`). Demais tipos exibem `conteudo` com `whitespace-pre-wrap`. Botões Editar/Excluir visíveis conforme permissão (autor ou admin).

### `Conhecimento/ModalConhecimento.jsx`

Modal de criação/edição. Props: `artigo` (null = novo), `catalogo`, `sistemas`, `onSaved`, `onClose`.

**Campos:**
- Título (obrigatório)
- Tipo (chips clicáveis com cores)
- Descrição curta (opcional)
- Vertical (select do CatalogoVertical) + Sistema (select do modelo Sistema)
- Conteúdo (textarea para FAQ/Erro/Dica/Outro) ou Editor de Etapas (lista de textareas numerados para passo-a-passo)
- Etiquetas (input com Enter/vírgula para confirmar, chips removíveis)

**Conversão de tipo:** ao mudar de `passo-a-passo` → outro tipo, os passos são unidos em `conteudo` por `\n`. Ao mudar de outro tipo → `passo-a-passo`, o `conteudo` é dividido por linhas em passos.

**`TIPO_CONFIG`** exportado de `index.jsx` — mapa `tipo → { label, cls }` usado em ambos os componentes.

---

## Permissões

| Ação | Quem pode |
|------|-----------|
| Visualizar | Todos os autenticados |
| Criar | Todos os autenticados |
| Editar | Autor do artigo **ou** admin |
| Excluir | Somente admin |

---

## Comportamentos importantes

- **Dados globais:** sem isolamento por usuário — todos veem todos os artigos. Diferente de `Municipios` e `Notas`.
- **`passos` só para `passo-a-passo`:** ao salvar outro tipo, `passos` é sempre `[]`. Ao salvar `passo-a-passo`, `conteudo` é sempre `""`.
- **`sistemaId` FK real:** diferente de `Chamado.sistema` (texto livre), aqui `sistemaId` é FK para o modelo `Sistema`. Se o sistema for deletado, o campo vira `null` (`onDelete: SetNull`).
- **Busca textual:** `GET /api/conhecimento?busca=` aplica `contains` em `titulo`, `descricao` e `conteudo`.
- **Paginação:** 20 artigos por página. Controles ← → aparecem quando há mais de uma página.
- **Debounce:** campo de busca aplica debounce de 400ms (mesmo padrão do módulo Chamados).

---

## Deploy

Inclui mudança de schema — ao fazer deploy, `npx prisma db push` cria a tabela `Conhecimento` no banco de produção.
