// Nomes dos backups: <grupo>-AAAA-MM-DD_HHMMSS.<ext> (com segundos: automático e manual podem cair no mesmo minuto) — o carimbo ordena como texto.

const dois = n => String(n).padStart(2, '0')

export function carimbo(d = new Date()) {
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}_${dois(d.getHours())}${dois(d.getMinutes())}${dois(d.getSeconds())}`
}

const PADRAO = /^(.+)-(\d{4}-\d{2}-\d{2}_\d{4}(?:\d{2})?)\./

// arquivos: [{ id, name }] de uma pasta do Drive → os que passam dos `manter` mais recentes de cada grupo.
// Arquivos fora do padrão nunca são apagados.
export function paraApagar(arquivos, manter) {
  const grupos = new Map()
  for (const a of arquivos) {
    const m = PADRAO.exec(a.name)
    if (!m) continue
    if (!grupos.has(m[1])) grupos.set(m[1], [])
    grupos.get(m[1]).push({ ...a, _carimbo: m[2] })
  }
  const saida = []
  for (const lista of grupos.values()) {
    lista.sort((x, y) => (x._carimbo < y._carimbo ? 1 : -1))
    saida.push(...lista.slice(manter).map(({ _carimbo, ...a }) => a))
  }
  return saida
}
