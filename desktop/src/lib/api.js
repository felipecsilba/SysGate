import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const { token } = useAuthStore.getState()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().sair()
    }
    return Promise.reject(err)
  }
)

export function mensagemErro(err, padrao = 'Algo deu errado. Tente novamente.') {
  return err.response?.data?.error || (err.request && !err.response ? 'Sem resposta do serviço local.' : padrao)
}

const dados = r => r.data

export const municipiosApi = {
  listar: () => api.get('/municipios').then(dados),
  criar: d => api.post('/municipios', d).then(dados),
  atualizar: (id, d) => api.put(`/municipios/${id}`, d).then(dados),
  ativar: id => api.patch(`/municipios/${id}/ativar`).then(dados),
  excluir: id => api.delete(`/municipios/${id}`).then(dados),
  tokens: id => api.get(`/municipios/${id}/tokens`).then(dados),
  salvarToken: (id, d) => api.post(`/municipios/${id}/tokens`, d).then(dados),
  excluirToken: (id, sistemaId) => api.delete(`/municipios/${id}/tokens/${sistemaId}`).then(dados),
}

export const sistemasApi = {
  listar: () => api.get('/sistemas').then(dados),
  obter: id => api.get(`/sistemas/${id}`).then(dados),
  criar: d => api.post('/sistemas', d).then(dados),
  atualizar: (id, d) => api.put(`/sistemas/${id}`, d).then(dados),
  excluir: id => api.delete(`/sistemas/${id}`).then(dados),
}

export const endpointsApi = {
  listar: sistemaId => api.get('/endpoints', { params: { sistemaId } }).then(dados),
  atualizar: (id, d) => api.put(`/endpoints/${id}`, d).then(dados),
  excluir: id => api.delete(`/endpoints/${id}`).then(dados),
  removerSpec: id => api.delete(`/endpoints/swagger/${id}`).then(dados),
  // Swagger: por URL (o backend baixa) ou pelo conteúdo do arquivo. `preview` só conta, não grava.
  previaUrl: d => api.post('/endpoints/fetch-swagger?preview=true', d).then(dados),
  importarUrl: d => api.post('/endpoints/fetch-swagger', d).then(dados),
  previaArquivo: d => api.post('/endpoints/importar-swagger?preview=true', d).then(dados),
  importarArquivo: d => api.post('/endpoints/importar-swagger', d).then(dados),
}

// Chamada à API do sistema pelo backend local (sai do IP desta máquina, com o token do município)
export const proxyApi = {
  executar: d => api.post('/proxy/executar', d).then(dados),
}

export const requisicoesApi = {
  listar: params => api.get('/requisicoes', { params }).then(dados),
  limpar: params => api.delete('/requisicoes', { params }).then(dados),
}

export const importacaoApi = {
  conectar: d => api.post('/importacao/conectar', d).then(dados),
  executar: d => api.post('/importacao/executar', d).then(dados),
}

export const authApi = {
  login: dados => api.post('/auth/login', { ...dados, lembrar: true }).then(r => r.data),
  setupDisponivel: () => api.get('/auth/setup-local').then(r => r.data.disponivel),
  criarContaLocal: dados => api.post('/auth/setup-local', dados).then(r => r.data),
}
