import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Category } from '../types';

const router = Router();

router.use(authMiddleware);

// 模拟分类数据
const mockCategories: Category[] = [
  { id: 'system_cat_0', userId: 'system', name: '工资', type: 'income', color: '#52c41a', icon: 'money', tags: ['固定收入', '月度'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_1', userId: 'system', name: '奖金', type: 'income', color: '#73d13d', icon: 'gift', tags: ['额外收入', '不定期'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_2', userId: 'system', name: '投资', type: 'income', color: '#95de64', icon: 'stock', tags: ['理财收入'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_3', userId: 'system', name: '兼职', type: 'income', color: '#b7eb8f', icon: 'clock', tags: ['额外收入', '灵活'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_4', userId: 'system', name: '其他收入', type: 'income', color: '#d9f7be', icon: 'plus', tags: ['其他'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_5', userId: 'system', name: '餐饮', type: 'expense', color: '#ff4d4f', icon: 'coffee', tags: ['日常支出', '餐饮'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_6', userId: 'system', name: '交通', type: 'expense', color: '#ff7875', icon: 'car', tags: ['日常支出', '出行'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_7', userId: 'system', name: '购物', type: 'expense', color: '#ffa39e', icon: 'shopping', tags: ['可选支出', '消费'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_8', userId: 'system', name: '娱乐', type: 'expense', color: '#ffc069', icon: 'smile', tags: ['可选支出', '休闲'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_9', userId: 'system', name: '居住', type: 'expense', color: '#ffd666', icon: 'home', tags: ['固定支出', '住房'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_10', userId: 'system', name: '医疗', type: 'expense', color: '#fff566', icon: 'medicine', tags: ['必要支出', '健康'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_11', userId: 'system', name: '教育', type: 'expense', color: '#d3f261', icon: 'book', tags: ['长期投资', '学习'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_12', userId: 'system', name: '通讯', type: 'expense', color: '#95de64', icon: 'phone', tags: ['日常支出', '通讯'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_13', userId: 'system', name: '人情', type: 'expense', color: '#5cdbd3', icon: 'team', tags: ['社交支出', '人情'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'system_cat_14', userId: 'system', name: '其他支出', type: 'expense', color: '#69c0ff', icon: 'minus', tags: ['其他'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// 存储用户自定义分类
const userCategories: Map<string, Category[]> = new Map();

router.get('/', (req: AuthRequest, res) => {
  try {
    const { type } = req.query;
    
    let categories = [...mockCategories];
    
    // 添加用户自定义分类
    const userCats = userCategories.get(req.user!.id) || [];
    categories = [...categories, ...userCats];
    
    // 按类型过滤
    if (type) {
      categories = categories.filter(cat => cat.type === type);
    }

    // 按用户ID和创建时间排序
    categories.sort((a, b) => {
      if (a.userId === 'system' && b.userId !== 'system') return -1;
      if (a.userId !== 'system' && b.userId === 'system') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败'
    });
  }
});

router.post('/', (req: AuthRequest, res) => {
  try {
    const { name, type, color = '#1890ff', icon = 'tag', parentId, tags = [] } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: '请提供分类名称和类型'
      });
    }

    const categoryId = uuidv4();
    const now = new Date().toISOString();

    const newCategory: Category = {
      id: categoryId,
      userId: req.user!.id,
      name,
      type,
      color,
      icon,
      tags,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    // 存储用户分类
    const userCats = userCategories.get(req.user!.id) || [];
    userCats.push(newCategory);
    userCategories.set(req.user!.id, userCats);

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: newCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: '创建分类失败'
    });
  }
});

router.put('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, type, color, icon, parentId, tags } = req.body;

    // 查找分类
    let categories = userCategories.get(req.user!.id) || [];
    const categoryIndex = categories.findIndex(cat => cat.id === id);

    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '分类不存在或无权限修改'
      });
    }

    const now = new Date().toISOString();

    // 更新分类
    categories[categoryIndex] = {
      ...categories[categoryIndex],
      name: name || categories[categoryIndex].name,
      type: type || categories[categoryIndex].type,
      color: color || categories[categoryIndex].color,
      icon: icon || categories[categoryIndex].icon,
      tags: tags || categories[categoryIndex].tags,
      updatedAt: now
    };

    userCategories.set(req.user!.id, categories);

    res.json({
      success: true,
      message: '分类更新成功',
      data: categories[categoryIndex]
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: '更新分类失败'
    });
  }
});

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 查找分类
    let categories = userCategories.get(req.user!.id) || [];
    const categoryIndex = categories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '分类不存在或无权限删除'
      });
    }

    // 删除分类
    categories.splice(categoryIndex, 1);
    userCategories.set(req.user!.id, categories);

    res.json({
      success: true,
      message: '分类删除成功'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: '删除分类失败'
    });
  }
});

export default router;