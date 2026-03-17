const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const autenticar = require('../middleware/autenticar')

const router = express.Router()
const prisma = new PrismaClient()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login, senha } = req.body
    if (!login || !senha) {
      return res.status(400).json({ error: 'Login e senha são obrigatórios' })
    }

    const usuario = await prisma.usuario.findUnique({ where: { login } })

    if (!usuario || !await bcrypt.compare(senha, usuario.senhaHash)) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Usuário inativo. Contate o administrador.' })
    }

    const token = jwt.sign(
      { id: usuario.id, login: usuario.login, nome: usuario.nome, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    )

    res.json({ token, usuario: { id: usuario.id, login: usuario.login, nome: usuario.nome, role: usuario.role } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', autenticar, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: { id: true, login: true, nome: true, role: true, criadoEm: true },
    })
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' })
    res.json(usuario)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
