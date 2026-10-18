// Body das requisições do Sandbox a partir do bodySchema do endpoint (formato do parser de Swagger):
// campos + sentinela { _exemplo: true, json } com o JSON de exemplo da spec.
// No web esta lógica estava repetida em 3 lugares; aqui é uma só e testada.

const ehObjeto = v => typeof v === 'object' && v !== null && !Array.isArray(v)

function tipoDoValor(v) {
  if (typeof v === 'number') return 'number'
  if (typeof v === 'boolean') return 'boolean'
  if (ehObjeto(v) || Array.isArray(v)) return 'object'
  return 'string'
}

export function exemploJson(bodySchema) {
  return (bodySchema || []).find(c => c._exemplo)?.json
}

// Campos "planos" para o editor. Objeto com exemplo vira filhos "pai.filho" (1 nível).
// idGerado cujo exemplo é { id: N } vira campo numérico que é reembalado como { id } ao enviar.
export function expandirSchema(bodySchema) {
  const campos = (bodySchema || []).filter(c => !c._exemplo)
  const ex = exemploJson(bodySchema)
  const exObj = Array.isArray(ex) ? ex[0] : ex
  const resultado = []
  for (const c of campos) {
    const sub = exObj?.[c.campo]
    if (c.tipo === 'object' && ehObjeto(sub)) {
      for (const [chave, valor] of Object.entries(sub)) {
        const meta = c.subFields?.find(f => f.campo === chave)
        const envolverId = chave === 'idGerado' && ehObjeto(valor)
        resultado.push({
          campo: `${c.campo}.${chave}`,
          rotulo: chave,
          pai: c.campo,
          tipo: envolverId ? 'number' : (meta?.tipo || tipoDoValor(valor)),
          envolverId,
          obrigatorio: false,
          descricao: meta?.descricao || '',
          exemplo: valor == null ? ''
            : envolverId ? String(valor.id ?? valor.idGerado ?? 1)
            : typeof valor === 'object' ? JSON.stringify(valor) : String(valor),
          enum: meta?.enum || null,
        })
      }
    } else {
      resultado.push({ ...c, rotulo: c.campo, pai: null, envolverId: false })
    }
  }
  return resultado
}

// idIntegracao e idGerado vão sempre (a API Betha exige) — não se desmarcam
export const fixo = c => c.campo === 'idIntegracao' || c.rotulo === 'idGerado'

export function selecaoInicial(campos) {
  const sel = {}
  for (const c of campos) sel[c.campo] = fixo(c) || (!c.pai && !!c.obrigatorio)
  return sel
}

export function valoresIniciais(campos) {
  const val = {}
  for (const c of campos) {
    val[c.campo] = c.exemplo ?? ''
    if (c.campo === 'idIntegracao' && !val[c.campo]) val[c.campo] = 'INTEGRACAO1'
    if (c.rotulo === 'idGerado' && !val[c.campo]) val[c.campo] = '1'
  }
  return val
}

function converter(campo, texto) {
  if (campo.tipo === 'number' || campo.tipo === 'integer') {
    const n = Number(String(texto).trim())
    return Number.isNaN(n) ? texto : n // texto inválido segue como está — a API aponta o erro
  }
  if (campo.tipo === 'boolean' && (texto === 'true' || texto === 'false')) return texto === 'true'
  return texto
}

export function montarBody(campos, selecao, valores) {
  const body = {}
  for (const c of campos) {
    const texto = valores[c.campo]
    if (!selecao[c.campo] || texto === undefined || String(texto).trim() === '') continue
    const valor = c.envolverId ? { id: converter(c, texto) } : converter(c, texto)
    if (c.pai) (body[c.pai] ??= {})[c.rotulo] = valor
    else body[c.campo] = valor
  }
  return body
}

// Campos array<…> não cabem no modo Campos — o editor abre direto no JSON livre
export function pedeJsonLivre(campos) {
  return campos.some(c => c.tipo?.startsWith('array<'))
}
