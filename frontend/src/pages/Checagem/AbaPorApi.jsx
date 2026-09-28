import { useState, useEffect } from 'react'
import { checagemApi } from '../../lib/api'
import { SEV, NOTA_CONFIG, Regra } from './LaudoRegras'

// Rótulos do motor de spec (lib/checagem.js), que continua valendo aqui: é o
// único lugar onde a spec tem autoridade, porque só o payload de migração é
// escrito na língua dela.
const ROTULO_SPEC = {
  obrigatorio: 'Campo obrigatório',
  enum: 'Valor inválido',
  tipo: 'Tipo incorreto',
  desconhecido: 'Campo inexistente',
}

export default function AbaPorApi({ sistemaId, path }) {
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [verificando, setVerificando] = useState(false)
  const [regrasCadastradas, setRegrasCadastradas] = useState([])

  useEffect(() => {
    setResultado(null)
    setErro(null)
    if (!sistemaId || !path) { setRegrasCadastradas([]); return }
    checagemApi.regras({ sistemaId, frente: 'api', cadastro: path })
      .then(setRegrasCadastradas)
      .catch(() => setRegrasCadastradas([]))
  }, [sistemaId, path])

  const verificar = async () => {
    setErro(null)
    setResultado(null)
    if (!texto.trim()) { setErro('Cole o payload antes de verificar.'); return }
    setVerificando(true)
    try {
      setResultado(await checagemApi.verificar({ sistemaId, frente: 'api', cadastro: path, texto }))
    } catch (e) {
      const d = e.response?.data
      setErro(d?.detalhe ? `${d.error} ${d.detalhe}` : (d?.error || e.message))
    } finally {
      setVerificando(false)
    }
  }

  const formatar = () => {
    try { setTexto(JSON.stringify(JSON.parse(texto), null, 2)) } catch { /* deixa como está */ }
  }

  const spec = resultado?.spec
  const semNadaNoJson = spec ? spec.resumo.total === 0 : false

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-4 items-start">
      {/* entrada */}
      <div className="card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-200 bg-gradient-to-r from-white to-sysgate-50/30 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-700">Payload de migração</span>
          <span className="text-xs text-gray-400">
            spec + {regrasCadastradas.length} regra{regrasCadastradas.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-4">
          <textarea
            id="entrada-api"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            spellCheck={false}
            placeholder={'Cole o JSON que vai subir pela API de migração.\n\n[\n  {\n    "idIntegracao": "DIV-001",\n    "dividas": { "idPessoa": 99325490, ... }\n  }\n]'}
            className="w-full min-h-[330px] resize-y rounded-lg bg-gray-900 text-gray-200 border-0 p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-sysgate-500"
          />
          <div className="flex gap-2 mt-3 flex-wrap">
            <button onClick={verificar} disabled={verificando} className="btn-primary">
              {verificando ? 'Verificando…' : 'Verificar'}
            </button>
            <button onClick={formatar} className="btn-secondary">Formatar</button>
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
              {spec && spec.resumo.erros > 0 && (
                <span className={SEV.erro.pill + ' px-2 py-0.5 rounded-full font-medium'}>{spec.resumo.erros} no JSON</span>
              )}
              {resultado.resumo.erros > 0 && (
                <span className={SEV.erro.pill + ' px-2 py-0.5 rounded-full font-medium'}>{resultado.resumo.erros} regra(s)</span>
              )}
            </span>
          )}
        </div>

        <div className="p-4 space-y-2">
          {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{erro}</div>}

          {!resultado && !erro && (
            <p className="text-sm text-gray-400 text-center py-10">Cole o payload e clique em Verificar.</p>
          )}

          {resultado && (
            <>
              {/* 1) o que a spec diz — só tem autoridade sobre payload de migração */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1 h-4 rounded-full bg-sysgate-600" />
                  <h3 className="text-sm font-semibold text-gray-700">Contra a spec</h3>
                  {spec && <span className="text-xs text-gray-400">{spec.resumo.total} achado(s)</span>}
                </div>

                {!spec && (
                  <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    Este cadastro não tem spec importada, então só as regras foram aplicadas.
                  </p>
                )}

                {semNadaNoJson && (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                    Nenhum problema no payload segundo a spec e os campos marcados.
                  </p>
                )}

                {spec && spec.achados.length > 0 && (
                  <ul className="space-y-2">
                    {spec.achados.map((a, i) => {
                      const c = a.severidade === 'erro' ? SEV.erro : SEV.alerta
                      return (
                        <li key={i} className={`border-l-4 ${c.barra} bg-gray-50 rounded-r-lg p-3`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`${c.pill} px-2 py-0.5 rounded text-[10px] font-bold uppercase`}>
                              {ROTULO_SPEC[a.tipo] || a.tipo}
                            </span>
                            {resultado.entrada.registros > 1 && (
                              <span className="badge-gray text-[11px]">registro {a.registro}</span>
                            )}
                            {a.indice !== undefined && <span className="badge-gray text-[11px]">item {a.indice + 1}</span>}
                            {a.origem === 'marcacao' && <span className="badge-blue text-[11px]">marcado por você</span>}
                            <code className="text-xs font-mono text-gray-600">{a.campo}</code>
                          </div>
                          <p className={`text-sm mt-1.5 ${c.texto}`}>{a.mensagem}</p>
                          {a.detalhe && <p className="text-xs text-gray-600 mt-1">{a.detalhe}</p>}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* 2) as regras — o que a spec não alcança */}
              {resultado.regras.length > 0 && (
                <div className="pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1 h-4 rounded-full bg-sysgate-600" />
                    <h3 className="text-sm font-semibold text-gray-700">Regras</h3>
                    <span className="text-xs text-gray-400">
                      {resultado.resumo.erros + resultado.resumo.alertas} com falha de {resultado.regras.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {resultado.regras.map((r) => <Regra key={r.regraId} r={r} />)}
                  </div>
                </div>
              )}

              {/* 3) o que nem no payload cabe */}
              {resultado.notas?.length > 0 && (
                <div className="pt-4">
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
