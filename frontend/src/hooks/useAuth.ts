import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserRole } from '../types'
import { authAPI } from '../services/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.login({ email, password })
          localStorage.setItem('token', response.token)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data: any) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.register(data)
          localStorage.setItem('token', response.token)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('auth-storage')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          const updatedUser = await authAPI.updateProfile(data)
          set(state => ({
            user: { ...state.user, ...updatedUser }
          }))
        } catch (error) {
          throw error
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token')
        if (!token) {
          set({ isAuthenticated: false, isLoading: false })
          return
        }

        set({ isLoading: true })
        try {
          const user = await authAPI.getProfile()
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          localStorage.removeItem('token')
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
