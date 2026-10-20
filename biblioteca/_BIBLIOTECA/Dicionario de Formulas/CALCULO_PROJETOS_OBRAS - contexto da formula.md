# Contexto da fórmula — tipo `CALCULO_PROJETOS_OBRAS`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/CALCULO_PROJETOS_OBRAS.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — nenhuma fórmula deste tipo existe em `Formulas/` — coluna Corpus não se aplica.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**8 variáveis de contexto · 5 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### Valores simples

| Variável | O que é |
|---|---|
| `ano` | Ano vinculado à fórmula |
| `dataLancamento` | Data de lançamento |
| `usuario` | Usuário logado |
| `complementar` | Cálculo complementar de outro lançamento |

### `lancamento`

*Objeto responsável pela criação do lançamento*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `lancamento.criarReceita(Abreviatura, Valor a ser lançado para a receita)` | `boolean` | 8572 | Cria a receita no lançamento |
| `lancamento.criarReceita(Abreviatura, Valor a ser lançado para a receita, Beneficio fiscal concedido à receita)` | `boolean` | 8572 | Cria a receita no lançamento |
| `lancamento.criarReceita(Abreviatura, Valor a ser lançado para a receita, Beneficio fiscal concedido à receita, Percentual de beneficio concedido à receita)` | `boolean` | 8572 | Cria a receita no lançamento |
| `lancamento.comAFormaDePagamentoParcelada(Código das formas de pagamento)` | `boolean` | 3618 | Indica qual forma de pagamento parcelada será relacionada ao lançamento. Exemplo: lancamento.comAFormaDePagamentoParcelada(1); → Forma de pagamento ap |
| `lancamento.comAFormaDePagamentoIntegral(Código da forma de pagamento)` | `boolean` | 2793 | Indica qual forma de pagamento integral será relacionada ao lançamento. Exemplo: lancamento.comAFormaDePagamentoIntegral(1); → Forma de pe pagamento a |
| `lancamento.indexador(Indexador)` | `boolean` | **0** | Define o indexador do cálculo |

### `imovel`

*Informações do imóvel vinculado à obra*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `imovel.codigo` | `Long` | 3580 | Código reduzido do imóvel |
| `imovel.secao` | `SecaoScript` | 618 | Código da seção onde esta localizado o imóvel no logradouro |
| `imovel.unidade` | `Long` | 320 | Unidade do imóvel |
| `imovel.logradouro` | `LogradouroScript` | 295 | Código do logradouro onde esta localizado o imóvel |
| `imovel.inscricaoImobiliaria` | `InscricaoImobiliariaScript` | 259 | Inscrição imobiliária do imóvel → Buscar informação adicional do imóvel |
| `imovel.face` | `FaceScript` | 217 | Face onde o imóvel esta localizado frente ao logradouro |
| `imovel.tipoImovel` | `String` | 190 | Tipo do imóvel - RURAL OU URBANO |
| `imovel.contribuinte` | `ContribuinteScript` | 120 | Contribuinte proprietário do imóvel |
| `imovel.testadas` | `List` | 98 | Testadas do imóvel → Lista de testadas do imóvel |
| `imovel.bairro` | `BairroScript` | 60 | Bairro do imóvel |
| `imovel.maiorTestada` | `ImovelTestadaScript` | 31 | Maior testada do imóvel |
| `imovel.loteamento` | `LoteamentoScript` | 29 | Código do loteamento onde o imóvel esta localizado |
| `imovel.nroTestadas` | `Integer` | 25 | Número de testadas do imóvel |
| `imovel.condominio` | `CondominioScript` | 22 | Condomínio o qual o imóvel pertence |
| `imovel.lote` | `String` | 21 | Lote onde esta localizado o imóvel dentro da quadra |
| `imovel.quadra` | `String` | 17 | Quadra onde esta localizado o imóvel |
| `imovel.setor` | `String` | 10 | Setor onde esta localizado o imóvel → Setor do onde esta localizado o imóvel |
| `imovel.situacao` | `String` | 4 | Situação atual do imóvel: ATIVO, DESATIVADO, REMEMBRADO ou DESMEMBRADO |
| `imovel.localidade` | `LocalidadeScript` | **0** | Código da localidade onde o imóvel esta localizado |
| `imovel.latitude` | `BigDecimal` | **0** | Latitude do imóvel |
| `imovel.longitude` | `BigDecimal` | **0** | Longitude do imóvel |
| `imovel.apartamento` | `String` | **0** | Número do apartamento |
| `imovel.bloco` | `String` | **0** | Bloco onde esta localizado o imóvel |
| `imovel.inscricaoIncra` | `String` | **0** | Inscrição do INCRA - quando imóvel RURAL |
| `imovel.nroImovel` | `String` | **0** | Número do endereço do imóvel |
| `imovel.matricula` | `String` | **0** | Matricula do imóvel |
| `imovel.inscricaoAnterior` | `String` | **0** | Inscrição anterior do imóvel |
| `imovel.denominacao` | `String` | **0** | Denominação do imóvel RURAL |
| `imovel.cep` | `String` | **0** | CEP do imóvel |
| `imovel.complemento` | `String` | **0** | Complemento do endereço do imóvel |
| `imovel.agrupamento` | `AgrupamentoScript` | **0** | Código do agrupamento |
| `imovel.id` | `Long` | **0** | Identificador do imóvel |

### `obra`

*Informações da obra*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `obra.solicitanteProprietario` | `String` | **0** | Solicitante é o proprietário da obra |
| `obra.responsaveisTecnicos` | `List` | **0** | Responsáveis técnicos da obra |
| `obra.solicitante` | `ContribuinteScript` | **0** | Contribuinte da obra |
| `obra.dataEntrada` | `Date` | **0** | Data de entrada da obra |
| `obra.dataLiberacao` | `Date` | **0** | Data de liberação da obra |
| `obra.construtoras` | `List` | **0** | Construtora da obra |
| `obra.imovelRural` | `ObraImovelRuralScript` | **0** | Informações da obra sem imóvel vinculado |
| `obra.nroProcesso` | `String` | **0** | Número do processo da obra |
| `obra.observacao` | `String` | **0** | Observação da obra |
| `obra.descricao` | `String` | **0** | Descrição da obra |
| `obra.situacao` | `String` | **0** | Situação da obra |
| `obra.imovel` | `ImovelScript` | **0** | Imóvel da obra |
| `obra.agrupamento` | `AgrupamentoScript` | **0** | Agrupamento da obra |
| `obra.codigo` | `Long` | **0** | Código da obra |
| `obra.id` | `Long` | **0** | Identificador da obra |

### `creditoTributario`

*Crédito tributário vinculado a fórmula*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `creditoTributario.abreviatura` | `String` | 225 | Abreviatura do crédito tributário |
| `creditoTributario.id` | `Long` | 4 | Identificador do crédito tributário |
| `creditoTributario.indexador` | `IndexadorScript` | **0** | Código do indexador |
| `creditoTributario.calculaImoveisRurais` | `String` | **0** | Indica se irá gerar lançamentos de créditos para imóveis rurais |
| `creditoTributario.tipoCadastro` | `String` | **0** | Tipo de cadastro ao qual pertence o crédito tributário |
| `creditoTributario.descricao` | `String` | **0** | Descrição do crédito tributário |
| `creditoTributario.receitas` | `List` | **0** | Relacionamento entre o crédito tributário e a receita |

---

## Classes utilitárias

### `CamposAdicionais`

*Classe de funções de campos adicionais*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase)` | `Object` | 9262 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional)` | `Object` | 9262 | Função que retorna o valor de um campo adicional do referente gerado nesse calculo → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase, agrupamento)` | `Object` | 9262 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.preencherCampoAdicional(referente, nomeCampoAdicional, valor, anoOuDataBase)` | `boolean` | 4049 | Função que preenche um campo adicional do referente com o valor especificado → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase, agrupamento)` | `boolean` | 2669 | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase)` | `boolean` | 2669 | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.preencherCampoAdicionalAgrupamento(referente, nomeCampoAdicional, valor, anoOuDataBase, agrupamento)` | `boolean` | 88 | Função que preenche um campo adicional do referente com o valor especificado → true / false |

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

### `Utilitarios`

*Classe de funções utilitárias*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Utilitarios.emitirErro(mensagem)` | `Boolean` | 5380 | Função que emite erros no cálculo |
| `Utilitarios.buscaBeneficioFiscal(descricao)` | `BeneficioFiscalScript` | 1345 | Função que busca o benefício fiscal pela descrição |
| `Utilitarios.buscaValorIndexadorPorSiglaEData(Sigla, Data)` | `BigDecimal` | 331 | Função que retorna o valor do indexador em uma data específica |
| `Utilitarios.proximoDiaUtil(Data)` | `Date` | 289 | Função que busca o próximo dia útil |
| `Utilitarios.buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo(Sigla, Data inicial, Data final)` | `List` | 273 | Função que retorna as movimentações do indexador em um período → Lista de movimentações do indexador |
| `Utilitarios.ehFeriado(Data)` | `Integer` | 234 | Função que se a data é um feriado → 0 - Não é feriado; 1 - É feriado; 2 - Domingo; 3 - Sábado |
| `Utilitarios.valorGeradoLancadoPorCreditoTributarioParaReferente(Código do crédito tributário, Código do referente, Lista de abreviaturas das receitas, Ano, Considerar lançamentos complementares)` | `BigDecimal` | 140 | Buscar o valor gerado/lançado por receita do crédito tributário em questão, possibilitando informar o referente, o ano do lançamento, a receita do lan |
| `Utilitarios.existeLancamento(referente, Data)` | `ExisteLancamentoScript` | 66 | Função que verifica se o referente ou o contribuinte possui lançamentos → Objeto contendo a indicação de existência dos lançamentos |
| `Utilitarios.buscaIndexadorPorSigla(Sigla)` | `IndexadorScript` | **0** | Função que retorna o indexador |
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
