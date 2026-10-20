# Contexto da fórmula — tipo `ITBI`

> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de
> `_CONHECIMENTO/_bruto/formula-catalogo/ITBI.json`, capturado do editor do
> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.
>
> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — 28 fórmulas do tipo `ITBI_TRANSFERENCIA_CREDITOS`.
> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**
>
> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver
> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.

**10 variáveis de contexto · 8 classes utilitárias**

---

## Variáveis de contexto

O que o motor injeta. Não declarar.

### Valores simples

| Variável | O que é |
|---|---|
| `pagadoresDoItbi` | Obtém informações do(s) contribuinte(s) responsável(eis) pelo pagamento do ITBI *(0 usos)* |
| `dataDaTransferencia` | Obtém a data da transferência de imóveis *(0 usos)* |
| `plantasDeValores` | Retorna a lista de planta de valores relacionadas ao imóvel. *(0 usos)* |
| `anoTransferencia` | Retornar o ano da transferência |
| `usuario` | Obtém o usuário logado *(0 usos)* |
| `dataDeVencimento` | Obtém a data de vencimento que será gerada para o ITBI *(0 usos)* |
| `formaDeCobranca` | Obtém a forma de cobrança do ITBI (Sem cobrança, Transferência, Imóvel ou Venda) *(0 usos)* |

### `imovel`

*Retorna as informações do imóveis*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `imovel.testadas` | `List` | **0** | Testadas do imovel → Lista de testadas do imovel |
| `imovel.nroTestadas` | `Integer` | **0** | Número de testadas do imovel |
| `imovel.maiorTestada` | `ImoveisTestadasScript` | **0** | Maior testada do imovel |
| `imovel.dataConstrucao` | `Date` | **0** | Data de construção do imóvel → Retorna a data de construção informada no cadastro do imóvel. Se não tiver data de construção o retorno será a data 1/1 |
| `imovel.localidade` | `LocalidadesScript` | **0** | Código da localidade onde o imóvel esta localizado |
| `imovel.face` | `FacesScript` | **0** | Face onde o imóvel esta localizado frente ao logradouro |
| `imovel.secao` | `SecoesScript` | **0** | Código da seção onde esta localizado o imóvel no logradouro |
| `imovel.denominacao` | `String` | **0** | Denominação do imóvel RURAL |
| `imovel.latitude` | `BigDecimal` | **0** | Latitude do imóvel |
| `imovel.longitude` | `BigDecimal` | **0** | Longitude do imóvel |
| `imovel.matricula` | `String` | **0** | Matricula do imóvel |
| `imovel.nroImovel` | `String` | **0** | Número do endereço do imóvel |
| `imovel.inscricaoAnterior` | `String` | **0** | Inscrição anterior do imóvel |
| `imovel.setor` | `String` | **0** | Setor onde esta localizado o imóvel → Setor do onde esta localizado o imóvel |
| `imovel.agrupamento` | `AgrupamentosScript` | **0** | Código do agrupamento |
| `imovel.apartamento` | `String` | **0** | Número do apartamento |
| `imovel.bairro` | `BairroScript` | **0** | Bairro onde esta localizado o imóvel |
| `imovel.bloco` | `String` | **0** | Bloco onde esta localizado o imóvel |
| `imovel.cep` | `String` | **0** | CEP do imóvel |
| `imovel.complemento` | `String` | **0** | Complemento do endereço do imóvel |
| `imovel.condominio` | `CondominioScript` | **0** | Condominio o qual o imóvel pertence |
| `imovel.logradouro` | `LogradouroScript` | **0** | Código do logradouro onde esta localizado o imóvel |
| `imovel.loteamento` | `LoteamentoScript` | **0** | Código do loteamento onde o imóvel esta localizado |
| `imovel.lote` | `String` | **0** | Lote onde esta localizado o imóvel dentro da quadra |
| `imovel.quadra` | `String` | **0** | Quadra onde esta localizado o imóvel |
| `imovel.inscricaoImobiliaria` | `InscricaoImobiliariaScript` | **0** | Inscrição imobiliária do imóvel → Buscar informação adicional do imóvel |
| `imovel.inscricaoIncra` | `String` | **0** | Inscrição do INCRA - quando imóvel RURAL |
| `imovel.contribuinte` | `PessoasScript` | **0** | Contribuinte proprietário do imóvel |
| `imovel.codigo` | `Long` | **0** | Código de identificação do imóvel |
| `imovel.unidade` | `Long` | **0** | Unidade do imóvel |
| `imovel.situacao` | `String` | **0** | Situação atual do imóvel - ATIVADO ou DESATIVADO |
| `imovel.tipoImovel` | `String` | **0** | Tipo do imóvel - RURAL OU URBANO |

### `transfImoveisItens`

*Retorna as informações do item da transferência.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `transfImoveisItens.dtArrematacao` | `Date` | 127 | Data da arrematação → Retorna a data da arrematação do imóvel quando for leilão |
| `transfImoveisItens.arrematante` | `PessoasScript` | 20 | Arrematante → Retorna os dados do arrematante no caso de uma transferência por leilão |
| `transfImoveisItens.motivos` | `MotivosScript` | 3 | Motivo → Retorna o motivo da transferência do imóvel |
| `transfImoveisItens.processos` | `List` | **0** | Processos → Retorna a lista de processos informados para a transferência. |
| `transfImoveisItens.dadosVenda` | `List` | **0** | Dados da venda → Retorna os detalhes da venda do imóvel. |
| `transfImoveisItens.pagador` | `PessoasScript` | **0** | Pagador → Retorna as informações do pagador da transferência |
| `transfImoveisItens.definicaoPagador` | `DefinicaoPagador` | **0** | Definição do pagamento da transferência → Retorna quem será o pagador da transferência: COMPRADOR, VENDEDOR |
| `transfImoveisItens.anexos` | `List` | **0** | Documentos anexos a transferência → Retorna a lista de documentos anexos a transferência |
| `transfImoveisItens.cartorios` | `CartoriosScript` | **0** | Cartório → Retorna as informações do cartório onde o imóvel esta registrado |
| `transfImoveisItens.vlArrematacao` | `BigDecimal` | **0** | Valor da arrematação → Retorna o valor da arrematação |
| `transfImoveisItens.obsArrematacao` | `String` | **0** | Observação sobre a arrematação → Retorna o texto informado na observação da arrematação |
| `transfImoveisItens.vlAreaConstruidaUnidade` | `BigDecimal` | **0** | Valor da área construída da unidade → Retorna o valor da área construída da unidade |
| `transfImoveisItens.vlAreaTotalTerrenoUnidade` | `BigDecimal` | **0** | Valor da área total do terreno da unidade → Retorna o valor total do terreno da unidade |
| `transfImoveisItens.vlVenalBenfeitoriasUnidade` | `BigDecimal` | **0** | Valor das benfeitorias → Retorna o valor das benfeitorias |
| `transfImoveisItens.vlVenalConstruidoUnidade` | `BigDecimal` | **0** | Valor venal construido da unidade → Retorna o valor venal construído da unidade |
| `transfImoveisItens.vlVenalTerritorialUnidade` | `BigDecimal` | **0** | Valor venal territorial da unidade → Retorna o valor venal territorial da unidade |
| `transfImoveisItens.vlVenalUnidade` | `BigDecimal` | **0** | Valor venal da unidade → Retorna o valor venal da unidade |
| `transfImoveisItens.denominacao` | `String` | **0** | Denominação → Retorna a denominação do imóvel quando ele for rural |
| `transfImoveisItens.imoveis` | `ImoveisScript` | **0** | Imóvel → Retorna os dados do imóvel que está sendo transferido |
| `transfImoveisItens.localidades` | `LocalidadesScript` | **0** | Localidade → Retorna os dados da localidade quando o imóvel rural |
| `transfImoveisItens.inscricaoIncra` | `String` | **0** | Inscrição do INCRA → Retorna a inscrição do INCRA informada para o imóvel quando ele for rural |
| `transfImoveisItens.unidadeFutura` | `SimNao` | **0** | Unidade futura → Retorna a unidade que está sendo transferida será construída da já é concreta |
| `transfImoveisItens.financiado` | `SimNao` | **0** | Financiado → Retorna a indicação da transferência ser ou não financiada |
| `transfImoveisItens.tipoVenda` | `TipoVenda` | **0** | Tipo da venda → Retorna o tipo da venda do imóvel - PARCIAL ou TOTAL |
| `transfImoveisItens.outros` | `SimNao` | **0** | Outros → Retorna a indicação se a transferência possui outros valores a indicar como base de cálculo da transferência |
| `transfImoveisItens.benfeitorias` | `SimNao` | **0** | Imóvel com benfeitorias → Retorna se o imóveis possui benfeitorias: SIM, NAO |
| `transfImoveisItens.id` | `Long` | **0** | Código do item → Retorna o código do item da transferência |

### `transferenciaImoveis`

*Retorna as informações da transferência.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `transferenciaImoveis.transfImoveisItens` | `List` | **0** | Dados dos imóveis na transferência → Retorna a lista dos imóveis na transferência |
| `transferenciaImoveis.dtCadastro` | `Date` | **0** | Data do cadastro da transferência → Retorna a data em a transferência foi cadastrada. |
| `transferenciaImoveis.pagador` | `PessoasScript` | **0** | Dados do pagador → Retorna os dados do pagador informado na transferência. |
| `transferenciaImoveis.tipoCobranca` | `TipoCobrancaTransfImoveis` | **0** | Tipo de cobrança → Retorna o tipo de cobrança informado para a transferência IMOVEL, SEM_COBRANCA, TRANSFERENCIA, VENDA |
| `transferenciaImoveis.dtTransferencia` | `Date` | **0** | Data da transferência → Retorna a data em que ocorreu a transferência do imóvel. |
| `transferenciaImoveis.dtVencimento` | `Date` | **0** | Data da vencimento → Retorna a data de vencimento da guia informada no momento do cadastro. |
| `transferenciaImoveis.idTransfImoveis` | `Long` | **0** | Código reduzido da transferência → Retorna o código reduzido da transferência. |
| `transferenciaImoveis.situacao` | `SituacaoTransfImoveis` | **0** | Situação da transferência → Retorna a situação atual da transferência. Podendo ser: ABERTA, CALCULADA, CANCELADA, ENCERRADA, PENDENTE |
| `transferenciaImoveis.tipoImovel` | `TipoImovelTransf` | **0** | Tipo de imoveis da transferência → Retorna o tipo de imóveis que devem conter na transferência: AMBOS, RURAL, URBANO |
| `transferenciaImoveis.id` | `Long` | **0** | Código da transferência → Retorna o código reduzido da transferência. |

---

## Classes utilitárias

### `CamposAdicionais`

*Funções de campos adicionais*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `CamposAdicionais.lotePossuiCampoAdicionalInformado(imovel, nomeCampoAdicional, valorOpção, anoOuDataBase)` | `boolean` | **0** | Função que retorna se a opção do campo adicional existe no lote examinado → true/false |
| `CamposAdicionais.preencherCampoAdicionalAgrupamento(referente, nomeCampoAdicional, valor, anoOuDataBase, agrupamento)` | `boolean` | **0** | Função que preenche um campo adicional do referente com o valor especificado → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase, agrupamento)` | `boolean` | **0** | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.valorOpcao(referente, nomeCampoAdicional, valorOpcao, anoOuDataBase)` | `boolean` | **0** | Função que retorna se opção do campo adicional está selecionada → true / false |
| `CamposAdicionais.preencherCampoAdicional(referente, nomeCampoAdicional, valor, anoOuDataBase)` | `boolean` | **0** | Função que preenche um campo adicional do referente com o valor especificado → true / false |
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase)` | `Object` | **0** | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional, anoOuDataBase, agrupamento)` | `Object` | **0** | Função que retorna o valor de um campo adicional do referente → Valor do campo adicional |
| `CamposAdicionais.valor(referente, nomeCampoAdicional)` | `Object` | **0** | Função que retorna o valor de um campo adicional do referente gerado nesse calculo → Valor do campo adicional |

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
| `Datas.data(ano, mes, dia)` | `Date` | 82 | Gera uma data sem hora de acordo com os parâmetros informados. Os números não deverão iniciar com zero, exemplo: Datas.data(2007, 9, 1). Para parâmetr |
| `Datas.ano(data)` | `Integer` | 40 | Obtém o ano em que se encontra uma determinada data. → Um número referente ao ano da data especificada. |
| `Datas.dia(data)` | `Integer` | 38 | Obtém o dia em que se encontra uma determinada data. → Um número referente ao dia da data especificada. |
| `Datas.mes(data)` | `Integer` | 38 | Obtém o mês em que se encontra uma determinada data. → Um número referente ao mês da data especificada. |
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

### `Agrupamentos`

*Classe de funções para consultar agrupamentos*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Agrupamentos.buscaCamposAdicionaisDoAgrupamento(agrupamento)` | `List` | **0** | Função que retorna os campos adicionais de um agrupamento |
| `Agrupamentos.buscaAgrupamento(referente, nomeAgrupamento)` | `AgrupamentosScript` | **0** | Função que retorna o agrupamento de um campo adicional |
| `Agrupamentos.buscaAgrupamentoParcelamento(referente, nomeAgrupamento)` | `AgrupamentosScript` | **0** | Função que retorna o agrupamento de um campo adicional |

### `dadosContribuinte`

*Retornar os dados de um contribuinte.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `dadosContribuinte.buscarPorCodigo(Long)` | `PessoasScript` | **0** | Retorna as informações do contribuinte com base no seu código |

### `Numeros`

*Classe utilitária para operações que utilizam números.*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Numeros.absoluto(valor)` | `Number` | **0** | Calcula o valor absoluto de um número. → O valor absoluto. |
| `Numeros.arredonda(valor, casasDecimais)` | `Number` | **0** | Arredonda um valor. → Um novo valor arredondado considerando as casas decimais especificadas. |
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

### `Creditos`

*Funções de transferência de créditos*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Creditos.transferirDebitosComVencimentoAPartirDe(data)` | `boolean` | 60 | Essa função transfere os débitos do imóvel com vencimento a partir da data informada para o novo proprietário. |
| `Creditos.transferirDividas` | `boolean` | 36 | Essa função transfere as dívidas do imóvel para o novo proprietário. |
| `Creditos.transferirDividasComVencimentoAPartirDe(data)` | `boolean` | 30 | Essa função transfere as dívidas do imóvel com vencimento a partir da data informada para o novo proprietário. |

### `Utilitarios`

*Funções utilitárias*

| Método | Retorna | Corpus | O que é |
|---|---|---:|---|
| `Utilitarios.imovelEhEnglobado(imovel.codigo)` | `boolean` | **0** | Função que verifica a se o imóvel é englobado → true / false |
| `Utilitarios.existemDebitosPorSituacao(imovel.codigo, situacao)` | `Boolean` | **0** | Função que verifica a existência de débitos para um determinado imóvel → true / false |
| `Utilitarios.existemDividasPorSituacao(imovel.codigo, situacao)` | `Boolean` | **0** | Função que verifica a existência de dívidas ativas para um determinado imóvel → true / false |
| `Utilitarios.existeParcelamentoPorSituacao(imovel.codigo, situacao)` | `Boolean` | **0** | Função que verifica a existência de parcelas de parcelamento para um determinado imóvel → true / false |
| `Utilitarios.existemDebitosVencidos(imovel.codigo, situacao, dataBase)` | `Boolean` | **0** | Função que verifica a existência de débitos vencidos para um determinado imóvel → true / false |
| `Utilitarios.existemDividasVencidas(imovel.codigo, situacao, dataBase)` | `Boolean` | **0** | Função que verifica a existência de dívidas ativas vencidas para um determinado imóvel → true / false |
| `Utilitarios.existeParcelamentoVencido(imovel.codigo, situacao, dataBase)` | `Boolean` | **0** | Função que verifica a existência de parcelamentos com parcelas vencidas onde o imóvel esteja incluso na composição desse parcelamento → true / false |
| `Utilitarios.buscaSecao(logradouro, secao, face, ano)` | `SecoesScript` | **0** | Função que retorna as informações da seção com base no código do logradouro, código da seção e ano |
| `Utilitarios.buscaPlantaDeValoresDoImovel(ano, imovel.codigo)` | `PlantasValoresScript` | **0** | Função que retorna as informações da planta de valores com base no código do imóvel e ano |
| `Utilitarios.buscaSecaoDoImovel(imovel, ano)` | `SecoesScript` | **0** | Função que retorna as informações da seção com base no imóvel |
| `Utilitarios.buscaValorDoIndexadorPorSiglaNumaDataEspecifica(Sigla, Data)` | `BigDecimal` | **0** | Função que retorna o valor do indexador em uma data específica |
| `Utilitarios.buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo(Sigla, Data inicial, Data final)` | `List` | **0** | Função que retorna as movimentações do indexador em um período → Lista de movimentações do indexador |
| `Utilitarios.buscaIndexadorPorNomeESigla(Nome, Sigla)` | `IndexadoresScript` | **0** | Função que retorna o indexador |
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
