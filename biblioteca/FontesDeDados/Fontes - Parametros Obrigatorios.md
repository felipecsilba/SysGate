# Fontes com PARÂMETRO OBRIGATÓRIO

**207 de 574 operações** exigem parâmetro obrigatório. Sem ele a
chamada falha — não é opcional, não tem default.

Parâmetro obrigatório é o que aparece como `{placeholder}` no path da API
(ex.: `/imoveis/{idImovel}/testadas`). No BFC-Script ele vai em
`parametros:`, **não** em `criterio:`.

```
// certo
fonteImoveis.buscaTestadas(parametros: ["idImovel": idImovel])

// errado - vai falhar, idImovel não é filtro
fonteImoveis.buscaTestadas(criterio: "idImovel = $idImovel")
```

> Gerado por `_construir_catalogo_v2.py`. Para ver as 4 dimensões de
> qualquer fonte: `python fonte.py ver <nome>`

---

## acrescimos

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `debitos` (String) | `/calculos-acrescimos/historico-debitos/{debitos}` |
| `busca` | `dividas` (String) | `/calculos-acrescimos/historico-dividas/{dividas}` |
| `busca` | `dividas` (String) | `/calculos-acrescimos/historico-dividas-detalhado/{dividas}` |
| `calcula` | `debitos` (String) | `/calculos-acrescimos/calcular-debitos/{debitos}` |
| `calcula` | `dividas` (String) | `/calculos-acrescimos/calcular-dividas/{dividas}` |
| `calcula` | `parcelamentos` (String) | `/calculos-acrescimos/calcular-parcelamentos/{parcelamentos}` |

## Alvaras

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `tipoAlvara` (String), `ano` (Integer), `nroDocumento` (Integer) | `/alvaras/{tipoAlvara}/{ano}/{nroDocumento}/atividades` |
| `busca` | `tipoAlvara` (String) | `/alvaras/{tipoAlvara}` |
| `busca` | `tipoAlvara` (String), `ano` (Integer), `nroDocumento` (Integer) | `/alvaras/{tipoAlvara}/{ano}/{nroDocumento}/servicos` |
| `busca` | `idObra` (Long) | `/alvaras/{idObra}/alvara` |

## baixaAutomatica

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idBaixaAutomatica` (String) | `/baixaAutomatica/{idBaixaAutomatica}/pagamentos` |

## certidaoDeBaixaDeAtividades

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `ano` (Long), `nroDocumento` (Long) | `/certidoes-baixa-atividade/{ano}/{nroDocumento}` |

## certidoes-itbi

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `ano` (Long), `nroDocumento` (Long) | `/certidoes-itbi/{ano}/{nroDocumento}` |
| `buscaDetalhesVendas` | `ano` (Long), `nroDocumento` (Long), `idVenda` (Long) | `/certidoes-itbi/{ano}/{nroDocumento}/{idVenda}/detalhes` |
| `buscaImoveis` | `ano` (Long), `nroDocumento` (Long) | `/certidoes-itbi/{ano}/{nroDocumento}/imoveis` |
| `buscaItens` | `ano` (Long), `nroDocumento` (Long) | `/certidoes-itbi/{ano}/{nroDocumento}/itens` |
| `buscaProcessos` | `ano` (Long), `nroDocumento` (Long), `idImovel` (Long) | `/certidoes-itbi/{ano}/{nroDocumento}/{idImovel}/processos` |
| `buscaProcessosImovelRural` | `ano` (Long), `nroDocumento` (Long) | `/certidoes-itbi/{ano}/{nroDocumento}/processosImovelRural` |
| `buscaVendas` | `ano` (Long), `nroDocumento` (Long), `idItem` (Long) | `/certidoes-itbi/{ano}/{nroDocumento}/item/{idItem}/vendas` |
| `buscaVendas` | `ano` (Long), `nroDocumento` (Long), `idImovel` (Long) | `/certidoes-itbi/{ano}/{nroDocumento}/{idImovel}/vendas` |

## condominios

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idCondominio` (Long) | `/condominios/{idCondominio}/imoveis` |

## contribuinte

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idContribuinte` (Long) | `/contribuintes/{idContribuinte}/campos-adicionais` |
| `busca` | `idContribuinte` (Long) | `/contribuintes/{idContribuinte}/emails` |
| `busca` | `idContribuinte` (Long) | `/contribuintes/{idContribuinte}/enderecos` |
| `busca` | `idContribuinte` (Long) | `/contribuintes/{idContribuinte}/socios` |
| `busca` | `idContribuinte` (Long) | `/contribuintes/{idContribuinte}/telefones` |
| `validarCpfCnpj` | `cpfcnpj` (String) | `/contribuintes/validar-cpf-cnpj/{cpfcnpj}` |

## convenios

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `gerar` | `identificador` (Long) | `/convenios/{identificador}/codigo-barras` |

## creditosTributarios

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idCredito` (Long) | `/creditos-tributarios/{idCredito}/receitas` |

## debitos

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idDebito` (long) | `/debitos/{idDebito}/detalhes` |
| `buscaDebitoReceitas` | `idDebito` (Long) | `/debitos/{idDebito}/receitas` |

## desmembramentos

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `buscaImoveis` | `idDesmembramento` (Long) | `/desmembramentos/{idDesmembramento}/imoveis` |

## dividas

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idDivida` (Long) | `/dividas/{idDivida}/receitas` |
| `soma` | `idCreditoTributario` (Long), `anoExercicio` (Integer) | `/dividas/totalizadores/{idCreditoTributario}/{anoExercicio}` |

## economicos

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idEconomico` (Long) | `/economicos/{idEconomico}/atividades` |
| `busca` | `idEconomico` (Long) | `/economicos/{idEconomico}/servicos` |
| `buscaCamposAdicionais` | `idEconomico` (Long) | `/economicos/{idEconomico}/campos-adicionais` |

## Emissão de guias

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `protocoloEmissao` (String) | `/emissao-guias/{protocoloEmissao}/simplificada` |
| `busca` | `protocoloEmissao` (String) | `/emissao-guias/{protocoloEmissao}` |
| `busca` | `protocoloEmissao` (String) | `/emissao-guias/{protocoloEmissao}/contribuintes` |
| `busca` | `protocoloEmissao` (String) | `/emissao-guias/{protocoloEmissao}/imoveis` |
| `busca` | `protocoloEmissao` (String) | `/emissao-guias/{protocoloEmissao}/imoveis-endereco` |
| `busca` | `protocoloEmissao` (String) | `/emissao-guias/{protocoloEmissao}/referentes` |
| `reemitir` | `idDebito` (Long) | `/emissao-guias/reemitir/{idDebito}` |

## encerramento-mensal

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `buscaPorAno` | `ano` (Integer) | `/encerramento-mensal/{ano}` |
| `buscaPorCompetencia` | `ano` (Integer), `mes` (String) | `/encerramento-mensal/{ano}/{mes}` |

## esfinge

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `altera` | `id` (Long) | `/esfinge/esfinge/{id}` |
| `busca` | `competencia` (String) | `/esfinge/arrecadacao-impostos/{competencia}` |
| `busca` | `competencia` (String) | `/esfinge/arrecadacao-taxas/{competencia}` |
| `busca` | `competencia` (String) | `/esfinge/arrecadacoes-validas/{competencia}` |
| `busca` | `ano` (Integer), `mes` (Integer) | `/esfinge/assunto3-debitos-nao-inscritos/{ano}/{mes}` |
| `busca` | `ano` (Integer), `mes` (Integer) | `/esfinge/assunto5-dividas-receitas/{ano}/{mes}` |
| `busca` | `ano` (Integer), `mes` (Integer) | `/esfinge/assunto9-debitos-revisao/{ano}/{mes}` |
| `busca` | `ano` (Integer), `mes` (Integer) | `/esfinge/assunto9-dividas-receitas-revisao/{ano}/{mes}` |
| `busca` | `ano` (Integer), `mes` (Integer) | `/esfinge/dados-base-validacao-revisao/{ano}/{mes}` |
| `busca` | `competencia` (String) | `/esfinge/debitos-nao-enviados/{competencia}` |
| `busca` | `competencia` (String) | `/esfinge/dividas-nao-enviadas/{competencia}` |
| `busca` | `competencia` (String) | `/esfinge/lancamentos-nao-enviados/{competencia}` |
| `busca` | `competencia` (String) | `/esfinge/lancamentos-sem-vinculo-prazo-prescricional/{competencia}` |
| `busca` | `competencia` (String) | `/esfinge/range-validacao-revisao/{competencia}` |
| `busca` | `ano` (Integer), `mes` (Integer) | `/esfinge/validacao-revisao/{ano}/{mes}` |
| `busca` | `ano` (Integer), `mes` (Integer) | `/esfinge/validacao-saldos-baixas/{ano}/{mes}` |
| `busca` | `ano` (Integer), `mes` (Integer) | `/esfinge/validacao-saldos-lancamentos/{ano}/{mes}` |
| `busca` | `ano` (Integer), `mes` (Integer) | `/esfinge/validacao-cons-saldo-negativo/{ano}/{mes}` |
| `busca` | `ano` (Integer), `mes` (Integer) | `/esfinge/validacao-data-registro-fora-competencia/{ano}/{mes}` |
| `excluir` | `id` (Long) | `/esfinge/esfinge-exclui/{id}` |

## esfingeControleFinalizacaoPacote

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `altera` | `id` (Long) | `/esfinge/finalizacao-pacote/{id}` |

## guiasUnificadas

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `buscaComposicao` | `idGuiaUnificada` (Long) | `/guias-unificadas/{idGuiaUnificada}/composicao` |
| `buscaUnica` | `idGuiaUnificada` (Long) | `/guias-unificadas/{idGuiaUnificada}` |

## Habitese

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `ano` (Integer), `nroDocumento` (Integer) | `/habitese/{ano}/{nroDocumento}` |
| `busca` | `idObra` (Long) | `/habitese/{idObra}` |

## imoveis

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `buscaBeneficioFiscal` | `idImovel` (Long) | `/imoveis/{idImovel}/beneficios` |
| `buscaCamposAdicionais` | `idImovel` (Long) | `/imoveis/{idImovel}/campos-adicionais` |
| `buscaCorresponsaveisPorImovel` | `idImovel` (Long) | `/imoveis/{idImovel}/corresponsaveis` |
| `buscaEnglobados` | `idImovel` (Long) | `/imoveis/{idImovel}/englobados` |
| `buscaImovelOrigem` | `idImovel` (Long) | `/imoveis/{idImovel}/origem` |
| `buscaProprietarios` | `idImovel` (Long) | `/imoveis/{idImovel}/proprietarios` |
| `buscaTestadas` | `idImovel` (Long) | `/imoveis/{idImovel}/testadas` |

## IncentivoFiscalTransparencia

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `id` (Long) | `/incentivo-fiscal-transparencia/{id}` |

## integracoesContabeis

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `cria` | `idIntegracaoContabil` (Long), `protocoloExecucao` (String) | `/integracoes-contabeis/{idIntegracaoContabil}/dados-integrados/{protocoloExecucao}` |
| `cria` | `idIntegracaoContabil` (Long) | `/integracoes-contabeis/{idIntegracaoContabil}/historico` |

## notas-avulsas

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idNota` (Long) | `/notas-avulsas/{idNota}` |
| `busca` | `idNota` (Long) | `/notas-avulsas/{idNota}/servicos` |
| `busca` | `idNota` (Long) | `/notas-avulsas/{idNota}/servicos` |

## notificacoes-debitos

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idDebito` (Long) | `/notificacoes-debitos/{idDebito}/atividades` |
| `busca` | `idDebito` (Long) | `/notificacoes-debitos/{idDebito}/receitas` |
| `busca` | `idDebito` (Long) | `/notificacoes-debitos/{idDebito}/servicos` |
| `busca` | `idsDebitos` (String) | `/notificacoes-debitos/{idsDebitos}` |
| `busca` | `subLote` (String) | `/notificacoes-debitos/lote/{subLote}` |

## notificacoes-dividas

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idDivida` (Long) | `/notificacoes-dividas/{idDivida}/atividades` |
| `busca` | `idDivida` (Long) | `/notificacoes-dividas/{idDivida}/receitas` |
| `busca` | `idDivida` (Long) | `/notificacoes-dividas/{idDivida}/servicos` |
| `busca` | `idsDividas` (String) | `/notificacoes-dividas/{idsDividas}` |
| `busca` | `subLote` (String) | `/notificacoes-dividas/lote/{subLote}` |

## Números de baixa

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `altera` | `nroBaixa` (Long) | `/numeros-baixas/{nroBaixa}` |

## obras

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idObra` (Long) | `/obras/{idObra}/campos-adicionais` |
| `busca` | `idObra` (Long) | `/obras/{idObra}/construtoras` |
| `busca` | `idObra` (BigInteger) | `/obras/{idObra}/movimentacoes` |
| `busca` | `idResponsavelTecnico` (Long) | `/obras/responsaveis-tecnicos/{idResponsavelTecnico}/atividades` |
| `busca` | `idObra` (Long) | `/obras/{idObra}/responsaveis-tecnicos` |

## pacoteEsfinge

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `chave` (String) | `/pacote-esfinge/{chave}` |
| `limpa` | `chave` (String) | `/pacote-esfinge/{chave}` |

## receitas-diversas

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idReceitaDiversa` (Long) | `/receitas-diversas/{idReceitaDiversa}/campos-adicionais` |
| `busca` | `idReceitaDiversaLancamento` (Long) | `/receitas-diversas/lancamentos/{idReceitaDiversaLancamento}/receitas` |
| `busca` | `idReceitaDiversa` (Long) | `/receitas-diversas/{idReceitaDiversa}/lancamentos` |
| `calcular` | `idReceitaDiversa` (Long) | `/receitas-diversas/{idReceitaDiversa}/calcular` |

## remembramentos

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `buscaImoveis` | `idRemembramento` (Long) | `/remembramentos/{idRemembramento}/imoveis` |

## Secoes

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idSecao` (Long) | `/secoes/{idSecao}/campos-adicionais` |

## SimAmArquivo

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `buscaInscricaoDividaAtivaPorDivida` | `idDivida` (Long) | `/sim-am-arquivo/inscricao-divida-ativa/dividas/{idDivida}` |
| `buscaLancamentoCreditoPorDebito` | `idDebido` (Long) | `/sim-am-arquivo/lancamento-credito/debitos/{idDebido}` |
| `registrar` | `id` (String) | `/sim-am-arquivo/{id}/registrar` |

## solicitacaoTransferencia

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `indefere` | `idTransferenciaImovel` (Long) | `/solicitacoes-transferencias/indeferir/{idTransferenciaImovel}` |

## solicitacaoTransferenciaImovel

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idRetificacao` (String) | `/solicitacoes-transferencias-imoveis/retificacao/{idRetificacao}` |
| `buscaPorSolicitacao` | `idSolicitacao` (Long) | `/solicitacoes-transferencias-imoveis/{idSolicitacao}/retificacoes` |

## tabelasAuxiliares

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `atualiza` | `codigoTabelaAuxiliar` (Long), `idRegistro` (Long) | `/tabelas-auxiliares/{codigoTabelaAuxiliar}/registros/{idRegistro}` |
| `busca` | `codigoTabelaAuxiliar` (Long), `idCampo` (Integer), `valorCampo` (Object) | `/tabelas-auxiliares/{codigoTabelaAuxiliar}/registros/{idCampo}/{valorCampo}` |
| `busca` | `codigoTabelaAuxiliar` (Long) | `/tabelas-auxiliares/{codigoTabelaAuxiliar}/registros` |
| `cria` | `codigoTabelaAuxiliar` (Long) | `/tabelas-auxiliares/{codigoTabelaAuxiliar}/registros` |
| `exclui` | `codigoTabelaAuxiliar` (Long), `idRegistro` (Long) | `/tabelas-auxiliares/{codigoTabelaAuxiliar}/registros/{idRegistro}` |

## termos-parcelamento

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `nroDocumento` (Integer) | `/termos-parcelamento/{nroDocumento}` |
| `buscaComposicao` | `nroParcelamento` (Long) | `/termos-parcelamento/{nroParcelamento}/composicao` |
| `buscaComposicaoAgrupada` | `nroParcelamento` (Long) | `/termos-parcelamento/{nroParcelamento}/composicaoAgrupada` |
| `buscaParcelas` | `nroParcelamento` (Long) | `/termos-parcelamento/{nroParcelamento}/parcelas` |

## termos-parcelamento-dividas

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `dividaId` (Long) | `/termos-parcelamento-dividas/{dividaId}` |

## transferenciaImovel

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `busca` | `idTransferenciaImoveis` (Long) | `/transferencias-imoveis/{idTransferenciaImoveis}/processos` |

## tribunalParana

| operação | parâmetros obrigatórios | path |
|---|---|---|
| `altera` | `id` (Long) | `/tribunal-parana/arrecadacoes-creditos/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/arrecadacoes-creditos-detalhados/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/atualizacoes-monetarias/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/atualizacoes-monetarias-detalhadas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/atualizacoes-monetarias-dividas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/atualizacoes-monetarias-dividas-detalhadas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/deducoes-creditos/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/deducoes-creditos-detalhados/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/deducoes-dividas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/deducoes-dividas-detalhadas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-arrecadacoes-creditos/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-arrecadacoes-creditos-detalhados/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-atualizacoes-monetarias/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-atualizacoes-monetarias-detalhadas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-atualizacoes-monetarias-dividas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-atualizacoes-monetarias-dividas-detalhadas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-deducoes-creditos/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-deducoes-creditos-detalhados/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-deducoes-dividas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-deducoes-dividas-detalhadas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-inscricoes-dividas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-inscricoes-dividas-detalhados/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-lancamentos-creditos/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/estornos-lancamentos-creditos-detalhados/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/inscricoes-dividas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/inscricoes-dividas-detalhadas/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/lancamentos-creditos/{id}` |
| `altera` | `id` (Long) | `/tribunal-parana/lancamentos-creditos-detalhados/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/arrecadacoes-creditos/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/arrecadacoes-creditos-detalhados/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/atualizacoes-monetarias/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/atualizacoes-monetarias-detalhadas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/atualizacoes-monetarias-dividas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/atualizacoes-monetarias-dividas-detalhadas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/deducoes-creditos/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/deducoes-creditos-detalhados/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/deducoes-dividas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/deducoes-dividas-detalhadas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-arrecadacoes-creditos/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-arrecadacoes-creditos-detalhados/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-atualizacoes-monetarias/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-atualizacoes-monetarias-detalhadas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-atualizacoes-monetarias-dividas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-atualizacoes-monetarias-dividas-detalhadas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-deducoes-creditos/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-deducoes-creditos-detalhados/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-deducoes-dividas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-deducoes-dividas-detalhadas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-inscricoes-dividas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-inscricoes-dividas-detalhados/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-lancamentos-creditos/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/estornos-lancamentos-creditos-detalhados/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/inscricoes-dividas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/inscricoes-dividas-detalhadas/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/lancamentos-creditos/{id}` |
| `excluir` | `id` (Long) | `/tribunal-parana/lancamentos-creditos-detalhados/{id}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/arrecadacoes-creditos/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/arrecadacoes-creditos-detalhados/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/atualizacoes-monetarias/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/atualizacoes-monetarias-detalhadas/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/atualizacoes-monetarias-dividas/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/atualizacoes-monetarias-dividas-detalhadas/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/deducoes-creditos/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/deducoes-creditos-detalhados/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/deducoes-dividas/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/deducoes-dividas-detalhadas/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/estornos-arrecadacoes-creditos/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/estornos-arrecadacoes-creditos-detalhados/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/estornos-atualizacoes-monetarias/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/estornos-atualizacoes-monetarias-detalhadas/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/estornos-atualizacoes-monetarias-dividas/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/estornos-atualizacoes-monetarias-dividas-detalhadas/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/estornos-deducoes-creditos/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/estornos-deducoes-creditos-detalhados/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/estornos-inscricoes-dividas/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/estornos-inscricoes-dividas-detalhados/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/estornos-lancamentos-creditos/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/estornos-lancamentos-creditos-detalhados/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/inscricoes-dividas/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/inscricoes-dividas-detalhadas/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/lancamentos-creditos/{ano}/{mes}` |
| `excluirAnoMes` | `ano` (Integer), `mes` (Integer) | `/tribunal-parana/lancamentos-creditos-detalhados/{ano}/{mes}` |

---

# Fontes que NÃO aceitam `criterio:`

**221 operações** não têm nenhum campo filtrável. Nessas, o
único jeito de restringir o resultado é pelos parâmetros da própria fonte.
Passar `criterio:` nelas não funciona.

| fonte | operação | parâmetros disponíveis |
|---|---|---|
| acrescimos | `calcula` | **debitos**, dataBase, salvarHistorico |
| acrescimos | `calcula` | **dividas**, dataBase, considerarAnistia, salvarHistorico |
| acrescimos | `calcula` | **parcelamentos**, dataBase |
| acrescimos | `calculaDividasValor` | dataBase, considerarAnistia, salvarHistorico |
| acrescimos | `calcular` | — |
| acrescimos | `calcularMultiplos` | — |
| Alvaras | `busca` | **tipoAlvara**, **ano**, **nroDocumento** |
| Alvaras | `busca` | **tipoAlvara**, **ano**, **nroDocumento** |
| certidaoDeBaixaDeAtividades | `busca` | **ano**, **nroDocumento** |
| certidoes-negativas | `busca` | nroDocumento, ano, tipoCertidao, protocoloEmissao |
| cobrancas-compartilhadas | `cria` | — |
| configIntegracoesContabeis | `busca` | — |
| configuracaoSolicitacaoTransferencia | `busca` | — |
| configuracaoSolicitacaoTransferencia | `busca` | — |
| ConfiguracaoTcems | `busca` | — |
| contribuinte | `validarCpfCnpj` | **cpfcnpj** |
| contribuintes | `preenche` | — |
| convenios | `gerar` | **identificador** |
| debitos | `busca` | **idDebito** |
| dividas | `soma` | **idCreditoTributario**, **anoExercicio** |
| Emissão de guias | `reemitir` | **idDebito**, idConvenio, dataVencimento |
| esfinge | `altera` | **id** |
| esfinge | `altera-lote` | — |
| esfinge | `busca` | **competencia**, unidadeGestora |
| esfinge | `busca` | **competencia**, unidadeGestora |
| esfinge | `busca` | **competencia**, unidadeGestora, con |
| esfinge | `busca` | — |
| esfinge | `busca` | — |
| esfinge | `busca` | — |
| esfinge | `busca` | dataCreditoInicial, dataCreditoFinal |
| esfinge | `busca` | — |
| esfinge | `busca` | — |
| esfinge | `busca` | — |
| esfinge | `busca` | dataInicialCancelamento, dataFinalCancelamento |
| esfinge | `busca` | dtInicialMovimentacao, dtFinalMovimentacao |
| esfinge | `busca` | dataInicialCredito, dataFinalCredito, pagamentos |
| esfinge | `busca` | dataInicialCredito, dataFinalCredito, pagamentos |
| esfinge | `busca` | — |
| esfinge | `busca` | — |
| esfinge | `busca` | dataInicialCredito, dataFinalCredito, pagamentos |
| esfinge | `busca` | dataInicialEstorno, dataFinalEstorno |
| esfinge | `busca` | dataInicialEstorno, dataFinalEstorno |
| esfinge | `busca` | dataInicialEstorno, dataFinalEstorno |
| esfinge | `busca` | — |
| esfinge | `busca` | — |
| esfinge | `busca` | dataInicialMovimentacoes, dataFinalMovimentacoes |
| esfinge | `busca` | — |
| esfinge | `busca` | — |
| esfinge | `busca` | dataInicialCredito, dataFinalCredito, pagamentos |
| esfinge | `busca` | dataInicialEstorno, dataFinalEstorno |
| esfinge | `busca` | — |
| esfinge | `busca` | **competencia** |
| esfinge | `busca` | **competencia** |
| esfinge | `busca` | **competencia** |
| esfinge | `busca` | **competencia**, primeira-pagina |
| esfinge | `busca` | **competencia**, quantidadeRegistros |
| esfinge | `busca` | dataInicial, dataFinal |
| esfinge | `busca` | competencia |
| esfinge | `busca` | **ano**, **mes** |
| esfinge | `busca` | **ano**, **mes** |
| esfinge | `busca` | **ano**, **mes**, idInicial, idFinal |
| esfinge | `busca` | competencia |
| esfinge | `busca` | competencia |
| esfinge | `busca` | **ano**, **mes** |
| esfinge | `cria` | — |
| esfinge | `cria-lista` | — |
| esfinge | `excluir` | **id** |
| esfinge | `excluir-lote` | nomeArquivo, idGrupo, idDado, tipoDado |
| esfingeControleFinalizacaoPacote | `altera` | **id** |
| esfingeControleFinalizacaoPacote | `cria` | — |
| esfingeProcesso | `busca` | id, protocoloExecucao, ano, mes, nroRequisicao |
| esfingeProcesso | `cria` | — |
| eventosSimples | `cria` | — |
| imoveis | `altera` | — |
| imoveis | `busca` | idsImoveis, dataHoraInicial, dataHoraFinal |
| imoveis | `buscaBeneficioFiscal` | **idImovel**, anoVigencia |
| imoveis | `buscaComCamposAdicionais` | — |
| imoveis | `cria` | — |
| imoveis | `preenche` | — |
| inscobra | `cria` | — |
| integracoesContabeis | `busca` | — |
| integracoesContabeis | `cria` | **idIntegracaoContabil**, **protocoloExecucao** |
| integracoesContabeis | `cria` | **idIntegracaoContabil** |
| lancamentosAbertos | `busca` | numeroBaixa, codigoDeBarras, linhaDigitavel, tipo, codigoContribuinte, dataPagamento |
| loteEnvioSisobra | `busca` | documento, numero, ano, certificateId |
| notas-avulsas | `busca` | **idNota** |
| notas-avulsas | `busca` | **idNota** |
| Números de baixa | `altera` | **nroBaixa** |
| Números de baixa | `busca` | — |
| obras | `busca` | **idResponsavelTecnico** |
| pacoteEsfinge | `busca` | **chave** |
| pacoteEsfinge | `cria` | — |
| pacoteEsfinge | `limpa` | **chave** |
| pagamentoDetalhado | `existePagamento` | — |
| periodosSimples | `cria` | — |
| pgdas | `cria` | — |
| portalgestor | `busca` | exercicio |
| receitas-diversas | `calcular` | **idReceitaDiversa**, dataLancamento |
| receitas-diversas | `criar` | — |
| SimAmArquivo | `gerar-sequencial` | — |
| SimAmArquivo | `registrar` | **id** |
| SimAmArquivo | `registrar-lote` | — |
| SimAmConfiguracao | `busca` | — |
| solicitacaoTransferencia | `indefere` | **idTransferenciaImovel**, motivo |
| solicitacaoTransferenciaImovel | `busca` | **idRetificacao** |
| solicitacaoTransferenciaImovel | `buscaPorSolicitacao` | **idSolicitacao** |
| tabelasCalculos | `busca` | ano, codigoTabela, idImovel |
| tribunalParana | `None` | — |
| tribunalParana | `None` | — |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `altera` | **id** |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria` | — |
| tribunalParana | `cria-lote` | — |
| tribunalParana | `cria-lote` | — |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluir` | **id** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |
| tribunalParana | `excluirAnoMes` | **ano**, **mes** |

(**negrito** = obrigatório)