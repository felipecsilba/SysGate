---
name: brainstorming
description: Use when starting any new feature or significant change - design before implementation
source: https://github.com/obra/superpowers
---

# Brainstorming — Design Before Implementation

## The Hard Gate

**DO NOT write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it.**

Even "too simple to need design" projects need this. Assumptions kill projects before they start.

## When to Use

- New feature request
- Significant change to existing behavior
- Refactoring that touches multiple files
- Anything that could be done multiple ways

## Process (8 Steps)

### 1. Explore Context
- Leia os arquivos relevantes do projeto
- Verifique padrões existentes no codebase
- Entenda como a feature se encaixa na arquitetura atual

### 2. Ask Clarifying Questions (One at a Time)
- Foque em: propósito, constraints, critérios de sucesso
- **Uma pergunta por mensagem** — não sobrecarregue o usuário
- Prefira múltipla escolha para facilitar resposta

### 3. Propose 2-3 Approaches
- Apresente alternativas com trade-offs
- Inclua recomendação com justificativa
- Seja específico sobre impacto em cada abordagem

### 4. Present Design
- Descreva o design em seções digestíveis
- Obtenha aprovação após cada seção principal
- Não prossiga até ter aprovação explícita

### 5. Write Design Doc (opcional para mudanças menores)
- Documente o design validado
- Inclua: objetivo, arquitetura, componentes, fluxo de dados

### 6. Spec Review
- Revise a spec antes de implementar
- Corrija problemas identificados

### 7. User Reviews
- Confirme aprovação antes de prosseguir
- Qualquer dúvida → volte ao passo 2

### 8. Transition to Implementation
- Use writing-plans skill para criar o plano de implementação
- **Somente então comece a escrever código**

## Princípios

- **YAGNI**: Não adicione features que não foram pedidas
- **Isolamento**: Cada componente com uma responsabilidade clara
- **Padrões existentes**: Siga o que já existe no sysgate
- **Uma pergunta por vez**: Não sobrecarregue o usuário

## Anti-Patterns

| ❌ | ✅ |
|----|-----|
| "É simples, não precisa de design" | Sempre valide assumptions |
| Apresentar múltiplas perguntas juntas | Uma pergunta por mensagem |
| Propor uma única abordagem | Mostrar 2-3 alternativas |
| Começar a implementar durante o brainstorming | Concluir o design primeiro |

## Estrutura do SysGate — Referência Rápida para Design

Ao propor uma nova feature, considere:
- **Nova rota de backend?** → `backend/src/routes/` + registrar em `index.js`
- **Nova página?** → `frontend/src/pages/` + rota em `App.jsx` + link em `Sidebar.jsx`
- **Novo modelo no banco?** → `backend/prisma/schema.prisma` + `npx prisma db push`
- **Novo store Zustand?** → `frontend/src/stores/`
- **Novo componente compartilhado?** → `frontend/src/components/`
- **API client novo?** → Adicionar métodos em `frontend/src/lib/api.js`

## Final Rule

```
Design approved by user → THEN invoke writing-plans
No approval → No code
```
