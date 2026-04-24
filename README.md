# 个人财务管理 (Personal Finance Manager)

一个基于 React + TypeScript + Vite 构建的个人记账和财务管理应用，支持跨浏览器数据同步。

## 功能特性

- **储蓄目标管理**: 创建、编辑和删除储蓄目标，追踪目标进度
- **财务档案**: 记录月收入、固定支出和可变支出
- **交易记录**: 支持收入和支出记录，分类管理财务流水
- **日历视图**: 以日历形式查看日常交易记录
- **仪表盘**: 可视化展示财务数据和目标进度
- **数据同步**: 基于 Firebase 实现跨浏览器数据同步
- **导入/导出**: 支持 JSON 格式数据备份和恢复

## 技术栈

- **前端框架**: React 19
- **类型系统**: TypeScript
- **构建工具**: Vite
- **数据库**: Firebase Firestore
- **认证**: Firebase Anonymous Authentication
- **图表库**: Recharts
- **日期处理**: Day.js

## 项目结构

```
goal-predictor/
├── public/
│   ├── favicon.svg       # 网站图标
│   └── icons.svg        # 图标资源
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # React 组件
│   │   ├── AddGoalModal.tsx           # 添加目标弹窗
│   │   ├── AddTransactionModal.tsx    # 添加交易弹窗
│   │   ├── CalendarView.tsx          # 日历视图
│   │   ├── Dashboard.tsx             # 仪表盘
│   │   ├── EditFinancialProfileModal.tsx  # 编辑财务档案弹窗
│   │   ├── EditGoalModal.tsx         # 编辑目标弹窗
│   │   ├── FixedExpenseCard.tsx      # 固定支出卡片
│   │   └── GoalCard.tsx             # 目标卡片
│   ├── types/
│   │   └── index.ts                 # TypeScript 类型定义
│   ├── utils/
│   │   ├── firebase.ts              # Firebase 配置和工具函数
│   │   └── GoalPredictor.ts        # 目标预测工具
│   ├── App.css                      # 应用样式
│   ├── App.tsx                      # 主应用组件
│   ├── index.css                    # 全局样式
│   └── main.tsx                     # 应用入口
├── index.html                      # HTML 入口文件
├── package.json                     # 依赖配置
├── tsconfig.json                    # TypeScript 配置
├── vite.config.ts                   # Vite 配置
└── eslint.config.js                  # ESLint 配置
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:5173/ 启动。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览生产版本

```bash
npm run preview
```

## 数据存储

应用使用 Firebase Firestore 进行数据存储：

- **匿名认证**: 用户通过 Firebase Anonymous Authentication 自动登录
- **数据隔离**: 每个用户的数据独立存储，通过用户 ID 隔离
- **实时同步**: 使用 Firestore onSnapshot 实现数据的实时同步
- **离线支持**: 数据首先保存到 localStorage，确保离线可用

## 使用说明

### 传统模式

1. 设置财务档案（输入月收入、固定支出等）
2. 创建储蓄目标
3. 添加交易记录
4. 系统自动计算目标进度

### 日历模式

1. 在日历中查看每日交易记录
2. 点击日期添加新的交易
3. 直观了解收支分布

### 仪表盘模式

1. 查看财务数据可视化图表
2. 了解储蓄目标完成情况
3. 快速访问财务档案编辑

### 数据备份

- **导出数据**: 点击"导出数据"按钮下载 JSON 文件
- **导入数据**: 点击"导入数据"按钮选择 JSON 文件恢复数据

## 部署

### GitHub Pages

1. 构建生产版本：`npm run build`
2. 将 `dist` 目录内容推送到 `gh-pages` 分支
3. 访问 `https://[username].github.io/[repo-name]/`

### Netlify

1. 连接 GitHub 仓库
2. 设置构建命令：`npm run build`
3. 设置发布目录：`dist`

## License

MIT License
