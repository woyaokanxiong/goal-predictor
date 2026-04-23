import type { FC } from 'react';
import type { FinancialProfile } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface FixedExpenseCardProps {
  financialProfile: FinancialProfile;
  onAddExpense?: () => void;
  onViewAll?: () => void;
}

const FixedExpenseCard: FC<FixedExpenseCardProps> = ({
  financialProfile,
  onAddExpense,
  onViewAll
}) => {
  const categories = financialProfile.fixedExpenseCategories || [];
  const totalAmount = categories.reduce((sum, category) => sum + category.amount, 0);

  const chartData = categories.map(category => ({
    name: category.name,
    value: category.amount
  }));

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#0891b2', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'];

  const topCategories = categories.slice(0, 5);

  if (categories.length === 0) {
    return (
      <div className="fixed-expense-card">
        <div className="card-header">
          <h3>📊 每月固定支出</h3>
          <div className="card-actions">
            <button className="action-btn secondary" onClick={onAddExpense}>添加新支出</button>
          </div>
        </div>
        <div className="empty-state">
          <p>暂无固定支出分类</p>
          <p className="empty-hint">点击"添加新支出"开始记录您的固定支出</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed-expense-card">
      <div className="card-header">
        <h3>📊 每月固定支出</h3>
        <div className="total-amount">
          <span className="amount-label">当月总计</span>
          <span className="amount-value">¥{totalAmount.toFixed(2)}</span>
        </div>
        <div className="card-actions">
          <button className="action-btn secondary" onClick={onViewAll}>查看全部</button>
          <button className="action-btn primary" onClick={onAddExpense}>添加新支出</button>
        </div>
      </div>

      <div className="card-content">
        <div className="chart-section">
          <h4>支出类别占比</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${((entry.value / totalAmount) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `¥${value}`} />
              </PieChart>
            </ResponsiveContainer>
            <Legend />
          </div>
        </div>

        <div className="expense-list-section">
          <h4>主要支出明细</h4>
          <div className="expense-list">
            {topCategories.map((category, index) => (
              <div key={category.id} className="expense-item">
                <div className="expense-info">
                  <div className="expense-rank">{index + 1}</div>
                  <div className="expense-details">
                    <div className="expense-name">{category.name}</div>
                    <div className="expense-amount">¥{category.amount.toFixed(2)}</div>
                  </div>
                </div>
                <div className="expense-percentage">
                  {totalAmount > 0 ? `${((category.amount / totalAmount) * 100).toFixed(1)}%` : '0%'}
                </div>
              </div>
            ))}
          </div>
          {categories.length > 5 && (
            <div className="more-items">
              还有 {categories.length - 5} 项支出项目...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedExpenseCard;