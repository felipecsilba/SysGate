# Plano: Conexões — Google Drive (Krakion App)

**Goal:** primeiro conector do Krakion App. O Felipe conecta a conta Google uma vez; o app passa a ter uma
pasta `Krakion App` no Drive onde consegue gravar e ler arquivos. Base para o backup automático (próximo passo)
e molde para os próximos conectores (Claude API, Gmail).

**Decisões (brainstorming de 2026-10-19):**
- Opção B: OAuth próprio + API REST do Drive, sem dependência nova (só `fetch` do Node). Rejeitadas: Drive para
  Desktop (não é conector, exige app do Google em cada máquina) e rclone embutido (binário extra, fluxo próprio).
- Escopo `drive.file`: o app só enxerga o que ele mesmo criou. Não é escopo sensível — dispensa verificação do
  Google. Limitação aceita: não lê PDFs que já estão no Drive.
- O app OAuth do Google Cloud precisa estar **Em produção**: em "Teste" o refresh token expira em 7 dias.
- Client ID e segredo são colados na própria tela (cada máquina) e guardados cifrados — nada no git.
- Fora desta etapa: o backup (o que, quando, retenção) e outros conectores.

**Architecture:**
- `electron/conexoes/googleDrive/oauth.js` — PKCE, URL de autorização, servidor de retorno em `127.0.0.1:<porta livre>`
  (confere `state`), troca de código, renovação e revogação. Sem import de `electron` (testável no Node).
- `electron/conexoes/googleDrive/cliente.js` — `sobre()`, `garantirPasta()`, `enviar()` (upload resumable em partes
  de 8 MB, serve arquivo grande), `baixarTexto()`, `excluir()`. Recebe `obterAcesso()` e os endereços.
- `electron/conexoes/googleDrive/index.js` — orquestra: `status`, `configurarApp`, `conectar`, `testar`,
  `desconectar`, `cliente()`. Guarda em `<userData>/google-drive.json`; recebe a cifra (`safeStorage` no main) por
  parâmetro — refresh token e segredo nunca saem do main.
- Endereços via `enderecos(base)`; `KRAKION_GOOGLE_BASE` aponta tudo para um Google falso (só testes).
- IPC `drive:*` no `main.js` (com `comErro`) + `window.krakion.drive` no preload.
- Tela `pages/Conexoes/` — Configurações → Conexões, um cartão por conector.

**Testes (node --test):**
- `oauth.test.js`: PKCE (desafio = SHA-256 base64url do verificador), URL com todos os parâmetros, retorno com
  `state` errado/`error` rejeita, troca e renovação montam o form certo.
- `index.test.js` com Google falso local (`googleFalso.js`): conectar ponta a ponta (o "navegador" é um `fetch`
  que segue o redirect), status sem segredos, testar (cria pasta, envia, lê, apaga), upload de 20 MB em partes,
  renovação quando o acesso vence, desconectar revoga e apaga, conectar sem app configurado falha com mensagem.

## Tasks

1. `oauth.js` + testes (vermelho → verde).
2. `googleFalso.js` (servidor de teste) + `cliente.js` + testes.
3. `index.js` + testes ponta a ponta.
4. IPC no `main.js` + preload.
5. Tela `pages/Conexoes/` + item no `modulos.js` + rota no `App.jsx`.
6. Guia `docs/conexoes-google-drive.md` (Google Cloud passo a passo) + seção em `docs/desktop.md` + CLAUDE.md.
7. `npm test` + `npm run build`; commit.
