# Domínios e situações — transferência, ITBI e solicitação

> **Origem:** central de ajuda Betha —
> https://arrecadacao.ajuda.betha.cloud/tributos/ajuda/executando#transferência-de-imóveis
> (lido em 2026-08-20)
> **Vale para:** todos os municípios — são domínios do sistema, não cadastro municipal

Resolve boa parte da pendência nº 1 do índice (os enums que vieram no schema
só pelo nome).

---

## Situação da transferência — `SituacaoTransfImoveis`

Aparece como filtro e como campo de retorno em `transferenciasImoveis`.

| Situação | Quando entra |
|---|---|
| **Aberto** | Cadastro gravado, mas ainda **não** gerou cálculo do imposto nem transferiu o imóvel |
| **Pendente** | Cobrança por **imóvel** ou por **comprador** |
| **Calculada** | ITBI calculado (aparece na listagem da tela; certidão só pode ser emitida a partir daqui) |
| **Cancelada** | Cadastro cancelado. **Pode ser reaberto**, desde que não existam cadastros posteriores para os imóveis envolvidos |
| **Encerrado** | Transferência concretizada — seja por pagamento do imposto, seja por transferência sem geração de ITBI |

> ✅ **Resolvido pelo Swagger (2026-08-20).** Os valores reais da API são
> `ABERTA` · `CALCULADA` · `CANCELADA` · `ENCERRADA` · `PENDENTE` — femininos
> e maiúsculos. Os nomes desta tabela são **rótulos de tela**, não servem em
> `criterio:`. Ver `Modelo de Dados e Enums (Swagger).md`.

Regra prática: **certidão de ITBI só se emite para transferência calculada ou
encerrada.**

---

## Forma de cobrança — `TipoCobrancaTransfImoveis`

Definida na guia *Informar dados* do cadastro. Determina **quantos lançamentos**
o ITBI vai gerar:

| Opção | Lançamentos gerados |
|---|---|
| **Por imóvel** | Um por imóvel incluído na transferência |
| **Por transferência** | **Um só**, com o valor total. Exige informar o contribuinte **Pagador** (apenas um) |
| **Por venda** | Um por comprador — usado quando há mais de um comprador |
| **Sem cobrança** | Nenhum. Só transfere, sem incidência de imposto |

Valores na API: `IMOVEL` · `TRANSFERENCIA` · `VENDA` · `SEM_COBRANCA`.

⚠️ **Sem cobrança:** a ajuda alerta explicitamente — **não** preencher o valor
da compra no campo `Declarado`, senão gera valor de ITBI na certidão ou em tela.
É a pegadinha nº 1 dessa opção.

---

## Situação da solicitação de transferência

Fluxo do módulo **Protocolo (Cloud)**, onde cartório, proprietário ou comprador
abre o pedido. As abas da tela são as próprias situações:

```
Não analisada → Em análise → Aguardando resposta → Resposta recebida
                     ↓
              Deferida  |  Indeferida
```

| Situação | O que significa |
|---|---|
| **Não analisada** | Chegou e depende do usuário da entidade. Também é onde cai a solicitação que falhou numa crítica cadastral no deferimento automático |
| **Em análise** | Em tratamento. É aqui que se pode **ajustar valores** |
| **Aguardando resposta** | Questionamento enviado ao cartório |
| **Resposta recebida** | Cartório respondeu |
| **Deferida** | Gera o lançamento do imposto; habilita as abas *Lançamentos* e *Transferência* |
| **Indeferida** | Recusada — estornável pela aba Movimentações |

**Estorno:** dá pra voltar situação pela aba *Movimentações* → *Movimentar para*.
**Exceção que trava:** solicitação deferida cujo lançamento foi **pago**, ou
**inscrito em dívida ativa**, ou **vinculado a parcelamento** — o deferimento
não pode mais ser estornado.

---

## Tipo de venda

| Valor | Uso |
|---|---|
| **Total** | Preenche `% da venda` automaticamente com 100% |
| **Parcial** | Percentual informado. Importa quando o imóvel tem mais de um proprietário — o sistema passa a mostrar todos |

## Tipo de imóvel

`Urbano` · `Rural` — definido na guia *Definir imóveis*. Praticamente toda
configuração da rotina é separada por esses dois (créditos/receitas, alíquotas,
habilitação de solicitação).

## Responsável pelo pagamento

Campo **obrigatório** na configuração de solicitações. Valores vistos:
`Comprador`, `Vendedor` (aceita mais de um).

## Forma de geração do lançamento (solicitação)

| Opção | Comportamento |
|---|---|
| **Automaticamente** | Defere sozinho, cria a transferência e calcula o imposto, sem intervenção. Se houver pendência financeira ou cadastral, cai em *Não analisada* |
| **Após o deferimento da solicitação** | Tudo entra como *Não analisada*; só o deferimento manual gera transferência e cálculo |

---

## Campos com nomenclatura variável

- **"Outros"** — a descrição é renomeável em *Utilitários > Central de
  configurações > Transferência de imóveis*, campo **Alterar descrição de
  outros**. Ou seja, **o rótulo que aparece na tela do município pode não ser
  "Outros"**. Ao ler relatório ou script de um município, conferir.
- **Nomenclatura para quem recebe / quem vende o imóvel** — configurável por
  motivo (ex.: "adquirente"/"transmitente" em vez de "comprador"/"vendedor").
