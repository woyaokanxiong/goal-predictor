import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { Account } from '../types'

const router = Router()

router.use(authMiddleware)

// 模拟账户数据
export const accountsByUser: Map<string, Account[]> = new Map()

// 初始化默认账户
export function initDefaultAccounts(userId: string) {
  const defaultAccounts: Account[] = [
    {
      id: '1',
      userId: userId,
      name: '现金钱包',
      type: 'cash',
      balance: 1000.00,
      currency: 'CNY',
      color: '#1890ff',
      icon: 'wallet',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      userId: userId,
      name: '工资卡',
      type: 'bank',
      balance: 5000.00,
      currency: 'CNY',
      color: '#52c41a',
      icon: 'bank',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      userId: userId,
      name: '信用卡',
      type: 'credit',
      balance: -2000.00,
      currency: 'CNY',
      color: '#ff4d4f',
      icon: 'credit-card',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
  accountsByUser.set(userId, defaultAccounts)
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!accountsByUser.has(req.user!.id)) {
      initDefaultAccounts(req.user!.id)
    }
    
    const accounts = accountsByUser.get(req.user!.id) || []

    res.json({
      success: true,
      data: accounts
    })
  } catch (error) {
    console.error('Get accounts error:', error)
    res.status(500).json({
      success: false,
      message: '获取账户列表失败'
    })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, type, balance = 0, currency = 'CNY', color = '#1890ff', icon = 'wallet' } = req.body

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: '请提供账户名称和类型'
      })
    }

    if (!accountsByUser.has(req.user!.id)) {
      initDefaultAccounts(req.user!.id)
    }

    const accounts = accountsByUser.get(req.user!.id) || []
    
    const newAccount: Account = {
      id: uuidv4(),
      userId: req.user!.id,
      name,
      type,
      balance,
      currency,
      color,
      icon,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    accounts.push(newAccount)
    accountsByUser.set(req.user!.id, accounts)

    res.status(201).json({
      success: true,
      message: '账户创建成功',
      data: newAccount
    })
  } catch (error) {
    console.error('Create account error:', error)
    res.status(500).json({
      success: false,
      message: '创建账户失败'
    })
  }
})

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { name, type, balance, currency, color, icon } = req.body

    if (!accountsByUser.has(req.user!.id)) {
      initDefaultAccounts(req.user!.id)
    }

    const accounts = accountsByUser.get(req.user!.id) || []
    const accountIndex = accounts.findIndex(acc => acc.id === id)
    
    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '账户不存在'
      })
    }

    const updatedAccount: Account = {
      ...accounts[accountIndex],
      name: name || accounts[accountIndex].name,
      type: type || accounts[accountIndex].type,
      balance: balance !== undefined ? balance : accounts[accountIndex].balance,
      currency: currency || accounts[accountIndex].currency,
      color: color || accounts[accountIndex].color,
      icon: icon || accounts[accountIndex].icon,
      updatedAt: new Date().toISOString()
    }

    accounts[accountIndex] = updatedAccount
    accountsByUser.set(req.user!.id, accounts)

    res.json({
      success: true,
      message: '账户更新成功',
      data: updatedAccount
    })
  } catch (error) {
    console.error('Update account error:', error)
    res.status(500).json({
      success: false,
      message: '更新账户失败'
    })
  }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    if (!accountsByUser.has(req.user!.id)) {
      initDefaultAccounts(req.user!.id)
    }

    const accounts = accountsByUser.get(req.user!.id) || []
    const accountIndex = accounts.findIndex(acc => acc.id === id)
    
    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '账户不存在'
      })
    }

    accounts.splice(accountIndex, 1)
    accountsByUser.set(req.user!.id, accounts)

    res.json({
      success: true,
      message: '账户删除成功'
    })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({
      success: false,
      message: '删除账户失败'
    })
  }
})

export default router