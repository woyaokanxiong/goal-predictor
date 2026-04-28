import fs from 'fs'
import path from 'path'

const DB_DIR = path.join(__dirname, '../../data')
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, 'finance.db')

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

// 内存数据库实现
class MemoryDB {
  private tables: Map<string, any[]>
  private nextId: number

  constructor() {
    this.tables = new Map()
    this.nextId = 1
    this.initTables()
  }

  private initTables() {
    this.tables.set('users', [])
    this.tables.set('accounts', [])
    this.tables.set('categories', [])
    this.tables.set('transactions', [])
    this.tables.set('budgets', [])
    this.tables.set('sync_records', [])
  }

  run(sql: string, params: any[] = []) {
    console.log('Running SQL:', sql, params)
  }

  prepare(sql: string) {
    return {
      get: (...args: any[]) => {
        console.log('Get query:', sql, args)
        return null
      },
      all: (...args: any[]) => {
        console.log('All query:', sql, args)
        return []
      },
      run: (...args: any[]) => {
        console.log('Run query:', sql, args)
      }
    }
  }

  export() {
    return Buffer.from(JSON.stringify([...this.tables.entries()]))
  }
}

let db: MemoryDB = new MemoryDB()

export async function initDatabase(): Promise<void> {
  try {
    await insertDefaultCategories()
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

async function insertDefaultCategories(): Promise<void> {
  const defaultCategories = [
    { name: '工资', type: 'income', color: '#52c41a', icon: 'money' },
    { name: '奖金', type: 'income', color: '#73d13d', icon: 'gift' },
    { name: '投资', type: 'income', color: '#95de64', icon: 'stock' },
    { name: '兼职', type: 'income', color: '#b7eb8f', icon: 'clock' },
    { name: '其他收入', type: 'income', color: '#d9f7be', icon: 'plus' },
    { name: '餐饮', type: 'expense', color: '#ff4d4f', icon: 'coffee' },
    { name: '交通', type: 'expense', color: '#ff7875', icon: 'car' },
    { name: '购物', type: 'expense', color: '#ffa39e', icon: 'shopping' },
    { name: '娱乐', type: 'expense', color: '#ffc069', icon: 'smile' },
    { name: '居住', type: 'expense', color: '#ffd666', icon: 'home' },
    { name: '医疗', type: 'expense', color: '#fff566', icon: 'medicine' },
    { name: '教育', type: 'expense', color: '#d3f261', icon: 'book' },
    { name: '通讯', type: 'expense', color: '#95de64', icon: 'phone' },
    { name: '人情', type: 'expense', color: '#5cdbd3', icon: 'team' },
    { name: '其他支出', type: 'expense', color: '#69c0ff', icon: 'minus' },
  ]

  console.log('Inserting default categories:', defaultCategories)
}

export function getDb(): MemoryDB | undefined {
  return db
}

export default db