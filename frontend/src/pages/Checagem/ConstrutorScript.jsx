import { useState, useEffect, useMemo } from 'react'
import { checagemApi } from '../../lib/api'

// Operadores do criterio do BFC-Script. "is null" e "= 0" andam juntos porque
// bases convertidas usam zero como ausencia — procurar so por null perde metade.
const OPERADORES = [
  { id: '=',        label: 'igual a',        precisaValor: true },
  { id: '!=',       label: 'diferente de',   precisaValor: true },
  { id: 'like',     label: 'contém',         precisaValor: true, texto: true },
  { id: '>',        label: 'maior que',      precisaValor: true },
  { id: '<',        label: 'menor que',      precisaValor: true },
  { id: 'is null',  label: 'está vazio',     precisaValor: false },
  { id: 'vazioOuZero', label: 'vazio ou zero (recomendado p/ id)', precisaValor: false },
]

const ehTexto = (tipo) => ['String', 'Character'].includes(tipo)

/** Monta o pedaço de critério de uma condição. */
function montarCondicao({ campo, operador, valor, tipo, ehEnum }) {
  if (operador === 'is null') return `${campo} is null`
  if (operador === 'vazioOuZero') return `(${campo} is null or ${campo} = 0)`
  if (valor === '' || valor === undefined || valor === null) return null

  const comAspas = ehEnum || ehTexto(tipo)
  const v = operador === 'like' ? `'%${valor}%'` : comAspas ? `'${valor}'` : valor
  return `${campo} ${operador} ${v}`
}

/**
 * Template do script de exportação. Tudo o que está aqui foi aprendido apanhando:
 * JSON em maiúsculas (Json não existe), zero como ausência, e LIMITE para não
 * derrubar o Studio na primeira tentativa.
 */
function montarScript({ fonte, criterio, limite }) {
  const caminho = fonte.nome === fonte.path.replace(/^\//, '') ? fonte.nome : `${fonte.nome}` // Dados.tributos.v2.<nome>
  return `// Exportação de ${fonte.descricao || fonte.nome} — gerado pela Checagem do Krakion
//
// Rode no Studio (Scripts), copie a saída e cole de volta na aba "Por Fonte".
// A saída sai uma linha por registro, com a hora na frente — o Krakion entende
// esse formato, não precisa limpar.

fonte = Dados.tributos.v2.${caminho};

FILTRO = "${criterio.replace(/"/g, '\\"')}"
LIMITE = ${limite}   // comece pequeno; suba depois de ver que o filtro está certo

qtd = 0
percorrer(fonte.busca(criterio: FILTRO)) { r ->
  se (qtd >= LIMITE) { retornar }
  qtd = qtd + 1
  imprimir JSON.escrever(r)
}

imprimir "--- registros exportados: \${qtd} ---"
`
}

export default function ConstrutorScript({ sistemaId, onFechar }) {
  const [fontes, setFontes] = useState([])
  const [busca, setBusca] = useState('')
  const [fonteId, setFonteId] = useState('')
  const [fonte, setFonte] = useState(null)
  const [condicoes, setCondicoes] = useState([])
  const [limite, setLimite] = useState(50)
  const [buscaCampo, setBuscaCampo] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!sistemaId) return
    checagemApi.fontes({ sistemaId, busca: busca || undefined })
      .then(setFontes)
      .catch(() => setFontes([]))
  }, [sistemaId, busca])

  useEffect(() => {
    if (!fonteId) { setFonte(null); setCondicoes([]); return }
    checagemApi.fonte(fonteId).then(setFonte).catch(() => setFonte(null))
    setCondicoes([])
  }, [fonteId])

  const filtrosVisiveis = useMemo(() => {
    if (!fonte) return []
    const b = buscaCampo.trim().toLowerCase()
    if (!b) return fonte.filtros.slice(0, 40)
    return fonte.filtros.filter(
      (f) => f.campo.toLowerCase().includes(b) || (f.descricao || '').toLowerCase().includes(b)
    ).slice(0, 40)
  }, [fonte, buscaCampo])

  const criterio = useMemo(
    () => condicoes.map(montarCondicao).filter(Boolean).join(' and '),
    [condicoes]
  )

  const script = useMemo(
    () => (fonte && criterio ? montarScript({ fonte, criterio, limite }) : ''),
    [fonte, criterio, limite]
  )

  const adicionar = (f) => {
    setCondicoes((c) => [...c, {
      campo: f.campo,
      tipo: f.tipo,
      ehEnum: !!f.eh_enum,
      valores: f.valores || [],
      operador: f.eh_enum ? '=' : (ehTexto(f.tipo) ? 'like' : '='),
      valor: '',
    }])
    setBuscaCampo('')
  }

  const mudar = (i, patch) => setCondicoes((c) => c.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const remover = (i) => setCondicoes((c) => c.filter((_, j) => j !== i))

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(script)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch { /* sem clipboard: o usuário seleciona o texto */ }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 z-50 overflow-auto">
      <div className="card w-full max-w-4xl my-4">
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-white to-sysgate-50/30 flex items-center gap-3">
          <span className="w-1 h-5 rounded-full bg-sysgate-600" />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900">Gerar script de exportação</h2>
            <p className="text-xs text-gray-500">
              Escolha a fonte e os filtros; o script sai pronto para rodar no Studio
            </p>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-700 text-xl leading-none px-2">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* fonte */}
          <div>
            <label className="label">Fonte de dados</label>
            <div className="flex gap-2 flex-wrap">
              <input
                className="input flex-1 min-w-[200px]"
                placeholder="Buscar fonte: dividas, debitos, imoveis..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <select className="input flex-1 min-w-[260px]" value={fonteId} onChange={(e) => setFonteId(e.target.value)}>
                <option value="">— escolha a fonte —</option>
                {fontes.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}{f.path} · {f.qtdFiltros} filtros{f.descricaoOp ? ` · ${f.descricaoOp}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {fonte && (
            <>
              {/* condições */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <label className="label mb-0">
                    Filtros
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {fonte.filtros.length} disponíveis nesta fonte
                    </span>
                  </label>
                  <input
                    className="input w-64 text-sm"
                    placeholder="+ filtro — digite para achar o campo"
                    value={buscaCampo}
                    onChange={(e) => setBuscaCampo(e.target.value)}
                  />
                </div>

                {buscaCampo && (
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-auto mb-2 divide-y divide-gray-100">
                    {filtrosVisiveis.length === 0 && (
                      <p className="text-xs text-gray-400 p-3">Nenhum filtro com esse nome.</p>
                    )}
                    {filtrosVisiveis.map((f) => (
                      <button
                        key={f.campo}
                        onClick={() => adicionar(f)}
                        className="w-full text-left px-3 py-2 hover:bg-sysgate-50 flex items-start gap-2"
                      >
                        <code className="text-xs font-mono text-sysgate-700 shrink-0">{f.campo}</code>
                        <span className="text-[11px] text-gray-400 shrink-0">{f.tipo}</span>
                        {f.eh_enum && <span className="badge-blue text-[10px] shrink-0">enum</span>}
                        <span className="text-xs text-gray-500 truncate">{f.descricao}</span>
                      </button>
                    ))}
                  </div>
                )}

                {condicoes.length === 0 && (
                  <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-4 text-center">
                    Nenhum filtro ainda. Digite no campo acima para adicionar.
                  </p>
                )}

                <div className="space-y-2">
                  {condicoes.map((c, i) => {
                    const op = OPERADORES.find((o) => o.id === c.operador)
                    return (
                      <div key={i} className="flex gap-2 items-center flex-wrap bg-sysgate-50/40 border border-sysgate-200/60 rounded-lg p-2">
                        <code className="text-xs font-mono text-sysgate-800 w-56 truncate" title={c.campo}>{c.campo}</code>
                        <select
                          className="input w-48 text-sm py-1"
                          value={c.operador}
                          onChange={(e) => mudar(i, { operador: e.target.value })}
                        >
                          {OPERADORES.filter((o) => !(o.texto && !ehTexto(c.tipo))).map((o) => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                          ))}
                        </select>

                        {op?.precisaValor && (
                          c.ehEnum ? (
                            <select
                              className="input flex-1 min-w-[160px] text-sm py-1"
                              value={c.valor}
                              onChange={(e) => mudar(i, { valor: e.target.value })}
                            >
                              <option value="">— valor —</option>
                              {c.valores.map((v) => (
                                <option key={v.key} value={v.key}>{v.key}{v.descricao ? ` — ${v.descricao}` : ''}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className="input flex-1 min-w-[160px] text-sm py-1"
                              type={ehTexto(c.tipo) ? 'text' : 'number'}
                              placeholder={ehTexto(c.tipo) ? 'texto' : 'número'}
                              value={c.valor}
                              onChange={(e) => mudar(i, { valor: e.target.value })}
                            />
                          )
                        )}

                        <button onClick={() => remover(i)} className="text-gray-400 hover:text-red-600 px-1" title="Remover">×</button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* limite */}
              <div className="flex items-end gap-3 flex-wrap">
                <div className="w-40">
                  <label className="label">Limite de registros</label>
                  <input className="input" type="number" min={1} value={limite}
                         onChange={(e) => setLimite(Math.max(1, Number(e.target.value) || 1))} />
                </div>
                <p className="text-xs text-gray-500 pb-2 flex-1 min-w-[200px]">
                  Comece pequeno. Confirme que o filtro pegou o que você queria antes de subir o número.
                </p>
              </div>

              {/* script */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <label className="label mb-0">Script</label>
                  {criterio && <code className="text-[11px] font-mono text-gray-500 truncate max-w-full">{criterio}</code>}
                </div>
                {!criterio ? (
                  <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-4 text-center">
                    Adicione ao menos um filtro para gerar o script.
                  </p>
                ) : (
                  <>
                    <pre className="bg-gray-900 text-gray-200 text-[11.5px] font-mono rounded-lg p-3 overflow-x-auto max-h-72 leading-relaxed">{script}</pre>
                    <button onClick={copiar} className="btn-primary mt-2">
                      {copiado ? 'Copiado' : 'Copiar script'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
