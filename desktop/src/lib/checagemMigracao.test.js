import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CHECAGENS_MIGRACAO, checagemPorId, checarMigracao, cpfCnpjValido, csvCasos, csvPrefeitura, lerRegistrosMigracao, montarLotesCorrecao, montarScriptExportacao } from './checagemMigracao.js'
import { cadastroDoArquivo, lerBackup } from './espelho.js'

const end = (id, extra = {}) => ({
  id, principal: 'NAO', numero: '10', bairro: { id: 1, nome: 'CENTRO' },
  logradouro: { id: 5, nome: 'VITORIA REGIA', municipio: { id: 4320, nome: 'Rurópolis' } },
  municipio: { id: 4320, nome: 'Rurópolis' }, ...extra,
})
const contrib = (id, extra = {}) => ({ id, codigo: id, nome: `PESSOA ${id}`, cpfCnpj: '52998224725', templateId: `t${id}`, enderecos: [end(1, { principal: 'SIM' })], ...extra })

test('cpfCnpjValido: dígitos verificadores de CPF e CNPJ; sequência repetida é inválida; vazio não é avaliado', () => {
  assert.equal(cpfCnpjValido('529.982.247-25'), true)
  assert.equal(cpfCnpjValido('52998224724'), false)
  assert.equal(cpfCnpjValido('99999999999'), false) // o "999.999.999-99" de Ruropolis
  assert.equal(cpfCnpjValido('11.222.333/0001-81'), true)
  assert.equal(cpfCnpjValido('11222333000180'), false)
  assert.equal(cpfCnpjValido('123'), false)
  assert.equal(cpfCnpjValido(''), null)
  assert.equal(cpfCnpjValido(null), null)
})

test('lerRegistrosMigracao: JSONL do script, console do Studio e backup da Migração Espelho; último registro do id vale', () => {
  const texto = [
    JSON.stringify(contrib(1)),
    `02:07:10 - ${JSON.stringify(contrib(2))}`,
    JSON.stringify({ salvoEm: '2026-10-30T02:00:00Z', registro: contrib(3) }),
    JSON.stringify({ salvoEm: '2026-10-30T02:01:00Z', registro: { ...contrib(3), nome: 'NOVO' } }),
    'Não há eventos mais recentes neste momento.',
  ].join('\n')
  const { registros, descartadas } = lerRegistrosMigracao(texto)
  assert.deepEqual(registros.map(r => r.id), [1, 2, 3])
  assert.equal(registros[2].nome, 'NOVO')
  assert.equal(descartadas, 1)
})

test('contribuintes: mais de um endereço principal (e se são idênticos)', () => {
  const c = checagemPorId('contribuintes')
  const duplicado = contrib(10, { enderecos: [end(1, { principal: 'SIM' }), end(2, { principal: { valor: 'SIM', descricao: 'Sim' } })] })
  const diferentes = contrib(11, { enderecos: [end(1, { principal: 'SIM' }), end(2, { principal: 'SIM', numero: '99' })] })
  const ok = contrib(12, { enderecos: [end(1, { principal: 'SIM' }), end(2)] })
  const [principal] = checarMigracao([duplicado, diferentes, ok], c)
  assert.equal(principal.verificacao.id, 'endereco-principal-repetido')
  assert.deepEqual(principal.casos.map(x => x.id), [10, 11])
  assert.match(principal.casos[0].detalhe, /2 endereços principais, idênticos/)
  assert.match(principal.casos[1].detalhe, /2 endereços principais/)
  assert.doesNotMatch(principal.casos[1].detalhe, /idênticos/)
})

test('contribuintes: logradouro de outro município no endereço', () => {
  const c = checagemPorId('contribuintes')
  const errado = contrib(20, { enderecos: [end(1, { principal: 'SIM', logradouro: { id: 18523218, nome: 'SÃO JOÃO BATISTA', municipio: { id: 2357, nome: 'Itaituba' } } })] })
  const semMunicipioNoLogradouro = contrib(21, { enderecos: [end(1, { principal: 'SIM', logradouro: { id: 7, nome: 'X' } })] })
  const resultado = checarMigracao([errado, semMunicipioNoLogradouro, contrib(22)], c)
  const municipio = resultado.find(r => r.verificacao.id === 'logradouro-outro-municipio')
  assert.deepEqual(municipio.casos.map(x => x.id), [20])
  assert.equal(municipio.casos[0].detalhe, 'SÃO JOÃO BATISTA (Itaituba) × endereço em Rurópolis')
})

test('contribuintes: CPF/CNPJ inválido (vazio não acusa)', () => {
  const c = checagemPorId('contribuintes')
  const resultado = checarMigracao([contrib(30, { cpfCnpj: '99999999999' }), contrib(31, { cpfCnpj: '' }), contrib(32)], c)
  const cpf = resultado.find(r => r.verificacao.id === 'cpf-cnpj-invalido')
  assert.deepEqual(cpf.casos.map(x => [x.id, x.detalhe]), [[30, '99999999999']])
})

test('csvCasos: formato do backup do Estímulo (Contribuintes) + verificação e detalhe; reconhecido como Contribuintes', () => {
  const c = checagemPorId('contribuintes')
  const [principal] = checarMigracao([contrib(10, { enderecos: [end(1, { principal: 'SIM' }), end(2, { principal: 'SIM' })] })], c)
  const csv = csvCasos(principal.casos, principal.verificacao)
  assert.equal(csv.split('\r\n')[0], 'id;codigo;nome;cpfCnpj;inscricaoMunicipal;idTemplate;verificacao;detalhe')
  const { registros, colunas } = lerBackup(csv, c.cadastroEspelho)
  assert.equal(registros[0].id, '10')
  assert.equal(registros[0].idTemplate, 't10') // templateId da tela vira idTemplate
  assert.equal(cadastroDoArquivo('qualquer.csv', colunas)?.id, 'contribuintes')
})

test('script de exportação de contribuintes: junta contribuinte, endereços e o município do logradouro num JSONL', () => {
  const script = montarScriptExportacao(checagemPorId('contribuintes'))
  assert.match(script, /Dados\.tributos\.v2\.logradouros\.busca\(/)
  assert.match(script, /Dados\.tributos\.v2\.contribuintes\.enderecos\.busca\(/)
  assert.match(script, /Dados\.tributos\.v2\.contribuintes\.busca\(/)
  assert.match(script, /JSON\.escrever\(/)
  assert.match(script, /NOME_ARQUIVO = "contribuintes_migracao\.jsonl"/)
  assert.doesNotMatch(script, /imprimir \(/)
  assert.equal(CHECAGENS_MIGRACAO[0].id, 'contribuintes')
})

// ---- Alertas (não travam o salvar pela tela, mas são problema de dado) e correções sugeridas ----
const resultadoDe = (registros, id) => checarMigracao(registros, checagemPorId('contribuintes')).find(r => r.verificacao.id === id)

test('severidades: os 3 que travam o salvar são erro; os de qualidade do dado são alerta', () => {
  const sev = Object.fromEntries(checagemPorId('contribuintes').verificacoes.map(v => [v.id, v.severidade]))
  assert.deepEqual(sev, {
    'endereco-principal-repetido': 'erro', 'logradouro-outro-municipio': 'erro', 'cpf-cnpj-invalido': 'erro',
    'sem-endereco': 'alerta', 'cpf-cnpj-vazio': 'alerta', 'cpf-cnpj-repetido': 'alerta', 'endereco-repetido': 'alerta',
  })
})

test('alertas: sem endereço, documento vazio, documento repetido e endereço repetido que não é principal', () => {
  const regs = [
    contrib(40, { enderecos: [] }),
    contrib(41, { cpfCnpj: '' }),
    contrib(42, { cpfCnpj: '529.982.247-25' }), contrib(43), // 43 usa o mesmo CPF (52998224725)
    contrib(44, { enderecos: [end(1, { principal: 'SIM' }), end(2), end(3)] }), // 2 e 3 idênticos, não principais
    contrib(45, { enderecos: [end(1, { principal: 'SIM' }), end(2, { principal: 'SIM' })] }), // já é erro de principal
  ]
  assert.deepEqual(resultadoDe(regs, 'sem-endereco').casos.map(c => c.id), [40])
  assert.deepEqual(resultadoDe(regs, 'cpf-cnpj-vazio').casos.map(c => c.id), [41])
  const rep = resultadoDe(regs, 'cpf-cnpj-repetido')
  assert.ok(rep.casos.some(c => c.id === 42 && /43/.test(c.detalhe)))
  assert.deepEqual(resultadoDe(regs, 'endereco-repetido').casos.map(c => c.id), [44])
})

test('correção do principal repetido: DELETE dos endereços idênticos a mais, fica o de menor id; diferentes não entram', () => {
  const regs = [
    contrib(10, { enderecos: [end(120885240, { principal: 'SIM' }), end(120824245, { principal: 'SIM' })] }),
    contrib(11, { enderecos: [end(1, { principal: 'SIM' }), end(2, { principal: 'SIM', numero: '99' })] }),
  ]
  const r = resultadoDe(regs, 'endereco-principal-repetido')
  const { itens, semCorrecao } = r.verificacao.correcao.montar(r.casos)
  assert.deepEqual(itens.map(i => [i.alvo, i.caso]), [[120885240, 10]])
  assert.deepEqual(semCorrecao.map(c => c.id), [11])
  const lotes = montarLotesCorrecao(itens, r.verificacao.correcao)
  assert.deepEqual(lotes[0].body[0], { idIntegracao: 'CHKEND120885240', pessoasEnderecos: { idGerado: { id: 120885240 } } })
  assert.equal(r.verificacao.correcao.metodo, 'DELETE')
  assert.equal(r.verificacao.correcao.path, '/api/pessoasEnderecos')
})

test('correção do logradouro de outro município: um PATCH por logradouro, só quando todos os endereços concordam', () => {
  const sjb = { id: 18523218, nome: 'SÃO JOÃO BATISTA', municipio: { id: 2357, nome: 'Itaituba' } }
  const outro = { id: 77, nome: 'RUA X', municipio: { id: 2357, nome: 'Itaituba' } }
  const regs = [
    contrib(20, { enderecos: [end(1, { principal: 'SIM', logradouro: sjb })] }),
    contrib(21, { enderecos: [end(2, { principal: 'SIM', logradouro: sjb })] }),
    contrib(22, { enderecos: [end(3, { principal: 'SIM', logradouro: outro })] }),
    contrib(23, { enderecos: [end(4, { principal: 'SIM', logradouro: outro, municipio: { id: 9, nome: 'Outra' } })] }),
  ]
  const r = resultadoDe(regs, 'logradouro-outro-municipio')
  const { itens, semCorrecao } = r.verificacao.correcao.montar(r.casos)
  assert.deepEqual(itens.map(i => [i.alvo, i.de, i.para, i.contribuintes]), [[18523218, 'Itaituba', 'Rurópolis', 2]])
  assert.deepEqual(semCorrecao.map(c => c.id), [22, 23]) // RUA X: endereços em municípios diferentes → decidir na tela
  const [lote] = montarLotesCorrecao(itens, r.verificacao.correcao)
  assert.deepEqual(lote.body[0], { idIntegracao: 'CHKLOG18523218', logradouros: { idGerado: { id: 18523218 }, idMunicipio: 4320, nome: 'SÃO JOÃO BATISTA' } })
})

test('prefeitura: CPF inválido não tem correção pela API; a lista sai com o que corrigir', () => {
  const r = resultadoDe([contrib(30, { cpfCnpj: '99999999999' })], 'cpf-cnpj-invalido')
  assert.equal(r.verificacao.correcao.tipo, 'prefeitura')
  const csv = csvPrefeitura(r.casos, r.verificacao)
  assert.equal(csv.split('\r\n')[0], 'codigo;nome;cpfCnpj;problema;detalhe;como corrigir')
  assert.match(csv.split('\r\n')[1], /^30;PESSOA 30;99999999999;CPF\/CNPJ inválido;99999999999;/)
})
