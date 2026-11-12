import { useMemo, useState } from 'react'
import Confirmar from '../../components/Confirmar'
import Icone from '../../components/Icone'
import { csvPrefeitura, montarLotesCorrecao } from '../../lib/checagemMigracao'
import { Situacao } from '../MigracaoEspelho/comum'
import { SeletorToken, useEnvioLote, useMunicipioToken } from '../MigracaoEspelho/envioLote'
import { fmtN } from './pecas'

const LIMITE_LISTA = 300

function baixarCsv(nome, conteudo) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8' }))
  a.download = nome
  a.click()
  URL.revokeObjectURL(a.href)
}

// Correção sugerida de uma verificação: pela Service Layer (só o que precisa mudar) ou lista para a prefeitura.
export default function CorrecaoMigracao({ resultado, checagem }) {
  const { verificacao, casos } = resultado
  const { correcao } = verificacao
  if (!casos.length || !correcao) return null
  return (
    <section className="rounded-xl border border-borda p-3">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-suave">
        <Icone nome={correcao.tipo === 'api' ? 'api' : 'municipio'} className="h-3.5 w-3.5" /> Correção sugerida
      </p>
      {correcao.tipo === 'api'
        ? <PelaApi resultado={resultado} />
        : (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <p className="flex-1">{correcao.explicacao}</p>
            <button type="button" className="botao-secundario !px-3 !py-1.5 text-sm"
              onClick={() => baixarCsv(`${checagem.id}_${verificacao.id}_prefeitura_${new Date().toISOString().slice(0, 10)}.csv`, csvPrefeitura(casos, verificacao))}>
              Exportar lista para a prefeitura ({fmtN(casos.length)})
            </button>
          </div>
        )}
    </section>
  )
}

function PelaApi({ resultado }) {
  const { verificacao, casos } = resultado
  const { correcao } = verificacao
  const { itens, semCorrecao } = useMemo(() => correcao.montar(casos), [correcao, casos])
  const sel = useMunicipioToken()
  const envio = useEnvioLote(sel, { path: correcao.path, metodo: correcao.metodo })
  const [confirmar, setConfirmar] = useState(null) // { itens, rotulo }
  const { porId, ativo, pendentes, resumo } = envio
  const comErro = itens.filter(i => porId[i.alvo] && !porId[i.alvo].ok && !porId[i.alvo].fila)

  return (
    <div className="space-y-3 text-sm">
      <p>{correcao.explicacao}</p>
      <p className="text-xs text-suave">
        <span className="font-mono">{correcao.metodo} {correcao.path}</span> pela Service Layer, com o token de migração.
        Ela não espelha sozinha: depois de corrigir, use o “Exportar CSV” acima e reestimule esses contribuintes na Migração Espelho.
      </p>
      {semCorrecao.length > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          {fmtN(semCorrecao.length)} caso(s) sem correção automática (precisa decidir na tela): {semCorrecao.slice(0, 20).map(c => c.id).join(', ')}{semCorrecao.length > 20 ? '…' : ''}
        </p>
      )}

      {itens.length > 0 && (
        <>
          <div className="flex flex-wrap items-end gap-3 border-t border-borda pt-3 text-[13px]">
            <SeletorToken sel={sel} />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" disabled={!sel.pronto || ativo}
                onClick={() => setConfirmar({ itens: itens.slice(0, 1), rotulo: 'Testar com 1' })}>Testar com 1</button>
              <button type="button" className="botao-primario !px-3 !py-1.5 text-xs" disabled={!sel.pronto || ativo}
                onClick={() => setConfirmar({ itens, rotulo: correcao.rotulo })}>
                {correcao.rotulo} ({fmtN(itens.length)})
              </button>
              {comErro.length > 0 && !ativo && (
                <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" onClick={() => setConfirmar({ itens: comErro, rotulo: 'Reenviar os com erro' })}>
                  Reenviar os {fmtN(comErro.length)} com erro
                </button>
              )}
              {pendentes.length > 0 && !ativo && <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" onClick={envio.consultarPendentes}>Consultar pendentes ({pendentes.length})</button>}
              {ativo && <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" onClick={envio.parar}>Parar</button>}
            </div>
            {envio.pausa && <p className="w-full text-xs text-amber-700 dark:text-amber-300">A Betha limitou as chamadas · tenta de novo às {new Date(envio.pausa).toLocaleTimeString('pt-BR')}</p>}
            {resumo.total > 0 && <p className="w-full text-xs text-suave">{fmtN(resumo.okN)} com sucesso · {fmtN(resumo.erroN)} com erro · {fmtN(resumo.filaN)} na fila</p>}
          </div>

          <table className="w-full text-[13px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-suave">
              <tr className="border-b border-borda">
                <th className="px-2 py-1.5 font-semibold">O que muda</th>
                <th className="w-56 px-2 py-1.5 font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {itens.slice(0, LIMITE_LISTA).map(i => (
                <tr key={i.alvo} className="border-b border-borda/60">
                  <td className="px-2 py-1.5">{i.descricao}</td>
                  <td className="truncate px-2 py-1.5 text-xs"><Situacao s={porId[i.alvo]} /></td>
                </tr>
              ))}
            </tbody>
            {itens.length > LIMITE_LISTA && <tfoot><tr><td colSpan={2} className="px-2 py-2 text-xs text-suave">… e mais {fmtN(itens.length - LIMITE_LISTA)}</td></tr></tfoot>}
          </table>
        </>
      )}

      <Confirmar
        aberto={!!confirmar}
        titulo={confirmar ? `${confirmar.rotulo}?` : ''}
        mensagem={confirmar ? `${correcao.metodo} ${correcao.path} — ${fmtN(confirmar.itens.length)} item(ns), no município ${sel.municipio?.nome}. ${correcao.metodo === 'DELETE' ? 'Exclusão não tem volta.' : 'Confira o que muda na lista antes de enviar.'}` : ''}
        rotulo={correcao.metodo === 'DELETE' ? 'Excluir' : 'Corrigir'}
        onConfirmar={() => { const c = confirmar; setConfirmar(null); envio.enviar(montarLotesCorrecao(c.itens, correcao)) }}
        onFechar={() => setConfirmar(null)}
      />
    </div>
  )
}
