const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// Helper: retorna o município somente se pertencer ao usuário logado
async function verificarDono(id, usuarioId) {
  return prisma.municipio.findFirst({
    where: { id: Number(id), usuarioId: Number(usuarioId) },
  })
}

// GET /api/municipios — lista os municípios do usuário logado
router.get('/', async (req, res) => {
  try {
    const municipios = await prisma.municipio.findMany({
      where: { usuarioId: req.usuario.id },
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

// GET /api/municipios/ativo — retorna o município ativo do usuário com vínculos de sistema
router.get('/ativo', async (req, res) => {
  try {
    const municipio = await prisma.municipio.findFirst({
      where: { ativo: true, usuarioId: req.usuario.id },
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
    const municipio = await verificarDono(req.params.id, req.usuario.id)
    if (!municipio) return res.status(404).json({ error: 'Município não encontrado' })
    const vinculos = await prisma.municipioSistema.findMany({
      where: { municipioId: municipio.id },
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
    const municipio = await verificarDono(req.params.id, req.usuario.id)
    if (!municipio) return res.status(404).json({ error: 'Município não encontrado' })
    const { sistemaId, token } = req.body
    if (!sistemaId || !token) {
      return res.status(400).json({ error: 'Campos obrigatórios: sistemaId, token' })
    }
    const vinculo = await prisma.municipioSistema.upsert({
      where: { municipioId_sistemaId: { municipioId: municipio.id, sistemaId: Number(sistemaId) } },
      update: { token },
      create: { municipioId: municipio.id, sistemaId: Number(sistemaId), token },
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
    const municipio = await verificarDono(req.params.id, req.usuario.id)
    if (!municipio) return res.status(404).json({ error: 'Município não encontrado' })
    await prisma.municipioSistema.delete({
      where: { municipioId_sistemaId: { municipioId: municipio.id, sistemaId: Number(req.params.sistemaId) } },
    })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Vínculo não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// GET /api/municipios/:id — retorna um município do usuário
router.get('/:id', async (req, res) => {
  try {
    const municipio = await prisma.municipio.findFirst({
      where: { id: Number(req.params.id), usuarioId: req.usuario.id },
      include: { municipioSistemas: { include: { sistema: { select: { id: true, nome: true, urlBase: true } } } } },
    })
    if (!municipio) return res.status(404).json({ error: 'Município não encontrado' })
    res.json(municipio)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/municipios — cria (vinculado ao usuário logado)
router.post('/', async (req, res) => {
  try {
    const { nome, observacoes, ativo } = req.body
    if (!nome) {
      return res.status(400).json({ error: 'Campo obrigatório: nome' })
    }

    if (ativo) {
      await prisma.municipio.updateMany({ where: { usuarioId: req.usuario.id }, data: { ativo: false } })
    }

    const municipio = await prisma.municipio.create({
      data: { nome, observacoes: observacoes || null, ativo: ativo || false, usuarioId: req.usuario.id },
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
    const dono = await verificarDono(id, req.usuario.id)
    if (!dono) return res.status(404).json({ error: 'Município não encontrado' })

    const { nome, observacoes, ativo } = req.body

    if (ativo) {
      await prisma.municipio.updateMany({ where: { usuarioId: req.usuario.id, id: { not: id } }, data: { ativo: false } })
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

// PATCH /api/municipios/:id/ativar — define como município ativo do usuário
router.patch('/:id/ativar', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const dono = await verificarDono(id, req.usuario.id)
    if (!dono) return res.status(404).json({ error: 'Município não encontrado' })

    await prisma.municipio.updateMany({ where: { usuarioId: req.usuario.id }, data: { ativo: false } })
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
    const dono = await verificarDono(id, req.usuario.id)
    if (!dono) return res.status(404).json({ error: 'Município não encontrado' })

    await prisma.requisicao.deleteMany({ where: { municipioId: id } })
    await prisma.municipio.delete({ where: { id } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Município não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
