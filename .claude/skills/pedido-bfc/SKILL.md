---
name: pedido-bfc
description: "Use quando o Felipe pedir para criar, adaptar ou corrigir uma fórmula, script BFC, fonte dinâmica, crítica, relatório Jasper ou payload para a API de migração da Betha — ou perguntar o que a biblioteca já tem para isso. Roteiro do orquestrador: entender, consultar o grafo, decidir quem faz, revisar, entregar e promover depois de validado."
---

# Pedido BFC — roteiro do orquestrador

Você (a sessão principal) **pensa e decide**; os executores escrevem; o revisor confere.
Contexto de cada um: só o necessário. Regras da casa e armadilhas: `biblioteca/CLAUDE.md`.

## 1. Entender

- O que é: fórmula (qual TIPO?), script, fonte dinâmica, crítica, relatório ou payload de API.
- Município, área, e se já existe algo parecido validado.
- **Relatório ou script novo: estratégia antes de código.** Proponha em tabela curta (o que faz,
  filtros como constantes internas, o que fica de fora) e espere o ok. O Felipe interrompe se você
  sair escrevendo.

## 2. Consultar o grafo (até 3 consultas)

```bash
node biblioteca/_GRAFO/grafo.mjs busca <termo> [--tipo template|funcao|conhecimento] [--area <area>]
node biblioteca/_GRAFO/grafo.mjs no <id>
```

Pergunta só de "o que existe / onde está / já fizemos?" → responda com o grafo, ou mande para o
`bfc-leitor` (Haiku) se precisar abrir arquivos.

## 3. Decidir quem faz

| Situação | Quem |
|---|---|
| Ajuste de poucas linhas, correção pontual apontada pelo log | **Você mesmo** — delegar custa mais (o agente começa do zero) |
| Peça nova ou adaptação grande de template | Executor: `bfc-scripts`, `bfc-formulas`, `bfc-relatorios` ou `bfc-api` |
| Diagnóstico de ITBI/transferência | `itbi-transferencias` |
| Achar e resumir material da base | `bfc-leitor` |

## 4. Resumo para o executor (curto; não cole arquivo inteiro)

```
Pedido: <nas palavras do Felipe>
Município: <nome> · Área: <area:x> · Tipo de peça: <…>
Base: <ids do grafo + caminhos>
Fontes: <fonte:x, …>
Decisões já tomadas com o Felipe: <estratégia aprovada, parâmetros, o que fica de fora>
Salvar em: biblioteca/_RASCUNHOS-TESTES/<Município>/<AAAA-MM-DD> <nome>.txt
```

API: o `bfc-api` **nunca** envia nada — quem envia é o Felipe, inclusive GET.

## 5. Revisar antes de entregar

```bash
node biblioteca/_FERRAMENTAS/revisar-bfc.mjs <arquivo> [--formula]
```

E leia o que mudou em relação ao template de base: o que foi validado continua igual? A fonte
existe (`no fonte:<x>`)? O que não é portável está marcado? Erro do revisor não chega ao Felipe.

## 6. Entregar

Caminho do arquivo, o que mudou, **o que conferir no Studio** (log, total, faixa de teste) e as
perguntas para o município. Alerta de risco em destaque (⛔ irreversível, ⚠ revisar).

**Registre a entrega** com uma linha nova em `biblioteca/_REGISTRO/pedidos.md`: data, município,
peça, quem fez, base, revisor e `Rodadas: pendente`. Sem dado de contribuinte.

## 7. Quando o Felipe contar o resultado no Studio

Complete a linha do pedido em `_REGISTRO/pedidos.md`: rodadas até dar certo (`1` = de primeira),
o motivo de cada rodada extra e o que a falha virou (passo 2 abaixo). Se uma rodada falhou,
corrija e registre a nova tentativa na mesma linha (`Rodadas: 2`).

Depois que o Felipe validar (não antes):

1. Template reutilizável? Versão genérica em `biblioteca/_BIBLIOTECA/Templates/<Nome>_BASE.txt`
   + `README - <Nome>.md` com "Template validado em produção em DD/MM/AAAA" e como usar.
2. Lição nova (armadilha, comportamento da fonte)? `biblioteca/CONTEXTO.md` → Lições aprendidas,
   ou o `_CONHECIMENTO/<área>/` pelo protocolo de ingestão. Armadilha que dá para detectar no
   código vira regra do revisor (`biblioteca/_FERRAMENTAS/lib/regras.mjs`, com teste e calibração).
3. `node biblioteca/_GRAFO/grafo.mjs gerar && node biblioteca/_GRAFO/grafo.mjs checar`.
4. Rascunho do município fica em `_RASCUNHOS-TESTES/` (fora do git); só a versão genérica sobe.
