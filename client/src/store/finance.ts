import { create } from 'zustand'
import { DashboardData, Account, Transaction } from '../types'
import api from '../utils/api'

interface FinanceState {
  dashboardData: DashboardData | null
  accounts: Account[]
  transactions: Transaction[]
  loading: boolean
  
  // 操作方法
  fetchDashboardData: () => Promise<void>
  fetchAccounts: () => Promise<void>
  fetchTransactions: (params?: any) => Promise<void>
  refreshData: () => Promise<void>
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  dashboardData: null,
  accounts: [],
  transactions: [],
  loading: false,

  fetchDashboardData: async () => {
    try {
      const response = await api.get('/statistics/dashboard')
      set({ dashboardData: response.data.data })
    } catch (error) {
      console.error('Fetch dashboard error:', error)
    }
  },

  fetchAccounts: async () => {
    try {
      const response = await api.get('/accounts')
      set({ accounts: response.data.data })
    } catch (error) {
      console.error('Fetch accounts error:', error)
    }
  },

  fetchTransactions: async (params = {}) => {
    try {
      const response = await api.get('/transactions', { params })
      set({ transactions: response.data.data.list })
    } catch (error) {
      console.error('Fetch transactions error:', error)
    }
  },

  refreshData: async () => {
    set({ loading: true })
    try {
      await Promise.all([
        get().fetchDashboardData(),
        get().fetchAccounts(),
        get().fetchTransactions()
      ])
    } finally {
      set({ loading: false })
    }
  }
}))