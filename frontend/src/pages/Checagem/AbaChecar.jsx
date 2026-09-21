import { useState, useEffect } from 'react'
import { checagemApi } from '../../lib/api'

const CORES = {
  erro:   { pill: 'bg-red-100 text-red-800',       barra: 'border-l-red-500',    texto: 'text-red-700' },
  alerta: { pill: 'bg-amber-100 text-amber-800',   barra: 'border-l-amber-500',  texto: 'text-amber-700' },
}

// Notas do cadastro: o que falta FORA do payload. Um JSON impecavel ainda
// pode nao funcionar por falta de formula, agrupamento ou de um campo que a
// API de migracao nao tem.
const NOTA_CONFIG = {
  prerequisito: { rotulo: 'Pré-requisito',  cls: 'bg-violet-100 text-violet-800', barra: 'border-l-violet-400' },
  dependencia:  { rotulo: 'Dependência',    cls: 'bg-sky-100 text-sky-800',       barra: 'border-l-sky-400' },
  inalcancavel: { rotulo: 'Inalcançável',   cls: 'bg-amber-100 text-amber-800',   barra: 'border-l-amber-400' },
  regra:        { rotulo: 'Regra',          cls: 'bg-gray-200 text-gray-700',     barra: 'border-l-gray-400' },
}

const ROTULO_TIPO = {
  obrigatorio:  'Campo obrigatório',
  enum:         'Valor inválido',
  tipo:         'Tipo incorreto',
  desconhecido: 'Campo inexistente',
}

export default function AbaChecar({ sistemaId, path }) {
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erroJson, setErroJson] = useState(null)
  const [validando, setValidando] = useState(false)

  useEffect(() => {
    setResultado(null)
    setErroJson(null)
  }, [sistemaId, path])

  const validar = async () => {
    setErroJson(null)
    setResultado(null)

    let payload
    try {
      payload = JSON.parse(texto)
    } catch (e) {
      setErroJson(`JSON inválido: ${e.message}`)
      return
    }

    setValidando(true)
    try {
      setResultado(await checagemApi.validar({ sistemaId, path, payload }))
    } catch (e) {
      setErroJson(e.response?.data?.error || e.message)
    } finally {
      setValidando(false)
    }
  }

  const formatar = () => {
    try {
      setTexto(JSON.stringify(JSON.parse(texto), null, 2))
      setErroJson(null)
    } catch (e) {
      setErroJson(`JSON inválido: ${e.message}`)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
      <div className="card p-0 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">JSON do cadastro</span>
          <div className="flex gap-2">
            <button onClick={formatar} disabled={!texto.trim()} className="btn btn-ghost text-xs">
              Formatar
            </button>
            <button onClick={() => { setTexto(''); setResultado(null); setErroJson(null) }}
              disabled={!texto} className="btn btn-ghost text-xs">
              Limpar
            </button>
          </div>
        </div>

        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          spellCheck={false}
          placeholder={'Cole aqui o JSON, por exemplo:\n\n{\n  "dividas": {\n    "idPessoa": 4412,\n    "situacaoDivida": "ABERTO"\n  }\n}'}
          className="flex-1 w-full p-4 font-mono text-xs bg-gray-950 text-gray-100 resize-none outline-none min-h-[280px]"
        />

        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-3">
          {erroJson
            ? <span className="text-xs text-red-600 truncate">{erroJson}</span>
            : <span className="text-xs text-gray-400">Aceita um objeto ou um array (envio em lote)</span>}
          <button onClick={validar} disabled={!texto.trim() || validando} className="btn btn-primary text-sm shrink-0">
            {validando ? 'Verificando...' : 'Verificar'}
          </button>
        </div>
      </div>

      <div className="card p-0 flex flex-col min-h-0">
        <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Laudo</span>
          {resultado && (
            <div className="flex gap-2 text-xs">
              <span className={`${CORES.erro.pill} px-2 py-0.5 rounded-full font-medium`}>
                {resultado.resumo.erros} erro{resultado.resumo.erros !== 1 ? 's' : ''}
              </span>
              <span className={`${CORES.alerta.pill} px-2 py-0.5 rounded-full font-medium`}>
                {resultado.resumo.alertas} alerta{resultado.resumo.alertas !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {!resultado ? (
            <p className="text-sm text-gray-400 text-center mt-10">
              Cole o JSON e clique em Verificar.
            </p>
          ) : (
            <>
          {resultado.achados.length === 0 ? (
            <div className="text-center my-8">
              <p className="text-green-700 font-medium">Nenhum problema no JSON</p>
              <p className="text-sm text-gray-500 mt-1">
                O payload está consistente com o cadastro e com os campos marcados.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {resultado.achados.map((a, i) => {
                const c = CORES[a.severidade] || CORES.alerta
                return (
                  <li key={i} className={`border-l-4 ${c.barra} bg-gray-50 rounded-r p-3`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`${c.pill} px-2 py-0.5 rounded text-[11px] font-semibold uppercase`}>
                        {ROTULO_TIPO[a.tipo] || a.tipo}
                      </span>
                      {a.indice !== undefined && (
                        <span className="badge-gray text-[11px]">item {a.indice + 1}</span>
                      )}
                      {a.origem === 'marcacao' && (
                        <span className="badge-blue text-[11px]">marcado por você</span>
                      )}
                      <code className="text-xs font-mono text-gray-600">{a.campo}</code>
                    </div>
                    <p className={`text-sm mt-1.5 ${c.texto}`}>{a.mensagem}</p>
                    {a.detalhe && <p className="text-xs text-gray-600 mt-1">{a.detalhe}</p>}
                  </li>
                )
              })}
            </ul>
          )}

          {resultado.notas?.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-4 rounded-full bg-sysgate-600" />
                <h3 className="text-sm font-semibold text-gray-700">Falta fora do JSON</h3>
                <span className="text-xs text-gray-400">
                  {resultado.notas.length} observaç{resultado.notas.length !== 1 ? 'ões' : 'ão'} sobre este cadastro
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Coisas que o payload não consegue mostrar — e que impedem o registro de funcionar.
              </p>
              <ul className="space-y-2">
                {resultado.notas.map((n) => {
                  const c = NOTA_CONFIG[n.tipo] || NOTA_CONFIG.regra
                  return (
                    <li key={n.id} className={`border-l-4 ${c.barra} bg-gray-50 rounded-r p-3`}>
                      <span className={`${c.cls} px-2 py-0.5 rounded text-[11px] font-semibold uppercase`}>
                        {c.rotulo}
                      </span>
                      <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-line">{n.texto}</p>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
