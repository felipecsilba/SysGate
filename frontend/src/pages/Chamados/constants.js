// ── Constantes de cores ──────────────────────────────────────────────────────
export const STATUS_CORES = {
  'Nao Analisado':      '#94A3B8',
  'Em Analise':         '#3B82F6',
  'Em Atendimento':     '#F59E0B',
  'Aguardando Retorno': '#F97316',
  'Concluido':          '#22C55E',
}

export const CLASSIF_CORES = {
  'Pendencia de Migracao': '#8B5CF6',
  'Configuracao':          '#3B82F6',
  'Bug':                   '#EF4444',
  'Duvida':                '#F59E0B',
}

export const PRIORIDADE_CORES = {
  'Baixa':   '#94A3B8',
  'Normal':  '#3B82F6',
  'Alta':    '#F59E0B',
  'Urgente': '#EF4444',
}

export const STATUS_OPTS    = ['Nao Analisado', 'Em Analise', 'Em Atendimento', 'Aguardando Retorno', 'Concluido']
export const CLASSIF_OPTS   = ['', 'Pendencia de Migracao', 'Configuracao', 'Bug', 'Duvida']
export const PRIORIDADE_OPTS = ['Baixa', 'Normal', 'Alta', 'Urgente']

// ── Histórico: metadados por tipo ────────────────────────────────────────────
export const HISTORICO_META = {
  criacao:       { cor: '#22C55E', label: 'Chamado criado' },
  status:        { cor: '#3B82F6', label: 'Status' },
  responsavel:   { cor: '#8B5CF6', label: 'Responsável' },
  classificacao: { cor: '#6366f1', label: 'Classificação' },
  prioridade:    { cor: '#F59E0B', label: 'Prioridade' },
  titulo:        { cor: '#64748B', label: 'Título' },
  vertical:      { cor: '#EC4899', label: 'Vertical' },
}

// ── Palette para gráficos ────────────────────────────────────────────────────
export const PALETTE = ['#6366f1', '#3B82F6', '#22C55E', '#F59E0B', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatData(data) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDataHora(data) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export function descreverHistorico(h) {
  switch (h.tipo) {
    case 'criacao':      return 'Chamado criado'
    case 'status':       return h.valorAntes ? `De "${h.valorAntes}" → "${h.valorDepois}"` : `Status: "${h.valorDepois}"`
    case 'responsavel':
      if (!h.valorDepois) return `Responsável removido${h.valorAntes ? ` (era ${h.valorAntes})` : ''}`
      if (!h.valorAntes)  return `Responsável atribuído: ${h.valorDepois}`
      return `Responsável: ${h.valorAntes} → ${h.valorDepois}`
    case 'classificacao':
      if (!h.valorDepois) return `Classificação removida${h.valorAntes ? ` (era ${h.valorAntes})` : ''}`
      return h.valorAntes ? `${h.valorAntes} → ${h.valorDepois}` : `Classificado como "${h.valorDepois}"`
    case 'prioridade':   return h.valorAntes ? `${h.valorAntes} → ${h.valorDepois}` : `Prioridade: ${h.valorDepois}`
    case 'titulo':       return 'Título alterado'
    case 'vertical':
      if (!h.valorDepois) return 'Vertical removida'
      return h.valorAntes ? `${h.valorAntes} → ${h.valorDepois}` : `Vertical: ${h.valorDepois}`
    default:             return h.tipo
  }
}
