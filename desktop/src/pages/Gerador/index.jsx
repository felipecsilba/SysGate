import Pagina from '../../components/Pagina'
import Icone from '../../components/Icone'
import ScriptExportacao from './ScriptExportacao'

// Gerador de Extensões: criar scripts e fórmulas (a consulta fica na Biblioteca).
// Começa pelo script de exportação; Templates e Funções prontas da _BIBLIOTECA vêm a seguir.
const ITENS = [
  { id: 'exportacao', rotulo: 'Script de exportação', icone: 'importar', pronto: true },
  { id: 'templates', rotulo: 'Templates', icone: 'arquivo' },
  { id: 'funcoes', rotulo: 'Funções prontas', icone: 'codigo' },
]

export default function Gerador() {
  return (
    <Pagina titulo="Gerador de Extensões" icone="extensoes">
      <div className="flex min-h-0 flex-1">
        <nav className="w-56 shrink-0 border-r border-borda p-2">
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-suave">Gerar</p>
          <ul className="space-y-0.5">
            {ITENS.map(i => (
              <li key={i.id}>
                <span className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${i.pronto ? 'bg-texto/[0.07] font-medium' : 'text-suave/60'}`}>
                  <Icone nome={i.icone} className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{i.rotulo}</span>
                  {!i.pronto && <span className="text-[10px] uppercase tracking-wider">em breve</span>}
                </span>
              </li>
            ))}
          </ul>
        </nav>
        <ScriptExportacao />
      </div>
    </Pagina>
  )
}
