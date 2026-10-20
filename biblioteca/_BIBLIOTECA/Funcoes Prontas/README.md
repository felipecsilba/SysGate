# Funções Prontas

Padrões extraídos e generalizados a partir de código real da base (não
inventados do zero) — cada arquivo documenta de onde veio e em quantos
municípios o mesmo padrão foi confirmado antes de virar "função pronta".

⚠️ Fórmula e Script são linguagens diferentes com recursos diferentes — ver
`../Formula vs Script - o que cada uma aceita.md` antes de colar qualquer
coisa daqui numa Fórmula.

| Arquivo | Uso | Linguagem |
|---|---|---|
| `Calculo de Acrescimos (Juros Multa Correcao).txt` | Modelo pra qualquer `FORMULA_ACRESCIMO_*` novo (dívida ativa, débito ou parcelamento) — mesma estrutura confirmada em dezenas de municípios | Fórmula |
| `Acrescimos IGPM Mensal com Juros Mes ou Fracao.txt` | Modelo **validado em tela** (Rurópolis, 30/09/2026) de `FORMULA_ACRESCIMO_DIVIDA_ATIVA`, `FORMULA_ACRESCIMO_PARCELAMENTO` e `ACRESCIMO` (juro de financiamento) pra lei com correção por índice mensal pela sigla, juros de 1% ao mês **ou fração** e multa diária com teto. Traz as armadilhas: `correcaoMonetaria` sem valor inicial zera a correção, e `Datas.diferencaMeses` conta só meses completos (não serve pra "ou fração") | Fórmula |
| `Campos Adicionais - Leitura e Gravacao (Scripts).txt` | Ler/gravar Campo Adicional por tipo de cadastro (imóvel, econômico, receita diversa, contribuinte), com a tabela de quais tipos têm fonte de gravação disponível | Script |
| `Fator por Faixa.txt` | Versão Script: função reutilizável `calcularPorFaixa(...)`. Versão Fórmula: mesma lógica, mas como modelo de `se/senao` pra copiar (Fórmula não aceita `def`/`.find{}`) | Script (função) + Fórmula (modelo) |
| `Desconto de Parcelamento - Percentual por Configuracao.txt` | `DESCONTO_PARCELAMENTO` em que o percentual vem da **configuração de parcelamento** (`configuracaoParcelamento.descricao`), não da faixa de `qtdParcelas` — caso de várias configurações com a mesma quantidade de parcelas. Inclui como dar desconto só no principal mantendo os acréscimos | Fórmula |
| `Desconto de Parcelamento - REFIS por Prazo e Faixa de Parcelas.txt` | `DESCONTO_PARCELAMENTO` de REFIS típico: % por **prazo** da parcela única + % por **quantidade** de parcelas + corte por vencimento da dívida + trava "não ultrapassar o exercício". Validado em produção (Rurópolis, 30/09/2026). Documenta que `guiaReceita.vencimento` não existe | Fórmula |
| `Busca de Indexador numa Data.txt` | UFM/UPM/INPC numa data específica — versão Fórmula (`Utilitarios.*`) e versão Script (fonte `indexadores.movimentacoes`) | Ambas (versões separadas, sintaxe diferente) |

## Achados de qualidade de código (pra ter em mente ao escrever fórmula nova)

1. ~~**Duas funções de indexador fazendo a mesma coisa** — `buscaValorDoIndexadorPorSiglaNumaDataEspecifica` (1.117 usos) e `buscaValorIndexadorPorSiglaEData` (331 usos). Prefira a primeira em código novo, só por consistência com o resto da base.~~

   ❌ **ERRADO — corrigido em 21/08/2026.** Não são duplicatas, e **não dá pra escolher**: cada uma só existe em determinados tipos de fórmula. Confirmado no catálogo do editor e na contagem por tipo, com **separação perfeita, zero sobreposição**:

   | Onde | Função que existe |
   |---|---|
   | Cálculo de **Imóveis**, **Econômicos**, **Receitas Diversas**, e **ITBI** (1.059 usos) | `Utilitarios.buscaValorDoIndexadorPorSiglaNumaDataEspecifica(sigla, data)` |
   | **`FORMULA_ACRESCIMO_*`** (325 usos) e **Projetos/Obras** | `Utilitarios.buscaValorIndexadorPorSiglaEData(sigla, data)` |

   ⚠️ O corte **não** é "geração × acréscimo": o cálculo de *Projetos ou Obras*
   é de geração e usa a forma dos acréscimos. Não dá pra deduzir pela família
   do tipo — só consultando o catálogo.

   Seguir a recomendação antiga — usar "a primeira" numa fórmula de acréscimo — **geraria código que não roda**. A causa raiz do erro foi inferir do corpus inteiro sem separar por tipo de fórmula. Ver `../Dicionario de Formulas/`.
2. **Condição redundante em cadeia de multa** — o padrão comum escreve `senao { se (diferencaDias > 20 && diferencaDias <= 45) }`, mas dentro do `senao` já está garantido que `diferencaDias > 20` — o `&&` é código morto. Ver a versão simplificada em `Calculo de Acrescimos`.
3. **Cadeia de `se/senao` aninhada pra fator por faixa** é o padrão mais comum na base pra profundidade/gleba/idade/multa — funciona, mas é fácil errar a fronteira entre faixas ao copiar/colar pra um município novo. Em **Script**, `Fator por Faixa.txt` resolve isso com uma função e uma lista de faixas (mais fácil de revisar visualmente). Em **Fórmula**, não tem como virar função — o melhor que dá pra fazer é manter o `se/senao` bem formatado e comparar contra a lista de faixas documentada, na hora de copiar pra um município novo.
4. **Busca de Campo Adicional campo a campo (N chamadas à fonte)** é o padrão mais comum em Scripts — funciona, mas cada `fonteCamposAdicionais.busca(...)` é uma chamada de rede. Pra ler vários campos do mesmo imóvel, mais eficiente carregar todos de uma vez com `.busca(parametros:...).collectEntries { [(it.campoAdicional.titulo): it] }` (visto em `Scripts/Componentes` de alguns municípios) e depois ler do mapa em memória — mas só vale a pena quando o script processa muitos imóveis em lote (rotina/script), não faz diferença num cálculo de fórmula que roda por imóvel.

   ➕ **Complemento de 31/08/2026:** pra vários IMÓVEIS existe fonte melhor que o laço — `imoveis.camposAdicionais` (plural) aceita `criterio` com `idImovel in (...)` e resolve 200 imóveis por chamada. A singular `imovel.camposAdicionais` **exige** `parametros:[idImovel:..]`, um por vez. Ver a função `carregarCamposEmLote` em `Campos Adicionais - Leitura e Gravacao (Scripts).txt`.
5. **Filtro só na hora de escrever não economiza nada.** Numa exportação, se a consulta dos campos adicionais não repete o filtro dos imóveis, ela varre a base inteira e o script descarta o resto depois — restringir a 1 imóvel continuava levando minutos. O custo está na consulta, não no laço.
6. **Campo de lista de seleção vem com `vlCampo = 0`, não `null`.** Ao extrair o valor de um campo adicional genérico, testar `opcoes` ANTES de `vlCampo` — na ordem inversa toda opção vira `"0"`.
5. **Gravação de Campo Adicional via Script só existe pra Imóvel e Contribuinte** (confirmado no catálogo `FontesDeDados`) — não existe fonte de gravação pra Econômico ou Receita Diversa. Se precisar de um "Atualiza X" fora do motor de cálculo pra esses dois tipos, não tem como fazer por Script hoje — só de dentro da própria Fórmula.
6. **A primeira versão de `Fator por Faixa.txt` estava rotulada errado como "Fórmula ou Script"** — usava `def` e `.find{}`, que são Script-only (confirmado: 0 usos reais desses recursos em `Formulas/`, contra 1.203 e 334 em `Scripts/`). Corrigido — ver `../Formula vs Script - o que cada uma aceita.md`.
