import { Router } from 'express';
import { format } from 'date-fns';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { TransactionSummary, CategorySummary, TimeSeriesData, Transaction, Account, Goal } from '../types';
import { accountsByUser, initDefaultAccounts } from './accounts';
import { goalsByUser } from './goals';
import { transactionsByUser } from './transactions';

const router = Router();

router.use(authMiddleware);

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

router.get('/summary', (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, accountId } = req.query;

    const now = new Date();
    const defaultStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const defaultEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    const start = (startDate as string) || defaultStart;
    const end = (endDate as string) || defaultEnd;

    // 确保用户有交易记录数据
    if (!transactionsByUser.has(req.user!.id)) {
      transactionsByUser.set(req.user!.id, []);
    }

    let transactions = transactionsByUser.get(req.user!.id) || [];

    // 应用过滤条件
    if (startDate) {
      transactions = transactions.filter(t => t.date >= start);
    }
    if (endDate) {
      transactions = transactions.filter(t => t.date <= end);
    }
    if (accountId) {
      transactions = transactions.filter(t => t.accountId === accountId);
    }

    // 计算统计
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const result: TransactionSummary = {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length
    };

    res.json({
      success: true,
      data: {
        ...result,
        period: { start, end }
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      message: '获取统计摘要失败'
    });
  }
});

router.get('/by-category', (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, type = 'expense' } = req.query;

    const now = new Date();
    const defaultStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const defaultEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    const start = (startDate as string) || defaultStart;
    const end = (endDate as string) || defaultEnd;

    // 确保用户有交易记录数据
    if (!transactionsByUser.has(req.user!.id)) {
      transactionsByUser.set(req.user!.id, []);
    }

    let transactions = transactionsByUser.get(req.user!.id) || [];

    // 应用过滤条件
    if (startDate) {
      transactions = transactions.filter(t => t.date >= start);
    }
    if (endDate) {
      transactions = transactions.filter(t => t.date <= end);
    }
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    // 按分类汇总
    const categoryMap = new Map<string, { amount: number; count: number }>();
    transactions.forEach(t => {
      const existing = categoryMap.get(t.categoryId) || { amount: 0, count: 0 };
      categoryMap.set(t.categoryId, {
        amount: existing.amount + t.amount,
        count: existing.count + 1
      });
    });

    const categoriesWithPercentage: CategorySummary[] = [];
    let totalAmount = 0;

    categoryMap.forEach((value, categoryId) => {
      totalAmount += value.amount;
      categoriesWithPercentage.push({
        categoryId,
        categoryName: '分类',
        categoryColor: '#1890ff',
        categoryIcon: 'tag',
        amount: value.amount,
        percentage: 0,
        count: value.count
      });
    });

    // 计算百分比
    categoriesWithPercentage.forEach(cat => {
      cat.percentage = totalAmount > 0 ? Math.round((cat.amount / totalAmount) * 100) : 0;
    });

    // 按金额排序
    categoriesWithPercentage.sort((a, b) => b.amount - a.amount);

    res.json({
      success: true,
      data: {
        list: categoriesWithPercentage,
        total: totalAmount,
        period: { start, end }
      }
    });
  } catch (error) {
    console.error('Get category statistics error:', error);
    res.status(500).json({
      success: false,
      message: '获取分类统计失败'
    });
  }
});

router.get('/trend', (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const now = new Date();
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      start = startOfMonth(now);
      end = endOfMonth(now);
    }

    // 确保用户有交易记录数据
    if (!transactionsByUser.has(req.user!.id)) {
      transactionsByUser.set(req.user!.id, []);
    }

    let transactions = transactionsByUser.get(req.user!.id) || [];

    // 应用过滤条件
    transactions = transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate >= start && transDate <= end;
    });

    // 按日期分组
    const dateMap = new Map<string, { income: number; expense: number }>();
    transactions.forEach(t => {
      const dateStr = t.date;
      const existing = dateMap.get(dateStr) || { income: 0, expense: 0 };
      if (t.type === 'income') {
        existing.income += t.amount;
      } else if (t.type === 'expense') {
        existing.expense += t.amount;
      }
      dateMap.set(dateStr, existing);
    });

    // 生成趋势数据
    const trendData: TimeSeriesData[] = [];
    let runningBalance = 0;

    dateMap.forEach((value, date) => {
      runningBalance += value.income - value.expense;
      trendData.push({
        date,
        income: value.income,
        expense: value.expense,
        balance: runningBalance
      });
    });

    // 按日期排序
    trendData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      success: true,
      data: {
        list: trendData,
        period: {
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd')
        }
      }
    });
  } catch (error) {
    console.error('Get trend error:', error);
    res.status(500).json({
      success: false,
      message: '获取趋势数据失败'
    });
  }
});

router.get('/dashboard', (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const currentMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const currentMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    // 确保用户有交易记录和账户数据
    if (!transactionsByUser.has(req.user!.id)) {
      transactionsByUser.set(req.user!.id, []);
    }
    if (!accountsByUser.has(req.user!.id)) {
      initDefaultAccounts(req.user!.id);
    }

    const transactions = transactionsByUser.get(req.user!.id) || [];
    const accounts = accountsByUser.get(req.user!.id) || [];

    // 过滤当月交易
    const monthTransactions = transactions.filter(t =>
      t.date >= currentMonthStart && t.date <= currentMonthEnd
    );

    // 计算摘要
    const totalIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const summary: TransactionSummary = {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: monthTransactions.length
    };

    // 计算总资产
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // 最近交易（按日期排序，取前5条）
    const recentTransactions = [...transactions]
      .sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5)
      .map(t => {
        const account = accounts.find(acc => acc.id === t.accountId);
        return {
          ...t,
          accountName: account?.name || '未知账户',
          categoryName: '分类',
          categoryColor: '#1890ff',
          categoryIcon: 'tag'
        };
      });

    // 支出分类TOP5
    const expenseByCategory = new Map<string, number>();
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const existing = expenseByCategory.get(t.categoryId) || 0;
        expenseByCategory.set(t.categoryId, existing + t.amount);
      });

    const topExpenseCategories: any[] = [];
    expenseByCategory.forEach((amount, categoryId) => {
      topExpenseCategories.push({
        id: categoryId,
        name: '分类',
        color: '#1890ff',
        icon: 'tag',
        amount
      });
    });

    topExpenseCategories
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // 计算预收入指标
    let predictedIncome = 0;
    let predictedIncomeBasis = '暂无数据';
    
    // 计算当月已过天数和剩余天数
    const today = new Date();
    const daysInMonth = endOfMonth(today).getDate();
    const dayOfMonth = today.getDate();
    
    if (totalIncome > 0 && dayOfMonth > 0) {
      // 基于当月收入趋势预测
      const dailyAverageIncome = totalIncome / dayOfMonth;
      const remainingDays = daysInMonth - dayOfMonth;
      predictedIncome = totalIncome + (dailyAverageIncome * remainingDays);
      predictedIncomeBasis = `基于当月日均收入 ¥${dailyAverageIncome.toFixed(2)} 预测`;
    } else {
      // 基于历史数据或默认值
      predictedIncome = 0;
      predictedIncomeBasis = '暂无足够数据进行预测';
    }

    // 计算预支出指标（关联目标卡片）
    let predictedExpense = 0;
    let predictedExpenseBasis = '暂无目标';
    
    if (goalsByUser.has(req.user!.id)) {
      const userGoals = goalsByUser.get(req.user!.id) || [];
      
      if (userGoals.length > 0) {
        // 计算所有目标的总金额（根据需求：预支出金额应等于所有目标内容金额的总和）
        predictedExpense = userGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
        predictedExpenseBasis = `基于 ${userGoals.length} 个目标`;
      }
    }

    res.json({
      success: true,
      data: {
        summary,
        accounts: {
          list: accounts,
          totalBalance
        },
        recentTransactions,
        topExpenseCategories,
        predictions: {
          predictedIncome,
          predictedIncomeBasis,
          predictedExpense,
          predictedExpenseBasis
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: '获取仪表盘数据失败'
    });
  }
});

export default router;