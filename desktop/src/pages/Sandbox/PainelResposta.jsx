import Icone from '../../components/Icone'
import JsonColorido from '../../components/JsonColorido'
import MetodoBadge from '../../components/MetodoBadge'

export function StatusBadge({ codigo }) {
  const cor = !codigo ? 'bg-red-500/10 text-red-600 dark:text-red-400'
    : codigo < 300 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
    : codigo < 400 ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400'
    : codigo < 500 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
    : 'bg-red-500/10 text-red-600 dark:text-red-400'
  return <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${cor}`}>{codigo || 'erro'}</span>
}

function Cabecalho({ r }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <StatusBadge codigo={r.statusCode} />
      {r.metodo && <MetodoBadge metodo={r.metodo} />}
      {r.duracaoMs != null && <span className="text-suave">{r.duracaoMs} ms</span>}
      {r.url && <code className="min-w-0 flex-1 truncate font-mono text-suave" title={r.url}>{r.url}</code>}
    </div>
  )
}

// resposta: { statusCode, duracaoMs, url, metodo, headers, data } | { erro }
export default function PainelResposta({ resposta, executando, idGerado, onConsultar, consulta, consultando }) {
  if (executando) {
    return <div className="flex items-center gap-2 py-10 text-sm text-suave"><span className="h-4 w-4 animate-spin rounded-full border-2 border-borda border-t-acento" /> Executando…</div>
  }
  if (!resposta) {
    return <p className="py-10 text-center text-sm text-suave">Execute uma requisição para ver a resposta aqui.</p>
  }
  if (resposta.erro) {
    return <p className="rounded-xl bg-perigo/10 px-4 py-3 text-sm text-perigo">{resposta.erro}</p>
  }

  const extras = Object.entries(resposta.headers || {}).filter(([, v]) => v)
  return (
    <div className="space-y-3">
      <Cabecalho r={resposta} />
      {extras.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px] text-suave">
          {extras.map(([k, v]) => <span key={k}>{k}: <span className="text-texto">{v}</span></span>)}
        </div>
      )}
      <JsonColorido dados={resposta.data} titulo="Resposta" />

      {idGerado && (
        <div className="space-y-2 rounded-xl border border-borda p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-suave">ID gerado</span>
            <code className="rounded-md bg-texto/[0.06] px-2 py-0.5 font-mono text-xs">{idGerado}</code>
            <div className="flex-1" />
            <button type="button" className="botao-secundario h-8 px-3 text-xs" onClick={onConsultar} disabled={consultando}>
              <Icone nome="historico" className="h-3.5 w-3.5" /> {consultando ? 'Consultando…' : 'Consultar resultado'}
            </button>
          </div>
          {consulta && (consulta.erro
            ? <p className="text-sm text-perigo">{consulta.erro}</p>
            : <div className="space-y-2"><Cabecalho r={consulta} /><JsonColorido dados={consulta.data} titulo={`GET …/${idGerado}`} alturaMax="40vh" /></div>)}
        </div>
      )}
    </div>
  )
}
