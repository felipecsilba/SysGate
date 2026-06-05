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
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'ontem'
  if (d < 30) return `há ${d} dias`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function notaPreview(nota) {
  if ((nota.tipo === 'checklist' || nota.tipo === 'lista') && Array.isArray(nota.itens) && nota.itens.length) {
    return nota.itens.slice(0, 3).map(i => (i.feito ? '✓ ' : '○ ') + (i.texto || '')).join('  ')
  }
  return (nota.conteudo || '').substring(0, 120)
}

// ── Acesso Rápido — todos os módulos ─────────────────────────────────────────

const ATALHOS = [
  {
    to: '/chamados',
    label: 'Chamados',
    desc: 'Acompanhar e gerenciar tickets',
    color: 'bg-sysgate-50 text-sysgate-600 group-hover:bg-sysgate-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    to: '/portfolio',
    label: 'Portfólio',
    desc: 'Municípios, entidades e contatos',
    color: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    ),
  },
  {
    to: '/scripts',
    label: 'Extensões',
    desc: 'Scripts BFC, fórmulas e relatórios',
    color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>
      </svg>
    ),
  },
  {
    to: '/notas',
    label: 'Notas',
    desc: 'Anotações pessoais e checklists',
    color: 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/>
        <path d="M17.5 2.5a2.121 2.121 0 0 1 3 3L12 14l-4 1 1-4 7.5-7.5z"/>
      </svg>
    ),
  },
  {
    to: '/sandbox',
    label: 'Sandbox',
    desc: 'Testar endpoints e envio em lote',
    color: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
  {
    to: '/analisador-json',
    label: 'Analisador JSON',
    desc: 'Visualizar, buscar e comparar JSON',
    color: 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/>
        <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>
      </svg>
    ),
  },
  {
    to: '/municipios',
    label: 'Central de Tokens',
    desc: 'Tokens de acesso por município',
    color: 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
      </svg>
    ),
  },
  {
    to: '/historico',
    label: 'Histórico',
    desc: 'Registro de requisições à API',
    color: 'bg-gray-50 text-gray-500 group-hover:bg-gray-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
  },
]

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, to, iconCls, alerta }) {
  const inner = (
    <div className={`card p-4 flex items-center gap-4 transition-all duration-200 ${to ? 'hover:shadow-md hover:-translate-y-0.5' : ''}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${iconCls}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">{label}</p>
        <div className="flex items-baseline gap-2 mt-1.5">
          {value === null ? (
            <span className="w-10 h-7 bg-gray-100 rounded-md animate-pulse inline-block" />
          ) : (
            <span className={`text-3xl font-bold leading-none ${alerta && value > 0 ? 'text-orange-500' : 'text-gray-900'}`}>
              {value}
            </span>
          )}
          {alerta && value > 0 && (
            <span className="text-[11px] font-bold text-orange-400 tracking-wide">atenção</span>
          )}
        </div>
      </div>
      {to && (
        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      )}
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
        meusChamados:
          resMeus.status === 'fulfilled' ? (resMeus.value.total ?? 0) : null,
        semResponsavel:
          resSem.status === 'fulfilled' ? (resSem.value.total ?? 0) : null,
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
        setNotasFixadas((resNotas.value || []).filter((n) => n.fixada).slice(0, 8))
    })()
  }, [usuario?.id])

  const saudacao = getSaudacao()
  const primeiroNome = (usuario?.nome || usuario?.login || '').split(' ')[0]
  const dataStr = getDataFormatada()

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* ── Cabeçalho personalizado ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {saudacao}, {primeiroNome}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{dataStr}</p>
      </div>

      {/* ── Cards de estatísticas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Minha Fila"
          value={stats.meusChamados}
          to="/chamados"
          iconCls="bg-sysgate-100 text-sysgate-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="m9 14 2 2 4-4"/>
            </svg>
          }
        />
        <StatCard
          label="Sem Responsável"
          value={stats.semResponsavel}
          to="/chamados"
          iconCls={stats.semResponsavel > 0 ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400'}
          alerta={stats.semResponsavel > 0}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="17" y1="8" x2="22" y2="13"/>
              <line x1="22" y1="8" x2="17" y2="13"/>
            </svg>
          }
        />
        <StatCard
          label="Em Aberto"
          value={stats.totalAbertos}
          to="/chamados"
          iconCls="bg-blue-100 text-blue-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          }
        />
        <StatCard
          label="Portfólio"
          value={stats.portfolio}
          to="/portfolio"
          iconCls="bg-violet-100 text-violet-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
          }
        />
      </div>

      {/* ── Minha Fila ── */}
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
            Ver minha fila
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        <div className="card overflow-hidden">
          {meusChamados.length === 0 ? (
            <div className="p-8 text-center">
              {stats.meusChamados === null ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-sysgate-500 rounded-full animate-spin" />
                  Carregando...
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-500">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <path d="m9 11 3 3L22 4"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Fila limpa</p>
                  <p className="text-xs text-gray-400 mt-0.5">Nenhum chamado aberto na sua fila</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {meusChamados.map((c) => (
                <Link
                  to="/chamados"
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-sysgate-50/40 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_CORES[c.status] || '#94A3B8' }}
                  />
                  <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">{c.titulo}</span>
                  {c.prioridade && c.prioridade !== 'Normal' && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor: (PRIORIDADE_CORES[c.prioridade] || '#94A3B8') + '22',
                        color: PRIORIDADE_CORES[c.prioridade] || '#94A3B8',
                      }}
                    >
                      {c.prioridade}
                    </span>
                  )}
                  {c.municipio && (
                    <span className="text-xs text-gray-400 truncate max-w-[120px] hidden sm:block">{c.municipio}</span>
                  )}
                  <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                    {tempoRelativo(c.atualizadoEm || c.criadoEm)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Acesso Rápido ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 rounded-full bg-sysgate-600" />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Acesso Rápido</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ATALHOS.map(({ to, icon, label, desc, color }) => (
            <Link
              key={to}
              to={to}
              className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${color}`}>
                {icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm group-hover:text-sysgate-600 transition-colors">
                  {label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
              <div className="mt-auto flex items-center gap-1 text-xs text-sysgate-500 group-hover:text-sysgate-700 transition-colors font-semibold">
                Acessar
                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
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
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
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
                    <svg className="w-3 h-3 text-gray-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z"/>
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