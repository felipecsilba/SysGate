# Krakion App — arquitetura, interface e janela

Parte da documentação do Krakion App. Índice e "Retomar aqui": `docs/desktop.md`.

## Como funciona

```
Electron main (electron/main.js)
 ├─ bancoLocal.js   initdb (1ª vez) → pg_ctl start (porta 5433, só 127.0.0.1)
 │                  → CREATE DATABASE krakion (1ª vez) → prisma db push se o schema.prisma mudou
 ├─ backendLocal.js node backend/src/index.js  (PORT=3101, DATABASE_URL, JWT_SECRET, KRAKION_DESKTOP=1)
 └─ janela          carregando.html → aguarda /api/health → http://localhost:5174 (dev) | app://krakion (atalho)
Renderer (src/)     React + HashRouter; /api → proxy do Vite (dev) ou protocolo app:// (atalho) → 3101
                    — sempre mesma origem, CORS do backend intocado
```

| Porta | Serviço |
|-------|---------|
| 5174  | Vite (renderer, só em dev) |
| 3101  | backend local |
| 5433  | Postgres embutido |

As portas não colidem com o Krakion web em dev (3000/3001) nem com um Postgres instalado (5432). Para testar uma segunda instância com o app aberto: `KRAKION_DADOS=<pasta> KRAKION_PORTA_BACKEND=3111 KRAKION_PORTA_BANCO=5443` (só no modo atalho — o proxy do Vite aponta fixo para 3101).

Backend e banco escutam **só em `127.0.0.1`** (backend via env `HOST`, que o `backend/src/index.js` respeita; sem `HOST`, como na VPS, segue escutando em todas as interfaces). Sem isso, qualquer máquina da rede local alcançaria a API — inclusive o `setup-local` de uma instalação recém-aberta. Para conferir portas no Windows use `netstat -ano`: tentar ocupar `127.0.0.1:3101` dá falso "livre" quando o processo escuta em `0.0.0.0`.

### Dados por instalação — `%APPDATA%\Krakion Desktop\`

| Arquivo | Conteúdo |
|---------|----------|
| `pgdata/` | cluster Postgres 18 (UTF-8, locale `builtin C.UTF-8` — `ILIKE`/`lower` funcionam com acento) |
| `local.json` | senha do Postgres, `JWT_SECRET` (gerados na 1ª abertura) e `schemaHash` |
| `postgres.log` | log do servidor |
| `krakion.log` | log do app (main + backend + banco) quando aberto pelo atalho |

### Banco embutido — decisões

- Do pacote `embedded-postgres` usamos **só os binários** (`@embedded-postgres/<so>-<arch>` exporta `initdb`/`pg_ctl`). O `stop()` da biblioteca no Windows faz `taskkill /f` (sem desligamento limpo) e o gancho de saída dela quebra no Electron (`done is not a function`).
- Liga/desliga com `pg_ctl start/stop --mode=fast`. Se o app morrer, o Postgres continua rodando e é **reaproveitado** na próxima abertura (`pg_ctl status`).
- Schema: `prisma db push` só quando o `sha256` do `schema.prisma` muda. Sem `--accept-data-loss` — mudança destrutiva aparece como erro na tela de carregamento.

### Conta local

Na primeira abertura não há usuário: `GET /api/auth/setup-local` → `{ disponivel: true }` e a tela de entrada vira "Criar conta local". `POST /api/auth/setup-local` cria o usuário **admin e ativo** e devolve o token. Só funciona com `KRAKION_DESKTOP=1` (definido pelo app, nunca na VPS) **e** banco sem usuários — fora disso responde 404. Regra em `backend/src/lib/setupLocal.js` (testada).

"Entrar com conta Krakion" (sincronizar com a VPS) aparece desabilitado — fase futura.

## Componentes compartilhados

`Pagina` (moldura), `Modal`, `Confirmar` (ação destrutiva, aceita async), `Busca`, `CaixaBusca` (substitui o `<select>`), `Abas` (pílulas com contador), `BotaoIcone`, `MetodoBadge` (cor por método HTTP), `JsonColorido`, `Codigo` (em `pages/Biblioteca/Visualizador.jsx` — código com régua e realce, também usado pelo Gerador), `LimiteErro` (erro num módulo mostra a mensagem em vez de tela em branco; o `Layout` reseta ao trocar de rota), `Icone`. Helpers: `lib/texto.js` (`normalizar`, `contem` — busca sem acento), `lib/endpoints.js` (`agruparPorModulo`, `avisoUrlBase`), `lib/codigo.js` (`highlightCode` com palavras extras — `BFC_SCRIPT` —, `highlightXml`; ambos escapam antes de pintar), `lib/json.js` (`colorirJson`).

## Interface

- Layout 3 colunas: **Rail** (grupos + tema + avatar) → **PainelLista** (itens do grupo) → conteúdo.
- Menu vem de `src/modulos.js` (fonte única): Ferramentas → Analisador JSON, Checagem, Conhecimento, Notas, Histórico; API, Municípios, Biblioteca e Gerador de Extensões (ícone próprio cada); Configurações → Sistemas, Central de Tokens, Betha Admin, Importar dados. Módulo sem página em `PAGINAS` (`App.jsx`) mostra `EmConstrucao` — hoje: nenhum.
- Padrão dos módulos de conteúdo (Histórico, Notas, Conhecimento): lista `w-80` à esquerda (busca + filtros no topo) e detalhe/editor à direita, no mesmo cartão da `Pagina`; ação principal ("Nova nota", "Novo artigo") verde sólido nas `acoes` do cabeçalho; seleção da lista neutra (`bg-texto/[0.07]`); cor só como ponto pequeno.
- **Tema sem piscar**: a preferência também fica em `<userData>/preferencias.json` (o renderer avisa via `window.krakion.tema.definir` → IPC `tema:definir`). Antes de abrir a janela o main aplica `nativeTheme.themeSource` (`electron/preferencias.js`, testado) — assim o `prefers-color-scheme` de todas as páginas, inclusive `carregando.html`, já segue o app; e um script no `<head>` do `index.html` põe a classe `dark` antes do React carregar. Na 1ª abertura depois de atualizar, o arquivo ainda não existe (pisca uma vez); daí em diante nasce no tema certo.
- Tema: tokens RGB em CSS vars (`src/index.css`, `:root` e `.dark`) mapeados no Tailwind (`bg-fundo`, `text-suave`, `bg-acento`…). Preferência `sistema → claro → escuro` em `localStorage` (`krakion-desktop-tema`); sessão em `krakion-desktop-auth`.
- Sem fontes nem ícones externos (offline): Segoe UI + SVG inline em `components/Icone.jsx`.
- **Visual sóbrio (pedido do Felipe, 2026-10-18)**: acento = índigo Krakion (`99 102 241` no escuro), nunca violeta/fúcsia neon nem degradê. Botões **sólidos** (cor cheia + texto branco) ou neutros (`.botao-secundario` = `bg-texto/[0.07]` + borda `texto/15`); **evitar pílula translúcida** (fundo colorido transparente + borda e texto coloridos) — ele chamou de "cara de feito por IA". Verde sólido (`emerald-600`) = criar/salvar; índigo = Executar; neutro = ações que só regravam.
- **`components/CaixaBusca.jsx`** substitui `<select>` nativo (que no Windows fica quadrado e sem tema): lista num portal `position: fixed`, abre para cima quando falta espaço, `buscavel` (filtro sem acento) e `compacta`. Usada em todo o app (nenhum `<select>` nativo restante): seletor Módulo → Recurso, valores enum/booleanos do body, mapeamento do lote, ModalToken, ModalEndpoint, ModalRenovacao e filtros do Histórico. Esc com a lista aberta fecha só a lista (não o Modal).

## Janela sem moldura

- `frame: false` — sem a barra de título e os botões do Windows.
- **Cantos de 16px**: o arredondamento nativo do Windows 11 é fixo em 8px, então a janela é `transparent: true` e o CSS desenha a janela no `#root` (`html.electron` em `index.css`: raio 16px + contorno fino via `::after`, porque janela transparente não tem sombra nativa). `thickFrame: false` é obrigatório: com ele ligado o Windows ainda aplica a moldura de 8px por cima e sobra um anel opaco entre os dois recortes (medido pixel a pixel).
- Maximizada → `html.maximizada` → cantos retos e sem contorno (senão sobram "buracos" nas bordas da tela). O main avisa em `maximize`/`unmaximize` **e** a cada `resize` (rede de segurança).
- Verificado na janela real: redimensionar arrastando a borda funciona; maximizar ocupa exatamente a área útil (não cobre a barra de tarefas). Custo aceito: sem sombra nativa e sem as animações de minimizar/maximizar do Windows.
- Controles próprios em `src/components/ControlesJanela.jsx` (minimizar / maximizar↔restaurar / fechar, hover vermelho no X). Falam com o main por `electron/preload.cjs` → `window.krakion.janela`. O preload expõe só pontes específicas — `janela`, `tema`, `app` (versão nova), `betha` (agente de tokens), `biblioteca`, `gerador` e `municipios` — nunca Node, arquivos soltos ou IPC genérico; todo caminho que chega ao main passa por um `resolver…` que barra o que estiver fora da pasta permitida. Preload é `.cjs` porque preload em sandbox não aceita ESM.
- Arrastar: classe `.arrastar` (`-webkit-app-region: drag`) no topo do Rail, no cabeçalho do PainelLista e no cabeçalho de cada página; botões/inputs dentro dela ficam `no-drag` automaticamente (`index.css`). Dois cliques na área maximizam.
- `src/components/Pagina.jsx` é a moldura de todo módulo: cabeçalho arrastável (ícone + título + `acoes` + controles da janela) e conteúdo num cartão `rounded-2xl` com borda, afastado das bordas.
- `carregando.html` também é arrastável, tem um X próprio (importante quando mostra erro) e desenha os mesmos cantos de 16px.
- Estilo estrutural inspirado no app de referência: Rail e PainelLista com o mesmo fundo do conteúdo, separados por linha fina; item ativo neutro (`bg-texto/[0.06]` — faixa inteira na lista, quadrado arredondado no Rail); avatar neutro. O violeta (`acento`) fica para detalhes (foco, selos).

## Modo dev × modo atalho

- `KRAKION_DEV=1` (definido por `electron/abrir.js`, usado no `npm run dev`) → interface pelo Vite com hot reload.
- Sem ela (atalho) → `electron/protocolo.js` registra `app://krakion`: serve `dist/` (com proteção contra path traversal) e repassa `/api/*` para `127.0.0.1:3101` via `net.fetch`. Abrir `dist/` como `file://` não serve: `/api` viraria `file:///api` e o CORS do backend recusaria a origem `null`.
- `app.setAppUserModelId` + ícone da janela → a barra de tarefas mostra o Krakion, não o Electron.
