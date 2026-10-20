# Guia Registrada BB PIX V2 — referente imóvel e parcelamento

Template validado em Rurópolis:
- 14/10/2026: a guia do parcelamento 28 (imóvel 1409) saiu com referente, inscrição e tabela de receitas.
- 16/10/2026: a guia 10139, do parcelamento 41 (econômico 1123), saiu com o endereço.

Arquivos:
- `Guia_Registrada_BB_PIX_V2_Referente_Imovel_BASE.txt`: fonte dinâmica. Ela registra o boleto na API Cobranças v2 do Banco do Brasil e alimenta a guia.
- `Guia_Registrada_BB_PIX_V2_BASE.jrxml`: o modelo Jasper da guia.

Base: script "EMISSÃO DE BOLETOS PELO WEBSERVICE DO BANCO DO BRASIL - COBRANÇAS COM PIX", v2.0, de Gabriel Aita Rocha. Os trechos mudados estão marcados com `// ALTERADO`.

## O que este template resolve

| Situação | Antes | Agora |
|---|---|---|
| Débito ou dívida de imóvel | `endereco` vinha do endereço de correspondência do imóvel, que normalmente é o do proprietário | `endereco` vem de `enderecoFormatado`, a localização do imóvel. O endereço do contribuinte fica em `enderecoContribuinte` |
| Débito ou dívida de econômico | `endereco` vinha só da correspondência do econômico e saía vazio quando ela não estava cadastrada | `endereco` vem do `enderecoFormatado` do econômico. Reserva: a correspondência do econômico e, depois, o endereço do contribuinte |
| Referente contribuinte | Correspondência do contribuinte | Igual. Se não houver correspondência, usa o endereço do cadastro do contribuinte |
| Guia de parcelamento | Saía sem referente e sem inscrição | Lê os imóveis e econômicos das composições do parcelamento (ver abaixo) |
| Parcelamento sem receitas | A tabela "Receita / Valor" sumia inteira | Sai uma linha `PARC <nº> - <parcela>/<total>` com o valor da parcela |
| Sem inscrição imobiliária | Saía `0` | Sai vazio, e o modelo esconde o rótulo |
| Abreviatura do crédito | A fonte não trazia | Novo campo `abreviaturaCredito`, com o valor `PARC` no parcelamento |
| Ano do parcelamento | `2023, 2024,` (ano vazio no fim) | Sem ano vazio e sem ano repetido |

### Referente no parcelamento

| Parcelado | `referente` | `inscricaoImobiliaria` | `endereco` |
|---|---|---|---|
| 1 imóvel | `Imóvel 1409` | inscrição do imóvel | localização do imóvel |
| vários imóveis | `Imóvel 1, Imóvel 2` | inscrições separadas por vírgula | endereço do contribuinte |
| 1 econômico | `Econômico 321 - Nome` | vazia | localização do econômico (reserva: correspondência do econômico, depois a do contribuinte) |
| só dívidas do contribuinte | vazio | vazia | endereço do contribuinte |

O endereço do pagador enviado ao BB no registro **não muda**: continua sendo o do contribuinte, que é quem paga.

## Armadilhas encontradas (não repetir)

- **`parcelamentos.busca(campos: "referentes(...)")` dá erro**: "Não é permitido especificar campos do tipo lista". Para descobrir o imóvel ou econômico do parcelamento, use
  `parcelamentos.composicoes.busca(criterio: "parcelamento.id = X", campos: "debito(idImovel, idEconomico), divida(idImovel, idEconomico)")`.
- **`lista.vazio()` não existe**: `vazio()` só funciona em texto. Para lista, use `!lista`.
- **Lista vazia some no Jasper**: com `JRBeanCollectionDataSource` vazio, a tabela não imprime nem o cabeçalho. "Não aparece receita" quase sempre quer dizer que a lista veio vazia.
- **A composição do parcelamento devolve id `"0"`** quando a dívida não tem imóvel ou econômico, e não nulo. O `"0"` passa num `se (id)`. O log mostrou `imóveis [0] / econômicos [20463831, 0]`: o script tratou o "imóvel 0" como real e deixou o econômico de lado. Por isso o template descarta os ids `0` (`idValido`).
- **`se (lista)` não serve para testar lista vazia aqui**: com a lista vazia, o bloco rodou e a busca saiu com `id in ()`, que dá "Parser error: Invalid input ')'". Teste com `lista.size() > 0`.
- **Endereço de correspondência "vazio" não vem nulo**: a busca pode voltar um registro sem nada preenchido, e o texto montado com ele fica `" , Nº - - ()()"`. Considere sem endereço quando `logradouro.nome` estiver vazio.
- **printWhen do Jasper comparava com `"0"`**: se a fonte passar a mandar vazio em vez de `0`, a condição do modelo precisa mudar junto. Senão o rótulo sai sozinho, sem valor.

## Como usar em outro município

1. Cadastre as tabelas auxiliares que o script lê:
   - "Configuração Registro Pix - BB Negocial": convênio, dias, multa/juros, variação, aceita Pix, nº da configuração.
   - "Configuração Dados API - BB": AppKey, Client ID/Secret, Authorization, ambiente, mesma entidade.
2. Na fonte, o parâmetro `protocolo` precisa estar vinculado ao relatório. Use o botão FONTE DINÂMICA no relatório. Sem o vínculo, o erro é "parâmetro obrigatório sem valor".
3. Suba o `.jrxml`. Para mostrar `abreviaturaCredito` ou `enderecoContribuinte`, crie os campos no modelo, porque hoje eles não estão lá.
4. Teste guias de imóvel, de econômico, de contribuinte e de parcelamento. No log, confira as linhas
   `Endereço da guia N (TIPO): ...`, `Receitas da guia N (TIPO): X` e `Parcelamento N: imóveis [...] / econômicos [...]`.
5. O `imprimir linha` do script original grava no log o Client Secret, o Authorization e o token do BB. Tire as credenciais desse `imprimir` antes de compartilhar o log.

## Pontos em aberto

- Na guia testada, o endereço saiu no formato do endereço de correspondência (`..., Nº 130 - VILA NOVA - Rurópolis(PA)(cep)`). Isso significa uma de duas coisas: ou o `enderecoFormatado` do imóvel veio vazio, ou o endereço de correspondência é igual à localização. Ainda não foi conferido no cadastro.
- ITBI (`TRANSFERENCIA_IMOVEIS`) já traz a inscrição, mas não o endereço do imóvel.
- O referente no `.jrxml` fica numa caixa de 100×36, com fonte 10 e sem stretch. Com vários imóveis, o texto corta.
