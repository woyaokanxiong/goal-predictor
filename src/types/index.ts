export interface SavingGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: Date;
}

export interface FinancialProfile {
  monthlyIncome: number;
  fixedExpenses: number;
  averageVariableExpenses: number;
  currentBalance: number;
  fixedExpenseCategories?: FixedExpenseCategory[];
}

export interface FixedExpenseCategory {
  id: string;
  name: string;
  amount: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: Date;
  description: string;
}

export type RiskPreference = 'conservative' | 'moderate' | 'aggressive';

export interface PredictionScenario {
  months: number;
  date: string;
  confidence: number;
}

export interface GoalPrediction {
  monthlyDisposableIncome: number;
  monthlySavings: number;
  remainingAmount: number;
  estimatedMonths: number;
  estimatedCompletionDate: Date;
  monthlyRequired: number;
  isFeasible: boolean;
  recommendations: string[];
}

export interface AdvancedGoalPrediction {
  goalId: string;
  predictions: {
    optimistic: PredictionScenario;
    realistic: PredictionScenario;
    pessimistic: PredictionScenario;
  };
  feasibility: 'achievable' | 'tight' | 'unachievable';
  monthlyRequired: number;
  suggestions: string[];
}