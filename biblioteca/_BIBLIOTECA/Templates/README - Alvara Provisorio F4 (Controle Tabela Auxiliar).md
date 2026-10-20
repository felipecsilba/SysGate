# Alvará Provisório via F4 com controle em tabela auxiliar — como usar o template

Template validado em produção (PM Placas, 09/2026). Arquivo:
`Alvara_Provisorio_F4_Controle_Tabela_Auxiliar_BASE.txt`.

Serve para qualquer documento emitido pelo **F4 (Gerenciador de Relatórios)** que
não tem cadastro próprio no sistema, mas precisa de **numeração sequencial** e
**histórico de emissões**. O controle fica num Cadastro Geral (tabela auxiliar).

## Fluxo que funcionou na prática

1. **Cadastro Geral:** em Configurando > Tabelas > Cadastros Gerais, crie a tabela
   de controle e anote o **código** dela:

   | Campo | Descrição | Tipo |
   |---|---|---|
   | campo1 | Nº Alvará | Número |
   | campo2 | Código do Econômico | Número |
   | campo3 | Nome do Econômico | Texto |
   | campo4 | Validade | Texto (dd/MM/yyyy) |
   | campo5/6/7 | Primeiro/Segundo/Terceiro Horário | Texto |

2. **Fonte dinâmica:** copie o template e troque `CODIGO_TABELA_CONTROLE` pelo
   código da tabela.
3. **Parâmetros:** crie no relatório os parâmetros `economico` (Lista simples
   dinâmica > Listagem de econômicos v2, valor = `id`, filtros `codigo` e `nome`),
   `primeiroHorario`, `segundoHorario`, `terceiroHorario` (Caracter) e
   `dataValidade` (Data, obrigatório).
4. **Vínculo (fácil de esquecer):** na tela do relatório, clique no botão
   **FONTE DINÂMICA** e ligue cada parâmetro do script ao parâmetro do relatório.
   Sem esse vínculo, a execução falha com *"Não foi informado valor para o
   parâmetro obrigatório: economico"*, mesmo com tudo configurado certo.
5. Execute e confira no log as linhas `Registrado alvará provisório nº X` e
   `linha: {...}`.
6. **Antes de liberar:** apague da tabela as linhas criadas nos testes.

## Como funciona o controle

- **Emissão nova:** o número é o maior `campo1` da tabela + 1 (tabela vazia = nº 1).
  O script grava a linha e o número vai em `nroDocumento`.
- **Reimpressão:** se o mesmo econômico já tiver registro com a **mesma validade**,
  o script usa o número gravado e não cria linha nova.
- **Concorrência:** duas emissões no mesmo instante podem pegar o mesmo número.
  Para o volume de alvará provisório, o risco foi aceito.

## Lições aprendidas (confirmadas)

- **Fonte dinâmica consegue gravar em tabela auxiliar** com
  `Dados.tributos.v2.tabelaAuxiliar.registros.cria(parametros: [codigoTabelaAuxiliar: X], conteudo: [...])`.
- **Filtro numérico na tabela auxiliar:** use `campoNint` (ex.: `campo2int = 123`)
  para filtrar e ordenar como número. `campoN` é texto.
- **Parâmetro Lista dinâmica:** o valor chega em `parametros.<nome>?.selecionado?.valor`.
- **`economicos`:** `municipio` traz `uf` direto. Não existe `municipio.estado`
  (o erro é *"O campo 'estado' não existe em 'BasicMunicipio'"*).
- **Nomes de campos:** consulte `FontesDeDados/catalogo_v2.json` antes de montar
  o `campos:` de uma busca.
