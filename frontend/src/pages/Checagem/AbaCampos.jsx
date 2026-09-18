import { useState, useEffect, useMemo } from 'react'
import { checagemApi } from '../../lib/api'

const CORES_TIPO = {
  string: 'bg-emerald-100 text-emerald-700',
  integer: 'bg-blue-100 text-blue-700',
  number: 'bg-blue-100 text-blue-700',
  boolean: 'bg-orange-100 text-orange-700',
  object: 'bg-purple-100 text-purple-700',
}

const corTipo = t => CORES_TIPO[t] || 'bg-indigo-100 text-indigo-700'

function Toggle({ ligado, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      disabled={disabled}
      onClick={() => onChange(!ligado)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:opacity-40 ${
        ligado ? 'bg-sysgate-600' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
        ligado ? 'translate-x-5' : 'translate-x-1'
      }`} />
    </button>
  )
}

export default function AbaCampos({ sistemaId, path, onMarcacaoSalva }) {
  const [campos, setCampos] = useState([])
  const [busca, setBusca] = useState('')
  const [soObrigatorios, setSoObrigatorios] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(null)
  const [editandoObs, setEditandoObs] = useState(null)
  const [rascunhoObs, setRascunhoObs] = useState('')

  const carregar = () => {
    setCarregando(true)
    checagemApi.campos({ sistemaId, path })
      .then(r => setCampos(r.campos))
      .catch(() => setCampos([]))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [sistemaId, path])

  const salvar = async (campo, obrigatorio, observacao) => {
    setSalvando(campo.caminho)
    try {
      // Sem marcação e igual à spec: remove o registro em vez de guardar redundância.
      if (obrigatorio === campo.obrigatorioSpec && !observacao?.trim()) {
        await checagemApi.removerCampo({ sistemaId, path, campo: campo.caminho })
      } else {
        await checagemApi.salvarCampo({ sistemaId, path, campo: campo.caminho, obrigatorio, observacao })
      }
      setCampos(atual => atual.map(c =>
        c.caminho === campo.caminho
          ? { ...c, obrigatorio, observacao: observacao || '', marcado: obrigatorio !== c.obrigatorioSpec || !!observacao?.trim() }
          : c
      ))
      onMarcacaoSalva?.()
    } catch (e) {
      alert(`Não foi possível salvar: ${e.response?.data?.error || e.message}`)
    } finally {
      setSalvando(null)
    }
  }

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return campos.filter(c => {
      if (soObrigatorios && !c.obrigatorio) return false
      if (!termo) return true
      return c.caminho.toLowerCase().includes(termo) || (c.descricao || '').toLowerCase().includes(termo)
    })
  }, [campos, busca, soObrigatorios])

  const totalMarcados = campos.filter(c => c.marcado).length

  return (
    <div className="card p-0 flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar campo..."
          className="input text-sm w-56"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={soObrigatorios}
            onChange={e => setSoObrigatorios(e.target.checked)}
            className="rounded border-gray-300 text-sysgate-600" />
          Só obrigatórios
        </label>
        <div className="ml-auto text-xs text-gray-500">
          {visiveis.length} de {campos.length} campos
          {totalMarcados > 0 && (
            <span className="ml-2 badge-blue">{totalMarcados} marcado{totalMarcados > 1 ? 's' : ''} por você</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {carregando ? (
          <p className="text-sm text-gray-400 text-center mt-10">Carregando campos...</p>
        ) : visiveis.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-10">Nenhum campo encontrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-2 font-medium">Campo</th>
                <th className="px-3 py-2 font-medium w-20">Tipo</th>
                <th className="px-3 py-2 font-medium w-28">Obrigatório</th>
                <th className="px-4 py-2 font-medium">O que quebra sem ele</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visiveis.map(c => {
                const editando = editandoObs === c.caminho
                return (
                  <tr key={c.caminho} className={c.marcado ? 'bg-sysgate-50/40' : ''}>
                    <td className="px-4 py-2">
                      <code className="font-mono text-xs text-gray-800">{c.caminho}</code>
                      {c.descricao && <p className="text-xs text-gray-400 mt-0.5">{c.descricao}</p>}
                      {c.enum && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate" title={c.enum.join(', ')}>
                          valores: {c.enum.slice(0, 4).join(', ')}{c.enum.length > 4 ? `  +${c.enum.length - 4}` : ''}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`${corTipo(c.tipo)} px-1.5 py-0.5 rounded text-[11px] font-medium`}>
                        {c.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Toggle
                          ligado={c.obrigatorio}
                          disabled={salvando === c.caminho}
                          onChange={val => salvar(c, val, c.observacao)}
                        />
                        <span className="text-[11px] text-gray-400">
                          {c.obrigatorioSpec ? 'spec' : c.marcado ? 'você' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {editando ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={rascunhoObs}
                            onChange={e => setRascunhoObs(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { salvar(c, c.obrigatorio, rascunhoObs); setEditandoObs(null) }
                              if (e.key === 'Escape') setEditandoObs(null)
                            }}
                            placeholder="Ex: sem isso o débito não cancela pela rotina"
                            className="input text-xs flex-1"
                          />
                          <button
                            onClick={() => { salvar(c, c.obrigatorio, rascunhoObs); setEditandoObs(null) }}
                            className="btn btn-primary text-xs">Salvar</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditandoObs(c.caminho); setRascunhoObs(c.observacao || '') }}
                          className="text-left w-full text-xs hover:text-sysgate-700 transition"
                        >
                          {c.observacao
                            ? <span className="text-gray-700">{c.observacao}</span>
                            : <span className="text-gray-300">+ explicar</span>}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
