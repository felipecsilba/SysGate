# Contexto da fórmula — tipo `MANUTENCAO_DIVIDA`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/MANUTENCAO_DIVIDA.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — nenhuma fórmula deste tipo existe em `Formulas/` — coluna Corpus não se aplica.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**5 variáveis de contexto · 5 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### Valores simples

| Variável | O que é |
|---|---|
| `tipoManutencaoDivida` | Tipo de manutenção de dívida *(0 usos)* |
| `dataDoProcesso` | Data do processo da manutenção *(0 usos)* |
| `numeroDoProcesso` | Número do processo da manutenção *(0 usos)* |

### `leiAto`

*Lei/ato da manutenção de dívida*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `leiAto.nroOficial` | `Long` | **0** | Número oficial do ato |
| `leiAto.codigo` | `Long` | **0** | Código do ato |
| `leiAto.dtVigorar` | `LocalDate` | **0** | Data a vigorar |
| `leiAto.dtPublicacao` | `LocalDate` | **0** | Data da publicação do ato |
| `leiAto.dtResolucao` | `LocalDate` | **0** | Data da resolução do ato |
| `leiAto.ementa` | `String` | **0** | Ementa do ato |
| `leiAto.nroResolucao` | `String` | **0** | Número da resolução no Tribunal de Contas |
| `leiAto.nroDiarioOficial` | `Long` | **0** | Número do diário oficial |
| `leiAto.cpfResponsavel` | `String` | **0** | CPF do responsável pelo ato |
| `leiAto.naturezasTextoJurAtos` | `NaturezasTextoJurAtosScript` | **0** | Identificador da natureza do texto jurídico |
| `leiAto.nmResponsavel` | `String` | **0** | Nome do responsável pelo ato |
| `leiAto.tiposAtos` | `TiposAtosScript` | **0** | Tipo do ato |
| `leiAto.dtCriacao` | `LocalDate` | **0** | Data da criação do ato |
| `leiAto.nroProcesso` | `String` | **0** | Número do processo no Tribunal de Contas |

### `divida`

*Classe que contem as informações da dívida*

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
| `divida.valorJuros` | `BigDecimal` | **0** | Valor de juros |
| `divida.situacao` | `String` | **0** | Situação atual da dívida |
| `divida.receitaDiversa` | `ReceitasDiversasLanctosScript` | **0** | Receita diversa relacionada a dívida |
| `divida.contribuicaoMelhoria` | `ContribuicoesMelhoriasScript` | **0** | Contribuição de melhoria relacionada a dívida |
| `divida.contribMelhoriaImovel` | `ContribMelhoriasImoveisScript` | **0** | Imóvel da contribuição de melhoria relacionado a dívida |
| `divida.imovel` | `ImoveisScript` | **0** | Imóvel relacionado a dívida |
| `divida.economico` | `EconomicosScript` | **0** | Econômico relacionado a dívida |
| `divida.dataLancamento` | `Date` | **0** | Data de lançamento da dívida |
| `divida.notaAvulsa` | `NotasAvulsasScript` | **0** | Nota avulsa relacionada a dívida |
| `divida.livro` | `Integer` | **0** | Livro de inscrição da dívida |
| `divida.transferenciaImoveis` | `TransferenciaImoveisScript` | **0** | Transferência de imóveis relacionada a dívida |
| `divida.codigo` | `Long` | **0** | Código da dívida |
| `divida.valorSaldo` | `BigDecimal` | **0** | Saldo da dívida |
| `divida.valorInscrito` | `BigDecimal` | **0** | Valor inscrito |
| `divida.pessoa` | `PessoasScript` | **0** | Contribuinte relacionado a dívida |
| `divida.valorCorrecao` | `BigDecimal` | **0** | Valor de correção |
| `divida.valorMulta` | `BigDecimal` | **0** | Valor da multa |
| `divida.creditoTributario` | `CreditosTributariosScript` | **0** | Crédito tributário relacionado a dívida |
| `divida.valorSaldoMoedaCorrente` | `BigDecimal` | **0** | Saldo da dívida em moeda corrente |
| `divida.dividasReceitas` | `List` | **0** | Receitas da dívida → Receitas relacionadas a dívida |
| `divida.valorAnistiaSaldo` | `BigDecimal` | **0** | Anistia concedida para o saldo da dívida |
| `divida.folha` | `Integer` | **0** | Folha de inscrição da dívida |
| `divida.posicao` | `Integer` | **0** | Posição de inscrição da dívida |
| `divida.status` | `String` | **0** | Status da dívida → Retorna qual o status atual da dívida. Os possíveis retornos são: PROCESSO_EXECUCAO(Em processo de execução), AJUIZADA(Ajuizada), P |

---

## Classes utilitárias

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

### `Manutencoes`

*Classe para o concedimento de anistias ou remissões*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Manutencoes.concederAnistia(Abreviatura da receita, Percentual de anistia do saldo, Percentual de anistia da correção, Percentual de anistia dos juros, Percentual de anistia da multa)` | `boolean` | **0** | Conceder anistia do saldo da dívida |
| `Manutencoes.concederRemissao(Abreviatura da receita, Valor de remissao)` | `boolean` | **0** | Conceder remissao do saldo da dívida |

### `Utilitarios`

*Classe de funções utilitárias*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Utilitarios.ignorarDivida` | `boolean` | **0** | Essa função faz com que a dívida não seja inclusa na manutenção. |

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
