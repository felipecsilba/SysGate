export const PREFERENCIAS = ['sistema', 'claro', 'escuro']

export const ROTULO_PREFERENCIA = {
  sistema: 'Tema do sistema',
  claro: 'Tema claro',
  escuro: 'Tema escuro',
}

// Preferência salva + tema do Windows → tema aplicado ('claro' | 'escuro').
export function resolverTema(preferencia, sistemaEscuro) {
  if (preferencia === 'claro' || preferencia === 'escuro') return preferencia
  return sistemaEscuro ? 'escuro' : 'claro'
}

export function proximaPreferencia(atual) {
  const i = PREFERENCIAS.indexOf(atual)
  return i === -1 ? 'claro' : PREFERENCIAS[(i + 1) % PREFERENCIAS.length]
}
