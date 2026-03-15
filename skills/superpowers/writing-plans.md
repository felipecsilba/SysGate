---
name: writing-plans
description: Use when about to implement an approved design - create detailed implementation plan before coding
source: https://github.com/obra/superpowers
---

# Writing Plans — Implementation Planning

## Overview

Crie um plano de implementação detalhado ANTES de começar a codar. O plano assume que o engenheiro tem **zero contexto do codebase e gosto questionável** — seja específico.

## When to Use

- Após aprovação do design (brainstorming)
- Feature com 3+ arquivos impactados
- Qualquer mudança não-trivial

## Plan Document Structure

Salve em: `docs/plans/YYYY-MM-DD-<feature-name>.md`

```markdown
# Plano: [Nome da Feature]

**Goal:** [O que estamos construindo e por quê]
**Architecture:** [Como se encaixa no sistema atual]
**Tech Stack:** Node.js + Express + Prisma + React + Vite + Tailwind

---

## Tasks

### Task 1: [Nome descritivo]

**Files:** `backend/src/routes/X.js`

**Steps:**
1. Escrever teste: `npm test -- --grep "descrição"`
2. Verificar falha: [mensagem de erro esperada]
3. Implementar: [código específico]
4. Verificar passa: `npm test`
5. Commit: `git commit -m "feat: descrição"`

**Code:**
\`\`\`js
// Código específico aqui
\`\`\`

**Expected output:**
\`\`\`
Test passed: X assertions
\`\`\`
```

## Task Granularity

Cada task deve:
- Levar **2-5 minutos**
- Representar **uma ação atômica**
- Seguir o ciclo TDD: test → fail → implement → pass → commit
- Ter arquivo alvo específico, não "editar o backend"

## Princípios de Qualidade

| Princípio | Aplicação no SysGate |
|-----------|---------------------------|
| **DRY** | Não duplicar lógica de parsing entre rotas |
| **YAGNI** | Não adicionar filtros/opções não pedidas |
| **TDD** | Test antes de qualquer código |
| **Commits frequentes** | Um commit por task completada |

## Organização de Arquivos

- Siga os padrões existentes (rotas em `routes/`, componentes em `components/`)
- Mantenha rotas nomeadas ANTES de `/:id` no Express
- Campos JSON como String no Prisma — stringify/parse manualmente
- Classes Tailwind: use `.btn-primary`, `.card`, `.input`, `.badge` do `index.css`

## Review Loop

Antes de executar o plano:
1. Revise se cada task tem código específico (não "implementar X")
2. Verifique se o fluxo de dados está mapeado
3. Confirme que rotas seguem padrão do Express (nomeadas antes de /:id)
4. Valide que não há over-engineering (YAGNI)

## Execution

Após plano aprovado:
1. Execute cada task na ordem
2. Marque como concluída apenas após verificação (ver verification-before-completion)
3. Se travar em uma task → pare, re-analise, não force

## Final Rule

```
Plano aprovado → ENTÃO execute task por task com TDD
Sem plano → Sem código
```
