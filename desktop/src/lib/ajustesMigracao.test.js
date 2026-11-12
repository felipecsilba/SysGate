import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AJUSTES, ajustePorId, alvosCorrecao, duplicadas, lerRegistros, lotesExcluir, lotesPatchReceitas, separarPorFiltro } from './ajustesMigracao.js'
import { montarScriptBackup } from './espelho.js'

test('ajustes: receitas é o primeiro atalho, com fonte, arquivo e campos', () => {
  const a = ajustePorId('receitas-duplicadas')
  assert.equal(AJUSTES[0], a)
  assert.equal(a.cadastro.fonte, 'Dados.tributos.v2.receitas')
  assert.equal(ajustePorId('xyz'), undefined)
})

test('script de receitas: uma coluna por campo, classificação e enums pelo valor', () => {
  const script = montarScriptBackup(ajustePorId('receitas-duplicadas').cadastro)
  assert.match(script, /Dados\.tributos\.v2\.receitas/)
  assert.match(script, /arquivo\.escrever\("id;descricao;abreviatura;classificacao;inscDividaAtiva;codigoTCE;cobrancaCompartilhada;naoContabilizavel;templateId"\)/)
  assert.match(script, /item\.classificacao\?\.valor/)
  assert.match(script, /item\.inscDividaAtiva\?\.valor/)
  assert.match(script, /NOME_ARQUIVO = "receitas\.csv"/)
})

const CSV = 'id;descricao;abreviatura;classificacao;inscDividaAtiva;codigoTCE;cobrancaCompartilhada;naoContabilizavel;templateId\n'
  + '1;Taxa de Licença;TXLIC;TAXA;SIM;;;;t1\n'
  + '2;TAXA DE LICENÇA ;TXL;TAXA;SIM;;;;t2\n' // mesma descrição (caixa e espaço) e mesmo tipo
  + '3;Taxa de Licença;TXLIC;MULTA_INFRACAO;SIM;;;;t3\n' // mesma descrição, tipo diferente: só conta sem mesmoTipo
  + '4;Outra;TXL;TAXA;SIM;;;;t4\n' // abreviatura TXL repetida no mesmo tipo
  + '5;Sem abreviatura;;TAXA;SIM;;;;t5\n'
  + '6;Também sem;;TAXA;SIM;;;;t6\n' // abreviatura vazia não é duplicidade

test('duplicadas mesmoTipo: descrição e abreviatura repetidas dentro da mesma classificação, ignorando caixa e espaços', () => {
  const { registros } = lerRegistros(CSV, ajustePorId('receitas-duplicadas').cadastro)
  const grupos = duplicadas(registros, { mesmoTipo: true })
  assert.deepEqual(grupos.map(g => [g.campo, g.tipo, g.valor, g.registros.map(r => r.id)]), [
    ['descricao', 'TAXA', 'Taxa de Licença', ['1', '2']],
    ['abreviatura', 'TAXA', 'TXL', ['2', '4']],
  ])
})

test('duplicadas padrão: a Betha compara a descrição sem olhar o tipo (422 em Ruropolis com TAXA × IMPOSTO)', () => {
  const { registros } = lerRegistros(CSV, ajustePorId('receitas-duplicadas').cadastro)
  const grupos = duplicadas(registros)
  assert.deepEqual(grupos.map(g => [g.campo, g.tipo, g.registros.map(r => r.id)]), [
    ['descricao', 'MULTA_INFRACAO, TAXA', ['1', '2', '3']],
    ['abreviatura', 'MULTA_INFRACAO, TAXA', ['1', '3']],
    ['abreviatura', 'TAXA', ['2', '4']],
  ])
})

test('duplicadas: sem repetição, nenhum grupo', () => {
  assert.deepEqual(duplicadas([{ id: '1', descricao: 'A', abreviatura: 'A', classificacao: 'TAXA' }]), [])
})

test('lerRegistros: aceita a saída do console do Studio (hora na frente, enum como objeto)', () => {
  const console = '23:32:47 - {"id":877418,"descricao":"IPTU - Divida Ativa","abreviatura":"DIV","classificacao":{"valor":"TAXA","descricao":"Taxas"},"templateId":null}\n'
    + '23:32:47 - {"id":877374,"descricao":"IPTU - Divida Ativa","abreviatura":"DVIPT","classificacao":{"valor":"IMPOSTO","descricao":"Imposto"},"templateId":"7788da69"}\n'
    + 'Não há eventos mais recentes neste momento. Tentar novamente\n'
  const { registros, faltando, formato } = lerRegistros(console, ajustePorId('receitas-duplicadas').cadastro)
  assert.equal(formato, 'console')
  assert.deepEqual(faltando, [])
  assert.deepEqual(registros.map(r => [r.id, r.classificacao, r.templateId]), [['877418', 'TAXA', ''], ['877374', 'IMPOSTO', '7788da69']])
  assert.equal(duplicadas(registros)[0].registros.length, 2)
})

// ---- Correção das receitas: PATCH com "." na descrição da sem template (excluir ficou de fora, a pedido) ----
const REG = [
  { id: '877374', descricao: 'IPTU - Divida Ativa', abreviatura: 'DVIPT', classificacao: 'IMPOSTO', inscDividaAtiva: 'SIM', templateId: '7788da69' },
  { id: '877418', descricao: 'IPTU - Divida Ativa', abreviatura: 'DIV', classificacao: 'TAXA', inscDividaAtiva: 'SIM', templateId: '' },
  { id: '542777', descricao: 'Correção pré-fixada', abreviatura: 'CorPre', classificacao: 'CORRECAO_PREFIXADA', inscDividaAtiva: 'SIM', templateId: '' },
  { id: '877431', descricao: 'CORREÇÃO PRÉ-FIXADA', abreviatura: 'C.PRF', classificacao: 'PARCELAMENTO', inscDividaAtiva: 'NAO', templateId: '' },
  { id: '900001', descricao: 'Outras', abreviatura: 'O', classificacao: 'TAXA', inscDividaAtiva: 'SIM', templateId: 'a' },
  { id: '900002', descricao: 'outras', abreviatura: 'O2', classificacao: 'TAXA', inscDividaAtiva: 'SIM', templateId: '' },
  { id: '900003', descricao: 'Outras.', abreviatura: 'O3', classificacao: 'TAXA', inscDividaAtiva: 'SIM', templateId: 'b' },
]

test('alvosCorrecao: em cada grupo de descrição, a sem template quando há uma com template; o resto vai para revisão', () => {
  const { alvos, revisar } = alvosCorrecao(REG)
  assert.deepEqual(alvos.map(a => [a.id, a.nova, a.conflito]), [
    ['877418', 'IPTU - Divida Ativa.', false],
    ['900002', 'outras.', true], // "Outras." já existe: o PATCH com "." repetiria a descrição
  ])
  assert.deepEqual(revisar.map(g => g.registros.map(r => r.id)), [['542777', '877431']])
})

test('lotes da correção: PATCH com descrição + "." e os obrigatórios do PATCH de receitas', () => {
  const { alvos } = alvosCorrecao(REG)
  const [patch] = lotesPatchReceitas(alvos)
  assert.deepEqual(patch.body[0], { idIntegracao: 'AJREC877418', receitas: { idGerado: { id: 877418 }, descricao: 'IPTU - Divida Ativa.', abreviatura: 'DIV', classificacao: 'TAXA', inscDividaAtiva: 'SIM' } })
  assert.deepEqual(patch.ids, [877418, 900002])
  for (const b of patch.body) assert.match(b.idIntegracao, /^[a-zA-Z0-9]*$/)
})

// ---- Limpeza da procuradoria: logradouros do município que não vieram do cadastro único ----
test('script da procuradoria: fonte v2 com .buscar e filtro do município dentro do script (o criterio dá erro interno)', () => {
  const a = ajustePorId('procuradoria-logradouros')
  const script = montarScriptBackup(a.cadastro)
  assert.match(script, /fonte = Dados\.procuradoria\.v2\.logradouros/)
  assert.match(script, /percorrer \(fonte\.buscar\(\)\) \{ item ->/)
  assert.match(script, /ID_MUNICIPIO = "4320"/)
  assert.match(script, /if \(ID_MUNICIPIO != "" && item\.idMunicipio\?\.toString\(\) != ID_MUNICIPIO\) return/)
  assert.match(script, /arquivo\.escrever\("id;nome;tipoLogradouroDescricao;cep;idMunicipio;idTipoLogradouro;epigrafe;extensao;lei;zonaFiscal"\)/)
})

test('script do tributos continua com .busca e sem filtro', () => {
  const script = montarScriptBackup(ajustePorId('receitas-duplicadas').cadastro)
  assert.match(script, /percorrer \(fonte\.busca\(\)\)/)
  assert.doesNotMatch(script, /ID_MUNICIPIO/)
})

test('lotesExcluir: DELETE só com idGerado, idIntegracao só letras e números, 50 por lote, ids repetidos ou vazios fora', () => {
  const a = ajustePorId('procuradoria-logradouros')
  const regs = [...Array.from({ length: 51 }, (_, i) => ({ id: String(1000 + i) })), { id: '1000' }, { id: '' }, { id: '0' }]
  const lotes = lotesExcluir(regs, a.exclusao)
  assert.equal(lotes.length, 2)
  assert.deepEqual(lotes[0].body[0], { idIntegracao: 'EXCLLOG1000', logradouros: { idGerado: { id: 1000 } } })
  assert.deepEqual(lotes[1].ids, [1050])
  assert.match(lotes[0].body[0].idIntegracao, /^[a-zA-Z0-9]*$/)
})

test('lerRegistros: console de logradouros (sem coluna descricao) e foraDoFiltro separa outros municípios', () => {
  const a = ajustePorId('procuradoria-logradouros')
  const texto = '00:19:59 - {"id":21101443,"nome":"*****","cep":"68165000","idMunicipio":"4320"}\n'
    + '00:19:59 - {"id":2842436,"nome":"01","cep":"74985115","idMunicipio":"308"}\n'
  const { registros, faltando } = lerRegistros(texto, a.cadastro)
  assert.deepEqual(faltando, [])
  const { dentro, fora } = separarPorFiltro(registros, a.cadastro.filtro)
  assert.deepEqual(dentro.map(r => r.id), ['21101443'])
  assert.equal(fora, 1)
  assert.deepEqual(separarPorFiltro(registros, undefined).dentro.length, 2)
})

// ---- Bairros da procuradoria: o município vem num objeto (municipio.id), não em idMunicipio ----
test('script de bairros: lê municipio?.id para a coluna e para o filtro', () => {
  const script = montarScriptBackup(ajustePorId('procuradoria-bairros').cadastro)
  assert.match(script, /fonte = Dados\.procuradoria\.v2\.bairros/)
  assert.match(script, /arquivo\.escrever\("id;nome;idMunicipio;municipio"\)/)
  assert.match(script, /item\.municipio\?\.id,/)
  assert.match(script, /item\.municipio\?\.nome\n {2}\]/)
  assert.doesNotMatch(script, /zonaRural/)
  assert.match(script, /if \(ID_MUNICIPIO != "" && item\.municipio\?\.id\?\.toString\(\) != ID_MUNICIPIO\) return/)
})

test('bairros: console com município aninhado vira idMunicipio, filtra Rurópolis e monta o DELETE de bairros', () => {
  const a = ajustePorId('procuradoria-bairros')
  const texto = '01:03:42 - {"id":7511880,"nome":"10 DE MAIO 125","municipio":{"id":4320,"nome":"Rurópolis"},"zonaRural":{"valor":"NAO","descricao":"Não"}}\n'
    + '01:03:42 - {"id":7511934,"nome":"1152","municipio":{"id":2357,"nome":"Itaituba"},"zonaRural":{"valor":"NAO","descricao":"Não"}}\n'
  const { registros, faltando } = lerRegistros(texto, a.cadastro)
  assert.deepEqual(faltando, [])
  assert.deepEqual(registros[0], { id: '7511880', nome: '10 DE MAIO 125', idMunicipio: '4320', municipio: 'Rurópolis' })
  const { dentro, fora } = separarPorFiltro(registros, a.cadastro.filtro)
  assert.deepEqual(dentro.map(r => r.id), ['7511880'])
  assert.equal(fora, 1)
  assert.deepEqual(lotesExcluir(dentro, a.exclusao)[0].body[0], { idIntegracao: 'EXCLBAI7511880', bairros: { idGerado: { id: 7511880 } } })
})
