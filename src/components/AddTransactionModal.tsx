import { useState } from 'react';
import type { FC, ChangeEvent, FormEvent } from 'react';
import type { Transaction } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}

const AddTransactionModal: FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: 0,
    category: '餐饮',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (formData.amount <= 0) {
      newErrors.amount = '金额必须大于0';
    }
    
    if (!formData.category) {
      newErrors.category = '请选择分类';
    }
    
    if (!formData.date) {
      newErrors.date = '请选择日期';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: formData.type,
        amount: formData.amount,
        category: formData.category,
        date: new Date(formData.date),
        description: formData.description
      };
      onSave(newTransaction);
      onClose();
      
      // 重置表单
      setFormData({
        type: 'expense',
        amount: 0,
        category: '餐饮',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>添加交易记录</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="goal-form">
          <div className="form-group">
            <label>交易类型</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={handleInputChange}
                />
                支出
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={handleInputChange}
                />
                收入
              </label>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">金额</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={errors.amount ? 'error' : ''}
              />
              {errors.amount && <span className="error-message">{errors.amount}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="category">分类</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={errors.category ? 'error' : ''}
              >
                <option value="餐饮">餐饮</option>
                <option value="购物">购物</option>
                <option value="交通">交通</option>
                <option value="娱乐">娱乐</option>
                <option value="房租">房租</option>
                <option value="水电费">水电费</option>
                <option value="工资">工资</option>
                <option value="奖金">奖金</option>
                <option value="其他">其他</option>
              </select>
              {errors.category && <span className="error-message">{errors.category}</span>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">日期</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={errors.date ? 'error' : ''}
              />
              {errors.date && <span className="error-message">{errors.date}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="description">描述</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="可选"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="button secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="button primary">
              保存记录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;