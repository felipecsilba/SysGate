import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { proximaPreferencia, resolverTema } from '../lib/tema'

const midiaEscura = window.matchMedia('(prefers-color-scheme: dark)')

function aplicar(preferencia) {
  const tema = resolverTema(preferencia, midiaEscura.matches)
  document.documentElement.classList.toggle('dark', tema === 'escuro')
  // No Electron, o main guarda a preferência para a próxima abertura já nascer no tema certo
  window.krakion?.tema?.definir(preferencia)
}

export const useTemaStore = create(
  persist(
    (set, get) => ({
      preferencia: 'sistema',
      alternar: () => {
        const preferencia = proximaPreferencia(get().preferencia)
        set({ preferencia })
        aplicar(preferencia)
      },
    }),
    {
      name: 'krakion-desktop-tema',
      onRehydrateStorage: () => estado => aplicar(estado?.preferencia ?? 'sistema'),
    }
  )
)

// Em "sistema", acompanha a troca de tema do Windows com o app aberto
midiaEscura.addEventListener('change', () => aplicar(useTemaStore.getState().preferencia))
