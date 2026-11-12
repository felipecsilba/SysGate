# Krakion App — Central de Tokens e agente do Betha Admin

Parte da documentação do Krakion App. Índice e "Retomar aqui": `docs/desktop.md`.

## Central de Tokens (Configurações → Central de Tokens)

`pages/CentralTokens/` — lista de municípios (busca sem acento, ativo marcado) + detalhe (observações, "Tornar ativo", editar, excluir) + tokens (mascarado 8 chars + ••••, revelar, copiar, renovar, remover, selo de validade). Usa as rotas de `/api/municipios` que já existiam. Sem municípios → atalho para Importar dados.

- Validade (`lib/validade.js`, testado): a data é tratada como dia de calendário (`AAAA-MM-DD`) — o web usa `new Date()` e, em UTC−3, mostra **um dia a menos**. Selos: expirado (vermelho), hoje/1–7 dias (laranja), 8–30 (amarelo), >30 (verde). Campo de data limitado a hoje…hoje+15.
- Modais recebem o alvo **só quando são deles** (`alvoDe(tipo)`): passar o mesmo `modal.alvo` para todos fazia o modal de token (fechado) ler `vinculo.sistema.nome` de um município e derrubar a tela ao editar município.

## Agente de renovação de tokens (Betha Admin)

> **Pendente (2026-10-18) — falha no login real:** no Betha de verdade o agente para no passo "login" com "Script failed to execute" em ~2 ms (exceção dentro do comando, não navegação). Estrutura real do login (do `krakion.log`): iscas **ocultas** (`input[type=text]` e `input[type=password]` sem nome) antes de `login:iUsuarios`, `login:lembrar`, `login:senha`, `login:btAcessar` — o agente já usa os visíveis/ids reais. **Suspeita principal, não confirmada:** a página carrega Prototype.js (RichFaces), que troca o `Event` global; `new Event('input')` quebra. Próximo passo: criar eventos com `document.createEvent('HTMLEvents')` + `initEvent` (vale também nos selects e no Emitir) e fazer cada comando capturar o próprio erro e devolver a mensagem real. O Betha falso já tem `window.Event` trocado para reproduzir. O Felipe pediu para parar aqui (custo) e seguir para a API.

Plano: `docs/plans/2026-10-18-desktop-agente-tokens.md`. Configurações → **Betha Admin** (usuário + senha) e, na Central de Tokens, **Renovar no Betha** (ícone ↻ em cada token) ou **Renovar vencidos (N)**.

- **Fluxo real** (capturado com `tools/betha-capture` em 2026-10-18): `admin.betha.com.br/cad_libconversao_usuario.faces` (JSF/RichFaces; sem sessão → `login.faces`). Selects em cascata por AJAX: `mainForm:iRevendas` → `iEntidades` → `iDatabases` → `iSistemas`; `mainForm:diasValidade` (15); `mainForm:senha` + `mainForm:btEmitir` → "Os dados foram gravados com sucesso!", situação ATIVO, token em `mainForm:token`. Sem senha → "Informe a senha do usuário."
- `electron/bethaAdmin/agente.js`: **janela escondida** do Electron (partição em memória `betha-admin` — a sessão não fica em disco) faz login, escolhe as opções esperando cada lista carregar, emite e confere sucesso + UUID novo; para em qualquer mensagem nova (não espera 30 s num erro). "Mostrar o navegador" exibe a janela. Uma renovação por vez (fila no `main.js`). O token volta para a tela, que grava via `POST /api/municipios/:id/tokens` com validade = hoje + dias (`dataMaisDias`).
- `escolha.js` (testado): opção única → ela; entidade/banco = **a da prefeitura do município** ("PREFEITURA MUNICIPAL DE", "PREFEITURA DE", "MUNICIPIO DE" + nome, sem acento/caixa); sistema pelo nome do Krakion. Ambíguo/nada → a tela pergunta e o app **lembra** pelo texto da opção (`entidade|VISEU`, `sistema|TRIBUTOS`…) — lista e "Esquecer" em Configurações → Betha Admin.
- `credenciais.js`: `<userData>/betha-admin.json` com a senha **cifrada por `safeStorage` (DPAPI)**; só o processo main decifra; nunca vai para o banco, a tela ou log (verificado no teste).
- Teste: Betha Admin **falso** local com os mesmos ids, AJAX com latência, login e emissão — `KRAKION_BETHA_ADMIN_URL` aponta o agente para ele (só testes). Cenários: login recusado, Viseu completo, Belém sem "Prefeitura" (pergunta → continua → lembra), senha errada com sessão aberta (erro em 5 s).
- `tools/betha-capture` passou a mascarar campos de senha no corpo (`mascararCorpo.js`, testado) — antes gravava `mainForm:senha` em texto puro.
