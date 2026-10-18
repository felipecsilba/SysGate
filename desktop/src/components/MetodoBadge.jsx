// Cores semânticas por método HTTP (mesma convenção do Krakion web)
const CORES = {
  GET: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  POST: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  PUT: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  PATCH: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  DELETE: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

export default function MetodoBadge({ metodo, className = '' }) {
  return (
    <span className={`inline-flex w-14 shrink-0 justify-center rounded-md py-0.5 font-mono text-[11px] font-semibold ${CORES[metodo] ?? 'bg-texto/10 text-suave'} ${className}`}>
      {metodo}
    </span>
  )
}
