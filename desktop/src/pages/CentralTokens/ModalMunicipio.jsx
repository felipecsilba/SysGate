import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import { mensagemErro } from '../../lib/api'

// Criar (municipio = null) ou editar município
export default function ModalMunicipio({ aberto, municipio, onFechar, onSalvar }) {
  const [form, setForm] = useState({ nome: '', observacoes: '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (aberto) {
      setForm({ nome: municipio?.nome ?? '', observacoes: municipio?.observacoes ?? '' })
      setErro('')
    }
  }, [aberto, municipio])

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      await onSalvar({ nome: form.nome.trim(), observacoes: form.observacoes.trim() || null })
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
      titulo={municipio ? 'Editar município' : 'Novo município'}
      onFechar={onFechar}
      rodape={
        <>
          <button type="button" className="botao-secundario" onClick={onFechar}>Cancelar</button>
          <button type="submit" form="form-municipio" className="botao-primario" disabled={salvando || !form.nome.trim()}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      }
    >
      <form id="form-municipio" onSubmit={salvar} className="space-y-4">
        <label className="block">
          <span className="rotulo">Nome</span>
          <input className="campo" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus required />
        </label>
        <label className="block">
          <span className="rotulo">Observações</span>
          <textarea
            className="campo min-h-[88px] resize-y"
            value={form.observacoes}
            onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
            placeholder="Ex.: base de produção, entidade, contato…"
          />
        </label>
        {erro && <p className="text-sm text-perigo">{erro}</p>}
      </form>
    </Modal>
  )
}
