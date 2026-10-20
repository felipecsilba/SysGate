// Gerador de Extensões — script de exportação de uma fonte do BFC-Script.
// O modelo segue o script que já rodou em produção (biblioteca/_BIBLIOTECA/Templates/Exporta_Debitos_Completo_por_Credito_BASE.txt):
// zip com JSONL (registro como a fonte devolveu — é o que a Checagem lê) e, opcional, CSV achatado para consulta.

// "vazio ou zero": bases convertidas usam 0 no lugar de nulo em ids — procurar só por null perde metade
export const OPERADORES = [
  { id: '=', rotulo: 'igual a', precisaValor: true },
  { id: '!=', rotulo: 'diferente de', precisaValor: true },
  { id: 'like', rotulo: 'contém', precisaValor: true, soTexto: true },
  { id: '>', rotulo: 'maior que', precisaValor: true },
  { id: '>=', rotulo: 'maior ou igual a', precisaValor: true },
  { id: '<', rotulo: 'menor que', precisaValor: true },
  { id: '<=', rotulo: 'menor ou igual a', precisaValor: true },
  { id: 'in', rotulo: 'um destes (vírgula)', precisaValor: true },
  { id: 'is null', rotulo: 'está vazio', precisaValor: false },
  { id: 'vazioOuZero', rotulo: 'vazio ou zero (ids)', precisaValor: false },
]

export const ehTexto = tipo => /^(String|Character|LocalDate|LocalDateTime|Date|Instant)$/i.test(String(tipo))
const ehNumero = tipo => /^(Long|Integer|int|long|BigDecimal|Double|Float|Short)$/i.test(String(tipo))

export function operadoresPara(filtro) {
  return OPERADORES.filter(o => !o.soTexto || (ehTexto(filtro.tipo) && !filtro.eh_enum))
}

// Valor dentro do critério: texto/enum/data entre aspas simples (aspas internas dobradas)
function literal(valor, { tipo, eh_enum }) {
  const v = String(valor).trim()
  if (eh_enum || !ehNumero(tipo)) return `'${v.replace(/'/g, "''")}'`
  return v
}

/** Uma condição do critério; null se ainda falta o valor. */
export function montarCondicao({ campo, operador, valor, tipo, eh_enum }) {
  if (operador === 'is null') return `${campo} is null`
  if (operador === 'vazioOuZero') return `(${campo} is null or ${campo} = 0)`
  if (valor === undefined || valor === null || String(valor).trim() === '') return null
  if (operador === 'like') return `${campo} like '%${String(valor).trim().replace(/'/g, "''")}%'`
  if (operador === 'in') {
    const itens = String(valor).split(',').map(x => x.trim()).filter(Boolean)
    return itens.length ? `${campo} in (${itens.map(x => literal(x, { tipo, eh_enum })).join(', ')})` : null
  }
  return `${campo} ${operador} ${literal(valor, { tipo, eh_enum })}`
}

export function montarCriterio(condicoes) {
  return condicoes.map(montarCondicao).filter(Boolean).join(' and ')
}

// Texto que vai dentro de "…" no Groovy: escapa \, " e $ (senão vira interpolação)
const strGroovy = s => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$')
const nomeArquivo = s => String(s || 'exportacao').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'exportacao'
const acessoFonte = bfc => (/^[A-Za-z_][\w.]*$/.test(bfc) ? `.${bfc}` : `["${strGroovy(bfc)}"]`)

/**
 * fonte: { bfc, operacao, descricao, descricaoOp, confirmado, ordenacao[] }
 * parametros: [{ nome, tipo, valor }] — os obrigatórios da operação (vão em parametros:, nunca em criterio:)
 */
export function montarScript({ fonte, criterio = '', parametros = [], limite = 0, csv = true, nomeBase }) {
  const base = nomeArquivo(nomeBase || `${fonte.bfc}_${fonte.operacao}`)
  const titulo = fonte.descricaoOp || fonte.descricao || `${fonte.bfc}.${fonte.operacao}`
  const L = []
  L.push('// ---------------------------------------------------------------------------')
  L.push(`// Exporta: ${titulo}`)
  L.push(`// Fonte: Dados.tributos.v2${acessoFonte(fonte.bfc)}.${fonte.operacao}`)
  if (!fonte.confirmado) {
    L.push(`// ATENÇÃO: "${fonte.bfc}" é o nome da rota REST no catálogo. O nome no editor da Betha`)
    L.push('//   pode ser diferente — confira na lista de fontes do editor antes de rodar.')
  }
  L.push('//')
  L.push(`// Saída: ${csv ? 'zip com 2 arquivos UTF-8' : 'zip com 1 arquivo UTF-8'}`)
  L.push('//   - JSONL -> uma linha por registro, exatamente como a fonte devolveu (é o que a Checagem lê)')
  if (csv) L.push('//   - CSV   -> uma coluna por campo achatado, só para consulta (enum vira campo + campo.descricao)')
  L.push('// Gerado pelo Gerador de Extensões do Krakion App.')
  L.push('// ---------------------------------------------------------------------------')
  L.push('')
  L.push('// ============================ CONFIGURAÇÃO =================================')
  L.push('')
  for (const p of parametros) {
    const v = String(p.valor ?? '').trim()
    const valor = v ? (ehNumero(p.tipo) ? v : `"${strGroovy(v)}"`) : (ehNumero(p.tipo) ? '0' : '""')
    L.push(`${p.nome} = ${valor}${v ? '' : '   // obrigatório — preencha'}`)
  }
  if (parametros.length) L.push('')
  L.push(`CRITERIO = "${strGroovy(criterio)}"`)
  L.push(`LIMITE = ${Math.max(0, Number(limite) || 0)}   // 0 = todos. Comece pequeno para conferir o filtro.`)
  L.push('')
  L.push(`NOME_ARQUIVO_JSON = "${base}.jsonl"`)
  if (csv) L.push(`NOME_ARQUIVO_CSV  = "${base}.csv"`)
  L.push(`NOME_ARQUIVO_ZIP  = "${base}.zip"`)
  L.push('')
  L.push('// ===========================================================================')
  L.push('')
  for (const p of parametros) {
    L.push(`if (!${p.nome}) {`)
    L.push(`  imprimir "Informe ${p.nome} na configuração (parâmetro obrigatório da fonte)."`)
    L.push('  return')
    L.push('}')
  }
  if (parametros.length) L.push('')
  const args = []
  if (parametros.length) args.push(`parametros: [${parametros.map(p => `"${p.nome}": ${p.nome}`).join(', ')}]`)
  const comOrdem = (fonte.ordenacao || []).includes('id')
  L.push('buscar = {')
  L.push(`  if (CRITERIO) return Dados.tributos.v2${acessoFonte(fonte.bfc)}.${fonte.operacao}(${[...args, 'criterio: CRITERIO', comOrdem ? 'ordenacao: "id asc"' : null].filter(Boolean).join(', ')})`)
  L.push(`  return Dados.tributos.v2${acessoFonte(fonte.bfc)}.${fonte.operacao}(${[...args, comOrdem ? 'ordenacao: "id asc"' : null].filter(Boolean).join(', ')})`)
  L.push('}')
  L.push('')
  L.push('imprimir "Critério: " + (CRITERIO ? CRITERIO : "(nenhum)")') // só sintaxe já usada em produção (sem o Elvis ?:)
  L.push('')
  if (csv) {
    L.push('limpar = { valor ->')
    L.push('  return valor == null ? "" : valor.toString().replace(";", " ").replace("\\r", " ").replace("\\n", " ").trim()')
    L.push('}')
    L.push('')
    L.push('formatar = { valor ->')
    L.push('  if (valor == null) return ""')
    L.push('  if (valor instanceof Number) return valor.toString().replace(".", ",")')
    L.push('  return limpar(valor)')
    L.push('}')
    L.push('')
    L.push('// Registro → mapa plano: objetos viram colunas com ponto, enum {valor, descricao} vira campo + campo.descricao')
    L.push('achatar = null')
    L.push('achatar = { objeto, prefixo, destino ->')
    L.push('  objeto.each { chave, valor ->')
    L.push('    nome = prefixo ? prefixo + "." + chave : chave.toString()')
    L.push('    if (valor instanceof Map) {')
    L.push('      if (valor.containsKey("valor") && valor.keySet().every { it in ["valor", "descricao"] }) {')
    L.push('        destino[nome] = valor.valor')
    L.push('        destino[nome + ".descricao"] = valor.descricao')
    L.push('      } else if (valor.isEmpty()) {')
    L.push('        destino[nome] = null')
    L.push('      } else {')
    L.push('        achatar(valor, nome, destino)')
    L.push('      }')
    L.push('    } else if (valor instanceof List) {')
    L.push('      destino[nome] = valor.collect { it instanceof Map ? it.values().join("|") : it }.join(",")')
    L.push('    } else {')
    L.push('      destino[nome] = valor')
    L.push('    }')
    L.push('  }')
    L.push('  return destino')
    L.push('}')
    L.push('')
    L.push('// --- 1ª passada: levanta os nomes de campo (o CSV sai com todas as colunas) ---')
    L.push('')
    L.push('colunasVistas = [:]')
    L.push('lidos = 0')
    L.push('buscar().each { registro ->')
    L.push('  if (LIMITE && lidos >= LIMITE) return')
    L.push('  lidos = lidos + 1')
    L.push('  achatar(registro, "", [:]).keySet().each { colunasVistas[it] = true }')
    L.push('}')
    L.push('colunas = colunasVistas.keySet().toList().sort()')
    L.push('imprimir "Registros: " + lidos + " · colunas: " + colunas.size()')
    L.push('')
  }
  L.push(`// --- ${csv ? '2ª passada: escreve' : 'Escreve'} o${csv ? 's arquivos' : ' JSONL'} ---`)
  L.push('')
  L.push('arquivoJson = Arquivo.novo(NOME_ARQUIVO_JSON, \'txt\', [encoding: \'utf-8\'])')
  if (csv) {
    L.push('arquivoCsv = Arquivo.novo(NOME_ARQUIVO_CSV, \'csv\', [delimitador: \';\', entreAspas: \'N\', encoding: \'utf-8\'])')
    L.push('arquivoCsv.escrever(colunas.join(";"))')
    L.push('arquivoCsv.novaLinha()')
  }
  L.push('')
  L.push('escritos = 0')
  L.push('buscar().each { registro ->')
  L.push('  if (LIMITE && escritos >= LIMITE) return')
  L.push('  // JSON completo do registro em uma única linha (JSON em maiúsculas — "Json" não existe no BFC)')
  L.push('  arquivoJson.escrever(JSON.escrever(registro).replace("\\r", " ").replace("\\n", " "))')
  L.push('  arquivoJson.novaLinha()')
  if (csv) {
    L.push('  plano = achatar(registro, "", [:])')
    L.push('  arquivoCsv.escrever(colunas.collect { formatar(plano[it]) }.join(";"))')
    L.push('  arquivoCsv.novaLinha()')
  }
  L.push('  escritos = escritos + 1')
  L.push('}')
  L.push('')
  L.push('imprimir "Registros escritos: " + escritos')
  L.push('')
  L.push('// Resultado.arquivos([...]) não existe nesta versão do BFC-Script: os arquivos vão juntos num zip')
  L.push('zip = Arquivo.novo(NOME_ARQUIVO_ZIP, \'zip\', [encoding: \'utf-8\'])')
  L.push('zip.adicionar(arquivoJson)')
  if (csv) L.push('zip.adicionar(arquivoCsv)')
  L.push('')
  L.push('Resultado.nome(NOME_ARQUIVO_ZIP)')
  L.push('Resultado.arquivo(zip)')
  L.push('')
  return L.join('\n')
}
