const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const eps = await prisma.endpoint.findMany({
    where: {
      OR: [
        { nome: { contains: 'creditosTributarios' } },
        { path: { contains: 'creditosTributarios' } },
      ],
    },
  })

  console.log('Endpoints encontrados:', eps.length)

  for (const ep of eps) {
    console.log(`\nID: ${ep.id} | Nome: ${ep.nome} | Path: ${ep.path}`)

    if (!ep.bodySchema) {
      console.log('  Sem bodySchema, pulando.')
      continue
    }

    const str = ep.bodySchema
    const ativaCount = (str.match(/ATIVA/g) || []).length
    console.log(`  Ocorrências de "ATIVA": ${ativaCount}`)

    if (ativaCount > 0) {
      const novoSchema = str.replace(/ATIVA/g, 'ATIVO')
      await prisma.endpoint.update({
        where: { id: ep.id },
        data: { bodySchema: novoSchema },
      })
      console.log(`  Atualizado: ${ativaCount} ocorrência(s) "ATIVA" → "ATIVO"`)
    }
  }

  await prisma.$disconnect()
  console.log('\nConcluído.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
