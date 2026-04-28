import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { initDatabase } from './database'
import { promises as fs } from 'fs'
import { User } from './types'

import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import accountRoutes from './routes/accounts'
import categoryRoutes from './routes/categories'
import statisticsRoutes from './routes/statistics'
import transactionRoutes from './routes/transactions'
import budgetRoutes from './routes/budgets'
import goalRoutes from './routes/goals'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/statistics', statisticsRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/goals', goalRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误'
  })
})

async function initAdminUser() {
  const DATA_DIR = './data'
  const USERS_FILE = `${DATA_DIR}/users.json`
  
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    
    let users: Map<string, User> = new Map()
    
    try {
      const data = await fs.readFile(USERS_FILE, 'utf-8')
      const usersArray: User[] = JSON.parse(data)
      usersArray.forEach(user => {
        users.set(user.id, user)
      })
    } catch (error) {
      console.log('No existing users file found, starting fresh')
    }
    
    let adminExists = false
    for (const user of users.values()) {
      if (user.username === 'shuaibi') {
        adminExists = true
        break
      }
    }
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('123456', 10)
      const now = new Date().toISOString()
      
      const adminUser: User = {
        id: uuidv4(),
        username: 'shuaibi',
        email: 'shuaibi@example.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: now,
        updatedAt: now
      }
      
      users.set(adminUser.id, adminUser)
      
      const usersArray = Array.from(users.values())
      await fs.writeFile(USERS_FILE, JSON.stringify(usersArray, null, 2))
      
      console.log('Admin user "shuaibi" created successfully')
    } else {
      console.log('Admin user "shuaibi" already exists')
    }
  } catch (error) {
    console.error('Failed to initialize admin user:', error)
  }
}

async function startServer() {
  try {
    await initDatabase()
    await initAdminUser()
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
      console.log(`API available at http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()