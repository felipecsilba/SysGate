import { diasRestantes, estadoValidade } from '../../lib/validade'

const TONS = {
  vermelho: 'bg-red-500/10 text-red-600 dark:text-red-400',
  laranja: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  amarelo: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  verde: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
}

export default function SeloValidade({ dataVencimento }) {
  const estado = estadoValidade(diasRestantes(dataVencimento))
  if (!estado) return <span className="text-xs text-suave">Sem validade</span>
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TONS[estado.tom]}`}>
      {estado.rotulo}
    </span>
  )
}
