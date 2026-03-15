const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/requisicoes — filtros: municipioId, sistemaId, tipo, limite
router.get('/', async (req, res) => {
  try {
    const { municipioId, sistemaId, tipo, limite } = req.query
    const take = Math.min(Number(limite) || 100, 500)

    const where = {}
    if (municipioId) where.municipioId = Number(municipioId)
    if (sistemaId) where.sistemaId = Number(sistemaId)
    if (tipo) where.tipo = tipo

    const requisicoes = await prisma.requisicao.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      take,
      include: {
        municipio: { select: { id: true, nome: true } },
        sistema: { select: { id: true, nome: true } },
        endpoint: { select: { id: true, nome: true, modulo: true } },
      },
    })

    const parsed = requisicoes.map((r) => ({
      ...r,
      headers: r.headers ? JSON.parse(r.headers) : null,
      body: r.body ? JSON.parse(r.body) : null,
      resposta: r.resposta ? JSON.parse(r.resposta) : null,
    }))

    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/requisicoes — limpa histórico
router.delete('/', async (req, res) => {
  try {
    const { municipioId } = req.query
    await prisma.requisicao.deleteMany({
      where: municipioId ? { municipioId: Number(municipioId) } : undefined,
    })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
