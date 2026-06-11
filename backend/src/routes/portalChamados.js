// Chamados do PORTAL EXTERNO — todas as rotas exigem token externo (autenticarExterno)
// e operam SEMPRE com where { solicitanteId: req.solicitante.sid }. Não-dono recebe 404
// (nunca 403, para não vazar existência — mesmo padrão de municípios).
// Comentários com interno: true e seus anexos NUNCA saem por estas rotas.

const express = require('express')
const { autenticarExterno } = require('../middleware/autenticar')
const { gerarNumero } = require('../lib/numeroChamado')

const prisma = require('../lib/prisma')
const router = express.Router()

router.use(autenticarExterno)

// ── Validação de anexos — mesmos limites da rota interna (Fase 0) ────────────
const MIME_PERMITIDOS = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf',
])
const MAX_ANEXO_BYTES = 5 * 1024 * 1024   // 5 MB por anexo
const MAX_CHAMADO_BYTES = 25 * 1024 * 1024 // 25 MB somados por chamado

function bytesDeBase64(base64) {
  const limpo = String(base64).replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '')
  const padding = (limpo.endsWith('==') ? 2 : limpo.endsWith('=') ? 1 : 0)
  return Math.floor(limpo.length * 3 / 4) - padding
}

// Usuário-sistema "portal" (seed) — dono de criadoPorId/historico dos chamados do portal
let portalUserId = null
async function obterPortalUserId() {
  if (portalUserId) return portalUserId
  const u = await prisma.usuario.findUnique({ where: { login: 'portal' }, select: { id: true } })
  if (!u) throw new Error('Usuário-sistema "portal" não encontrado. Rode o seed (prisma/seed.js).')
  portalUserId = u.id
  return portalUserId
}

// Campos do chamado expostos ao cliente — sem prioridade/classificação/vertical (internos)
const SELECT_CHAMADO_LISTA = {
  id: true, numero: true, titulo: true, status: true,
  municipio: true, entidade: true, criadoEm: true, atualizadoEm: true,
}

// Helper: chamado do solicitante ou null (vira 404 no chamador)
async function chamadoDoSolicitante(id, sid, select) {
  if (!Number.isInteger(id)) return null
  return prisma.chamado.findFirst({ where: { id, solicitanteId: sid }, ...(select && { select }) })
}

// ── GET / — Listar chamados do solicitante logado ────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { busca, status, pagina, limite } = req.query
    const where = { solicitanteId: req.solicitante.sid }
    if (status) where.status = status
    if (busca) {
      where.OR = [
        { titulo:    { contains: busca, mode: 'insensitive' } },
        { descricao: { contains: busca, mode: 'insensitive' } },
        { numero:    { contains: busca, mode: 'insensitive' } },
      ]
    }

    const paginaNum = Math.max(1, parseInt(pagina) || 1)
    const limiteNum = Math.min(100, Math.max(1, parseInt(limite) || 20))
    const skip = (paginaNum - 1) * limiteNum

    const [chamados, total] = await Promise.all([
      prisma.chamado.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip,
        take: limiteNum,
        select: SELECT_CHAMADO_LISTA,
      }),
      prisma.chamado.count({ where }),
    ])

    res.json({
      data: chamados,
      total,
      pagina: paginaNum,
      limite: limiteNum,
      totalPaginas: Math.ceil(total / limiteNum),
    })
  } catch (err) {
    console.error('Erro ao listar chamados do portal:', err)
    res.status(500).json({ error: 'Erro ao listar chamados' })
  }
})

// ── GET /anexos/:aid — Download de anexo (somente do dono, nunca de comentário interno)
router.get('/anexos/:aid', async (req, res) => {
  try {
    const aid = Number(req.params.aid)
    const anexo = await prisma.chamadoAnexo.findUnique({
      where: { id: Number.isInteger(aid) ? aid : -1 },
      include: { chamado: { select: { solicitanteId: true } } },
    })
    if (!anexo || anexo.chamado.solicitanteId !== req.solicitante.sid) {
      return res.status(404).json({ error: 'Anexo não encontrado' })
    }
    // Anexo vinculado a comentário interno é invisível no portal
    if (anexo.comentarioId) {
      const comentario = await prisma.chamadoComentario.findUnique({
        where: { id: anexo.comentarioId },
        select: { interno: true },
      })
      if (comentario?.interno) return res.status(404).json({ error: 'Anexo não encontrado' })
    }

    const buffer = Buffer.from(anexo.conteudo, 'base64')
    res.setHeader('Content-Type', anexo.tipo || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${anexo.nomeArquivo}"`)
    res.send(buffer)
  } catch (err) {
    console.error('Erro no download de anexo do portal:', err)
    res.status(500).json({ error: 'Erro ao baixar anexo' })
  }
})

// ── GET /:id — Detalhe (timeline pública: sem comentários internos) ──────────
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const chamado = await prisma.chamado.findFirst({
      where: { id: Number.isInteger(id) ? id : -1, solicitanteId: req.solicitante.sid },
      select: {
        ...SELECT_CHAMADO_LISTA,
        descricao: true,
        comentarios: {
          where: { interno: false },
          orderBy: { criadoEm: 'asc' },
          select: {
            id: true, conteudo: true, criadoEm: true,
            autor: { select: { nome: true } },
            autorSolicitante: { select: { id: true, nome: true } },
          },
        },
      },
    })
    if (!chamado) return res.status(404).json({ error: 'Chamado não encontrado' })

    // Anexos: exclui os vinculados a comentários internos
    const internos = await prisma.chamadoComentario.findMany({
      where: { chamadoId: chamado.id, interno: true },
      select: { id: true },
    })
    const idsInternos = internos.map(c => c.id)
    const anexos = await prisma.chamadoAnexo.findMany({
      where: {
        chamadoId: chamado.id,
        ...(idsInternos.length > 0
          ? { OR: [{ comentarioId: null }, { comentarioId: { notIn: idsInternos } }] }
          : {}),
      },
      select: { id: true, nomeArquivo: true, tipo: true, tamanho: true, criadoEm: true, comentarioId: true },
    })

    res.json({ ...chamado, anexos })
  } catch (err) {
    console.error('Erro no detalhe de chamado do portal:', err)
    res.status(500).json({ error: 'Erro ao buscar chamado' })
  }
})

// ── POST / — Abrir chamado pelo portal ───────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { titulo, descricao } = req.body
    if (!titulo?.trim()) return res.status(400).json({ error: 'Título é obrigatório' })

    const [solicitante, criadoPorId] = await Promise.all([
      prisma.solicitante.findUnique({
        where: { id: req.solicitante.sid },
        select: { municipio: true },
      }),
      obterPortalUserId(),
    ])

    const municipio = solicitante?.municipio || null
    const dados = {
      titulo: titulo.trim(),
      descricao: descricao?.trim() || null,
      status: 'Nao Analisado',
      origem: 'portal',
      municipio,
      criadoPorId,
      solicitanteId: req.solicitante.sid,
    }

    // Gera o número persistido em transação; repete se houver colisão de unicidade
    let chamado
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      try {
        chamado = await prisma.$transaction(async (tx) => {
          const numero = await gerarNumero(tx, { municipio })
          return tx.chamado.create({
            data: { ...dados, numero },
            select: { ...SELECT_CHAMADO_LISTA, descricao: true },
          })
        })
        break
      } catch (err) {
        if (err.code === 'P2002' && tentativa < 4) continue
        throw err
      }
    }

    await prisma.chamadoHistorico.create({
      data: { chamadoId: chamado.id, usuarioId: criadoPorId, tipo: 'criacao', valorAntes: null, valorDepois: null },
    })

    res.status(201).json(chamado)
  } catch (err) {
    console.error('Erro ao criar chamado pelo portal:', err)
    res.status(500).json({ error: 'Erro ao criar chamado' })
  }
})

// ── POST /:id/comentarios — Responder no chamado (autor externo, sempre público)
router.post('/:id/comentarios', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { conteudo, pendingAnexoIds } = req.body
    if (!conteudo?.trim()) return res.status(400).json({ error: 'Conteúdo é obrigatório' })

    const chamado = await chamadoDoSolicitante(id, req.solicitante.sid, { id: true })
    if (!chamado) return res.status(404).json({ error: 'Chamado não encontrado' })

    const comentario = await prisma.chamadoComentario.create({
      data: {
        conteudo: conteudo.trim(),
        chamadoId: chamado.id,
        autorSolicitanteId: req.solicitante.sid,
        interno: false,
      },
      select: {
        id: true, conteudo: true, criadoEm: true,
        autorSolicitante: { select: { id: true, nome: true } },
      },
    })

    // Vincula imagens pré-carregadas — só anexos soltos deste chamado
    if (Array.isArray(pendingAnexoIds) && pendingAnexoIds.length > 0) {
      await prisma.chamadoAnexo.updateMany({
        where: { id: { in: pendingAnexoIds.map(Number) }, chamadoId: chamado.id, comentarioId: null },
        data: { comentarioId: comentario.id },
      })
    }

    res.status(201).json(comentario)
  } catch (err) {
    console.error('Erro ao comentar pelo portal:', err)
    res.status(500).json({ error: 'Erro ao adicionar comentário' })
  }
})

// ── POST /:id/anexos — Upload de anexo (mesma validação da rota interna) ─────
router.post('/:id/anexos', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { nomeArquivo, tipo, conteudo } = req.body
    if (!nomeArquivo || !conteudo) return res.status(400).json({ error: 'nomeArquivo e conteudo são obrigatórios' })

    if (!tipo || !MIME_PERMITIDOS.has(tipo)) {
      return res.status(415).json({ error: 'Tipo de arquivo não permitido. Aceitos: PNG, JPEG, GIF, WebP, PDF.' })
    }

    const bytes = bytesDeBase64(conteudo)
    if (bytes <= 0) return res.status(400).json({ error: 'Conteúdo do anexo inválido' })
    if (bytes > MAX_ANEXO_BYTES) {
      return res.status(413).json({ error: `Anexo excede o limite de ${MAX_ANEXO_BYTES / 1024 / 1024} MB.` })
    }

    const nomeSeguro = String(nomeArquivo).replace(/[\\/]/g, '_').replace(/[\x00-\x1f]/g, '').slice(0, 255).trim() || 'arquivo'

    const chamado = await chamadoDoSolicitante(id, req.solicitante.sid, { id: true })
    if (!chamado) return res.status(404).json({ error: 'Chamado não encontrado' })

    const usado = await prisma.chamadoAnexo.aggregate({
      where: { chamadoId: chamado.id },
      _sum: { tamanho: true },
    })
    if ((usado._sum.tamanho || 0) + bytes > MAX_CHAMADO_BYTES) {
      return res.status(413).json({ error: `Limite total de anexos do chamado (${MAX_CHAMADO_BYTES / 1024 / 1024} MB) excedido.` })
    }

    // comentarioId NÃO é aceito do cliente — vínculo só via pendingAnexoIds no comentário
    const anexo = await prisma.chamadoAnexo.create({
      data: { nomeArquivo: nomeSeguro, tipo, conteudo, tamanho: bytes, chamadoId: chamado.id },
      select: { id: true, nomeArquivo: true, tipo: true, tamanho: true, criadoEm: true, comentarioId: true },
    })
    res.status(201).json(anexo)
  } catch (err) {
    console.error('Erro no upload de anexo do portal:', err)
    res.status(500).json({ error: 'Erro ao enviar anexo' })
  }
})

module.exports = router
