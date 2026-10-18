import { useState } from 'react'
import Modal from './Modal'

// Confirmação de ação destrutiva. `onConfirmar` pode ser async — o botão espera.
export default function Confirmar({ aberto, titulo, mensagem, rotulo = 'Excluir', onConfirmar, onFechar }) {
  const [executando, setExecutando] = useState(false)

  async function confirmar() {
    setExecutando(true)
    try {
      await onConfirmar()
      onFechar()
    } finally {
      setExecutando(false)
    }
  }

  return (
    <Modal
      aberto={aberto}
      titulo={titulo}
      onFechar={onFechar}
      rodape={
        <>
          <button type="button" className="botao-secundario" onClick={onFechar} disabled={executando}>Cancelar</button>
          <button type="button" className="botao bg-perigo text-white hover:brightness-110" onClick={confirmar} disabled={executando}>
            {executando ? 'Aguarde…' : rotulo}
          </button>
        </>
      }
    >
      <p className="text-sm text-suave">{mensagem}</p>
    </Modal>
  )
}
