# 个人财务管理系统部署说明

## 项目简介

本项目是一个个人财务管理系统，包含以下功能：
- 每日支出跟踪
- 日历视图收支记录
- 储蓄目标预测
- 数据本地持久化
- 固定支出管理
- 收支统计仪表盘

## 技术栈

- 前端：React + TypeScript + Vite
- 样式：CSS3
- 图表：Recharts
- 日期处理：Day.js

## 构建产物

构建完成后，生成的文件包括：

- `index.html` - 主HTML文件
- `assets/index-DOtk92XL.js` - 压缩后的JavaScript文件
- `assets/index-DlukyFmw.css` - 压缩后的CSS文件
- `favicon.svg` - 网站图标
- `icons.svg` - 图标文件

## 部署步骤

### 方法一：本地部署

1. 将构建产物复制到本地服务器目录
2. 使用任何静态文件服务器托管这些文件
   - 例如：`npx serve dist`
   - 或：`python -m http.server 8000`
   - 或：`http-server dist`

### 方法二：在线部署

1. **GitHub Pages**：
   - 将构建产物推送到GitHub仓库
   - 在仓库设置中启用GitHub Pages
   - 选择`dist`目录作为发布源

2. **Vercel**：
   - 连接GitHub仓库到Vercel
   - 配置构建命令为：`npm run build`
   - 配置输出目录为：`dist`

3. **Netlify**：
   - 连接GitHub仓库到Netlify
   - 配置构建命令为：`npm run build`
   - 配置发布目录为：`dist`

## 数据持久化

本项目使用localStorage进行数据持久化，所有数据存储在浏览器本地，无需后端服务。

## 浏览器兼容性

支持现代浏览器：
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 性能优化

- 代码分割：使用动态导入减少初始加载时间
- 资源压缩：JavaScript和CSS文件已压缩
- 缓存策略：静态资源使用哈希命名，支持长期缓存

## 版本信息

- 版本：1.0.0
- 构建日期：2026-04-22
- 构建工具：Vite 8.0.9
- TypeScript版本：5.0+

## 常见问题

### 1. 数据丢失

- **原因**：浏览器清除了localStorage数据
- **解决方案**：定期导出数据备份

### 2. 页面加载缓慢

- **原因**：初始JavaScript文件较大
- **解决方案**：使用代码分割和懒加载

### 3. 功能异常

- **原因**：浏览器兼容性问题
- **解决方案**：使用现代浏览器访问

## 开发模式

如果需要进行开发，可使用以下命令：

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行代码检查
npm run lint

# 构建生产版本
npm run build
```

## 联系信息

如有问题或建议，欢迎联系项目维护者。