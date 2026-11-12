import { useState } from 'react'
import Pagina from '../../components/Pagina'
import Icone from '../../components/Icone'
import { AJUSTES, ajustePorId } from '../../lib/ajustesMigracao'
import { CADASTROS, ETAPAS, cadastroPorId } from '../../lib/espelho'
import AjusteRapido from './AjusteRapido'
import { ScriptPronto } from './comum'
import Estimulo from './Estimulo'

// Escolhas sobrevivem à troca de módulo enquanto o app está aberto. selecao: cadastro do fluxo ou atalho de ajuste.
let guardado = { selecao: { tipo: 'cadastro', id: CADASTROS[0].id }, etapa: 'backup' }

// Etapas sem tela própria: o que acontece nelas
const TEXTO_ETAPA = {
  espera: 'Acontece durante o Estímulo: o cadastro único espelha cada registro poucos segundos depois de salvo.',
  conferencia: 'Em breve: cruzar o tributos com o sistema espelhado pelo template de cada registro.',
}

function Fluxo({ etapa, onEscolher }) {
  return (
    <ol className="w-64 shrink-0 overflow-y-auto border-r border-borda p-4">
      {ETAPAS.map((e, i) => {
        const ativa = e.id === etapa
        return (
          <li key={e.id}>
            <button
              onClick={() => onEscolher(e.id)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${ativa ? 'border-acento bg-acento/[0.06]' : 'border-borda hover:bg-texto/[0.04]'}`}
            >
              <span className="flex items-center gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${ativa ? 'bg-acento text-white' : 'bg-texto/[0.08] text-suave'}`}>{i + 1}</span>
                <span className="text-sm font-medium">{e.rotulo}</span>
              </span>
              <span className="mt-1 block pl-7 text-[12px] leading-snug text-suave">{e.resumo}</span>
            </button>
            {i < ETAPAS.length - 1 && (
              <div className="flex justify-center py-1 text-suave/60" aria-hidden>
                <Icone nome="baixo" className="h-4 w-4" />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function EtapaBackup({ cadastro }) {
  return (
    <ScriptPronto cadastro={cadastro} titulo={`Backup — ${cadastro.rotulo.toLowerCase()}`}>
      Rode no Studio e guarde o <span className="font-mono">{cadastro.arquivo}</span>. É o backup antes do estímulo e a lista
      dos ids que vão ser estimulados. Uma coluna por campo; enum sai pelo valor.
    </ScriptPronto>
  )
}

function EtapaInfo({ etapa }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-suave">
      <Icone nome={etapa.id === 'espera' ? 'atualizar' : 'check'} className="h-8 w-8" />
      <p className="text-sm font-medium text-texto">{etapa.rotulo}</p>
      <p className="max-w-sm text-[13px]">{TEXTO_ETAPA[etapa.id]}</p>
    </div>
  )
}

function ItemMenu({ ativo, desabilitado, onClick, children, extra }) {
  return (
    <li>
      <button
        disabled={desabilitado}
        onClick={onClick}
        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm ${ativo ? 'bg-texto/[0.07] font-medium' : desabilitado ? 'text-suave/60' : 'hover:bg-texto/[0.04]'}`}
      >
        <span className="flex-1">{children}</span>
        {extra}
      </button>
    </li>
  )
}

export default function MigracaoEspelho() {
  const [selecao, setSelecao] = useState(guardado.selecao)
  const [etapa, setEtapa] = useState(guardado.etapa)
  guardado = { selecao, etapa }

  const cadastro = selecao.tipo === 'cadastro' ? cadastroPorId(selecao.id) : null
  const ajuste = selecao.tipo === 'ajuste' ? ajustePorId(selecao.id) : null
  const atual = ETAPAS.find(e => e.id === etapa)

  return (
    <Pagina titulo="Migração Espelho" icone="espelho">
      <div className="flex min-h-0 flex-1">
        <nav className="w-56 shrink-0 overflow-y-auto border-r border-borda p-2">
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-suave">Cadastros</p>
          <ul className="space-y-0.5">
            {CADASTROS.map(c => (
              <ItemMenu key={c.id} ativo={selecao.tipo === 'cadastro' && c.id === selecao.id} desabilitado={!c.pronto}
                onClick={() => setSelecao({ tipo: 'cadastro', id: c.id })}
                extra={!c.pronto && <span className="text-[10px] uppercase tracking-wider">em breve</span>}>
                {c.rotulo}
              </ItemMenu>
            ))}
          </ul>
          {/* Atalhos de correção de migração: o que trava o estímulo e se resolve antes dele */}
          <p className="mt-3 border-t border-borda px-2.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-suave">Ajustes rápidos</p>
          <ul className="space-y-0.5">
            {AJUSTES.map(a => (
              <ItemMenu key={a.id} ativo={selecao.tipo === 'ajuste' && a.id === selecao.id} onClick={() => setSelecao({ tipo: 'ajuste', id: a.id })}>
                {a.rotulo}
              </ItemMenu>
            ))}
          </ul>
        </nav>

        {ajuste && <AjusteRapido key={ajuste.id} ajuste={ajuste} />}

        {cadastro && (
          <>
            <Fluxo etapa={etapa} onEscolher={setEtapa} />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {etapa === 'backup' && <EtapaBackup key={cadastro.id} cadastro={cadastro} />}
              {etapa === 'estimulo' && <Estimulo key={`estimulo-${cadastro.id}`} cadastro={cadastro} />}
              {etapa === 'desfazer' && <Estimulo key={`desfazer-${cadastro.id}`} cadastro={cadastro} modo="desfazer" />}
              {!['backup', 'estimulo', 'desfazer'].includes(etapa) && <EtapaInfo etapa={atual} />}
            </div>
          </>
        )}
      </div>
    </Pagina>
  )
}
