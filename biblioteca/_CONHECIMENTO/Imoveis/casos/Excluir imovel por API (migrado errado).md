# Excluir imóvel por API — "Não é possível excluir este item, o mesmo está em uso em outro registro"

> **Origem:** ensaio do Felipe com o Krakion, imóvel 34631456 (código 10), município Placas, 2026-10-20
> **Confirmado em:** API de verdade (Service Layer Tributos) + Studio, de ponta a ponta, em **1 imóvel**
> **Vale para:** imóvel migrado errado, **sem movimento financeiro** (o certo foi remigrado com outro id)

## Sintoma

`DELETE /api/imoveis` → lote `PROCESSADO_COM_ERRO`, mensagem *"Não é possível excluir este item, o mesmo está em
uso em outro registro"*. **A mensagem não diz qual vínculo trava**, então é preciso descobrir os vínculos antes.

## Receita que funcionou (nesta ordem)

| # | O que | Rota | Body (um item) | Observação |
|---|---|---|---|---|
| 0 | Levantar vínculos | Studio: `_BIBLIOTECA/Templates/Levantamento_Vinculos_Imoveis_BASE.txt` | — | Dá os ids e confere a trava financeira |
| 1 | Proprietários | `DELETE /api/imoveisResponsaveis` | `{"idIntegracao":"…","imoveisResponsaveis":{"idGerado":{"id":<id>}}}` | "Responsáveis" na API = `imoveis.proprietarios` na fonte. O `id` da fonte é o `idGerado` |
| 2 | Movimentações | `DELETE /api/imoveisMovimentacoes` | `{"idIntegracao":"…","imoveisMovimentacoes":{"idGerado":{"id":<id>}}}` | **O histórico do imóvel some junto.** A tela "Histórico" vem das movimentações |
| 3 | Reprocessar inscrição | `PUT /api/imoveisMovimentacoesInscricoesImobiliarias` | `{"idImovel":<id>}` | Recalcula as movimentações de inscrição imobiliária (derivadas). Sem histórico nem movimentação, a linha some. Responde 200 **vazio**, sem `idLote`: confirmar rodando o levantamento de novo |
| 4 | Imóvel | `DELETE /api/imoveis` | `{"idIntegracao":"…","imoveis":{"idGerado":{"id":<id>}}}` | `SUCESSO` |

Se houver corresponsáveis, testadas ou englobados, eles saem no passo 1, com as rotas `imoveisCorresponsaveis`,
`imoveisTestadas` e `imoveisEnglobados` no mesmo formato.

## Armadilhas que custaram rodadas

- **⚠ O PUT/POST de inscrições com body VAZIO reprocessa TODOS os imóveis da entidade.** Sempre com os ids,
  até 50 por requisição.
- **Histórico não se exclui à parte.** O id de `imoveis.historico` é de cada linha de alteração, não da entidade
  `HistoricoAlteracaoImovel`. `DELETE /api/historicoAlteracaoImovel` com esses ids responde *"Entidade… não
  encontrada"*. Não é preciso: o histórico sai com as movimentações.
- **Lote assíncrono:** consultar logo depois do envio mostra `NAO_PROCESSADO` (ainda na fila). Esperar antes de
  concluir qualquer coisa ou seguir para o próximo passo.
- `imovel.proprietarios` (singular) exige `parametros: ["idImovel": …]`. A busca em lote é `imoveis.proprietarios`
  (plural). Igual nos corresponsáveis.
- A movimentação de inscrição do imóvel veio com `idImovelMovimentacao = 0`: é a linha "inicial", não ligada a
  nenhuma movimentação.

## Em aberto

- Validado em **1** imóvel. Repetir com ~10 antes da lista inteira (~3.000).
- Imóveis com movimento financeiro: fora desta receita (débitos, dívidas e lançamentos não foram testados).
- Não cobertos pelo levantamento (nenhum apareceu neste caso): econômicos, transferências, imagens, informações
  complementares, origem do imóvel.
