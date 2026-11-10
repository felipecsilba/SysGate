// Área tributária de cada nó: pela pasta do conhecimento ou por palavra-chave (curado.json).
import { semAcento } from './biblioteca.mjs'

/** Palavras do texto: separa camelCase, _, -, espaço e pontuação; sem acento e minúsculas. */
export function tokens(texto) {
  return semAcento(texto)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(t => t.toLowerCase())
}

/** ids das áreas do nó. Pasta do conhecimento vence; senão, palavra-chave casando com o começo de um token. */
export function areaDe(no, areas) {
  if (no.pasta) {
    const daPasta = areas.filter(a => (a.pastas || []).includes(no.pasta))
    if (daPasta.length) return daPasta.map(a => a.id).sort()
  }
  const ts = tokens(`${no.id.slice(no.id.indexOf(':') + 1)} ${no.rotulo || ''}`)
  return areas
    .filter(a => (a.palavras || []).some(p => ts.some(t => t.startsWith(p))))
    .map(a => a.id)
    .sort()
}
