# Frontend — React + Vite + Tailwind + Zustand

## Stack e configuração

| Tool        | Config                                                    |
|-------------|-----------------------------------------------------------|
| Vite        | Porta 3000, proxy `/api` → `http://localhost:3001`        |
| Tailwind    | Paleta customizada `sysgate` (azuis institucionais)         |
| Zustand     | Store com `persist` middleware (localStorage)              |
| React Router| 5 rotas dentro de `<Layout>` como Outlet                  |

## Rotas

| Path           | Componente  | Descrição                          |
|----------------|-------------|------------------------------------|
| `/`            | Dashboard   | Resumo, atalhos, últimas requests  |
| `/municipios`  | Municipios  | CRUD com tabela e modal            |
| `/cliente-api` | ClienteAPI  | Executor de APIs com body editor   |
| `/envio-lote`  | EnvioLote   | Upload CSV e envio em massa        |
| `/scripts`     | Scripts     | CRUD scripts com categorias e tags |

## Componentes compartilhados

### Layout.jsx
- Sidebar fixa à esquerda (240px)
- Header com `MunicipioBadge`
- Main scrollável com `<Outlet />`

### Sidebar.jsx
- NavLinks com ícones e estado ativo (cor sysgate)
- Links: Dashboard, Municípios, Cliente API, Envio em Lote, Scripts

### MunicipioBadge.jsx
- Mostra o município ativo no header
- Badge vermelho de alerta quando `ambiente === 'producao'`
- Botão para ir ao Gerenciador de Municípios se nenhum ativo

### SwaggerImport.jsx
- **Modal fullscreen** com 2 abas: Importar / Specs salvas
- **Modo URL** (recomendado):
  - Campo URL + nome amigável + headers extras
  - Botões: Pré-visualizar / Importar para o banco
  - Dica sobre colar URL do `/docs` (detecção automática de HTML)
- **Modo arquivo**: Upload de `.json`/`.yaml`, textarea editável
- **Specs salvas**: Lista specs importadas + botão "Limpar tudo"
- **PreviewEndpoints**: Sub-componente que mostra endpoints agrupados por módulo com badges de método coloridos

## Páginas

### Dashboard.jsx
- Card do município ativo (nome, ambiente, urlBase)
- 4 atalhos para módulos (cards clicáveis)
- Tabela das últimas 5 requisições

### Municipios.jsx
- Tabela com colunas: nome, código IBGE, ambiente, status
- Modal CRUD com campos: nome, codigoIBGE, urlBase, token (toggle visibilidade), ambiente, observações
- Botão "Ativar" que desativa os demais
- Badge vermelho para produção, verde para homologação

### ClienteAPI.jsx
**Página principal de trabalho.** Layout 2 colunas (lg:grid-cols-2).

**Painel esquerdo:**
1. **Município** — select do município
2. **Endpoint** — selectors de módulo + endpoint (mostra `[METODO] nome`)
3. **Requisição** — botões coloridos de método (GET azul, POST verde, PUT amarelo, PATCH laranja, DELETE vermelho) + campo path + preview da URL completa
4. **Body** — toggle Schema/JSON raw:
   - **Schema**: checkboxes dos campos com tipo e valor
   - **JSON raw**: textarea auto-resize com o exemplo da spec pré-preenchido
   - Auto-seleciona raw quando há objetos aninhados
5. **Executar requisição** — botão com spinner

**Painel direito:**
- **Aba Resposta**: status code (badge colorido) + duração + headers + JSON viewer (fundo escuro, `max-h-[60vh]`)
- **Aba Histórico**: últimas 20 requisições com método, status, URL, hora

**Comportamentos inteligentes:**
- Ao selecionar endpoint: preenche método, path e body automaticamente
- Ao trocar método via botão: busca endpoint com mesmo path + novo método e troca (carrega novo bodySchema)
- Body raw pré-preenchido com `_exemplo.json` da spec
- Auto-switch para modo raw quando tem campos `object` ou `array<...>`

### EnvioLote.jsx
- Upload CSV via Papa Parse
- Mapeamento visual: colunas do CSV → campos do JSON (drag & drop)
- Preview da primeira linha mapeada
- Envio sequencial com barra de progresso e log
- Botão abort
- Export CSV do relatório (sucesso/erro por linha)

### Scripts.jsx
- Abas por categoria: SQL, Comando, Fonte, Anotação
- Busca por título e tags
- CRUD com modal (título, conteúdo como textarea, categoria, tags como chips)
- Botão "Copiar" (clipboard)
- Importar/Exportar JSON

## Store: municipioStore.js

```js
// Estado
municipioAtivo: null     // Município com token (persistido em localStorage)
municipios: []           // Lista completa
carregando: false

// Ações
setMunicipioAtivo(m)     // Set direto
carregarMunicipios()     // GET /municipios + GET /municipios/ativo
ativarMunicipio(id)      // PATCH /:id/ativar + recarrega
atualizarMunicipioAtivo()// GET /municipios/ativo → set
```

Persistência: `localStorage` key `sysgate-municipio`, salva apenas `municipioAtivo`.

## API Client: lib/api.js

Axios instance com:
- `baseURL: '/api'` (proxy do Vite redireciona para backend)
- `timeout: 30000`
- Interceptor de erro: extrai `err.response?.data?.error || err.message`

Exports: `municipiosApi`, `endpointsApi`, `proxyApi`, `requisicoesApi`, `scriptsApi`

### Métodos do endpointsApi
```js
listar(modulo?)          // GET /endpoints?modulo=
modulos()                // GET /endpoints/modulos
obter(id)                // GET /endpoints/:id
criar(data)              // POST /endpoints
atualizar(id, data)      // PUT /endpoints/:id
deletar(id)              // DELETE /endpoints/:id
importar(data)           // POST /endpoints/importar
swaggerListar()          // GET /endpoints/swagger
swaggerDeletar(id)       // DELETE /endpoints/swagger/:id
swaggerPreview(nome, spec)      // POST /endpoints/importar-swagger?preview=true
swaggerImportar(nome, spec)     // POST /endpoints/importar-swagger
swaggerFetchUrl(url, nome, h)   // POST /endpoints/fetch-swagger
swaggerFetchUrlPreview(url,n,h) // POST /endpoints/fetch-swagger?preview=true
limparTudo()             // DELETE /endpoints/limpar-tudo
```

## CSS customizado (index.css)

Classes Tailwind com `@apply`:
- `.btn-primary` / `.btn-secondary` / `.btn-ghost` — botões
- `.card` — card com borda, sombra, rounded-xl
- `.input` — input padrão com foco sysgate
- `.badge` / `.badge-green` / `.badge-red` / `.badge-yellow` / `.badge-blue` / `.badge-gray` — badges
- `.label` — label de formulário
- `.code-area` — textarea com fundo escuro, font-mono
- `.scrollbar-thin` — scrollbar fina customizada
- `animate-fadeIn` — animação de entrada
