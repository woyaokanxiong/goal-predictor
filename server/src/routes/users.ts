import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { promises as fs } from 'fs'
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth'
import { User } from '../types'

const router = Router()

const DATA_DIR = './data'
const USERS_FILE = `${DATA_DIR}/users.json`

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create data directory:', error)
  }
}

async function loadUsers(): Promise<Map<string, User>> {
  const usersMap = new Map<string, User>()
  try {
    await ensureDataDir()
    const data = await fs.readFile(USERS_FILE, 'utf-8')
    const usersArray: User[] = JSON.parse(data)
    usersArray.forEach(user => {
      usersMap.set(user.id, user)
    })
  } catch (error) {
    console.log('No existing users file found, starting fresh')
  }
  return usersMap
}

async function saveUsers(users: Map<string, User>): Promise<void> {
  try {
    await ensureDataDir()
    const usersArray = Array.from(users.values())
    await fs.writeFile(USERS_FILE, JSON.stringify(usersArray, null, 2))
  } catch (error) {
    console.error('Failed to save users:', error)
    throw error
  }
}

let users: Map<string, User> = new Map()

loadUsers().then(loadedUsers => {
  users = loadedUsers
}).catch(error => {
  console.error('Failed to load users on startup:', error)
})

router.use(authMiddleware)

router.get('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userList = Array.from(users.values()).map(user => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })
    
    res.json({
      success: true,
      data: userList
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    })
  }
})

router.get('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const user = users.get(id)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    const { password, ...userWithoutPassword } = user
    
    res.json({
      success: true,
      data: userWithoutPassword
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    })
  }
})

router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名、邮箱和密码'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      })
    }

    if (role !== 'admin' && role !== 'user') {
      return res.status(400).json({
        success: false,
        message: '角色必须是admin或user'
      })
    }

    for (const user of users.values()) {
      if (user.username === username || user.email === email) {
        return res.status(409).json({
          success: false,
          message: '用户名或邮箱已存在'
        })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = uuidv4()
    const now = new Date().toISOString()

    const newUser: User = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: now,
      updatedAt: now
    }

    users.set(userId, newUser)
    await saveUsers(users)

    const { password: _, ...userWithoutPassword } = newUser

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: userWithoutPassword
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({
      success: false,
      message: '创建用户失败'
    })
  }
})

router.put('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { username, email, password, role } = req.body

    const user = users.get(id)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    if (username && username !== user.username) {
      for (const u of users.values()) {
        if (u.username === username && u.id !== id) {
          return res.status(409).json({
            success: false,
            message: '用户名已存在'
          })
        }
      }
    }

    if (email && email !== user.email) {
      for (const u of users.values()) {
        if (u.email === email && u.id !== id) {
          return res.status(409).json({
            success: false,
            message: '邮箱已存在'
          })
        }
      }
    }

    if (role && role !== 'admin' && role !== 'user') {
      return res.status(400).json({
        success: false,
        message: '角色必须是admin或user'
      })
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : user.password

    const updatedUser: User = {
      ...user,
      username: username || user.username,
      email: email || user.email,
      password: hashedPassword,
      role: role || user.role,
      updatedAt: new Date().toISOString()
    }

    users.set(id, updatedUser)
    await saveUsers(users)

    const { password: _, ...userWithoutPassword } = updatedUser

    res.json({
      success: true,
      message: '用户更新成功',
      data: userWithoutPassword
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      success: false,
      message: '更新用户失败'
    })
  }
})

router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    
    if (!users.has(id)) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    const user = users.get(id)!
    
    if (user.role === 'admin') {
      let adminCount = 0
      for (const u of users.values()) {
        if (u.role === 'admin') {
          adminCount++
        }
      }
      
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: '不能删除最后一个管理员账号'
        })
      }
    }

    if (id === req.user!.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除当前登录账号'
      })
    }

    users.delete(id)
    await saveUsers(users)

    res.json({
      success: true,
      message: '用户删除成功'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    })
  }
})

export default router