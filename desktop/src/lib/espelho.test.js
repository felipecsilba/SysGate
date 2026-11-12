import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CADASTROS, ETAPAS, aplicarRetornoLote, cadastroPorId, corpoParaPut, desfazerPelaTela, estimularPelaTela, lerBackup, montarScriptBackup, municipiosDoBackup, prevalidarEstimulo, comNovasTentativas, corpoParaSalvar, salvarPelaTela, csvErros, resumoErros, cadastroDoArquivo } from './espelho.js'

test('cadastros: créditos, bairros, logradouros e contribuintes prontos (nessa ordem), os demais na fila', () => {
  assert.deepEqual(CADASTROS.filter(c => c.pronto).map(c => c.id), ['creditos-tributarios', 'bairros', 'logradouros', 'contribuintes'])
  assert.deepEqual(CADASTROS.slice(0, 4).map(c => c.id), ['creditos-tributarios', 'bairros', 'logradouros', 'contribuintes'])
  assert.equal(cadastroPorId('xyz'), undefined)
  // cada cadastro pronto diz onde fica na API da tela e qual campo recebe o "."
  assert.deepEqual(cadastroPorId('creditos-tributarios').tela, { path: '/api/cadastros/creditos-tributarios', campo: 'descricao' })
  assert.deepEqual(cadastroPorId('bairros').tela, { path: '/api/cadastros/enderecos/bairros', campo: 'nome' })
  assert.deepEqual(cadastroPorId('logradouros').tela, { path: '/api/cadastros/enderecos/logradouros', campo: 'nome' })
})

test('etapas: o fluxo começa no backup e termina na conferência', () => {
  assert.deepEqual(ETAPAS.map(e => e.id), ['backup', 'estimulo', 'espera', 'desfazer', 'conferencia'])
})

test('montarScriptBackup: uma coluna por campo, na ordem da fonte, enum pelo valor', () => {
  const script = montarScriptBackup(cadastroPorId('creditos-tributarios'))
  assert.match(script, /Dados\.tributos\.v2\.creditosTributarios/)
  assert.match(script, /arquivo\.escrever\("id;descricao;abreviatura;desativado;tipoCadastro;iReceita;templateId"\)/)
  assert.match(script, /item\.desativado\?\.valor/)
  assert.match(script, /item\.tipoCadastro\?\.valor/)
  assert.match(script, /item\.descricao,/)
  assert.match(script, /NOME_ARQUIVO = "creditos_tributarios\.csv"/)
  assert.match(script, /Resultado\.arquivo\(arquivo\)/)
  // Armadilha do Groovy: "imprimir (a) + b" imprime só a — a mensagem vai montada numa variável
  assert.doesNotMatch(script, /imprimir \(/)
})

test('montarScriptBackup: cadastro sem campos não gera script', () => {
  assert.equal(montarScriptBackup({ id: 'x', campos: [] }), '')
  assert.equal(montarScriptBackup(undefined), '')
})

const CSV = '\uFEFFid;descricao;abreviatura;desativado;tipoCadastro;iReceita;templateId\r\n'
  + '281857;Alvará de Construção;AlCons;NAO;RECEITAS_DIVERSAS;;2e04907a\r\n'
  + '278777;Imposto de Renda Retido na Fonte.;IRRF.;NAO;RECEITAS_DIVERSAS;;675c9c94\r\n'
  + '\r\n'

test('lerBackup: CSV do script (BOM, CRLF, ;) vira um registro por linha, com o cabeçalho como chave', () => {
  const { registros, faltando } = lerBackup(CSV, cadastroPorId('creditos-tributarios'))
  assert.equal(registros.length, 2)
  assert.deepEqual(faltando, [])
  assert.equal(registros[0].id, '281857')
  assert.equal(registros[0].descricao, 'Alvará de Construção')
  assert.equal(registros[1].tipoCadastro, 'RECEITAS_DIVERSAS')
})

test('lerBackup: arquivo sem as colunas do cadastro avisa o que falta', () => {
  const { registros, faltando } = lerBackup('codigo;nome\n1;x', cadastroPorId('creditos-tributarios'))
  assert.equal(registros.length, 1)
  assert.deepEqual(faltando, ['id', 'descricao'])
})

test('prevalidarEstimulo: descrição nova = atual + ".", ponto já existente só avisa, sem id ou sem descrição fica fora', () => {
  const extra = '0;Sem id;X;NAO;IMOVEIS;;t\n999; ;X;NAO;IMOVEIS;;t\n281857;Repetido;X;NAO;IMOVEIS;;t\n'
  const { registros } = lerBackup(CSV + extra, cadastroPorId('creditos-tributarios'))
  const { itens, foraDoEnvio } = prevalidarEstimulo(registros)
  assert.deepEqual(itens.map(i => [i.id, i.atual, i.nova, i.jaTemPonto]), [
    [281857, 'Alvará de Construção', 'Alvará de Construção.', false],
    [278777, 'Imposto de Renda Retido na Fonte.', 'Imposto de Renda Retido na Fonte..', true],
  ])
  assert.deepEqual(foraDoEnvio.map(f => f.motivo), ['sem id', 'sem descrição', 'id repetido'])
})

test('aplicarRetornoLote: erro do lote marca todos; erro por item volta pelo idIntegracao do corpo', () => {
  const lote = { ids: [1, 2, 3], body: [{ idIntegracao: 'X1' }, { idIntegracao: 'X2' }, { idIntegracao: 'X3' }] }
  assert.deepEqual(aplicarRetornoLote({}, { status: 'erro', mensagem: 'HTTP 400' }, lote)[2], { ok: false, mensagem: 'HTTP 400' })
  const r = aplicarRetornoLote({}, { status: 'parcial', erros: [{ idIntegracao: 'X2', mensagem: 'em uso' }] }, lote)
  assert.deepEqual(r, { 1: { ok: true }, 2: { ok: false, mensagem: 'em uso' }, 3: { ok: true } })
})

// ---- Estímulo pela API da tela -------------------------------------------------------------
const OBJ = { id: 307397, descricao: 'Habite-se', indexador: { id: 63098, nome: 'Real', version: 2 }, template: { id: 't-1', version: 0 }, version: 78 }

test('corpoParaPut: o objeto do GET com a descrição trocada, sem indexador.version (como a tela manda)', () => {
  const corpo = corpoParaPut(OBJ, 'Habite-se.')
  assert.equal(corpo.descricao, 'Habite-se.')
  assert.equal(corpo.version, 78)
  assert.deepEqual(corpo.template, { id: 't-1', version: 0 })
  assert.deepEqual(corpo.indexador, { id: 63098, nome: 'Real' })
  assert.equal(OBJ.descricao, 'Habite-se') // não altera o original
  assert.equal(OBJ.indexador.version, 2)
})

// Betha falsa: guarda o registro, sobe o version a cada PUT e registra a ordem das chamadas
function bethaFalsa(inicial, { falharPut = null, status401 = false, campo = 'descricao' } = {}) {
  let reg = structuredClone(inicial)
  const log = []
  let puts = 0
  const chamar = async (metodo, path, corpo) => {
    log.push(`${metodo} ${path}${corpo ? ` ${corpo[campo]}` : ''}`)
    if (status401) return { status: 401, data: { message: 'Sem permissão' } }
    if (metodo === 'GET') return { status: 200, data: structuredClone(reg) }
    puts++
    if (falharPut === puts) return { status: 400, data: { message: 'Falhou' } }
    reg = { ...corpo, version: reg.version + 4 }
    return { status: 200, data: structuredClone(reg) }
  }
  return { chamar, log, registro: () => reg }
}
const semEspera = async () => {}

test('estimularPelaTela: GET → PUT com "." → espera → GET → PUT de volta; termina como estava', async () => {
  const b = bethaFalsa(OBJ)
  const esperas = []
  const r = await estimularPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, { chamar: b.chamar, esperar: async ms => esperas.push(ms), esperaMs: 5000 })
  assert.deepEqual(r, { ok: true })
  assert.deepEqual(b.log, [
    'GET /api/cadastros/creditos-tributarios/307397',
    'PUT /api/cadastros/creditos-tributarios/307397 Habite-se.',
    'GET /api/cadastros/creditos-tributarios/307397',
    'PUT /api/cadastros/creditos-tributarios/307397 Habite-se',
  ])
  assert.deepEqual(esperas, [5000])
  assert.equal(b.registro().descricao, 'Habite-se')
})

test('estimularPelaTela: descrição diferente do backup não é tocada', async () => {
  const b = bethaFalsa({ ...OBJ, descricao: 'Habite-se (alterado)' })
  const r = await estimularPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, { chamar: b.chamar, esperar: semEspera })
  assert.equal(r.ok, false)
  assert.equal(r.etapa, 'conferir')
  assert.match(r.mensagem, /mudou desde o backup/)
  assert.equal(b.log.length, 1)
})

test('estimularPelaTela: registro que ficou com "." de uma rodada interrompida só recebe a volta', async () => {
  const b = bethaFalsa({ ...OBJ, descricao: 'Habite-se.' })
  const r = await estimularPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, { chamar: b.chamar, esperar: semEspera })
  assert.deepEqual(r, { ok: true, soVolta: true })
  assert.equal(b.registro().descricao, 'Habite-se')
})

test('estimularPelaTela: falha na volta avisa que o registro ficou marcado', async () => {
  const b = bethaFalsa(OBJ, { falharPut: 2 })
  const r = await estimularPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, { chamar: b.chamar, esperar: semEspera })
  assert.equal(r.ok, false)
  assert.equal(r.etapa, 'volta')
  assert.equal(r.marcado, true)
  assert.equal(b.registro().descricao, 'Habite-se.')
})

test('estimularPelaTela: 401 é sessão expirada (lança, para a fila pausar)', async () => {
  const b = bethaFalsa(OBJ, { status401: true })
  await assert.rejects(estimularPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, { chamar: b.chamar, esperar: semEspera }), e => e.sessaoExpirada === true)
})

test('estimularPelaTela: espaço sobrando e acento decomposto na Betha não barram, e a volta grava exatamente o que estava lá', async () => {
  const naBetha = 'Alvara\u0301  de Construção ' // á decomposto, espaço duplo e no fim
  const b = bethaFalsa({ ...OBJ, descricao: naBetha })
  const r = await estimularPelaTela({ id: 307397, atual: 'Alvará de Construção', nova: 'Alvará de Construção.' }, { chamar: b.chamar, esperar: semEspera })
  assert.deepEqual(r, { ok: true })
  assert.equal(b.log[1], `PUT /api/cadastros/creditos-tributarios/307397 ${naBetha}.`)
  assert.equal(b.registro().descricao, naBetha)
})

test('estimularPelaTela: mensagem de conferência mostra os dois textos entre aspas', async () => {
  const b = bethaFalsa({ ...OBJ, descricao: 'Outra coisa' })
  const r = await estimularPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, { chamar: b.chamar, esperar: semEspera })
  assert.match(r.mensagem, /na Betha "Outra coisa", no backup "Habite-se"/)
})

test('estimularPelaTela: 422 mostra a explicação do detail (receita com descrição repetida)', async () => {
  const chamar = async metodo => (metodo === 'GET'
    ? { status: 200, data: structuredClone(OBJ) }
    : { status: 422, data: { message: 'Erro no processamento da requisição', detail: { message: 'Já existe uma receita com a descrição informada.' } } })
  const r = await estimularPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, { chamar, esperar: semEspera })
  assert.deepEqual(r, { ok: false, etapa: 'marcar', mensagem: 'Já existe uma receita com a descrição informada.' })
})

// ---- Desfazer pela API da tela: tira o "." e espelha (o PATCH da Service Layer não espelhava) ----
test('desfazerPelaTela: com "." → GET e PUT sem o ponto, preservando o texto da Betha', async () => {
  const b = bethaFalsa({ ...OBJ, descricao: 'Habite-se.' })
  const r = await desfazerPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, { chamar: b.chamar })
  assert.deepEqual(r, { ok: true })
  assert.deepEqual(b.log, ['GET /api/cadastros/creditos-tributarios/307397', 'PUT /api/cadastros/creditos-tributarios/307397 Habite-se'])
})

test('desfazerPelaTela: já sem ponto não grava nada', async () => {
  const b = bethaFalsa(OBJ)
  const r = await desfazerPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, { chamar: b.chamar })
  assert.deepEqual(r, { ok: true, jaEstava: true })
  assert.equal(b.log.length, 1)
})

test('desfazerPelaTela: descrição diferente do backup não é tocada; 401 lança sessão expirada', async () => {
  const b = bethaFalsa({ ...OBJ, descricao: 'Outra' })
  const r = await desfazerPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, { chamar: b.chamar })
  assert.equal(r.etapa, 'conferir')
  assert.equal(b.log.length, 1)
  const expirada = bethaFalsa(OBJ, { status401: true })
  await assert.rejects(desfazerPelaTela({ id: 1, atual: 'a', nova: 'a.' }, { chamar: expirada.chamar }), e => e.sessaoExpirada)
})

// ---- Bairros e logradouros: o "." vai no nome, pela API da tela de endereços ----
test('script de backup de logradouros do tributos: idTemplate e município (nome e id) para filtrar', () => {
  const script = montarScriptBackup(cadastroPorId('logradouros'))
  assert.match(script, /fonte = Dados\.tributos\.v2\.logradouros/)
  assert.match(script, /percorrer \(fonte\.busca\(\)\)/)
  assert.match(script, /arquivo\.escrever\("id;nome;codigo;tipoLogradouroDescricao;cep;idTemplate;idMunicipio;municipio"\)/)
  assert.match(script, /item\.municipio\?\.nome/)
})

test('prevalidarEstimulo com campo nome e estímulo do bairro no path de endereços', async () => {
  const regs = [{ id: '6862519', nome: 'Bairro Centro' }]
  const { itens } = prevalidarEstimulo(regs, 'nome')
  assert.deepEqual(itens, [{ id: 6862519, atual: 'Bairro Centro', nova: 'Bairro Centro.', jaTemPonto: false }])
  const b = bethaFalsa({ id: 6862519, nome: 'Bairro Centro', template: { id: 'b5b7', version: 0 }, version: 2 }, { campo: 'nome' })
  const r = await estimularPelaTela(itens[0], { chamar: b.chamar, esperar: semEspera, tela: cadastroPorId('bairros').tela })
  assert.deepEqual(r, { ok: true })
  assert.deepEqual(b.log, [
    'GET /api/cadastros/enderecos/bairros/6862519',
    'PUT /api/cadastros/enderecos/bairros/6862519 Bairro Centro.',
    'GET /api/cadastros/enderecos/bairros/6862519',
    'PUT /api/cadastros/enderecos/bairros/6862519 Bairro Centro',
  ])
  assert.deepEqual(corpoParaPut({ nome: 'X', version: 1 }, 'X.', 'nome'), { nome: 'X.', version: 1 })
})

test('desfazerPelaTela no logradouro tira o "." do nome', async () => {
  const b = bethaFalsa({ id: 20981482, nome: 'Rua Zacarias.', version: 2 }, { campo: 'nome' })
  const r = await desfazerPelaTela({ id: 20981482, atual: 'Rua Zacarias', nova: 'Rua Zacarias.' }, { chamar: b.chamar, tela: cadastroPorId('logradouros').tela })
  assert.deepEqual(r, { ok: true })
  assert.equal(b.registro().nome, 'Rua Zacarias')
})

test('municipiosDoBackup: municípios do arquivo com a contagem, o maior primeiro', () => {
  const regs = [{ municipio: 'Rurópolis' }, { municipio: 'Goiânia' }, { municipio: 'Rurópolis' }, { municipio: '' }]
  assert.deepEqual(municipiosDoBackup(regs), [{ municipio: 'Rurópolis', total: 2 }, { municipio: 'Goiânia', total: 1 }, { municipio: '', total: 1 }])
  assert.deepEqual(municipiosDoBackup([{ id: '1' }]), [])
})

test('comNovasTentativas: 500/502/503/429 tenta de novo (até 3 vezes, esperando); 4xx e 2xx voltam na hora', async () => {
  const esperas = []
  const esperar = async ms => esperas.push(ms)
  let n = 0
  const instavel = comNovasTentativas(async () => ({ status: ++n < 3 ? 500 : 200, data: {} }), { esperar })
  assert.equal((await instavel('GET', '/x')).status, 200)
  assert.deepEqual(esperas, [2000, 5000])

  let m = 0
  const sempre500 = comNovasTentativas(async () => { m++; return { status: 500, data: null } }, { esperar: async () => {} })
  assert.equal((await sempre500('PUT', '/x', {})).status, 500)
  assert.equal(m, 4) // a 1ª + 3 novas tentativas

  let k = 0
  const recusa = comNovasTentativas(async () => { k++; return { status: 422, data: {} } }, { esperar: async () => {} })
  assert.equal((await recusa('PUT', '/x', {})).status, 422)
  assert.equal(k, 1)
})

// ---- Backup completo automático: o objeto do GET (o registro inteiro, como a Betha guarda) antes do 1º PUT ----
test('estimularPelaTela: guarda o objeto lido antes de gravar; sem backup não mexe', async () => {
  const guardados = []
  const b = bethaFalsa(OBJ)
  const guardar = async obj => { guardados.push({ obj, puts: b.log.filter(l => l.startsWith('PUT')).length }) }
  await estimularPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, { chamar: b.chamar, esperar: semEspera, guardar })
  assert.equal(guardados.length, 1)
  assert.equal(guardados[0].puts, 0) // guardou antes do primeiro PUT
  assert.equal(guardados[0].obj.descricao, 'Habite-se')

  const b2 = bethaFalsa(OBJ)
  const r = await estimularPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, {
    chamar: b2.chamar, esperar: semEspera, guardar: async () => { throw new Error('disco cheio') },
  })
  assert.deepEqual(r, { ok: false, etapa: 'backup', mensagem: 'Backup não gravado (disco cheio) — não mexi' })
  assert.equal(b2.log.filter(l => l.startsWith('PUT')).length, 0)
})

test('desfazerPelaTela: também guarda o objeto antes de gravar', async () => {
  const guardados = []
  const b = bethaFalsa({ ...OBJ, descricao: 'Habite-se.' })
  await desfazerPelaTela({ id: 307397, atual: 'Habite-se', nova: 'Habite-se.' }, { chamar: b.chamar, guardar: async o => guardados.push(o) })
  assert.equal(guardados[0].descricao, 'Habite-se.')
})

// ---- Contribuintes: salvar sem mudar já dispara o cadastro único (captura de 2026-10-30, contribuinte 109271640) ----
test('contribuintes: pronto, na tela de referentes, modo salvar (sem ".")', () => {
  const c = cadastroPorId('contribuintes')
  assert.ok(c.pronto)
  assert.deepEqual(c.tela, { path: '/api/cadastros/referentes/contribuintes', campo: 'nome', modo: 'salvar' })
  assert.match(montarScriptBackup(c), /fonte = Dados\.tributos\.v2\.contribuintes/)
})

test('corpoParaSalvar: o objeto do GET com anoCorrente e enderecoPrincipal: null, como a tela manda', () => {
  const obj = { id: 1, nome: 'X', enderecos: [{ id: 9 }], version: 6 }
  assert.deepEqual(corpoParaSalvar(obj, 2026), { id: 1, nome: 'X', enderecos: [{ id: 9 }], version: 6, anoCorrente: 2026, enderecoPrincipal: null })
  assert.deepEqual(corpoParaSalvar({ ...obj, enderecoPrincipal: { id: 9 } }, 2026).enderecoPrincipal, { id: 9 })
  assert.equal(obj.anoCorrente, undefined) // não altera o original
})

test('salvarPelaTela: GET → backup → um PUT do mesmo objeto; 401 lança; erro do PUT volta com a mensagem', async () => {
  const log = []
  const guardados = []
  const chamar = async (metodo, path, corpo) => {
    log.push(`${metodo} ${path}${corpo ? ` ano=${corpo.anoCorrente}` : ''}`)
    return metodo === 'GET' ? { status: 200, data: { id: 109271640, nome: 'JARDEL', version: 6 } } : { status: 200, data: {} }
  }
  const tela = cadastroPorId('contribuintes').tela
  const r = await salvarPelaTela({ id: 109271640 }, { chamar, tela, guardar: async o => guardados.push(o), ano: 2026 })
  assert.deepEqual(r, { ok: true })
  assert.deepEqual(log, ['GET /api/cadastros/referentes/contribuintes/109271640', 'PUT /api/cadastros/referentes/contribuintes/109271640 ano=2026'])
  assert.equal(guardados[0].nome, 'JARDEL')

  const recusa = async m => (m === 'GET' ? { status: 200, data: { id: 1 } } : { status: 422, data: { detail: { message: 'CPF inválido' } } })
  assert.deepEqual(await salvarPelaTela({ id: 1 }, { chamar: recusa, tela, ano: 2026 }), { ok: false, etapa: 'salvar', mensagem: 'CPF inválido' })
  await assert.rejects(salvarPelaTela({ id: 1 }, { chamar: async () => ({ status: 401 }), tela, ano: 2026 }), e => e.sessaoExpirada)
})

// ---- Erros do estímulo: CSV para reestimular só eles (e levar à Checagem) ----
test('csvErros: mesmas colunas e linhas do arquivo do script, só os com erro, + etapa e erro no fim; recarrega no Estímulo', () => {
  const csvScript = 'id;codigo;nome;cpfCnpj;inscricaoMunicipal;idTemplate\r\n'
    + '1;10;ANA SILVA;111;;t1\r\n2;20;BETO;222;;t2\r\n3;30;CARLA;333;;t3\r\n'
  const { registros, colunas } = lerBackup(csvScript, cadastroPorId('contribuintes'))
  const porId = {
    1: { estado: 'erro', etapa: 'salvar', mensagem: 'CPF inválido;\nverifique' },
    2: { estado: 'ok' },
    3: { estado: 'erro', etapa: 'ler', mensagem: 'HTTP 500' },
  }
  const csv = csvErros(registros, colunas, porId)
  assert.equal(csv, 'id;codigo;nome;cpfCnpj;inscricaoMunicipal;idTemplate;etapa;erro\r\n'
    + '1;10;ANA SILVA;111;;t1;salvar;CPF inválido, verifique\r\n'
    + '3;30;CARLA;333;;t3;ler;HTTP 500\r\n')
  // carregado de novo no Estímulo: os mesmos campos, só os que falharam
  const relido = lerBackup(csv, cadastroPorId('contribuintes'))
  assert.deepEqual(prevalidarEstimulo(relido.registros, 'nome').itens.map(i => [i.id, i.atual]), [[1, 'ANA SILVA'], [3, 'CARLA']])
  // reexportado: etapa e erro não se repetem
  const deNovo = csvErros(relido.registros, relido.colunas, { 1: { estado: 'erro', etapa: 'salvar', mensagem: 'x' } })
  assert.equal(deNovo.split('\r\n')[0], 'id;codigo;nome;cpfCnpj;inscricaoMunicipal;idTemplate;etapa;erro')
})

test('resumoErros: quantos por mensagem, a mais comum primeiro', () => {
  const porId = {
    1: { estado: 'erro', mensagem: 'CPF inválido' }, 2: { estado: 'erro', mensagem: 'HTTP 500' },
    3: { estado: 'erro', mensagem: 'CPF inválido' }, 4: { estado: 'ok' },
  }
  assert.deepEqual(resumoErros(porId), [{ mensagem: 'CPF inválido', total: 2 }, { mensagem: 'HTTP 500', total: 1 }])
})

test('cadastroDoArquivo: reconhece de qual cadastro é o arquivo (pelo nome ou pelas colunas)', () => {
  assert.equal(cadastroDoArquivo('contribuintes_tributos.csv', [])?.id, 'contribuintes')
  assert.equal(cadastroDoArquivo('contribuintes_tributos_erros_2026-10-30.csv', [])?.id, 'contribuintes')
  assert.equal(cadastroDoArquivo('qualquer.csv', ['id', 'codigo', 'nome', 'cpfCnpj', 'inscricaoMunicipal', 'idTemplate'])?.id, 'contribuintes')
  assert.equal(cadastroDoArquivo('x.csv', ['id', 'descricao', 'abreviatura', 'desativado', 'tipoCadastro', 'iReceita', 'templateId'])?.id, 'creditos-tributarios')
  assert.equal(cadastroDoArquivo('x.csv', ['a', 'b']), undefined)
  // as colunas de bairro estão todas no arquivo de logradouro: vale o mais específico
  assert.equal(cadastroDoArquivo('renomeado.csv', ['id', 'nome', 'codigo', 'tipoLogradouroDescricao', 'cep', 'idTemplate', 'idMunicipio', 'municipio'])?.id, 'logradouros')
  assert.equal(cadastroDoArquivo('renomeado.csv', ['id', 'nome', 'codigo', 'idTemplate', 'idMunicipio', 'municipio'])?.id, 'bairros')
})
