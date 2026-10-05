// Painel da direita para um campo do arquivo: preenchimento, distribuição dos
// valores, o que o catálogo aceita e as regras que olham para ele.

const fmtN = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
// 2 em 16 mil não é 0%: abaixo de 0,1% diz que existe, sem arredondar para nada
const fmtPct = (p) => (p > 0 && p < 0.001 ? '<0,1%' : (p * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%')
// valor monetário em pt-BR com 2 casas; o resto sem forçar casas
const fmtValor = (n) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtData = (d) => (d ? d.split('-').reverse().join('/') : '—')

// Forma própria por status, como as severidades das regras: lido de relance.
export const ESTILO_CAMPO = {
  ok:      { rotulo: 'ok',      barra: 'border-l-green-500', pill: 'bg-green-100 text-green-800' },
  parcial: { rotulo: 'parcial', barra: 'border-l-sky-400',   pill: 'bg-sky-100 text-sky-800' },
  vazio:   { rotulo: 'vazio',   barra: 'border-l-gray-300',  pill: 'bg-gray-100 text-gray-500' },
  alerta:  { rotulo: 'alerta',  barra: 'border-l-amber-500', pill: 'bg-amber-100 text-amber-800' },
  ausente: { rotulo: 'ausente', barra: 'border-l-gray-200',  pill: 'bg-white text-gray-400 border border-dashed border-gray-300' },
}

const TIPO_ROTULO = { enum: 'enum', numero: 'número', data: 'data', texto: 'texto', booleano: 'sim/não', lista: 'lista', misto: 'tipos mistos' }

const Secao = ({ titulo, extra, children }) => (
  <section className="mt-5">
    <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">
      {titulo}{extra && <span className="normal-case font-normal tracking-normal"> · {extra}</span>}
    </h4>
    {children}
  </section>
)

function Barras({ itens, total, cor = 'bg-sysgate-500' }) {
  return (
    <table className="w-full text-xs">
      <tbody>
        {itens.map((v) => (
          <tr key={v.chave} className={`border-b border-gray-100 last:border-0 ${v.destaque ? 'bg-amber-50' : ''}`}>
            <td className="py-1 pr-2 align-top">
              <span className="font-mono text-gray-800 break-all">{v.rotulo}</span>
              {v.sub && <span className="block text-[11px] text-gray-400">{v.sub}</span>}
            </td>
            <td className="py-1 w-32 align-middle">
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full ${v.destaque ? 'bg-amber-500' : cor}`} style={{ width: `${(v.qtd / total) * 100}%` }} />
              </div>
            </td>
            <td className="py-1 pl-2 text-right tabular-nums text-gray-800 whitespace-nowrap w-16">{fmtN(v.qtd)}</td>
            <td className="py-1 pl-2 text-right tabular-nums text-gray-400 whitespace-nowrap w-14">{fmtPct(v.qtd / total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Numero({ rotulo, valor }) {
  return (
    <div className="border border-gray-200 rounded-lg px-3 py-2">
      <p className="text-[11px] text-gray-400">{rotulo}</p>
      <p className="text-sm font-semibold text-gray-800 tabular-nums break-all">{valor}</p>
    </div>
  )
}

export default function DetalheCampo({ campo: c, total, regras = [], onAbrirRegra }) {
  const e = ESTILO_CAMPO[c.status] || ESTILO_CAMPO.vazio
  const ehValor = /(^|\.)(vl|valor)/i.test(c.campo)
  const regrasDoCampo = regras.filter((r) => (r.onde || []).includes(c.campo))

  return (
    <div>
      {/* cabeçalho */}
      <div className={`border-l-4 ${e.barra} pl-3`}>
        <span className={`${e.pill} px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide`}>{e.rotulo}</span>
        <h3 className="font-mono text-base font-semibold text-gray-900 mt-1.5 break-all">{c.campo}</h3>
        {c.descricao && <p className="text-sm text-gray-600">{c.descricao}</p>}
        <p className="text-xs text-gray-400 mt-0.5">
          {[c.tipo && TIPO_ROTULO[c.tipo], c.tipoCatalogo && c.tipoCatalogo !== c.tipo && `catálogo: ${c.tipoCatalogo}`].filter(Boolean).join(' · ')}
        </p>
      </div>

      {c.status === 'ausente' ? (
        <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
          O catálogo diz que a fonte devolve este campo, mas ele não veio em nenhum registro do arquivo.
          Pode ser que o script tenha pedido só alguns campos, ou que a fonte não o devolva para estes registros.
        </p>
      ) : (
        <>
          {/* preenchimento */}
          <Secao titulo="Preenchimento">
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-2xl font-semibold text-gray-900 tabular-nums">{fmtPct(c.pct)}</span>
              <span className="text-sm text-gray-500">{fmtN(c.preenchidos)} de {fmtN(total)} registros</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full ${c.status === 'ok' ? 'bg-green-500' : c.status === 'vazio' ? 'bg-gray-300' : 'bg-sky-500'}`} style={{ width: `${c.pct * 100}%` }} />
            </div>
            {c.vazios > 0 && (
              <p className="text-xs text-gray-500 mt-1.5">
                {fmtN(c.vazios)} vazio{c.vazios !== 1 ? 's' : ''}. Contam como vazio: nulo, texto vazio, objeto vazio, a data 1800-01-01
                {/(^|\.)(id|codigo)/i.test(c.campo) && ' e o 0 (neste campo, 0 é ausência de id)'}.
              </p>
            )}
          </Secao>

          {/* regras ligadas */}
          {regrasDoCampo.length > 0 && (
            <Secao titulo="Regras que olham este campo">
              <div className="space-y-1">
                {regrasDoCampo.map((r) => (
                  <button
                    key={r.regraId}
                    type="button"
                    onClick={() => onAbrirRegra?.(r.regraId)}
                    className="w-full text-left text-sm flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 hover:border-sysgate-300 hover:bg-sysgate-50/40"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${r.severidade === 'erro' ? 'bg-red-500' : r.severidade === 'alerta' ? 'bg-amber-500' : r.severidade === 'ok' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="flex-1 text-gray-700">{r.nome}</span>
                    <span className="text-xs text-gray-400">{r.faltam > 0 ? `${fmtN(r.faltam)} com falha` : r.severidade === 'na' ? 'não se aplica' : 'ok'}</span>
                  </button>
                ))}
              </div>
            </Secao>
          )}

          {/* valores fora do enum */}
          {c.foraDoEnum.length > 0 && (
            <div className="mt-4 text-sm border border-amber-200 bg-amber-50 text-amber-900 rounded-lg p-3">
              <p className="font-semibold text-xs mb-0.5">Valores que a fonte não conhece</p>
              {c.foraDoEnum.map((v) => <span key={v.valor} className="font-mono mr-3">{v.valor} ×{fmtN(v.qtd)}</span>)}
            </div>
          )}

          {/* números: valor monetário tem soma; id não tem conta que faça sentido */}
          {c.num && c.tipo === 'numero' && (ehValor || c.listaCompleta) && (
            <Secao titulo="Números">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* ano, parcela, quantidade: número cru, sem separador de milhar */}
                <Numero rotulo="Menor" valor={ehValor ? fmtValor(c.num.min) : String(c.num.min)} />
                <Numero rotulo="Maior" valor={ehValor ? fmtValor(c.num.max) : String(c.num.max)} />
                {ehValor && <Numero rotulo="Soma" valor={fmtValor(c.num.soma)} />}
              </div>
            </Secao>
          )}

          {/* unicidade: para id/cpf/texto livre, o que importa é se repete */}
          {!c.listaCompleta && !ehValor && c.tipo !== 'data' && c.preenchidos > 0 && (
            <Secao titulo="Unicidade">
              <div className="grid grid-cols-2 gap-2">
                <Numero rotulo="Valores distintos" valor={c.muitos ? 'mais de 50.000' : fmtN(c.distintos)} />
                <Numero rotulo="Aparecem em mais de um registro" valor={fmtN(c.repetidos)} />
              </div>
            </Secao>
          )}

          {/* datas */}
          {c.data && (
            <Secao titulo="Datas" extra="sem contar 1800-01-01">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Numero rotulo="Mais antiga" valor={fmtData(c.data.min)} />
                <Numero rotulo="Mais recente" valor={fmtData(c.data.max)} />
              </div>
              <Barras total={c.preenchidos} itens={c.anos.map((a) => ({ chave: a.ano, rotulo: a.ano, qtd: a.qtd }))} />
            </Secao>
          )}

          {/* distribuição */}
          {c.valores.length > 0 && (
            <Secao
              titulo={c.listaCompleta ? 'Quantidade por valor' : 'Os que mais se repetem'}
              extra={c.listaCompleta
                ? `${fmtN(c.distintos)} valor${c.distintos !== 1 ? 'es' : ''} distinto${c.distintos !== 1 ? 's' : ''}`
                : `top ${c.valores.length} de ${c.muitos ? 'mais de 50.000' : fmtN(c.distintos)} valores distintos`}
            >
              <Barras
                total={c.preenchidos}
                itens={c.valores.map((v) => ({
                  chave: v.valor,
                  rotulo: ehValor ? fmtValor(Number(v.valor)) : v.valor,
                  sub: v.descricao && v.descricao !== v.valor ? v.descricao : (v.foraDoEnum ? 'fora do enum' : null),
                  qtd: v.qtd,
                  destaque: v.foraDoEnum,
                }))}
              />
            </Secao>
          )}
          {!c.listaCompleta && c.valores.length === 0 && c.preenchidos > 0 && c.tipo !== 'data' && (
            <p className="text-xs text-gray-500 mt-3">Nenhum valor se repete: cada registro tem um valor próprio.</p>
          )}
        </>
      )}

      {/* o que o enum aceita */}
      {c.enumAceitos?.length > 0 && (
        <Secao titulo="Valores aceitos pela fonte" extra={`${c.enumAceitos.filter((a) => a.presente).length} de ${c.enumAceitos.length} aparecem no arquivo`}>
          <div className="flex flex-wrap gap-1">
            {c.enumAceitos.map((a) => (
              <span
                key={a.key}
                title={a.descricao}
                className={`font-mono text-[11px] rounded px-1.5 py-0.5 border ${a.presente ? 'bg-sysgate-50 border-sysgate-200 text-sysgate-800' : 'bg-white border-gray-200 text-gray-400'}`}
              >
                {a.key}
              </span>
            ))}
          </div>
        </Secao>
      )}
    </div>
  )
}
