// Modelos da API: requisições prontas (sistema, endpoint, método, campos, valores, JSON) para reusar.
// Guardados no próprio app (localStorage do Electron — persiste em userData). O município NÃO entra:
// o mesmo modelo serve para qualquer município. `armazenamento` injetável para teste.
export const CHAVE_MODELOS = 'krakion-desktop-modelos'

export function lerModelos(armazenamento = globalThis.localStorage) {
  try {
    const lista = JSON.parse(armazenamento.getItem(CHAVE_MODELOS) || '[]')
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function gravar(armazenamento, lista) {
  armazenamento.setItem(CHAVE_MODELOS, JSON.stringify(lista))
}

export function salvarModelo(armazenamento = globalThis.localStorage, modelo, agora = new Date()) {
  const lista = lerModelos(armazenamento)
  const existente = modelo.id && lista.find(m => m.id === modelo.id)
  const salvo = existente
    ? { ...existente, ...modelo, atualizadoEm: agora.toISOString() }
    : { ...modelo, id: `m${agora.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`, criadoEm: agora.toISOString(), atualizadoEm: agora.toISOString() }
  gravar(armazenamento, [salvo, ...lista.filter(m => m.id !== salvo.id)])
  return salvo
}

export function removerModelo(armazenamento = globalThis.localStorage, id) {
  gravar(armazenamento, lerModelos(armazenamento).filter(m => m.id !== id))
}
