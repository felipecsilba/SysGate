import { useMemo, useState } from 'react'
import Confirmar from '../../components/Confirmar'
import { PATH_RECEITAS, alvosCorrecao, lerRegistros, lotesPatchReceitas } from '../../lib/ajustesMigracao'
import { Aviso, ComPonto, Situacao } from './comum'
import { SeletorToken, useEnvioLote, useMunicipioToken } from './envioLote'

const num = n => Number(n).toLocaleString('pt-BR')

// Correção das receitas duplicadas: PATCH /api/receitas com "." no fim da descrição da receita sem template.
// Token de migração (Central de Tokens) — receita aceita a Service Layer. Excluir ficou de fora por decisão do Felipe.
export default function CorrecaoReceitas({ ajuste, arquivo }) {
  const leitura = useMemo(() => (arquivo?.texto ? lerRegistros(arquivo.texto, ajuste.cadastro) : null), [arquivo, ajuste])
  const { alvos, revisar } = useMemo(() => (leitura && !leitura.faltando.length ? alvosCorrecao(leitura.registros) : { alvos: [], revisar: [] }), [leitura])
  const [incluidos, setIncluidos] = useState(() => new Set(alvos.filter(a => !a.conflito).map(a => a.id)))
  const sel = useMunicipioToken()
  const envio = useEnvioLote(sel, { path: PATH_RECEITAS, metodo: 'PATCH' })
  const [confirmar, setConfirmar] = useState(null) // { lotes, rotulo }

  if (!leitura) return <p className="p-6 text-[13px] text-suave">Carregue o resultado na aba “2. Ler resultado” primeiro.</p>

  const { porId, ativo, pendentes, resumo } = envio
  const selecionados = alvos.filter(a => incluidos.has(a.id))
  const comErro = alvos.filter(a => porId[a.id] && !porId[a.id].ok && !porId[a.id].fila)
  const conflitos = alvos.filter(a => a.conflito)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="space-y-3 border-b border-borda p-4 text-[13px]">
        <p className="text-suave">
          Em cada grupo de descrição repetida, a receita <strong className="text-texto">sem template</strong> (fora do cadastro único) ganha
          <strong className="text-texto"> “.”</strong> no fim da descrição, por <span className="font-mono">PATCH {PATH_RECEITAS}</span> com o token de
          migração. A receita com template não é tocada. Depois, estimule de novo os créditos que deram 422.
        </p>
        {conflitos.length > 0 && (
          <Aviso>{num(conflitos.length)} receita(s) ficariam com uma descrição que já existe (com o “.”). Vieram desmarcadas — ajuste pela tela.</Aviso>
        )}
        {revisar.length > 0 && (
          <p className="text-suave">
            Para revisar à mão (nenhuma ou todas com template, então não dá para saber qual mexer):{' '}
            {revisar.map(g => `“${g.valor}” (${g.registros.map(r => r.id).join(', ')})`).join(' · ')}
          </p>
        )}
      </div>

      {alvos.length === 0
        ? <p className="p-6 text-[13px] text-suave">Nenhuma receita sem template para corrigir.</p>
        : (
          <>
            <div className="flex flex-wrap items-end gap-3 border-b border-borda p-4 text-[13px]">
              <SeletorToken sel={sel} />
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" disabled={!sel.pronto || ativo || !selecionados.length}
                  onClick={() => setConfirmar({ lotes: lotesPatchReceitas(selecionados.slice(0, 1)), rotulo: 'Testar com 1 receita' })}>Testar com 1</button>
                <button type="button" className="botao-primario !px-3 !py-1.5 text-xs" disabled={!sel.pronto || ativo || !selecionados.length}
                  onClick={() => setConfirmar({ lotes: lotesPatchReceitas(selecionados), rotulo: 'Atualizar as receitas selecionadas' })}>
                  Atualizar {num(selecionados.length)} receita(s)
                </button>
                {comErro.length > 0 && !ativo && (
                  <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" onClick={() => setConfirmar({ lotes: lotesPatchReceitas(comErro), rotulo: 'Reenviar as com erro' })}>
                    Reenviar as {num(comErro.length)} com erro
                  </button>
                )}
                {pendentes.length > 0 && !ativo && <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" onClick={envio.consultarPendentes}>Consultar pendentes ({pendentes.length})</button>}
                {ativo && <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" onClick={envio.parar}>Parar</button>}
              </div>
              {envio.pausa && <p className="w-full text-xs text-amber-700 dark:text-amber-300">A Betha limitou as chamadas · tenta de novo às {new Date(envio.pausa).toLocaleTimeString('pt-BR')}</p>}
              {resumo.total > 0 && <p className="w-full text-xs text-suave">{num(resumo.okN)} com sucesso · {num(resumo.erroN)} com erro · {num(resumo.filaN)} na fila</p>}
            </div>

            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-fundo text-left text-[11px] uppercase tracking-wider text-suave">
                <tr className="border-b border-borda">
                  <th className="w-10 px-4 py-2" />
                  <th className="w-24 px-2 py-2 font-semibold">ID</th>
                  <th className="px-2 py-2 font-semibold">Descrição atual</th>
                  <th className="px-2 py-2 font-semibold">Vai ficar</th>
                  <th className="w-36 px-2 py-2 font-semibold">{ajuste.tipo.rotulo}</th>
                  <th className="w-56 px-4 py-2 font-semibold">Situação</th>
                </tr>
              </thead>
              <tbody>
                {alvos.map(a => (
                  <tr key={a.id} className={`border-b border-borda/60 ${a.conflito ? 'bg-amber-500/10' : ''} ${incluidos.has(a.id) ? '' : 'opacity-50'}`}>
                    <td className="px-4 py-1.5">
                      <input type="checkbox" checked={incluidos.has(a.id)} disabled={ativo} className="h-4 w-4 accent-[rgb(var(--acento))]"
                        onChange={() => setIncluidos(s => { const n = new Set(s); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n })} />
                    </td>
                    <td className="px-2 py-1.5 font-mono">{a.id}</td>
                    <td className="px-2 py-1.5">{a.descricao}</td>
                    <td className="px-2 py-1.5">
                      <ComPonto texto={a.nova} />
                      {a.conflito && <span className="ml-2 text-[11px] text-amber-700 dark:text-amber-300">já existe</span>}
                    </td>
                    <td className="px-2 py-1.5 text-xs">{a[ajuste.tipo.campo]}</td>
                    <td className="truncate px-4 py-1.5 text-xs"><Situacao s={porId[Number(a.id)]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

      <Confirmar
        aberto={!!confirmar}
        titulo={confirmar ? `${confirmar.rotulo}?` : ''}
        mensagem={confirmar ? `PATCH ${PATH_RECEITAS} — ${num(confirmar.lotes.reduce((n, l) => n + l.ids.length, 0))} receita(s), no município ${sel.municipio?.nome}. Cada uma ganha "." no fim da descrição.` : ''}
        rotulo="Atualizar"
        onConfirmar={() => { const c = confirmar; setConfirmar(null); envio.enviar(c.lotes) }}
        onFechar={() => setConfirmar(null)}
      />
    </div>
  )
}
