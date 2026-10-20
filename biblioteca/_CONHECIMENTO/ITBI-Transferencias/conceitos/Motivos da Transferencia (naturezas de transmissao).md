# Motivos da transferência — as naturezas de transmissão

> **Origem:** print da tela `Utilitários > Central de configurações >
> Transferência de imóveis` (Felipe, 2026-08-20) + Swagger (`motivos`,
> `configTransfImoMotivos`) + central de ajuda
> **Confirmado em:** um ambiente real. **Não confirmado** que a lista 1–10 é
> semente padrão de toda implantação — tratar como "a lista usual"

O **motivo** é a natureza jurídica da transmissão. No sistema Betha ele não é
um enum fixo: é cadastro em `Administrando > Cadastros auxiliares > Motivos`,
com `tipoMotivo = TRANSFERENCIA_IMOVEIS`, e depois vinculado na configuração.

Fecha a pendência nº 2 do índice.

---

## A lista vista em ambiente real

| # | Motivo | Natureza |
|---|---|---|
| 1 | **Arrematação ou adjudicação em leilão** | Aquisição em hasta pública/judicial |
| 2 | **Cessão de direitos sobre imóveis** | Transfere o direito, não o registro |
| 3 | **Compra e venda** | O caso comum |
| 4 | **Dação em pagamento** | Imóvel quita uma dívida |
| 5 | **Permuta** | Troca de imóveis |
| 6 | **Promessa de compra e venda** | Contrato preliminar |
| 7 | **Remição** | Resgate do imóvel pelo devedor/interessado |
| 8 | **Torna ou reposição** | Diferença paga em partilha/divisão |
| 9 | **Transferência de posse** | Posse sem registro |
| 10 | **Doação** | Transmissão gratuita |

> Numeração e descrição são **do município**. Outro município pode ter outra
> lista, outra ordem, ou motivos adicionais (`+Motivo` na configuração).

---

## Por que o motivo é o campo mais consequente da tela

Cada motivo carrega, na configuração (`configTransfImoMotivos`):

| Item | Campo no Swagger | Efeito |
|---|---|---|
| Alíquota à vista | `percAliqAvista` | **Sobrepõe** a alíquota geral |
| Alíquota financiado | `percAliqFinanciada` | idem |
| Alíquota outros | `percAliqOutros` | idem |
| Alíquota benfeitoria | `percAliqBenfeitoria` | idem |
| Nomenclatura de quem compra / quem vende | `nomenclaturaCompra` / `nomenclaturaVenda` | Muda o rótulo na tela (ex.: "adquirente"/"transmitente") |
| Desconto (%) | *(via ajuda; ver nota)* | Aplicado automaticamente, alterável no ato |
| Benefício (isenção/imunidade) | *(sem campo no Service Layer)* | **Lançamento sai isento automaticamente** |

> **Nota de procedência (atualizada 2026-08-20).** O benefício vem do cadastro
> `Administrando > Cadastros auxiliares > Benefícios fiscais` e é vinculado ao
> motivo aqui, na coluna *Benefício* — confirmado pelo Felipe.
> Ver `../../_COMUM/Beneficios Fiscais.md`.
>
> ⚠️ Mas o schema `configTransfImoMotivos` do Service Layer **não tem campo de
> benefício** (só as 4 alíquotas e as nomenclaturas). Consequência prática:
> **migrar a configuração de motivos pela API não leva o benefício junto** —
> conferir na tela depois de migrar. O `Desconto (%)` também não está no
> schema; o desconto efetivamente aplicado é gravado no item, em
> `percentualDescontoItbi`.

**Regra de diagnóstico:** ITBI com valor inesperado (zerado, isento, alíquota
diferente) → **olhar o motivo escolhido antes da alíquota geral**.

---

## Motivos que exigem tratamento especial

### Arrematação ou adjudicação em leilão (nº 1)
O único que muda a **transferência de débitos e dívidas**. O item da
transferência tem `idArrematante`, `dtArrematacao`, `vlArrematacao` e
`obsArrematacao` — e é isso que a fórmula `ITBI_TRANSFERENCIA_CREDITOS` testa
pra cortar a dívida na data do arremate em vez de levar tudo (CTN art. 130,
parágrafo único).

Ver `../formulas/Tipos de Formula ITBI.md`.

### Cessão de direitos (nº 2) e Transferência de posse (nº 9)
São os casos em que **o cadastro muda de proprietário sem que o registro
mude** — e é exatamente por isso que existe a opção *"Vendedor é proprietário
do imóvel?" = Não*: quando o registro enfim mudar, o ITBI é devido, e o
vendedor a informar é o **antigo proprietário do registro**, não quem está no
cadastro.

Ver `Rotina de Transferencia de Imoveis (tela).md`.

### Promessa de compra e venda (nº 6)
Contrato preliminar. Cuidado com dupla cobrança: promessa e depois a compra e
venda definitiva do mesmo imóvel. Regra é municipal — perguntar.

### Doação (nº 10) e Torna/reposição (nº 8)
Doação pura costuma ser **ITCMD (estadual), não ITBI** — mas está na lista
porque o município registra a movimentação cadastral. Torna em partilha é o
caso clássico em que só a **diferença** é tributável.
⚠️ Isso é entendimento tributário geral, **não confirmado** na documentação
Betha nem no corpus. Confirmar com a legislação do município.

---

## Perguntas pra um município novo

- [ ] Quais motivos estão cadastrados, e com que numeração?
- [ ] Algum motivo tem alíquota própria diferente da geral?
- [ ] Algum motivo tem desconto configurado?
- [ ] Algum motivo tem benefício de isenção/imunidade vinculado?
- [ ] A nomenclatura foi customizada (adquirente/transmitente)?
- [ ] Doação é tratada como não incidência de ITBI aqui?
- [ ] Promessa de compra e venda gera ITBI, ou só a definitiva?
- [ ] Como arrematação trata a dívida anterior?
