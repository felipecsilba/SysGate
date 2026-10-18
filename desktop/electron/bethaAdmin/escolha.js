// Escolhas automáticas nos selects do Betha Admin (cad_libconversao_usuario.faces).
// Regra do Felipe: a entidade que importa é sempre a da prefeitura do município
// ("PREFEITURA MUNICIPAL DE …", "PREFEITURA DE …", "MUNICIPIO DE …").
// Ambíguo ou nada encontrado → devolve as opções para ele escolher (e o app lembra).

const normalizar = t => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase()

const PREFIXOS = ['PREFEITURA MUNICIPAL DE ', 'PREFEITURA DE ', 'MUNICIPIO DE ']

export function ehPrefeituraDe(texto, municipio) {
  const t = normalizar(texto)
  const m = normalizar(municipio)
  return !!m && PREFIXOS.some(p => t === p + m)
}

// Onde a escolha fica lembrada: entidade/database por município, sistema pelo nome, revenda única
export function chaveLembranca(etapa, contexto) {
  if (etapa === 'entidade' || etapa === 'database') return `${etapa}|${normalizar(contexto.municipio)}`
  if (etapa === 'sistema') return `sistema|${normalizar(contexto.sistema)}`
  return etapa
}

// etapa: 'revenda' | 'entidade' | 'database' | 'sistema'
// contexto: { municipio, sistema }; lembrado: texto da opção escolhida antes (os valores podem mudar, o texto não)
export function escolherOpcao(etapa, opcoes, contexto, lembrado) {
  const reais = opcoes.filter(o => o.valor && o.valor !== '0')
  if (!reais.length) return { semOpcoes: true }

  if (lembrado) {
    const achada = reais.find(o => normalizar(o.texto) === normalizar(lembrado))
    if (achada) return achada
  }

  let candidatas
  if (etapa === 'entidade' || etapa === 'database') {
    candidatas = reais.filter(o => ehPrefeituraDe(o.texto, contexto.municipio))
    if (!candidatas.length && reais.length === 1) candidatas = reais
  } else if (etapa === 'sistema') {
    candidatas = reais.filter(o => normalizar(o.texto) === normalizar(contexto.sistema))
    if (!candidatas.length) candidatas = reais.filter(o => normalizar(o.texto).includes(normalizar(contexto.sistema)))
    if (!candidatas.length && reais.length === 1) candidatas = reais
  } else {
    candidatas = reais.length === 1 ? reais : []
  }

  return candidatas.length === 1 ? candidatas[0] : { precisaEscolher: true, opcoes: reais }
}
