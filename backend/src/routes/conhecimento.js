const { Router } = require('express')
const { exigirAdmin } = require('../middleware/autenticar')

const router = Router()
const prisma = require('../lib/prisma')

function parseConhecimento(c) {
  return {
    ...c,
    etiquetas: JSON.parse(c.etiquetas || '[]'),
    passos: JSON.parse(c.passos || '[]'),
  }
}

// GET /api/conhecimento — lista com filtros e paginação
router.get('/', async (req, res) => {
  try {
    const { busca, tipo, vertical, sistema, pagina = 1, limite = 20 } = req.query
    const skip = (parseInt(pagina) - 1) * parseInt(limite)

    const where = {}
    if (busca) {
      where.OR = [
        { titulo: { contains: busca, mode: 'insensitive' } },
        { descricao: { contains: busca, mode: 'insensitive' } },
        { conteudo: { contains: busca, mode: 'insensitive' } },
      ]
    }
    if (tipo) where.tipo = tipo
    if (vertical) where.vertical = vertical
    if (sistema) where.sistema = sistema

    const [data, total] = await Promise.all([
      prisma.conhecimento.findMany({
        where,
        include: {
          autor: { select: { id: true, nome: true } },
        },
        orderBy: { criadoEm: 'desc' },
        skip,
        take: parseInt(limite),
      }),
      prisma.conhecimento.count({ where }),
    ])

    res.json({
      data: data.map(parseConhecimento),
      total,
      pagina: parseInt(pagina),
      limite: parseInt(limite),
      totalPaginas: Math.ceil(total / parseInt(limite)),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/conhecimento/:id — detalhe
router.get('/:id', async (req, res) => {
  try {
    const c = await prisma.conhecimento.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        autor: { select: { id: true, nome: true } },
      },
    })
    if (!c) return res.status(404).json({ error: 'Artigo não encontrado' })
    res.json(parseConhecimento(c))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/conhecimento — qualquer autenticado
router.post('/', async (req, res) => {
  try {
    const { titulo, tipo, descricao, conteudo, passos, vertical, sistema, etiquetas } = req.body
    if (!titulo?.trim()) return res.status(400).json({ error: 'Título obrigatório' })

    const c = await prisma.conhecimento.create({
      data: {
        titulo: titulo.trim(),
        tipo: tipo || 'faq',
        descricao: descricao?.trim() || null,
        conteudo: conteudo || '',
        passos: JSON.stringify(passos || []),
        vertical: vertical || null,
        sistema: sistema || null,
        etiquetas: JSON.stringify(etiquetas || []),
        autorId: req.usuario.id,
      },
      include: {
        autor: { select: { id: true, nome: true } },
      },
    })
    res.status(201).json(parseConhecimento(c))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/conhecimento/:id — autor ou admin
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const existente = await prisma.conhecimento.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Artigo não encontrado' })

    const isAdmin = req.usuario.role === 'admin'
    if (!isAdmin && existente.autorId !== req.usuario.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este artigo' })
    }

    const { titulo, tipo, descricao, conteudo, passos, vertical, sistema, etiquetas } = req.body

    const c = await prisma.conhecimento.update({
      where: { id },
      data: {
        ...(titulo !== undefined && { titulo: titulo.trim() }),
        ...(tipo !== undefined && { tipo }),
        ...(descricao !== undefined && { descricao: descricao?.trim() || null }),
        ...(conteudo !== undefined && { conteudo }),
        ...(passos !== undefined && { passos: JSON.stringify(passos) }),
        ...(vertical !== undefined && { vertical: vertical || null }),
        ...(sistema !== undefined && { sistema: sistema || null }),
        ...(etiquetas !== undefined && { etiquetas: JSON.stringify(etiquetas) }),
      },
      include: {
        autor: { select: { id: true, nome: true } },
      },
    })
    res.json(parseConhecimento(c))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/conhecimento/:id — somente admin
router.delete('/:id', exigirAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const existente = await prisma.conhecimento.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Artigo não encontrado' })

    await prisma.conhecimento.delete({ where: { id } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
