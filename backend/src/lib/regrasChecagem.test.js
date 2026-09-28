const { test } = require('node:test')
const assert = require('node:assert/strict')

const { avaliarRegras, vazio, desembrulhar, pegar } = require('./regrasChecagem')

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures vindas de dados REAIS, capturados em 28/09/2026.
//
// Três cenários calibraram estas regras, e dois falsos positivos morreram no
// processo. O gabarito é a base de teste Sistemática, onde tudo foi criado pela
// tela do Betha — por definição está certo, então regra que acusa erro nele é
// regra errada.
// ─────────────────────────────────────────────────────────────────────────────

// Enum da fonte BFC vem como objeto { descricao, valor }, não como string.
const enumRD = { descricao: 'Receitas diversas', valor: 'RECEITAS_DIVERSAS' }
const enumImoveis = { descricao: 'Imóveis', valor: 'IMOVEIS' }

function dividaFonte({ id, tipoCad = enumRD, idReceitaDiversa = null, idEconomico = null, idImovel = null, refCodigo = null }) {
  return {
    id,
    contribuinte: { id: 99320052, nome: 'FULANO' },
    creditoTributario: { id: 285568, abreviatura: 'LIDFE', tipoCadastro: tipoCad },
    tipoReferente: tipoCad,
    referente: { codigo: refCodigo, tipo: tipoCad },
    idReceitaDiversa,
    idReceitaDiversaLancamento: null,
    idEconomico,
    idImovel,
    dataInscricao: '2025-06-30',
    valorTributoInscrito: 751.0,
    numeroLivro: 18,
    situacaoDivida: { descricao: 'Em Aberto', valor: 'ABERTO' },
  }
}

// A regra que nasceu do caso do Elias: 1445 dívidas do Viseu nesta condição.
const REGRA_RECEITA_VINCULADA = {
  id: 1,
  nome: 'Receita vinculada quando o crédito é Receita Diversa',
  onde: ['idReceitaDiversa', 'idReceitaDiversaLancamento', 'referente.codigo'],
  quando: { caminhos: ['tipoReferente', 'creditoTributario.tipoCadastro'], igualA: ['RECEITAS_DIVERSAS'] },
  severidade: 'erro',
}

const REGRA_CONTRIBUINTE = {
  id: 2,
  nome: 'Contribuinte informado',
  onde: ['contribuinte.id', 'idPessoa'],
  severidade: 'erro',
}

// ─── helpers ────────────────────────────────────────────────────────────────

test('vazio: null, undefined, string vazia', () => {
  assert.equal(vazio(null), true)
  assert.equal(vazio(undefined), true)
  assert.equal(vazio(''), true)
})

test('vazio: ZERO conta como ausência', () => {
  // Bases convertidas usam 0 no lugar de nulo. Testar só "!= null" produziu
  // falso positivo em 1445 registros do Viseu.
  assert.equal(vazio(0), true)
  assert.equal(vazio('0'), true)
})

test('vazio: valor preenchido não é vazio', () => {
  assert.equal(vazio(177230207), false)
  assert.equal(vazio('ABERTO'), false)
})

test('desembrulhar: enum { descricao, valor } vira o valor', () => {
  assert.equal(desembrulhar(enumRD), 'RECEITAS_DIVERSAS')
  assert.equal(desembrulhar('RECEITAS_DIVERSAS'), 'RECEITAS_DIVERSAS')
  assert.equal(desembrulhar(null), null)
})

test('pegar: caminho pontilhado, tolerante a nulo no meio', () => {
  assert.equal(pegar({ a: { b: 7 } }, 'a.b'), 7)
  assert.equal(pegar({ a: null }, 'a.b'), undefined)
  assert.equal(pegar({}, 'x.y.z'), undefined)
})

// ─── avaliação ──────────────────────────────────────────────────────────────

test('registro com o dado preenchido não é acusado', () => {
  const registros = [dividaFonte({ id: 1, idReceitaDiversa: 177230207 })]
  const [res] = avaliarRegras({ registros, regras: [REGRA_RECEITA_VINCULADA] })
  assert.equal(res.faltando.length, 0)
  assert.equal(res.severidade, 'ok')
  assert.equal(res.aplicaveis, 1)
})

test('registro com o dado em ZERO é acusado', () => {
  const registros = [dividaFonte({ id: 1, idReceitaDiversa: 0 })]
  const [res] = avaliarRegras({ registros, regras: [REGRA_RECEITA_VINCULADA] })
  assert.equal(res.faltando.length, 1)
  assert.equal(res.severidade, 'erro')
})

test('a condição "quando" lê enum em objeto', () => {
  // tipoReferente é { descricao, valor } — comparar com String() daria
  // "[object Object]" e a regra nunca rodaria.
  const registros = [dividaFonte({ id: 1, tipoCad: enumRD, idReceitaDiversa: null })]
  const [res] = avaliarRegras({ registros, regras: [REGRA_RECEITA_VINCULADA] })
  assert.equal(res.aplicaveis, 1, 'a regra deveria se aplicar a RECEITAS_DIVERSAS')
  assert.equal(res.faltando.length, 1)
})

test('a condição "quando" exclui registros de outro tipo', () => {
  const registros = [dividaFonte({ id: 1, tipoCad: enumImoveis, idImovel: 36087356 })]
  const [res] = avaliarRegras({ registros, regras: [REGRA_RECEITA_VINCULADA] })
  assert.equal(res.aplicaveis, 0, 'dívida de IMOVEIS não entra nesta regra')
  assert.equal(res.faltando.length, 0)
})

test('qualquer um dos caminhos em "onde" satisfaz a regra', () => {
  const registros = [dividaFonte({ id: 1, idReceitaDiversa: null, refCodigo: '177230207' })]
  const [res] = avaliarRegras({ registros, regras: [REGRA_RECEITA_VINCULADA] })
  assert.equal(res.faltando.length, 0)
})

test('o achado carrega o id e o registro inteiro', () => {
  const registros = [dividaFonte({ id: 285503526, idReceitaDiversa: null })]
  const [res] = avaliarRegras({ registros, regras: [REGRA_RECEITA_VINCULADA] })
  assert.equal(res.faltando[0].id, '285503526')
  assert.equal(res.faltando[0].registro.creditoTributario.abreviatura, 'LIDFE')
})

test('registro sem id ganha posição como identificação', () => {
  const [res] = avaliarRegras({ registros: [{ contribuinte: null }], regras: [REGRA_CONTRIBUINTE] })
  assert.equal(res.faltando[0].id, '#1')
})

// ─── os três cenários reais ─────────────────────────────────────────────────

test('GABARITO: 5 dívidas criadas pela tela não produzem achado nenhum', () => {
  // Base Sistemática. Tudo feito pela tela, do crédito à inscrição.
  const registros = [
    dividaFonte({ id: 289752960, idReceitaDiversa: 184391299 }),
    dividaFonte({ id: 289752961, idReceitaDiversa: 184391194, idImovel: 36087356 }),
    dividaFonte({ id: 289752962, idReceitaDiversa: 184392035, idEconomico: 24114213 }),
    dividaFonte({ id: 289752963, tipoCad: enumImoveis, idImovel: 36087356 }),
    dividaFonte({ id: 289752979, tipoCad: enumImoveis, idEconomico: 24114213 }),
  ]
  const res = avaliarRegras({ registros, regras: [REGRA_RECEITA_VINCULADA, REGRA_CONTRIBUINTE] })
  const comProblema = res.filter((r) => r.faltando.length > 0)
  assert.deepEqual(comProblema, [], 'nenhuma regra pode acusar o gabarito')
})

test('FRANCISCO (Viseu, parcelamento funciona): nenhum achado', () => {
  const registros = [177176997, 177176999, 177199061, 177204316, 177220059].map((rd, i) =>
    dividaFonte({ id: 274826321 + i, idReceitaDiversa: rd, idEconomico: 20946859 })
  )
  const res = avaliarRegras({ registros, regras: [REGRA_RECEITA_VINCULADA, REGRA_CONTRIBUINTE] })
  assert.equal(res.filter((r) => r.faltando.length > 0).length, 0)
})

test('ELIAS (Viseu): acusa exatamente a 285503526, que quebra o parcelamento', () => {
  const registros = [
    dividaFonte({ id: 274980951, idReceitaDiversa: 177190419, idEconomico: 20948022 }),
    dividaFonte({ id: 274982258, idReceitaDiversa: 177206081, idEconomico: 20948022 }),
    dividaFonte({ id: 274983462, idReceitaDiversa: 177207218, idEconomico: 20948022 }),
    dividaFonte({ id: 274985429, idReceitaDiversa: 177215367, idEconomico: 20948022 }),
    dividaFonte({ id: 274987306, idReceitaDiversa: 177221250, idEconomico: 20948022 }),
    dividaFonte({ id: 274989159, idReceitaDiversa: 177230207, idEconomico: 20948022 }),
    // esta é a que o servidor recusa com [E001]
    dividaFonte({ id: 285503526, idReceitaDiversa: null, refCodigo: null, idEconomico: 20948022 }),
  ]
  const [res] = avaliarRegras({ registros, regras: [REGRA_RECEITA_VINCULADA] })
  assert.equal(res.aplicaveis, 7)
  assert.equal(res.faltando.length, 1)
  assert.equal(res.faltando[0].id, '285503526')
})

test('regra sem "quando" se aplica a todos os registros', () => {
  const registros = [dividaFonte({ id: 1 }), { contribuinte: null }]
  const [res] = avaliarRegras({ registros, regras: [REGRA_CONTRIBUINTE] })
  assert.equal(res.aplicaveis, 2)
  assert.equal(res.faltando.length, 1)
})

test('lista vazia de registros não quebra', () => {
  const res = avaliarRegras({ registros: [], regras: [REGRA_RECEITA_VINCULADA] })
  assert.equal(res[0].aplicaveis, 0)
  assert.equal(res[0].severidade, 'ok')
})
