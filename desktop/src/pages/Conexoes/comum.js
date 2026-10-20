export const drive = window.krakion?.drive

// Desembrulha o { ok, dados, erro } do main
export async function chamar(fn, ...args) {
  const r = await fn(...args)
  if (!r?.ok) throw new Error(r?.erro || 'Falha inesperada.')
  return r.dados
}

export const dataHora = iso => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—')
