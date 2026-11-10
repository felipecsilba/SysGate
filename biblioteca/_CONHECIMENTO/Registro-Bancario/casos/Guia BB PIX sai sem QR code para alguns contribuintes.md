# "A guia de pagamento sai sem QR code Pix para alguns contribuintes"

> **Origem:** chamado real, **03/11/2026**, Rurópolis/PA (convênio `2878741`).
> Diagnóstico feito com o script "Guia Registrada BB PIX V2" instrumentado com
> `imprimir`, comparando uma guia que saía sem QR (baixa 10266) com uma que saía
> com QR (baixa 10273).
> **Status: RESOLVIDO** (confirmado pelo Felipe na mesma data: "a princípio está
> resolvido"). A chamada `gerar-pix` foi acrescentada ao script e passou a trazer o QR.
> **Template atualizado em 09/11/2026:** a correção abaixo foi incorporada a
> `_BIBLIOTECA/Templates/Guia_Registrada_BB_PIX_V2_Referente_Imovel_BASE.txt` (bloco
> `// ALTERADO (03/11/2026) - GERAR PIX`). Antes disso, quem partia do template caía no mesmo problema.

Sintoma: mesmo convênio, mesma configuração ("Aceita Pix = SIM"), e a guia de
um contribuinte sai com QR code e a de outro sai só com o código de barras.
Nenhuma mensagem de erro.

---

## Resposta rápida

**Causa: falha do próprio Banco do Brasil ao gerar o Pix do boleto.** O boleto
fica registrado (linha digitável e código de barras normais), mas o QR volta
vazio. O script aceitava essa resposta sem avisar.

A consulta `GET /cobrancas/v2/boletos/{id}/pix` responde **200** com o motivo
num campo de texto:

```
pix.textoRetorno: Erro ao gerar QRCODE Pix: Abend AJ05 no programa IIBJSAIT, tran=IIB2, ... cics=S3IK
qrCode.url:   (vazio)
qrCode.emv:   (vazio)
qrCode.txId:  BOLETO28787410000010266DATA03112026   <- o txId vem, o QR não
```

Na guia que funciona, `pix.textoRetorno` vem vazio e `qrCode.url`/`qrCode.emv`
vêm preenchidos. Essa é a única diferença.

O BB guarda o boleto assim. Toda reemissão (POST → `4874915` "Nosso Número já
incluído" → consulta `/pix`) só lê de novo o resultado com falha, então o
contribuinte nunca recebe o QR.

**Correção:** quando o QR vier vazio, pedir ao banco para gerar o Pix de novo
com `POST /cobrancas/v2/boletos/{id}/gerar-pix`, corpo `{"numeroConvenio": N}`.

---

## O que NÃO era

Descartado com os logs, para não perder tempo da próxima vez:

- **Configuração do convênio:** as duas guias tinham convênio, carteira e
  variação iguais e `indicadorPix: "S"`.
- **Dados do pagador:** CPF, CEP e endereço estavam no mesmo formato nas duas.
  O nome com espaços sobrando no fim aparecia nas duas.
- **Erro `5208499` (boleto sem Pix):** a consulta `/pix` deu 200, não 403.
- **Chave com ponto (`retornoQrcode.'qrCode.url'`):** está certa. O GET `/pix`
  do BB devolve as chaves achatadas com ponto, e todo o corpus usa assim.

---

## Como confirmar que é este o caso

Instrumentar o script logo depois da consulta do Pix:

```groovy
statusCodeQrcode = envioRespostaQrcode.codigo()
imprimir "DIAG QR GET-PIX -> baixa=${it.nroBaixa} status=${statusCodeQrcode} textoRetornoBB=[${retornoQrcode?.'pix.textoRetorno'}] url=[${retornoQrcode?.'qrCode.url'}]"
```

Se aparecer `status=200`, `textoRetornoBB` com "Erro ao gerar QRCODE Pix" e
`url=[]`, é este caso.

---

## Correção aplicada no script

O trecho entra **depois** do bloco da segunda via (`if (statusCode == 400 && ...4874915) { ... }`)
e **antes** de montar o `esquemaGuias`. Ficando fora do bloco da segunda via,
também cobre a primeira emissão, quando o POST devolve 201 com o `qrCode` vazio.

No começo do `registraLinha.each { it -> ... }`, zerar `retornoQrcode = null`
junto com as outras variáveis.

```groovy
  // NOVO - GERAR PIX
  // Atenção: aqui é "if" e não "se" - dentro do "se" o "it" fica nulo.
  guiaAtual = it
  if (!QRCodeURL && guiaAtual.boletoPix == "SIM" && linhaDigitavel) {
    motivoBB = retornoQrcode?.'pix.textoRetorno' ?: 'não informado'
    imprimir "QR vazio na baixa " + guiaAtual.nroBaixa + ". Motivo do BB: [" + motivoBB + "]. Tentando gerar-pix..."

    respGerar = Http.servico(guiaAtual.urlBoleto + "/boletos/" + guiaAtual.boletoNumero + "/gerar-pix")
      .parametro('gw-dev-app-key', guiaAtual.gwAppKey)
      .cabecalho('Authorization', 'Bearer ' + accessToken)
      .cabecalho("Content-Type", "application/json")
      .POST('{"numeroConvenio":' + guiaAtual.nroConvenio + '}', Http.JSON)

    statusGerar = respGerar.codigo()
    retGerar = respGerar.json()
    imprimir "DIAG GERAR-PIX -> baixa=" + guiaAtual.nroBaixa + " status=" + statusGerar + " retorno=" + retGerar

    if (statusGerar >= 200 && statusGerar <= 299) {
      // o BB às vezes devolve as chaves com ponto ("qrCode.url") e às vezes aninhadas (qrCode.url)
      QRCodeURL   = retGerar?.'qrCode.url'  ?: retGerar?.qrCode?.url  ?: ''
      QRCodeTXID  = retGerar?.'qrCode.txId' ?: retGerar?.qrCode?.txId ?: QRCodeTXID ?: ''
      QRCodeTXEMV = retGerar?.'qrCode.emv'  ?: retGerar?.qrCode?.emv  ?: ''
    }

    if (!QRCodeURL) {
      // continua sem QR: avisa o usuário, mas não trava a emissão (o boleto pelo código de barras vale)
      Notificacao.nova("Guia " + guiaAtual.nroBaixa + " (" + guiaAtual.nomeContribuinte + ") saiu SEM QR code Pix: o Banco do Brasil não gerou o Pix. Motivo informado pelo banco: " + motivoBB)
      .para(usuario.id)
      .enviar()
    }
  }
```

A primeira versão usava `se (...)` com `it.nroBaixa` dentro e quebrou:
*"A propriedade 'nroBaixa' não é acessível em um elemento nulo"*. No BFC, dentro
do `se { }` o `it` deixa de ser o item do `.each`. Por isso o `guiaAtual = it`
e o `if`.

**Se o `gerar-pix` também falhar com Abend:** a falha é do lado do BB para
aquele título. Abrir chamado no BB (gerente ou suporte da API de Cobrança)
passando o número do título (`000` + convênio + baixa com 10 dígitos), o texto do
Abend e o campo `ocorrencia` do erro.

---

## Outros problemas do script vistos no caminho (não corrigidos)

O script padrão "Guia Registrada BB PIX V2" tem estes pontos fracos, que valem
para qualquer município:

1. **Segredos no log.** O `imprimir linha` despeja `client_secret` e
   `Authorization Basic`, e o laço do token imprime o access token inteiro. Na
   versão corrigida a linha virou um resumo e o token sai só com 10 caracteres.
   Avaliar com a prefeitura a troca da credencial no portal do BB quando o log
   tiver circulado.
2. **POST com erro que não é 400 passa em silêncio.** O teste
   `statusCode >= 300 && (statusCode == 400 && ...)` só trata 400. Um 401, 429
   ou 5xx não cai em nenhum `se`, e a guia sai **com a linha digitável da guia
   anterior**, porque o laço zera `linhaDigitavelRet` mas usa `linhaDigitavel`.
3. **Consulta do `/pix` com 404 ou 5xx** também passa sem aviso.
4. **`accessToken` é o do último token obtido.** Com mais de um número de
   configuração na mesma emissão, as guias podem ir com o token errado.
5. **`nomeContribuinte` nas mensagens de erro** é a variável global, ou seja, o
   nome da última guia montada, não o da guia que falhou.

## Procedência

Logs de execução do Studio enviados pelo Felipe em 03/11/2026 (baixas 10266 e
10273, Rurópolis). O significado de `5208499` (boleto sem Pix) vem dos scripts de
Dona Emma e Campo Alegre no corpus, que tratam esse código limpando o QR.
