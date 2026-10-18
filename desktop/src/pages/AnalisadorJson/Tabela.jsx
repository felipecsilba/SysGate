import { useMemo, useState } from 'react'
import Icone from '../../components/Icone'
import { CORES_JSON, csvTabela, ordenarLinhas, resumoValor, tabela as montarTabela } from '../../lib/json'

const LIMITE = 1000

function Celula({ v }) {
  if (v === undefined) return <span className="text-suave/50">—</span>
  if (v === null) return <span className={CORES_JSON.nulo}>null</span>
  if (typeof v === 'object') return <span className="text-suave">{resumoValor(v, 60)}</span>
  if (typeof v === 'number') return <span className={`${CORES_JSON.numero} tabular-nums`}>{v}</span>
  if (typeof v === 'boolean') return <span className={CORES_JSON.booleano}>{String(v)}</span>
  return <span>{v}</span>
}

export default function Tabela({ valor }) {
  const t = useMemo(() => montarTabela(valor), [valor])
  const [ordem, setOrdem] = useState({ coluna: null, direcao: 'asc' })

  const linhas = useMemo(
    () => (t && ordem.coluna ? ordenarLinhas(t.linhas, ordem.coluna, ordem.direcao) : t?.linhas ?? []),
    [t, ordem]
  )

  if (!t) {
    return <p className="py-16 text-center text-sm text-suave">A tabela aparece quando o JSON é uma lista de objetos.</p>
  }

  function ordenar(coluna) {
    setOrdem(o => (o.coluna === coluna ? { coluna, direcao: o.direcao === 'asc' ? 'desc' : 'asc' } : { coluna, direcao: 'asc' }))
  }

  function exportar() {
    const blob = new Blob(['﻿' + csvTabela(t.colunas, linhas)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t.origem || 'tabela'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-borda px-3 py-2 text-xs text-suave">
        <span>
          <b className="font-medium text-texto tabular-nums">{t.linhas.length}</b> linhas · <b className="font-medium text-texto tabular-nums">{t.colunas.length}</b> colunas
          {t.origem && <> · lista em <code className="font-mono">{t.origem}</code></>}
          {t.ignorados > 0 && <> · {t.ignorados} itens que não são objeto ficaram de fora</>}
        </span>
        <button type="button" onClick={exportar} className="botao-secundario ml-auto px-2.5 py-1">
          <Icone nome="importar" className="h-3.5 w-3.5" /> Exportar CSV
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-max min-w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-painel">
            <tr>
              <th className="border-b border-borda px-2 py-1.5 text-right font-normal text-suave">#</th>
              {t.colunas.map(c => (
                <th key={c} className="border-b border-borda px-2 py-1.5 text-left font-medium">
                  <button type="button" onClick={() => ordenar(c)} className="flex items-center gap-1 hover:text-acento">
                    {c}
                    {ordem.coluna === c && <Icone nome={ordem.direcao === 'asc' ? 'cima' : 'baixo'} className="h-3 w-3" />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {linhas.slice(0, LIMITE).map((l, i) => (
              <tr key={i} className="hover:bg-texto/[0.03]">
                <td className="border-b border-borda/60 px-2 py-1 text-right text-suave tabular-nums">{i + 1}</td>
                {t.colunas.map(c => (
                  <td key={c} className="max-w-[24rem] truncate border-b border-borda/60 px-2 py-1"><Celula v={l[c]} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {linhas.length > LIMITE && (
          <p className="px-3 py-2 text-xs text-suave">Mostrando {LIMITE} de {linhas.length} linhas — o CSV leva todas.</p>
        )}
      </div>
    </div>
  )
}
