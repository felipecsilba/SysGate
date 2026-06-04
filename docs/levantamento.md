# Levantamento do Sistema — Junho 2026

> Documento de referência para decisões de direção e estrutura do projeto.
> Data: 04/06/2026 · Atualizado: 04/06/2026

---

## 1. Pendências de curto prazo

| Item | Situação | Ação |
|------|----------|------|
| Docs de módulos | ✅ Concluído | Todos os 8 docs criados em `docs/` |
| Alertas de token vencendo | Badge visual existe, sem notificação ativa | Adicionar alerta no Dashboard |

---

## 2. Estrutura — o que melhorar

### Skills faltando

| Arquivo | Quando usar | Conteúdo principal |
|---------|-------------|-------------------|
| `skills/seguranca.md` | Ao alterar autenticação, adicionar rotas, mudar permissões | JWT, multi-tenant, rate limit, hCaptcha, lockout — hoje espalhado no CLAUDE.md |
| `skills/deploy.md` | Ao fazer deploy ou configurar o tunnel SSH | Sequência exata de comandos, troubleshooting do tunnel, Nginx config, PM2 |
| `skills/testes.md` | Ao escrever qualquer código novo | Estratégia de testes para Express + React, o que cobrir primeiro, ferramentas |
| `skills/betha-api.md` | Ao trabalhar com proxy, envio em lote, extração de IDs | Quirks da API Betha: formato de IDs, estrutura do Swagger deles, padrões de path `/api/...`, campos idEconomico/idGerado/idLote |

### Docs de páginas

| Arquivo | Status |
|---------|--------|
| `docs/cliente-api.md` | ✅ existe |
| `docs/envio-lote.md` | ✅ existe |
| `docs/historico.md` | ✅ existe |
| `docs/municipios.md` | ✅ criado |
| `docs/sistemas.md` | ✅ criado |
| `docs/portfolio.md` | ✅ criado |
| `docs/chamados.md` | ✅ criado |
| `docs/analisador-json.md` | ✅ criado |

### CLAUDE.md — ✅ reorganizado

CLAUDE.md foi reduzido de ~70KB para ~46KB. Seções migradas:
- "Deploy — VPS Hostinger" → `skills/deploy.md` (resumo breve + link no CLAUDE.md)
- "Segurança — padrões e decisões" → `skills/seguranca.md` (idem)
- "Módulo Analisador JSON" → removido (já em `docs/analisador-json.md`)
- "Módulo Chamados" → removido (já em `docs/chamados.md`)

---

## 3. Agentes e Skills específicos

### O que existe hoje (superpowers) é suficiente para o processo

Os 6 arquivos em `skills/superpowers/` cobrem bem o workflow de desenvolvimento (debug, brainstorming, TDD, verificação). Não há necessidade de criar novos superpowers.

### O que falta são skills de domínio (listados na seção 2 acima)

| Skill | Prioridade | Justificativa |
|-------|-----------|---------------|
| `skills/betha-api.md` | Alta | É o domínio mais específico e menos documentado externamente |
| `skills/seguranca.md` | Alta | Padrões de segurança espalhados no CLAUDE.md precisam de local próprio |
| `skills/deploy.md` | Média | Já está no CLAUDE.md, mas isolado facilitaria manutenção |
| `skills/testes.md` | Média | Não existe nenhum teste hoje; definir estratégia antes de qualquer cobertura |

### Agentes Claude customizados

Ainda não se justificam. Os agentes disponíveis (Explore, Plan, Bash, Systematic-debugging) cobrem os casos de uso atuais.

**Quando fizer sentido criar:**
- Se implementar testes E2E → agente específico para rodar e interpretar resultados de teste
- Se crescer para multi-empresa → agente de migração de schema Prisma

---

## 4. Checklist de próximas ações

### Definições (não técnicas)
- [x] Nome escolhido: **Krakion**
- [x] Produto: **ferramenta interna** — não será publicada externamente
- [x] Perfis de usuário definidos:

| Perfil | Descrição |
|--------|-----------|
| **Admin** | Acesso total — gerencia usuários, sistemas, endpoints, portfólio e catálogo |
| **Analista de Implantação** | Acesso operacional — municípios, sandbox, envio em lote, scripts, chamados |
| **Suporte** | Acesso de leitura/acompanhamento — chamados e portfólio; sem acesso a sandbox ou tokens |

### Estrutura de documentação
- [x] Criar `docs/municipios.md`
- [x] Criar `docs/sistemas.md`
- [x] Criar `docs/portfolio.md`
- [x] Criar `docs/chamados.md`
- [x] Criar `docs/analisador-json.md`
- [x] Criar `skills/betha-api.md`
- [x] Criar `skills/seguranca.md`
- [x] Criar `skills/deploy.md`
- [ ] Criar `skills/testes.md`
- [x] Refatorar CLAUDE.md para ser índice com links

---

*Documento gerado em 04/06/2026 com base na análise completa do codebase.*
