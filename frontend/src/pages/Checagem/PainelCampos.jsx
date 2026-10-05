import { useState } from 'react'

// Perfil do arquivo .jsonl contra o catálogo da fonte: o que veio, o que veio
// vazio e o que veio com valor que a fonte não conhece. É informação, não
// veredito — campo vazio só vira erro quando uma regra diz que quebra algo.

const fmtPct = (p) => (p * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'
const fmtN = (n) => n.toLocaleString('pt-BR')

function Chips({ itens }) {
  return (
    <div className="flex flex-wrap gap-1">
      {itens.map((c) => (
        <span key={c} className="font-mono text-[11px] bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">{c}</span>
      ))}
    </div>
  )
}

const Titulo = ({ children, extra }) => (
  <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mt-3 mb-1.5">
    {children}{extra && <span className="normal-case font-normal tracking-normal text-gray-400"> · {extra}</span>}
  </h4>
)

// embutido: dentro do painel de detalhe, sem o cabeçalho que recolhe
export default function PainelCampos({ perfil, semCatalogo, embutido = false }) {
  const [abertoLocal, setAberto] = useState(true)
  const aberto = embutido || abertoLocal
  if (!perfil) return null
  const { total, foraDoEnum, ausentes, desconhecidos, parciais, sempreVazios, sempreCheios } = perfil

  return (
    <div className={embutido ? '' : 'mt-5'}>
      {!embutido && (
      <button type="button" onClick={() => setAberto(!aberto)} className="flex items-center gap-2 mb-2 w-full text-left">
        <span className="w-1 h-4 rounded-full bg-sysgate-600" />
        <h3 className="text-sm font-semibold text-gray-700">Campos do arquivo</h3>
        <span className="text-xs text-gray-400">
          {sempreCheios} sempre preenchidos · {parciais.length} parciais · {sempreVazios.length} sempre vazios
        </span>
        <span className="ml-auto text-xs text-gray-400">{aberto ? 'ocultar' : 'mostrar'}</span>
      </button>
      )}

      {aberto && (
        <div className={embutido ? '' : 'border border-gray-200 rounded-lg px-3 pb-3 bg-white'}>
          {semCatalogo && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-3">
              Esta fonte não está no catálogo — não dá para conferir campos ausentes nem valores de enum.
            </p>
          )}

          {foraDoEnum.length > 0 && (
            <>
              <Titulo extra="a fonte não conhece estes valores">Valores fora do enum</Titulo>
              <div className="space-y-1">
                {foraDoEnum.map((e) => (
                  <div key={e.campo} className="text-xs border-l-4 border-l-amber-500 bg-amber-50/60 rounded-r px-2.5 py-1.5">
                    <code className="font-mono text-gray-800">{e.campo}</code>
                    <span className="text-gray-400"> ({e.tipo}): </span>
                    {e.valores.map((v) => (
                      <span key={v.valor} className="font-mono text-amber-800 mr-2">{v.valor} <span className="text-gray-500">×{fmtN(v.qtd)}</span></span>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          {parciais.length > 0 && (
            <>
              <Titulo extra="0 em id, texto vazio e data 1800-01-01 contam como vazio">Preenchimento parcial</Titulo>
              <table className="w-full text-xs">
                <tbody>
                  {parciais.map((l) => (
                    <tr key={l.campo} className="border-b border-gray-100 last:border-0">
                      <td className="py-1 pr-2 font-mono text-gray-700 break-all">{l.campo}</td>
                      <td className="py-1 w-28">
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full bg-sysgate-500" style={{ width: fmtPct(l.pct).replace(',', '.') }} />
                        </div>
                      </td>
                      <td className="py-1 pl-2 text-right tabular-nums text-gray-700 w-14">{fmtPct(l.pct)}</td>
                      <td className="py-1 pl-2 text-right tabular-nums text-gray-500 whitespace-nowrap w-28">{fmtN(l.vazios)} vazio{l.vazios !== 1 ? 's' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {ausentes.length > 0 && (
            <>
              <Titulo extra="o catálogo lista, mas não veio em nenhum registro">Não vieram no arquivo</Titulo>
              <Chips itens={ausentes} />
            </>
          )}

          {sempreVazios.length > 0 && (
            <>
              <Titulo extra={`vazios nos ${fmtN(total)} registros`}>Sempre vazios</Titulo>
              <Chips itens={sempreVazios} />
            </>
          )}

          {desconhecidos.length > 0 && (
            <>
              <Titulo extra="vieram no arquivo, o catálogo não conhece">Fora do catálogo</Titulo>
              <Chips itens={desconhecidos} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
