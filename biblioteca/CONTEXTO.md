# CONTEXTO — leia antes de trabalhar neste projeto

Documento de handoff. O `README.md` descreve **o que existe**; este aqui
descreve **quem usa, pra quê, o que já foi decidido, o que já deu errado e
o que está em aberto**.

---

## Quem usa e pra quê

Felipe, analista de implantação de sistemas de arrecadação da **Betha
Sistemas**. Implanta/configura o sistema tributário em prefeituras: cria
fórmulas de cálculo (IPTU, ISS, ITBI, taxas, dívida ativa...) e scripts em
**BFC-Script**, além de relatórios Jasper.

Cada município tem legislação tributária própria — **não existe fórmula
universal**. O trabalho é sempre "adaptar o padrão conhecido às regras
daquele município".

Esta pasta é uma base extraída de ~34 municípios reais + ambientes de teste,
reorganizada pra virar **base de conhecimento e apoio ao dia a dia**, não só
um backup.

**Ele conhece o sistema melhor do que qualquer inferência tirada dos
arquivos.** Valida o que é proposto e corrige quando está errado — vários
erros deste projeto foram pegos por ele com print da tela. Checar afirmações
contra os dados antes de apresentá-las como fato.

---

## Guia rápido: consultar fontes de dados

```bash
cd FontesDeDados
python fonte.py ver <fonte>              # 4 dimensões + esqueleto de código pronto
python fonte.py campo <termo>            # onde o campo existe (filtro? param? retorno?)
python fonte.py rel <fonte>              # relacionamentos, nos dois sentidos
python fonte.py buscar <termo> [natureza]# natureza = leitura|criacao|alteracao|exclusao
python fonte.py obrigatorios             # fontes que exigem parâmetro
python fonte.py escrita                  # tudo que NÃO é consulta
python _validar.py                       # teste de regressão do mapeamento
```

Aceita o nome do catálogo **ou** o nome que aparece no editor da Betha
(`fonte.py ver certidaoNegativa` = `fonte.py ver certidoes-negativas`).

---

## Vocabulário do domínio (importante pra não errar)

- **Fórmula** — roda dentro do motor de cálculo. Tipos: `GERACAO_CREDITO_*`
  (gera o débito), `FORMULA_ACRESCIMO_*` (juros/multa/correção), `DESCONTO_*`,
  `CONVENIO_BANCARIO`, `ITBI_*`.
- **Script** — BFC-Script "completo", roda fora do motor de cálculo.
  Subtipos: `Componentes` (lib importável), `Criticas` (gatilho por evento de
  cadastro, ex. CRIACAO/ALTERACAO), `Fontes Dinamicas` (alimentam relatório),
  `Scripts` (rotina sob demanda/lote).
- **⚠️ Fórmula e Script são LINGUAGENS DIFERENTES** — ver
  `_BIBLIOTECA/Formula vs Script - o que cada uma aceita.md`. Fórmula NÃO
  aceita `def funcao(){}`, `.find{}` nem `Dados.tributos.*`. Errar isso gera
  código que não roda. (Já erramos uma vez; o usuário pegou.)
- **Campo Adicional / BCI** — campos customizados por município no cadastro
  (imóvel, econômico...). É onde ficam área do terreno, valor do m², fração
  ideal, valor venal... Nomes variam por município.
- **Tabelas de Cálculo** — tabelas numeradas (28, 29, 36...) com fatores
  corretivos (situação, topografia, pedologia, estrutura, conservação...).
  Os números variam por município.
- **Indexador** — UFM/UPM/INPC. Valor por data, usado pra corrigir valores.
- **Fontes de dados** — a API que os Scripts consomem (`Dados.tributos.v2.*`).
- **Studio de Extensões** — onde o código é colado/configurado no sistema.
  Relatórios precisam ter os parâmetros cadastrados manualmente lá.

---

## Modelo das fontes de dados (núcleo do sistema de apoio)

### As 4 dimensões

Toda fonte tem 4 coisas distintas. Misturá-las gera código que não roda.

| Dimensão | Vai no script como | O que é |
|---|---|---|
| Campos de retorno | `campos:` | O que vem no resultado |
| Filtros | `criterio:` | Por quais campos dá pra restringir |
| Ordenação | `ordem:` | Por quais campos dá pra ordenar |
| Parâmetros | `parametros:` | Valores que a fonte exige/aceita |

- **Nem todo campo de retorno é filtrável.** `certidaoNegativa` retorna 405
  campos e aceita **zero** `criterio:`.
- **Parâmetro do path é OBRIGATÓRIO.** Path com `{placeholder}`
  (`/imoveis/{idImovel}/testadas`) exige aquele valor — 207 das 574 operações.
- Todo campo tem **tipo** (100% de cobertura) e **descrição** (78%).

### Natureza da operação

| Natureza | Padrão | Qtd |
|---|---|---|
| 🔍 LEITURA | `.busca` · GET | 423 |
| ➕ CRIAÇÃO | `.cria` · POST | 51 |
| ✏️ ALTERAÇÃO | `.altera`/`.preenche` · PUT | 42 |
| 🗑️ EXCLUSÃO | `.exclui` · DELETE | 58 |

16 operações `busca` usam POST (filtro grande demais pra querystring) —
continuam sendo leitura; a classificação olha o nome da operação, não só o verbo.

### ⚠ O nome no catálogo ≠ nome no editor

O catálogo nomeia pela rota REST; o editor usa outro nome:

| catálogo (REST) | no script (BFC) |
|---|---|
| `certidoes-negativas` | `certidaoNegativa` |
| `certidoes-itbi` | `certidaoITBI` |
| `Números de baixa` | `numerosBaixa` |
| `Emissão de guias` | `emissaoGuias` |
| `CalculoTributarioController` | `calculosTributarios` |

E **cada sub-rota vira um nome próprio**:

| path | no script |
|---|---|
| `/indexadores` | `indexadores` |
| `/indexadores/movimentacoes` | `indexadores.movimentacoes` |
| `/imoveis/{idImovel}/testadas` | `imovel.testadas` |

E **o mesmo path serve leitura e escrita, com nomes diferentes**:

| `/imoveis/campos-adicionais` | no script |
|---|---|
| GET (leitura) | `imoveis.camposAdicionais` (plural) |
| POST (gravação) | `imovel.campoAdicional` (singular) |

O padrão **plural = leitura / singular = escrita** se repete em contribuinte.
Confirmado nos scripts de produção de Placas e Andradas.

⚠️ **Mas isso não é a história toda — campos adicionais de imóvel têm DUAS
leituras, e o singular/plural separa elas, não leitura de escrita:**

| path | no script | como filtra |
|---|---|---|
| `/imoveis/campos-adicionais` | `imoveis.camposAdicionais` | `criterio:` livre, **sem parâmetro** — lote |
| `/imoveis/{idImovel}/campos-adicionais` | `imovel.camposAdicionais` | exige `parametros: [idImovel: ..]` — 1 imóvel |

Usar a singular sem o parâmetro dá *"Os parâmetros 'idImovel' não foram
definidos para fonte de dados tributos.v2.imovel.camposAdicionais.busca"*.
Confirmado rodando no Studio em 31/08/2026, e no corpus (202 chamadas da
singular com `parametros:` × 105 da plural com `criterio:`). Coberto por
`_validar.py` e fixado em `_mapear_bfc_rest.py` (dict `CONFIRMADOS`) — o
casamento automático não separa duas leituras do mesmo cadastro.

Esse nome **não existe no export** — foi extraído de ~18 mil chamadas reais
nos scripts da base. `fonte.py` já resolve; quando não tem confirmação, ele
avisa em vez de chutar.

---

## Decisões já tomadas (não re-litigar sem motivo)

1. **Organização por especialização, não por município.** `Formulas/` e
   `Scripts/` agregam todos os municípios juntos, com prefixo `{Cidade} - `.
   O objetivo é comparar como N municípios resolveram o mesmo problema.
   `Municipios/` só guarda `metadados/`.
2. **Nível 1 = tipo (Formulas/Scripts/Relatorios), nível 2 = especialização.**
3. **`Relatorios/` são pastas atômicas** — jrxml + fonte_dinamica +
   parametros + relatorio_info ficam juntos. NUNCA separar: sem os parâmetros
   o relatório não funciona no Studio.
4. **Limpeza feita:** duplicatas por ano e arquivos vazios removidos
   (~2.100 arquivos). Detalhes no `README.md`.
5. **Conteúdo idêntico entre cidades diferentes NÃO é duplicata** — é
   multi-tenant normal, cada prefeitura precisa da própria cópia.
6. **Ambientes de teste isolados** em `_RASCUNHOS-TESTES/`.
7. **Consulta a fontes é por ferramenta, não por documento estático** — o
   espaço de variações de nome é grande demais pra um `.md` fixo cobrir.

---

## Lições aprendidas (erros já cometidos — não repetir)

1. **Nunca confiar em lista curada quando existe schema real.**
   `relacionamentos_completo.json` (curado pela Betha) dizia que `dividas`
   não aceitava `idEconomico`. Era falso. O usuário provou com print da tela.
   Fonte de verdade: `FontesDeDados/raw/`.
2. **O consolidado `fontes_catalog_completo.json` é estruturalmente
   defeituoso** — mistura campo de retorno com campo filtrável num flag
   `filtravel` inventado, e descarta `pathParams`/`queryParams` (perde os
   parâmetros obrigatórios). Substituído por `catalogo_v2.json`.
3. **No schema bruto, `filter`/`sort` só aparecem quando são `false`** — são
   exceções negativas, o padrão é ser filtrável/ordenável. Inverter isso foi
   a causa raiz do erro do `idEconomico`.
4. **Buscar campo por nome exato subconta muito.** A mesma relação aparece
   como `idEconomico`, `economico.id`, `economicoId`,
   `economico.endereco.bairro.id`. Exato deu 9 fontes; substring deu 25.
5. **Plural português quebra casamento de nome.** `imovel`×`imoveis`,
   `indexador`×`indexadores`, `campoAdicional`×`camposAdicionais`,
   `adicional`×`adicionais`. Tratado em `fonte.py:variantes()` — reusar.
   Precisa flexionar **cada palavra**, inclusive dentro de segmento composto
   (`campos-adicionais` gera tanto `camposAdicionais` quanto `campoAdicional`).
6. **O corpus de scripts é fonte de verdade tão boa quanto o catálogo.**
   O nome real das fontes no BFC-Script não existia em nenhum export — foi
   extraído de ~18 mil chamadas em produção. Quando o catálogo não responde,
   perguntar ao corpus.
7. **Na dúvida, não mapear.** Casamento ambíguo gerava nome errado
   (`condominios` virava `imovel.camposAdicionais`). Nome errado quebra o
   script — melhor avisar "confirme no editor" do que chutar. Cobertura menor
   e correta vale mais que cobertura alta e furada.
8. **Verificar empiricamente no corpus antes de afirmar.** Várias conclusões
   vieram de contar ocorrências nos 7.400 arquivos, não de suposição.
9. **Regra mnemônica boa não é regra completa.** "Plural = leitura, singular =
   escrita" está certa e é útil, mas escondia que existem DUAS leituras de
   campo adicional de imóvel (lote × por id) — e o mapeamento automático
   herdou o buraco. Quando a heurística não tem como distinguir dois casos,
   registrar o caso confirmado à mão (`CONFIRMADOS` em `_mapear_bfc_rest.py`)
   em vez de deixar o desempate no chute.
10. **Em exportação, filtrar só na escrita não adianta.** Se a consulta pesada
   não repete o filtro, ela varre a base inteira e o script joga fora depois.
   Restringir a 1 imóvel continuava levando minutos até o filtro entrar
   também na consulta de campos adicionais.
11. **Cada campo adicional tem o SEU ano.** BCI é gravado na manutenção do
   cadastro (ano corrente); valor venal e fatores são gravados pelo CÁLCULO
   do IPTU — enquanto o cálculo do exercício não roda, o mais recente é o do
   ano anterior. Filtrar `ano = <exercício>` numa exportação traz o BCI e
   deixa os venais em branco. Certo: por campo, o ano mais recente que tiver
   valor, com uma coluna dizendo de que ano veio.

---

## O que já foi construído

### Biblioteca de apoio

| Artefato | O que é |
|---|---|
| `_BIBLIOTECA/Dicionario de Funcoes BFC-Script.md` | 111 funções nativas em 18 namespaces, com contagem de uso real e exemplo de arquivo existente |
| `_BIBLIOTECA/Formula vs Script - o que cada uma aceita.md` | Tabela de recursos por linguagem, confirmada por contagem no corpus |
| `_BIBLIOTECA/Funcoes Prontas/` | Padrões generalizados: cálculo de acréscimos, fator por faixa, campos adicionais, indexador + achados de qualidade de código |
| `_BIBLIOTECA/Templates/Atualiza_Valor_Venal_BASE.txt` | Template validado em produção (Placas) |
| `_BIBLIOTECA/Templates/Exporta_Campos_Adicionais_Imoveis_BASE.txt` | Exportação de BCI + valores venais em CSV. Validado em produção 31/08/2026. Vem com o script de diagnóstico que descobre título e ano de cada campo |

### Sistema de fontes de dados

| Artefato | O que é |
|---|---|
| `FontesDeDados/fonte.py` | **Ferramenta principal.** 6 comandos (ver/campo/rel/buscar/obrigatorios/escrita) |
| `FontesDeDados/catalogo_v2.json` | Catálogo com as 4 dimensões separadas + natureza |
| `FontesDeDados/nomes_bfc.json` | 242 nomes de fonte usados no BFC-Script, extraídos do corpus |
| `FontesDeDados/mapa_bfc_rest.json` | Liga nome REST ↔ nome BFC, por operação |
| `FontesDeDados/Fontes - Parametros Obrigatorios.md` | 207 operações que exigem parâmetro + 221 que não aceitam `criterio:` |
| `FontesDeDados/_validar.py` | Teste de regressão contra fatos verificados na tela |
| `FontesDeDados/_obsoleto/` | Artefatos aposentados + o que cada um errava |

### Pipeline de regeneração (se reextrair as fontes)

```
1. _construir_catalogo_v2.py   raw/     → catalogo_v2.json
2. _extrair_nomes_bfc.py       Scripts/ → nomes_bfc.json
3. _mapear_bfc_rest.py         ambos    → mapa_bfc_rest.json
4. _validar.py                          → confere tudo
```

---

## Fatos já verificados na tela do sistema (não re-perguntar)

| Fonte | Fato confirmado |
|---|---|
| `dividas` | aceita `idEconomico` como filtro |
| `certidaoNegativa` | 0 filtros, 0 ordenação, 4 parâmetros não-obrigatórios, muitos campos de retorno |
| `contribuinte.emails` | `idContribuinte` obrigatório; 6 filtros = 6 campos de retorno |
| `dividas.debitosInscritos` | 4 filtros, 4 campos de retorno, sem parâmetro |
| `certidaoITBI` | 2 parâmetros obrigatórios: `ano` + `nroDocumento` |
| campos adicionais | `imovel.camposAdicionais` lê / `imovel.campoAdicional` grava |
| `imoveis.camposAdicionais` | leitura em lote: aceita `criterio` com `idImovel in (...)`, sem parâmetro |
| campos adicionais | tipo LISTA_SELECAO vem com `vlCampo = 0` (não null) — o valor está em `opcoes` |

Esses casos estão cobertos por `_validar.py`.

---

## Em aberto / próximos passos

### Pendências conhecidas
- **132 grupos de scripts com conteúdo idêntico e nomes diferentes** —
  revisão manual pendente (`_BIBLIOTECA/Relatorio - Duplicatas em Scripts.txt`).
  Não dá pra automatizar: nome diferente pode significar propósito diferente.
- **Dois municípios chamados "Bom Jesus"** — clientes diferentes, arquivos
  misturados sob o mesmo prefixo (~154 arquivos). Precisa da UF pra separar.
- **Catálogo possivelmente desatualizado** — 574 fontes extraídas; o sistema
  tem ~589 hoje. Decisão do usuário: **manter 574 por enquanto**, ele adiciona
  as que faltam depois. Reextrair com `Desktop/ProjetoX/Extrator`.
- **50 nomes BFC do corpus não casaram com nenhuma fonte do catálogo**
  (`guiasEmitidas`, `baixasAutomaticasHomologadasEstornadas`, `movimentacoesMEI`,
  os `simam.*`). Provável pista do que falta no export — ver
  `mapa_bfc_rest.json` → `sem_correspondencia`.
- 1 fonte da lista de 575 IDs nunca foi extraída (`679a207a97f86d7606dc4904`).

### Visão do usuário pro projeto
Um **"microsistema" de apoio**: banco de fácil acesso, criador de fórmulas e
scripts, biblioteca de funções. Ordem definida por ele ("uma coisa de cada vez"):

1. ✅ Dicionário de funções
2. ✅ Biblioteca de funções prontas
3. ✅ Mapeamento completo das fontes (4 dimensões, relacionamentos, nomes reais)
4. 🟡 **Especialistas por área** — em andamento (ver abaixo)
5. ⏳ **RAG / embeddings** sobre a base pra busca semântica

O usuário tem crédito na API do Claude disponível pra RAG/embeddings.

---

## Especialistas por área (decisão de 20/08/2026)

Substitui o item "documentação por área" como formato de entrega. O usuário
quer **um especialista por área do sistema**, alimentado com a central de
ajuda + as fontes + as fórmulas + as configurações daquela área. No fim,
um **especialista de implantação** que roteia pros outros e faz as perguntas
certas — a ferramenta que apoia decisão rápida, construção rápida de script
de diagnóstico, e consulta batendo nas fontes corretas.

### Arquitetura escolhida — 3 camadas

1. **Conhecimento em arquivo** (`_CONHECIMENTO/<Area>/`) — porque prompt de
   agente não escala e arquivo dá pra atualizar em pedaço e auditar.
   Esqueleto fixo por área: `00-INDICE.md` + `conceitos/` `campos/`
   `configuracoes/` `fontes/` `formulas/` `casos/` `melhorias/`.
2. **O agente** (`.claude/agents/<area>.md`) — fino: sabe o *método* e sabe
   *onde buscar*, não carrega conteúdo.
3. **Ferramentas** — `fonte.py` já é uma; cada área herda.

### Sobre sub-especialistas
O usuário quer sub-especialistas dentro de cada especialista. Ressalva dada:
subagente do Claude Code começa sem contexto e não conversa de volta, então
só compensa como agente separado quando o assunto rende investigação inteira
sozinha. **Decisão: 1 agente por área + conhecimento particionado**, e
promover a sub-agente só o que provar que precisa.

### Decisões de ingestão
- Documentação chega por **link** (usuário passa a URL). ✅ **Confirmado em
  20/08/2026: a central de ajuda é pública e legível por WebFetch** —
  `https://arrecadacao.ajuda.betha.cloud/tributos/ajuda/executando` e afins.
  Não precisa salvar PDF.
- ✅ **Swagger do Service Layer ingerido em 20/08/2026** —
  `https://tributos.betha.cloud/service-layer-tributos/docs`, **também
  público**. Salvo em `FontesDeDados/swagger/tributos-openapi.json` (5,8 MB;
  716 rotas, 77 tags, 1.070 schemas). Doc em `FontesDeDados/swagger/README.md`.
  ⚠️ **Não substitui as fontes de dados** — é API HTTP externa, token,
  assíncrona, em lote, pra migração/sincronização; o `GET` consulta status de
  lote, não dados. Mas é a melhor fonte de **enums exatos** e de **modelo de
  dados/obrigatoriedade**. A conclusão "não existe escrita de transferência"
  continua valendo **para BFC-Script**.
- Agentes ficam **só neste projeto** (`.claude/agents/`), junto do
  conhecimento que leem.
- O bruto **fica guardado** — quando a síntese estiver errada, relê o original.
- Protocolo completo em `_CONHECIMENTO/_PROTOCOLO-DE-INGESTAO.md`.

### Estado
| Área | Estado |
|---|---|
| `ITBI-Transferencias/` | 🟢 base sólida — 7 documentos (corpus + central de ajuda: rotina na tela, solicitação/cartório, críticas, configurações, domínios, fontes, fórmulas) + agente `itbi-transferencias` |
| Imóveis, Econômicos, Dívida Ativa, Arrecadação, Receitas Diversas | ⬜ a fazer |
| Implantação (roteador) | ⬜ por último |

### Análise de IPTU já feita (não jogar fora)
Antes da mudança de rumo, foi feita análise empírica completa de
`Formulas/Imoveis - IPTU/` (264 arquivos → 62 fórmulas únicas, 33
municípios): anatomia em 8 fases, campos adicionais normalizados, aridades
reais de `criarReceita`/`comAFormaDePagamento*`, 86 siglas de receita, 125
números de tabela, temas por município. **O documento não chegou a ser
escrito** — o conteúdo vai virar `_CONHECIMENTO/Imoveis/` quando essa área
entrar na fila. Achado que vale registrar já:
`Utilitarios.existeLancamento(imovel, dataLancamento)` devolve objeto com
`debitoVencido` / `dividaAberta` / `dividaParcelada` / `dividaEmExecucao` /
`parcelamentoVencido` — é como 12/33 municípios fazem desconto por adimplência.
