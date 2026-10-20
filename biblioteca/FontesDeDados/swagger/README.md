# Swagger — Service Layer do Tributos

> **Origem:** https://tributos.betha.cloud/service-layer-tributos/docs
> (baixado em 2026-08-20 → `tributos-openapi.json`, 5,8 MB)
> **Acesso:** o **spec é público** — a URL devolve o JSON cru, sem login.
> As **chamadas à API** exigem token (respostas 401 documentadas).

OpenAPI 3.0.1 · **716 rotas · 77 tags · 1.070 schemas**
Servidor: `https://tributos.betha.cloud/service-layer-tributos/api`

---

## ⚠️ Isto NÃO é a mesma coisa que as fontes de dados

Erro fácil e caro. São dois mundos:

| | **Fontes de dados** (`FontesDeDados/`) | **Service Layer** (este Swagger) |
|---|---|---|
| Quem consome | **BFC-Script**, via `Dados.tributos.v2.*` | Sistema externo, via HTTP + token |
| Pra que serve | Consultar e gravar de dentro do sistema | **Migração e sincronização** entre sistemas |
| Como o GET funciona | `.busca(criterio:, campos:, ordem:)` — consulta de verdade | `GET /{recurso}/{id}` — **consulta o status de um lote**, não os dados |
| Escrita | Síncrona, poucas fontes | **Assíncrona, em lote**: devolve `idLote` pra acompanhar |
| Cobertura | 574 operações | 716 rotas, CRUD quase completo |

**Consequência prática:** o Swagger ter `PUT /api/transferenciaImoveis`
**não** significa que dá pra alterar transferência de dentro de um Script. A
conclusão anterior — *"não existe fonte pra criar/alterar/excluir
transferência"* — **continua valendo pro BFC-Script**. O que o Swagger abre é
outro caminho: integração externa, para migração/carga.

**Não existe GET de consulta por filtro aqui.** Pra "buscar dados", o caminho
continua sendo `fonte.py` + fontes de dados.

## Mas o Swagger é a melhor fonte de duas coisas

1. **Enums exatos.** O export das fontes trazia o enum só pelo nome
   (`SituacaoTransfImoveis`), sem os valores. Aqui vêm os valores literais —
   é o que vai no `criterio:`. Foi assim que a pendência nº 1 do ITBI caiu.
2. **Modelo de dados e obrigatoriedade.** Quais campos existem em cada
   entidade, quais são obrigatórios (`*`), e como as entidades se ligam por
   `idXxx`.

---

## O padrão de toda rota

Cada recurso expõe cinco operações, quase sem exceção
(358 GET · 355 PUT · 355 POST · 354 PATCH · 354 DELETE):

```
GET    /api/{recurso}/{id}   consulta o LOTE pelo idLote
POST   /api/{recurso}        cria em lote      → devolve idLote
PUT    /api/{recurso}        atualiza completo → devolve idLote
PATCH  /api/{recurso}        atualiza parcial  → devolve idLote
DELETE /api/{recurso}        remove em lote    → devolve idLote
```

> A descrição oficial do PATCH está **errada no próprio spec** — repete o texto
> do PUT ("todos os objetos devem conter todas as propriedades"). Pelo nome e
> pelos schemas, PATCH é parcial. Confirmar antes de depender disso.

Schemas por recurso: `{recurso}Post`, `{recurso}Update`, `{recurso}Delete`.
Todo payload carrega `idIntegracao` — o identificador do registro na origem,
que é como a migração amarra os dois lados.

---

## As 77 tags — mapa por área

Útil pro projeto de especialistas: dá o recorte de áreas do sistema.

| Área | Tags |
|---|---|
| **Imóveis** | `imoveis` (31) · `plantasValores` · `desmembramentos` · `remembramentos` (14) · `habite-se` · `obras` (28) · `pontosNotaveis` · `enderecos` (46) |
| **ITBI/Transferências** | `transferenciaImoveis` (12) · `certidoes` · `motivos` · `cartorios` |
| **Econômicos** | `economicos` (39) · `atividadesEconomicas` (10) · `alvaras` · `declaracoes` · `horarios` · `materiaisServicos` · `qualificacoes` · `referentes` |
| **Contribuintes** | `pessoas` (41) · `contribuintes` (26) |
| **Dívida Ativa** | `dividas` (12) · `manutencoes` (20) · `anistias` · `livros` · `simulacoes` · `dividasMovtosReceitas` |
| **Arrecadação** | `guias` (20) · `baixaAutomatica` · `baixaManual` · `pagamentos` · `compensacoes` · `restituicoes` · `saldos` · `convenios` · `bancos` · `agenciasBancarias` · `limitesArrecadacao` |
| **Cálculo/Lançamento** | `calculos` (14) · `lancamentos` · `remissoes` · `parcelamentos` (20) · `termosParcelamento` · `creditosTributarios` · `receitas` (16) · `beneficiosFiscais` · `indexadores` |
| **Configuração** | `configuracoes` (46) — inclui `configTransfImoveis`, `configTransfImoMotivos`, `configTransfImoReceitas`, `configInscDividaAtiva`, `configParcelamentos`, `configNotasAvulsas`… |
| **Campos adicionais** | `agrupamentos` · `camposAdicionais` · `tabelas` (12) |
| **Outros** | `contribuicoesMelhorias` (22) · `notasAvulsas` · `notificacoes` · `integracoesContabeis` (16) · `atos` · `documentos` · `Integração Simam` (56) · `irrf` · `feriados` · `competencias` · `encerramentoMensal*` |

---

## Lacunas confirmadas

- **Solicitação de transferência não está aqui.** Zero rotas com
  `solicitacao`/`protocolo`. O fluxo do Protocolo (Cloud) não é migrável por
  esta API — só existe nas fontes de dados
  (`solicitacaoTransferenciaImovel`) e na tela.
- **`configTransfImoMotivos` não tem campo de benefício**, embora a tela tenha
  a coluna *Benefício* por motivo. Onde ele é gravado, ainda não se sabe.

---

## Como consultar

```bash
cd FontesDeDados/swagger
python -c "
import json;d=json.load(open('tributos-openapi.json',encoding='utf8'))
print([p for p in d['paths'] if 'imovel' in p.lower()])"
```

Pra achar enum de um campo, procurar no schema `{recurso}Post` do recurso.

## Rebaixar o spec

```bash
curl -sSL -o FontesDeDados/swagger/tributos-openapi.json \
  https://tributos.betha.cloud/service-layer-tributos/docs
```

## A fazer

- [ ] Cruzar as 716 rotas com as 574 fontes: as **50 fontes BFC sem
      correspondência** no catálogo (`guiasEmitidas`, `movimentacoesMEI`,
      `simam.*`…) podem estar explicadas aqui — a tag *Integração Simam* tem
      56 rotas.
- [ ] Extrair um dicionário global de enums do spec e ligar ao `fonte.py`
      (hoje ele mostra o nome do enum sem os valores).
