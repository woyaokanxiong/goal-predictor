import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types'
import api from '../utils/api'

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await api.post('/auth/login', { username, password })
          const { user, token } = response.data.data
          
          set({ user, token, isAuthenticated: true })
          localStorage.setItem('token', token)
        } catch (error: any) {
          throw new Error(error.response?.data?.message || '登录失败')
        }
      },

      register: async (username: string, email: string, password: string) => {
        try {
          const response = await api.post('/auth/register', { username, email, password })
          const { user, token } = response.data.data
          
          set({ user, token, isAuthenticated: true })
          localStorage.setItem('token', token)
        } catch (error: any) {
          throw new Error(error.response?.data?.message || '注册失败')
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        localStorage.removeItem('token')
      },

      checkAuth: () => {
        const token = localStorage.getItem('token')
        const user = get().user
        
        if (token && user) {
          set({ 
            token, 
            isAuthenticated: true 
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)