import JsonColorido from '../../components/JsonColorido'
import MetodoBadge from '../../components/MetodoBadge'
import { chamadaFonte, descricaoAcao } from '../../lib/mapa'

const dataBr = iso => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR') : '')

// Painel do nó: como liga, o que fazer, endpoints, fonte BFC e o que a prática ensinou
export default function PainelNo({ no, rotuloDe, paiRotulo }) {
  const confirmado = no.status === 'confirmado'
  const chamada = chamadaFonte(no.fonte)
  return (
    <div className="space-y-5 px-5 py-5 text-sm">
      <div>
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-lg font-semibold leading-tight">{no.rotulo}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${confirmado ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border border-dashed border-borda text-suave'}`}>
            {confirmado ? `Confirmado${no.confirmadoEm ? ` em ${dataBr(no.confirmadoEm)}` : ''}` : 'Inferido'}
          </span>
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

      {no.campo && (
        <Secao titulo="O que fazer">
          <p className={no.acao === 'reprocessar' || no.acao === 'saiJunto' ? 'font-medium' : ''}>{descricaoAcao(no, rotuloDe)}</p>
          {no.categoria === 'financeiro' && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Vínculo financeiro: imóvel com isto não entra numa exclusão em massa sem revisão.</p>}
        </Secao>
      )}

      {no.notas.length > 0 && (
        <Secao titulo="O que a prática ensinou">
          <ul className="space-y-1.5">
            {no.notas.map((n, i) => <li key={i} className="flex gap-2 text-[13px] leading-snug"><span className="text-suave">•</span><span>{n}</span></li>)}
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
