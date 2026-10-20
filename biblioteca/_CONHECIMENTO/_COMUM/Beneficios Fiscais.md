# Benefícios fiscais — isenção, imunidade, incentivo, remissão

> **Origem:** print da tela (Felipe, 2026-08-20, PM Viseu) + Swagger
> (`beneficiosFiscais`, `imoveisBeneficiosFiscais`, `manutencoesCalculos`) +
> corpus de 33 municípios em `Formulas/Imoveis - IPTU/`
> **Vale para:** todos os municípios — é cadastro do sistema

**Transversal de propósito.** Benefício fiscal serve ITBI, IPTU, econômicos e
dívida ativa ao mesmo tempo — por isso mora em `_COMUM/` e não dentro de uma
área.

**Onde:** `Administrando > Cadastros auxiliares > Benefícios fiscais`
(módulo Imobiliário)

---

## O cadastro

Colunas da tela: `Descrição` · `Tipo` · `Ato/Lei` · `Fundamentação legal`

Campos completos (do schema `beneficiosFiscaisPost`):

| Campo | Obrig. | O que é |
|---|---|---|
| `descricao` | ✅ | O nome. **É por ele que a Fórmula acha o benefício** |
| `tipoBeneficio` | ✅ | `ISENCAO` · `IMUNIDADE` · `INCENTIVO` · `REMISSAO` |
| `fundamentacaoLegal` | | Texto livre — o "porquê" jurídico |
| `idAto` | | Vincula ao ato/lei cadastrado |
| `dtValidadeInicial` / `dtValidadeFinal` | | **Vigência.** Benefício vencido não deveria aplicar |
| `codTCE` | | Obrigatório **só em Santa Catarina** |

### Os quatro tipos

| Tipo | Natureza |
|---|---|
| **Imunidade** | Constitucional — o município **não pode** tributar (templos, entes públicos, partidos, sindicatos, entidades de educação/assistência) |
| **Isenção** | Legal — o município **pode** tributar mas dispensa, por lei local |
| **Incentivo** | Política de fomento, normalmente com contrapartida e prazo |
| **Remissão** | Perdão de crédito **já lançado** — atua depois, não impede o lançamento |

Distinção que importa na hora de escrever fórmula: imunidade e isenção agem
**no lançamento**; remissão age **no crédito já existente**.

### Exemplo real (PM Viseu, 5 benefícios)

| Descrição | Tipo | Fundamentação |
|---|---|---|
| Créditos tributários | Isenção | Isenção para utilização de créditos tributários descontando 100% do imposto |
| Imunidade IPTU | Imunidade | — |
| Isenção de Incentivo | Incentivo | Isenção destinada ao processo de revogação de incentivo |
| Isenção IPTU | Isenção | — |
| Remissão de Dívidas/Lançamentos | Remissão | Isenção destinada ao processo de remissão de dívidas/lançamentos |

Note que os três últimos são **benefícios de processo** — existem pra que
rotinas do sistema (revogação de incentivo, remissão) tenham onde se apoiar,
não pra uso manual no cadastro.

---

## Como o benefício chega no contribuinte — três caminhos

### 1. Vinculado ao **motivo da transferência** (ITBI)
`Utilitários > Central de configurações > Transferência de imóveis` →
quadro *Motivos e alíquotas* → coluna **Benefício**.

Efeito: escolhido aquele motivo na transferência, **o lançamento do ITBI sai
isento automaticamente**.

> ⚠️ **Esse vínculo não existe no Service Layer.** O schema
> `configTransfImoMotivos` tem só as 4 alíquotas e as nomenclaturas — nenhum
> `idBeneficio`. Consequência prática: **migrar a configuração de motivos pela
> API não leva o benefício junto.** Conferir na tela depois de migrar.

### 2. Vinculado a um **imóvel ou econômico**, via manutenção de cálculo
`imoveisBeneficiosFiscais` liga `idImovel` a **`idCalculo`** — não ao
benefício direto. O benefício está em `manutencoesCalculos.idBeneficioFiscal`.

Ou seja: **benefício individual passa por Requerimento/Manutenção de
lançamento** (`Administrando > Lançamentos > Requerimento/Manutenção de
lançamento`), não é um campo solto no cadastro do imóvel.
`economicosBeneficiosFiscais` funciona igual, para econômicos.

### 3. Aplicado **dentro da fórmula de cálculo**
O caminho mais usado no IPTU. A fórmula lê um campo adicional
("Imune/Isento IPTU", "TSU - Isenção"…), busca o benefício **pela descrição**
e passa como 3º argumento de `criarReceita`:

```groovy
v_beneficio = Utilitarios.buscaBeneficioFiscal("ISENÇÃO")
lancamento.criarReceita("IP", Numeros.arredonda(valor,2), v_beneficio)
lancamento.criarReceita("IP", Numeros.arredonda(valor,2), v_beneficio, percentual) // parcial
```

**33/33 municípios** do corpus de IPTU tratam isenção/imunidade; 32 usam
`buscaBeneficioFiscal` (183 chamadas).

---

## A armadilha nº 1: a descrição é a chave

`Utilitarios.buscaBeneficioFiscal(texto)` casa pela **descrição cadastrada**.
Descrições distintas no corpus de IPTU:

| Texto buscado | Municípios |
|---|---|
| `ISENTO` | 17 |
| `IMUNE` | 8 |
| `ISENÇÃO` | 6 |
| `ISENÇÃO TOTAL`, `IMUNE DE IMPOSTOS`, `Isenção de Taxas` | 2 cada |
| nomes longos com artigo de lei (`LEI COMPLEMENTAR Nº 305(Art. 2 e 12)`, `Isenção de Impostos - Art. 230`, `Imunidade (Entidades/Total) (02)`) | 1 cada |

**66 descrições distintas em 33 municípios.** Copiar o texto de outro
município devolve nulo e a receita sai **sem** benefício — cheia, e sem
registro de renúncia. Sempre conferir a lista real em
`Administrando > Cadastros auxiliares > Benefícios fiscais`.

Um município chegou a ter `buscaBeneficioFiscal("")` — string vazia. Não é
padrão a copiar.

## A armadilha nº 2: isenção sem benefício some do relatório

Dois jeitos de não cobrar:

1. **não gerar a receita** — o valor simplesmente não existe;
2. **gerar com benefício** — o sistema registra o valor **renunciado**.

O segundo é preferível: renúncia fiscal é informação que a prefeitura precisa
prestar. O primeiro esconde.

## A armadilha nº 3: vigência

`dtValidadeInicial` / `dtValidadeFinal` existem no cadastro, mas
`buscaBeneficioFiscal` recebe só a descrição. **Não está confirmado** se a
função filtra por vigência sozinha ou se a fórmula precisa checar. Confirmar
antes de depender disso num município com benefício por prazo.

---

## Fontes de dados (BFC-Script)

```
beneficioFiscal / busca      GET /beneficios-fiscais              → beneficiosFiscais
imoveis / buscaBeneficioFiscal  GET /imoveis/{idImovel}/beneficios → imovel.beneficioFiscal
                                                     ⚠ idImovel obrigatório
```

Ambas leitura. Concessão de benefício por Script não existe — é tela
(ou Service Layer, para migração).

---

## Perguntas pra um município novo

- [ ] Quais benefícios estão cadastrados, com que **descrição exata**?
- [ ] Cada um é isenção, imunidade, incentivo ou remissão?
- [ ] Algum tem prazo de validade?
- [ ] Em SC: o `codTCE` está preenchido?
- [ ] Algum motivo de transferência tem benefício vinculado?
- [ ] Isenção de IPTU vem de campo adicional na fórmula, ou de requerimento
      individual?
- [ ] Existe isenção **parcial** (percentual), ou só total?
