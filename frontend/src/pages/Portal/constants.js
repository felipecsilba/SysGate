// ── Status traduzidos para a linguagem do cliente ────────────────────────────
// Os valores internos (STATUS_OPTS de Chamados) nunca são exibidos no portal.
export const STATUS_PORTAL = {
  'Nao Analisado':      { label: 'Recebido',                cor: '#3B82F6' },
  'Em Analise':         { label: 'Em análise',              cor: '#6366F1' },
  'Em Atendimento':     { label: 'Em atendimento',          cor: '#F59E0B' },
  'Aguardando Retorno': { label: 'Aguardando sua resposta', cor: '#F97316' },
  'Concluido':          { label: 'Resolvido',               cor: '#22C55E' },
  'Cancelado':          { label: 'Cancelado',               cor: '#6B7280' },
}

export function statusPortal(status) {
  return STATUS_PORTAL[status] || { label: status, cor: '#94A3B8' }
}

// Opções do filtro de status (valor interno → label do cliente)
export const STATUS_FILTRO_OPTS = Object.entries(STATUS_PORTAL).map(([valor, { label }]) => ({ valor, label }))

// ── Anexos — espelha a validação do backend (Fase 0) ─────────────────────────
export const MIME_PERMITIDOS = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf']
export const MAX_ANEXO_MB = 5

export function validarArquivo(file) {
  if (!MIME_PERMITIDOS.includes(file.type)) {
    return `"${file.name}": tipo não permitido. Aceitos: PNG, JPEG, GIF, WebP e PDF.`
  }
  if (file.size > MAX_ANEXO_MB * 1024 * 1024) {
    return `"${file.name}": excede o limite de ${MAX_ANEXO_MB} MB por arquivo.`
  }
  return null
}

// Converte File → base64 puro (sem o prefixo data:...;base64,)
export function arquivoParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Formatação ────────────────────────────────────────────────────────────────
export function formatData(data) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDataHora(data) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
