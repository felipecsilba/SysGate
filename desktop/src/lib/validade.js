// Validade dos tokens Betha (no máximo 15 dias).
// A data é tratada como dia de calendário (AAAA-MM-DD): a API devolve meia-noite UTC e,
// convertida para UTC−3, cairia no dia anterior — o web mostrava um dia a menos.

const DIA_MS = 24 * 60 * 60 * 1000

function diaLocal(data) {
  return Date.UTC(data.getFullYear(), data.getMonth(), data.getDate())
}

function diaDaString(texto) {
  const [a, m, d] = String(texto).slice(0, 10).split('-').map(Number)
  return Date.UTC(a, m - 1, d)
}

export function diasRestantes(dataVencimento, hoje = new Date()) {
  if (!dataVencimento) return null
  return Math.round((diaDaString(dataVencimento) - diaLocal(hoje)) / DIA_MS)
}

const plural = (n, palavra) => `${n} ${palavra}${n === 1 ? '' : 's'}`

export function estadoValidade(dias) {
  if (dias === null || dias === undefined) return null
  if (dias < 0) return { rotulo: `Expirado há ${plural(-dias, 'dia')}`, tom: 'vermelho' }
  if (dias === 0) return { rotulo: 'Vence hoje', tom: 'laranja' }
  if (dias === 1) return { rotulo: 'Vence amanhã', tom: 'laranja' }
  const rotulo = `Vence em ${dias} dias`
  if (dias <= 7) return { rotulo, tom: 'laranja' }
  if (dias <= 30) return { rotulo, tom: 'amarelo' }
  return { rotulo, tom: 'verde' }
}

function iso(data) {
  const p = n => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`
}

// Faixa aceita no campo de data: de hoje até hoje + 15 dias
export function limitesData(hoje = new Date()) {
  const max = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 15)
  return { min: iso(hoje), max: iso(max) }
}

// Validade de um token recém-emitido: hoje + N dias (o Betha Admin emite com 15)
export function dataMaisDias(dias, hoje = new Date()) {
  return iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias))
}

// Aviso na lista de municípios: quantos tokens já venceram (inclui "vence hoje") e,
// entre os que vencem em até 3 dias, em quantos dias vence o mais próximo
export function resumoValidade(datas, hoje = new Date()) {
  let vencidos = 0
  let venceEmDias = null
  for (const d of datas) {
    const dias = diasRestantes(d, hoje)
    if (dias === null) continue
    if (dias <= 0) vencidos++
    else if (dias <= 3 && (venceEmDias === null || dias < venceEmDias)) venceEmDias = dias
  }
  return { vencidos, venceEmDias }
}
