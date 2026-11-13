# Contexto da fórmula — tipo `ITBI_VALOR_VENAL`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/ITBI_VALOR_VENAL.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — 8 fórmulas do tipo `ITBI_VALOR_VENAL_TERRITORIAL` / `ITBI_VALOR_VENAL_CONSTRUCAO` / `ITBI_VALOR_VENAL_BENFEITORIAS`.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**4 variáveis de contexto · 6 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### Valores simples

| Variável | O que é |
|---|---|
| `vendedoresDoImovel` | Classe que retorna a lista de vendedores do imóvel *(0 usos)* |
| `anoDaTransferencia` | Ano em que está sendo efetuada a transferência |

### `imovel`

*Classe que contém as informações do imóvel para o qual está sendo gerado o valor venal*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `imovel.codigo` | `Long` | 24 | Código de identificação do imóvel |
| `imovel.testadas` | `List` | 1 | Testadas do imovel → Lista de testadas do imovel |
| `imovel.inscricaoImobiliaria` | `InscricaoImobiliariaScript` | 1 | Inscrição imobiliária do imóvel → Buscar informação adicional do imóvel |
| `imovel.nroTestadas` | `Integer` | **0** | Número de testadas do imovel |
| `imovel.maiorTestada` | `ImoveisTestadasScript` | **0** | Maior testada do imovel |
| `imovel.dataConstrucao` | `Date` | **0** | Data de construção do imóvel → Retorna a data de construção informada no cadastro do imóvel. Se não tiver data de construção o retorno será a data 1/1 |
| `imovel.localidade` | `LocalidadesScript` | **0** | Código da localidade onde o imóvel esta localizado |
| `imovel.face` | `FacesScript` | **0** | Face onde o imóvel esta localizado frente ao logradouro |
| `imovel.contribuinte` | `PessoasScript` | **0** | Contribuinte proprietário do imóvel |
| `imovel.lote` | `String` | **0** | Lote onde esta localizado o imóvel dentro da quadra |
| `imovel.quadra` | `String` | **0** | Quadra onde esta localizado o imóvel |
| `imovel.inscricaoIncra` | `String` | **0** | Inscrição do INCRA - quando imóvel RURAL |
| `imovel.denominacao` | `String` | **0** | Denominação do imóvel RURAL |
| `imovel.latitude` | `BigDecimal` | **0** | Latitude do imóvel |
| `imovel.longitude` | `BigDecimal` | **0** | Longitude do imóvel |
| `imovel.matricula` | `String` | **0** | Matricula do imóvel |
| `imovel.nroImovel` | `String` | **0** | Número do endereço do imóvel |
| `imovel.setor` | `String` | **0** | Setor onde esta localizado o imóvel → Setor do onde esta localizado o imóvel |
| `imovel.inscricaoAnterior` | `String` | **0** | Inscrição anterior do imóvel |
| `imovel.secao` | `SecoesScript` | **0** | Código da seção onde esta localizado o imóvel no logradouro |
| `imovel.cep` | `String` | **0** | CEP do imóvel |
| `imovel.complemento` | `String` | **0** | Complemento do endereço do imóvel |
| `imovel.condominio` | `CondominioScript` | **0** | Condominio o qual o imóvel pertence |
| `imovel.logradouro` | `LogradouroScript` | **0** | Código do logradouro onde esta localizado o imóvel |
| `imovel.loteamento` | `LoteamentoScript` | **0** | Código do loteamento onde o imóvel esta localizado |
| `imovel.agrupamento` | `AgrupamentosScript` | **0** | Código do agrupamento |
| `imovel.apartamento` | `String` | **0** | Número do apartamento |
| `imovel.bairro` | `BairroScript` | **0** | Bairro onde esta localizado o imóvel |
| `imovel.bloco` | `String` | **0** | Bloco onde esta localizado o imóvel |
| `imovel.unidade` | `Long` | **0** | Unidade do imóvel |
| `imovel.tipoImovel` | `String` | **0** | Tipo do imóvel - RURAL OU URBANO |
| `imovel.situacao` | `String` | **0** | Situação atual do imóvel - ATIVADO ou DESATIVADO |

### `tabelasCalculos`

*Classe que retorna o valor da tabela conforme as características do imóvel informado*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `tabelasCalculos.getValor(Ano, Código da tabela de cálculo, imovel.codigo)` | `BigDecimal` | 22 | Função que busca o valor de uma tabela de cálculo → Retornar o valor de uma tabela. |
| `tabelasCalculos.getValorAplicado(Conjunto classificado)` | `BigDecimal` | **0** | Função que busca o valor do conjunto classificado conforme a tabela aplicada. → Retornar o valor do conjunto classificado conforme a tabela aplicada. |
| `tabelasCalculos.getIndexadorAplicado(Conjunto classificado)` | `IndexadoresScript` | **0** | Função que busca o indexador do conjunto conforme a tabela aplicada. → Retornar o indexador do conjunto classificado conforme a tabela aplicada. |
| `tabelasCalculos.dadosDaTabelaAplicado(Ano, Código da tabela de cálculo, imovel.codigo)` | `Conjuntos` | **0** | Função que busca os dados aplicados de uma tabela → Retornar os dados aplicados de uma tabela |
| `tabelasCalculos.getValorAgrupamento(Ano, Código da tabela de cálculo, imovel.codigo, agrupamento)` | `BigDecimal` | **0** | Função que busca o valor de uma tabela de cálculo → Retornar o valor de uma tabela. |
| `tabelasCalculos.getIndexador(Ano das caracteristicas do imóvel, Código reduzido da tabela, imovel.codigo)` | `IndexadoresScript` | **0** | Função que busca o indexador de uma tabela → Retornar o indexador de uma tabela. |

---

## Classes utilitárias

### `CamposAdicionais`

*Classe de funções de campos adicionais*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `CamposAdicionais.valor(referente, nomeCampoAdicional)` | `Object` | 108 | Função que retorna o valor de um campo adicional do referente gerado nesse calculo → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase)` | `Object` | 108 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase, agrupamento)` | `Object` | 108 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase)` | `boolean` | 1 | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase, agrupamento)` | `boolean` | 1 | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.lotePossuiCampoAdicionalInformado(imovel, nomeCampoAdicional, valorOpção, anoOuDataBase)` | `boolean` | **0** | Função que retorna se a opção do campo adicional existe no lote examinado → true/false |

### `TabelasAuxiliares`

*Classe de funções de tabelas auxiliares*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `TabelasAuxiliares.buscarRegistrosDaTabela(codigoTabelaAuxiliar)` | `List` | **0** | Função que retorna os registros de tabelas auxiliares → Lista de registros da tabela auxiliar |
| `TabelasAuxiliares.buscarRegistroDaTabelaPorCampo(codigoTabelaAuxiliar, numeroCampo, valorCampo)` | `RegistrosTabelasAuxiliaresScript` | **0** | Função que retorna o registro completo com base no valor de um campo específico da tabela auxiliar → Registro da tabela auxiliar |
| `TabelasAuxiliares.valorDoCampoPorDescricao(registro, descricaoCampo)` | `String` | **0** | Função que retorna o valor de um campo específico de um registro da tabela auxiliar |

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
| `Datas.data(ano, mes, dia)` | `Date` | 4 | Gera uma data sem hora de acordo com os parâmetros informados. Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1). Para parâmetr |
| `Datas.hoje` | `Date` | 4 | Obtém a data e hora do sistema operacional. → A data e hora corrente do sistema operacional. |
| `Datas.adicionaDias(data, quantidadeDias)` | `Date` | **0** | Adiciona uma quantidade especificada de dias à uma data. → Uma nova data referente aos dias especificados. |
| `Datas.adicionaHoras(data, quantidadeHoras)` | `Date` | **0** | Adiciona uma quantidade especificada de horas em uma data/hora. → Uma nova data/hora referente as horas especificadas. |
| `Datas.adicionaMeses(data, quantidadeMeses)` | `Date` | **0** | Adiciona uma quantidade especificada de meses em uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/10/201 |
| `Datas.adicionaMinutos(data, quantidadeMinutos)` | `Date` | **0** | Adiciona uma quantidade especificada de minutos em uma data/hora. → Uma nova data/hora referente aos minutos especificados. |
| `Datas.adicionaSegundos(data, quantidadeSegundos)` | `Date` | **0** | Adiciona uma quantidade especificada de segundos em uma data/hora. → Uma nova data/hora referente aos segundos especificados. |
| `Datas.ano(data)` | `Integer` | **0** | Obtém o ano em que se encontra uma determinada data. → Um número referente ao ano da data especificada. |
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
| `Numeros.arredonda(valor, casasDecimais)` | `Number` | 8 | Arredonda um valor. → Um novo valor arredondado considerando as casas decimais especificadas. |
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
| `Numeros.trunca(valor, casasDecimais)` | `Number` | **0** | Trunca um valor de acordo com o número de casas decimais especificadas. → Um novo valor truncado. |

### `Utilitarios`

*Classe de funções utilitárias*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Utilitarios.buscaValorDoIndexadorPorSiglaNumaDataEspecifica(Sigla, Data)` | `BigDecimal` | 5 | Função que retorna o valor do indexador em uma data específica |
| `Utilitarios.buscaPlantaDeValoresDoImovel(ano, imovel.codigo)` | `PlantasValoresScript` | 1 | Função que retorna as informações da planta de valores com base no código do imóvel e ano |
| `Utilitarios.imovelEhEnglobado(imovel.codigo)` | `boolean` | **0** | Função que verifica a se o imóvel é englobado → true / false |
| `Utilitarios.existemDebitosPorSituacao(imovel.codigo, situacao)` | `Boolean` | **0** | Função que verifica a existência de débitos para um determinado imóvel → true / false |
| `Utilitarios.existemDividasPorSituacao(imovel.codigo, situacao)` | `Boolean` | **0** | Função que verifica a existência de dívidas ativas para um determinado imóvel → true / false |
| `Utilitarios.existeParcelamentoPorSituacao(imovel.codigo, situacao)` | `Boolean` | **0** | Função que verifica a existência de parcelas de parcelamento para um determinado imóvel → true / false |
| `Utilitarios.existemDebitosVencidos(imovel.codigo, situacao, dataBase)` | `Boolean` | **0** | Função que verifica a existência de débitos vencidos para um determinado imóvel → true / false |
| `Utilitarios.existemDividasVencidas(imovel.codigo, situacao, dataBase)` | `Boolean` | **0** | Função que verifica a existência de dívidas ativas vencidas para um determinado imóvel → true / false |
| `Utilitarios.existeParcelamentoVencido(imovel.codigo, situacao, dataBase)` | `Boolean` | **0** | Função que verifica a existência de parcelamentos com parcelas vencidas onde o imóvel esteja incluso na composição desse parcelamento → true / false |
| `Utilitarios.buscaSecao(logradouro, secao, face, ano)` | `SecoesScript` | **0** | Função que retorna as informações da seção com base no código do logradouro, código da seção e ano |
| `Utilitarios.buscaSecaoDoImovel(imovel, ano)` | `SecoesScript` | **0** | Função que retorna as informações da seção com base no imóvel |
| `Utilitarios.buscaIndexadorPorNomeESigla(Nome, Sigla)` | `IndexadoresScript` | **0** | Função que retorna o indexador |
| `Utilitarios.ehMoedaCorrente(Sigla)` | `boolean` | **0** | Função que retorna se o indexador é uma moeda corrente no país → true / false |
| `Utilitarios.buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo(Sigla, Data inicial, Data final)` | `List` | **0** | Função que retorna as movimentações do indexador em um período → Lista de movimentações do indexador |

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
