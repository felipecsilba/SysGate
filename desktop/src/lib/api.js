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

// Notas do usuário local (o backend também filtra, mas aqui a busca é feita na tela)
export const notasApi = {
  listar: () => api.get('/notas').then(dados),
  criar: d => api.post('/notas', d).then(dados),
  atualizar: (id, d) => api.put(`/notas/${id}`, d).then(dados),
  fixar: id => api.patch(`/notas/${id}/fixar`).then(dados),
  excluir: id => api.delete(`/notas/${id}`).then(dados),
}

// Base de conhecimento: carrega tudo de uma vez (busca e filtros na tela, instantâneos)
export const conhecimentoApi = {
  listar: () => api.get('/conhecimento', { params: { limite: 100000 } }).then(r => r.data.data),
  criar: d => api.post('/conhecimento', d).then(dados),
  atualizar: (id, d) => api.put(`/conhecimento/${id}`, d).then(dados),
  excluir: id => api.delete(`/conhecimento/${id}`).then(dados),
}

// Checagem: regras, notas e catálogo de fontes vêm da importação; /verificar não grava nada
export const checagemApi = {
  regras: params => api.get('/checagem/regras', { params }).then(dados),
  verificar: d => api.post('/checagem/verificar', d).then(dados),
  fontes: params => api.get('/checagem/fontes', { params }).then(dados),
  fonte: id => api.get(`/checagem/fontes/${id}`).then(dados),
  // Frente Por API: cadastros da spec e marcações de campo (catálogo global, fica nesta máquina)
  cadastros: params => api.get('/checagem/cadastros', { params }).then(dados),
  campos: params => api.get('/checagem/campos', { params }).then(dados),
  salvarCampo: d => api.put('/checagem/campos', d).then(dados),
  removerCampo: d => api.delete('/checagem/campos', { data: d }).then(dados),
}

// Verticais Betha (nome, cor, sistemas) — o backend cria as 9 oficiais na 1ª leitura
export const catalogoApi = {
  listar: () => api.get('/catalogo').then(dados),
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
