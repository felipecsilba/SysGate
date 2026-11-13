# Contexto da fórmula — tipo `IMPOSTOS_FEDERAIS`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/IMPOSTOS_FEDERAIS.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — nenhuma fórmula deste tipo existe em `Formulas/` — coluna Corpus não se aplica.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**2 variáveis de contexto · 10 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### `notaAvulsa`

*Classe que contem as informações da nota avulsa.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `notaAvulsa.valorIssqn` | `BigDecimal` | 31 | Valor do ISSQN da nota avulsa |
| `notaAvulsa.prestador` | `PessoasScript` | 12 | Contribuinte prestador da nota avulsa |
| `notaAvulsa.cpfCnpjTomador` | `String` | 6 | CPF/CNPJ do tomador da nota avulsa |
| `notaAvulsa.economicoPrestador` | `EconomicosScript` | 6 | Econômico prestador da nota avulsa |
| `notaAvulsa.valorIrrf` | `BigDecimal` | 3 | Valor do IRRF da nota avulsa |
| `notaAvulsa.tomador` | `PessoasScript` | 2 | Contribuinte tomador da nota avulsa |
| `notaAvulsa.valorTotalServicos` | `BigDecimal` | 1 | Valor total dos serviços da nota avulsa |
| `notaAvulsa.quantidadeServicos` | `Integer` | **0** | Quantidade de serviços da nota avulsa |
| `notaAvulsa.quantidadeDependentes` | `Integer` | **0** | Quantidade de dependentes da nota avulsa |
| `notaAvulsa.valorSestSenat` | `BigDecimal` | **0** | Valor do SEST/SENAT da nota avulsa |
| `notaAvulsa.valorInss` | `BigDecimal` | **0** | Valor do INSS da nota avulsa |
| `notaAvulsa.cepTomador` | `String` | **0** | CEP do tomador da nota avulsa |
| `notaAvulsa.numeroTomador` | `String` | **0** | Número do tomador da nota avulsa |
| `notaAvulsa.blocoTomador` | `String` | **0** | Bloco do tomador da nota avulsa |
| `notaAvulsa.bairroTomador` | `String` | **0** | Bairro do tomador da nota avulsa |
| `notaAvulsa.municipioTomador` | `String` | **0** | Município do tomador da nota avulsa |
| `notaAvulsa.descricaoEnderecoTomador` | `String` | **0** | Descrição do endereço do tomador da nota avulsa |
| `notaAvulsa.complementoTomador` | `String` | **0** | Complemento do tomador da nota avulsa |
| `notaAvulsa.condominioTomador` | `String` | **0** | Condomínio do tomador da nota avulsa |
| `notaAvulsa.apartamentoTomador` | `String` | **0** | Apartamento do tomador da nota avulsa |
| `notaAvulsa.loteamentoTomador` | `String` | **0** | Loteamento do tomador da nota avulsa |
| `notaAvulsa.distritoTomador` | `String` | **0** | Distrito do tomador da nota avulsa |
| `notaAvulsa.enderecoObsTomador` | `String` | **0** | Observação do endereço do tomador da nota avulsa |
| `notaAvulsa.logradouroTomador` | `String` | **0** | Logradouro do tomador da nota avulsa |
| `notaAvulsa.economicoTomador` | `EconomicosScript` | **0** | Econômico tomador da nota avulsa |
| `notaAvulsa.cpfCnpjPrestador` | `String` | **0** | CPF/CNPJ do prestador da nota avulsa |
| `notaAvulsa.inscricaoMunicipalPrestador` | `String` | **0** | Inscrição municipal do prestador da nota avulsa |
| `notaAvulsa.inscricaoMunicipalTomador` | `String` | **0** | Inscrição municipal do tomador da nota avulsa |
| `notaAvulsa.valorInssRecolhido` | `BigDecimal` | **0** | Valor do INSS recolhido da nota avulsa |
| `notaAvulsa.valorTotalReducao` | `BigDecimal` | **0** | Valor total da redução da nota avulsa |
| `notaAvulsa.nomePrestador` | `String` | **0** | Nome do prestador da nota avulsa |
| `notaAvulsa.nomeTomador` | `String` | **0** | Nome do tomador da nota avulsa |
| `notaAvulsa.numeroEmpenho` | `Long` | **0** | Número do empenho da nota avulsa |
| `notaAvulsa.dataEmpenho` | `Date` | **0** | Data do empenho da nota avulsa |
| `notaAvulsa.valorCsll` | `BigDecimal` | **0** | Valor do CSLL da nota avulsa |
| `notaAvulsa.valorCofins` | `BigDecimal` | **0** | Valor do COFINS da nota avulsa |
| `notaAvulsa.valorPisPasep` | `BigDecimal` | **0** | Valor do PIS/PASEP da nota avulsa |
| `notaAvulsa.valorLiquido` | `BigDecimal` | **0** | Valor liquido da nota avulsa |
| `notaAvulsa.dataEmissao` | `Date` | **0** | Data e emissão da nota avulsa |
| `notaAvulsa.requerente` | `PessoasScript` | **0** | Contribuinte requerente da nota avulsa |
| `notaAvulsa.nomeRequerente` | `String` | **0** | Nome do requerente da nota avulsa |
| `notaAvulsa.servicos` | `List` | **0** | Serviços da nota avulsa |
| `notaAvulsa.numeroNota` | `Long` | **0** | Número da nota avulsa |
| `notaAvulsa.serie` | `String` | **0** | Série da nota avulsa |
| `notaAvulsa.motivo` | `MotivosScript` | **0** | Motivo da nota avulsa |
| `notaAvulsa.situacao` | `String` | **0** | Situação da nota avulsa |

### `impostosFederais`

*Objeto responsável pelo criação dos impostos federais*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `impostosFederais.comSestSenat(valorSestSenat)` | `ImpostosFederais$Builder` | **0** | Inclui o valor do SEST / SENAT nos impostos federais |
| `impostosFederais.comInss(valorInss)` | `ImpostosFederais$Builder` | **0** | Inclui o valor do INSS nos impostos federais |
| `impostosFederais.comIrrf(valorIrrf)` | `ImpostosFederais$Builder` | **0** | Inclui o valor do IRRF nos impostos federais |
| `impostosFederais.valorInss` | `BigDecimal` | **0** | Retorna o valor do INSS nos impostos federais |
| `impostosFederais.valorIrrf` | `BigDecimal` | **0** | Retorna o valor do IRRF nos impostos federais |
| `impostosFederais.valorSestSenat` | `BigDecimal` | **0** | Retorna o valor do SEST / SENAT nos impostos federais |

---

## Classes utilitárias

### `CamposAdicionais`

*Classe de funções de campos adicionais*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `CamposAdicionais.valor(referente, nomeCampoAdicional)` | `Object` | 9262 | Função que retorna o valor de um campo adicional do referente gerado nesse calculo → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase)` | `Object` | 9262 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase, agrupamento)` | `Object` | 9262 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.preencherCampoAdicional(referente, nomeCampoAdicional, valor, anoOuDataBase)` | `boolean` | 4049 | Função que preenche um campo adicional do referente com o valor especificado → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase)` | `boolean` | 2669 | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase, agrupamento)` | `boolean` | 2669 | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.preencherCampoAdicionalAgrupamento(referente, nomeCampoAdicional, valor, anoOuDataBase, agrupamento)` | `boolean` | 88 | Função que preenche um campo adicional do referente com o valor especificado → true / false |
| `CamposAdicionais.lotePossuiCampoAdicionalInformado(imovel, nomeCampoAdicional, valorOpção, anoOuDataBase)` | `boolean` | 14 | Função que retorna se a opção do campo adicional existe no lote examinado → true/false |

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

### `ValoresDeAtividadesDosEconomicos`

*Classe que retorna os valores das atividades do econômico.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `ValoresDeAtividadesDosEconomicos.buscaAtividadeEconomica(CNAE do econômico)` | `AtividadesEconomicasScript` | **0** | Função que busca o valor do Alvará de uma atividade |
| `ValoresDeAtividadesDosEconomicos.buscaMaiorValorAlvara(Código da atividade, Data base)` | `BigDecimal` | **0** | Função que busca o maior valor do Alvará de uma atividade |
| `ValoresDeAtividadesDosEconomicos.buscaMenorValorAlvara(Código da atividade, Data base)` | `BigDecimal` | **0** | Função que busca o menor valor do Alvará de uma atividade |
| `ValoresDeAtividadesDosEconomicos.buscaMovimentacaoPorData(Atividade, Data base)` | `EconomicosCnaesMovtosScript` | **0** | Função que busca a data inicial da atividade → Uma data |
| `ValoresDeAtividadesDosEconomicos.buscaMovimentacoes(Atividade)` | `List` | **0** | Função que busca a data inicial da atividade → Uma data |
| `ValoresDeAtividadesDosEconomicos.somaValorAlvara(Econômico, Data base)` | `BigDecimal` | **0** | Função que busca a soma do valor do Alvará de uma atividade |
| `ValoresDeAtividadesDosEconomicos.buscaValorAlvara(Atividade, Data base)` | `BigDecimal` | **0** | Função que busca o valor do Alvará de uma atividade |

### `Economicos`

*Classe que retorna os dados dos econômicos.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Economicos.buscarEconomicosPeloContribuinte(Código do contribuinte)` | `List` | **0** | Localiza os econômicos pelo contribuinte → Uma lista de econômicos |
| `Economicos.buscarEconomicoPeloCodigo(Código reduzido do econômico)` | `EconomicosScript` | **0** | Localiza o econômico pelo código reduzido → Um econômico |

### `AliquotasServicosEconomicos`

*Classe de funções para consultar os itens da lista de serviços vinculados ao econômico, com suas respectivas alíquotas de ISS*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `AliquotasServicosEconomicos.getListaServicosMaiorAliquota(Código do econômico, Data base)` | `ValoresCnaesServicos` | **0** | Retorna o item da lista de serviços relacionados a um econômico que possua a maior alíquota |
| `AliquotasServicosEconomicos.getListaServicosMenorAliquota(Código do econômico, Data base)` | `ValoresCnaesServicos` | **0** | Retorna o item da lista de serviços relacionados a um econômico que possua a menor alíquota |
| `AliquotasServicosEconomicos.getListaServicos(Código do econômico, Data base)` | `List` | **0** | Retorna os itens da lista de serviços relacionados a um econômico |

### `NotasAvulsas`

*Classe que retorna os dados das notas avulsas.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `NotasAvulsas.buscarNotaPeloPrestadorNoMesDaEmissao(Prestador da nota avulsa, Data de emissão da nota avulsa)` | `List` | **0** | Localiza as notas avulsas emitidas e não anuladas do prestador no mês de emissão da nota atual → Lista de notas avulsas |
| `NotasAvulsas.buscarNotaPeloNumeroSerie(Número da nota avulsa, Série da nota avulsa)` | `NotasAvulsasScript` | **0** | Localiza a nota avulsa pelo numero e série → Uma nota avulsa |
| `NotasAvulsas.buscarNotaPeloPrestador(Prestador da nota avulsa)` | `List` | **0** | Localiza as notas avulsas do prestador → Lista de notas avulsas |
| `NotasAvulsas.buscarServicosDaNotaAvulsa(Nota avulsa)` | `List` | **0** | Localiza as notas avulsas emitidas e não anuladas do prestador no mês de emissão da nota atual → Lista de notas avulsas |
| `NotasAvulsas.quantidadeDeNotasNaoAnuladas(Prestador da nota avulsa, Ano)` | `Long` | **0** | Localiza a quantidade de notas avulsas emitidas e não anuladas, no ano da emissão da nota, para o prestador |
| `NotasAvulsas.quantidadeDeNotasNaoAnuladas(Prestador da nota avulsa, Ano, Mês)` | `Long` | **0** | Localiza a quantidade de notas avulsas emitidas e não anuladas, no mês da emissão da nota, para o prestador |
| `NotasAvulsas.quantidadeDeServicos(Nota avulsa)` | `Long` | **0** | Localiza a quantidade de quantidade de serviços relacionados à nota fiscal avulsa |
| `NotasAvulsas.somaDoINSSRecolhido(Prestador da nota avulsa, Ano, Mês)` | `BigDecimal` | **0** | Localiza a soma do valor do INSS recolhido do prestador, calculado por esta fórmula para as outras notas emitidas no mês |
| `NotasAvulsas.valorTotalDasNotasNoMesDaEmissao(Prestador da nota avulsa, Data de emissão da nota avulsa, Código sequencial da nota avulsa)` | `BigDecimal` | **0** | Recupera o valor total das notas avulsas emitidas e não anuladas, recolhido pelo prestador no mês de emissão da nota atual |
| `NotasAvulsas.valorTotalDasNotasNoMesDaEmissao(Prestador da nota avulsa, Data de emissão da nota avulsa)` | `BigDecimal` | **0** | Recupera o valor total das notas avulsas emitidas e não anuladas, recolhido pelo prestador no mês de emissão da nota atual |
| `NotasAvulsas.valorTotalInssNoMesDaEmissao(Prestador da nota avulsa, Data de emissão da nota avulsa, Código sequencial da nota avulsa)` | `BigDecimal` | **0** | Recupera o valor total do INSS das notas avulsas emitidas e não anuladas, recolhido pelo prestador no mês de emissão da nota atual |
| `NotasAvulsas.valorTotalInssNoMesDaEmissao(Prestador da nota avulsa, Data de emissão da nota avulsa)` | `BigDecimal` | **0** | Recupera o valor total do INSS das notas avulsas emitidas e não anuladas, recolhido pelo prestador no mês de emissão da nota atual |
| `NotasAvulsas.valorTotalIrrfNoMesDaEmissao(Prestador da nota avulsa, Data de emissão da nota avulsa, Código sequencial da nota avulsa)` | `BigDecimal` | **0** | Recupera o valor total do IRRF das notas avulsas emitidas e não anuladas, recolhido pelo prestador no mês de emissão da nota atual |
| `NotasAvulsas.valorTotalIrrfNoMesDaEmissao(Prestador da nota avulsa, Data de emissão da nota avulsa)` | `BigDecimal` | **0** | Recupera o valor total do IRRF das notas avulsas emitidas e não anuladas, recolhido pelo prestador no mês de emissão da nota atual |

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

*Classe de funções gerais para criação de scripts*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Utilitarios.emitirErro(mensagem)` | `Boolean` | 5380 | Função que emite erros no cálculo |
| `Utilitarios.buscaBeneficioFiscal(Descrição)` | `BeneficiosFiscaisScript` | 1345 | Função que busca o benefício fiscal pela descrição |
| `Utilitarios.buscaValorDoIndexadorPorSiglaNumaDataEspecifica(Sigla, Data)` | `BigDecimal` | 1117 | Função que retorna o valor do indexador em uma data específica |
| `Utilitarios.proximoDiaUtil(Data)` | `Date` | 289 | Função que busca o próximo dia útil |
| `Utilitarios.buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo(Sigla, Data inicial, Data final)` | `List` | 273 | Função que retorna as movimentações do indexador em um período → Lista de movimentações do indexador |
| `Utilitarios.ehFeriado(Data)` | `Integer` | 234 | Função que se a data é um feriado → 0 - Não é feriado 1 - É feriado 2 - Domingo 3 - Sabado |
| `Utilitarios.valorGeradoLancadoPorCreditoTributarioParaReferente(Código do crédito tributário, Código do referente, Lista de abreviaturas das receitas, Ano, Considerar lançamentos complementares)` | `BigDecimal` | 140 | Buscar o valor gerado/lançado por receita do crédito tributário em questão, possibilitando informar o referente, o ano do lançamento, a receita do lan |
| `Utilitarios.existeLancamento(referente, Data)` | `ExisteLancamentoScript` | 66 | Função que verifica se o referente ou o contribuinte possui lançamentos → Objeto contendo a indicação de existência dos lançamentos |
| `Utilitarios.buscaIndexadorPorNomeESigla(Nome, Sigla)` | `IndexadoresScript` | 1 | Utilitarios. buscaIndexadorPorNomeESigla(Nome, Sigla) Parâmetros: Nome - Nome Sigla - Sigla Retorno: Indexador |
| `Utilitarios.ehMoedaCorrente(Sigla)` | `boolean` | **0** | Função que retorna se o indexador é uma moeda corrente no país → true / false |

### `TabelasIRRF`

*Classe que retorna os dados das tabelas do IRRF.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `TabelasIRRF.buscarTabelaPorVigencia(Vigência)` | `IRRFScript` | **0** | Localiza a tabela do IRRF pela vigência → Uma tabela do IRRF |
| `TabelasIRRF.buscarAliquotaPorVigenciaEValor(Vigência, Valor base)` | `IRRFAliquotasScript` | **0** | Localiza a tabela do IRRF pela vigência → Uma tabela do IRRF |

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
