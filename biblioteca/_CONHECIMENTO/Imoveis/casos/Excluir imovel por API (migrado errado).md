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

## Padrão em volume (2026-10-20)

Levantamento de 91 imóveis migrados errado da mesma base (códigos 10 e 11–100, todos **desativados**): **todos
livres e só com 1 movimentação de inscrição imobiliária** (`idImovelMovimentacao = 0`). O código 10 era o único com
proprietário, movimentações e histórico. Para esse perfil, a receita encurta para **PUT de inscrição → DELETE do
imóvel**. Para achar os ids por faixa de código: `_BIBLIOTECA/Templates/Lista_Ids_Imoveis_por_Codigo_BASE.txt`.

No Krakion App, a tela **Mapa de dependências → Imóvel → Levantamento de vínculos → "Analisar resultado"** lê o JSONL,
separa o que fica fora do plano e envia as etapas em lotes de 50, consultando cada idLote.

**Primeiro envio pela tela (2026-10-20):** 17 imóveis do perfil "só inscrição", PUT em 1 lote de 17 → DELETE logo em
seguida deu **"em uso" nos 17** (o reprocessamento ainda estava na fila). Esperando alguns minutos e usando "Reenviar
com erro", o DELETE passou nos 17. **O DELETE é o termômetro do PUT:** o PUT não tem GET nem idLote, e um DELETE
recusado não apaga nada, então reenviar até passar é seguro. O PUT em lote (vários `{idImovel}` no array) funciona.

**Lote grande (2026-10-20, 2.374 imóveis):** o DELETE começou 1 min depois dos 43 PUTs. Os 17 primeiros lotes
voltaram 100% "em uso" (fila do PUT ainda não processada; com 2 mil itens, esperar **bem mais** que no teste de 17), e a
partir de ~120 chamadas a Betha respondeu **HTTP 429** (limite de chamadas, bloqueio de 2 a 4 min). A tela agora espera
e repete no 429.

**PUT de inscrição em volume (2026-10-20, rodadas sobre os 2.374):** 29–43 PUTs de 50 enviados em ~1 min, todos 200.
No DELETE seguinte passaram só **1 a 3 lotes inteiros por rodada, em posições diferentes a cada vez** (lotes 2/4/6;
depois 1–2; depois o 10º). Com todos os imóveis tendo a linha, o lote do DELETE = o lote do PUT: o PUT de 50 ou vale
inteiro ou não vale nada. **Hipótese (não confirmada):** cada PUT é um processamento e, enquanto um roda, os que chegam
são descartados apesar do 200. Teste combinado: PUTs com 120 s de intervalo, parar no 3º, DELETE depois de 5 min.

## Em aberto

- **Resultado do lote grande (2026-10-21):** todos os 2.373 imóveis "só inscrição" excluídos, depois de várias rodadas.
  Modelo mais provável: a fila do PUT processa um pedido por vez, devagar e sem descartar; pedido pendente deixa o imóvel
  "em uso"; PUT repetido só engorda a fila. Melhor prática: **um PUT só**, depois só DELETE de tempos em tempos.
- Imóvel 34664997 (código 2402): a movimentação 1786514208 ("Criação do cadastro") dá "em uso" no DELETE mesmo depois
  da outra movimentação sair e de PUT de inscrição só dele. A linha de inscrição 11526502 aponta para ela — suspeita de
  ciclo (o PUT recria a linha a partir da movimentação que existe).
  Tentado em 2026-10-21: `DELETE /api/imoveisMovimentacoesHistorico` com o id do histórico do levantamento (1610611727)
  → **SUCESSO** (rota nova; a `historicoAlteracaoImovel` dava "não encontrado"). Mas, mesmo sem histórico, o PUT de
  inscrição continua gerando a linha 11526502 → movimentação e imóvel seguem "em uso". **Ciclo sem saída pela API**
  (a rota de inscrição não tem DELETE; a tela do Betha não exclui imóvel, só desativa). Ficou desativado; chamado na
  Betha pedindo a remoção. Não confirmado: `imoveisMovDetalhes` (anexo da movimentação) — nenhuma fonte BFC o lê.
- **Regra para a receita:** imóvel cuja linha de inscrição aponta para a movimentação de **criação** (`idMovimentacao`
  ≠ 0) não sai pela API. Separar esses no levantamento e mandar para chamado, sem gastar rodadas.
- **Laboratório na base de teste (2026-10-21, entidade 11494):** o 2402 foi **cadastrado pela tela** (marcelalo,
  25/03/2026); os 2.373 que saíram vieram da migração. Criados 2 imóveis pela tela (36381476, 36381496): **os dois
  nasceram com movimentação + histórico + linha de inscrição ligada à movimentação** (o POST da tela não manda nada
  disso — o Tributos cria por dentro). Tentado no 36381476: excluir proprietário → PUT de inscrição (linha com o mesmo
  id) → POST de inscrição (idem) → `PATCH /api/imoveisMovimentacoes` trocando `idImoveis` para o outro imóvel
  (**funciona**: a movimentação e o histórico vão juntos) → PUT com o imóvel já **sem nenhuma movimentação** → a linha
  13490820 **continua** → DELETE do imóvel "em uso". `DELETE /api/imoveisMovimentacoesInscricoesImobiliarias` → 405.
  **Conclusão:** a linha de inscrição criada pela tela não é alcançada por nenhuma rota da API de migração (PUT/POST só
  refazem as linhas geradas pela migração). **Imóvel cadastrado pela tela não sai pela API**, e a tela não tem excluir
  (só desativar). Também validado no caminho: `PATCH /api/imoveis` aceita limpar agrupamento (`idAgrupamento`) e
  inscrição/endereço (como RURAL; logradouro e `nroImovel` não aceitam nulo); a varredura ampla (83 consultas por id,
  código e inscrição), econômicos (2.246) e a tela (anexos, documentos, transferências) não acharam mais nada.

- Receita completa validada em **1** imóvel; o perfil "só inscrição" excluído pela tela em **17**. Lista inteira: códigos 11 a 2402.
- Imóveis com movimento financeiro: fora desta receita (débitos, dívidas e lançamentos não foram testados).
- Não cobertos pelo levantamento (nenhum apareceu neste caso): econômicos, transferências, imagens, informações
  complementares, origem do imóvel.
