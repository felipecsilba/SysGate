# Fontes de dados — Transferências e ITBI

> **Origem:** `FontesDeDados/catalogo_v2.json` (via `fonte.py`) + contagem de uso
> real em 180 scripts de `Scripts/` com ITBI/transferência no nome
> **Vale para:** todos os municípios

Este arquivo é um **mapa**, não um substituto do `fonte.py`. Antes de escrever
qualquer `.busca(...)`, rodar:

```bash
cd FontesDeDados
python fonte.py ver <fonte>      # 4 dimensões + esqueleto pronto
python fonte.py rel <fonte>      # relacionamentos
```

---

## As três entidades, e a diferença entre elas

Errar qual delas usar é o erro mais provável nesta área:

| Entidade | Fonte (nome BFC) | O que é |
|---|---|---|
| **Solicitação** de transferência | `solicitacaoTransferenciaImovel` | O pedido, antes de virar transferência. Tem parecer, anexo, comentário, retificação — é o fluxo de análise |
| **Transferência** efetivada | `transferenciasImoveis` | O ato consumado. É o que muda o proprietário |
| **Certidão** de ITBI | `certidaoITBI` | O documento emitido. Chaveado por `ano` + `nroDocumento` |

Regra prática: pergunta sobre **fila/análise/deferimento** → solicitação.
Pergunta sobre **quem é o dono agora / o que foi transferido** → transferência.
Pergunta sobre **o documento/guia emitida** → certidão.

---

## `transferenciasImoveis` — a transferência efetivada

`GET /transferencias-imoveis` — **sem parâmetro obrigatório**, 10 filtros.

Filtros: `id` · `codigo` · `codigoPorAno` · `anoCadastro` · `dataCadastro` ·
`dataTransferencia` · `dataHoraTransferencia` · `situacao` ·
`statusCertidaoITBI` · `tipoCobranca`
(os mesmos 10 servem em `ordem:`)

Retorno (11): os 10 acima + `processoGeral` + `observacao`.

Sub-rotas — **cada uma é um nome próprio no script**:

| Sub-rota | No script | Uso real |
|---|---|---|
| `/transferencias-imoveis/itens` | `transferenciasImoveis.itens` | 60 |
| `/transferencias-imoveis/compra` | `transferenciasImoveis.compra` | 48 |
| `/transferencias-imoveis/venda` | `transferenciasImoveis.venda` | 21 |
| `/transferencias-imoveis/{id}/processos` | `transferenciaImoveis.processos` | 19 |

⚠️ Repare no **singular** em `transferenciaImoveis.processos` contra o plural
nas outras. Não é erro de digitação da base — está assim no catálogo. Conferir
no editor antes de usar.

**`itens` é onde está a carne**: um cabeçalho de transferência pode ter N
imóveis; comprador, vendedor e valores vivem em `compra`/`venda`/`itens`,
não no cabeçalho.

---

## `solicitacaoTransferenciaImovel` — o pedido

`GET /solicitacoes-transferencias-imoveis` e 8 sub-rotas:

| Sub-rota | No script |
|---|---|
| `/itens` | `solicitacaoTransferenciaImovel.itens` |
| `/compras` | `solicitacaoTransferenciaImovel.compras` |
| `/vendas` | `solicitacaoTransferenciaImovel.vendas` |
| `/pareceres` | `solicitacaoTransferenciaImovel.pareceres` |
| `/anexos`, `/comentarios`, `/movimentacoes` | `solicitacaoTransferenciaImovel` |
| `/retificacoes`, `/{idSolicitacao}/retificacoes` | `solicitacaoTransferenciaImovel` |

**Única operação de escrita da área inteira:**
`POST /solicitacoes-transferencias/indeferir/{idTransferenciaImovel}` →
`solicitacaoTransferencia.indefere`, com `idTransferenciaImovel` obrigatório.

Ou seja: **não existe fonte pra criar, alterar ou excluir transferência por
Script.** Só dá pra ler, e indeferir solicitação. Automação que "corrige
transferência em lote" não é possível por essa via — tem que ser na tela.

> **Nuance importante (2026-08-20).** O **Service Layer** (Swagger) *tem*
> POST/PUT/PATCH/DELETE de `transferenciaImoveis` e de toda a cadeia. Mas é
> outra coisa: API HTTP externa, com token, assíncrona e em lote, feita pra
> **migração e sincronização** — não é chamável como fonte de dados de dentro
> de um Script, e o `GET` de lá consulta o *status do lote*, não os dados.
> A frase acima continua valendo **para BFC-Script**. Ver
> `../../../FontesDeDados/swagger/README.md`.
>
> E **solicitação de transferência não existe no Service Layer** — zero rotas.
> Ela só vive nas fontes de dados e na tela.

---

## `certidaoITBI` — o documento

Todas as 8 operações exigem **`ano` + `nroDocumento`** (confirmado na tela do
sistema, ver `../../../CONTEXTO.md`). Sem esses dois, não busca.

| Sub-rota | No script |
|---|---|
| `/certidoes-itbi/{ano}/{nroDocumento}` | `certidaoITBI` |
| `.../imoveis` | `certidaoITBI.imoveis` |
| `.../itens` | `certidaoITBI.itens` |
| `.../item/{idItem}/vendas` | `certidaoITBI.item.vendas` |
| `.../{idImovel}/vendas` | `certidaoITBI.vendas` |
| `.../{idImovel}/processos` | `certidaoITBI.processos` |
| `.../processosImovelRural` | `certidaoITBI.processosImovelRural` |
| `.../{idVenda}/detalhes` | `certidaoITBI` |

É a fonte das **Fontes Dinâmicas de certidão/guia de ITBI** — o padrão de
relatório mais repetido da área (dezenas de arquivos em `Scripts/Fontes Dinamicas/`).

---

## Fontes de apoio que quase sempre entram junto

Contagem nos 180 scripts da área:

| Fonte | Usos | Pra quê |
|---|---|---|
| `contribuinte.enderecos` | 49 | Endereço de comprador/vendedor na certidão |
| `contribuinte.telefones` | 49 | Idem |
| `imoveis` | 39 | Dados cadastrais do imóvel transferido |
| `imovel.camposAdicionais` | 38 | Valor venal, área — o que o IPTU gravou |
| `debitos` | 32 | Verificar pendência antes de liberar transferência |
| `debitos.receitas` | 12 | Detalhar o débito |
| `emissaoGuias` | 10 | Gerar a guia de pagamento do ITBI |
| `cartorios` | — | `GET /cartorios` → `cartorios` |

---

## Configuração da área

`GET /configuracoes/solicitacao-transferencia` e
`GET /configuracoes/transferencia-imoveis` → `configuracaoSolicitacaoTransferencia`

É onde ficam os parâmetros que mudam o comportamento do fluxo.
**Ainda não documentado campo a campo** — pendência, ver `../00-INDICE.md`.

---

## Lacuna conhecida

Os enums `SituacaoTransfImoveis`, `TipoCobrancaTransfImoveis` e
`SituacaoCertidaoITBI` aparecem no schema **só pelo nome** — os valores
possíveis não vieram no export. Sem eles não dá pra filtrar por situação com
segurança. Precisa da tela ou da central de ajuda.
