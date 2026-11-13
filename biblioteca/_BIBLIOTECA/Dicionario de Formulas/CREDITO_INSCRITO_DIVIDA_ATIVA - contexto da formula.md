# Contexto da fórmula — tipo `CREDITO_INSCRITO_DIVIDA_ATIVA`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/CREDITO_INSCRITO_DIVIDA_ATIVA.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — nenhuma fórmula deste tipo existe em `Formulas/` — coluna Corpus não se aplica.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**4 variáveis de contexto · 8 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### Valores simples

| Variável | O que é |
|---|---|
| `dataInscricao` | Data da inscrição do crédito em dívida ativa. *(0 usos)* |

### `lancamento`

*Classe que contém as informações do lançamento.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `lancamento.dataLancto` | `Date` | **0** | Data em que o crédito foi gerado |
| `lancamento.debitos` | `List` | **0** | Débitos do lançamento |
| `lancamento.receitaDiversa` | `ReceitasDiversasLanctosScript` | **0** | Receita diversa relacionado ao crédito gerado |
| `lancamento.notaAvulsa` | `NotasAvulsasScript` | **0** | Nota avulsa relacionada ao crédito gerado |
| `lancamento.codigo` | `Long` | **0** | Código de identificação do lançamento |
| `lancamento.complementar` | `SimNao` | **0** | Cálculo complementar |
| `lancamento.imovel` | `ImoveisScript` | **0** | Imóvel relacionado ao crédito gerado |
| `lancamento.economico` | `EconomicosScript` | **0** | Econômico relacionado ao crédito gerado |
| `lancamento.ano` | `Integer` | **0** | Ano do lançamento |
| `lancamento.pessoa` | `PessoasScript` | **0** | Contribuinte relacionado ao crédito gerado |

### `guia`

*Classe que contém as informações da guia.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `guia.nroBaixa` | `Long` | 2 | Número de baixa da guia |
| `guia.vencimento` | `Date` | **0** | Data de vencimento |
| `guia.valorDeDescontoDoJuro` | `BigDecimal` | **0** | Desconto de juro |
| `guia.valorDeDescontoDaCorrecao` | `BigDecimal` | **0** | Desconto de correção |
| `guia.valorDeDescontoDaMulta` | `BigDecimal` | **0** | Desconto da multa |
| `guia.receitasDaGuia` | `List` | **0** | Receitas da guia |
| `guia.valorDaCorrecao` | `BigDecimal` | **0** | Valor total de correção |
| `guia.valorDaCorrecaoPreFixada` | `BigDecimal` | **0** | Valor total de correção pré-fixada |
| `guia.valorDoJuro` | `BigDecimal` | **0** | Valor total de juro |
| `guia.valorDaMulta` | `BigDecimal` | **0** | Valor total da multa |
| `guia.valorDoJuroDeFinanciamento` | `BigDecimal` | **0** | Valor total de juro de financiamento |
| `guia.configuracaoParcela` | `ConfiguracoesGeracaoParcelasScript` | **0** | Configuração de parcelas |
| `guia.cotaUnica` | `String` | **0** | Cota única |
| `guia.situacaoParcela` | `String` | **0** | Situação da parcela |
| `guia.nroParcela` | `Integer` | **0** | Número da parcela |
| `guia.codigo` | `Long` | **0** | Código da guia |
| `guia.valorLancado` | `BigDecimal` | **0** | Valor lançado em moeda corrente |
| `guia.indexador` | `IndexadoresScript` | **0** | Indexador |
| `guia.valorIndexador` | `BigDecimal` | **0** | Valor que foi calculado o lançamento |
| `guia.lancamentos` | `LancamentosCalculosScript` | **0** | Lancamento |
| `guia.valorDesconto` | `BigDecimal` | **0** | Valor do desconto |

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

---

## Classes utilitárias

### `receitaDiversaRepositorio`

*Classe de funções para consulta dos imóveis.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `receitaDiversaRepositorio.buscarReceitaDiversaPeloCodigo(Long)` | `ReceitasDiversasLanctosScript` | **0** | Localiza a receita diversa do crédito pelo código → Uma receita diversa |

### `Caracteres`

*Classe utilitária para manipulação de Caracteres.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Caracteres.subTexto(texto, inicio, tamanho)` | `String` | 593 | Obtém um número específico de caracteres de uma posição específica de um texto. → Um intervalo de caracteres de acordo com a posição inicial e quantid |
| `Caracteres.tamanho(texto)` | `int` | 120 | Obtém o tamanho de um texto. → O tamanho do texto. |
| `Caracteres.direita(texto, quantidade)` | `String` | 119 | Obtém uma quantidade específica de caracteres iniciados da direita para esquerda. → Um novo texto com a quantidade de caracteres especificadas referen |
| `Caracteres.esquerda(texto, quantidade)` | `String` | 95 | Obtém uma quantidade específica de caracteres iniciados da esquerda para direita. → Um novo texto com a quantidade de caracteres especificadas referen |
| `Caracteres.substituir(texto, textoLocalizar, textoSubstituir)` | `String` | 78 | Substitui as ocorrências de uma expressão localizada em um texto por outra expressão. → Um novo texto com o valor substituído pelo valor especifiado d |
| `Caracteres.repetir(texto, repeticao)` | `String` | 32 | Repete um texto especificado de acordo com uma quantidade definida. → Um novo texto com o valor do parâmetro texto repetido de acordo com o valor do p |
| `Caracteres.posicao(texto, expressao, posicaoInicio)` | `int` | 19 | Obtém a posição onde um caracter se encontra em um texto. → O índice onde o valor localizado se encontra. |
| `Caracteres.posicao(texto, expressao)` | `int` | 19 | Obtém a posição inicial onde um padrão/expressão regular se encontra em um texto. → O índice onde o valor localizado se encontra. |
| `Caracteres.removeEspacos(texto)` | `String` | 14 | Remover o excesso de espaços de um texto. → Um texto com o excesso de espaços removidos. |
| `Caracteres.equivalente(texto, expressao)` | `boolean` | 8 | Verifica se uma expressão está contida em um texto. → Verdadeiro se a expressão for localizada e falso caso não. |
| `Caracteres.maiusculo(texto)` | `String` | 8 | Converte todos os caracteres de um texto em maiúsculo. → Um texto com todas as letras maiúsculas. |
| `Caracteres.capitaliza(texto)` | `String` | **0** | Por meio desta função é possível colocar a primeira letra de cada palavra de um texto em maiúsculo e as outras letras para minúsculo. → Um texto com a |
| `Caracteres.minusculo(texto)` | `String` | **0** | Converte todos os caracteres de um texto em minúsculo. → Um texto com todas as letras minúsculas. |
| `Caracteres.expressao(texto, expressao)` | `Expressao` | **0** | Cria uma nova expressão regular para ser utilizada com um texto → Expressão regular. |
| `Caracteres.removeEspacosDireita(texto)` | `String` | **0** | Remove o excesso de espaços de um texto a esquerda. → Um texto com o excesso de espaços à esquerda removidos. |
| `Caracteres.removeEspacosEsquerda(texto)` | `String` | **0** | Remove o excesso de espaços de um texto a direita. → Um texto com o excesso de espaços à direita eliminados. |
| `Caracteres.sobrepor(texto, posicaoInicial, quantidadeSobrepor, textoSobrepor)` | `String` | **0** | Sobrepõe um texto em outro em uma determinada posição e com uma quantidade específica de caracteres. → Um novo texto com o valor especificado sobrepos |
| `Caracteres.vazio(valor)` | `boolean` | **0** | Verifica se uma palavra está vazia. → Verdadeiro se a palavra estiver vazia e falso caso não. |
| `Caracteres.dividir(texto, expressao)` | `Iterable` | **0** | Esta função divide um texto de acordo com a expressão regular informada → Lista com os valores divididos. |
| `Caracteres.dividir(texto, expressao)` | `Iterable` | **0** | Esta função divide um texto de acordo com a expressão regular informada → Lista com os valores divididos. |

### `Datas`

*Classe utilitária para operações que utilizam datas.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Datas.data(ano, mes, dia)` | `Date` | 2660 | Gera uma data sem hora de acordo com os parâmetros informados. Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1). Para parâmetr |
| `Datas.hoje` | `Date` | 1413 | Obtém a data e hora do sistema operacional. → A data e hora corrente do sistema operacional. |
| `Datas.ano(data)` | `Integer` | 1162 | Obtém o ano em que se encontra uma determinada data. → Um número referente ao ano da data especificada. |
| `Datas.mes(data)` | `Integer` | 832 | Obtém o mês em que se encontra uma determinada data. → Um número referente ao mês da data especificada. |
| `Datas.diferencaMeses(menorData, maiorData)` | `long` | 559 | Calcula a diferença em meses entre duas datas. → Um número referente a diferença entre meses. |
| `Datas.dia(data)` | `Integer` | 314 | Obtém o dia em que se encontra uma determinada data. → Um número referente ao dia da data especificada. |
| `Datas.adicionaDias(data, quantidadeDias)` | `Date` | 292 | Adiciona uma quantidade especificada de dias à uma data. → Uma nova data referente aos dias especificados. |
| `Datas.formatar(data, formato)` | `String` | 285 | Obtem o valor de uma data formatada de acordo com um padrão especificado. → Texto contendo a data no formato especificado |
| `Datas.diferencaDias(menorData, maiorData)` | `long` | 239 | Calcula a diferença em dias entre duas datas. → Um número referente a diferença entre dias. |
| `Datas.minuto(data)` | `Integer` | 57 | Obtém os minutos referentes a uma determinada data/hora. → Um valor inteiro de 00 a 59 referente ao minuto. |
| `Datas.hora(data)` | `Integer` | 45 | Obtém a hora em que se encontra uma determinada data/hora. → Um valor inteiro de 00 a 23 referente à hora. |
| `Datas.adicionaMeses(data, quantidadeMeses)` | `Date` | 27 | Adiciona uma quantidade especificada de meses em uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/10/201 |
| `Datas.diferencaAnos(menorData, maiorData)` | `long` | 15 | Calcula a diferença em anos entre duas datas. → Um número referente a diferença entre anos. |
| `Datas.removeMeses(data, quantidadeMeses)` | `Date` | 9 | Remove uma quantidade especificada de meses de uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/12/2011, |
| `Datas.dataHora(ano, mes, dia, hora, minuto)` | `Date` | 5 | Gera uma data com a hora de acordo com os parâmetros.Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1, 5, 9). Para parâmetros n |
| `Datas.removeDias(data, quantidadeDias)` | `Date` | 3 | Remove uma quantidade especificada de dias de uma data. → Uma nova data considerando os dias que foram subtraídos da data especificada. |
| `Datas.adicionaHoras(data, quantidadeHoras)` | `Date` | **0** | Adiciona uma quantidade especificada de horas em uma data/hora. → Uma nova data/hora referente as horas especificadas. |
| `Datas.adicionaMinutos(data, quantidadeMinutos)` | `Date` | **0** | Adiciona uma quantidade especificada de minutos em uma data/hora. → Uma nova data/hora referente aos minutos especificados. |
| `Datas.adicionaSegundos(data, quantidadeSegundos)` | `Date` | **0** | Adiciona uma quantidade especificada de segundos em uma data/hora. → Uma nova data/hora referente aos segundos especificados. |
| `Datas.diaSemana(data)` | `Integer` | **0** | Obtém o dia da semana em que se encontra uma determinada data, considerando-se o domingo como primeiro dia e o sábado como o sétimo dia. → Um número r |
| `Datas.diferencaHoras(menorData, maiorData)` | `long` | **0** | Calcula a diferença em horas entre duas datas. → Um número referente a diferença entre horas. |
| `Datas.diferencaMinutos(menorData, maiorData)` | `long` | **0** | Calcula a diferença em minutos entre duas datas/hora. → Um número referente a diferença entre minutos. |
| `Datas.diferencaSegundos(menorData, maiorData)` | `long` | **0** | Calcula a diferença em segundos entre duas datas/hora. → Um número referente a diferença entre segundos. |
| `Datas.ehData(texto)` | `boolean` | **0** | Verifica se um texto é uma data válida. → Verdadeiro se o texto for uma data e falso caso não. |
| `Datas.extenso(data)` | `String` | **0** | Obtém a data por extenso. → A data por extenso (01/01/20011 - Sábado, 1 de Janeiro de 2011). |
| `Datas.nomeDiaSemana(data)` | `String` | **0** | Obtém o nome do dia da semana. → O nome do dia da semana correspondente a data informada (Segunda, Terça..., Domingo). |
| `Datas.nomeMes(data)` | `String` | **0** | Obtém o nome do mês de uma data. → O nome do mês correspondente a data informada (Janeiro, Fevereiro..., Março). |
| `Datas.periodo(dataInicial, dataFinal)` | `Periodo` | **0** | Cria um período a partir da data inicial e data final. → Um periodo a partir da data inicial e data final . |
| `Datas.segundo(data)` | `Integer` | **0** | Obtém os segundos referentes a uma determinada data/hora. → Um valor inteiro de 00 a 59 referente ao segundo. |

### `imovelRepositorio`

*Classe de funções para consulta dos imóveis.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `imovelRepositorio.buscarImoveisDoContribuinte(contribuinte.codigo)` | `List` | **0** | Localiza os imóveis pelo código do contribuinte → Uma lista de imóveis |
| `imovelRepositorio.getEhEnglobado(Imóvel)` | `Boolean` | **0** | Retorna se o imóvel esta englobado |
| `imovelRepositorio.buscarImovelPeloCodigo(Código do imóvel)` | `ImoveisScript` | **0** | Localiza o imóvel pelo código → Um imóvel |

### `Numeros`

*Classe utilitária para operações que utilizam números.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Numeros.arredonda(valor, casasDecimais)` | `Number` | 5125 | Arredonda um valor. → Um novo valor arredondado considerando as casas decimais especificadas. |
| `Numeros.numero(texto)` | `Number` | 796 | Converte o valor de um texto em um número. → O número referente ao texto informado. Caso o texto seja inválido, o valor de retorno será 0. |
| `Numeros.resto(valorDividendo, valorDivisor)` | `Number` | 397 | Retorna o resto da divisão realizada entre o dividendo e o divisor, que são passados por parâmetro. → O resto de uma divisão. |
| `Numeros.trunca(valor, casasDecimais)` | `Number` | 177 | Trunca um valor de acordo com o número de casas decimais especificadas. → Um novo valor truncado. |
| `Numeros.raiz(valor)` | `Number` | 92 | Calcula a raiz quadrada de um número. → A raiz quadrada do parâmetro informado. |
| `Numeros.maximo(valor1, valor2)` | `Number` | 18 | Obtém o maior valor entre dois números. → O maior valor entre os números informados. |
| `Numeros.ehNumero(texto)` | `boolean` | 14 | Verifica se um texto é um número válido. → Verdadeiro se for um número e falso caso não for. |
| `Numeros.piso(valor)` | `Number` | 5 | Obtém o maior número que é menor ou igual ao número espedificado, sendo este número inteiro. → O maior número inteiro que é menor ou igual ao número e |
| `Numeros.teto(valor)` | `Number` | 4 | Obtém o menor número que é maior ou igual ao número espedificado, sendo este número inteiro. → O menor número inteiro que é maior ou igual ao número e |
| `Numeros.seZero(valor1, valor2, valorN)` | `Number` | 1 | Testa os valores passados como parâmetro e retorna o primeiro diferente de zero. Todos os valores informados devem ser do mesmo tipo. → O primeiro val |
| `Numeros.absoluto(valor)` | `Number` | **0** | Calcula o valor absoluto de um número. → O valor absoluto. |
| `Numeros.coseno(valor)` | `Number` | **0** | Calcula o co-seno de um ângulo. |
| `Numeros.exponencial(numero)` | `Number` | **0** | Obtém o exponencial de um número específico. → O valor exponencial de um número |
| `Numeros.fatorial(numero)` | `Number` | **0** | Obtém o fatorial de um número. → O valor fatorial de um número. |
| `Numeros.logaritmo(valor)` | `Number` | **0** | Informa o logaritmo natural de um número. → O logaritmo natural do argumento. |
| `Numeros.logaritmo10(valor)` | `Number` | **0** | Informa logaritmo de base 10 de um número. → O logaritmo de base 10. |
| `Numeros.minimo(valor1, valor2)` | `Number` | **0** | Obtém o menor valor entre dois números. → O menor valor entre os números informados. |
| `Numeros.pi(valorMultiplicar)` | `Number` | **0** | Multiplica o valor de PI pelo número especificado. → O resultado da multiplicação do argumento pelo valor de PI. |
| `Numeros.potencia(valor1, valor2)` | `Number` | **0** | Calcula o valor da potência de um número. → O valor calculado da potencialização. |
| `Numeros.randomico(numeroDelimitador)` | `Integer` | **0** | Obtém um número aleatório entre 1 a um valor limite especificado. → Um numérico aleatório de 1 até o número especificado. |
| `Numeros.seno(valor)` | `Number` | **0** | Calcula o seno de um ângulo. |
| `Numeros.tangente(valor)` | `Number` | **0** | Calcula a tangente de um ângulo. |

### `guiaReceitaRepositorio`

*Classe de funções para consulta das receitas da guia.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `guiaReceitaRepositorio.totalLancadoPorLancamentoEContribuinte(Long, Long)` | `BigDecimal` | **0** | Retorna a soma de parcelas vencidas do crédito gerado através do lançamento e do contribuinte. |
| `guiaReceitaRepositorio.totalLancadoPorContribuinte(Long)` | `BigDecimal` | **0** | Retorna a soma de parcelas vencidas do crédito gerado através do contribuinte. |
| `guiaReceitaRepositorio.totalLancadoPorContribuinteEDataVencimento(Long, Date)` | `BigDecimal` | **0** | Retorna a soma de parcelas vencidas do crédito gerado através do contribuinte anterior a uma data de vencimento. |
| `guiaReceitaRepositorio.totalLancadoPorLancamentoContribuinteEDataVencimento(Long, Long, Date)` | `BigDecimal` | **0** | Retorna a soma de parcelas vencidas do crédito gerado através do lançamento e do contribuinte anterior a uma data de vencimento. |

### `indexadorValorRepositorio`

*Classe de funções para consulta dos valores de indexadores.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `indexadorValorRepositorio.buscarValoresPorIndexadorEmUmPeriodo(Indexador, Data inicial, Data final)` | `List` | **0** | Localiza as movimentações de um indexador em um período → Uma lista de movimentações de um indexador |
| `indexadorValorRepositorio.valorDoIndexadorNumaDataEspecifica(Indexador, Data)` | `BigDecimal` | **0** | Retorn → Cálculo da SELIC |
| `indexadorValorRepositorio.buscarIndexadoresValores` | `List` | **0** | Localiza as movimentações dos indexadores → Uma lista de movimentações |
| `indexadorValorRepositorio.buscarValoresPorIndexador(Indexador)` | `List` | **0** | Localiza as movimentações de um indexador → Uma lista de movimentações de um indexador |
| `indexadorValorRepositorio.calcularSelicPorIndexador(Indexador, Valor tributo, Data inicial, Data final)` | `BigDecimal` | **0** | Calcula a taxa SELIC de um indexador em um período → Cálculo da SELIC |

### `guiaRepositorio`

*Classe de funções para consulta das guias.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `guiaRepositorio.quantidadeParcelasVencidasPorContribuinte(Long)` | `Long` | **0** | Retorna quantidade de parcelas vencidas do crédito gerado através do contribuinte. |
| `guiaRepositorio.quantidadeParcelasVencidasPorLancamento(Long)` | `Long` | **0** | Retorna quantidade de parcelas vencidas do crédito gerado através do lançamento. |
| `guiaRepositorio.quantidadeParcelasVencidasPorCreditoEContribuinteEDataVencimento(Long, Long, Date)` | `Long` | **0** | Retorna quantidade de parcelas vencidas do crédito gerado através do crédito e do contribuinte anterior a uma data de vencimento. |
| `guiaRepositorio.quantidadeParcelasVencidasPorCreditoEContribuinte(Long, Long)` | `Long` | **0** | Retorna quantidade de parcelas vencidas do crédito gerado através do crédito e do contribuinte. |
| `guiaRepositorio.quantidadeParcelasVencidasPorContribuinteEDataVencimento(Long, Date)` | `Long` | **0** | Retorna quantidade de parcelas vencidas do crédito gerado através do contribuinte anterior a uma data de vencimento. |
| `guiaRepositorio.quantidadeParcelasVencidasPorLancamentoEDataVencimento(Long, Date)` | `Long` | **0** | Retorna quantidade de parcelas vencidas do crédito gerado através do lançamento anterior a uma data de vencimento. |

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
