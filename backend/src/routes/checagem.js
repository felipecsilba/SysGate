const { Router } = require('express')

const router = Router()
const prisma = require('../lib/prisma')
const { achatarCampos, validarPayload } = require('../lib/checagem')

// Cadastros = endpoints de escrita, que são os que carregam payload de migração.
const METODOS_CADASTRO = ['POST', 'PUT', 'PATCH']

function parseBodySchema(endpoint) {
  try {
    return JSON.parse(endpoint.bodySchema || '[]')
  } catch {
    return []
  }
}

async function carregarCadastro(sistemaId, path) {
  const endpoints = await prisma.endpoint.findMany({
    where: { sistemaId, path, metodo: { in: METODOS_CADASTRO } },
  })
  if (!endpoints.length) return null

  // Prefere o POST (criação) — é o payload completo da migração.
  const escolhido = endpoints.find(e => e.metodo === 'POST') || endpoints[0]
  return { endpoint: escolhido, campos: achatarCampos(parseBodySchema(escolhido)) }
}

// GET /api/checagem/cadastros?sistemaId= — lista os cadastros disponíveis
router.get('/cadastros', async (req, res) => {
  try {
    const sistemaId = parseInt(req.query.sistemaId)
    if (!sistemaId) return res.status(400).json({ error: 'sistemaId é obrigatório' })

    const endpoints = await prisma.endpoint.findMany({
      where: { sistemaId, metodo: { in: METODOS_CADASTRO } },
      select: { id: true, modulo: true, nome: true, path: true, metodo: true },
      orderBy: [{ modulo: 'asc' }, { path: 'asc' }],
    })

    // Um cadastro por path; o POST representa o grupo quando existe.
    const porPath = new Map()
    for (const ep of endpoints) {
      const atual = porPath.get(ep.path)
      if (!atual || (ep.metodo === 'POST' && atual.metodo !== 'POST')) {
        porPath.set(ep.path, ep)
      }
    }

    const marcados = await prisma.campoChecagem.groupBy({
      by: ['path'],
      where: { sistemaId, obrigatorio: true },
      _count: { _all: true },
    })
    const contagem = new Map(marcados.map(m => [m.path, m._count._all]))

    res.json(
      [...porPath.values()].map(ep => ({
        ...ep,
        marcacoes: contagem.get(ep.path) || 0,
      }))
    )
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/checagem/campos?sistemaId=&path= — campos do cadastro + marcações
router.get('/campos', async (req, res) => {
  try {
    const sistemaId = parseInt(req.query.sistemaId)
    const { path } = req.query
    if (!sistemaId || !path) return res.status(400).json({ error: 'sistemaId e path são obrigatórios' })

    const cadastro = await carregarCadastro(sistemaId, path)
    if (!cadastro) return res.status(404).json({ error: 'Cadastro não encontrado' })

    const marcacoes = await prisma.campoChecagem.findMany({ where: { sistemaId, path } })
    const mapa = new Map(marcacoes.map(m => [m.campo, m]))

    res.json({
      endpoint: {
        id: cadastro.endpoint.id,
        nome: cadastro.endpoint.nome,
        modulo: cadastro.endpoint.modulo,
        path: cadastro.endpoint.path,
        metodo: cadastro.endpoint.metodo,
      },
      campos: cadastro.campos.map(c => {
        const m = mapa.get(c.caminho)
        return {
          ...c,
          obrigatorio: m ? m.obrigatorio : c.obrigatorioSpec,
          marcado: !!m,
          observacao: m?.observacao || '',
        }
      }),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/checagem/campos — marca/desmarca um campo (catálogo global)
router.put('/campos', async (req, res) => {
  try {
    const { sistemaId, path, campo, obrigatorio, observacao } = req.body
    if (!sistemaId || !path || !campo) {
      return res.status(400).json({ error: 'sistemaId, path e campo são obrigatórios' })
    }

    const dados = {
      obrigatorio: obrigatorio === true,
      observacao: observacao?.trim() ? observacao.trim() : null,
      autorId: req.usuario.id,
    }

    const salvo = await prisma.campoChecagem.upsert({
      where: { sistemaId_path_campo: { sistemaId: parseInt(sistemaId), path, campo } },
      update: dados,
      create: { sistemaId: parseInt(sistemaId), path, campo, ...dados },
    })

    res.json(salvo)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/checagem/campos — remove a marcação, voltando ao que a spec diz
router.delete('/campos', async (req, res) => {
  try {
    const { sistemaId, path, campo } = req.body
    if (!sistemaId || !path || !campo) {
      return res.status(400).json({ error: 'sistemaId, path e campo são obrigatórios' })
    }

    await prisma.campoChecagem.deleteMany({ where: { sistemaId: parseInt(sistemaId), path, campo } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/checagem/validar — aplica as duas camadas sobre o payload
router.post('/validar', async (req, res) => {
  try {
    const { sistemaId, path, payload } = req.body
    if (!sistemaId || !path) return res.status(400).json({ error: 'sistemaId e path são obrigatórios' })
    if (payload === undefined || payload === null) {
      return res.status(400).json({ error: 'payload é obrigatório' })
    }

    const cadastro = await carregarCadastro(parseInt(sistemaId), path)
    if (!cadastro) return res.status(404).json({ error: 'Cadastro não encontrado' })

    const marcacoes = await prisma.campoChecagem.findMany({
      where: { sistemaId: parseInt(sistemaId), path },
      select: { campo: true, obrigatorio: true, observacao: true },
    })

    res.json({
      endpoint: { nome: cadastro.endpoint.nome, path: cadastro.endpoint.path, metodo: cadastro.endpoint.metodo },
      ...validarPayload({ payload, campos: cadastro.campos, marcacoes }),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
