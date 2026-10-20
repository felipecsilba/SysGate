# Dicionário de Funções — BFC-Script

Catálogo extraído automaticamente de todo o conteúdo em `Formulas/` e `Scripts/` desta base (7.428 arquivos). Cada função lista quantas vezes aparece e um exemplo real tirado de um arquivo existente. **Não é documentação oficial da Betha** — é o que está efetivamente em uso nesta base de municípios, então cobre só o que já foi usado, não a API inteira.

> ⚠️ **Este dicionário subestima o que existe — comprovado em 21/08/2026.**
> O catálogo do próprio editor de fórmulas mostra recursos com **zero uso** em
> toda a base: 13 dos 32 métodos de `imovel` (`matricula`, `latitude`, `cep`,
> `agrupamento`, `inscricaoIncra`…), e `Utilitarios.imovelEhEnglobado`, que não
> aparece em nenhum dos 7.428 arquivos.
>
> Para saber **o que se pode usar** (e não só o que já foi usado), ver
> `Dicionario de Formulas/` — capturado do sistema, por tipo de fórmula.

## Índice

- [Datas](#datas) — 30 métodos, 20388 ocorrências
- [CamposAdicionais](#camposadicionais) — 5 métodos, 16082 ocorrências
- [Numeros](#numeros) — 15 métodos, 13427 ocorrências
- [Caracteres](#caracteres) — 15 métodos, 13285 ocorrências
- [Utilitarios](#utilitarios) — 20 métodos, 9996 ocorrências
- [UtilitariosImoveis](#utilitariosimoveis) — 11 métodos, 1166 ocorrências
- [tabelasCalculos](#tabelascalculos) — 4 métodos, 2124 ocorrências
- [Creditos](#creditos) — 3 métodos, 126 ocorrências
- [Mensagens](#mensagens) — 4 métodos, 327 ocorrências
- [Resultado](#resultado) — 7 métodos, 1483 ocorrências
- [Arquivo](#arquivo) — 2 métodos, 2156 ocorrências
- [Scripts](#scripts) — 1 métodos, 338 ocorrências
- [Cache](#cache) — 4 métodos, 770 ocorrências
- [Notificacao](#notificacao) — 3 métodos, 2303 ocorrências
- [Http](#http) — 2 métodos, 2476 ocorrências
- [JSON](#json) — 2 métodos, 1408 ocorrências
- [String](#string) — 2 métodos, 710 ocorrências
- [Esquema](#esquema) — 2 métodos, 8948 ocorrências

## Datas

### `Datas.formatar(...)`
- Ocorrências na base: 5633
- Exemplo real (`Formulas\Parcelamentos\Otacílio Costa - DESCONTO_PARCELAMENTO_DIVIDAS - LEI REFIS  Nº 3.244_2025 - 2026.txt`):
  ```
  Vcto1_formatado = Datas.formatar(primeiroVcto,"yyyy-MM-dd");
  ```

### `Datas.hoje(...)`
- Ocorrências na base: 5375
- Exemplo real (`Formulas\ISS - Economicos\Campo Belo do Sul - GERACAO_CREDITO_ECONOMICOS - TLL - TAXA DE LICENÇA DE LOCALIZAÇÃO - 2021.txt`):
  ```
  quant_anos= Datas.ano(Datas.hoje()) - Datas.ano(data_inicio)
  ```

### `Datas.data(...)`
- Ocorrências na base: 3189
- Exemplo real (`Formulas\Divida Ativa\Divinópolis - FORMULA_ACRESCIMO_DIVIDA_ATIVA - 27491 - 1900.txt`):
  ```
  data_fim = Datas.data(Datas.ano(dataAtualjuros) - 1, 12, 1);
  ```

### `Datas.ano(...)`
- Ocorrências na base: 1775
- Exemplo real (`Formulas\Divida Ativa\Divinópolis - FORMULA_ACRESCIMO_DIVIDA_ATIVA - 27491 - 1900.txt`):
  ```
  data_fim = Datas.data(Datas.ano(dataAtualjuros) - 1, 12, 1);
  ```

### `Datas.diferencaDias(...)`
- Ocorrências na base: 1086
- Exemplo real (`Formulas\Debitos Gerais\Divinópolis - FORMULA_ACRESCIMO_DEBITO - 27471 - 1900.txt`):
  ```
  diferencaDias  = Datas.diferencaDias(dataVcto, dataBaseAux);
  ```

### `Datas.mes(...)`
- Ocorrências na base: 924
- Exemplo real (`Formulas\ISS - Economicos\Andradas - GERACAO_CREDITO_ECONOMICOS - TX. LICENÇA DE FUNCIONAMENTO - 2025.txt`):
  ```
  mesInicio = Datas.mes(dataInicio) // Retorna valor de 1 a 12
  ```

### `Datas.diferencaMeses(...)`
- Ocorrências na base: 565
- Exemplo real (`Formulas\Debitos Gerais\Paulo Lopes - FORMULA_ACRESCIMO_DEBITO - 51611 - 1900.txt`):
  ```
  diferencaMeses = Datas.diferencaMeses(v_data_vcto, dataBase)
  ```

### `Datas.adicionaDias(...)`
- Ocorrências na base: 499
- Exemplo real (`Scripts\Fontes Dinamicas\Braço do Norte - [PMN] Fonte Certidão Negativa de Imóvel.txt`):
  ```
  dataValidadeCertidao = Datas.adicionaDias(Datas.hoje(), 180)
  ```

### `Datas.dataHora(...)`
- Ocorrências na base: 474
- Exemplo real (`Scripts\Componentes\Lagoa Santa - PIX-CAIXA-CRIACAO-ALTERAÇÃO-CONSULTA.txt`):
  ```
  if (!isoStr) return Datas.dataHora(1900,1,1,0,0)
  ```

### `Datas.dia(...)`
- Ocorrências na base: 387
- Exemplo real (`Scripts\Fontes Dinamicas\Florianópolis - Alvara - condicionado temporário.txt`):
  ```
  diaprazoAcessib = Integer.toString(Datas.dia(prazoAcessib));
  ```

### `Datas.adicionaHoras(...)`
- Ocorrências na base: 101
- Exemplo real (`Scripts\Fontes Dinamicas\Atibaia - [FONTE] Movimento dos Convênios - Kelvy.txt`):
  ```
  dataCredito: Datas.adicionaHoras(itemPagamentos.dataCredito,1),
  ```

### `Datas.diferencaSegundos(...)`
- Ocorrências na base: 74
- Exemplo real (`Scripts\Fontes Dinamicas\Divinópolis - [PMD] Fonte Guia Unificada V3 -  Imunidade.txt`):
  ```
  expiraEm = Datas.diferencaSegundos(Datas.hoje(), vence);
  ```

### `Datas.minuto(...)`
- Ocorrências na base: 60
- Exemplo real (`Formulas\Receitas Diversas\Campo Belo do Sul - GERACAO_CREDITO_RECEITAS_DIVERSAS - PROGRAMA PORTEIRA ADENTRO - 2021.txt`):
  ```
  w_valor  = (((Datas.hora(tratorEsteira)+(Datas.minuto(tratorEsteira)/60.00))))
  ```

### `Datas.hora(...)`
- Ocorrências na base: 49
- Exemplo real (`Formulas\Receitas Diversas\Campo Belo do Sul - GERACAO_CREDITO_RECEITAS_DIVERSAS - PROGRAMA PORTEIRA ADENTRO - 2021.txt`):
  ```
  w_valor  = (((Datas.hora(tratorEsteira)+(Datas.minuto(tratorEsteira)/60.00))))
  ```

### `Datas.adicionaMeses(...)`
- Ocorrências na base: 43
- Exemplo real (`Scripts\Fontes Dinamicas\Jaraguá do Sul - [PMJS] Certidão Negativa Imóvel.txt`):
  ```
  dataValidadeTrinta: 			Datas.adicionaMeses(Datas.hoje(), 1),
  ```

### `Datas.removeDias(...)`
- Ocorrências na base: 39
- Exemplo real (`Scripts\Scripts\Bom Jesus - [PMBJ] Invalida Numero de Baixa.txt`):
  ```
  dtValidade: Datas.removeDias(Datas.hoje(),01).format('yyyy-MM-dd')
  ```

### `Datas.diferencaAnos(...)`
- Ocorrências na base: 24
- Exemplo real (`Formulas\Parcelamentos\Atibaia - FORMULA_ACRESCIMO_PARCELAMENTO - 38991 - 1900.txt`):
  ```
  v_nroAnos = Datas.diferencaAnos(dataParcelamento, dataBase);
  ```

### `Datas.diferencaHoras(...)`
- Ocorrências na base: 20
- Exemplo real (`Scripts\Fontes Dinamicas\Itaúna - [PMITA] Fonte Guia de Parcelamento PIX.txt`):
  ```
  diferencaHoras = Datas.diferencaHoras(dataAtual, dataPix) ;
  ```

### `Datas.removeMeses(...)`
- Ocorrências na base: 14
- Exemplo real (`Formulas\Debitos Gerais\Criciúma - FORMULA_ACRESCIMO_DEBITO - 28311 - 1900.txt`):
  ```
  datacor = Datas.removeMeses(dataVencimento, 1)
  ```

### `Datas.dataHoraAtual(...)`
- Ocorrências na base: 11
- Exemplo real (`Scripts\Scripts\Lagoa Santa - Relação de Parcelamento - csv - Eduardo.txt`):
  ```
  dataHoraExtracao = Datas.dataHoraAtual('dd/MM/yyyy HH:mm:ss')
  ```

### `Datas.diaSemana(...)`
- Ocorrências na base: 10
- Exemplo real (`Scripts\Componentes\Campos Novos - [Tributos] Verifica Data (Find_Feriado).txt`):
  ```
  diaSemana = Datas.diaSemana(dataFeriado)
  ```

### `Datas.extenso(...)`
- Ocorrências na base: 9
- Exemplo real (`Scripts\Fontes Dinamicas\Balneário Rincão - [PMBR] Fonte - HABITE-SE.txt`):
  ```
  data_emissao: Datas.extenso(habitese.dtEmissao),
  ```

### `Datas.nomeMes(...)`
- Ocorrências na base: 8
- Exemplo real (`Scripts\Fontes Dinamicas\Balneário Rincão - em desenvolvimento - Resumo Mensal dos Parcelamentos.txt`):
  ```
  data = (Datas.nomeMes(itemParcelas.parcelamento.dhParcelamento))
  ```

### `Datas.adicionaSegundos(...)`
- Ocorrências na base: 5
- Exemplo real (`Scripts\Componentes\Florianópolis - Cobrança Registrada PIX - Caixa Econômica Federal - Baixa Boleto.txt`):
  ```
  validadeAccessToken = Datas.adicionaSegundos(Datas.hoje(),expiresIn);
  ```

### `Datas.ehData(...)`
- Ocorrências na base: 4
- Exemplo real (`Scripts\Fontes Dinamicas\São João Batista - [FRSSC-160690] FonteDívidas.txt`):
  ```
  se(Datas.ehData(Datas.ano(Datas.hoje()) - 5 +'-'+ Datas.mes(Datas.hoje()) +'-31')){
  ```

### `Datas.nomeDiaSemana(...)`
- Ocorrências na base: 4
- Exemplo real (`Scripts\Scripts\Campo Alegre - Baixa cobrança Registrada WebService.txt`):
  ```
  verDia = Datas.nomeDiaSemana(Datas.hoje())
  ```

### `Datas.segundo(...)`
- Ocorrências na base: 3
- Exemplo real (`Scripts\Componentes\Divinópolis - [Tributos] Utilitarios.txt`):
  ```
  se (Datas.segundo(dhCampo) < 10) { campohr += '0'+ Datas.segundo(dhCampo); } senao {campohr += Datas.segundo(dhCampo) }
  ```

### `Datas.criar(...)`
- Ocorrências na base: 1
- Exemplo real (`Scripts\Fontes Dinamicas\Andradas - [ANDRADAS] Fonte relatório arrecadação dívida no ano.txt`):
  ```
  dataInicio = Datas.criar(parametros.anoExercicio.valor.toInteger(), 01, 01);
  ```

### `Datas.diferencaMinutos(...)`
- Ocorrências na base: 1
- Exemplo real (`Scripts\Scripts\Joaçaba - [Betha]Automação CW.txt`):
  ```
  se (Datas.diferencaMinutos(dataIni, datafim) > 640){
  ```

### `Datas.converterTexto(...)`
- Ocorrências na base: 1
- Exemplo real (`Scripts\Scripts\Lagoa Santa - Relação de Parcelamento - csv - Eduardo.txt`):
  ```
  return Datas.converterTexto(comp.dataVencimento, 'dd/MM/yyyy')
  ```


## CamposAdicionais

### `CamposAdicionais.valor(...)`
- Ocorrências na base: 9262
- Exemplo real (`Formulas\Imoveis - IPTU\Ilhota - GERACAO_CREDITO_IMOVEIS - Imposto Predial e Territorial - 1900.txt`):
  ```
  coleta = CamposAdicionais.valor(imovel, 'Coleta Lixo', ano);
  ```

### `CamposAdicionais.preencherCampoAdicional(...)`
- Ocorrências na base: 4049
- Exemplo real (`Formulas\Imoveis - IPTU\Fazenda Rio Grande - GERACAO_CREDITO_IMOVEIS - IPTU - 2017.txt`):
  ```
  CamposAdicionais.preencherCampoAdicional(imovel, "VALOR B", nulo, ano)
  ```

### `CamposAdicionais.valorOpcao(...)`
- Ocorrências na base: 2669
- Exemplo real (`Formulas\Imoveis - IPTU\Joaçaba - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2013.txt`):
  ```
  se(CamposAdicionais.valorOpcao(imovel, "Tipo", 'Casa', ano)){
  ```

### `CamposAdicionais.preencherCampoAdicionalAgrupamento(...)`
- Ocorrências na base: 88
- Exemplo real (`Formulas\Imoveis - IPTU\Atibaia - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2026.txt`):
  ```
  CamposAdicionais.preencherCampoAdicionalAgrupamento(imovel, 'LANCTOS-TIPO DE ISENÇÃO', '', ano, AgrupLancamento)?:'';
  ```

### `CamposAdicionais.lotePossuiCampoAdicionalInformado(...)`
- Ocorrências na base: 14
- Exemplo real (`Formulas\Imoveis - IPTU\Joaçaba - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2099.txt`):
  ```
  verifica_ocupa = CamposAdicionais.lotePossuiCampoAdicionalInformado(imovel, "Ocupacao Do Lote", 'Construído', ano);
  ```


## Numeros

### `Numeros.arredonda(...)`
- Ocorrências na base: 8133
- Exemplo real (`Formulas\Imoveis - IPTU\Divinópolis - GERACAO_CREDITO_IMOVEIS - TAXA DE FORNECIMENTO DE ÁGUA (RURAL) - 2026.txt`):
  ```
  lancamento.criarReceita("TLAR", Numeros.arredonda(valor,2));
  ```

### `Numeros.numero(...)`
- Ocorrências na base: 2759
- Exemplo real (`Formulas\Convenios Bancarios\Balneário Rincão - CONVENIO_BANCARIO - SICOOB - 2026.txt`):
  ```
  fat = Numeros.numero(Caracteres.subTexto(fator, indice, 1));
  ```

### `Numeros.inteiro(...)`
- Ocorrências na base: 1037
- Exemplo real (`Scripts\Fontes Dinamicas\Campo Belo do Sul - Cancelamento de Boleto SICREDI PIX.txt`):
  ```
  numeroConfig  	= Numeros.inteiro(itemRegistros?.campo7?:'0')
  ```

### `Numeros.trunca(...)`
- Ocorrências na base: 606
- Exemplo real (`Formulas\Divida Ativa\Jaraguá do Sul - FORMULA_ACRESCIMO_DIVIDA_ATIVA - 28131 - 1900.txt`):
  ```
  valorJuros = valorReceita * Numeros.trunca(w_percentual,2) ;
  ```

### `Numeros.resto(...)`
- Ocorrências na base: 462
- Exemplo real (`Formulas\Convenios Bancarios\Criciúma - CONVENIO_BANCARIO - BB Registro - 2026.txt`):
  ```
  dv_cb = 11 - (Numeros.resto(Numeros.numero(somatorio_cb),11))
  ```

### `Numeros.ehNumero(...)`
- Ocorrências na base: 151
- Exemplo real (`Scripts\Scripts\Lagoa Santa - Script para atualização de informações de cadastro.txt`):
  ```
  if (tipoDado.tipoValor == "LONG" && !Numeros.ehNumero(dado)) {
  ```

### `Numeros.absoluto(...)`
- Ocorrências na base: 96
- Exemplo real (`Scripts\Scripts\Bom Jesus - [BJ] Integração Contábil (Arrecadação_Estorno).txt`):
  ```
  valorDifJuro = Numeros.absoluto(receita.valorDiferencaJuros);
  ```

### `Numeros.raiz(...)`
- Ocorrências na base: 92
- Exemplo real (`Formulas\Imoveis - IPTU\Atibaia - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2018.txt`):
  ```
  v_ftrProfund = Numeros.arredonda(Numeros.raiz(v_ftrProfund),4);
  ```

### `Numeros.decimal(...)`
- Ocorrências na base: 36
- Exemplo real (`Scripts\Fontes Dinamicas\Campo Alegre - [AlvaraDeObras] Alvarás de Obras.txt`):
  ```
  areaConstruida: 					Numeros.decimal(valorAreaConstruida.toString())?:0,
  ```

### `Numeros.randomico(...)`
- Ocorrências na base: 23
- Exemplo real (`Scripts\Scripts\Braço do Norte - [CAINA] Script para segregação de receitas (BTHSC-86774).txt`):
  ```
  "idIntegracao": "idLancamento_" + Numeros.randomico(99999),
  ```

### `Numeros.maximo(...)`
- Ocorrências na base: 18
- Exemplo real (`Formulas\Imoveis - IPTU\Criciúma - GERACAO_CREDITO_IMOVEIS - ILUMINAÇÃO PUBLICA - 2024.txt`):
  ```
  w_testadaCosip  = Numeros.maximo(Numeros.maximo(w_frente, w_fundo),w_testadaPrincipal)
  ```

### `Numeros.teto(...)`
- Ocorrências na base: 6
- Exemplo real (`Scripts\Scripts\Bituruna - [PMB] Integração com Transparência Fly - Maiores Arrecadações.txt`):
  ```
  nroPaginas = Numeros.teto(quantidade / tamanhoPagina) - 1;
  ```

### `Numeros.piso(...)`
- Ocorrências na base: 5
- Exemplo real (`Formulas\Parcelamentos\Varginha - GERACAO_CREDITO_PARCELAMENTOS - Valor dos Honorários - 2024.txt`):
  ```
  se(Numeros.piso(valorTotalDeHonorarios / 75) > qtdParcelas){
  ```

### `Numeros.novo(...)`
- Ocorrências na base: 2
- Exemplo real (`Scripts\Fontes Dinamicas\Divinópolis - Fonte Imagem de Calculo IPTU - Exercicio.txt`):
  ```
  valorNumerico = Numeros.novo(valorHistorico.toString().replace(',', '.'))
  ```

### `Numeros.seZero(...)`
- Ocorrências na base: 1
- Exemplo real (`Formulas\Imoveis - IPTU\Jaraguá do Sul - GERACAO_CREDITO_IMOVEIS - TAXA MEDIDA COMPENSAÇÃO MITIGATÓRIA - 2026.txt`):
  ```
  w_vea = Numeros.seZero(UtilitariosImoveis.buscaPlantaDeValoresAno(imovel.logradouro,imovel.secao, imovel.face).vlMetroQuadrado,0,0)?:0;
  ```


## Caracteres

### `Caracteres.repetir(...)`
- Ocorrências na base: 6542
- Exemplo real (`Scripts\Fontes Dinamicas\Florianópolis - CARNE GRAFICA IPTU SOCIAL.txt`):
  ```
  Caracteres.repetir('0', tamanho - numero.tamanho()) + numero
  ```

### `Caracteres.substituir(...)`
- Ocorrências na base: 1561
- Exemplo real (`Scripts\Fontes Dinamicas\Divinópolis - AUTO DE INFRAÇÃO _ NOTIFICAÇÃO - Obras.txt`):
  ```
  textoObsFisc = Caracteres.substituir(textoObsFisc,"\n","<br>")
  ```

### `Caracteres.subTexto(...)`
- Ocorrências na base: 1142
- Exemplo real (`Formulas\Convenios Bancarios\Balneário Rincão - CONVENIO_BANCARIO - SICOOB - 2026.txt`):
  ```
  fat = Numeros.numero(Caracteres.subTexto(fator, indice, 1));
  ```

### `Caracteres.maiusculo(...)`
- Ocorrências na base: 845
- Exemplo real (`Scripts\Fontes Dinamicas\Campo Belo do Sul - Cancelamento de Boleto SICREDI PIX.txt`):
  ```
  boletoPix		= Caracteres.maiusculo(itemRegistros?.campo6?:"")
  ```

### `Caracteres.esquerda(...)`
- Ocorrências na base: 796
- Exemplo real (`Formulas\Convenios Bancarios\Painel - CONVENIO_BANCARIO - Sicredi - 2026.txt`):
  ```
  campo1 = banco + moeda + Caracteres.esquerda(campoLivre, 5);
  ```

### `Caracteres.vazio(...)`
- Ocorrências na base: 724
- Exemplo real (`Scripts\Scripts\Campo Alegre - [Tributos] Envio Portal do Gestor [MATEUS].txt`):
  ```
  se (idsDebitos != nulo && !Caracteres.vazio(idsDebitos)) {
  ```

### `Caracteres.tamanho(...)`
- Ocorrências na base: 720
- Exemplo real (`Formulas\ISS - Economicos\Criciúma - GERACAO_CREDITO_ECONOMICOS - I.S.S. (Fixo - Auton.) - 2025.txt`):
  ```
  se(Caracteres.tamanho(economico.contribuinte.cpfCnpj) > 11){
  ```

### `Caracteres.removeEspacos(...)`
- Ocorrências na base: 442
- Exemplo real (`Scripts\Scripts\Andradas - 01 [PADRÃO] Valida FEBRABAN.txt`):
  ```
  NrConv = Caracteres.removeEspacos(lalinha.subTexto(2, 20));
  ```

### `Caracteres.direita(...)`
- Ocorrências na base: 423
- Exemplo real (`Scripts\Scripts\Varginha - Baixa de Pagamentos _ PIX - SANTANDER.txt`):
  ```
  if (Caracteres.direita(item.buscaCodigoBarras, 12) == "0") {
  ```

### `Caracteres.posicao(...)`
- Ocorrências na base: 59
- Exemplo real (`Formulas\ISS - Economicos\Divinópolis - GERACAO_CREDITO_ECONOMICOS - IMPOSTO SOBRE SERVIÇOS AUTÔNOMOS - 2024.txt`):
  ```
  cotaBasica = Caracteres.posicao("$profissaoEco", "BASICA",0)
  ```

### `Caracteres.equivalente(...)`
- Ocorrências na base: 15
- Exemplo real (`Formulas\ISS - Economicos\São João Batista - GERACAO_CREDITO_ECONOMICOS - TAXA LOCALIZAÇÃO E FUNCIONAMENTO (300) - 2022.txt`):
  ```
  existe = Caracteres.equivalente(texto, filtro)
  ```

### `Caracteres.expressao(...)`
- Ocorrências na base: 6
- Exemplo real (`Scripts\Scripts\Lagoa Santa - Atualização de informações de cadastro econômico.txt`):
  ```
  seguePadrao = Caracteres.expressao(valor, ~/^\d{2}\/\d{2}\/\d{4}$/).equivalente();
  ```

### `Caracteres.removeEspacosEsquerda(...)`
- Ocorrências na base: 4
- Exemplo real (`Scripts\Fontes Dinamicas\Varginha - Busca PIX Recebidos.txt`):
  ```
  nroBaixaEncontrado = Caracteres.removeEspacosEsquerda(itemEnvio.numeroBaixa.toString())
  ```

### `Caracteres.capitaliza(...)`
- Ocorrências na base: 3
- Exemplo real (`Scripts\Fontes Dinamicas\Nova Veneza - Fonte - Declaração de Imóvel.txt`):
  ```
  mesAtual = Caracteres.capitaliza(Datas.hoje().format('MMMM'))
  ```

### `Caracteres.dividir(...)`
- Ocorrências na base: 3
- Exemplo real (`Scripts\Scripts\São João Batista - _ Cobrança Registrada (Caixa, BB e Sicredi).txt`):
  ```
  imovel = Caracteres.dividir(imovel,'/')
  ```


## Utilitarios

### `Utilitarios.emitirErro(...)`
- Ocorrências na base: 5375
- Exemplo real (`Formulas\Imoveis - IPTU\Campos Novos - GERACAO_CREDITO_IMOVEIS - IMP. PRED. E TER. URBANO - 2025.txt`):
  ```
  Utilitarios.emitirErro('IPTU não calculado. Imóvel RURAL.');
  ```

### `Utilitarios.buscaBeneficioFiscal(...)`
- Ocorrências na base: 1345
- Exemplo real (`Formulas\Imoveis - IPTU\Balneário Rincão - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2018.txt`):
  ```
  isencao = Utilitarios.buscaBeneficioFiscal('LEI DE ISENÇÃO')
  ```

### `Utilitarios.buscaValorDoIndexadorPorSiglaNumaDataEspecifica(...)`
- Ocorrências na base: 1117
- Exemplo real (`Formulas\ISS - Economicos\Monte Carlo - GERACAO_CREDITO_ECONOMICOS - TAXA DE ALVARA SANITARIO - 2026.txt`):
  ```
  ufm = Utilitarios.buscaValorDoIndexadorPorSiglaNumaDataEspecifica("UFM", dataBase);
  ```

### `Utilitarios.completarAEsquerda(...)`
- Ocorrências na base: 375
- Exemplo real (`Formulas\Convenios Bancarios\Andradas - CONVENIO_BANCARIO - FEBRABAN CNAB 240 - 2026.txt`):
  ```
  w_parcela = Utilitarios.completarAEsquerda(nroDaparcela,'0',3);
  ```

### `Utilitarios.buscaValorIndexadorPorSiglaEData(...)`
- Ocorrências na base: 331
- Exemplo real (`Formulas\Debitos Gerais\Major Vieira - FORMULA_ACRESCIMO_DEBITO - 34611 - 2024.txt`):
  ```
  v_idx_vcto = Utilitarios.buscaValorIndexadorPorSiglaEData('UFM', v_data);
  ```

### `Utilitarios.proximoDiaUtil(...)`
- Ocorrências na base: 289
- Exemplo real (`Formulas\Parcelamentos\Bom Jesus - FORMULA_ACRESCIMO_PARCELAMENTO - 45591 - 1900.txt`):
  ```
  dataVencimento = Utilitarios.proximoDiaUtil(dataVencimento);
  ```

### `Utilitarios.buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo(...)`
- Ocorrências na base: 273
- Exemplo real (`Formulas\Debitos Gerais\Joaçaba - FORMULA_ACRESCIMO_DEBITO - 4789 - 1900.txt`):
  ```
  INPCA = Utilitarios.buscaMovimentacoesDoIndexadorPorSiglaEmUmPeriodo('INPCA', dataVcto, dataBase);
  ```

### `Utilitarios.ehFeriado(...)`
- Ocorrências na base: 234
- Exemplo real (`Formulas\Receitas Diversas\Joaçaba - GERACAO_CREDITO_RECEITAS_DIVERSAS - I.S.S.Q.N Contribuintes sem _ sede - 2026.txt`):
  ```
  percorrer(enquanto: {Utilitarios.ehFeriado(data_vcto) != 0}){
  ```

### `Utilitarios.somatorioModulo10(...)`
- Ocorrências na base: 226
- Exemplo real (`Formulas\Convenios Bancarios\Braço do Norte - CONVENIO_BANCARIO - CEF Registrado - 2026.txt`):
  ```
  somatorio_cp1   = Utilitarios.somatorioModulo10(campo1);
  ```

### `Utilitarios.valorGeradoLancadoPorCreditoTributarioParaReferente(...)`
- Ocorrências na base: 140
- Exemplo real (`Formulas\Imoveis - IPTU\Lagoa Santa - GERACAO_CREDITO_IMOVEIS - Imposto Predial e Territorial - 2024.txt`):
  ```
  cos23    = Utilitarios.valorGeradoLancadoPorCreditoTributarioParaReferente(209183, imovel.codigo, ['TXIL'], 2023, nulo)
  ```

### `Utilitarios.somatorioModulo11(...)`
- Ocorrências na base: 103
- Exemplo real (`Formulas\Convenios Bancarios\Painel - CONVENIO_BANCARIO - Sicredi - 2026.txt`):
  ```
  campoLivreDV = Utilitarios.somatorioModulo11(campoLivre, 9);
  ```

### `Utilitarios.existeLancamento(...)`
- Ocorrências na base: 66
- Exemplo real (`Formulas\Imoveis - IPTU\Braço do Norte - GERACAO_CREDITO_IMOVEIS - Imposto Predial eTerritorial Urbano - 2019.txt`):
  ```
  dev = Utilitarios.existeLancamento(imovel, dataLancamento)
  ```

### `Utilitarios.somenteNumeros(...)`
- Ocorrências na base: 60
- Exemplo real (`Formulas\Convenios Bancarios\Andradas - CONVENIO_BANCARIO - FEBRABAN CNAB 240 - 2026.txt`):
  ```
  Valor = Utilitarios.completarAEsquerda(Utilitarios.somenteNumeros(valorDoDocumento), '0', 11);
  ```

### `Utilitarios.fatorVencimento(...)`
- Ocorrências na base: 47
- Exemplo real (`Formulas\Convenios Bancarios\Major Vieira - CONVENIO_BANCARIO - Registrado - 2026.txt`):
  ```
  fator_venc	 = Utilitarios.fatorVencimento(dataDeVencimento);
  ```

### `Utilitarios.completarADireita(...)`
- Ocorrências na base: 6
- Exemplo real (`Formulas\Convenios Bancarios\São José do Cerrito - CONVENIO_BANCARIO - Convenio Teste 2 - 2026.txt`):
  ```
  carteira = Caracteres.esquerda(Utilitarios.completarADireita( '17' , '0', 2),2)
  ```

### `Utilitarios.montaReferente(...)`
- Ocorrências na base: 3
- Exemplo real (`Formulas\Debitos Gerais\Atibaia - FORMULA_ACRESCIMO_DEBITO - 38951 - 1900.txt`):
  ```
  referenteContrib 	= Utilitarios.montaReferente(contribuinte.id, "CONTRIBUINTES")
  ```

### `Utilitarios.EmitirErro(...)`
- Ocorrências na base: 3
- Exemplo real (`Formulas\ISS - Economicos\Varginha - GERACAO_CREDITO_ECONOMICOS - TAXA DE LICENÇA DE FUNCIONAMENTO - 2023.txt`):
  ```
  // Utilitarios.EmitirErro('metros'+metros)
  ```

### `Utilitarios.buscaAgrupamento(...)`
- Ocorrências na base: 1
- Exemplo real (`Formulas\Divida Ativa\Jaraguá do Sul - FORMULA_ACRESCIMO_DIVIDA_ATIVA - 28131 - 1900.txt`):
  ```
  //valor = CamposAdicionais.valor(referente, "valor", dataVencimento, Utilitarios.buscaAgrupamento(referente, "Cadastro de contribuintes"));
  ```

### `Utilitarios.buscaIndexadorPorNomeESigla(...)`
- Ocorrências na base: 1
- Exemplo real (`Formulas\Imoveis - IPTU\Campo Belo do Sul - GERACAO_CREDITO_IMOVEIS - IPTU - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2024.txt`):
  ```
  vlr_indx = Utilitarios.buscaIndexadorPorNomeESigla("% IPTU", "IPTU")
  ```

### `Utilitarios.buscaPlantaDeValoresDoImovel(...)`
- Ocorrências na base: 1
- Exemplo real (`Formulas\ITBI\Florianópolis - ITBI_VALOR_VENAL_TERRITORIAL - Valor venal territorial - 2026.txt`):
  ```
  vPlantaNov = Utilitarios.buscaPlantaDeValoresDoImovel(2014, imovel.codigo).vlMetroQuadrado
  ```


## UtilitariosImoveis

### `UtilitariosImoveis.ehEnglobado(...)`
- Ocorrências na base: 355
- Exemplo real (`Formulas\Imoveis - IPTU\Atibaia - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2018.txt`):
  ```
  se(UtilitariosImoveis.ehEnglobado(imovel.codigo) == false){
  ```

### `UtilitariosImoveis.buscaPlantaDeValores(...)`
- Ocorrências na base: 219
- Exemplo real (`Formulas\Imoveis - IPTU\Balneário Rincão - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2020.txt`):
  ```
  planta = UtilitariosImoveis.buscaPlantaDeValores(ano, imovel.logradouro, imovel.secao, 'A')
  ```

### `UtilitariosImoveis.englobados(...)`
- Ocorrências na base: 130
- Exemplo real (`Formulas\Imoveis - IPTU\Atibaia - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2030.txt`):
  ```
  englobados = UtilitariosImoveis.englobados(principal.codigo)
  ```

### `UtilitariosImoveis.buscaImovelPrincipalDoEnglobamento(...)`
- Ocorrências na base: 106
- Exemplo real (`Formulas\Imoveis - IPTU\Atibaia - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2030.txt`):
  ```
  principal = UtilitariosImoveis.buscaImovelPrincipalDoEnglobamento(imovel.codigo)
  ```

### `UtilitariosImoveis.buscaPlantaDeValoresDoImovel(...)`
- Ocorrências na base: 100
- Exemplo real (`Formulas\Imoveis - IPTU\Balneário Rincão - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2022.txt`):
  ```
  planta = UtilitariosImoveis.buscaPlantaDeValoresDoImovel(ano, imovel.codigo)
  ```

### `UtilitariosImoveis.buscaSecao(...)`
- Ocorrências na base: 71
- Exemplo real (`Formulas\Imoveis - IPTU\Joaçaba - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2013.txt`):
  ```
  w_vm2t = UtilitariosImoveis.buscaSecao(imovel.logradouro, imovel.secao.codigo, 'A', ano);
  ```

### `UtilitariosImoveis.imoveisDoMesmoLote(...)`
- Ocorrências na base: 56
- Exemplo real (`Formulas\Imoveis - IPTU\Joaçaba - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2018.txt`):
  ```
  imoveis = UtilitariosImoveis.imoveisDoMesmoLote(imovel.codigo, ano);
  ```

### `UtilitariosImoveis.testadasAtivasNoAno(...)`
- Ocorrências na base: 51
- Exemplo real (`Formulas\Imoveis - IPTU\Florianópolis - GERACAO_CREDITO_IMOVEIS - TAXA COLETA DE RESIDUOS SOLIDOS - 2018.txt`):
  ```
  testadas = UtilitariosImoveis.testadasAtivasNoAno(imovel.codigo, ano)
  ```

### `UtilitariosImoveis.buscaPlantaDeValoresAno(...)`
- Ocorrências na base: 32
- Exemplo real (`Formulas\Imoveis - IPTU\Balneário Rincão - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2018.txt`):
  ```
  planta = UtilitariosImoveis.buscaPlantaDeValoresAno(imovel.logradouro, imovel.secao, 'A');
  ```

### `UtilitariosImoveis.buscaSecaoDoImovel(...)`
- Ocorrências na base: 25
- Exemplo real (`Formulas\Imoveis - IPTU\Campo Alegre - GERACAO_CREDITO_IMOVEIS - Imposto Predial e Territorial Urbano - 2022.txt`):
  ```
  v_secao = UtilitariosImoveis.buscaSecaoDoImovel(imovel, ano).codigo;
  ```

### `UtilitariosImoveis.buscaPlantaDeValoresDoImovelAno(...)`
- Ocorrências na base: 21
- Exemplo real (`Formulas\Imoveis - IPTU\São José do Cerrito - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL TERRITORIAL URBANO - 2021.txt`):
  ```
  planta = UtilitariosImoveis.buscaPlantaDeValoresDoImovelAno(imovel.codigo)
  ```


## tabelasCalculos

### `tabelasCalculos.getValor(...)`
- Ocorrências na base: 2025
- Exemplo real (`Formulas\Imoveis - IPTU\Balneário Rincão - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2018.txt`):
  ```
  topografia = tabelasCalculos.getValor(ano, 8, imovel.codigo)
  ```

### `tabelasCalculos.valor(...)`
- Ocorrências na base: 75
- Exemplo real (`Formulas\Receitas Diversas\Florianópolis - GERACAO_CREDITO_RECEITAS_DIVERSAS - Feira em Espaço Público - 2026.txt`):
  ```
  valorTabelaFeira = tabelasCalculos.valor(66, receitaDiversa)
  ```

### `tabelasCalculos.dadosDaTabelaAplicado(...)`
- Ocorrências na base: 16
- Exemplo real (`Formulas\Imoveis - IPTU\Painel - GERACAO_CREDITO_IMOVEIS - IMPOSTO PREDIAL E TERRITORIAL URBANO - 2024.txt`):
  ```
  pgv_predial = tabelasCalculos.dadosDaTabelaAplicado(ano,61, imovel.codigo).valor?:0
  ```

### `tabelasCalculos.getValorAgrupamento(...)`
- Ocorrências na base: 8
- Exemplo real (`Formulas\ISS - Economicos\Florianópolis - GERACAO_CREDITO_ECONOMICOS - 01 (ISSQN) FIXO - PROPORCIONAL - 2026.txt`):
  ```
  issqn = tabelasCalculos.getValorAgrupamento(databasetabela, 29, economico.codigo, agrupamento);
  ```


## Creditos

### `Creditos.transferirDebitosComVencimentoAPartirDe(...)`
- Ocorrências na base: 60
- Exemplo real (`Formulas\ITBI\Criciúma - ITBI_TRANSFERENCIA_CREDITOS - Transferência de créditos - 2026.txt`):
  ```
  Creditos.transferirDebitosComVencimentoAPartirDe(Datas.data(1900,01,01));
  ```

### `Creditos.transferirDividas(...)`
- Ocorrências na base: 36
- Exemplo real (`Formulas\ITBI\Atibaia - ITBI_TRANSFERENCIA_CREDITOS - Transferência de créditos - 2026.txt`):
  ```
  Creditos.transferirDividas();
  ```

### `Creditos.transferirDividasComVencimentoAPartirDe(...)`
- Ocorrências na base: 30
- Exemplo real (`Formulas\ITBI\Atibaia - ITBI_TRANSFERENCIA_CREDITOS - Transferência de créditos - 2026.txt`):
  ```
  Creditos.transferirDividasComVencimentoAPartirDe(Datas.data(1900, 01, 01));
  ```


## Mensagens

### `Mensagens.erro(...)`
- Ocorrências na base: 285
- Exemplo real (`Scripts\Criticas\Braço do Norte - ECONOMICOS - {'identificador'_ 'CRIACAO', 'tipo'_ 'NATUREZA', 'compartilhado'_ False} - [PMBN] Validação Cadastral Econômico.txt`):
  ```
  Mensagens.erro('O Bairro do Endereço deve ser preenchido.');
  ```

### `Mensagens.aviso(...)`
- Ocorrências na base: 32
- Exemplo real (`Scripts\Criticas\Varginha - PARCELAMENTOS - {'identificador'_ 'CRIACAO', 'tipo'_ 'NATUREZA', 'compartilhado'_ False} - Parcelamento Lei 6889_2021.txt`):
  ```
  Mensagens.aviso('Contém na composição, divídas já parceladas !!!')
  ```

### `Mensagens.info(...)`
- Ocorrências na base: 9
- Exemplo real (`Scripts\Criticas\Divinópolis - IMOVEIS - {'identificador'_ 'ALTERACAO', 'tipo'_ 'NATUREZA', 'compartilhado'_ False} - Alteração de proprietários dos imóveis.txt`):
  ```
  Mensagens.info("Tem transferência do imóvel ID: " + idImo);
  ```

### `Mensagens.Info(...)`
- Ocorrências na base: 1
- Exemplo real (`Scripts\Criticas\Urubici - IMOVEIS - {'identificador'_ 'CRIACAO', 'tipo'_ 'NATUREZA', 'compartilhado'_ False} - [FLCRI] - OPÇÕES DE BCI.txt`):
  ```
  Mensagens.Info("Valor do BCI 'AREA TOTAL CONSTRUIDA': "+totalConst)
  ```


## Resultado

### `Resultado.arquivo(...)`
- Ocorrências na base: 1402
- Exemplo real (`Scripts\Scripts\Fazenda Rio Grande - Comparativo de valores venais.txt`):
  ```
  Resultado.arquivo(arquivo, 'comparativo_valores_venais.csv')
  ```

### `Resultado.nome(...)`
- Ocorrências na base: 67
- Exemplo real (`Scripts\Scripts\Atibaia - Busca CNAE Receita Federal(API Betha Sistemas).txt`):
  ```
  Resultado.nome('cnaeReceitaFederal'+montaNomeArquivo+'.zip')
  ```

### `Resultado.mensagem(...)`
- Ocorrências na base: 10
- Exemplo real (`Scripts\Scripts\Divinópolis - Logradouros - Breno.txt`):
  ```
  Resultado.mensagem("Nenhum logradouro encontrado na base de dados.");
  ```

### `Resultado.finalizar(...)`
- Ocorrências na base: 1
- Exemplo real (`Scripts\Scripts\Divinópolis - 16_09 s.txt`):
  ```
  Resultado.finalizar("Operação concluída com sucesso. Lote enviado: " + resposta.idLote)
  ```

### `Resultado.relatorio(...)`
- Ocorrências na base: 1
- Exemplo real (`Scripts\Scripts\Divinópolis - Analise Casos ITBI - BTHSC-201926.txt`):
  ```
  Resultado.relatorio(relatorioFinal.ordenar(["nomeContribuinte", "idLancamento"]))
  ```

### `Resultado.arquivos(...)`
- Ocorrências na base: 1
- Exemplo real (`Scripts\Scripts\Divinópolis - BTHSC-267326.txt`):
  ```
  Resultado.arquivos(arquivosResultado)
  ```

### `Resultado.imprimir(...)`
- Ocorrências na base: 1
- Exemplo real (`Scripts\Scripts\Divinópolis - Consulta Tabelas Calculo.txt`):
  ```
  Resultado.imprimir(resposta.json())
  ```


## Arquivo

### `Arquivo.novo(...)`
- Ocorrências na base: 1378
- Exemplo real (`Scripts\Scripts\Atibaia - Exporta responsáveis dos imóveis.txt`):
  ```
  arquivo = Arquivo.novo("imoveis_corresponsaveis.csv", 'csv')
  ```

### `Arquivo.ler(...)`
- Ocorrências na base: 778
- Exemplo real (`Scripts\Fontes Dinamicas\Varginha - [PMV] Certidão Averbação Construção Civil.txt`):
  ```
  arquivo = Arquivo.ler(arquivoCSV, 'csv', [delimitador: "|"])
  ```


## Scripts

### `Scripts.exportar(...)`
- Ocorrências na base: 338
- Exemplo real (`Scripts\Componentes\Florianópolis - COMP - TESTE - Certidão de isenção.txt`):
  ```
  Scripts.exportar(montaEsquemaInsencao: montaEsquemaInsencao)
  ```


## Cache

### `Cache.recuperar(...)`
- Ocorrências na base: 337
- Exemplo real (`Scripts\Fontes Dinamicas\Braço do Norte - Alterar Boleto CEF PIX.txt`):
  ```
  imprimir "Access Token: " + Cache.recuperar('token CEF', '')
  ```

### `Cache.adicionar(...)`
- Ocorrências na base: 243
- Exemplo real (`Scripts\Scripts\Jaraguá do Sul - Altera campo adicional devido a transferência de imóvel(ITBI)-Jaraguá.txt`):
  ```
  Cache.adicionar('dataTransferencia', dataAtual, 144.horas);
  ```

### `Cache.contem(...)`
- Ocorrências na base: 169
- Exemplo real (`Scripts\Componentes\Joaçaba - Cobrança Registrada PIX - Caixa Econômica Federal.txt`):
  ```
  if (Cache.contem('Token CEF ' + convenio.nroConvenio)) {
  ```

### `Cache.remover(...)`
- Ocorrências na base: 21
- Exemplo real (`Scripts\Scripts\Jaraguá do Sul - Altera campo adicional devido a transferência de imóvel(ITBI)-Jaraguá.txt`):
  ```
  Cache.remover('listatransferencia')
  ```


## Notificacao

### `Notificacao.nova(...)`
- Ocorrências na base: 2299
- Exemplo real (`Scripts\Fontes Dinamicas\Ilhota - [PMI] Fonte Grafica - IPTU - CORREIOS.txt`):
  ```
  Notificacao.nova('Rotina configurada somente para débitos!')
  ```

### `Notificacao.nome(...)`
- Ocorrências na base: 2
- Exemplo real (`Scripts\Fontes Dinamicas\Itaúna - [PMITA] Fonte Guia ITBI - PIX.txt`):
  ```
  Notificacao.nome("Guia destinadas apenas para Debitos.").para(usuario.id).enviar();
  ```

### `Notificacao.novo(...)`
- Ocorrências na base: 2
- Exemplo real (`Scripts\Scripts\Campo Alegre - Baixa cobrança Registrada WebService.txt`):
  ```
  Notificacao.novo("Erro nos dados informados. Retorno: " + retorno)
  ```


## Http

### `Http.servico(...)`
- Ocorrências na base: 2413
- Exemplo real (`Scripts\Scripts\Fazenda Rio Grande - [PMFRG] REMOVE BAIRROS.txt`):
  ```
  respostaGet = Http.servico(urlBase + "${servico}/${idLote}")
  ```

### `Http.close(...)`
- Ocorrências na base: 63
- Exemplo real (`Scripts\Componentes\Joaçaba - Cobrança Registrada V2 (BB).txt`):
  ```
  fechaRespostaQrcode = Http.close();
  ```


## JSON

### `JSON.escrever(...)`
- Ocorrências na base: 1226
- Exemplo real (`Scripts\Componentes\Atibaia - [MITRA] Processamento.txt`):
  ```
  println "bodyComentario -> " + JSON.escrever(bodyComentario)
  ```

### `JSON.ler(...)`
- Ocorrências na base: 182
- Exemplo real (`Scripts\Scripts\Monte Castelo - [eSfinge] Conferência do saldo final do lançamento (individual).txt`):
  ```
  dadosEnvioArrecadacao = JSON.ler(itemArrecadacao.dadosEnvio)
  ```


## String

### `String.valueOf(...)`
- Ocorrências na base: 459
- Exemplo real (`Scripts\Fontes Dinamicas\Florianópolis - [PMF] - Fonte Baixa de Inscrição - CPSQN.txt`):
  ```
  num = String.valueOf(num).toUpperCase().substituir(" ", "");
  ```

### `String.format(...)`
- Ocorrências na base: 251
- Exemplo real (`Scripts\Fontes Dinamicas\Divinópolis - DETALHAMENTO PARCELAMENTO.txt`):
  ```
  retornar "R " + String.format("%.2f", v).replace(".", ",");
  ```


## Esquema

### `Esquema.objeto(...)`
- Ocorrências na base: 6818
- Exemplo real (`Scripts\Fontes Dinamicas\Andradas - [CSM] Termo Abertura Livro da Dívida.txt`):
  ```
  referente     : Esquema.objeto([codigo : Esquema.caracter]),
  ```

### `Esquema.lista(...)`
- Ocorrências na base: 2130
- Exemplo real (`Scripts\Fontes Dinamicas\Andradas - [PMA] Fonte Carnê IPTU.txt`):
  ```
  listaAuxiliar = [lista: Esquema.lista(Esquema.objeto(fields))];
  ```

