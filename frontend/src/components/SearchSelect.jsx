import { useState, useRef, useEffect } from 'react'

const normalize = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/**
 * Seletor com campo de busca filtrável.
 * options: [{ value, label }]
 */
export default function SearchSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Buscar...',
  disabled = false,
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedOption = options.find((o) => o.value === value)

  const filtered = query.trim()
    ? options.filter((o) => normalize(o.label).includes(normalize(query)))
    : options

  const handleSelect = (val) => {
    onChange(val)
    setQuery('')
    setOpen(false)
  }

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayValue = open ? query : (selectedOption?.label || '')

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setQuery(''); setOpen(true) }}
        disabled={disabled}
        placeholder={selectedOption ? selectedOption.label : placeholder}
        className="input pr-6 disabled:opacity-50 disabled:cursor-not-allowed"
        autoComplete="off"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none select-none">
        ▾
      </span>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto scrollbar-thin">
          {/* Opção para limpar seleção */}
          {value && (
            <div
              onMouseDown={() => handleSelect('')}
              className="px-3 py-2 text-xs cursor-pointer text-gray-400 italic hover:bg-gray-50 border-b border-gray-100"
            >
              — Limpar seleção —
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">
              {query ? `Nenhum resultado para "${query}"` : 'Nenhuma opção disponível'}
            </div>
          ) : (
            filtered.map((opt) => (
              <div
                key={opt.value}
                onMouseDown={() => handleSelect(opt.value)}
                className={`px-3 py-2 text-xs cursor-pointer hover:bg-sysgate-50 transition-colors ${
                  opt.value === value
                    ? 'bg-sysgate-100 text-sysgate-700 font-semibold'
                    : 'text-gray-700'
                }`}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
