import { useState, useMemo, useRef, useCallback } from 'react'

// ─── Syntax highlight ────────────────────────────────────────────────────────

function highlightJson(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'color:#facc15' // number — yellow-400
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'color:#93c5fd' : 'color:#4ade80' // key=blue-300, string=green-400
        } else if (/true|false/.test(match)) {
          cls = 'color:#c084fc' // purple-400
        } else if (/null/.test(match)) {
          cls = 'color:#6b7280' // gray-500
        }
        return `<span style="${cls}">${match}</span>`
      }
    )
}

// ─── JSON analysis ────────────────────────────────────────────────────────────

function analyzeJson(value, depth = 0, stats = null) {
  if (!stats) {
    stats = { keys: 0, strings: 0, numbers: 0, booleans: 0, nulls: 0, arrays: 0, objects: 0, maxDepth: 0 }
  }
  stats.maxDepth = Math.max(stats.maxDepth, depth)

  if (value === null) {
    stats.nulls++
  } else if (typeof value === 'string') {
    stats.strings++
  } else if (typeof value === 'number') {
    stats.numbers++
  } else if (typeof value === 'boolean') {
    stats.booleans++
  } else if (Array.isArray(value)) {
    stats.arrays++
    value.forEach((item) => analyzeJson(item, depth + 1, stats))
  } else if (typeof value === 'object') {
    stats.objects++
    Object.keys(value).forEach((key) => {
      stats.keys++
      analyzeJson(value[key], depth + 1, stats)
    })
  }
  return stats
}

// ─── Tree node ────────────────────────────────────────────────────────────────

const MAX_ITEMS_PREVIEW = 200

function JsonNode({ value, keyName, depth, path, onCopyPath }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const [mostrandoMais, setMostrandoMais] = useState(false)

  const isArray = Array.isArray(value)
  const isObject = value !== null && typeof value === 'object' && !isArray
  const isExpandable = isArray || isObject
  const entries = isArray ? value : isObject ? Object.entries(value) : null
  const count = entries ? (isArray ? value.length : entries.length) : 0

  const currentPath = keyName !== undefined
    ? (typeof keyName === 'number' ? `${path}[${keyName}]` : `${path}.${keyName}`)
    : path

  const handleClick = () => {
    if (isExpandable) setExpanded((v) => !v)
    else onCopyPath(currentPath)
  }

  const renderLeaf = () => {
    if (value === null) return <span style={{ color: '#6b7280', fontStyle: 'italic' }}>null</span>
    if (typeof value === 'boolean') return <span style={{ color: '#c084fc' }}>{String(value)}</span>
    if (typeof value === 'number') return <span style={{ color: '#facc15' }}>{value}</span>
    if (typeof value === 'string') {
      const display = value.length > 100 ? value.slice(0, 100) + '…' : value
      return <span style={{ color: '#4ade80' }}>"{display}"</span>
    }
    return null
  }

  const visibleEntries = useMemo(() => {
    if (!entries) return []
    if (mostrandoMais || count <= MAX_ITEMS_PREVIEW) return entries
    return entries.slice(0, MAX_ITEMS_PREVIEW)
  }, [entries, mostrandoMais, count])

  return (
    <div className={depth > 0 ? 'ml-4' : ''}>
      <div
        className="flex items-start gap-1 py-0.5 px-1 hover:bg-white/5 rounded group cursor-pointer select-none"
        onClick={handleClick}
      >
        <span className="w-3 text-xs text-gray-500 shrink-0 mt-0.5">
          {isExpandable ? (expanded ? '▼' : '▶') : ' '}
        </span>

        {keyName !== undefined && (
          <button
            className="shrink-0 hover:underline"
            style={{ color: '#93c5fd' }}
            onClick={(e) => { e.stopPropagation(); onCopyPath(currentPath) }}
            title={`Copiar path: ${currentPath}`}
          >
            {typeof keyName === 'number' ? `[${keyName}]` : `"${keyName}"`}
            <span className="text-gray-600">: </span>
          </button>
        )}

        {isExpandable ? (
          <span className="text-gray-400">
            {isArray ? '[' : '{'}
            {!expanded && (
              <span className="text-gray-600 text-xs ml-1">
                {count} {isArray ? (count === 1 ? 'item' : 'itens') : (count === 1 ? 'chave' : 'chaves')}
              </span>
            )}
            {!expanded && <span className="text-gray-400 ml-0.5">{isArray ? ']' : '}'}</span>}
          </span>
        ) : (
          <span className="font-mono text-sm">
            {renderLeaf()}
            <button
              className="ml-2 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-gray-500 text-xs"
              onClick={(e) => { e.stopPropagation(); onCopyPath(currentPath) }}
              title="Copiar path"
            >
              ⎘
            </button>
          </span>
        )}
      </div>

      {isExpandable && expanded && (
        <div className="border-l border-gray-700 ml-2">
          {visibleEntries.map((entry, i) => {
            const [k, v] = isArray ? [i, entry] : entry
            return (
              <JsonNode
                key={isArray ? i : k}
                value={v}
                keyName={k}
                depth={depth + 1}
                path={currentPath}
                onCopyPath={onCopyPath}
              />
            )
          })}
          {count > MAX_ITEMS_PREVIEW && !mostrandoMais && (
            <button
              className="ml-4 mt-1 mb-1 text-xs text-sysgate-400 hover:text-sysgate-300 px-2 py-0.5 rounded border border-gray-700 hover:border-gray-600"
              onClick={(e) => { e.stopPropagation(); setMostrandoMais(true) }}
            >
              + {count - MAX_ITEMS_PREVIEW} itens ocultos — clique para mostrar todos
            </button>
          )}
          <div className="ml-3 text-gray-400 text-sm py-0.5">{isArray ? ']' : '}'}</div>
        </div>
      )}
    </div>
  )
}

// ─── Tabela view ──────────────────────────────────────────────────────────────

function JsonTabela({ data }) {
  if (!Array.isArray(data)) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="text-5xl mb-3 opacity-20">⊘</div>
          <div className="text-sm font-medium text-gray-500">Visualização em tabela</div>
          <div className="text-xs text-gray-400 mt-1">Disponível apenas para arrays de objetos no root</div>
        </div>
      </div>
    )
  }

  const objetos = data.filter((item) => item !== null && typeof item === 'object' && !Array.isArray(item))

  if (objetos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="text-5xl mb-3 opacity-20">⊘</div>
          <div className="text-sm text-gray-500">Nenhum objeto encontrado no array</div>
        </div>
      </div>
    )
  }

  const colunas = [...new Set(objetos.flatMap((o) => Object.keys(o)))]

  const renderCell = (value) => {
    if (value === undefined) return <span className="text-gray-400">—</span>
    if (value === null) return <span className="text-gray-500 italic text-xs">null</span>
    if (typeof value === 'boolean') return <span className="text-purple-600 text-xs font-mono">{String(value)}</span>
    if (typeof value === 'number') return <span className="text-yellow-700 font-mono">{value}</span>
    if (Array.isArray(value)) return <span className="text-gray-400 text-xs bg-gray-100 px-1.5 py-0.5 rounded">[{value.length}]</span>
    if (typeof value === 'object') return <span className="text-gray-400 text-xs bg-gray-100 px-1.5 py-0.5 rounded">{'{'}{Object.keys(value).length}{'}'}</span>
    const str = String(value)
    return <span className="text-gray-700" title={str.length > 60 ? str : undefined}>{str.length > 60 ? str.slice(0, 60) + '…' : str}</span>
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 bg-gray-50 border-b border-gray-200 w-12">#</th>
              {colunas.map((col) => (
                <th key={col} className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 bg-gray-50 border-b border-gray-200 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {objetos.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-sysgate-50/50 transition-colors">
                <td className="px-3 py-2 text-xs text-gray-400 font-mono">{i}</td>
                {colunas.map((col) => (
                  <td key={col} className="px-3 py-2 whitespace-nowrap font-mono text-sm">
                    {renderCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-500 bg-gray-50 shrink-0">
        {objetos.length} registros · {colunas.length} colunas
        {data.length !== objetos.length && ` · ${data.length - objetos.length} item(ns) não-objeto ignorado(s)`}
      </div>
    </div>
  )
}

// ─── Estatísticas ─────────────────────────────────────────────────────────────

function JsonEstatisticas({ parsed, rawText }) {
  const stats = useMemo(() => analyzeJson(parsed), [parsed])

  const formatNum = (n) => n.toLocaleString('pt-BR')

  const cards = [
    { label: 'Tamanho', value: formatNum(rawText.length) + ' chars', sub: (new Blob([rawText]).size / 1024).toFixed(2) + ' KB', cls: 'bg-blue-50 border-blue-200 text-blue-700' },
    { label: 'Profundidade', value: stats.maxDepth, sub: 'níveis de aninhamento', cls: 'bg-violet-50 border-violet-200 text-violet-700' },
    { label: 'Chaves', value: formatNum(stats.keys), sub: 'propriedades de objetos', cls: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { label: 'Objetos', value: formatNum(stats.objects), sub: '{ ... }', cls: 'bg-purple-50 border-purple-200 text-purple-700' },
    { label: 'Arrays', value: formatNum(stats.arrays), sub: '[ ... ]', cls: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
    { label: 'Strings', value: formatNum(stats.strings), sub: '"..."', cls: 'bg-green-50 border-green-200 text-green-700' },
    { label: 'Números', value: formatNum(stats.numbers), sub: '0–9', cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
    { label: 'Booleanos', value: formatNum(stats.booleans), sub: 'true / false', cls: 'bg-orange-50 border-orange-200 text-orange-700' },
    { label: 'Nulos', value: formatNum(stats.nulls), sub: 'null', cls: 'bg-red-50 border-red-200 text-red-700' },
  ]

  const total = stats.strings + stats.numbers + stats.booleans + stats.nulls
  const tipos = [
    { label: 'Strings', count: stats.strings, pct: total > 0 ? Math.round((stats.strings / total) * 100) : 0, color: 'bg-green-400' },
    { label: 'Números', count: stats.numbers, pct: total > 0 ? Math.round((stats.numbers / total) * 100) : 0, color: 'bg-yellow-400' },
    { label: 'Booleanos', count: stats.booleans, pct: total > 0 ? Math.round((stats.booleans / total) * 100) : 0, color: 'bg-purple-400' },
    { label: 'Nulos', count: stats.nulls, pct: total > 0 ? Math.round((stats.nulls / total) * 100) : 0, color: 'bg-gray-400' },
  ].filter((t) => t.count > 0)

  return (
    <div className="p-5 overflow-auto h-full">
      <div className="grid grid-cols-3 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.cls}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">{c.label}</div>
            <div className="text-2xl font-bold tabular-nums">{c.value}</div>
            <div className="text-xs opacity-50 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {tipos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Distribuição de tipos primitivos</div>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
            {tipos.map((t) => (
              <div key={t.label} className={`${t.color} transition-all`} style={{ width: `${t.pct}%`, minWidth: t.pct > 0 ? '4px' : '0' }} title={`${t.label}: ${t.count}`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {tipos.map((t) => (
              <div key={t.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${t.color} shrink-0`} />
                <span className="text-xs text-gray-600">{t.label}</span>
                <span className="text-xs text-gray-400">{t.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const EXEMPLO_JSON = `{
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "ativo": true,
    "perfil": null,
    "cargos": ["admin", "editor"],
    "endereco": {
      "rua": "Av. Paulista",
      "numero": 1578,
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01310-100"
    },
    "preferencias": {
      "tema": "escuro",
      "idioma": "pt-BR",
      "notificacoes": {
        "email": true,
        "sms": false,
        "push": true
      }
    }
  },
  "metadata": {
    "versao": "2.1.0",
    "geradoEm": "2026-06-03T10:00:00Z",
    "total": 42,
    "pagina": 1,
    "totalPaginas": 5
  }
}`

const ABAS = [
  { id: 'formatado', label: 'Formatado' },
  { id: 'arvore',    label: 'Árvore' },
  { id: 'tabela',    label: 'Tabela' },
  { id: 'stats',     label: 'Estatísticas' },
]

export default function AnalisadorJson() {
  const [input, setInput]             = useState('')
  const [parsed, setParsed]           = useState(null)
  const [erro, setErro]               = useState(null)
  const [aba, setAba]                 = useState('formatado')
  const [pathCopiado, setPathCopiado] = useState('')
  const [copiado, setCopiado]         = useState(false)
  const fileRef = useRef()

  const processarInput = useCallback((text) => {
    setInput(text)
    if (!text.trim()) { setParsed(null); setErro(null); return }
    try {
      setParsed(JSON.parse(text))
      setErro(null)
    } catch (e) {
      setParsed(null)
      setErro(e.message)
    }
  }, [])

  const formatado = useMemo(() => (parsed !== null ? JSON.stringify(parsed, null, 2) : ''), [parsed])
  const highlighted = useMemo(() => (formatado ? highlightJson(formatado) : ''), [formatado])

  const formatar  = () => { if (parsed !== null) setInput(formatado) }
  const minificar = () => { if (parsed !== null) setInput(JSON.stringify(parsed)) }
  const limpar    = () => processarInput('')

  const copiar = async () => {
    const text = formatado || input
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  const baixar = () => {
    const text = formatado || input
    if (!text) return
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dados.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const onCopyPath = async (path) => {
    await navigator.clipboard.writeText(path)
    setPathCopiado(path)
    setTimeout(() => setPathCopiado(''), 2000)
  }

  const carregarArquivo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => processarInput(ev.target.result)
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-gray-200 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 mr-2">
            <div className="w-1 h-6 rounded-full bg-sysgate-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Analisador JSON</h1>
              <p className="text-xs text-gray-500">Formate, visualize e analise estruturas JSON</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button onClick={() => processarInput(EXEMPLO_JSON)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
              Exemplo
            </button>
            <button onClick={formatar} disabled={!parsed} className="text-xs px-3 py-1.5 rounded-lg border border-sysgate-500 text-sysgate-600 hover:bg-sysgate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Formatar
            </button>
            <button onClick={minificar} disabled={!parsed} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Minificar
            </button>
            <button onClick={copiar} disabled={!input} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {copiado ? '✓ Copiado' : 'Copiar'}
            </button>
            <button onClick={baixar} disabled={!parsed} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Baixar .json
            </button>
            <label className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
              Abrir arquivo
              <input type="file" accept=".json,application/json,text/plain" ref={fileRef} onChange={carregarArquivo} className="hidden" />
            </label>
            <button onClick={limpar} disabled={!input} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* ── Banners ── */}
      {erro && (
        <div className="mx-6 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm shrink-0">
          <span className="font-bold text-red-700 shrink-0">Erro de sintaxe:</span>
          <span className="font-mono text-xs text-red-600 break-all">{erro}</span>
        </div>
      )}
      {pathCopiado && (
        <div className="mx-6 mt-3 flex items-center gap-2 bg-sysgate-50 border border-sysgate-200 rounded-lg px-4 py-2 text-sm shrink-0">
          <span className="font-semibold text-sysgate-700 shrink-0">Path copiado:</span>
          <span className="font-mono text-xs text-sysgate-600">{pathCopiado}</span>
        </div>
      )}

      {/* ── Split pane ── */}
      <div className="flex flex-1 min-h-0 mx-6 mb-6 mt-4 border border-gray-200 rounded-xl overflow-hidden shadow-sm">

        {/* Editor (esquerda) */}
        <div className="w-1/2 flex flex-col bg-gray-950 border-r border-gray-700 min-w-0">
          <div className="flex items-center px-4 py-2 border-b border-gray-800 shrink-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Entrada</span>
            {input.length > 0 && (
              <span className="ml-auto text-xs text-gray-600">{input.length.toLocaleString('pt-BR')} chars</span>
            )}
          </div>

          <textarea
            className="flex-1 bg-transparent text-gray-100 font-mono text-sm p-4 resize-none outline-none placeholder-gray-700 leading-relaxed"
            placeholder={'Cole seu JSON aqui...\n\n{\n  "chave": "valor"\n}'}
            value={input}
            onChange={(e) => processarInput(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
          />

          {/* Status bar */}
          <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-800 shrink-0">
            {parsed !== null ? (
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                JSON válido
              </span>
            ) : erro ? (
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                JSON inválido
              </span>
            ) : (
              <span className="text-xs text-gray-700">Aguardando entrada…</span>
            )}
            {parsed !== null && (
              <span className="ml-auto text-xs text-gray-600">
                {formatado.split('\n').length} linhas
              </span>
            )}
          </div>
        </div>

        {/* Visualizador (direita) */}
        <div className="w-1/2 flex flex-col bg-white min-w-0">

          {/* Tabs */}
          <div className="flex items-center px-4 py-2 border-b border-gray-200 gap-1 shrink-0">
            {ABAS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                disabled={parsed === null}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  aba === a.id ? 'bg-sysgate-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {a.label}
              </button>
            ))}
            {parsed !== null && (
              <span className="ml-auto text-xs text-green-600 font-semibold">✓ válido</span>
            )}
            {erro && input && (
              <span className="ml-auto text-xs text-red-500 font-semibold">✗ inválido</span>
            )}
          </div>

          {/* Conteúdo das abas */}
          <div className="flex-1 min-h-0 overflow-hidden">

            {/* Placeholder */}
            {parsed === null && !erro && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4 text-gray-200 font-mono select-none">{'{}'}</div>
                  <div className="text-sm text-gray-400 font-medium">Cole um JSON no painel esquerdo</div>
                  <div className="text-xs text-gray-300 mt-1 mb-4">ou use um exemplo para explorar</div>
                  <button
                    onClick={() => processarInput(EXEMPLO_JSON)}
                    className="text-xs px-4 py-2 rounded-lg bg-sysgate-50 text-sysgate-600 hover:bg-sysgate-100 transition-colors border border-sysgate-200 font-medium"
                  >
                    Carregar exemplo
                  </button>
                </div>
              </div>
            )}

            {/* Formatado */}
            {parsed !== null && aba === 'formatado' && (
              <pre
                className="p-5 text-sm font-mono leading-relaxed overflow-auto h-full"
                style={{ background: '#030712', color: '#e5e7eb', margin: 0 }}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            )}

            {/* Árvore */}
            {parsed !== null && aba === 'arvore' && (
              <div
                className="p-4 overflow-auto h-full font-mono text-sm leading-relaxed"
                style={{ background: '#030712', color: '#e5e7eb' }}
              >
                <JsonNode value={parsed} depth={0} path="$" onCopyPath={onCopyPath} />
              </div>
            )}

            {/* Tabela */}
            {parsed !== null && aba === 'tabela' && (
              <JsonTabela data={parsed} />
            )}

            {/* Estatísticas */}
            {parsed !== null && aba === 'stats' && (
              <JsonEstatisticas parsed={parsed} rawText={input} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
