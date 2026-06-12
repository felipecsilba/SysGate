import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import portalApi from '../lib/portalApi'

// Sessão do PORTAL EXTERNO — store separado do authStore interno (krakion-auth)
// para que as sessões interna e externa coexistam no mesmo browser sem conflito.
const usePortalAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      solicitante: null, // { id, nome, email, cargo, municipio }
      carregando: false,

      login: async (email, senha, hcaptchaToken, lembrar = false) => {
        set({ carregando: true })
        try {
          const { data } = await portalApi.post('/auth/login', {
            email,
            senha,
            ...(hcaptchaToken && { hcaptchaToken }),
            ...(lembrar && { lembrar: true }),
          })
          set({ token: data.token, solicitante: data.solicitante })
          return data
        } finally {
          set({ carregando: false })
        }
      },

      logout: () => {
        set({ token: null, solicitante: null })
      },

      isAutenticado: () => !!get().token,
    }),
    {
      name: 'krakion-portal-auth',
      partialize: (state) => ({ token: state.token, solicitante: state.solicitante }),
    }
  )
)

export default usePortalAuthStore
