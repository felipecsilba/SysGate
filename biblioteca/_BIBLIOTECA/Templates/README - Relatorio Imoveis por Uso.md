# Relatório de Imóveis por Uso — como usar o template

Relatório (PDF no sistema, não exportação) que lista os imóveis ativos **agrupados pelo valor
de um campo adicional de lista** (ex.: DO USO), com área e valor venal, subtotal por grupo e
**resumo por uso** no final.

**Validado em produção:** Congonhas/MG, 09/11/2026 — "[PMC] Relação Analítica de Imóveis por
Tipo de USO", chamado da ISO 37120 (Indicador 05.02). Base inteira: 30.235 imóveis em ~3 min.
Pasta do caso: `Relatorios/Congonhas - [PMC] Relação Analítica de Imóveis por Campo Adicional/`.

## Arquivos

| Arquivo | O que é |
|---|---|
| `Relatorio_Imoveis_por_Uso_BASE.txt` | Fonte dinâmica (sem logs; bloco CONFIGURAÇÃO no topo) |
| `Relatorio_Imoveis_por_Uso_BASE.jrxml` | Layout A4 retrato |

Para depurar, a versão com logs (`imprimir` por etapa) está em `fonte_dinamica.txt` na pasta do caso.

## Fluxo que funcionou

1. **Títulos dos campos.** Na tela de um imóvel do município, anote os títulos exatos do campo
   de uso, da área e do **valor venal total**. Em Congonhas existiam `VALOR VENAL` e
   `Valor Venal do Imovel` — só o segundo era o total. Troque no bloco CONFIGURAÇÃO.
2. **Fonte dinâmica no Studio:** cole, crie o parâmetro `usos` (abaixo) e **publique**.
3. **Relatório:** suba o `.jrxml`, crie o **mesmo** parâmetro `usos` e ligue os dois em
   "Definindo parâmetros da fonte dinâmica".
4. **Teste pequeno primeiro:** use a versão com logs com uma faixa de código (ex.: 1 a 500).
   Rode **com** um uso marcado e **sem nenhum** — as linhas do resumo têm de bater.
5. Base inteira, depois publique a versão sem comentários.

## Parâmetro `usos` (lista múltipla, opcional)

- Opções da lista: **Dinâmica** · Categoria **Cadastro Auxiliar** · Fonte **Listagem de campos adicionais (v2)**
- **Filtros avançados:** `Criterio.onde('tituloCampoPai').igual('DO USO').e('tipoCadastro').igual('IMOVEIS')`
  (as opções de um campo de lista são campos filhos dele; o campo "Filtro" da tela NÃO restringe)
- Valor = `titulo` · Descrição = `titulo`
- Nenhum marcado = todos os imóveis ativos (inclusive com o campo em branco → grupo NÃO INFORMADO)

## Como a fonte trabalha

1. **Seleção:** com usos marcados, uma busca por uso **filtrada no servidor**
   (`parametros: ["camposadicionais": "DO USO = 'X'"]`); sem nenhum, todos os ativos.
2. **Último valor cadastrado** de uso, área e venal, em lotes de 200 imóveis:
   ano corrente para todos → para os pendentes, o campo sozinho sem limite de ano.
3. **Resumo** calculado na fonte e enviado pronto (textos com quebra de linha) — não depende
   de crosstab/subrelatório no Jasper.

## O que custou rodada (não repetir)

| Sintoma | Causa | Correção |
|---|---|---|
| Relatório todo em branco | fonte sem linhas → Jasper não gera nada | `whenNoDataType="AllSectionsNoDetail"` + aviso "Nenhum imóvel" |
| >5 min com 3.000 imóveis | histórico de todos os anos de uma vez | ano corrente + repescagem dos pendentes |
| Área vazia em quase todos | limite de 5 anos; área é dado de cadastro antigo | repescagem sem limite de ano |
| "asType não autorizado" | `v as BigDecimal` | `Math.round(v * 100)` |
| Sem uso marcado = zero imóveis | `se ([])` é verdadeiro no BFC | `if (!lista.isEmpty())` |
| Grupo "null" / resumo vazio | fonte antiga publicada com layout novo | conferir a versão no topo da fonte |

## Variações prováveis

- **Outro campo de agrupamento** (ex.: OCUPAÇÃO DO LOTE): troque `CAMPO_USO` e o filtro do parâmetro.
- **Só totais**: tire a banda de detalhe do layout (a fonte já manda o resumo pronto).
- **Outra área** (construída): troque `TITULO_AREA`.
