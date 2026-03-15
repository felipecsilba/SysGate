---
name: using-superpowers
description: Meta-skill — how to use all superpowers skills when working on the sysgate
source: https://github.com/obra/superpowers
---

# Using Superpowers Skills

## Overview

Este arquivo descreve QUANDO e COMO usar cada skill do superpowers ao trabalhar no sysgate.

## Instruction Priority

1. **Instruções explícitas do usuário** (CLAUDE.md, mensagens diretas) — maior prioridade
2. **Superpowers skills** — guiam o processo
3. **Comportamento padrão** — menor prioridade

Se o usuário disser "não use TDD agora", seguir o usuário.

## The Rule

**Invoque o skill relevante ANTES de qualquer resposta ou ação.** Mesmo 1% de chance de um skill se aplicar = invocar o skill.

## Fluxo de Decisão

```
Mensagem do usuário recebida
  ↓
É um bug/erro/comportamento inesperado?
  → SIM: usar systematic-debugging primeiro
  → NÃO: continuar

É uma nova feature/mudança significativa?
  → SIM: usar brainstorming primeiro
  → NÃO: continuar

Vai escrever código?
  → SIM: usar test-driven-development
  → NÃO: continuar

Vai afirmar que algo está feito/funcionando?
  → SIM: usar verification-before-completion
  → NÃO: responder normalmente
```

## Quando Usar Cada Skill

| Situação | Skill |
|----------|-------|
| Bug reportado, teste falhando, erro inesperado | `systematic-debugging` |
| Nova feature, refactoring, mudança de comportamento | `brainstorming` → `writing-plans` |
| Implementando qualquer código | `test-driven-development` |
| Antes de dizer "está funcionando" | `verification-before-completion` |

## Skill Priority

1. **Skills de processo** primeiro: brainstorming, debugging
2. **Skills de implementação** depois: TDD, writing-plans

Exemplo:
- "Adicione nova rota de relatório" → brainstorming primeiro, depois TDD
- "Proxy está retornando 401" → systematic-debugging primeiro, depois TDD para o fix

## Red Flags

Estes pensamentos significam STOP:

| Pensamento | Realidade |
|-----------|-----------|
| "É simples, não precisa de processo" | Skills existem exatamente para isso |
| "Vou explorar o código primeiro" | Skills dizem COMO explorar. Cheque primeiro. |
| "Já sei o que fazer" | Saber o conceito ≠ usar o skill |
| "Este caso é diferente" | Não é. Use o skill. |
| "Só vou fazer esta coisa primeiro" | Cheque ANTES de fazer qualquer coisa |

## Skill Types

**Rígidos** (TDD, debugging, verification): Siga exatamente. Não adapte a disciplina.

**Flexíveis** (brainstorming, writing-plans): Adapte os princípios ao contexto.

## Skills Disponíveis (skills/superpowers/)

| Skill | Arquivo |
|-------|---------|
| Como usar todos os skills | `using-superpowers.md` |
| Design antes de implementar | `brainstorming.md` |
| Criar plano de implementação | `writing-plans.md` |
| Desenvolvimento orientado a testes | `test-driven-development.md` |
| Debugging sistemático | `systematic-debugging.md` |
| Verificar antes de concluir | `verification-before-completion.md` |
