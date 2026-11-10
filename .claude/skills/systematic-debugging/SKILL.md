---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
source: https://github.com/obra/superpowers
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue:
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - Read stack traces completely
   - Note line numbers, file paths, error codes

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - Does it happen every time?
   - If not reproducible → gather more data, don't guess

3. **Check Recent Changes**
   - What changed that could cause this?
   - Git diff, recent commits, new dependencies, config changes

4. **Gather Evidence in Multi-Component Systems**

   **QUANDO o sistema tem múltiplos componentes (frontend → backend → banco, proxy → API):**

   **ANTES de propor fixes, adicione instrumentação de diagnóstico:**
   ```
   Para CADA fronteira de componente:
     - Log do que entra no componente
     - Log do que sai do componente
     - Verificar propagação de config/env
     - Checar estado em cada camada

   Executar UMA vez para coletar evidências mostrando ONDE quebra
   ENTÃO analisar para identificar o componente com falha
   ENTÃO investigar esse componente específico
   ```

   **Exemplo para SysGate (proxy falhando):**
   ```js
   // Layer 1: Frontend → Backend
   console.log('[DEBUG] Request enviado:', { municipioId, path, metodo });

   // Layer 2: Backend proxy.js
   console.log('[DEBUG] Município carregado:', municipio?.nome, 'urlBase:', municipio?.urlBase);
   console.log('[DEBUG] URL montada:', municipio.urlBase + path);

   // Layer 3: API
   console.log('[DEBUG] Response status:', response.status, 'headers:', response.headers);
   ```

5. **Trace Data Flow**
   - Where does bad value originate?
   - What called this with bad value?
   - Keep tracing up until you find the source
   - Fix at source, not at symptom

### Phase 2: Pattern Analysis

**Find the pattern before fixing:**

1. **Find Working Examples** — Locate similar working code in the codebase
2. **Compare Against References** — Read reference implementation COMPLETELY
3. **Identify Differences** — List every difference, however small
4. **Understand Dependencies** — What settings, config, environment is assumed?

### Phase 3: Hypothesis and Testing

**Scientific method:**

1. **Form Single Hypothesis** — State clearly: "I think X is the root cause because Y"
2. **Test Minimally** — Make the SMALLEST possible change to test hypothesis
3. **Verify Before Continuing** — Did it work? Yes → Phase 4. Didn't work? Form NEW hypothesis. DON'T add more fixes on top.
4. **When You Don't Know** — Say "I don't understand X". Don't pretend to know.

### Phase 4: Implementation

**Fix the root cause, not the symptom:**

1. **Create Failing Test Case** — Simplest possible reproduction antes de corrigir
2. **Implement Single Fix** — Address the root cause. ONE change at a time. No "while I'm here" improvements.
3. **Verify Fix** — Test passes? No other tests broken? Issue actually resolved?
4. **If Fix Doesn't Work** — STOP. Count fixes tried.
   - If < 3: Return to Phase 1, re-analyze with new information
   - **If ≥ 3: STOP e questione a arquitetura (step 5 abaixo)**
   - DON'T attempt Fix #4 without architectural discussion

5. **If 3+ Fixes Failed: Question Architecture**

   **Padrão indicando problema arquitetural:**
   - Cada fix revela novo acoplamento/problema em lugar diferente
   - Fixes requerem "refactoring massivo" para implementar
   - Cada fix cria novos sintomas em outro lugar

   **STOP e questione os fundamentos. Discuta antes de tentar mais fixes.**

## Red Flags - STOP and Follow Process

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "One more fix attempt" (when already tried 2+)

**ALL of these mean: STOP. Return to Phase 1.**

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "I see the problem, let me fix it" | Seeing symptoms ≠ understanding root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question pattern, don't fix again. |

## Problemas Comuns no SysGate

| Sintoma | Onde investigar |
|---------|----------------|
| Proxy retorna 401 | municipio.token no banco, Authorization header montado |
| Swagger retorna 422 | URL é HTML? extrairSpecUrlDoHtml() |
| Endpoint não encontrado | Rota nomeada antes de `/:id`? |
| URL duplica `/api/api/` | urlBase do município termina com `/api`? |
| Body vazio enviado | bodySchema no banco, parse do JSON, filtro `_exemplo` |
| CORS error | Middleware CORS no index.js, proxy do Vite |
| Prisma DLL locked | Parar backend antes de `npx prisma generate` |

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare | Identify differences |
| **3. Hypothesis** | Form theory, test minimally | Confirmed or new hypothesis |
| **4. Implementation** | Create test, fix, verify | Bug resolved, tests pass |

## Final Rule

```
Symptom fix without root cause = not debugging
```

Random fixes create new bugs. Systematic investigation finds and prevents them.
