# Configuração da rotina de transferência

> **Origem:** central de ajuda Betha —
> https://arrecadacao.ajuda.betha.cloud/tributos/ajuda/executando#transferência-de-imóveis
> (lido em 2026-08-20)
> **Vale para:** todos os municípios (os *parâmetros*; os *valores* são de cada um)

**Onde:** `Utilitários > Central de configurações > Transferência de imóveis`

Três guias: **Transferência** · **Estimativa do valor venal** ·
**Solicitações de transferência**.

A ajuda diz que a parametrização "já estará pronta após a implantação" — na
prática, é o que o implantador configura e o primeiro lugar a olhar quando o
ITBI sai errado.

---

## Guia 1 — Transferência

### Vencimento do ITBI

| Parâmetro | Efeito |
|---|---|
| `Definir vencimento fixo para o ITBI` | Liga o campo **Dia/Mês**. A data vira sugestão na tela de cadastro, **alterável** pelo usuário. Ex.: dia 20, mês 12 → sugere 20/12 do exercício atual |
| `Nº dias para o vencimento do ITBI` | Alternativa ao fixo: prazo em dias a partir do cadastro |
| `Contar dias como` | **Dias corridos** ou **dias úteis** |

### Chaves de comportamento (liga/desliga)

| Parâmetro | O que muda |
|---|---|
| `Transferir automaticamente após o pagamento do ITBI` | Pago o imposto, o sistema troca o proprietário sozinho. Desligado = troca manual |
| `Transferir automaticamente transferências isentas após salvar o registro` | Isenta não espera pagamento nenhum |
| `Cadastrar imóveis rurais` | Habilita o rural na rotina |
| `Alterar descrição de outros` | Renomeia o campo "Outros" — **muda o rótulo na tela** |
| `Permitir alterar um valor declarado` | Se o usuário pode mexer no declarado |
| `Permitir que benfeitoria faça parte do valor declarado` | Entra ou não na base |
| `Reiniciar número sequencial a cada novo exercício` | Numeração do cadastro |
| `Alertar se valor estimado em relação ao declarado for maior que R$` | Alerta de subavaliação, por valor |

### Créditos e receitas

Vincula, **separadamente para Urbano e Rural**: crédito tributário, receita e
taxa(s). Sem isso o lançamento não tem onde cair.

### Alíquotas

Quatro percentuais, também por tipo de imóvel:

| | À vista (%) | Financiado (%) | Outros (%) | Benfeitoria (%) |
|---|---|---|---|---|
| Urbano | ex. 2,0000 | ex. 1,0000 | ex. 2,0000 | ex. 5,0000 |
| Rural | ex. 2,0000 | ex. 1,0000 | ex. 2,0000 | ex. 5,0000 |

> Os números acima são **exemplo da documentação**, não padrão. Cada município
> tem os seus, conforme a lei local.

**O ITBI não tem uma alíquota — tem quatro**, aplicadas sobre partes diferentes
do valor: o que é à vista, o que é financiado, "outros", e benfeitorias. Um
ITBI "errado" costuma ser uma dessas quatro mal configurada, não a base.

### Motivos e alíquotas — a camada que sobrepõe

Pré-requisito: motivos cadastrados em
`Administrando > Cadastros auxiliares > Motivos`.

Por motivo, define-se:
- as **quatro alíquotas** (À vista, Financiado, Outros, Benfeitoria) — ou seja,
  **o motivo pode ter alíquota própria**, diferente da geral;
- **Desconto (%)** — aplicado automaticamente na transferência, alterável à mão
  no ato;
- **Benefício** de isenção ou imunidade — se vinculado, **o lançamento sai
  isento automaticamente**;
- **Nomenclatura para quem recebe / quem vende o imóvel**.

⚠️ É aqui que mora a resposta de "por que esse ITBI saiu isento/com desconto e
o outro não": o motivo escolhido no cadastro traz alíquota, desconto e
benefício embutidos. **Ao investigar valor divergente, olhar o motivo antes da
alíquota geral.**

### Dados visíveis no resumo

Liga/desliga por bloco (*Informações gerais*, *Dados do imóvel*, *Dados de
transferência*, *Compra e venda*, *Resumo geral*) e, clicando no bloco,
**campo a campo**. Afeta o que sai no resumo/PDF.

---

## Guia 2 — Estimativa do valor venal

Rotina de **IA** que compara o imóvel com transferências anteriores, imóveis
similares e anúncios da internet, e avisa quando o valor declarado está abaixo
do mercado. Configura-se quais características do imóvel alimentam a
comparação — quanto mais completo o cadastro, mais precisa a estimativa.

Conecta com o parâmetro `Alertar se valor estimado em relação ao declarado for
maior que R$` da guia Transferência.

> ⚠️ **Na prática, ninguém usa.** O Felipe, com 5 anos de Betha, nunca viu um
> técnico ativar essa rotina em implantação nenhuma. Existe, é vendida como
> diferencial, mas não aparece no dia a dia. **Não vale investir tempo aqui** —
> se um município perguntar, o caminho é o vídeo da Betha, não este documento.
> *(fonte: Felipe, 20/08/2026)*

---

## Guia 3 — Solicitações de transferência

Governa o canal do **Protocolo (Cloud)**, por onde cartórios, proprietários e
compradores pedem a transferência.

| Parâmetro | O que muda |
|---|---|
| `Habilitar solicitações de imóveis urbanos` / `rurais` | Um, outro, ou ambos |
| `Responsável(is) pelo pagamento do imposto` | **Obrigatório.** Ex.: Comprador, Vendedor |
| `Transferir automaticamente as solicitações retornadas com data de transferência e matrícula atualizada` | Ver bloco abaixo — muda o fato gerador na prática |
| `Validar pendências financeiras ao deferir uma solicitação automaticamente` | Checa débito no deferimento automático |
| `Emitir automaticamente as certidões de ITBI` | Com escolha do modelo |
| `Notificar usuários ao receber uma solicitação` | Lista de usuários avisados no cadastro e a cada movimentação do cartório |
| `Forma de geração do lançamento` | **Automaticamente** ou **Após o deferimento** |
| `Permitir informar valor financiado na solicitação` | |
| `Permitir informar valor de outros na solicitação` | |
| `Utilizar campos adicionais` | Habilita escolher quais campos adicionais o solicitante preenche |
| `Gerar cadastro de imóvel ao deferir a solicitação` (Rural) | Cria o cadastro do imóvel rural no deferimento. Desligado: transferência e lançamento saem normalmente, sem criar cadastro |

### O parâmetro que muda a regra do jogo

`Transferir automaticamente as solicitações retornadas com data de
transferência e matrícula atualizada` foi feito a pedido de clientes que
entendem que **o fato gerador do ITBI é a efetiva transferência da propriedade**
— não o pagamento do imposto. Com ele ligado, a transferência ocorre pela
apresentação da matrícula averbada com o novo proprietário.

Consequência prática, e é sutil:

| Estado | ITBI parcelado, com alguma parcela paga |
|---|---|
| **Ligado** | Transfere e **encerra** o ITBI — basta **uma** parcela paga, não precisa ser a primeira. Nenhuma parcela paga → mensagem informativa **impede** a transferência |
| **Desligado** | ITBI parcelado conta como **em aberto** mesmo com parcelas pagas → **não permite** transferir |

### Crítica cadastral no modo automático

Se o deferimento é automático e uma crítica cadastral barra por informação
faltante, o sistema **aceita a solicitação** mas, no deferimento, mostra a
inconsistência e joga a solicitação para **Não analisada**. Não perde o pedido
— exige intervenção.

Ver `../conceitos/Criticas de Transferencia (validacao no cadastro).md`.

---

## Checklist de configuração num município novo

- [ ] Vencimento: data fixa ou prazo em dias? úteis ou corridos?
- [ ] Transfere sozinho após pagamento, ou é manual?
- [ ] Créditos, receitas e taxas vinculados — **urbano E rural**
- [ ] As quatro alíquotas, por tipo de imóvel
- [ ] Motivos cadastrados, com alíquota própria, desconto e benefício
- [ ] "Outros" tem nome próprio neste município?
- [ ] Benfeitoria entra no valor declarado?
- [ ] Solicitação via Protocolo habilitada? urbano, rural ou ambos?
- [ ] Responsável pelo pagamento
- [ ] Geração do lançamento: automática ou após deferimento?
- [ ] O parâmetro de matrícula atualizada está alinhado com o entendimento
      jurídico do município sobre o fato gerador?
- [ ] Certidão automática? qual modelo?
