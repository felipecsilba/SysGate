import { useEffect, useState } from 'react'
import Icone from '../../components/Icone'
import Editor from '../AnalisadorJson/Editor'
import { checagemApi, mensagemErro } from '../../lib/api'
import { ROTULO_SPEC } from '../../lib/checagem'
import { interpretar } from '../../lib/json'
import { DetalheRegra, NotasCadastro } from './Detalhes'
import { Ponto, SEV, fmtN } from './pecas'

// Payload e laudo ficam na memória enquanto o app está aberto (um por cadastro)
const guardado = new Map()

export default function PorApi({ sistemaId, path }) {
  const chave = `${sistemaId}|${path}`
  const inicial = guardado.get(chave)
  const [texto, setTexto] = useState(inicial?.texto ?? '')
  const [resultado, setResultado] = useState(inicial?.resultado ?? null)
  const [erro, setErro] = useState('')
  const [verificando, setVerificando] = useState(false)

  useEffect(() => { guardado.set(chave, { texto, resultado }) }, [chave, texto, resultado])

  async function verificar() {
    setErro('')
    setResultado(null)
    if (!texto.trim()) return setErro('Cole o payload antes de verificar.')
    setVerificando(true)
    try {
      setResultado(await checagemApi.verificar({ sistemaId, frente: 'api', cadastro: path, texto }))
    } catch (e) {
      const d = e.response?.data
      setErro(d?.detalhe ? `${d.error} ${d.detalhe}` : mensagemErro(e, 'Não foi possível verificar.'))
    } finally {
      setVerificando(false)
    }
  }

  const r = interpretar(texto)
  const botao = 'flex h-7 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-xs text-suave transition hover:bg-texto/[0.06] hover:text-texto disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className="flex min-h-0 flex-1">
      {/* Esquerda: payload */}
      <div className="flex w-2/5 min-w-[20rem] flex-col border-r border-borda">
        <div className="flex items-center gap-1 border-b border-borda px-2 py-1.5">
          <button type="button" className="botao-primario mr-1 px-3 py-1" onClick={verificar} disabled={verificando}>
            {verificando ? 'Verificando…' : 'Verificar'}
          </button>
          <button type="button" className={botao} onClick={async () => { const t = await navigator.clipboard.readText(); if (t) setTexto(t) }}>
            <Icone nome="copiar" className="h-3.5 w-3.5" /> Colar
          </button>
          <button type="button" className={botao} disabled={!('valor' in r)} onClick={() => setTexto(JSON.stringify(r.valor, null, 2))}>
            <Icone nome="texto" className="h-3.5 w-3.5" /> Formatar
          </button>
          <button type="button" onClick={() => { setTexto(''); setResultado(null); setErro('') }} disabled={!texto}
            className="ml-auto flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs text-suave transition hover:bg-perigo/10 hover:text-perigo disabled:pointer-events-none disabled:opacity-40">
            <Icone nome="lixeira" className="h-3.5 w-3.5" /> Limpar
          </button>
        </div>
        <Editor
          valor={texto}
          onMudar={setTexto}
          linhaErro={r.erro?.linha}
          placeholder={'Cole o JSON que vai subir pela API de migração.\n\n[\n  {\n    "idIntegracao": "DIV-001",\n    "dividas": { "idPessoa": 99325490, … }\n  }\n]'}
        />
        {r.erro && <p className="border-t border-borda px-3 py-1.5 text-[11px] text-perigo">JSON inválido na linha {r.erro.linha}, coluna {r.erro.coluna} — o Verificar ainda tenta ler cada linha como um JSON.</p>}
      </div>

      {/* Direita: laudo */}
      <div className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
        {erro && <p className="mb-4 text-sm text-perigo">{erro}</p>}
        {!resultado ? (
          !erro && (
            <div className="m-auto max-w-sm py-20 text-center">
              <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-borda text-suave">
                <Icone nome="checagem" className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium">Cole o payload e clique em Verificar</p>
              <p className="mt-1 text-xs text-suave">O laudo mostra o que a spec acusa (incluindo os campos marcados como obrigatórios), o que as regras acusam e o que falta fora do JSON.</p>
            </div>
          )
        ) : (
          <Laudo resultado={resultado} />
        )}
      </div>
    </div>
  )
}

function Titulo({ children, extra }) {
  return (
    <h4 className="mb-2 mt-7 text-[11px] font-semibold uppercase tracking-wider text-suave first:mt-0">
      {children}{extra && <span className="font-normal normal-case tracking-normal"> · {extra}</span>}
    </h4>
  )
}

function Laudo({ resultado }) {
  const { spec, entrada, regras, notas } = resultado
  const varios = entrada.registros > 1
  const [abertas, setAbertas] = useState(() => new Set(regras.filter(r => r.severidade === 'erro').map(r => r.regraId)))
  const alternar = id => setAbertas(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div>
      <p className="mb-5 text-sm text-suave">
        {fmtN(entrada.registros)} registro{entrada.registros !== 1 ? 's' : ''} verificado{entrada.registros !== 1 ? 's' : ''}
        {entrada.descartadas > 0 && <span className="text-amber-600 dark:text-amber-400"> · {entrada.descartadas} linha(s) ilegível(is)</span>}
      </p>

      <Titulo extra={spec ? `${spec.resumo.total} achado${spec.resumo.total !== 1 ? 's' : ''}` : null}>Contra a spec</Titulo>
      {!spec ? (
        <p className="text-sm text-suave">Este cadastro não tem spec importada — só as regras foram aplicadas.</p>
      ) : !spec.achados.length ? (
        <p className={`flex items-center gap-1.5 text-sm ${SEV.ok.texto}`}><Icone nome="check" className="h-4 w-4" /> Nenhum problema no payload segundo a spec e os campos marcados.</p>
      ) : (
        <ul className="divide-y divide-borda rounded-xl border border-borda">
          {spec.achados.map((a, i) => {
            const sev = a.severidade === 'erro' ? SEV.erro : SEV.alerta
            return (
              <li key={i} className="px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <Ponto classe={sev.ponto} />
                  <span className={`font-medium ${sev.texto}`}>{ROTULO_SPEC[a.tipo] || a.tipo}</span>
                  <code className="font-mono">{a.campo}</code>
                  {varios && <span className="text-suave">registro {a.registro}</span>}
                  {a.indice !== undefined && <span className="text-suave">item {a.indice + 1}</span>}
                  {a.origem === 'marcacao' && <span className="rounded-md bg-acento-suave px-1.5 py-0.5 text-[10px] text-acento">marcado como obrigatório</span>}
                </div>
                <p className="mt-1 text-sm">{a.mensagem}</p>
                {a.detalhe && <p className="mt-0.5 text-xs text-suave">{a.detalhe}</p>}
              </li>
            )
          })}
        </ul>
      )}

      {regras.length > 0 && (
        <>
          <Titulo extra={`${resultado.resumo.erros + resultado.resumo.alertas} com falha de ${regras.length}`}>Regras</Titulo>
          <ul className="divide-y divide-borda rounded-xl border border-borda">
            {regras.map(r => {
              const sev = SEV[r.severidade] || SEV.na
              const aberta = abertas.has(r.regraId)
              return (
                <li key={r.regraId}>
                  <button type="button" onClick={() => alternar(r.regraId)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-texto/[0.03]">
                    <Ponto classe={sev.ponto} />
                    <span className="min-w-0 flex-1 truncate text-sm">{r.nome}</span>
                    <span className="shrink-0 text-xs tabular-nums text-suave">
                      {r.severidade === 'na' ? 'não se aplica' : r.faltam > 0 ? `${fmtN(r.faltam)} de ${fmtN(r.aplicaveis)}` : `${fmtN(r.aplicaveis)} ok`}
                    </span>
                    <Icone nome="baixo" className={`h-3.5 w-3.5 shrink-0 text-suave transition ${aberta ? '' : '-rotate-90'}`} />
                  </button>
                  {aberta && <div className="px-3 pb-4"><DetalheRegra r={r} semCabecalho /></div>}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {notas?.length > 0 && (
        <>
          <Titulo extra={`${notas.length} observação(ões)`}>Falta fora do JSON</Titulo>
          <NotasCadastro notas={notas} embutido />
        </>
      )}
    </div>
  )
}
