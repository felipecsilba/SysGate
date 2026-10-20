# _FUNDAMENTOS — como o sistema tributário funciona

> **Origem:** a criar. Nada aqui foi escrito ainda.
> **Estado:** 🟡 esqueleto criado em 2026-08-21, conteúdo pendente
> **Vale para:** todos os municípios (é o substrato; o que varia por
> município mora nas áreas)

Esta **não é uma área como as outras**. `ITBI-Transferencias/`, `Imoveis/`,
`Divida-Ativa/` cobrem um pedaço do sistema. Esta cobre o que está **embaixo
de todas elas**: o ciclo de vida do tributo, as entidades centrais, e o
modelo de execução (fórmula / script / fonte / relatório).

Regra de fronteira: se um fato vale para 2+ áreas e não é cadastro
compartilhado, ele mora aqui. Se é cadastro compartilhado (Motivos,
Indexadores, Benefícios), mora em `_COMUM/`. Se é de uma área só, mora na área.

---

## Os pilares a cobrir

### A. Regra de negócio — o ciclo de vida do tributo

| # | Pilar | Estado | Como obter |
|---|---|---|---|
| A1 | **Cadastro** — imóvel, econômico, contribuinte: o que é sujeito passivo | ⬜ | Felipe + central de ajuda |
| A2 | **Crédito tributário** — receita, classificação, o que se cobra | ⬜ | corpus (86 siglas já levantadas) + Felipe |
| A3 | **Cálculo** — o motor, exercício, base de cálculo, alíquota | ⬜ | corpus de fórmulas + Felipe |
| A4 | **Lançamento** — virar débito, parcelas, vencimento, notificação | ⬜ | Felipe + ajuda |
| A5 | **Arrecadação** — guia, convênio, baixa, pagamento a menor | ⬜ | corpus + ajuda |
| A6 | **Dívida ativa** — inscrição, prescrição, execução fiscal | ⬜ | Felipe + ajuda |
| A7 | **Acréscimos** — juros, multa, correção: quando incidem | ⬜ | corpus (`FORMULA_ACRESCIMO_*`) |
| A8 | **Benefícios** — isenção, imunidade, remissão, incentivo | 🟢 | já em `_COMUM/Beneficios Fiscais.md` |
| A9 | **Exercício x competência x data-base** — os três tempos | ⬜ | **só Felipe** — é o que mais gera erro |

### B. Técnico — o modelo de execução

| # | Pilar | Estado | Como obter |
|---|---|---|---|
| B1 | **Fórmula vs Script** — duas linguagens | 🟢 | `_BIBLIOTECA/Formula vs Script...md` |
| B2 | **Tipos de fórmula** e quando cada uma roda no motor | 🟡 | parcial no `CONTEXTO.md`; falta a ordem de execução |
| B3 | **Tipos de script** (Componente/Crítica/Fonte Dinâmica/Script) | 🟡 | parcial; falta o gatilho de cada um |
| B4 | **Fontes de dados** — 4 dimensões, nomes REST x BFC | 🟢 | `FontesDeDados/` + `fonte.py` |
| B5 | **Relatórios** — Jasper, fonte dinâmica, parâmetros no Studio | ⬜ | Felipe |
| B6 | **Studio de Extensões** — onde cada artefato é cadastrado | ⬜ | Felipe + prints |
| B7 | **Campos adicionais / BCI** — o modelo de extensão do cadastro | 🟡 | `_BIBLIOTECA/Funcoes Prontas/` |
| B8 | **Tabelas de cálculo** — o que são, como se referenciam | ⬜ | corpus (125 números já levantados) |
| B9 | **Service Layer x Fontes de dados** — quando é cada um | 🟢 | `FontesDeDados/swagger/README.md` |

---

## O que dá pra fazer sem o Felipe

Passo 2 do protocolo. Extraível só do corpus, sem documentação:

- **A2** — as 86 siglas de receita e sua distribuição por município
- **A3/A7** — anatomia da fórmula de cálculo e dos acréscimos (a análise de
  IPTU já foi feita: 264 arquivos → 62 fórmulas únicas, 33 municípios; ver
  `../CONTEXTO.md`, "Análise de IPTU já feita")
- **B8** — os 125 números de tabela e o que cada um parece fazer
- **B2/B3** — inventário dos tipos que realmente aparecem nos arquivos

## O que só o Felipe sabe

Marcado como ⬜ "só Felipe" acima. O mais crítico é **A9** (exercício x
competência x data-base) — é o eixo que amarra cálculo, acréscimo e dívida, e
não está escrito em lugar nenhum da base.

---

## Pendências

1. **Nada foi escrito ainda** — este arquivo é só o mapa.
2. **Formato do treinamento não definido** — ver conversa de 2026-08-21.
3. **Fronteira com `_COMUM/` a validar** — hoje `_COMUM/` tem Benefícios e o
   Mapa de menus. O Mapa de menus talvez devesse migrar pra cá.
