import { useMemo } from 'react'
import { corVertical, hexToRgb } from './utils'

// ── Ícones ────────────────────────────────────────────────────────────────────

function IconEdit() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function IconChevron({ open }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

function IconPhone() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}

function IconMail() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function iniciais(nome) {
  return nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

// ── Card de Entidade (accordion) ──────────────────────────────────────────────

export default function AccordionEntidade({ entidade, catalogo, aberta, onToggle, isAdmin, onEditarEntidade, onDeletarEntidade, onEditarSistema, onDeletarSistema, onToggleAtivoSistema, onNovoSistema, onGerenciarSistemas, onNovoStakeholder, onEditarStakeholder, onDeletarStakeholder }) {
  const totalSistemas = entidade.sistemas?.length || 0
  const totalStakeholders = entidade.stakeholders?.length || 0

  // Agrupar sistemas por vertical
  const gruposSistemas = useMemo(() => {
    const map = {}
    for (const s of entidade.sistemas || []) {
      const v = s.vertical || 'Outros'
      if (!map[v]) map[v] = []
      map[v].push(s)
    }
    // Ordenar: verticais do catálogo primeiro, depois "Outros"
    const ordemCatalogo = catalogo.map((c) => c.nome)
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'Outros') return 1
      if (b === 'Outros') return -1
      return (ordemCatalogo.indexOf(a) ?? 999) - (ordemCatalogo.indexOf(b) ?? 999)
    })
  }, [entidade.sistemas])

  return (
    <div className="card overflow-hidden">
      {/* Header clicável */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <IconChevron open={aberta} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{entidade.nome}</p>
            <p className="text-[11px] text-gray-400 capitalize">{entidade.tipo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-[11px] text-gray-400">{totalSistemas} sistema{totalSistemas !== 1 ? 's' : ''}</span>
          <span className="text-gray-200">·</span>
          <span className="text-[11px] text-gray-400">{totalStakeholders} contato{totalStakeholders !== 1 ? 's' : ''}</span>
          {isAdmin && (
            <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onEditarEntidade(entidade)} className="p-1 rounded text-gray-400 hover:text-sysgate-600 hover:bg-sysgate-50 transition-colors" title="Editar entidade">
                <IconEdit />
              </button>
              <button onClick={() => onDeletarEntidade(entidade)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remover entidade">
                <IconTrash />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Corpo expansível */}
      {aberta && (
        <div className="border-t border-gray-100">
          {/* Seção: Sistemas */}
          <div className="px-4 py-3 border-b border-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sistemas</h4>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onGerenciarSistemas(entidade)}
                    className="flex items-center gap-1 text-[11px] text-sysgate-600 hover:text-sysgate-700 font-medium"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    <span>Catálogo Betha</span>
                  </button>
                  <span className="text-gray-300">·</span>
                  <button
                    onClick={() => onNovoSistema(entidade)}
                    className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 font-medium"
                  >
                    <IconPlus /><span>Personalizado</span>
                  </button>
                </div>
              )}
            </div>

            {entidade.sistemas.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhum sistema cadastrado. {isAdmin && 'Use "Catálogo Betha" para adicionar.'}</p>
            ) : (
              <div className="space-y-2">
                {gruposSistemas.map(([vertical, sistemas]) => {
                  const hex = corVertical(vertical)
                  const rgb = hexToRgb(hex)
                  return (
                  <div key={vertical} className="rounded-xl overflow-hidden border border-gray-100">
                    <div className="px-3 py-1.5" style={{ backgroundColor: hex }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white">{vertical}</p>
                    </div>
                    <div className="px-3 py-2" style={{ backgroundColor: `rgba(${rgb}, 0.05)` }}>
                      <div className="space-y-1">
                        {sistemas.map((s) => (
                          <div key={s.id} className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${s.ativo ? 'bg-white' : 'bg-gray-100/50'}`}>
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className={`text-sm ${s.ativo ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{s.nome}</span>
                              {!s.ativo && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-400">inativo</span>
                              )}
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onToggleAtivoSistema(s)}
                                  className="text-[10px] px-2 py-0.5 rounded border text-gray-400 hover:text-sysgate-600 hover:border-sysgate-300 transition-colors"
                                  title={s.ativo ? 'Desativar' : 'Ativar'}
                                >
                                  {s.ativo ? 'Desativar' : 'Ativar'}
                                </button>
                                <button onClick={() => onEditarSistema(s)} className="p-1 rounded text-gray-300 hover:text-sysgate-600 hover:bg-sysgate-50 transition-colors">
                                  <IconEdit />
                                </button>
                                <button onClick={() => onDeletarSistema(s)} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                  <IconTrash />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Seção: Stakeholders */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contatos</h4>
              {isAdmin && (
                <button onClick={() => onNovoStakeholder(entidade)} className="flex items-center gap-1 text-[11px] text-sysgate-600 hover:text-sysgate-700 font-medium">
                  <IconPlus /><span>Adicionar</span>
                </button>
              )}
            </div>
            {entidade.stakeholders.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhum contato cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {entidade.stakeholders.map((sh) => (
                  <div key={sh.id} className={`rounded-xl border px-3 py-2.5 ${sh.ativo ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Avatar com iniciais */}
                        <div className="w-8 h-8 rounded-full bg-sysgate-100 text-sysgate-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {iniciais(sh.nome)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 leading-tight">{sh.nome}</p>
                          {sh.cargo && <p className="text-[11px] text-gray-500">{sh.cargo}</p>}
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            {sh.telefone && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                <IconPhone />{sh.telefone}
                              </span>
                            )}
                            {sh.email && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                <IconMail />{sh.email}
                              </span>
                            )}
                            {sh.horarioAtendimento && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                <IconClock />{sh.horarioAtendimento}
                              </span>
                            )}
                          </div>
                          {sh.descricao && (
                            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{sh.descricao}</p>
                          )}
                          {/* Chips de sistemas */}
                          {sh.sistemas.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {sh.sistemas.map((v) => (
                                <span key={v.entidadeSistemaId} className="text-[10px] px-2 py-0.5 rounded-full bg-sysgate-50 text-sysgate-700 font-medium border border-sysgate-100">
                                  {v.entidadeSistema.nome}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => onEditarStakeholder(sh, entidade)} className="p-1 rounded text-gray-400 hover:text-sysgate-600 hover:bg-sysgate-50 transition-colors">
                            <IconEdit />
                          </button>
                          <button onClick={() => onDeletarStakeholder(sh)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <IconTrash />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
