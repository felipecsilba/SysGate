import Icone from './Icone'

// Botão quadrado só com ícone (editar, excluir, copiar…). `perigo` = hover vermelho; `ativo` = verde (ex.: "Copiado!").
export default function BotaoIcone({ titulo, icone, onClick, perigo, ativo, className = '' }) {
  return (
    <button
      type="button"
      title={titulo}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
        ativo ? 'text-emerald-600 dark:text-emerald-400' : 'text-suave'
      } ${perigo ? 'hover:bg-perigo/10 hover:text-perigo' : 'hover:bg-texto/[0.07] hover:text-texto'} ${className}`}
    >
      <Icone nome={icone} className="h-4 w-4" />
    </button>
  )
}
