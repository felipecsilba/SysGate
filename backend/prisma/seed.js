const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Cria usuário admin padrão (idempotente — não recria se já existir)
  const adminExistente = await prisma.usuario.findUnique({ where: { login: 'admin' } })
  if (!adminExistente) {
    await prisma.usuario.create({
      data: {
        login: 'admin',
        senhaHash: await bcrypt.hash('admin123', 10),
        nome: 'Administrador',
        role: 'admin',
        ativo: true,
      },
    })
    console.log('   👤 Usuário admin criado (login: admin / senha: admin123)')
  }

  // Limpa dados existentes
  await prisma.requisicao.deleteMany()
  await prisma.script.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.endpoint.deleteMany()
  await prisma.municipio.deleteMany()

  // Cria municípios de exemplo
  const municipio1 = await prisma.municipio.create({
    data: {
      nome: 'São Paulo (Demo)',
      observacoes: 'Município de demonstração — São Paulo. Token fictício para testes.',
      ativo: true,
    },
  })

  const municipio2 = await prisma.municipio.create({
    data: {
      nome: 'Florianópolis (Demo)',
      observacoes: 'Município de demonstração — Florianópolis. Ambiente de produção fictício.',
      ativo: false,
    },
  })

  // Cria endpoints de exemplo do SysGate
  const ep1 = await prisma.endpoint.create({
    data: {
      modulo: 'ISS',
      nome: 'Listar Contribuintes',
      path: '/contribuintes',
      metodo: 'GET',
      descricao: 'Retorna a lista paginada de contribuintes cadastrados.',
      bodySchema: JSON.stringify([]),
    },
  })

  const ep2 = await prisma.endpoint.create({
    data: {
      modulo: 'ISS',
      nome: 'Criar Nota Fiscal',
      path: '/notas-fiscais',
      metodo: 'POST',
      descricao: 'Emite uma nova nota fiscal de serviço.',
      bodySchema: JSON.stringify([
        { campo: 'cnpjPrestador', tipo: 'string', obrigatorio: true, descricao: 'CNPJ do prestador de serviços' },
        { campo: 'cpfCnpjTomador', tipo: 'string', obrigatorio: true, descricao: 'CPF ou CNPJ do tomador' },
        { campo: 'valorServico', tipo: 'number', obrigatorio: true, descricao: 'Valor total do serviço' },
        { campo: 'codigoServico', tipo: 'string', obrigatorio: true, descricao: 'Código do serviço conforme LC 116' },
        { campo: 'discriminacao', tipo: 'string', obrigatorio: true, descricao: 'Descrição do serviço prestado' },
        { campo: 'dataCompetencia', tipo: 'string', obrigatorio: false, descricao: 'Data de competência (YYYY-MM-DD)' },
        { campo: 'municipioPrestacao', tipo: 'string', obrigatorio: false, descricao: 'Código IBGE do município de prestação' },
      ]),
    },
  })

  const ep3 = await prisma.endpoint.create({
    data: {
      modulo: 'IPTU',
      nome: 'Consultar Imóvel',
      path: '/imoveis/{inscricao}',
      metodo: 'GET',
      descricao: 'Retorna dados cadastrais de um imóvel pela inscrição municipal.',
      bodySchema: JSON.stringify([]),
    },
  })

  // Cria tags de exemplo
  const tagManutencao = await prisma.tag.create({ data: { nome: 'manutenção' } })
  const tagISS = await prisma.tag.create({ data: { nome: 'ISS' } })
  const tagIPTU = await prisma.tag.create({ data: { nome: 'IPTU' } })
  const tagMigracao = await prisma.tag.create({ data: { nome: 'migração' } })

  // Cria scripts de exemplo
  await prisma.script.create({
    data: {
      titulo: 'Reprocessar NFS-e com erro de transmissão',
      conteudo: `-- Reprocessa notas fiscais com status de erro de transmissão
-- Ajuste o municipio_id conforme necessário
UPDATE nfse
SET status = 'AGUARDANDO_ENVIO',
    tentativas = 0,
    erro_transmissao = NULL,
    data_ultima_tentativa = NULL
WHERE status = 'ERRO_TRANSMISSAO'
  AND municipio_id = :municipio_id
  AND data_emissao >= CURRENT_DATE - INTERVAL '30 days';

-- Verificar resultado:
SELECT COUNT(*) as total_reprocessadas FROM nfse
WHERE status = 'AGUARDANDO_ENVIO' AND municipio_id = :municipio_id;`,
      categoria: 'sql',
      municipioId: municipio1.id,
      tags: { connect: [{ id: tagManutencao.id }, { id: tagISS.id }] },
    },
  })

  await prisma.script.create({
    data: {
      titulo: 'Consistência de valores IPTU — exercício atual',
      conteudo: `-- Identifica lançamentos de IPTU com valor zerado ou divergente
-- Execute no banco do município após migração de dados
SELECT
  i.inscricao_municipal,
  i.endereco,
  l.ano_exercicio,
  l.valor_lancado,
  l.valor_venal_terreno,
  l.valor_venal_construcao,
  ROUND((l.valor_venal_terreno + l.valor_venal_construcao) * 0.01, 2) AS valor_calculado,
  ABS(l.valor_lancado - ROUND((l.valor_venal_terreno + l.valor_venal_construcao) * 0.01, 2)) AS diferenca
FROM lancamentos_iptu l
INNER JOIN imoveis i ON i.id = l.imovel_id
WHERE l.ano_exercicio = EXTRACT(YEAR FROM CURRENT_DATE)
  AND (l.valor_lancado = 0 OR ABS(l.valor_lancado - ROUND((l.valor_venal_terreno + l.valor_venal_construcao) * 0.01, 2)) > 0.01)
ORDER BY diferenca DESC
LIMIT 100;`,
      categoria: 'sql',
      tags: { connect: [{ id: tagIPTU.id }, { id: tagMigracao.id }] },
    },
  })

  console.log('✅ Seed concluído!')
  console.log(`   📍 ${await prisma.municipio.count()} municípios criados`)
  console.log(`   🔌 ${await prisma.endpoint.count()} endpoints criados`)
  console.log(`   📝 ${await prisma.script.count()} scripts criados`)
  console.log(`   🏷️  ${await prisma.tag.count()} tags criadas`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
