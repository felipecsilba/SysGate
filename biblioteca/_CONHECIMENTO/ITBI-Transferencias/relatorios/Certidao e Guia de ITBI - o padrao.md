# Certidão e guia de ITBI — o padrão do relatório

> **Origem:** contagem em `Relatorios/` — **94 pastas** de relatório de
> ITBI/transferência, **22 municípios**, com `fonte_dinamica.txt`,
> `parametros.txt` e `relatorio_info.txt` de cada uma
> **Vale para:** o padrão; nomes de campo adicional e layout são de cada município

É **o entregável mais repetido da área**. Todo município implantado ganha ao
menos uma certidão de ITBI, e quase sempre também uma guia.

| Tipo | Quantos |
|---|---|
| **Certidão de ITBI** | 46 |
| **Guia / DAM / Carnê** | 25 |
| **Listagem / Relação** | 15 |
| Outros (transferência de dívidas, resumo de pagamentos) | 8 |

Municípios com mais variantes: Divinópolis (16), Lagoa Santa (10), São João
Batista (7), Criciúma (6), Itaúna (6).

---

## A pasta é atômica — quatro arquivos

```
Relatorios/<Cidade> - <Nome do relatório>/
  <Nome>.jrxml           layout Jasper           (94/94)
  fonte_dinamica.txt     o Script que busca os dados (91/94)
  parametros.txt         os parâmetros            (94/94)
  relatorio_info.txt     metadados do Studio      (94/94)
```

**Nunca separar.** Sem os parâmetros cadastrados, o relatório não roda no
Studio de Extensões — eles são cadastrados **manualmente** lá.

3 relatórios não têm fonte dinâmica: usam fonte nativa do sistema.

### `relatorio_info.txt` — o campo que importa

**`chaveNatureza`** amarra o relatório ao ponto do sistema que o emite:

| Natureza | Qtd | Onde é usada |
|---|---|---|
| `ITBI` | 39 | Emissão da certidão, na tela de transferência |
| `GUIA_EMISSAO` | 22 | Emissão de guia de pagamento |
| `GUIA_PAGAMENTO_UNIFICADO` | 2 | Guia unificada |
| `GERAIS` | 2 | Livre |

> Natureza errada = o relatório existe mas **não aparece** onde deveria. É a
> causa nº 1 de "cadastrei o relatório e ele não aparece pra emitir".

---

## Dois contratos de parâmetro, e só

### `ano` + `nroDocumento` — 43 relatórios (a certidão)

Ambos **inteiros e obrigatórios**. Não é escolha do implantador: são
exatamente os dois parâmetros de path que a fonte `certidaoITBI` exige
(`/certidoes-itbi/{ano}/{nroDocumento}`). O sistema passa esses dois ao emitir
a certidão a partir da transferência.

### `protocolo` — 22 relatórios (a guia)

Parâmetro único. É o contrato de `GUIA_EMISSAO`.

### O resto — listagens

Filtros de tela, opcionais: `imovel`, `comprador`, `vendedor`, `situacao`,
`tipo`, `nroItbi`, `tipoImovel`, `dataInicio`/`dataFim`, `bairro`.

> Ao criar relatório novo: **o par `ano`+`nroDocumento` para certidão e
> `protocolo` para guia não são negociáveis** — mudar quebra a emissão.

---

## Duas estratégias de montagem — e a maioria não usa a fonte pronta

| Estratégia | Relatórios |
|---|---|
| Monta da árvore `transferenciasImoveis.*` | **30** |
| `certidaoITBI` **+** `transferenciasImoveis.*` | **21** |
| `certidaoITBI` + `transferenciasImoveis` + `solicitacao` | 13 |
| `transferenciasImoveis` + `solicitacao` | 13 |
| Só `certidaoITBI` | 9 |
| Só solicitação / nenhuma dessas | 5 |

**Leitura:** `certidaoITBI` é a fonte "pronta" — 405 campos já cruzados — mas
só **9 relatórios** se bastam com ela. **Os outros 34 que a usam ainda
precisam descer na árvore** de transferência, e 30 nem a usam.

Motivo provável: `certidaoITBI` **aceita zero `criterio:`** (confirmado na
tela — ver `../../../CONTEXTO.md`). Ela entrega o que entrega; qualquer recorte
diferente obriga a montar à mão.

**Regra prática:** comece por `certidaoITBI`; se faltar campo ou precisar
filtrar, desça a árvore.

---

## As fontes, e em quantos municípios

| Fonte | Arq. | Mun. | Papel |
|---|---|---|---|
| `imovel.camposAdicionais` | 32 | 10 | Área, valor venal, fração ideal — o que o IPTU gravou |
| `transferenciasImoveis.compra` | 26 | **14** | Compradores e valores — a mais espalhada |
| `contribuinte.enderecos` | 24 | 9 | Endereço de comprador/vendedor |
| `contribuinte.telefones` | 24 | 9 | Telefone |
| `transferenciasImoveis` | 22 | 8 | Cabeçalho |
| `transferenciasImoveis.itens` | 20 | **13** | Por imóvel |
| `imoveis` | 20 | 9 | Cadastro do imóvel |
| `certidaoITBI.item.vendas` / `.itens` / `.vendas.detalhes` / `.processos` | 15/13/11/10 | 6 | Sub-rotas da certidão |
| `debitos` | 14 | 6 | Pendência do imóvel na certidão |
| `transferenciasImoveis.venda` | 13 | 9 | Vendedores |
| `solicitacaoTransferenciaImovel.*` | 11+7+6 | 2 | Só onde o Protocolo é usado |
| `tabelaAuxiliar.registros` | 6 | 2 | Texto/parametrização municipal |

---

## Os critérios que se repetem

```groovy
criterio: "transferenciaImovel.id = ${idTransferenciaImoveis}"   // 35 usos — desce a árvore
criterio: "principal = 'SIM'"                                     // 51 usos — endereço principal
criterio: "principal = 'SIM' or principal = 'NAO'"                // 20 usos — todos
criterio: "campoAdicional.titulo='${campo}'"                      // 12 usos — campo adicional por nome
criterio: "situacao = 'ABERTO' and dtVencimento < '...'"          //  6 usos — débito vencido
```

⚠️ **`principal = 'SIM' or principal = 'NAO'`** parece redundante — e é o
idioma da base pra dizer "traga todos", já que o padrão da fonte pode filtrar
só o principal. Aparece em 20 arquivos; não é engano isolado.

⚠️ **O filtro chama `transferenciaImovel` (singular)** mesmo quando a fonte é
`transferenciasImoveis` (plural). Confirmar sempre com
`python fonte.py ver <fonte>`.

---

## O esqueleto do `Esquema`

Todo relatório declara um `Esquema` — o contrato com o `.jrxml`. Campos por
frequência (94 relatórios):

**Do imóvel:** `codigoImovel` (49) · `inscricaoImobiliaria` (55) ·
`matricula` (56) · `quadra` (55) · `lote` (54) · `logradouro` (53) ·
`numero` (39) · `bairro` (58) · `cep` (58) · `cidade` (56) · `uf` (45) ·
`distrito` (31) · `loteamento` (31) · `inscricaoIncra` (30) · `tipoImovel` (26)

**Das partes:** `nome` (54) · `cpfCnpj` (61) · `telefone` (50) ·
`compradores` (33) · `vendedores` (33)

**Do negócio:** `valorFinanciado` (63) · `valorITBI`/`valorItbi` (37+33) ·
`valorBenfeitorias` (34) · `valorTerras` (31) · `valorDeclarado` (28) ·
`valorOutros` (27) · `percVendido` (42) · `aliquotaOutros` (30) ·
`aliquotaBenfeitoria` (27)

**Da transferência:** `idTransferencia` (46) · `anoTransferencia` (26) ·
`comentario` (48) · `descricao` (36)

> `valorFinanciado` ser o campo mais comum (63) diz muito: **financiamento é
> a informação que a certidão de ITBI mais precisa carregar** — é o que
> justifica a alíquota diferenciada.

⚠️ **`valorITBI` × `valorItbi`** — as duas grafias convivem (37 e 33). É
literal e casa com o `.jrxml`. Ao adaptar de outro município, conferir a
grafia dos dois lados.

---

## Modelo mínimo de fonte dinâmica de certidão

```groovy
DadosPrincipal = Dados.tributos.v2;

esquema = [
  nroDocumento:    Esquema.inteiro,
  idTransferencia: Esquema.inteiro,
  anoTransferencia: Esquema.inteiro,
  dtEmissao:       Esquema.data,
  comentario:      Esquema.caracter,
  percVendido:     Esquema.caracter,
  valorDeclarado:  Esquema.numero,
  valorFinanciado: Esquema.numero,
  valorBenfeitorias: Esquema.numero,
  valorItbi:       Esquema.numero,
  imovel: Esquema.objeto([
    codigoImovel:         Esquema.inteiro,
    inscricaoImobiliaria: Esquema.caracter,
    matricula:            Esquema.caracter,
    logradouro:           Esquema.caracter,
    numero:               Esquema.caracter,
    quadra:               Esquema.caracter,
    lote:                 Esquema.caracter,
    bairro:               Esquema.caracter,
    cep:                  Esquema.caracter
  ]),
  vendedores:  Esquema.lista(Esquema.objeto([ nome: Esquema.caracter, cpfCnpj: Esquema.caracter ])),
  compradores: Esquema.lista(Esquema.objeto([ nome: Esquema.caracter, cpfCnpj: Esquema.caracter ]))
];

// parâmetros: ano e nroDocumento (inteiros, obrigatórios)
// 1. certidaoITBI.busca(parametros: [ano: ano, nroDocumento: nroDocumento])
// 2. faltou campo? desça:
//    transferenciasImoveis.itens → .venda → .compra
//    criterio: "transferenciaImovel.id = ${idTransferenciaImoveis}"
// 3. campo adicional: imovel.camposAdicionais
//    criterio: "campoAdicional.titulo='${campo}'"
// 4. endereço/telefone: contribuinte.enderecos / .telefones
//    criterio: "principal = 'SIM'"
```

Estrutura de saída em três níveis (imóvel → vendedores → compradores) é o
padrão — espelha a cadeia real de dados. Ver
`../campos/Modelo de Dados e Enums (Swagger).md`.

---

## Checklist de relatório de ITBI novo

- [ ] `chaveNatureza` correta (`ITBI` para certidão, `GUIA_EMISSAO` para guia)
- [ ] Parâmetros cadastrados **manualmente no Studio** — `ano`+`nroDocumento`
      (certidão) ou `protocolo` (guia), inteiros e obrigatórios
- [ ] Tentou `certidaoITBI` antes de montar à mão?
- [ ] Nomes de campo adicional conferidos **no município destino**
- [ ] Grafia dos campos do `Esquema` batendo com o `.jrxml`
- [ ] Endereço: `principal = 'SIM'` ou todos?
- [ ] Testado com transferência de **vários imóveis**, **vários vendedores** e
      **venda parcial** — os três níveis
- [ ] Testado com transferência **sem cobrança** (ITBI zerado)
- [ ] A pasta foi mantida atômica (4 arquivos juntos)?
