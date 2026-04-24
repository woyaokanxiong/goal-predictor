import { useState, useEffect } from 'react';
import type { FC } from 'react';
import GoalCard from './components/GoalCard';
import AddGoalModal from './components/AddGoalModal';
import EditGoalModal from './components/EditGoalModal';
import EditFinancialProfileModal from './components/EditFinancialProfileModal';
import CalendarView from './components/CalendarView';
import Dashboard from './components/Dashboard';
import type { SavingGoal, FinancialProfile, Transaction } from './types';
import { auth, signInAnonymouslyUser, syncData } from './utils/firebase';
import './App.css';

const App: FC = () => {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [financialProfile, setFinancialProfile] = useState<FinancialProfile>({
    monthlyIncome: 0,
    fixedExpenses: 0,
    averageVariableExpenses: 0,
    currentBalance: 0
  });
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [isEditFinancialProfileModalOpen, setIsEditFinancialProfileModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);
  const [currentMode, setCurrentMode] = useState<'traditional' | 'calendar' | 'dashboard'>('traditional');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // 当网络恢复时，自动同步数据
      if (user && (goals.length > 0 || financialProfile.monthlyIncome > 0 || transactions.length > 0)) {
        console.log('网络恢复，自动同步数据');
        setIsSyncing(true);
        syncData.saveData(user.uid, {
          goals: goals.map(goal => ({
            ...goal,
            createdAt: goal.createdAt.toISOString()
          })),
          financialProfile: financialProfile,
          transactions: transactions.map(transaction => ({
            ...transaction,
            date: transaction.date.toISOString()
          }))
        }).then(() => {
          setIsSyncing(false);
          setLastSync(new Date().toLocaleString());
          console.log('数据同步到Firebase成功');
        }).catch((error) => {
          setIsSyncing(false);
          console.error('数据同步到Firebase失败:', error);
        });
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, goals, financialProfile, transactions]);

  // 用户认证
  useEffect(() => {
    const authenticateUser = async () => {
      const user = await signInAnonymouslyUser();
      if (user) {
        setUser(user);
      }
    };

    authenticateUser();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      }
    });

    return unsubscribe;
  }, []);

  // 从本地存储或Firebase加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('开始加载数据...');
        
        // 检查 localStorage 是否可用
        if (typeof localStorage === 'undefined') {
          console.error('localStorage 不可用');
          return;
        }
        
        // 优先从Firebase加载数据
        if (user) {
          const firebaseData = await syncData.getData(user.uid);
          if (firebaseData) {
            console.log('从Firebase加载数据:', firebaseData);
            if (firebaseData.goals) {
              const processedGoals = firebaseData.goals.map((goal: any) => ({
                ...goal,
                createdAt: goal.createdAt ? new Date(goal.createdAt) : new Date()
              }));
              setGoals(processedGoals);
            }
            if (firebaseData.financialProfile) {
              setFinancialProfile(firebaseData.financialProfile);
            }
            if (firebaseData.transactions) {
              const processedTransactions = firebaseData.transactions.map((transaction: any) => ({
                ...transaction,
                date: transaction.date ? new Date(transaction.date) : new Date()
              }));
              setTransactions(processedTransactions);
            }
            setLastSync(new Date().toLocaleString());
            console.log('Firebase数据加载成功');
            
            // 将Firebase数据同步到本地存储
            try {
              const goalsString = JSON.stringify(goals, (_key, value) => {
                if (value instanceof Date) {
                  return value.toISOString();
                }
                return value;
              });
              
              const profileString = JSON.stringify(financialProfile);
              
              const transactionsString = JSON.stringify(transactions, (_key, value) => {
                if (value instanceof Date) {
                  return value.toISOString();
                }
                return value;
              });
              
              localStorage.setItem('goals', goalsString);
              localStorage.setItem('financialProfile', profileString);
              localStorage.setItem('transactions', transactionsString);
              console.log('Firebase数据同步到本地存储成功');
            } catch (localStorageError) {
              console.error('同步到本地存储失败:', localStorageError);
            }
            return;
          }
        }
        
        // 如果Firebase没有数据，从本地存储加载数据
        const savedGoals = localStorage.getItem('goals');
        const savedFinancialProfile = localStorage.getItem('financialProfile');
        const savedTransactions = localStorage.getItem('transactions');
        
        console.log('加载的数据状态:', {
          savedGoals: savedGoals ? '存在' : '不存在',
          savedFinancialProfile: savedFinancialProfile ? '存在' : '不存在',
          savedTransactions: savedTransactions ? '存在' : '不存在'
        });
        
        // 加载目标数据
        if (savedGoals) {
          try {
            const parsedGoals = JSON.parse(savedGoals);
            console.log('解析后的目标数据:', parsedGoals);
            if (Array.isArray(parsedGoals)) {
              // 处理 Date 对象
              const processedGoals = parsedGoals.map(goal => ({
                ...goal,
                createdAt: goal.createdAt ? new Date(goal.createdAt) : new Date()
              }));
              setGoals(processedGoals);
              console.log('目标数据加载成功');
            } else {
              console.error('目标数据格式错误，不是数组');
            }
          } catch (parseError) {
            console.error('解析目标数据失败:', parseError);
          }
        }
        
        // 加载财务档案数据
        if (savedFinancialProfile) {
          try {
            const parsedProfile = JSON.parse(savedFinancialProfile);
            console.log('解析后的财务档案数据:', parsedProfile);
            if (typeof parsedProfile === 'object' && parsedProfile !== null) {
              setFinancialProfile(parsedProfile);
              console.log('财务档案数据加载成功');
            } else {
              console.error('财务档案数据格式错误，不是对象');
            }
          } catch (parseError) {
            console.error('解析财务档案数据失败:', parseError);
          }
        }
        
        // 加载交易数据
        if (savedTransactions) {
          try {
            const parsedTransactions = JSON.parse(savedTransactions);
            console.log('解析后的交易数据:', parsedTransactions);
            if (Array.isArray(parsedTransactions)) {
              // 处理 Date 对象
              const processedTransactions = parsedTransactions.map(transaction => ({
                ...transaction,
                date: transaction.date ? new Date(transaction.date) : new Date()
              }));
              setTransactions(processedTransactions);
              console.log('交易数据加载成功');
            } else {
              console.error('交易数据格式错误，不是数组');
            }
          } catch (parseError) {
            console.error('解析交易数据失败:', parseError);
          }
        }
        
        console.log('数据加载完成');
      } catch (error) {
        console.error('加载数据失败:', error);
        // 如果加载失败，使用默认数据
        setGoals([]);
        setFinancialProfile({
          monthlyIncome: 0,
          fixedExpenses: 0,
          averageVariableExpenses: 0,
          currentBalance: 0
        });
        setTransactions([]);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user, goals, financialProfile, transactions]);

  // 监听Firebase数据变化
  useEffect(() => {
    if (user) {
      const unsubscribe = syncData.listenToData(user.uid, (data) => {
        console.log('Firebase数据变化:', data);
        if (data) {
          if (data.goals) {
            const processedGoals = data.goals.map((goal: any) => ({
              ...goal,
              createdAt: goal.createdAt ? new Date(goal.createdAt) : new Date()
            }));
            setGoals(processedGoals);
          }
          if (data.financialProfile) {
            setFinancialProfile(data.financialProfile);
          }
          if (data.transactions) {
            const processedTransactions = data.transactions.map((transaction: any) => ({
              ...transaction,
              date: transaction.date ? new Date(transaction.date) : new Date()
            }));
            setTransactions(processedTransactions);
          }
          setLastSync(new Date().toLocaleString());
        }
      });

      return unsubscribe;
    }
  }, [user]);

  // 保存数据到本地存储和Firebase
  useEffect(() => {
    // 只有当数据不为空时才保存，避免保存空数据
    if (goals.length > 0 || financialProfile.monthlyIncome > 0 || transactions.length > 0) {
      try {
        console.log('开始保存数据...');
        
        // 检查 localStorage 是否可用
        if (typeof localStorage === 'undefined') {
          console.error('localStorage 不可用');
          return;
        }
        
        // 序列化数据，处理 Date 对象
        const goalsString = JSON.stringify(goals, (_key, value) => {
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        });
        
        const profileString = JSON.stringify(financialProfile);
        
        const transactionsString = JSON.stringify(transactions, (_key, value) => {
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        });
        
        // 保存数据到本地存储
        localStorage.setItem('goals', goalsString);
        localStorage.setItem('financialProfile', profileString);
        localStorage.setItem('transactions', transactionsString);
        console.log('数据保存到本地存储成功');
        
        // 保存数据到Firebase
        if (user && isOnline) {
          setIsSyncing(true);
          syncData.saveData(user.uid, {
            goals: goals.map(goal => ({
              ...goal,
              createdAt: goal.createdAt.toISOString()
            })),
            financialProfile: financialProfile,
            transactions: transactions.map(transaction => ({
              ...transaction,
              date: transaction.date.toISOString()
            }))
          }).then(() => {
            setIsSyncing(false);
            setLastSync(new Date().toLocaleString());
            console.log('数据同步到Firebase成功');
          }).catch((error) => {
            setIsSyncing(false);
            console.error('数据同步到Firebase失败:', error);
            // 不显示alert，避免打扰用户
            console.log('将在网络恢复后自动重试同步');
          });
        }
        
        console.log('数据保存成功');
      } catch (error) {
        console.error('保存数据失败:', error);
        // 尝试清除 localStorage 并重新保存
        try {
          console.log('尝试清除 localStorage 并重新保存');
          localStorage.clear();
          
          // 重新保存
          localStorage.setItem('goals', JSON.stringify(goals, (_key, value) => {
            if (value instanceof Date) {
              return value.toISOString();
            }
            return value;
          }));
          localStorage.setItem('financialProfile', JSON.stringify(financialProfile));
          localStorage.setItem('transactions', JSON.stringify(transactions, (_key, value) => {
            if (value instanceof Date) {
              return value.toISOString();
            }
            return value;
          }));
          
          console.log('重新保存成功');
        } catch (retryError) {
          console.error('重新保存也失败:', retryError);
        }
      }
    } else {
      console.log('数据为空，跳过保存');
    }
  }, [goals, financialProfile, transactions, user, isOnline]);

  // 处理添加目标
  const handleAddGoal = (goal: Omit<SavingGoal, 'id' | 'createdAt'>) => {
    const newGoal: SavingGoal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    setGoals(prev => [...prev, newGoal]);
  };

  // 处理删除目标
  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  // 处理编辑目标
  const handleEditGoal = (goal: SavingGoal) => {
    setSelectedGoal(goal);
    setIsEditGoalModalOpen(true);
  };

  // 处理更新目标
  const handleUpdateGoal = (id: string, updates: Omit<SavingGoal, 'id' | 'createdAt'>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, ...updates } : goal
    ));
  };

  // 导出数据到文件
  const handleExportData = () => {
    const data = {
      goals,
      financialProfile,
      transactions,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // 导入数据从文件
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (data.goals) setGoals(data.goals);
        if (data.financialProfile) setFinancialProfile(data.financialProfile);
        if (data.transactions) setTransactions(data.transactions);
        
        alert('数据导入成功！');
      } catch (error) {
        console.error('导入数据失败:', error);
        alert('导入数据失败，请确保文件格式正确。');
      }
    };
    reader.readAsText(file);
    
    // 重置文件输入
    e.target.value = '';
  };

  // 处理更新财务档案
  const handleUpdateFinancialProfile = (profile: Partial<FinancialProfile> | FinancialProfile) => {
    setFinancialProfile(prev => ({ ...prev, ...profile }));
  };

  // 处理添加交易
  const handleAddTransaction = (transaction: Transaction) => {
    const updatedTransactions = [...transactions, transaction];
    setTransactions(updatedTransactions);
    
    // 同步更新财务档案
    if (transaction.type === 'income') {
      // 简单处理：将新收入添加到月收入中
      setFinancialProfile(prev => ({
        ...prev,
        monthlyIncome: prev.monthlyIncome + transaction.amount
      }));
    } else {
      // 简单处理：将新支出添加到平均可变支出中
      setFinancialProfile(prev => ({
        ...prev,
        averageVariableExpenses: prev.averageVariableExpenses + transaction.amount
      }));
    }
    
    // 计算当天的净收入（收入 - 支出）并分配到储蓄目标中
    const transactionDate = new Date(transaction.date);
    const sameDayTransactions = updatedTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === transactionDate.getFullYear() &&
             tDate.getMonth() === transactionDate.getMonth() &&
             tDate.getDate() === transactionDate.getDate();
    });
    
    // 计算当天的总收入和总支出
    const dayIncome = sameDayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const dayExpense = sameDayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // 计算净收入
    const netIncome = dayIncome - dayExpense;
    
    // 将净收入分配到储蓄目标中
    if (goals.length > 0 && netIncome !== 0) {
      const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
      if (totalTargetAmount > 0) {
        setGoals(prevGoals => prevGoals.map(goal => ({
          ...goal,
          currentAmount: goal.currentAmount + (netIncome * (goal.targetAmount / totalTargetAmount))
        })));
      }
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>💹 个人财务管理</h1>
        <div className="header-actions">
          <div className="mode-switcher">
            <button 
              className={`mode-btn ${currentMode === 'traditional' ? 'active' : ''}`}
              onClick={() => setCurrentMode('traditional')}
            >
              传统模式
            </button>
            <button 
              className={`mode-btn ${currentMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setCurrentMode('calendar')}
            >
              日历模式
            </button>
            <button 
              className={`mode-btn ${currentMode === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentMode('dashboard')}
            >
              仪表盘
            </button>
          </div>
          <div className="sync-status">
            <div className={`sync-indicator ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? '🌐 在线' : '📴 离线'}
            </div>
            <div className="sync-info">
              {isSyncing ? '🔄 同步中...' : `上次同步: ${lastSync || '从未'}`}
            </div>
          </div>
          <div className="data-actions">
            <button className="action-btn" onClick={handleExportData}>
              💾 导出数据
            </button>
            <label className="action-btn primary">
              📤 导入数据
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportData} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>
        </div>
      </header>

      <main className="app-main">
        {currentMode === 'traditional' ? (
          <div className="traditional-mode">
            <div className="financial-profile">
              <h2>💰 财务档案</h2>
              <div className="profile-form">
                <div className="form-group">
                  <label>月收入</label>
                  <input
                    type="number"
                    value={financialProfile.monthlyIncome}
                    onChange={(e) => handleUpdateFinancialProfile({ monthlyIncome: parseFloat(e.target.value) || 0 })}
                    placeholder="输入月收入"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>固定支出</label>
                  <input
                    type="number"
                    value={financialProfile.fixedExpenses}
                    onChange={(e) => handleUpdateFinancialProfile({ fixedExpenses: parseFloat(e.target.value) || 0 })}
                    placeholder="输入固定支出"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>平均可变支出</label>
                  <input
                    type="number"
                    value={financialProfile.averageVariableExpenses}
                    onChange={(e) => handleUpdateFinancialProfile({ averageVariableExpenses: parseFloat(e.target.value) || 0 })}
                    placeholder="输入平均可变支出"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="goals-section">
              <div className="section-header">
                <h2>🎯 储蓄目标</h2>
                <button 
                  className="add-goal-btn"
                  onClick={() => setIsAddGoalModalOpen(true)}
                >
                  + 添加目标
                </button>
              </div>
              <div className="goals-grid">
                {goals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    goals={goals}
                    financialProfile={financialProfile}
                    onEdit={handleEditGoal}
                    onDelete={handleDeleteGoal}
                    transactions={transactions}
                  />
                ))}
                {goals.length === 0 && (
                  <div className="empty-state">
                    <p>还没有储蓄目标</p>
                    <button 
                      className="add-first-goal-btn"
                      onClick={() => setIsAddGoalModalOpen(true)}
                    >
                      添加第一个目标
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : currentMode === 'calendar' ? (
          <CalendarView 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction}
          />
        ) : (
          <Dashboard 
            transactions={transactions} 
            financialProfile={financialProfile} 
            goals={goals}
            onAddExpense={() => setIsEditFinancialProfileModalOpen(true)}
            onViewAll={() => setIsEditFinancialProfileModalOpen(true)}
          />
        )}
      </main>

      <AddGoalModal
        isOpen={isAddGoalModalOpen}
        onClose={() => setIsAddGoalModalOpen(false)}
        onSave={handleAddGoal}
        financialProfile={financialProfile}
      />
      <EditGoalModal
        isOpen={isEditGoalModalOpen}
        onClose={() => setIsEditGoalModalOpen(false)}
        onSave={handleUpdateGoal}
        goal={selectedGoal}
      />
      <EditFinancialProfileModal
        isOpen={isEditFinancialProfileModalOpen}
        onClose={() => setIsEditFinancialProfileModalOpen(false)}
        onSave={handleUpdateFinancialProfile}
        financialProfile={financialProfile}
      />

      <footer className="app-footer">
        <p>© 2024 个人财务管理系统</p>
      </footer>
    </div>
  );
};

export default App;
