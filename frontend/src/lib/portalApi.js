import axios from 'axios'
import usePortalAuthStore from '../stores/portalAuthStore'

// Cliente HTTP do PORTAL EXTERNO — instância separada do api.js interno:
// injeta o token do solicitante (krakion-portal-auth) e nunca o token da equipe.
const portalApi = axios.create({
  baseURL: '/api/portal',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

portalApi.interceptors.request.use((config) => {
  const token = usePortalAuthStore.getState().token
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// 401 com sessão ativa = token expirado/revogado → encerra a sessão do portal.
// 401 sem token (ex.: falha de login) só propaga o erro para a tela tratar.
portalApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && usePortalAuthStore.getState().token) {
      usePortalAuthStore.getState().logout()
      window.location.href = '/portal/login'
    }
    const msg = err.response?.data?.error || err.message || 'Erro de conexão'
    return Promise.reject(new Error(msg))
  }
)

// Auth do portal
export const portalAuthApi = {
  registrar: (data) => portalApi.post('/auth/registrar', data).then((r) => r.data),
  logout: () => portalApi.post('/auth/logout').then((r) => r.data),
  me: () => portalApi.get('/auth/me').then((r) => r.data),
  esqueciSenha: (email) => portalApi.post('/auth/esqueci-senha', { email }).then((r) => r.data),
  redefinirSenha: (token, novaSenha) =>
    portalApi.post('/auth/redefinir-senha', { token, novaSenha }).then((r) => r.data),
}

// Chamados do portal — sempre escopados ao solicitante do token no backend
export const portalChamadosApi = {
  listar: (params) => portalApi.get('/chamados', { params }).then((r) => r.data),
  obter: (id) => portalApi.get(`/chamados/${id}`).then((r) => r.data),
  criar: (data) => portalApi.post('/chamados', data).then((r) => r.data),
  comentar: (id, data) => portalApi.post(`/chamados/${id}/comentarios`, data).then((r) => r.data),
  criarAnexo: (id, data) => portalApi.post(`/chamados/${id}/anexos`, data).then((r) => r.data),
  baixarAnexo: (aid) =>
    portalApi.get(`/chamados/anexos/${aid}`, { responseType: 'blob' }).then((r) => r.data),
}

export default portalApi
