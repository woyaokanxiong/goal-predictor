export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  balance: number;
  currency: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  parentId?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description?: string;
  date: string;
  tags?: string;
  location?: string;
  relatedTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId?: string;
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface SyncRecord {
  id: string;
  userId: string;
  deviceId: string;
  syncTime: string;
  dataHash: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface StatisticsParams {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year' | 'category';
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface TimeSeriesData {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  targetDate?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalProgress {
  goal: Goal;
  progress: number;
  remainingAmount: number;
  estimatedCompletionDate?: string;
  daysRemaining?: number;
}