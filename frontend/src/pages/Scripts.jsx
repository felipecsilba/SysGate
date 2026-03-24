import { useState, useEffect } from 'react'
import { scriptsApi, relatoriosApi, municipiosApi } from '../lib/api'
import useAuthStore from '../stores/authStore'

// Categorias de código (Scripts e Fórmulas usam editor; Anotações usam texto simples)
const ABAS = [
  {
    id: 'script',
    label: 'Scripts',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    cor: 'text-sysgate-600',
    corBg: 'bg-sysgate-50',
    placeholder: '// Script BFC\nvar resultado = ...',
  },
  {
    id: 'formula',
    label: 'Fórmulas',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16M4 12h10M4 17h6"/><path d="M15 14l2 2 4-4"/>
      </svg>
    ),
    cor: 'text-violet-600',
    corBg: 'bg-violet-50',
    placeholder: '// Fórmula BFC\nreturn valor * 0.01;',
  },
  {
    id: 'anotacao',
    label: 'Anotações',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    cor: 'text-amber-600',
    corBg: 'bg-amber-50',
    placeholder: 'Anotação sobre este município...',
  },
  {
    id: 'relatorio',
    label: 'Relatórios',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="12" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    cor: 'text-emerald-600',
    corBg: 'bg-emerald-50',
    placeholder: '',
  },
]

function IconX() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function CopiarBtn({ texto }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = () => {
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }
  return (
    <button
      onClick={copiar}
      className="p-1.5 rounded-md text-gray-400 hover:text-sysgate-600 hover:bg-sysgate-50 transition-colors"
      title="Copiar conteúdo"
    >
      {copiado
        ? <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
    </button>
  )
}

function ScriptCard({ item, aba, onEditar, onDeletar }) {
  const [expandido, setExpandido] = useState(false)
  const isCodigo = aba === 'script' || aba === 'formula'

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpandido((v) => !v)}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${ABAS.find(a => a.id === aba)?.corBg} ${ABAS.find(a => a.id === aba)?.cor}`}>
          {ABAS.find(a => a.id === aba)?.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{item.titulo}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {item.municipio && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-medium">
                {item.municipio.nome}
              </span>
            )}
            {item.tags?.map((tag) => (
              <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {isCodigo && <CopiarBtn texto={item.conteudo} />}
          <button
            onClick={() => onEditar(item)}
            className="p-1.5 rounded-md text-gray-400 hover:text-sysgate-600 hover:bg-sysgate-50 transition-colors"
            title="Editar"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={() => onDeletar(item)}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Deletar"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
          <button onClick={() => setExpandido((v) => !v)} className="p-1.5 text-gray-400">
            <svg className={`w-3.5 h-3.5 transition-transform ${expandido ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>

      {expandido && (
        <div className="border-t border-gray-100">
          {isCodigo ? (
            <div className="relative">
              <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 border-b border-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 text-[10px] text-gray-500 font-mono">{item.titulo}</span>
              </div>
              <pre className="bg-gray-950 text-gray-100 text-xs font-mono leading-relaxed p-4 overflow-auto scrollbar-thin max-h-80">
                {item.conteudo}
              </pre>
            </div>
          ) : (
            <p className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.conteudo}</p>
          )}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400">
            Criado em {new Date(item.criadoEm).toLocaleString('pt-BR')}
          </div>
        </div>
      )}
    </div>
  )
}

function RelatorioCard({ relatorio, onEditar, onDeletar, onDownload }) {
  const [expandido, setExpandido] = useState(false)

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpandido((v) => !v)}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-emerald-50 text-emerald-600">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="12" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-gray-900 truncate">{relatorio.titulo}</p>
            {relatorio.temJxrml && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                .jrxml
              </span>
            )}
          </div>
          {relatorio.descricao && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{relatorio.descricao}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {relatorio.municipio && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-medium">
                {relatorio.municipio.nome}
              </span>
            )}
            {relatorio.tags?.map((tag) => (
              <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {relatorio.temJxrml && (
            <button
              onClick={() => onDownload(relatorio)}
              className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Baixar JRXML"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          )}
          <button
            onClick={() => onEditar(relatorio)}
            className="p-1.5 rounded-md text-gray-400 hover:text-sysgate-600 hover:bg-sysgate-50 transition-colors"
            title="Editar"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={() => onDeletar(relatorio)}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Deletar"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
          <button onClick={() => setExpandido((v) => !v)} className="p-1.5 text-gray-400">
            <svg className={`w-3.5 h-3.5 transition-transform ${expandido ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>

      {expandido && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {relatorio.descricao && (
            <p className="px-4 py-3 text-sm text-gray-600">{relatorio.descricao}</p>
          )}
          {relatorio.temJxrml && (
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{relatorio.jxrmlNome || 'relatorio.jrxml'}</p>
                <p className="text-[10px] text-gray-400">Arquivo JRXML anexado</p>
              </div>
              <button
                onClick={() => onDownload(relatorio)}
                className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Baixar
              </button>
            </div>
          )}
          {relatorio.scriptFonte && (
            <div>
              <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 border-b border-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 text-[10px] text-gray-500 font-mono">Fonte dinâmica</span>
                <CopiarBtn texto={relatorio.scriptFonte} />
              </div>
              <pre className="bg-gray-950 text-gray-100 text-xs font-mono leading-relaxed p-4 overflow-auto scrollbar-thin max-h-60">
                {relatorio.scriptFonte}
              </pre>
            </div>
          )}
          <div className="px-4 py-2 bg-gray-50 text-[10px] text-gray-400">
            Criado em {new Date(relatorio.criadoEm).toLocaleString('pt-BR')}
          </div>
        </div>
      )}
    </div>
  )
}

const VAZIO_SCRIPT = { titulo: '', conteudo: '', tags: '', municipioId: '' }
const VAZIO_REL = { titulo: '', descricao: '', scriptFonte: '', tags: '', municipioId: '', jxrmlNome: '', jxrmlConteudo: '' }

function ModalScript({ editando, aba, municipios, todasTags, onSalvar, onFechar }) {
  const abaInfo = ABAS.find(a => a.id === aba)
  const isCodigo = aba === 'script' || aba === 'formula'
  const [form, setForm] = useState(
    editando
      ? { titulo: editando.titulo, conteudo: editando.conteudo, tags: editando.tags?.join(', ') || '', municipioId: editando.municipio?.id ? String(editando.municipio.id) : '' }
      : VAZIO_SCRIPT
  )
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim() || !form.conteudo.trim()) { setErro('Título e conteúdo são obrigatórios'); return }
    setSalvando(true); setErro('')
    try {
      const payload = {
        titulo: form.titulo.trim(),
        conteudo: form.conteudo.trim(),
        categoria: aba,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        municipioId: form.municipioId ? Number(form.municipioId) : null,
      }
      if (editando) await scriptsApi.atualizar(editando.id, payload)
      else await scriptsApi.criar(payload)
      onSalvar()
    } catch (e) { setErro(e.message) }
    finally { setSalvando(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${abaInfo?.corBg} ${abaInfo?.cor}`}>
              {abaInfo?.icon}
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {editando ? `Editar ${abaInfo?.label.slice(0, -1)}` : `Novo ${abaInfo?.label.slice(0, -1)}`}
            </h2>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <IconX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Título <span className="text-red-500">*</span></label>
              <input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                className="input" placeholder={`Nome descritivo d${aba === 'anotacao' ? 'a anotação' : 'o ' + abaInfo?.label.slice(0, -1).toLowerCase()}`} autoFocus required />
            </div>
            <div>
              <label className="label">Município associado</label>
              <select value={form.municipioId} onChange={(e) => setForm((f) => ({ ...f, municipioId: e.target.value }))} className="input">
                <option value="">Nenhum (global)</option>
                {municipios.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tags <span className="text-xs text-gray-400">(separadas por vírgula)</span></label>
              <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="input" placeholder="ex: iptu, migração" />
            </div>
          </div>

          {todasTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {todasTags.slice(0, 12).map((t) => (
                <button key={t.id} type="button"
                  onClick={() => {
                    const atual = form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : []
                    if (!atual.includes(t.nome)) setForm((f) => ({ ...f, tags: [...atual, t.nome].join(', ') }))
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-sysgate-100 hover:text-sysgate-700"
                >#{t.nome}</button>
              ))}
            </div>
          )}

          <div>
            <label className="label">
              {isCodigo ? 'Código BFC' : 'Conteúdo'} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.conteudo}
              onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
              className={`w-full min-h-52 rounded-lg p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-sysgate-500 ${
                isCodigo ? 'font-mono bg-gray-950 text-gray-100 border border-gray-700' : 'border border-gray-300'
              }`}
              placeholder={abaInfo?.placeholder}
              required
            />
          </div>

          {erro && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{erro}</div>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={salvando} className="btn-primary flex-1">
              {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalRelatorio({ editando, municipios, todasTags, onSalvar, onFechar }) {
  const [form, setForm] = useState(
    editando
      ? {
          titulo: editando.titulo,
          descricao: editando.descricao || '',
          scriptFonte: editando.scriptFonte || '',
          tags: editando.tags?.join(', ') || '',
          municipioId: editando.municipio?.id ? String(editando.municipio.id) : '',
          jxrmlNome: editando.jxrmlNome || '',
          jxrmlConteudo: '',
        }
      : VAZIO_REL
  )
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [nomeArquivoAtual] = useState(editando?.jxrmlNome || '')

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1]
      setForm((f) => ({ ...f, jxrmlNome: file.name, jxrmlConteudo: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim()) { setErro('Título é obrigatório'); return }
    setSalvando(true); setErro('')
    try {
      const payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        scriptFonte: form.scriptFonte.trim() || null,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        municipioId: form.municipioId ? Number(form.municipioId) : null,
        ...(form.jxrmlConteudo && { jxrmlNome: form.jxrmlNome, jxrmlConteudo: form.jxrmlConteudo }),
      }
      if (editando) await relatoriosApi.atualizar(editando.id, payload)
      else await relatoriosApi.criar(payload)
      onSalvar()
    } catch (e) { setErro(e.message) }
    finally { setSalvando(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {editando ? 'Editar Relatório' : 'Novo Relatório'}
            </h2>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <IconX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-4">
          <div>
            <label className="label">Título <span className="text-red-500">*</span></label>
            <input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              className="input" placeholder="Nome do relatório" autoFocus required />
          </div>

          <div>
            <label className="label">Descrição <span className="text-xs text-gray-400">(opcional)</span></label>
            <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              className="input resize-none h-16" placeholder="Descrição do relatório..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Município associado</label>
              <select value={form.municipioId} onChange={(e) => setForm((f) => ({ ...f, municipioId: e.target.value }))} className="input">
                <option value="">Nenhum (global)</option>
                {municipios.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tags <span className="text-xs text-gray-400">(por vírgula)</span></label>
              <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="input" placeholder="ex: iptu, relatório" />
            </div>
          </div>

          {/* Arquivo JRXML */}
          <div>
            <label className="label">Arquivo JRXML</label>
            <label className={`flex items-center gap-3 border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer transition-colors ${
              form.jxrmlNome ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-sysgate-300 hover:bg-sysgate-50/30'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${form.jxrmlNome ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                {form.jxrmlNome ? (
                  <>
                    <p className="text-sm font-medium text-emerald-700 truncate">{form.jxrmlNome}</p>
                    <p className="text-xs text-emerald-600">Clique para substituir</p>
                  </>
                ) : nomeArquivoAtual ? (
                  <>
                    <p className="text-sm font-medium text-gray-700 truncate">{nomeArquivoAtual} (atual)</p>
                    <p className="text-xs text-gray-400">Clique para substituir o arquivo</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-600">Clique para anexar arquivo .jrxml</p>
                    <p className="text-xs text-gray-400">Suporta arquivos JRXML do JasperReports</p>
                  </>
                )}
              </div>
              <input type="file" accept=".jrxml,.xml" className="hidden" onChange={handleFile} />
            </label>
          </div>

          {/* Script de fonte dinâmica */}
          <div>
            <label className="label">
              Script de fonte dinâmica <span className="text-xs text-gray-400">(opcional — BFC)</span>
            </label>
            <textarea
              value={form.scriptFonte}
              onChange={(e) => setForm((f) => ({ ...f, scriptFonte: e.target.value }))}
              className="w-full min-h-36 rounded-lg p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-sysgate-500 bg-gray-950 text-gray-100 border border-gray-700"
              placeholder="// Script BFC de fonte dinâmica para este relatório"
            />
          </div>

          {erro && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{erro}</div>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={salvando} className="btn-primary flex-1">
              {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar relatório'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Scripts() {
  const [aba, setAba] = useState('script')
  const [items, setItems] = useState([])
  const [relatorios, setRelatorios] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [todasTags, setTodasTags] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)

  const carregar = async () => {
    setCarregando(true)
    try {
      const [muns, tags] = await Promise.all([municipiosApi.listar(), scriptsApi.tags()])
      setMunicipios(muns)
      setTodasTags(tags)
      if (aba === 'relatorio') {
        const data = await relatoriosApi.listar(busca ? { busca } : {})
        setRelatorios(data)
      } else {
        const data = await scriptsApi.listar({ categoria: aba, ...(busca && { busca }) })
        setItems(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [aba, busca])

  const fecharModal = () => { setModalAberto(false); setEditando(null) }
  const abrirEditar = (item) => { setEditando(item); setModalAberto(true) }
  const abrirCriar = () => { setEditando(null); setModalAberto(true) }

  const deletar = async (item) => {
    if (!confirm(`Deletar "${item.titulo}"?`)) return
    try {
      if (aba === 'relatorio') await relatoriosApi.deletar(item.id)
      else await scriptsApi.deletar(item.id)
      carregar()
    } catch (e) { alert('Erro: ' + e.message) }
  }

  const baixarJxrml = async (rel) => {
    try {
      const dados = await relatoriosApi.obter(rel.id)
      if (!dados.jxrmlConteudo) return alert('Arquivo não encontrado')
      const buffer = Uint8Array.from(atob(dados.jxrmlConteudo), c => c.charCodeAt(0))
      const blob = new Blob([buffer], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = dados.jxrmlNome || 'relatorio.jrxml'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert('Erro ao baixar: ' + e.message) }
  }

  const listaAtiva = aba === 'relatorio' ? relatorios : items
  const abaInfo = ABAS.find(a => a.id === aba)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-1 h-6 rounded-full bg-sysgate-600" />
            <h1 className="text-2xl font-bold text-gray-900">Scripts & Ferramentas</h1>
          </div>
          <p className="text-sm text-gray-400 ml-3">Scripts BFC, fórmulas, anotações e relatórios JRXML</p>
        </div>
        <button onClick={abrirCriar} className="btn-primary gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo {aba === 'relatorio' ? 'Relatório' : aba === 'anotacao' ? 'Anotação' : aba === 'formula' ? 'Fórmula' : 'Script'}
        </button>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {ABAS.map((a) => {
          const count = a.id === 'relatorio' ? relatorios.length : items.filter(i => i.categoria === a.id).length
          return (
            <button
              key={a.id}
              onClick={() => { setAba(a.id); setBusca('') }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                aba === a.id
                  ? `border-sysgate-600 text-sysgate-600`
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className={aba === a.id ? a.cor : 'text-gray-400'}>{a.icon}</span>
              {a.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                aba === a.id ? 'bg-sysgate-100 text-sysgate-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Busca */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            type="search"
            placeholder={`Buscar ${abaInfo?.label.toLowerCase()}...`}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input pl-8 text-sm"
          />
        </div>
        {busca && (
          <button onClick={() => setBusca('')} className="btn-ghost text-xs flex items-center gap-1">
            <IconX /> Limpar
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {listaAtiva.length} {abaInfo?.label.toLowerCase()}
        </span>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="py-8 flex items-center justify-center gap-2 text-sm text-gray-400">
          <span className="w-4 h-4 border-2 border-gray-300 border-t-sysgate-500 rounded-full animate-spin" />
          Carregando...
        </div>
      ) : listaAtiva.length === 0 ? (
        <div className="card p-10 text-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${abaInfo?.corBg} ${abaInfo?.cor}`}>
            {abaInfo?.icon && <span className="scale-150">{abaInfo.icon}</span>}
          </div>
          <p className="text-gray-600 font-medium mb-1">
            {busca ? 'Nenhum resultado encontrado' : `Nenhum${aba === 'anotacao' ? 'a' : ''} ${abaInfo?.label.slice(0, -1).toLowerCase()} cadastrad${aba === 'anotacao' ? 'a' : 'o'}`}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {busca ? 'Tente uma busca diferente' : `Crie o primeiro para começar`}
          </p>
          {!busca && <button onClick={abrirCriar} className="btn-primary">Criar agora</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {aba === 'relatorio'
            ? relatorios.map((r) => (
                <RelatorioCard key={r.id} relatorio={r} onEditar={abrirEditar} onDeletar={deletar} onDownload={baixarJxrml} />
              ))
            : items.map((s) => (
                <ScriptCard key={s.id} item={s} aba={aba} onEditar={abrirEditar} onDeletar={deletar} />
              ))
          }
        </div>
      )}

      {/* Modal */}
      {modalAberto && aba !== 'relatorio' && (
        <ModalScript
          editando={editando}
          aba={aba}
          municipios={municipios}
          todasTags={todasTags}
          onSalvar={() => { fecharModal(); carregar() }}
          onFechar={fecharModal}
        />
      )}
      {modalAberto && aba === 'relatorio' && (
        <ModalRelatorio
          editando={editando}
          municipios={municipios}
          todasTags={todasTags}
          onSalvar={() => { fecharModal(); carregar() }}
          onFechar={fecharModal}
        />
      )}
    </div>
  )
}
