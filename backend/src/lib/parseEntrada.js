/**
 * Parser tolerante da entrada da Checagem.
 *
 * O JSON chega de três lugares, em três formatos diferentes, e obrigar o
 * usuário a limpar na mão a cada conferência é o tipo de atrito que faz um
 * módulo deixar de ser usado:
 *
 *   array JSON        [{...},{...}]                  — arquivo de migração
 *   envelope paginado { data: [...] }                — API da tela
 *   linha a linha     {...}\n{...}                   — saída de script
 *   log do Studio     11:52:01 - {"id":274988488}    — BFC-Script copiado da tela
 *
 * O último é o mais comum no dia a dia e o que mais dá trabalho: vem com hora
 * na frente, misturado com linhas de cabeçalho e resumo, e a última linha
 * costuma vir cortada quando o log é grande.
 */

const PREFIXO_LOG = /^\s*\d{1,2}:\d{2}(:\d{2})?\s*-\s*/
const ENVELOPES = ['data', 'content', 'list', 'itens', 'registros']

/**
 * @returns {{ registros: object[], formato: string, descartadas: number }}
 *   formato: 'array' | 'objeto' | 'envelope' | 'linhas' | 'desconhecido'
 *   descartadas: linhas que pareciam JSON mas não puderam ser lidas (truncadas)
 */
function parseEntrada(texto) {
  const t = String(texto || '').trim()
  if (!t) return { registros: [], formato: 'desconhecido', descartadas: 0 }

  // 1) o texto inteiro é um JSON válido
  try {
    const json = JSON.parse(t)
    if (Array.isArray(json)) return { registros: json, formato: 'array', descartadas: 0 }
    if (json && typeof json === 'object') {
      for (const chave of ENVELOPES) {
        if (Array.isArray(json[chave])) return { registros: json[chave], formato: 'envelope', descartadas: 0 }
      }
      return { registros: [json], formato: 'objeto', descartadas: 0 }
    }
  } catch {
    // não é um JSON único — cai para a leitura linha a linha
  }

  // 2) linha a linha, tolerando prefixo de log e linhas de texto no meio
  const registros = []
  let descartadas = 0

  for (const bruta of t.split(/\r?\n/)) {
    const linha = bruta.replace(PREFIXO_LOG, '').trim()
    if (!linha.startsWith('{') && !linha.startsWith('[')) continue // cabeçalho, resumo, separador

    try {
      const json = JSON.parse(linha)
      if (Array.isArray(json)) registros.push(...json)
      else registros.push(json)
    } catch {
      descartadas++ // linha cortada pelo log; o resto continua valendo
    }
  }

  return {
    registros,
    formato: registros.length ? 'linhas' : 'desconhecido',
    descartadas,
  }
}

module.exports = { parseEntrada }
