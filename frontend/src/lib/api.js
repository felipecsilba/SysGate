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

// Relatórios
export const relatoriosApi = {
  listar: (params) => api.get('/relatorios', { params }).then((r) => r.data),
  obter: (id) => api.get(`/relatorios/${id}`).then((r) => r.data),
  criar: (data) => api.post('/relatorios', data).then((r) => r.data),
  atualizar: (id, data) => api.put(`/relatorios/${id}`, data).then((r) => r.data),
  deletar: (id) => api.delete(`/relatorios/${id}`).then((r) => r.data),
  downloadUrl: (id) => `/api/relatorios/${id}/jxrml`,
}

// Portfólio de Clientes
export const portfolioApi = {
  // Municípios do portfólio
  listar: (busca) => api.get('/portfolio', { params: busca ? { busca } : {} }).then((r) => r.data),
  obter: (id) => api.get(`/portfolio/${id}`).then((r) => r.data),
  criar: (data) => api.post('/portfolio', data).then((r) => r.data),
  atualizar: (id, data) => api.put(`/portfolio/${id}`, data).then((r) => r.data),
  deletar: (id) => api.delete(`/portfolio/${id}`).then((r) => r.data),
  // Entidades do município
  entidades: (id) => api.get(`/portfolio/${id}/entidades`).then((r) => r.data),
  criarEntidade: (id, data) => api.post(`/portfolio/${id}/entidades`, data).then((r) => r.data),
  // Entidade por ID
  obterEntidade: (eid) => api.get(`/portfolio/entidades/${eid}`).then((r) => r.data),
  atualizarEntidade: (eid, data) => api.put(`/portfolio/entidades/${eid}`, data).then((r) => r.data),
  deletarEntidade: (eid) => api.delete(`/portfolio/entidades/${eid}`).then((r) => r.data),
  // Sistemas da entidade
  sistemas: (eid) => api.get(`/portfolio/entidades/${eid}/sistemas`).then((r) => r.data),
  criarSistema: (eid, data) => api.post(`/portfolio/entidades/${eid}/sistemas`, data).then((r) => r.data),
  atualizarSistema: (sid, data) => api.put(`/portfolio/sistemas/${sid}`, data).then((r) => r.data),
  deletarSistema: (sid) => api.delete(`/portfolio/sistemas/${sid}`).then((r) => r.data),
  // Stakeholders da entidade
  stakeholders: (eid) => api.get(`/portfolio/entidades/${eid}/stakeholders`).then((r) => r.data),
  criarStakeholder: (eid, data) => api.post(`/portfolio/entidades/${eid}/stakeholders`, data).then((r) => r.data),
  atualizarStakeholder: (shid, data) => api.put(`/portfolio/stakeholders/${shid}`, data).then((r) => r.data),
  deletarStakeholder: (shid) => api.delete(`/portfolio/stakeholders/${shid}`).then((r) => r.data),
}

// Catálogo de Verticais Betha
export const catalogoApi = {
  listar:    ()         => api.get('/catalogo').then((r) => r.data),
  criar:     (data)     => api.post('/catalogo', data).then((r) => r.data),
  atualizar: (id, data) => api.put(`/catalogo/${id}`, data).then((r) => r.data),
  deletar:   (id)       => api.delete(`/catalogo/${id}`),
}

// Solicitantes externos
export const solicitantesApi = {
  listar:    (params) => api.get('/solicitantes', { params }).then(r => r.data),
  criar:     (data)   => api.post('/solicitantes', data).then(r => r.data),
  atualizar: (id, data) => api.put(`/solicitantes/${id}`, data).then(r => r.data),
  deletar:   (id)     => api.delete(`/solicitantes/${id}`).then(r => r.data),
}

// Chamados (Tickets)
export const chamadosApi = {
  listar:            (params) => api.get('/chamados', { params }).then(r => r.data),
  obter:             (id) => api.get(`/chamados/${id}`).then(r => r.data),
  criar:             (data) => api.post('/chamados', data).then(r => r.data),
  atualizar:         (id, data) => api.put(`/chamados/${id}`, data).then(r => r.data),
  deletar:           (id) => api.delete(`/chamados/${id}`).then(r => r.data),
  estatisticas:      () => api.get('/chamados/estatisticas').then(r => r.data),
  dashboard:         () => api.get('/chamados/dashboard').then(r => r.data),
  historico:         (id) => api.get(`/chamados/${id}/historico`).then(r => r.data),
  criarComentario:   (id, data) => api.post(`/chamados/${id}/comentarios`, data).then(r => r.data),
  deletarComentario: (cid) => api.delete(`/chamados/comentarios/${cid}`).then(r => r.data),
  criarAnexo:        (id, data) => api.post(`/chamados/${id}/anexos`, data).then(r => r.data),
  deletarAnexo:      (aid) => api.delete(`/chamados/anexos/${aid}`).then(r => r.data),
}

export default api
