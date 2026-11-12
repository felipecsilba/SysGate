// Migração Espelho: em vez de migrar de novo pela Service Layer, provoca um "salvar" em cada registro do
// tributos para o cadastro único espelhar o dado nos outros sistemas (procuradoria etc.).
// Fluxo por cadastro: backup → estímulo → espera → desfazer → conferência.

// Campos na ordem em que a fonte devolve. `enum: true` = a fonte manda { valor, descricao } e o CSV guarda o valor.
// tela: onde o registro fica na API da tela (a que dispara o cadastro único) e qual campo recebe o "." do estímulo.
// Ordem do menu = ordem de trabalho: bairro antes de logradouro (o logradouro carrega os bairros), endereço antes de contribuinte.
export const CADASTROS = [
  {
    id: 'creditos-tributarios',
    rotulo: 'Créditos tributários',
    pronto: true,
    fonte: 'Dados.tributos.v2.creditosTributarios',
    arquivo: 'creditos_tributarios.csv',
    // Formato conferido no Studio em 2026-10-29 (busca() sem filtro, impressão de cada item)
    campos: [
      { nome: 'id', descricao: 'Id do crédito (idGerado no PATCH)' },
      { nome: 'descricao', descricao: 'Descrição' },
      { nome: 'abreviatura', descricao: 'Abreviatura' },
      { nome: 'desativado', enum: true, descricao: 'SIM / NAO' },
      { nome: 'tipoCadastro', enum: true, descricao: 'IMOVEIS, ECONOMICOS, CONTRIBUINTE, RECEITAS_DIVERSAS…' },
      { nome: 'iReceita', descricao: 'Receita vinculada' },
      { nome: 'templateId', descricao: 'Template do cálculo' },
    ],
    tela: { path: '/api/cadastros/creditos-tributarios', campo: 'descricao' },
    rotuloItem: 'crédito(s)',
  },
  {
    id: 'bairros',
    rotulo: 'Bairros',
    pronto: true,
    fonte: 'Dados.tributos.v2.bairros',
    arquivo: 'bairros_tributos.csv',
    campos: [
      { nome: 'id', descricao: 'Id do bairro' },
      { nome: 'nome', descricao: 'Nome (recebe o "." no estímulo)' },
      { nome: 'codigo', descricao: 'Código' },
      { nome: 'idTemplate', descricao: 'Identificador do cadastro único' },
      { nome: 'idMunicipio', caminho: 'municipio?.id', descricao: 'Id do município' },
      { nome: 'municipio', caminho: 'municipio?.nome', descricao: 'Município (o Estímulo filtra por ele)' },
    ],
    tela: { path: '/api/cadastros/enderecos/bairros', campo: 'nome' },
    rotuloItem: 'bairro(s)',
  },
  {
    id: 'logradouros',
    rotulo: 'Logradouros',
    pronto: true,
    fonte: 'Dados.tributos.v2.logradouros',
    arquivo: 'logradouros_tributos.csv',
    campos: [
      { nome: 'id', descricao: 'Id do logradouro' },
      { nome: 'nome', descricao: 'Nome (recebe o "." no estímulo)' },
      { nome: 'codigo', descricao: 'Código' },
      { nome: 'tipoLogradouroDescricao', descricao: 'Tipo (Rua, Avenida…)' },
      { nome: 'cep', descricao: 'CEP' },
      { nome: 'idTemplate', descricao: 'Identificador do cadastro único' },
      { nome: 'idMunicipio', caminho: 'municipio?.id', descricao: 'Id do município' },
      { nome: 'municipio', caminho: 'municipio?.nome', descricao: 'Município (o Estímulo filtra por ele)' },
    ],
    tela: { path: '/api/cadastros/enderecos/logradouros', campo: 'nome' },
    rotuloItem: 'logradouro(s)',
  },
  // Salvar sem mudar já dispara o cadastro único (contribuinte 109271640 apareceu na procuradoria com o mesmo template,
  // captura de 2026-10-30) — modo 'salvar': GET → backup → PUT do mesmo objeto, sem "." e sem volta.
  {
    id: 'contribuintes',
    rotulo: 'Contribuintes',
    pronto: true,
    fonte: 'Dados.tributos.v2.contribuintes',
    arquivo: 'contribuintes_tributos.csv',
    // Sem enums no backup (situação, tipo de pessoa): em exportação ampla podem vir fora do formato { valor }.
    // O registro completo (endereços, telefones, sócios…) vai para o backup automático do Estímulo.
    campos: [
      { nome: 'id', descricao: 'Id do contribuinte' },
      { nome: 'codigo', descricao: 'Código' },
      { nome: 'nome', descricao: 'Nome' },
      { nome: 'cpfCnpj', descricao: 'CPF/CNPJ' },
      { nome: 'inscricaoMunicipal', descricao: 'Inscrição municipal' },
      { nome: 'idTemplate', descricao: 'Identificador do cadastro único' },
    ],
    tela: { path: '/api/cadastros/referentes/contribuintes', campo: 'nome', modo: 'salvar' },
    rotuloItem: 'contribuinte(s)',
  },
  { id: 'moradores', rotulo: 'Moradores' },
  { id: 'receitas', rotulo: 'Receitas' },
]

export const ETAPAS = [
  { id: 'backup', rotulo: 'Backup', resumo: 'Exportar todos os registros (script no Studio)' },
  { id: 'estimulo', rotulo: 'Estímulo', resumo: 'Salvar cada registro para o cadastro único disparar' },
  { id: 'espera', rotulo: 'Sincronização', resumo: 'Aguardar o espelho nos outros sistemas' },
  { id: 'desfazer', rotulo: 'Desfazer', resumo: 'Voltar o campo ao valor do backup' },
  { id: 'conferencia', rotulo: 'Conferência', resumo: 'Conferir tributos e o sistema espelhado' },
]

export const cadastroPorId = id => CADASTROS.find(c => c.id === id)

// metodo: 'busca' no tributos, 'buscar' na procuradoria. filtro { campo, caminho?, constante, valor, descricao }: filtra
// DENTRO do script — na procuradoria o criterio por idMunicipio volta "Erro interno do servidor".
// Campo com caminho (ex.: 'municipio?.id'): a coluna do CSV tem o nome do campo e o valor sai do caminho.
export function montarScriptBackup(cadastro) {
  if (!cadastro?.campos?.length) return ''
  const { fonte, arquivo, rotulo, campos, metodo = 'busca', filtro } = cadastro
  const valores = campos.map(c => (c.caminho ? `item.${c.caminho}` : c.enum ? `item.${c.nome}?.valor` : `item.${c.nome}`))
  const constante = filtro ? `
// ${filtro.descricao}
// Vazio ("") exporta todos.
${filtro.constante} = "${filtro.valor}"
` : ''
  const pular = filtro ? `
  if (${filtro.constante} != "" && item.${filtro.caminho ?? filtro.campo}?.toString() != ${filtro.constante}) return
` : ''
  return `// ---------------------------------------------------------------------------
// Migração Espelho — ${rotulo}: exportação (backup)
//
// Uma linha por registro, uma coluna por campo, na ordem em que a fonte devolve.
// Enum sai pelo valor (ex.: RECEITAS_DIVERSAS), não pela descrição.
// É o backup antes de mexer e a lista de ids do envio.
//
// Fonte: ${fonte}
// Gerado pelo Krakion App (Migração Espelho)
// ---------------------------------------------------------------------------

NOME_ARQUIVO = "${arquivo}"
${constante}
fonte = ${fonte}

arquivo = Arquivo.novo(NOME_ARQUIVO, 'csv', [delimitador: ';', entreAspas: 'N', encoding: 'utf-8'])
arquivo.escrever("${campos.map(c => c.nome).join(';')}")
arquivo.novaLinha()

total = 0

percorrer (fonte.${metodo}()) { item ->${pular}
  valores = [
    ${valores.join(',\n    ')}
  ]
  linha = valores.collect { it == null ? "" : it.toString().replace(";", " ").replace("\\n", " ").trim() }.join(";")
  arquivo.escrever(linha)
  arquivo.novaLinha()
  total = total + 1
}

mensagem = "Registros exportados: " + total
imprimir mensagem

// O Studio já entrega o resultado zipado — não zipar aqui
Resultado.arquivo(arquivo)
`
}

// ---------------------------------------------------------------------------------------------
// Estímulo dos créditos tributários: PATCH só com idGerado + descrição atual com "." no final.
// O backup (CSV do script acima) é a fonte da descrição atual e, depois, da volta ao original.

// CSV do script: separador ;, sem aspas, UTF-8 (com ou sem BOM), cabeçalho = nomes dos campos
export function lerBackup(texto, cadastro) {
  const linhas = String(texto || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim() !== '')
  if (!linhas.length) return { registros: [], faltando: ['id', 'descricao'], colunas: [] }
  const colunas = linhas[0].split(';').map(c => c.trim())
  const registros = linhas.slice(1).map(l => {
    const valores = l.split(';')
    return Object.fromEntries(colunas.map((c, i) => [c, (valores[i] ?? '').trim()]))
  })
  const exigidas = ['id', 'descricao'].filter(c => cadastro?.campos?.some(x => x.nome === c))
  return { registros, faltando: exigidas.filter(c => !colunas.includes(c)), colunas }
}

// Não bloqueia por ponto já existente: só marca (jaTemPonto) para o aviso na tela.
// Fica fora: id vazio/zero (zero é ausência nas bases convertidas), descrição vazia e id repetido.
export function prevalidarEstimulo(registros, campo = 'descricao') {
  const itens = []
  const foraDoEnvio = []
  const vistos = new Set()
  for (const r of registros) {
    const id = Number(r.id)
    const atual = String(r[campo] ?? '')
    if (!Number.isInteger(id) || id <= 0) { foraDoEnvio.push({ id: r.id, atual, motivo: 'sem id' }); continue }
    if (!atual.trim()) { foraDoEnvio.push({ id, atual, motivo: campo === 'descricao' ? 'sem descrição' : `sem ${campo}` }); continue }
    if (vistos.has(id)) { foraDoEnvio.push({ id, atual, motivo: 'id repetido' }); continue }
    vistos.add(id)
    itens.push({ id, atual, nova: `${atual}.`, jaTemPonto: atual.endsWith('.') })
  }
  return { itens, foraDoEnvio }
}

// Municípios do backup com a contagem (o maior primeiro) — o tributos pode trazer outras cidades
export function municipiosDoBackup(registros) {
  if (!registros.some(r => 'municipio' in r)) return []
  const cont = new Map()
  for (const r of registros) cont.set(r.municipio ?? '', (cont.get(r.municipio ?? '') ?? 0) + 1)
  return [...cont].map(([municipio, total]) => ({ municipio, total })).sort((a, b) => b.total - a.total)
}

// Status por id a partir do retorno interpretado (interpretarEnvio / interpretarStatusLote de lote.js).
// O erro por item volta pelo idIntegracao — casado com o corpo do próprio lote, sem depender de prefixo.
export function aplicarRetornoLote(estado, retorno, lote) {
  const novo = { ...estado }
  if (retorno.status === 'erro') {
    for (const id of lote.ids) novo[id] = { ok: false, mensagem: retorno.mensagem }
    return novo
  }
  const erros = new Map((retorno.erros || []).map(e => [e.idIntegracao, e.mensagem]))
  lote.ids.forEach((id, i) => {
    const msg = erros.get(lote.body[i]?.idIntegracao)
    novo[id] = msg !== undefined ? { ok: false, mensagem: msg } : { ok: true }
  })
  return novo
}

// ---------------------------------------------------------------------------------------------
// Estímulo pela API da tela (validado em 2026-10-29 com o Habite-se): é a única que dispara o cadastro único.
// O PUT leva o objeto inteiro do GET com só a descrição trocada — igual à tela, que descarta indexador.version.

const TELA_CREDITOS = { path: '/api/cadastros/creditos-tributarios', campo: 'descricao' }
export const pathCreditoTela = id => `${TELA_CREDITOS.path}/${id}`

export function corpoParaPut(objeto, valor, campo = 'descricao') {
  const corpo = structuredClone(objeto)
  corpo[campo] = valor
  if (corpo.indexador) delete corpo.indexador.version
  return corpo
}

const semBackup = err => ({ ok: false, etapa: 'backup', mensagem: `Backup não gravado (${err.message}) — não mexi` })
const sessaoExpirada = () => Object.assign(new Error('Sessão do tributos expirada — entre de novo'), { sessaoExpirada: true })
// 422 da tela: a explicação vem em detail.message ("Já existe uma receita com a descrição informada.")
const recado = res => res?.data?.detail?.message || res?.data?.message || res?.data?.mensagem || `HTTP ${res?.status}`

// Compara ignorando espaços sobrando e a forma do acento (o backup sai com trim; a Betha pode ter "á" decomposto)
const comparavel = t => String(t ?? '').normalize('NFC').replace(/\s+/g, ' ').trim()

// chamar(metodo, path, corpo) → { status, data }. Lança { sessaoExpirada } no 401 para a fila pausar.
// Só mexe em registro cuja descrição bate com o backup; se ficou com "." de uma rodada interrompida, faz só a volta.
// O "." e a volta usam a descrição EXATAMENTE como a Betha devolveu — nunca reescrevem com o texto do backup.
// Corpo do salvar da tela do contribuinte: o GET + anoCorrente e enderecoPrincipal (a tela manda null quando não tem)
export function corpoParaSalvar(objeto, ano) {
  const corpo = structuredClone(objeto)
  corpo.anoCorrente = ano
  if (!('enderecoPrincipal' in corpo)) corpo.enderecoPrincipal = null
  return corpo
}

// Modo 'salvar' (contribuintes): GET → backup → PUT do mesmo objeto. Um PUT só — não há "." para tirar depois.
export async function salvarPelaTela(item, { chamar, tela, guardar = async () => {}, ano = new Date().getFullYear() }) {
  const path = `${tela.path}/${item.id}`
  const res = await chamar('GET', path)
  if (res.status === 401) throw sessaoExpirada()
  if (res.status !== 200) return { ok: false, etapa: 'ler', mensagem: recado(res) }
  try { await guardar(res.data) } catch (err) { return semBackup(err) }
  const salvo = await chamar('PUT', path, corpoParaSalvar(res.data, ano))
  if (salvo.status === 401) throw sessaoExpirada()
  if (salvo.status !== 200) return { ok: false, etapa: 'salvar', mensagem: recado(salvo) }
  return { ok: true }
}

// guardar(objeto): backup completo do registro lido, ANTES do primeiro PUT — se falhar, o registro não é tocado.
export async function estimularPelaTela(item, { chamar, esperar, esperaMs = 5000, tela = TELA_CREDITOS, guardar = async () => {} }) {
  const path = `${tela.path}/${item.id}`
  const ler = async () => {
    const res = await chamar('GET', path)
    if (res.status === 401) throw sessaoExpirada()
    return res
  }
  const gravar = async (objeto, descricao) => {
    const res = await chamar('PUT', path, corpoParaPut(objeto, descricao, tela.campo))
    if (res.status === 401) throw sessaoExpirada()
    return res
  }

  let res = await ler()
  if (res.status !== 200) return { ok: false, etapa: 'ler', mensagem: recado(res) }
  const naBetha = String(res.data[tela.campo] ?? '')
  let original = naBetha
  let soVolta = false
  if (comparavel(naBetha) === comparavel(item.nova) && naBetha.trimEnd().endsWith('.')) {
    soVolta = true
    original = naBetha.trimEnd().slice(0, -1)
    try { await guardar(res.data) } catch (err) { return semBackup(err) }
  } else if (comparavel(naBetha) !== comparavel(item.atual)) {
    return { ok: false, etapa: 'conferir', mensagem: `Descrição mudou desde o backup: na Betha "${naBetha}", no backup "${item.atual}" — não mexi` }
  } else {
    try { await guardar(res.data) } catch (err) { return semBackup(err) }
    const marca = await gravar(res.data, `${original}.`)
    if (marca.status !== 200) return { ok: false, etapa: 'marcar', mensagem: recado(marca) }
    await esperar(esperaMs)
    res = await ler()
    if (res.status !== 200) return { ok: false, etapa: 'volta', marcado: true, mensagem: `Ficou com "." — ${recado(res)}` }
  }
  const volta = await gravar(res.data, original)
  if (volta.status !== 200) return { ok: false, etapa: 'volta', marcado: true, mensagem: `Ficou com "." — ${recado(volta)}` }
  return soVolta ? { ok: true, soVolta: true } : { ok: true }
}

// Desfazer pela API da tela: tira o "." do fim e grava — espelha nos outros sistemas, ao contrário do PATCH da
// Service Layer. Sem ponto: não grava nada. Diferente do backup: não mexe. Lança { sessaoExpirada } no 401.
export async function desfazerPelaTela(item, { chamar, tela = TELA_CREDITOS, guardar = async () => {} }) {
  const path = `${tela.path}/${item.id}`
  const res = await chamar('GET', path)
  if (res.status === 401) throw sessaoExpirada()
  if (res.status !== 200) return { ok: false, etapa: 'ler', mensagem: recado(res) }
  const naBetha = String(res.data[tela.campo] ?? '')
  if (comparavel(naBetha) === comparavel(item.atual)) return { ok: true, jaEstava: true }
  if (comparavel(naBetha) !== comparavel(item.nova) || !naBetha.trimEnd().endsWith('.')) {
    return { ok: false, etapa: 'conferir', mensagem: `Descrição diferente do backup: na Betha "${naBetha}", no backup "${item.atual}" — não mexi` }
  }
  try { await guardar(res.data) } catch (err) { return semBackup(err) }
  const volta = await chamar('PUT', path, corpoParaPut(res.data, naBetha.trimEnd().slice(0, -1), tela.campo))
  if (volta.status === 401) throw sessaoExpirada()
  if (volta.status !== 200) return { ok: false, etapa: 'volta', marcado: true, mensagem: `Continua com "." — ${recado(volta)}` }
  return { ok: true }
}

// A API da tela devolve 500 sem mensagem de vez em quando (7 em ~870 logradouros, 2026-10-30) e 429 no limite de
// chamadas. Repete a MESMA chamada até 3 vezes antes de entregar o erro — o PUT da tela é idempotente (manda o objeto inteiro).
const TRANSITORIO = new Set([429, 500, 502, 503, 504])
const ESPERAS_NOVA_TENTATIVA_MS = [2000, 5000, 15000]
export function comNovasTentativas(chamar, { esperar }) {
  return async (metodo, path, corpo) => {
    let res = await chamar(metodo, path, corpo)
    for (const ms of ESPERAS_NOVA_TENTATIVA_MS) {
      if (!TRANSITORIO.has(res.status)) break
      await esperar(ms)
      res = await chamar(metodo, path, corpo)
    }
    return res
  }
}

// Erros do estímulo → o MESMO formato do arquivo do script (mesmas colunas, mesma ordem, linhas originais), só com quem
// falhou, + etapa e erro no fim. Volta a ser carregado no Estímulo como está (a leitura é pelo nome da coluna).
// Cada mensagem recorrente é bug de migração (levar para a Checagem).
const celulaCsv = v => String(v ?? '').replace(/;/g, ',').replace(/\s*[\r\n]+\s*/g, ' ').trim()
export function csvErros(registros, colunas, porId) {
  const base = colunas.filter(c => c !== 'etapa' && c !== 'erro')
  const linhas = [[...base, 'etapa', 'erro']]
  for (const r of registros) {
    const s = porId[Number(r.id)]
    if (s?.estado === 'erro') linhas.push([...base.map(c => r[c]), s.etapa, s.mensagem])
  }
  return linhas.map(l => l.map(celulaCsv).join(';')).join('\r\n') + '\r\n'
}

export function resumoErros(porId) {
  const cont = new Map()
  for (const s of Object.values(porId)) if (s?.estado === 'erro') cont.set(s.mensagem, (cont.get(s.mensagem) ?? 0) + 1)
  return [...cont].map(([mensagem, total]) => ({ mensagem, total })).sort((a, b) => b.total - a.total)
}

// De qual cadastro é o arquivo carregado: pelo nome (o do script ou o de erros, "<arquivo>_erros_…") ou, se o nome não
// disser, pelas colunas (todas as do script presentes). Para avisar quando o CSV foi aberto no cadastro errado.
export function cadastroDoArquivo(nomeArquivo, colunas) {
  const nome = String(nomeArquivo || '').toLowerCase()
  const prontos = CADASTROS.filter(c => c.pronto && c.arquivo)
  const porNome = prontos.find(c => nome === c.arquivo || nome.startsWith(`${c.arquivo.replace(/\.csv$/, '')}_erros`))
  if (porNome) return porNome
  // pelas colunas: o mais específico (as de bairro estão todas dentro do arquivo de logradouro)
  return prontos.filter(c => c.campos.every(campo => colunas.includes(campo.nome))).sort((x, y) => y.campos.length - x.campos.length)[0]
}
