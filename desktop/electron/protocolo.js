import { net, protocol } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// app://krakion — serve a interface compilada (dist/) e repassa /api ao backend local.
// Faz o papel do proxy do Vite fora do dev: interface e API na mesma origem,
// então o CORS allowlist do backend continua intocado.
export const ORIGEM = 'app://krakion'
const DIST = path.resolve(import.meta.dirname, '..', 'dist')

// Precisa rodar antes do app ficar pronto
export function registrarEsquema() {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
    // Documentos dos municípios (PDFs grandes vão direto do disco para o leitor embutido, sem passar pela tela)
    { scheme: 'krakion-doc', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
  ])
}

// krakion-doc://municipios/<id codificado> → arquivo em Municipios/<município>/Legislacao (resolver barra o resto)
export function servirDocumentos(resolver) {
  protocol.handle('krakion-doc', req => {
    try {
      const url = new URL(req.url)
      const id = decodeURIComponent(url.pathname.replace(/^\//, ''))
      return net.fetch(pathToFileURL(resolver(id)).toString())
    } catch {
      return new Response('Não encontrado', { status: 404 })
    }
  })
}

export function servir(portaBackend) {
  protocol.handle('app', req => {
    const url = new URL(req.url)

    if (url.pathname.startsWith('/api/')) {
      return net.fetch(`http://127.0.0.1:${portaBackend}${url.pathname}${url.search}`, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        duplex: 'half',
      })
    }

    const arquivo = path.resolve(DIST, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname))
    if (!arquivo.startsWith(DIST + path.sep)) {
      return new Response('Não encontrado', { status: 404 })
    }
    return net.fetch(pathToFileURL(arquivo).toString())
  })
}
