# Plano: Krakion Desktop — passo 1 (esqueleto)

**Goal:** App desktop (Electron) com visual próprio, rodando 100% local, que vira a ferramenta principal do implantador. O passo 1 entrega só o esqueleto: janela que sobe o backend sozinha, login, layout de 3 colunas com os 9 módulos (ainda vazios) e tema claro/escuro. Os módulos são redesenhados depois, um por vez.

**Architecture:** pasta nova `desktop/` no repo do Krakion. O app é **autossuficiente e offline**: o processo main do Electron liga um **Postgres embutido** (`embedded-postgres`, PG 18, porta **5433**, dados em `userData/pgdata`), aplica o schema do `backend/prisma/schema.prisma` quando ele muda e inicia o `backend/` existente como processo filho (porta **3101**, `DATABASE_URL` do banco embutido, `JWT_SECRET` gerado por instalação em `userData`). Tudo fecha junto com o app. Na primeira abertura não há usuário: a tela de setup cria uma **conta local** já ativa e admin (rota nova liberada só com `KRAKION_DESKTOP=1` e banco sem usuários). "Entrar com conta Krakion" (sync com a VPS) fica visível mas desabilitado — fase futura. O renderer é um React novo (Vite, porta **5174**) que fala com o backend por `/api` via proxy do Vite — mesma origem, então o CORS allowlist do backend não muda. Sem `PROXY_URL` no `.env` local, as chamadas Betha saem direto do IP do PC (sem túnel). Dados: mesmo schema da VPS — sincronização fica para uma fase futura.

**Tech Stack:** Electron + Vite 5 + React 18 + React Router 6 (HashRouter, compatível com `file://` no build futuro) + Tailwind 3 (`darkMode: 'class'`) + Zustand 4 + Axios. Testes: `node --test` (mesmo runner do backend).

**Decisões fechadas no brainstorming**
- Visual novo, inspirado no app de chat do vídeo (não é cópia do Krakion web).
- Menu: **Ferramentas** → Extensões (= Scripts), Analisador JSON, Checagem, Conhecimento, Notas, Sandbox, Histórico. **Configurações** → Sistemas, Central de Tokens.
- Tema claro e escuro com alternância (Claro / Escuro / Sistema).
- Local agora, sincroniza depois.

**Fora do escopo (YAGNI):** instalador `.exe`, chat com Claude Code, conteúdo dos módulos, sincronização com a VPS, auto-update.

---

## Tasks

### Task 1: Scaffold do `desktop/`

**Files:** `desktop/package.json`, `desktop/.gitignore`

- `"main": "electron/main.js"`, `"type": "module"` (tudo ESM — `embedded-postgres` é ESM-only).
- deps: `react`, `react-dom`, `react-router-dom`, `zustand`, `axios`.
- deps: `embedded-postgres`.
- devDeps: `electron`, `vite`, `@vitejs/plugin-react`, `tailwindcss@3`, `postcss`, `autoprefixer`, `concurrently`.
- scripts:
  - `"dev": "concurrently -k -n vite,app \"vite\" \"electron .\""`
  - `"test": "node --test \"electron/**/*.test.js\" \"src/**/*.test.js\""`
- `.gitignore`: `node_modules`, `dist`.

### Task 2: `aguardarUrl` — espera um servidor responder (TDD)

**Files:** `desktop/electron/aguardarUrl.js`, `desktop/electron/aguardarUrl.test.cjs`

Testes (servidor `http` efêmero em porta 0):
1. resolve `true` quando a URL responde 200;
2. resolve `true` quando o servidor só sobe depois de ~300 ms (faz retry);
3. resolve `false` ao estourar `timeoutMs` sem resposta.

```js
// aguardarUrl(url, { timeoutMs = 30000, intervaloMs = 250 }) → Promise<boolean>
// Faz GET repetido (http.get nativo, sem dependência) até status < 500 ou timeout.
```

### Task 3a: `bancoLocal` — Postgres embutido

**Files:** `desktop/electron/bancoLocal.js`, `desktop/electron/schemaHash.js`, `desktop/electron/schemaHash.test.js`

- `iniciar(userData)`: `EmbeddedPostgres({ databaseDir: userData/pgdata, port: 5433, user: 'krakion', password: <gerada e guardada em userData/local.json>, persistent: true })`; `initialise()` só se a pasta não existe; `start()`; `createDatabase('krakion')` na 1ª vez.
- Schema: se `sha256(schema.prisma)` ≠ hash salvo em `userData/local.json` → `prisma db push --skip-generate` (sem `--accept-data-loss`; erro aparece na tela de carregamento) e salva o hash.
- `parar()`: `stop()`.
- TDD em `schemaHash.js` (`precisaAplicarSchema(hashAtual, hashSalvo)` + `hashArquivo`).

### Task 3b: `backendLocal` — sobe e derruba o backend

**Files:** `desktop/electron/backendLocal.js`

```js
// iniciar({ databaseUrl, jwtSecret }): spawn('node', ['src/index.js'])
//   cwd = <repo>/backend, env = { ...process.env, PORT: '3101', DATABASE_URL, JWT_SECRET,
//   KRAKION_DESKTOP: '1' }. Env explícita vence o backend/.env (dotenv não sobrescreve).
//   Logs do filho → console do main com prefixo [backend].
// parar(): mata o processo filho.
```
Usa `node` do PATH (o Node do Electron não tem o client do Prisma compilado para ele). No instalador futuro, o Node vai empacotado.

### Task 3c: Rota de conta local (backend)

**Files:** `backend/src/routes/auth.js`

- `GET /api/auth/setup-local` → `{ disponivel: bool }` — `true` só se `KRAKION_DESKTOP === '1'` e `usuario.count() === 0`.
- `POST /api/auth/setup-local { nome, login, senha }` → mesmas condições (senão 404); senha ≥ 8; cria usuário `role: 'admin', ativo: true` e devolve o mesmo payload do `/login` (token + usuário).
- Em produção (VPS) a env não existe → rota responde 404, sem efeito.

### Task 4: Processo main do Electron

**Files:** `desktop/electron/main.js`, `desktop/electron/carregando.html`

1. `app.whenReady` → janela 1280×800 (mín. 960×600) mostrando `carregando.html` ("Iniciando Krakion…", respeita tema do sistema).
2. `bancoLocal.iniciar()` (mensagem "Preparando banco…") → `backendLocal.iniciar()` → `aguardarUrl('http://localhost:3101/api/health')`; em dev também `aguardarUrl('http://localhost:5174')`.
3. Sucesso → `loadURL('http://localhost:5174')`. Falha → `carregando.html` mostra erro + dica ("Postgres local está rodando?").
4. `before-quit` → `backendLocal.parar()` e `bancoLocal.parar()` (nessa ordem).
5. Segurança: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`; links externos abrem no navegador (`setWindowOpenHandler` → `shell.openExternal`).

### Task 5: Vite + Tailwind do renderer

**Files:** `desktop/index.html`, `desktop/vite.config.js`, `desktop/tailwind.config.js`, `desktop/postcss.config.js`, `desktop/src/main.jsx`, `desktop/src/index.css`

- Vite: `server.port 5174`, `strictPort: true`, `proxy: { '/api': 'http://localhost:3101' }`.
- Tailwind: `darkMode: 'class'`; cores via CSS vars (`--bg`, `--painel`, `--borda`, `--texto`, `--texto-suave`, `--acento`) definidas em `:root` e `.dark` no `index.css`, para o tema trocar sem duplicar classes.
  - Claro: fundo `#ffffff`, painel `#f7f7f8`, acento `#4f46e5`.
  - Escuro: fundo `#111318`, painel `#1a1d24`, acento `#8b5cf6`.

### Task 6: Tema claro/escuro/sistema (TDD)

**Files:** `desktop/src/lib/tema.js`, `desktop/src/lib/tema.test.js`, `desktop/src/stores/temaStore.js`

Testes de `resolverTema(preferencia, sistemaEscuro)`:
- `('claro', true) → 'claro'`, `('escuro', false) → 'escuro'`
- `('sistema', true) → 'escuro'`, `('sistema', false) → 'claro'`
- valor desconhecido → trata como `'sistema'`

Store Zustand persist (key `krakion-desktop-tema`, default `'sistema'`); aplica/remove classe `dark` no `<html>` e escuta `matchMedia('(prefers-color-scheme: dark)')`.

### Task 7: Auth + API

**Files:** `desktop/src/lib/api.js`, `desktop/src/stores/authStore.js`, `desktop/src/pages/Login.jsx`

- Axios `baseURL: '/api'`, interceptor Bearer, 401 → logout.
- Store persist key `krakion-desktop-auth` (separada do web).
- Login: `POST /api/auth/login { login, senha, lembrar: true }` (sem hCaptcha — o backend só valida captcha se o token vier). Tela centralizada com logo, segue o tema.
- Se `GET /api/auth/setup-local` → `disponivel: true`, a tela vira **Primeira abertura**: "Criar conta local" (nome, login, senha) + botão "Entrar com conta Krakion" desabilitado com selo "em breve".

### Task 8: Layout de 3 colunas + módulos placeholder

**Files:** `desktop/src/modulos.js`, `desktop/src/components/Rail.jsx`, `desktop/src/components/PainelLista.jsx`, `desktop/src/components/Layout.jsx`, `desktop/src/pages/EmConstrucao.jsx`, `desktop/src/App.jsx`, `desktop/public/` (logo/favicon copiados do frontend)

- `modulos.js` = fonte única do menu: `[{ grupo: 'ferramentas', titulo: 'Ferramentas', icone, itens: [{ id: 'extensoes', rotulo: 'Extensões', rota: '/extensoes', icone }, …] }, { grupo: 'configuracoes', … }]`.
- **Rail** (56 px): logo no topo, um ícone por grupo, no rodapé alternador de tema + avatar (menu com Sair).
- **PainelLista** (~260 px): título do grupo + itens; item ativo com fundo suave e acento.
- **Conteúdo**: `<Outlet/>`; cada rota mostra `EmConstrucao` com o nome do módulo.
- `HashRouter`: `/login` público; resto atrás de guarda de auth; `/` redireciona para `/extensoes`.

### Task 9: Verificação + docs

**Files:** `CLAUDE.md`, `docs/desktop.md`

1. `cd desktop && npm test` → todos passam.
2. `npm run dev` → janela abre, backend sobe na 3101, login funciona, navega pelos 9 módulos, tema alterna e persiste, primeira abertura cria conta local, fechar o app derruba backend e banco (portas 3101 e 5433 livres).
3. Documentar em `docs/desktop.md` (como rodar, arquitetura, portas) e registrar a pasta `desktop/` na árvore do `CLAUDE.md`.
4. Commit: `feat(desktop): esqueleto do app Electron com backend local, login e tema`.
