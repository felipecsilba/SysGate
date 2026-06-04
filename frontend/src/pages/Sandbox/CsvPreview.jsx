export default function CsvPreview({ csvData, csvSemCabecalho }) {
  if (!csvData) return null
  return (
    <>
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-green-700 font-medium">
          {csvData.linhas.length} linha{csvData.linhas.length !== 1 ? 's' : ''} · {csvData.colunas.length} coluna{csvData.colunas.length !== 1 ? 's' : ''}
        </span>
      </div>
      {/* Preview table: linhas como linhas, colunas como colunas */}
      <div className="overflow-auto rounded-lg border border-gray-200 max-h-48">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-gray-50 sticky top-0">
              <th className="px-2 py-1.5 text-gray-400 font-normal text-left border-b border-r border-gray-200 whitespace-nowrap">#</th>
              {csvData.colunas.map((col, idx) => {
                const letra = idx < 26 ? String.fromCharCode(65 + idx) : `C${idx + 1}`
                return (
                  <th key={col} title={!csvSemCabecalho ? col : undefined} className="px-2 py-1.5 text-left border-b border-gray-200 whitespace-nowrap">
                    <span className="font-bold text-sysgate-600">{letra}</span>
                    {!csvSemCabecalho && (
                      <div className="text-gray-400 font-normal truncate max-w-[70px]" title={col}>{col}</div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {csvData.linhas.slice(0, 3).map((linha, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-2 py-1 font-mono font-bold text-gray-400 border-r border-gray-200 whitespace-nowrap">{i + 1}</td>
                {csvData.colunas.map((col) => (
                  <td key={col} className="px-2 py-1 text-gray-600 max-w-[90px] truncate font-mono" title={String(linha[col] ?? '')}>
                    {String(linha[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
