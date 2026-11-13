# Comparativo entre tipos de fórmula

> **Gerado por** `_comparar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/*.json`. **Não editar à mão.**

## A regra que este documento existe pra gravar

> **Nome de função só vale dentro do tipo de fórmula em que ele existe.**
> Copiar código de um tipo para outro é a receita para "não roda e não
> sei por quê".

Vale tanto quanto a regra de que nada é portável entre municípios — e é
menos óbvia, porque o nome da *classe* costuma ser o mesmo.

**21 tipos capturados.**

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
| `G_PAR` | `GERACAO_CREDITO_PARCELAMENTOS` | 8 | 6 |
| `IT_VV` | `ITBI_VALOR_VENAL` | 4 | 6 |
| `A_PJC` | `ACRESCIMO_PARCELAMENTO` | 16 | 4 |
| `A_ANT` | `ACRESCIMO_PARCELAMENTO_ANTECIPACAO` | 3 | 3 |
| `MELH` | `GERACAO_CREDITO_CONTRIBUICAO_MELHORIAS` | 8 | 8 |
| `D_PAR` | `DESCONTO_PARCELAMENTO` | 21 | 7 |
| `INSC` | `CREDITO_INSCRITO_DIVIDA_ATIVA` | 4 | 8 |
| `MANUT` | `MANUTENCAO_DIVIDA` | 5 | 5 |
| `FED` | `IMPOSTOS_FEDERAIS` | 2 | 10 |
| `RED` | `REDUCAO_BASE_CALC_ISSQN` | 3 | 4 |
| `REQ` | `REQUERIMENTO_MANUTENCAO_CALCULO` | 2 | 3 |

---

## Classes por tipo

Número = quantidade de métodos. `—` = a classe não existe naquele tipo.

| Classe | IMOV | ECON | RECD | OBRA | ITBI | A_DEB | A_DIV | A_PAR | DESC | CONV | G_PAR | IT_VV | A_PJC | A_ANT | MELH | D_PAR | INSC | MANUT | FED | RED | REQ |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `Caracteres` | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 | 18 |
| `Datas` | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 | 29 |
| `Numeros` | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 22 |
| `Utilitarios` | 10 | 10 | 10 | 10 | 14 | 9 | 9 | 9 | — | 6 | 10 | 14 | 7 | — | 10 | — | — | 1 | 10 | — | — |
| `CamposAdicionais` | 5 | 5 | 5 | 4 | 5 | 4 | 4 | 4 | — | — | — | 3 | — | — | 5 | 2 | — | — | 5 | — | — |
| `Agrupamentos` | 3 | 3 | 3 | — | 3 | — | — | — | — | — | — | — | — | — | 3 | — | — | — | — | — | — |
| `TabelasAuxiliares` | 3 | 5 | — | — | — | — | — | — | — | — | 3 | 3 | — | — | — | — | — | — | — | — | — |
| `ConfiguracoesParcelas` | 1 | — | — | — | — | — | — | — | — | — | — | — | — | — | 1 | — | — | — | — | — | — |
| `Imoveis` | 3 | — | — | — | — | — | — | — | — | — | — | — | — | — | 3 | — | — | — | — | — | — |
| `dadosContribuinte` | — | — | — | — | 1 | — | — | — | — | — | — | — | — | — | — | 1 | — | — | — | — | — |
| `AliquotasServicosEconomicos` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 3 | — | — |
| `Atividades` | — | 7 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `ConfiguracoesParcela` | — | 1 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `Creditos` | — | — | — | — | 3 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `Economicos` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 2 | — | — |
| `Manutencoes` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 2 | — | — | — |
| `NotasAvulsas` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 10 | — | — |
| `TabelasIRRF` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 2 | — | — |
| `UtilitariosDebitos` | — | — | — | — | — | 2 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `UtilitariosDividas` | — | — | — | — | — | — | 5 | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `UtilitariosEconomicos` | — | 11 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `UtilitariosImoveis` | 13 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `UtilitariosParcelamento` | — | — | — | — | — | — | — | 2 | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `UtilitariosReceitasDiversas` | — | — | 2 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `UtilitariosTaxas` | — | — | — | — | — | — | — | — | — | — | 2 | — | — | — | — | — | — | — | — | — | — |
| `ValoresDeAtividadesDosEconomicos` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 7 | — | — |
| `guiaReceitaRepositorio` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 4 | — | — | — | — |
| `guiaRepositorio` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 6 | — | — | — | — |
| `imovelRepositorio` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 3 | — | — | — | — |
| `indexadorValorRepositorio` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 5 | — | — | — | — |
| `lancamentos` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 3 | — | — | — | — | — |
| `receitaDiversaRepositorio` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 1 | — | — | — | — |
| `repositorioDeNotasAvulsas` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 10 | — |
| `situacaoFinanceira` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 9 | — | — | — | — | — |

**Idênticas em todos os tipos** (seguras de copiar entre tipos): `Caracteres` · `Datas` · `Numeros`

⚠️ **Mesmo nome de classe, métodos diferentes** conforme o tipo: `CamposAdicionais` · `TabelasAuxiliares` · `Utilitarios`.
É aqui que se erra ao adaptar código — detalhe método a método abaixo.

### `CamposAdicionais` — método a método

| Método | IMOV | ECON | RECD | OBRA | ITBI | A_DEB | A_DIV | A_PAR | DESC | CONV | G_PAR | IT_VV | A_PJC | A_ANT | MELH | D_PAR | INSC | MANUT | FED | RED | REQ |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `valor` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | — | — | ✅ | ✅ | — | — | ✅ | — | — |
| `valorOpcao` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | — | — | ✅ | ✅ | — | — | ✅ | — | — |
| `preencherCampoAdicional` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — | — | — | ✅ | — | — |
| `preencherCampoAdicionalAgrupamento` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — | — | — | ✅ | — | — |
| `lotePossuiCampoAdicionalInformado` | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — | — | — | ✅ | — | — | ✅ | — | — | — | ✅ | — | — |

### `TabelasAuxiliares` — método a método

| Método | IMOV | ECON | RECD | OBRA | ITBI | A_DEB | A_DIV | A_PAR | DESC | CONV | G_PAR | IT_VV | A_PJC | A_ANT | MELH | D_PAR | INSC | MANUT | FED | RED | REQ |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `buscarRegistroDaTabelaPorCampo` | ✅ | ✅ | — | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — | — | — | — | — | — |
| `buscarRegistrosDaTabela` | ✅ | ✅ | — | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — | — | — | — | — | — |
| `valorDoCampoPorDescricao` | ✅ | ✅ | — | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — | — | — | — | — | — |
| `buscarRegistroDoReferentePorCampo` | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `buscarRegistrosDoReferente` | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |

### `Utilitarios` — método a método

| Método | IMOV | ECON | RECD | OBRA | ITBI | A_DEB | A_DIV | A_PAR | DESC | CONV | G_PAR | IT_VV | A_PJC | A_ANT | MELH | D_PAR | INSC | MANUT | FED | RED | REQ |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ | — | ✅ | — | — | — | ✅ | — | — |
| `ehMoedaCorrente` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ | — | ✅ | — | — | — | ✅ | — | — |
| `ehFeriado` | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | — | — | ✅ | — | ✅ | — | ✅ | — | — | — | ✅ | — | — |
| `proximoDiaUtil` | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | — | — | ✅ | — | ✅ | — | ✅ | — | — | — | ✅ | — | — |
| `buscaValorDoIndexadorPorSiglaNumaDataEspecifica` | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — | — | ✅ | ✅ | ✅ | — | ✅ | — | — | — | ✅ | — | — |
| `buscaIndexadorPorNomeESigla` | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — | — | ✅ | ✅ | — | — | ✅ | — | — | — | ✅ | — | — |
| `buscaBeneficioFiscal` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — | — | — | ✅ | — | — | — | ✅ | — | — |
| `emitirErro` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — | — | — | ✅ | — | — | — | ✅ | — | — |
| `existeLancamento` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — | — | — | ✅ | — | — | — | ✅ | — | — |
| `valorGeradoLancadoPorCreditoTributarioParaReferente` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — | — | — | ✅ | — | — | — | ✅ | — | — |
| `buscaIndexadorPorSigla` | — | — | — | ✅ | — | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `buscaValorIndexadorPorSiglaEData` | — | — | — | ✅ | — | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `buscaAgrupamento` | — | — | — | — | — | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `buscaAgrupamentoParcelamento` | — | — | — | — | — | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `montaReferente` | — | — | — | — | — | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `buscaPlantaDeValoresDoImovel` | — | — | — | — | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `buscaSecao` | — | — | — | — | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `buscaSecaoDoImovel` | — | — | — | — | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `existeParcelamentoPorSituacao` | — | — | — | — | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `existeParcelamentoVencido` | — | — | — | — | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `existemDebitosPorSituacao` | — | — | — | — | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `existemDebitosVencidos` | — | — | — | — | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `existemDividasPorSituacao` | — | — | — | — | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `existemDividasVencidas` | — | — | — | — | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `imovelEhEnglobado` | — | — | — | — | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `buscaImoveisDoContribuinte` | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — |
| `buscaImovelPeloCodigo` | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — |
| `completarADireita` | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| `completarAEsquerda` | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| `fatorVencimento` | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| `ignorarDivida` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — |
| `somatorioModulo10` | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| `somatorioModulo11` | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| `somenteNumeros` | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |

---

## Variáveis de contexto por tipo

| Variável | IMOV | ECON | RECD | OBRA | ITBI | A_DEB | A_DIV | A_PAR | DESC | CONV | G_PAR | IT_VV | A_PJC | A_ANT | MELH | D_PAR | INSC | MANUT | FED | RED | REQ |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `ano` | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | — | ✅ | — | — | — | — | — | — |
| `creditoTributario` | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — | — |
| `contribuinte` | — | — | — | — | — | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | — | — | ✅ | — | — | — | — | — |
| `dataBase` | — | ✅ | — | — | — | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | ✅ | — | — | — | — | — | — | — |
| `lancamento` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| `usuario` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — |
| `complementar` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — |
| `dataLancamento` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — |
| `imovel` | ✅ | — | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `tabelasCalculos` | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `tipoLancamento` | — | — | — | — | — | ✅ | ✅ | ✅ | — | — | — | — | ✅ | — | — | — | — | — | — | — | — |
| `configParcelamento` | — | — | — | — | — | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `configuracaoParcelamento` | — | — | — | — | — | — | — | — | — | — | ✅ | — | ✅ | — | — | ✅ | — | — | — | — | — |
| `dataVencimento` | — | — | — | — | — | ✅ | ✅ | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — |
| `divida` | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | ✅ | — | ✅ | — | — | — |
| `guia` | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | ✅ | ✅ | — | — | — | — |
| `guiaReceita` | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | ✅ | ✅ | — | — | — | — |
| `qtdParcelas` | — | — | — | — | — | — | — | — | — | — | ✅ | — | ✅ | — | — | ✅ | — | — | — | — | — |
| `referente` | — | — | — | — | — | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `dataDeVencimento` | — | — | — | — | ✅ | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| `dataInscricao` | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — |
| `dividaReceita` | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | ✅ | — | — | — | — | — |
| `economico` | — | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `formaPagamento` | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `indexador` | — | — | — | — | — | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `montante` | — | — | — | — | — | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — | — | — | — | — |
| `notaAvulsa` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | ✅ | — |
| `numeroParcela` | — | — | — | — | — | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `parcelamento` | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — | — | — | — |
| `parcelamentoParcela` | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — | — | — | — |
| `quantidadeParcelas` | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `receitas` | — | — | — | — | — | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `valorDevido` | — | — | — | — | — | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `Convenio` | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| `TipoRetorno` | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| `anoDaTransferencia` | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `anoTransferencia` | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `codigo` | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `competencias` | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — |
| `composicao` | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — |
| `configuracaoLancamento` | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `configuracaoTaxaExpediente` | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `contaUnica` | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| `contribMelhoriasImoveis` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — |
| `contribuicoesMelhorias` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — |
| `creditosTributarios` | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — |
| `dataDaTransferencia` | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `dataDoProcesso` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — |
| `dataParcelamento` | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `dividas` | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — |
| `dtVctoPrimeiraParcela` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| `ehLancamentoInscrito` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| `formaDeCobranca` | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `guias` | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — |
| `idDebito` | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `idDivida` | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `impostosFederais` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — |
| `issqn` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — |
| `lancamentosEnglobados` | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `leiAto` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — |
| `nroDaparcela` | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| `numeroDeBaixa` | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| `numeroDoProcesso` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — |
| `numeroInscricao` | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `numeroParcelamento` | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `obra` | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `opcoesListaServico` | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `pagadoresDoItbi` | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `parcela` | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — |
| `parcelamentoAnterior` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| `parcelas` | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `plantasDeValores` | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `processoAdministrativo` | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `quantidadeDeItens` | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — |
| `receitaDiversa` | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `requerimentoManutencaoCalculo` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ |
| `saldo` | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — |
| `servico` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — |
| `simplesNacional` | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `situacoesRequerimento` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ |
| `statusDivida` | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `tipoDesconto` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| `tipoManutencaoDivida` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — |
| `transfImoveisItens` | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `transferenciaImoveis` | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `usuarioCorrente` | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — |
| `valorDoDocumento` | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| `vendedoresDoImovel` | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| `vlTotalCorrecao` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| `vlTotalCorrecaoParcelar` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| `vlTotalDevido` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| `vlTotalJuros` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| `vlTotalJurosParcelar` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| `vlTotalLancado` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| `vlTotalLancadoParcelar` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| `vlTotalMulta` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| `vlTotalMultaParcelar` | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |

---

## Exclusivos de um único tipo

O que existe em **apenas um** tipo — o que mais engana quem adapta código.

**`GERACAO_CREDITO_IMOVEIS`** — classe `UtilitariosImoveis` · `lancamentosEnglobados`

**`GERACAO_CREDITO_ECONOMICOS`** — classe `UtilitariosEconomicos` · classe `ConfiguracoesParcela` · classe `Atividades` · `opcoesListaServico` · `configuracaoTaxaExpediente`

**`GERACAO_CREDITO_RECEITAS_DIVERSAS`** — classe `UtilitariosReceitasDiversas` · `receitaDiversa` · `configuracaoLancamento`

**`CALCULO_PROJETOS_OBRAS`** — `obra`

**`ITBI`** — classe `Creditos` · `transfImoveisItens` · `pagadoresDoItbi` · `dataDaTransferencia` · `plantasDeValores` · `anoTransferencia` · `transferenciaImoveis` · `formaDeCobranca`

**`FORMULA_ACRESCIMO_DEBITO`** — classe `UtilitariosDebitos` · `idDebito`

**`FORMULA_ACRESCIMO_DIVIDA_ATIVA`** — classe `UtilitariosDividas` · `simplesNacional` · `codigo` · `processoAdministrativo` · `statusDivida` · `numeroInscricao` · `idDivida`

**`FORMULA_ACRESCIMO_PARCELAMENTO`** — classe `UtilitariosParcelamento` · `numeroParcelamento` · `parcelas` · `dataParcelamento`

**`DESCONTO_GUIA`** — `quantidadeDeItens` · `composicao`

**`CONVENIO_BANCARIO`** — `contaUnica` · `numeroDeBaixa` · `nroDaparcela` · `Convenio` · `valorDoDocumento` · `TipoRetorno`

**`GERACAO_CREDITO_PARCELAMENTOS`** — classe `UtilitariosTaxas` · `dividas` · `parcela` · `usuarioCorrente` · `guias`

**`ITBI_VALOR_VENAL`** — `vendedoresDoImovel` · `anoDaTransferencia`

**`ACRESCIMO_PARCELAMENTO`** — `saldo` · `competencias` · `creditosTributarios`

**`GERACAO_CREDITO_CONTRIBUICAO_MELHORIAS`** — `contribMelhoriasImoveis` · `contribuicoesMelhorias`

**`DESCONTO_PARCELAMENTO`** — classe `lancamentos` · classe `situacaoFinanceira` · `vlTotalJuros` · `vlTotalMultaParcelar` · `parcelamentoAnterior` · `vlTotalMulta` · `vlTotalCorrecao` · `ehLancamentoInscrito` · `vlTotalLancadoParcelar` · `vlTotalDevido` · `vlTotalLancado` · `vlTotalJurosParcelar` · `dtVctoPrimeiraParcela` · `tipoDesconto` · `vlTotalCorrecaoParcelar`

**`CREDITO_INSCRITO_DIVIDA_ATIVA`** — classe `receitaDiversaRepositorio` · classe `imovelRepositorio` · classe `guiaReceitaRepositorio` · classe `indexadorValorRepositorio` · classe `guiaRepositorio`

**`MANUTENCAO_DIVIDA`** — classe `Manutencoes` · `leiAto` · `tipoManutencaoDivida` · `dataDoProcesso` · `numeroDoProcesso`

**`IMPOSTOS_FEDERAIS`** — classe `ValoresDeAtividadesDosEconomicos` · classe `Economicos` · classe `AliquotasServicosEconomicos` · classe `NotasAvulsas` · classe `TabelasIRRF` · `impostosFederais`

**`REDUCAO_BASE_CALC_ISSQN`** — classe `repositorioDeNotasAvulsas` · `issqn` · `servico`

**`REQUERIMENTO_MANUTENCAO_CALCULO`** — `requerimentoManutencaoCalculo` · `situacoesRequerimento`

Também faltam: `GERACAO_CREDITO_PARCELAMENTOS`,
`GERACAO_CREDITO_CONTRIBUICAO_MELHORIAS`, `DESCONTO_PARCELAMENTO_*`,
`GERACAO_CREDITO_NOTA_FISCAL_AVULSA`, `ACRESCIMO_PARCELAMENTO`,
`ACRESCIMO_PRE_FIXADA`, `ITBI_VALOR_VENAL_*`.
Como capturar: `README.md`.