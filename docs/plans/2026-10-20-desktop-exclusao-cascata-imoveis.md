# Plano: Exclusão em cascata de imóveis (Krakion App)

**Goal:** colar o resultado do Levantamento de vínculos (JSONL) e o App mostrar a análise (resumo, quantidade por
dependência, casos para revisar) e o plano na ordem da receita validada, com os lotes prontos. Fase 2: enviar cada
etapa pelo App, consultando o idLote sozinho. Caso real: imóveis códigos 11 a 2402 de Placas (~2.392).

**Decisões (2026-10-20):**
- Entrada: botão "Analisar resultado" no cartão do Levantamento (Mapa de dependências → Imóvel). Rota `/mapa/exclusao`.
- Só a receita **validada** entra no plano: proprietários (`DELETE /api/imoveisResponsaveis`) → movimentações
  (`DELETE /api/imoveisMovimentacoes`, o histórico sai junto) → reprocessar inscrição (`PUT …InscricoesImobiliarias`,
  só imóveis que têm a linha) → imóveis (`DELETE /api/imoveis`). Lotes de 50.
- Fora do plano, listados para revisão: imóvel com vínculo financeiro, não encontrado, ou com filho cuja exclusão não foi
  validada (corresponsáveis, testadas, englobados, benefícios fiscais).
- **PUT de inscrição nunca vazio**: lote sem ids não é gerado (testado).
- Fase 2: "Enviar etapa" (o Felipe clica). Envia os lotes da etapa, consulta cada idLote até sair de NAO_PROCESSADO,
  mostra sucesso ou erro por imóvel. A etapa seguinte só libera quando a anterior termina. O PUT não devolve idLote:
  fica "enviado". O progresso real é conferido rodando o levantamento de novo (é a fonte da verdade).

**Arquivos:** `src/lib/exclusaoImoveis.js` (+ teste) · `src/pages/Mapa/ExclusaoCascata.jsx` · curado: script com
`analisa: "levantamentoImoveis"`.
