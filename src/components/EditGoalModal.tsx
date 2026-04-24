import { useState, useEffect } from 'react';
import type { FC, ChangeEvent, FormEvent } from 'react';
import type { SavingGoal } from '../types';

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Omit<SavingGoal, 'id' | 'createdAt'>) => void;
  goal: SavingGoal | null;
}

const EditGoalModal: FC<EditGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  goal
}) => {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    targetAmount: goal?.targetAmount || 0,
    currentAmount: goal?.currentAmount || 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当 isOpen 变化时重置表单
  useEffect(() => {
    // 当模态框打开时，重置错误状态
    if (isOpen && goal) {
      // 延迟重置错误状态，避免直接在 effect 中调用 setState
      setTimeout(() => {
        setErrors({});
      }, 0);
    }
  }, [isOpen, goal]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入目标名称';
    }

    if (formData.targetAmount <= 0) {
      newErrors.targetAmount = '目标金额必须大于0';
    }

    if (formData.currentAmount < 0) {
      newErrors.currentAmount = '当前金额不能为负数';
    }

    if (formData.currentAmount > formData.targetAmount) {
      newErrors.currentAmount = '当前金额不能大于目标金额';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (validateForm() && goal) {
      onSave(goal.id, {
        title: formData.title,
        targetAmount: formData.targetAmount,
        currentAmount: formData.currentAmount
      });
      onClose();
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen || !goal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>编辑储蓄目标</h2>
          <button className="close-btn" onClick={handleClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">目标名称</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="例如：iPhone 16 Pro"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="targetAmount">目标金额</label>
              <input
                type="number"
                id="targetAmount"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={errors.targetAmount ? 'error' : ''}
              />
              {errors.targetAmount && <span className="error-message">{errors.targetAmount}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="currentAmount">当前已存</label>
              <input
                type="number"
                id="currentAmount"
                name="currentAmount"
                value={formData.currentAmount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={errors.currentAmount ? 'error' : ''}
              />
              {errors.currentAmount && <span className="error-message">{errors.currentAmount}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="action-btn" onClick={handleClose}>
              取消
            </button>
            <button type="submit" className="action-btn primary">
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoalModal;