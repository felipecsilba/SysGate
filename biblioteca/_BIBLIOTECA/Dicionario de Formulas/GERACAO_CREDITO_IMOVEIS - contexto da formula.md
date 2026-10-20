# Contexto da fórmula — tipo `GERACAO_CREDITO_IMOVEIS`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/GERACAO_CREDITO_IMOVEIS.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — 264 fórmulas do tipo `GERACAO_CREDITO_IMOVEIS`.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**11 variáveis de contexto · 10 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### Valores simples

| Variável | O que é |
|---|---|
| `ano` | Ano vinculado a fórmula |
| `formaPagamento` | Retorna a forma de pagamento utilizado no momento de realizar o cálculo. *(0 usos)* |
| `dataLancamento` | Data de lançamento |
| `usuario` | Obtém o usuário logado |
| `lancamentosEnglobados` | Classe que contem as informações dos lançamentos dos imóveis englobados *(0 usos)* |
| `quantidadeParcelas` | Retorna a quantidade de parcelas a serem geradas quando utilizada a opção definir parcelas no momento do cálculo. *(0 usos)* |
| `complementar` | Cálculo complementar de outro lançamento |

### `imovel`

*Classe que contem as informações do imóveis*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `imovel.codigo` | `Long` | 3546 | Código de identificação do imóvel |
| `imovel.secao` | `SecoesScript` | 618 | Código da seção onde esta localizado o imóvel no logradouro |
| `imovel.unidade` | `Long` | 320 | Unidade do imóvel |
| `imovel.logradouro` | `LogradouroScript` | 295 | Código do logradouro onde esta localizado o imóvel |
| `imovel.inscricaoImobiliaria` | `InscricaoImobiliariaScript` | 258 | Inscrição imobiliária do imóvel → Buscar informação adicional do imóvel |
| `imovel.face` | `FacesScript` | 217 | Face onde o imóvel esta localizado frente ao logradouro |
| `imovel.tipoImovel` | `String` | 190 | Tipo do imóvel - RURAL OU URBANO |
| `imovel.contribuinte` | `PessoasScript` | 120 | Contribuinte proprietário do imóvel |
| `imovel.testadas` | `List` | 97 | Testadas do imovel → Lista de testadas do imovel |
| `imovel.bairro` | `BairroScript` | 57 | Bairro onde esta localizado o imóvel |
| `imovel.dataConstrucao` | `Date` | 46 | Data de construção do imóvel → Retorna a data de construção informada no cadastro do imóvel. Se não tiver data de construção o retorno será a data 1/1 |
| `imovel.maiorTestada` | `ImoveisTestadasScript` | 31 | Maior testada do imovel |
| `imovel.loteamento` | `LoteamentoScript` | 29 | Código do loteamento onde o imóvel esta localizado |
| `imovel.nroTestadas` | `Integer` | 25 | Número de testadas do imovel |
| `imovel.condominio` | `CondominioScript` | 22 | Condominio o qual o imóvel pertence |
| `imovel.lote` | `String` | 21 | Lote onde esta localizado o imóvel dentro da quadra |
| `imovel.quadra` | `String` | 17 | Quadra onde esta localizado o imóvel |
| `imovel.setor` | `String` | 10 | Setor onde esta localizado o imóvel → Setor do onde esta localizado o imóvel |
| `imovel.situacao` | `String` | 4 | Situação atual do imóvel - ATIVADO ou DESATIVADO |
| `imovel.localidade` | `LocalidadesScript` | **0** | Código da localidade onde o imóvel esta localizado |
| `imovel.denominacao` | `String` | **0** | Denominação do imóvel RURAL |
| `imovel.latitude` | `BigDecimal` | **0** | Latitude do imóvel |
| `imovel.longitude` | `BigDecimal` | **0** | Longitude do imóvel |
| `imovel.matricula` | `String` | **0** | Matricula do imóvel |
| `imovel.nroImovel` | `String` | **0** | Número do endereço do imóvel |
| `imovel.inscricaoAnterior` | `String` | **0** | Inscrição anterior do imóvel |
| `imovel.agrupamento` | `AgrupamentosScript` | **0** | Código do agrupamento |
| `imovel.apartamento` | `String` | **0** | Número do apartamento |
| `imovel.bloco` | `String` | **0** | Bloco onde esta localizado o imóvel |
| `imovel.cep` | `String` | **0** | CEP do imóvel |
| `imovel.complemento` | `String` | **0** | Complemento do endereço do imóvel |
| `imovel.inscricaoIncra` | `String` | **0** | Inscrição do INCRA - quando imóvel RURAL |

### `lancamento`

*Objeto responsável pela criação do lançamento*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `lancamento.comAFormaDePagamentoParcelada(Código das formas de pagamento)` | `LancamentosCalculosScript$Builder` | 2373 | Indica qual forma de pagamento parcelada será relacionado ao lançamento. Exemplo: lancamento.comAFormaDePagamentoParcelada(1); → Forma de pagamento ap |
| `lancamento.criarReceita(Abreviatura, Valor a ser lançado para a receita, Beneficio fiscal para a receita, Percentual de concessão do beneficio)` | `boolean` | 2019 | Cria a receita no lançamento |
| `lancamento.criarReceita(Abreviatura, Valor a ser lançado para a receita, Beneficio fiscal para a receita)` | `boolean` | 2019 | Cria a receita no lançamento |
| `lancamento.criarReceita(Abreviatura, Valor a ser lançado para a receita)` | `boolean` | 2019 | Cria a receita no lançamento |
| `lancamento.comAFormaDePagamentoIntegral(Código da forma de pagamento)` | `LancamentosCalculosScript$Builder` | 1952 | Indica qual forma de pagamento parcelada será relacionado ao lançamento. Exemplo: lancamento.comAFormaDePagamentoIntegral(1); → Forma de pe pagamento  |
| `lancamento.valorLancadoEnglobadosReceita(imovel.codigo, Abreviatura da receita)` | `BigDecimal` | 223 | Retorna o valor total lançado somente para os imóveis englobados ao imóvel principal, do crédito que está sendo calculando. → Retorna um valor decimal |
| `lancamento.calcularDescontoSobreValorLancadoSemBeneficio` | `boolean` | **0** | Determina que o desconto do lançamento deve ser aplicado sobre o valor lançado, e não sobre o valor com benefícios concedidos |
| `lancamento.recuperarReceitaLancada(Abreviatura)` | `CreditosTributariosRecScript` | **0** | Recupera a receita criada → Retorna a receita no lançamento |
| `lancamento.paraOServico(valoresAtividades)` | `LancamentosCalculosScript$Builder` | **0** | Indica que um item específico da lista de serviços do econômico será relacionado ao lançamento |
| `lancamento.paraOsServicos(opcao)` | `LancamentosCalculosScript$Builder` | **0** | Define quais os itens da lista de serviços do econômico serão relacionados ao lançamento |
| `lancamento.competenciasEntre(Data inicio, Data final)` | `LancamentosCalculosScript$Builder` | **0** | Indica quais competencias devem ser usados para o cálculo do ISS homologado do economico usando um intervalo de datas. Exemplo: lancamento.comAsCompet |
| `lancamento.competenciasAPartirDe(Data inicio)` | `LancamentosCalculosScript$Builder` | **0** | Indica quais competências devem ser usadas para o cálculo do ISS homologado do econômico usando a data informada como início de intervalo e apartir de |
| `lancamento.competenciasDoAno(Ano das competências)` | `LancamentosCalculosScript$Builder` | **0** | Indica quais competencias devem ser usados para o cálculo do ISS homologado do economico indicando o ano das competências. Exemplo: lancamento.compete |
| `lancamento.indexador(Indexador)` | `boolean` | **0** | Define o indexador do cálculo |

### `creditoTributario`

*Crédito tributário vinculado a fórmula*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `creditoTributario.codigo` | `Long` | 73 | Código do crédito tributário |
| `creditoTributario.creditosTributariosRec` | `List` | 6 | Relacionamento entre o crédito tributário e a receita |
| `creditoTributario.calculaImoveisRurais` | `String` | **0** | Indica se irá gerar lançamentos de créditos para imóveis rurais |
| `creditoTributario.abreviatura` | `String` | **0** | Abreviatura do crédito tributário |
| `creditoTributario.descricao` | `String` | **0** | Descrição do crédito tributário |
| `creditoTributario.tipoCadastro` | `String` | **0** | Tipo de cadastro ao qual pertence o crédito tributário |
| `creditoTributario.indexador` | `IndexadoresScript` | **0** | Código do indexador |

### `tabelasCalculos`

*Classe que retorna o valor da tabela conforme as caracteristiscas do imóvel informado*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `tabelasCalculos.getValor(Ano, Código da tabela de cálculo, imovel.codigo)` | `BigDecimal` | 1953 | Função que busca o valor de uma tabela de cálculo → Retornar o valor de uma tabela. |
| `tabelasCalculos.dadosDaTabelaAplicado(Ano, Código da tabela de cálculo, imovel.codigo)` | `Conjuntos` | 16 | Função que busca os dados aplicados de uma tabela → Retornar os dados aplicados de uma tabela |
| `tabelasCalculos.getValorAplicado(Conjunto classificado)` | `BigDecimal` | **0** | Função que busca o valor do conjunto classificado conforme a tabela aplicada. → Retornar o valor do conjunto classificado conforme a tabela aplicada. |
| `tabelasCalculos.getIndexadorAplicado(Conjunto classificado)` | `IndexadoresScript` | **0** | Função que busca o indexador do conjunto conforme a tabela aplicada. → Retornar o indexador do conjunto classificado conforme a tabela aplicada. |
| `tabelasCalculos.getValorAgrupamento(Ano, Código da tabela de cálculo, imovel.codigo, agrupamento)` | `BigDecimal` | **0** | Função que busca o valor de uma tabela de cálculo → Retornar o valor de uma tabela. |
| `tabelasCalculos.getIndexador(Ano das caracteristicas do imóvel, Código reduzido da tabela, imovel.codigo)` | `IndexadoresScript` | **0** | Função que busca o indexador de uma tabela → Retornar o indexador de uma tabela. |

---

## Classes utilitárias

### `CamposAdicionais`

*Classe de funções de campos adicionais*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase)` | `Object` | 5225 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase, agrupamento)` | `Object` | 5225 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional)` | `Object` | 5225 | Função que retorna o valor de um campo adicional do referente gerado nesse calculo → Valor do campo adicional |
| `CamposAdicionais.preencherCampoAdicional(referente, nomeCampoAdicional, valor, anoOuDataBase)` | `boolean` | 3909 | Função que preenche um campo adicional do referente com o valor especificado → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase, agrupamento)` | `boolean` | 2226 | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase)` | `boolean` | 2226 | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.preencherCampoAdicionalAgrupamento(referente, nomeCampoAdicional, valor, anoOuDataBase, agrupamento)` | `boolean` | 87 | Função que preenche um campo adicional do referente com o valor especificado → true / false |
| `CamposAdicionais.lotePossuiCampoAdicionalInformado(imovel, nomeCampoAdicional, valorOpção, anoOuDataBase)` | `boolean` | 14 | Função que retorna se a opção do campo adicional existe no lote examinado → true/false |

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
| `Caracteres.esquerda(texto, quantidade)` | `String` | 16 | Obtém uma quantidade específica de caracteres iniciados da esquerda para direita. → Um novo texto com a quantidade de caracteres especificadas referen |
| `Caracteres.removeEspacos(texto)` | `String` | 14 | Remover o excesso de espaços de um texto. → Um texto com o excesso de espaços removidos. |
| `Caracteres.posicao(texto, expressao, posicaoInicio)` | `int` | 6 | Obtém a posição onde um caracter se encontra em um texto. → O índice onde o valor localizado se encontra. |
| `Caracteres.posicao(texto, expressao)` | `int` | 6 | Obtém a posição inicial onde um padrão/expressão regular se encontra em um texto. → O índice onde o valor localizado se encontra. |
| `Caracteres.tamanho(texto)` | `int` | 6 | Obtém o tamanho de um texto. → O tamanho do texto. |
| `Caracteres.capitaliza(texto)` | `String` | **0** | Por meio desta função é possível colocar a primeira letra de cada palavra de um texto em maiúsculo e as outras letras para minúsculo. → Um texto com a |
| `Caracteres.direita(texto, quantidade)` | `String` | **0** | Obtém uma quantidade específica de caracteres iniciados da direita para esquerda. → Um novo texto com a quantidade de caracteres especificadas referen |
| `Caracteres.equivalente(texto, expressao)` | `boolean` | **0** | Verifica se uma expressão está contida em um texto. → Verdadeiro se a expressão for localizada e falso caso não. |
| `Caracteres.maiusculo(texto)` | `String` | **0** | Converte todos os caracteres de um texto em maiúsculo. → Um texto com todas as letras maiúsculas. |
| `Caracteres.minusculo(texto)` | `String` | **0** | Converte todos os caracteres de um texto em minúsculo. → Um texto com todas as letras minúsculas. |
| `Caracteres.expressao(texto, expressao)` | `Expressao` | **0** | Cria uma nova expressão regular para ser utilizada com um texto → Expressão regular. |
| `Caracteres.removeEspacosDireita(texto)` | `String` | **0** | Remove o excesso de espaços de um texto a esquerda. → Um texto com o excesso de espaços à esquerda removidos. |
| `Caracteres.removeEspacosEsquerda(texto)` | `String` | **0** | Remove o excesso de espaços de um texto a direita. → Um texto com o excesso de espaços à direita eliminados. |
| `Caracteres.repetir(texto, repeticao)` | `String` | **0** | Repete um texto especificado de acordo com uma quantidade definida. → Um novo texto com o valor do parâmetro texto repetido de acordo com o valor do p |
| `Caracteres.sobrepor(texto, posicaoInicial, quantidadeSobrepor, textoSobrepor)` | `String` | **0** | Sobrepõe um texto em outro em uma determinada posição e com uma quantidade específica de caracteres. → Um novo texto com o valor especificado sobrepos |
| `Caracteres.substituir(texto, textoLocalizar, textoSubstituir)` | `String` | **0** | Substitui as ocorrências de uma expressão localizada em um texto por outra expressão. → Um novo texto com o valor substituído pelo valor especifiado d |
| `Caracteres.subTexto(texto, inicio, tamanho)` | `String` | **0** | Obtém um número específico de caracteres de uma posição específica de um texto. → Um intervalo de caracteres de acordo com a posição inicial e quantid |
| `Caracteres.vazio(valor)` | `boolean` | **0** | Verifica se uma palavra está vazia. → Verdadeiro se a palavra estiver vazia e falso caso não. |
| `Caracteres.dividir(texto, expressao)` | `Iterable` | **0** | Esta função divide um texto de acordo com a expressão regular informada → Lista com os valores divididos. |
| `Caracteres.dividir(texto, expressao)` | `Iterable` | **0** | Esta função divide um texto de acordo com a expressão regular informada → Lista com os valores divididos. |

### `Datas`

*Classe utilitária para operações que utilizam datas.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Datas.data(ano, mes, dia)` | `Date` | 952 | Gera uma data sem hora de acordo com os parâmetros informados. Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1). Para parâmetr |
| `Datas.hoje` | `Date` | 307 | Obtém a data e hora do sistema operacional. → A data e hora corrente do sistema operacional. |
| `Datas.mes(data)` | `Integer` | 238 | Obtém o mês em que se encontra uma determinada data. → Um número referente ao mês da data especificada. |
| `Datas.ano(data)` | `Integer` | 121 | Obtém o ano em que se encontra uma determinada data. → Um número referente ao ano da data especificada. |
| `Datas.formatar(data, formato)` | `String` | 22 | Obtem o valor de uma data formatada de acordo com um padrão especificado. → Texto contendo a data no formato especificado |
| `Datas.dia(data)` | `Integer` | 14 | Obtém o dia em que se encontra uma determinada data. → Um número referente ao dia da data especificada. |
| `Datas.adicionaDias(data, quantidadeDias)` | `Date` | 8 | Adiciona uma quantidade especificada de dias à uma data. → Uma nova data referente aos dias especificados. |
| `Datas.diferencaAnos(menorData, maiorData)` | `long` | 7 | Calcula a diferença em anos entre duas datas. → Um número referente a diferença entre anos. |
| `Datas.diferencaMeses(menorData, maiorData)` | `long` | 3 | Calcula a diferença em meses entre duas datas. → Um número referente a diferença entre meses. |
| `Datas.adicionaHoras(data, quantidadeHoras)` | `Date` | **0** | Adiciona uma quantidade especificada de horas em uma data/hora. → Uma nova data/hora referente as horas especificadas. |
| `Datas.adicionaMeses(data, quantidadeMeses)` | `Date` | **0** | Adiciona uma quantidade especificada de meses em uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/10/201 |
| `Datas.adicionaMinutos(data, quantidadeMinutos)` | `Date` | **0** | Adiciona uma quantidade especificada de minutos em uma data/hora. → Uma nova data/hora referente aos minutos especificados. |
| `Datas.adicionaSegundos(data, quantidadeSegundos)` | `Date` | **0** | Adiciona uma quantidade especificada de segundos em uma data/hora. → Uma nova data/hora referente aos segundos especificados. |
| `Datas.dataHora(ano, mes, dia, hora, minuto)` | `Date` | **0** | Gera uma data com a hora de acordo com os parâmetros.Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1, 5, 9). Para parâmetros n |
| `Datas.diaSemana(data)` | `Integer` | **0** | Obtém o dia da semana em que se encontra uma determinada data, considerando-se o domingo como primeiro dia e o sábado como o sétimo dia. → Um número r |
| `Datas.diferencaDias(menorData, maiorData)` | `long` | **0** | Calcula a diferença em dias entre duas datas. → Um número referente a diferença entre dias. |
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
| `Datas.removeMeses(data, quantidadeMeses)` | `Date` | **0** | Remove uma quantidade especificada de meses de uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/12/2011, |
| `Datas.segundo(data)` | `Integer` | **0** | Obtém os segundos referentes a uma determinada data/hora. → Um valor inteiro de 00 a 59 referente ao segundo. |

### `ConfiguracoesParcelas`

*Classe de funções para consultar as configurações de parcelas*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `ConfiguracoesParcelas.buscaConfiguracaoPorAbreviaturaEAno(Abreviatura, Ano)` | `ConfigParcelasScript` | **0** | Função que busca as informações da configuração do parcelamento com base no seu código → Configuração de parcela |

### `Agrupamentos`

*Classe de funções para consultar agrupamentos*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Agrupamentos.buscaAgrupamento(referente, nomeAgrupamento)` | `AgrupamentosScript` | 15 | Função que retorna o agrupamento de um campo adicional |
| `Agrupamentos.buscaCamposAdicionaisDoAgrupamento(agrupamento)` | `List` | **0** | Função que retorna os campos adicionais de um agrupamento |
| `Agrupamentos.buscaAgrupamentoParcelamento(referente, nomeAgrupamento)` | `AgrupamentosScript` | **0** | Função que retorna o agrupamento de um campo adicional |

### `Imoveis`

*Classe de funções para consulta e manipulação dos imóveis*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Imoveis.buscarImoveisDoContribuinte(contribuinte.codigo)` | `List` | 17 | Localiza os imóveis pelo código do contribuinte → Uma lista de imóveis |
| `Imoveis.buscarImovelPeloCodigo(Código do imóvel)` | `ImoveisScript` | **0** | Localiza o imóvel pelo código → Um imóvel |
| `Imoveis.getEhEnglobado(Imóvel)` | `Boolean` | **0** | Retorna se o imóvel esta englobado |

### `Numeros`

*Classe utilitária para operações que utilizam números.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Numeros.arredonda(valor, casasDecimais)` | `Number` | 2251 | Arredonda um valor. → Um novo valor arredondado considerando as casas decimais especificadas. |
| `Numeros.raiz(valor)` | `Number` | 92 | Calcula a raiz quadrada de um número. → A raiz quadrada do parâmetro informado. |
| `Numeros.trunca(valor, casasDecimais)` | `Number` | 80 | Trunca um valor de acordo com o número de casas decimais especificadas. → Um novo valor truncado. |
| `Numeros.numero(texto)` | `Number` | 26 | Converte o valor de um texto em um número. → O número referente ao texto informado. Caso o texto seja inválido, o valor de retorno será 0. |
| `Numeros.maximo(valor1, valor2)` | `Number` | 18 | Obtém o maior valor entre dois números. → O maior valor entre os números informados. |
| `Numeros.seZero(valor1, valor2, valorN)` | `Number` | 1 | Testa os valores passados como parâmetro e retorna o primeiro diferente de zero. Todos os valores informados devem ser do mesmo tipo. → O primeiro val |
| `Numeros.absoluto(valor)` | `Number` | **0** | Calcula o valor absoluto de um número. → O valor absoluto. |
| `Numeros.coseno(valor)` | `Number` | **0** | Calcula o co-seno de um ângulo. |
| `Numeros.ehNumero(texto)` | `boolean` | **0** | Verifica se um texto é um número válido. → Verdadeiro se for um número e falso caso não for. |
| `Numeros.exponencial(numero)` | `Number` | **0** | Obtém o exponencial de um número específico. → O valor exponencial de um número |
| `Numeros.fatorial(numero)` | `Number` | **0** | Obtém o fatorial de um número. → O valor fatorial de um número. |
| `Numeros.logaritmo(valor)` | `Number` | **0** | Informa o logaritmo natural de um número. → O logaritmo natural do argumento. |
| `Numeros.logaritmo10(valor)` | `Number` | **0** | Informa logaritmo de base 10 de um número. → O logaritmo de base 10. |
| `Numeros.minimo(valor1, valor2)` | `Number` | **0** | Obtém o menor valor entre dois números. → O menor valor entre os números informados. |
| `Numeros.pi(valorMultiplicar)` | `Number` | **0** | Multiplica o valor de PI pelo número especificado. → O resultado da multiplicação do argumento pelo valor de PI. |
| `Numeros.piso(valor)` | `Number` | **0** | Obtém o maior número que é menor ou igual ao número espedificado, sendo este número inteiro. → O maior número inteiro que é menor ou igual ao número e |
| `Numeros.potencia(valor1, valor2)` | `Number` | **0** | Calcula o valor da potência de um número. → O valor calculado da potencialização. |
| `Numeros.randomico(numeroDelimitador)` | `Integer` | **0** | Obtém um número aleatório entre 1 a um valor limite especificado. → Um numérico aleatório de 1 até o número especificado. |
| `Numeros.resto(valorDividendo, valorDivisor)` | `Number` | **0** | Retorna o resto da divisão realizada entre o dividendo e o divisor, que são passados por parâmetro. → O resto de uma divisão. |
| `Numeros.seno(valor)` | `Number` | **0** | Calcula o seno de um ângulo. |
| `Numeros.tangente(valor)` | `Number` | **0** | Calcula a tangente de um ângulo. |
| `Numeros.teto(valor)` | `Number` | **0** | Obtém o menor número que é maior ou igual ao número espedificado, sendo este número inteiro. → O menor número inteiro que é maior ou igual ao número e |

### `UtilitariosImoveis`

*Classe de funções utilitárias*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `UtilitariosImoveis.ehEnglobado(imovel.codigo)` | `boolean` | 355 | Função que verifica a se o imóvel é englobado → true / false |
| `UtilitariosImoveis.buscaPlantaDeValores(ano, logradouro, secao, face)` | `PlantasValoresScript` | 219 | Função que retorna as informações da planta de valores com base no logradouro, na seção, na face e no ano |
| `UtilitariosImoveis.englobados(imovel.codigo)` | `List` | 130 | Retorna a lista de imóveis ativos englobados ao imóvel → Imóveis englobados |
| `UtilitariosImoveis.buscaImovelPrincipalDoEnglobamento(imovel.codigo)` | `ImoveisScript` | 106 | Função que retorna o imóvel principal do englobamento |
| `UtilitariosImoveis.buscaPlantaDeValoresDoImovel(ano, imovel.codigo)` | `PlantasValoresScript` | 100 | Função que retorna as informações da planta de valores com base no código do imóvel e ano |
| `UtilitariosImoveis.buscaSecao(logradouro, secao, face, ano)` | `SecoesScript` | 71 | Função que retorna as informações da seção com base no logradouro, código da seção e ano |
| `UtilitariosImoveis.imoveisDoMesmoLote(imovel.codigo, ano)` | `List` | 56 | Retorna a lista de imóveis ativos no ano que estejam no mesmo lote → Imóveis no mesmo lote |
| `UtilitariosImoveis.testadasAtivasNoAno(imovel.codigo, ano)` | `List` | 51 | Retorna a lista de testadas ativas para o imovel no ano indicado |
| `UtilitariosImoveis.buscaPlantaDeValoresAno(logradouro, secao, face)` | `PlantasValoresScript` | 32 | Função que retorna as informações da planta de valores com base no logradouro, na seção, na face e no ano mais atual |
| `UtilitariosImoveis.buscaSecaoDoImovel(imovel, ano)` | `SecoesScript` | 25 | Função que retorna as informações da seção com base no imóvel |
| `UtilitariosImoveis.buscaPlantaDeValoresDoImovelAno(imovel.codigo)` | `PlantasValoresScript` | 21 | Função que retorna as informações da planta de valores com base no imóvel e ano mais atual |
| `UtilitariosImoveis.existeITBI(imovel.codigo)` | `boolean` | **0** | Função que verifica se existe ITBI para o imóvel → true / false |
| `UtilitariosImoveis.existeContribuicaoDeMelhorias(imovel.codigo)` | `boolean` | **0** | Função que verifica a se existe contribuição de melhorias para o imóvel → true / false |

### `Utilitarios`

*Classe de funções gerais para criação de scripts*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Utilitarios.emitirErro(mensagem)` | `Boolean` | 3155 | Função que emite erros no cálculo |
| `Utilitarios.buscaBeneficioFiscal(Descrição)` | `BeneficiosFiscaisScript` | 1030 | Função que busca o benefício fiscal pela descrição |
| `Utilitarios.buscaValorDoIndexadorPorSiglaNumaDataEspecifica(Sigla, Data)` | `BigDecimal` | 317 | Função que retorna o valor do indexador em uma data específica |
| `Utilitarios.buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo(Sigla, Data inicial, Data final)` | `List` | 87 | Função que retorna as movimentações do indexador em um período → Lista de movimentações do indexador |
| `Utilitarios.valorGeradoLancadoPorCreditoTributarioParaReferente(Código do crédito tributário, Código do referente, Lista de abreviaturas das receitas, Ano, Considerar lançamentos complementares)` | `BigDecimal` | 86 | Buscar o valor gerado/lançado por receita do crédito tributário em questão, possibilitando informar o referente, o ano do lançamento, a receita do lan |
| `Utilitarios.existeLancamento(referente, Data)` | `ExisteLancamentoScript` | 62 | Função que verifica se o referente ou o contribuinte possui lançamentos → Objeto contendo a indicação de existência dos lançamentos |
| `Utilitarios.buscaIndexadorPorNomeESigla(Nome, Sigla)` | `IndexadoresScript` | 1 | Utilitarios. buscaIndexadorPorNomeESigla(Nome, Sigla) Parâmetros: Nome - Nome Sigla - Sigla Retorno: Indexador |
| `Utilitarios.ehMoedaCorrente(Sigla)` | `boolean` | **0** | Função que retorna se o indexador é uma moeda corrente no país → true / false |
| `Utilitarios.ehFeriado(Data)` | `Integer` | **0** | Função que se a data é um feriado → 0 - Não é feriado 1 - É feriado 2 - Domingo 3 - Sabado |
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
