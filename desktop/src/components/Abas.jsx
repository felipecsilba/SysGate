// Abas em pílula (estilo "Home / Recent / Unread" do app de referência)
export default function Abas({ abas, atual, onMudar, className = '' }) {
  return (
    <div className={`flex items-center gap-1 ${className}`} role="tablist">
      {abas.map(a => (
        <button
          key={a.id}
          type="button"
          role="tab"
          aria-selected={a.id === atual}
          onClick={() => onMudar(a.id)}
          className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm transition ${
            a.id === atual ? 'bg-texto/[0.07] font-medium text-texto' : 'text-suave hover:text-texto'
          }`}
        >
          {a.rotulo}
          {a.contador !== undefined && <span className="text-xs tabular-nums text-suave">{a.contador}</span>}
        </button>
      ))}
    </div>
  )
}
