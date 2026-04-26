import { Router } from 'express';
import { format } from 'date-fns';
import { writeToString } from 'fast-csv';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/csv', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    let query = `
      SELECT 
        t.date as '日期',
        t.type as '类型',
        t.amount as '金额',
        t.currency as '货币',
        c.name as '分类',
        a.name as '账户',
        t.description as '备注',
        t.tags as '标签',
        t.location as '位置'
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params: any[] = [req.user!.id];

    if (startDate) {
      query += ' AND t.date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND t.date <= ?';
      params.push(endDate);
    }

    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    query += ' ORDER BY t.date DESC';

    const transactions = db.prepare(query).all(...params);

    const csv = await writeToString(transactions, {
      headers: true,
      writeHeaders: true
    });

    const filename = `transactions_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      message: '导出CSV失败'
    });
  }
});

router.get('/json', (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    const transactionsQuery = `
      SELECT t.*, c.name as category_name, a.name as account_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
      ${startDate ? 'AND t.date >= ?' : ''}
      ${endDate ? 'AND t.date <= ?' : ''}
      ORDER BY t.date DESC
    `;
    const transactionParams: any[] = [req.user!.id];
    if (startDate) transactionParams.push(startDate);
    if (endDate) transactionParams.push(endDate);

    const accounts = db.prepare('SELECT * FROM accounts WHERE user_id = ? AND is_active = 1').all(req.user!.id);
    const categories = db.prepare('SELECT * FROM categories WHERE (user_id = ? OR user_id = ?) AND is_active = 1').all(req.user!.id, 'system');
    const budgets = db.prepare('SELECT * FROM budgets WHERE user_id = ? AND is_active = 1').all(req.user!.id);
    const transactions = db.prepare(transactionsQuery).all(...transactionParams);

    const exportData = {
      exportDate: new Date().toISOString(),
      userId: req.user!.id,
      data: {
        accounts,
        categories,
        budgets,
        transactions
      }
    };

    const filename = `finance_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({
      success: false,
      message: '导出JSON失败'
    });
  }
});

export default router;