import { useState } from 'react';
import type { FC } from 'react';
import type { Transaction, SavingGoal, FinancialProfile } from '../types';
import { GoalPredictor } from '../utils/GoalPredictor';
import dayjs from 'dayjs';
import FixedExpenseCard from './FixedExpenseCard';

interface DashboardProps {
  transactions: Transaction[];
  financialProfile: FinancialProfile;
  goals: SavingGoal[];
  onAddExpense?: () => void;
  onViewAll?: () => void;
}

type ViewMode = 'daily' | 'monthly';

const Dashboard: FC<DashboardProps> = ({ transactions, financialProfile, goals, onAddExpense, onViewAll }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [predictedIncome, setPredictedIncome] = useState<number>(financialProfile?.monthlyIncome || 0);
  const [predictedExpense, setPredictedExpense] = useState<number>((financialProfile?.fixedExpenses || 0) + (financialProfile?.averageVariableExpenses || 0));

  // 获取所有交易年份
  const getAvailableYears = () => {
    const years = new Set<number>();
    transactions.forEach(t => {
      years.add(dayjs(t.date).year());
    });
    years.add(dayjs().year());
    return Array.from(years).sort((a, b) => b - a);
  };

  // 按月统计
  const getMonthlyStats = () => {
    const monthlyData: { [key: string]: { income: number; expense: number; count: number } } = {};

    transactions.forEach(t => {
      const monthKey = dayjs(t.date).format('YYYY-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0, count: 0 };
      }
      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
      monthlyData[monthKey].count++;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data,
        balance: data.income - data.expense
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  };

  // 按日统计（当月）
  const getDailyStats = (year: number, month: number) => {
    const dailyData: { [key: string]: { income: number; expense: number; count: number } } = {};

    transactions.forEach(t => {
      const tDate = dayjs(t.date);
      if (tDate.year() === year && tDate.month() === month) {
        const dayKey = tDate.format('YYYY-MM-DD');
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { income: 0, expense: 0, count: 0 };
        }
        if (t.type === 'income') {
          dailyData[dayKey].income += t.amount;
        } else {
          dailyData[dayKey].expense += t.amount;
        }
        dailyData[dayKey].count++;
      }
    });

    return Object.entries(dailyData)
      .map(([day, data]) => ({
        day,
        ...data,
        balance: data.income - data.expense
      }))
      .sort((a, b) => b.day.localeCompare(a.day));
  };

  // 获取某月的分类统计
  const getCategoryStats = (year: number, month: number, type: 'income' | 'expense') => {
    const categoryData: { [key: string]: number } = {};

    transactions.forEach(t => {
      const tDate = dayjs(t.date);
      if (tDate.year() === year && tDate.month() === month && t.type === type) {
        if (!categoryData[t.category]) {
          categoryData[t.category] = 0;
        }
        categoryData[t.category] += t.amount;
      }
    });

    return Object.entries(categoryData)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  // 获取总统计
  const getTotalStats = () => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'income') {
        acc.income += t.amount;
      } else {
        acc.expense += t.amount;
      }
      return acc;
    }, { income: 0, expense: 0, balance: 0 });
  };

  // 获取当月统计
  const getCurrentMonthStats = () => {
    const currentMonth = dayjs().startOf('month');
    return transactions
      .filter(t => dayjs(t.date).isSame(currentMonth, 'month'))
      .reduce((acc, t) => {
        if (t.type === 'income') {
          acc.income += t.amount;
        } else {
          acc.expense += t.amount;
        }
        return acc;
      }, { income: 0, expense: 0, balance: 0 });
  };

  // 计算预测收支
  const getPredictedStats = () => {
    const predictedBalance = predictedIncome - predictedExpense;
    return {
      income: predictedIncome,
      expense: predictedExpense,
      balance: predictedBalance
    };
  };

  // 计算储蓄目标统计
  const getGoalsStats = () => {
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalRemaining = totalTarget - totalCurrent;
    const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    return {
      totalTarget,
      totalCurrent,
      totalRemaining,
      overallProgress,
      goalCount: goals.length
    };
  };

  const totalStats = getTotalStats();
  const currentMonthStats = getCurrentMonthStats();
  const predictedStats = getPredictedStats();
  const monthlyStats = getMonthlyStats();
  const availableYears = getAvailableYears();
  const currentMonth = dayjs().month();
  const dailyStats = getDailyStats(selectedYear, viewMode === 'daily' ? currentMonth : 0);
  const incomeCategories = getCategoryStats(selectedYear, viewMode === 'daily' ? currentMonth : 0, 'income');
  const expenseCategories = getCategoryStats(selectedYear, viewMode === 'daily' ? currentMonth : 0, 'expense');
  const goalsStats = getGoalsStats();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 财务仪表盘</h2>
        <div className="view-mode-switch">
          <button
            className={`mode-btn ${viewMode === 'monthly' ? 'active' : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            按月统计
          </button>
          <button
            className={`mode-btn ${viewMode === 'daily' ? 'active' : ''}`}
            onClick={() => setViewMode('daily')}
          >
            按日统计
          </button>
        </div>
      </div>

      <div className="prediction-inputs">
        <h3>📝 收支预测</h3>
        <div className="prediction-input-grid">
          <div className="input-group">
            <label htmlFor="predictedIncome">预收入</label>
            <input
              type="number"
              id="predictedIncome"
              value={predictedIncome}
              onChange={(e) => setPredictedIncome(parseFloat(e.target.value) || 0)}
              placeholder="预测月收入"
              step="0.01"
              min="0"
            />
          </div>
          <div className="input-group">
            <label htmlFor="predictedExpense">预支出</label>
            <input
              type="number"
              id="predictedExpense"
              value={predictedExpense}
              onChange={(e) => setPredictedExpense(parseFloat(e.target.value) || 0)}
              placeholder="预测月支出"
              step="0.01"
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card total">
          <div className="stat-title">累计总收入</div>
          <div className="stat-value income">+{GoalPredictor.formatCurrency(totalStats.income)}</div>
        </div>
        <div className="stat-card total">
          <div className="stat-title">累计总支出</div>
          <div className="stat-value expense">-{GoalPredictor.formatCurrency(totalStats.expense)}</div>
        </div>
        <div className="stat-card total">
          <div className="stat-title">累计结余</div>
          <div className={`stat-value ${totalStats.income - totalStats.expense >= 0 ? 'income' : 'expense'}`}>
            {GoalPredictor.formatCurrency(totalStats.income - totalStats.expense)}
          </div>
        </div>
        <div className="stat-card month">
          <div className="stat-title">当月收入</div>
          <div className="stat-value income">+{GoalPredictor.formatCurrency(currentMonthStats.income)}</div>
        </div>
        <div className="stat-card month">
          <div className="stat-title">当月支出</div>
          <div className="stat-value expense">-{GoalPredictor.formatCurrency(currentMonthStats.expense)}</div>
        </div>
        <div className="stat-card month">
          <div className="stat-title">当月结余</div>
          <div className={`stat-value ${currentMonthStats.income - currentMonthStats.expense >= 0 ? 'income' : 'expense'}`}>
            {GoalPredictor.formatCurrency(currentMonthStats.income - currentMonthStats.expense)}
          </div>
        </div>
        <div className="stat-card fixed">
          <div className="stat-title">固定支出</div>
          <div className="stat-value expense">-{GoalPredictor.formatCurrency(financialProfile?.fixedExpenses || 0)}</div>
        </div>
        <div className="stat-card fixed">
          <div className="stat-title">可变支出</div>
          <div className="stat-value expense">-{GoalPredictor.formatCurrency(financialProfile?.averageVariableExpenses || 0)}</div>
        </div>
        <div className="stat-card predicted">
          <div className="stat-title">预测收入</div>
          <div className="stat-value income">+{GoalPredictor.formatCurrency(predictedStats.income)}</div>
        </div>
        <div className="stat-card predicted">
          <div className="stat-title">预测支出</div>
          <div className="stat-value expense">-{GoalPredictor.formatCurrency(predictedStats.expense)}</div>
        </div>
        <div className="stat-card predicted">
          <div className="stat-title">预测结余</div>
          <div className={`stat-value ${predictedStats.balance >= 0 ? 'income' : 'expense'}`}>
            {GoalPredictor.formatCurrency(predictedStats.balance)}
          </div>
        </div>
      </div>

      <FixedExpenseCard 
        financialProfile={financialProfile}
        onAddExpense={onAddExpense}
        onViewAll={onViewAll}
      />

      <div className="goals-section">
        <h3>🎯 储蓄目标</h3>
        <div className="goals-overview">
          <div className="goals-summary">
            <div className="goal-stat-item">
              <span className="goal-stat-label">目标总数</span>
              <span className="goal-stat-value">{goalsStats.goalCount}</span>
            </div>
            <div className="goal-stat-item">
              <span className="goal-stat-label">目标总金额</span>
              <span className="goal-stat-value">¥{GoalPredictor.formatCurrency(goalsStats.totalTarget)}</span>
            </div>
            <div className="goal-stat-item">
              <span className="goal-stat-label">已储蓄金额</span>
              <span className="goal-stat-value">¥{GoalPredictor.formatCurrency(goalsStats.totalCurrent)}</span>
            </div>
            <div className="goal-stat-item">
              <span className="goal-stat-label">剩余金额</span>
              <span className="goal-stat-value">¥{GoalPredictor.formatCurrency(goalsStats.totalRemaining)}</span>
            </div>
            <div className="goal-stat-item">
              <span className="goal-stat-label">总体进度</span>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${goalsStats.overallProgress}%` }}
                ></div>
              </div>
              <span className="progress-percentage">{goalsStats.overallProgress.toFixed(1)}%</span>
            </div>
          </div>
          <div className="goals-list">
            {goals.map(goal => {
              const progress = GoalPredictor.calculateProgress(goal);
              return (
                <div key={goal.id} className="goal-item">
                  <div className="goal-info">
                    <h4 className="goal-title">{goal.title}</h4>
                    <div className="goal-amounts">
                      <span className="goal-current">¥{GoalPredictor.formatCurrency(goal.currentAmount)}</span>
                      <span className="goal-separator">/</span>
                      <span className="goal-target">¥{GoalPredictor.formatCurrency(goal.targetAmount)}</span>
                    </div>
                  </div>
                  <div className="goal-progress">
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-percentage">{progress.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && (
              <p className="no-data">暂无储蓄目标</p>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'monthly' ? (
        <div className="monthly-stats">
          <h3>📅 月度收支统计</h3>
          <div className="stats-table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>月份</th>
                  <th>收入</th>
                  <th>支出</th>
                  <th>结余</th>
                  <th>交易笔数</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map(stat => (
                  <tr key={stat.month}>
                    <td className="month-cell">{dayjs(stat.month).format('YYYY年MM月')}</td>
                    <td className="income-cell">+{GoalPredictor.formatCurrency(stat.income)}</td>
                    <td className="expense-cell">-{GoalPredictor.formatCurrency(stat.expense)}</td>
                    <td className={`balance-cell ${stat.balance >= 0 ? 'positive' : 'negative'}`}>
                      {GoalPredictor.formatCurrency(stat.balance)}
                    </td>
                    <td className="count-cell">{stat.count}</td>
                  </tr>
                ))}
                {monthlyStats.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-cell">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="daily-stats">
          <h3>📅 日度收支统计 - {dayjs().year()}年{currentMonth + 1}月</h3>
          <div className="year-selector">
            <label>选择年份：</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>
          <div className="stats-table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>收入</th>
                  <th>支出</th>
                  <th>结余</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map(stat => (
                  <tr key={stat.day}>
                    <td className="day-cell">{dayjs(stat.day).format('MM月DD日')}</td>
                    <td className="income-cell">+{GoalPredictor.formatCurrency(stat.income)}</td>
                    <td className="expense-cell">-{GoalPredictor.formatCurrency(stat.expense)}</td>
                    <td className={`balance-cell ${stat.balance >= 0 ? 'positive' : 'negative'}`}>
                      {GoalPredictor.formatCurrency(stat.balance)}
                    </td>
                  </tr>
                ))}
                {dailyStats.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-cell">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="category-stats">
        <h3>📈 当月分类统计</h3>
        <div className="category-grid">
          <div className="category-section income-section">
            <h4>收入分类</h4>
            {incomeCategories.length > 0 ? (
              <div className="category-list">
                {incomeCategories.map(cat => (
                  <div key={cat.category} className="category-item">
                    <span className="category-name">{cat.category}</span>
                    <span className="category-amount">+{GoalPredictor.formatCurrency(cat.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">暂无收入数据</p>
            )}
          </div>
          <div className="category-section expense-section">
            <h4>支出分类</h4>
            {expenseCategories.length > 0 ? (
              <div className="category-list">
                {expenseCategories.map(cat => (
                  <div key={cat.category} className="category-item">
                    <span className="category-name">{cat.category}</span>
                    <span className="category-amount">-{GoalPredictor.formatCurrency(cat.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">暂无支出数据</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;