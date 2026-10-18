import { useMemo } from 'react'
import { analisar } from '../../lib/json'

const TIPOS = [
  ['objetos', 'Objetos'],
  ['arrays', 'Arrays'],
  ['textos', 'Textos'],
  ['numeros', 'Números'],
  ['booleanos', 'Booleanos'],
  ['nulos', 'Nulos'],
]

const tamanho = bytes => (bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`)

// Números neutros + uma barra discreta de distribuição por tipo
export default function Estatisticas({ valor, texto }) {
  const s = useMemo(() => analisar(valor), [valor])
  const total = TIPOS.reduce((soma, [k]) => soma + s[k], 0)

  return (
    <div className="max-w-xl space-y-6 p-5">
      <dl className="grid grid-cols-3 gap-4">
        {[['Chaves', s.chaves], ['Profundidade', s.profundidade], ['Tamanho', tamanho(new Blob([texto]).size)]].map(([rotulo, v]) => (
          <div key={rotulo}>
            <dt className="text-xs text-suave">{rotulo}</dt>
            <dd className="text-xl font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-suave">Valores por tipo</h4>
        <ul className="space-y-1.5">
          {TIPOS.map(([k, rotulo]) => (
            <li key={k} className="grid grid-cols-[6rem_1fr_4rem] items-center gap-3 text-sm">
              <span className="text-suave">{rotulo}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-texto/[0.06]">
                <span className="block h-full rounded-full bg-acento/60" style={{ width: total ? `${(s[k] / total) * 100}%` : 0 }} />
              </span>
              <span className="text-right tabular-nums">{s[k]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
