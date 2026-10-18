// Senha nunca vai para as capturas: campos com senha/password no corpo viram "[mascarado]".
// Cobre formulário (JSF do Betha Admin: mainForm:senha=…) e JSON.
const CHAVE_SENHA = /senha|password|passwd|pwd/i

function mascararCorpo(corpo) {
  if (corpo == null) return corpo
  if (typeof corpo === 'object') {
    if (Array.isArray(corpo)) return corpo.map(mascararCorpo)
    return Object.fromEntries(Object.entries(corpo).map(([k, v]) => [k, CHAVE_SENHA.test(k) && v ? '[mascarado]' : mascararCorpo(v)]))
  }
  if (typeof corpo !== 'string' || !corpo.includes('=')) return corpo
  return corpo.split('&').map(par => {
    const i = par.indexOf('=')
    if (i < 0) return par
    let chave = par.slice(0, i)
    try { chave = decodeURIComponent(chave) } catch {}
    return CHAVE_SENHA.test(chave) && par.slice(i + 1) ? `${par.slice(0, i)}=[mascarado]` : par
  }).join('&')
}

module.exports = { mascararCorpo }
