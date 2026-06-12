const express = require('express')
const { exigirAdmin } = require('../middleware/autenticar')
const { gerarNumero } = require('../lib/numeroChamado')

const prisma = require('../lib/prisma')
const router = express.Router()

// ── Validação de anexos ──────────────────────────────────────────────────────
const MIME_PERMITIDOS = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf',
])
const MAX_ANEXO_BYTES = 5 * 1024 * 1024   // 5 MB por anexo
const MAX_CHAMADO_BYTES = 25 * 1024 * 1024 // 25 MB somados por chamado

// Tamanho real (em bytes) de um conteúdo base64, ignorando prefixo data: e padding
function bytesDeBase64(base64) {
  const limpo = String(base64).replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '')
  const padding = (limpo.endsWith('==') ? 2 : limpo.endsWith('=') ? 1 : 0)
  return Math.floor(limpo.length * 3 / 4) - padding
}

// ── Helper: registrar entrada de histórico ───────────────────────────────────
async function registrarHistorico(chamadoId, usuarioId, tipo, valorAntes, valorDepois) {
  await prisma.chamadoHistorico.create({
    data: {
      chamadoId,
      usuarioId,
      tipo,
      valorAntes: valorAntes !== undefined && valorAntes !== null ? String(valorAntes) : null,
      valorDepois: valorDepois !== undefined && valorDepois !== null ? String(valorDepois) : null,
    }
  })
}

// ── GET / — Listar chamados com filtros e paginação ──────────────────────────
router.get('/', async (req, res) => {
  const {
    busca, classificacao, responsavelId, pagina, limite,
    status, vertical, verticais, sistemas, prioridade, municipio,
    semResponsavel, excluirEncerrados,
  } = req.query
  const where = {}
  if (classificacao) where.classificacao = classificacao
  if (responsavelId) where.responsavelId = Number(responsavelId)
  if (prioridade)    where.prioridade    = prioridade
  if (semResponsavel === 'true') where.responsavelId = null
  // status: parâmetro único tem prioridade; excluirEncerrados só aplica se status não for passado
  if (status) {
    where.status = status
  } else if (excluirEncerrados === 'true') {
    where.status = { notIn: ['Concluido', 'Cancelado'] }
  }
  // vertical: param único ou lista comma-separated
  if (verticais) {
    where.vertical = { in: verticais.split(',') }
  } else if (vertical) {
    where.vertical = vertical
  }
  // sistema: lista comma-separated
  if (sistemas) where.sistema = { in: sistemas.split(',') }
  // município: filtro por contains
  if (municipio) where.municipio = { contains: municipio, mode: 'insensitive' }
  if (busca) {
    where.OR = [
      { titulo:    { contains: busca, mode: 'insensitive' } },
      { descricao: { contains: busca, mode: 'insensitive' } },
      { municipio: { contains: busca, mode: 'insensitive' } },
    ]
  }

  const paginaNum = Math.max(1, parseInt(pagina) || 1)
  const limiteNum = Math.min(200, Math.max(1, parseInt(limite) || 50))
  const skip = (paginaNum - 1) * limiteNum

  const [chamados, total] = await Promise.all([
    prisma.chamado.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip,
      take: limiteNum,
      include: {
        criadoPor: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
        _count: { select: { comentarios: true, anexos: true } }
      }
    }),
    prisma.chamado.count({ where })
  ])

  res.json({
    data: chamados.map(c => ({
      ...c,
      descricao: c.descricao ? c.descricao.substring(0, 200) : null,
      descricaoTruncada: c.descricao ? c.descricao.length > 200 : false
    })),
    total,
    pagina: paginaNum,
    limite: limiteNum,
    totalPaginas: Math.ceil(total / limiteNum)
  })
})

// ── GET /estatisticas — Contagem por status ──────────────────────────────────
router.get('/estatisticas', async (req, res) => {
  const todos = await prisma.chamado.groupBy({
    by: ['status'],
    _count: { id: true }
  })
  const stats = {}
  todos.forEach(g => { stats[g.status] = g._count.id })
  res.json(stats)
})

// ── GET /dashboard — Dados agregados para o painel ───────────────────────────
router.get('/dashboard', async (req, res) => {
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())

  const [
    porStatus,
    porMunicipio,
    porVertical,
    porClassificacao,
    porPrioridade,
    semResponsavel,
    criadosHoje,
    criadosMes,
    concluidosMes,
    porDia,
  ] = await Promise.all([
    // Por status
    prisma.chamado.groupBy({ by: ['status'], _count: { id: true } }),

    // Top municípios
    prisma.chamado.groupBy({
      by: ['municipio'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),

    // Por vertical
    prisma.chamado.groupBy({
      by: ['vertical'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),

    // Por classificação
    prisma.chamado.groupBy({ by: ['classificacao'], _count: { id: true } }),

    // Por prioridade
    prisma.chamado.groupBy({ by: ['prioridade'], _count: { id: true } }),

    // Chamados sem responsável (abertos)
    prisma.chamado.findMany({
      where: {
        responsavelId: null,
        status: { not: 'Concluido' },
      },
      orderBy: { criadoEm: 'desc' },
      take: 8,
      select: {
        id: true, titulo: true, status: true, prioridade: true,
        municipio: true, vertical: true, origem: true, criadoEm: true,
        criadoPor: { select: { nome: true } },
      },
    }),

    // Criados hoje
    prisma.chamado.count({ where: { criadoEm: { gte: inicioDia } } }),

    // Criados este mês
    prisma.chamado.count({ where: { criadoEm: { gte: inicioMes } } }),

    // Concluídos este mês
    prisma.chamado.count({
      where: { status: 'Concluido', atualizadoEm: { gte: inicioMes } }
    }),

    // Últimos 14 dias — contagem por dia (sintaxe Postgres; tabela/colunas com aspas por causa do case)
    prisma.$queryRaw`
      SELECT
        to_char("criadoEm", 'YYYY-MM-DD') as dia,
        COUNT(*)::int as total
      FROM "Chamado"
      WHERE "criadoEm" >= NOW() - INTERVAL '14 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  ])

  // Normalizar por status
  const statusMap = {}
  porStatus.forEach(g => { statusMap[g.status] = g._count.id })

  const abertos = (statusMap['Nao Analisado'] || 0)
    + (statusMap['Em Analise'] || 0)
    + (statusMap['Em Atendimento'] || 0)

  res.json({
    resumo: {
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      abertos,
      aguardando: statusMap['Aguardando Retorno'] || 0,
      concluidos: statusMap['Concluido'] || 0,
      criadosHoje,
      criadosMes,
      concluidosMes,
    },
    porStatus: porStatus.map(g => ({ status: g.status, total: g._count.id })),
    porMunicipio: porMunicipio
      .filter(g => g.municipio)
      .map(g => ({ municipio: g.municipio, total: g._count.id })),
    porVertical: porVertical
      .filter(g => g.vertical)
      .map(g => ({ vertical: g.vertical, total: g._count.id })),
    porClassificacao: porClassificacao
      .filter(g => g.classificacao)
      .map(g => ({ classificacao: g.classificacao, total: g._count.id })),
    porPrioridade: porPrioridade
      .filter(g => g.prioridade)
      .map(g => ({ prioridade: g.prioridade, total: g._count.id })),
    semResponsavel,
    porDia: (porDia || []).map(r => ({
      dia: r.dia,
      total: typeof r.total === 'bigint' ? Number(r.total) : Number(r.total),
    })),
  })
})

// ── POST / — Criar chamado ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { titulo, descricao, status, classificacao, prioridade, vertical, sistema, responsavelId, municipio, entidade, solicitanteId } = req.body
  if (!titulo?.trim()) return res.status(400).json({ error: 'Titulo e obrigatorio' })

  const municipioNorm = municipio?.trim() || null
  const dados = {
    titulo: titulo.trim(),
    descricao: descricao?.trim() || null,
    status: status || 'Nao Analisado',
    classificacao: classificacao || null,
    prioridade: prioridade || 'Normal',
    vertical: vertical || null,
    sistema: sistema || null,
    municipio: municipioNorm,
    entidade: entidade?.trim() || null,
    criadoPorId: req.usuario.id,
    responsavelId: responsavelId ? Number(responsavelId) : null,
    solicitanteId: solicitanteId ? Number(solicitanteId) : null,
  }
  const include = {
    criadoPor: { select: { id: true, nome: true } },
    responsavel: { select: { id: true, nome: true } },
    solicitante: { select: { id: true, nome: true, cargo: true } },
    _count: { select: { comentarios: true, anexos: true } }
  }

  // Gera o número persistido em transação; repete se houver colisão de unicidade
  let chamado
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    try {
      chamado = await prisma.$transaction(async (tx) => {
        const numero = await gerarNumero(tx, { municipio: municipioNorm })
        return tx.chamado.create({ data: { ...dados, numero }, include })
      })
      break
    } catch (err) {
      if (err.code === 'P2002' && tentativa < 4) continue
      return res.status(500).json({ error: err.message })
    }
  }

  // Registrar histórico de criação
  await registrarHistorico(chamado.id, req.usuario.id, 'criacao', null, null)

  res.status(201).json(chamado)
})

// ── GET /anexos/:aid — Download anexo ────────────────────────────────────────
router.get('/anexos/:aid', async (req, res) => {
  const anexo = await prisma.chamadoAnexo.findUnique({ where: { id: Number(req.params.aid) } })
  if (!anexo) return res.status(404).json({ error: 'Anexo nao encontrado' })

  const buffer = Buffer.from(anexo.conteudo, 'base64')
  res.setHeader('Content-Type', anexo.tipo || 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="${anexo.nomeArquivo}"`)
  res.send(buffer)
})

// ── DELETE /anexos/:aid — Remover anexo ──────────────────────────────────────
router.delete('/anexos/:aid', async (req, res) => {
  try {
    await prisma.chamadoAnexo.delete({ where: { id: Number(req.params.aid) } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Anexo nao encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /comentarios/:cid — Remover comentário (autor ou admin) ───────────
router.delete('/comentarios/:cid', async (req, res) => {
  const cid = Number(req.params.cid)
  const comentario = await prisma.chamadoComentario.findUnique({ where: { id: cid } })
  if (!comentario) return res.status(404).json({ error: 'Comentario nao encontrado' })

  if (comentario.autorId !== req.usuario.id && req.usuario.role !== 'admin') {
    return res.status(403).json({ error: 'Sem permissao' })
  }

  await prisma.chamadoComentario.delete({ where: { id: cid } })
  res.json({ ok: true })
})

// ── GET /:id/historico — Histórico de alterações ─────────────────────────────
router.get('/:id/historico', async (req, res) => {
  const id = Number(req.params.id)
  const historico = await prisma.chamadoHistorico.findMany({
    where: { chamadoId: id },
    orderBy: { criadoEm: 'desc' },
    include: { usuario: { select: { id: true, nome: true } } }
  })
  res.json(historico)
})

// ── GET /:id — Detalhe completo ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const chamado = await prisma.chamado.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      criadoPor:  { select: { id: true, nome: true } },
      responsavel: { select: { id: true, nome: true } },
      // senhaHash entra no select APENAS para derivar temConta — removido antes da resposta
      solicitante: { select: { id: true, nome: true, cargo: true, email: true, telefone: true, contaAtiva: true, senhaHash: true } },
      comentarios: {
        orderBy: { criadoEm: 'asc' },
        include: {
          autor: { select: { id: true, nome: true } },
          autorSolicitante: { select: { id: true, nome: true } }
        }
      },
      anexos: {
        select: { id: true, nomeArquivo: true, tipo: true, tamanho: true, criadoEm: true, comentarioId: true }
      },
      _count: { select: { comentarios: true, anexos: true } }
    }
  })
  if (!chamado) return res.status(404).json({ error: 'Chamado nao encontrado' })
  if (chamado.solicitante) {
    const { senhaHash, ...resto } = chamado.solicitante
    chamado.solicitante = { ...resto, temConta: !!senhaHash }
  }
  res.json(chamado)
})

// ── PUT /:id — Atualizar chamado ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { titulo, descricao, status, classificacao, prioridade, vertical, sistema, responsavelId, municipio, entidade, solicitanteId } = req.body

  try {
    // Buscar estado atual para comparar e registrar histórico
    const atual = await prisma.chamado.findUnique({
      where: { id },
      include: { responsavel: { select: { id: true, nome: true } } }
    })
    if (!atual) return res.status(404).json({ error: 'Chamado nao encontrado' })

    const chamado = await prisma.chamado.update({
      where: { id },
      data: {
        ...(titulo !== undefined && { titulo: titulo.trim() }),
        ...(descricao !== undefined && { descricao: descricao?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(classificacao !== undefined && { classificacao: classificacao || null }),
        ...(prioridade !== undefined && { prioridade }),
        ...(vertical !== undefined && { vertical: vertical || null }),
        ...(sistema !== undefined && { sistema: sistema || null }),
        ...(responsavelId !== undefined && { responsavelId: responsavelId ? Number(responsavelId) : null }),
        ...(municipio     !== undefined && { municipio:     municipio?.trim()                          || null }),
        ...(entidade      !== undefined && { entidade:      entidade?.trim()                           || null }),
        ...(solicitanteId !== undefined && { solicitanteId: solicitanteId ? Number(solicitanteId) : null }),
      },
      include: {
        criadoPor:   { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
        solicitante: { select: { id: true, nome: true, cargo: true } },
        _count: { select: { comentarios: true, anexos: true } }
      }
    })

    // Registrar histórico das alterações detectadas
    const entradas = []

    if (status !== undefined && status !== atual.status) {
      entradas.push({ tipo: 'status', valorAntes: atual.status, valorDepois: status })
    }
    if (prioridade !== undefined && prioridade !== atual.prioridade) {
      entradas.push({ tipo: 'prioridade', valorAntes: atual.prioridade, valorDepois: prioridade })
    }
    if (classificacao !== undefined && (classificacao || null) !== atual.classificacao) {
      entradas.push({ tipo: 'classificacao', valorAntes: atual.classificacao, valorDepois: classificacao || null })
    }
    if (titulo !== undefined && titulo.trim() !== atual.titulo) {
      entradas.push({ tipo: 'titulo', valorAntes: atual.titulo, valorDepois: titulo.trim() })
    }
    if (responsavelId !== undefined) {
      const novoId = responsavelId ? Number(responsavelId) : null
      if (novoId !== atual.responsavelId) {
        let nomeNovo = null
        if (novoId) {
          const u = await prisma.usuario.findUnique({ where: { id: novoId }, select: { nome: true } })
          nomeNovo = u?.nome || null
        }
        entradas.push({ tipo: 'responsavel', valorAntes: atual.responsavel?.nome || null, valorDepois: nomeNovo })
      }
    }
    if (vertical !== undefined && (vertical || null) !== atual.vertical) {
      entradas.push({ tipo: 'vertical', valorAntes: atual.vertical, valorDepois: vertical || null })
    }

    if (entradas.length > 0) {
      await prisma.chamadoHistorico.createMany({
        data: entradas.map(e => ({
          chamadoId: id,
          usuarioId: req.usuario.id,
          tipo: e.tipo,
          valorAntes: e.valorAntes !== null && e.valorAntes !== undefined ? String(e.valorAntes) : null,
          valorDepois: e.valorDepois !== null && e.valorDepois !== undefined ? String(e.valorDepois) : null,
        }))
      })
    }

    res.json(chamado)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Chamado nao encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /:id — Remover chamado (admin only) ───────────────────────────────
router.delete('/:id', exigirAdmin, async (req, res) => {
  try {
    await prisma.chamado.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Chamado nao encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// ── POST /:id/comentarios — Adicionar comentário ─────────────────────────────
router.post('/:id/comentarios', async (req, res) => {
  const chamadoId = Number(req.params.id)
  const { conteudo, pendingAnexoIds, interno } = req.body
  if (!conteudo?.trim()) return res.status(400).json({ error: 'Conteudo e obrigatorio' })

  const chamado = await prisma.chamado.findUnique({ where: { id: chamadoId } })
  if (!chamado) return res.status(404).json({ error: 'Chamado nao encontrado' })

  const comentario = await prisma.chamadoComentario.create({
    // interno: true = nota da equipe, invisível nas rotas /api/portal/* (Fase 2)
    data: { conteudo: conteudo.trim(), chamadoId, autorId: req.usuario.id, interno: !!interno },
    include: { autor: { select: { id: true, nome: true } } }
  })

  // Vincular imagens pré-carregadas ao comentário criado
  if (Array.isArray(pendingAnexoIds) && pendingAnexoIds.length > 0) {
    await prisma.chamadoAnexo.updateMany({
      where: { id: { in: pendingAnexoIds.map(Number) }, chamadoId },
      data: { comentarioId: comentario.id }
    })
  }

  res.status(201).json(comentario)
})

// ── POST /:id/anexos — Upload anexo ──────────────────────────────────────────
router.post('/:id/anexos', async (req, res) => {
  const chamadoId = Number(req.params.id)
  const { nomeArquivo, tipo, conteudo, comentarioId } = req.body
  if (!nomeArquivo || !conteudo) return res.status(400).json({ error: 'nomeArquivo e conteudo sao obrigatorios' })

  // Whitelist de MIME (imagens + PDF) — não confia no tipo declarado para outros formatos
  if (!tipo || !MIME_PERMITIDOS.has(tipo)) {
    return res.status(415).json({ error: 'Tipo de arquivo não permitido. Aceitos: PNG, JPEG, GIF, WebP, PDF.' })
  }

  // Tamanho real calculado do base64 — não confia no campo `tamanho` enviado pelo cliente
  const bytes = bytesDeBase64(conteudo)
  if (bytes <= 0) return res.status(400).json({ error: 'Conteúdo do anexo inválido' })
  if (bytes > MAX_ANEXO_BYTES) {
    return res.status(413).json({ error: `Anexo excede o limite de ${MAX_ANEXO_BYTES / 1024 / 1024} MB.` })
  }

  // Sanitiza o nome do arquivo (remove path traversal e caracteres de controle)
  const nomeSeguro = String(nomeArquivo).replace(/[\\/]/g, '_').replace(/[\x00-\x1f]/g, '').slice(0, 255).trim() || 'arquivo'

  const chamado = await prisma.chamado.findUnique({ where: { id: chamadoId } })
  if (!chamado) return res.status(404).json({ error: 'Chamado nao encontrado' })

  // Limite total acumulado por chamado
  const usado = await prisma.chamadoAnexo.aggregate({
    where: { chamadoId },
    _sum: { tamanho: true },
  })
  if ((usado._sum.tamanho || 0) + bytes > MAX_CHAMADO_BYTES) {
    return res.status(413).json({ error: `Limite total de anexos do chamado (${MAX_CHAMADO_BYTES / 1024 / 1024} MB) excedido.` })
  }

  const anexo = await prisma.chamadoAnexo.create({
    data: {
      nomeArquivo: nomeSeguro,
      tipo,
      conteudo,
      tamanho: bytes,
      chamadoId,
      comentarioId: comentarioId ? Number(comentarioId) : null,
    },
    select: { id: true, nomeArquivo: true, tipo: true, tamanho: true, criadoEm: true, comentarioId: true }
  })
  res.status(201).json(anexo)
})

module.exports = router
