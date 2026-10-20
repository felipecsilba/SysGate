# Contexto da fórmula — tipo `CONVENIO_BANCARIO`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/CONVENIO_BANCARIO.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — 67 fórmulas do tipo `CONVENIO_BANCARIO`.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**7 variáveis de contexto · 4 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### Valores simples

| Variável | O que é |
|---|---|
| `contaUnica` | Indicador de cota única. |
| `numeroDeBaixa` | Número de baixa gerado na emissão da guia. |
| `nroDaparcela` | Número da parcela. |
| `valorDoDocumento` | Valor do documento. |
| `dataDeVencimento` | Data de vencimento da guia. |
| `TipoRetorno` | Classe que contém os tipos de retorno da fórmula. *(0 usos)* |

### `Convenio`

*Classe que contém as informações do convênio.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Convenio.cedente` | `String` | 90 | Cedente do convênio |
| `Convenio.dvCedente` | `String` | 39 | DV do cedente do convênio |
| `Convenio.carteira` | `String` | 25 | Carteira do convênio |
| `Convenio.numeroAgencia` | `String` | 20 | Número da agência |
| `Convenio.dvContaBancaria` | `String` | 20 | Dígito da conta bancária do convênio |
| `Convenio.numeroBanco` | `String` | 17 | Número do banco |
| `Convenio.digitoVerificadorAgencia` | `String` | 10 | Dígito verificador da agência |
| `Convenio.contaBancaria` | `String` | 10 | Conta bancária do convênio |
| `Convenio.codigoAgencia` | `Long` | **0** | Código de identificação da agência |
| `Convenio.nomeAgencia` | `String` | **0** | Nome da agência |
| `Convenio.codigoBanco` | `Long` | **0** | Código de identificação do banco |
| `Convenio.mensagens` | `List` | **0** | Mensagens vinculadas ao convênio |
| `Convenio.nomeBanco` | `String` | **0** | Nome do banco |
| `Convenio.disponivelUso` | `boolean` | **0** | Disponibilidade de uso ou não do convênio |
| `Convenio.creditos` | `List` | **0** | Créditos tributários vinculados ao convênio |
| `Convenio.codigo` | `Long` | **0** | Código de identificação do convênio |

---

## Classes utilitárias

### `Caracteres`

*Classe utilitária para manipulação de Caracteres.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Caracteres.subTexto(texto, inicio, tamanho)` | `String` | 479 | Obtém um número específico de caracteres de uma posição específica de um texto. → Um intervalo de caracteres de acordo com a posição inicial e quantid |
| `Caracteres.direita(texto, quantidade)` | `String` | 95 | Obtém uma quantidade específica de caracteres iniciados da direita para esquerda. → Um novo texto com a quantidade de caracteres especificadas referen |
| `Caracteres.substituir(texto, textoLocalizar, textoSubstituir)` | `String` | 54 | Substitui as ocorrências de uma expressão localizada em um texto por outra expressão. → Um novo texto com o valor substituído pelo valor especifiado d |
| `Caracteres.esquerda(texto, quantidade)` | `String` | 32 | Obtém uma quantidade específica de caracteres iniciados da esquerda para direita. → Um novo texto com a quantidade de caracteres especificadas referen |
| `Caracteres.repetir(texto, repeticao)` | `String` | 32 | Repete um texto especificado de acordo com uma quantidade definida. → Um novo texto com o valor do parâmetro texto repetido de acordo com o valor do p |
| `Caracteres.tamanho(texto)` | `int` | 15 | Obtém o tamanho de um texto. → O tamanho do texto. |
| `Caracteres.capitaliza(texto)` | `String` | **0** | Por meio desta função é possível colocar a primeira letra de cada palavra de um texto em maiúsculo e as outras letras para minúsculo. → Um texto com a |
| `Caracteres.equivalente(texto, expressao)` | `boolean` | **0** | Verifica se uma expressão está contida em um texto. → Verdadeiro se a expressão for localizada e falso caso não. |
| `Caracteres.maiusculo(texto)` | `String` | **0** | Converte todos os caracteres de um texto em maiúsculo. → Um texto com todas as letras maiúsculas. |
| `Caracteres.minusculo(texto)` | `String` | **0** | Converte todos os caracteres de um texto em minúsculo. → Um texto com todas as letras minúsculas. |
| `Caracteres.posicao(texto, expressao, posicaoInicio)` | `int` | **0** | Obtém a posição onde um caracter se encontra em um texto. → O índice onde o valor localizado se encontra. |
| `Caracteres.posicao(texto, expressao)` | `int` | **0** | Obtém a posição inicial onde um padrão/expressão regular se encontra em um texto. → O índice onde o valor localizado se encontra. |
| `Caracteres.expressao(texto, expressao)` | `Expressao` | **0** | Cria uma nova expressão regular para ser utilizada com um texto → Expressão regular. |
| `Caracteres.removeEspacos(texto)` | `String` | **0** | Remover o excesso de espaços de um texto. → Um texto com o excesso de espaços removidos. |
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
| `Datas.ano(data)` | `Integer` | 25 | Obtém o ano em que se encontra uma determinada data. → Um número referente ao ano da data especificada. |
| `Datas.dia(data)` | `Integer` | 25 | Obtém o dia em que se encontra uma determinada data. → Um número referente ao dia da data especificada. |
| `Datas.mes(data)` | `Integer` | 25 | Obtém o mês em que se encontra uma determinada data. → Um número referente ao mês da data especificada. |
| `Datas.data(ano, mes, dia)` | `Date` | 23 | Gera uma data sem hora de acordo com os parâmetros informados. Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1). Para parâmetr |
| `Datas.adicionaDias(data, quantidadeDias)` | `Date` | **0** | Adiciona uma quantidade especificada de dias à uma data. → Uma nova data referente aos dias especificados. |
| `Datas.adicionaHoras(data, quantidadeHoras)` | `Date` | **0** | Adiciona uma quantidade especificada de horas em uma data/hora. → Uma nova data/hora referente as horas especificadas. |
| `Datas.adicionaMeses(data, quantidadeMeses)` | `Date` | **0** | Adiciona uma quantidade especificada de meses em uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/10/201 |
| `Datas.adicionaMinutos(data, quantidadeMinutos)` | `Date` | **0** | Adiciona uma quantidade especificada de minutos em uma data/hora. → Uma nova data/hora referente aos minutos especificados. |
| `Datas.adicionaSegundos(data, quantidadeSegundos)` | `Date` | **0** | Adiciona uma quantidade especificada de segundos em uma data/hora. → Uma nova data/hora referente aos segundos especificados. |
| `Datas.dataHora(ano, mes, dia, hora, minuto)` | `Date` | **0** | Gera uma data com a hora de acordo com os parâmetros.Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1, 5, 9). Para parâmetros n |
| `Datas.diaSemana(data)` | `Integer` | **0** | Obtém o dia da semana em que se encontra uma determinada data, considerando-se o domingo como primeiro dia e o sábado como o sétimo dia. → Um número r |
| `Datas.diferencaAnos(menorData, maiorData)` | `long` | **0** | Calcula a diferença em anos entre duas datas. → Um número referente a diferença entre anos. |
| `Datas.diferencaDias(menorData, maiorData)` | `long` | **0** | Calcula a diferença em dias entre duas datas. → Um número referente a diferença entre dias. |
| `Datas.diferencaHoras(menorData, maiorData)` | `long` | **0** | Calcula a diferença em horas entre duas datas. → Um número referente a diferença entre horas. |
| `Datas.diferencaMeses(menorData, maiorData)` | `long` | **0** | Calcula a diferença em meses entre duas datas. → Um número referente a diferença entre meses. |
| `Datas.diferencaMinutos(menorData, maiorData)` | `long` | **0** | Calcula a diferença em minutos entre duas datas/hora. → Um número referente a diferença entre minutos. |
| `Datas.diferencaSegundos(menorData, maiorData)` | `long` | **0** | Calcula a diferença em segundos entre duas datas/hora. → Um número referente a diferença entre segundos. |
| `Datas.ehData(texto)` | `boolean` | **0** | Verifica se um texto é uma data válida. → Verdadeiro se o texto for uma data e falso caso não. |
| `Datas.extenso(data)` | `String` | **0** | Obtém a data por extenso. → A data por extenso (01/01/20011 - Sábado, 1 de Janeiro de 2011). |
| `Datas.hoje` | `Date` | **0** | Obtém a data e hora do sistema operacional. → A data e hora corrente do sistema operacional. |
| `Datas.hora(data)` | `Integer` | **0** | Obtém a hora em que se encontra uma determinada data/hora. → Um valor inteiro de 00 a 23 referente à hora. |
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
| `Numeros.numero(texto)` | `Number` | 382 | Converte o valor de um texto em um número. → O número referente ao texto informado. Caso o texto seja inválido, o valor de retorno será 0. |
| `Numeros.resto(valorDividendo, valorDivisor)` | `Number` | 372 | Retorna o resto da divisão realizada entre o dividendo e o divisor, que são passados por parâmetro. → O resto de uma divisão. |
| `Numeros.ehNumero(texto)` | `boolean` | 12 | Verifica se um texto é um número válido. → Verdadeiro se for um número e falso caso não for. |
| `Numeros.absoluto(valor)` | `Number` | **0** | Calcula o valor absoluto de um número. → O valor absoluto. |
| `Numeros.arredonda(valor, casasDecimais)` | `Number` | **0** | Arredonda um valor. → Um novo valor arredondado considerando as casas decimais especificadas. |
| `Numeros.coseno(valor)` | `Number` | **0** | Calcula o co-seno de um ângulo. |
| `Numeros.exponencial(numero)` | `Number` | **0** | Obtém o exponencial de um número específico. → O valor exponencial de um número |
| `Numeros.fatorial(numero)` | `Number` | **0** | Obtém o fatorial de um número. → O valor fatorial de um número. |
| `Numeros.logaritmo(valor)` | `Number` | **0** | Informa o logaritmo natural de um número. → O logaritmo natural do argumento. |
| `Numeros.logaritmo10(valor)` | `Number` | **0** | Informa logaritmo de base 10 de um número. → O logaritmo de base 10. |
| `Numeros.maximo(valor1, valor2)` | `Number` | **0** | Obtém o maior valor entre dois números. → O maior valor entre os números informados. |
| `Numeros.minimo(valor1, valor2)` | `Number` | **0** | Obtém o menor valor entre dois números. → O menor valor entre os números informados. |
| `Numeros.pi(valorMultiplicar)` | `Number` | **0** | Multiplica o valor de PI pelo número especificado. → O resultado da multiplicação do argumento pelo valor de PI. |
| `Numeros.piso(valor)` | `Number` | **0** | Obtém o maior número que é menor ou igual ao número espedificado, sendo este número inteiro. → O maior número inteiro que é menor ou igual ao número e |
| `Numeros.potencia(valor1, valor2)` | `Number` | **0** | Calcula o valor da potência de um número. → O valor calculado da potencialização. |
| `Numeros.raiz(valor)` | `Number` | **0** | Calcula a raiz quadrada de um número. → A raiz quadrada do parâmetro informado. |
| `Numeros.randomico(numeroDelimitador)` | `Integer` | **0** | Obtém um número aleatório entre 1 a um valor limite especificado. → Um numérico aleatório de 1 até o número especificado. |
| `Numeros.seno(valor)` | `Number` | **0** | Calcula o seno de um ângulo. |
| `Numeros.seZero(valor1, valor2, valorN)` | `Number` | **0** | Testa os valores passados como parâmetro e retorna o primeiro diferente de zero. Todos os valores informados devem ser do mesmo tipo. → O primeiro val |
| `Numeros.tangente(valor)` | `Number` | **0** | Calcula a tangente de um ângulo. |
| `Numeros.teto(valor)` | `Number` | **0** | Obtém o menor número que é maior ou igual ao número espedificado, sendo este número inteiro. → O menor número inteiro que é maior ou igual ao número e |
| `Numeros.trunca(valor, casasDecimais)` | `Number` | **0** | Trunca um valor de acordo com o número de casas decimais especificadas. → Um novo valor truncado. |

### `Utilitarios`

*Classe utilitária para cálculo da linha digitável.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Utilitarios.completarAEsquerda(digitos, caracteres, quantidade)` | `String` | 375 | Função que completa valor a esquerda → Retorna os digitos completados a esquerda |
| `Utilitarios.somatorioModulo10(digitos)` | `String` | 226 | Função que cálcula o somatório do Módulo 10 → Retorna o somatório |
| `Utilitarios.somatorioModulo11(digitos, base)` | `String` | 103 | Função que cálcula o somatório do Módulo 11 → Retorna o somatório |
| `Utilitarios.somenteNumeros(digitos)` | `String` | 60 | Função que retorna somente números |
| `Utilitarios.fatorVencimento(data)` | `String` | 47 | Função que cálcula o fator de vencimento → Retorna o fator de vecimento |
| `Utilitarios.completarADireita(digitos, caracteres, quantidade)` | `String` | 6 | Função que completa valor a direita → Retorna os digitos completados a direta |

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
