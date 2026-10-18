import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import { mensagemErro } from '../../lib/api'
import { avisoUrlBase } from '../../lib/endpoints'

// Criar (sistema = null) ou editar sistema
export default function ModalSistema({ aberto, sistema, onFechar, onSalvar }) {
  const [form, setForm] = useState({ nome: '', urlBase: '', descricao: '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setErro('')
    setForm({ nome: sistema?.nome ?? '', urlBase: sistema?.urlBase ?? '', descricao: sistema?.descricao ?? '' })
  }, [aberto, sistema])

  const campo = nome => ({ value: form[nome], onChange: e => setForm(f => ({ ...f, [nome]: e.target.value })) })
  const aviso = avisoUrlBase(form.urlBase)

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      await onSalvar({ nome: form.nome.trim(), urlBase: form.urlBase.trim(), descricao: form.descricao.trim() || null })
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
      titulo={sistema ? 'Editar sistema' : 'Novo sistema'}
      onFechar={onFechar}
      rodape={
        <>
          <button type="button" className="botao-secundario" onClick={onFechar}>Cancelar</button>
          <button type="submit" form="form-sistema" className="botao-primario" disabled={salvando || !form.nome.trim() || !form.urlBase.trim()}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      }
    >
      <form id="form-sistema" onSubmit={salvar} className="space-y-4">
        <label className="block">
          <span className="rotulo">Nome</span>
          <input className="campo" {...campo('nome')} placeholder="Ex.: Tributos" autoFocus required />
        </label>
        <label className="block">
          <span className="rotulo">URL base</span>
          <input className="campo font-mono text-xs" {...campo('urlBase')} placeholder="https://tributos.betha.cloud/service-layer-tributos" required />
          {aviso && <span className="mt-1.5 block text-xs text-amber-700 dark:text-amber-400">{aviso}</span>}
        </label>
        <label className="block">
          <span className="rotulo">Descrição</span>
          <textarea className="campo min-h-[72px] resize-y" {...campo('descricao')} />
        </label>
        {erro && <p className="text-sm text-perigo">{erro}</p>}
      </form>
    </Modal>
  )
}
