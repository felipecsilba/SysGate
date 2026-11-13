# Contexto da fórmula — tipo `DESCONTO_PARCELAMENTO`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/DESCONTO_PARCELAMENTO.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — 117 fórmulas do tipo `DESCONTO_PARCELAMENTO_TODOS` / `DESCONTO_PARCELAMENTO_DIVIDAS` / `DESCONTO_PARCELAMENTO_LANCAMENTOS_EXERCICIO` / `DESCONTO_PARCELAMENTO_PARCELAMENTOS_ANTERIORES`.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**21 variáveis de contexto · 7 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### Valores simples

| Variável | O que é |
|---|---|
| `qtdParcelas` | Quantidade de parcelas que compõem o parcelamento. |
| `vlTotalJuros` | Valor total da juros da divida ou lançamento do exercício. |
| `vlTotalMultaParcelar` | Valor total da multa que está sendo parcelada. |
| `vlTotalMulta` | Valor total da multa da divida ou lançamento do exercício. |
| `vlTotalCorrecao` | Valor total da correção monetária da divida ou lançamento do exercício. |
| `ehLancamentoInscrito` | Identifica o tipo de lançamento a ser parcelado, ou seja, se é inscrito ou não. |
| `vlTotalLancadoParcelar` | Valor total de tributo que está sendo parcelado. |
| `vlTotalDevido` | Valor total devido da divida ou lançamento do exercício. |
| `vlTotalLancado` | Valor total lançado a ser parcelado. |
| `vlTotalJurosParcelar` | Valor total dos juros que está sendo parcelado. |
| `dtVctoPrimeiraParcela` | Data de vencimento da primeira parcela. |
| `vlTotalCorrecaoParcelar` | Valor total da correção que está sendo parcelada. |

### `parcelamentoAnterior`

*Classe que contém as informações do parcelamento anterior.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `parcelamentoAnterior.nroDoProcesso` | `String` | **0** | Número do prccesso de parcelamento |
| `parcelamentoAnterior.tipoDeEntrada` | `String` | **0** | Tipo de entrada |
| `parcelamentoAnterior.configuracaoDoParcelamento` | `ConfigParcelamentosScript` | **0** | Configuração do parcelamento |
| `parcelamentoAnterior.nroDoParcelamento` | `Long` | **0** | Número do parcelamento |
| `parcelamentoAnterior.valorDaEntrada` | `BigDecimal` | **0** | Valor da entrada |
| `parcelamentoAnterior.percentualDaEntrada` | `BigDecimal` | **0** | Percentual de entrada |
| `parcelamentoAnterior.dataDeVencimento` | `Date` | **0** | Data de vencimento do parcelamento |
| `parcelamentoAnterior.intervaloDeVencimento` | `IntervaloVencimento` | **0** | Tipo de intervalo de vencimento do parcelamento |
| `parcelamentoAnterior.quantidadeDeParcelas` | `Integer` | **0** | Quantidade de parcelas |
| `parcelamentoAnterior.quantidadeDeParcelasOriginal` | `Integer` | **0** | Quantidade original de parcelas |
| `parcelamentoAnterior.valorDaRendaFamiliar` | `BigDecimal` | **0** | Valor da renda familiar |
| `parcelamentoAnterior.composicao` | `List` | **0** | Composição |
| `parcelamentoAnterior.dataHoraParcelamento` | `Date` | **0** | Data e hora do parcelamento |
| `parcelamentoAnterior.contribuinte` | `PessoasScript` | **0** | Contribuinte do parcelamento |
| `parcelamentoAnterior.parcelas` | `List` | **0** | Parcelas |
| `parcelamentoAnterior.intervalo` | `Integer` | **0** | Intervalo de vencimento |
| `parcelamentoAnterior.codigo` | `Long` | **0** | Código de identificação do parcelamento |
| `parcelamentoAnterior.situacao` | `String` | **0** | Situação do parcelamento |

### `creditoTributario`

*Classe que contém as informações do crédito tributário do parcelamento.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `creditoTributario.abreviatura` | `String` | 18 | Abreviatura do crédito tributário |
| `creditoTributario.calculaImoveisRurais` | `String` | **0** | Indica se irá gerar lançamentos de créditos para imóveis rurais |
| `creditoTributario.codigo` | `Long` | **0** | Código do crédito tributário |
| `creditoTributario.creditosTributariosRec` | `List` | **0** | Relacionamento entre o crédito tributário e a receita |
| `creditoTributario.tipoCadastro` | `String` | **0** | Tipo de cadastro ao qual pertence o crédito tributário |
| `creditoTributario.descricao` | `String` | **0** | Descrição do crédito tributário |
| `creditoTributario.indexador` | `IndexadoresScript` | **0** | Código do indexador |

### `guiaReceita`

*Classe que contém as informações da receita da guia.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `guiaReceita.valorDoJuro` | `BigDecimal` | 93 | Valor de juro para a receita |
| `guiaReceita.valorDaMulta` | `BigDecimal` | 93 | Valor da multa para a receita |
| `guiaReceita.valorReceita` | `BigDecimal` | 28 | Valor lançado para a receita em moeda corrente → Valor lançado em moeda corrente |
| `guiaReceita.abreviatura` | `String` | 22 | Abreviatura da receita da guia |
| `guiaReceita.valorDaCorrecao` | `BigDecimal` | 19 | Valor de correção para a receita |
| `guiaReceita.receita` | `ReceitasScript` | 1 | Receita da guia |
| `guiaReceita.valorIndexadorReceita` | `BigDecimal` | **0** | Valor lançado para a receita → Valor que foi calculado |
| `guiaReceita.valorDescontoReceita` | `BigDecimal` | **0** | Valor do desconto para a receita |
| `guiaReceita.creditosTributariosRec` | `CreditosTributariosRecScript` | **0** | Tipo de serviço vinculada a receita diversa |

### `contribuinte`

*Classe que contém as informações do contribuinte do parcelamento.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `contribuinte.porteEmpresa` | `String` | 1 | Porte da empresa |
| `contribuinte.codigo` | `Long` | 1 | Código de identificação do contribuinte |
| `contribuinte.cpfCnpj` | `String` | 1 | CPF/CNPJ do contribuinte |
| `contribuinte.optanteDoSimples` | `String` | **0** | Optante do simples |
| `contribuinte.camposAdicionais` | `Map` | **0** | Campos Adicionais |
| `contribuinte.nome` | `String` | **0** | Nome do contribuinte |
| `contribuinte.nomeFantasia` | `String` | **0** | Nome fantasia do contribuinte |
| `contribuinte.situacao` | `String` | **0** | Situação |
| `contribuinte.id` | `Long` | **0** | Identificador do contribuinte |

### `guia`

*Classe que contém as informações da guia.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `guia.nroBaixa` | `Long` | 2 | Número de baixa da guia |
| `guia.valorDeDescontoDoJuro` | `BigDecimal` | **0** | Desconto de juro |
| `guia.valorDeDescontoDaCorrecao` | `BigDecimal` | **0** | Desconto de correção |
| `guia.valorDeDescontoDaMulta` | `BigDecimal` | **0** | Desconto da multa |
| `guia.receitasDaGuia` | `List` | **0** | Receitas da guia |
| `guia.valorDaCorrecao` | `BigDecimal` | **0** | Valor total de correção |
| `guia.vencimento` | `Date` | **0** | Data de vencimento |
| `guia.valorDoJuro` | `BigDecimal` | **0** | Valor total de juro |
| `guia.valorDaMulta` | `BigDecimal` | **0** | Valor total da multa |
| `guia.valorDaCorrecaoPreFixada` | `BigDecimal` | **0** | Valor total de correção pré-fixada |
| `guia.valorDoJuroDeFinanciamento` | `BigDecimal` | **0** | Valor total de juro de financiamento |
| `guia.configuracaoParcela` | `ConfiguracoesGeracaoParcelasScript` | **0** | Configuração de parcelas |
| `guia.cotaUnica` | `String` | **0** | Cota única |
| `guia.situacaoParcela` | `String` | **0** | Situação da parcela |
| `guia.nroParcela` | `Integer` | **0** | Número da parcela |
| `guia.codigo` | `Long` | **0** | Código da guia |
| `guia.valorIndexador` | `BigDecimal` | **0** | Valor que foi calculado o lançamento |
| `guia.lancamentos` | `LancamentosCalculosScript` | **0** | Lancamento |
| `guia.valorDesconto` | `BigDecimal` | **0** | Valor do desconto |
| `guia.valorLancado` | `BigDecimal` | **0** | Valor lançado em moeda corrente |
| `guia.indexador` | `IndexadoresScript` | **0** | Indexador |

### `dividaReceita`

*Classe que contém as informações da receita da dívida.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `dividaReceita.abreviatura` | `String` | 30 | Abreviatura da receita da dívida |
| `dividaReceita.receita` | `ReceitasScript` | 20 | Receita da dívida |
| `dividaReceita.valorJuros` | `BigDecimal` | 17 | Valor de juros |
| `dividaReceita.valorMulta` | `BigDecimal` | 17 | Valor da multa |
| `dividaReceita.valorCorrecao` | `BigDecimal` | 16 | Valor de correção |
| `dividaReceita.valorSaldo` | `BigDecimal` | 14 | Saldo da dívida |
| `dividaReceita.valorSaldoMoedaCorrente` | `BigDecimal` | 8 | Saldo da dívida em moeda corrente |
| `dividaReceita.creditosTributariosRec` | `CreditosTributariosRecScript` | 1 | Receita do crédito tributário relacionado a dívida |
| `dividaReceita.valorAnistiaSaldo` | `BigDecimal` | **0** | Anistia concedida para o saldo da dívida |
| `dividaReceita.valorInscrito` | `BigDecimal` | **0** | Valor inscrito |

### `divida`

*Classe que contém as informações da dívida.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `divida.dataInscricao` | `Date` | 14 | Data de inscrição da dívida |
| `divida.anoDivida` | `Integer` | 7 | Ano da dívida |
| `divida.dataVencimentoDivida` | `Date` | 3 | Data de vencimento da dívida |
| `divida.nroInscricao` | `Long` | 1 | Número da inscrição da dívida |
| `divida.processoInscricao` | `String` | **0** | Processo de inscrição da dívida |
| `divida.valorDeDescontoDoSaldo` | `BigDecimal` | **0** | Desconto do saldo |
| `divida.valorDeDescontoDoJuro` | `BigDecimal` | **0** | Desconto de juro |
| `divida.valorDeDescontoDaCorrecao` | `BigDecimal` | **0** | Desconto de correção |
| `divida.valorDeDescontoDaMulta` | `BigDecimal` | **0** | Desconto da multa |
| `divida.posicao` | `Integer` | **0** | Posição de inscrição da dívida |
| `divida.valorJuros` | `BigDecimal` | **0** | Valor de juros |
| `divida.folha` | `Integer` | **0** | Folha de inscrição da dívida |
| `divida.receitaDiversa` | `ReceitasDiversasLanctosScript` | **0** | Receita diversa relacionada a dívida |
| `divida.imovel` | `ImoveisScript` | **0** | Imóvel relacionado a dívida |
| `divida.economico` | `EconomicosScript` | **0** | Econômico relacionado a dívida |
| `divida.notaAvulsa` | `NotasAvulsasScript` | **0** | Nota avulsa relacionada a dívida |
| `divida.livro` | `Integer` | **0** | Livro de inscrição da dívida |
| `divida.contribuicaoMelhoria` | `ContribuicoesMelhoriasScript` | **0** | Contribuição de melhoria relacionada a dívida |
| `divida.contribMelhoriaImovel` | `ContribMelhoriasImoveisScript` | **0** | Imóvel da contribuição de melhoria relacionado a dívida |
| `divida.transferenciaImoveis` | `TransferenciaImoveisScript` | **0** | Transferência de imóveis relacionada a dívida |
| `divida.codigo` | `Long` | **0** | Código da dívida |
| `divida.dataLancamento` | `Date` | **0** | Data de lançamento da dívida |
| `divida.valorSaldoMoedaCorrente` | `BigDecimal` | **0** | Saldo da dívida em moeda corrente |
| `divida.valorCorrecao` | `BigDecimal` | **0** | Valor de correção |
| `divida.valorMulta` | `BigDecimal` | **0** | Valor da multa |
| `divida.creditoTributario` | `CreditosTributariosScript` | **0** | Crédito tributário relacionado a dívida |
| `divida.valorAnistiaSaldo` | `BigDecimal` | **0** | Anistia concedida para o saldo da dívida |
| `divida.dividasReceitas` | `List` | **0** | Receitas da dívida → Receitas relacionadas a dívida |
| `divida.pessoa` | `PessoasScript` | **0** | Contribuinte relacionado a dívida |
| `divida.situacao` | `String` | **0** | Situação atual da dívida |
| `divida.valorSaldo` | `BigDecimal` | **0** | Saldo da dívida |
| `divida.valorInscrito` | `BigDecimal` | **0** | Valor inscrito |
| `divida.status` | `String` | **0** | Status da dívida → Retorna qual o status atual da dívida. Os possíveis retornos são: PROCESSO_EXECUCAO(Em processo de execução), AJUIZADA(Ajuizada), P |

### `configuracaoParcelamento`

*Classe que contém as informações da configuração do parcelamento.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `configuracaoParcelamento.descricao` | `String` | 13 | Descrição da configuração de parcelamento |
| `configuracaoParcelamento.codigo` | `Long` | 1 | Código de identificação da configuração de parcelamento |
| `configuracaoParcelamento.ato` | `AtosScript` | **0** | Ato / Lei da configuração de parcelamento |
| `configuracaoParcelamento.manterAnistiaDivida` | `String` | **0** | Define se ao parcelar uma dívida, a anistia será mantida ou não |
| `configuracaoParcelamento.tipoLancamento` | `String` | **0** | Tipo de lançamento da configuração de parcelamento |
| `configuracaoParcelamento.dtValidadeInicial` | `Date` | **0** | Data de validade inicial da configuração de parcelamento |
| `configuracaoParcelamento.dtValidadeFinal` | `Date` | **0** | Data de validade final da configuração de parcelamento |
| `configuracaoParcelamento.dtVencimentoInicial` | `Date` | **0** | Data de vencimento inicial da configuração de parcelamento |
| `configuracaoParcelamento.dtVencimentoFinal` | `Date` | **0** | Data de vencimento final da configuração de parcelamento |
| `configuracaoParcelamento.qtdMaxParcelas` | `Integer` | **0** | Quantidade máxima de parcelas |
| `configuracaoParcelamento.aplicarValorMinimo` | `String` | **0** | configuracaoParcelamento. aplicarValorMinimo Retorno: |
| `configuracaoParcelamento.vlMinimoFisica` | `BigDecimal` | **0** | Valor mínimo para pessoa física |
| `configuracaoParcelamento.vlMinimoJuridica` | `BigDecimal` | **0** | Valor mínimo para pessoa jurídica |
| `configuracaoParcelamento.definirVlMaxRenda` | `String` | **0** | Valor máximo de renda |
| `configuracaoParcelamento.vencimentoLancamento` | `String` | **0** | Tipo de vencimento do lançamento |
| `configuracaoParcelamento.qtdDiasPrimeiroVcto` | `Integer` | **0** | Quantidade de dias para primeiro vencimento |
| `configuracaoParcelamento.intervaloVctoParcelas` | `String` | **0** | Intervalo de vencimento entre parcelas |
| `configuracaoParcelamento.editarDataParcela` | `String` | **0** | Alterar data da parcela |
| `configuracaoParcelamento.aplicacaoAcrescimos` | `String` | **0** | Tipo de aplicação de acréscimos |
| `configuracaoParcelamento.permitirParcelaSemCpf` | `String` | **0** | Permitir parcelas sem CPF |
| `configuracaoParcelamento.formulaAntecipacao` | `String` | **0** | Tipo de fórmula de antecipação |
| `configuracaoParcelamento.percRenda` | `BigDecimal` | **0** | Percentual de renda |
| `configuracaoParcelamento.exigirEntrada` | `String` | **0** | Exigir entrada |
| `configuracaoParcelamento.percEntrada` | `BigDecimal` | **0** | Percentual de entrada |
| `configuracaoParcelamento.cobrarJuros` | `String` | **0** | Cobrar juros |
| `configuracaoParcelamento.cancelarPorDias` | `String` | **0** | Cancelar por dia |
| `configuracaoParcelamento.qtdDiasVencidos` | `Integer` | **0** | Quantidade de dias vencidos |
| `configuracaoParcelamento.cancelamentoLote` | `CancelamentoLote` | **0** | Cancelamento em lote |
| `configuracaoParcelamento.qtdParcelasAlternadas` | `Integer` | **0** | Quantidade de parcelas alternadas |
| `configuracaoParcelamento.qtdParcelasConsecutivas` | `Integer` | **0** | Quantidade de parcelas consecutivas |
| `configuracaoParcelamento.permitirManutencaoLancamento` | `String` | **0** | Permitir manutenção de lançamento |
| `configuracaoParcelamento.inserirTaxasManual` | `String` | **0** | Permitir inserir taxas manualmente |
| `configuracaoParcelamento.removerTaxasManual` | `String` | **0** | Permitir remover taxas manualmente |
| `configuracaoParcelamento.revogarParcelaDesconto` | `String` | **0** | Revogar desconto da parcela |
| `configuracaoParcelamento.reparcelarParcelamento` | `String` | **0** | Reparcelar |
| `configuracaoParcelamento.permitirIncentivosFiscais` | `String` | **0** | Permitir incentivos físcais |
| `configuracaoParcelamento.parcelamentoGerado` | `String` | **0** | Possúis parcelamento gerado para a configuração |
| `configuracaoParcelamento.creditosTributarios` | `List` | **0** | Créditos tributários da configuração de parcelamento |

### `tipoDesconto`

*Define os tipos de descontos que podem ser aplicados.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `tipoDesconto.TRIBUTO` | `String` | **0** | Indica que o desconto será concedido para o valor do tributo. |
| `tipoDesconto.JUROS` | `String` | **0** | Indica que o desconto será concedido para o valor dos juros. |
| `tipoDesconto.MULTA` | `String` | **0** | Indica que o desconto será concedido para o valor da multa. |
| `tipoDesconto.CORRECAO` | `String` | **0** | Indica que o desconto será concedido para o valor da correção. |

---

## Classes utilitárias

### `CamposAdicionais`

*Classe de funções de campos adicionais*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase)` | `Object` | 9 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase, agrupamento)` | `Object` | 9 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase)` | `boolean` | **0** | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase, agrupamento)` | `boolean` | **0** | Função que retorna se opção do campo adicional está selecionada → true / false |

### `Caracteres`

*Classe utilitária para manipulação de Caracteres.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Caracteres.capitaliza(texto)` | `String` | **0** | Por meio desta função é possível colocar a primeira letra de cada palavra de um texto em maiúsculo e as outras letras para minúsculo. → Um texto com a |
| `Caracteres.direita(texto, quantidade)` | `String` | **0** | Obtém uma quantidade específica de caracteres iniciados da direita para esquerda. → Um novo texto com a quantidade de caracteres especificadas referen |
| `Caracteres.equivalente(texto, expressao)` | `boolean` | **0** | Verifica se uma expressão está contida em um texto. → Verdadeiro se a expressão for localizada e falso caso não. |
| `Caracteres.esquerda(texto, quantidade)` | `String` | **0** | Obtém uma quantidade específica de caracteres iniciados da esquerda para direita. → Um novo texto com a quantidade de caracteres especificadas referen |
| `Caracteres.maiusculo(texto)` | `String` | **0** | Converte todos os caracteres de um texto em maiúsculo. → Um texto com todas as letras maiúsculas. |
| `Caracteres.minusculo(texto)` | `String` | **0** | Converte todos os caracteres de um texto em minúsculo. → Um texto com todas as letras minúsculas. |
| `Caracteres.posicao(texto, expressao, posicaoInicio)` | `int` | **0** | Obtém a posição onde um caracter se encontra em um texto. → O índice onde o valor localizado se encontra. |
| `Caracteres.posicao(texto, expressao)` | `int` | **0** | Obtém a posição inicial onde um padrão/expressão regular se encontra em um texto. → O índice onde o valor localizado se encontra. |
| `Caracteres.expressao(texto, expressao)` | `Expressao` | **0** | Cria uma nova expressão regular para ser utilizada com um texto → Expressão regular. |
| `Caracteres.removeEspacos(texto)` | `String` | **0** | Remover o excesso de espaços de um texto. → Um texto com o excesso de espaços removidos. |
| `Caracteres.removeEspacosDireita(texto)` | `String` | **0** | Remove o excesso de espaços de um texto a esquerda. → Um texto com o excesso de espaços à esquerda removidos. |
| `Caracteres.removeEspacosEsquerda(texto)` | `String` | **0** | Remove o excesso de espaços de um texto a direita. → Um texto com o excesso de espaços à direita eliminados. |
| `Caracteres.repetir(texto, repeticao)` | `String` | **0** | Repete um texto especificado de acordo com uma quantidade definida. → Um novo texto com o valor do parâmetro texto repetido de acordo com o valor do p |
| `Caracteres.sobrepor(texto, posicaoInicial, quantidadeSobrepor, textoSobrepor)` | `String` | **0** | Sobrepõe um texto em outro em uma determinada posição e com uma quantidade específica de caracteres. → Um novo texto com o valor especificado sobrepos |
| `Caracteres.substituir(texto, textoLocalizar, textoSubstituir)` | `String` | **0** | Substitui as ocorrências de uma expressão localizada em um texto por outra expressão. → Um novo texto com o valor substituído pelo valor especifiado d |
| `Caracteres.subTexto(texto, inicio, tamanho)` | `String` | **0** | Obtém um número específico de caracteres de uma posição específica de um texto. → Um intervalo de caracteres de acordo com a posição inicial e quantid |
| `Caracteres.tamanho(texto)` | `int` | **0** | Obtém o tamanho de um texto. → O tamanho do texto. |
| `Caracteres.vazio(valor)` | `boolean` | **0** | Verifica se uma palavra está vazia. → Verdadeiro se a palavra estiver vazia e falso caso não. |
| `Caracteres.dividir(texto, expressao)` | `Iterable` | **0** | Esta função divide um texto de acordo com a expressão regular informada → Lista com os valores divididos. |
| `Caracteres.dividir(texto, expressao)` | `Iterable` | **0** | Esta função divide um texto de acordo com a expressão regular informada → Lista com os valores divididos. |

### `lancamentos`

*Retornar as informações dos lançamentos*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `lancamentos.getPossuiGuias(Imovel)` | `Boolean` | **0** | Indica se o imóvel possui guias lançadas |
| `lancamentos.getPossuiGuiasVencidas(Imovel, Data)` | `Boolean` | **0** | Indica se o imóvel possui guias vencidas |
| `lancamentos.getPossuiGuiasAVencer(Imovel, Data)` | `Boolean` | **0** | Indica se o imóvel possui guias a vencer |

### `Datas`

*Classe utilitária para operações que utilizam datas.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Datas.hoje` | `Date` | 67 | Obtém a data e hora do sistema operacional. → A data e hora corrente do sistema operacional. |
| `Datas.data(ano, mes, dia)` | `Date` | 47 | Gera uma data sem hora de acordo com os parâmetros informados. Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1). Para parâmetr |
| `Datas.formatar(data, formato)` | `String` | 27 | Obtem o valor de uma data formatada de acordo com um padrão especificado. → Texto contendo a data no formato especificado |
| `Datas.ano(data)` | `Integer` | 10 | Obtém o ano em que se encontra uma determinada data. → Um número referente ao ano da data especificada. |
| `Datas.diferencaAnos(menorData, maiorData)` | `long` | 3 | Calcula a diferença em anos entre duas datas. → Um número referente a diferença entre anos. |
| `Datas.mes(data)` | `Integer` | 2 | Obtém o mês em que se encontra uma determinada data. → Um número referente ao mês da data especificada. |
| `Datas.adicionaDias(data, quantidadeDias)` | `Date` | **0** | Adiciona uma quantidade especificada de dias à uma data. → Uma nova data referente aos dias especificados. |
| `Datas.adicionaHoras(data, quantidadeHoras)` | `Date` | **0** | Adiciona uma quantidade especificada de horas em uma data/hora. → Uma nova data/hora referente as horas especificadas. |
| `Datas.adicionaMeses(data, quantidadeMeses)` | `Date` | **0** | Adiciona uma quantidade especificada de meses em uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/10/201 |
| `Datas.adicionaMinutos(data, quantidadeMinutos)` | `Date` | **0** | Adiciona uma quantidade especificada de minutos em uma data/hora. → Uma nova data/hora referente aos minutos especificados. |
| `Datas.adicionaSegundos(data, quantidadeSegundos)` | `Date` | **0** | Adiciona uma quantidade especificada de segundos em uma data/hora. → Uma nova data/hora referente aos segundos especificados. |
| `Datas.dataHora(ano, mes, dia, hora, minuto)` | `Date` | **0** | Gera uma data com a hora de acordo com os parâmetros.Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1, 5, 9). Para parâmetros n |
| `Datas.dia(data)` | `Integer` | **0** | Obtém o dia em que se encontra uma determinada data. → Um número referente ao dia da data especificada. |
| `Datas.diaSemana(data)` | `Integer` | **0** | Obtém o dia da semana em que se encontra uma determinada data, considerando-se o domingo como primeiro dia e o sábado como o sétimo dia. → Um número r |
| `Datas.diferencaDias(menorData, maiorData)` | `long` | **0** | Calcula a diferença em dias entre duas datas. → Um número referente a diferença entre dias. |
| `Datas.diferencaHoras(menorData, maiorData)` | `long` | **0** | Calcula a diferença em horas entre duas datas. → Um número referente a diferença entre horas. |
| `Datas.diferencaMeses(menorData, maiorData)` | `long` | **0** | Calcula a diferença em meses entre duas datas. → Um número referente a diferença entre meses. |
| `Datas.diferencaMinutos(menorData, maiorData)` | `long` | **0** | Calcula a diferença em minutos entre duas datas/hora. → Um número referente a diferença entre minutos. |
| `Datas.diferencaSegundos(menorData, maiorData)` | `long` | **0** | Calcula a diferença em segundos entre duas datas/hora. → Um número referente a diferença entre segundos. |
| `Datas.ehData(texto)` | `boolean` | **0** | Verifica se um texto é uma data válida. → Verdadeiro se o texto for uma data e falso caso não. |
| `Datas.extenso(data)` | `String` | **0** | Obtém a data por extenso. → A data por extenso (01/01/20011 - Sábado, 1 de Janeiro de 2011). |
| `Datas.hora(data)` | `Integer` | **0** | Obtém a hora em que se encontra uma determinada data/hora. → Um valor inteiro de 00 a 23 referente à hora. |
| `Datas.minuto(data)` | `Integer` | **0** | Obtém os minutos referentes a uma determinada data/hora. → Um valor inteiro de 00 a 59 referente ao minuto. |
| `Datas.nomeDiaSemana(data)` | `String` | **0** | Obtém o nome do dia da semana. → O nome do dia da semana correspondente a data informada (Segunda, Terça..., Domingo). |
| `Datas.nomeMes(data)` | `String` | **0** | Obtém o nome do mês de uma data. → O nome do mês correspondente a data informada (Janeiro, Fevereiro..., Março). |
| `Datas.periodo(dataInicial, dataFinal)` | `Periodo` | **0** | Cria um período a partir da data inicial e data final. → Um periodo a partir da data inicial e data final . |
| `Datas.removeDias(data, quantidadeDias)` | `Date` | **0** | Remove uma quantidade especificada de dias de uma data. → Uma nova data considerando os dias que foram subtraídos da data especificada. |
| `Datas.removeMeses(data, quantidadeMeses)` | `Date` | **0** | Remove uma quantidade especificada de meses de uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/12/2011, |
| `Datas.segundo(data)` | `Integer` | **0** | Obtém os segundos referentes a uma determinada data/hora. → Um valor inteiro de 00 a 59 referente ao segundo. |

### `dadosContribuinte`

*Retornar os dados de um contribuinte.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `dadosContribuinte.buscarPorCodigo(Long)` | `PessoasScript` | **0** | Retorna as informações do contribuinte com base no seu código |

### `Numeros`

*Classe utilitária para operações que utilizam números.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Numeros.arredonda(valor, casasDecimais)` | `Number` | 176 | Arredonda um valor. → Um novo valor arredondado considerando as casas decimais especificadas. |
| `Numeros.trunca(valor, casasDecimais)` | `Number` | 2 | Trunca um valor de acordo com o número de casas decimais especificadas. → Um novo valor truncado. |
| `Numeros.absoluto(valor)` | `Number` | **0** | Calcula o valor absoluto de um número. → O valor absoluto. |
| `Numeros.coseno(valor)` | `Number` | **0** | Calcula o co-seno de um ângulo. |
| `Numeros.ehNumero(texto)` | `boolean` | **0** | Verifica se um texto é um número válido. → Verdadeiro se for um número e falso caso não for. |
| `Numeros.exponencial(numero)` | `Number` | **0** | Obtém o exponencial de um número específico. → O valor exponencial de um número |
| `Numeros.fatorial(numero)` | `Number` | **0** | Obtém o fatorial de um número. → O valor fatorial de um número. |
| `Numeros.logaritmo(valor)` | `Number` | **0** | Informa o logaritmo natural de um número. → O logaritmo natural do argumento. |
| `Numeros.logaritmo10(valor)` | `Number` | **0** | Informa logaritmo de base 10 de um número. → O logaritmo de base 10. |
| `Numeros.maximo(valor1, valor2)` | `Number` | **0** | Obtém o maior valor entre dois números. → O maior valor entre os números informados. |
| `Numeros.minimo(valor1, valor2)` | `Number` | **0** | Obtém o menor valor entre dois números. → O menor valor entre os números informados. |
| `Numeros.numero(texto)` | `Number` | **0** | Converte o valor de um texto em um número. → O número referente ao texto informado. Caso o texto seja inválido, o valor de retorno será 0. |
| `Numeros.pi(valorMultiplicar)` | `Number` | **0** | Multiplica o valor de PI pelo número especificado. → O resultado da multiplicação do argumento pelo valor de PI. |
| `Numeros.piso(valor)` | `Number` | **0** | Obtém o maior número que é menor ou igual ao número espedificado, sendo este número inteiro. → O maior número inteiro que é menor ou igual ao número e |
| `Numeros.potencia(valor1, valor2)` | `Number` | **0** | Calcula o valor da potência de um número. → O valor calculado da potencialização. |
| `Numeros.raiz(valor)` | `Number` | **0** | Calcula a raiz quadrada de um número. → A raiz quadrada do parâmetro informado. |
| `Numeros.randomico(numeroDelimitador)` | `Integer` | **0** | Obtém um número aleatório entre 1 a um valor limite especificado. → Um numérico aleatório de 1 até o número especificado. |
| `Numeros.resto(valorDividendo, valorDivisor)` | `Number` | **0** | Retorna o resto da divisão realizada entre o dividendo e o divisor, que são passados por parâmetro. → O resto de uma divisão. |
| `Numeros.seno(valor)` | `Number` | **0** | Calcula o seno de um ângulo. |
| `Numeros.seZero(valor1, valor2, valorN)` | `Number` | **0** | Testa os valores passados como parâmetro e retorna o primeiro diferente de zero. Todos os valores informados devem ser do mesmo tipo. → O primeiro val |
| `Numeros.tangente(valor)` | `Number` | **0** | Calcula a tangente de um ângulo. |
| `Numeros.teto(valor)` | `Number` | **0** | Obtém o menor número que é maior ou igual ao número espedificado, sendo este número inteiro. → O menor número inteiro que é maior ou igual ao número e |

### `situacaoFinanceira`

*Retornar as informações sobre a situação financeira do contribuinte.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `situacaoFinanceira.quantidadeParcelasVencidasPorContribuinte(Long)` | `Long` | **0** | Retorna quantidade de parcelas vencidas do crédito gerado através do contribuinte. |
| `situacaoFinanceira.qtdDividasAtivasVencidasPorContribuinteCredito(Long, Long)` | `Long` | **0** | Retorna quantidade de dividas ativas do contribuinte por crédito tributário. |
| `situacaoFinanceira.quantidadeParcelasVencidasPorLancamento(Long)` | `Long` | **0** | Retorna quantidade de parcelas vencidas do crédito gerado através do lançamento. |
| `situacaoFinanceira.quantidadeParcelasVencidasPorCreditoEContribuinte(Long, Long)` | `Long` | **0** | Retorna quantidade de parcelas vencidas do crédito gerado através do crédito e do contribuinte. → Retorna quantidade de parcelas vencidas do crédito g |
| `situacaoFinanceira.qtdDividasAtivasVencidasPorCreditoContribuinteDtVencto(Long, Long, Date)` | `Long` | **0** | Retorna quantidade de dividas ativas do contribuinte por crédito tributário e data de vencimento. |
| `situacaoFinanceira.quantidadeParcelasVencidasPorCreditoEContribuinteEDataVencimento(Long, Long, Date)` | `Long` | **0** | Retorna quantidade de parcelas vencidas do crédito gerado através do crédito e do contribuinte anterior a uma data de vencimento. → Retorna quantidade |
| `situacaoFinanceira.qtdDividasAtivasVencidasPorContribuinte(Long)` | `Long` | **0** | Retorna quantidade de dividas ativas do contribuinte. |
| `situacaoFinanceira.quantidadeParcelasVencidasPorContribuinteEDataVencimento(Long, Date)` | `Long` | **0** | Retorna quantidade de parcelas vencidas do crédito gerado através do contribuinte anterior a uma data de vencimento. → Retorna quantidade de parcelas  |
| `situacaoFinanceira.quantidadeParcelasVencidasPorLancamentoEDataVencimento(Long, Date)` | `Long` | **0** | Retorna quantidade de parcelas vencidas do crédito gerado através do lançamento anterior a uma data de vencimento. → Retorna quantidade de parcelas ve |

---

## Snippets do editor

Modelos que o próprio editor oferece — mostram sintaxe **aceita** neste tipo.

**Percorrer modo 1** (`laco1`)

```groovy
percorrer(de:0,ate:9){
	imprimir indice
}
```

**Comentário** (`comentario`)

```groovy
/*Informe aqui seu coment?rio*/
```

**Percorrer modo 1** (`laco2`)

```groovy
percorrer(de:0,ate:9){
	se (indice == 5){
		suspender("Parou no indice 5")
	}
	imprimir indice
}
```
