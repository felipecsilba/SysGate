const ehObjeto = v => v !== null && typeof v === 'object' && !Array.isArray(v)

const ehVazio = v =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

/**
 * Converte o bodySchema do parser Swagger numa lista plana com caminhos
 * pontilhados (dividas.sistemaOrigem), descartando o sentinel _exemplo.
 */
function achatarCampos(bodySchema, prefixo = '') {
  if (!Array.isArray(bodySchema)) return []

  const saida = []
  for (const def of bodySchema) {
    if (!def || def._exemplo || !def.campo) continue

    const caminho = prefixo ? `${prefixo}.${def.campo}` : def.campo
    saida.push({
      caminho,
      campo: def.campo,
      tipo: def.tipo || 'string',
      obrigatorioSpec: def.obrigatorio === true,
      descricao: def.descricao || '',
      enum: Array.isArray(def.enum) ? def.enum : null,
    })

    if (Array.isArray(def.subFields) && def.subFields.length) {
      saida.push(...achatarCampos(def.subFields, caminho))
    }
  }
  return saida
}

function valorEm(objeto, caminho) {
  return caminho.split('.').reduce((cur, parte) => (ehObjeto(cur) ? cur[parte] : undefined), objeto)
}

function distancia(a, b) {
  const linha = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0]
    linha[0] = i
    for (let j = 1; j <= b.length; j++) {
      const temp = linha[j]
      linha[j] = a[i - 1] === b[j - 1]
        ? anterior
        : 1 + Math.min(anterior, linha[j], linha[j - 1])
      anterior = temp
    }
  }
  return linha[b.length]
}

function sugerirCampo(nome, irmaos) {
  const alvo = nome.toLowerCase()

  const porPrefixo = irmaos.filter(c => {
    const o = c.toLowerCase()
    return o !== alvo && (o.startsWith(alvo) || alvo.startsWith(o))
  })
  if (porPrefixo.length) {
    return porPrefixo.sort((a, b) => Math.abs(a.length - nome.length) - Math.abs(b.length - nome.length))[0]
  }

  let melhor = null
  let menor = Infinity
  for (const c of irmaos) {
    const d = distancia(alvo, c.toLowerCase())
    const limite = Math.max(2, Math.floor(Math.max(nome.length, c.length) / 4))
    if (d < menor && d <= limite) {
      menor = d
      melhor = c
    }
  }
  return melhor
}

/**
 * Compara o valor com o tipo declarado na spec.
 * Retorna null, ou { severidade, detalhe } — alerta quando o valor é
 * convertível (string numérica), erro quando não é.
 */
function conferirTipo(valor, tipo) {
  if (tipo.startsWith('array<')) {
    return Array.isArray(valor) ? null : { severidade: 'erro', detalhe: `esperado array, recebido ${typeof valor}` }
  }

  if (tipo === 'object') {
    return ehObjeto(valor) ? null : { severidade: 'erro', detalhe: `esperado objeto, recebido ${typeof valor}` }
  }

  if (tipo === 'integer' || tipo === 'number') {
    if (typeof valor === 'number') {
      if (tipo === 'integer' && !Number.isInteger(valor)) {
        return { severidade: 'erro', detalhe: `esperado inteiro, recebido decimal ${valor}` }
      }
      return null
    }
    if (typeof valor === 'string') {
      if (!/^-?\d+(\.\d+)?$/.test(valor.trim())) {
        return { severidade: 'erro', detalhe: `"${valor}" não é um número válido — esperado ${tipo}` }
      }
      if (tipo === 'integer' && !Number.isInteger(Number(valor))) {
        return { severidade: 'erro', detalhe: `esperado inteiro, recebido decimal "${valor}"` }
      }
      return { severidade: 'alerta', detalhe: `enviado como texto "${valor}" — esperado ${tipo}` }
    }
    return { severidade: 'erro', detalhe: `esperado ${tipo}, recebido ${typeof valor}` }
  }

  if (tipo === 'boolean') {
    if (typeof valor === 'boolean') return null
    if (valor === 'true' || valor === 'false') {
      return { severidade: 'alerta', detalhe: `enviado como texto "${valor}" — esperado boolean` }
    }
    return { severidade: 'erro', detalhe: `esperado boolean, recebido ${typeof valor}` }
  }

  if (tipo === 'string') {
    if (typeof valor === 'string') return null
    if (typeof valor === 'number' || typeof valor === 'boolean') {
      return { severidade: 'alerta', detalhe: `enviado como ${typeof valor} — esperado texto` }
    }
    return { severidade: 'erro', detalhe: `esperado texto, recebido ${Array.isArray(valor) ? 'array' : typeof valor}` }
  }

  return null
}

function coletarDesconhecidos(objeto, conhecidos, prefixo, achados) {
  if (!ehObjeto(objeto)) return

  const irmaos = [...conhecidos]
    .filter(c => (prefixo ? c.startsWith(`${prefixo}.`) : !c.includes('.')))
    .map(c => (prefixo ? c.slice(prefixo.length + 1) : c))
    .filter(c => !c.includes('.'))

  for (const chave of Object.keys(objeto)) {
    const caminho = prefixo ? `${prefixo}.${chave}` : chave

    if (!conhecidos.has(caminho)) {
      const sugestao = sugerirCampo(chave, irmaos)
      achados.push({
        severidade: 'alerta',
        tipo: 'desconhecido',
        campo: caminho,
        mensagem: `Campo "${chave}" não existe neste cadastro`,
        detalhe: sugestao ? `Você quis dizer "${sugestao}"?` : null,
        sugestao: sugestao || null,
        origem: 'spec',
      })
      continue
    }

    coletarDesconhecidos(objeto[chave], conhecidos, caminho, achados)
  }
}

function validarItem(payload, campos, marcacoes) {
  const achados = []
  const paisAusentes = new Set()

  for (const campo of campos) {
    const pai = campo.caminho.includes('.')
      ? campo.caminho.slice(0, campo.caminho.lastIndexOf('.'))
      : null

    if (pai && [...paisAusentes].some(p => pai === p || pai.startsWith(`${p}.`))) continue

    const marcacao = marcacoes.get(campo.caminho)
    const obrigatorio = marcacao ? marcacao.obrigatorio === true : campo.obrigatorioSpec
    const valor = valorEm(payload, campo.caminho)

    if (ehVazio(valor)) {
      if (campo.tipo === 'object') paisAusentes.add(campo.caminho)

      if (obrigatorio) {
        const porMarcacao = !!marcacao && marcacao.obrigatorio === true && !campo.obrigatorioSpec
        achados.push({
          severidade: 'erro',
          tipo: 'obrigatorio',
          campo: campo.caminho,
          mensagem: `Campo obrigatório "${campo.campo}" não foi informado`,
          detalhe: porMarcacao
            ? (marcacao.observacao || 'Marcado como obrigatório na aba Campos')
            : (campo.descricao || null),
          origem: porMarcacao ? 'marcacao' : 'spec',
        })
      }
      continue
    }

    if (campo.enum && !campo.enum.includes(String(valor))) {
      achados.push({
        severidade: 'erro',
        tipo: 'enum',
        campo: campo.caminho,
        mensagem: `Valor "${valor}" não é aceito em "${campo.campo}"`,
        detalhe: `Valores válidos: ${campo.enum.join(', ')}`,
        origem: 'spec',
      })
      continue
    }

    const problema = conferirTipo(valor, campo.tipo)
    if (problema) {
      achados.push({
        severidade: problema.severidade,
        tipo: 'tipo',
        campo: campo.caminho,
        mensagem: `Tipo incorreto em "${campo.campo}"`,
        detalhe: problema.detalhe,
        origem: 'spec',
      })
    }
  }

  coletarDesconhecidos(payload, new Set(campos.map(c => c.caminho)), '', achados)
  return achados
}

/**
 * Aplica as duas camadas de checagem sobre um payload.
 * campos    — saída de achatarCampos()
 * marcacoes — [{ campo, obrigatorio, observacao }] do catálogo global
 */
function validarPayload({ payload, campos, marcacoes = [] }) {
  const mapa = new Map(marcacoes.map(m => [m.campo, m]))

  const achados = Array.isArray(payload)
    ? payload.flatMap((item, indice) =>
        validarItem(item, campos, mapa).map(a => ({ ...a, indice })))
    : validarItem(payload, campos, mapa)

  const erros = achados.filter(a => a.severidade === 'erro').length

  return {
    resumo: { erros, alertas: achados.length - erros, total: achados.length },
    achados,
  }
}

module.exports = { achatarCampos, validarPayload }
