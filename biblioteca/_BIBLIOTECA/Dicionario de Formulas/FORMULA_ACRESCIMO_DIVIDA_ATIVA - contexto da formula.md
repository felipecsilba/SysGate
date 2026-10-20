# Contexto da fórmula — tipo `FORMULA_ACRESCIMO_DIVIDA_ATIVA`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/FORMULA_ACRESCIMO_DIVIDA_ATIVA.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — 38 fórmulas do tipo `FORMULA_ACRESCIMO_DIVIDA_ATIVA`.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**19 variáveis de contexto · 6 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### Valores simples

| Variável | O que é |
|---|---|
| `ano` | Ano |
| `dataBase` | Data base do cálculo |
| `simplesNacional` | Informa se a dívida importada pelo inscobra (SIM/NA0 |
| `codigo` | Código da divida |
| `processoAdministrativo` | Processo de inscrição da dívida |
| `statusDivida` | Status da divida |
| `numeroInscricao` | Número de inscrição |
| `dataVencimento` | Data de vencimento |
| `dataInscricao` | Data de inscrição *(0 usos)* |
| `valorDevido` | Valor devido *(0 usos)* |
| `tipoLancamento` | Tipo de lançamento |
| `receitas` | Receitas |
| `numeroParcela` | Número da parcela *(0 usos)* |
| `idDivida` | Identificador único da dívida corrente |

### `referente`

*Referente*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `referente.id` | `Long` | **0** | Identificador do referente |
| `referente.codigoString` | `String` | **0** | Código reduzido do referente no format String |
| `referente.codigo` | `Long` | **0** | Código reduzido do referente |
| `referente.cadastro` | `String` | **0** | Tipo de cadastro do referente |

### `configParcelamento`

*Condições de parcelamento*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `configParcelamento.descricao` | `String` | 3 | Descrição da condição de parcelamento |
| `configParcelamento.identificador` | `Long` | **0** | Identificador da condição de parcelamento |

### `creditoTributario`

*Crédito tributário*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `creditoTributario.abreviatura` | `String` | 114 | Abreviatura do crédito tributário |
| `creditoTributario.codigo` | `Long` | **0** | Código do crédito tributário |
| `creditoTributario.idTemplate` | `String` | **0** | Id do crédito tributário no cadastro do template |
| `creditoTributario.tipoCadastro` | `String` | **0** | Tipo de cadastro ao qual pertence o crédito tributário |

### `contribuinte`

*Contribuinte*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `contribuinte.codigo` | `Long` | 27 | Código de identificação do contribuinte |
| `contribuinte.nome` | `String` | 4 | Nome do contribuinte |
| `contribuinte.id` | `Long` | 1 | Id de identificação do contribuinte |
| `contribuinte.cpfCnpj` | `String` | 1 | CPF/CNPJ do contribuinte |
| `contribuinte.nomeFantasia` | `String` | **0** | Nome fantasia do contribuinte |
| `contribuinte.tipoPessoa` | `String` | **0** | Tipo do contribuinte → CPF/CNPJ do contribuinte |

### `indexador`

*Indexador*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `indexador.sigla` | `String` | 27 | Sigla do indexador |
| `indexador.ehMoedaCorrente` | `boolean` | 24 | Retorna um indicador de moeda corrente do país → true / false |
| `indexador.codigo` | `Long` | **0** | Código do indexador |
| `indexador.tipo` | `String` | **0** | Tipo da moeda |

---

## Classes utilitárias

### `CamposAdicionais`

*Classe de funções de campos adicionais*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase)` | `Object` | 7 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional)` | `Object` | 7 | Função que retorna o valor de um campo adicional do referente gerado nesse calculo → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase, agrupamento)` | `Object` | 7 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase, agrupamento)` | `boolean` | **0** | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase)` | `boolean` | **0** | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.preencherCampoAdicional(referente, nomeCampoAdicional, valor, anoOuDataBase)` | `boolean` | **0** | Função que preenche um campo adicional do referente com o valor especificado → true / false |
| `CamposAdicionais.preencherCampoAdicionalAgrupamento(referente, nomeCampoAdicional, valor, anoOuDataBase, agrupamento)` | `boolean` | **0** | Função que preenche um campo adicional do referente com o valor especificado → true / false |

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

### `Datas`

*Classe utilitária para operações que utilizam datas.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Datas.data(ano, mes, dia)` | `Date` | 218 | Gera uma data sem hora de acordo com os parâmetros informados. Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1). Para parâmetr |
| `Datas.diferencaDias(menorData, maiorData)` | `long` | 63 | Calcula a diferença em dias entre duas datas. → Um número referente a diferença entre dias. |
| `Datas.diferencaMeses(menorData, maiorData)` | `long` | 63 | Calcula a diferença em meses entre duas datas. → Um número referente a diferença entre meses. |
| `Datas.ano(data)` | `Integer` | 56 | Obtém o ano em que se encontra uma determinada data. → Um número referente ao ano da data especificada. |
| `Datas.mes(data)` | `Integer` | 46 | Obtém o mês em que se encontra uma determinada data. → Um número referente ao mês da data especificada. |
| `Datas.dia(data)` | `Integer` | 34 | Obtém o dia em que se encontra uma determinada data. → Um número referente ao dia da data especificada. |
| `Datas.adicionaMeses(data, quantidadeMeses)` | `Date` | 6 | Adiciona uma quantidade especificada de meses em uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/10/201 |
| `Datas.hoje` | `Date` | 4 | Obtém a data e hora do sistema operacional. → A data e hora corrente do sistema operacional. |
| `Datas.removeMeses(data, quantidadeMeses)` | `Date` | 4 | Remove uma quantidade especificada de meses de uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/12/2011, |
| `Datas.adicionaDias(data, quantidadeDias)` | `Date` | 2 | Adiciona uma quantidade especificada de dias à uma data. → Uma nova data referente aos dias especificados. |
| `Datas.formatar(data, formato)` | `String` | 1 | Obtem o valor de uma data formatada de acordo com um padrão especificado. → Texto contendo a data no formato especificado |
| `Datas.adicionaHoras(data, quantidadeHoras)` | `Date` | **0** | Adiciona uma quantidade especificada de horas em uma data/hora. → Uma nova data/hora referente as horas especificadas. |
| `Datas.adicionaMinutos(data, quantidadeMinutos)` | `Date` | **0** | Adiciona uma quantidade especificada de minutos em uma data/hora. → Uma nova data/hora referente aos minutos especificados. |
| `Datas.adicionaSegundos(data, quantidadeSegundos)` | `Date` | **0** | Adiciona uma quantidade especificada de segundos em uma data/hora. → Uma nova data/hora referente aos segundos especificados. |
| `Datas.dataHora(ano, mes, dia, hora, minuto)` | `Date` | **0** | Gera uma data com a hora de acordo com os parâmetros.Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1, 5, 9). Para parâmetros n |
| `Datas.diaSemana(data)` | `Integer` | **0** | Obtém o dia da semana em que se encontra uma determinada data, considerando-se o domingo como primeiro dia e o sábado como o sétimo dia. → Um número r |
| `Datas.diferencaAnos(menorData, maiorData)` | `long` | **0** | Calcula a diferença em anos entre duas datas. → Um número referente a diferença entre anos. |
| `Datas.diferencaHoras(menorData, maiorData)` | `long` | **0** | Calcula a diferença em horas entre duas datas. → Um número referente a diferença entre horas. |
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
| `Datas.segundo(data)` | `Integer` | **0** | Obtém os segundos referentes a uma determinada data/hora. → Um valor inteiro de 00 a 59 referente ao segundo. |

### `Numeros`

*Classe utilitária para operações que utilizam números.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Numeros.arredonda(valor, casasDecimais)` | `Number` | 345 | Arredonda um valor. → Um novo valor arredondado considerando as casas decimais especificadas. |
| `Numeros.trunca(valor, casasDecimais)` | `Number` | 14 | Trunca um valor de acordo com o número de casas decimais especificadas. → Um novo valor truncado. |
| `Numeros.teto(valor)` | `Number` | 2 | Obtém o menor número que é maior ou igual ao número espedificado, sendo este número inteiro. → O menor número inteiro que é maior ou igual ao número e |
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

### `UtilitariosDividas`

*Classe de funções utilitárias para dividas ativas*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `UtilitariosDividas.verificaNotificacaoSimplesNacional(idDivida, codigo)` | `boolean` | 1 | Verifica se débito vinculado a esta dívida refere-se a notificação de Simples Nacional → Boolean |
| `UtilitariosDividas.tipoLancamentoInscobra(codigo)` | `Integer` | 1 | Função que retorna o tipo de lançamento inscobra de uma dívida → Tipo de lancamento inscobra (0 - Não informado; 1 - DECLARADO; 2 - AINF e 3 - FAPE). |
| `UtilitariosDividas.multaMoraInscobra(codigo)` | `Integer` | 1 | Função que retorna o percentual de multa de mora inscobra de uma dívida → Valor inteiro representando o percentual de multa de mora inscobra |
| `UtilitariosDividas.dividaJaParcelada(codigo)` | `Boolean` | **0** | Retorna se a divida já fez parte e algum parcelamento → Boleano |
| `UtilitariosDividas.dataStatus(codigo, status)` | `Date` | **0** | Função que retorna a data do status solicitado |

### `Utilitarios`

*Classe de funções utilitárias*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Utilitarios.buscaValorIndexadorPorSiglaEData(Sigla, Data)` | `BigDecimal` | 128 | Função que retorna o valor do indexador em uma data específica |
| `Utilitarios.buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo(Sigla, Data inicial, Data final)` | `List` | 33 | Função que retorna as movimentações do indexador em um período → Lista de movimentações do indexador |
| `Utilitarios.ehFeriado(Data)` | `Integer` | 25 | Função que se a data é um feriado → 0 - Não é feriado 1 - É feriado 2 - Domingo 3 - Sabado |
| `Utilitarios.proximoDiaUtil(Data)` | `Date` | 24 | Função que busca o próximo dia útil |
| `Utilitarios.buscaAgrupamento(referente, descricao)` | `AgrupamentoScript` | 1 | Função que busca o agrupamento do referente → Objeto com as informações do agrupamento |
| `Utilitarios.montaReferente(idReferente, tipoReferente)` | `ReferenteScript` | 1 | Função para montar referentes → Em alguns casos se faz necessário montar um referente diferente do referente passado nas formulas, esse metodo serve p |
| `Utilitarios.buscaAgrupamentoParcelamento(referente, descricao)` | `AgrupamentoScript` | **0** | Função que busca o agrupamento do referente → Objeto com as informações do agrupamento |
| `Utilitarios.buscaIndexadorPorSigla(Sigla)` | `IndexadoresRepresentation` | **0** | Função que retorna o indexador |
| `Utilitarios.ehMoedaCorrente(Sigla)` | `boolean` | **0** | Função que retorna se o indexador é uma moeda corrente no país → true / false |

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
