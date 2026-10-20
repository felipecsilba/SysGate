# Contexto da fórmula — tipo `GERACAO_CREDITO_ECONOMICOS`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/GERACAO_CREDITO_ECONOMICOS.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — 302 fórmulas do tipo `GERACAO_CREDITO_ECONOMICOS`.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**13 variáveis de contexto · 10 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### Valores simples

| Variável | O que é |
|---|---|
| `ano` | Ano vinculado a fórmula |
| `dataBase` | Data base do cálculo |
| `formaPagamento` | Retorna a forma de pagamento utilizado no momento de realizar o cálculo. |
| `dataLancamento` | Data de lançamento |
| `quantidadeParcelas` | Retorna a quantidade de parcelas a serem geradas quando utilizada a opção definir parcelas no momento do cálculo. |
| `usuario` | Obtém o usuário logado *(0 usos)* |
| `complementar` | Cálculo complementar de outro lançamento |

### `opcoesListaServico`

*Define a forma como devem ser utilizadas as alíquotas da lista de serviços do econômico*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `opcoesListaServico.TODOS` | `String` | 3 | Indica que devem ser retornados todos os itens da lista de serviços |
| `opcoesListaServico.MAIOR_ALIQUOTA` | `String` | **0** | Indica que deve ser retornado o item da lista de serviços que possua maior alíquota |
| `opcoesListaServico.MENOR_ALIQUOTA` | `String` | **0** | Indica que deve ser retornado o item da lista de serviços que possua menor alíquota |

### `creditoTributario`

*Crédito tributário vinculado a fórmula*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `creditoTributario.codigo` | `Long` | 54 | Código do crédito tributário |
| `creditoTributario.creditosTributariosRec` | `List` | 2 | Relacionamento entre o crédito tributário e a receita |
| `creditoTributario.calculaImoveisRurais` | `String` | **0** | Indica se irá gerar lançamentos de créditos para imóveis rurais |
| `creditoTributario.tipoCadastro` | `String` | **0** | Tipo de cadastro ao qual pertence o crédito tributário |
| `creditoTributario.descricao` | `String` | **0** | Descrição do crédito tributário |
| `creditoTributario.indexador` | `IndexadoresScript` | **0** | Código do indexador |
| `creditoTributario.abreviatura` | `String` | **0** | Abreviatura do crédito tributário |

### `lancamento`

*Objeto responsável pela criação do lançamento*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `lancamento.comAFormaDePagamentoParcelada(Código das formas de pagamento)` | `LancamentosCalculosScript$Builder` | 999 | Indica qual forma de pagamento parcelada será relacionado ao lançamento. Exemplo: lancamento.comAFormaDePagamentoParcelada(1); → Forma de pagamento ap |
| `lancamento.criarReceita(Abreviatura, Valor a ser lançado para a receita, Beneficio fiscal para a receita)` | `boolean` | 904 | Cria a receita no lançamento |
| `lancamento.criarReceita(Abreviatura, Valor a ser lançado para a receita, Beneficio fiscal para a receita, Percentual de concessão do beneficio)` | `boolean` | 904 | Cria a receita no lançamento |
| `lancamento.criarReceita(Abreviatura, Valor a ser lançado para a receita)` | `boolean` | 904 | Cria a receita no lançamento |
| `lancamento.comAFormaDePagamentoIntegral(Código da forma de pagamento)` | `LancamentosCalculosScript$Builder` | 607 | Indica qual forma de pagamento parcelada será relacionado ao lançamento. Exemplo: lancamento.comAFormaDePagamentoIntegral(1); → Forma de pe pagamento  |
| `lancamento.paraOsServicos(opcao)` | `LancamentosCalculosScript$Builder` | 3 | Define quais os itens da lista de serviços do econômico serão relacionados ao lançamento |
| `lancamento.competenciasDoAno(Ano das competências)` | `LancamentosCalculosScript$Builder` | 2 | Indica quais competencias devem ser usados para o cálculo do ISS homologado do economico indicando o ano das competências. Exemplo: lancamento.compete |
| `lancamento.calcularDescontoSobreValorLancadoSemBeneficio` | `boolean` | **0** | Determina que o desconto do lançamento deve ser aplicado sobre o valor lançado, e não sobre o valor com benefícios concedidos |
| `lancamento.paraOServico(valoresAtividades)` | `LancamentosCalculosScript$Builder` | **0** | Indica que um item específico da lista de serviços do econômico será relacionado ao lançamento |
| `lancamento.recuperarReceitaLancada(Abreviatura)` | `CreditosTributariosRecScript` | **0** | Recupera a receita criada → Retorna a receita no lançamento |
| `lancamento.competenciasEntre(Data inicio, Data final)` | `LancamentosCalculosScript$Builder` | **0** | Indica quais competencias devem ser usados para o cálculo do ISS homologado do economico usando um intervalo de datas. Exemplo: lancamento.comAsCompet |
| `lancamento.competenciasAPartirDe(Data inicio)` | `LancamentosCalculosScript$Builder` | **0** | Indica quais competências devem ser usadas para o cálculo do ISS homologado do econômico usando a data informada como início de intervalo e apartir de |
| `lancamento.valorLancadoEnglobadosReceita(imovel.codigo, Abreviatura da receita)` | `BigDecimal` | **0** | Retorna o valor total lançado somente para os imóveis englobados ao imóvel principal, do crédito que está sendo calculando. → Retorna um valor decimal |
| `lancamento.indexador(Indexador)` | `boolean` | **0** | Define o indexador do cálculo |

### `economico`

*Classe que contem as informações do econômico*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `economico.dataInicioOuReinicio` | `Date` | 459 | Data de início ou reinício do econômico |
| `economico.codigo` | `Long` | 256 | Código reduzido do econômico |
| `economico.situacao` | `String` | 244 | Situação do econômico - ATIVADO ("Em atividade") - INICIO ("Inicio das atividades") - REINICIO ("Reinicio das atividades") - BAIXADO ("Baixa das ativi |
| `economico.porteDaEmpresa` | `String` | 210 | Porte da empresa |
| `economico.cnaePrincipal` | `EconomicosCnaesScript` | 176 | CNAE príncipal → Uma CNAE |
| `economico.regimeCobrancaIss` | `String` | 165 | Regime de cobrança do ISS → HOMOLOGADO ou FIXO ou ESTIMADO ou ARBITRADO ou SEM_COBRANCA |
| `economico.contribuinte` | `PessoasScript` | 154 | Contribuinte |
| `economico.cnaes` | `List` | 74 | Lista de CNAES |
| `economico.situacaoAtual` | `String` | 71 | Situação atual do econômico - ATIVADO ("Em atividade") - INICIO ("Inicio das atividades") - REINICIO ("Reinicio das atividades") - BAIXADO ("Baixa das |
| `economico.cnaesSecundarias` | `List` | 32 | Lista de CNAES secundárias |
| `economico.agrupamento` | `AgrupamentosScript` | 18 | Agrupamento |
| `economico.quantidadeCnaesSecundarias` | `Long` | 8 | Quantidade de CNAES secundárias |
| `economico.servicoPrincipal` | `EconomicosListaServicosScript` | 6 | Serviço príncipal → Um serviço |
| `economico.cep` | `String` | 2 | CEP do econômico |
| `economico.servicos` | `List` | 1 | Lista de CNAES → Lista de serviços |
| `economico.listaServicosSecundarios` | `List` | **0** | Lista de serviços secundários |
| `economico.quantidadeServicosSecundarios` | `Long` | **0** | Quantidade de serviços secundários → Quantidade de serviços sercundários |
| `economico.dataBase` | `Date` | **0** | Data base de cálculo |
| `economico.apartamento` | `String` | **0** | Número do apartamento |
| `economico.bloco` | `String` | **0** | Bloco onde esta localizado o econômico |
| `economico.economicoPrincipal` | `String` | **0** | Econômico principal → SIM ou NAO |
| `economico.complemento` | `String` | **0** | Complemento do endereço do econômico |
| `economico.condominio` | `CondominioScript` | **0** | Condominio o qual o econômico pertence → Condomínio |
| `economico.logradouro` | `LogradouroScript` | **0** | Logradouro onde esta localizado o econômico |
| `economico.loteamento` | `LoteamentoScript` | **0** | Loteamento onde o econômico esta localizado |

### `configuracaoTaxaExpediente`

*Classe que contém as informações da configuração da taxa de expediente*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `configuracaoTaxaExpediente.valorTaxaExpediente` | `BigDecimal` | **0** | Valor da taxa de expediente configurada |

### `tabelasCalculos`

*Classe que retorna o valor da tabela conforme as caracteristiscas do econômico informado*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `tabelasCalculos.getValor(Data, Código da tabela de cálculo, economico.codigo)` | `BigDecimal` | 52 | Função que busca o valor de uma tabela de cálculo → Retornar o valor de uma tabela. |
| `tabelasCalculos.getValorAgrupamento(Data, Código da tabela de cálculo, economico.codigo, agrupamento)` | `BigDecimal` | 8 | Função que busca o valor de uma tabela de cálculo → Retornar o valor de uma tabela. |

---

## Classes utilitárias

### `UtilitariosEconomicos`

*Classe de funções utilitárias*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `UtilitariosEconomicos.buscaMovimentacoes(economico.codEconomico)` | `List` | 89 | Busca movimentações pelo código reduzido do econômico → Lista de movimentações |
| `UtilitariosEconomicos.buscaUltimaMovimentacaoPorTipo(economico.codEconomico, Tipo)` | `EconomicosMovimentacoesScript` | 10 | Busca a última movimentações pelo código reduzido do econômico → Uma movimentação |
| `UtilitariosEconomicos.buscaSituacaoDoEconomicoEmUmaData(economico.codEconomico, Data)` | `String` | 1 | Busca a situação do econômico em uma data |
| `UtilitariosEconomicos.buscaEconomicosPeloContribuinte(economico.contribuinte)` | `List` | **0** | Localiza os econômicos pelo contribuinte → Lista de econômicos |
| `UtilitariosEconomicos.buscaEconomicoPeloCodigo(economico.codEconomico)` | `EconomicosScript` | **0** | Localiza o econômico pelo código reduzido → Um econômico |
| `UtilitariosEconomicos.buscaUltimaMovimentacao(economico.codEconomico)` | `EconomicosMovimentacoesScript` | **0** | Busca a última movimentações pelo código reduzido do econômico → Uma movimentação |
| `UtilitariosEconomicos.buscaValoresListaServicos(economico.codEconomico, Data)` | `List` | **0** | Função que busca os itens da lista de serviços relacionados a um econômico |
| `UtilitariosEconomicos.buscaValoresISSListaServicos(economico.codEconomico, Data)` | `List` | **0** | Função que busca os itens da lista de serviços e seu valor de ISS relacionados a um econômico |
| `UtilitariosEconomicos.buscaServicoComMaiorAliquota(economico.codEconomico, Data)` | `ValoresCnaesServicosScript` | **0** | Função que busca o serviço relacionados a um econômico que possua a maior alíquota → Serviço de maior aliquota |
| `UtilitariosEconomicos.buscaServicoComMenorAliquota(economico.codEconomico, Data)` | `ValoresCnaesServicosScript` | **0** | Função que busca o serviço relacionados a um econômico que possua a menor alíquota → Serviço de maior aliquota |
| `UtilitariosEconomicos.buscaEconomicoPeloCodigoEDataBase(economico.codEconomico, Data base)` | `EconomicosScript` | **0** | Localiza o econômico pelo código reduzido → Um econômico |

### `CamposAdicionais`

*Classe de funções de campos adicionais*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase)` | `Object` | 1179 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase, agrupamento)` | `Object` | 1179 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional)` | `Object` | 1179 | Função que retorna o valor de um campo adicional do referente gerado nesse calculo → Valor do campo adicional |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase)` | `boolean` | 352 | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase, agrupamento)` | `boolean` | 352 | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.preencherCampoAdicional(referente, nomeCampoAdicional, valor, anoOuDataBase)` | `boolean` | 121 | Função que preenche um campo adicional do referente com o valor especificado → true / false |
| `CamposAdicionais.lotePossuiCampoAdicionalInformado(imovel, nomeCampoAdicional, valorOpção, anoOuDataBase)` | `boolean` | **0** | Função que retorna se a opção do campo adicional existe no lote examinado → true/false |
| `CamposAdicionais.preencherCampoAdicionalAgrupamento(referente, nomeCampoAdicional, valor, anoOuDataBase, agrupamento)` | `boolean` | **0** | Função que preenche um campo adicional do referente com o valor especificado → true / false |

### `TabelasAuxiliares`

*Classe de funções de tabelas auxiliares*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `TabelasAuxiliares.buscarRegistrosDoReferente(referente, codigoTabelaAuxiliar, anoOuDataBase)` | `List` | 123 | Função que retorna os registros de tabelas auxiliares para um referente → Lista de registros da tabela auxiliar |
| `TabelasAuxiliares.buscarRegistrosDaTabela(codigoTabelaAuxiliar)` | `List` | 4 | Função que retorna os registros de tabelas auxiliares → Lista de registros da tabela auxiliar |
| `TabelasAuxiliares.buscarRegistroDoReferentePorCampo(referente, codigoTabelaAuxiliar, numeroCampo, valorCampo, anoOuDataBase)` | `RegistrosTabelasAuxiliaresScript` | 2 | Função que retorna o registro completo com base no valor de um campo específico da tabela auxiliar para um referente → Registro da tabela auxiliar |
| `TabelasAuxiliares.buscarRegistroDaTabelaPorCampo(codigoTabelaAuxiliar, numeroCampo, valorCampo)` | `RegistrosTabelasAuxiliaresScript` | **0** | Função que retorna o registro completo com base no valor de um campo específico da tabela auxiliar → Registro da tabela auxiliar |
| `TabelasAuxiliares.valorDoCampoPorDescricao(registro, descricaoCampo)` | `String` | **0** | Função que retorna o valor de um campo específico de um registro da tabela auxiliar |

### `Caracteres`

*Classe utilitária para manipulação de Caracteres.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Caracteres.subTexto(texto, inicio, tamanho)` | `String` | 114 | Obtém um número específico de caracteres de uma posição específica de um texto. → Um intervalo de caracteres de acordo com a posição inicial e quantid |
| `Caracteres.tamanho(texto)` | `int` | 64 | Obtém o tamanho de um texto. → O tamanho do texto. |
| `Caracteres.esquerda(texto, quantidade)` | `String` | 34 | Obtém uma quantidade específica de caracteres iniciados da esquerda para direita. → Um novo texto com a quantidade de caracteres especificadas referen |
| `Caracteres.posicao(texto, expressao, posicaoInicio)` | `int` | 11 | Obtém a posição onde um caracter se encontra em um texto. → O índice onde o valor localizado se encontra. |
| `Caracteres.posicao(texto, expressao)` | `int` | 11 | Obtém a posição inicial onde um padrão/expressão regular se encontra em um texto. → O índice onde o valor localizado se encontra. |
| `Caracteres.equivalente(texto, expressao)` | `boolean` | 8 | Verifica se uma expressão está contida em um texto. → Verdadeiro se a expressão for localizada e falso caso não. |
| `Caracteres.maiusculo(texto)` | `String` | 8 | Converte todos os caracteres de um texto em maiúsculo. → Um texto com todas as letras maiúsculas. |
| `Caracteres.capitaliza(texto)` | `String` | **0** | Por meio desta função é possível colocar a primeira letra de cada palavra de um texto em maiúsculo e as outras letras para minúsculo. → Um texto com a |
| `Caracteres.direita(texto, quantidade)` | `String` | **0** | Obtém uma quantidade específica de caracteres iniciados da direita para esquerda. → Um novo texto com a quantidade de caracteres especificadas referen |
| `Caracteres.minusculo(texto)` | `String` | **0** | Converte todos os caracteres de um texto em minúsculo. → Um texto com todas as letras minúsculas. |
| `Caracteres.expressao(texto, expressao)` | `Expressao` | **0** | Cria uma nova expressão regular para ser utilizada com um texto → Expressão regular. |
| `Caracteres.removeEspacos(texto)` | `String` | **0** | Remover o excesso de espaços de um texto. → Um texto com o excesso de espaços removidos. |
| `Caracteres.removeEspacosDireita(texto)` | `String` | **0** | Remove o excesso de espaços de um texto a esquerda. → Um texto com o excesso de espaços à esquerda removidos. |
| `Caracteres.removeEspacosEsquerda(texto)` | `String` | **0** | Remove o excesso de espaços de um texto a direita. → Um texto com o excesso de espaços à direita eliminados. |
| `Caracteres.repetir(texto, repeticao)` | `String` | **0** | Repete um texto especificado de acordo com uma quantidade definida. → Um novo texto com o valor do parâmetro texto repetido de acordo com o valor do p |
| `Caracteres.sobrepor(texto, posicaoInicial, quantidadeSobrepor, textoSobrepor)` | `String` | **0** | Sobrepõe um texto em outro em uma determinada posição e com uma quantidade específica de caracteres. → Um novo texto com o valor especificado sobrepos |
| `Caracteres.substituir(texto, textoLocalizar, textoSubstituir)` | `String` | **0** | Substitui as ocorrências de uma expressão localizada em um texto por outra expressão. → Um novo texto com o valor substituído pelo valor especifiado d |
| `Caracteres.vazio(valor)` | `boolean` | **0** | Verifica se uma palavra está vazia. → Verdadeiro se a palavra estiver vazia e falso caso não. |
| `Caracteres.dividir(texto, expressao)` | `Iterable` | **0** | Esta função divide um texto de acordo com a expressão regular informada → Lista com os valores divididos. |
| `Caracteres.dividir(texto, expressao)` | `Iterable` | **0** | Esta função divide um texto de acordo com a expressão regular informada → Lista com os valores divididos. |

### `ConfiguracoesParcela`

*Classe de funções para consultar as configurações de parcelas*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `ConfiguracoesParcela.buscaConfiguracaoPorAbreviaturaEAno(Abreviatura, Ano)` | `ConfigParcelasScript` | **0** | Função que busca as informações da configuração do parcelamento com base no seu código → Configuração de parcela |

### `Datas`

*Classe utilitária para operações que utilizam datas.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Datas.data(ano, mes, dia)` | `Date` | 719 | Gera uma data sem hora de acordo com os parâmetros informados. Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1). Para parâmetr |
| `Datas.ano(data)` | `Integer` | 430 | Obtém o ano em que se encontra uma determinada data. → Um número referente ao ano da data especificada. |
| `Datas.hoje` | `Date` | 271 | Obtém a data e hora do sistema operacional. → A data e hora corrente do sistema operacional. |
| `Datas.diferencaMeses(menorData, maiorData)` | `long` | 247 | Calcula a diferença em meses entre duas datas. → Um número referente a diferença entre meses. |
| `Datas.mes(data)` | `Integer` | 175 | Obtém o mês em que se encontra uma determinada data. → Um número referente ao mês da data especificada. |
| `Datas.dia(data)` | `Integer` | 38 | Obtém o dia em que se encontra uma determinada data. → Um número referente ao dia da data especificada. |
| `Datas.diferencaDias(menorData, maiorData)` | `long` | 21 | Calcula a diferença em dias entre duas datas. → Um número referente a diferença entre dias. |
| `Datas.formatar(data, formato)` | `String` | 7 | Obtem o valor de uma data formatada de acordo com um padrão especificado. → Texto contendo a data no formato especificado |
| `Datas.dataHora(ano, mes, dia, hora, minuto)` | `Date` | 5 | Gera uma data com a hora de acordo com os parâmetros.Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1, 5, 9). Para parâmetros n |
| `Datas.diferencaAnos(menorData, maiorData)` | `long` | 3 | Calcula a diferença em anos entre duas datas. → Um número referente a diferença entre anos. |
| `Datas.adicionaDias(data, quantidadeDias)` | `Date` | **0** | Adiciona uma quantidade especificada de dias à uma data. → Uma nova data referente aos dias especificados. |
| `Datas.adicionaHoras(data, quantidadeHoras)` | `Date` | **0** | Adiciona uma quantidade especificada de horas em uma data/hora. → Uma nova data/hora referente as horas especificadas. |
| `Datas.adicionaMeses(data, quantidadeMeses)` | `Date` | **0** | Adiciona uma quantidade especificada de meses em uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/10/201 |
| `Datas.adicionaMinutos(data, quantidadeMinutos)` | `Date` | **0** | Adiciona uma quantidade especificada de minutos em uma data/hora. → Uma nova data/hora referente aos minutos especificados. |
| `Datas.adicionaSegundos(data, quantidadeSegundos)` | `Date` | **0** | Adiciona uma quantidade especificada de segundos em uma data/hora. → Uma nova data/hora referente aos segundos especificados. |
| `Datas.diaSemana(data)` | `Integer` | **0** | Obtém o dia da semana em que se encontra uma determinada data, considerando-se o domingo como primeiro dia e o sábado como o sétimo dia. → Um número r |
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

### `Atividades`

*Classe que retorna os valores das atividades do econômico.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Atividades.buscaAtividadeEconomica(CNAE do econômico)` | `AtividadesEconomicasScript` | 13 | Função que busca o valor do Alvará de uma atividade |
| `Atividades.buscaValorAlvara(Atividade, Data base)` | `BigDecimal` | 4 | Função que busca o valor do Alvará de uma atividade |
| `Atividades.somaValorAlvara(Econômico, Data base)` | `BigDecimal` | **0** | Função que busca a soma do valor do Alvará de uma atividade |
| `Atividades.buscaMaiorValorAlvara(Código da atividade, Data base)` | `BigDecimal` | **0** | Função que busca o maior valor do Alvará de uma atividade |
| `Atividades.buscaMenorValorAlvara(Código da atividade, Data base)` | `BigDecimal` | **0** | Função que busca o menor valor do Alvará de uma atividade |
| `Atividades.buscaMovimentacaoPorData(Atividade, Data base)` | `EconomicosCnaesMovtosScript` | **0** | Função que busca a data inicial da atividade → Uma data |
| `Atividades.buscaMovimentacoes(Atividade)` | `List` | **0** | Função que busca a data inicial da atividade → Uma data |

### `Agrupamentos`

*Classe de funções para consultar agrupamentos*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Agrupamentos.buscaAgrupamento(referente, nomeAgrupamento)` | `AgrupamentosScript` | 10 | Função que retorna o agrupamento de um campo adicional |
| `Agrupamentos.buscaCamposAdicionaisDoAgrupamento(agrupamento)` | `List` | **0** | Função que retorna os campos adicionais de um agrupamento |
| `Agrupamentos.buscaAgrupamentoParcelamento(referente, nomeAgrupamento)` | `AgrupamentosScript` | **0** | Função que retorna o agrupamento de um campo adicional |

### `Numeros`

*Classe utilitária para operações que utilizam números.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Numeros.arredonda(valor, casasDecimais)` | `Number` | 442 | Arredonda um valor. → Um novo valor arredondado considerando as casas decimais especificadas. |
| `Numeros.numero(texto)` | `Number` | 386 | Converte o valor de um texto em um número. → O número referente ao texto informado. Caso o texto seja inválido, o valor de retorno será 0. |
| `Numeros.trunca(valor, casasDecimais)` | `Number` | 26 | Trunca um valor de acordo com o número de casas decimais especificadas. → Um novo valor truncado. |
| `Numeros.resto(valorDividendo, valorDivisor)` | `Number` | 11 | Retorna o resto da divisão realizada entre o dividendo e o divisor, que são passados por parâmetro. → O resto de uma divisão. |
| `Numeros.absoluto(valor)` | `Number` | **0** | Calcula o valor absoluto de um número. → O valor absoluto. |
| `Numeros.coseno(valor)` | `Number` | **0** | Calcula o co-seno de um ângulo. |
| `Numeros.ehNumero(texto)` | `boolean` | **0** | Verifica se um texto é um número válido. → Verdadeiro se for um número e falso caso não for. |
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

### `Utilitarios`

*Classe de funções gerais para criação de scripts*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Utilitarios.emitirErro(mensagem)` | `Boolean` | 1229 | Função que emite erros no cálculo |
| `Utilitarios.buscaValorDoIndexadorPorSiglaNumaDataEspecifica(Sigla, Data)` | `BigDecimal` | 283 | Função que retorna o valor do indexador em uma data específica |
| `Utilitarios.buscaBeneficioFiscal(Descrição)` | `BeneficiosFiscaisScript` | 263 | Função que busca o benefício fiscal pela descrição |
| `Utilitarios.valorGeradoLancadoPorCreditoTributarioParaReferente(Código do crédito tributário, Código do referente, Lista de abreviaturas das receitas, Ano, Considerar lançamentos complementares)` | `BigDecimal` | 54 | Buscar o valor gerado/lançado por receita do crédito tributário em questão, possibilitando informar o referente, o ano do lançamento, a receita do lan |
| `Utilitarios.buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo(Sigla, Data inicial, Data final)` | `List` | 15 | Função que retorna as movimentações do indexador em um período → Lista de movimentações do indexador |
| `Utilitarios.existeLancamento(referente, Data)` | `ExisteLancamentoScript` | 3 | Função que verifica se o referente ou o contribuinte possui lançamentos → Objeto contendo a indicação de existência dos lançamentos |
| `Utilitarios.ehMoedaCorrente(Sigla)` | `boolean` | **0** | Função que retorna se o indexador é uma moeda corrente no país → true / false |
| `Utilitarios.buscaIndexadorPorNomeESigla(Nome, Sigla)` | `IndexadoresScript` | **0** | Utilitarios. buscaIndexadorPorNomeESigla(Nome, Sigla) Parâmetros: Nome - Nome Sigla - Sigla Retorno: Indexador |
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
