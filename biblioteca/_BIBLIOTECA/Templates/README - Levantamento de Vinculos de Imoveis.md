# Levantamento de Vínculos de Imóveis — como usar o template

Arquivo: `Levantamento_Vinculos_Imoveis_BASE.txt`. Rodado no Studio em 2026-10-20 (Placas, 1 imóvel), no caso dos
~3.000 imóveis migrados errado.

Serve para **excluir imóveis por API** sem tentativa e erro. A API não deixa excluir um imóvel que ainda tem filhos
(testadas, proprietários...). Ela também não lista nada: só consulta por id. Então a descoberta de quem está
vinculado é feita aqui, em BFC-Script, e o Krakion App monta os lotes de exclusão a partir do arquivo gerado.

## Como usar

1. Cole os **ids** dos imóveis em `IDS_IMOVEIS` (o id, não o código).
2. **Ensaio:** rode com 1 imóvel, depois uns 10. Confira o resumo no console.
3. Rode com a lista inteira e baixe o `vinculos_imoveis.zip`.

## O que ele confere

| Grupo | Fontes | Como |
|---|---|---|
| Existe? | `imoveis` | `id in (...)` |
| Filhos (ids) | `imoveis.proprietarios`, `imoveis.corresponsaveis` (**plural** = lote; o singular `imovel.*` exige `parametros`) | em lote, `idImovel in (...)` |
| | `imoveis` com `idImovelPrincipal` | englobados, em lote |
| | `imovel.testadas` | 1 consulta por imóvel (`parametros: [idImovel]`) |
| | `imovel.beneficioFiscal` | 1 consulta por imóvel, só contagem (sem id no retorno conhecido) |
| Trava financeira (contagem) | `debitos`, `dividas`, `parcelamentos` (`idImovel`), `lancamentos`, `receitasDiversas` (`imovel.id`) | em lote |

Imóvel com **qualquer** trava financeira sai como `"livre": false` e não deve ser excluído sem revisão.

**Não cobertos:** econômicos e transferências (a fonte não filtra por imóvel), imagens e informações complementares
(sem fonte). Se a exclusão falhar por um deles, a mensagem da API diz qual.

## Saída (`vinculos_imoveis.jsonl`, uma linha por imóvel)

```json
{"idImovel":123,"existe":true,"codigo":4567,"livre":true,
 "filhos":{"proprietarios":[11,12],"corresponsaveis":[],"testadas":[901],"englobados":[],"beneficiosFiscais":0},
 "financeiro":{"debitos":0,"dividas":0,"parcelamentos":0,"lancamentos":0,"receitasDiversas":0}}
```

## Já aprendido no ensaio (2026-10-20)

- A API **não diz** qual vínculo trava: `DELETE /api/imoveis` responde só *"Não é possível excluir este item, o mesmo
  está em uso em outro registro"* (`PROCESSADO_COM_ERRO`). Por isso o levantamento.
- O body do DELETE leva o id como **objeto**: `[{"idIntegracao": "...", "imoveis": {"idGerado": {"id": 34631456}}}]`.
- `imovel.proprietarios.busca(criterio: ...)` falha com *"Os parâmetros 'idImovel' não foram definidos"*: a busca em
  lote é `imoveis.proprietarios` (plural). Mesmo padrão de `imoveis.camposAdicionais` × `imovel.camposAdicionais`.

- A movimentação de inscrição imobiliária é **derivada** (não tem DELETE): some ao reprocessar o imóvel
  (`PUT /api/imoveisMovimentacoesInscricoesImobiliarias` com `{"idImovel": …}`) depois de apagar as movimentações.
  **Nunca com body vazio**: isso reprocessa todos os imóveis da entidade.
- O histórico sai junto com as movimentações. Não tente `DELETE /api/historicoAlteracaoImovel` com os ids da fonte
  (*"não encontrada"*).

## Receita completa (validada em 1 imóvel, 2026-10-20)

Ver `_CONHECIMENTO/Imoveis/casos/Excluir imovel por API (migrado errado).md`:
proprietários → movimentações → reprocessar inscrição → imóvel. Esperar cada lote processar.
