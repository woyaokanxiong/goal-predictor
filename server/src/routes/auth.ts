import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { promises as fs } from 'fs'
import { generateToken } from '../middleware/auth'
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
    console.log(`Loaded ${usersMap.size} users from file`)
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

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

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
      role: 'user',
      createdAt: now,
      updatedAt: now
    }

    users.set(userId, newUser)
    await saveUsers(users)

    const token = generateToken(newUser)
    const { password: _, ...userWithoutPassword } = newUser

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: userWithoutPassword,
        token
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名和密码'
      })
    }

    let user: User | undefined
    for (const u of users.values()) {
      if (u.username === username || u.email === username) {
        user = u
        break
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    const token = generateToken(user)
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    })
  }
})

export default router