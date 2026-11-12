# Receitas com descrição repetida

Script: `Receitas_Descricao_Repetida_BASE.txt` (BFC-Script, roda no Studio do tributos). **Ainda não validado no Studio.**

## Para que serve

Ao salvar um crédito tributário pela tela, a Betha re-salva as receitas dele. Se outra receita tiver a mesma
descrição, o salvar falha com `422 "Já existe uma receita com a descrição informada."`. Isso trava o estímulo do
cadastro único na Migração Espelho do Krakion. Visto em Ruropolis em 2026-10-29, em 7 de 33 créditos.

## O que gera

`receitas_descricao_repetida.csv`, com separador `;` e UTF-8. Uma linha por receita de cada grupo com a mesma descrição
(sem diferenciar maiúsculas/minúsculas e sem espaços nas pontas):

| coluna | conteúdo |
|---|---|
| descricao | descrição da receita |
| idReceita | id da receita |
| abreviatura, classificacao | para diferenciar as receitas do grupo |
| templateId | identificador do cadastro único (o que liga a receita aos outros sistemas) |
| creditos | créditos que usam a receita (`id descrição`, separados por ` \| `) |

O console mostra as mesmas linhas e o total de grupos.

## Depois

Para cada grupo, decidir pela tela qual receita fica com a descrição atual e ajustar a descrição da outra (ex.: incluir
o crédito ou a classificação). Depois, estimular de novo os créditos que deram 422.
