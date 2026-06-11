const express = require('express')

const router = express.Router()
const prisma = require('../lib/prisma')

function parseNota(nota) {
  return {
    ...nota,
    itens: (() => { try { return JSON.parse(nota.itens) } catch { return [] } })(),
    etiquetas: (() => { try { return JSON.parse(nota.etiquetas) } catch { return [] } })(),
  }
}

// GET / — lista notas do usuário + compartilhadas com ele
router.get('/', async (req, res) => {
  try {
    const { busca, etiqueta, tipo } = req.query
    const uid = req.usuario.id

    const notas = await prisma.nota.findMany({
      where: {
        OR: [
          { usuarioId: uid },
          { compartilhamentos: { some: { usuarioId: uid } } },
        ],
      },
      include: {
        compartilhamentos: { select: { usuarioId: true } },
        usuario: { select: { id: true, nome: true } },
      },
      orderBy: [{ fixada: 'desc' }, { ordem: 'asc' }, { atualizadoEm: 'desc' }],
    })

    let resultado = notas.map(n => ({
      ...parseNota(n),
      compartilhada: n.usuarioId !== uid,
      compartilhadaCom: n.compartilhamentos.map(c => c.usuarioId),
      donoNome: n.usuario.nome,
    }))

    if (tipo) {
      resultado = resultado.filter(n => n.tipo === tipo)
    }

    if (busca) {
      const q = busca.toLowerCase()
      resultado = resultado.filter(n =>
        n.titulo.toLowerCase().includes(q) ||
        n.conteudo.toLowerCase().includes(q) ||
        n.itens.some(i => i.texto?.toLowerCase().includes(q))
      )
    }

    if (etiqueta) {
      resultado = resultado.filter(n => n.etiquetas.includes(etiqueta))
    }

    res.json(resultado)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /ordem — reordenação em batch (deve vir ANTES de /:id)
router.patch('/ordem', async (req, res) => {
  try {
    const { itens } = req.body // [{ id, ordem }]
    if (!Array.isArray(itens)) return res.status(400).json({ error: 'itens deve ser array' })

    await Promise.all(
      itens.map(({ id, ordem }) =>
        prisma.nota.updateMany({
          where: { id: Number(id), usuarioId: req.usuario.id },
          data: { ordem: Number(ordem) },
        })
      )
    )

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST / — criar nota
router.post('/', async (req, res) => {
  try {
    const { titulo, tipo, conteudo, itens, cor, fixada, ordem, etiquetas } = req.body

    const nota = await prisma.nota.create({
      data: {
        titulo: titulo || 'Sem título',
        tipo: tipo || 'texto',
        conteudo: conteudo || '',
        itens: JSON.stringify(itens || []),
        cor: cor || '#FFFDE7',
        fixada: fixada || false,
        ordem: ordem ?? 0,
        etiquetas: JSON.stringify(etiquetas || []),
        usuarioId: req.usuario.id,
      },
    })

    res.status(201).json(parseNota(nota))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /:id — detalhe
router.get('/:id', async (req, res) => {
  try {
    const uid = req.usuario.id
    const nota = await prisma.nota.findFirst({
      where: {
        id: Number(req.params.id),
        OR: [
          { usuarioId: uid },
          { compartilhamentos: { some: { usuarioId: uid } } },
        ],
      },
      include: {
        compartilhamentos: {
          include: { usuario: { select: { id: true, nome: true, login: true } } },
        },
        usuario: { select: { id: true, nome: true } },
      },
    })

    if (!nota) return res.status(404).json({ error: 'Nota não encontrada' })

    res.json({
      ...parseNota(nota),
      compartilhada: nota.usuarioId !== uid,
      donoNome: nota.usuario.nome,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /:id — atualizar (dono ou compartilhado)
router.put('/:id', async (req, res) => {
  try {
    const uid = req.usuario.id
    const notaId = Number(req.params.id)

    // Verificar acesso
    const existente = await prisma.nota.findFirst({
      where: {
        id: notaId,
        OR: [
          { usuarioId: uid },
          { compartilhamentos: { some: { usuarioId: uid } } },
        ],
      },
    })
    if (!existente) return res.status(404).json({ error: 'Nota não encontrada' })

    const { titulo, tipo, conteudo, itens, cor, fixada, ordem, etiquetas } = req.body

    const nota = await prisma.nota.update({
      where: { id: notaId },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(tipo !== undefined && { tipo }),
        ...(conteudo !== undefined && { conteudo }),
        ...(itens !== undefined && { itens: JSON.stringify(itens) }),
        ...(cor !== undefined && { cor }),
        ...(fixada !== undefined && { fixada }),
        ...(ordem !== undefined && { ordem }),
        ...(etiquetas !== undefined && { etiquetas: JSON.stringify(etiquetas) }),
      },
    })

    res.json(parseNota(nota))
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Nota não encontrada' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE /:id — remover (só dono)
router.delete('/:id', async (req, res) => {
  try {
    const existente = await prisma.nota.findFirst({
      where: { id: Number(req.params.id), usuarioId: req.usuario.id },
    })
    if (!existente) return res.status(404).json({ error: 'Nota não encontrada' })

    await prisma.nota.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /:id/fixar — toggle fixada (só dono)
router.patch('/:id/fixar', async (req, res) => {
  try {
    const existente = await prisma.nota.findFirst({
      where: { id: Number(req.params.id), usuarioId: req.usuario.id },
    })
    if (!existente) return res.status(404).json({ error: 'Nota não encontrada' })

    const nota = await prisma.nota.update({
      where: { id: Number(req.params.id) },
      data: { fixada: !existente.fixada },
    })

    res.json(parseNota(nota))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /:id/compartilhar — compartilhar com usuário (só dono)
router.post('/:id/compartilhar', async (req, res) => {
  try {
    const notaId = Number(req.params.id)
    const { usuarioId } = req.body

    const nota = await prisma.nota.findFirst({
      where: { id: notaId, usuarioId: req.usuario.id },
    })
    if (!nota) return res.status(404).json({ error: 'Nota não encontrada' })

    if (Number(usuarioId) === req.usuario.id) {
      return res.status(400).json({ error: 'Não é possível compartilhar consigo mesmo' })
    }

    const compartilhamento = await prisma.notaCompartilhamento.upsert({
      where: { notaId_usuarioId: { notaId, usuarioId: Number(usuarioId) } },
      create: { notaId, usuarioId: Number(usuarioId) },
      update: {},
      include: { usuario: { select: { id: true, nome: true, login: true } } },
    })

    res.status(201).json(compartilhamento)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /:id/compartilhar/:uid — remover compartilhamento (só dono)
router.delete('/:id/compartilhar/:uid', async (req, res) => {
  try {
    const notaId = Number(req.params.id)
    const uid = Number(req.params.uid)

    const nota = await prisma.nota.findFirst({
      where: { id: notaId, usuarioId: req.usuario.id },
    })
    if (!nota) return res.status(404).json({ error: 'Nota não encontrada' })

    await prisma.notaCompartilhamento.deleteMany({
      where: { notaId, usuarioId: uid },
    })

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
