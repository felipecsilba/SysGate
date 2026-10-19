# Krakion Desktop

Nova versão, melhorada, do Krakion — pode divergir do web e, quem sabe, substituí-lo um dia. O nome visível é **Krakion App** (atalho, janela, tela de carregamento); internamente segue `Krakion Desktop`, que é o nome da pasta de dados — não renomear (o app perderia banco, conta e dados). App Electron que roda **100% local e offline**: interface própria, banco Postgres embutido e o mesmo backend do Krakion web. Plano do passo 1: `docs/plans/2026-10-17-desktop-esqueleto.md`.

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

## Importar do Krakion web (Configurações → Importar dados)

Copia **sistemas + endpoints** e **municípios + tokens** da VPS para o banco local. Depois disso o app não depende da VPS; nada sincroniza de volta (fase futura). Plano: `docs/plans/2026-10-17-desktop-importacao-tokens.md`.

- Quem fala com a VPS é o **backend local** (`routes/importacao.js` → `lib/clienteKrakionWeb.js`): a tela não chama a VPS (o CORS de lá bloquearia) e a senha só vai do PC para a VPS. A rota só existe com `KRAKION_DESKTOP=1` e para admin (na VPS → 404).
- 2 chamadas stateless: `POST /api/importacao/conectar { url, login, senha }` → `{ url, tokenRemoto, usuarioRemoto, resumo }`; `POST /api/importacao/executar { url, tokenRemoto, sistemas, municipios }` → busca de novo e grava numa `$transaction` (timeout 120 s).
- **Reimportar não duplica** (`lib/importacaoWeb.js`, testado): sistema e município casam por nome normalizado (sem acento/caixa); endpoints de cada sistema importado são substituídos pelos da VPS; token faz upsert por município × sistema; sem município ativo local, herda o ativo da VPS. Mesmo nome → a VPS vence.
- **Checagem na importação (2026-10-18)**: opção "Checagem" traz, por sistema casado, as regras (`RegraChecagem`, chave `frente + cadastro + nome` — a mesma do seed), as notas (`NotaChecagem`, chave `path + tipo + texto`), o catálogo de fontes (`FonteDados`, 418 fontes — um `GET /fontes/:id` por fonte, no máximo 8 simultâneos via `emParalelo`) e os campos marcados (`CampoChecagem` — só dos cadastros com `marcacoes > 0` em `/cadastros`, que conta apenas os marcados como obrigatórios; uma marcação só de "não obrigatório" num cadastro sem nenhuma outra fica de fora). Tudo casa por chave natural, a VPS vence e nada local é apagado. Usa só rotas que a VPS já tem — não exige deploy. Testado contra a VPS real (2026-10-18): 12 regras, 21 notas, 418 fontes, 8 campos em ~5 s; reimportar não duplica.
- **Notas e Conhecimento** (2026-10-18): `executar` aceita também `notas` e `conhecimento`. Notas = as do usuário na VPS + as compartilhadas com ele; artigos = toda a base. O usuário local vira dono/autor. Sem nome único → casam por **título + `criadoEm`** (a importação grava as datas da VPS); `planejarPorChave` decide criar / atualizar (VPS mais nova) / **manter** (editado aqui depois) — reimportar não duplica nem apaga edição local. Resultado vem como `notas: [novas, atualizadas]`.
- Erro de credencial da VPS volta como **400**, nunca 401 — 401 faria o app deslogar a sessão local.
- Fora: specs Swagger (a API não expõe o conteúdo; endpoints bastam), histórico de requisições, endpoints sem sistema (informados no resumo).
- A tela lembra endereço e login em `localStorage` (`krakion-desktop-importacao`), nunca a senha.
- Teste de ponta a ponta sem tocar na VPS real: um segundo banco embutido + backend em modo web (sem `KRAKION_DESKTOP`) faz o papel de "VPS falsa". Atenção: `POST /api/endpoints` e `/importar` ignoram `sistemaId` — para simular endpoints vinculados, ajuste no banco.

## Central de Tokens (Configurações → Central de Tokens)

`pages/CentralTokens/` — lista de municípios (busca sem acento, ativo marcado) + detalhe (observações, "Tornar ativo", editar, excluir) + tokens (mascarado 8 chars + ••••, revelar, copiar, renovar, remover, selo de validade). Usa as rotas de `/api/municipios` que já existiam. Sem municípios → atalho para Importar dados.

- Validade (`lib/validade.js`, testado): a data é tratada como dia de calendário (`AAAA-MM-DD`) — o web usa `new Date()` e, em UTC−3, mostra **um dia a menos**. Selos: expirado (vermelho), hoje/1–7 dias (laranja), 8–30 (amarelo), >30 (verde). Campo de data limitado a hoje…hoje+15.
- Modais recebem o alvo **só quando são deles** (`alvoDe(tipo)`): passar o mesmo `modal.alvo` para todos fazia o modal de token (fechado) ler `vinculo.sistema.nome` de um município e derrubar a tela ao editar município.

## Sistemas (Configurações → Sistemas)

`pages/Sistemas/` — lista de sistemas + detalhe com abas **Visão geral** (descrição, contagens, aviso de URL base terminando em `/api`), **Endpoints** (agrupados por módulo, busca sem acento em módulo/nome/path/método, editar/excluir no hover) e **Specs** (histórico de importações; remover só tira o registro). Plano: `docs/plans/2026-10-17-desktop-sistemas.md`.

- **Importar Swagger** (`ModalSwagger.jsx`): por URL (o backend baixa; aceita a página do Swagger UI e cabeçalhos extras) ou arquivo `.json` (lido no navegador e enviado como JSON) → **Verificar** (prévia: nº de endpoints, título, versão) → **Importar**. "Substituir os endpoints atuais deste sistema" vem marcado.
- Backend: `importar-swagger` e `fetch-swagger` usam uma gravação única (`gravarSpec` em `routes/endpoints.js`, transação) e aceitam `substituir: true` — apaga os endpoints do sistema antes de criar os novos (antes, reimportar **duplicava**). Sem `substituir`, o comportamento do web não mudou. `importar-swagger` aceita até **32 MB** (specs Betha passam de 1 MB; antes o upload por arquivo dava 413). Metadados da spec em `lib/swaggerSpec.js` (testado).
- Excluir sistema: os endpoints ficam órfãos (`SetNull`, somem do Sandbox) e os tokens do sistema nos municípios são apagados (`Cascade`).
- Fora: Catálogo de verticais (Portfólio/Chamados) e "Limpar tudo".
- Teste: spec sintética de 1,58 MB (600 endpoints) por arquivo + Swagger 2 servido localmente via página HTML estilo Swagger UI; reimportar com substituir manteve 600 (sem duplicar). `DOM.setFileInputFiles` (CDP) escolhe o arquivo no `<input type=file>` nos testes de UI.

## Sandbox — requisição única (Ferramentas → Sandbox)

`pages/Sandbox/` — esquerda: município (vem o ativo), sistema (mostra se o município tem token e a validade), endpoint (`SeletorEndpoint` — dois níveis como no web: módulo (busca sem acento) → recurso, um por path com os métodos existentes; ao escolher já vem POST; método pelos botões), método e path com um campo por `{parâmetro}` e a URL final. Direita: body (`EditorBody` — Campos com marcar/preencher + prévia, ou JSON livre), Executar (bloqueado com o motivo: sem token, sem path, parâmetro vazio), Resposta (status, tempo, cabeçalhos, JSON colorido, ID gerado + "Consultar resultado") e Histórico do município. A tela rola até a resposta ao executar. Plano: `docs/plans/2026-10-17-desktop-sandbox-requisicao.md`.

- Lógica pura e testada (no web estava repetida em 3 lugares): `lib/corpo.js` (`expandirSchema` — objeto 1 nível pelo `_exemplo`, `idGerado` → `{ id }`; `fixo` — idIntegracao/idGerado sempre vão; `selecaoInicial`, `valoresIniciais`, `montarBody` — número inválido segue como texto para a API apontar o erro; `pedeJsonLivre` para `array<…>`), `lib/caminho.js` (`parametrosDoPath`, `preencherPath` com encode, `urlFinal` = exatamente o que o proxy chama), `lib/ids.js` (`extrairId`), `buscarEndpoints` em `lib/endpoints.js`.
- `components/JsonColorido.jsx` escapa o HTML **antes** de colorir — resposta de API externa nunca vira marcação (testado com `<script>` na resposta).
- Backend: o histórico deixa de guardar o token em texto puro — `lib/mascararHeaders.js` (testado) mascara `Authorization` ao gravar (`proxy.js`) e ao ler (`requisicoes.js`, cobre registros antigos). Vale também para a VPS.
- **Testes nunca chamam a Betha**: sistema de teste com `urlBase` apontando para um servidor falso local (201 com id, 400 com mensagem, GET /{id}, registra o token recebido).

## API — Modelos (2026-10-18)

Requisições prontas para reusar: botões no **cabeçalho do Body, ao lado das abas Campos/JSON** (longe do Executar, para não clicar errado; sem body — GET/DELETE — ficam no canto esquerdo da linha do Executar). Sem modelo aberto: **Salvar modelo** (verde sólido). Com modelo aberto: **Atualizar modelo** (neutro — só regrava) + **Salvar como novo** (verde — cria). E a lista **Modelos** no fim da coluna da esquerda (clique aplica; lixeira no hover). Guarda sistema, método, path, `{params}`, modo, campos marcados, valores e JSON — **não** o município (o mesmo modelo serve para qualquer um). Ao abrir modelo de outro sistema, troca o sistema e aplica quando os endpoints carregam (`modeloPendente`). Armazenamento: `localStorage` do app (`krakion-desktop-modelos`, persiste em userData) via `lib/modelos.js` (testado) — local desta máquina, sem banco.

## Histórico (Ferramentas → Histórico, 2026-10-18)

`pages/Historico.jsx` — todas as requisições do proxy (até 500 mais recentes, `GET /api/requisicoes`). Filtros: município (no backend), sistema, Todas/Sucesso/Erro com contadores e busca sem acento por path, ID gerado, endpoint ou método. Lista agrupada por dia (Hoje / Ontem / data) → painel de detalhe: município, sistema, endpoint, quando, duração, ID gerado (copiar), URL (copiar), Enviado e Resposta. Lixeira limpa o histórico do município filtrado (ou tudo, com confirmação). Regras puras em `lib/historico.js` (`situacao` — só 2xx é sucesso; `filtrarHistorico`; `agruparPorDia` pelo dia local) — testadas.

## Notas (Ferramentas → Notas, 2026-10-18)

`pages/Notas/` — mesmo backend do web (`/api/notas`), outro desenho: **lista à esquerda** (busca sem acento, filtro por tipo com ícones, etiquetas `#`, Fixadas no topo, prévia de uma linha — checklist mostra `feitos/total`) e **editor à direita que grava sozinho** (700 ms sem digitar; ao trocar de nota grava o que faltou; selo Salvo/Salvando/Editando). Tipos texto, checklist, lista e código (trocar de tipo converte linhas ↔ itens; Tab no código insere 2 espaços; Enter num item cria o próximo, Backspace num item vazio apaga). Cor da nota vira um **ponto** saturado (as cores pastel do web somem no tema claro e destoam no escuro — `PONTO` em `Notas/constantes.js`; o banco segue guardando o hex do web). Sem compartilhamento (só há a conta local) e sem arrastar para ordenar. Regras puras em `lib/notas.js` (testadas).

## Conhecimento (Ferramentas → Conhecimento, 2026-10-18)

`pages/Conhecimento/` — mesmo backend e **mesmo formato de dados** do web (blocos `texto|subtitulo|codigo|nota` em JSON no `conteudo`; passo-a-passo em `passos[].texto`; texto plano antigo vira um bloco). Lista à esquerda (busca sem acento que acha **até dentro de bloco de código e de passo**, filtro por tipo com ponto colorido, vertical → sistema do `CatalogoVertical` em CaixaBusca) carregada de uma vez (`limite=100000`). Direita: **leitura** em coluna de leitura (código em fundo escuro com realce VS Code e botão copiar; passos numerados) ou **edição no próprio painel** (sem modal — Salvar/Cancelar; trocar de/para passo-a-passo aproveita as linhas). Permissões iguais ao web: edita autor ou admin, exclui admin. Regras em `lib/conhecimento.js` (`parseConteudo`, `formDoArtigo`, `montarArtigo`, `trocarTipo`, `filtrarArtigos`) e realce em `lib/codigo.js` (escapa HTML antes de pintar) — testados.

## Sandbox — envio em lote (aba "Envio em lote")

`pages/Sandbox/AbaLote.jsx` — usa a mesma coluna da esquerda (município, sistema, endpoint, path). CSV (Papa Parse; "Sem cabeçalho" → colunas A, B, C…; prévia das 4 primeiras linhas) → **mapeamento** por campo: coluna do CSV (com valor de exemplo), valor fixo ou não enviar — pré-mapeado por nome sem acento/caixa → itens por lote (padrão 50, até 300; as descrições dos endpoints não trazem o limite de forma utilizável) e lotes simultâneos (até 5) → prévia do 1º item → **confirmação** (itens + URL — os dados vão direto para a API) → progresso (rola até ele) com **Parar**, **Consultar pendentes**, **Copiar IDs** e **Exportar CSV** (`;`, UTF-8 com BOM).

- Regras puras e testadas em `lib/lote.js` (ver memória `betha-api-lote-assincrono`): POST devolve só `idLote` → consulta `GET {path}/{idLote}` a cada 5 s por até 60 s; `PROCESSADO` = gravado, `PROCESSADO_COM_ERRO` = parcial (erros por item), **`NAO_PROCESSADO` = ainda na fila, nunca erro**; 200 **sem** `idLote` = lote recusado (`message`). Sem mapa para `idIntegracao`, cada item recebe `RUNID-L<linha>` — o erro da Betha aponta de volta a **linha da planilha**. Endpoint sem schema: a linha inteira vira o objeto.
- Teste: Betha falsa local com lote assíncrono (1ª consulta NAO_PROCESSADO, depois PROCESSADO / COM_ERRO, e envelope recusado) — 7 linhas em 3 lotes: gravado / parcial (linha 5) / recusado.

## Agente de renovação de tokens (Betha Admin)

> **Pendente (2026-10-18) — falha no login real:** no Betha de verdade o agente para no passo "login" com "Script failed to execute" em ~2 ms (exceção dentro do comando, não navegação). Estrutura real do login (do `krakion.log`): iscas **ocultas** (`input[type=text]` e `input[type=password]` sem nome) antes de `login:iUsuarios`, `login:lembrar`, `login:senha`, `login:btAcessar` — o agente já usa os visíveis/ids reais. **Suspeita principal, não confirmada:** a página carrega Prototype.js (RichFaces), que troca o `Event` global; `new Event('input')` quebra. Próximo passo: criar eventos com `document.createEvent('HTMLEvents')` + `initEvent` (vale também nos selects e no Emitir) e fazer cada comando capturar o próprio erro e devolver a mensagem real. O Betha falso já tem `window.Event` trocado para reproduzir. O Felipe pediu para parar aqui (custo) e seguir para a API.

Plano: `docs/plans/2026-10-18-desktop-agente-tokens.md`. Configurações → **Betha Admin** (usuário + senha) e, na Central de Tokens, **Renovar no Betha** (ícone ↻ em cada token) ou **Renovar vencidos (N)**.

- **Fluxo real** (capturado com `tools/betha-capture` em 2026-10-18): `admin.betha.com.br/cad_libconversao_usuario.faces` (JSF/RichFaces; sem sessão → `login.faces`). Selects em cascata por AJAX: `mainForm:iRevendas` → `iEntidades` → `iDatabases` → `iSistemas`; `mainForm:diasValidade` (15); `mainForm:senha` + `mainForm:btEmitir` → "Os dados foram gravados com sucesso!", situação ATIVO, token em `mainForm:token`. Sem senha → "Informe a senha do usuário."
- `electron/bethaAdmin/agente.js`: **janela escondida** do Electron (partição em memória `betha-admin` — a sessão não fica em disco) faz login, escolhe as opções esperando cada lista carregar, emite e confere sucesso + UUID novo; para em qualquer mensagem nova (não espera 30 s num erro). "Mostrar o navegador" exibe a janela. Uma renovação por vez (fila no `main.js`). O token volta para a tela, que grava via `POST /api/municipios/:id/tokens` com validade = hoje + dias (`dataMaisDias`).
- `escolha.js` (testado): opção única → ela; entidade/banco = **a da prefeitura do município** ("PREFEITURA MUNICIPAL DE", "PREFEITURA DE", "MUNICIPIO DE" + nome, sem acento/caixa); sistema pelo nome do Krakion. Ambíguo/nada → a tela pergunta e o app **lembra** pelo texto da opção (`entidade|VISEU`, `sistema|TRIBUTOS`…) — lista e "Esquecer" em Configurações → Betha Admin.
- `credenciais.js`: `<userData>/betha-admin.json` com a senha **cifrada por `safeStorage` (DPAPI)**; só o processo main decifra; nunca vai para o banco, a tela ou log (verificado no teste).
- Teste: Betha Admin **falso** local com os mesmos ids, AJAX com latência, login e emissão — `KRAKION_BETHA_ADMIN_URL` aponta o agente para ele (só testes). Cenários: login recusado, Viseu completo, Belém sem "Prefeitura" (pergunta → continua → lembra), senha errada com sessão aberta (erro em 5 s).
- `tools/betha-capture` passou a mascarar campos de senha no corpo (`mascararCorpo.js`, testado) — antes gravava `mainForm:senha` em texto puro.

## Componentes compartilhados

`Pagina` (moldura), `Modal`, `Confirmar` (ação destrutiva, aceita async), `Busca`, `Abas` (pílulas com contador), `BotaoIcone`, `MetodoBadge` (cor por método HTTP), `LimiteErro` (erro num módulo mostra a mensagem em vez de tela em branco; o `Layout` reseta ao trocar de rota), `Icone`. Helpers: `lib/texto.js` (`normalizar`, `contem` — busca sem acento), `lib/endpoints.js` (`agruparPorModulo`, `avisoUrlBase`).

## Interface

- Layout 3 colunas: **Rail** (grupos + tema + avatar) → **PainelLista** (itens do grupo) → conteúdo.
- Menu vem de `src/modulos.js` (fonte única): Ferramentas → Analisador JSON, Checagem, Conhecimento, Notas, Histórico; API (ícone próprio); Extensões (ícone próprio); Configurações → Sistemas, Central de Tokens, Betha Admin, Importar dados. Módulo sem página em `PAGINAS` (`App.jsx`) mostra `EmConstrucao` — hoje: nenhum.
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
- Controles próprios em `src/components/ControlesJanela.jsx` (minimizar / maximizar↔restaurar / fechar, hover vermelho no X). Falam com o main por `electron/preload.cjs` → `window.krakion.janela` (só esses comandos — nenhum acesso a Node). Preload é `.cjs` porque preload em sandbox não aceita ESM.
- Arrastar: classe `.arrastar` (`-webkit-app-region: drag`) no topo do Rail, no cabeçalho do PainelLista e no cabeçalho de cada página; botões/inputs dentro dela ficam `no-drag` automaticamente (`index.css`). Dois cliques na área maximizam.
- `src/components/Pagina.jsx` é a moldura de todo módulo: cabeçalho arrastável (ícone + título + `acoes` + controles da janela) e conteúdo num cartão `rounded-2xl` com borda, afastado das bordas.
- `carregando.html` também é arrastável, tem um X próprio (importante quando mostra erro) e desenha os mesmos cantos de 16px.
- Estilo estrutural inspirado no app de referência: Rail e PainelLista com o mesmo fundo do conteúdo, separados por linha fina; item ativo neutro (`bg-texto/[0.06]` — faixa inteira na lista, quadrado arredondado no Rail); avatar neutro. O violeta (`acento`) fica para detalhes (foco, selos).

## Modo dev × modo atalho

- `KRAKION_DEV=1` (definido por `electron/abrir.js`, usado no `npm run dev`) → interface pelo Vite com hot reload.
- Sem ela (atalho) → `electron/protocolo.js` registra `app://krakion`: serve `dist/` (com proteção contra path traversal) e repassa `/api/*` para `127.0.0.1:3101` via `net.fetch`. Abrir `dist/` como `file://` não serve: `/api` viraria `file:///api` e o CORS do backend recusaria a origem `null`.
- `app.setAppUserModelId` + ícone da janela → a barra de tarefas mostra o Krakion, não o Electron.

## Armadilhas

- **`ELECTRON_RUN_AS_NODE=1`**: processos iniciados pelo VS Code herdam essa variável e o Electron roda como Node puro (`does not provide an export named 'BrowserWindow'`). `electron/abrir.js` remove a variável antes de abrir — por isso o `npm run dev` usa ele em vez de `electron .`.
- O backend roda com o `node` do PATH, não com o do Electron (o engine do Prisma é compilado para o Node).

## Próximos passos

**Ordem combinada com o Felipe (2026-10-17):**
1. ~~Sandbox — envio em lote~~ — pronto (2026-10-17).
2. ~~Agente de renovação de tokens~~ — pronto (2026-10-18), ver seção própria. **Era:** — quando o token de um município vencer, o app gera um novo sozinho: entra na página do **Betha Admin** com usuário e senha e segue os passos que o Felipe vai ensinar (ainda não descritos). Pontos a decidir no design: onde guardar usuário/senha do Betha Admin (no app desktop, cifrados com `safeStorage` do Electron — DPAPI do Windows — nunca em texto puro nem no banco), como automatizar o navegador (janela oculta do próprio Electron vs. Playwright), quando disparar (botão "Renovar" no token vencido; depois, automático ao vencer), e gravar o token novo + validade via upsert de `MunicipioSistema`. Depende de ele mostrar o passo a passo no Betha Admin.

3. ~~Sandbox vira "API"~~ — feito (2026-10-18): grupo próprio `api` (`direto: true` em `modulos.js` → o `Layout` esconde a lista do meio), rota `/api` (`/sandbox` redireciona), ícone `api` (nuvem + texto "API" + conexões, em `Icone.jsx`). Melhorias do módulo: a combinar. **Era:** (pedido de 2026-10-18, depois do agente de tokens): o módulo muda de nome para **API**, sai do grupo Ferramentas e ganha **ícone próprio na barra da esquerda (Rail)** — desenho de nuvem com "API" e engrenagem/conexões embaixo (referência: ícones "API cloud + gear" que ele mostrou). Junto, melhorias no próprio Sandbox (a definir com ele).

4. Melhorias da API (2026-10-18, em andamento, guiadas pelo Felipe): seletor em dois níveis igual ao web, CaixaBusca, bloco Valores neutro com selo "fixo", **Modelos**, CaixaBusca em todo o app e módulo **Histórico** — API fechada. Pendente: o agente de tokens (login real — ver seção própria).

5. Trazer os módulos "Em construção" (2026-10-18, em andamento): ~~Histórico~~, ~~Notas~~, ~~Conhecimento~~ (+ notas e conhecimento na importação), **Analisador JSON** (2026-10-18) — prontos. **Checagem Por Fonte e Por API** (2026-10-18), **Extensões** (2026-10-18) — prontos. Falta: gerador de script de exportação da Checagem → **Extensões por último** (o Felipe pediu).

### Estado em 2026-10-18 (fim da sessão) — para retomar numa sessão nova

**Já no app:** Central de Tokens, Sistemas, API (requisição única, lote, Modelos), Histórico, Notas, Conhecimento, Importar dados (sistemas, endpoints, municípios, tokens, notas, conhecimento), Betha Admin (agente com login real pendente). Testes: desktop 92, backend 71 — todos passando.

**Git:** commits até a API (`18039e7`, `e197c76`) estão no branch **`krakion-app`** (tag `app-v0.1.0`) no GitHub — o `master` não foi tocado (a VPS faz `git pull` dele). **O que veio depois NÃO está commitado**: CaixaBusca em todo o app, Histórico, Notas, Conhecimento, importação de notas/conhecimento (backend: `importacaoWeb.js`, `clienteKrakionWeb.js`, `routes/importacao.js` + teste), `lib/historico.js`, `lib/notas.js`, `lib/conhecimento.js`, `lib/codigo.js` (+ testes) e estes docs. Commitar no `krakion-app` ao retomar. Nada disso foi aberto na janela real ainda — o Felipe confere visualmente.

**Analisador JSON — pronto (2026-10-18), commitado no `krakion-app`.** `pages/AnalisadorJson/` (`index.jsx` com modos Analisar / Comparar no cabeçalho, `Editor`, `Arvore`, `Tabela`, `Estatisticas`, `Comparar`) + `lib/json.js` (17 testes; desktop 109 no total). 100% na tela, sem backend; o texto sobrevive à troca de módulo (variável do módulo), nunca vai a disco.
- Esquerda: editor com números de linha (Tab = 2 espaços), Colar / Abrir / Formatar / Minificar / Limpar; a linha do erro fica vermelha na régua.
- Direita: abas Formatado / Árvore / Tabela / Estatísticas + busca de chave/valor (sem acento; clique copia o caminho). Barra de status: válido ou "Erro na linha X, coluna Y" (clique leva ao erro), Ln/Col, caracteres.
- `interpretar()` acha a posição do erro com um leitor próprio — a mensagem do `JSON.parse` muda entre versões do V8 e nem sempre traz posição. Mensagem em português ("esperava "," ou "}"").
- `caminhoFilho()`: `$.a[0].b`; chave fora do padrão de identificador vai entre colchetes (`$["meu-campo"]`).
- Tabela: lista de objetos, ou objeto com **um** array de objetos dentro (envelope `{ content: [...] }` — mostra "lista em content"); objetos aninhados viram colunas com ponto (`credito.id`), arrays ficam inteiros; ordena por coluna (vazios por último); Exportar CSV com `;`. Mostra 1.000 linhas, o CSV leva todas.
- Cores do JSON: `colorirJson()` / `CORES_JSON` (claro e escuro) — o `JsonColorido` usa a mesma função com as cores fixas de fundo escuro.
- Visual sóbrio: sem o tema próprio do web, sem cards coloridos nas estatísticas (números neutros + barra discreta).

- **Comparar**: dois editores (A original / B novo, Colar / Formatar / Limpar, botão trocar A↔B) e embaixo a lista de diferenças (`comparar()`): `+` adicionado, `−` removido, `~` alterado (de riscado → para), filtros por tipo, clique copia o caminho. Modo e textos sobrevivem à troca de módulo.
- **Grafo do web não foi portado** — decisão do Felipe (2026-10-18): Árvore e Tabela cobrem o uso.

**Checagem — frente Por Fonte pronta (2026-10-18).** `pages/Checagem/` (`index.jsx` com abas Por Fonte / Por API no cabeçalho + sistema/fonte; `PorFonte.jsx`; `Detalhes.jsx` com DetalheRegra/DetalheCampo/ResumoCampos/NotasCadastro; `pecas.jsx`) + `lib/arquivoFonte.js` (portado do web, agora com 11 testes). Usa as rotas `/api/checagem/*` do backend local; os dados vêm da importação (opção Checagem).
- Fluxo igual ao web: arrastar/abrir o `.jsonl` (ou colar texto), corte de cada registro aos caminhos das regras + `CONTEXTO`, lotes de 700 KB para `/verificar`, mescla, perfil de campos com o catálogo `FonteDados`. Diferença: o lote é medido em **bytes UTF-8** (o web media caracteres — acentos podiam estourar o 1 MB).
- Laudo só na memória enquanto o app está aberto (trocar de módulo não perde); nada em disco nem no banco (arquivo tem CPF/CNPJ).
- Visual sóbrio: severidade = ponto + palavra; lista à esquerda (regras, "Campos do arquivo", "Falta fora do arquivo", campos com filtros e busca sem acento); detalhe à direita sem caixas coloridas (ícone + título colorido, texto neutro). "Onde se concentra" em uma coluna.
- Conferido com o arquivo de referência (`ArquivosTemporarios/debitos_credito_285568.jsonl`): 16.451 débitos verificados em ~1,1 s, regra "Receita vinculada…" acusa os 1.635 esperados; concentração (INSCRITA 890, 2025 1.512, LIDFE 100%).
- **Frente Por API (2026-10-18)**: `PorApi.jsx` + `CamposApi.jsx` + `lib/checagem.js` (6 testes). Cadastro numa caixa única com busca sem acento ("Dívida · Inscrição em dívida · 2 marcados"), sub-abas **Verificar payload** (editor do Analisador + laudo: Contra a spec / Regras expansíveis — erros abertos / Falta fora do JSON) e **Campos** (chave Obrigatório + "O que quebra sem ele" editável; marcação igual à spec e sem observação é apagada). As marcações feitas no app ficam nesta máquina; reimportar a Checagem atualiza as que também existem na VPS (a VPS vence). Conferido: payload de dívida com campo errado → 15 achados (obrigatórios, tipo incorreto, campo inexistente), 2 regras e 3 notas.

**Extensões — biblioteca (2026-10-18).** Pedido do Felipe: sair de Ferramentas e ganhar **ícone próprio no Rail** (grupo `extensoes`, `direto: true`), "como se fossem bibliotecas". Decisões dele: **lê a pasta local** `Desktop\Scripts Formulas e Relatorios` (configurável — "trocar" no rodapé da coluna; guardada em `preferencias.json` → `bibliotecaPasta`) e é **somente leitura** (ver, buscar, copiar, mostrar na pasta). Nada vai para o banco.
- `electron/biblioteca.js` (7 testes): `indexar` (só nomes — 9.730 itens em ~30 ms: 5.393 scripts, 2.035 fórmulas, 2.302 relatórios, 34 municípios), `lerItem` (script/fórmula = arquivo + metadados do cabeçalho `// Chave : Valor`; relatório = os arquivos da pasta na ordem fonte dinâmica → jrxml → parâmetros → info), `buscarConteudo` (sem acento, devolve a 1ª linha que bate; ~3 s em 7 mil arquivos), `resolverDentro` (nada fora da pasta). `interpretarNome` lê o padrão "Município - [id -] TIPO - Descrição - Ano" das fórmulas e "Município - ÁREA - {'identificador'_ 'EVENTO'…} - Nome" das críticas.
- IPC `biblioteca:*` no `main.js` + `window.krakion.biblioteca` no preload (só ids relativos chegam ao main).
- Tela `pages/Extensoes/` (index + Visualizador) + `lib/biblioteca.js` (8 testes): esquerda = navegação única (pedido do Felipe: fórmulas **abaixo dos scripts, separadas pelo tipo de fórmula**) — município no topo; seção SCRIPTS com as categorias; seção RELATÓRIOS (pedido: abaixo dos scripts e acima das fórmulas); seção FÓRMULAS com os 20 tipos (`Tipo Fórmula` do Betha, vindo do nome do arquivo como `codigo`) com nome legível (`rotuloTipoFormula`) e agrupados por assunto (Acréscimo, Geração de crédito, ITBI, Parcelamento). Sem abas no cabeçalho; meio = lista (busca por palavras no nome/município/tipo; "buscar no código" ou Enter procura dentro dos arquivos do filtro atual e mostra a linha); direita = código com realce (BFC-Script: `highlightCode(texto, BFC_SCRIPT)`; jrxml: `highlightXml`), régua de linhas, abre na linha encontrada, Copiar e Mostrar na pasta.
- Armadilhas: `\r\n` precisa virar `\n` antes do realce (o `<span>` do comentário fecha antes do `\n` e o `\r` sozinho vira linha extra — régua desalinhava); ligaduras da Cascadia desligadas (`!=` virava `≠`).

**Depois do Analisador:** Checagem (web `pages/Checagem/`, ~2.700 linhas — frentes Por API e Por Fonte; usa `/api/checagem/*` e o catálogo `FonteDados` — ver `docs/checagem.md`; regras vêm do `seed-regras-checagem.js`, que precisa rodar no banco local também) → Extensões (Scripts BFC/Fórmulas/Anotações + Relatórios JRXML — `Scripts.jsx` 760 linhas; incluir scripts e relatórios na importação, mesmo padrão título + `criadoEm`).

**Depois (roadmap):**

- Agente de tokens: login real (pulado pelo Felipe por custo — ver seção própria).
- Instalador `.exe` (empacotar Node + backend + binários do Postgres) — necessário para levar ao notebook; hoje o atalho depende do repositório nesta máquina.
- Sincronização com a VPS (ids globais, `atualizadoEm`, exclusão lógica).
- Chat com agentes (Claude Code local — `claude` 2.1 instalado em `~/.local/bin`). Abordagem sugerida: Agent SDK no processo main com ferramentas MCP do próprio app. Decisões pendentes (o Felipe pulou por ora): o que o agente pode fazer (sugestão: ler/preparar, **nunca** disparar chamada à Betha), onde pode criar arquivos, onde o chat aparece (sugestão: ícone próprio no Rail).
