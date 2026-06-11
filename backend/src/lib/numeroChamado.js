// Geração do protocolo persistido do chamado: PREFIXO-YYYY-NNNNN
// PREFIXO = 4 primeiras letras do município sem acentos (ou "CH" se sem município).
// Sequencial reinicia por (prefixo, ano). Persistido no banco para ser estável
// mesmo que chamados sejam deletados.

// Range de marcas diacríticas combinantes (U+0300–U+036F) sem depender do encoding do arquivo
const DIACRITICOS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g')

function prefixoMunicipio(municipio) {
  if (!municipio) return 'CH'
  const p = municipio
    .normalize('NFD').replace(DIACRITICOS, '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
  return p || 'CH'
}

// Gera o próximo número único dentro de uma transação Prisma (tx).
// Escaneia os números já usados para o mesmo prefixo+ano e retorna max+1.
// SQLite serializa escritas; o chamador deve repetir em caso de colisão P2002.
async function gerarNumero(tx, { municipio, criadoEm = new Date() } = {}) {
  const ano = new Date(criadoEm).getFullYear()
  const prefixo = prefixoMunicipio(municipio)
  const existentes = await tx.chamado.findMany({
    where: { numero: { startsWith: `${prefixo}-${ano}-` } },
    select: { numero: true },
  })
  let maxSeq = 0
  for (const e of existentes) {
    const m = e.numero && e.numero.match(/-(\d+)$/)
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10))
  }
  return `${prefixo}-${ano}-${String(maxSeq + 1).padStart(5, '0')}`
}

module.exports = { prefixoMunicipio, gerarNumero }
