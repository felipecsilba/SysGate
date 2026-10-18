import { useDeferredValue, useMemo, useState } from 'react'
import Icone from '../../components/Icone'
import BotaoIcone from '../../components/BotaoIcone'
import Editor from './Editor'
import { comparar, interpretar, resumoValor } from '../../lib/json'

// Os dois textos sobrevivem à troca de módulo enquanto o app está aberto — não vão para disco
let guardado = { a: '', b: '' }

const TIPOS = {
  adicionado: { rotulo: 'Adicionado', sinal: '+', cor: 'text-emerald-600 dark:text-emerald-400' },
  removido: { rotulo: 'Removido', sinal: '−', cor: 'text-perigo' },
  alterado: { rotulo: 'Alterado', sinal: '~', cor: 'text-amber-600 dark:text-amber-400' },
}

const LIMITE = 1000

function Lado({ titulo, texto, onMudar, r }) {
  async function colar() {
    const t = await navigator.clipboard.readText()
    if (t) onMudar(t)
  }
  const botao = 'flex h-7 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-xs text-suave transition hover:bg-texto/[0.06] hover:text-texto disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-1 border-b border-borda px-2 py-1.5">
        <span className="px-1.5 text-xs font-medium">{titulo}</span>
        {r.erro && <span className="truncate text-[11px] text-perigo" title={r.erro.mensagem}>linha {r.erro.linha}, coluna {r.erro.coluna}</span>}
        {'valor' in r && <Icone nome="check" className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
        <div className="flex-1" />
        <button type="button" onClick={colar} className={botao}><Icone nome="copiar" className="h-3.5 w-3.5" /> Colar</button>
        <button type="button" onClick={() => onMudar(JSON.stringify(r.valor, null, 2))} disabled={!('valor' in r)} className={botao}>
          <Icone nome="texto" className="h-3.5 w-3.5" /> Formatar
        </button>
        <BotaoIcone titulo="Limpar" icone="lixeira" perigo className="h-7 w-7" onClick={() => onMudar('')} />
      </div>
      <Editor valor={texto} onMudar={onMudar} linhaErro={r.erro?.linha} placeholder={`Cole o JSON ${titulo.split(' ')[0]} aqui…`} />
    </div>
  )
}

export default function Comparar() {
  const [a, setA] = useState(guardado.a)
  const [b, setB] = useState(guardado.b)
  const [filtro, setFiltro] = useState(null)
  const [aviso, setAviso] = useState(null)

  const aAdiado = useDeferredValue(a)
  const bAdiado = useDeferredValue(b)
  const ra = useMemo(() => interpretar(aAdiado), [aAdiado])
  const rb = useMemo(() => interpretar(bAdiado), [bAdiado])
  const prontos = 'valor' in ra && 'valor' in rb
  const diferencas = useMemo(() => (prontos ? comparar(ra.valor, rb.valor) : []), [prontos, ra, rb])

  const contagem = useMemo(() => {
    const c = { adicionado: 0, removido: 0, alterado: 0 }
    for (const d of diferencas) c[d.tipo]++
    return c
  }, [diferencas])
  const visiveis = filtro ? diferencas.filter(d => d.tipo === filtro) : diferencas

  function mudarA(t) { guardado.a = t; setA(t) }
  function mudarB(t) { guardado.b = t; setB(t) }
  function trocar() { mudarA(b); mudarB(a) }

  async function copiar(caminho) {
    await navigator.clipboard.writeText(caminho)
    setAviso(`Copiado ${caminho}`)
    clearTimeout(copiar.t)
    copiar.t = setTimeout(() => setAviso(null), 1800)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-[3] border-b border-borda">
        <Lado titulo="A — original" texto={a} onMudar={mudarA} r={ra} />
        <div className="flex flex-col items-center border-x border-borda px-1 pt-1.5">
          <BotaoIcone titulo="Trocar A e B" icone="atualizar" className="h-7 w-7" onClick={trocar} />
        </div>
        <Lado titulo="B — novo" texto={b} onMudar={mudarB} r={rb} />
      </div>

      <div className="flex min-h-0 flex-[2] flex-col">
        <div className="flex items-center gap-1 border-b border-borda px-3 py-1.5 text-xs">
          {!prontos ? (
            <span className="py-1 text-suave">
              {ra.vazio || rb.vazio ? 'Cole um JSON em cada lado para comparar.' : 'Corrija o JSON com erro para comparar.'}
            </span>
          ) : !diferencas.length ? (
            <span className="flex items-center gap-1.5 py-1 text-emerald-600 dark:text-emerald-400"><Icone nome="check" className="h-3.5 w-3.5" /> Os dois são iguais</span>
          ) : (
            <>
              <button type="button" onClick={() => setFiltro(null)}
                className={`h-7 rounded-full px-3 ${!filtro ? 'bg-texto/[0.07] font-medium' : 'text-suave hover:text-texto'}`}>
                {diferencas.length} {diferencas.length === 1 ? 'diferença' : 'diferenças'}
              </button>
              {Object.entries(TIPOS).map(([tipo, t]) => contagem[tipo] > 0 && (
                <button key={tipo} type="button" onClick={() => setFiltro(f => (f === tipo ? null : tipo))}
                  className={`flex h-7 items-center gap-1.5 rounded-full px-3 ${filtro === tipo ? 'bg-texto/[0.07] font-medium' : 'text-suave hover:text-texto'}`}>
                  <span className={`font-mono ${t.cor}`}>{t.sinal}</span> {t.rotulo} <span className="tabular-nums text-suave">{contagem[tipo]}</span>
                </button>
              ))}
            </>
          )}
          {aviso && <span className="ml-auto truncate text-[11px]">{aviso}</span>}
        </div>

        {prontos && visiveis.length > 0 && (
          <ul className="min-h-0 flex-1 overflow-y-auto p-2 font-mono text-xs">
            {visiveis.slice(0, LIMITE).map((d, i) => (
              <li key={i}>
                <button type="button" onClick={() => copiar(d.caminho)} title="Copiar caminho"
                  className="grid w-full grid-cols-[1rem_minmax(10rem,2fr)_3fr] items-baseline gap-3 rounded-lg px-2 py-1 text-left hover:bg-texto/[0.04]">
                  <span className={TIPOS[d.tipo].cor}>{TIPOS[d.tipo].sinal}</span>
                  <span className="truncate">{d.caminho}</span>
                  <span className="min-w-0 truncate text-suave">
                    {d.tipo === 'alterado'
                      ? <><span className="text-perigo/80 line-through decoration-perigo/40">{resumoValor(d.de, 60)}</span> → <span className="text-texto">{resumoValor(d.para, 60)}</span></>
                      : resumoValor(d.valor, 120)}
                  </span>
                </button>
              </li>
            ))}
            {visiveis.length > LIMITE && <li className="px-2 py-1 font-sans text-suave">Mostrando {LIMITE} de {visiveis.length}.</li>}
          </ul>
        )}
      </div>
    </div>
  )
}
