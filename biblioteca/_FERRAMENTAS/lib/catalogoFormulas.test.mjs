import { test } from 'node:test'
import assert from 'node:assert/strict'
import { indexarCatalogos, tipoDoArquivo } from './catalogoFormulas.mjs'
import { revisar } from './regras.mjs'

// Catálogo mínimo no formato do editor: o nome do método vem com os parâmetros
const cls = (name, ...metodos) => ({ name, methods: metodos.map(m => ({ name: m })) })
const catalogos = indexarCatalogos({
  GERACAO_CREDITO_IMOVEIS: { variables: [{ name: 'imovel', methods: [] }], classes: [cls('Utilitarios', 'emitirErro(msg)', 'buscaBeneficioFiscal(a, b)'), cls('UtilitariosImoveis', 'ehEnglobado(codigo)'), cls('Numeros', 'arredonda(v, casas)')] },
  ITBI: { variables: [{ name: 'imovel', methods: [] }], classes: [cls('Utilitarios', 'emitirErro(msg)', 'imovelEhEnglobado(codigo)'), cls('Creditos', 'busca(x)'), cls('Numeros', 'arredonda(v, casas)')] },
  DESCONTO_PARCELAMENTO: { variables: [], classes: [cls('lancamentos', 'busca(x)')] },
})
const tiposConhecidos = Object.keys(catalogos.tipos)

test('indexarCatalogos: método sem os parâmetros; diz em que tipos cada classe existe', () => {
  assert.deepEqual([...catalogos.tipos.ITBI.classes.get('Utilitarios')].sort(), ['emitirErro', 'imovelEhEnglobado'])
  assert.deepEqual(catalogos.classesConhecidas.get('Creditos'), ['ITBI'])
  assert.deepEqual(catalogos.classesConhecidas.get('Utilitarios'), ['GERACAO_CREDITO_IMOVEIS', 'ITBI'])
})

test('tipoDoArquivo: pelo " - TIPO - " do nome, subtipo cai no tipo do dicionário, apelidos do corpus', () => {
  const t = n => tipoDoArquivo(n, [...tiposConhecidos, 'ITBI_VALOR_VENAL', 'ACRESCIMO_PARCELAMENTO'])
  assert.equal(t('Ilhota - GERACAO_CREDITO_IMOVEIS - IPTU - 2026.txt'), 'GERACAO_CREDITO_IMOVEIS')
  assert.equal(t('Lages - DESCONTO_PARCELAMENTO_TODOS - Refis - 2025.txt'), 'DESCONTO_PARCELAMENTO')
  assert.equal(t('Joaçaba - ITBI_VALOR_VENAL_TERRITORIAL - Valor - 2026.txt'), 'ITBI_VALOR_VENAL')
  assert.equal(t('Lages - ITBI_TRANSFERENCIA_CREDITOS - ITBI - 2026.txt'), 'ITBI')
  assert.equal(t('X - ACRESCIMO_PRE_FIXADA - Correção - 2026.txt'), 'ACRESCIMO_PARCELAMENTO')
  assert.equal(t('rascunho.txt'), null)
  assert.equal(t('X - TIPO_INEXISTENTE - y - 2026.txt'), null)
})

const regras = (texto, tipo) => revisar(texto, { formula: true, catalogo: { ...catalogos, tipo } })
  .filter(a => a.regra.startsWith('formula-') && a.regra.endsWith('-tipo'))

test('formula-classe-tipo: classe que existe em outro tipo, mas não neste, é erro e diz onde existe', () => {
  const r = regras('x = Creditos.busca(1)', 'GERACAO_CREDITO_IMOVEIS')
  assert.deepEqual(r.map(a => `L${a.linha} ${a.nivel} ${a.regra}`), ['L1 erro formula-classe-tipo'])
  assert.match(r[0].msg, /ITBI/)
})

test('formula-metodo-tipo: método que a classe não tem neste tipo é aviso e diz em que tipo existe', () => {
  // o caso real de 2026-08: função de um tipo recomendada para outro
  const r = regras('se (Utilitarios.imovelEhEnglobado(imovel.codigo)) { }', 'GERACAO_CREDITO_IMOVEIS')
  assert.deepEqual(r.map(a => `${a.nivel} ${a.regra}`), ['aviso formula-metodo-tipo'])
  assert.match(r[0].msg, /ITBI/)
  assert.deepEqual(regras('se (Utilitarios.imovelEhEnglobado(imovel.codigo)) { }', 'ITBI'), [])
})

test('regras de tipo: código certo, variável local, string, comentário e tipo desconhecido não acusam', () => {
  assert.deepEqual(regras('v = Numeros.arredonda(UtilitariosImoveis.ehEnglobado(1) ? 1 : 2, 2)\nUtilitarios.emitirErro("x")', 'GERACAO_CREDITO_IMOVEIS'), [])
  assert.deepEqual(regras('lancamentos = [1]\nlancamentos.busca(2)', 'GERACAO_CREDITO_IMOVEIS'), [])
  assert.deepEqual(regras('imprimir "Creditos.busca(1)"\n// Creditos.busca(1)', 'GERACAO_CREDITO_IMOVEIS'), [])
  assert.deepEqual(regras('Creditos.busca(1)', null), [])
  assert.deepEqual(revisar('Creditos.busca(1)', { formula: false, catalogo: { ...catalogos, tipo: 'GERACAO_CREDITO_IMOVEIS' } }).filter(a => a.regra.endsWith('-tipo')), [])
})

test('formula-metodo-tipo: método que roda em produção fora do catálogo não acusa (Numeros.inteiro)', () => {
  assert.deepEqual(regras('h = Numeros.inteiro("" + q)', 'GERACAO_CREDITO_IMOVEIS'), [])
})
