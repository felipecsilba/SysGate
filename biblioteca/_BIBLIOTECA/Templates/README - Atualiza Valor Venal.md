# Atualiza Valor Venal — como usar o template

Template validado em produção (primeiro município fechado e funcionando 100%).

## Fluxo que funcionou na prática

1. Copie `Atualiza_Valor_Venal_BASE.txt` para
   `Scripts/Scripts/{Cidade} - Atualiza Valor Venal.txt` (a pasta é compartilhada
   entre todos os municípios — o nome da cidade vai no início do arquivo, não em
   pasta separada; veja `README.md` na raiz para o motivo dessa estrutura).
2. Rode só com o parâmetro `codigo` preenchido e confira o `imprimir` do id do
   imóvel — garante que a busca básica está funcionando antes de mexer no resto.
3. Abra a fórmula de IPTU vigente do município
   (`Formulas/Imoveis - IPTU/{Cidade} - GERACAO_CREDITO_IMOVEIS - IPTU... - {ano}.txt`)
   e identifique:
   - os **nomes dos Campos Adicionais** usados na área do terreno / área construída
     (ex.: `CamposAdicionais.valor(imovel, 'Área Existente', ano)`), e troque no
     template pelos nomes reais desse município.
   - os **números das Tabelas de Cálculo** (`tabelasCalculos.getValor(ano, codigo, ...)`)
     usados para os fatores corretivos territorial e predial, e ajuste os códigos
     em `buscarTabela(codigo, ...)`.
   - a **sigla e a data de referência do indexador** (ex.: UFM/UPM numa data
     específica — pergunte ao servidor da prefeitura se não estiver óbvio na
     fórmula; no primeiro município usado foi UFM em 2018-12-31).
4. Rode com `atualizarValoresVenais` vazio/`'Nao'` primeiro — o script só
   imprime os valores calculados, sem gravar nada. Confira contra o valor
   venal que o IPTU oficial já gerou (se existir).
5. Só depois de bater, rode com `atualizarValoresVenais = 'Sim'` para gravar.

## Estrutura do template

| Seção | O que faz | Precisa ajustar? |
|---|---|---|
| 1. Parâmetro de entrada | `codigo`, `ano`, `atualizarValoresVenais` | Não |
| 2. Fontes | `imoveis`, `camposAdicionais`, `tabelasCalculos`, `indexadores.movimentacoes`, `campoAdicional` (grava) | Não |
| 3. Funções utilitárias | `buscarTabela`, `buscarValorIndexador`, `buscarCampoAdicional`, `preencherCampo` | Não |
| 4. Busca do imóvel | Por `codigo` | Não |
| 5. Indexador | Sigla + data de referência | **Sim** |
| 6. Territorial | Campos adicionais + tabelas de cálculo do fator corretivo territorial | **Sim** |
| 7. Predial | Campos adicionais + tabelas de cálculo do fator corretivo predial | **Sim** |
| 8. Valor do imóvel | Soma territorial + predial | Não |
| 9. Alíquota | Regra própria do município | **Sim** |
| 10. Gravação | Nomes dos Campos Adicionais de destino | Confirmar nomes |

## Sobre a pasta `FontesDeDados/`

- `fontes_tabela_completa.csv` — índice rápido (grep) de todas as fontes
  disponíveis (`nome`, `dominio`, `verbo`, `operacao`, `tipo_retorno`, campos/filtros
  principais). Use isso pra achar rápido qual fonte usar antes de ir ao catálogo
  completo.
- `fontes_catalog_completo.json` — detalhe campo a campo (tipo, se é enum, se é
  filtrável) de cada fonte. Buscar pelo `id` que aparece no CSV.

Fontes já mapeadas e usadas no template (não precisa procurar de novo):

| Precisa de...                          | Fonte (`nome` / `operacao`)              |
|-----------------------------------------|---------------------------------------------|
| Buscar o imóvel pelo código             | `imoveis` / `busca`                          |
| Ler um Campo Adicional (BCI) do imóvel  | `imoveis` / `camposAdicionais` (busca)       |
| Gravar um Campo Adicional               | `imoveis` / `campoAdicional` (preenche/POST) |
| Valor de Tabela de Cálculo              | `tabelascalculos.imoveis` / `busca`          |
| Valor de indexador numa data (ex.: UFM) | `indexadores.movimentacoes` / `busca`        |

**Atenção:** a fonte `indexadores` sozinha (sem `.movimentacoes`) é o cadastro
do indexador (campo `sigla` direto). Para valor histórico numa data, o filtro
correto é `indexador.sigla` (aninhado) na fonte `indexadores.movimentacoes`.

## Próximo passo sugerido

Depois de fazer isso pra 2–3 municípios, vale extrair os fatores por faixa
(profundidade, gleba, idade — quando o município usar faixas em vez de tabelas
numeradas) e colocar como função pronta aqui na `_BIBLIOTECA`.
