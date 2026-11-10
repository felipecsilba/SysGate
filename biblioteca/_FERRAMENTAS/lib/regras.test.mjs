import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mascararStrings, revisar } from './regras.mjs'

const regras = (texto, op) => revisar(texto, op).map(a => `L${a.linha} ${a.nivel} ${a.regra}`)

test('mascararStrings: apaga o conteúdo de strings, mantém aspas, tamanho e quebras de linha', () => {
  const t = 'imprimir "as dívidas"\nx = \'a\\\'b\'\ny = """linha1\nlinha2"""'
  const m = mascararStrings(t)
  assert.equal(m.length, t.length)
  assert.equal(m.split('\n').length, t.split('\n').length)
  assert.ok(!m.includes('dívidas') && !m.includes('linha1'))
})

test('cast-as: acusa cast no código, não em texto nem em comentário', () => {
  assert.deepEqual(regras('ids = [] as Set\nv = (x as BigDecimal) * 100'), ['L1 erro cast-as', 'L2 erro cast-as'])
  assert.deepEqual(regras('imprimir "Processando as Dívidas"\n// y = x as Set'), [])
})

test('json-minusculo e imprimir-soma', () => {
  assert.deepEqual(regras('Json.escrever(m)\nJSON.escrever(m)'), ['L1 erro json-minusculo'])
  assert.deepEqual(regras('imprimir (a) + b\nimprimir(a + b)\nlinha = a + b; imprimir linha'), ['L1 erro imprimir-soma'])
})

test('zip-no-script: zip montado no script e Resultado.arquivos', () => {
  assert.deepEqual(regras("z = Arquivo.novo('saida.zip', 'zip')\nResultado.arquivos([a, b])\nResultado.arquivo(a)"),
    ['L1 erro zip-no-script', 'L2 erro zip-no-script'])
})

test('metodo-sistema: .buscar no tributos e .busca na procuradoria', () => {
  assert.deepEqual(regras('a = Dados.tributos.v2.imoveis.buscar(criterio: c)\nb = Dados.procuradoria.v2.dividas.busca(criterio: c)\nc = Dados.tributos.v2.imoveis.busca()\nd = Dados.procuradoria.v2.dividas.buscar()'),
    ['L1 erro metodo-sistema', 'L2 erro metodo-sistema'])
})

test('metodo-rest: só nome de operação REST do catálogo; métodos BFC de produção passam', () => {
  const operacoesRest = ['busca', 'buscaTestadas', 'buscaCamposAdicionais', 'preenche', 'metadados', 'calcula', 'cria']
  assert.deepEqual(regras('t = Dados.tributos.v2.imovel.buscaTestadas(parametros: p)', { operacoesRest }), ['L1 aviso metodo-rest'])
  assert.deepEqual(regras(`Dados.tributos.v2.tabelaAuxiliar.registros.cria(r)
Dados.tributos.v2.imovel.campoAdicional.preenche(x)
Dados.tributos.v2.dividas.metadados()
Dados.pessoal.v2.feriado.buscarTodos()`, { operacoesRest }), [])
})

test('se-lista: só quando a variável recebeu lista no arquivo; booleano e comparação explícita passam', () => {
  const t = `usos = []
lista = imoveis.findAll { it.ativo }
ativo = true
se (usos) { a() }
se (!lista) { b() }
se (ativo) { c() }
se (usos != null) { d() }
se (usos.size() > 0) { e() }`
  assert.deepEqual(regras(t), ['L4 aviso se-lista', 'L5 aviso se-lista'])
  assert.deepEqual(regras('ids << 1\nse (ids) { f() }'), ['L2 aviso se-lista'])
})

test('it-em-se: it direto dentro do bloco do se; it de closure aninhada passa', () => {
  const t = `guias.each {
  se (it.valor > 0) {
    imprimir it.nroBaixa
  }
  se (x == 1) { lista.each { imprimir it.nome } }
}`
  assert.deepEqual(regras(t), ['L3 aviso it-em-se'])
})

test('zero-ausencia: id comparado só com nulo', () => {
  assert.deepEqual(regras('se (d.idEconomico == nulo) { a() }\nse (d.idImovel == nulo || d.idImovel == 0) { b() }\nif (nome == null) { c() }'),
    ['L1 aviso zero-ausencia'])
})

test('fonte-desconhecida: fonte fora do grafo; cadeia filha de fonte conhecida passa', () => {
  const fontesConhecidas = ['fonte:imoveis', 'fonte:debitos']
  assert.deepEqual(regras('a = Dados.tributos.v2.imoveis.camposAdicionais.busca()\nb = Dados.tributos.v2.debitoz.busca()', { fontesConhecidas }),
    ['L2 aviso fonte-desconhecida'])
})

test('fórmula: def, .find{} e Dados.* são erro só com --formula', () => {
  const t = 'def calc() { 1 }\nx = lista.find { it > 1 }\ny = Dados.tributos.v2.imoveis.busca()'
  assert.deepEqual(regras(t, { formula: true }).filter(r => r.includes('formula')), ['L1 erro formula-def', 'L2 erro formula-find', 'L3 erro formula-dados'])
  assert.deepEqual(regras(t).filter(r => r.includes('formula')), [])
})

test('cada achado traz trecho e mensagem com a correção', () => {
  const [a] = revisar('v = (x as BigDecimal) * 100')
  assert.equal(a.trecho, 'as BigDecimal')
  assert.match(a.msg, /Math\.round/)
})
