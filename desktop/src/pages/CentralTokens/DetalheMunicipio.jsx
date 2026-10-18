import { useState } from 'react'
import BotaoIcone from '../../components/BotaoIcone'
import Icone from '../../components/Icone'
import SeloValidade from './SeloValidade'
import { diasRestantes } from '../../lib/validade'

function LinhaToken({ vinculo, onRenovar, onRenovarBetha, onRemover }) {
  const [revelado, setRevelado] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(vinculo.token)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <li className="flex items-center gap-4 rounded-xl border border-borda px-4 py-3">
      <div className="w-44 shrink-0">
        <div className="truncate text-sm font-medium">{vinculo.sistema.nome}</div>
        <div className="mt-1"><SeloValidade dataVencimento={vinculo.dataVencimento} /></div>
      </div>
      <code className={`min-w-0 flex-1 font-mono text-xs text-suave ${revelado ? 'break-all' : 'truncate'}`}>
        {revelado ? vinculo.token : `${vinculo.token.slice(0, 8)}••••••••`}
      </code>
      <div className="flex shrink-0 items-center">
        <BotaoIcone titulo={revelado ? 'Ocultar' : 'Revelar'} icone={revelado ? 'olhoFechado' : 'olho'} onClick={() => setRevelado(v => !v)} />
        <BotaoIcone titulo={copiado ? 'Copiado!' : 'Copiar token'} icone={copiado ? 'check' : 'copiar'} onClick={copiar} ativo={copiado} />
        {onRenovarBetha && <BotaoIcone titulo="Renovar no Betha Admin (emite um token novo)" icone="atualizar" onClick={onRenovarBetha} />}
        <BotaoIcone titulo="Colar token novo" icone="editar" onClick={onRenovar} />
        <BotaoIcone titulo="Remover token" icone="lixeira" onClick={onRemover} perigo />
      </div>
    </li>
  )
}

export default function DetalheMunicipio({ municipio, tokens, carregando, onAtivar, onEditar, onExcluir, onNovoToken, onRenovarToken, onRenovarBetha, onRemoverToken }) {
  const vencidos = tokens.filter(v => { const d = diasRestantes(v.dataVencimento); return d !== null && d <= 0 })
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      <div className="px-8 pb-6 pt-7">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <h3 className="truncate text-xl font-semibold tracking-tight">{municipio.nome}</h3>
              {municipio.ativo && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ativo
                </span>
              )}
            </div>
            <p className="mt-1.5 whitespace-pre-line text-sm text-suave">{municipio.observacoes || 'Sem observações.'}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!municipio.ativo && (
              <button type="button" className="botao-secundario mr-1 h-8 px-3 text-xs" onClick={onAtivar} title="O Sandbox usa o município ativo">
                Tornar ativo
              </button>
            )}
            <BotaoIcone titulo="Editar município" icone="editar" onClick={onEditar} />
            <BotaoIcone titulo="Excluir município" icone="lixeira" onClick={onExcluir} perigo />
          </div>
        </div>
      </div>

      <div className="border-t border-borda px-8 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-suave">Tokens</h4>
          <div className="flex items-center gap-2">
          {onRenovarBetha && vencidos.length > 0 && (
            <button type="button" className="botao-secundario h-8 px-3 text-xs" onClick={() => onRenovarBetha(vencidos)}>
              <Icone nome="atualizar" className="h-3.5 w-3.5" /> Renovar vencidos ({vencidos.length})
            </button>
          )}
          <button type="button" className="botao-secundario h-8 px-3 text-xs" onClick={onNovoToken}>
            <Icone nome="mais" className="h-3.5 w-3.5" /> Token
          </button>
          </div>
        </div>
        {carregando ? (
          <p className="py-6 text-sm text-suave">Carregando…</p>
        ) : tokens.length ? (
          <ul className="space-y-2">
            {tokens.map(v => (
              <LinhaToken key={v.id} vinculo={v} onRenovar={() => onRenovarToken(v)} onRenovarBetha={onRenovarBetha && (() => onRenovarBetha([v]))} onRemover={() => onRemoverToken(v)} />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-borda px-4 py-8 text-center text-sm text-suave">
            Nenhum token neste município ainda.
          </div>
        )}
      </div>
    </div>
  )
}
