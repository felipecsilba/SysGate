import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import { chamadosApi } from '../../lib/api'
import {
  PALETTE,
  STATUS_CORES,
  CLASSIF_CORES,
  PRIORIDADE_CORES,
  formatData,
} from './constants'

// ── Badge colorido (local, used in semResponsavel list) ───────────────────────
function Badge({ label, cor, className = '' }) {
  if (!label) return null
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${className}`}
      style={{ backgroundColor: cor || '#94A3B8' }}>{label}</span>
  )
}

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

export default function ChamadosDashboard() {
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
