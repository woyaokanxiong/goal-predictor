import { useState, useMemo } from 'react';
import type { FC, ChangeEvent, FormEvent } from 'react';
import type { SavingGoal, FinancialProfile } from '../types';
import { GoalPredictor } from '../utils/GoalPredictor';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<SavingGoal, 'id' | 'createdAt'>) => void;
  financialProfile: FinancialProfile;
}

const AddGoalModal: FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  financialProfile
}) => {
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: 0,
    currentAmount: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const prediction = useMemo(() => {
    if (formData.targetAmount > 0) {
      const tempGoal: SavingGoal = {
        id: 'temp',
        title: formData.title,
        targetAmount: formData.targetAmount,
        currentAmount: formData.currentAmount,
        createdAt: new Date()
      };
      return GoalPredictor.predict(tempGoal, financialProfile);
    }
    return null;
  }, [formData, financialProfile]);

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

    if (validateForm()) {
      onSave({
        title: formData.title,
        targetAmount: formData.targetAmount,
        currentAmount: formData.currentAmount
      });

      setFormData({
        title: '',
        targetAmount: 0,
        currentAmount: 0
      });
      setErrors({});
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      targetAmount: 0,
      currentAmount: 0
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>添加储蓄目标</h2>
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

          {prediction && (
            <div className="prediction-preview">
              <h3>预测结果</h3>
              <div className="prediction-grid">
                <div className="prediction-item">
                  <span className="prediction-label">每月需存</span>
                  <span className="prediction-value">{GoalPredictor.formatCurrency(prediction.monthlyRequired)}</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">预计月数</span>
                  <span className="prediction-value">{prediction.estimatedMonths} 个月</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">预计达成时间</span>
                  <span className="prediction-value">{GoalPredictor.formatDate(prediction.estimatedCompletionDate)}</span>
                </div>
                <div className={`prediction-item feasibility ${prediction.isFeasible ? 'feasible' : 'not-feasible'}`}>
                  <span className="prediction-label">可行性</span>
                  <span className="prediction-value">{prediction.isFeasible ? '可行' : '不可行'}</span>
                </div>
              </div>

              {!prediction.isFeasible && prediction.recommendations.length > 0 && (
                <div className="recommendations-preview">
                  <h4>建议：</h4>
                  <ul>
                    {prediction.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="action-btn" onClick={handleClose}>
              取消
            </button>
            <button type="submit" className="action-btn primary">
              保存目标
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;