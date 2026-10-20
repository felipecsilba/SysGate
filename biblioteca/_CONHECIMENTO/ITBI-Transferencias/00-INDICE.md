# ITBI e Transferências de Imóveis — índice

Mapa da área. **Leia este arquivo primeiro**, depois abra só o que a pergunta
exigir.

Estado: 🟢 **fechada na essência** — corpus de código + central de ajuda +
Swagger + tela real. O que resta é acabamento (ver pendências).

---

## O que já existe

| Arquivo | Responde |
|---|---|
| `conceitos/Rotina de Transferencia de Imoveis (tela).md` | O fluxo na tela: assistente de 4 guias, campo a campo, vendedor≠proprietário, transferência fracionada, endereço de correspondência |
| `conceitos/Solicitacao de Transferencia (fluxo do cartorio).md` | O pedido vindo do cartório via Protocolo: situações, análise lado a lado, ajuste de valores, deferimento, o estorno que não existe |
| `conceitos/Motivos da Transferencia (naturezas de transmissao).md` | Os 10 motivos, o que cada um sobrepõe, e os que exigem tratamento especial |
| `conceitos/Criticas de Transferencia (validacao no cadastro).md` | Validar no cadastro: esqueleto, árvore do objeto, barrar × avisar, regras de 5 municípios |
| `configuracoes/Central de Configuracoes - Transferencia de Imoveis.md` | Os 3 grupos de parâmetros e o que cada um muda |
| `campos/Modelo de Dados e Enums (Swagger).md` | **Os valores literais dos enums** + cadeia de 4 níveis + campos por entidade + nomes reais dos campos de configuração |
| `campos/Dominios e Situacoes.md` | Os mesmos domínios pelo rótulo de tela |
| `fontes/Mapa de Fontes - Transferencias e ITBI.md` | Solicitação × transferência × certidão; parâmetros obrigatórios; o que não dá por Script |
| `formulas/Tipos de Formula ITBI.md` | Os 3 tipos `ITBI_*`, contexto do motor, variação de arrematação |
| `casos/Divida nao foi transferida - roteiro.md` | 9 hipóteses em ordem de investigação para "a dívida não foi junto". Revisado 21/08/2026 sobre o **código ativo**: o vilão nº 1 é **o motivo da transferência caindo num ramo que não transfere dívida** (Ilhota, Lagoa Santa — chamados reais) |
| `relatorios/Certidao e Guia de ITBI - o padrao.md` | Os 94 relatórios da área: pasta atômica, `chaveNatureza`, os 2 contratos de parâmetro, as 2 estratégias de montagem, esqueleto de fonte dinâmica |
| `relatorios/Campo do cadastro do imovel em relatorios (caso CIB).md` | Levar um campo do **cadastro** do imovel (CIB, INCRA, tipo) para certidao de ITBI, alvara de construcao ou habite-se: a fonte do documento nao devolve campo de cadastro; o nome do field no .jrxml depende de o esquema ser plano ou aninhado; e nome errado imprime **nulo sem erro**. 3 casos Ruropolis 25/08/2026 |

**Fora da área, mas essencial:**
- `../_COMUM/Beneficios Fiscais.md` — isenção/imunidade/incentivo/remissão, os
  três caminhos até o contribuinte, e por que a **descrição** é a chave
- `../_COMUM/Mapa do Sistema - Menus e Modulos.md` — onde cada coisa fica
- `../../FontesDeDados/swagger/README.md` — o Service Layer, e por que ele
  **não** é a mesma coisa que fonte de dados do BFC-Script

## O que a área tem na base de código

| Onde | Quanto |
|---|---|
| `Formulas/ITBI/` | 36 arquivos, **27 municípios** (de 35), 3 tipos. 22 têm só `TRANSFERENCIA_CREDITOS` |
| `Scripts/Criticas/` natureza `TRANSFERENCIAS_IMOVEIS` | 6 scripts, 5 municípios |
| `Scripts/` com ITBI/transferência no nome | 180 arquivos |
| `Relatorios/` | **94 pastas, 22 municípios** — 46 certidões, 25 guias/DAM/carnês, 15 listagens |

---

## Os 9 fatos que mais resolvem chamado

1. **O motivo sobrepõe a alíquota geral** e pode carregar desconto e
   benefício. Valor estranho → olhar o motivo primeiro.
2. **São quatro alíquotas** (à vista, financiado, outros, benfeitoria), por
   tipo de imóvel — não uma.
3. **As alíquotas são congeladas no item da transferência**
   (`percAvista`, `percFinanciado`…). Mudar a configuração **não** recalcula
   transferência já cadastrada.
4. **Sem ajuste na solicitação, vale o valor declarado pelo cartório.** O
   alerta amarelo avisa, não impede.
5. **Deferida + lançamento pago/inscrito/parcelado = deferimento não estorna.**
6. **Fórmula de valor venal do ITBI lê o campo adicional que o IPTU gravou.**
   IPTU sem gravar = ITBI lendo `nulo`.
7. **Sem cobrança + `Declarado` preenchido = ITBI aparece mesmo assim.**
8. **Transferência de débito/dívida é 100% fórmula** (`ITBI_TRANSFERENCIA_CREDITOS`)
   — **não existe parâmetro** na Central de configurações pra isso. Não procure lá.
   E nos 28 arquivos **nenhum** deixa de chamar `transferirDividas*` no arquivo
   inteiro: quando a dívida não vai, é **um ramo** (quase sempre por
   `motivos.descricao`) ou **uma data de corte**, não o arquivo todo.
9. **Fórmula é por exercício.** Cabeçalho carimbado por ano, motor entrega
   `anoDaTransferencia`. Fórmula que não existe no ano da transferência não roda.

---

## Pendências — o que eu **não** sei

1. **Regras de isenção/não incidência do ITBI** — sei *onde* se vincula o
   benefício, não *quais* casos a lei prevê. Depende do município.
2. **Casos de troubleshooting** — há **1 roteiro** (dívida não transferida),
   ainda **não confirmado** em chamado real. O Felipe passa casos quando
   tiver. Continua sendo a maior lacuna.
3. **Perguntas em aberto pra Betha** (levantadas no teste de 21/08/2026):
   - o que o sistema faz com os créditos **sem fórmula cadastrada**?
   - diferença real entre `transferirDividas()` e
     `transferirDividasComVencimentoAPartirDe(1900)`? (21/28 chamam os dois)
   - dá pra reprocessar créditos de transferência já encerrada?
   - débito/dívida em **venda parcial**: proporcional, inteiro, ou nada?
   - `arrematante.codigo` sem arrematante devolve `0`, `nulo` ou erro?
   - existe simulação/log de execução de fórmula ITBI?
4. **Página de melhorias** — adiada por decisão do Felipe (20/08/2026).
5. **As 4 críticas não detalhadas** (Criciúma ×2, Joaçaba, Urubici) —
   despriorizadas por decisão do Felipe (20/08/2026).

**Fora de escopo por decisão:** *Estimativa do valor venal por IA* — o Felipe
(5 anos de Betha) nunca viu nenhum técnico usar. Não documentar.

✅ Resolvidas: enums exatos (Swagger) · naturezas de transmissão/motivos
(tela) · origem do benefício por motivo (tela) · inventário e padrão dos
relatórios (corpus).

---

## Acoplamentos com outras áreas

- **Imóveis / IPTU** — valor venal do ITBI vem do campo adicional gravado pelo
  IPTU; troca de proprietário mexe no endereço de correspondência.
- **Dívida Ativa** — `Creditos.transferirDividas*`; dívida ativa trava o
  estorno do deferimento.
- **Arrecadação** — `emissaoGuias`; guia sai pelo módulo atendimento do comprador.
- **Contribuintes** — comprador/vendedor; cadastro criado no deferimento.
- **Protocolo (Cloud)** — origem das solicitações.

---

## Ferramentas

```bash
cd FontesDeDados
python fonte.py ver certidaoITBI
python fonte.py ver transferenciasImoveis
python fonte.py rel transferenciasImoveis
```

Enum ou campo que o `fonte.py` não resolve → procurar no schema
`{recurso}Post` de `FontesDeDados/swagger/tributos-openapi.json`.

Bruto e procedência: `../_bruto/ITBI-Transferencias/FONTES.md`
