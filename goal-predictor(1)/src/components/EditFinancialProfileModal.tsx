import { useState, useEffect, useCallback } from 'react';
import type { FC, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import type { FinancialProfile, FixedExpenseCategory } from '../types';

interface EditFinancialProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: FinancialProfile) => void;
  financialProfile: FinancialProfile;
}

const EditFinancialProfileModal: FC<EditFinancialProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  financialProfile
}) => {
  const [formData, setFormData] = useState<FinancialProfile>({
    monthlyIncome: financialProfile.monthlyIncome,
    fixedExpenses: financialProfile.fixedExpenses,
    averageVariableExpenses: financialProfile.averageVariableExpenses,
    currentBalance: financialProfile.currentBalance,
    fixedExpenseCategories: financialProfile.fixedExpenseCategories || []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newCategory, setNewCategory] = useState<Omit<FixedExpenseCategory, 'id'>>({
    name: '',
    amount: 0
  });

  const handleClose = useCallback(() => {
    setFormData({
      monthlyIncome: financialProfile.monthlyIncome,
      fixedExpenses: financialProfile.fixedExpenses,
      averageVariableExpenses: financialProfile.averageVariableExpenses,
      currentBalance: financialProfile.currentBalance,
      fixedExpenseCategories: financialProfile.fixedExpenseCategories || []
    });
    setErrors({});
    setNewCategory({ name: '', amount: 0 });
    onClose();
  }, [financialProfile, onClose]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        monthlyIncome: financialProfile.monthlyIncome,
        fixedExpenses: financialProfile.fixedExpenses,
        averageVariableExpenses: financialProfile.averageVariableExpenses,
        currentBalance: financialProfile.currentBalance,
        fixedExpenseCategories: financialProfile.fixedExpenseCategories || []
      });
      setErrors({});
      setNewCategory({ name: '', amount: 0 });
    }
  }, [financialProfile, isOpen]);

  useEffect(() => {
    const handleEscapeKey = (e: unknown) => {
      if ((e as KeyboardEvent).key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey as EventListener);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey as EventListener);
    };
  }, [isOpen, handleClose]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLInputElement>, categoryId: string) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      fixedExpenseCategories: prev.fixedExpenseCategories?.map(category => 
        category.id === categoryId 
          ? { ...category, [name]: type === 'number' ? parseFloat(value) || 0 : value }
          : category
      ) || []
    }));
  };

  const handleNewCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setNewCategory(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const addCategory = () => {
    if (newCategory.name && newCategory.amount > 0) {
      const category: FixedExpenseCategory = {
        id: crypto.randomUUID(),
        name: newCategory.name,
        amount: newCategory.amount
      };
      setFormData(prev => ({
        ...prev,
        fixedExpenseCategories: [...(prev.fixedExpenseCategories || []), category]
      }));
      setNewCategory({ name: '', amount: 0 });
    }
  };

  const presetCategories = [
    '房租', '水电费', '网费', '手机话费', '交通费', '餐饮费', 
    '物业费', '保险费', '教育费', '医疗费', '会员费', '其他'
  ];

  const removeCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      fixedExpenseCategories: prev.fixedExpenseCategories?.filter(category => category.id !== categoryId) || []
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.monthlyIncome < 0) {
      newErrors.monthlyIncome = '月收入不能为负数';
    }

    if (formData.fixedExpenses < 0) {
      newErrors.fixedExpenses = '固定支出不能为负数';
    }

    if (formData.averageVariableExpenses < 0) {
      newErrors.averageVariableExpenses = '浮动支出不能为负数';
    }

    if (formData.currentBalance < 0) {
      newErrors.currentBalance = '当前余额不能为负数';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>编辑财务档案</h2>
          <button className="close-btn" onClick={handleClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="monthlyIncome">月收入</label>
            <input
              type="number"
              id="monthlyIncome"
              name="monthlyIncome"
              value={formData.monthlyIncome}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={errors.monthlyIncome ? 'error' : ''}
            />
            {errors.monthlyIncome && <span className="error-message">{errors.monthlyIncome}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="fixedExpenses">固定支出</label>
            <input
              type="number"
              id="fixedExpenses"
              name="fixedExpenses"
              value={formData.fixedExpenses}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={errors.fixedExpenses ? 'error' : ''}
            />
            {errors.fixedExpenses && <span className="error-message">{errors.fixedExpenses}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="averageVariableExpenses">浮动支出</label>
            <input
              type="number"
              id="averageVariableExpenses"
              name="averageVariableExpenses"
              value={formData.averageVariableExpenses}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={errors.averageVariableExpenses ? 'error' : ''}
            />
            {errors.averageVariableExpenses && <span className="error-message">{errors.averageVariableExpenses}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="currentBalance">当前余额</label>
            <input
              type="number"
              id="currentBalance"
              name="currentBalance"
              value={formData.currentBalance}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={errors.currentBalance ? 'error' : ''}
            />
            {errors.currentBalance && <span className="error-message">{errors.currentBalance}</span>}
          </div>

          <div className="form-group">
            <label>固定支出分类</label>
            <div className="fixed-expense-categories">
              {formData.fixedExpenseCategories?.map(category => (
                <div key={category.id} className="fixed-expense-category">
                  <input
                    type="text"
                    name="name"
                    value={category.name}
                    onChange={(e) => handleCategoryChange(e, category.id)}
                    placeholder="分类名称"
                  />
                  <input
                    type="number"
                    name="amount"
                    value={category.amount}
                    onChange={(e) => handleCategoryChange(e, category.id)}
                    placeholder="金额"
                    step="0.01"
                    min="0"
                  />
                  <button 
                    type="button" 
                    className="remove-category-btn"
                    onClick={() => removeCategory(category.id)}
                  >
                    删除
                  </button>
                </div>
              )) || <p>暂无固定支出分类</p>}
              
              <div className="add-category">
                <div className="category-selector">
                  <label htmlFor="preset-category">选择预设分类：</label>
                  <select 
                    id="preset-category"
                    onChange={(e) => {
                      if (e.target.value) {
                        setNewCategory(prev => ({ ...prev, name: e.target.value }));
                      }
                    }}
                  >
                    <option value="">-- 选择分类 --</option>
                    {presetCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="input-row">
                  <input
                    type="text"
                    name="name"
                    value={newCategory.name}
                    onChange={handleNewCategoryChange}
                    placeholder="或输入自定义分类"
                  />
                  <input
                    type="number"
                    name="amount"
                    value={newCategory.amount}
                    onChange={handleNewCategoryChange}
                    placeholder="金额"
                    step="0.01"
                    min="0"
                  />
                  <button 
                    type="button" 
                    className="add-category-btn"
                    onClick={addCategory}
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="action-btn" onClick={handleClose}>
              取消
            </button>
            <button type="submit" className="action-btn primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFinancialProfileModal;