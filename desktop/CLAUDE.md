# Krakion App (Krakion Desktop)

- **Krakion Desktop (2026-10-17)** — nova versão melhorada do Krakion (nome visível "Krakion App"; pasta de dados segue `%APPDATA%\Krakion Desktop` — **não renomear**: o app perderia banco, conta e dados): app Electron em `desktop/`, local e offline, com Postgres embutido (5433) e o **mesmo** `backend/` rodando como processo filho (3101). Não compartilha banco nem sessão com o web. Toda mudança no `schema.prisma` é aplicada no banco do desktop na próxima abertura (`prisma db push` sem `--accept-data-loss`).

**Documentação completa e diário: `docs/desktop.md`.** Ao retomar trabalho, ler a seção
"Estado e próximos passos" → "▶ Retomar aqui". Planos em `docs/plans/2026-10-*-desktop-*.md`.

## Comandos

```bash
npm install
npm run dev      # Vite (5174) + Electron; o app sobe banco e backend sozinho
npm test         # node --test (electron/, src/ e scripts/)
npm run atalho   # compila a interface (dist/) e cria/atualiza os atalhos "Krakion App"
```

Pré-requisitos: `backend/node_modules` instalado e `node` no PATH (o backend roda com o node
do PATH, não com o do Electron — o engine do Prisma é compilado para o Node).
Pasta de dados alternativa: `KRAKION_DADOS=<pasta> npm run dev`.

| Porta | Serviço |
|---|---|
| 5174 | Vite (renderer, só em dev) |
| 3101 | backend local (só `127.0.0.1`, via env `HOST`) |
| 5433 | Postgres embutido (só `127.0.0.1`) |

## Regras e armadilhas

- **`ELECTRON_RUN_AS_NODE=1`** herdado do VS Code faz o Electron rodar como Node puro. `electron/abrir.js` remove a variável; por isso `npm run dev` usa ele.
- Depois de mudar `src/`, rodar `npm run atalho` (ou `npm run build`) para o atalho pegar a versão nova. Mudanças em `electron/` e `backend/` valem na próxima abertura.
- **Nada clicável flutuando sobre áreas `.arrastar`**: o Windows trata o clique como arrastar a janela. Clique via CDP não pega esse bug; não usar clique de mouse real com o app do Felipe aberto.
- O preload (`electron/preload.cjs`) expõe só pontes específicas, nunca Node nem IPC genérico; todo caminho que chega ao main passa por um `resolver…` que barra o que está fora da pasta permitida.
- **Visual sóbrio**: acento índigo Krakion, sem violeta/fúcsia neon nem degradê; botões sólidos ou neutros; evitar pílula translúcida. Verde sólido = criar/salvar; índigo = Executar.
- Sem fontes nem ícones externos (offline): Segoe UI + SVG inline em `components/Icone.jsx`. Nenhum `<select>` nativo: usar `components/CaixaBusca.jsx`.
- Logs no modo atalho: `%APPDATA%\Krakion Desktop\krakion.log`.

## Onde fica cada coisa

| Pasta | Conteúdo |
|---|---|
| `electron/` | `main.js` (janela, sobe banco e backend), `bancoLocal.js` (Postgres 18 embutido), `backendLocal.js`, `configLocal.js` (`local.json`: senha do banco, `JWT_SECRET`, `schemaHash`), `protocolo.js` (`app://krakion` no modo atalho), `novaVersao.js` (aviso Recarregar/Reiniciar), `preferencias.js` (tema sem piscar) |
| `electron/conexoes/googleDrive/` | Conector do Drive (OAuth PKCE, upload resumable, segredos cifrados) |
| `electron/backup/` | Backup no Drive (exporta o banco em JSON sem colunas de senha/token, zip próprio, retenção) |
| `electron/bethaAdmin/` | Agente de tokens: janela escondida no Betha Admin; senha cifrada por safeStorage |
| `electron/sessaoTributos/` | Migração Espelho: sessão do tributos só em memória; `chamar()` com allowlist |
| `electron/biblioteca.js`, `catalogoFontes.js`, `municipiosDocs.js`, `mapaDependencias.js` | Leitura da pasta `biblioteca/` (Biblioteca, Gerador, Municípios, Mapa) |
| `src/modulos.js` | Fonte única do menu (grupos do Rail) |
| `src/components/` | `Pagina` (moldura de todo módulo), `Layout`, `Rail`, `PainelLista`, `Modal`, `Confirmar`, `CaixaBusca`, `Abas`, `LimiteErro`, `AvisoVersao`, `Icone`… |
| `src/pages/` | Um diretório por módulo (seção própria em `docs/desktop.md`) |
| `src/lib/` | Regras puras, todas com `.test.js` (lote, json, checagem, espelho, exclusão de imóveis…) |
| `scripts/` | `criar-atalho.js` + `icone.js` |
