import http from 'node:http'

// Uma tentativa: true se o servidor respondeu com status < 500.
function tentar(url) {
  return new Promise(resolve => {
    const req = http.get(url, res => {
      res.resume()
      resolve(res.statusCode < 500)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(2000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

// Repete GET até o servidor responder ou o tempo acabar. Sem dependências.
export async function aguardarUrl(url, { timeoutMs = 30000, intervaloMs = 250 } = {}) {
  const limite = Date.now() + timeoutMs
  while (Date.now() < limite) {
    if (await tentar(url)) return true
    await new Promise(r => setTimeout(r, intervaloMs))
  }
  return false
}
