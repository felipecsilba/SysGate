// Regras do módulo Histórico (requisições já executadas pelo proxy).
import { contem } from './texto.js'

// 2xx = sucesso; o resto (4xx, 5xx, sem resposta) = erro
export function situacao(statusCode) {
  return statusCode >= 200 && statusCode < 300 ? 'sucesso' : 'erro'
}

export function filtrarHistorico(itens, { busca = '', sistemaId, situacao: sit } = {}) {
  return itens.filter(r =>
    (!sistemaId || r.sistema?.id === Number(sistemaId)) &&
    (!sit || situacao(r.statusCode) === sit) &&
    (!busca.trim() || [r.url, r.idGerado, r.endpoint?.nome, r.metodo].some(t => t && contem(t, busca)))
  )
}

const dia = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

// Itens já vêm do mais novo ao mais antigo; grupos na mesma ordem, pelo dia LOCAL
export function agruparPorDia(itens, agora = new Date()) {
  const hoje = dia(agora)
  const grupos = []
  for (const r of itens) {
    const data = new Date(r.criadoEm)
    const diff = Math.round((hoje - dia(data)) / 86400000)
    const rotulo = diff === 0 ? 'Hoje' : diff === 1 ? 'Ontem' : data.toLocaleDateString('pt-BR')
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.rotulo === rotulo) ultimo.itens.push(r)
    else grupos.push({ rotulo, itens: [r] })
  }
  return grupos
}
