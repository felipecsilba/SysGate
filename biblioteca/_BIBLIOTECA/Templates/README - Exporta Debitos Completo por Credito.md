# Exporta Débitos Completo por Crédito — como usar o template

Template validado em produção em 05/10/2026.

Arquivo: `Exporta_Debitos_Completo_por_Credito_BASE.txt`

Exporta **todos os campos** de todos os débitos de um crédito tributário
(`Dados.tributos.v2.debitos`) num zip com CSV + JSONL. O **JSONL** (um débito por
linha, JSON como a API devolveu) é o arquivo que a Checagem Por Fonte do
Krakion lê; o CSV é só para consulta humana. O cabeçalho sai completo **mesmo
quando um campo vem em branco em todos os débitos**.

## Como usar

1. Preencha `ID_CREDITO_TRIBUTARIO`. Com `0` o script para com aviso.
2. Rode e confira no console a linha
   `Colunas: X (N fixas + M descobertas)`.
3. Se algum campo descoberto precisar aparecer **sempre** (inclusive em
   créditos onde ele não vem), acrescente o nome em `CAMPOS_FIXOS`.

## Como o cabeçalho é montado

- **`CAMPOS_FIXOS`**: entram sempre, na ordem da lista, mesmo vazios. É isso
  que garante o cabeçalho estável entre execuções e créditos diferentes.
- **Descobertos**: a 1ª passada lê todos os débitos só para levantar o nome
  de cada campo devolvido pela API. O que não está na lista fixa entra depois,
  em ordem alfabética. Assim nenhum campo novo da API fica de fora.
- A 2ª passada lê os débitos de novo e escreve as linhas. São duas leituras
  para não guardar a base toda em memória.

## Como os valores viram colunas

| Na API | No CSV |
|---|---|
| Objeto aninhado (`referente: {tipo, codigo}`) | `referente.tipo`, `referente.codigo` |
| Enum como objeto `{valor, descricao}` | `campo` e `campo.descricao` |
| Lista | Texto separado por vírgula (objetos da lista com `\|` entre os campos) |
| Número | Decimal com vírgula (Excel pt-BR) |
| `;` e quebra de linha dentro do texto | Trocados por espaço |

CSV: delimitador `;`, sem aspas, `utf-8` (antes de 05/10/2026 era `iso-8859-1`).
JSONL: `utf-8`, quebras de linha internas trocadas por espaço.
`Resultado.arquivos([...])` não existe nesta versão do BFC-Script — por isso o zip.

## Para adaptar

- **Outro filtro** (ano, situação, contribuinte): altere a variável
  `criterio`, por exemplo `"idCredito = ${ID} and ano = 2026"`.
- **Outra fonte** (dívidas, simulados, etc.): troque a fonte em `buscaDebitos`
  e ajuste `CAMPOS_FIXOS`. O resto (achatar, descobrir colunas, escrever) é
  genérico.
- A busca **sem** `campos:` é o que faz a API devolver todos os campos. Não
  acrescente `campos:` em `buscaDebitos`, senão a descoberta só enxerga os
  campos pedidos.
