# Krakion Desktop

Nova versão, melhorada, do Krakion — pode divergir do web e, quem sabe, substituí-lo um dia. O nome visível é **Krakion App** (atalho, janela, tela de carregamento); internamente segue `Krakion Desktop`, que é o nome da pasta de dados — não renomear (o app perderia banco, conta e dados). App Electron que roda **100% local e offline**: interface própria, banco Postgres embutido e o mesmo backend do Krakion web. Plano do passo 1: `docs/plans/2026-10-17-desktop-esqueleto.md`.

**Este arquivo é o índice.** Cada módulo tem o seu arquivo em `docs/desktop/` — leia só o do módulo
em que vai mexer, e registre ali o que mudou. Dividido em 2026-11-12 (era um arquivo de 84 KB).

| Arquivo | Conteúdo |
|---|---|
| `docs/desktop/arquitetura.md` | Como funciona (main, banco embutido, backend local, portas, pasta de dados, conta local), componentes compartilhados, interface e tema, janela sem moldura, modo dev × atalho |
| `docs/desktop/api.md` | API — requisição única, Modelos, envio em lote e consulta do idLote depois |
| `docs/desktop/ferramentas.md` | Histórico, Notas, Conhecimento, Analisador JSON |
| `docs/desktop/checagem.md` | Checagem: Por Fonte, Por API e a frente Migração (com a correção sugerida) |
| `docs/desktop/migracao-espelho.md` | Migração Espelho: estímulo pela API da tela, sessão do tributos, backup automático, Ajustes rápidos, limite 429 |
| `docs/desktop/mapa.md` | Mapa de dependências e exclusão em cascata de imóveis |
| `docs/desktop/biblioteca-gerador.md` | Biblioteca (leitura da pasta `biblioteca/`) e Gerador de Extensões |
| `docs/desktop/municipios.md` | Municípios: legislação e documentos em `Municipios/<m>/Legislacao/` |
| `docs/desktop/tokens.md` | Central de Tokens e o agente de renovação no Betha Admin |
| `docs/desktop/sistemas.md` | Sistemas, endpoints e importação de Swagger |
| `docs/desktop/importacao.md` | Importar do Krakion web |
| `docs/desktop/drive-backup.md` | Conexão com o Google Drive e backup automático |
| `docs/desktop/roadmap.md` | O que existe no app, pendências conhecidas e roadmap |
| `docs/desktop/historico-estado.md` | Blocos "Retomar aqui" antigos (2026-10-20 a 2026-10-30) |

## Rodar

```bash
cd desktop
npm install
npm run dev      # Vite (5174) + Electron; o app sobe banco e backend sozinho
npm test         # node --test (electron/, src/ e scripts/)
npm run atalho   # compila a interface (dist/) e cria/atualiza os atalhos "Krakion App"
```

### Abrir com dois cliques

`npm run atalho` cria **Krakion App** na Área de Trabalho e no Menu Iniciar (ícone gerado de `public/favicon.png` em `build/icone.ico`). O atalho abre `electron.exe` direto com a interface **compilada** — sem terminal e sem Vite. Depois de mudar o código do renderer (`src/`), rode `npm run atalho` (ou `npm run build`) de novo para o atalho pegar a versão nova. Mudanças em `electron/` e no `backend/` valem na próxima abertura, sem build.

> **Resolvido (2026-10-18):** o botão **Reiniciar** nunca funcionava com clique de mouse quando a faixa ficava no **topo**, por cima da área `.arrastar` (cabeçalho): o Windows trata o clique como "arrastar a janela" e ele não chega ao botão — `-webkit-app-region: no-drag` num elemento **fixo sobreposto** (não filho do drag) não resolve. Com a faixa no **rodapé** o Felipe confirmou que reinicia. Regra: nada clicável flutuando sobre áreas `.arrastar`. Nos testes, `element.click()` via CDP não passa pelo hit-test do Windows (não pega esse tipo de bug), e clique de mouse real **não** deve ser usado com o app do Felipe aberto (cai na janela dele).

**Aviso de versão nova** (só no modo atalho): o main vigia `desktop/dist`, `desktop/electron` e `backend/src` (`electron/novaVersao.js`, testado; `fs.watch` recursivo com espera de 1,5 s por rajada). Mudou a interface → faixa "Nova versão disponível · **Recarregar**" (só a tela recarrega; build que regera o mesmo `index.html` é ignorado pelo hash). Mudou backend ou núcleo → "**Reiniciar**" (`app.relaunch()` + quit — o `before-quit` desliga backend e banco antes). Testes, `.map` e temporários não contam. Componente `src/components/AvisoVersao.jsx`; ponte `window.krakion.app`.

Sem terminal, os logs vão para `%APPDATA%\Krakion Desktop\krakion.log` (recriado a cada abertura).

Pré-requisitos: `backend/node_modules` instalado (o app usa o backend e o Prisma CLI de lá) e `node` no PATH.

Pasta de dados alternativa (testes, perfis separados): `KRAKION_DADOS=<pasta> npm run dev`.

## Armadilhas

- **`ELECTRON_RUN_AS_NODE=1`**: processos iniciados pelo VS Code herdam essa variável e o Electron roda como Node puro (`does not provide an export named 'BrowserWindow'`). `electron/abrir.js` remove a variável antes de abrir — por isso o `npm run dev` usa ele em vez de `electron .`.
- O backend roda com o `node` do PATH, não com o do Electron (o engine do Prisma é compilado para o Node).

## ▶ Retomar aqui

**Estado registrado em 2026-10-31 (Migração Espelho, Ruropolis)** — conferir com o Felipe o que andou depois.
Commitado em 2026-11-12 (`ef00949`): até então o módulo estava só no working tree.

- **Feito:** créditos, bairros e logradouros estimulados; procuradoria limpa (logradouros 30.604 → 24.952);
  receitas duplicadas corrigidas. Contribuintes: o estímulo revelou 54 com erro, e a frente **Checagem → Migração**
  nasceu disso (script validado no Studio: 10.955 contribuintes, os mesmos 54).
- **Próximo:**
  1. Correção sugerida da Checagem → Migração (`DELETE /api/pessoasEnderecos` dos principais repetidos, `PATCH
     /api/logradouros` do logradouro de outro município) **ainda não testada na Betha**: começar com "Testar com 1".
  2. Reestimular os 54 pelo "Exportar CSV" da verificação, na Migração Espelho.
  3. Rodar o **Desfazer de logradouros** com o mesmo CSV (7 deram HTTP 500; garantir que nenhum ficou com ".").
  4. Segundo passe de limpeza na procuradoria (11 logradouros e 11 bairros em uso).
- Detalhe: `docs/desktop/migracao-espelho.md` e `docs/desktop/checagem.md`. Blocos anteriores: `docs/desktop/historico-estado.md`.

**Git:** branch `krakion-app`. Push só quando o Felipe pedir. Nunca no `master` (a VPS faz `git pull` dele).
