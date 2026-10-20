# Exporta Campos Adicionais de Imóveis — como usar o template

Template validado em produção em 31/08/2026 (exportação de BCI + valores
venais de um município inteiro, rodada completa conferida na planilha).

Arquivos:

| Arquivo | Para que serve |
|---|---|
| `Exporta_Campos_Adicionais_Imoveis_BASE.txt` | A exportação em si. Gera CSV com dados do imóvel + N campos adicionais |
| `Diagnostico_Campos_Adicionais_de_um_Imovel.txt` | Lista TODOS os campos adicionais de um imóvel, todos os anos. **Rode este primeiro** |

## Fluxo que funcionou na prática

1. Rode o **diagnóstico** num imóvel conhecido do município. Ele imprime, por
   ano, `titulo=[...] | tipo=... | vlCampo=... | opcoes=...`. É de onde saem
   as duas informações que o template precisa: o **título exato** de cada
   campo e **em que ano** ele tem valor.
2. Copie os títulos para a lista `titulos` do template — a busca é por título
   exato, qualquer diferença de acento ou espaço zera a coluna. Ajuste a lista
   `cabecalhos` na mesma ordem (ela existe separada só para o cabeçalho do CSV
   sair sem acento).
3. Rode com `FILTRO_IMOVEIS = "codigo = <um imóvel>"` e confira a linha contra
   a tela do cadastro.
4. Só então troque para `"situacao = 'ATIVADO'"` (ou o filtro que o município
   pedir) e deixe rodar a base inteira.

## As três armadilhas que este template já resolve

**1. A fonte de leitura em lote é a PLURAL.** `imoveis.camposAdicionais`
aceita `criterio` e resolve 200 imóveis por chamada; `imovel.camposAdicionais`
(singular) exige `parametros: [idImovel: ..]`, um imóvel por vez. Trocar as
duas dá *"Os parâmetros 'idImovel' não foram definidos para fonte de dados"*.

**2. O filtro dos imóveis tem que entrar TAMBÉM na consulta dos campos.**
O template descobre primeiro os ids que entram na exportação e só então
consulta os campos adicionais desses ids, em lotes de `TAMANHO_LOTE`. Sem
isso, a consulta varre os campos adicionais da base inteira e o script
descarta o resto depois — filtrar um único imóvel continua levando minutos.

**3. Cada campo tem o seu ano.** Os campos do BCI (topografia, pedologia,
área do lote) são gravados na manutenção do cadastro e ficam no ano corrente;
os **valores venais e os fatores são gravados pelo cálculo do IPTU** — se o
cálculo do exercício ainda não rodou, o valor mais recente é o do ano
anterior. Por isso o template pega, de cada campo, o ano mais recente em que
ele tem valor, e a última coluna (`Anos utilizados`) diz de que anos veio a
linha (ex.: `2026/2025` = BCI de 2026, venais de 2025).

## Configuração

| Constante | O que faz |
|---|---|
| `ANO_MAXIMO` | Teto opcional, para fotografar um exercício fechado. `null` = sempre o mais recente |
| `ANO_MINIMO_BUSCA` | Ano mais antigo consultado. Só limita volume; subir reduz bastante o tempo da rodada completa |
| `FILTRO_IMOVEIS` | `criterio` da fonte `imoveis` (`"situacao = 'ATIVADO'"`, `"codigo = 7209"`, `"bairro.id = 12"`) |
| `DECIMAL_VIRGULA` | Troca `.` por `,` nos numéricos, para o Excel pt-BR |
| `TAMANHO_LOTE` | Imóveis por consulta de campos adicionais (200; baixar para 100 se o `in` estourar) |
| `titulos` / `cabecalhos` | Títulos exatos no cadastro / nomes das colunas. **Mesma ordem nas duas** |

## Extração do valor por tipo de campo

`opcoes` (LISTA_SELECAO) → `vlCampo` (numéricos, áreas, valores venais) →
`texto` → `areaTexto` → `dhCampo`, nessa ordem. A ordem importa: campo de
lista vem com `vlCampo = 0` (não `null`), então testar `vlCampo` antes
transformaria toda opção em `"0"`.

## O que ajustar para outro cadastro

Para contribuinte, econômico ou seção a estrutura é a mesma, mas a fonte
muda e nem todas têm leitura em lote — ver a tabela de cobertura em
`../Funcoes Prontas/Campos Adicionais - Leitura e Gravacao (Scripts).txt`.
