import { useEffect, useMemo, useRef, useState } from 'react'
import Confirmar from '../../components/Confirmar'
import { comNovasTentativas, csvErros, desfazerPelaTela, estimularPelaTela, resumoErros, salvarPelaTela } from '../../lib/espelho'
import { ComPonto } from './comum'

const espera = ms => new Promise(r => setTimeout(r, ms))
const num = n => Number(n).toLocaleString('pt-BR')
const ponte = () => window.krakion?.tributos

// Chamada pela sessão do tributos (main). O comErro do main embrulha em { ok, dados | erro }.
async function chamarUmaVez(metodo, path, corpo) {
  const r = await ponte().chamar(metodo, path, corpo)
  if (!r?.ok) return { status: 0, data: { message: r?.erro || 'Falha na chamada' } }
  return r.dados
}
// 500/429 da tela: tenta de novo até 3 vezes antes de dar o registro como erro
const chamar = comNovasTentativas(chamarUmaVez, { esperar: espera })

// Backup completo: o registro lido pela tela vai para o .jsonl do dia antes do 1º PUT. Falhou → o registro não é tocado.
async function guardarBackup(cadastroId, registro) {
  const r = await window.krakion?.espelho?.guardar(cadastroId, registro)
  if (!r?.ok) throw new Error(r?.erro || 'sem acesso à pasta de backup')
}

const COR = { ok: 'text-emerald-600 dark:text-emerald-400', erro: 'text-perigo', rodando: 'text-acento', fila: 'text-suave' }
const ROTULO = { ok: 'Sucesso', rodando: 'Estimulando…', fila: 'Na fila' }

function Situacao({ s }) {
  if (!s) return <span className="text-suave">—</span>
  return <span className={COR[s.estado]} title={s.mensagem}>{s.estado === 'erro' ? s.mensagem : (s.mensagem || ROTULO[s.estado])}</span>
}

function BarraSessao({ sessao }) {
  const [erro, setErro] = useState('')
  async function entrar() {
    setErro('')
    const r = await ponte().entrar()
    if (!r?.ok) setErro(r?.erro || 'Não abriu a janela do tributos')
  }
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-borda p-4 text-[13px]">
      <span className={`flex items-center gap-1.5 font-medium ${sessao.conectado ? 'text-emerald-600 dark:text-emerald-400' : 'text-suave'}`}>
        <span className={`h-2 w-2 rounded-full ${sessao.conectado ? 'bg-emerald-500' : 'bg-texto/30'}`} />
        {sessao.conectado ? `Sessão do tributos ativa desde ${new Date(sessao.desde).toLocaleTimeString('pt-BR')}` : 'Sem sessão do tributos'}
      </span>
      <button type="button" className={`${sessao.conectado ? 'botao-secundario' : 'botao-primario'} !px-3 !py-1.5 text-xs`} onClick={entrar}>
        {sessao.janelaAberta ? 'Mostrar janela do tributos' : 'Entrar no tributos'}
      </button>
      {sessao.conectado && <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" onClick={() => ponte().sair()}>Sair</button>}
      <p className="w-full text-xs text-suave">
        A janela abre o tributos: entre com seu usuário e escolha a <strong className="text-texto">entidade do backup</strong>. A sessão é lida
        das chamadas da própria tela, fica só na memória e acaba ao fechar o App. Deixe a janela aberta (pode minimizar) enquanto estimula.
      </p>
      {erro && <p className="w-full text-xs text-perigo">{erro}</p>}
    </div>
  )
}

// Pela API da tela, registro a registro (cadastro.tela: path e campo do "."). Estímulo: GET → PUT com "." → espera → GET → PUT de volta (estimularPelaTela).
// desfazer: GET → PUT sem o "." só nos que ficaram marcados (desfazerPelaTela) — espelha, ao contrário da Service Layer.
// linhas/colunas: o arquivo do script como foi carregado — a exportação de erros sai no mesmo formato
export default function EnvioTela({ itens, desfazer = false, cadastro, linhas = [], colunas = [] }) {
  const { tela, rotuloItem: item } = cadastro
  const salvar = tela.modo === 'salvar' // contribuintes: salvar sem mudar já dispara — sem "." e sem volta
  const [sessao, setSessao] = useState({ conectado: false, desde: null, janelaAberta: false })
  const [incluidos, setIncluidos] = useState(() => new Set(itens.map(i => i.id)))
  const [porId, setPorId] = useState({}) // id → { estado, mensagem }
  const [ativo, setAtivo] = useState(false)
  const [pausaSessao, setPausaSessao] = useState(false)
  const [esperaS, setEsperaS] = useState(5)
  const [paralelos, setParalelos] = useState(2)
  const [confirmar, setConfirmar] = useState(null) // { lista, rotulo }
  const parar = useRef(false)

  useEffect(() => {
    if (!ponte()) return
    ponte().status().then(r => r?.ok && setSessao(r.dados))
    return ponte().aoMudar(setSessao)
  }, [])
  useEffect(() => { setIncluidos(new Set(itens.map(i => i.id))); setPorId({}) }, [itens])

  const marcar = (id, s) => setPorId(p => ({ ...p, [id]: s }))
  const selecionados = useMemo(() => itens.filter(i => incluidos.has(i.id)), [itens, incluidos])

  // Fila com teto de paralelismo. Sessão expirada (401) pausa tudo: o item volta para a fila e nada é marcado como erro.
  async function executar(lista) {
    parar.current = false
    setPausaSessao(false)
    setAtivo(true)
    for (const i of lista) marcar(i.id, { estado: 'fila' })
    const pendentes = [...lista]
    let pausou = false
    const trabalhador = async () => {
      while (pendentes.length && !parar.current && !pausou) {
        const registro = pendentes.shift()
        marcar(registro.id, { estado: 'rodando' })
        try {
          const guardar = obj => guardarBackup(cadastro.id, obj)
          const r = salvar ? await salvarPelaTela(registro, { chamar, tela, guardar })
            : desfazer ? await desfazerPelaTela(registro, { chamar, tela, guardar })
              : await estimularPelaTela(registro, { chamar, esperar: espera, esperaMs: esperaS * 1000, tela, guardar })
          marcar(registro.id, r.ok
            ? { estado: 'ok', mensagem: r.jaEstava ? 'Já estava sem "."' : r.soVolta ? 'Sucesso (estava com ".", só voltou)' : 'Sucesso' }
            : { estado: 'erro', etapa: r.etapa, mensagem: r.mensagem, marcado: r.marcado })
        } catch (err) {
          if (err.sessaoExpirada) { pausou = true; marcar(registro.id, { estado: 'fila', mensagem: 'Aguardando nova sessão' }); pendentes.unshift(registro) }
          else marcar(registro.id, { estado: 'erro', etapa: 'rede', mensagem: err.message })
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(paralelos, lista.length) }, trabalhador))
    if (pausou) setPausaSessao(true)
    setAtivo(false)
  }

  const status = Object.values(porId)
  const okN = status.filter(s => s.estado === 'ok').length
  const erroN = status.filter(s => s.estado === 'erro').length
  const marcadosN = status.filter(s => s.marcado).length
  const pendentesFila = itens.filter(i => porId[i.id]?.estado === 'fila')
  const comErro = itens.filter(i => porId[i.id]?.estado === 'erro')
  const pronto = sessao.conectado && !ativo
  const motivos = useMemo(() => resumoErros(porId), [porId])

  // CSV só dos com erro: volta a ser carregado aqui para tentar só eles; as mensagens são bugs de migração (Checagem)
  function exportarErros() {
    const blob = new Blob(['\uFEFF' + csvErros(linhas, colunas, porId)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${cadastro.arquivo.replace(/\.csv$/, '')}_erros_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const todos = selecionados.length === itens.length

  return (
    <>
      <BarraSessao sessao={sessao} />

      <div className="flex flex-wrap items-end gap-3 border-b border-borda p-4 text-[13px]">
        {!desfazer && !salvar && (
          <label className="w-40"><span className="rotulo">Espera antes da volta (s)</span>
            <input type="number" min={1} max={120} className="campo" value={esperaS} disabled={ativo}
              onChange={e => setEsperaS(Math.min(120, Math.max(1, Number(e.target.value) || 1)))} /></label>
        )}
        <label className="w-36"><span className="rotulo">Em paralelo</span>
          <input type="number" min={1} max={5} className="campo" value={paralelos} disabled={ativo}
            onChange={e => setParalelos(Math.min(5, Math.max(1, Number(e.target.value) || 1)))} /></label>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" disabled={!pronto || !selecionados.length}
            onClick={() => setConfirmar({ lista: selecionados.slice(0, 1), rotulo: 'Testar com 1' })}>Testar com 1</button>
          <button type="button" className="botao-primario !px-3 !py-1.5 text-xs" disabled={!pronto || !selecionados.length}
            onClick={() => setConfirmar({ lista: selecionados, rotulo: desfazer ? 'Tirar o "." dos selecionados' : salvar ? 'Salvar os selecionados' : 'Estimular os selecionados' })}>
            {desfazer ? 'Tirar o “.”' : salvar ? 'Salvar' : 'Estimular'} {num(selecionados.length)} {item}
          </button>
          {pausaSessao && !ativo && sessao.conectado && pendentesFila.length > 0 && (
            <button type="button" className="botao-primario !px-3 !py-1.5 text-xs" onClick={() => executar(pendentesFila)}>Continuar ({num(pendentesFila.length)})</button>
          )}
          {comErro.length > 0 && !ativo && (
            <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" disabled={!sessao.conectado}
              onClick={() => setConfirmar({ lista: comErro, rotulo: 'Reenviar os com erro' })}>Reenviar os {num(comErro.length)} com erro</button>
          )}
          {ativo && <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" onClick={() => { parar.current = true }}>Parar</button>}
          {comErro.length > 0 && !ativo && (
            <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" onClick={exportarErros}
              title="O mesmo arquivo do script, só com os que deram erro (+ etapa e erro no fim). Carregue-o aqui de novo para tentar só eles.">Exportar erros ({num(comErro.length)})</button>
          )}
          <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" onClick={() => window.krakion?.espelho?.abrirBackups()}
            title="Cada registro é guardado inteiro (como a tela devolve) antes de ser alterado">Abrir backups</button>
        </div>
        <p className="w-full text-xs text-suave">
          {salvar
            ? 'Cada registro: lê pela tela, guarda o backup completo e salva como está. Salvar sem mudar já dispara o cadastro único — não há “.” nem volta.'
            : desfazer
            ? `Cada registro: lê pela tela e, se o campo ${tela.campo} termina com “.”, grava sem o ponto. Já sem ponto: nada é gravado.`
            : `Cada registro: lê pela tela, grava o campo ${tela.campo} com “.”, espera, lê de novo e grava o original.`}
        </p>
        {pausaSessao && <p className="w-full text-xs text-perigo">A sessão do tributos expirou. Entre de novo na janela e clique em Continuar — nada foi marcado como erro.</p>}
        {marcadosN > 0 && <p className="w-full text-xs text-perigo">{num(marcadosN)} {item} ficaram com “.” (a volta falhou). Use “Reenviar os com erro”: ele faz só a volta.</p>}
        {status.length > 0 && <p className="w-full text-xs text-suave">{num(okN)} com sucesso · {num(erroN)} com erro · {num(status.length - okN - erroN)} na fila</p>}
        {motivos.length > 0 && (
          <div className="w-full text-xs">
            <p className="font-medium text-texto">Erros por motivo</p>
            <ul className="mt-1 space-y-0.5 text-suave">
              {motivos.slice(0, 8).map(m => <li key={m.mensagem}><strong className="text-texto">{num(m.total)}×</strong> {m.mensagem}</li>)}
              {motivos.length > 8 && <li>… e mais {num(motivos.length - 8)} motivo(s) — veja no CSV de erros</li>}
            </ul>
          </div>
        )}
      </div>

      <table className="w-full text-[13px]">
        <thead className="sticky top-0 bg-fundo text-left text-[11px] uppercase tracking-wider text-suave">
          <tr className="border-b border-borda">
            <th className="w-10 px-4 py-2">
              <input type="checkbox" checked={todos} disabled={ativo} title={todos ? 'Desmarcar todos' : 'Marcar todos'}
                onChange={() => setIncluidos(todos ? new Set() : new Set(itens.map(i => i.id)))} className="h-4 w-4 accent-[rgb(var(--acento))]" />
            </th>
            <th className="w-28 px-2 py-2 font-semibold">ID</th>
            <th className="px-2 py-2 font-semibold">{desfazer ? 'Se estiver com ponto' : `${tela.campo} atual`}</th>
            <th className="px-2 py-2 font-semibold">{desfazer ? 'Vai voltar para' : salvar ? 'O que acontece' : 'Durante o estímulo'}</th>
            <th className="w-64 px-4 py-2 font-semibold">Situação</th>
          </tr>
        </thead>
        <tbody>
          {itens.map(i => (
            <tr key={i.id} className={`border-b border-borda/60 ${i.jaTemPonto && !salvar ? 'bg-amber-500/10' : ''} ${incluidos.has(i.id) ? '' : 'opacity-50'}`}>
              <td className="px-4 py-1.5">
                <input type="checkbox" checked={incluidos.has(i.id)} disabled={ativo} className="h-4 w-4 accent-[rgb(var(--acento))]"
                  onChange={() => setIncluidos(s => { const n = new Set(s); n.has(i.id) ? n.delete(i.id) : n.add(i.id); return n })} />
              </td>
              <td className="px-2 py-1.5 font-mono">{i.id}</td>
              <td className="px-2 py-1.5">{desfazer ? <ComPonto texto={i.nova} /> : i.atual}</td>
              <td className="px-2 py-1.5">
                {salvar ? <span className="text-suave">salvo como está</span> : desfazer ? i.atual : <ComPonto texto={i.nova} />}
                {!desfazer && !salvar && i.jaTemPonto && <span className="ml-2 text-[11px] text-amber-700 dark:text-amber-300">já tinha “.”</span>}
              </td>
              <td className="truncate px-4 py-1.5 text-xs"><Situacao s={porId[i.id]} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Confirmar
        aberto={!!confirmar}
        titulo={confirmar ? `${confirmar.rotulo}?` : ''}
        mensagem={confirmar ? (salvar
          ? `${num(confirmar.lista.length)} ${item} pela API da tela do tributos, com a sua sessão. Cada um é lido, guardado no backup e salvo como está — o cadastro único espelha nos outros sistemas. Confira que a entidade da janela é a do backup.`
          : desfazer
          ? `${num(confirmar.lista.length)} ${item} pela API da tela do tributos, com a sua sessão. Os que terminam com "." voltam sem o ponto — e isso espelha nos outros sistemas. Confira que a entidade da janela é a do backup.`
          : `${num(confirmar.lista.length)} ${item} pela API da tela do tributos, com a sua sessão. Cada um ganha "." no ${tela.campo} por uns ${esperaS} s e volta ao original — o cadastro único espelha nos outros sistemas. Confira que a entidade da janela é a do backup.`) : ''}
        rotulo={desfazer ? 'Tirar o “.”' : salvar ? 'Salvar' : 'Estimular'}
        onConfirmar={() => { const c = confirmar; setConfirmar(null); executar(c.lista) }}
        onFechar={() => setConfirmar(null)}
      />
    </>
  )
}
