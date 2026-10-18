import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Sessão do app desktop — key própria, não colide com a do Krakion web.
export const useAuthStore = create(
  persist(
    set => ({
      token: null,
      usuario: null,
      entrar: ({ token, usuario }) => set({ token, usuario }),
      sair: () => set({ token: null, usuario: null }),
    }),
    { name: 'krakion-desktop-auth' }
  )
)
