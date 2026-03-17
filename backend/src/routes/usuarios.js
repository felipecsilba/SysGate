const express = require('express')
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const autenticar = require('../middleware/autenticar')
const { exigirAdmin } = require('../middleware/autenticar')

const router = express.Router()
const prisma = new PrismaClient()

const CAMPOS_PUBLICOS = { id: true, login: true, nome: true, role: true, ativo: true, criadoEm: true, atualizadoEm: true }

// Todos os endpoints exigem autenticação + admin
router.use(autenticar, exigirAdmin)

// GET /api/usuarios
router.get('/', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: CAMPOS_PUBLICOS,
      orderBy: { criadoEm: 'asc' },
    })
    res.json(usuarios)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/usuarios
router.post('/', async (req, res) => {
  try {
    const { login, senha, nome, role } = req.body
    if (!login || !senha || !nome) {
      return res.status(400).json({ error: 'Login, senha e nome são obrigatórios' })
    }
    if (senha.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' })
    }
    if (role && !['admin', 'operador'].includes(role)) {
      return res.status(400).json({ error: 'Role deve ser "admin" ou "operador"' })
    }

    const senhaHash = await bcrypt.hash(senha, 10)
    const usuario = await prisma.usuario.create({
      data: { login, senhaHash, nome, role: role || 'operador', ativo: true },
      select: CAMPOS_PUBLICOS,
    })
    res.status(201).json(usuario)
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: `Login "${req.body.login}" já está em uso` })
    }
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/usuarios/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { nome, role, ativo } = req.body

    // Impede desativar o último admin ativo
    if (ativo === false) {
      const alvo = await prisma.usuario.findUnique({ where: { id } })
      if (alvo?.role === 'admin') {
        const totalAdminsAtivos = await prisma.usuario.count({ where: { role: 'admin', ativo: true } })
        if (totalAdminsAtivos <= 1) {
          return res.status(400).json({ error: 'Não é possível desativar o único administrador ativo' })
        }
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: { ...(nome !== undefined && { nome }), ...(role !== undefined && { role }), ...(ativo !== undefined && { ativo }) },
      select: CAMPOS_PUBLICOS,
    })
    res.json(usuario)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Usuário não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/usuarios/:id/senha
router.patch('/:id/senha', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { novaSenha } = req.body
    if (!novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' })
    }

    await prisma.usuario.update({
      where: { id },
      data: { senhaHash: await bcrypt.hash(novaSenha, 10) },
    })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Usuário não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/usuarios/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)

    if (id === req.usuario.id) {
      return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário' })
    }

    const alvo = await prisma.usuario.findUnique({ where: { id } })
    if (alvo?.role === 'admin') {
      const totalAdminsAtivos = await prisma.usuario.count({ where: { role: 'admin', ativo: true } })
      if (totalAdminsAtivos <= 1) {
        return res.status(400).json({ error: 'Não é possível excluir o único administrador ativo' })
      }
    }

    await prisma.usuario.delete({ where: { id } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Usuário não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
