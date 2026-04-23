import { useState } from 'react';
import type { FC, ChangeEvent, FormEvent } from 'react';
import type { Transaction } from '../types';
import dayjs from 'dayjs';

interface CalendarViewProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Transaction) => void;
}

const CalendarView: FC<CalendarViewProps> = ({ transactions, onAddTransaction }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: 0,
    category: '餐饮',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateCalendar = () => {
    const year = currentMonth.year();
    const month = currentMonth.month();
    const firstDayOfMonth = dayjs(new Date(year, month, 1));
    const lastDayOfMonth = dayjs(new Date(year, month + 1, 0));
    const startDate = firstDayOfMonth.startOf('week');
    const endDate = lastDayOfMonth.endOf('week');

    const calendarDays: dayjs.Dayjs[] = [];
    let currentDate = startDate;

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      calendarDays.push(currentDate);
      currentDate = currentDate.add(1, 'day');
    }

    return calendarDays;
  };

  const getDayTransactions = (date: dayjs.Dayjs) => {
    return transactions.filter(transaction => {
      const transactionDate = dayjs(transaction.date);
      return transactionDate.isSame(date, 'day');
    });
  };

  const getDayBalance = (date: dayjs.Dayjs) => {
    const dayTransactions = getDayTransactions(date);
    return dayTransactions.reduce((balance, transaction) => {
      return transaction.type === 'income'
        ? balance + transaction.amount
        : balance - transaction.amount;
    }, 0);
  };

  const handleDateSelect = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
    setIsDetailModalOpen(true);
  };

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (validateForm() && selectedDate) {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: formData.type,
        amount: formData.amount,
        category: formData.category,
        date: selectedDate.toDate(),
        description: formData.description
      };
      onAddTransaction(newTransaction);
      setIsAddModalOpen(false);

      setFormData({
        type: 'expense',
        amount: 0,
        category: '餐饮',
        description: ''
      });
    }
  };

  const openAddModal = () => {
    setIsDetailModalOpen(false);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setFormData({
      type: 'expense',
      amount: 0,
      category: '餐饮',
      description: ''
    });
    setErrors({});
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  const calendarDays = generateCalendar();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button
          className="calendar-nav-button"
          onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
        >
          &lt;
        </button>
        <h3>{currentMonth.format('YYYY年MM月')}</h3>
        <button
          className="calendar-nav-button"
          onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
        >
          &gt;
        </button>
      </div>

      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-days">
        {calendarDays.map((date, index) => {
          const dayTransactions = getDayTransactions(date);
          const dayBalance = getDayBalance(date);
          const isCurrentMonth = date.month() === currentMonth.month();
          const isToday = date.isSame(dayjs(), 'day');

          return (
            <div
              key={index}
              className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => isCurrentMonth && handleDateSelect(date)}
            >
              <div className="day-number">{date.date()}</div>
              {dayTransactions.length > 0 && (
                <div className="day-transactions">
                  {dayTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className={`transaction-item ${transaction.type}`}
                    >
                      <span className="transaction-amount">
                        {transaction.type === 'income' ? '+' : '-'}
                        ¥{transaction.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className={`day-balance ${dayBalance >= 0 ? 'positive' : 'negative'}`}>
                    余额: {dayBalance >= 0 ? '+' : ''}¥{dayBalance.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isDetailModalOpen && selectedDate && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal transaction-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDate.format('YYYY年MM月DD日')} 交易详情</h2>
              <button className="close-btn" onClick={closeDetailModal}>&times;</button>
            </div>

            <div className="transaction-details">
              {getDayTransactions(selectedDate).length > 0 ? (
                <>
                  <h3>当日交易记录</h3>
                  <div className="transaction-list">
                    {getDayTransactions(selectedDate).map(transaction => (
                      <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                        <div className="transaction-info">
                          <div className="transaction-category">{transaction.category}</div>
                          {transaction.description && (
                            <div className="transaction-description">{transaction.description}</div>
                          )}
                        </div>
                        <div className="transaction-amount">
                          {transaction.type === 'income' ? '+' : '-'}
                          ¥{transaction.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="day-summary">
                    <div className={`day-balance ${getDayBalance(selectedDate) >= 0 ? 'positive' : 'negative'}`}>
                      当日余额: {getDayBalance(selectedDate) >= 0 ? '+' : ''}¥{getDayBalance(selectedDate).toFixed(2)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <p>当日暂无交易记录</p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="action-btn"
                onClick={closeDetailModal}
              >
                关闭
              </button>
              <button
                className="action-btn primary"
                onClick={openAddModal}
              >
                添加交易
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && selectedDate && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加交易记录 - {selectedDate.format('YYYY年MM月DD日')}</h2>
              <button className="close-btn" onClick={closeAddModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
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

              <div className="modal-actions">
                <button type="button" className="action-btn" onClick={closeAddModal}>
                  取消
                </button>
                <button type="submit" className="action-btn primary">
                  保存记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;