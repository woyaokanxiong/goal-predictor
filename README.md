# 个人记账系统

一款功能完整、用户友好的个人财务管理工具，帮助您记录每一笔收支，掌握财务状况。

## 功能特性

### 核心功能
- 收入与支出记录：支持多账户管理，快速记录日常收支
- 分类统计：按类别、时间周期等多维度统计分析
- 预算设置与跟踪：设定预算目标，实时监控支出情况
- 数据可视化报表：饼图、柱状图、趋势图等多种图表展示
- 数据导入/导出：支持CSV和JSON格式的数据导入导出

### 用户管理
- 用户注册与登录
- JWT身份认证
- 个人资料管理

### 数据安全
- 本地数据库存储
- 数据备份与恢复
- 定期自动备份提醒

### 界面设计
- 简洁直观的操作界面
- 响应式设计，适配桌面和移动设备
- 深色模式支持（开发中）

## 技术栈

### 后端
- Node.js + Express + TypeScript
- SQLite数据库（better-sqlite3）
- JWT认证
- 数据导入导出（CSV/JSON）

### 前端
- React 18 + TypeScript
- Vite构建工具
- Ant Design UI组件库
- ECharts数据可视化
- Zustand状态管理
- React Query数据获取

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd personal-finance-tracker
```

2. 安装依赖
```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd server && npm install

# 安装前端依赖
cd ../client && npm install
```

3. 配置环境变量
```bash
# 后端环境配置
cd server
cp .env.example .env
# 编辑 .env 文件，配置数据库路径和JWT密钥
```

4. 启动开发服务器
```bash
# 在项目根目录下运行
cd ..
npm run dev
```

这将同时启动前端开发服务器（http://localhost:5173）和后端API服务器（http://localhost:3001）。

### 生产部署

1. 构建前端
```bash
cd client
npm run build
```

2. 启动生产服务器
```bash
cd ../server
npm run build
npm start
```

生产环境将自动提供静态文件服务。

## 项目结构

```
personal-finance-tracker/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── components/    # 公共组件
│   │   ├── pages/         # 页面组件
│   │   ├── store/         # 状态管理
│   │   ├── types/         # TypeScript类型定义
│   │   └── utils/         # 工具函数
│   └── package.json
├── server/                # 后端项目
│   ├── src/
│   │   ├── database/      # 数据库配置
│   │   ├── middleware/    # 中间件
│   │   ├── routes/        # API路由
│   │   └── types/         # TypeScript类型定义
│   └── package.json
└── package.json
```

## 使用指南

### 1. 注册与登录
- 首次使用需要注册账号
- 支持用户名/邮箱登录
- 登录状态保持7天

### 2. 添加账户
- 进入"账户"页面
- 添加您的现金、银行卡、信用卡等账户
- 设置初始余额

### 3. 设置分类
- 系统预设了常用收支分类
- 可根据需要添加自定义分类
- 为分类设置颜色和图标便于识别

### 4. 记录交易
- 点击"记一笔"快速记录收支
- 选择账户、分类、输入金额和备注
- 支持批量导入历史数据

### 5. 设置预算
- 为不同分类设置月度/年度预算
- 实时监控预算执行情况
- 超支时自动提醒

### 6. 查看统计
- 仪表盘展示资产概览
- 统计报表提供多维度分析
- 趋势图表帮助了解收支变化

### 7. 数据备份
- 定期导出数据备份
- 支持CSV和JSON格式
- 可随时恢复历史数据

## API文档

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 账户管理
- `GET /api/accounts` - 获取账户列表
- `POST /api/accounts` - 创建账户
- `PUT /api/accounts/:id` - 更新账户
- `DELETE /api/accounts/:id` - 删除账户

### 分类管理
- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

### 交易记录
- `GET /api/transactions` - 获取交易列表
- `POST /api/transactions` - 创建交易
- `PUT /api/transactions/:id` - 更新交易
- `DELETE /api/transactions/:id` - 删除交易

### 预算管理
- `GET /api/budgets` - 获取预算列表
- `POST /api/budgets` - 创建预算
- `PUT /api/budgets/:id` - 更新预算
- `DELETE /api/budgets/:id` - 删除预算

### 统计报表
- `GET /api/statistics/summary` - 获取统计摘要
- `GET /api/statistics/by-category` - 按分类统计
- `GET /api/statistics/trend` - 获取趋势数据
- `GET /api/statistics/dashboard` - 获取仪表盘数据

### 数据导入导出
- `GET /api/export/csv` - 导出CSV
- `GET /api/export/json` - 导出JSON备份
- `POST /api/import/csv` - 导入CSV
- `POST /api/import/json` - 导入JSON备份

## 开发计划

- [x] 基础功能开发
- [x] 数据可视化
- [x] 数据导入导出
- [ ] 云端同步
- [ ] 多币种支持
- [ ] 账单提醒
- [ ] 财务报表PDF导出
- [ ] 移动端App

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎联系：
- 邮箱：your-email@example.com
- GitHub Issues

---

**祝您理财愉快！**