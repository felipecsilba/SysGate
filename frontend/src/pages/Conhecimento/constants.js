export const TIPO_CONFIG = {
  faq:             { label: 'FAQ',           cls: 'bg-blue-100 text-blue-700' },
  erro:            { label: 'Erro',          cls: 'bg-red-100 text-red-700' },
  'passo-a-passo': { label: 'Passo a Passo', cls: 'bg-green-100 text-green-700' },
  dica:            { label: 'Dica',          cls: 'bg-amber-100 text-amber-700' },
  outro:           { label: 'Outro',         cls: 'bg-gray-100 text-gray-600' },
}

export const TIPO_OPTS = Object.entries(TIPO_CONFIG).map(([value, { label }]) => ({ value, label }))
