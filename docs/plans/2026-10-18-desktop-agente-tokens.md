# Plano: Krakion App — Agente de renovação de tokens (Betha Admin)

**Goal:** renovar o token de um município × sistema sem sair do app: o agente entra no Betha Admin com o usuário/senha do Felipe, emite um token novo de 15 dias e grava na Central de Tokens.

**Fluxo real (capturado em 2026-10-18 com `tools/betha-capture`):** `admin.betha.com.br/login.faces?lastUrl=/main.faces` → `cad_libconversao_usuario.faces` (JSF/RichFaces). Cada select dispara um POST AJAX com o formulário inteiro + `javax.faces.ViewState`, nesta ordem: `mainForm:iRevendas` (67 = SISTEMATICA CONTABILIDADE LTDA) → `mainForm:iEntidades` (várias: câmaras, fundos, prefeituras) → `mainForm:iDatabases` ("PREFEITURA MUNICIPAL DE VISEU") → `mainForm:iSistemas` (58 = Tributos). `mainForm:diasValidade` = 15. `mainForm:senha` + `mainForm:btEmitir` → "Os dados foram gravados com sucesso!", situação ATIVO, token novo em `mainForm:token`. Sem senha → "Informe a senha do usuário." Login: só usuário e senha (sem captcha/2FA).

**Architecture:** janela **escondida** do Electron (partição `persist:betha-admin`) automatiza a página real — o navegador cuida do ViewState/AJAX do JSF (replicar por HTTP seria frágil). Tudo no processo main; a tela só pede e recebe o resultado por IPC. Credenciais cifradas com `safeStorage` (DPAPI do Windows) em `<userData>/betha-admin.json` — nunca no banco, na tela ou em log. O token novo é gravado pela tela via `POST /api/municipios/:id/tokens` (rota existente). Endereço configurável por `KRAKION_BETHA_ADMIN_URL` só para testes.

**Escolhas automáticas (puras, testadas):** revenda/database/sistema com uma única opção → ela; entidade = a da prefeitura do município ("PREFEITURA MUNICIPAL DE", "PREFEITURA DE", "MUNICIPIO DE" + nome, sem acento/caixa); ambíguo ou nada → pergunta uma vez e **lembra**.

---

## Tasks
1. `electron/bethaAdmin/escolha.js` + teste — `escolherOpcao(etapa, opcoes, contexto, lembrado)`.
2. `electron/bethaAdmin/credenciais.js` — salvar/ler/apagar (safeStorage) + lembranças.
3. `electron/bethaAdmin/agente.js` — login, navegação, selects (espera a próxima lista carregar), emitir, ler token/mensagem; erros claros; `mostrar` exibe a janela.
4. IPC no `main.js` + `preload.cjs` (`window.krakion.betha`): status/salvar/apagar credenciais, renovar, eventos de passo.
5. UI: Configurações → **Betha Admin** (credenciais + lembranças); Central de Tokens → **Renovar no Betha** por token + **Renovar vencidos**, modal de progresso, escolha quando ambíguo, "Mostrar o navegador".
6. Verificação: Betha Admin falso local (mesmos ids, AJAX por select, emitir com/sem senha, login inválido); app de teste renova e grava; docs.
