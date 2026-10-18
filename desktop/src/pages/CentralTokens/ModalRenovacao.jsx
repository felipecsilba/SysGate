import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CaixaBusca from '../../components/CaixaBusca'
import Icone from '../../components/Icone'
import Modal from '../../components/Modal'
import { mensagemErro, municipiosApi } from '../../lib/api'
import { dataMaisDias } from '../../lib/validade'

const betha = window.krakion?.betha

const COR = {
  aguardando: 'text-suave', rodando: 'text-acento', ok: 'text-emerald-600 dark:text-emerald-400',
  erro: 'text-perigo', escolher: 'text-amber-600 dark:text-amber-400',
}

// Renova tokens no Betha Admin, um por vez. itens: [{ municipioId, municipioNome, sistemaId, sistemaNome }]
export default function ModalRenovacao({ aberto, itens, onFechar, onConcluido }) {
  const navegar = useNavigate()
  const [configurado, setConfigurado] = useState(null)
  const [estados, setEstados] = useState([])
  const [mostrar, setMostrar] = useState(false)
  const [executando, setExecutando] = useState(false)
  const [pendente, setPendente] = useState(null) // { indice, etapa, rotulo, opcoes, escolhido }
  const escolhas = useRef({}) // { [indice]: { [etapa]: texto } }
  const atual = useRef(-1)

  useEffect(() => {
    if (!aberto) return
    setEstados(itens.map(() => ({ status: 'aguardando', texto: '' })))
    setPendente(null)
    escolhas.current = {}
    betha?.status().then(s => setConfigurado(s.configurado))
    return betha?.aoPasso(texto => {
      const i = atual.current
      if (i >= 0) setEstados(es => es.map((e, k) => (k === i ? { ...e, texto } : e)))
    })
  }, [aberto, itens])

  const marcar = (i, mudanca) => setEstados(es => es.map((e, k) => (k === i ? { ...e, ...mudanca } : e)))

  async function processar(aPartirDe) {
    setExecutando(true)
    for (let i = aPartirDe; i < itens.length; i++) {
      const it = itens[i]
      atual.current = i
      marcar(i, { status: 'rodando', texto: 'Começando…' })
      const r = await betha.renovar({ municipio: it.municipioNome, sistema: it.sistemaNome, mostrar, escolhasManuais: escolhas.current[i] || {} })
      if (r.precisaEscolher) {
        marcar(i, { status: 'escolher', texto: `Escolha a ${r.precisaEscolher.rotulo}` })
        setPendente({ indice: i, ...r.precisaEscolher, escolhido: '' })
        setExecutando(false)
        return // continua quando ele escolher
      }
      if (r.erro) { marcar(i, { status: 'erro', texto: r.erro }); continue }
      try {
        const validade = dataMaisDias(r.dias)
        await municipiosApi.salvarToken(it.municipioId, { sistemaId: it.sistemaId, token: r.token, dataVencimento: validade })
        marcar(i, { status: 'ok', texto: `Token novo salvo · válido até ${validade.split('-').reverse().join('/')}` })
      } catch (err) {
        marcar(i, { status: 'erro', texto: `Token emitido, mas não consegui salvar: ${mensagemErro(err)}` })
      }
    }
    atual.current = -1
    setExecutando(false)
    onConcluido()
  }

  function continuar() {
    const { indice, etapa, escolhido } = pendente
    escolhas.current[indice] = { ...(escolhas.current[indice] || {}), [etapa]: escolhido }
    setPendente(null)
    processar(indice)
  }

  const terminou = estados.length > 0 && estados.every(e => e.status === 'ok' || e.status === 'erro')

  return (
    <Modal
      aberto={aberto}
      titulo={itens.length === 1 ? 'Renovar token no Betha Admin' : `Renovar ${itens.length} tokens no Betha Admin`}
      subtitulo="O app entra no Betha Admin com seu usuário, emite um token novo de 15 dias e salva aqui."
      onFechar={executando ? () => {} : onFechar}
      largura="max-w-lg"
      rodape={
        <>
          <button type="button" className="botao-secundario" onClick={onFechar} disabled={executando}>{terminou ? 'Fechar' : 'Cancelar'}</button>
          {!terminou && !pendente && (
            <button type="button" className="botao-primario" disabled={executando || !configurado} onClick={() => processar(estados.findIndex(e => e.status !== 'ok'))}>
              <Icone nome="atualizar" className="h-4 w-4" /> {executando ? 'Renovando…' : 'Renovar'}
            </button>
          )}
          {pendente && <button type="button" className="botao-primario" disabled={!pendente.escolhido} onClick={continuar}>Continuar</button>}
        </>
      }
    >
      {!betha ? (
        <p className="text-sm text-suave">O agente só funciona no Krakion App.</p>
      ) : configurado === false ? (
        <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Antes, informe seu usuário e senha do Betha Admin.{' '}
          <button type="button" className="font-medium underline" onClick={() => navegar('/betha-admin')}>Configurar agora</button>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-1.5">
            {itens.map((it, i) => (
              <li key={`${it.municipioId}-${it.sistemaId}`} className="rounded-xl border border-borda px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{it.municipioNome}</span>
                  <span className="text-suave">· {it.sistemaNome}</span>
                  {estados[i]?.status === 'rodando' && <span className="ml-auto h-3.5 w-3.5 animate-spin rounded-full border-2 border-borda border-t-acento" />}
                  {estados[i]?.status === 'ok' && <Icone nome="check" className="ml-auto h-4 w-4 text-emerald-600" strokeWidth={2.5} />}
                </div>
                {estados[i]?.texto && <p className={`mt-0.5 text-xs ${COR[estados[i].status]}`}>{estados[i].texto}</p>}
              </li>
            ))}
          </ul>

          {pendente && (
            <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3">
              <p className="text-sm">
                Não achei sozinho a <span className="font-medium">{pendente.rotulo}</span> de{' '}
                <span className="font-medium">{itens[pendente.indice].municipioNome}</span>. Qual é? (vou lembrar nas próximas)
              </p>
              <CaixaBusca
                opcoes={pendente.opcoes.map(o => ({ valor: o.texto, rotulo: o.texto }))}
                valor={pendente.escolhido}
                onEscolher={v => setPendente(p => ({ ...p, escolhido: v }))}
                placeholder="— escolha —"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-suave">
            <input type="checkbox" checked={mostrar} onChange={e => setMostrar(e.target.checked)} disabled={executando} className="accent-[rgb(var(--acento))]" />
            Mostrar o navegador enquanto o agente trabalha
          </label>
        </div>
      )}
    </Modal>
  )
}
