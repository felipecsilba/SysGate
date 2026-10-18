import fs from 'node:fs'

// Aviso de "nova versão" enquanto o app é construído: o atalho roda a interface compilada (dist/)
// e o código do backend/núcleo como estavam ao abrir. Mudou a interface → recarregar a tela;
// mudou backend/ ou electron/ → reiniciar o app (banco e backend sobem de novo).

const FORCA = { interface: 1, completo: 2 }

// raiz: 'dist' | 'electron' | 'backend'; relativo: caminho do arquivo dentro dela
export function classificarMudanca(raiz, relativo) {
  if (!relativo) return null
  const nome = String(relativo).toLowerCase()
  if (/\.test\.js$|\.map$|~$|\.tmp$|\.swp$/.test(nome)) return null
  if (raiz === 'dist') return 'interface'
  if (raiz === 'electron' || raiz === 'backend') return /\.(c?js|mjs|html)$/.test(nome) ? 'completo' : null
  return null
}

export function maisForte(a, b) {
  return (FORCA[b] ?? 0) > (FORCA[a] ?? 0) ? b : a
}

// Vigia as pastas e chama aoMudar(tipo) uma vez por rajada de mudanças (um build mexe em vários arquivos).
export function vigiar({ desktop, backendSrc }, aoMudar, esperaMs = 1500) {
  let pendente = null
  let timer = null
  const marcar = tipo => {
    if (!tipo) return
    pendente = maisForte(pendente, tipo)
    clearTimeout(timer)
    timer = setTimeout(() => {
      const t = pendente
      pendente = null
      aoMudar(t)
    }, esperaMs)
  }

  const vigias = [
    fs.watch(desktop, { recursive: true }, (_e, nome) => {
      if (!nome) return
      const [topo, ...resto] = nome.split(/[\\/]/)
      if (topo === 'dist' || topo === 'electron') marcar(classificarMudanca(topo, resto.join('/')))
    }),
    fs.watch(backendSrc, { recursive: true }, (_e, nome) => marcar(classificarMudanca('backend', nome))),
  ]
  for (const v of vigias) v.on('error', e => console.error('[nova-versao]', e.message))

  return () => {
    clearTimeout(timer)
    vigias.forEach(v => v.close())
  }
}
