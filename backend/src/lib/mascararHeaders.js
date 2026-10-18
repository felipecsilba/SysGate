// Histórico de requisições não guarda o token em texto puro: Authorization vira "Bearer abcdef12••••".
// Usado ao gravar (proxy.js) e ao ler (requisicoes.js — cobre registros antigos).
const MASCARA = '••••'

function mascararValor(valor) {
  const texto = String(valor)
  if (texto.endsWith(MASCARA)) return texto
  const m = texto.match(/^(Bearer\s+)?(.*)$/i)
  return `${m[1] || ''}${m[2].slice(0, 8)}${MASCARA}`
}

function mascararHeaders(headers) {
  if (!headers || typeof headers !== 'object') return headers
  const copia = { ...headers }
  for (const chave of Object.keys(copia)) {
    if (chave.toLowerCase() === 'authorization' && copia[chave]) copia[chave] = mascararValor(copia[chave])
  }
  return copia
}

module.exports = { mascararHeaders }
