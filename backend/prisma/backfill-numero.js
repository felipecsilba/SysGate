// Backfill: gera o número persistido (PREFIXO-YYYY-NNNNN) para chamados antigos.
// Sequência por (prefixo, ano) na ordem de criação (id asc), preservando a
// numeração que o frontend exibia. Idempotente: só processa chamados com numero null.
const { PrismaClient } = require('@prisma/client')
const { prefixoMunicipio } = require('../src/lib/numeroChamado')

const prisma = new PrismaClient()

async function main() {
  // Inicializa contadores com o maior sequencial já existente por prefixo+ano
  const jaNumerados = await prisma.chamado.findMany({
    where: { NOT: { numero: null } },
    select: { numero: true },
  })
  const counters = {}
  for (const c of jaNumerados) {
    const m = c.numero && c.numero.match(/^(.+)-(\d+)$/)
    if (m) counters[m[1]] = Math.max(counters[m[1]] || 0, parseInt(m[2], 10))
  }

  const pendentes = await prisma.chamado.findMany({
    where: { numero: null },
    orderBy: { id: 'asc' },
    select: { id: true, municipio: true, criadoEm: true },
  })

  for (const c of pendentes) {
    const ano = new Date(c.criadoEm).getFullYear()
    const key = `${prefixoMunicipio(c.municipio)}-${ano}`
    counters[key] = (counters[key] || 0) + 1
    const numero = `${key}-${String(counters[key]).padStart(5, '0')}`
    await prisma.chamado.update({ where: { id: c.id }, data: { numero } })
  }

  console.log(`✅ Backfill concluído: ${pendentes.length} chamado(s) numerado(s).`)
}

main()
  .catch((e) => { console.error('❌ Erro no backfill:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
