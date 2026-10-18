// Parâmetros de path ({id}) viram campos próprios no Sandbox.
export function parametrosDoPath(path) {
  return [...new Set([...String(path || '').matchAll(/\{([^}]+)\}/g)].map(m => m[1]))]
}

export function preencherPath(path, valores) {
  return String(path || '').replace(/\{([^}]+)\}/g, (inteiro, nome) => {
    const v = valores?.[nome]
    return v != null && String(v).trim() !== '' ? encodeURIComponent(String(v).trim()) : inteiro
  })
}

// Exatamente o que o proxy chama (`${sistema.urlBase}${path}`)
export function urlFinal(urlBase, path) {
  return `${urlBase || ''}${path || ''}`
}
