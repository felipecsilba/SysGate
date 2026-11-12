// Regras puras da sessão do tributos (API da tela). A API de migração não dispara o cadastro único;
// a da tela dispara, mas só aceita o token de sessão de um usuário logado (401 com o token de migração).

export const URL_API = 'https://tributos.betha.cloud/tributos/v1'
export const URL_TELA = 'https://tributos.betha.cloud/'

// As chamadas da própria tela trazem a sessão: Authorization (Bearer <uuid>) + User-Access
export function cabecalhosDaSessao(headers) {
  if (!headers) return null
  const ler = nome => Object.entries(headers).find(([k]) => k.toLowerCase() === nome)?.[1]
  const authorization = ler('authorization')
  const userAccess = ler('user-access')
  if (!/^Bearer \S+/.test(authorization || '') || !userAccess) return null
  return { authorization, userAccess }
}

// A interface só pode pedir o que o estímulo usa: ler e salvar um registro por id (crédito, bairro, logradouro, contribuinte)
const PERMITIDAS = [
  { metodos: ['GET', 'PUT'], path: /^\/api\/cadastros\/creditos-tributarios\/\d+$/ },
  { metodos: ['GET', 'PUT'], path: /^\/api\/cadastros\/enderecos\/(bairros|logradouros)\/\d+$/ },
  { metodos: ['GET', 'PUT'], path: /^\/api\/cadastros\/referentes\/contribuintes\/\d+$/ },
]
export function chamadaPermitida(metodo, path) {
  return PERMITIDAS.some(p => p.metodos.includes(metodo) && p.path.test(String(path)))
}
