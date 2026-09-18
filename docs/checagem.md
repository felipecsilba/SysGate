# Checagem de Cadastros — Documentação do Módulo

**Arquivos:** `frontend/src/pages/Checagem/`, `backend/src/routes/checagem.js`, `backend/src/lib/checagem.js`

---

## Problema que resolve

A spec Swagger da Betha marca como **opcional** campos que na prática são obrigatórios. A API aceita a migração incompleta e o erro só aparece depois, como `500 Internal Server Error` sem mensagem útil.

Caso real que motivou o módulo:

```
dividasPost > dividas > sistemaOrigem
  type: integer · "Código do sistema origem"
  required: false          ← a spec diz opcional
```

Dívida migrada sem `sistemaOrigem` **não permite cancelar o débito** pela rotina do sistema. O `POST /api/dividas` tem 59 campos e apenas 15 marcados `required`.

---

## As duas camadas

### Camada 1 — automática (sai da spec)

Funciona em todos os cadastros desde o primeiro dia, sem cadastro nenhum:

| Checagem | Severidade | Exemplo |
|---|---|---|
| Valor fora do enum | erro | `"EM ABERTO"` quando os válidos são `ABERTO`, `PAGA`, `CANCELADA`… |
| Tipo não convertível | erro | `"1.250,00"` num campo `number` |
| Tipo convertível | alerta | `"1250.00"` (texto) num campo `number` |
| Campo inexistente | alerta | `dataVenc` → sugere `dataVencimento` |
| Obrigatório pela spec ausente | erro | falta `idCreditoTributario` |

### Camada 2 — ensinada (catálogo global)

O implantador liga o toggle **Obrigatório** no campo e escreve numa linha o que quebra sem ele. Esse texto aparece no laudo, transformando "campo faltando" em "campo faltando **e é por isso que não cancela**".

**Escopo global:** vale para todos os municípios e usuários — é regra do sistema Betha, não do município.

---

## Modelo de dados

```prisma
model CampoChecagem {
  id           Int      @id @default(autoincrement())
  sistemaId    Int
  path         String   // "/api/dividas"
  campo        String   // "dividas.sistemaOrigem"
  obrigatorio  Boolean  @default(true)
  observacao   String?
  autorId      Int?
  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt

  @@unique([sistemaId, path, campo])
  @@index([sistemaId, path])
}
```

> **Chaveado por `path`, não por `endpointId`.** Reimportar o Swagger recria todos os endpoints com ids novos; o path não muda. Sem isso, todo conhecimento marcado se perderia a cada reimportação.

Uma marcação **igual à spec e sem observação** é apagada em vez de salva — o catálogo guarda só o que difere da spec ou carrega explicação.

---

## Motor de validação

`backend/src/lib/checagem.js` — funções puras, sem Prisma, cobertas por 19 testes (`checagem.test.js`).

### `achatarCampos(bodySchema)`

Converte o `bodySchema` do parser Swagger numa lista plana com caminhos pontilhados, percorrendo `subFields` recursivamente e descartando o sentinel `_exemplo`.

```
{ campo: 'dividas', subFields: [{ campo: 'sistemaOrigem' }] }
  → [{ caminho: 'dividas' }, { caminho: 'dividas.sistemaOrigem' }]
```

### `validarPayload({ payload, campos, marcacoes })`

Retorna `{ resumo: { erros, alertas, total }, achados[] }`.

Cada achado: `{ severidade, tipo, campo, mensagem, detalhe, origem, sugestao?, indice? }`

- `origem` — `'spec'` ou `'marcacao'` (a UI mostra o badge "marcado por você")
- `indice` — presente só quando o payload é array (envio em lote)

**Regra do pai ausente:** se um objeto pai não existe no payload, reporta o pai e **não** reporta os filhos. Sem isso, um `dividas` faltando geraria 58 achados em vez de 1.

**Sugestão de campo:** para campo desconhecido, procura entre os irmãos por prefixo (`dataVenc` → `dataVencimento`) e depois por distância de edição (`situacaoDivda` → `situacaoDivida`).

---

## Rotas

> Acesso a qualquer autenticado. Dados globais — sem isolamento por usuário ou município.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/checagem/cadastros?sistemaId=` | Lista cadastros (endpoints POST/PUT/PATCH, um por path, POST preferido) + contagem de marcações |
| GET | `/api/checagem/campos?sistemaId=&path=` | Campos achatados com `obrigatorio` já mesclado das marcações |
| PUT | `/api/checagem/campos` | Upsert da marcação por `sistemaId+path+campo` |
| DELETE | `/api/checagem/campos` | Remove a marcação (volta ao que a spec diz) |
| POST | `/api/checagem/validar` | `{ sistemaId, path, payload }` → laudo |

Cadastro = endpoint de escrita. Quando o mesmo path tem POST e PUT, o **POST** representa o grupo (é o payload completo da migração).

---

## Telas

`/checagem` — Ferramentas → Checagem.

Seletor de Sistema + Cadastro no topo (compartilhado), e duas abas:

### Aba Checar JSON
Editor à esquerda (fundo escuro, mono) com Formatar/Limpar; laudo à direita com contadores de erro/alerta no cabeçalho. Aceita objeto único ou array. Achados exibem badge do tipo, o caminho do campo, a mensagem e o detalhe.

### Aba Campos
Tabela de todos os campos do cadastro: caminho + descrição + valores de enum, badge de tipo colorido, toggle **Obrigatório** e observação editável inline (Enter salva, Esc cancela).

- Toggle mostra a origem: `spec` (veio da spec) ou `você` (marcado manualmente)
- Linha marcada ganha fundo `sysgate-50/40`
- Filtros: busca por nome/descrição + "Só obrigatórios"

---

## Fora de escopo

- **Auditoria varrendo dados do município.** Impossível: a API REST tem 358 GETs, 354 deles `/{id}`, e o único parâmetro de query em toda a API é `id`. Não há GET de coleção nem filtro. Consulta em massa só existe em BFC-Script (`Dados.tributos.v2.*.busca`), que roda no Studio.
- **Gerador de BFC-Script de diagnóstico.** Descartado no brainstorming.
- **Regras condicionais** (`se tipoEntrada=VALOR então vlEntrada obrigatório`). O toggle simples cobre o caso pedido; condicional só se provar necessário.
