const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { exigirAdmin } = require('../middleware/autenticar')

const router = express.Router()
const prisma = new PrismaClient()

// ── Municípios do Portfólio ───────────────────────────────────────────────────

// GET /api/portfolio — lista municípios com contagem de entidades
router.get('/', async (req, res) => {
  try {
    const { busca } = req.query
    const where = busca ? { nome: { contains: busca } } : {}
    const municipios = await prisma.portfolioMunicipio.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: {
        _count: { select: { entidades: true } },
      },
    })
    res.json(municipios)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/portfolio — cria município (admin)
router.post('/', exigirAdmin, async (req, res) => {
  try {
    const { nome, estado, observacoes } = req.body
    if (!nome) return res.status(400).json({ error: 'Campo obrigatório: nome' })
    const municipio = await prisma.portfolioMunicipio.create({
      data: { nome, estado: estado || null, observacoes: observacoes || null },
    })
    res.status(201).json(municipio)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Entidades (rotas com segmentos literais — ANTES de /:id) ─────────────────

// GET /api/portfolio/entidades/:eid — detalhes com sistemas e stakeholders
router.get('/entidades/:eid', async (req, res) => {
  try {
    const entidade = await prisma.entidade.findUnique({
      where: { id: Number(req.params.eid) },
      include: {
        sistemas: { orderBy: { nome: 'asc' } },
        stakeholders: {
          include: {
            sistemas: { include: { entidadeSistema: { select: { id: true, nome: true, ativo: true } } } },
          },
          orderBy: { nome: 'asc' },
        },
      },
    })
    if (!entidade) return res.status(404).json({ error: 'Entidade não encontrada' })
    res.json(entidade)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/portfolio/entidades/:eid — atualiza entidade (admin)
router.put('/entidades/:eid', exigirAdmin, async (req, res) => {
  try {
    const id = Number(req.params.eid)
    const { nome, tipo, observacoes } = req.body
    const entidade = await prisma.entidade.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(tipo !== undefined && { tipo }),
        ...(observacoes !== undefined && { observacoes: observacoes || null }),
      },
    })
    res.json(entidade)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Entidade não encontrada' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/portfolio/entidades/:eid — remove entidade com cascade manual (admin)
router.delete('/entidades/:eid', exigirAdmin, async (req, res) => {
  try {
    const eid = Number(req.params.eid)
    const stakeholders = await prisma.stakeholder.findMany({
      where: { entidadeId: eid },
      select: { id: true },
    })
    const stakeIds = stakeholders.map((s) => s.id)
    if (stakeIds.length > 0) {
      await prisma.stakeholderSistema.deleteMany({ where: { stakeholderId: { in: stakeIds } } })
    }
    await prisma.stakeholder.deleteMany({ where: { entidadeId: eid } })
    await prisma.entidadeSistema.deleteMany({ where: { entidadeId: eid } })
    await prisma.entidade.delete({ where: { id: eid } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Entidade não encontrada' })
    res.status(500).json({ error: err.message })
  }
})

// GET /api/portfolio/entidades/:eid/sistemas — lista sistemas da entidade
router.get('/entidades/:eid/sistemas', async (req, res) => {
  try {
    const sistemas = await prisma.entidadeSistema.findMany({
      where: { entidadeId: Number(req.params.eid) },
      orderBy: { nome: 'asc' },
    })
    res.json(sistemas)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/portfolio/entidades/:eid/sistemas — cria sistema (admin)
router.post('/entidades/:eid/sistemas', exigirAdmin, async (req, res) => {
  try {
    const eid = Number(req.params.eid)
    const { nome, vertical, ativo, observacoes } = req.body
    if (!nome) return res.status(400).json({ error: 'Campo obrigatório: nome' })
    const entidade = await prisma.entidade.findUnique({ where: { id: eid } })
    if (!entidade) return res.status(404).json({ error: 'Entidade não encontrada' })
    const sistema = await prisma.entidadeSistema.create({
      data: {
        nome,
        vertical: vertical || null,
        ativo: ativo !== undefined ? Boolean(ativo) : true,
        observacoes: observacoes || null,
        entidadeId: eid,
      },
    })
    res.status(201).json(sistema)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/portfolio/entidades/:eid/stakeholders — lista stakeholders com sistemas
router.get('/entidades/:eid/stakeholders', async (req, res) => {
  try {
    const stakeholders = await prisma.stakeholder.findMany({
      where: { entidadeId: Number(req.params.eid) },
      include: {
        sistemas: {
          include: { entidadeSistema: { select: { id: true, nome: true, ativo: true } } },
        },
      },
      orderBy: { nome: 'asc' },
    })
    res.json(stakeholders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/portfolio/entidades/:eid/stakeholders — cria stakeholder com sistemas[] (admin)
router.post('/entidades/:eid/stakeholders', exigirAdmin, async (req, res) => {
  try {
    const eid = Number(req.params.eid)
    const { nome, cargo, telefone, email, descricao, horarioAtendimento, ativo, sistemas = [] } = req.body
    if (!nome) return res.status(400).json({ error: 'Campo obrigatório: nome' })
    const entidade = await prisma.entidade.findUnique({ where: { id: eid } })
    if (!entidade) return res.status(404).json({ error: 'Entidade não encontrada' })
    const stakeholder = await prisma.stakeholder.create({
      data: {
        nome,
        cargo: cargo || null,
        telefone: telefone || null,
        email: email || null,
        descricao: descricao || null,
        horarioAtendimento: horarioAtendimento || null,
        ativo: ativo !== undefined ? Boolean(ativo) : true,
        entidadeId: eid,
        sistemas: {
          create: sistemas.map((entidadeSistemaId) => ({
            entidadeSistemaId: Number(entidadeSistemaId),
          })),
        },
      },
      include: {
        sistemas: { include: { entidadeSistema: { select: { id: true, nome: true, ativo: true } } } },
      },
    })
    res.status(201).json(stakeholder)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Sistemas (CRUD direto por ID — ANTES de /:id) ────────────────────────────

// PUT /api/portfolio/sistemas/:sid — atualiza sistema (admin)
router.put('/sistemas/:sid', exigirAdmin, async (req, res) => {
  try {
    const id = Number(req.params.sid)
    const { nome, vertical, ativo, observacoes } = req.body
    const sistema = await prisma.entidadeSistema.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(vertical !== undefined && { vertical: vertical || null }),
        ...(ativo !== undefined && { ativo: Boolean(ativo) }),
        ...(observacoes !== undefined && { observacoes: observacoes || null }),
      },
    })
    res.json(sistema)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Sistema não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/portfolio/sistemas/:sid — remove sistema com cascade M2M (admin)
router.delete('/sistemas/:sid', exigirAdmin, async (req, res) => {
  try {
    const sid = Number(req.params.sid)
    await prisma.stakeholderSistema.deleteMany({ where: { entidadeSistemaId: sid } })
    await prisma.entidadeSistema.delete({ where: { id: sid } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Sistema não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// ── Stakeholders (CRUD direto por ID — ANTES de /:id) ────────────────────────

// PUT /api/portfolio/stakeholders/:shid — atualiza stakeholder com sistemas[] (admin)
router.put('/stakeholders/:shid', exigirAdmin, async (req, res) => {
  try {
    const shid = Number(req.params.shid)
    const { nome, cargo, telefone, email, descricao, horarioAtendimento, ativo, sistemas } = req.body
    await prisma.stakeholder.update({
      where: { id: shid },
      data: {
        ...(nome !== undefined && { nome }),
        ...(cargo !== undefined && { cargo: cargo || null }),
        ...(telefone !== undefined && { telefone: telefone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(descricao !== undefined && { descricao: descricao || null }),
        ...(horarioAtendimento !== undefined && { horarioAtendimento: horarioAtendimento || null }),
        ...(ativo !== undefined && { ativo: Boolean(ativo) }),
      },
    })
    // Atualiza vínculos M2M se sistemas foi enviado
    if (sistemas !== undefined) {
      await prisma.stakeholderSistema.deleteMany({ where: { stakeholderId: shid } })
      if (sistemas.length > 0) {
        await prisma.stakeholderSistema.createMany({
          data: sistemas.map((entidadeSistemaId) => ({
            stakeholderId: shid,
            entidadeSistemaId: Number(entidadeSistemaId),
          })),
        })
      }
    }
    const resultado = await prisma.stakeholder.findUnique({
      where: { id: shid },
      include: {
        sistemas: { include: { entidadeSistema: { select: { id: true, nome: true, ativo: true } } } },
      },
    })
    res.json(resultado)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Stakeholder não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/portfolio/stakeholders/:shid — remove stakeholder (admin)
router.delete('/stakeholders/:shid', exigirAdmin, async (req, res) => {
  try {
    const shid = Number(req.params.shid)
    await prisma.stakeholderSistema.deleteMany({ where: { stakeholderId: shid } })
    await prisma.stakeholder.delete({ where: { id: shid } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Stakeholder não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// ── Municípios por ID (DEPOIS de todos os segmentos literais) ─────────────────

// GET /api/portfolio/:id — detalhes do município com entidades
router.get('/:id', async (req, res) => {
  try {
    const municipio = await prisma.portfolioMunicipio.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        entidades: {
          include: {
            _count: { select: { sistemas: true, stakeholders: true } },
          },
          orderBy: { nome: 'asc' },
        },
      },
    })
    if (!municipio) return res.status(404).json({ error: 'Município não encontrado' })
    res.json(municipio)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/portfolio/:id — atualiza município (admin)
router.put('/:id', exigirAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { nome, estado, observacoes } = req.body
    const municipio = await prisma.portfolioMunicipio.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(estado !== undefined && { estado: estado || null }),
        ...(observacoes !== undefined && { observacoes: observacoes || null }),
      },
    })
    res.json(municipio)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Município não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/portfolio/:id — remove município com cascade completo manual (admin)
router.delete('/:id', exigirAdmin, async (req, res) => {
  try {
    const pmid = Number(req.params.id)
    const entidades = await prisma.entidade.findMany({
      where: { portfolioMunicipioId: pmid },
      include: { stakeholders: { select: { id: true } } },
    })
    const stakeIds = entidades.flatMap((e) => e.stakeholders.map((s) => s.id))
    if (stakeIds.length > 0) {
      await prisma.stakeholderSistema.deleteMany({ where: { stakeholderId: { in: stakeIds } } })
    }
    await prisma.portfolioMunicipio.delete({ where: { id: pmid } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Município não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// GET /api/portfolio/:id/entidades — lista entidades do município com sistemas e stakeholders
router.get('/:id/entidades', async (req, res) => {
  try {
    const entidades = await prisma.entidade.findMany({
      where: { portfolioMunicipioId: Number(req.params.id) },
      include: {
        sistemas: { orderBy: { nome: 'asc' } },
        stakeholders: {
          include: {
            sistemas: { include: { entidadeSistema: { select: { id: true, nome: true, ativo: true } } } },
          },
          orderBy: { nome: 'asc' },
        },
      },
      orderBy: { nome: 'asc' },
    })
    res.json(entidades)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/portfolio/:id/entidades — cria entidade no município (admin)
router.post('/:id/entidades', exigirAdmin, async (req, res) => {
  try {
    const pmid = Number(req.params.id)
    const { nome, tipo, observacoes } = req.body
    if (!nome || !tipo) return res.status(400).json({ error: 'Campos obrigatórios: nome, tipo' })
    const municipio = await prisma.portfolioMunicipio.findUnique({ where: { id: pmid } })
    if (!municipio) return res.status(404).json({ error: 'Município não encontrado' })
    const entidade = await prisma.entidade.create({
      data: { nome, tipo, observacoes: observacoes || null, portfolioMunicipioId: pmid },
    })
    res.status(201).json(entidade)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
