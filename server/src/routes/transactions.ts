import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Transaction, Account } from '../types';
import { accountsByUser, initDefaultAccounts } from './accounts';

const router = Router();

router.use(authMiddleware);

// 模拟交易数据
export const transactionsByUser: Map<string, Transaction[]> = new Map();

router.get('/', (req: AuthRequest, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      accountId, 
      categoryId, 
      type, 
      page = 1, 
      limit = 20 
    } = req.query;

    // 确保用户有交易记录数据
    if (!transactionsByUser.has(req.user!.id)) {
      transactionsByUser.set(req.user!.id, []);
    }

    let transactions = transactionsByUser.get(req.user!.id) || [];

    // 应用过滤条件
    if (startDate) {
      transactions = transactions.filter(t => t.date >= String(startDate));
    }
    if (endDate) {
      transactions = transactions.filter(t => t.date <= String(endDate));
    }
    if (accountId) {
      transactions = transactions.filter(t => t.accountId === accountId);
    }
    if (categoryId) {
      transactions = transactions.filter(t => t.categoryId === categoryId);
    }
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    // 按日期和创建时间排序
    transactions.sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 分页
    const total = transactions.length;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    const paginatedTransactions = transactions.slice(offset, offset + limitNum);

    res.json({
      success: true,
      data: {
        list: paginatedTransactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: '获取交易记录失败'
    });
  }
});

router.post('/', (req: AuthRequest, res) => {
  try {
    const { 
      accountId, 
      categoryId, 
      type, 
      amount, 
      currency = 'CNY', 
      description, 
      date, 
      tags, 
      location 
    } = req.body;

    if (!accountId || !categoryId || !type || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的交易信息'
      });
    }

    // 确保用户有账户数据
    if (!accountsByUser.has(req.user!.id)) {
      initDefaultAccounts(req.user!.id);
    }

    const account = accountsByUser.get(req.user!.id)?.find(acc => acc.id === accountId);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: '账户不存在'
      });
    }

    const transactionId = uuidv4();
    const now = new Date().toISOString();

    const newTransaction: Transaction = {
      id: transactionId,
      userId: req.user!.id,
      accountId,
      categoryId,
      type,
      amount,
      currency,
      description: description || undefined,
      date,
      tags: tags || undefined,
      location: location || undefined,
      createdAt: now,
      updatedAt: now
    };

    // 保存交易记录
    if (!transactionsByUser.has(req.user!.id)) {
      transactionsByUser.set(req.user!.id, []);
    }
    const userTransactions = transactionsByUser.get(req.user!.id) || [];
    userTransactions.push(newTransaction);
    transactionsByUser.set(req.user!.id, userTransactions);

    // 更新账户余额
    const userAccounts = accountsByUser.get(req.user!.id) || [];
    const accountIndex = userAccounts.findIndex(acc => acc.id === accountId);
    if (accountIndex !== -1) {
      if (type === 'income') {
        userAccounts[accountIndex].balance += amount;
      } else if (type === 'expense') {
        userAccounts[accountIndex].balance -= amount;
      }
      userAccounts[accountIndex].updatedAt = now;
      accountsByUser.set(req.user!.id, userAccounts);
    }

    // 添加账户和分类信息
    const transactionWithDetails = {
      ...newTransaction,
      accountName: account.name,
      categoryName: '分类名称', // 这里需要从分类数据中获取
      categoryColor: '#1890ff', // 这里需要从分类数据中获取
      categoryIcon: 'tag' // 这里需要从分类数据中获取
    };

    res.status(201).json({
      success: true,
      message: '交易记录创建成功',
      data: transactionWithDetails
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: '创建交易记录失败'
    });
  }
});

router.put('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { accountId, categoryId, type, amount, description, date, tags, location } = req.body;

    // 确保用户有交易记录数据
    if (!transactionsByUser.has(req.user!.id)) {
      transactionsByUser.set(req.user!.id, []);
    }

    const userTransactions = transactionsByUser.get(req.user!.id) || [];
    const transactionIndex = userTransactions.findIndex(t => t.id === id);
    
    if (transactionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '交易记录不存在'
      });
    }

    const transaction = userTransactions[transactionIndex];
    const now = new Date().toISOString();

    // 恢复原账户余额
    if (!accountsByUser.has(req.user!.id)) {
      initDefaultAccounts(req.user!.id);
    }
    const userAccounts = accountsByUser.get(req.user!.id) || [];
    const originalAccountIndex = userAccounts.findIndex(acc => acc.id === transaction.accountId);
    if (originalAccountIndex !== -1) {
      if (transaction.type === 'income') {
        userAccounts[originalAccountIndex].balance -= transaction.amount;
      } else if (transaction.type === 'expense') {
        userAccounts[originalAccountIndex].balance += transaction.amount;
      }
      userAccounts[originalAccountIndex].updatedAt = now;
    }

    // 更新交易记录
    const updatedTransaction: Transaction = {
      ...transaction,
      accountId: accountId || transaction.accountId,
      categoryId: categoryId || transaction.categoryId,
      type: type || transaction.type,
      amount: amount || transaction.amount,
      description: description !== undefined ? description : transaction.description,
      date: date || transaction.date,
      tags: tags !== undefined ? tags : transaction.tags,
      location: location !== undefined ? location : transaction.location,
      updatedAt: now
    };

    userTransactions[transactionIndex] = updatedTransaction;
    transactionsByUser.set(req.user!.id, userTransactions);

    // 更新新账户余额
    const newAccountId = accountId || transaction.accountId;
    const newAccountIndex = userAccounts.findIndex(acc => acc.id === newAccountId);
    if (newAccountIndex !== -1) {
      const newType = type || transaction.type;
      const newAmount = amount || transaction.amount;
      if (newType === 'income') {
        userAccounts[newAccountIndex].balance += newAmount;
      } else if (newType === 'expense') {
        userAccounts[newAccountIndex].balance -= newAmount;
      }
      userAccounts[newAccountIndex].updatedAt = now;
      accountsByUser.set(req.user!.id, userAccounts);
    }

    // 添加账户和分类信息
    const account = userAccounts.find(acc => acc.id === updatedTransaction.accountId);
    const transactionWithDetails = {
      ...updatedTransaction,
      accountName: account?.name || '未知账户',
      categoryName: '分类名称', // 这里需要从分类数据中获取
      categoryColor: '#1890ff', // 这里需要从分类数据中获取
      categoryIcon: 'tag' // 这里需要从分类数据中获取
    };

    res.json({
      success: true,
      message: '交易记录更新成功',
      data: transactionWithDetails
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: '更新交易记录失败'
    });
  }
});

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 确保用户有交易记录数据
    if (!transactionsByUser.has(req.user!.id)) {
      transactionsByUser.set(req.user!.id, []);
    }

    const userTransactions = transactionsByUser.get(req.user!.id) || [];
    const transactionIndex = userTransactions.findIndex(t => t.id === id);
    
    if (transactionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '交易记录不存在'
      });
    }

    const transaction = userTransactions[transactionIndex];
    const now = new Date().toISOString();

    // 恢复账户余额
    if (!accountsByUser.has(req.user!.id)) {
      initDefaultAccounts(req.user!.id);
    }
    const userAccounts = accountsByUser.get(req.user!.id) || [];
    const accountIndex = userAccounts.findIndex(acc => acc.id === transaction.accountId);
    if (accountIndex !== -1) {
      if (transaction.type === 'income') {
        userAccounts[accountIndex].balance -= transaction.amount;
      } else if (transaction.type === 'expense') {
        userAccounts[accountIndex].balance += transaction.amount;
      }
      userAccounts[accountIndex].updatedAt = now;
      accountsByUser.set(req.user!.id, userAccounts);
    }

    // 删除交易记录
    userTransactions.splice(transactionIndex, 1);
    transactionsByUser.set(req.user!.id, userTransactions);

    res.json({
      success: true,
      message: '交易记录删除成功'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: '删除交易记录失败'
    });
  }
});

export default router;