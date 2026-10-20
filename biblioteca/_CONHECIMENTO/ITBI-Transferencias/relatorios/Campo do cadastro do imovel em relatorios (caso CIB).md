# Levar um campo do cadastro do imóvel para um relatório — o caso do CIB

> **Origem:** chamados reais de Rurópolis-PA, resolvidos em 25/08/2026 —
> **certidão de ITBI**, **alvará de construção** e **habite-se**, os três com o
> mesmo pedido. Logs conferidos linha a linha, os três validados em produção.
> **Vale para:** qualquer campo do cadastro de imóveis que um relatório precise
> exibir e a fonte do documento não devolva. O CIB é só o exemplo.

Pedido banal — "incluir o CIB na certidão" — que esbarra em **dois fatos que
não estão em lugar nenhum da tela** e custaram um ciclo inteiro de teste.

---

## Fato 1 — a fonte da certidão não devolve campo de cadastro

`certidaoITBI.imoveis` (`/certidoes-itbi/{ano}/{nroDocumento}/imoveis`)
devolve **o item da certidão**, não o imóvel. O retorno completo é:

```
idItem, idImovel, codigoImovel, matriculaImovel, unidade, vlItbi,
inscricaoImobiliaria, corresponsavel.*, endereco.*,
aliquotaVista, aliquotaBenfeitoria, aliquotaOutros, aliquotaFinanciado,
vlAreaTotalConstruidaUnidade, vlAreaTotalTerrenoUnidade,
vlVendaConstrucao, vlVendaTerreno, vlBenfeitoriasUnidade
```

Não tem `cib`. Também não tem `inscricaoIncra`, `tipoImovel`, `responsavel`,
`situacao`, `agrupamento` — nada que seja do cadastro e não da venda.

**O CIB só existe na fonte `/imoveis`** (`Dados.tributos.v2.imoveis`), onde é
`cib`, `String`, e serve tanto de campo de retorno quanto de filtro.
Confirmado no catálogo: as únicas fontes com `cib` são `/imoveis`,
`/imoveis/{idImovel}/englobados`, `/condominios/{idCondominio}/imoveis`,
`/certidoes-negativas`, `/obras` e `/alvaras` (nas duas últimas como
`imovel.cib` / `obra.imovel.cib`).

### O `idImovel` do item **casa** com o `id` do cadastro

Testado: item da certidão com `idImovel = 35839536` → `busca(criterio: "id =
35839536")` traz o cadastro certo, com `cib = "ODTVAN3V"`. Busca por
`codigo = 7480` traz o mesmo registro. **Não** é preciso plano B por código.

---

## Fato 2 — objeto aninhado vira `prefixo_campo` no .jrxml

Foi aqui que o campo "sumiu". O script gravava certo, o log provava, e o
relatório imprimia nulo.

Quando o esquema da fonte dinâmica tem

```groovy
imovel: Esquema.objeto([ cib: Esquema.caracter, ... ])
```

o Jasper recebe o campo achatado com **underscore**: `imovel_cib`. Um
`<field name="cib">` com `$F{cib}` **não existe na fonte** — e o Jasper
**não reclama**: imprime nulo, silencioso.

Padrão confirmado em **25 relatórios** da base (`imovel_matricula`,
`imovel_codigoImovel`, `imovel_quadra`, `imovel_lote`…). Nenhum usa ponto.

```xml
<field name="imovel_cib" class="java.lang.String"/>
```
```
"CIB: " + $F{imovel_cib}
```

> Sintoma × causa: **campo nulo sem erro nenhum** no Jasper é quase sempre
> nome de field que não existe na fonte — não fonte vazia. Compare o nome com
> o de um campo vizinho que já funciona; no caso, `imovel_lote` no mesmo frame.

### O prefixo depende do esquema — não é regra fixa do campo

| Esquema da fonte | Nome do field no .jrxml |
|---|---|
| `imovel: Esquema.objeto([ cib: ... ])` | `imovel_cib` |
| `cib:` direto na raiz (esquema plano) | `cib` |

Os dois casos são reais e foram feitos na mesma semana: a **certidão de ITBI**
tem esquema aninhado (`imovel_cib`); o **alvará de construção** tem esquema
plano (`cib`). Copiar o nome de um para o outro dá nulo. **O que manda é o
esquema da fonte, não o campo.**

Outras duas causas do mesmo sintoma, na ordem: **fonte não republicada** depois
de alterar o esquema (confirmado no alvará de construção, 25/08/2026 — script
imprimindo o CIB no log e relatório em branco até republicar), e field
declarado no dataset principal mas usado dentro de um **subDataset** (precisa
estar nos dois).

> Teste que separa os dois em uma execução: ponha ao lado um textField com um
> campo **que já existia** no esquema antigo. Se o antigo aparece e o novo não,
> é publicação. Se nenhum aparece, é preview do Studio com "One Empty Record" —
> nesse adaptador todo `$F{}` vem nulo.

---

## O recorte no script padrão da certidão

O script padrão tem dois fluxos, e o campo do cadastro se resolve diferente em
cada um:

| Fluxo | De onde vem `dadosImoveis` | Como pegar o campo |
|---|---|---|
| `CERTIDAO` | `certidaoITBI.imoveis` | busca extra em `/imoveis` por `id = imovel.idImovel` |
| `TRANSFERENCIA` | já é `Dados.tributos.v2.imoveis` | **direto**, `imovel.cib` — sem consulta nova |

```groovy
cibImovel = '---';

if (tipoProcessamento == 'CERTIDAO') {
  imovelCadastro = Dados.tributos.v2.imoveis.busca(
    criterio: "id = ${imovel.idImovel}",
    primeiro: true
  )
  if (imovelCadastro != null && imovelCadastro.cib != null && !imovelCadastro.cib.vazio()) {
    cibImovel = imovelCadastro.cib;
  }
} else {
  if (imovel.cib != null && !imovel.cib.vazio()) {
    cibImovel = imovel.cib;
  }
}
```

Três detalhes que valem repetir:

1. **Resolver o campo uma vez por imóvel**, fora dos mapas `linha` — o script
   padrão monta `linha` dentro do laço de vendas/detalhes, e colocar a busca
   lá dentro repete a consulta por venda.
2. **`cib: cibImovel` vai nos DOIS mapas `linha`** — o do fallback de
   transferência e o do laço de vendas da certidão. Esquecer um deixa o campo
   nulo só em algumas certidões, o que confunde o diagnóstico.
3. **Inicializar com o traço** e só sobrescrever se vier valor. `?:` seguido de
   `.vazio()` estoura se o objeto vier nulo; e imóvel sem CIB é o caso comum
   (na lista de Rurópolis, 11 de 12 imóveis estão sem).
4. Evite `campos: "id, cib"` na busca — a projeção não é necessária aqui e foi
   descartada durante o diagnóstico por não ser possível descartá-la como
   causa. Buscar o registro inteiro é o que o resto do script já faz.

---

## A projeção `campos:` decide se o campo novo chega

Nos três relatórios o imóvel **já era buscado** em `/imoveis` para montar o
endereço — o campo novo sai do laço que já existe, sem consulta nova. Mas a
projeção da busca precisa de atenção, e ela vem em dois estados:

| Estado da busca | O que fazer |
|---|---|
| `campos:` **coerente** — o código só lê o que a projeção lista (habite-se) | **incluir o campo novo na lista**: `campos: "bairro(nome), logradouro(nome), quadra, lote, loteamento(nome), cib"` |
| `campos:` **incoerente** — o código lê campos fora da projeção (alvará de construção lia `logradouro`, `numero`, `bairro` sem projetá-los) | **remover a projeção** e buscar o registro inteiro; incluir só o campo novo seria construir sobre comportamento incerto |
| sem `campos:` (certidão) | nada a fazer |

Numa busca por `id`, trazer o registro inteiro não tem custo relevante.

---

## O CIB é gravado sem hífen

Cadastro guarda `ODTVAN3V`; **a tela de Imóveis é que exibe `ODTVAN3-V`**
formatado. Se a certidão precisa do hífen, formate — o último caractere é o
dígito verificador:

```
$F{imovel_cib}.length() == 8
  ? $F{imovel_cib}.substring(0,7) + "-" + $F{imovel_cib}.substring(7)
  : $F{imovel_cib}
```

---

## Roteiro de diagnóstico (o que separou script de layout)

Quando um campo novo vem nulo na certidão, **não mexa mais no script antes de
saber de que lado está o problema**. Um teste isolado responde em uma execução:

```groovy
imoveisCertidao = Dados.tributos.v2.certidaoITBI.imoveis.busca(
  parametros: [ano: ano, nroDocumento: doc]
)

imoveisCertidao.each { item ->
  println "CIB >> item: ${JSON.escrever(item)}"
  cadastro = Dados.tributos.v2.imoveis.busca(criterio: "id = ${item.idImovel}", primeiro: true)
  println "CIB >> cadastro: ${JSON.escrever(cadastro)}"
  println "CIB >> cib = ${cadastro?.cib}"
}
```

Some a isso um **imóvel de controle** que você sabe ter o campo preenchido
(pela tela de Imóveis). A leitura é direta:

| Controle | Campo por id | Onde está o problema |
|---|---|---|
| traz valor | nulo | vínculo — o id da certidão não aponta pro cadastro |
| traz valor | traz valor | **layout** — nome do field no .jrxml |
| nulo | nulo | a fonte não devolve o campo neste ambiente |

No caso real, caiu na linha do meio — e o `.jrxml` tinha `$F{cib}` em vez de
`$F{imovel_cib}`.

---

## Script validado

`_RASCUNHOS-TESTES/ANALISE OK - Fonte Certidao ITBI com campo CIB.txt` — fonte
dinâmica completa, rodada em produção em Rurópolis. Serve de modelo para
qualquer outro campo de cadastro que precise entrar numa certidão.

`_RASCUNHOS-TESTES/ANALISE OK - Fonte Alvara de Construcao com campo CIB.txt` —
o mesmo campo no **alvará de construção** (Rurópolis, 25/08/2026). Ali o imóvel
já é buscado em `/imoveis` para montar o endereço, então o CIB sai **sem
consulta nova** — é só ler `itemImoveis.cib` no `percorrer` que já existe. E o
esquema é plano: field `cib`, sem prefixo.

`_RASCUNHOS-TESTES/ANALISE OK - Fonte Habite-se com campo CIB.txt` — o terceiro
caso (Rurópolis, 25/08/2026). Esquema plano (`cib`) e projeção `campos:`
coerente, então o `cib` **entrou na lista da projeção**.
