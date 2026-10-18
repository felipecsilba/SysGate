import { useState } from 'react'
import JsonColorido from '../../components/JsonColorido'
import MetodoBadge from '../../components/MetodoBadge'
import { StatusBadge } from './PainelResposta'

// Últimas requisições do município (o token aparece mascarado — o backend não devolve o token)
export default function Historico({ itens, carregando, onLimpar }) {
  const [aberto, setAberto] = useState(null)

  if (carregando) return <p className="py-10 text-center text-sm text-suave">Carregando…</p>
  if (!itens.length) return <p className="py-10 text-center text-sm text-suave">Nenhuma requisição deste município ainda.</p>

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button type="button" className="text-xs text-suave hover:text-perigo" onClick={onLimpar}>Limpar histórico do município</button>
      </div>
      <ul className="space-y-1.5">
        {itens.map(r => (
          <li key={r.id} className="rounded-xl border border-borda">
            <button type="button" onClick={() => setAberto(a => (a === r.id ? null : r.id))} className="flex w-full items-center gap-2 px-3 py-2 text-left">
              <MetodoBadge metodo={r.metodo} />
              <StatusBadge codigo={r.statusCode} />
              <code className="min-w-0 flex-1 truncate font-mono text-xs" title={r.url}>{r.url.replace(/^https?:\/\/[^/]+/, '')}</code>
              {r.idGerado && <span className="shrink-0 font-mono text-[11px] text-suave">id {r.idGerado}</span>}
              <span className="shrink-0 text-[11px] text-suave">{new Date(r.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })}</span>
            </button>
            {aberto === r.id && (
              <div className="space-y-2 border-t border-borda p-3">
                <code className="block break-all font-mono text-[11px] text-suave">{r.url} · {r.duracaoMs} ms · {r.sistema?.nome}</code>
                {r.body != null && <JsonColorido dados={r.body} titulo="Enviado" alturaMax="30vh" />}
                <JsonColorido dados={r.resposta} titulo="Resposta" alturaMax="30vh" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
