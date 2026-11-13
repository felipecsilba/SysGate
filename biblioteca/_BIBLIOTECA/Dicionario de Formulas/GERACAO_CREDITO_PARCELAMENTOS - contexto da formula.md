# Contexto da fórmula — tipo `GERACAO_CREDITO_PARCELAMENTOS`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/GERACAO_CREDITO_PARCELAMENTOS.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — 49 fórmulas do tipo `GERACAO_CREDITO_PARCELAMENTOS`.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**8 variáveis de contexto · 6 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### Valores simples

| Variável | O que é |
|---|---|
| `qtdParcelas` | Quantidade de parcelas |
| `dividas` | Coleção das dívidas que compõem o parcelamento |
| `usuarioCorrente` | Usuário corrente do sistema *(0 usos)* |
| `guias` | Coleção dos débitos que compõem o parcelamento *(0 usos)* |

### `parcela`

*Classe que contém as informações da parcela*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `parcela.numeroDaParcela` | `Integer` | 31 | Número da parcela |
| `parcela.valorDaParcela` | `BigDecimal` | 5 | Valor da parcela |
| `parcela.descontoDeJuros` | `BigDecimal` | 2 | Valor de desconto de juros na parcela |
| `parcela.descontoDeMulta` | `BigDecimal` | 2 | Valor de desconto de multa na parcela |
| `parcela.valorDeJuros` | `BigDecimal` | 1 | Valor de juros na parcela |
| `parcela.valorDeMulta` | `BigDecimal` | 1 | Valor de multa na parcela |
| `parcela.valorDeCorrecao` | `BigDecimal` | 1 | Valor de correção na parcela |
| `parcela.descontoDeCorrecao` | `BigDecimal` | 1 | Valor de desconto de correção na parcela |
| `parcela.valorDoDesconto` | `BigDecimal` | 1 | Valor do desconto |
| `parcela.valorDaCorrecaoPrefixada` | `BigDecimal` | **0** | Valor da correção pré-fixada |
| `parcela.valorDoReforco` | `BigDecimal` | **0** | Valor reforço |
| `parcela.valorTotalDasTaxas` | `BigDecimal` | **0** | Valor total das taxas |
| `parcela.vencimento` | `Date` | **0** | Data de vencimento da parcela |
| `parcela.valorDoJuroDeFinanciamento` | `BigDecimal` | **0** | Valor do juro de financiamento |
| `parcela.codigo` | `Long` | **0** | Código de identificação da parcela |

### `configuracaoParcelamento`

*Classe que contém as informações da configuração do parcelamento*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `configuracaoParcelamento.descricao` | `String` | 19 | Descrição da configuração de parcelamento |
| `configuracaoParcelamento.percEntrada` | `BigDecimal` | 1 | Percentual de entrada |
| `configuracaoParcelamento.ato` | `AtosScript` | **0** | Ato / Lei da configuração de parcelamento |
| `configuracaoParcelamento.codigo` | `Long` | **0** | Código de identificação da configuração de parcelamento |
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

### `montante`

*Classe que contém as informações de valores da parcela*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `montante.juroDesconto` | `BigDecimal` | **0** | Desconto do valor do juro |
| `montante.multaDesconto` | `BigDecimal` | **0** | Desconto do valor da multa |
| `montante.lancadoDesconto` | `BigDecimal` | **0** | Desconto do valor lançado |
| `montante.correcaoDesconto` | `BigDecimal` | **0** | Desconto do valor da correção |
| `montante.lancado` | `BigDecimal` | **0** | Valor lançado |
| `montante.correcao` | `BigDecimal` | **0** | Valor da correção |
| `montante.juro` | `BigDecimal` | **0** | Valor do juros |
| `montante.multa` | `BigDecimal` | **0** | Valor da multa |

### `contribuinte`

*Classe que contém as informações do contribuinte*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `contribuinte.cpfCnpj` | `String` | 2 | CPF/CNPJ do contribuinte |
| `contribuinte.optanteDoSimples` | `String` | **0** | Optante do simples |
| `contribuinte.porteEmpresa` | `String` | **0** | Porte da empresa |
| `contribuinte.camposAdicionais` | `Map` | **0** | Campos Adicionais |
| `contribuinte.codigo` | `Long` | **0** | Código de identificação do contribuinte |
| `contribuinte.nome` | `String` | **0** | Nome do contribuinte |
| `contribuinte.nomeFantasia` | `String` | **0** | Nome fantasia do contribuinte |
| `contribuinte.situacao` | `String` | **0** | Situação |
| `contribuinte.id` | `Long` | **0** | Identificador do contribuinte |

---

## Classes utilitárias

### `TabelasAuxiliares`

*Classe de funções de tabelas auxiliares*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `TabelasAuxiliares.buscarRegistrosDaTabela(codigoTabelaAuxiliar)` | `List` | 4 | Função que retorna os registros de tabelas auxiliares → Lista de registros da tabela auxiliar |
| `TabelasAuxiliares.buscarRegistroDaTabelaPorCampo(codigoTabelaAuxiliar, numeroCampo, valorCampo)` | `RegistrosTabelasAuxiliaresScript` | 4 | Função que retorna o registro completo com base no valor de um campo específico da tabela auxiliar → Registro da tabela auxiliar |
| `TabelasAuxiliares.valorDoCampoPorDescricao(registro, descricaoCampo)` | `String` | 2 | Função que retorna o valor de um campo específico de um registro da tabela auxiliar |

### `Caracteres`

*Classe utilitária para manipulação de Caracteres.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Caracteres.tamanho(texto)` | `int` | 4 | Obtém o tamanho de um texto. → O tamanho do texto. |
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
| `Caracteres.vazio(valor)` | `boolean` | **0** | Verifica se uma palavra está vazia. → Verdadeiro se a palavra estiver vazia e falso caso não. |
| `Caracteres.dividir(texto, expressao)` | `Iterable` | **0** | Esta função divide um texto de acordo com a expressão regular informada → Lista com os valores divididos. |
| `Caracteres.dividir(texto, expressao)` | `Iterable` | **0** | Esta função divide um texto de acordo com a expressão regular informada → Lista com os valores divididos. |

### `UtilitariosTaxas`

*Classe utilitária com funções que auxiliam no cálculo da taxa*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `UtilitariosTaxas.existePagamentoDeTaxaNoParcelamentoDaDivida(divida.codigo, abreviaturaReceita)` | `boolean` | 25 | Função que verifica se existe algum pagamento de taxa em parcelamentos anteriores onde a dívida esteja na composição. → true / false |
| `UtilitariosTaxas.existePagamentoDeTaxaNoParcelamentoDoDebito(guia.codigo, abreviaturaReceita)` | `boolean` | **0** | Função que verifica se existe algum pagamento de taxa em parcelamentos anteriores onde o débito esteja na composição. → true / false |

### `Datas`

*Classe utilitária para operações que utilizam datas.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Datas.hoje` | `Date` | 2 | Obtém a data e hora do sistema operacional. → A data e hora corrente do sistema operacional. |
| `Datas.adicionaDias(data, quantidadeDias)` | `Date` | **0** | Adiciona uma quantidade especificada de dias à uma data. → Uma nova data referente aos dias especificados. |
| `Datas.adicionaHoras(data, quantidadeHoras)` | `Date` | **0** | Adiciona uma quantidade especificada de horas em uma data/hora. → Uma nova data/hora referente as horas especificadas. |
| `Datas.adicionaMeses(data, quantidadeMeses)` | `Date` | **0** | Adiciona uma quantidade especificada de meses em uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/10/201 |
| `Datas.adicionaMinutos(data, quantidadeMinutos)` | `Date` | **0** | Adiciona uma quantidade especificada de minutos em uma data/hora. → Uma nova data/hora referente aos minutos especificados. |
| `Datas.adicionaSegundos(data, quantidadeSegundos)` | `Date` | **0** | Adiciona uma quantidade especificada de segundos em uma data/hora. → Uma nova data/hora referente aos segundos especificados. |
| `Datas.ano(data)` | `Integer` | **0** | Obtém o ano em que se encontra uma determinada data. → Um número referente ao ano da data especificada. |
| `Datas.data(ano, mes, dia)` | `Date` | **0** | Gera uma data sem hora de acordo com os parâmetros informados. Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1). Para parâmetr |
| `Datas.dataHora(ano, mes, dia, hora, minuto)` | `Date` | **0** | Gera uma data com a hora de acordo com os parâmetros.Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1, 5, 9). Para parâmetros n |
| `Datas.dia(data)` | `Integer` | **0** | Obtém o dia em que se encontra uma determinada data. → Um número referente ao dia da data especificada. |
| `Datas.diaSemana(data)` | `Integer` | **0** | Obtém o dia da semana em que se encontra uma determinada data, considerando-se o domingo como primeiro dia e o sábado como o sétimo dia. → Um número r |
| `Datas.diferencaAnos(menorData, maiorData)` | `long` | **0** | Calcula a diferença em anos entre duas datas. → Um número referente a diferença entre anos. |
| `Datas.diferencaDias(menorData, maiorData)` | `long` | **0** | Calcula a diferença em dias entre duas datas. → Um número referente a diferença entre dias. |
| `Datas.diferencaHoras(menorData, maiorData)` | `long` | **0** | Calcula a diferença em horas entre duas datas. → Um número referente a diferença entre horas. |
| `Datas.diferencaMeses(menorData, maiorData)` | `long` | **0** | Calcula a diferença em meses entre duas datas. → Um número referente a diferença entre meses. |
| `Datas.diferencaMinutos(menorData, maiorData)` | `long` | **0** | Calcula a diferença em minutos entre duas datas/hora. → Um número referente a diferença entre minutos. |
| `Datas.diferencaSegundos(menorData, maiorData)` | `long` | **0** | Calcula a diferença em segundos entre duas datas/hora. → Um número referente a diferença entre segundos. |
| `Datas.ehData(texto)` | `boolean` | **0** | Verifica se um texto é uma data válida. → Verdadeiro se o texto for uma data e falso caso não. |
| `Datas.extenso(data)` | `String` | **0** | Obtém a data por extenso. → A data por extenso (01/01/20011 - Sábado, 1 de Janeiro de 2011). |
| `Datas.hora(data)` | `Integer` | **0** | Obtém a hora em que se encontra uma determinada data/hora. → Um valor inteiro de 00 a 23 referente à hora. |
| `Datas.mes(data)` | `Integer` | **0** | Obtém o mês em que se encontra uma determinada data. → Um número referente ao mês da data especificada. |
| `Datas.minuto(data)` | `Integer` | **0** | Obtém os minutos referentes a uma determinada data/hora. → Um valor inteiro de 00 a 59 referente ao minuto. |
| `Datas.nomeDiaSemana(data)` | `String` | **0** | Obtém o nome do dia da semana. → O nome do dia da semana correspondente a data informada (Segunda, Terça..., Domingo). |
| `Datas.nomeMes(data)` | `String` | **0** | Obtém o nome do mês de uma data. → O nome do mês correspondente a data informada (Janeiro, Fevereiro..., Março). |
| `Datas.periodo(dataInicial, dataFinal)` | `Periodo` | **0** | Cria um período a partir da data inicial e data final. → Um periodo a partir da data inicial e data final . |
| `Datas.removeDias(data, quantidadeDias)` | `Date` | **0** | Remove uma quantidade especificada de dias de uma data. → Uma nova data considerando os dias que foram subtraídos da data especificada. |
| `Datas.removeMeses(data, quantidadeMeses)` | `Date` | **0** | Remove uma quantidade especificada de meses de uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/12/2011, |
| `Datas.segundo(data)` | `Integer` | **0** | Obtém os segundos referentes a uma determinada data/hora. → Um valor inteiro de 00 a 59 referente ao segundo. |
| `Datas.formatar(data, formato)` | `String` | **0** | Obtem o valor de uma data formatada de acordo com um padrão especificado. → Texto contendo a data no formato especificado |

### `Numeros`

*Classe utilitária para operações que utilizam números.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Numeros.arredonda(valor, casasDecimais)` | `Number` | 10 | Arredonda um valor. → Um novo valor arredondado considerando as casas decimais especificadas. |
| `Numeros.piso(valor)` | `Number` | 4 | Obtém o maior número que é menor ou igual ao número espedificado, sendo este número inteiro. → O maior número inteiro que é menor ou igual ao número e |
| `Numeros.ehNumero(texto)` | `boolean` | 2 | Verifica se um texto é um número válido. → Verdadeiro se for um número e falso caso não for. |
| `Numeros.numero(texto)` | `Number` | 2 | Converte o valor de um texto em um número. → O número referente ao texto informado. Caso o texto seja inválido, o valor de retorno será 0. |
| `Numeros.trunca(valor, casasDecimais)` | `Number` | 2 | Trunca um valor de acordo com o número de casas decimais especificadas. → Um novo valor truncado. |
| `Numeros.absoluto(valor)` | `Number` | **0** | Calcula o valor absoluto de um número. → O valor absoluto. |
| `Numeros.coseno(valor)` | `Number` | **0** | Calcula o co-seno de um ângulo. |
| `Numeros.exponencial(numero)` | `Number` | **0** | Obtém o exponencial de um número específico. → O valor exponencial de um número |
| `Numeros.fatorial(numero)` | `Number` | **0** | Obtém o fatorial de um número. → O valor fatorial de um número. |
| `Numeros.logaritmo(valor)` | `Number` | **0** | Informa o logaritmo natural de um número. → O logaritmo natural do argumento. |
| `Numeros.logaritmo10(valor)` | `Number` | **0** | Informa logaritmo de base 10 de um número. → O logaritmo de base 10. |
| `Numeros.maximo(valor1, valor2)` | `Number` | **0** | Obtém o maior valor entre dois números. → O maior valor entre os números informados. |
| `Numeros.minimo(valor1, valor2)` | `Number` | **0** | Obtém o menor valor entre dois números. → O menor valor entre os números informados. |
| `Numeros.pi(valorMultiplicar)` | `Number` | **0** | Multiplica o valor de PI pelo número especificado. → O resultado da multiplicação do argumento pelo valor de PI. |
| `Numeros.potencia(valor1, valor2)` | `Number` | **0** | Calcula o valor da potência de um número. → O valor calculado da potencialização. |
| `Numeros.raiz(valor)` | `Number` | **0** | Calcula a raiz quadrada de um número. → A raiz quadrada do parâmetro informado. |
| `Numeros.randomico(numeroDelimitador)` | `Integer` | **0** | Obtém um número aleatório entre 1 a um valor limite especificado. → Um numérico aleatório de 1 até o número especificado. |
| `Numeros.resto(valorDividendo, valorDivisor)` | `Number` | **0** | Retorna o resto da divisão realizada entre o dividendo e o divisor, que são passados por parâmetro. → O resto de uma divisão. |
| `Numeros.seno(valor)` | `Number` | **0** | Calcula o seno de um ângulo. |
| `Numeros.seZero(valor1, valor2, valorN)` | `Number` | **0** | Testa os valores passados como parâmetro e retorna o primeiro diferente de zero. Todos os valores informados devem ser do mesmo tipo. → O primeiro val |
| `Numeros.tangente(valor)` | `Number` | **0** | Calcula a tangente de um ângulo. |
| `Numeros.teto(valor)` | `Number` | **0** | Obtém o menor número que é maior ou igual ao número espedificado, sendo este número inteiro. → O menor número inteiro que é maior ou igual ao número e |

### `Utilitarios`

*Classe de funções gerais para criação de scripts*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Utilitarios.emitirErro(mensagem)` | `Boolean` | 4 | Função que emite erros no cálculo |
| `Utilitarios.buscaValorDoIndexadorPorSiglaNumaDataEspecifica(Sigla, Data)` | `BigDecimal` | 2 | Função que retorna o valor do indexador em uma data específica |
| `Utilitarios.buscaIndexadorPorNomeESigla(Nome, Sigla)` | `IndexadoresScript` | **0** | Utilitarios. buscaIndexadorPorNomeESigla(Nome, Sigla) Parâmetros: Nome - Nome Sigla - Sigla Retorno: Indexador |
| `Utilitarios.buscaBeneficioFiscal(Descrição)` | `BeneficiosFiscaisScript` | **0** | Função que busca o benefício fiscal pela descrição |
| `Utilitarios.existeLancamento(referente, Data)` | `ExisteLancamentoScript` | **0** | Função que verifica se o referente ou o contribuinte possui lançamentos → Objeto contendo a indicação de existência dos lançamentos |
| `Utilitarios.ehMoedaCorrente(Sigla)` | `boolean` | **0** | Função que retorna se o indexador é uma moeda corrente no país → true / false |
| `Utilitarios.ehFeriado(Data)` | `Integer` | **0** | Função que se a data é um feriado → 0 - Não é feriado 1 - É feriado 2 - Domingo 3 - Sabado |
| `Utilitarios.buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo(Sigla, Data inicial, Data final)` | `List` | **0** | Função que retorna as movimentações do indexador em um período → Lista de movimentações do indexador |
| `Utilitarios.valorGeradoLancadoPorCreditoTributarioParaReferente(Código do crédito tributário, Código do referente, Lista de abreviaturas das receitas, Ano, Considerar lançamentos complementares)` | `BigDecimal` | **0** | Buscar o valor gerado/lançado por receita do crédito tributário em questão, possibilitando informar o referente, o ano do lançamento, a receita do lan |
| `Utilitarios.proximoDiaUtil(Data)` | `Date` | **0** | Função que busca o próximo dia útil |

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
