import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import CaixaBusca from '../../components/CaixaBusca'
import { mensagemErro } from '../../lib/api'
import { limitesData } from '../../lib/validade'

// Adicionar token (vinculo = null) ou renovar um existente. O backend faz upsert por município × sistema.
export default function ModalToken({ aberto, vinculo, sistemas, sistemasOcupados, onFechar, onSalvar }) {
  const [form, setForm] = useState({ sistemaId: '', token: '', dataVencimento: '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const limites = limitesData()

  useEffect(() => {
    if (!aberto) return
    setErro('')
    setForm(vinculo
      ? { sistemaId: String(vinculo.sistemaId), token: vinculo.token, dataVencimento: '' }
      : { sistemaId: '', token: '', dataVencimento: '' })
  }, [aberto, vinculo])

  const disponiveis = vinculo ? sistemas : sistemas.filter(s => !sistemasOcupados.includes(s.id))

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      await onSalvar({ sistemaId: Number(form.sistemaId), token: form.token.trim(), dataVencimento: form.dataVencimento || null })
      onFechar()
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      aberto={aberto}
      titulo={vinculo ? `Renovar token · ${vinculo.sistema.nome}` : 'Adicionar token'}
      subtitulo={vinculo ? 'Cole o token novo e informe até quando ele vale.' : undefined}
      onFechar={onFechar}
      rodape={
        <>
          <button type="button" className="botao-secundario" onClick={onFechar}>Cancelar</button>
          <button type="submit" form="form-token" className="botao-primario" disabled={salvando || !form.sistemaId || !form.token.trim()}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      }
    >
      <form id="form-token" onSubmit={salvar} className="space-y-4">
        {!vinculo && (
          <div>
            <span className="rotulo">Sistema</span>
            <CaixaBusca
              opcoes={disponiveis.map(s => ({ valor: String(s.id), rotulo: s.nome }))}
              valor={form.sistemaId}
              onEscolher={v => setForm(f => ({ ...f, sistemaId: v }))}
              placeholder="Selecione…"
            />
            {!sistemas.length && <span className="mt-1 block text-xs text-suave">Nenhum sistema cadastrado — importe os dados ou cadastre em Sistemas.</span>}
          </div>
        )}
        <label className="block">
          <span className="rotulo">Token</span>
          <textarea
            className="campo min-h-[72px] resize-y break-all font-mono text-xs"
            value={form.token}
            onChange={e => setForm(f => ({ ...f, token: e.target.value }))}
            autoFocus
            required
          />
        </label>
        <label className="block">
          <span className="rotulo">Válido até <span className="font-normal">(opcional — no máximo 15 dias)</span></span>
          <input
            type="date"
            className="campo"
            value={form.dataVencimento}
            min={limites.min}
            max={limites.max}
            onChange={e => setForm(f => ({ ...f, dataVencimento: e.target.value }))}
          />
        </label>
        {erro && <p className="text-sm text-perigo">{erro}</p>}
      </form>
    </Modal>
  )
}
