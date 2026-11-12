# Campos adicionais de imóvel — como ler em relatório e script

Confirmado na tela em Congonhas/MG, 09/11/2026, construindo um relatório de valor venal por uso
(30.235 imóveis). Complementa as lições 11 e 13 do `CONTEXTO.md`.

## Um registro por ano

Cada campo adicional do imóvel grava **um registro por ano** (`ano`). Não existe marca de "valor
atual": o atual é o do **ano mais recente que tiver valor**.

- **Valor venal** e fatores: gravados pelo **cálculo do IPTU**, todo ano. Imóvel novo, ainda sem
  cálculo, fica sem venal (normal — em Congonhas, 76 unidades de condomínio recém-cadastradas).
- **BCI / cadastro** (área do lote, uso, ocupação): gravados **quando alguém altera o cadastro**.
  Podem estar parados há muitos anos — 15 de 16 comerciais tinham a área fora dos últimos 5 anos.

## Ler o último valor sem baixar o histórico

```
1. idImovel in (lote de 200) and ano = <ano corrente> and campoAdicional.titulo in (...)
2. para quem ficou sem o campo:
   idImovel in (pendentes) and campoAdicional.titulo = '<campo>'   ordenacao: "ano desc"
   -> o 1º registro com valor de cada imóvel é o último cadastrado
```

Buscar todos os anos de todos os campos de uma vez (~60 registros por imóvel) levou >5 min para
3.000 imóveis; as duas etapas fazem a base inteira em ~3 min.

## Onde está o valor

| Tipo do campo | Onde ler |
|---|---|
| Lista de seleção | `opcoes` (pode vir `"COMERCIAL"` ou `"[COMERCIAL]"`); `vlCampo` vem 0 |
| Numérico, área, valor venal | `vlCampo` — **zero = sem valor** |
| Texto | `texto` |

Área do lote em Congonhas vem com 4 casas decimais: `Numeros.arredonda(v, 2)`.

## Títulos variam e podem enganar

Os títulos são do município. Congonhas tinha `VALOR VENAL` **e** `Valor Venal do Imovel` — só o
segundo era o venal total que o cliente reconhecia. Confirmar com quem usa o sistema antes de somar.
Uso: `DO USO` (opções ADM. PÚBLICA, COMERCIAL, INDUSTRIAL, NENHUM, RELIGIOSO, RESIDENCIAL, SEM USO,
SERVIÇOS). "SEM USO"/"NENHUM" são opções escolhidas; campo **em branco** é outra coisa.

## Filtrar imóveis por campo adicional

No servidor, junto com o critério normal:
```
Dados.tributos.v2.imoveis.busca(
    parametros: ["camposadicionais": "DO USO = 'COMERCIAL'"],
    criterio:   "situacao = 'ATIVADO'",
    campos:     "...")
```
Vários valores do mesmo campo = uma busca por valor, unidas pelo id.

## Opções de um campo de lista

São **campos adicionais filhos**: fonte `camposAdicionais` com `tituloCampoPai = '<campo>'`.
É assim que se monta um parâmetro de relatório com as opções (ver
`_BIBLIOTECA/Templates/README - Relatorio Imoveis por Uso.md`).
