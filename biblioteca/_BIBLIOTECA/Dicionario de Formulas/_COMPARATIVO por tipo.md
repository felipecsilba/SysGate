# Comparativo entre tipos de fórmula

> **Gerado por** `_comparar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/*.json`. **Não editar à mão.**

## A regra que este documento existe pra gravar

> **Nome de função só vale dentro do tipo de fórmula em que ele existe.**
> Copiar código de um tipo para outro é a receita para "não roda e não
> sei por quê".

Vale tanto quanto a regra de que nada é portável entre municípios — e é
menos óbvia, porque o nome da *classe* costuma ser o mesmo.

**10 tipos capturados.**

| Rótulo | Tipo | Variáveis | Classes |
|---|---|---:|---:|
| `IMOV` | `GERACAO_CREDITO_IMOVEIS` | 11 | 10 |
| `ECON` | `GERACAO_CREDITO_ECONOMICOS` | 13 | 10 |
| `RECD` | `GERACAO_CREDITO_RECEITAS_DIVERSAS` | 11 | 7 |
| `OBRA` | `CALCULO_PROJETOS_OBRAS` | 8 | 5 |
| `ITBI` | `ITBI` | 10 | 8 |
| `A_DEB` | `FORMULA_ACRESCIMO_DEBITO` | 13 | 6 |
| `A_DIV` | `FORMULA_ACRESCIMO_DIVIDA_ATIVA` | 19 | 6 |
| `A_PAR` | `FORMULA_ACRESCIMO_PARCELAMENTO` | 9 | 6 |
| `DESC` | `DESCONTO_GUIA` | 6 | 3 |
| `CONV` | `CONVENIO_BANCARIO` | 7 | 4 |

---

## Classes por tipo

Número = quantidade de métodos. `—` = a classe não existe naquele tipo.

| Classe | IMOV | ECON | RECD | OBRA | ITBI | A_DEB | A_DIV | A_PAR | DESC | CONV |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `Caracteres` | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 |
| `Datas` | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 |
| `Numeros` | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 |
| `Utilitarios` | 10 | 10 | 10 | 10 | 14 | 9 | 9 | 9 | — | 6 |
| `CamposAdicionais` | 5 | 5 | 5 | 4 | 5 | 4 | 4 | 4 | — | — |
| `Agrupamentos` | 3 | 3 | 3 | — | 3 | — | — | — | — | — |
| `TabelasAuxiliares` | 3 | 5 | — | — | — | — | — | — | — | — |
| `Atividades` | — | 7 | — | — | — | — | — | — | — | — |
| `ConfiguracoesParcela` | — | 1 | — | — | — | — | — | — | — | — |
| `ConfiguracoesParcelas` | 1 | — | — | — | — | — | — | — | — | — |
| `Creditos` | — | — | — | — | 3 | — | — | — | — | — |
| `Imoveis` | 3 | — | — | — | — | — | — | — | — | — |
| `UtilitariosDebitos` | — | — | — | — | — | 2 | — | — | — | — |
| `UtilitariosDividas` | — | — | — | — | — | — | 5 | — | — | — |
| `UtilitariosEconomicos` | — | 11 | — | — | — | — | — | — | — | — |
| `UtilitariosImoveis` | 13 | — | — | — | — | — | — | — | — | — |
| `UtilitariosParcelamento` | — | — | — | — | — | — | — | 2 | — | — |
| `UtilitariosReceitasDiversas` | — | — | 2 | — | — | — | — | — | — | — |
| `dadosContribuinte` | — | — | — | — | 1 | — | — | — | — | — |

**Idênticas em todos os tipos** (seguras de copiar entre tipos): `Caracteres` · `Datas` · `Numeros`

⚠️ **Mesmo nome de classe, métodos diferentes** conforme o tipo: `CamposAdicionais` · `TabelasAuxiliares` · `Utilitarios`.
É aqui que se erra ao adaptar código — detalhe método a método abaixo.

### `CamposAdicionais` — método a método

| Método | IMOV | ECON | RECD | OBRA | ITBI | A_DEB | A_DIV | A_PAR | DESC | CONV |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `preencherCampoAdicional` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `preencherCampoAdicionalAgrupamento` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `valor` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `valorOpcao` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `lotePossuiCampoAdicionalInformado` | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — | — |

### `TabelasAuxiliares` — método a método

| Método | IMOV | ECON | RECD | OBRA | ITBI | A_DEB | A_DIV | A_PAR | DESC | CONV |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `buscarRegistroDaTabelaPorCampo` | ✅ | ✅ | — | — | — | — | — | — | — | — |
| `buscarRegistrosDaTabela` | ✅ | ✅ | — | — | — | — | — | — | — | — |
| `valorDoCampoPorDescricao` | ✅ | ✅ | — | — | — | — | — | — | — | — |
| `buscarRegistroDoReferentePorCampo` | — | ✅ | — | — | — | — | — | — | — | — |
| `buscarRegistrosDoReferente` | — | ✅ | — | — | — | — | — | — | — | — |

### `Utilitarios` — método a método

| Método | IMOV | ECON | RECD | OBRA | ITBI | A_DEB | A_DIV | A_PAR | DESC | CONV |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `ehMoedaCorrente` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `ehFeriado` | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | — | — |
| `proximoDiaUtil` | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | — | — |
| `buscaBeneficioFiscal` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `buscaIndexadorPorNomeESigla` | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — | — |
| `buscaIndexadorPorSigla` | — | — | — | ✅ | — | ✅ | ✅ | ✅ | — | — |
| `buscaValorDoIndexadorPorSiglaNumaDataEspecifica` | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — | — |
| `buscaValorIndexadorPorSiglaEData` | — | — | — | ✅ | — | ✅ | ✅ | ✅ | — | — |
| `emitirErro` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `existeLancamento` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `valorGeradoLancadoPorCreditoTributarioParaReferente` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `buscaAgrupamento` | — | — | — | — | — | ✅ | ✅ | ✅ | — | — |
| `buscaAgrupamentoParcelamento` | — | — | — | — | — | ✅ | ✅ | ✅ | — | — |
| `montaReferente` | — | — | — | — | — | ✅ | ✅ | ✅ | — | — |
| `buscaPlantaDeValoresDoImovel` | — | — | — | — | ✅ | — | — | — | — | — |
| `buscaSecao` | — | — | — | — | ✅ | — | — | — | — | — |
| `buscaSecaoDoImovel` | — | — | — | — | ✅ | — | — | — | — | — |
| `completarADireita` | — | — | — | — | — | — | — | — | — | ✅ |
| `completarAEsquerda` | — | — | — | — | — | — | — | — | — | ✅ |
| `existeParcelamentoPorSituacao` | — | — | — | — | ✅ | — | — | — | — | — |
| `existeParcelamentoVencido` | — | — | — | — | ✅ | — | — | — | — | — |
| `existemDebitosPorSituacao` | — | — | — | — | ✅ | — | — | — | — | — |
| `existemDebitosVencidos` | — | — | — | — | ✅ | — | — | — | — | — |
| `existemDividasPorSituacao` | — | — | — | — | ✅ | — | — | — | — | — |
| `existemDividasVencidas` | — | — | — | — | ✅ | — | — | — | — | — |
| `fatorVencimento` | — | — | — | — | — | — | — | — | — | ✅ |
| `imovelEhEnglobado` | — | — | — | — | ✅ | — | — | — | — | — |
| `somatorioModulo10` | — | — | — | — | — | — | — | — | — | ✅ |
| `somatorioModulo11` | — | — | — | — | — | — | — | — | — | ✅ |
| `somenteNumeros` | — | — | — | — | — | — | — | — | — | ✅ |

---

## Variáveis de contexto por tipo

| Variável | IMOV | ECON | RECD | OBRA | ITBI | A_DEB | A_DIV | A_PAR | DESC | CONV |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `ano` | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | — |
| `creditoTributario` | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — | — |
| `dataBase` | — | ✅ | — | — | — | ✅ | ✅ | ✅ | ✅ | — |
| `usuario` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — |
| `complementar` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `contribuinte` | — | — | — | — | — | ✅ | ✅ | ✅ | ✅ | — |
| `dataLancamento` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `imovel` | ✅ | — | ✅ | ✅ | ✅ | — | — | — | — | — |
| `lancamento` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `configParcelamento` | — | — | — | — | — | ✅ | ✅ | ✅ | — | — |
| `dataVencimento` | — | — | — | — | — | ✅ | ✅ | — | ✅ | — |
| `referente` | — | — | — | — | — | ✅ | ✅ | ✅ | — | — |
| `tabelasCalculos` | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |
| `tipoLancamento` | — | — | — | — | — | ✅ | ✅ | ✅ | — | — |
| `dataDeVencimento` | — | — | — | — | ✅ | — | — | — | — | ✅ |
| `economico` | — | ✅ | ✅ | — | — | — | — | — | — | — |
| `formaPagamento` | ✅ | ✅ | — | — | — | — | — | — | — | — |
| `indexador` | — | — | — | — | — | ✅ | ✅ | — | — | — |
| `numeroParcela` | — | — | — | — | — | ✅ | ✅ | — | — | — |
| `quantidadeParcelas` | ✅ | ✅ | — | — | — | — | — | — | — | — |
| `receitas` | — | — | — | — | — | ✅ | ✅ | — | — | — |
| `valorDevido` | — | — | — | — | — | ✅ | ✅ | — | — | — |
| `Convenio` | — | — | — | — | — | — | — | — | — | ✅ |
| `TipoRetorno` | — | — | — | — | — | — | — | — | — | ✅ |
| `anoTransferencia` | — | — | — | — | ✅ | — | — | — | — | — |
| `codigo` | — | — | — | — | — | — | ✅ | — | — | — |
| `composicao` | — | — | — | — | — | — | — | — | ✅ | — |
| `configuracaoLancamento` | — | — | ✅ | — | — | — | — | — | — | — |
| `configuracaoTaxaExpediente` | — | ✅ | — | — | — | — | — | — | — | — |
| `contaUnica` | — | — | — | — | — | — | — | — | — | ✅ |
| `dataDaTransferencia` | — | — | — | — | ✅ | — | — | — | — | — |
| `dataInscricao` | — | — | — | — | — | — | ✅ | — | — | — |
| `dataParcelamento` | — | — | — | — | — | — | — | ✅ | — | — |
| `formaDeCobranca` | — | — | — | — | ✅ | — | — | — | — | — |
| `idDebito` | — | — | — | — | — | ✅ | — | — | — | — |
| `idDivida` | — | — | — | — | — | — | ✅ | — | — | — |
| `lancamentosEnglobados` | ✅ | — | — | — | — | — | — | — | — | — |
| `nroDaparcela` | — | — | — | — | — | — | — | — | — | ✅ |
| `numeroDeBaixa` | — | — | — | — | — | — | — | — | — | ✅ |
| `numeroInscricao` | — | — | — | — | — | — | ✅ | — | — | — |
| `numeroParcelamento` | — | — | — | — | — | — | — | ✅ | — | — |
| `obra` | — | — | — | ✅ | — | — | — | — | — | — |
| `opcoesListaServico` | — | ✅ | — | — | — | — | — | — | — | — |
| `pagadoresDoItbi` | — | — | — | — | ✅ | — | — | — | — | — |
| `parcelas` | — | — | — | — | — | — | — | ✅ | — | — |
| `plantasDeValores` | — | — | — | — | ✅ | — | — | — | — | — |
| `processoAdministrativo` | — | — | — | — | — | — | ✅ | — | — | — |
| `quantidadeDeItens` | — | — | — | — | — | — | — | — | ✅ | — |
| `receitaDiversa` | — | — | ✅ | — | — | — | — | — | — | — |
| `simplesNacional` | — | — | — | — | — | — | ✅ | — | — | — |
| `statusDivida` | — | — | — | — | — | — | ✅ | — | — | — |
| `transfImoveisItens` | — | — | — | — | ✅ | — | — | — | — | — |
| `transferenciaImoveis` | — | — | — | — | ✅ | — | — | — | — | — |
| `valorDoDocumento` | — | — | — | — | — | — | — | — | — | ✅ |

---

## Exclusivos de um único tipo

O que existe em **apenas um** tipo — o que mais engana quem adapta código.

**`GERACAO_CREDITO_IMOVEIS`** — classe `ConfiguracoesParcelas` · classe `Imoveis` · classe `UtilitariosImoveis` · `lancamentosEnglobados`

**`GERACAO_CREDITO_ECONOMICOS`** — classe `UtilitariosEconomicos` · classe `ConfiguracoesParcela` · classe `Atividades` · `opcoesListaServico` · `configuracaoTaxaExpediente`

**`GERACAO_CREDITO_RECEITAS_DIVERSAS`** — classe `UtilitariosReceitasDiversas` · `receitaDiversa` · `configuracaoLancamento`

**`CALCULO_PROJETOS_OBRAS`** — `obra`

**`ITBI`** — classe `dadosContribuinte` · classe `Creditos` · `transfImoveisItens` · `pagadoresDoItbi` · `dataDaTransferencia` · `plantasDeValores` · `anoTransferencia` · `transferenciaImoveis` · `formaDeCobranca`

**`FORMULA_ACRESCIMO_DEBITO`** — classe `UtilitariosDebitos` · `idDebito`

**`FORMULA_ACRESCIMO_DIVIDA_ATIVA`** — classe `UtilitariosDividas` · `simplesNacional` · `codigo` · `processoAdministrativo` · `statusDivida` · `numeroInscricao` · `dataInscricao` · `idDivida`

**`FORMULA_ACRESCIMO_PARCELAMENTO`** — classe `UtilitariosParcelamento` · `numeroParcelamento` · `parcelas` · `dataParcelamento`

**`DESCONTO_GUIA`** — `quantidadeDeItens` · `composicao`

**`CONVENIO_BANCARIO`** — `contaUnica` · `numeroDeBaixa` · `nroDaparcela` · `Convenio` · `valorDoDocumento` · `TipoRetorno`

Também faltam: `GERACAO_CREDITO_PARCELAMENTOS`,
`GERACAO_CREDITO_CONTRIBUICAO_MELHORIAS`, `DESCONTO_PARCELAMENTO_*`,
`GERACAO_CREDITO_NOTA_FISCAL_AVULSA`, `ACRESCIMO_PARCELAMENTO`,
`ACRESCIMO_PRE_FIXADA`, `ITBI_VALOR_VENAL_*`.
Como capturar: `README.md`.