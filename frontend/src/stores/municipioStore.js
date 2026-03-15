import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { municipiosApi } from '../lib/api'

const useMunicipioStore = create(
  persist(
    (set, get) => ({
      municipioAtivo: null,
      municipios: [],
      carregando: false,

      setMunicipioAtivo: (municipio) => set({ municipioAtivo: municipio }),

      carregarMunicipios: async () => {
        set({ carregando: true })
        try {
          const lista = await municipiosApi.listar()
          set({ municipios: lista })
          // Sincroniza o município ativo com o que está no banco
          const ativo = lista.find((m) => m.ativo)
          if (ativo) {
            // Busca com token
            const comToken = await municipiosApi.ativo()
            set({ municipioAtivo: comToken })
          } else {
            set({ municipioAtivo: null })
          }
        } catch (err) {
          console.error('Erro ao carregar municípios:', err)
        } finally {
          set({ carregando: false })
        }
      },

      ativarMunicipio: async (id) => {
        try {
          await municipiosApi.ativar(id)
          await get().carregarMunicipios()
        } catch (err) {
          throw err
        }
      },

      atualizarMunicipioAtivo: async () => {
        try {
          const ativo = await municipiosApi.ativo()
          set({ municipioAtivo: ativo })
        } catch {
          set({ municipioAtivo: null })
        }
      },
    }),
    {
      name: 'sysgate-municipio',
      partialize: (state) => ({ municipioAtivo: state.municipioAtivo }),
    }
  )
)

export default useMunicipioStore
