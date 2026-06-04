// ── Cores oficiais Betha por vertical ────────────────────────────────────────

export const CORES_VERTICAIS = {
  'Contábil':         '#7868C8',
  'Contratos':        '#E04060',
  'Arrecadação':      '#00C87A',
  'Pessoal':          '#3DB8E8',
  'Atendimento':      '#8898A8',
  'NoPaper':          '#1B2B6B',
  'Educação':         '#F0A820',
  'Saúde':            '#78C880',
  'Gestão Municipal': '#A09080',
}

export const COR_OUTROS_HEX = '#94A3B8'

export function corVertical(v) {
  return CORES_VERTICAIS[v] || COR_OUTROS_HEX
}

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}
