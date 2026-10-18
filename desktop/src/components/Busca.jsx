import Icone from './Icone'

export default function Busca({ valor, onMudar, placeholder = 'Buscar…', className = '' }) {
  return (
    <label className={`flex h-9 items-center gap-2 rounded-xl border border-borda bg-fundo px-3 focus-within:border-acento focus-within:ring-2 focus-within:ring-acento/20 ${className}`}>
      <Icone nome="buscar" className="h-4 w-4 shrink-0 text-suave" />
      <input
        value={valor}
        onChange={e => onMudar(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-suave/70"
      />
    </label>
  )
}
