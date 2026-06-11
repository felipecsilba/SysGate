const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { exigirAdmin } = require('../middleware/autenticar')

const prisma = new PrismaClient()
const router = express.Router()

// Campos públicos — nunca retornar senhaHash/tokens de recuperação.
// senhaHash entra no select APENAS para derivar temConta e é removido antes da resposta.
const SELECT_PUBLICO = { id: true, nome: true, cargo: true, email: true, telefone: true, municipio: true, contaAtiva: true }
const SELECT_COM_CONTA = { ...SELECT_PUBLICO, senhaHash: true }

function publico({ senhaHash, ...resto }) {
  return { ...resto, temConta: !!senhaHash }
}

// ── GET / — Listar com filtros ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { busca, municipio, contaPendente } = req.query
  const where = {}
  if (municipio) where.municipio = { contains: municipio }
  // Contas do portal aguardando aprovação: registrou (senhaHash) mas não foi ativado
  if (contaPendente === 'true') {
    where.senhaHash = { not: null }
    where.contaAtiva = false
  }
  if (busca) {
    where.OR = [
      { nome:      { contains: busca } },
      { cargo:     { contains: busca } },
      { municipio: { contains: busca } },
    ]
  }
  const solicitantes = await prisma.solicitante.findMany({
    where,
    orderBy: { nome: 'asc' },
    select: SELECT_COM_CONTA
  })
  res.json(solicitantes.map(publico))
})

// ── POST / — Criar ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { nome, cargo, email, telefone, municipio } = req.body
  if (!nome?.trim()) return res.status(400).json({ error: 'Nome e obrigatorio' })
  try {
    const sol = await prisma.solicitante.create({
      data: {
        nome:      nome.trim(),
        cargo:     cargo?.trim()     || null,
        email:     email?.trim()     || null,
        telefone:  telefone?.trim()  || null,
        municipio: municipio?.trim() || null,
      },
      select: SELECT_COM_CONTA
    })
    res.status(201).json(publico(sol))
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Ja existe um solicitante com este email' })
    throw err
  }
})

// ── PUT /:id — Atualizar ──────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { nome, cargo, email, telefone, municipio } = req.body
  try {
    const sol = await prisma.solicitante.update({
      where: { id },
      data: {
        ...(nome      !== undefined && { nome:      nome.trim() }),
        ...(cargo     !== undefined && { cargo:     cargo?.trim()     || null }),
        ...(email     !== undefined && { email:     email?.trim()     || null }),
        ...(telefone  !== undefined && { telefone:  telefone?.trim()  || null }),
        ...(municipio !== undefined && { municipio: municipio?.trim() || null }),
      },
      select: SELECT_COM_CONTA
    })
    res.json(publico(sol))
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Solicitante nao encontrado' })
    if (err.code === 'P2002') return res.status(409).json({ error: 'Ja existe um solicitante com este email' })
    res.status(500).json({ error: 'Erro ao atualizar solicitante' })
  }
})

// ── PATCH /:id/conta — Aprovar/desativar conta do portal (somente admin) ──────
router.patch('/:id/conta', exigirAdmin, async (req, res) => {
  const { contaAtiva } = req.body
  if (typeof contaAtiva !== 'boolean') {
    return res.status(400).json({ error: 'contaAtiva (boolean) e obrigatorio' })
  }
  try {
    const sol = await prisma.solicitante.update({
      where: { id: Number(req.params.id) },
      // Aprovação destrava o login; reset de lockout evita conta nascer bloqueada
      data: { contaAtiva, ...(contaAtiva && { tentativasLogin: 0, bloqueadoAte: null }) },
      select: SELECT_COM_CONTA
    })
    res.json(publico(sol))
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Solicitante nao encontrado' })
    res.status(500).json({ error: 'Erro ao atualizar conta do solicitante' })
  }
})

// ── DELETE /:id — Remover (somente admin) ─────────────────────────────────────
router.delete('/:id', exigirAdmin, async (req, res) => {
  try {
    await prisma.solicitante.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Solicitante nao encontrado' })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
