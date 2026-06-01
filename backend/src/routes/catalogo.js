const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { exigirAdmin } = require('../middleware/autenticar')

const router = express.Router()
const prisma = new PrismaClient()

// Seed inicial com as verticais Betha oficiais
const SEED_VERTICAIS = [
  { nome: 'Contábil',         cor: '#7868C8', ordem: 0, sistemas: ['Contabilidade Pública', 'Tesouraria', 'Planejamento Orçamentário', 'Transparência'] },
  { nome: 'Contratos',        cor: '#E04060', ordem: 1, sistemas: ['Licitações e Contratos', 'Compras', 'Almoxarifado', 'Patrimônio'] },
  { nome: 'Arrecadação',      cor: '#00C87A', ordem: 2, sistemas: ['Tributação e Receitas', 'Dívida Ativa', 'ITBI', 'Certidões', 'ISS Web', 'NFSe'] },
  { nome: 'Pessoal',          cor: '#3DB8E8', ordem: 3, sistemas: ['Folha de Pagamento', 'Recursos Humanos', 'Ponto e Frequência', 'Portal do Servidor', 'PCCS'] },
  { nome: 'Atendimento',      cor: '#8898A8', ordem: 4, sistemas: ['Portal do Cidadão', 'Protocolo', 'Ouvidoria'] },
  { nome: 'NoPaper',          cor: '#1B2B6B', ordem: 5, sistemas: ['NoPaper Cloud', 'Assinatura Eletrônica'] },
  { nome: 'Educação',         cor: '#F0A820', ordem: 6, sistemas: ['Gestão Escolar', 'Transporte Escolar', 'Merenda Escolar'] },
  { nome: 'Saúde',            cor: '#78C880', ordem: 7, sistemas: ['e-Saúde', 'Prontuário Eletrônico', 'Farmácia', 'Regulação em Saúde'] },
  { nome: 'Gestão Municipal', cor: '#A09080', ordem: 8, sistemas: ['Frotas', 'Obras Públicas', 'Cemitério'] },
]

function parse(v) {
  return {
    ...v,
    sistemas: v.sistemas ? JSON.parse(v.sistemas) : [],
  }
}

// GET / — listar todas as verticais (com seed automático se vazio)
router.get('/', async (req, res) => {
  try {
    let verticais = await prisma.catalogoVertical.findMany({
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    })

    if (verticais.length === 0) {
      // Seed automático na primeira chamada
      await prisma.catalogoVertical.createMany({
        data: SEED_VERTICAIS.map((v) => ({
          nome: v.nome,
          cor: v.cor,
          ordem: v.ordem,
          sistemas: JSON.stringify(v.sistemas),
        })),
      })
      verticais = await prisma.catalogoVertical.findMany({
        orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      })
    }

    res.json(verticais.map(parse))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST / — criar vertical (admin)
router.post('/', exigirAdmin, async (req, res) => {
  try {
    const { nome, cor, sistemas, ordem } = req.body
    if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' })

    const vertical = await prisma.catalogoVertical.create({
      data: {
        nome: nome.trim(),
        cor: cor || '#94A3B8',
        sistemas: JSON.stringify(Array.isArray(sistemas) ? sistemas : []),
        ordem: typeof ordem === 'number' ? ordem : 999,
      },
    })
    res.status(201).json(parse(vertical))
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Já existe uma vertical com este nome.' })
    res.status(500).json({ error: err.message })
  }
})

// PUT /:id — atualizar vertical (admin)
router.put('/:id', exigirAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { nome, cor, sistemas, ordem } = req.body

    const vertical = await prisma.catalogoVertical.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome: nome.trim() }),
        ...(cor !== undefined && { cor }),
        ...(sistemas !== undefined && { sistemas: JSON.stringify(Array.isArray(sistemas) ? sistemas : []) }),
        ...(ordem !== undefined && { ordem }),
      },
    })
    res.json(parse(vertical))
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Vertical não encontrada.' })
    if (err.code === 'P2002') return res.status(409).json({ error: 'Já existe uma vertical com este nome.' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE /:id — remover vertical (admin)
router.delete('/:id', exigirAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const vertical = await prisma.catalogoVertical.findUnique({ where: { id } })
    if (!vertical) return res.status(404).json({ error: 'Vertical não encontrada.' })

    // Verificar se há sistemas vinculados no portfólio
    const nomeVertical = vertical.nome
    const emUso = await prisma.entidadeSistema.count({ where: { vertical: nomeVertical } })
    if (emUso > 0) {
      return res.status(409).json({
        error: `Vertical em uso em ${emUso} sistema${emUso !== 1 ? 's' : ''} do portfólio. Remova os vínculos antes de deletar.`,
      })
    }

    await prisma.catalogoVertical.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
