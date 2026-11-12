# Averbação completa da transferência de imóvel

Script: `Averbacao_Transferencia_Completa_BASE.txt` (BFC-Script, rotina agendada do tributos).
**Template validado no Studio (base de teste) em 11/11/2026.**

## Para que serve

No Cloud, a transferência de imóvel, manual ou automática na baixa do ITBI, averba só o
motivo ("Compra e venda", "Financiamento SFI"…). O Desktop averbava o lastro completo, e o
cliente sente falta dele, ainda mais com o ITBI Online, que acaba com o ITBI físico em mãos:

```
Transferência do Imóvel, Proprietário Anterior: 91886 - NOME CPFCNPJ: ..., Proprietário Atual: 77373 - NOME CPFCNPJ: ...
```

O script cria uma **segunda averbação**, ao lado da automática, com esse texto. A correção
definitiva é uma melhoria do produto. O script cobre o intervalo até ela sair.

## O que grava

Uma averbação por imóvel de cada transferência `ENCERRADA`:

| Campo | Valor |
|---|---|
| `nroProcesso` | `TRANSF-<código>/<ano>`, que serve de chave contra duplicata e aparece como "Processo:" na tela |
| `descricao` | `Data: <data da transferência> Obs: Transferência do Imóvel (<motivo>), Proprietário Anterior: …, Proprietário Atual: …` |
| `dhMovimentacao` | **não enviado**: o servidor preenche com a hora local |

Com mais de um vendedor ou comprador, cada um vem com o percentual (`(50,00%)`), separados por
`;`. Um comprador que comprou de dois vendedores aparece uma vez só, com os percentuais somados.

## Como usar

1. Rodar no Studio com `MODO_TESTE = true`. O log mostra o texto de cada averbação e não cria nada.
2. Trocar para `false`, rodar duas vezes e conferir: na 1ª sai "N criadas"; na 2ª, "0 criadas, N já tinham".
3. Agendar na rotina do sistema na frequência combinada com o município (de hora em hora, ou uma vez por dia útil às 19:00), sem parâmetros. Agendado, ele roda como usuário "sistema".

Cada execução pega **só as transferências encerradas no dia da execução** (data de
transferência = hoje). O horário fica na rotina do sistema, não no script. Rodar duas vezes
no mesmo dia não repete a averbação, por causa da chave.

⚠ **O que fica de fora:** transferência encerrada depois do horário da última execução do dia,
ou num dia em que a rotina não roda (fim de semana, se agendada só em dia útil), e
transferência com data de transferência diferente do dia em que foi encerrada. Se isso
importar, agende a execução para o fim do dia e todos os dias.

Retroativo (transferências antes da implantação): fora do escopo, por decisão.

## Armadilhas que este script resolveu (custaram rodada no Studio)

- **`.busca(...)` não tem `isEmpty()`**: é um iterável da Betha. Para saber se existe, use `primeiro: true`.
- **`primeiro: true` sem resultado devolve `[:]`, não `null`**: por isso o teste é `existente?.id`.
- **`dhMovimentacao` enviado é gravado como UTC**, e a tela mostra 3 horas a mais, tanto com `Datas.hoje()` quanto com texto `yyyy-MM-dd HH:mm:ss`. Omitindo o campo, a hora sai certa.

## Fontes

`transferenciasImoveis` (situação `ENCERRADA`), `transferenciasImoveis.itens`, `.venda`
(proprietário anterior), `.compra` (proprietário atual), `imoveis.movimentacoes` (checagem
da chave) e `imovel.averbacao` (`cria`).
