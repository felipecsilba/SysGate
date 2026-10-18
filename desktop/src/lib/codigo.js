// Realce de código no estilo VS Code Dark+ (blocos de código do Conhecimento).
// Escapa o HTML de cada pedaço ANTES de pintar — conteúdo do banco nunca vira marcação.
export function highlightCode(code) {
  const KEYWORDS = new Set([
    'if','else','for','while','do','return','function','var','let','const',
    'new','true','false','null','undefined','import','export','class','extends',
    'try','catch','finally','throw','switch','case','break','continue','in','of',
    'typeof','instanceof','this','super','async','await','void','delete','yield',
    'from','default','static','get','set',
  ])
  const tokens = []
  const src = code
  let i = 0

  while (i < src.length) {
    // Comentário multi-linha /* ... */
    if (src[i] === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2)
      const val = end === -1 ? src.slice(i) : src.slice(i, end + 2)
      tokens.push({ t: 'comment', v: val }); i += val.length; continue
    }
    // Comentário de linha //
    if (src[i] === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i)
      const val = nl === -1 ? src.slice(i) : src.slice(i, nl)
      tokens.push({ t: 'comment', v: val }); i += val.length; continue
    }
    // Comentário shell/Python # (somente no início da linha ou após espaço)
    if (src[i] === '#' && (i === 0 || /\s/.test(src[i - 1]))) {
      const nl = src.indexOf('\n', i)
      const val = nl === -1 ? src.slice(i) : src.slice(i, nl)
      tokens.push({ t: 'comment', v: val }); i += val.length; continue
    }
    // Template literal `...`
    if (src[i] === '`') {
      let j = i + 1
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue }
        if (src[j] === '`') { j++; break }
        j++
      }
      tokens.push({ t: 'string', v: src.slice(i, j) }); i = j; continue
    }
    // Strings com aspas simples ou duplas
    if (src[i] === '"' || src[i] === "'") {
      const q = src[i]
      let j = i + 1
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue }
        if (src[j] === q || src[j] === '\n') { if (src[j] === q) j++; break }
        j++
      }
      tokens.push({ t: 'string', v: src.slice(i, j) }); i = j; continue
    }
    // Números (hex, float, inteiro)
    if (/[0-9]/.test(src[i])) {
      let j = i
      if (src[j] === '0' && /[xX]/.test(src[j + 1])) {
        j += 2; while (j < src.length && /[0-9a-fA-F_]/.test(src[j])) j++
      } else {
        while (j < src.length && /[0-9_]/.test(src[j])) j++
        if (src[j] === '.') { j++; while (j < src.length && /[0-9_]/.test(src[j])) j++ }
        if (/[eE]/.test(src[j])) { j++; if (/[+-]/.test(src[j])) j++; while (j < src.length && /[0-9]/.test(src[j])) j++ }
      }
      tokens.push({ t: 'number', v: src.slice(i, j) }); i = j; continue
    }
    // Identificadores, keywords e chamadas de função
    if (/[a-zA-Z_$]/.test(src[i])) {
      let j = i
      while (j < src.length && /[a-zA-Z0-9_$]/.test(src[j])) j++
      const word = src.slice(i, j)
      const isFunc = src.slice(j).trimStart()[0] === '('
      tokens.push({ t: KEYWORDS.has(word) ? 'keyword' : isFunc ? 'function' : 'plain', v: word })
      i = j; continue
    }
    tokens.push({ t: 'other', v: src[i] }); i++
  }

  const C = { comment: '#6a9955', string: '#ce9178', number: '#b5cea8', keyword: '#569cd6', function: '#dcdcaa' }
  return tokens.map(({ t, v }) => {
    const esc = v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return C[t] ? `<span style="color:${C[t]}">${esc}</span>` : esc
  }).join('')
}
