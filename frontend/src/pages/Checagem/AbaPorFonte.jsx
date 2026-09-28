import { useState, useEffect } from 'react'
import { checagemApi } from '../../lib/api'
import ConstrutorScript from './ConstrutorScript'
import { SEV, NOTA_CONFIG, Regra } from './LaudoRegras'

export default function AbaPorFonte({ sistemaId, cadastro }) {
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [verificando, setVerificando] = useState(false)
  const [regrasCadastradas, setRegrasCadastradas] = useState([])
  const [construtorAberto, setConstrutorAberto] = useState(false)

  useEffect(() => {
    setResultado(null)
    setErro(null)
    if (!sistemaId || !cadastro) { setRegrasCadastradas([]); return }
    checagemApi.regras({ sistemaId, frente: 'fonte', cadastro })
      .then(setRegrasCadastradas)
      .catch(() => setRegrasCadastradas([]))
  }, [sistemaId, cadastro])

  const verificar = async () => {
    setErro(null)
    setResultado(null)
    if (!texto.trim()) { setErro('Cole a saída do script antes de verificar.'); return }
    setVerificando(true)
    try {
      setResultado(await checagemApi.verificar({ sistemaId, frente: 'fonte', cadastro, texto }))
    } catch (e) {
      const d = e.response?.data
      setErro(d?.detalhe ? `${d.error} ${d.detalhe}` : (d?.error || e.message))
    } finally {
      setVerificando(false)
    }
  }

  if (!cadastro) {
    return <p className="text-sm text-gray-400 text-center mt-10">Escolha um cadastro para começar.</p>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-4 items-start">
      {construtorAberto && (
        <ConstrutorScript sistemaId={sistemaId} onFechar={() => setConstrutorAberto(false)} />
      )}
      {/* entrada */}
      <div className="card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-200 bg-gradient-to-r from-white to-sysgate-50/30 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-700">Saída do script</span>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-400">
              {regrasCadastradas.length} regra{regrasCadastradas.length !== 1 ? 's' : ''} para <code className="font-mono">{cadastro}</code>
            </span>
            <button onClick={() => setConstrutorAberto(true)} className="text-xs font-medium text-sysgate-600 hover:text-sysgate-800">
              Gerar script de exportação
            </button>
          </div>
        </div>
        <div className="p-4">
          <textarea
            id="entrada-fonte"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            spellCheck={false}
            placeholder={'Cole aqui a saída do BFC-Script.\n\nAceita array JSON, um JSON por linha, ou o log do Studio\ncom a hora na frente:\n\n11:52:01 - {"id":274988488,"credito":"LIDFE"}'}
            className="w-full min-h-[330px] resize-y rounded-lg bg-gray-900 text-gray-200 border-0 p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-sysgate-500"
          />
          <div className="flex gap-2 mt-3 flex-wrap">
            <button onClick={verificar} disabled={verificando} className="btn-primary">
              {verificando ? 'Verificando…' : 'Verificar'}
            </button>
            <button onClick={() => { setTexto(''); setResultado(null); setErro(null) }} className="btn-secondary">
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* laudo */}
      <div className="card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-200 bg-gradient-to-r from-white to-sysgate-50/30 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-700">Laudo</span>
          {resultado && (
            <span className="flex gap-1.5 text-xs ml-auto flex-wrap">
              <span className="badge-gray">{resultado.entrada.registros} registro{resultado.entrada.registros !== 1 ? 's' : ''}</span>
              {resultado.resumo.erros > 0 && <span className={SEV.erro.pill + ' px-2 py-0.5 rounded-full font-medium'}>{resultado.resumo.erros} com falha</span>}
              {resultado.resumo.erros === 0 && <span className={SEV.ok.pill + ' px-2 py-0.5 rounded-full font-medium'}>nenhuma falha</span>}
            </span>
          )}
        </div>

        <div className="p-4 space-y-2">
          {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{erro}</div>}

          {!resultado && !erro && (
            <p className="text-sm text-gray-400 text-center py-10">Cole a saída e clique em Verificar.</p>
          )}

          {resultado && (
            <>
              {resultado.entrada.descartadas > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  {resultado.entrada.descartadas} linha(s) não puderam ser lidas — provavelmente cortadas pelo log.
                  O resto foi analisado normalmente.
                </p>
              )}

              {resultado.regras.length === 0 && (
                <p className="text-sm text-gray-500 py-6 text-center">
                  Nenhuma regra cadastrada para <code className="font-mono">{cadastro}</code> nesta frente.
                </p>
              )}

              {resultado.regras.map((r) => <Regra key={r.regraId} r={r} />)}

              {resultado.notas?.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1 h-4 rounded-full bg-sysgate-600" />
                    <h3 className="text-sm font-semibold text-gray-700">Falta fora do JSON</h3>
                    <span className="text-xs text-gray-400">{resultado.notas.length} observação(ões)</span>
                  </div>
                  <div className="space-y-2">
                    {resultado.notas.map((n) => {
                      const cfg = NOTA_CONFIG[n.tipo] || NOTA_CONFIG.regra
                      return (
                        <div key={n.id} className="border-l-4 border-l-gray-300 bg-gray-50 rounded-r-lg p-3">
                          <span className={`${cfg.cls} px-2 py-0.5 rounded text-[10px] font-bold uppercase`}>{cfg.rotulo}</span>
                          <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-line">{n.texto}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
