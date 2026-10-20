# Contexto da fórmula — tipo `GERACAO_CREDITO_RECEITAS_DIVERSAS`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/GERACAO_CREDITO_RECEITAS_DIVERSAS.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — 1009 fórmulas do tipo `GERACAO_CREDITO_RECEITAS_DIVERSAS`.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**11 variáveis de contexto · 7 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### Valores simples

| Variável | O que é |
|---|---|
| `ano` | Ano vinculado a fórmula |
| `dataLancamento` | Data de lançamento |
| `usuario` | Obtém o usuário logado |
| `complementar` | Cálculo complementar de outro lançamento |

### `imovel`

*Classe que contem as informações do imóveis*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `imovel.codigo` | `Long` | 10 | Código de identificação do imóvel |
| `imovel.bairro` | `BairroScript` | 3 | Bairro onde esta localizado o imóvel |
| `imovel.dataConstrucao` | `Date` | **0** | Data de construção do imóvel → Retorna a data de construção informada no cadastro do imóvel. Se não tiver data de construção o retorno será a data 1/1 |
| `imovel.testadas` | `List` | **0** | Testadas do imovel → Lista de testadas do imovel |
| `imovel.nroTestadas` | `Integer` | **0** | Número de testadas do imovel |
| `imovel.maiorTestada` | `ImoveisTestadasScript` | **0** | Maior testada do imovel |
| `imovel.localidade` | `LocalidadesScript` | **0** | Código da localidade onde o imóvel esta localizado |
| `imovel.face` | `FacesScript` | **0** | Face onde o imóvel esta localizado frente ao logradouro |
| `imovel.denominacao` | `String` | **0** | Denominação do imóvel RURAL |
| `imovel.latitude` | `BigDecimal` | **0** | Latitude do imóvel |
| `imovel.longitude` | `BigDecimal` | **0** | Longitude do imóvel |
| `imovel.matricula` | `String` | **0** | Matricula do imóvel |
| `imovel.nroImovel` | `String` | **0** | Número do endereço do imóvel |
| `imovel.inscricaoAnterior` | `String` | **0** | Inscrição anterior do imóvel |
| `imovel.setor` | `String` | **0** | Setor onde esta localizado o imóvel → Setor do onde esta localizado o imóvel |
| `imovel.secao` | `SecoesScript` | **0** | Código da seção onde esta localizado o imóvel no logradouro |
| `imovel.agrupamento` | `AgrupamentosScript` | **0** | Código do agrupamento |
| `imovel.apartamento` | `String` | **0** | Número do apartamento |
| `imovel.bloco` | `String` | **0** | Bloco onde esta localizado o imóvel |
| `imovel.cep` | `String` | **0** | CEP do imóvel |
| `imovel.complemento` | `String` | **0** | Complemento do endereço do imóvel |
| `imovel.condominio` | `CondominioScript` | **0** | Condominio o qual o imóvel pertence |
| `imovel.logradouro` | `LogradouroScript` | **0** | Código do logradouro onde esta localizado o imóvel |
| `imovel.loteamento` | `LoteamentoScript` | **0** | Código do loteamento onde o imóvel esta localizado |
| `imovel.inscricaoImobiliaria` | `InscricaoImobiliariaScript` | **0** | Inscrição imobiliária do imóvel → Buscar informação adicional do imóvel |
| `imovel.inscricaoIncra` | `String` | **0** | Inscrição do INCRA - quando imóvel RURAL |
| `imovel.lote` | `String` | **0** | Lote onde esta localizado o imóvel dentro da quadra |
| `imovel.quadra` | `String` | **0** | Quadra onde esta localizado o imóvel |
| `imovel.contribuinte` | `PessoasScript` | **0** | Contribuinte proprietário do imóvel |
| `imovel.unidade` | `Long` | **0** | Unidade do imóvel |
| `imovel.tipoImovel` | `String` | **0** | Tipo do imóvel - RURAL OU URBANO |
| `imovel.situacao` | `String` | **0** | Situação atual do imóvel - ATIVADO ou DESATIVADO |

### `lancamento`

*Objeto responsavel pela criação do lançamento*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `lancamento.criarReceita(Abreviatura, Valor a ser lançado para a receita, Beneficio fiscal para a receita)` | `boolean` | 5592 | Cria a receita no lançamento |
| `lancamento.criarReceita(Abreviatura, Valor a ser lançado para a receita, Beneficio fiscal para a receita, Percentual de concessão do beneficio)` | `boolean` | 5592 | Cria a receita no lançamento |
| `lancamento.criarReceita(Abreviatura, Valor a ser lançado para a receita)` | `boolean` | 5592 | Cria a receita no lançamento |
| `lancamento.comAFormaDePagamentoParcelada(Código das formas de pagamento)` | `LancamentosCalculosScript$Builder` | 245 | Indica qual forma de pagamento parcelada será relacionado ao lançamento. Exemplo: lancamento.comAFormaDePagamentoParcelada(1); → Forma de pagamento ap |
| `lancamento.comAFormaDePagamentoIntegral(Código da forma de pagamento)` | `LancamentosCalculosScript$Builder` | 233 | Indica qual forma de pagamento parcelada será relacionado ao lançamento. Exemplo: lancamento.comAFormaDePagamentoIntegral(1); → Forma de pe pagamento  |
| `lancamento.calcularDescontoSobreValorLancadoSemBeneficio` | `boolean` | 1 | Determina que o desconto do lançamento deve ser aplicado sobre o valor lançado, e não sobre o valor com benefícios concedidos |
| `lancamento.paraOsServicos(opcao)` | `LancamentosCalculosScript$Builder` | **0** | Define quais os itens da lista de serviços do econômico serão relacionados ao lançamento |
| `lancamento.paraOServico(valoresAtividades)` | `LancamentosCalculosScript$Builder` | **0** | Indica que um item específico da lista de serviços do econômico será relacionado ao lançamento |
| `lancamento.recuperarReceitaLancada(Abreviatura)` | `CreditosTributariosRecScript` | **0** | Recupera a receita criada → Retorna a receita no lançamento |
| `lancamento.competenciasEntre(Data inicio, Data final)` | `LancamentosCalculosScript$Builder` | **0** | Indica quais competencias devem ser usados para o cálculo do ISS homologado do economico usando um intervalo de datas. Exemplo: lancamento.comAsCompet |
| `lancamento.competenciasAPartirDe(Data inicio)` | `LancamentosCalculosScript$Builder` | **0** | Indica quais competências devem ser usadas para o cálculo do ISS homologado do econômico usando a data informada como início de intervalo e apartir de |
| `lancamento.competenciasDoAno(Ano das competências)` | `LancamentosCalculosScript$Builder` | **0** | Indica quais competencias devem ser usados para o cálculo do ISS homologado do economico indicando o ano das competências. Exemplo: lancamento.compete |
| `lancamento.valorLancadoEnglobadosReceita(imovel.codigo, Abreviatura da receita)` | `BigDecimal` | **0** | Retorna o valor total lançado somente para os imóveis englobados ao imóvel principal, do crédito que está sendo calculando. → Retorna um valor decimal |
| `lancamento.indexador(Indexador)` | `boolean` | **0** | Define o indexador do cálculo |

### `receitaDiversa`

*Obtém informações da receita diversa*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `receitaDiversa.camposAdicionais` | `Map` | 1586 | Campos Adicionais |
| `receitaDiversa.descricaoServico` | `String` | 1560 | Descrição do serviço |
| `receitaDiversa.data` | `Date` | 69 | Data da receita diversa |
| `receitaDiversa.contribuinte` | `PessoasScript` | 18 | Contribuinte vinculado à receita diversa |
| `receitaDiversa.tipoDeServico` | `AgrupamentosScript` | 4 | Tipo de serviço vinculado à receita diversa |
| `receitaDiversa.nroProcesso` | `String` | **0** | Número do processo |
| `receitaDiversa.codigo` | `Long` | **0** | Código da receita diversa |

### `economico`

*Classe que contem as informações do econômico*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `economico.cnaes` | `List` | 157 | Lista de CNAES |
| `economico.contribuinte` | `PessoasScript` | 70 | Contribuinte |
| `economico.dataInicioOuReinicio` | `Date` | 63 | Data de início ou reinício do econômico |
| `economico.cnaePrincipal` | `EconomicosCnaesScript` | 43 | CNAE príncipal → Uma CNAE |
| `economico.codigo` | `Long` | 41 | Código reduzido do econômico |
| `economico.situacao` | `String` | 35 | Situação do econômico - ATIVADO ("Em atividade") - INICIO ("Inicio das atividades") - REINICIO ("Reinicio das atividades") - BAIXADO ("Baixa das ativi |
| `economico.situacaoAtual` | `String` | 22 | Situação atual do econômico - ATIVADO ("Em atividade") - INICIO ("Inicio das atividades") - REINICIO ("Reinicio das atividades") - BAIXADO ("Baixa das |
| `economico.regimeCobrancaIss` | `String` | 16 | Regime de cobrança do ISS → HOMOLOGADO ou FIXO ou ESTIMADO ou ARBITRADO ou SEM_COBRANCA |
| `economico.porteDaEmpresa` | `String` | 14 | Porte da empresa |
| `economico.cnaesSecundarias` | `List` | 13 | Lista de CNAES secundárias |
| `economico.servicos` | `List` | 1 | Lista de CNAES → Lista de serviços |
| `economico.quantidadeCnaesSecundarias` | `Long` | **0** | Quantidade de CNAES secundárias |
| `economico.servicoPrincipal` | `EconomicosListaServicosScript` | **0** | Serviço príncipal → Um serviço |
| `economico.listaServicosSecundarios` | `List` | **0** | Lista de serviços secundários |
| `economico.quantidadeServicosSecundarios` | `Long` | **0** | Quantidade de serviços secundários → Quantidade de serviços sercundários |
| `economico.dataBase` | `Date` | **0** | Data base de cálculo |
| `economico.agrupamento` | `AgrupamentosScript` | **0** | Agrupamento |
| `economico.apartamento` | `String` | **0** | Número do apartamento |
| `economico.bloco` | `String` | **0** | Bloco onde esta localizado o econômico |
| `economico.cep` | `String` | **0** | CEP do econômico |
| `economico.economicoPrincipal` | `String` | **0** | Econômico principal → SIM ou NAO |
| `economico.complemento` | `String` | **0** | Complemento do endereço do econômico |
| `economico.condominio` | `CondominioScript` | **0** | Condominio o qual o econômico pertence → Condomínio |
| `economico.logradouro` | `LogradouroScript` | **0** | Logradouro onde esta localizado o econômico |
| `economico.loteamento` | `LoteamentoScript` | **0** | Loteamento onde o econômico esta localizado |

### `creditoTributario`

*Crédito tributário vinculado a fórmula*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `creditoTributario.calculaImoveisRurais` | `String` | **0** | Indica se irá gerar lançamentos de créditos para imóveis rurais |
| `creditoTributario.codigo` | `Long` | **0** | Código do crédito tributário |
| `creditoTributario.creditosTributariosRec` | `List` | **0** | Relacionamento entre o crédito tributário e a receita |
| `creditoTributario.tipoCadastro` | `String` | **0** | Tipo de cadastro ao qual pertence o crédito tributário |
| `creditoTributario.descricao` | `String` | **0** | Descrição do crédito tributário |
| `creditoTributario.indexador` | `IndexadoresScript` | **0** | Código do indexador |
| `creditoTributario.abreviatura` | `String` | **0** | Abreviatura do crédito tributário |

### `configuracaoLancamento`

*Obtém informações da configuração da geração da receita diversa*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `configuracaoLancamento.alterarVencimento(Data)` | `void` | 600 | Definir novo vencimento |
| `configuracaoLancamento.dataVencimento` | `Date` | 264 | Data de vencimento |
| `configuracaoLancamento.qtdParcelas` | `Integer` | 109 | Quantidade de parcelas |
| `configuracaoLancamento.totalLancado` | `BigDecimal` | **0** | Total Lancado → Total lançado |
| `configuracaoLancamento.intervaloVenctos` | `IntervaloVenctos` | **0** | Intervalo de vencimentos |
| `configuracaoLancamento.dataCriacao` | `Date` | **0** | Data de criação da receita diversa |
| `configuracaoLancamento.qtdDiasMeses` | `Integer` | **0** | Quantidade de dias ou meses de intervalo entre os vencimentos |
| `configuracaoLancamento.observacao` | `String` | **0** | Observação informado para a configuração de cálculo |
| `configuracaoLancamento.codigo` | `Long` | **0** | Código de identificação da configuração |
| `configuracaoLancamento.receitas` | `List` | **0** | Lista de receitas e valores informados para o cálculo |

### `tabelasCalculos`

*Classe que retorna o valor da tabela conforme as caracteristiscas da receita diversa informada*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `tabelasCalculos.valor(Código da tabela de cálculo, receitaDiversa)` | `BigDecimal` | 75 | Função que busca o valor de uma tabela de cálculo → Retornar o valor de uma tabela. |

---

## Classes utilitárias

### `CamposAdicionais`

*Classe de funções de campos adicionais*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase)` | `Object` | 2719 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase, agrupamento)` | `Object` | 2719 | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional)` | `Object` | 2719 | Função que retorna o valor de um campo adicional do referente gerado nesse calculo → Valor do campo adicional |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase)` | `boolean` | 90 | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase, agrupamento)` | `boolean` | 90 | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.preencherCampoAdicional(referente, nomeCampoAdicional, valor, anoOuDataBase)` | `boolean` | 19 | Função que preenche um campo adicional do referente com o valor especificado → true / false |
| `CamposAdicionais.preencherCampoAdicionalAgrupamento(referente, nomeCampoAdicional, valor, anoOuDataBase, agrupamento)` | `boolean` | 1 | Função que preenche um campo adicional do referente com o valor especificado → true / false |
| `CamposAdicionais.lotePossuiCampoAdicionalInformado(imovel, nomeCampoAdicional, valorOpção, anoOuDataBase)` | `boolean` | **0** | Função que retorna se a opção do campo adicional existe no lote examinado → true/false |

### `Caracteres`

*Classe utilitária para manipulação de Caracteres.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Caracteres.tamanho(texto)` | `int` | 31 | Obtém o tamanho de um texto. → O tamanho do texto. |
| `Caracteres.direita(texto, quantidade)` | `String` | 24 | Obtém uma quantidade específica de caracteres iniciados da direita para esquerda. → Um novo texto com a quantidade de caracteres especificadas referen |
| `Caracteres.substituir(texto, textoLocalizar, textoSubstituir)` | `String` | 24 | Substitui as ocorrências de uma expressão localizada em um texto por outra expressão. → Um novo texto com o valor substituído pelo valor especifiado d |
| `Caracteres.esquerda(texto, quantidade)` | `String` | 13 | Obtém uma quantidade específica de caracteres iniciados da esquerda para direita. → Um novo texto com a quantidade de caracteres especificadas referen |
| `Caracteres.posicao(texto, expressao, posicaoInicio)` | `int` | 2 | Obtém a posição onde um caracter se encontra em um texto. → O índice onde o valor localizado se encontra. |
| `Caracteres.posicao(texto, expressao)` | `int` | 2 | Obtém a posição inicial onde um padrão/expressão regular se encontra em um texto. → O índice onde o valor localizado se encontra. |
| `Caracteres.capitaliza(texto)` | `String` | **0** | Por meio desta função é possível colocar a primeira letra de cada palavra de um texto em maiúsculo e as outras letras para minúsculo. → Um texto com a |
| `Caracteres.equivalente(texto, expressao)` | `boolean` | **0** | Verifica se uma expressão está contida em um texto. → Verdadeiro se a expressão for localizada e falso caso não. |
| `Caracteres.maiusculo(texto)` | `String` | **0** | Converte todos os caracteres de um texto em maiúsculo. → Um texto com todas as letras maiúsculas. |
| `Caracteres.minusculo(texto)` | `String` | **0** | Converte todos os caracteres de um texto em minúsculo. → Um texto com todas as letras minúsculas. |
| `Caracteres.expressao(texto, expressao)` | `Expressao` | **0** | Cria uma nova expressão regular para ser utilizada com um texto → Expressão regular. |
| `Caracteres.removeEspacos(texto)` | `String` | **0** | Remover o excesso de espaços de um texto. → Um texto com o excesso de espaços removidos. |
| `Caracteres.removeEspacosDireita(texto)` | `String` | **0** | Remove o excesso de espaços de um texto a esquerda. → Um texto com o excesso de espaços à esquerda removidos. |
| `Caracteres.removeEspacosEsquerda(texto)` | `String` | **0** | Remove o excesso de espaços de um texto a direita. → Um texto com o excesso de espaços à direita eliminados. |
| `Caracteres.repetir(texto, repeticao)` | `String` | **0** | Repete um texto especificado de acordo com uma quantidade definida. → Um novo texto com o valor do parâmetro texto repetido de acordo com o valor do p |
| `Caracteres.sobrepor(texto, posicaoInicial, quantidadeSobrepor, textoSobrepor)` | `String` | **0** | Sobrepõe um texto em outro em uma determinada posição e com uma quantidade específica de caracteres. → Um novo texto com o valor especificado sobrepos |
| `Caracteres.subTexto(texto, inicio, tamanho)` | `String` | **0** | Obtém um número específico de caracteres de uma posição específica de um texto. → Um intervalo de caracteres de acordo com a posição inicial e quantid |
| `Caracteres.vazio(valor)` | `boolean` | **0** | Verifica se uma palavra está vazia. → Verdadeiro se a palavra estiver vazia e falso caso não. |
| `Caracteres.dividir(texto, expressao)` | `Iterable` | **0** | Esta função divide um texto de acordo com a expressão regular informada → Lista com os valores divididos. |
| `Caracteres.dividir(texto, expressao)` | `Iterable` | **0** | Esta função divide um texto de acordo com a expressão regular informada → Lista com os valores divididos. |

### `Datas`

*Classe utilitária para operações que utilizam datas.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Datas.hoje` | `Date` | 731 | Obtém a data e hora do sistema operacional. → A data e hora corrente do sistema operacional. |
| `Datas.adicionaDias(data, quantidadeDias)` | `Date` | 270 | Adiciona uma quantidade especificada de dias à uma data. → Uma nova data referente aos dias especificados. |
| `Datas.formatar(data, formato)` | `String` | 225 | Obtem o valor de uma data formatada de acordo com um padrão especificado. → Texto contendo a data no formato especificado |
| `Datas.data(ano, mes, dia)` | `Date` | 211 | Gera uma data sem hora de acordo com os parâmetros informados. Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1). Para parâmetr |
| `Datas.ano(data)` | `Integer` | 196 | Obtém o ano em que se encontra uma determinada data. → Um número referente ao ano da data especificada. |
| `Datas.diferencaMeses(menorData, maiorData)` | `long` | 130 | Calcula a diferença em meses entre duas datas. → Um número referente a diferença entre meses. |
| `Datas.minuto(data)` | `Integer` | 57 | Obtém os minutos referentes a uma determinada data/hora. → Um valor inteiro de 00 a 59 referente ao minuto. |
| `Datas.mes(data)` | `Integer` | 54 | Obtém o mês em que se encontra uma determinada data. → Um número referente ao mês da data especificada. |
| `Datas.hora(data)` | `Integer` | 45 | Obtém a hora em que se encontra uma determinada data/hora. → Um valor inteiro de 00 a 23 referente à hora. |
| `Datas.dia(data)` | `Integer` | 20 | Obtém o dia em que se encontra uma determinada data. → Um número referente ao dia da data especificada. |
| `Datas.adicionaMeses(data, quantidadeMeses)` | `Date` | 16 | Adiciona uma quantidade especificada de meses em uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/10/201 |
| `Datas.diferencaDias(menorData, maiorData)` | `long` | 10 | Calcula a diferença em dias entre duas datas. → Um número referente a diferença entre dias. |
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
| `Datas.nomeDiaSemana(data)` | `String` | **0** | Obtém o nome do dia da semana. → O nome do dia da semana correspondente a data informada (Segunda, Terça..., Domingo). |
| `Datas.nomeMes(data)` | `String` | **0** | Obtém o nome do mês de uma data. → O nome do mês correspondente a data informada (Janeiro, Fevereiro..., Março). |
| `Datas.periodo(dataInicial, dataFinal)` | `Periodo` | **0** | Cria um período a partir da data inicial e data final. → Um periodo a partir da data inicial e data final . |
| `Datas.removeDias(data, quantidadeDias)` | `Date` | **0** | Remove uma quantidade especificada de dias de uma data. → Uma nova data considerando os dias que foram subtraídos da data especificada. |
| `Datas.removeMeses(data, quantidadeMeses)` | `Date` | **0** | Remove uma quantidade especificada de meses de uma data. Caso o dia da data especificada não seja um dia válido para o mês resultante, Ex: 31/12/2011, |
| `Datas.segundo(data)` | `Integer` | **0** | Obtém os segundos referentes a uma determinada data/hora. → Um valor inteiro de 00 a 59 referente ao segundo. |

### `UtilitariosReceitasDiversas`

*Classe de funções utilitárias*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `UtilitariosReceitasDiversas.receitasDiversasContribuinte(contribuinte.codigo, ano, possuiLancamento)` | `List` | 4 | Retorna a lista de receitas diversas do contribuinte do ano do cálculo e que possuem ou não, lançamentos vinculados, conforme parâmetro informado → Li |
| `UtilitariosReceitasDiversas.receitasDiversasContribuinte(contribuinte.codigo, ano)` | `List` | 4 | Retorna a lista de receitas diversas do contribuinte do ano do cálculo e que possuem ou não, lançamentos vinculados → Lista de ReceitasDiversas |
| `UtilitariosReceitasDiversas.buscaImovel(Código)` | `ImoveisScript` | **0** | Função que busca o imóvel pelo código |

### `Agrupamentos`

*Classe de funções para consultar agrupamentos*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Agrupamentos.buscaCamposAdicionaisDoAgrupamento(agrupamento)` | `List` | **0** | Função que retorna os campos adicionais de um agrupamento |
| `Agrupamentos.buscaAgrupamento(referente, nomeAgrupamento)` | `AgrupamentosScript` | **0** | Função que retorna o agrupamento de um campo adicional |
| `Agrupamentos.buscaAgrupamentoParcelamento(referente, nomeAgrupamento)` | `AgrupamentosScript` | **0** | Função que retorna o agrupamento de um campo adicional |

### `Numeros`

*Classe utilitária para operações que utilizam números.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Numeros.arredonda(valor, casasDecimais)` | `Number` | 1523 | Arredonda um valor. → Um novo valor arredondado considerando as casas decimais especificadas. |
| `Numeros.trunca(valor, casasDecimais)` | `Number` | 23 | Trunca um valor de acordo com o número de casas decimais especificadas. → Um novo valor truncado. |
| `Numeros.resto(valorDividendo, valorDivisor)` | `Number` | 14 | Retorna o resto da divisão realizada entre o dividendo e o divisor, que são passados por parâmetro. → O resto de uma divisão. |
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
| `Numeros.seno(valor)` | `Number` | **0** | Calcula o seno de um ângulo. |
| `Numeros.seZero(valor1, valor2, valorN)` | `Number` | **0** | Testa os valores passados como parâmetro e retorna o primeiro diferente de zero. Todos os valores informados devem ser do mesmo tipo. → O primeiro val |
| `Numeros.tangente(valor)` | `Number` | **0** | Calcula a tangente de um ângulo. |
| `Numeros.teto(valor)` | `Number` | **0** | Obtém o menor número que é maior ou igual ao número espedificado, sendo este número inteiro. → O menor número inteiro que é maior ou igual ao número e |

### `Utilitarios`

*Classe de funções gerais para criação de scripts*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Utilitarios.emitirErro(mensagem)` | `Boolean` | 977 | Função que emite erros no cálculo |
| `Utilitarios.buscaValorDoIndexadorPorSiglaNumaDataEspecifica(Sigla, Data)` | `BigDecimal` | 500 | Função que retorna o valor do indexador em uma data específica |
| `Utilitarios.proximoDiaUtil(Data)` | `Date` | 166 | Função que busca o próximo dia útil |
| `Utilitarios.ehFeriado(Data)` | `Integer` | 105 | Função que se a data é um feriado → 0 - Não é feriado 1 - É feriado 2 - Domingo 3 - Sabado |
| `Utilitarios.buscaBeneficioFiscal(Descrição)` | `BeneficiosFiscaisScript` | 52 | Função que busca o benefício fiscal pela descrição |
| `Utilitarios.buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo(Sigla, Data inicial, Data final)` | `List` | 22 | Função que retorna as movimentações do indexador em um período → Lista de movimentações do indexador |
| `Utilitarios.valorGeradoLancadoPorCreditoTributarioParaReferente(Código do crédito tributário, Código do referente, Lista de abreviaturas das receitas, Ano, Considerar lançamentos complementares)` | `BigDecimal` | **0** | Buscar o valor gerado/lançado por receita do crédito tributário em questão, possibilitando informar o referente, o ano do lançamento, a receita do lan |
| `Utilitarios.existeLancamento(referente, Data)` | `ExisteLancamentoScript` | **0** | Função que verifica se o referente ou o contribuinte possui lançamentos → Objeto contendo a indicação de existência dos lançamentos |
| `Utilitarios.ehMoedaCorrente(Sigla)` | `boolean` | **0** | Função que retorna se o indexador é uma moeda corrente no país → true / false |
| `Utilitarios.buscaIndexadorPorNomeESigla(Nome, Sigla)` | `IndexadoresScript` | **0** | Utilitarios. buscaIndexadorPorNomeESigla(Nome, Sigla) Parâmetros: Nome - Nome Sigla - Sigla Retorno: Indexador |

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
