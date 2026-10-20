# Levantamento de Vínculos de Imóveis — como usar o template

Arquivo: `Levantamento_Vinculos_Imoveis_BASE.txt`. **Ainda não rodado em produção** (criado em 2026-10-20 para o
caso dos ~3.000 imóveis migrados errado).

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

## Em aberto (o ensaio com 1 imóvel responde)

- O `id` da testada/proprietário que a fonte devolve é o mesmo `idGerado` que o `DELETE /api/imoveisTestadas` /
  `/api/imoveisResponsaveis` espera?
- "Responsáveis" na API = "proprietários" na fonte?
- Ordem: filhos primeiro (testadas, proprietários/responsáveis, corresponsáveis, englobados), imóvel por último.
