import type { FC } from 'react';
import type { SavingGoal, FinancialProfile, Transaction } from '../types';
import { GoalPredictor } from '../utils/GoalPredictor';
import dayjs from 'dayjs';

interface GoalCardProps {
  goal: SavingGoal;
  goals: SavingGoal[];
  financialProfile: FinancialProfile;
  transactions?: Transaction[];
  onEdit?: (goal: SavingGoal) => void;
  onDelete?: (id: string) => void;
}

const GoalCard: FC<GoalCardProps> = ({ goal, goals, financialProfile, transactions = [], onEdit, onDelete }) => {
  const prediction = GoalPredictor.predict(goal, financialProfile);
  const progress = GoalPredictor.calculateProgress(goal);

  const currentMonth = dayjs().startOf('month');
  const currentMonthTransactions = transactions.filter(t =>
    dayjs(t.date).isSame(currentMonth, 'month')
  );

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyBalance = monthlyIncome - monthlyExpense;

  const daysInMonth = currentMonth.daysInMonth();
  const currentDay = dayjs().date();

  const predictedMonthlyIncome = monthlyIncome > 0 && currentDay > 0
    ? Math.round((monthlyIncome / currentDay) * daysInMonth)
    : financialProfile.monthlyIncome;

  const predictedMultiGoalPrediction = GoalPredictor.predictWithPredictedIncomeMultiGoal(
    goals,
    financialProfile,
    predictedMonthlyIncome
  );

  return (
    <div className="goal-card" onClick={() => onEdit && onEdit(goal)}>
      <div className="goal-card-header">
        <h3 className="goal-title">{goal.title}</h3>
        <div className="goal-actions">
          <button className="action-btn" onClick={(e) => {
            e.stopPropagation();
            if (onEdit) {
              onEdit(goal);
            }
          }}>编辑</button>
          <button className="action-btn danger" onClick={(e) => {
            e.stopPropagation();
            if (onDelete) {
              onDelete(goal.id);
            }
          }}>删除</button>
        </div>
      </div>

      <div className="goal-amounts">
        <div className="goal-amount">
          <span className="amount-label">目标</span>
          <span className="amount-value">¥{GoalPredictor.formatCurrency(goal.targetAmount)}</span>
        </div>
        <div className="goal-amount">
          <span className="amount-label">已存</span>
          <span className="current">¥{GoalPredictor.formatCurrency(goal.currentAmount)}</span>
        </div>
        <div className="goal-amount">
          <span className="amount-label">还需</span>
          <span className="amount-value">¥{GoalPredictor.formatCurrency(prediction.remainingAmount)}</span>
        </div>
      </div>

      <div className="prediction-info">
        <h4>📅 {dayjs().format('YYYY年MM月')} 收支</h4>
        <div className="prediction-stats">
          <div className="stat-row">
            <span>本月收入</span>
            <span className="income">+¥{GoalPredictor.formatCurrency(monthlyIncome)}</span>
          </div>
          <div className="stat-row">
            <span>本月支出</span>
            <span className="expense">-¥{GoalPredictor.formatCurrency(monthlyExpense)}</span>
          </div>
          <div className="stat-row">
            <span>本月结余</span>
            <span className={monthlyBalance >= 0 ? 'income' : 'expense'}>
              ¥{GoalPredictor.formatCurrency(monthlyBalance)}
            </span>
          </div>
          <div className="stat-row">
            <span>预测月收入</span>
            <span className="income">+¥{GoalPredictor.formatCurrency(predictedMonthlyIncome)}</span>
          </div>
        </div>
      </div>

      <div className="goal-progress">
        <div className="progress-header">
          <span>🎯 目标进度</span>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="prediction-info">
        <h4>📈 预测（单目标）</h4>
        <div className="prediction-stats">
          <div className="stat-row">
            <span>预计达成时间</span>
            <span className="highlight">{GoalPredictor.formatDate(prediction.estimatedCompletionDate)}</span>
          </div>
          <div className="stat-row">
            <span>每月需存</span>
            <span className="highlight">¥{GoalPredictor.formatCurrency(prediction.monthlyRequired)}</span>
          </div>
          <div className="stat-row">
            <span>预计月数</span>
            <span className="highlight">{prediction.estimatedMonths} 个月</span>
          </div>
        </div>
      </div>

      <div className="prediction-info multi-goal">
        <h4>📊 预测（多目标合计）</h4>
        <div className="prediction-stats">
          <div className="stat-row">
            <span>合计还需</span>
            <span className="highlight">¥{GoalPredictor.formatCurrency(predictedMultiGoalPrediction.totalRemainingAmount)}</span>
          </div>
          <div className="stat-row">
            <span>预计达成时间</span>
            <span className="highlight">{GoalPredictor.formatDate(predictedMultiGoalPrediction.estimatedCompletionDate)}</span>
          </div>
          <div className="stat-row">
            <span>每月需存</span>
            <span className="highlight">¥{GoalPredictor.formatCurrency(predictedMultiGoalPrediction.monthlyRequired)}</span>
          </div>
          <div className="stat-row">
            <span>预计月数</span>
            <span className="highlight">{predictedMultiGoalPrediction.estimatedMonths} 个月</span>
          </div>
        </div>
      </div>

      <div className={`feasibility ${prediction.isFeasible ? 'feasible' : 'not-feasible'}`}>
        <span>可行性：{prediction.isFeasible ? '可行' : '不可行'}</span>
      </div>

      {!prediction.isFeasible && prediction.recommendations.length > 0 && (
        <div className="recommendations">
          <h4>建议：</h4>
          <ul>
            {prediction.recommendations.map((recommendation, index) => (
              <li key={index}>{recommendation}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GoalCard;