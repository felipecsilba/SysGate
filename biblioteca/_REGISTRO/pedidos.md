# Registro de pedidos BFC

Uma linha por peça entregue (fórmula, script, fonte dinâmica, crítica, relatório, pacote de API).
Serve para medir se a estrutura de agentes está funcionando: quantas peças rodam de primeira no
Studio, o que falha e se delegar compensa. Com uns 10 pedidos, dá para tirar conclusões.

**Quem preenche:** o orquestrador (skill `pedido-bfc`). Abre a linha na entrega (passo 6) e
completa "Rodadas" e "O que falhou" quando o Felipe contar o resultado no Studio (passo 7).

**Nunca registrar dado de contribuinte** (nome, CPF/CNPJ, inscrição): só município, peça e motivo.

## Colunas

| Coluna | O que vai |
|---|---|
| Data | Data da entrega, `AAAA-MM-DD` |
| Município | Nome do município |
| Peça | Tipo e nome curto (`script · varredura de vínculos`, `fórmula FORMULA_ACRESCIMO_DEBITO`, `relatório · imóveis por uso`, `API · exclusão de imóveis`) |
| Quem fez | `Opus` (sessão principal fez sozinha) ou o agente (`bfc-scripts`, `bfc-formulas`, `bfc-relatorios`, `bfc-api`, `itbi-transferencias`) |
| Base | Template, função pronta ou exemplo de produção de onde partiu (id do grafo), ou `do zero` |
| Revisor | `limpo`, `avisos: <regras>` ou `—` (peça sem código BFC, como um payload) |
| Rodadas | Vezes que rodou no Studio até dar certo: `1` = de primeira. `pendente` até o Felipe contar; `desistiu` se foi abandonada |
| O que falhou | Motivo de cada rodada extra, curto (`isEmpty em retorno de busca`, `filtro String sem aspas`, `regra do município errada`). Vazio se rodou de primeira |
| Virou | O que a falha gerou: `regra <nome>` no revisor, `lição N` no CONTEXTO, `conhecimento <área>`, `agente <nome>` ajustado, ou vazio |

## Pedidos

| Data | Município | Peça | Quem fez | Base | Revisor | Rodadas | O que falhou | Virou |
|---|---|---|---|---|---|---|---|---|
