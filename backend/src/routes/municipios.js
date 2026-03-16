const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/municipios — lista todos
router.get('/', async (req, res) => {
  try {
    const municipios = await prisma.municipio.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true, nome: true,
        ativo: true, observacoes: true,
        criadoEm: true, atualizadoEm: true,
        _count: { select: { municipioSistemas: true } },
      },
    })
    res.json(municipios)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/municipios/ativo — retorna o município ativo com vínculos de sistema
router.get('/ativo', async (req, res) => {
  try {
    const municipio = await prisma.municipio.findFirst({
      where: { ativo: true },
      include: { municipioSistemas: { include: { sistema: true } } },
    })
    res.json(municipio)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/municipios/:id/tokens — lista vínculos sistema+token do município
router.get('/:id/tokens', async (req, res) => {
  try {
    const vinculos = await prisma.municipioSistema.findMany({
      where: { municipioId: Number(req.params.id) },
      include: { sistema: { select: { id: true, nome: true, urlBase: true } } },
    })
    res.json(vinculos)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/municipios/:id/tokens — upsert vínculo (cria ou atualiza token)
router.post('/:id/tokens', async (req, res) => {
  try {
    const { sistemaId, token } = req.body
    if (!sistemaId || !token) {
      return res.status(400).json({ error: 'Campos obrigatórios: sistemaId, token' })
    }
    const vinculo = await prisma.municipioSistema.upsert({
      where: { municipioId_sistemaId: { municipioId: Number(req.params.id), sistemaId: Number(sistemaId) } },
      update: { token },
      create: { municipioId: Number(req.params.id), sistemaId: Number(sistemaId), token },
      include: { sistema: { select: { id: true, nome: true, urlBase: true } } },
    })
    res.json(vinculo)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/municipios/:id/tokens/:sistemaId — remove vínculo
router.delete('/:id/tokens/:sistemaId', async (req, res) => {
  try {
    await prisma.municipioSistema.delete({
      where: { municipioId_sistemaId: { municipioId: Number(req.params.id), sistemaId: Number(req.params.sistemaId) } },
    })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Vínculo não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// GET /api/municipios/:id — retorna um município
router.get('/:id', async (req, res) => {
  try {
    const municipio = await prisma.municipio.findUnique({
      where: { id: Number(req.params.id) },
      include: { municipioSistemas: { include: { sistema: { select: { id: true, nome: true, urlBase: true } } } } },
    })
    if (!municipio) return res.status(404).json({ error: 'Município não encontrado' })
    res.json(municipio)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/municipios — cria
router.post('/', async (req, res) => {
  try {
    const { nome, observacoes, ativo } = req.body
    if (!nome) {
      return res.status(400).json({ error: 'Campo obrigatório: nome' })
    }

    if (ativo) {
      await prisma.municipio.updateMany({ where: {}, data: { ativo: false } })
    }

    const municipio = await prisma.municipio.create({
      data: { nome, observacoes: observacoes || null, ativo: ativo || false },
    })
    res.status(201).json(municipio)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/municipios/:id — atualiza
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { nome, observacoes, ativo } = req.body

    if (ativo) {
      await prisma.municipio.updateMany({ where: { id: { not: id } }, data: { ativo: false } })
    }

    const municipio = await prisma.municipio.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        observacoes: observacoes !== undefined ? observacoes : undefined,
        ...(ativo !== undefined && { ativo }),
      },
    })
    res.json(municipio)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Município não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/municipios/:id/ativar — define como município ativo
router.patch('/:id/ativar', async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.municipio.updateMany({ where: {}, data: { ativo: false } })
    const municipio = await prisma.municipio.update({
      where: { id },
      data: { ativo: true },
    })
    res.json(municipio)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Município não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/municipios/:id — remove
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.requisicao.deleteMany({ where: { municipioId: id } })
    await prisma.municipio.delete({ where: { id } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Município não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
