# Altera Imóveis em Lote via Service Layer — como usar o template

Template validado em produção em 18/09/2026 (alteração do **distrito** de um
conjunto de imóveis listado em CSV, rodada completa conferida no cadastro).

Arquivo: `Altera_Imoveis_em_Lote_ServiceLayer_BASE.txt`

É o único template da biblioteca que **grava** por fora das fontes `Dados.*`:
alteração de cadastro de imóvel não tem fonte de gravação no catálogo, então o
caminho é o Service Layer (`PATCH /imoveis`) via `Http.servico(...)`.

## Fluxo que funcionou na prática

1. Gere a lista de imóveis com o script `Exporta Imoveis - Distrito e Secao`
   (em `_RASCUNHOS-TESTES`), filtre no Excel quem deve mudar e salve o CSV.
   O template lê o id da **2ª coluna**, que é o layout dessa exportação.
2. Cadastre o parâmetro do script: identificador `arquivo`, tipo Arquivo,
   obrigatório. O código lê `parametros.arquivo.valor`.
3. Cole a chave de integração da entidade em `TOKEN`.
4. Rode com `SIMULACAO = true`. Ele valida o CSV, monta os lotes e imprime o
   JSON exato que seria enviado, sem tocar em nada.
5. Rode com `SIMULACAO = false` e `LIMITE = 5`, e confira os 5 no cadastro.
6. Só então `LIMITE = 0` para a carga inteira.

## Configuração

| Constante | O que faz |
|---|---|
| `TOKEN` | Chave de integração da entidade. O script recusa rodar com o placeholder |
| `ID_DISTRITO` | Valor gravado em todos os imóveis do CSV |
| `COLUNA_ID` | Índice da coluna do id no CSV (0 = primeira). Padrão 1 |
| `TEM_CABECALHO` | Pula a primeira linha |
| `TAMANHO_LOTE` | Registros por requisição. **Máximo 50**, validado pelo próprio script |
| `SIMULACAO` | `true` monta e imprime, não envia |
| `LIMITE` | Corta a lista para um teste pequeno. `0` = sem limite |
| `DEBUG` | Imprime o corpo JSON de cada requisição |
| `SERVICO` | Recurso do SL. `"imoveis"` na versão validada |

## O que este template já resolve

**1. Autenticação é `chaveIntegracao`, não Bearer.** O SL da Betha autentica
por `Http.servico(url).chaveIntegracao(TOKEN)`. Montar `Authorization: Bearer`
na mão devolve 401. Também não se define `Content-Type` explícito.

**2. Resposta de erro nem sempre é JSON.** O SL pode devolver stack trace em
texto puro; chamar `.json()` direto derruba o script inteiro no meio de uma
carga. Aqui toda leitura de corpo está em `try/catch` e passa por `ehJson()`.

**3. O PATCH é assíncrono.** A requisição devolve um `idLote`; o resultado real
só aparece consultando `GET /{servico}/{idLote}` até `statusLote` virar
`PROCESSADO` ou `PROCESSADO_COM_ERRO`. O template faz esse polling (2s, até 30
tentativas) e soma sucessos e erros por registro, usando o `idIntegracao`
(`IMOVEL_<id>`) para identificar qual imóvel falhou.

**4. 401/403 aborta tudo.** Token errado com centenas de lotes na fila viraria
centenas de falhas idênticas; o script chama `suspender` no primeiro.

**5. O CSV é validado antes de qualquer envio.** Linhas vazias, sem a coluna
esperada ou com id não numérico são listadas como `[IGNORADA]` e os ids
repetidos são removidos (`unique()`), então o resumo final bate com o cadastro.

## Formato do payload

```groovy
[
  "idIntegracao": "IMOVEL_34699216",   // volta no retorno, identifica a falha
  "imoveis": [
    "idGerado": [ "id": 34699216 ],    // registro alvo do PATCH
    "idDistrito": 1                    // <- campo alterado
  ]
]
```

Para alterar outro campo, troque `"idDistrito"` pela propriedade desejada do
recurso (e `SERVICO`, se for outro cadastro). O resto — lotes, polling,
tratamento de erro e resumo — não muda.
