# Krakion

Repositório do Felipe, analista de implantação da Betha (sistema tributário). Tem dois mundos
que quase não se cruzam. Cada pasta tem o seu `CLAUDE.md`, carregado só quando se trabalha
nela. Este arquivo vai junto para qualquer pasta, então fica curto.

| Mundo | O que é | Pastas | Comece por |
|---|---|---|---|
| **Sistema Krakion** | Ferramenta fullstack: municípios e tokens, proxy para a API Betha, Swagger, envio em lote, chamados com portal externo, portfólio, notas, conhecimento, checagem | `backend/`, `frontend/` (web, VPS) e `desktop/` (Krakion App, Electron, local e offline) | `<pasta>/CLAUDE.md` e `docs/<módulo>.md` |
| **Implantação BFC** | Fórmulas, scripts, fontes dinâmicas, relatórios Jasper e payloads de API a partir da biblioteca de ~34 municípios | `biblioteca/` | `biblioteca/CLAUDE.md` e `biblioteca/CONTEXTO.md` |

## Regras para tudo

- Escrever em português, sem jargão desnecessário.
- **Chamada à API Betha, inclusive GET, quem dispara é o Felipe.** Claude organiza payload, lote e ordem; não envia.
- Antes de mexer num módulo do sistema, ler o `docs/<módulo>.md` dele. Ao terminar, registrar ali o que mudou.
- Bug → skill `systematic-debugging`. Feature ou mudança grande → `brainstorming` e depois `writing-plans` (planos em `docs/plans/AAAA-MM-DD-<nome>.md`). Código → `test-driven-development`. Antes de dizer que funciona → `verification-before-completion`.
- Dados de contribuinte (corpus da biblioteca, `ArquivosTemporarios/`, extratos `.jsonl`) nunca vão para o git nem para serviço externo.

## Onde está cada coisa

| Caminho | Conteúdo |
|---|---|
| `docs/<módulo>.md` | Um por módulo do sistema (chamados, checagem, portfolio, desktop…), com regras e armadilhas |
| `docs/api.md` | Todas as rotas do backend |
| `docs/plans/` | Designs e planos datados; `arquivo/` guarda versões antigas (ex.: o CLAUDE.md de 739 linhas) |
| `.claude/skills/` | Skills do projeto: processo (brainstorming, writing-plans, TDD, debug, verificação, melhorias) e domínio (backend, frontend, banco-de-dados, seguranca, deploy, betha-api, swagger-parser, fluxos) |
| `.claude/agents/` | Especialistas (hoje: `itbi-transferencias`) |
| `scripts/conferir-contexto.js` | Confere que nada do CLAUDE.md antigo se perdeu e mede o contexto carregado |
| `sysgate.bat` / `deploy.bat` | Windows: iniciar/parar backend+frontend / deploy para a VPS |
| `krakion-analise-fable5.md` | Análise e plano das fases do portal externo (histórico) |

## Stack

Backend Node + Express 4 + Prisma + PostgreSQL (migrado de SQLite em 2026-06-11). Web React 18
+ Vite + Tailwind 3 + Zustand. App Electron com Postgres embutido rodando o mesmo backend.
Segurança: Helmet, rate limit, bcrypt, JWT, hCaptcha.

## Comandos

```bash
cd backend  && npm install && npx prisma db push && npm run dev   # API na 3001
cd frontend && npm install && npm run dev                         # web na 3000 (proxy /api → 3001)
cd desktop  && npm install && npm run dev                         # Krakion App
npm test    # em backend/ e em desktop/
```

Deploy padrão (detalhes na skill `deploy`):
`ssh root@187.77.230.138` → `cd /var/www/krakion && git pull && cd frontend && npm run build && cd ../backend && pm2 restart krakion-backend`.
Chamadas à API Betha em produção exigem o tunnel SSH ativo no PC do implantador.
