import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { initDatabase } from './database'

import authRoutes from './routes/auth'
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

async function startServer() {
  try {
    await initDatabase()
    
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