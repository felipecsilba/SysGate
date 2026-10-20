# Críticas de transferência — validação no momento do cadastro

> **Origem:** 6 scripts de natureza `TRANSFERENCIAS_IMOVEIS` em
> `Scripts/Criticas/`, de 5 municípios (Braço do Norte, Campos Novos,
> Criciúma ×2, Joaçaba, Urubici)
> **Confirmado em:** código de produção
> **Vale para:** todos os municípios (o mecanismo; as regras são de cada um)

**Crítica** é um Script disparado por evento do cadastro. Na área de
transferências ela é a única forma de impedir que um cadastro errado entre —
lembrando que **não existe fonte de dados pra alterar transferência**
(ver `../fontes/Mapa de Fontes - Transferencias e ITBI.md`). Ou seja: ou a
crítica barra na entrada, ou o conserto é manual na tela.

Das 77 críticas da base inteira, 6 são de transferência. Para comparação:
parcelamentos tem 39, imóveis 10, contribuintes 7, econômicos 6.

---

## O esqueleto

```groovy
transferencia = tipoEvento.valor == 'CRIACAO' ? registro : registro.novo;

percorrer (transferencia.itens) { itemTransferencia ->
  // regras aqui
}
```

A primeira linha é **obrigatória e sempre igual**. Motivo: no evento de
`CRIACAO` o objeto vem em `registro`; em `ALTERACAO` vem em `registro.novo`
(e o anterior fica em `registro.anterior`). Escrever só `registro` funciona
no teste de criação e falha silenciosamente na alteração.

## A árvore do objeto

```
transferencia
├── dataCadastro
├── tipoCobranca.valor          ← enum, ler sempre com .valor
└── itens[]                     ← um por imóvel
    ├── imovel.id               ← use este pra filtrar fonte
    ├── imovel.codigo           ← este é o que o usuário vê
    ├── imovel.tipoImovel.valor
    ├── inscricaoIncra          ← imóvel rural
    └── dadosVenda[]
        ├── vendedor.codigo
        └── dadosCompra[]
            └── comprador.codigo
```

⚠️ **Três níveis de lista**: itens → dadosVenda → dadosCompra. Uma
transferência tem N imóveis; cada imóvel tem N vendedores; cada vendedor tem
N compradores (venda fracionada). Regra escrita só no primeiro nível deixa
passar caso com múltiplos vendedores.

⚠️ **`imovel.id` ≠ `imovel.codigo`.** `id` é a chave interna, é o que vai no
`criterio:` da fonte. `codigo` é o número reduzido que o contribuinte
conhece, é o que vai na mensagem de erro. Trocar os dois dá "não encontrado"
ou filtro errado.

---

## Barrar × avisar

| Comando | Efeito |
|---|---|
| `suspender 'mensagem'` | **Bloqueia** — o cadastro não é salvo |
| `Mensagens.aviso("...")` | **Avisa** — o usuário vê e segue |

A escolha é de política, não técnica. Débito em aberto normalmente é *aviso*
(o município pode querer transferir mesmo assim, com o débito acompanhando o
imóvel); comprador igual a vendedor é *bloqueio* (é erro de digitação, não
existe hipótese válida).

---

## Regras encontradas em produção

**1. Comprador igual ao vendedor** (Braço do Norte) — bloqueia:

```groovy
transferencia = tipoEvento.valor == 'CRIACAO' ? registro : registro.novo;
percorrer (transferencia.itens) { itemTransferencia ->
  percorrer (itemTransferencia.dadosVenda) { itemVenda ->
    percorrer (itemVenda.dadosCompra) { itemCompra ->
      se (itemCompra.comprador.codigo == itemVenda.vendedor.codigo) {
        suspender 'O Comprador é o mesmo que o Vendedor'
      }
    }
  }
}
```

**2. Pendência financeira do imóvel** (Campos Novos) — avisa. Checa três
coisas separadas, porque são três fontes diferentes:

```groovy
fonteTributos = Dados.tributos.v2;
percorrer (transferencia.itens) {
  criterio = "idImovel = " + item.imovel.id + " and situacao = 'ABERTO'";
  se (fonteTributos.debitos.metadados(criterio: criterio, primeiro: true).quantidade > 0) {
    Mensagens.aviso("O imóvel " + item.imovel.codigo + " possui débito em aberto!")
  }

  criterio = "idImovel = " + item.imovel.id + " and situacaoDivida = 'ABERTO'";
  se (fonteTributos.dividas.metadados(criterio: criterio, primeiro: true).quantidade > 0) {
    Mensagens.aviso("O imóvel " + item.imovel.codigo + " possui dívida em aberto!")
  }

  criterio = "parcelamento.idImovel = " + item.imovel.id + " and situacao = 'ABERTO'";
  se (fonteTributos.parcelamentos.parcelas.metadados(criterio: criterio, primeiro: true).quantidade > 0) {
    Mensagens.aviso("O imóvel " + item.imovel.codigo + " possui parcelamento em aberto!")
  }
}
```

Dois detalhes que valem reuso:
- **`.metadados(..., primeiro: true)`** devolve só a contagem — não traz os
  registros. Pra responder "existe algum?" é muito mais barato que `.busca`.
- **O campo de situação muda de nome por fonte**: `situacao` em `debitos` e
  em `parcelamentos.parcelas`, mas **`situacaoDivida`** em `dividas`.
  Confirmar com `python fonte.py ver <fonte>` antes de escrever o critério.

> ⚠️ Este script está **inteiro comentado** no arquivo de Campos Novos.
> Não dá pra saber pelo código se foi desligado por decisão ou por problema.
> Perguntar antes de replicar.

**3. Outras, ainda não detalhadas:** validação cadastral (Criciúma),
valor financiado (Criciúma), validação do ITBI (Urubici), Joaçaba.

---

## Checklist pra escrever uma crítica de transferência

- [ ] Começou com `tipoEvento.valor == 'CRIACAO' ? registro : registro.novo`?
- [ ] Percorreu os três níveis, ou a regra é mesmo só de cabeçalho?
- [ ] Usou `imovel.id` no filtro e `imovel.codigo` na mensagem?
- [ ] `suspender` ou `Mensagens.aviso` — é bloqueio ou aviso? confirmou com o município?
- [ ] Consulta de existência usou `.metadados(primeiro: true)` em vez de `.busca`?
- [ ] Conferiu o nome do campo de situação de cada fonte no `fonte.py`?
- [ ] Testou nos dois eventos (criação **e** alteração)?
