import { useState } from 'react'
import JsonColorido from '../../components/JsonColorido'
import MetodoBadge from '../../components/MetodoBadge'
import Icone from '../../components/Icone'
import { chamadaFonte, descricaoAcao, separarNotas } from '../../lib/mapa'
import { BFC_SCRIPT, highlightCode } from '../../lib/codigo'

const dataBr = iso => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR') : '')

// Painel do nó: como liga, o que fazer, endpoints, fonte BFC e o que a prática ensinou
export default function PainelNo({ no, rotuloDe, paiRotulo }) {
  const confirmado = no.status === 'confirmado'
  const chamada = chamadaFonte(no.fonte)
  const { alertas, notas } = separarNotas(no.notas)
  return (
    <div className="space-y-5 px-5 py-5 text-sm">
      <div>
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-lg font-semibold leading-tight">{no.rotulo}</h3>
          {no.campo && ( // o status é do vínculo — o cadastro escolhido no topo não tem
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${confirmado ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border border-dashed border-borda text-suave'}`}>
              {confirmado ? `Confirmado${no.confirmadoEm ? ` em ${dataBr(no.confirmadoEm)}` : ''}` : 'Inferido'}
            </span>
          )}
        </div>
        <p className="mt-1 font-mono text-xs text-suave">/api/{no.recurso}</p>
        {no.campo && paiRotulo && (
          <p className="mt-2 text-xs text-suave">Liga por <span className="font-mono text-texto">{no.campo}</span> → {paiRotulo}</p>
        )}
        {(no.modulo || no.localizacao) && (
          <p className="mt-1 text-xs text-suave">
            {no.localizacao || no.modulo}
            {no.ajuda && <> · <a href={no.ajuda} target="_blank" rel="noreferrer" className="text-acento hover:underline">central de ajuda</a></>}
          </p>
        )}
      </div>

      {no.scripts?.length > 0 && (
        <Secao titulo={`Scripts validados · ${no.scripts.length}`}>
          <div className="space-y-2">{[...no.scripts].sort((a, b) => Number(!!b.principal) - Number(!!a.principal)).map(s => <ScriptValidado key={s.arquivo} script={s} />)}</div>
        </Secao>
      )}

      {alertas.map((a, i) => <Alerta key={i} tipo="perigo" titulo="Cuidado">{a}</Alerta>)}

      {no.categoria === 'financeiro' && no.campo && (
        <Alerta tipo="atencao" titulo="Vínculo financeiro">
          Registro com isto não entra numa exclusão em massa sem revisão. Excluir dado financeiro por API ainda não foi testado na prática.
        </Alerta>
      )}

      {no.campo && (
        <Secao titulo="O que fazer">
          {no.acao === 'reprocessar' || no.acao === 'saiJunto' ? (
            <p className="rounded-lg border border-acento/30 bg-acento/10 px-3 py-2 font-medium">{descricaoAcao(no, rotuloDe)}</p>
          ) : <p>{descricaoAcao(no, rotuloDe)}</p>}
        </Secao>
      )}

      {notas.length > 0 && (
        <Secao titulo="O que a prática ensinou">
          <ul className="space-y-1.5">
            {notas.map((n, i) => <li key={i} className="flex gap-2 text-[13px] leading-snug"><span className="text-suave">•</span><span className="min-w-0 [overflow-wrap:anywhere]">{n}</span></li>)}
          </ul>
        </Secao>
      )}

      <Secao titulo="Endpoints">
        {no.metodos.length ? (
          <div className="flex flex-wrap gap-1.5">{no.metodos.map(m => <MetodoBadge key={m} metodo={m} />)}</div>
        ) : <p className="text-xs text-suave">Não está no Swagger como recurso próprio.</p>}
        {no.corpoDelete && no.acao === 'excluir' && (
          <div className="mt-3">
            <JsonColorido dados={no.corpoDelete} titulo={`Body do DELETE /api/${no.recurso}`} alturaMax="14rem" />
          </div>
        )}
      </Secao>

      <Secao titulo="Fonte BFC (para encontrar os registros)">
        {chamada ? (
          <>
            <code className="block break-all rounded-lg bg-texto/[0.05] px-3 py-2 font-mono text-[11px]">{chamada}</code>
            <p className="mt-1.5 text-xs text-suave">
              {no.fonte.semLigacao ? 'Esta fonte não filtra pelo pai nem pede o id dele: serve para consultar, não para achar os vínculos. '
                : no.fonte.parametro ? 'Uma consulta por registro do pai (parâmetro obrigatório). ' : 'Busca em lote pelo pai. '}
              {no.fonte.inferida ? 'Nome casado automaticamente com o catálogo — confira no editor.' : ''}
            </p>
          </>
        ) : <p className="text-xs text-suave">Nenhuma fonte encontrada no catálogo para este recurso.</p>}
      </Secao>

      {no.qtdDependentes > 0 && (
        <p className="text-xs text-suave">{no.qtdDependentes} recurso(s) dependem deste — clique nele na coluna para abrir.</p>
      )}
    </div>
  )
}

function Secao({ titulo, children }) {
  return (
    <section>
      <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-suave">{titulo}</h4>
      {children}
    </section>
  )
}

// Caixa de alerta: perigo (vermelho) para o que causa estrago, atenção (âmbar) para o que exige revisão
function Alerta({ tipo, titulo, children }) {
  const cor = tipo === 'perigo'
    ? 'border-red-500/50 bg-red-500/10 text-red-800 dark:text-red-300'
    : 'border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200'
  return (
    <div className={`flex gap-2.5 rounded-xl border-2 px-3.5 py-3 ${cor}`}>
      <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 text-[13px] leading-snug [overflow-wrap:anywhere]">
        <div className="font-semibold">{titulo}</div>
        <div>{children}</div>
      </div>
    </div>
  )
}

// Script que rodou de verdade no Studio (registrado no curado). Texto lido da biblioteca sob demanda.
function ScriptValidado({ script }) {
  const [aberto, setAberto] = useState(null) // 'script' | 'readme' | null
  const [textos, setTextos] = useState({})
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')

  async function carregar(qual) {
    if (textos[qual] != null) return textos[qual]
    const r = await window.krakion.mapa.script(qual === 'readme' ? script.readme : script.arquivo)
    if (!r?.ok) throw new Error(r?.erro || 'Não foi possível ler o arquivo.')
    setTextos(t => ({ ...t, [qual]: r.dados }))
    return r.dados
  }
  async function alternar(qual) {
    setErro('')
    if (aberto === qual) return setAberto(null)
    try { await carregar(qual); setAberto(qual) } catch (e) { setErro(e.message) }
  }
  async function copiar() {
    setErro('')
    try {
      await navigator.clipboard.writeText(await carregar('script'))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch (e) { setErro(e.message) }
  }

  return (
    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/[0.04]">
      <div className="px-3.5 py-3">
        <div className="flex items-start gap-2">
          <Icone nome="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13px] font-semibold">{script.nome}</span>
              {script.principal && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">Use este</span>}
            </div>
            <div className="text-[11px] text-suave">Validado no Studio em {dataBr(script.validadoEm)}</div>
          </div>
        </div>
        {script.descricao && <p className="mt-2 text-[12px] leading-snug text-suave">{script.descricao}</p>}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <button type="button" className="botao-secundario !px-2.5 !py-1 text-xs" onClick={() => alternar('script')}>{aberto === 'script' ? 'Fechar' : 'Ver script'}</button>
          <button type="button" className="botao-primario !px-2.5 !py-1 text-xs" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar script'}</button>
          {script.readme && <button type="button" className="botao-secundario !px-2.5 !py-1 text-xs" onClick={() => alternar('readme')}>{aberto === 'readme' ? 'Fechar' : 'Como usar'}</button>}
        </div>
        {erro && <p className="mt-2 text-xs text-perigo">{erro}</p>}
      </div>
      {aberto === 'script' && (
        <pre className="max-h-96 overflow-auto rounded-b-xl bg-[#1e1e1e] px-3 py-2.5 font-mono text-[11px] leading-relaxed text-[#d4d4d4]"
          dangerouslySetInnerHTML={{ __html: highlightCode(textos.script || '', BFC_SCRIPT) }} />
      )}
      {aberto === 'readme' && (
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-b-xl border-t border-borda px-3.5 py-3 font-sans text-[12px] leading-relaxed">{textos.readme}</pre>
      )}
    </div>
  )
}
