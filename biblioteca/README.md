# Scripts, Fórmulas e Relatórios — Betha Sistemas

> 📌 **Novo por aqui?** Leia `CONTEXTO.md` primeiro — traz o vocabulário do
> domínio, decisões já tomadas, erros já cometidos (pra não repetir) e a
> visão do que este projeto quer virar. Este README descreve só a estrutura.

Base de conhecimento consolidada de fórmulas de cálculo, scripts e relatórios
(BFC-Script) extraídos de múltiplos municípios clientes da Betha Sistemas.
Reorganizada por **especialização de área**, não por município — o objetivo é
facilitar comparar/reaproveitar a mesma lógica (ex.: cálculo de IPTU) entre
diferentes clientes, em vez de ficar preso à pasta de um cliente só.

## Estrutura

```
Formulas/            Fórmulas de cálculo, por área de especialização
  Imoveis - IPTU/
  ITBI/
  ISS - Economicos/
  Receitas Diversas/
  Parcelamentos/
  Divida Ativa/
  Debitos Gerais/
  Nota Fiscal Avulsa/
  Contribuicao de Melhorias/
  Convenios Bancarios/
  Descontos de Guia/

Scripts/             Scripts BFC-Script, por categoria técnica
  Componentes/        (funções reutilizáveis, importadas por outros scripts)
  Criticas/            (gatilhos disparados por evento de cadastro, ex. CRIACAO)
  Fontes Dinamicas/    (fontes de dados usadas em relatórios)
  Scripts/             (rotinas executadas sob demanda/lote)

Relatorios/          Pastas atômicas por relatório — cada uma tem o .jrxml
                      (Jasper) + fonte_dinamica.txt + parametros.txt +
                      relatorio_info.txt juntos. NÃO separar esses arquivos:
                      os parâmetros precisam ser configurados manualmente no
                      Studio de Extensões junto com o jrxml, senão o relatório
                      não funciona.

Municipios/           Uma pasta por município, só com metadados/ (catálogos
                      JSON exportados do sistema — não é fonte de fórmula).

FontesDeDados/        Catálogo das 574 fontes de dados do BFC-Script, com as
                      4 dimensões separadas (campos de retorno / filtros /
                      ordenação / parâmetros) e os nomes reais usados no
                      editor da Betha. Tem README próprio — leia antes de usar.
  fonte.py              FERRAMENTA PRINCIPAL. Responde tudo sobre fontes:
                        python fonte.py ver <fonte>     → 4 dimensões +
                                                          esqueleto de código
                        python fonte.py campo <termo>   → onde o campo existe
                        python fonte.py rel <fonte>     → relacionamentos
                        python fonte.py obrigatorios    → quem exige parâmetro
                      Aceita tanto o nome do catálogo quanto o do editor.

_BIBLIOTECA/           Templates e padrões reutilizáveis entre municípios, e a
                      base de apoio pro dia a dia (dicionário de funções,
                      biblioteca de funções prontas — em construção).
  Formula vs Script - o que cada uma aceita.md
                        Regras confirmadas empiricamente (contagem real no
                      corpus) sobre o que Fórmula e Script aceitam cada um —
                      ler antes de reaproveitar qualquer coisa da biblioteca.
  Templates/            Ex.: Atualiza_Valor_Venal_BASE.txt,
                        Exporta_Campos_Adicionais_Imoveis_BASE.txt.
                        Cada template tem um README com o passo a passo.
  Dicionario de Funcoes BFC-Script.md
                        Todas as funções nativas (Datas.*, CamposAdicionais.*,
                      Numeros.*, Utilitarios.*, UtilitariosImoveis.*, etc.)
                      realmente usadas nesta base, com contagem de uso e
                      exemplo real tirado de um arquivo existente. Extraído
                      automaticamente — não é doc oficial da Betha, só cobre
                      o que já foi usado aqui.
  Funcoes Prontas/      Padrões generalizados a partir de código real (cálculo
                      de juros/multa/correção, fator por faixa, leitura e
                      gravação de Campo Adicional por tipo de cadastro, busca
                      de indexador) — cada arquivo documenta de onde veio e
                      inclui achados de qualidade de código (funções
                      duplicadas na API, condições redundantes, etc.).

_RASCUNHOS-TESTES/     Ambientes de apoio/homologação/demonstração da Betha
                      (não são clientes reais) — fora do fluxo normal.
```

## Convenção de nomes

Dentro de `Formulas/` e `Scripts/`, todo arquivo é prefixado com o nome da
cidade: `{Cidade} - {nome original do arquivo}`. Isso existe porque o mesmo
arquivo de N municípios diferentes agora convive na mesma pasta de área —
sem o prefixo não daria pra saber de qual cliente é.

Dentro de `Relatorios/`, o prefixo de cidade fica no **nome da pasta** (a
pasta inteira do relatório, não cada arquivo individualmente).

## ⚠️ Duplicidade de nome: os dois "Bom Jesus"

Existem dois municípios reais e **diferentes** chamados Bom Jesus na base
original (confirmado: catálogos de scripts com tamanhos e conteúdos bem
distintos — não é a mesma cidade exportada duas vezes). Como os dois tinham
exatamente o mesmo nome de cidade, os arquivos dos dois ficaram misturados
sob o mesmo prefixo `Bom Jesus -` em `Formulas/` e `Scripts/` durante a
reorganização (~154 arquivos). Nenhum dado foi perdido, mas não dá pra saber
hoje qual arquivo `Bom Jesus - ...` pertence a qual prefeitura. Se
identificar o estado/UF de cada uma (pelas pastas em `Municipios/`), dá pra
reprocessar e separar por sufixo (ex. `Bom Jesus (RS)` / `Bom Jesus (PI)`).

## Histórico da limpeza (o que já foi feito)

- **Formulas/**: de 4.203 → 2.035 arquivos.
  - 2.098 removidos por serem duplicata exata do ano seguinte (mesmo nome,
    conteúdo idêntico ano a ano — mantido sempre o mais recente).
  - 70 removidos por estarem 100% vazios (só placeholder `//inicio`, nenhum
    comando real).
  - Analisado também "conteúdo idêntico com nomes diferentes" (14 grupos) —
    **nada removido**: são créditos tributários distintos que coincidem por
    cobrarem o mesmo valor, não duplicatas reais (ex.: duas taxas de
    expediente de setores diferentes com o mesmo valor fixo).
- **Scripts/**: de 5.410 → 5.393 arquivos.
  - 18 removidos por estarem vazios/serem rascunho de teste (`imprimir "kaio"`,
    `asd`, etc.).
  - Identificados (não removidos) 132 grupos de conteúdo idêntico com nomes
    diferentes na mesma cidade — revisão manual pendente, ver
    `_BIBLIOTECA/Relatorio - Duplicatas em Scripts.txt`.
  - Conteúdo idêntico **entre cidades diferentes** (ex. `utilitarios.txt`
    repetido em várias prefeituras) não é tratado como duplicata — é
    arquitetura normal multi-tenant, cada cliente precisa da própria cópia.
- **Relatorios/**: reorganizado (pastas movidas com prefixo de cidade), sem
  limpeza de conteúdo — decisão de manter como está.

## Biblioteca de apoio (em construção)

Objetivo: virar um banco de apoio pro dia a dia — dicionário de funções,
biblioteca de funções prontas por área, e futuramente (quando fizer sentido)
RAG/embeddings pra busca semântica e "especialistas" por área. Indo uma coisa
de cada vez:

1. ✅ `_BIBLIOTECA/Dicionario de Funcoes BFC-Script.md` — 111 funções nativas
   catalogadas (18 namespaces), com contagem de uso e exemplo real.
2. ✅ `_BIBLIOTECA/Funcoes Prontas/` — padrões generalizados (acréscimos,
   fator por faixa, campos adicionais, indexador), com achados de qualidade
   de código documentados.
3. ✅ `FontesDeDados/` — mapeamento completo das 574 fontes: as 4 dimensões
   separadas (retorno / filtro / ordenação / parâmetro), relacionamentos entre
   fontes, parâmetros obrigatórios e os nomes reais usados no editor da Betha.
   Ferramenta de consulta: `fonte.py`.
4. ⏳ Próximos candidatos (não iniciados): documentação por área (IPTU, ISS,
   Receitas Diversas...), RAG/embeddings sobre a base pra busca semântica,
   "especialista" por área via subagente.

## Achados técnicos importantes (resumo)

Detalhes e contexto completo em `CONTEXTO.md`.

- **Fórmula e Script são linguagens diferentes.** Fórmula não aceita `def`,
  `.find{}` nem `Dados.tributos.*`. Confirmado por contagem no corpus.
- **Fonte tem 4 dimensões distintas.** Campo de retorno ≠ campo filtrável.
  Existe fonte com 405 campos de retorno e zero filtros.
- **207 operações exigem parâmetro obrigatório** (o `{placeholder}` do path).
  Sem ele a chamada falha. 221 operações não aceitam `criterio:` nenhum.
- **O nome da fonte no catálogo não é o nome no editor.** Catálogo diz
  `certidoes-negativas`; no script é `certidaoNegativa`. Cada sub-rota tem
  nome próprio (`indexadores` ≠ `indexadores.movimentacoes`), e leitura/escrita
  do mesmo path têm nomes diferentes (`imovel.camposAdicionais` lê,
  `imovel.campoAdicional` grava).
