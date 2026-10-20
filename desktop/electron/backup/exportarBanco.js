import zlib from 'node:zlib'

// Exporta todas as tabelas do schema public para JSON compactado. O Postgres embutido não traz pg_dump; o JSON também
// independe da versão do Postgres e serve de base para restaurar em outra máquina.
// consultar(sql) → linhas (injetado: pg no main, falso nos testes).
//
// SEM SEGREDOS (decisão do Felipe, 2026-10-20): tokens e senhas se pegam de novo — não vão para o backup.
// Regra por NOME de coluna (cobre colunas futuras): senha, token, secret, segredo, password → a coluna é omitida
// (tokens Betha em MunicipioSistema.token, senhaHash e tokens de recuperação de Usuario/Solicitante).
// Cabeçalhos do histórico (Requisicao.headers) já são gravados mascarados; aqui se mascara de novo, por garantia.

export const COLUNA_SECRETA = /(senha|token|secret|segredo|password)/i
const CABECALHO_SECRETO = /(authorization|token|cookie|senha|secret|password|api-?key)/i
const OMITIDO = '[omitido no backup]'

function limparCabecalhos(valor) {
  if (valor == null || valor === '') return valor
  try {
    const obj = typeof valor === 'string' ? JSON.parse(valor) : valor
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return OMITIDO
    const limpo = Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, CABECALHO_SECRETO.test(k) ? OMITIDO : v]))
    return typeof valor === 'string' ? JSON.stringify(limpo) : limpo
  } catch {
    return OMITIDO // não deu para ler: não arrisca
  }
}

export async function exportarBanco(consultar) {
  const tabelas = (await consultar(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
  )).map(t => t.table_name)

  const dados = { formato: 'krakion-banco-v2', geradoEm: new Date().toISOString(), omitidos: {}, tabelas: {} }
  const contagens = {}
  for (const t of tabelas) {
    const linhas = await consultar(`SELECT * FROM "${t.replace(/"/g, '""')}"`)
    const secretas = linhas.length ? Object.keys(linhas[0]).filter(c => COLUNA_SECRETA.test(c)) : []
    if (secretas.length) dados.omitidos[t] = secretas
    dados.tabelas[t] = linhas.map(l => {
      const copia = { ...l }
      for (const c of secretas) delete copia[c]
      if ('headers' in copia) copia.headers = limparCabecalhos(copia.headers)
      return copia
    })
    contagens[t] = linhas.length
  }
  return { conteudo: zlib.gzipSync(Buffer.from(JSON.stringify(dados))), contagens }
}
