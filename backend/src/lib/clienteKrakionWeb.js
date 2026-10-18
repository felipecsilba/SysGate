// Cliente HTTP do Krakion web (VPS), usado pela importação do Krakion Desktop.
// Roda no backend local — a tela nunca fala com a VPS diretamente.

const TIMEOUT_MS = 30000

function erro(mensagem, status = 400) {
  return Object.assign(new Error(mensagem), { status })
}

// Aceita "krakionlabs.cloud", "https://krakionlabs.cloud/login"… → "https://krakionlabs.cloud"
function normalizarUrl(url) {
  let texto = String(url ?? '').trim()
  if (texto && !/^[a-z][a-z0-9+.-]*:/i.test(texto)) texto = 'https://' + texto
  let u
  try { u = new URL(texto) } catch { throw erro('Informe um endereço válido do Krakion web (ex.: https://krakionlabs.cloud).') }
  if (!['http:', 'https:'].includes(u.protocol)) {
    throw erro('O endereço precisa começar com http:// ou https://.')
  }
  return u.origin
}

async function chamar(base, caminho, { token, metodo = 'GET', corpo } = {}) {
  let resp
  try {
    resp = await fetch(base + caminho, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (e) {
    throw erro(`Não foi possível falar com ${base} (${e.name === 'TimeoutError' ? 'tempo esgotado' : 'sem conexão'}).`, 502)
  }
  const dados = await resp.json().catch(() => null)
  if (!resp.ok) {
    if (resp.status === 401) throw erro(caminho.includes('/auth/login')
      ? (dados?.error === 'Credenciais inválidas' ? 'Login ou senha inválidos no Krakion web.' : `Krakion web: ${dados?.error || 'acesso negado'}`)
      : 'A sessão no Krakion web expirou. Conecte de novo.', 401)
    throw erro(`Krakion web respondeu ${resp.status}${dados?.error ? `: ${dados.error}` : ''}.`, 502)
  }
  return dados
}

async function entrar(url, login, senha) {
  const base = normalizarUrl(url)
  const r = await chamar(base, '/api/auth/login', { metodo: 'POST', corpo: { login, senha } })
  if (!r?.token) throw erro('O Krakion web não devolveu um token de acesso.', 502)
  return { base, token: r.token, usuario: r.usuario }
}

// Tudo que a importação usa, com os tokens de cada município (só os do usuário logado na VPS)
async function buscarTudo(url, token) {
  const base = normalizarUrl(url)
  const [sistemas, endpoints, municipios] = await Promise.all([
    chamar(base, '/api/sistemas', { token }),
    chamar(base, '/api/endpoints', { token }),
    chamar(base, '/api/municipios', { token }),
  ])
  const comTokens = await Promise.all(
    municipios.map(async m => ({ ...m, tokens: await chamar(base, `/api/municipios/${m.id}/tokens`, { token }) }))
  )
  return { sistemas, endpoints, municipios: comTokens }
}

module.exports = { normalizarUrl, entrar, buscarTudo }
