# Plano: Fase 1 — Economia de contexto (CLAUDE.md por pasta + skills registradas)

**Goal:** tirar ~25 mil tokens fixos de toda conversa e de todo subagente, separando o
Sistema Krakion e a Implantação BFC em `CLAUDE.md` por pasta, sem perder nenhuma informação.
**Architecture:** design aprovado em `docs/plans/2026-11-09-estrutura-agentes-grafo.md`
(decisão D6). Só documentação muda; nenhum código de produção é tocado.
**Tech Stack:** Markdown + um script Node de conferência (sem dependências).

---

## Regras de execução

- **Mover, nunca reescrever de memória.** O texto vai do arquivo antigo para o destino; só
  se corta o que já existe igual no destino.
- **A conferência é o teste.** Ela passa no começo (tudo ainda está na raiz) e tem que
  continuar passando depois de cada bloco.
- **Commits**: um por bloco (A–E), **só com o ok do Felipe**. O `CLAUDE.md` já tem
  alterações não commitadas de outro trabalho. No bloco E, ou elas entram junto com a
  reescrita, ou são commitadas antes, separadas — o Felipe decide na hora.

---

## Bloco A — Rede de segurança

### Task A1: Arquivar o CLAUDE.md original

**Files:** `docs/plans/arquivo/CLAUDE-2026-11-09.md` (novo)

1. Copiar o `CLAUDE.md` atual (cópia de trabalho, com as alterações não commitadas) para o arquivo.
2. Conferir: `wc -c` igual nos dois (102.096 bytes).

Esse arquivo é a fonte da conferência e o histórico. Não é carregado automaticamente
(o Claude Code só carrega arquivos chamados `CLAUDE.md`).

### Task A2: Script de conferência

**Files:** `scripts/conferir-contexto.js`, `scripts/conferir-contexto.excecoes.json` (novos)

O script lê o arquivo arquivado e extrai os **itens** a preservar:

| Item | Como é extraído | Passa quando |
|---|---|---|
| Rota | linha de tabela `\| MÉTODO \| /api/... \|` | o par método + caminho aparece em algum destino |
| Padrão / regra | título em negrito de cada `- **...**` (Padrões importantes, Segurança) | o título aparece em algum destino |
| Seção de UI | cada `###` das seções Sandbox e Envio em Lote | o título aparece em algum destino |
| Arquivo da árvore | nome de arquivo citado na árvore | o arquivo existe no repositório **ou** é citado em algum destino |

Destinos: todo `CLAUDE.md` (exceto o arquivado), `docs/**/*.md` e `.claude/skills/**/SKILL.md`.
Item que foi reescrito ou descartado de propósito vai para o arquivo de exceções, com motivo.
Saída: lista do que falta (exit 1 se faltar algo) e o tamanho, em bytes e tokens estimados
(bytes ÷ 4), do que é carregado numa conversa nova na raiz: `CLAUDE.md` + `MEMORY.md`.

**Rodar:** `node scripts/conferir-contexto.js`
**Esperado agora:** `0 itens sem destino` (tudo ainda está na raiz) e ~25,5 mil tokens.

---

## Bloco B — Destinos no `docs/`

Cada task: abrir o doc de destino, comparar com o trecho do CLAUDE.md e **acrescentar só o
que falta**, numa seção "Regras e armadilhas" (ou na seção que já trata do assunto). Rodar a
conferência no fim de cada task.

| Task | Trecho do CLAUDE.md | Destino |
|---|---|---|
| B1 | Rotas da API (linhas 280–503) | `docs/api.md` (novo), copiado inteiro, com um parágrafo de abertura |
| B2 | Portfólio (11 itens) + ModalCatalogo | `docs/portfolio.md` |
| B3 | Chamados (18 itens) + Fases 1–4 do portal da seção Segurança | `docs/chamados.md` |
| B4 | Notas (6) e Conhecimento (7) | `docs/notas.md`, `docs/conhecimento.md` |
| B5 | Checagem (9) | `docs/checagem.md` |
| B6 | Municípios e tokens (codigoIBGE, tokens, validade, isolamento) | `docs/municipios.md` |
| B7 | Sistemas e Swagger (reimportar, parser, array bodies, HTML, urlBase, Swagger exclusivo, painel) | `docs/sistemas.md` |
| B8 | Scripts BFC vs Relatórios + Relatórios JRXML | `docs/scripts-relatorios.md` (novo, curto) |
| B9 | UI — Sandbox (57 linhas) e Envio em Lote (42 linhas) | `docs/sandbox-unificado.md`, `docs/envio-lote.md` |
| B10 | Analisador JSON, histórico sem token, idGerado no proxy | `docs/analisador-json.md`, `docs/historico.md` |

**Commit do bloco (com ok):** `docs: leva o detalhe de cada modulo do CLAUDE.md para docs/`

---

## Bloco C — Um CLAUDE.md por pasta

Cada um com no máximo 150 linhas. Árvore só com o que **não** é óbvio pelo nome do arquivo.

### Task C1: `backend/CLAUDE.md`
Regras do Postgres (Prisma singleton, `mode: 'insensitive'`, `$queryRaw` com aspas), rotas
nomeadas antes de `/:id`, JSON como String, sentinel `_exemplo`, segurança ativa (JWT,
roles, multi-tenant com 404, lockout, CORS, senha mínima, uploads da Fase 0), Fase 0 e
ação manual pendente do Twilio, árvore de `lib/` e `routes/`, testes (`npm test`),
comandos, ponteiro para `docs/api.md` e `docs/<módulo>.md`.

### Task C2: `frontend/CLAUDE.md`
Safelist do Tailwind (não remover), identidade visual Krakion Labs e paleta sysgate, padrões
visuais, stores e chaves de localStorage, chunks obsoletos após deploy, portal externo
(store e Axios separados), MeuPerfil, toggleAdmin, árvore de `pages/` e `components/`, comandos.

### Task C3: `desktop/CLAUDE.md`
Bloco "Krakion Desktop" + árvore de `desktop/` + o essencial de `docs/desktop.md` (portas
5433/3101, banco embutido, pasta de dados que não se renomeia, `db push` sem
`--accept-data-loss`, testes). Ponteiro para `docs/desktop.md` e o bloco "Retomar aqui".

### Task C4: `biblioteca/CLAUDE.md`
Absorve `biblioteca/LEIAME-KRAKION.md` inteiro (git × fora do git, quem lê a pasta, regras)
+ as armadilhas de BFC-Script + onde fica cada coisa (`_BIBLIOTECA`, `_CONHECIMENTO`,
`FontesDeDados`, corpus) + ponteiro para `CONTEXTO.md` e `README.md`.
Depois: apagar `LEIAME-KRAKION.md` e trocar as referências em `docs/desktop.md`.

**Commit do bloco (com ok):** `docs: CLAUDE.md por pasta (backend, frontend, desktop, biblioteca)`

---

## Bloco D — Skills registradas

### Task D1: Mover as 15 skills
`git mv skills/<nome>.md .claude/skills/<nome>/SKILL.md`, e as de `skills/superpowers/` também
(`.claude/skills/brainstorming/SKILL.md` etc., sem a pasta intermediária).

### Task D2: Frontmatter
As 9 que não têm `name`/`description` ganham. A `description` diz **quando** usar, para o
Claude chamar sozinho. Exemplos:
- `betha-api`: "Use ao trabalhar com proxy, envio em lote, idLote ou IDs da API Betha…"
- `banco-de-dados`: "Use ao mexer no schema.prisma, em queries Prisma ou no Postgres…"

As 6 que já têm frontmatter são conferidas (a de `writing-plans`/`brainstorming` cita "SysGate").

### Task D3: Referências
Trocar `skills/...` por `.claude/skills/<nome>/SKILL.md` em `docs/chamados.md`,
`docs/desktop.md`, `krakion-analise-fable5.md` e nas próprias skills (`betha-api`,
`melhorias`, `seguranca`, `using-superpowers`). Conferir com `grep -rn "skills/"`.

**Commit do bloco (com ok):** `chore: skills viram skills registradas em .claude/skills`

---

## Bloco E — Raiz e verificação

### Task E1: Reescrever o `CLAUDE.md` da raiz (≤ 80 linhas)
1. O que é o repositório (1 parágrafo).
2. Os dois mundos: tabela com pastas e onde está o `CLAUDE.md` de cada um.
3. Regras para tudo: idioma, "chamada à API Betha quem dispara é o Felipe", ler o `docs/<módulo>.md` antes de mexer num módulo, design antes de feature (skills de processo).
4. Onde está cada coisa: `docs/`, `docs/api.md`, `docs/plans/`, `.claude/skills/`, `.claude/agents/`.
5. Stack em 3 linhas.
6. Comandos: subir backend, frontend e desktop; deploy em 2 linhas + skill `deploy`.

### Task E2: Conferência
`node scripts/conferir-contexto.js` → **0 itens sem destino**. Faltou algo: levar ao destino
certo ou registrar na lista de exceções com motivo. Nunca registrar exceção só para passar.

### Task E3: Medida
Anotar no design o antes e o depois (tokens estimados de `CLAUDE.md` + `MEMORY.md`).
Meta: de ~25,5 mil para menos de 4 mil.

### Task E4: Testes
`npm test` em `backend/` e em `desktop/`. Nada de código mudou; os testes só confirmam isso.

### Task E5: Conferência manual (Felipe)
Abrir uma conversa nova com a pasta `biblioteca/` e rodar `/memory`. Deve listar o
`CLAUDE.md` da raiz e o de `biblioteca/`, e **não** os de backend/frontend/desktop.

### Task E6: Fechar
Marcar a Fase 1 como entregue no design, com a medida. Apagar `skills/` vazia.

**Commit do bloco (com ok):** `docs: CLAUDE.md da raiz vira indice dos dois mundos`

---

## Fora do escopo

- Grafo, agentes executores e corpus (Fases 2–4).
- Reescrever o conteúdo dos `docs/` além de acrescentar o que falta.
- Mudar a memória (`MEMORY.md` já é um índice curto).
