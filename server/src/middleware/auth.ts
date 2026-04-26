import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

export interface AuthRequest extends Request {
  user?: User
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET)
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: '未提供认证令牌' })
      return
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    // 模拟用户查询，返回解码后的用户信息
    const user: User = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      password: 'hashed_password',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    if (!user) {
      res.status(401).json({ success: false, message: '用户不存在' })
      return
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ success: false, message: '无效的认证令牌' })
  }
}

export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      
      const user: User = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        password: 'hashed_password',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      if (user) {
        req.user = user
      }
    }
    
    next()
  } catch (error) {
    next()
  }
}