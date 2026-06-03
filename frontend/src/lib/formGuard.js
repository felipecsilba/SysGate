/**
 * Utilitário para proteger fechamento de modais com alterações não salvas.
 *
 * Uso básico:
 *   import { confirmClose, isFormDirty } from '../lib/formGuard'
 *
 *   const inicial = useRef({ ...valoresIniciais })
 *   const dirty = isFormDirty(inicial.current, formAtual)
 *
 *   // Substituir chamadas de onFechar por:
 *   const fecharComGuard = () => confirmClose(dirty, onFechar)
 */

/**
 * Compara dois valores (objetos, arrays, primitivos) para detectar mudanças.
 * Usa JSON.stringify — suficiente para forms com tipos primitivos.
 */
export function isFormDirty(initial, current) {
  return JSON.stringify(initial) !== JSON.stringify(current)
}

/**
 * Exibe confirmação nativa antes de fechar se houver alterações não salvas.
 * Se não houver alterações (ou o usuário confirmar), chama onClose().
 *
 * @param {boolean} isDirty
 * @param {Function} onClose
 */
export function confirmClose(isDirty, onClose) {
  if (!isDirty || window.confirm('Você tem alterações não salvas.\nDeseja descartar as alterações?')) {
    onClose()
  }
}
