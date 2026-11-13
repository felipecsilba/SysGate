import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fontesUsadas, semComentarios } from './codigo.mjs'

test('acha a fonte chamada no código, sem o método', () => {
  const t = 'return Dados.tributos.v2.debitos.busca(criterio: criterio, ordenacao: "id asc")'
  assert.deepEqual(fontesUsadas(t), [{ sistema: 'tributos', cadeia: 'debitos' }])
})

test('mantém a cadeia composta (fonte filha)', () => {
  const t = `fonteIndexadores = Dados.tributos.v2.indexadores.movimentacoes
x = Dados.tributos.v2.imoveis.camposAdicionais.busca(criterio: c)
Dados.tributos.v2.tabelaAuxiliar.registros.cria(r)`
  assert.deepEqual(fontesUsadas(t).map(f => f.cadeia), ['imoveis.camposAdicionais', 'indexadores.movimentacoes', 'tabelaAuxiliar.registros'])
})

test('ignora o que está em comentário (inclusive a menção "não é X")', () => {
  const t = `// ATENÇÃO: não é Dados.tributos.v2.indexadores (só o cadastro)
/* exemplo antigo: Dados.tributos.v2.economicos.busca() */
y = Dados.tributos.v2.receitas.busca()`
  assert.deepEqual(fontesUsadas(t).map(f => f.cadeia), ['receitas'])
})

test('não confunde // dentro de string com comentário', () => {
  const t = 'url = "https://x.betha.cloud/a"; z = Dados.tributos.v2.contribuintes.busca()'
  assert.deepEqual(fontesUsadas(t).map(f => f.cadeia), ['contribuintes'])
})

test('procuradoria e dinâmico ficam com o sistema certo; sem repetição', () => {
  const t = `a = Dados.procuradoria.v2.dividas.buscar(criterio: c)
b = Dados.procuradoria.v2.dividas.buscar(criterio: d)
c = Dados.dinamico.v2.algo`
  assert.deepEqual(fontesUsadas(t), [
    { sistema: 'dinamico', cadeia: 'algo' },
    { sistema: 'procuradoria', cadeia: 'dividas' },
  ])
})

test('semComentarios preserva as quebras de linha', () => {
  assert.equal(semComentarios('a // b\nc /* d\ne */ f').split('\n').length, 3)
})

test('semComentarios: aspas dentro de ${...} não fecham a string (GString do Groovy)', () => {
  // caso real (fonte de Atibaia): a aspa de join(",") desalinhava tudo e o comentário seguinte virava código
  const t = 'c += " and id in (${p.join(",").replace("\'","")})"\n// Buscando as CNAEs\nx = 1'
  const r = semComentarios(t)
  assert.ok(!r.includes('Buscando'), r)
  assert.ok(r.includes('join(",")') && r.includes('x = 1'))
})

test('semComentarios: string simples sem fechar termina na quebra de linha', () => {
  const r = semComentarios('a = "sem fechar\n// comentario\nb = 2')
  assert.ok(!r.includes('comentario') && r.includes('b = 2'), r)
})

test('semComentarios: // dentro de string continua sendo texto', () => {
  assert.equal(semComentarios('u = "http://x" // fim'), 'u = "http://x" ')
})
