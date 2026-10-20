# Modelo de dados e enums exatos

> **Origem:** Swagger do Service Layer —
> https://tributos.betha.cloud/service-layer-tributos/docs (baixado em 2026-08-20)
> **Vale para:** todos os municípios — é o modelo do sistema
> **Leia antes:** `../../../FontesDeDados/swagger/README.md` — Service Layer
> **não** é a mesma coisa que fonte de dados do BFC-Script

Este arquivo fecha a pendência nº 1 do índice: **os valores literais dos enums**.
`*` = obrigatório.

---

## A cadeia de 4 níveis

```
transferenciaImoveis          o cabeçalho (data, forma de cobrança, situação)
└── transfImoveisItens        um por IMÓVEL (motivo, valores venais, flags)
    └── transfImoveisItensVenda    um por VENDEDOR (% de venda)
        └── transfImoveisItensCompra   um por COMPRADOR (% de compra, declarado, ITBI)
```

Mais dois satélites do item: `transfImoveisItensAnexos` e
`transfImoveisItensProcessos`.

**O valor do ITBI mora no nível mais fundo** (`vlItbi` em ItensCompra). Somar
ITBI de uma transferência = descer os quatro níveis. É a mesma árvore que as
críticas percorrem (`itens → dadosVenda → dadosCompra`).

---

## Enums — os valores que vão no `criterio:`

### Situação da transferência
```
ABERTA · CALCULADA · CANCELADA · ENCERRADA · PENDENTE
```
⚠️ São **femininos e maiúsculos**. A ajuda escreve "Aberto"/"Encerrado" na
tela — não é o valor da API.

### Tipo de cobrança
```
IMOVEL · SEM_COBRANCA · TRANSFERENCIA · VENDA
```

### Status / situação da certidão de ITBI
```
EMITIDA · CANCELADA
```

### Outros da transferência
| Campo | Valores |
|---|---|
| `formaTransf` | `AUTOMATICA` · `MANUAL` |
| `lancamentoGerado` | `SIM` · `NAO` |
| `tipoImovel` | `AMBOS` · `RURAL` · `URBANO` |
| `tipoVenda` (item) | `PARCIAL` · `TOTAL` |
| `definicaoPagador` (item) | `COMPRADOR` · `VENDEDOR` |
| `benfeitorias`, `financiado`, `outros`, `unidadeFutura` (item) | `SIM` · `NAO` |
| `transferido` (compra) | `SIM` · `NAO` |
| `tipoCertidaoITBI` | `COMPRADOR` · `CORRESPONSAVEL` · `IMOVEL` · `VENDEDOR` |
| `formaPagamento` (certidão) | `CARTAO` · `DINHEIRO` |

### Enums de fora da área que aparecem na certidão de ITBI
Valem pra **Dívida Ativa e Arrecadação** também — aproveitar quando essas
áreas entrarem:

```
situacaoLancamento:
  ABERTO · COM_PAGAMENTOS · QUITADO · CANCELADO · REPARCELADO · SUSPENSO
  INSCRITO · INSCRITO_ENGLOBADO · COM_INSCRICAO · ENGLOBADO

situacaoDivida / situacaoParcela:
  ABERTO · PAGA · CANCELADA · SUSPENSA · INSCRITA_ENGLOBADA · INSCRITA
  ISENTA · ENGLOBADA · PAGA_ENGLOBADA · SIMULADA · PARCELADA · ELIMINADA
  PAGA_PARCELAMENTO · PRESCRITA · REMIDA · ABAIXO_LIMITE
```

### Tipo de motivo
Motivo é uma tabela única do sistema, fatiada por `tipoMotivo`. O da nossa
área é **`TRANSFERENCIA_IMOVEIS`**. Os outros 16:
`CANCELAMENTO_LANCAMENTO` · `CANCELAMENTO_PARCELAMENTO` · `ESTORNO_DIVIDA` ·
`ESTORNO_PAGAMENTO` · `SIMPLES_NACIONAL` · `ANULACAO_NOTAS_AVULSAS` ·
`MOVIMENTACAO_DIVIDA_ATIVA` · `CANCELAMENTO_DOCUMENTOS` ·
`CONSULTA_VIABILIDADE` · `BAIXA_PAGAMENTOS` · `DIFERENCA_PAGAMENTOS` ·
`NOTIFICACAO_LANCAMENTOS` · `REQUERIMENTOS` · `MANUTENCAO_PAGAMENTOS` ·
`CONTRIBUICAO_MELHORIA` · `GERENCIADOR_ECONOMICOS`

Motivo também tem `erroFalha` (`SIM`/`NAO` — marca falha operacional do
usuário) e `idLeiAto`.

---

## Campos por entidade

### `transferenciaImoveis` — cabeçalho
`codigo` · `idPagador` · **`dtCadastro`*** · `dtTransferencia` ·
`dhTransferencia` (a data tem que bater com `dtTransferencia`) ·
`dtVencimento` · `formaTransf` · `lancamentoGerado` · `statusCertidaoITBI` ·
**`situacao`*** · **`tipoCobranca`*** · **`tipoImovel`*** ·
`anoTransferencia` · `processoGeral` · `comentario`

### `transfImoveisItens` — por imóvel
Ligações: `idImoveis` · **`idMotivos`*** · **`idProprietario`*** ·
**`idTransferenciaImoveis`*** · `idCartorios` · `idPagadores` ·
`idArrematante` · `idLocalidades`

Valores: **`vlAreaTotalTerrenoUnidade`*** · **`vlAreaConstruidaUnidade`*** ·
**`vlVenalTerritorialUnidade`*** · **`vlVenalConstruidoUnidade`*** ·
**`vlVenalUnidade`*** · `vlVenalBenfeitoriasUnidade`

Arrematação: `dtArrematacao` · `vlArrematacao` · `obsArrematacao` ·
`idArrematante` — os mesmos campos que a fórmula
`ITBI_TRANSFERENCIA_CREDITOS` usa via `transfImoveisItens.*`.
Ver `../formulas/Tipos de Formula ITBI.md`.

**Alíquotas gravadas no item**: `percAvista` · `percFinanciado` ·
`percOutros` · `percBenfeitoria` · `percentualDescontoItbi`

> 🔑 **As alíquotas são congeladas no item, não lidas da configuração na hora
> de consultar.** Ou seja: mudar a configuração **não** recalcula
> transferência já cadastrada. Explica "por que essa transferência antiga tem
> alíquota diferente" — e diz onde olhar (o item, não a config).

Ainda: `denominacao` · `inscricaoIncra` (rural) · **`tipoVenda`*** ·
**`unidadeFutura`*** · **`financiado`*** · **`benfeitorias`*** ·
**`outros`*** · `definicaoPagador`

### `transfImoveisItensVenda` — por vendedor
**`idPessoas`*** (o vendedor) · **`idTransfImoveisItens`*** ·
**`percVenda`*** · `qtdCompradores` ·
**`vlAreaTotalTerrenoUnidade`*** · **`vlAreaConstruidaUnidade`***

### `transfImoveisItensCompra` — por comprador
**`idComprador`*** · **`idTransfImoveisItensVenda`*** · **`percCompra`*** ·
**`vlAreaTerreno`*** · **`vlAreaConstruida`***

Valores: `vlDeclarado` · `vlVendaAVista` · `vlFinanciado` · `vlOutros` ·
`vlBenfeitorias` · **`vlItbi`** · `transferido`

> Os quatro valores (à vista, financiado, outros, benfeitorias) batem com as
> quatro alíquotas. O ITBI é a soma de cada parcela × sua alíquota.

### `certidoesITBI`
Chaves: `nroDocumento` · `idTransferenciaImoveis` e os ids de cada nível da
cadeia · `idImoveis` · `idComprador` · `idVendedor` · `idCorresponsavel` ·
`idCreditosTributarios` · `idReceitas` · `idDividas`

Valores: `valorLancado` · `valorJuro` · `valorMulta` · `valorCorrecao` ·
`valorTotal` · `vlDeclarado` · `dtVencimento`

Situação: **`situacaoCertidaoITBI`*** · `tipoCertidaoITBI` ·
`situacaoLancamento` · `situacaoDivida` · `situacaoParcela` · `formaPagamento`

Endereço desnormalizado (o que sai impresso): `idLogradouroEndereco` ·
`idBairroEndereco` · `idDistritoEndereco` · `idLoteamentoEndereco` ·
`idCondominioEndereco` · `numeroEndereco` · `cepEndereco` ·
`apartamentoEndereco` · `blocoEndereco` · `quadra` · `lote` ·
`principalEndereco` · `numeroTelefone` · `identificadorRelatorio`

---

## Configuração — nomes reais dos campos

### `configTransfImoveis`
| Tela | Campo |
|---|---|
| Nº dias para vencimento | `numeroDias` |
| Contar dias como | `tipoDias` = `UTEIS` · `CORRIDOS` |
| Transferir automaticamente após pagamento | `formaTransf` = `AUTOMATICA` · `MANUAL` |
| Transferir isentas automaticamente | `transfIsentoAutomatico` |
| Cadastrar imóveis rurais | `incluirImoRurAutomatico` |
| Alterar descrição de outros | `alterarDescricaoOutros`* + `descricaoOutros` |
| Permitir alterar valor declarado | `alterarValorDeclarado` |
| Benfeitoria no valor declarado | `benfeitoriaValorDeclarado` |
| Reiniciar sequencial | `reiniciarSequencial`* |

Alíquotas gerais — 8 campos, urbano × rural:
`percAliqAvistaUrb` / `percAliqAvistaRur` · `percAliqFinanciadaUrb` / `Rur` ·
`percAliqOutrosUrb` / `Rur` · `percAliqBenfeitoriaUrb` / `Rur`

Créditos: `idCreditosTributariosUrbano` / `Rural` e
`idCreditosTributariosRecUrbano` / `RecRural`

Os liga/desliga do bloco *"Dados visíveis no resumo"* são ~30 campos
`SIM`/`NAO`: `dataCadastro`, `situacao`, `formaCobranca`, `imovel`,
`endereco`, `areaTotalTerreno`, `valorVenal`, `motivo`, `tipoVenda`,
`cartorio`, `nomeVendedor`, `percVenda`, `nomeComprador`, `percCompra`,
`valorTotalItbi`…

### `configTransfImoMotivos` — alíquota por motivo
**`idConfigTransfImoveis`*** · **`idMotivos`*** · `percAliqAvista` ·
`percAliqFinanciada` · `percAliqOutros` · `percAliqBenfeitoria` ·
`nomenclaturaCompra` · `nomenclaturaVenda`

> ⚠️ **Não há campo de benefício aqui**, embora a tela tenha a coluna
> *Benefício* por motivo. O benefício vem de
> `Administrando > Cadastros auxiliares > Benefícios fiscais`
> (`beneficiosFiscais`, `tipoBeneficio` = `ISENCAO`/`IMUNIDADE`/`INCENTIVO`/
> `REMISSAO`) — ver `../../_COMUM/Beneficios Fiscais.md`. **O vínculo
> motivo↔benefício simplesmente não é coberto pelo Service Layer**: migrar a
> config de motivos pela API não leva o benefício. Idem o `Desconto (%)`; o
> desconto aplicado aparece no item (`percentualDescontoItbi`).

### `configTransfImoReceitas` — receitas/taxas por tipo de imóvel
**`idConfigTransfImoveis`*** · **`idCreditosTributariosRec`*** ·
`vlTaxa` · `tipoImovel` = `RURAL` · `URBANO`

---

## Lacuna

**Solicitação de transferência não existe no Service Layer** — zero rotas.
Só nas fontes de dados (`solicitacaoTransferenciaImovel`) e na tela. Migração
de solicitações não é possível por essa via.
