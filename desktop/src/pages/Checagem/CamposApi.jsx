import { useEffect, useMemo, useState } from 'react'
import Busca from '../../components/Busca'
import { checagemApi, mensagemErro } from '../../lib/api'
import { aplicarMarcacao, filtrarCamposSpec, marcacaoRedundante } from '../../lib/checagem'

// Camada ensinada da frente Por API: a spec Betha é permissiva (POST /api/dividas tem 59 campos e só 15
// obrigatórios), então aqui se marca o que é obrigatório de verdade e o que quebra sem o campo.
function Chave({ ligado, onMudar, desabilitado }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} disabled={desabilitado} onClick={() => onMudar(!ligado)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:opacity-40 ${ligado ? 'bg-acento' : 'bg-texto/[0.15]'}`}>
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition ${ligado ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
    </button>
  )
}

export default function CamposApi({ sistemaId, path, onSalvo }) {
  const [campos, setCampos] = useState(null)
  const [busca, setBusca] = useState('')
  const [soObrigatorios, setSoObrigatorios] = useState(false)
  const [salvando, setSalvando] = useState(null)
  const [editando, setEditando] = useState(null)
  const [rascunho, setRascunho] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    setCampos(null)
    checagemApi.campos({ sistemaId, path })
      .then(r => setCampos(r.campos))
      .catch(e => { setCampos([]); setErro(mensagemErro(e)) })
  }, [sistemaId, path])

  async function salvar(c, obrigatorio, observacao) {
    setSalvando(c.caminho)
    setErro('')
    try {
      if (marcacaoRedundante(c, obrigatorio, observacao)) await checagemApi.removerCampo({ sistemaId, path, campo: c.caminho })
      else await checagemApi.salvarCampo({ sistemaId, path, campo: c.caminho, obrigatorio, observacao })
      setCampos(lista => aplicarMarcacao(lista, c.caminho, obrigatorio, observacao))
      onSalvo?.()
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível salvar.'))
    } finally {
      setSalvando(null)
    }
  }

  function gravarObservacao(c) {
    setEditando(null)
    if ((c.observacao || '') !== rascunho.trim()) salvar(c, c.obrigatorio, rascunho.trim())
  }

  const visiveis = useMemo(() => (campos ? filtrarCamposSpec(campos, { busca, soObrigatorios }) : []), [campos, busca, soObrigatorios])
  const marcados = campos?.filter(c => c.marcado).length ?? 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-borda px-4 py-2">
        <Busca valor={busca} onMudar={setBusca} placeholder="Buscar campo ou descrição…" className="h-8 w-64" />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-suave">
          <input type="checkbox" checked={soObrigatorios} onChange={e => setSoObrigatorios(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--acento))]" />
          Só obrigatórios
        </label>
        {erro && <span className="text-sm text-perigo">{erro}</span>}
        <span className="ml-auto text-xs text-suave">
          {campos ? `${visiveis.length} de ${campos.length} campos` : ''}{marcados > 0 && ` · ${marcados} marcado${marcados > 1 ? 's' : ''} à mão`}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {campos === null ? (
          <p className="py-16 text-center text-sm text-suave">Carregando campos…</p>
        ) : !visiveis.length ? (
          <p className="py-16 text-center text-sm text-suave">Nenhum campo encontrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-fundo">
              <tr className="border-b border-borda text-left text-[11px] uppercase tracking-wider text-suave">
                <th className="px-4 py-2 font-semibold">Campo</th>
                <th className="w-24 px-3 py-2 font-semibold">Tipo</th>
                <th className="w-32 px-3 py-2 font-semibold">Obrigatório</th>
                <th className="px-4 py-2 font-semibold">O que quebra sem ele</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map(c => (
                <tr key={c.caminho} className={`border-b border-borda/60 align-top ${c.marcado ? 'bg-acento-suave/30' : ''}`}>
                  <td className="px-4 py-2">
                    <code className="font-mono text-xs">{c.caminho}</code>
                    {c.descricao && <p className="mt-0.5 text-xs text-suave">{c.descricao}</p>}
                    {c.enum && (
                      <p className="mt-0.5 truncate text-[11px] text-suave/80" title={c.enum.join(', ')}>
                        valores: {c.enum.slice(0, 4).join(', ')}{c.enum.length > 4 ? `  +${c.enum.length - 4}` : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-suave">{c.tipo}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Chave ligado={c.obrigatorio} desabilitado={salvando === c.caminho} onMudar={v => salvar(c, v, c.observacao)} />
                      <span className="text-[11px] text-suave">{c.obrigatorioSpec ? 'spec' : c.marcado && c.obrigatorio ? 'marcado' : ''}</span>
                    </div>
                  </td>
                  <td className="px-4 py-1.5">
                    {editando === c.caminho ? (
                      <input
                        autoFocus
                        value={rascunho}
                        onChange={e => setRascunho(e.target.value)}
                        onBlur={() => gravarObservacao(c)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') e.currentTarget.blur()
                          if (e.key === 'Escape') { e.stopPropagation(); setEditando(null) }
                        }}
                        placeholder="Ex.: sem isso o débito não cancela pela rotina"
                        className="campo h-8 text-xs"
                      />
                    ) : (
                      <button type="button" onClick={() => { setEditando(c.caminho); setRascunho(c.observacao || '') }}
                        className="w-full rounded-lg px-1 py-1 text-left text-xs hover:bg-texto/[0.04]">
                        {c.observacao ? c.observacao : <span className="text-suave/60">+ explicar</span>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
