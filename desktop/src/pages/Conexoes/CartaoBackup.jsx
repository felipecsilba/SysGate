import { useEffect, useState } from 'react'
import Icone from '../../components/Icone'
import { chamar, dataHora } from './comum'
import { tamanhoLegivel, resumoBackup } from '../../lib/backup'

const backup = window.krakion?.backup

// Backup no Drive: último resultado, próximo, progresso ao vivo e "Fazer backup agora"
export default function CartaoBackup() {
  const [s, setS] = useState(null)
  const [progresso, setProgresso] = useState(null)
  const [erro, setErro] = useState('')

  const carregar = () => chamar(backup.status).then(st => { setS(st); if (!st.emAndamento) setProgresso(null) }).catch(e => setErro(e.message))
  useEffect(() => {
    if (!backup) return
    carregar()
    const sair1 = backup.aoProgresso(p => { setProgresso(p); setS(atual => (atual ? { ...atual, emAndamento: true } : atual)) })
    const sair2 = backup.aoFim(st => { setS(st); setProgresso(null) })
    return () => { sair1(); sair2() }
  }, [])

  async function fazerAgora() {
    setErro('')
    setS(atual => ({ ...atual, emAndamento: true }))
    try { await chamar(backup.executar) } catch (e) { setErro(e.message) } finally { carregar() }
  }

  if (!backup || !s) return null
  const u = s.ultimo
  const resumo = u ? resumoBackup(u) : null
  const andamento = s.emAndamento
  const fracao = progresso && (progresso.total ? (progresso.enviado ?? progresso.feitos ?? 0) / progresso.total : null)

  return (
    <section className="rounded-xl border border-borda">
      <header className="flex items-center gap-3 px-5 py-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-borda text-suave">
          <Icone nome="historico" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold">Backup</h4>
          <p className="text-xs text-suave">Banco do app todo dia · biblioteca só quando muda · guarda 30 dias do banco e 3 versões de cada pasta</p>
        </div>
        <button type="button" className="botao-primario" disabled={andamento} onClick={fazerAgora}>
          {andamento ? 'Fazendo backup…' : 'Fazer backup agora'}
        </button>
      </header>

      <div className="space-y-3 border-t border-borda px-5 py-4 text-sm">
        {andamento ? (
          <div className="space-y-2">
            <p className="text-suave">{progresso?.texto || 'Iniciando…'}</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-texto/[0.07]">
              <div className={`h-full rounded-full bg-acento transition-all ${fracao == null ? 'w-1/3 animate-pulse' : ''}`}
                style={fracao == null ? undefined : { width: `${Math.max(3, Math.round(fracao * 100))}%` }} />
            </div>
            {progresso?.total && progresso?.enviado != null && (
              <p className="text-xs text-suave">{tamanhoLegivel(progresso.enviado)} de {tamanhoLegivel(progresso.total)}</p>
            )}
          </div>
        ) : !u ? (
          <p className="text-suave">Nenhum backup ainda. O primeiro roda sozinho logo depois de abrir o app — ou clique em “Fazer backup agora”.</p>
        ) : (
          <dl className="grid grid-cols-[9rem_1fr] gap-y-2">
            <dt className="text-suave">Último backup</dt>
            <dd className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${u.ok ? 'bg-emerald-500' : 'bg-perigo'}`} />
              {dataHora(u.fim)} {u.ok ? '' : '— falhou'}
            </dd>
            {u.erro && (<><dt className="text-suave">Erro</dt><dd className="text-perigo">{u.erro}</dd></>)}
            <dt className="text-suave">Enviado</dt>
            <dd>{resumo.enviado || '—'}</dd>
            {resumo.semMudanca && (<><dt className="text-suave">Sem mudança</dt><dd className="text-suave">{resumo.semMudanca}</dd></>)}
            {u.aviso && (<><dt className="text-suave">Aviso</dt><dd className="text-suave">{u.aviso}</dd></>)}
            <dt className="text-suave">Próximo</dt>
            <dd>{s.proximo ? dataHora(s.proximo) : 'ao abrir o app'}</dd>
          </dl>
        )}
        {erro && <p className="rounded-lg bg-perigo/10 px-3 py-2 text-perigo">{erro}</p>}
      </div>
    </section>
  )
}
