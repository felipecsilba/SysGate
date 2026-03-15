const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

function parseScript(s) {
  return {
    ...s,
    tags: s.tags ? s.tags.map((t) => t.nome) : [],
  }
}

// GET /api/scripts
router.get('/', async (req, res) => {
  try {
    const { busca, tag, categoria, municipioId } = req.query
    const where = {}

    if (categoria) where.categoria = categoria
    if (municipioId) where.municipioId = Number(municipioId)
    if (tag) where.tags = { some: { nome: tag } }
    if (busca) {
      where.OR = [
        { titulo: { contains: busca } },
        { conteudo: { contains: busca } },
      ]
    }

    const scripts = await prisma.script.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      include: {
        tags: true,
        municipio: { select: { id: true, nome: true } },
      },
    })
    res.json(scripts.map(parseScript))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/scripts/tags — lista todas as tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { nome: 'asc' } })
    res.json(tags)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/scripts/:id
router.get('/:id', async (req, res) => {
  try {
    const script = await prisma.script.findUnique({
      where: { id: Number(req.params.id) },
      include: { tags: true, municipio: { select: { id: true, nome: true } } },
    })
    if (!script) return res.status(404).json({ error: 'Script não encontrado' })
    res.json(parseScript(script))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/scripts
router.post('/', async (req, res) => {
  try {
    const { titulo, conteudo, categoria, tags = [], municipioId } = req.body
    if (!titulo || !conteudo || !categoria) {
      return res.status(400).json({ error: 'Campos obrigatórios: titulo, conteudo, categoria' })
    }

    // Cria ou conecta as tags
    const tagConnects = await Promise.all(
      tags.map(async (nome) => {
        const tag = await prisma.tag.upsert({
          where: { nome: nome.toLowerCase().trim() },
          create: { nome: nome.toLowerCase().trim() },
          update: {},
        })
        return { id: tag.id }
      })
    )

    const script = await prisma.script.create({
      data: {
        titulo,
        conteudo,
        categoria,
        municipioId: municipioId ? Number(municipioId) : null,
        tags: { connect: tagConnects },
      },
      include: { tags: true, municipio: { select: { id: true, nome: true } } },
    })
    res.status(201).json(parseScript(script))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/scripts/:id
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { titulo, conteudo, categoria, tags, municipioId } = req.body

    // Atualiza tags se fornecidas
    let tagData
    if (tags !== undefined) {
      const tagConnects = await Promise.all(
        tags.map(async (nome) => {
          const tag = await prisma.tag.upsert({
            where: { nome: nome.toLowerCase().trim() },
            create: { nome: nome.toLowerCase().trim() },
            update: {},
          })
          return { id: tag.id }
        })
      )
      tagData = { set: tagConnects }
    }

    const script = await prisma.script.update({
      where: { id },
      data: {
        ...(titulo && { titulo }),
        ...(conteudo && { conteudo }),
        ...(categoria && { categoria }),
        municipioId: municipioId !== undefined ? (municipioId ? Number(municipioId) : null) : undefined,
        ...(tagData && { tags: tagData }),
      },
      include: { tags: true, municipio: { select: { id: true, nome: true } } },
    })
    res.json(parseScript(script))
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Script não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/scripts/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.script.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Script não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// POST /api/scripts/importar — importa array de scripts via JSON
router.post('/importar', async (req, res) => {
  try {
    const scripts = req.body
    if (!Array.isArray(scripts)) return res.status(400).json({ error: 'Envie um array de scripts' })

    const criados = []
    for (const s of scripts) {
      const { titulo, conteudo, categoria, tags = [] } = s
      if (!titulo || !conteudo || !categoria) continue

      const tagConnects = await Promise.all(
        tags.map(async (nome) => {
          const tag = await prisma.tag.upsert({
            where: { nome: nome.toLowerCase().trim() },
            create: { nome: nome.toLowerCase().trim() },
            update: {},
          })
          return { id: tag.id }
        })
      )

      const script = await prisma.script.create({
        data: { titulo, conteudo, categoria, tags: { connect: tagConnects } },
        include: { tags: true },
      })
      criados.push(parseScript(script))
    }
    res.status(201).json({ importados: criados.length, scripts: criados })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
