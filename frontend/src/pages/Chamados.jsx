import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import api, { chamadosApi, catalogoApi, portfolioApi } from '../lib/api'
import { confirmClose, isFormDirty } from '../lib/formGuard'
import useAuthStore from '../stores/authStore'

// ── Constantes de cores ──────────────────────────────────────────────────────
const STATUS_CORES = {
  'Nao Analisado':      '#94A3B8',
  'Em Analise':         '#3B82F6',
  'Em Atendimento':     '#F59E0B',
  'Aguardando Retorno': '#F97316',
  'Concluido':          '#22C55E',
}

const CLASSIF_CORES = {
  'Pendencia de Migracao': '#8B5CF6',
  'Configuracao':          '#3B82F6',
  'Bug':                   '#EF4444',
  'Duvida':                '#F59E0B',
}

const PRIORIDADE_CORES = {
  'Baixa':   '#94A3B8',
  'Normal':  '#3B82F6',
  'Alta':    '#F59E0B',
  'Urgente': '#EF4444',
}

const STATUS_OPTS    = ['Nao Analisado', 'Em Analise', 'Em Atendimento', 'Aguardando Retorno', 'Concluido']
const CLASSIF_OPTS   = ['', 'Pendencia de Migracao', 'Configuracao', 'Bug', 'Duvida']
const PRIORIDADE_OPTS = ['Baixa', 'Normal', 'Alta', 'Urgente']

// ── Histórico: metadados por tipo ────────────────────────────────────────────
const HISTORICO_META = {
  criacao:       { cor: '#22C55E', label: 'Chamado criado' },
  status:        { cor: '#3B82F6', label: 'Status' },
  responsavel:   { cor: '#8B5CF6', label: 'Responsável' },
  classificacao: { cor: '#6366f1', label: 'Classificação' },
  prioridade:    { cor: '#F59E0B', label: 'Prioridade' },
  titulo:        { cor: '#64748B', label: 'Título' },
  vertical:      { cor: '#EC4899', label: 'Vertical' },
}

function descreverHistorico(h) {
  switch (h.tipo) {
    case 'criacao':      return 'Chamado criado'
    case 'status':       return h.valorAntes ? `De "${h.valorAntes}" → "${h.valorDepois}"` : `Status: "${h.valorDepois}"`
    case 'responsavel':
      if (!h.valorDepois) return `Responsável removido${h.valorAntes ? ` (era ${h.valorAntes})` : ''}`
      if (!h.valorAntes)  return `Responsável atribuído: ${h.valorDepois}`
      return `Responsável: ${h.valorAntes} → ${h.valorDepois}`
    case 'classificacao':
      if (!h.valorDepois) return `Classificação removida${h.valorAntes ? ` (era ${h.valorAntes})` : ''}`
      return h.valorAntes ? `${h.valorAntes} → ${h.valorDepois}` : `Classificado como "${h.valorDepois}"`
    case 'prioridade':   return h.valorAntes ? `${h.valorAntes} → ${h.valorDepois}` : `Prioridade: ${h.valorDepois}`
    case 'titulo':       return 'Título alterado'
    case 'vertical':
      if (!h.valorDepois) return 'Vertical removida'
      return h.valorAntes ? `${h.valorAntes} → ${h.valorDepois}` : `Vertical: ${h.valorDepois}`
    default:             return h.tipo
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatData(data) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function formatDataHora(data) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
function tempoRelativo(data) {
  const diff = Date.now() - new Date(data).getTime()
  const min = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min}min`
  if (h < 24)  return `há ${h}h`
  if (d === 1) return 'há 1 dia'
  return `há ${d} dias`
}
function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
function iniciais(nome) {
  if (!nome) return '?'
  const p = nome.trim().split(' ')
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}
function iconeAnexo(tipo) {
  if (!tipo) return '📎'
  if (tipo.startsWith('image/')) return '🖼️'
  if (tipo === 'application/pdf') return '📄'
  return '📎'
}
function ticketNum(c) {
  return `#CH-${new Date(c.criadoEm).getFullYear()}-${String(c.id).padStart(4, '0')}`
}

// ── Badge colorido ─────────────────────────────────────────────────────────────
function Badge({ label, cor, className = '' }) {
  if (!label) return null
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${className}`}
      style={{ backgroundColor: cor || '#94A3B8' }}>{label}</span>
  )
}

// ── Avatar com iniciais ────────────────────────────────────────────────────────
function Avatar({ nome, size = 7 }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-sysgate-100 text-sysgate-700 flex items-center justify-center text-xs font-bold shrink-0`}>
      {iniciais(nome)}
    </div>
  )
}

// ── Painel de Histórico ────────────────────────────────────────────────────────
function PainelHistorico({ chamadoId, onFechar }) {
  const [historico, setHistorico] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    chamadosApi.historico(chamadoId).then(setHistorico).catch(() => {}).finally(() => setCarregando(false))
  }, [chamadoId])

  return (
    <div className="w-72 shrink-0 border-l border-gray-200 flex flex-col bg-slate-50/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-sysgate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Histórico</span>
        </div>
        <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {carregando ? (
          <div className="text-center text-xs text-gray-400 py-6">Carregando…</div>
        ) : historico.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-6">Nenhum histórico registrado.</div>
        ) : (
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
            <div className="space-y-4">
              {historico.map(h => {
                const meta = HISTORICO_META[h.tipo] || { cor: '#94A3B8' }
                return (
                  <div key={h.id} className="flex gap-3 relative">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white shrink-0 mt-0.5 z-10 shadow-sm"
                      style={{ backgroundColor: meta.cor }} />
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-xs font-semibold text-gray-800 leading-snug">{descreverHistorico(h)}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        por <span className="font-medium text-gray-700">{h.usuario?.nome || '—'}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDataHora(h.criadoEm)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
const PALETTE = ['#6366f1', '#3B82F6', '#22C55E', '#F59E0B', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

function StatCard({ label, value, sub, cor = '#6366f1', icon }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: cor + '18' }}>
        <svg className="w-5 h-5" fill="none" stroke={cor} strokeWidth="1.75" viewBox="0 0 24 24">{icon}</svg>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      {label && <p className="font-semibold text-gray-700 mb-1 truncate max-w-[180px]">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function Dashboard() {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    chamadosApi.dashboard().then(setDados).catch(() => {}).finally(() => setCarregando(false))
  }, [])

  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
        Carregando dashboard…
      </div>
    )
  }
  if (!dados) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
        Não foi possível carregar os dados.
      </div>
    )
  }

  const { resumo, porStatus, porMunicipio, porVertical, porClassificacao, porPrioridade, semResponsavel, porDia } = dados

  // Formata os dias para exibição mais curta
  const dadosDia = (porDia || []).map(d => ({
    ...d,
    diaFmt: new Date(d.dia + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }))

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/40">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* ── Cards de resumo ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total de chamados"
            value={resumo.total}
            cor="#6366f1"
            icon={<><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></>}
          />
          <StatCard
            label="Abertos"
            value={resumo.abertos}
            sub="Não analisado + Em análise + Em atendimento"
            cor="#3B82F6"
            icon={<><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>}
          />
          <StatCard
            label="Aguardando retorno"
            value={resumo.aguardando}
            cor="#F97316"
            icon={<><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>}
          />
          <StatCard
            label="Concluídos este mês"
            value={resumo.concluidosMes}
            sub={`${resumo.criadosMes} criados no mês · ${resumo.criadosHoje} hoje`}
            cor="#22C55E"
            icon={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
          />
        </div>

        {/* ── Linha 2: Chamados por dia + Por status ────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Área — chamados por dia */}
          <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Chamados nos últimos 14 dias</h3>
            {dadosDia.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-gray-400">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={dadosDia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradDia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="diaFmt" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" name="Chamados" stroke="#6366f1" strokeWidth={2}
                    fill="url(#gradDia)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Donut — por status */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Por status</h3>
            {porStatus.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-gray-400">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={porStatus} dataKey="total" nameKey="status" cx="50%" cy="50%"
                    innerRadius={45} outerRadius={72} paddingAngle={3}>
                    {porStatus.map(entry => (
                      <Cell key={entry.status} fill={STATUS_CORES[entry.status] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => <span style={{ fontSize: 10, color: '#64748b' }}>{value}</span>}
                    iconType="circle" iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Linha 3: Por município + Por vertical ─────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Barras — por município */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              Top municípios
            </h3>
            {porMunicipio.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-gray-400">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, porMunicipio.length * 36)}>
                <BarChart data={porMunicipio} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="municipio" width={110}
                    tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false}
                    tickFormatter={v => v?.length > 16 ? v.slice(0, 15) + '…' : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Chamados" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {porMunicipio.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Barras — por vertical */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              Por vertical
            </h3>
            {porVertical.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-gray-400">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, porVertical.length * 36)}>
                <BarChart data={porVertical} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="vertical" width={100}
                    tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false}
                    tickFormatter={v => v?.length > 14 ? v.slice(0, 13) + '…' : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Chamados" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {porVertical.map((_, i) => <Cell key={i} fill={PALETTE[(i + 3) % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Linha 4: Por classificação + Por prioridade ───────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Donut — por classificação */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Por classificação</h3>
            {porClassificacao.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-sm text-gray-400">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={porClassificacao} dataKey="total" nameKey="classificacao"
                    cx="50%" cy="48%" innerRadius={42} outerRadius={68} paddingAngle={3}>
                    {porClassificacao.map(entry => (
                      <Cell key={entry.classificacao} fill={CLASSIF_CORES[entry.classificacao] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v => <span style={{ fontSize: 10, color: '#64748b' }}>{v}</span>}
                    iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Barras — por prioridade */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Por prioridade</h3>
            {porPrioridade.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-sm text-gray-400">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={porPrioridade} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="prioridade" tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Chamados" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {porPrioridade.map(entry => (
                      <Cell key={entry.prioridade} fill={PRIORIDADE_CORES[entry.prioridade] || '#94A3B8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Chamados sem responsável ─────────────────────────────────────── */}
        {semResponsavel.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Abertos sem responsável ({semResponsavel.length})
              </h3>
            </div>
            <div className="space-y-2">
              {semResponsavel.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_CORES[c.status] || '#94A3B8' }} />
                  <span className="flex-1 text-sm text-gray-800 font-medium truncate">{c.titulo}</span>
                  {c.municipio && <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{c.municipio}</span>}
                  {c.vertical && <Badge label={c.vertical} cor="#6366f1" />}
                  <span className="text-xs text-gray-400 shrink-0 hidden md:block"
                    style={{ color: PRIORIDADE_CORES[c.prioridade] }}>
                    {c.prioridade}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">{formatData(c.criadoEm)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ── Modal Novo / Editar Chamado ───────────────────────────────────────────────
function ModalChamado({ chamado, usuarios, catalogo, onSalvo, onFechar }) {
  const isEdicao = !!chamado
  const [form, setForm] = useState({
    titulo:        chamado?.titulo        || '',
    descricao:     chamado?.descricao     || '',
    municipio:     chamado?.municipio     || '',
    entidade:      chamado?.entidade      || '',
    classificacao: chamado?.classificacao || '',
    prioridade:    chamado?.prioridade    || 'Normal',
    vertical:      chamado?.vertical      || '',
    sistema:       chamado?.sistema       || '',
    responsavelId: chamado?.responsavelId || '',
  })
  const [arquivos, setArquivos]             = useState([])
  const [salvando, setSalvando]             = useState(false)
  const [erro, setErro]                     = useState('')
  const [portMunicipios, setPortMunicipios] = useState([])
  const [portEntidades, setPortEntidades]   = useState([])
  const [carregandoEnt, setCarregandoEnt]   = useState(false)
  const fileRef    = useRef()
  const initialRef = useRef({ ...form })
  const fecharComGuard = () => confirmClose(isFormDirty(initialRef.current, form) || arquivos.length > 0, onFechar)

  useEffect(() => {
    portfolioApi.listar().then(data => {
      setPortMunicipios(data)
      if (chamado?.municipio) {
        const mun = data.find(m => m.nome === chamado.municipio)
        if (mun) portfolioApi.entidades(mun.id).then(setPortEntidades).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  const handleMunicipioChange = (nome) => {
    setField('municipio', nome); setField('entidade', ''); setPortEntidades([])
    if (!nome) return
    const mun = portMunicipios.find(m => m.nome === nome)
    if (!mun) return
    setCarregandoEnt(true)
    portfolioApi.entidades(mun.id).then(setPortEntidades).catch(() => {}).finally(() => setCarregandoEnt(false))
  }

  const sistemasDaVertical = form.vertical
    ? (catalogo.find(v => v.nome === form.vertical)?.sistemas || [])
    : []

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim()) { setErro('Título é obrigatório'); return }
    setSalvando(true); setErro('')
    try {
      const payload = {
        titulo: form.titulo.trim(), descricao: form.descricao.trim() || null,
        municipio: form.municipio.trim() || null, entidade: form.entidade.trim() || null,
        classificacao: form.classificacao || null, prioridade: form.prioridade,
        vertical: form.vertical || null, sistema: form.sistema || null,
        responsavelId: form.responsavelId ? Number(form.responsavelId) : null,
      }
      let criado
      if (isEdicao) { criado = await chamadosApi.atualizar(chamado.id, payload) }
      else {
        criado = await chamadosApi.criar(payload)
        for (const arq of arquivos) await chamadosApi.criarAnexo(criado.id, arq)
      }
      onSalvo(criado)
    } catch (e) { setErro(e.message) } finally { setSalvando(false) }
  }

  const handleFiles = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => setArquivos(prev => [...prev, {
        nomeArquivo: file.name, tipo: file.type,
        conteudo: ev.target.result.split(',')[1], tamanho: file.size,
      }])
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{isEdicao ? 'Editar Chamado' : 'Novo Chamado'}</h2>
          <button onClick={fecharComGuard} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {erro && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}
          <div>
            <label className="label">Título *</label>
            <input className="input" value={form.titulo} onChange={e => setField('titulo', e.target.value)} required />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input min-h-[80px]" value={form.descricao} onChange={e => setField('descricao', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Município</label>
              <select className="input" value={form.municipio} onChange={e => handleMunicipioChange(e.target.value)}>
                <option value="">— Selecione —</option>
                {portMunicipios.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Entidade</label>
              <select className="input" value={form.entidade} onChange={e => setField('entidade', e.target.value)}
                disabled={!form.municipio || (portEntidades.length === 0 && !carregandoEnt)}>
                <option value="">{carregandoEnt ? 'Carregando…' : portEntidades.length === 0 && form.municipio ? 'Nenhuma entidade' : '— Selecione —'}</option>
                {portEntidades.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Classificação</label>
              <select className="input" value={form.classificacao} onChange={e => setField('classificacao', e.target.value)}>
                <option value="">— Sem classificação —</option>
                {CLASSIF_OPTS.filter(Boolean).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Prioridade</label>
              <select className="input" value={form.prioridade} onChange={e => setField('prioridade', e.target.value)}>
                {PRIORIDADE_OPTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vertical</label>
              <select className="input" value={form.vertical} onChange={e => { setField('vertical', e.target.value); setField('sistema', '') }}>
                <option value="">— Selecione —</option>
                {catalogo.map(v => <option key={v.id} value={v.nome}>{v.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sistema</label>
              <select className="input" value={form.sistema} onChange={e => setField('sistema', e.target.value)} disabled={!form.vertical}>
                <option value="">— Selecione —</option>
                {sistemasDaVertical.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Responsável</label>
            <select className="input" value={form.responsavelId} onChange={e => setField('responsavelId', e.target.value)}>
              <option value="">— Sem responsável —</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>
          {!isEdicao && (
            <div>
              <label className="label">Anexos</label>
              <input type="file" multiple ref={fileRef} onChange={handleFiles} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-sysgate-600 hover:underline">+ Selecionar arquivos</button>
              {arquivos.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {arquivos.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{iconeAnexo(a.tipo)}</span>
                      <span className="truncate">{a.nomeArquivo}</span>
                      <span className="text-gray-400 text-xs shrink-0">{formatBytes(a.tamanho)}</span>
                      <button type="button" className="text-red-400 hover:text-red-600 text-xs ml-auto"
                        onClick={() => setArquivos(prev => prev.filter((_, j) => j !== i))}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={fecharComGuard} className="btn btn-ghost text-sm">Cancelar</button>
          <button onClick={handleSubmit} disabled={salvando} className="btn text-sm">
            {salvando ? 'Salvando…' : isEdicao ? 'Salvar' : 'Criar Chamado'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Chamados() {
  const usuario = useAuthStore(s => s.usuario)
  const isAdmin = usuario?.role === 'admin'

  const [aba, setAba]                         = useState('lista') // 'lista' | 'dashboard'
  const [chamados, setChamados]               = useState([])
  const [chamadoSelId, setChamadoSelId]       = useState(null)
  const [detalhe, setDetalhe]                 = useState(null)
  const [busca, setBusca]                     = useState('')
  const [filtroStatus, setFiltroStatus]       = useState('')
  const [filtroClassif, setFiltroClassif]     = useState('')
  const [filtroMeusChamados, setFiltroMeus]   = useState(false)
  const [mostrarFiltros, setMostrarFiltros]   = useState(false)
  const [carregando, setCarregando]           = useState(true)
  const [modalNovo, setModalNovo]             = useState(false)
  const [modalEditar, setModalEditar]         = useState(false)
  const [usuarios, setUsuarios]               = useState([])
  const [catalogo, setCatalogo]               = useState([])
  const [novoComentario, setNovoComentario]   = useState('')
  const [enviandoComent, setEnviandoComent]   = useState(false)
  const [uploadAnexo, setUploadAnexo]         = useState(false)
  const [mostrarLista, setMostrarLista]       = useState(true)
  const [dragOver, setDragOver]               = useState(false)
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [historicoKey, setHistoricoKey]       = useState(0)
  const fileAnexoRef = useRef()

  const chamadosFiltrados = filtroMeusChamados
    ? chamados.filter(c => c.criadoPor?.id === usuario?.id)
    : chamados

  const carregar = async () => {
    setCarregando(true)
    try {
      const params = {}
      if (busca)         params.busca          = busca
      if (filtroStatus)  params.status         = filtroStatus
      if (filtroClassif) params.classificacao  = filtroClassif
      setChamados(await chamadosApi.listar(params))
    } catch (e) { console.error(e) }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [busca, filtroStatus, filtroClassif])

  useEffect(() => {
    api.get('/usuarios').then(r => setUsuarios(r.data.filter(u => u.ativo))).catch(() => {})
    catalogoApi.listar().then(setCatalogo).catch(() => {})
  }, [])

  const selecionarChamado = async (id) => {
    setChamadoSelId(id)
    setMostrarLista(false)
    setHistoricoKey(k => k + 1)
    try { setDetalhe(await chamadosApi.obter(id)) } catch (e) { console.error(e) }
  }

  const recarregarDetalhe = async () => {
    if (!chamadoSelId) return
    try {
      const data = await chamadosApi.obter(chamadoSelId)
      setDetalhe(data)
      setChamados(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c))
      setHistoricoKey(k => k + 1)
    } catch (e) { console.error(e) }
  }

  const atualizarCampo = async (campo, valor) => {
    try {
      const atualizado = await chamadosApi.atualizar(chamadoSelId, { [campo]: valor || null })
      setDetalhe(prev => ({ ...prev, ...atualizado }))
      setChamados(prev => prev.map(c => c.id === atualizado.id ? { ...c, ...atualizado } : c))
      setHistoricoKey(k => k + 1)
    } catch (e) { console.error(e) }
  }

  const enviarComentario = async () => {
    if (!novoComentario.trim()) return
    setEnviandoComent(true)
    try {
      await chamadosApi.criarComentario(chamadoSelId, { conteudo: novoComentario })
      setNovoComentario('')
      await recarregarDetalhe()
    } catch (e) { console.error(e) }
    finally { setEnviandoComent(false) }
  }

  const deletarComentario = async (cid) => {
    if (!confirm('Remover comentário?')) return
    try { await chamadosApi.deletarComentario(cid); await recarregarDetalhe() } catch (e) { console.error(e) }
  }

  const processarArquivos = (files) => {
    if (!files.length) return
    setUploadAnexo(true)
    Promise.all(files.map(file => new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const base64 = ev.target.result.split(',')[1]
        resolve(chamadosApi.criarAnexo(chamadoSelId, { nomeArquivo: file.name, tipo: file.type, conteudo: base64, tamanho: file.size }))
      }
      reader.readAsDataURL(file)
    }))).then(() => recarregarDetalhe()).finally(() => setUploadAnexo(false))
  }

  const handleAnexoUpload = (e) => { processarArquivos(Array.from(e.target.files)); e.target.value = '' }
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); processarArquivos(Array.from(e.dataTransfer.files)) }

  const deletarAnexo = async (aid) => {
    if (!confirm('Remover anexo?')) return
    try { await chamadosApi.deletarAnexo(aid); await recarregarDetalhe() } catch (e) { console.error(e) }
  }

  const downloadAnexo = async (aid, nome) => {
    try {
      const resp = await api.get(`/chamados/anexos/${aid}`, { responseType: 'blob' })
      const url = URL.createObjectURL(resp.data)
      const a = document.createElement('a'); a.href = url; a.download = nome; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
  }

  const deletarChamado = async () => {
    if (!confirm('Remover chamado permanentemente? Esta ação não pode ser desfeita.')) return
    try {
      await chamadosApi.deletar(chamadoSelId)
      setChamados(prev => prev.filter(c => c.id !== chamadoSelId))
      setChamadoSelId(null); setDetalhe(null); setMostrarLista(true); setMostrarHistorico(false)
    } catch (e) { console.error(e) }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white shrink-0">
        <div className="w-1 h-6 rounded-full bg-sysgate-600" />
        <h1 className="text-base font-semibold text-gray-900">Chamados</h1>
        <span className="text-xs text-gray-400">| {chamados.length} chamado{chamados.length !== 1 ? 's' : ''}</span>

        {/* Sub-abas */}
        <div className="flex items-center gap-0.5 ml-4 bg-slate-100 rounded-lg p-0.5">
          {[
            { key: 'lista', label: 'Gestão',
              icon: <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>,
            },
            { key: 'dashboard', label: 'Dashboard',
              icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
            },
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setAba(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                aba === key
                  ? 'bg-white text-sysgate-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{icon}</svg>
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setModalNovo(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-sysgate-600 hover:bg-sysgate-700 text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Chamado
        </button>
      </div>

      {/* ── Aba Dashboard ────────────────────────────────────────────────── */}
      {aba === 'dashboard' && <Dashboard />}

      {/* ── Aba Lista (duas colunas) ──────────────────────────────────────── */}
      {aba === 'lista' && (
        <div className="flex flex-1 min-h-0">

          {/* Painel esquerdo */}
          <div className={`w-80 shrink-0 flex flex-col border-r border-gray-200 bg-slate-50 ${!mostrarLista && 'hidden md:flex'}`}>

            <div className="flex gap-0.5 px-2 pt-2.5 pb-2 bg-slate-50 border-b border-gray-200">
              {[
                { label: 'Todos', ativo: !filtroMeusChamados && !filtroStatus,
                  onClick: () => { setFiltroStatus(''); setFiltroMeus(false) },
                  icon: <path d="M4 6h16M4 12h16M4 18h16"/> },
                { label: 'Meus', ativo: filtroMeusChamados,
                  onClick: () => { setFiltroMeus(true); setFiltroStatus('') },
                  icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
                { label: 'Aguardando', ativo: !filtroMeusChamados && filtroStatus === 'Aguardando Retorno',
                  onClick: () => { setFiltroStatus('Aguardando Retorno'); setFiltroMeus(false) },
                  icon: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></> },
              ].map(({ label, ativo, onClick, icon }) => (
                <button key={label} onClick={onClick}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
                    ativo ? 'bg-sysgate-100 text-sysgate-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{icon}</svg>
                  {label}
                </button>
              ))}
            </div>

            <div className="px-3 py-2 bg-slate-50 border-b border-gray-200">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input className="input text-sm w-full pl-7" placeholder="Buscar chamados..."
                  value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {carregando ? (
                <div className="p-8 text-center text-sm text-gray-400">Carregando…</div>
              ) : chamadosFiltrados.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">Nenhum chamado encontrado.</div>
              ) : (
                chamadosFiltrados.map(c => (
                  <button key={c.id} onClick={() => selecionarChamado(c.id)}
                    className={`w-full text-left p-3 border-b border-gray-100 border-l-[3px] transition-colors ${
                      chamadoSelId === c.id ? 'bg-white shadow-sm' : 'hover:bg-white/70'
                    }`}
                    style={{ borderLeftColor: chamadoSelId === c.id ? '#6366f1' : (STATUS_CORES[c.status] || '#94A3B8') }}>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-2">{c.titulo}</p>
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      {c.classificacao && <Badge label={c.classificacao} cor={CLASSIF_CORES[c.classificacao]} />}
                      <span className="text-xs text-gray-400">• {formatData(c.criadoEm)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Avatar nome={c.criadoPor?.nome} size={5} />
                      <span className="text-xs text-gray-500 truncate flex-1">{c.criadoPor?.nome}</span>
                      {(c._count?.comentarios > 0 || c._count?.anexos > 0) && (
                        <div className="flex gap-2 shrink-0">
                          {c._count.comentarios > 0 && <span className="text-[10px] text-gray-400">💬 {c._count.comentarios}</span>}
                          {c._count.anexos > 0 && <span className="text-[10px] text-gray-400">📎 {c._count.anexos}</span>}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 bg-white">
              <button onClick={() => setMostrarFiltros(f => !f)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Filtros Avançados
                <svg className={`w-3 h-3 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {mostrarFiltros && (
                <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
                  <select className="input text-xs w-full" value={filtroStatus}
                    onChange={e => { setFiltroStatus(e.target.value); setFiltroMeus(false) }}>
                    <option value="">Todos os status</option>
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="input text-xs w-full" value={filtroClassif}
                    onChange={e => setFiltroClassif(e.target.value)}>
                    <option value="">Todas as classificações</option>
                    {CLASSIF_OPTS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Painel direito */}
          <div className={`flex-1 flex min-w-0 overflow-hidden bg-white ${mostrarLista && !detalhe ? 'hidden md:flex' : ''}`}>
            {!detalhe ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
                <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
                </svg>
                <p className="text-sm">Selecione um chamado para ver os detalhes</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-6 max-w-4xl w-full">

                    <button className="md:hidden text-sm text-sysgate-600"
                      onClick={() => { setMostrarLista(true); setChamadoSelId(null); setDetalhe(null); setMostrarHistorico(false) }}>
                      ← Voltar
                    </button>

                    {/* Cabeçalho */}
                    <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-gray-100 rounded-2xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <h2 className="text-xl font-bold text-gray-900 flex-1 leading-snug">{detalhe.titulo}</h2>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white shadow-sm">
                            <span className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: STATUS_CORES[detalhe.status] || '#94A3B8' }} />
                            <select className="text-xs font-medium text-gray-700 border-0 outline-none bg-transparent cursor-pointer"
                              value={detalhe.status} onChange={e => atualizarCampo('status', e.target.value)}>
                              {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <button onClick={() => setMostrarHistorico(h => !h)}
                            title={mostrarHistorico ? 'Fechar histórico' : 'Ver histórico'}
                            className={`p-1.5 rounded-lg transition-colors ${mostrarHistorico ? 'bg-sysgate-100 text-sysgate-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                            </svg>
                          </button>
                          <button onClick={() => setModalEditar(true)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Editar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          {isAdmin && (
                            <button onClick={deletarChamado}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Deletar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: (STATUS_CORES[detalhe.status] || '#94A3B8') + '20', color: STATUS_CORES[detalhe.status] || '#94A3B8' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_CORES[detalhe.status] || '#94A3B8' }} />
                          {detalhe.status}
                        </span>
                        <span className="text-xs text-gray-400 font-mono tracking-wide">{ticketNum(detalhe)}</span>
                      </div>
                    </div>

                    {/* Grid de informações */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 py-1">
                      {[
                        { label: 'MUNICÍPIO',        val: detalhe.municipio,       bold: true },
                        { label: 'ENTIDADE',         val: detalhe.entidade,        bold: true },
                        { label: 'CRIADO POR',       val: detalhe.criadoPor?.nome, avatar: true },
                        { label: 'RESPONSÁVEL',      val: detalhe.responsavel?.nome },
                        { label: 'DATA DE ABERTURA', val: formatData(detalhe.criadoEm) },
                        { label: 'CLASSIFICAÇÃO',    badge: { label: detalhe.classificacao, cor: CLASSIF_CORES[detalhe.classificacao] } },
                        { label: 'PRIORIDADE',       badge: { label: detalhe.prioridade, cor: PRIORIDADE_CORES[detalhe.prioridade] } },
                        { label: 'VERTICAL',         val: detalhe.vertical },
                        detalhe.sistema ? { label: 'SISTEMA', val: detalhe.sistema, highlight: true } : null,
                      ].filter(Boolean).map(item => (
                        <div key={item.label} className="bg-slate-50 border border-gray-100 rounded-xl px-3 py-2.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                          {item.badge ? (
                            item.badge.label ? <Badge label={item.badge.label} cor={item.badge.cor} /> : <span className="text-sm text-gray-400">—</span>
                          ) : item.avatar ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar nome={item.val} size={5} />
                              <span className="text-sm text-gray-700">{item.val || '—'}</span>
                            </div>
                          ) : (
                            <p className={`text-sm ${item.bold ? 'text-gray-900 font-semibold' : item.highlight ? 'text-sysgate-600 font-medium' : 'text-gray-700'}`}>
                              {item.val || <span className="text-gray-400 font-normal">—</span>}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Descrição */}
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Descrição</h3>
                      <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap min-h-[52px] leading-relaxed">
                        {detalhe.descricao || <span className="text-gray-400">Sem descrição</span>}
                      </div>
                    </div>

                    {/* Anexos */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Anexos ({detalhe.anexos?.length || 0})
                        </h3>
                        <div>
                          <input type="file" multiple ref={fileAnexoRef} onChange={handleAnexoUpload} className="hidden" />
                          <button onClick={() => fileAnexoRef.current?.click()} disabled={uploadAnexo}
                            className="flex items-center gap-1 text-xs text-sysgate-600 font-medium hover:underline disabled:opacity-50">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                            {uploadAnexo ? 'Enviando…' : 'Anexar Arquivo'}
                          </button>
                        </div>
                      </div>
                      {detalhe.anexos?.length === 0 ? (
                        <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
                          onDrop={handleDrop} onClick={() => fileAnexoRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                            dragOver ? 'border-sysgate-400 bg-sysgate-50/50' : 'border-gray-200 hover:border-sysgate-300 hover:bg-gray-50/50'
                          }`}>
                          <svg className={`w-8 h-8 ${dragOver ? 'text-sysgate-400' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                          </svg>
                          <p className="text-sm text-gray-400">Nenhum anexo. Arraste arquivos aqui ou clique para selecionar.</p>
                        </div>
                      ) : (
                        <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
                          onDrop={handleDrop}
                          className={`space-y-1.5 rounded-xl p-2 transition-colors ${dragOver ? 'bg-sysgate-50/50 border border-dashed border-sysgate-300' : ''}`}>
                          {detalhe.anexos.map(a => (
                            <div key={a.id} className="flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2.5 text-sm transition-colors">
                              <span className="text-base">{iconeAnexo(a.tipo)}</span>
                              <span className="flex-1 truncate text-gray-700 font-medium">{a.nomeArquivo}</span>
                              {a.tamanho && <span className="text-xs text-gray-400 shrink-0">{formatBytes(a.tamanho)}</span>}
                              <button onClick={() => downloadAnexo(a.id, a.nomeArquivo)}
                                className="text-sysgate-600 hover:text-sysgate-700 text-xs font-medium shrink-0">↓ Baixar</button>
                              <button onClick={() => deletarAnexo(a.id)}
                                className="text-gray-300 hover:text-red-400 text-sm leading-none shrink-0">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Comentários */}
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        Comentários ({detalhe.comentarios?.length || 0})
                      </h3>
                      <div className="space-y-4 mb-5">
                        {detalhe.comentarios?.length === 0 && <p className="text-sm text-gray-400">Nenhum comentário ainda.</p>}
                        {detalhe.comentarios?.map(c => (
                          <div key={c.id} className="flex gap-3">
                            <Avatar nome={c.autor?.nome} size={8} />
                            <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-4 py-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-sm font-semibold text-gray-900">{c.autor?.nome}</span>
                                <span className="text-xs text-gray-400">{tempoRelativo(c.criadoEm)}</span>
                                {(c.autorId === usuario?.id || isAdmin) && (
                                  <button onClick={() => deletarComentario(c.id)}
                                    className="ml-auto text-gray-300 hover:text-red-400 text-sm leading-none" title="Remover">×</button>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.conteudo}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <Avatar nome={usuario?.nome} size={8} />
                        <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden focus-within:border-sysgate-400 focus-within:ring-1 focus-within:ring-sysgate-300 transition-all">
                          <textarea
                            className="w-full px-4 py-3 text-sm text-gray-700 border-0 outline-none resize-none bg-transparent min-h-[64px]"
                            placeholder="Escreva um comentário…"
                            value={novoComentario}
                            onChange={e => setNovoComentario(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) enviarComentario() }}
                          />
                          <div className="flex items-center justify-between px-3 pb-2.5">
                            <span className="text-xs text-gray-400">Ctrl+Enter para enviar</span>
                            <button onClick={enviarComentario} disabled={enviandoComent || !novoComentario.trim()}
                              className="px-3 py-1 text-xs font-semibold bg-sysgate-600 hover:bg-sysgate-700 text-white rounded-lg disabled:opacity-40 transition-colors">
                              {enviandoComent ? 'Enviando…' : 'Comentar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Painel histórico */}
                {mostrarHistorico && (
                  <PainelHistorico key={historicoKey} chamadoId={chamadoSelId} onFechar={() => setMostrarHistorico(false)} />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modais */}
      {modalNovo && (
        <ModalChamado usuarios={usuarios} catalogo={catalogo}
          onSalvo={(c) => { setChamados(prev => [c, ...prev]); setModalNovo(false); selecionarChamado(c.id); setAba('lista') }}
          onFechar={() => setModalNovo(false)} />
      )}
      {modalEditar && detalhe && (
        <ModalChamado chamado={detalhe} usuarios={usuarios} catalogo={catalogo}
          onSalvo={(c) => {
            setDetalhe(prev => ({ ...prev, ...c }))
            setChamados(prev => prev.map(x => x.id === c.id ? { ...x, ...c } : x))
            setModalEditar(false); setHistoricoKey(k => k + 1)
          }}
          onFechar={() => setModalEditar(false)} />
      )}
    </div>
  )
}
