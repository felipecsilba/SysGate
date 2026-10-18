// Busca insensível a acento e caixa ("eco" acha "Econômicos").
export function normalizar(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

export function contem(texto, busca) {
  return normalizar(texto).includes(normalizar(busca))
}
