const { Router } = require('express')

const router = Router()
const prisma = require('../lib/prisma')
const { exigirAdmin } = require('../middleware/autenticar')
const { achatarCampos, validarPayload } = require('../lib/checagem')
const { avaliarRegras } = require('../lib/regrasChecagem')
const { parseEntrada } = require('../lib/parseEntrada')

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

    // Notas do CADASTRO: o que falta fora do payload. Vao junto no laudo porque
    // um JSON impecavel ainda pode nao funcionar por falta de formula,
    // agrupamento ou de um campo que a API de migracao simplesmente nao tem.
    const notas = await prisma.notaChecagem.findMany({
      where: { sistemaId: parseInt(sistemaId), path },
      select: { id: true, tipo: true, texto: true, ordem: true },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    })

    res.json({
      endpoint: { nome: cadastro.endpoint.nome, path: cadastro.endpoint.path, metodo: cadastro.endpoint.metodo },
      notas,
      ...validarPayload({ payload, campos: cadastro.campos, marcacoes }),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Notas do cadastro ────────────────────────────────────────────────────────
// Mesmo criterio do catalogo de campos: dados globais, qualquer autenticado
// escreve, chaveado por path (reimportar o Swagger troca os ids dos endpoints).

router.get('/notas', async (req, res) => {
  try {
    const { sistemaId, path } = req.query
    if (!sistemaId) return res.status(400).json({ error: 'sistemaId é obrigatório' })
    const notas = await prisma.notaChecagem.findMany({
      where: { sistemaId: parseInt(sistemaId), ...(path ? { path } : {}) },
      orderBy: [{ path: 'asc' }, { ordem: 'asc' }, { id: 'asc' }],
    })
    res.json(notas)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const TIPOS_NOTA = ['prerequisito', 'dependencia', 'inalcancavel', 'regra']

router.post('/notas', async (req, res) => {
  try {
    const { sistemaId, path, tipo, texto, ordem } = req.body
    if (!sistemaId || !path || !tipo || !texto?.trim()) {
      return res.status(400).json({ error: 'sistemaId, path, tipo e texto são obrigatórios' })
    }
    if (!TIPOS_NOTA.includes(tipo)) {
      return res.status(400).json({ error: `tipo inválido. Use: ${TIPOS_NOTA.join(', ')}` })
    }
    const nota = await prisma.notaChecagem.create({
      data: {
        sistemaId: parseInt(sistemaId),
        path,
        tipo,
        texto: texto.trim(),
        ordem: Number.isInteger(ordem) ? ordem : 0,
        autorId: req.usuario.id,
      },
    })
    res.status(201).json(nota)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/notas/:id', async (req, res) => {
  try {
    const { tipo, texto, ordem } = req.body
    if (tipo && !TIPOS_NOTA.includes(tipo)) {
      return res.status(400).json({ error: `tipo inválido. Use: ${TIPOS_NOTA.join(', ')}` })
    }
    const nota = await prisma.notaChecagem.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(tipo ? { tipo } : {}),
        ...(texto?.trim() ? { texto: texto.trim() } : {}),
        ...(Number.isInteger(ordem) ? { ordem } : {}),
      },
    })
    res.json(nota)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Nota não encontrada' })
    res.status(500).json({ error: err.message })
  }
})

router.delete('/notas/:id', async (req, res) => {
  try {
    await prisma.notaChecagem.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Nota não encontrada' })
    res.status(500).json({ error: err.message })
  }
})

// ── Regras de checagem ───────────────────────────────────────────────────────
// Dados globais, qualquer autenticado escreve — mesmo critério do catálogo de
// campos e das notas. Separadas por frente: "api" (payload de migração, valida
// também contra a spec) e "fonte" (retorno de BFC-Script).

const FRENTES = ['api', 'fonte']
const SEVERIDADES = ['erro', 'alerta']

function parseRegra(r) {
  return {
    ...r,
    onde: r.onde ? JSON.parse(r.onde) : [],
    quando: r.quando ? JSON.parse(r.quando) : null,
  }
}

router.get('/regras', async (req, res) => {
  try {
    const { sistemaId, frente, cadastro } = req.query
    if (!sistemaId) return res.status(400).json({ error: 'sistemaId é obrigatório' })
    const regras = await prisma.regraChecagem.findMany({
      where: {
        sistemaId: parseInt(sistemaId),
        ...(frente ? { frente } : {}),
        ...(cadastro ? { cadastro } : {}),
      },
      orderBy: [{ cadastro: 'asc' }, { ordem: 'asc' }, { id: 'asc' }],
    })
    res.json(regras.map(parseRegra))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function validarCorpoRegra(body) {
  const { frente, cadastro, nome, porque, onde, severidade } = body
  if (!frente || !cadastro || !nome?.trim() || !porque?.trim()) {
    return 'frente, cadastro, nome e porque são obrigatórios'
  }
  if (!FRENTES.includes(frente)) return 'frente inválida. Use: ' + FRENTES.join(', ')
  if (!Array.isArray(onde) || onde.length === 0) return 'onde precisa ser uma lista com ao menos um caminho'
  if (severidade && !SEVERIDADES.includes(severidade)) return 'severidade inválida. Use: ' + SEVERIDADES.join(', ')
  return null
}

router.post('/regras', async (req, res) => {
  try {
    const erro = validarCorpoRegra(req.body)
    if (erro) return res.status(400).json({ error: erro })
    const { sistemaId, frente, cadastro, nome, porque, onde, quando, esperado, naoSabemos, comoCorrigir, severidade, ordem } = req.body
    if (!sistemaId) return res.status(400).json({ error: 'sistemaId é obrigatório' })

    const regra = await prisma.regraChecagem.create({
      data: {
        sistemaId: parseInt(sistemaId),
        frente,
        cadastro,
        nome: nome.trim(),
        porque: porque.trim(),
        onde: JSON.stringify(onde),
        quando: quando ? JSON.stringify(quando) : null,
        esperado: esperado?.trim() || null,
        naoSabemos: naoSabemos?.trim() || null,
        comoCorrigir: comoCorrigir?.trim() || null,
        severidade: severidade || 'erro',
        ordem: Number.isInteger(ordem) ? ordem : 0,
        autorId: req.usuario.id,
      },
    })
    res.status(201).json(parseRegra(regra))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/regras/:id', async (req, res) => {
  try {
    const { nome, porque, onde, quando, esperado, naoSabemos, comoCorrigir, severidade, ordem } = req.body
    if (severidade && !SEVERIDADES.includes(severidade)) {
      return res.status(400).json({ error: 'severidade inválida. Use: ' + SEVERIDADES.join(', ') })
    }
    if (onde !== undefined && (!Array.isArray(onde) || onde.length === 0)) {
      return res.status(400).json({ error: 'onde precisa ser uma lista com ao menos um caminho' })
    }
    const regra = await prisma.regraChecagem.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(nome?.trim() ? { nome: nome.trim() } : {}),
        ...(porque?.trim() ? { porque: porque.trim() } : {}),
        ...(onde !== undefined ? { onde: JSON.stringify(onde) } : {}),
        ...(quando !== undefined ? { quando: quando ? JSON.stringify(quando) : null } : {}),
        ...(esperado !== undefined ? { esperado: esperado?.trim() || null } : {}),
        ...(naoSabemos !== undefined ? { naoSabemos: naoSabemos?.trim() || null } : {}),
        ...(comoCorrigir !== undefined ? { comoCorrigir: comoCorrigir?.trim() || null } : {}),
        ...(severidade ? { severidade } : {}),
        ...(Number.isInteger(ordem) ? { ordem } : {}),
      },
    })
    res.json(parseRegra(regra))
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Regra não encontrada' })
    res.status(500).json({ error: err.message })
  }
})

router.delete('/regras/:id', async (req, res) => {
  try {
    await prisma.regraChecagem.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Regra não encontrada' })
    res.status(500).json({ error: err.message })
  }
})

// ── Verificação ──────────────────────────────────────────────────────────────
// Recebe TEXTO cru, não JSON já parseado: o parser tolera array, NDJSON e o log
// do Studio com a hora na frente. Na frente "api" roda também a validação
// contra a spec, que só tem autoridade sobre payload de migração.

router.post('/verificar', async (req, res) => {
  try {
    const { sistemaId, frente, cadastro, texto } = req.body
    if (!sistemaId || !frente || !cadastro) {
      return res.status(400).json({ error: 'sistemaId, frente e cadastro são obrigatórios' })
    }
    if (!FRENTES.includes(frente)) {
      return res.status(400).json({ error: 'frente inválida. Use: ' + FRENTES.join(', ') })
    }

    const entrada = parseEntrada(texto)
    if (entrada.registros.length === 0) {
      return res.status(400).json({
        error: 'Não encontrei nenhum registro no texto colado.',
        detalhe: 'Aceito array JSON, um JSON por linha, ou a saída do Studio com a hora na frente.',
      })
    }

    const sid = parseInt(sistemaId)
    const [regrasBrutas, notas] = await Promise.all([
      prisma.regraChecagem.findMany({
        where: { sistemaId: sid, frente, cadastro },
        orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
      }),
      // Nota fala do CADASTRO, nao do formato. Na frente fonte o cadastro se
      // chama "dividas"; as notas estao gravadas em "/api/dividas". Busca os dois.
      prisma.notaChecagem.findMany({
        where: {
          sistemaId: sid,
          path: { in: [cadastro, cadastro.startsWith('/api/') ? cadastro.slice(5) : `/api/${cadastro}`] },
        },
        select: { id: true, tipo: true, texto: true, ordem: true },
        orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
      }),
    ])

    const regras = regrasBrutas.map(parseRegra)
    const resultados = avaliarRegras({ registros: entrada.registros, regras })

    const porRegra = resultados.map((r) => {
      const regra = regras.find((x) => x.id === r.regraId)
      return {
        regraId: r.regraId,
        nome: r.nome,
        // Regra que nao alcancou registro nenhum nao foi conferida — dizer "ok"
        // sugere aprovacao que nao houve.
        severidade: r.aplicaveis === 0 ? 'na' : r.severidade,
        aplicaveis: r.aplicaveis,
        faltam: r.faltando.length,
        porque: regra?.porque || '',
        onde: regra?.onde || [],
        esperado: regra?.esperado || null,
        naoSabemos: regra?.naoSabemos || null,
        comoCorrigir: regra?.comoCorrigir || null,
        // o laudo mostra até 3 trechos; o resto vira contagem e lista de ids
        exemplos: r.faltando.slice(0, 3),
        ids: r.faltando.map((f) => f.id),
      }
    })

    const resposta = {
      entrada: {
        formato: entrada.formato,
        registros: entrada.registros.length,
        descartadas: entrada.descartadas,
      },
      regras: porRegra,
      notas,
      resumo: {
        erros: porRegra.filter((r) => r.severidade === 'erro').length,
        alertas: porRegra.filter((r) => r.severidade === 'alerta').length,
        ok: porRegra.filter((r) => r.severidade === 'ok').length,
        naoSeAplicam: porRegra.filter((r) => r.severidade === 'na').length,
      },
    }

    // Na frente API a spec também tem autoridade: roda o motor antigo por cima.
    if (frente === 'api') {
      const cadastroSpec = await carregarCadastro(sid, cadastro)
      if (cadastroSpec) {
        const marcacoes = await prisma.campoChecagem.findMany({
          where: { sistemaId: sid, path: cadastro },
          select: { campo: true, obrigatorio: true, observacao: true },
        })
        const porPayload = entrada.registros.map((payload) =>
          validarPayload({ payload, campos: cadastroSpec.campos, marcacoes })
        )
        resposta.spec = {
          achados: porPayload.flatMap((p, i) => p.achados.map((a) => ({ ...a, registro: i + 1 }))),
          resumo: porPayload.reduce(
            (acc, p) => ({
              erros: acc.erros + p.resumo.erros,
              alertas: acc.alertas + p.resumo.alertas,
              total: acc.total + p.resumo.total,
            }),
            { erros: 0, alertas: 0, total: 0 }
          ),
        }
      }
    }

    res.json(resposta)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Catálogo de fontes de dados (BFC-Script) ─────────────────────────────────
// Importado do catalogo_v2.json, do mesmo jeito que o Swagger vira Endpoint.
// É o que permite montar filtro com os campos que a fonte aceita de verdade e
// com os valores válidos de cada enum, em vez de o usuário adivinhar.

// Importação é escrita global e destrutiva por sistema: só admin.
router.post('/fontes/importar', exigirAdmin, async (req, res) => {
  try {
    const { sistemaId, catalogo } = req.body
    if (!sistemaId) return res.status(400).json({ error: 'sistemaId é obrigatório' })
    if (!Array.isArray(catalogo)) {
      return res.status(400).json({ error: 'catalogo precisa ser o array do catalogo_v2.json' })
    }

    const sid = parseInt(sistemaId)
    // Só interessa o que dá para ler: a checagem por fonte parte de consulta.
    const leitura = catalogo.filter((f) => f && f.nome && f.path && (f.natureza || '').toUpperCase() === 'LEITURA')

    let gravadas = 0
    let ignoradas = 0
    const vistos = new Set()

    for (const f of leitura) {
      const chave = `${f.nome}|${f.path}|${f.operacao || 'busca'}`
      if (vistos.has(chave)) { ignoradas++; continue } // o catálogo repete algumas
      vistos.add(chave)

      const dados = {
        sistemaId: sid,
        nome: f.nome,
        path: f.path,
        operacao: f.operacao || 'busca',
        verbo: f.verbo || 'GET',
        natureza: f.natureza || 'LEITURA',
        descricao: f.descricao || null,
        descricaoOp: f.descricao_op || null,
        tipoRetorno: f.tipo_retorno || null,
        filtros: JSON.stringify(f.filtros || []),
        campos: JSON.stringify(f.campos_retorno || []),
        enums: JSON.stringify(f.enums || {}),
      }

      await prisma.fonteDados.upsert({
        where: {
          sistemaId_nome_path_operacao: {
            sistemaId: sid, nome: dados.nome, path: dados.path, operacao: dados.operacao,
          },
        },
        update: dados,
        create: dados,
      })
      gravadas++
    }

    const total = await prisma.fonteDados.count({ where: { sistemaId: sid } })
    res.json({ recebidas: catalogo.length, deLeitura: leitura.length, gravadas, ignoradas, totalNoSistema: total })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Lista enxuta para o seletor: uma entrada por fonte, com quantos filtros tem.
router.get('/fontes', async (req, res) => {
  try {
    const { sistemaId, busca } = req.query
    if (!sistemaId) return res.status(400).json({ error: 'sistemaId é obrigatório' })
    const fontes = await prisma.fonteDados.findMany({
      where: {
        sistemaId: parseInt(sistemaId),
        ...(busca ? { OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { descricao: { contains: busca, mode: 'insensitive' } },
        ] } : {}),
      },
      select: { id: true, nome: true, path: true, operacao: true, descricao: true, descricaoOp: true, tipoRetorno: true, filtros: true },
      orderBy: [{ nome: 'asc' }, { path: 'asc' }],
    })
    res.json(fontes.map((f) => {
      const { filtros, ...resto } = f
      let qtd = 0
      try { qtd = JSON.parse(filtros).length } catch { /* catálogo torto: conta zero */ }
      return { ...resto, qtdFiltros: qtd }
    }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Detalhe com filtros e enums — é o que alimenta o construtor de filtro.
router.get('/fontes/:id', async (req, res) => {
  try {
    const f = await prisma.fonteDados.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!f) return res.status(404).json({ error: 'Fonte não encontrada' })

    const filtros = JSON.parse(f.filtros || '[]')
    const enums = JSON.parse(f.enums || '{}')

    // Cada filtro de enum já sai com os valores válidos junto, para a tela não
    // precisar cruzar nada.
    const comValores = filtros.map((flt) => {
      if (!flt.eh_enum) return flt
      const e = enums[flt.tipo]
      return { ...flt, valores: (e?.values || []).map((v) => ({ key: v.key, descricao: v.description })) }
    })

    res.json({
      id: f.id, nome: f.nome, path: f.path, operacao: f.operacao,
      descricao: f.descricao, descricaoOp: f.descricaoOp, tipoRetorno: f.tipoRetorno,
      filtros: comValores,
      campos: JSON.parse(f.campos || '[]'),
      // o perfil do arquivo .jsonl confere os valores de enum contra este mapa
      enums,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
