import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      usuario: null, // { id, login, nome, role }
      carregando: false,

      login: async (loginStr, senha, hcaptchaToken, lembrar = false) => {
        set({ carregando: true })
        try {
          const { data } = await api.post('/auth/login', {
            login: loginStr,
            senha,
            ...(hcaptchaToken && { hcaptchaToken }),
            ...(lembrar && { lembrar: true }),
          })
          set({ token: data.token, usuario: data.usuario })
          return data
        } finally {
          set({ carregando: false })
        }
      },

      logout: () => {
        set({ token: null, usuario: null })
      },

      isAdmin: () => get().usuario?.role === 'admin',
      isAutenticado: () => !!get().token,
    }),
    {
      name: 'sysgate-auth',
      partialize: (state) => ({ token: state.token, usuario: state.usuario }),
    }
  )
)

export default useAuthStore
