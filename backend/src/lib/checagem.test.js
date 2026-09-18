const { test } = require('node:test')
const assert = require('node:assert/strict')

const { achatarCampos, validarPayload } = require('./checagem')

// bodySchema no formato real produzido pelo parser Swagger (endpoints.js),
// espelhando dividasPost: sentinel _exemplo + campo object com subFields.
const BODY_SCHEMA_DIVIDAS = [
  { _exemplo: true, json: { dividas: {} } },
  { campo: 'idIntegracao', tipo: 'string', obrigatorio: false, enum: null, subFields: null },
  {
    campo: 'dividas',
    tipo: 'object',
    obrigatorio: true,
    enum: null,
    subFields: [
      { campo: 'idPessoa', tipo: 'integer', obrigatorio: true, enum: null, subFields: null },
      { campo: 'sistemaOrigem', tipo: 'integer', obrigatorio: false, descricao: 'Código do sistema origem', enum: null, subFields: null },
      { campo: 'situacaoDivida', tipo: 'string', obrigatorio: true, enum: ['ABERTO', 'PAGA', 'CANCELADA', 'SUSPENSA'], subFields: null },
      { campo: 'valorInscrito', tipo: 'number', obrigatorio: true, enum: null, subFields: null },
      { campo: 'dataVencimento', tipo: 'string', obrigatorio: true, enum: null, subFields: null },
    ],
  },
]

const CAMPOS = () => achatarCampos(BODY_SCHEMA_DIVIDAS)

// Payload completo e correto — base para os testes mutarem.
const payloadValido = () => ({
  idIntegracao: 'INTEGRACAO1',
  dividas: {
    idPessoa: 4412,
    sistemaOrigem: 123,
    situacaoDivida: 'ABERTO',
    valorInscrito: 1250.0,
    dataVencimento: '2026-01-10',
  },
})

const validar = (payload, marcacoes = []) =>
  validarPayload({ payload, campos: CAMPOS(), marcacoes })

const achadosDe = (res, campo) => res.achados.filter(a => a.campo === campo)

// --------------------------------------------------------------------------
// achatarCampos
// --------------------------------------------------------------------------

test('achatarCampos descarta o sentinel _exemplo', () => {
  assert.equal(CAMPOS().some(c => c._exemplo), false)
})

test('achatarCampos achata subFields em caminho pontilhado', () => {
  const caminhos = CAMPOS().map(c => c.caminho)
  assert.ok(caminhos.includes('dividas'))
  assert.ok(caminhos.includes('dividas.sistemaOrigem'))
})

test('achatarCampos preserva obrigatorio e enum da spec', () => {
  const situacao = CAMPOS().find(c => c.caminho === 'dividas.situacaoDivida')
  assert.equal(situacao.obrigatorioSpec, true)
  assert.deepEqual(situacao.enum, ['ABERTO', 'PAGA', 'CANCELADA', 'SUSPENSA'])

  const origem = CAMPOS().find(c => c.caminho === 'dividas.sistemaOrigem')
  assert.equal(origem.obrigatorioSpec, false)
})

// --------------------------------------------------------------------------
// validarPayload — payload correto
// --------------------------------------------------------------------------

test('payload correto nao gera achados', () => {
  const res = validar(payloadValido())
  assert.deepEqual(res.achados, [])
  assert.equal(res.resumo.erros, 0)
  assert.equal(res.resumo.alertas, 0)
})

// --------------------------------------------------------------------------
// Checagem 1 — obrigatorio ausente
// --------------------------------------------------------------------------

test('campo obrigatorio pela spec ausente vira erro', () => {
  const p = payloadValido()
  delete p.dividas.idPessoa

  const achados = achadosDe(validar(p), 'dividas.idPessoa')
  assert.equal(achados.length, 1)
  assert.equal(achados[0].severidade, 'erro')
  assert.equal(achados[0].tipo, 'obrigatorio')
  assert.equal(achados[0].origem, 'spec')
})

test('campo opcional na spec ausente nao gera achado sem marcacao', () => {
  const p = payloadValido()
  delete p.dividas.sistemaOrigem

  assert.deepEqual(achadosDe(validar(p), 'dividas.sistemaOrigem'), [])
})

test('campo marcado obrigatorio pelo usuario ausente vira erro com a observacao', () => {
  const p = payloadValido()
  delete p.dividas.sistemaOrigem

  const res = validar(p, [
    { campo: 'dividas.sistemaOrigem', obrigatorio: true, observacao: 'sem isso o debito nao cancela pela rotina' },
  ])

  const achados = achadosDe(res, 'dividas.sistemaOrigem')
  assert.equal(achados.length, 1)
  assert.equal(achados[0].severidade, 'erro')
  assert.equal(achados[0].origem, 'marcacao')
  assert.equal(achados[0].detalhe, 'sem isso o debito nao cancela pela rotina')
})

test('marcacao obrigatorio false desliga a obrigatoriedade da spec', () => {
  const p = payloadValido()
  delete p.dividas.idPessoa

  const res = validar(p, [{ campo: 'dividas.idPessoa', obrigatorio: false, observacao: null }])
  assert.deepEqual(achadosDe(res, 'dividas.idPessoa'), [])
})

test('string vazia conta como ausente', () => {
  const p = payloadValido()
  p.dividas.dataVencimento = '   '

  const achados = achadosDe(validar(p), 'dividas.dataVencimento')
  assert.equal(achados.length, 1)
  assert.equal(achados[0].tipo, 'obrigatorio')
})

// --------------------------------------------------------------------------
// Checagem 2 — enum
// --------------------------------------------------------------------------

test('valor fora do enum vira erro listando os validos', () => {
  const p = payloadValido()
  p.dividas.situacaoDivida = 'EM ABERTO'

  const achados = achadosDe(validar(p), 'dividas.situacaoDivida')
  assert.equal(achados.length, 1)
  assert.equal(achados[0].severidade, 'erro')
  assert.equal(achados[0].tipo, 'enum')
  assert.ok(achados[0].detalhe.includes('ABERTO'))
})

// --------------------------------------------------------------------------
// Checagem 3 — tipo
// --------------------------------------------------------------------------

test('numero em formato brasileiro num campo number vira erro', () => {
  const p = payloadValido()
  p.dividas.valorInscrito = '1.250,00'

  const achados = achadosDe(validar(p), 'dividas.valorInscrito')
  assert.equal(achados.length, 1)
  assert.equal(achados[0].severidade, 'erro')
  assert.equal(achados[0].tipo, 'tipo')
})

test('numero como string numerica vira alerta, nao erro', () => {
  const p = payloadValido()
  p.dividas.valorInscrito = '1250.00'

  const achados = achadosDe(validar(p), 'dividas.valorInscrito')
  assert.equal(achados.length, 1)
  assert.equal(achados[0].severidade, 'alerta')
  assert.equal(achados[0].tipo, 'tipo')
})

test('decimal num campo integer vira erro', () => {
  const p = payloadValido()
  p.dividas.idPessoa = 44.5

  const achados = achadosDe(validar(p), 'dividas.idPessoa')
  assert.equal(achados.length, 1)
  assert.equal(achados[0].tipo, 'tipo')
})

// --------------------------------------------------------------------------
// Checagem 4 — campo desconhecido
// --------------------------------------------------------------------------

test('campo desconhecido vira alerta', () => {
  const p = payloadValido()
  p.dividas.campoQueNaoExiste = 1

  const achados = achadosDe(validar(p), 'dividas.campoQueNaoExiste')
  assert.equal(achados.length, 1)
  assert.equal(achados[0].severidade, 'alerta')
  assert.equal(achados[0].tipo, 'desconhecido')
})

test('campo desconhecido truncado sugere o campo correto', () => {
  const p = payloadValido()
  delete p.dividas.dataVencimento
  p.dividas.dataVenc = '2026-01-10'

  const achados = achadosDe(validar(p), 'dividas.dataVenc')
  assert.equal(achados.length, 1)
  assert.equal(achados[0].sugestao, 'dataVencimento')
})

test('campo desconhecido com erro de digitacao sugere o campo correto', () => {
  const p = payloadValido()
  delete p.dividas.situacaoDivida
  p.dividas.situacaoDivda = 'ABERTO'

  const achados = achadosDe(validar(p), 'dividas.situacaoDivda')
  assert.equal(achados[0].sugestao, 'situacaoDivida')
})

// --------------------------------------------------------------------------
// Regra do pai ausente
// --------------------------------------------------------------------------

test('objeto pai ausente reporta so o pai, nao os filhos', () => {
  const p = payloadValido()
  delete p.dividas

  const res = validar(p)
  assert.equal(achadosDe(res, 'dividas').length, 1)
  assert.equal(res.achados.filter(a => a.campo.startsWith('dividas.')).length, 0)
})

// --------------------------------------------------------------------------
// Array (envio em lote)
// --------------------------------------------------------------------------

test('payload array valida cada item identificando o indice', () => {
  const bom = payloadValido()
  const ruim = payloadValido()
  delete ruim.dividas.idPessoa

  const res = validar([bom, ruim])
  assert.equal(res.resumo.erros, 1)
  assert.equal(res.achados[0].indice, 1)
})

// --------------------------------------------------------------------------
// Resumo
// --------------------------------------------------------------------------

test('resumo conta erros e alertas separadamente', () => {
  const p = payloadValido()
  delete p.dividas.idPessoa          // erro
  p.dividas.situacaoDivida = 'XPTO'  // erro
  p.dividas.campoEstranho = 1        // alerta

  const res = validar(p)
  assert.equal(res.resumo.erros, 2)
  assert.equal(res.resumo.alertas, 1)
})
