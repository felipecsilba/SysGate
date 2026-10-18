// Checagem Por API — regras de tela puras (cadastros da spec, marcações de campo).
import { normalizar } from './texto.js'

// Rótulos do motor de spec do backend (lib/checagem.js)
export const ROTULO_SPEC = {
  obrigatorio: 'Campo obrigatório',
  enum: 'Valor inválido',
  tipo: 'Tipo incorreto',
  desconhecido: 'Campo inexistente',
}

// O módulo vem do Swagger como "dividas (Inscrição em dívida)" — a parte legível está nos parênteses
export function nomeModulo(m) {
  const r = /^\S+\s+\((.+)\)$/.exec(m || '')
  return r ? r[1] : (m || 'Geral')
}

// Os endpoints de criação repetem "Cria um registro de " — sobra só o que identifica
export function nomeCadastro(c) {
  return (c.nome || '').replace(/^Cria um registro de\s+/i, '').trim() || c.path
}

export function opcoesCadastros(cadastros) {
  return cadastros
    .map(c => ({
      valor: c.path,
      rotulo: [nomeCadastro(c), nomeModulo(c.modulo), c.marcacoes ? `${c.marcacoes} marcado${c.marcacoes > 1 ? 's' : ''}` : null].filter(Boolean).join(' · '),
    }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'))
}

// Igual à spec e sem explicação: o catálogo guarda só o que difere da spec ou carrega motivo
export function marcacaoRedundante(campo, obrigatorio, observacao) {
  return obrigatorio === campo.obrigatorioSpec && !observacao?.trim()
}

export function aplicarMarcacao(campos, caminho, obrigatorio, observacao) {
  return campos.map(c => (c.caminho === caminho
    ? { ...c, obrigatorio, observacao: observacao || '', marcado: !marcacaoRedundante(c, obrigatorio, observacao) }
    : c))
}

export function filtrarCamposSpec(campos, { busca = '', soObrigatorios = false } = {}) {
  const t = normalizar(busca)
  return campos.filter(c =>
    (!soObrigatorios || c.obrigatorio) &&
    (!t || normalizar(c.caminho).includes(t) || normalizar(c.descricao).includes(t)))
}
