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
| conteudo | String | `"[]"` | JSON serializado: `[{tipo, valor}]` — array de blocos; retrocompatível com texto plano |
| passos | String | `"[]"` | JSON serializado: `[{texto: string}]` onde `texto` é JSON de blocos — somente tipo `passo-a-passo` |
| vertical | String? | null | Nome da vertical (referência ao `CatalogoVertical`) |
| sistema | String? | null | Nome do sistema Betha (referência a `CatalogoVertical.sistemas`) |
| etiquetas | String | `"[]"` | JSON serializado: `string[]` |
| autorId | Int | — | FK → `Usuario` (autor do artigo) |
| criadoEm | DateTime | now() | — |
| atualizadoEm | DateTime | updatedAt | — |

**Índices:** `[tipo]`, `[vertical]`, `[sistema]`, `[autorId]`

**Notas de serialização:** `passos`, `etiquetas` e o conteúdo de cada bloco são armazenados como `JSON.stringify(array)` no SQLite. Helper `parseConhecimento(c)` no backend faz `JSON.parse` antes de retornar. No frontend, `parseConteudo(str)` em `constants.js` converte qualquer string (JSON de blocos ou texto plano) para array de blocos.

**Formato de bloco:**
```js
{ tipo: 'texto' | 'subtitulo' | 'codigo' | 'nota', valor: string }
```
- `texto` — parágrafo comum
- `subtitulo` — rótulo em negrito (ex: "1° Serviço")
- `codigo` — bloco escuro monospace com syntax highlight estilo VS Code Dark+ (`background: #1e1e1e`); keywords azul, strings salmão, números verde claro, comentários verde suave, funções amarelo; texto padrão `#d4d4d4`; renderizado via `highlightCode()` em `index.jsx` com `dangerouslySetInnerHTML`
- `nota` — itálico com barra lateral cinza

---

## API utilizada

Base: `/api/conhecimento` — todas as rotas exigem token JWT.

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/api/conhecimento` | Todos autenticados | Lista com paginação; filtros: `busca`, `tipo`, `vertical`, `sistema`, `pagina`, `limite` |
| GET | `/api/conhecimento/:id` | Todos autenticados | Detalhe completo com `autor` |
| POST | `/api/conhecimento` | Todos autenticados | Cria artigo (`autorId = req.usuario.id`) |
| PUT | `/api/conhecimento/:id` | Autor ou admin | Atualiza campos |
| DELETE | `/api/conhecimento/:id` | Somente admin | Remove artigo |

```js
conhecimentoApi.listar({ busca?, tipo?, vertical?, sistema?, pagina?, limite? })
// retorna { data, total, pagina, limite, totalPaginas }

conhecimentoApi.obter(id)
conhecimentoApi.criar({ titulo, tipo, descricao?, conteudo, passos, vertical?, sistema?, etiquetas })
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

Componente principal. Layout dois painéis: lista esquerda (`w-80`, `bg-gray-50/70`) + detalhe direito (`flex-1`, `bg-white`).

**`ArtigoCard`:** cartão individual com `rounded-xl`, margem lateral (`px-2 pb-1.5`), `shadow-sm` e `border`. Estrutura interna: linha 1 = badge de tipo + tempo relativo (direita); linha 2 = título (`font-semibold`, `line-clamp-2`); linha 3 = chips de vertical/sistema (opcional, só aparece se preenchidos). Ativo: `bg-sysgate-50 border-sysgate-200`. Inativo: `bg-white border-gray-100 hover:shadow hover:border-gray-200`.

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
| `filtroSistema` | string | Nome do sistema filtrado |
| `showModal` | boolean | Modal de criar/editar visível |
| `editando` | `Conhecimento \| null` | Artigo em edição; null = criação |
| `confirmDeletar` | `Conhecimento \| null` | Artigo aguardando confirmação de exclusão |
| `catalogo` | array | Verticais do `CatalogoVertical` (usadas tanto para o filtro de vertical quanto para derivar sistemas) |

**Painel de detalhe (`PainelDetalhe` + `RenderBlocos`):** usa `RenderBlocos` para renderizar blocos de qualquer tipo. Passo-a-passo exibe lista numerada com círculos `sysgate-600`; cada passo também usa `RenderBlocos` para renderizar seus blocos internos. Botões Editar/Excluir visíveis conforme permissão (autor ou admin).

### `Conhecimento/constants.js`

Exporta:
- `TIPO_CONFIG` — mapa `tipo → { label, cls }`
- `TIPO_OPTS` — array para selects/chips
- `parseConteudo(str)` — converte string (JSON de blocos ou texto plano) para array de blocos; retrocompatível

Extraído em arquivo separado para evitar dependência circular entre `index.jsx` e `ModalConhecimento.jsx`.

### `Conhecimento/ModalConhecimento.jsx`

Modal de criação/edição. Props: `artigo` (null = novo), `catalogo`, `onSaved`, `onClose`.

**Editor de blocos (`BlocoEditorList`):** substitui os textareas simples de conteúdo. Componentes internos:
- `BlocoItem` — renderiza o editor de um bloco (textarea, input bold, dark code block, itálico) com ações hover (↑ ↓ ✕)
- `AddBlocoMenu` — botão "+ Adicionar bloco" com dropdown dos 4 tipos

**Campos:**
- Título (obrigatório)
- Tipo (chips clicáveis com cores)
- Descrição curta (opcional)
- Vertical (select do CatalogoVertical) + Sistema (select filtrado pelos sistemas da vertical escolhida via `CatalogoVertical.sistemas`)
- Conteúdo — `BlocoEditorList` para FAQ/Erro/Dica/Outro; lista de passos (cada passo com `BlocoEditorList` interno) para passo-a-passo
- Etiquetas (input com Enter/vírgula para confirmar, chips removíveis)

**Filtragem de sistemas:** ao selecionar uma vertical, o dropdown de sistemas mostra apenas os sistemas daquela vertical. Sem vertical selecionada, exibe todos. Ao trocar vertical, sistema é resetado se não pertencer à nova lista.

**Conversão de tipo:** ao mudar de `passo-a-passo` → outro tipo, textos dos blocos de texto dos passos viram blocos de texto no `BlocoEditorList`. Ao mudar para `passo-a-passo`, os blocos de texto existentes viram passos individuais.

**Serialização ao salvar:**
- `conteudo = JSON.stringify(blocos)` (não passo-a-passo)
- `passos = [{ texto: JSON.stringify(passo.blocos) }]` (passo-a-passo)

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
- **`passos` só para `passo-a-passo`:** ao salvar outro tipo, `passos` é sempre `[]`. Ao salvar `passo-a-passo`, `conteudo` é sempre `'[]'`.
- **Blocos ricos:** tanto `conteudo` quanto `passos[].texto` armazenam JSON de blocos. O bloco `codigo` exibe fundo escuro (`#1e1e1e`) com syntax highlight estilo VS Code Dark+ via `highlightCode()` em `index.jsx`. `parseConteudo` garante retrocompatibilidade com artigos antigos (texto plano).
- **`sistema` como texto (igual a Chamados):** `Conhecimento.sistema String?` armazena o nome do produto Betha (ex: `"Tributação e Receitas"`), populado a partir de `CatalogoVertical.sistemas`. Não é FK para o modelo `Sistema` (sandbox de endpoints). O dropdown no modal filtra os sistemas pela vertical selecionada.
- **Busca textual:** `GET /api/conhecimento?busca=` aplica `contains` em `titulo`, `descricao` e `conteudo`.
- **Paginação:** 20 artigos por página. Controles ← → aparecem quando há mais de uma página.
- **Debounce:** campo de busca aplica debounce de 400ms (mesmo padrão do módulo Chamados).

---

## Deploy

Inclui mudança de schema — ao fazer deploy, `npx prisma db push` cria a tabela `Conhecimento` no banco de produção.
