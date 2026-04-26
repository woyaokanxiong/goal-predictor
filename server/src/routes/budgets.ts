import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, format } from 'date-fns';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Budget, BudgetProgress } from '../types';

const router = Router();

router.use(authMiddleware);

// 模拟预算数据
const budgetsByUser: Map<string, Budget[]> = new Map();

// 模拟交易数据
const transactionsByUser: Map<string, any[]> = new Map();

function getPeriodDates(period: string, date: Date = new Date()): { start: string; end: string } {
  switch (period) {
    case 'daily':
      return {
        start: format(date, 'yyyy-MM-dd'),
        end: format(date, 'yyyy-MM-dd')
      };
    case 'weekly':
      return {
        start: format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end: format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      };
    case 'monthly':
      return {
        start: format(startOfMonth(date), 'yyyy-MM-dd'),
        end: format(endOfMonth(date), 'yyyy-MM-dd')
      };
    case 'yearly':
      return {
        start: format(startOfYear(date), 'yyyy-MM-dd'),
        end: format(endOfYear(date), 'yyyy-MM-dd')
      };
    default:
      return {
        start: format(startOfMonth(date), 'yyyy-MM-dd'),
        end: format(endOfMonth(date), 'yyyy-MM-dd')
      };
  }
}

router.get('/', (req: AuthRequest, res) => {
  try {
    // 确保用户有预算数据
    if (!budgetsByUser.has(req.user!.id)) {
      budgetsByUser.set(req.user!.id, []);
    }

    const budgets = budgetsByUser.get(req.user!.id) || [];
    const activeBudgets = budgets.filter(budget => budget.isActive);

    const budgetsWithProgress: BudgetProgress[] = activeBudgets.map(budget => {
      const { start, end } = getPeriodDates(budget.period);
      
      // 计算支出
      let spent = 0;
      const userTransactions = transactionsByUser.get(req.user!.id) || [];
      
      const filteredTransactions = userTransactions.filter(t => 
        t.type === 'expense' && 
        t.date >= start && 
        t.date <= end &&
        (!budget.categoryId || t.categoryId === budget.categoryId)
      );
      
      spent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;

      return {
        budget,
        spent,
        remaining: Math.max(remaining, 0),
        percentage
      };
    });

    res.json({
      success: true,
      data: budgetsWithProgress
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      success: false,
      message: '获取预算列表失败'
    });
  }
});

router.post('/', (req: AuthRequest, res) => {
  try {
    const { categoryId, name, amount, period = 'monthly', startDate, endDate } = req.body;

    if (!name || !amount) {
      return res.status(400).json({
        success: false,
        message: '请提供预算名称和金额'
      });
    }

    const budgetId = uuidv4();
    const now = new Date().toISOString();
    const defaultStartDate = startDate || format(new Date(), 'yyyy-MM-dd');

    const newBudget: Budget = {
      id: budgetId,
      userId: req.user!.id,
      categoryId: categoryId || undefined,
      name,
      amount,
      period,
      startDate: defaultStartDate,
      endDate: endDate || undefined,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    // 保存预算
    if (!budgetsByUser.has(req.user!.id)) {
      budgetsByUser.set(req.user!.id, []);
    }
    const userBudgets = budgetsByUser.get(req.user!.id) || [];
    userBudgets.push(newBudget);
    budgetsByUser.set(req.user!.id, userBudgets);

    // 添加分类信息
    const budgetWithDetails = {
      ...newBudget,
      categoryName: '分类名称',
      categoryColor: '#1890ff',
      categoryIcon: 'tag'
    };

    res.status(201).json({
      success: true,
      message: '预算创建成功',
      data: budgetWithDetails
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({
      success: false,
      message: '创建预算失败'
    });
  }
});

router.put('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, amount, period, startDate, endDate } = req.body;

    // 确保用户有预算数据
    if (!budgetsByUser.has(req.user!.id)) {
      budgetsByUser.set(req.user!.id, []);
    }

    const userBudgets = budgetsByUser.get(req.user!.id) || [];
    const budgetIndex = userBudgets.findIndex(budget => budget.id === id);
    
    if (budgetIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '预算不存在'
      });
    }

    const now = new Date().toISOString();
    
    const updatedBudget: Budget = {
      ...userBudgets[budgetIndex],
      categoryId: categoryId !== undefined ? categoryId : userBudgets[budgetIndex].categoryId,
      name: name || userBudgets[budgetIndex].name,
      amount: amount !== undefined ? amount : userBudgets[budgetIndex].amount,
      period: period || userBudgets[budgetIndex].period,
      startDate: startDate || userBudgets[budgetIndex].startDate,
      endDate: endDate !== undefined ? endDate : userBudgets[budgetIndex].endDate,
      updatedAt: now
    };

    userBudgets[budgetIndex] = updatedBudget;
    budgetsByUser.set(req.user!.id, userBudgets);

    // 添加分类信息
    const budgetWithDetails = {
      ...updatedBudget,
      categoryName: '分类名称',
      categoryColor: '#1890ff',
      categoryIcon: 'tag'
    };

    res.json({
      success: true,
      message: '预算更新成功',
      data: budgetWithDetails
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      success: false,
      message: '更新预算失败'
    });
  }
});

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 确保用户有预算数据
    if (!budgetsByUser.has(req.user!.id)) {
      budgetsByUser.set(req.user!.id, []);
    }

    const userBudgets = budgetsByUser.get(req.user!.id) || [];
    const budgetIndex = userBudgets.findIndex(budget => budget.id === id);
    
    if (budgetIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '预算不存在'
      });
    }

    const now = new Date().toISOString();
    
    // 软删除预算
    userBudgets[budgetIndex].isActive = false;
    userBudgets[budgetIndex].updatedAt = now;
    budgetsByUser.set(req.user!.id, userBudgets);

    res.json({
      success: true,
      message: '预算删除成功'
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      message: '删除预算失败'
    });
  }
});

export default router;