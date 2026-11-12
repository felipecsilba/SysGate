// Envio em rajada para a API assíncrona da Betha: manda TODOS os lotes (em paralelo ou um a cada intervaloMs) e só depois consulta os
// idLotes em rodadas — a fila da Betha processa enquanto os outros chegam. Antes era lote → espera sair da fila → próximo,
// e 75 lotes somavam as filas uma atrás da outra.
//   enviarLote(lote)            → { status: 'fila', idLote } | retorno final (erro / ok / parcial)
//   consultarLote(lote, idLote) → { status: 'fila' } | retorno final
//   aoMudar(lote, retorno)      → atualiza a tela
// Devolve { pendentes: [{ lote, idLote }] } — o que ainda estava na fila ao parar ou estourar o limite.
// paralelo: quantos envios ao mesmo tempo (sem intervalo entre eles). Sem paralelo: um por vez, com intervaloMs.
// O limite da Betha (~140 chamadas por janela) é tratado em quem chama: no 429, todos esperam e tentam de novo.
export async function enviarEmRajada(lotes, {
  enviarLote, consultarLote, aoMudar, esperar, paralelo = 1,
  parar = () => false, intervaloMs = 1000, pausaRodadaMs = 5000, limiteMs = 30 * 60 * 1000, relogio = Date.now,
}) {
  let fila = []
  const restantes = [...lotes]
  let primeiro = true
  const trabalhador = async () => {
    while (restantes.length && !parar()) {
      const lote = restantes.shift()
      if (paralelo === 1 && !primeiro) await esperar(intervaloMs)
      primeiro = false
      const r = await enviarLote(lote)
      aoMudar(lote, r)
      if (r.status === 'fila' && r.idLote) fila.push({ lote, idLote: r.idLote })
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(paralelo, lotes.length)) }, trabalhador))
  fila.sort((a, b) => lotes.indexOf(a.lote) - lotes.indexOf(b.lote))

  const ate = relogio() + limiteMs
  while (fila.length && !parar() && relogio() < ate) {
    const ainda = []
    for (const p of fila) {
      if (parar() || relogio() >= ate) { ainda.push(p); continue }
      const r = await consultarLote(p.lote, p.idLote)
      if (r.status === 'fila') ainda.push(p)
      else aoMudar(p.lote, r)
      await esperar(intervaloMs)
    }
    fila = ainda
    if (fila.length && !parar()) await esperar(pausaRodadaMs)
  }
  return { pendentes: fila }
}
