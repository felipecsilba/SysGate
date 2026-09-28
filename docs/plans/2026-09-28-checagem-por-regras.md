# Plano: Checagem por Regras — duas frentes (API e Fonte)

**Goal:** Fazer a Checagem responder a pergunta que importa — *"o que falta neste
registro para ele funcionar?"* — em vez de apenas *"este payload bate com a spec?"*.
Motivado por um caso real: 1445 dívidas do Viseu declaram crédito
`RECEITAS_DIVERSAS` e não apontam receita diversa; 1008 delas estão em ABERTO,
somando R$ 161.222,86, e quebram o parcelamento com `[E001]`.

**Architecture:** O módulo passa a ter **duas frentes separadas**, porque os dois
mundos falam línguas diferentes e misturá-los produz falso positivo:

| | Checagem por API | Checagem por Fonte |
|---|---|---|
| entrada | payload de migração `{ idIntegracao, dividas: {...} }` | retorno de BFC-Script |
| vocabulário | `idPessoa`, `valorInscrito`, `sistemaOrigem` | `contribuinte.id`, `valorTributoInscrito`, `idReceitaDiversa` |
| enums | string direta (`"ATIVO"`) | objeto `{ descricao, valor }` |
| valida com | spec Swagger importada + regras + notas | regras + notas |
| catálogo de campos | `Endpoint.bodySchema` (já existe) | `FonteDados` (novo) |

Separar elimina por construção o problema que apareceu na calibragem: a regra do
`sistemaOrigem` acusava ausência em todo registro lido da base, porque a fonte
BFC simplesmente não devolve esse campo. Na frente por API ela vale; na frente
por Fonte ela nem existe.

**Tech Stack:** Node.js + Express + Prisma (PostgreSQL) + React + Vite + Tailwind

---

## O que JÁ está em produção (não refazer)

- Modelo `NotaChecagem` + CRUD em `/api/checagem/notas`
- Seção **"Falta fora do JSON"** no laudo (`AbaChecar.jsx`)
- **21 notas de cadastro** gravadas (imóveis 5, créditos 4, dívidas 3, econômicos 3,
  indexadores 2, receitas diversas 2, cálculos 2)
- **8 marcações de campo** com observação
- `lib/checagem.js` com **19 testes** — o motor de spec. **Não quebrar.**

---

## Decisões já validadas contra dado real

Cada uma custou um erro durante a calibragem. Estão aqui para não se repetirem.

1. **Vazio = `null` OU `0` OU `""` OU `"0"`.** Bases convertidas usam zero como
   ausência. Testar só `!= null` deu falso positivo em 1445 registros.
2. **Enums da fonte vêm como objeto** `{ descricao, valor }` — comparar pelo
   `.valor`. `String(obj)` vira `[object Object]` e a condição nunca casa.
3. **Regra precisa saber onde tem autoridade.** Campo que a fonte não devolve não
   pode virar "ausente".
4. **Nada de valor inventado no "esperado".** Mostrar a forma
   (`<id da receita diversa>`), nunca um número plausível.
5. **Toda regra roda contra um dump conhecido-bom antes de valer.** A base de
   teste (tudo criado pela tela) é o gabarito: regra que acusa erro nela está errada.

---

## Fase 1 — Motor de regras + Checagem por Fonte

Resolve o caso real. Não depende do catálogo de fontes.

### Task 1.1: Motor puro de regras

**Files:** `backend/src/lib/regrasChecagem.js`, `backend/src/lib/regrasChecagem.test.js`

**Steps:**
1. Escrever teste: `node --test src/lib/regrasChecagem.test.js`
2. Verificar falha: `Cannot find module './regrasChecagem'`
3. Implementar
4. Verificar passa: `npm test` (os 19 de `checagem.test.js` seguem passando)
5. Commit: `feat(checagem): motor puro de avaliacao de regras`

**Code:**

```js
// backend/src/lib/regrasChecagem.js — PURO, sem Prisma (igual a lib/checagem.js)

// Bases convertidas usam 0 como ausencia. Ver docs/plans, decisao 1.
function vazio(v) {
  const d = desembrulhar(v)
  return d === undefined || d === null || d === '' || d === 0 || d === '0' || d === 'null'
}

// A fonte BFC devolve enum como { descricao, valor }. Ver decisao 2.
function desembrulhar(v) {
  if (v && typeof v === 'object' && !Array.isArray(v) && v.valor !== undefined) return v.valor
  return v
}

function pegar(obj, caminho) {
  return caminho.split('.').reduce((a, k) => (a == null ? undefined : a[k]), obj)
}

/**
 * regra: { id, nome, porque, onde[], quando?, esperado?, severidade, naoSabemos? }
 *   onde     — caminhos onde o dado pode estar (o primeiro preenchido vale)
 *   quando   — { caminhos[], igualA[] } aplica a regra so quando bate
 * registros: array ja normalizado
 */
function avaliarRegras({ registros, regras }) {
  return regras.map((regra) => {
    const faltando = []
    let aplicaveis = 0
    registros.forEach((reg, i) => {
      if (regra.quando && !condicaoBate(reg, regra.quando)) return
      aplicaveis++
      const achou = regra.onde.some((c) => !vazio(pegar(reg, c)))
      if (!achou) faltando.push({ id: identificar(reg, i), registro: reg })
    })
    return {
      regraId: regra.id,
      aplicaveis,
      faltando,
      severidade: faltando.length === 0 ? 'ok' : regra.severidade,
    }
  })
}

function condicaoBate(reg, quando) {
  const valor = String(quando.caminhos.map((c) => pegar(reg, c)).find((v) => v != null) ?? '')
  const alvo = desembrulhar(valor)
  return quando.igualA.map((x) => String(x).toUpperCase()).includes(String(alvo).toUpperCase())
}

function identificar(reg, i) {
  const v = ['id', 'idDivida', 'idDebito', 'idIntegracao'].map((c) => pegar(reg, c)).find((x) => x != null)
  return v == null ? `#${i + 1}` : String(v)
}

module.exports = { avaliarRegras, vazio, desembrulhar, pegar }
```

**Testes mínimos (o gabarito vira teste):**

```js
// 1445 casos viraram 3 asserções
test('zero conta como ausencia', () => {
  const r = avaliarRegras({ registros: [{ idReceitaDiversa: 0 }], regras: [REGRA_RD] })
  assert.equal(r[0].faltando.length, 1)
})
test('enum como objeto e desembrulhado', () => { /* tipoReferente: {valor:'RECEITAS_DIVERSAS'} */ })
test('gabarito da base de teste nao acusa nada', () => { /* 5 dividas criadas pela tela */ })
test('divida 285503526 do Viseu e acusada, as outras 6 nao', () => { /* 1 de 7 */ })
```

### Task 1.2: Parser tolerante de entrada

**Files:** `backend/src/lib/parseEntrada.js` + teste

O Studio devolve **uma linha por registro, com hora na frente**. Sem isso o
usuário limpa na mão toda vez.

```js
// aceita: array JSON | { data|content|list: [] } | NDJSON | linhas "11:52:01 - {...}"
function parseEntrada(texto) {
  const t = texto.trim()
  try {
    const j = JSON.parse(t)
    if (Array.isArray(j)) return j
    for (const k of ['data', 'content', 'list', 'itens']) if (Array.isArray(j[k])) return j[k]
    return [j]
  } catch { /* nao e JSON unico: tenta linha a linha */ }

  const registros = []
  for (const linha of t.split(/\r?\n/)) {
    const semPrefixo = linha.replace(/^\s*\d{2}:\d{2}:\d{2}\s*-\s*/, '').trim()
    if (!semPrefixo.startsWith('{')) continue
    try { registros.push(JSON.parse(semPrefixo)) } catch { /* linha truncada: ignora */ }
  }
  return registros
}
```

**Commit:** `feat(checagem): parser tolerante (array, NDJSON, log do Studio)`

### Task 1.3: Modelo `RegraChecagem`

**Files:** `backend/prisma/schema.prisma`

```prisma
model RegraChecagem {
  id           Int      @id @default(autoincrement())
  sistemaId    Int
  frente       String   // "api" | "fonte"  — onde a regra tem autoridade
  cadastro     String   // "/api/dividas" (api) ou "dividas" (fonte)
  nome         String
  porque       String   // o que quebra sem isso, na linguagem do problema
  onde         String   // JSON: ["idReceitaDiversa", "referente.codigo"]
  quando       String?  // JSON: { caminhos: [...], igualA: [...] }
  esperado     String?  // a FORMA, nunca valor inventado
  naoSabemos   String?
  severidade   String   @default("erro") // erro | alerta
  ordem        Int      @default(0)
  autorId      Int?
  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt

  sistema Sistema @relation(fields: [sistemaId], references: [id], onDelete: Cascade)

  @@index([sistemaId, frente, cadastro])
}
```

`npx prisma db push` local e na VPS. **Commit:** `feat(checagem): modelo RegraChecagem`

### Task 1.4: Rotas

**Files:** `backend/src/routes/checagem.js`

Nomeadas antes de `/:id` (padrão do projeto):

```
GET    /api/checagem/regras?sistemaId=&frente=&cadastro=
POST   /api/checagem/regras
PUT    /api/checagem/regras/:id
DELETE /api/checagem/regras/:id
POST   /api/checagem/verificar   { sistemaId, frente, cadastro, texto }
```

`/verificar` faz: `parseEntrada` → carrega regras da frente+cadastro → `avaliarRegras`
→ carrega `NotaChecagem` → quando `frente === 'api'`, roda também
`validarPayload` do `lib/checagem.js` e junta os achados.

**Commit:** `feat(checagem): rotas de regras e verificacao`

### Task 1.5: Seed das regras já descobertas

**Files:** `backend/prisma/seed-regras-checagem.js` (idempotente, não destrutivo)

Primeira regra, com 1445 provas atrás dela:

```js
{ frente: 'fonte', cadastro: 'dividas',
  nome: 'Receita vinculada quando o credito e Receita Diversa',
  porque: 'Sem o vinculo o parcelamento falha com [E001] erro interno no servidor.',
  onde: ['idReceitaDiversa', 'idReceitaDiversaLancamento', 'referente.codigo'],
  quando: { caminhos: ['tipoReferente', 'creditoTributario.tipoCadastro'], igualA: ['RECEITAS_DIVERSAS'] },
  esperado: '"idReceitaDiversa": <id da receita diversa>',
  severidade: 'erro' }
```

Mais: contribuinte, crédito, data de inscrição, valor inscrito, livro/folha.
**Commit:** `feat(checagem): regras iniciais de divida`

### Task 1.6: Tela — aba "Por Fonte"

**Files:** `frontend/src/pages/Checagem/AbaPorFonte.jsx`, `index.jsx`

Laudo agrupado por regra, do protótipo já validado com você:
contagem por regra → trecho do registro (contexto, linha vermelha do que está lá,
linha verde do esperado) → até 3 exemplos → lista de ids com botão copiar →
seção "O que não sabemos" → notas do cadastro.

**Commit:** `feat(checagem): aba Por Fonte com laudo agrupado`

---

## Fase 2 — Catálogo de fontes, filtros e gerador de script

Depende da Fase 1. É o que fecha o ciclo: o módulo passa a dizer **como obter** o
dado, não só a conferi-lo.

### Task 2.1: Modelo `FonteDados`

```prisma
model FonteDados {
  id          Int     @id @default(autoincrement())
  sistemaId   Int
  nome        String  // "dividas"
  path        String  // "/dividas"
  operacao    String  // "busca"
  natureza    String  // "LEITURA"
  descricao   String?
  tipoRetorno String?
  filtros     String  // JSON [{ campo, tipo, descricao, eh_enum }]
  campos      String  // JSON
  enums       String  // JSON { TipoCadastro: { values: [...] } }
  @@unique([sistemaId, nome, path, operacao])
}
```

### Task 2.2: Importação do catálogo

`POST /api/checagem/fontes/importar` recebendo `catalogo_v2.json`
(574 fontes, ~12,6 MB — precisa de parser com limite maior nessa rota, como já
é feito para anexos no `index.js`).

### Task 2.3: Construtor de filtros

Botão **+ filtro**: lista os filtros da fonte (117 em `dividas`) com busca.
`eh_enum: true` → dropdown com os valores reais do enum. `Long`/`Integer` →
campo numérico. Monta o `criterio`:

```
tipoReferente = 'RECEITAS_DIVERSAS' and idReceitaDiversa is null
```

### Task 2.4: Gerador de script

Template + os filtros escolhidos → script BFC pronto para copiar, com o `percorrer`,
o `JSON.escrever` (maiúsculas — `Json` não existe) e o aviso de zero-como-ausência.

---

## Fase 3 — Checagem por API absorve a atual

A aba "Checar JSON" de hoje vira **"Por API"**: mesma tela do laudo novo, e a
validação contra spec (`lib/checagem.js`) entra como mais uma fonte de achados,
ao lado das regras de frente `api`. Nada do motor de spec muda; os 19 testes
continuam valendo.

---

## Fora de escopo (YAGNI)

- Ler a base direto pela API da tela (token de sessão expira; decidido em 28/09)
- Corrigir o enum incompleto de `pessoas.situacao` (você optou por deixar)
- Tela de edição de notas de cadastro (gravadas por script hoje)
- Correção em massa dos 1445 registros — é decisão da prefeitura, não do módulo

---

## Verificação antes de dar por concluído

1. `npm test` no backend: 19 testes antigos + novos do motor, todos passando
2. Dump da base de teste (5 dívidas criadas pela tela) → **zero achados**
3. Dump do Francisco (Viseu, parcelamento funciona) → **zero achados**
4. Dump do Elias (Viseu) → **exatamente 1 achado**, a dívida 285503526
5. `npm run build` no frontend sem erro
6. Deploy: `git pull && npx prisma db push && npx prisma generate && npm run build && pm2 restart`
