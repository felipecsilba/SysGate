const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/sistemas — lista todos com contagem de endpoints e specs
router.get('/', async (req, res) => {
  try {
    const sistemas = await prisma.sistema.findMany({
      orderBy: { nome: 'asc' },
      include: {
        _count: { select: { endpoints: true, swaggerSpecs: true } },
      },
    })
    res.json(sistemas)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/sistemas/:id — detalhe com lista de specs (sem conteudo)
router.get('/:id', async (req, res) => {
  try {
    const sistema = await prisma.sistema.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        _count: { select: { endpoints: true, swaggerSpecs: true } },
        swaggerSpecs: {
          orderBy: { criadoEm: 'desc' },
          select: { id: true, nome: true, versao: true, urlBase: true, totalEndpoints: true, criadoEm: true },
        },
      },
    })
    if (!sistema) return res.status(404).json({ error: 'Sistema não encontrado' })
    res.json(sistema)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sistemas — cria
router.post('/', async (req, res) => {
  try {
    const { nome, urlBase, descricao } = req.body
    if (!nome || !urlBase) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, urlBase' })
    }
    const sistema = await prisma.sistema.create({
      data: { nome, urlBase, descricao: descricao || null },
    })
    res.status(201).json(sistema)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/sistemas/:id — atualiza
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { nome, urlBase, descricao } = req.body
    const sistema = await prisma.sistema.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(urlBase !== undefined && { urlBase }),
        ...(descricao !== undefined && { descricao: descricao || null }),
      },
    })
    res.json(sistema)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Sistema não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/sistemas/:id — remove (endpoints/specs ficam com sistemaId = null via onDelete: SetNull)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.sistema.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Sistema não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
