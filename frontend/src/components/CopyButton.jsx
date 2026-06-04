/**
 * CopyButton — botão com feedback visual "Copiado!" por 2 segundos
 * Usado em: AnalisadorJson, ClienteAPI, EnvioLote
 */
import { useState } from 'react'

export default function CopyButton({ value, label = 'Copiar', labelCopiado = 'Copiado!', className = '' }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // fallback silencioso
    }
  }

  return (
    <button
      onClick={copiar}
      className={className}
      type="button"
    >
      {copiado ? labelCopiado : label}
    </button>
  )
}
