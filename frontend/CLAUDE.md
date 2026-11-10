# Frontend do Krakion web

React 18 + Vite + Tailwind CSS 3 + Zustand 4 + React Router 6 + Recharts + Papa Parse + Axios.
Porta 3000 em dev, com proxy `/api` → `localhost:3001`. Regras de cada módulo: `docs/<módulo>.md`.
Skill: `frontend`.

```bash
npm install
npm run dev
```

`.env`: `VITE_HCAPTCHA_SITEKEY` (não vai ao git).

## Regras que quebram o build ou a sessão

- **Tailwind safelist obrigatório**: `tailwind.config.js` tem `safelist: [{ pattern: /sysgate/ }]` — sem isso, `@apply bg-sysgate-600` falha no `index.css` porque o JIT não gera a classe antes do `@layer components` ser processado. NÃO remover. A paleta `sysgate` usa índigo/violeta Krakion Labs (sysgate-600 = `#4f46e5`). A paleta NÃO foi renomeada para não quebrar os componentes.
- **Chunks obsoletos após deploy (2026-06-12)**: cada deploy troca os hashes dos chunks do Vite — abas abertas com o bundle antigo quebravam em tela branca ao navegar (React.lazy recebia o index.html do fallback SPA no lugar do JS). Defesa em duas camadas: `main.jsx` escuta `vite:preloadError` e recarrega a página (guard de 10s em sessionStorage); Nginx de produção serve `/assets/` com `try_files $uri =404` + cache imutável e `index.html` com `no-cache`. Ver skill `deploy`.
- **Zustand persist**: município ativo persiste em `localStorage` (key: `krakion-municipio`)
- **localStorage keys**: `krakion-auth` (authStore), `krakion-municipio` (municipioStore), `krakion-portal-auth` (portalAuthStore — sessão do solicitante externo), `krakion-json-viewerDark` (AnalisadorJson)
- **Logout** limpa `krakion-municipio` para isolar sessões no mesmo browser.
- `vite.config.js`: `manualChunks` (recharts, papaparse, react-vendor, app-vendor). Todas as páginas em `React.lazy` + `Suspense` (`App.jsx`).

## Identidade visual — Krakion Labs

Paleta índigo/violeta (estilo Linear) na chave `sysgate`: 600 `#4f46e5` (botões, links, foco),
700 `#4338ca` (hover), 500 `#6366f1` (acentos), 100 `#e0e7ff` (badges), 50 `#eef2ff` (selecionado).
Classes próprias em `index.css`: `.btn`, `.card`, `.input`, `.badge`, `.label`.

- **Logo login**: `frontend/public/nova-logo.webp` — WebP 500px sem fundo, 23 KB
- **Logo dashboards**: `frontend/public/logo-com-nome.webp` — WebP 500px, 48 KB (`favicon.png` 256px gerado da nova-logo)
- **Tela de login**: gradiente `from-indigo-50 via-white to-violet-50`, logo `w-64`, card branco com sombra; hCaptcha após 3 falhas
- **Modal de cadastro**: 2 etapas — (1) nome/login/senha → POST `/api/auth/registrar` → (2) tela de sucesso informando aguarda ativação
- **UI — padrões visuais consistentes**: header com barra acento vertical (`w-1 h-6 rounded-full bg-sysgate-600`); botões de ação como ícones SVG (pencil/trash) em vez de texto; painel lateral com cabeçalho gradiente (`from-white to-sysgate-50/30`) + label "X selecionado" + botão X para fechar.
- `ConfirmDialog` substitui `window.confirm()`; `Toast` para avisos; `SearchSelect` (busca sem acento) no lugar de `<select>` longo.

## Onde fica cada coisa (`src/`)

| Pasta / arquivo | Conteúdo |
|---|---|
| `lib/api.js` | Axios + interceptor JWT + 401 → logout; exporta os clientes de cada módulo |
| `lib/portalApi.js` | Axios do portal externo (`/api/portal`) — só o token do solicitante; 401 desloga só o portal |
| `stores/` | `authStore` (lembrar 30d), `municipioStore`, `portalAuthStore` |
| `components/` | `Layout`, `Sidebar` (grupos; admin vê Configuração), `PrivateRoute`/`AdminRoute`, `PortalRoute`, `MunicipioBadge`, `SwaggerImport`, `SearchSelect`, `ConfirmDialog`, `CopyButton`, `JsonHighlight`, `MethodBadge`, `StatusBadge`, `Toast` |
| `pages/` | Um arquivo ou pasta por módulo; `Portal/` é o trilho externo (sem sidebar interna) |

Telas sem doc próprio: `Dashboard.jsx` ("Início": saudação, 4 cards, Minha Fila, Acesso Rápido,
Notas Fixadas), `MeuPerfil.jsx` e `Usuarios.jsx` (ver `docs/usuarios.md`), `Login.jsx` e
`RedefinirSenha.jsx`.
