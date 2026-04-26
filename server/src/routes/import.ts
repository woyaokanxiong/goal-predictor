import { Router } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/json' ||
        file.originalname.endsWith('.csv') ||
        file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('只支持 CSV 和 JSON 文件'));
    }
  }
});

router.use(authMiddleware);

router.post('/csv', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要导入的文件'
      });
    }

    const results: any[] = [];
    const errors: string[] = [];
    const stream = Readable.from(req.file.buffer.toString());

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const now = new Date().toISOString();
    let successCount = 0;

    const getAccountStmt = db.prepare('SELECT id FROM accounts WHERE user_id = ? AND name = ?');
    const getCategoryStmt = db.prepare('SELECT id FROM categories WHERE (user_id = ? OR user_id = ?) AND name = ?');
    const insertTransactionStmt = db.prepare(`
      INSERT INTO transactions 
      (id, user_id, account_id, category_id, type, amount, currency, description, date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      try {
        const date = row['日期'] || row['date'];
        const type = row['类型'] || row['type'];
        const amount = parseFloat(row['金额'] || row['amount']);
        const categoryName = row['分类'] || row['category'];
        const accountName = row['账户'] || row['account'];
        const description = row['备注'] || row['description'] || '';
        const currency = row['货币'] || row['currency'] || 'CNY';

        if (!date || !type || !amount || !categoryName || !accountName) {
          errors.push(`第 ${i + 1} 行: 缺少必要字段`);
          continue;
        }

        const account = getAccountStmt.get(req.user!.id, accountName) as { id: string } | undefined;
        if (!account) {
          errors.push(`第 ${i + 1} 行: 账户 "${accountName}" 不存在`);
          continue;
        }

        const category = getCategoryStmt.get(req.user!.id, 'system', categoryName) as { id: string } | undefined;
        if (!category) {
          errors.push(`第 ${i + 1} 行: 分类 "${categoryName}" 不存在`);
          continue;
        }

        const transactionId = uuidv4();
        insertTransactionStmt.run(
          transactionId,
          req.user!.id,
          account.id,
          category.id,
          type,
          amount,
          currency,
          description,
          date,
          now,
          now
        );

        if (type === 'income') {
          db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(amount, account.id);
        } else if (type === 'expense') {
          db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, account.id);
        }

        successCount++;
      } catch (error) {
        errors.push(`第 ${i + 1} 行: ${(error as Error).message}`);
      }
    }

    res.json({
      success: true,
      message: `导入完成: 成功 ${successCount} 条，失败 ${errors.length} 条`,
      data: {
        total: results.length,
        success: successCount,
        failed: errors.length,
        errors: errors.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Import CSV error:', error);
    res.status(500).json({
      success: false,
      message: '导入CSV失败: ' + (error as Error).message
    });
  }
});

router.post('/json', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要导入的文件'
      });
    }

    const data = JSON.parse(req.file.buffer.toString());
    
    if (!data.data || !data.data.transactions) {
      return res.status(400).json({
        success: false,
        message: '无效的备份文件格式'
      });
    }

    const now = new Date().toISOString();
    const { accounts, categories, budgets, transactions } = data.data;

    const idMapping: { [oldId: string]: string } = {};

    if (accounts) {
      const insertAccount = db.prepare(`
        INSERT INTO accounts (id, user_id, name, type, balance, currency, color, icon, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `);

      for (const account of accounts) {
        const newId = uuidv4();
        idMapping[account.id] = newId;
        
        try {
          insertAccount.run(
            newId,
            req.user!.id,
            account.name,
            account.type,
            account.balance || 0,
            account.currency || 'CNY',
            account.color || '#1890ff',
            account.icon || 'wallet',
            now,
            now
          );
        } catch (error) {
          console.error('Import account error:', error);
        }
      }
    }

    if (categories) {
      const insertCategory = db.prepare(`
        INSERT INTO categories (id, user_id, name, type, color, icon, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      `);

      for (const category of categories) {
        if (category.user_id === 'system') continue;
        
        const newId = uuidv4();
        idMapping[category.id] = newId;
        
        try {
          insertCategory.run(
            newId,
            req.user!.id,
            category.name,
            category.type,
            category.color || '#1890ff',
            category.icon || 'tag',
            now,
            now
          );
        } catch (error) {
          console.error('Import category error:', error);
        }
      }
    }

    if (budgets) {
      const insertBudget = db.prepare(`
        INSERT INTO budgets (id, user_id, category_id, name, amount, period, start_date, end_date, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `);

      for (const budget of budgets) {
        const newId = uuidv4();
        const categoryId = budget.category_id ? idMapping[budget.category_id] : null;
        
        try {
          insertBudget.run(
            newId,
            req.user!.id,
            categoryId,
            budget.name,
            budget.amount,
            budget.period || 'monthly',
            budget.start_date || now,
            budget.end_date || null,
            now,
            now
          );
        } catch (error) {
          console.error('Import budget error:', error);
        }
      }
    }

    let transactionCount = 0;
    if (transactions) {
      const insertTransaction = db.prepare(`
        INSERT INTO transactions 
        (id, user_id, account_id, category_id, type, amount, currency, description, date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const transaction of transactions) {
        const newId = uuidv4();
        const accountId = idMapping[transaction.account_id];
        let categoryId = idMapping[transaction.category_id];
        
        if (!categoryId) {
          const systemCategory = db.prepare('SELECT id FROM categories WHERE user_id = ? AND name = ?')
            .get('system', transaction.category_name) as { id: string } | undefined;
          categoryId = systemCategory?.id;
        }

        if (!accountId || !categoryId) continue;
        
        try {
          insertTransaction.run(
            newId,
            req.user!.id,
            accountId,
            categoryId,
            transaction.type,
            transaction.amount,
            transaction.currency || 'CNY',
            transaction.description || '',
            transaction.date,
            now,
            now
          );
          transactionCount++;
        } catch (error) {
          console.error('Import transaction error:', error);
        }
      }
    }

    res.json({
      success: true,
      message: '数据导入成功',
      data: {
        accounts: accounts?.length || 0,
        categories: categories?.filter((c: any) => c.user_id !== 'system').length || 0,
        budgets: budgets?.length || 0,
        transactions: transactionCount
      }
    });
  } catch (error) {
    console.error('Import JSON error:', error);
    res.status(500).json({
      success: false,
      message: '导入JSON失败: ' + (error as Error).message
    });
  }
});

export default router;