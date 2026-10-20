# Fontes de Dados — BFC-Script / Betha Tributos

Catálogo das fontes de dados que os **Scripts** consomem
(`Dados.tributos.v2.*`). Fórmula não usa fontes — ver
`../_BIBLIOTECA/Formula vs Script - o que cada uma aceita.md`.

## Comece por aqui

```bash
python fonte.py ver <fonte>              # as 4 dimensões + esqueleto de código pronto
python fonte.py campo <termo>            # onde esse campo existe (filtro? param? retorno?)
python fonte.py rel <fonte>              # com quais fontes se relaciona e por qual campo
python fonte.py buscar <termo> [natureza]# procura fonte; natureza = leitura|criacao|alteracao|exclusao
python fonte.py obrigatorios             # todas que exigem parâmetro obrigatório
python fonte.py escrita                  # tudo que NÃO é consulta (cria/altera/exclui)
```

Aceita tanto o nome do catálogo quanto o nome do editor:
`fonte.py ver certidaoNegativa` e `fonte.py ver certidoes-negativas` dão o mesmo.

## Natureza da operação

O sufixo da operação e o verbo HTTP indicam o que ela faz:

| Natureza | Padrão | Qtd | O que faz |
|---|---|---|---|
| 🔍 **LEITURA** | `.busca` · GET | 423 | consulta, não altera nada |
| ➕ **CRIAÇÃO** | `.cria` · POST | 51 | insere |
| ✏️ **ALTERAÇÃO** | `.altera`/`.preenche` · PUT | 42 | modifica |
| 🗑️ **EXCLUSÃO** | `.exclui` · DELETE | 58 | remove |

Duas pegadinhas:

1. **16 operações `busca` usam POST**, não GET (provavelmente filtro grande
   demais pra querystring). Continuam sendo leitura — a classificação olha o
   nome da operação, não só o verbo.
2. **Mesmo path serve leitura e escrita, com nomes diferentes no script.**
   `/imoveis/campos-adicionais` é GET e POST; no editor:
   - leitura → `imovel.camposAdicionais` (plural)
   - gravação → `imovel.campoAdicional` (singular)

   O padrão plural=leitura / singular=escrita se repete em contribuinte
   (`contribuinte.camposAdicionais` x `contribuinte.campoAdicional`).

## ⚠ O nome no catálogo NÃO é o nome no editor

O catálogo exportado nomeia as fontes pela **rota REST**; o editor da Betha
usa outro nome. Não dá pra usar o nome do catálogo direto no script.

| catálogo (REST) | no script (BFC) |
|---|---|
| `certidoes-negativas` | `certidaoNegativa` |
| `certidoes-itbi` | `certidaoITBI` |
| `Números de baixa` | `numerosBaixa` |
| `Emissão de guias` | `emissaoGuias` |
| `PlantasValores` | `plantaValores` |
| `CalculoTributarioController` | `calculosTributarios` |

E **cada sub-rota vira um nome próprio** — a mesma fonte REST pode ter vários:

| path | no script |
|---|---|
| `/indexadores` | `indexadores` |
| `/indexadores/movimentacoes` | `indexadores.movimentacoes` |
| `/imoveis` | `imoveis` |
| `/imoveis/{idImovel}/testadas` | `imovel.testadas` |
| `/imoveis/{idImovel}/campos-adicionais` | `imovel.camposAdicionais` |

Esse nome **não existe no export** — foi extraído de ~18 mil chamadas reais
nos scripts em produção (`_extrair_nomes_bfc.py` → `nomes_bfc.json`) e casado
com o catálogo por path (`_mapear_bfc_rest.py` → `mapa_bfc_rest.json`).

`fonte.py` já mostra o nome certo e o usa no esqueleto. Quando não tem
confirmação no corpus, ele **avisa** em vez de chutar — nome errado quebra o
script. Cobertura: 176 das 574 operações têm nome confirmado.

## As 4 dimensões de uma fonte

Toda fonte tem 4 coisas distintas — misturá-las gera código que não roda:

| Dimensão | Vai no script como | O que é |
|---|---|---|
| **Campos de retorno** | `campos:` | O que vem no resultado da busca |
| **Filtros** | `criterio:` | Por quais campos dá pra restringir a busca |
| **Ordenação** | `ordem:` | Por quais campos dá pra ordenar |
| **Parâmetros** | `parametros:` | Valores que a fonte exige/aceita à parte do critério |

Todo campo vem com **tipo** (`String`, `Long`, `BigDecimal`, `LocalDate`,
enums...) — 100% de cobertura — e **descrição** quando a API fornece (78%).

**Nem todo campo de retorno é filtrável.** Ex.: `certidoes-negativas`
retorna 405 campos mas aceita **zero** `criterio:` — só os 4 parâmetros dela.

**Parâmetro do path é OBRIGATÓRIO.** Quando o path tem `{placeholder}`
(ex.: `/imoveis/{idImovel}/testadas`), aquele valor é exigido — sem ele a
chamada falha. São 207 das 574 operações. Lista completa em
`Fontes - Parametros Obrigatorios.md`.

## Arquivos

| Arquivo | O que é |
|---|---|
| `fonte.py` | **Ferramenta principal.** Consulta as 4 dimensões, relacionamentos e gera esqueleto de código |
| `catalogo_v2.json` | Catálogo com as 4 dimensões separadas — base de tudo |
| `_construir_catalogo_v2.py` | Reconstrói `catalogo_v2.json` a partir de `raw/`. Rodar de novo se reextrair as fontes |
| `nomes_bfc.json` | Nomes de fonte usados no BFC-Script, extraídos do corpus real |
| `_extrair_nomes_bfc.py` | Gera o acima varrendo `Scripts/` e `Formulas/` |
| `mapa_bfc_rest.json` | Liga nome REST ↔ nome BFC, por operação |
| `_mapear_bfc_rest.py` | Gera o acima |
| `_validar.py` | **Teste de regressão.** Confere a ferramenta contra fatos verificados na tela do sistema e contra scripts em produção. Rodar após mexer no mapeamento |
| `Fontes - Parametros Obrigatorios.md` | Referência rápida: quem exige parâmetro e quem não aceita `criterio:` |
| `raw/` | **Fonte de verdade.** Export bruto da API, 574 fontes |
| `fontes_catalog_completo.json` | Consolidação antiga — ainda usada como referência secundária, mas tem defeitos (ver `_obsoleto/`) |
| `fontes_tabela_completa.csv` | Índice achatado, bom pra grep rápido |
| `ids_575_fontes.json` | Lista de IDs do export |
| `_obsoleto/` | Artefatos aposentados + explicação do que estava errado em cada um |

## Cobertura e limitações conhecidas

- **574 fontes extraídas**, de 575 IDs listados. Uma nunca foi extraída:
  `679a207a97f86d7606dc4904`.
- O sistema hoje pode ter **~589 fontes** — ou seja, este export está
  possivelmente desatualizado. Reextrair com `Desktop/ProjetoX/Extrator`
  antes de concluir que uma fonte "não existe".
- O mapa de relacionamentos resolve ~80% das referências. As não resolvidas
  são majoritariamente tipos/enums que não têm fonte própria (`TipoCredito`,
  `Template`, `Grupo`) — comportamento esperado, não é falha.

## Regra descoberta no schema (importante)

No export bruto, `filter` e `sort` só aparecem quando valem **`false`**.
São exceções negativas: **o padrão é que o campo É filtrável e ordenável**.
Foi por inverter isso que o catálogo antigo marcou campos filtráveis como
não-filtráveis — e foi essa a origem do erro do `idEconomico`.
