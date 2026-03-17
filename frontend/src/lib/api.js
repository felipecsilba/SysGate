import axios from 'axios'
import useAuthStore from '../stores/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Injeta token JWT em toda requisição
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Trata erros de resposta — 401 força logout
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    const msg = err.response?.data?.error || err.message || 'Erro de conexão'
    return Promise.reject(new Error(msg))
  }
)

// Auth
export const authApi = {
  login: (login, senha) => api.post('/auth/login', { login, senha }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
}

// Usuários (admin)
export const usuariosApi = {
  listar: () => api.get('/usuarios').then((r) => r.data),
  criar: (data) => api.post('/usuarios', data).then((r) => r.data),
  atualizar: (id, data) => api.put(`/usuarios/${id}`, data).then((r) => r.data),
  alterarSenha: (id, novaSenha) => api.patch(`/usuarios/${id}/senha`, { novaSenha }).then((r) => r.data),
  deletar: (id) => api.delete(`/usuarios/${id}`).then((r) => r.data),
}

// Municípios
export const municipiosApi = {
  listar: () => api.get('/municipios').then((r) => r.data),
  ativo: () => api.get('/municipios/ativo').then((r) => r.data),
  obter: (id) => api.get(`/municipios/${id}`).then((r) => r.data),
  criar: (data) => api.post('/municipios', data).then((r) => r.data),
  atualizar: (id, data) => api.put(`/municipios/${id}`, data).then((r) => r.data),
  ativar: (id) => api.patch(`/municipios/${id}/ativar`).then((r) => r.data),
  deletar: (id) => api.delete(`/municipios/${id}`).then((r) => r.data),
  tokens: (id) => api.get(`/municipios/${id}/tokens`).then((r) => r.data),
  salvarToken: (id, data) => api.post(`/municipios/${id}/tokens`, data).then((r) => r.data),
  removerToken: (id, sistemaId) => api.delete(`/municipios/${id}/tokens/${sistemaId}`).then((r) => r.data),
}

// Endpoints
export const endpointsApi = {
  listar: (modulo, sistemaId) =>
    api.get('/endpoints', {
      params: { ...(modulo && { modulo }), ...(sistemaId && { sistemaId }) },
    }).then((r) => r.data),
  modulos: (sistemaId) =>
    api.get('/endpoints/modulos', { params: sistemaId ? { sistemaId } : {} }).then((r) => r.data),
  obter: (id) => api.get(`/endpoints/${id}`).then((r) => r.data),
  criar: (data) => api.post('/endpoints', data).then((r) => r.data),
  atualizar: (id, data) => api.put(`/endpoints/${id}`, data).then((r) => r.data),
  deletar: (id) => api.delete(`/endpoints/${id}`).then((r) => r.data),
  importar: (data) => api.post('/endpoints/importar', data).then((r) => r.data),
  // Swagger / OpenAPI
  swaggerListar: () => api.get('/endpoints/swagger').then((r) => r.data),
  swaggerDeletar: (id) => api.delete(`/endpoints/swagger/${id}`).then((r) => r.data),
  swaggerPreview: (nome, spec) =>
    api.post('/endpoints/importar-swagger?preview=true', { nome, spec }).then((r) => r.data),
  swaggerImportar: (nome, spec, sistemaId) =>
    api.post('/endpoints/importar-swagger', { nome, spec, sistemaId }).then((r) => r.data),
  // Fetch por URL (server-side, sem CORS)
  swaggerFetchUrl: (url, nome, headers, sistemaId) =>
    api.post('/endpoints/fetch-swagger', { url, nome, headers, sistemaId }).then((r) => r.data),
  swaggerFetchUrlPreview: (url, nome, headers) =>
    api.post('/endpoints/fetch-swagger?preview=true', { url, nome, headers }).then((r) => r.data),
  // Limpa todos endpoints e specs importadas
  limparTudo: () => api.delete('/endpoints/limpar-tudo').then((r) => r.data),
}

// Sistemas
export const sistemasApi = {
  listar: () => api.get('/sistemas').then((r) => r.data),
  obter: (id) => api.get(`/sistemas/${id}`).then((r) => r.data),
  criar: (data) => api.post('/sistemas', data).then((r) => r.data),
  atualizar: (id, data) => api.put(`/sistemas/${id}`, data).then((r) => r.data),
  deletar: (id) => api.delete(`/sistemas/${id}`).then((r) => r.data),
}

// Proxy
export const proxyApi = {
  executar: (data) => api.post('/proxy/executar', data).then((r) => r.data),
}

// Requisições
export const requisicoesApi = {
  listar: (params) => api.get('/requisicoes', { params }).then((r) => r.data),
  limpar: (municipioId) =>
    api.delete('/requisicoes', { params: municipioId ? { municipioId } : {} }).then((r) => r.data),
}

// Scripts
export const scriptsApi = {
  listar: (params) => api.get('/scripts', { params }).then((r) => r.data),
  tags: () => api.get('/scripts/tags').then((r) => r.data),
  obter: (id) => api.get(`/scripts/${id}`).then((r) => r.data),
  criar: (data) => api.post('/scripts', data).then((r) => r.data),
  atualizar: (id, data) => api.put(`/scripts/${id}`, data).then((r) => r.data),
  deletar: (id) => api.delete(`/scripts/${id}`).then((r) => r.data),
  importar: (data) => api.post('/scripts/importar', data).then((r) => r.data),
}

export default api
