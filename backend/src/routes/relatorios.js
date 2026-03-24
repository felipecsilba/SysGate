const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

function parseRelatorio(r) {
  return {
    ...r,
    tags: r.tags ? r.tags.map((t) => t.nome) : [],
  }
}

async function upsertTags(tags) {
  return Promise.all(
    tags.map(async (nome) => {
      const tag = await prisma.tag.upsert({
        where: { nome: nome.toLowerCase().trim() },
        create: { nome: nome.toLowerCase().trim() },
        update: {},
      })
      return { id: tag.id }
    })
  )
}

// GET /api/relatorios
router.get('/', async (req, res) => {
  try {
    const { busca, tag, municipioId } = req.query
    const where = {}
    if (municipioId) where.municipioId = Number(municipioId)
    if (tag) where.tags = { some: { nome: tag } }
    if (busca) {
      where.OR = [
        { titulo: { contains: busca } },
        { descricao: { contains: busca } },
      ]
    }
    const relatorios = await prisma.relatorio.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      include: {
        tags: true,
        municipio: { select: { id: true, nome: true } },
      },
    })
    // Não retorna o conteúdo JXRML na listagem (pode ser grande)
    res.json(relatorios.map((r) => ({
      ...parseRelatorio(r),
      temJxrml: !!r.jxrmlConteudo,
      jxrmlConteudo: undefined,
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/relatorios/:id
router.get('/:id', async (req, res) => {
  try {
    const r = await prisma.relatorio.findUnique({
      where: { id: Number(req.params.id) },
      include: { tags: true, municipio: { select: { id: true, nome: true } } },
    })
    if (!r) return res.status(404).json({ error: 'Relatório não encontrado' })
    res.json({ ...parseRelatorio(r), temJxrml: !!r.jxrmlConteudo })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/relatorios/:id/jxrml — download do arquivo JXRML
router.get('/:id/jxrml', async (req, res) => {
  try {
    const r = await prisma.relatorio.findUnique({ where: { id: Number(req.params.id) } })
    if (!r || !r.jxrmlConteudo) return res.status(404).json({ error: 'Arquivo não encontrado' })
    const buffer = Buffer.from(r.jxrmlConteudo, 'base64')
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${r.jxrmlNome || 'relatorio.jrxml'}"`)
    res.send(buffer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/relatorios
router.post('/', async (req, res) => {
  try {
    const { titulo, descricao, jxrmlNome, jxrmlConteudo, scriptFonte, tags = [], municipioId } = req.body
    if (!titulo) return res.status(400).json({ error: 'Título é obrigatório' })
    const tagConnects = await upsertTags(tags)
    const r = await prisma.relatorio.create({
      data: {
        titulo,
        descricao: descricao || null,
        jxrmlNome: jxrmlNome || null,
        jxrmlConteudo: jxrmlConteudo || null,
        scriptFonte: scriptFonte || null,
        municipioId: municipioId ? Number(municipioId) : null,
        tags: { connect: tagConnects },
      },
      include: { tags: true, municipio: { select: { id: true, nome: true } } },
    })
    res.status(201).json({ ...parseRelatorio(r), temJxrml: !!r.jxrmlConteudo, jxrmlConteudo: undefined })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/relatorios/:id
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { titulo, descricao, jxrmlNome, jxrmlConteudo, scriptFonte, tags, municipioId } = req.body
    let tagData
    if (tags !== undefined) {
      const tagConnects = await upsertTags(tags)
      tagData = { set: tagConnects }
    }
    const r = await prisma.relatorio.update({
      where: { id },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(descricao !== undefined && { descricao: descricao || null }),
        ...(jxrmlNome !== undefined && { jxrmlNome: jxrmlNome || null }),
        ...(jxrmlConteudo !== undefined && { jxrmlConteudo: jxrmlConteudo || null }),
        ...(scriptFonte !== undefined && { scriptFonte: scriptFonte || null }),
        ...(municipioId !== undefined && { municipioId: municipioId ? Number(municipioId) : null }),
        ...(tagData && { tags: tagData }),
      },
      include: { tags: true, municipio: { select: { id: true, nome: true } } },
    })
    res.json({ ...parseRelatorio(r), temJxrml: !!r.jxrmlConteudo, jxrmlConteudo: undefined })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Relatório não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/relatorios/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.relatorio.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Relatório não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
