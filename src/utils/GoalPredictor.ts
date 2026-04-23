import dayjs from 'dayjs';
import type { SavingGoal, FinancialProfile, GoalPrediction, Transaction, AdvancedGoalPrediction } from '../types';

export class GoalPredictor {
  private static readonly SAVINGS_RATIO = 0.7;

  static predict(goal: SavingGoal, financialProfile: FinancialProfile): GoalPrediction {
    // 1. 计算月可支配收入
    const monthlyDisposableIncome = 
      financialProfile.monthlyIncome - 
      financialProfile.fixedExpenses - 
      financialProfile.averageVariableExpenses;

    // 2. 计算保守储蓄金额（70%）
    const monthlySavings = monthlyDisposableIncome * this.SAVINGS_RATIO;

    // 3. 计算还需金额
    const remainingAmount = goal.targetAmount - goal.currentAmount;

    // 4. 计算预计月数和日期
    const estimatedMonths = Math.max(1, Math.ceil(remainingAmount / monthlySavings));
    const estimatedCompletionDate = dayjs().add(estimatedMonths, 'month').toDate();

    // 5. 计算每月所需金额和可行性
    let monthlyRequired = 0;
    let isFeasible = true;
    const recommendations: string[] = [];

    // 没有截止日期，使用每月储蓄金额
    monthlyRequired = monthlySavings;

    // 6. 检查基本可行性
    if (monthlyDisposableIncome <= 0) {
      isFeasible = false;
      recommendations.push('月支出超过收入，请调整支出或增加收入');
    }

    if (monthlySavings <= 0) {
      isFeasible = false;
      recommendations.push('无可用储蓄，请调整支出结构');
    }

    return {
      monthlyDisposableIncome,
      monthlySavings,
      remainingAmount,
      estimatedMonths,
      estimatedCompletionDate,
      monthlyRequired,
      isFeasible,
      recommendations
    };
  }

  static predictAdvanced(
    goal: SavingGoal,
    goals: SavingGoal[],
    transactions: Transaction[],
    financialProfile: FinancialProfile
  ): AdvancedGoalPrediction {
    // 1. 收支趋势分析
    const { incomeTrends, expenseTrends } = this.analyzeTrends(transactions);

    // 2. 计算可支配收入的不同场景
    // 基于历史交易数据的实际可支配收入
    const actualMonthlyIncome = incomeTrends['3m'] || financialProfile.monthlyIncome;
    const actualMonthlyExpenses = expenseTrends['3m'] || (financialProfile.fixedExpenses + financialProfile.averageVariableExpenses);
    const actualDisposable = actualMonthlyIncome - actualMonthlyExpenses;
    
    // 乐观场景：基于实际数据，收入+10%，支出-5%
    const optimisticDisposable = actualDisposable * 1.15;
    // 悲观场景：基于实际数据，收入-5%，支出+10%
    const pessimisticDisposable = actualDisposable * 0.85;
    // 现实场景：基于实际历史趋势
    const realisticDisposable = actualDisposable;

    // 3. 计算不同场景下的达成时间
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    
    // 计算每月储蓄金额（考虑投资回报）
    const monthlySavingsOptimistic = optimisticDisposable * this.SAVINGS_RATIO;
    const monthlySavingsRealistic = realisticDisposable * this.SAVINGS_RATIO;
    const monthlySavingsPessimistic = pessimisticDisposable * this.SAVINGS_RATIO;

    // 计算预计月数
    const monthsOptimistic = Math.max(1, Math.ceil(remainingAmount / monthlySavingsOptimistic));
    const monthsRealistic = Math.max(1, Math.ceil(remainingAmount / monthlySavingsRealistic));
    const monthsPessimistic = Math.max(1, Math.ceil(remainingAmount / monthlySavingsPessimistic));

    // 4. 计算置信度
    const confidenceOptimistic = 0.3;  // 30% 置信度
    const confidenceRealistic = 0.6;   // 60% 置信度
    const confidencePessimistic = 0.8; // 80% 置信度

    // 5. 可行性评估
    let feasibility: 'achievable' | 'tight' | 'unachievable' = 'achievable';
    const suggestions: string[] = [];

    if (monthlySavingsRealistic <= 0) {
      feasibility = 'unachievable';
      suggestions.push('当前财务状况无法实现该目标，请调整支出或增加收入');
    } else if (monthsRealistic > 60) { // 超过5年
      feasibility = 'tight';
      suggestions.push('目标达成时间较长，建议增加每月储蓄金额');
      suggestions.push('考虑投资以获取更高回报');
    }

    // 6. 考虑其他目标的影响
    const totalRemaining = goals.reduce((sum, g) => sum + (g.targetAmount - g.currentAmount), 0);
    const totalMonthlySavings = realisticDisposable * this.SAVINGS_RATIO;
    const totalMonths = Math.max(1, Math.ceil(totalRemaining / totalMonthlySavings));

    if (totalMonths > 36) { // 超过3年
      suggestions.push('多个目标同时进行可能导致达成时间延长，建议优先处理重要目标');
    }

    return {
      goalId: goal.id,
      predictions: {
        optimistic: {
          months: monthsOptimistic,
          date: dayjs().add(monthsOptimistic, 'month').format('YYYY年MM月DD日'),
          confidence: confidenceOptimistic
        },
        realistic: {
          months: monthsRealistic,
          date: dayjs().add(monthsRealistic, 'month').format('YYYY年MM月DD日'),
          confidence: confidenceRealistic
        },
        pessimistic: {
          months: monthsPessimistic,
          date: dayjs().add(monthsPessimistic, 'month').format('YYYY年MM月DD日'),
          confidence: confidencePessimistic
        }
      },
      feasibility,
      monthlyRequired: monthlySavingsRealistic,
      suggestions
    };
  }

  static calculateProgress(goal: SavingGoal): number {
    if (goal.targetAmount <= 0) return 0;
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  }

  static formatCurrency(amount: number): string {
    return amount.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  static formatDate(date: Date): string {
    return dayjs(date).format('YYYY年MM月DD日');
  }

  private static analyzeTrends(transactions: Transaction[]) {
    // 按月份分组交易
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};

    transactions.forEach(t => {
      const monthKey = dayjs(t.date).format('YYYY-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });

    // 计算趋势（3个月、6个月、12个月）
    const incomeTrends: { [key: string]: number } = {};
    const expenseTrends: { [key: string]: number } = {};

    // 3个月趋势
    const recent3Months = Object.keys(monthlyData)
      .sort()
      .slice(-3);
    if (recent3Months.length > 0) {
      const totalIncome3m = recent3Months.reduce((sum, month) => sum + monthlyData[month].income, 0);
      const totalExpense3m = recent3Months.reduce((sum, month) => sum + monthlyData[month].expense, 0);
      incomeTrends['3m'] = totalIncome3m / recent3Months.length;
      expenseTrends['3m'] = totalExpense3m / recent3Months.length;
    }

    // 6个月趋势
    const recent6Months = Object.keys(monthlyData)
      .sort()
      .slice(-6);
    if (recent6Months.length > 0) {
      const totalIncome6m = recent6Months.reduce((sum, month) => sum + monthlyData[month].income, 0);
      const totalExpense6m = recent6Months.reduce((sum, month) => sum + monthlyData[month].expense, 0);
      incomeTrends['6m'] = totalIncome6m / recent6Months.length;
      expenseTrends['6m'] = totalExpense6m / recent6Months.length;
    }

    // 12个月趋势
    const recent12Months = Object.keys(monthlyData)
      .sort()
      .slice(-12);
    if (recent12Months.length > 0) {
      const totalIncome12m = recent12Months.reduce((sum, month) => sum + monthlyData[month].income, 0);
      const totalExpense12m = recent12Months.reduce((sum, month) => sum + monthlyData[month].expense, 0);
      incomeTrends['12m'] = totalIncome12m / recent12Months.length;
      expenseTrends['12m'] = totalExpense12m / recent12Months.length;
    }

    // 季节性因素分析（简化版）
    const seasonalFactors = {
      income: this.calculateSeasonalFactors(monthlyData, 'income'),
      expense: this.calculateSeasonalFactors(monthlyData, 'expense')
    };

    return { incomeTrends, expenseTrends, seasonalFactors };
  }

  private static calculateSeasonalFactors(monthlyData: { [key: string]: { income: number; expense: number } }, type: 'income' | 'expense') {
    const monthlyAverages: { [key: number]: number[] } = {};

    Object.entries(monthlyData).forEach(([monthKey, data]) => {
      const month = parseInt(monthKey.split('-')[1]);
      if (!monthlyAverages[month]) {
        monthlyAverages[month] = [];
      }
      monthlyAverages[month].push(data[type]);
    });

    const seasonalFactors: { [key: number]: number } = {};
    Object.entries(monthlyAverages).forEach(([month, values]) => {
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      seasonalFactors[parseInt(month)] = average;
    });

    return seasonalFactors;
  }

  // 使用预测收入进行多目标预测
  static predictWithPredictedIncomeMultiGoal(
    goals: SavingGoal[],
    financialProfile: FinancialProfile,
    predictedMonthlyIncome: number
  ): {
    totalRemainingAmount: number;
    estimatedMonths: number;
    estimatedCompletionDate: Date;
    monthlyRequired: number;
    isFeasible: boolean;
    recommendations: string[];
  } {
    // 1. 计算所有目标的合计金额
    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalRemainingAmount = totalTargetAmount - totalCurrentAmount;

    // 2. 计算月可支配收入（使用预测的收入）
    const monthlyDisposableIncome =
      predictedMonthlyIncome -
      financialProfile.fixedExpenses -
      financialProfile.averageVariableExpenses;

    // 3. 计算保守储蓄金额（70%）
    const monthlySavings = monthlyDisposableIncome * this.SAVINGS_RATIO;

    // 4. 计算预计月数和日期
    const estimatedMonths = Math.max(1, Math.ceil(totalRemainingAmount / monthlySavings));
    const estimatedCompletionDate = dayjs().add(estimatedMonths, 'month').toDate();

    // 5. 计算每月所需金额和可行性
    let monthlyRequired = 0;
    let isFeasible = true;
    const recommendations: string[] = [];

    // 检查基本可行性
    if (monthlyDisposableIncome <= 0) {
      isFeasible = false;
      recommendations.push('月支出超过收入，请调整支出或增加收入');
    }

    if (monthlySavings <= 0) {
      isFeasible = false;
      recommendations.push('无可用储蓄，请调整支出结构');
    }

    // 没有截止日期，使用每月储蓄金额
    monthlyRequired = monthlySavings;

    return {
      totalRemainingAmount,
      estimatedMonths,
      estimatedCompletionDate,
      monthlyRequired,
      isFeasible,
      recommendations
    };
  }
}