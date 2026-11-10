---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing - requires running verification commands and confirming output before making any success claims
source: https://github.com/obra/superpowers
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Backend funcionando | Curl ou browser response 200 | Servidor iniciou sem erro |
| Swagger importado | Endpoints listados no banco | "Parece ter importado" |

## Red Flags - STOP

- Using "should", "probably", "seems to", "parece que"
- Expressing satisfaction before verification ("Pronto!", "Feito!", "Funcionou!")
- About to commit/push without verification
- Relying on partial verification
- Thinking "just this once"
- **ANY wording implying success without having run verification**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Partial check is enough" | Partial proves nothing |
| "Looks correct" | Looking ≠ running |

## Key Patterns

**Backend funcionando:**
```
✅ [curl http://localhost:3001/api/municipios] [Ver: JSON com lista] "Backend OK"
❌ "Servidor iniciou sem erros, deve estar funcionando"
```

**Endpoint criado:**
```
✅ [GET /api/endpoints | contar registros] "X endpoints importados"
❌ "Swagger foi importado com sucesso"
```

**Bug corrigido:**
```
✅ [Reproduzir o bug original] [Ver que não ocorre mais] "Bug corrigido"
❌ "Fiz a correção, deve funcionar agora"
```

**Prisma schema aplicado:**
```
✅ [npx prisma db push | Ver "Your database is now in sync"] "Schema aplicado"
❌ "Schema parece estar correto"
```

## Quando Aplicar no SysGate

**SEMPRE antes de:**
- Dizer que uma rota está funcionando
- Afirmar que dados foram salvos no banco
- Confirmar que o proxy está executando corretamente
- Dizer que o Swagger foi importado
- Afirmar que o frontend está exibindo dados corretamente
- Mover para a próxima tarefa

## The Bottom Line

**No shortcuts for verification.**

Run the command. Read the output. THEN claim the result.

This is non-negotiable.
