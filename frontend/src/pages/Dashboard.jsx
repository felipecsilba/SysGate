import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import { chamadosApi, notasApi, portfolioApi } from '../lib/api'
import { STATUS_CORES, PRIORIDADE_CORES } from './Chamados/constants'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSaudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getDataFormatada() {
  const s = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function tempoRelativo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'ontem'
  if (d < 30) return `${d}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function notaPreview(nota) {
  if ((nota.tipo === 'checklist' || nota.tipo === 'lista') && Array.isArray(nota.itens) && nota.itens.length) {
    return nota.itens.slice(0, 3).map(i => (i.feito ? '✓ ' : '○ ') + (i.texto || '')).join('  ')
  }
  return (nota.conteudo || '').substring(0, 120)
}

// ── Módulos do Acesso Rápido ──────────────────────────────────────────────────

const ATALHOS = [
  {
    to: '/chamados',
    label: 'Chamados',
    desc: 'Tickets e suporte',
    bg: 'bg-sysgate-50',
    ic: 'text-sysgate-600',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="3.5" y="1.5" width="11" height="15" rx="1.5"/>
        <line x1="6" y1="6" x2="12" y2="6"/>
        <line x1="6" y1="9" x2="12" y2="9"/>
        <line x1="6" y1="12" x2="9" y2="12"/>
      </svg>
    ),
  },
  {
    to: '/portfolio',
    label: 'Portfólio',
    desc: 'Municípios e entidades',
    bg: 'bg-violet-50',
    ic: 'text-violet-600',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="1.5" y="6.5" width="15" height="10" rx="1.5"/>
        <path d="M6 6.5V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/>
      </svg>
    ),
  },
  {
    to: '/scripts',
    label: 'Extensões',
    desc: 'Scripts e fórmulas',
    bg: 'bg-emerald-50',
    ic: 'text-emerald-600',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="5.5,5.5 2,9 5.5,12.5"/>
        <polyline points="12.5,5.5 16,9 12.5,12.5"/>
        <line x1="10.5" y1="4" x2="7.5" y2="14"/>
      </svg>
    ),
  },
  {
    to: '/notas',
    label: 'Notas',
    desc: 'Anotações e checklists',
    bg: 'bg-yellow-50',
    ic: 'text-yellow-600',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M3 3h9l3 3v9H3z"/>
        <path d="M12 3v3h3"/>
        <line x1="6" y1="9" x2="12" y2="9"/>
        <line x1="6" y1="12" x2="9.5" y2="12"/>
      </svg>
    ),
  },
  {
    to: '/sandbox',
    label: 'Sandbox',
    desc: 'Testar endpoints',
    bg: 'bg-blue-50',
    ic: 'text-blue-600',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M10.5 2L4 10h5.5l-1.5 6L16 8h-5.5l1-6z"/>
      </svg>
    ),
  },
  {
    to: '/analisador-json',
    label: 'JSON',
    desc: 'Analisar e comparar',
    bg: 'bg-orange-50',
    ic: 'text-orange-600',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M6 2.5H4.5A1.5 1.5 0 0 0 3 4v2.5a1.5 1.5 0 0 1-1.5 1.5A1.5 1.5 0 0 1 3 9.5V12A1.5 1.5 0 0 0 4.5 13.5H6"/>
        <path d="M12 2.5h1.5A1.5 1.5 0 0 1 15 4v2.5a1.5 1.5 0 0 0 1.5 1.5A1.5 1.5 0 0 0 15 9.5V12a1.5 1.5 0 0 1-1.5 1.5H12"/>
      </svg>
    ),
  },
]

// ── StatCard — layout vertical ────────────────────────────────────────────────

function StatCard({ icon, iconBg, iconColor, label, value, subtext, subtextCls, to }) {
  const inner = (
    <div className={`card p-5 transition-all duration-200 ${to ? 'hover:shadow-md hover:-translate-y-0.5' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        {to && (
          <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3l5 5-5 5"/>
          </svg>
        )}
      </div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <div className="mt-1">
        {value === null
          ? <span className="w-12 h-8 bg-gray-100 rounded animate-pulse inline-block" />
          : <span className="text-3xl font-bold text-gray-900 tabular-nums">{value}</span>
        }
      </div>
      <p className={`text-xs mt-1 font-medium ${subtextCls || 'text-gray-400'}`}>{subtext}</p>
    </div>
  )
  return to ? <Link to={to} className="block">{inner}</Link> : inner
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const usuario = useAuthStore((s) => s.usuario)

  const [stats, setStats] = useState({
    meusChamados: null,
    semResponsavel: null,
    totalAbertos: null,
    portfolio: null,
  })
  const [meusChamados, setMeusChamados] = useState([])
  const [notasFixadas, setNotasFixadas] = useState([])

  useEffect(() => {
    if (!usuario?.id) return
    ;(async () => {
      const [resEstat, resMeus, resSem, resPort, resNotas] = await Promise.allSettled([
        chamadosApi.estatisticas(),
        chamadosApi.listar({ responsavelId: usuario.id, excluirEncerrados: true, limite: 5 }),
        chamadosApi.listar({ semResponsavel: true, excluirEncerrados: true, limite: 1 }),
        portfolioApi.listar(),
        notasApi.listar(),
      ])

      setStats({
        meusChamados: resMeus.status === 'fulfilled' ? (resMeus.value.total ?? 0) : null,
        semResponsavel: resSem.status === 'fulfilled' ? (resSem.value.total ?? 0) : null,
        totalAbertos:
          resEstat.status === 'fulfilled'
            ? Object.entries(resEstat.value)
                .filter(([k]) => !['Concluido', 'Cancelado'].includes(k))
                .reduce((acc, [, v]) => acc + v, 0)
            : null,
        portfolio:
          resPort.status === 'fulfilled'
            ? (resPort.value.total ?? resPort.value.data?.length ?? 0)
            : null,
      })

      if (resMeus.status === 'fulfilled') setMeusChamados(resMeus.value.data || [])
      if (resNotas.status === 'fulfilled')
        setNotasFixadas((resNotas.value || []).filter((n) => n.fixada).slice(0, 6))
    })()
  }, [usuario?.id])

  const primeiroNome = (usuario?.nome || usuario?.login || '').split(' ')[0]

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* ── Cabeçalho ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getSaudacao()}, {primeiroNome}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{getDataFormatada()}</p>
      </div>

      {/* ── Cards de estatísticas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <StatCard
          label="Minha Fila"
          value={stats.meusChamados}
          subtext="chamados atribuídos"
          to="/chamados"
          iconBg="bg-sysgate-100"
          iconColor="text-sysgate-600"
          icon={
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M6.5 2H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-1.5"/>
              <rect x="6.5" y="1" width="5" height="3" rx="1"/>
              <path d="m6.5 10.5 2 2 3-3"/>
            </svg>
          }
        />

        <StatCard
          label="Sem Responsável"
          value={stats.semResponsavel}
          subtext={
            stats.semResponsavel === null ? '' :
            stats.semResponsavel > 0 ? 'requer atenção' : 'todos atribuídos'
          }
          subtextCls={stats.semResponsavel > 0 ? 'text-orange-500' : 'text-gray-400'}
          to="/chamados"
          iconBg={stats.semResponsavel > 0 ? 'bg-orange-100' : 'bg-gray-100'}
          iconColor={stats.semResponsavel > 0 ? 'text-orange-500' : 'text-gray-400'}
          icon={
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <circle cx="7.5" cy="6" r="3"/>
              <path d="M2 16a6 6 0 0 1 8.6-5.4"/>
              <line x1="12.5" y1="11.5" x2="16" y2="15"/>
              <line x1="16" y1="11.5" x2="12.5" y2="15"/>
            </svg>
          }
        />

        <StatCard
          label="Em Aberto"
          value={stats.totalAbertos}
          subtext="total em andamento"
          to="/chamados"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          icon={
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="1,9 4,9 5.5,4.5 8,13.5 10.5,7 12.5,11 14,9 17,9"/>
            </svg>
          }
        />

        <StatCard
          label="Portfólio"
          value={stats.portfolio}
          subtext="municípios cadastrados"
          to="/portfolio"
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          icon={
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="1.5" y="7" width="15" height="9.5" rx="1.5"/>
              <path d="M6 7V5.5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2V7"/>
            </svg>
          }
        />

      </div>

      {/* ── Miolo: Minha Fila + Acesso Rápido ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-5">

        {/* Minha Fila */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-sysgate-600" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Minha Fila</h2>
            </div>
            <Link
              to="/chamados"
              className="text-xs text-sysgate-600 hover:text-sysgate-700 font-medium flex items-center gap-0.5 hover:underline"
            >
              Ver todos
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3l5 5-5 5"/>
              </svg>
            </Link>
          </div>

          <div className="card overflow-hidden">
            {meusChamados.length === 0 ? (
              <div className="p-10 text-center">
                {stats.meusChamados === null ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <span className="w-4 h-4 border-2 border-gray-300 border-t-sysgate-500 rounded-full animate-spin" />
                    Carregando...
                  </div>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-2.5">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-500">
                        <path d="M2.5 8.5 6 12l7.5-7.5"/>
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Fila limpa</p>
                    <p className="text-xs text-gray-400 mt-0.5">Nenhum chamado aberto na sua fila</p>
                  </>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Título</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">Município</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Há</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {meusChamados.map((c) => (
                    <tr key={c.id} className="hover:bg-sysgate-50/30 transition-colors">
                      <td className="px-4 py-3 min-w-0">
                        <div className="flex items-center gap-2">
                          {c.prioridade && c.prioridade !== 'Normal' && (
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: PRIORIDADE_CORES[c.prioridade] }}
                            />
                          )}
                          <span className="text-sm text-gray-800 truncate max-w-[200px] lg:max-w-none">{c.titulo}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-400 truncate block max-w-[130px]">{c.municipio || '—'}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                          style={{
                            backgroundColor: (STATUS_CORES[c.status] || '#94A3B8') + '1f',
                            color: STATUS_CORES[c.status] || '#94A3B8',
                          }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 text-right tabular-nums whitespace-nowrap">
                        {tempoRelativo(c.atualizadoEm || c.criadoEm)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Acesso Rápido */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 rounded-full bg-sysgate-600" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Acesso Rápido</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {ATALHOS.map(({ to, icon, label, desc, bg, ic }) => (
              <Link
                key={to}
                to={to}
                className="card p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col gap-2.5"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg} ${ic} transition-transform duration-200 group-hover:scale-110`}>
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 group-hover:text-sysgate-600 transition-colors leading-snug">
                    {label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* ── Notas Fixadas (condicional) ── */}
      {notasFixadas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-sysgate-600" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Notas Fixadas</h2>
            </div>
            <Link
              to="/notas"
              className="text-xs text-sysgate-600 hover:text-sysgate-700 font-medium flex items-center gap-0.5 hover:underline"
            >
              Ver todas
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3l5 5-5 5"/>
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {notasFixadas.map((nota) => {
              const preview = notaPreview(nota)
              const titulo = nota.titulo || preview.substring(0, 40) || 'Nota'
              return (
                <Link
                  key={nota.id}
                  to="/notas"
                  className="block rounded-xl p-3 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: nota.cor || '#FFFDE7', border: '1px solid rgba(0,0,0,0.08)' }}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{titulo}</p>
                    <svg className="w-3 h-3 text-gray-500 shrink-0 mt-0.5" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M2 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v9l-4-2-4 2V2z"/>
                    </svg>
                  </div>
                  {nota.titulo && preview && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{preview}</p>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}