import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format, differenceInDays } from 'date-fns';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Goal, GoalProgress } from '../types';

const router = Router();

router.use(authMiddleware);

// 模拟目标数据
export const goalsByUser: Map<string, Goal[]> = new Map();

// 模拟交易数据（用于计算目标进度）
const transactionsByUser: Map<string, any[]> = new Map();

// 计算目标进度
function calculateGoalProgress(goal: Goal): GoalProgress {
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);
  
  // 计算估计完成日期
  let estimatedCompletionDate: string | undefined;
  let daysRemaining: number | undefined;
  
  if (progress < 100) {
    // 简单估算：基于当前进度和已过去的时间
    const startDate = new Date(goal.startDate);
    const today = new Date();
    const daysPassed = differenceInDays(today, startDate);
    
    if (daysPassed > 0 && goal.currentAmount > 0) {
      const dailyRate = goal.currentAmount / daysPassed;
      if (dailyRate > 0) {
        const daysNeeded = Math.ceil(remainingAmount / dailyRate);
        estimatedCompletionDate = format(addDays(today, daysNeeded), 'yyyy-MM-dd');
        daysRemaining = daysNeeded;
      }
    }
  }

  return {
    goal,
    progress: Math.min(progress, 100),
    remainingAmount,
    estimatedCompletionDate,
    daysRemaining
  };
}

// 获取目标列表
router.get('/', (req: AuthRequest, res) => {
  try {
    // 确保用户有目标数据
    if (!goalsByUser.has(req.user!.id)) {
      goalsByUser.set(req.user!.id, []);
    }

    const goals = goalsByUser.get(req.user!.id) || [];
    const activeGoals = goals.filter(goal => goal.isActive);

    // 计算每个目标的进度
    const goalsWithProgress: GoalProgress[] = activeGoals.map(calculateGoalProgress);

    res.json({
      success: true,
      data: goalsWithProgress
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      success: false,
      message: '获取目标列表失败'
    });
  }
});

// 创建目标
router.post('/', (req: AuthRequest, res) => {
  try {
    const { name, targetAmount, startDate, targetDate, description } = req.body;

    if (!name || !targetAmount || !startDate) {
      return res.status(400).json({
        success: false,
        message: '请提供目标名称、目标金额和开始日期'
      });
    }

    const goalId = uuidv4();
    const now = new Date().toISOString();

    const newGoal: Goal = {
      id: goalId,
      userId: req.user!.id,
      name,
      targetAmount,
      currentAmount: 0,
      startDate,
      targetDate,
      description,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    // 保存目标
    if (!goalsByUser.has(req.user!.id)) {
      goalsByUser.set(req.user!.id, []);
    }
    const userGoals = goalsByUser.get(req.user!.id) || [];
    userGoals.push(newGoal);
    goalsByUser.set(req.user!.id, userGoals);

    // 计算进度
    const goalWithProgress = calculateGoalProgress(newGoal);

    res.status(201).json({
      success: true,
      message: '目标创建成功',
      data: goalWithProgress
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      success: false,
      message: '创建目标失败'
    });
  }
});

// 更新目标
router.put('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, targetAmount, startDate, targetDate, description } = req.body;

    // 确保用户有目标数据
    if (!goalsByUser.has(req.user!.id)) {
      goalsByUser.set(req.user!.id, []);
    }

    const userGoals = goalsByUser.get(req.user!.id) || [];
    const goalIndex = userGoals.findIndex(goal => goal.id === id);
    
    if (goalIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '目标不存在'
      });
    }

    const now = new Date().toISOString();
    
    const updatedGoal: Goal = {
      ...userGoals[goalIndex],
      name: name || userGoals[goalIndex].name,
      targetAmount: targetAmount !== undefined ? targetAmount : userGoals[goalIndex].targetAmount,
      startDate: startDate || userGoals[goalIndex].startDate,
      targetDate: targetDate !== undefined ? targetDate : userGoals[goalIndex].targetDate,
      description: description !== undefined ? description : userGoals[goalIndex].description,
      updatedAt: now
    };

    userGoals[goalIndex] = updatedGoal;
    goalsByUser.set(req.user!.id, userGoals);

    // 计算进度
    const goalWithProgress = calculateGoalProgress(updatedGoal);

    res.json({
      success: true,
      message: '目标更新成功',
      data: goalWithProgress
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({
      success: false,
      message: '更新目标失败'
    });
  }
});

// 更新目标进度
router.put('/:id/progress', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { currentAmount } = req.body;

    if (currentAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: '请提供当前金额'
      });
    }

    // 确保用户有目标数据
    if (!goalsByUser.has(req.user!.id)) {
      goalsByUser.set(req.user!.id, []);
    }

    const userGoals = goalsByUser.get(req.user!.id) || [];
    const goalIndex = userGoals.findIndex(goal => goal.id === id);
    
    if (goalIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '目标不存在'
      });
    }

    const now = new Date().toISOString();
    
    const updatedGoal: Goal = {
      ...userGoals[goalIndex],
      currentAmount,
      updatedAt: now
    };

    userGoals[goalIndex] = updatedGoal;
    goalsByUser.set(req.user!.id, userGoals);

    // 计算进度
    const goalWithProgress = calculateGoalProgress(updatedGoal);

    res.json({
      success: true,
      message: '目标进度更新成功',
      data: goalWithProgress
    });
  } catch (error) {
    console.error('Update goal progress error:', error);
    res.status(500).json({
      success: false,
      message: '更新目标进度失败'
    });
  }
});

// 删除目标
router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 确保用户有目标数据
    if (!goalsByUser.has(req.user!.id)) {
      goalsByUser.set(req.user!.id, []);
    }

    const userGoals = goalsByUser.get(req.user!.id) || [];
    const goalIndex = userGoals.findIndex(goal => goal.id === id);
    
    if (goalIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '目标不存在'
      });
    }

    const now = new Date().toISOString();
    
    // 软删除目标
    userGoals[goalIndex].isActive = false;
    userGoals[goalIndex].updatedAt = now;
    goalsByUser.set(req.user!.id, userGoals);

    res.json({
      success: true,
      message: '目标删除成功'
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({
      success: false,
      message: '删除目标失败'
    });
  }
});

export default router;