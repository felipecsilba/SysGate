import { SEV, Trecho, ListaIds } from './LaudoRegras'

// Painel da direita do laudo Por Fonte: tudo o que se sabe de uma regra para
// decidir a correção — consequência, como corrigir, onde as falhas se
// concentram, o recorte do JSON contra o esperado e os ids afetados.

const fmtN = (n) => Number(n).toLocaleString('pt-BR')
const fmtPct = (p) => (p * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'

const Secao = ({ titulo, extra, children }) => (
  <section className="mt-5 first:mt-0">
    <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">
      {titulo}{extra && <span className="normal-case font-normal tracking-normal"> · {extra}</span>}
    </h4>
    {children}
  </section>
)

function Caixa({ icone, cor, titulo, children }) {
  const cores = {
    red: 'bg-red-50 border-red-200 text-red-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    indigo: 'bg-sysgate-50 border-sysgate-100 text-sysgate-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  }
  return (
    <div className={`flex gap-3 border rounded-lg p-3 ${cores[cor]}`}>
      <span className="shrink-0 mt-0.5">{icone}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold mb-0.5">{titulo}</p>
        <p className="text-sm leading-relaxed whitespace-pre-line">{children}</p>
      </div>
    </div>
  )
}

const IconeAlerta = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)
const IconeLampada = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
  </svg>
)
const IconeDuvida = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
)
const IconeOk = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

function Concentracao({ dimensoes }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {dimensoes.map((d) => (
        <div key={d.rotulo} className="border border-gray-200 rounded-lg p-2.5">
          <p className="text-xs font-semibold text-gray-600 mb-1.5">{d.rotulo}</p>
          <table className="w-full text-xs">
            <tbody>
              {d.valores.map((v) => (
                <tr key={v.valor}>
                  <td className="py-0.5 pr-2 font-mono text-gray-700 truncate max-w-[9rem]">{v.valor}</td>
                  <td className="py-0.5 w-full">
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-red-400" style={{ width: `${(v.qtd / d.total) * 100}%` }} />
                    </div>
                  </td>
                  <td className="py-0.5 pl-2 text-right tabular-nums text-gray-700 whitespace-nowrap">{fmtN(v.qtd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

export default function DetalheRegra({ r, dimensoes = [] }) {
  const c = SEV[r.severidade] || SEV.na
  const falhou = r.faltam > 0
  const corConsequencia = r.severidade === 'alerta' ? 'amber' : 'red'

  return (
    <div>
      {/* cabeçalho */}
      <div className={`border-l-4 ${c.barra} pl-3 mb-5`}>
        <span className={`${c.pill} px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide`}>{c.rotulo}</span>
        <h3 className="text-base font-semibold text-gray-900 mt-1.5">{r.nome}</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {r.severidade === 'na'
            ? 'Nenhum registro se enquadra nesta regra.'
            : falhou
              ? <><strong className="text-gray-900">{fmtN(r.faltam)}</strong> de {fmtN(r.aplicaveis)} registros ({fmtPct(r.faltam / r.aplicaveis)}) com o problema</>
              : <>Os {fmtN(r.aplicaveis)} registros verificados estão corretos</>}
        </p>
      </div>

      <div className="space-y-2">
        {r.severidade === 'na' && (
          <Caixa icone={IconeDuvida} cor="gray" titulo="Não foi conferida">
            Nenhum registro do arquivo atende à condição desta regra, então ela não foi verificada. Isso não é aprovação.
          </Caixa>
        )}
        {r.severidade === 'ok' && (
          <Caixa icone={IconeOk} cor="green" titulo="Tudo certo">
            Todos os registros a que a regra se aplica trazem o campo preenchido.
          </Caixa>
        )}
        {r.porque && (
          <Caixa icone={IconeAlerta} cor={falhou ? corConsequencia : 'gray'} titulo={falhou ? 'Consequência' : 'Por que esta regra existe'}>
            {r.porque}
          </Caixa>
        )}
        {falhou && r.comoCorrigir && (
          <Caixa icone={IconeLampada} cor="indigo" titulo="Como corrigir">{r.comoCorrigir}</Caixa>
        )}
        {r.naoSabemos && (
          <Caixa icone={IconeDuvida} cor="gray" titulo="O que não sabemos">{r.naoSabemos}</Caixa>
        )}
      </div>

      {falhou && dimensoes.length > 0 && (
        <Secao titulo="Onde se concentra" extra="registros com o problema">
          <Concentracao dimensoes={dimensoes} />
        </Secao>
      )}

      {falhou && (
        <Secao titulo="O que está no seu JSON × o esperado" extra={`${Math.min(3, r.exemplos?.length || 0)} exemplo(s)`}>
          {(r.exemplos || []).map((ex) => <Trecho key={ex.id} exemplo={ex} regra={r} />)}
          {r.faltam > (r.exemplos || []).length && (
            <p className="text-xs text-gray-500">+ {fmtN(r.faltam - r.exemplos.length)} outro(s) registro(s) com o mesmo problema.</p>
          )}
        </Secao>
      )}

      {falhou && (
        <Secao titulo="Ids afetados" extra={fmtN(r.ids?.length || 0)}>
          <ListaIds ids={r.ids || []} />
        </Secao>
      )}

      <Secao titulo="Onde a regra procura">
        <div className="flex flex-wrap gap-1">
          {(r.onde || []).map((o) => (
            <span key={o} className="font-mono text-[11px] bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">{o}</span>
          ))}
        </div>
        {r.esperado && !falhou && (
          <p className="text-xs text-gray-500 mt-2">Esperado: <code className="font-mono">{r.esperado}</code></p>
        )}
      </Secao>
    </div>
  )
}
