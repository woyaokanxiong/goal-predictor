# 🚀 GitHub Pages 快速部署指南

## 最简单的部署方法 - 手动上传

### 准备工作（1分钟）

1. **解压文件**
   - 找到：`e:\daima\goal-predictor\goal-predictor-v1.0.0.zip`
   - 右键解压，得到 `dist` 文件夹

2. **检查文件**
   - 打开 `dist` 文件夹
   - 确保包含：`index.html`、`assets` 文件夹等

### 部署步骤（10分钟）

#### 第1步：创建 GitHub 仓库（2分钟）

1. **登录 GitHub**
   - 访问：https://github.com
   - 登录或注册账号

2. **创建仓库**
   - 点击右上角 "+" → "New repository"
   - 仓库名：`goal-predictor`（或其他名称）
   - 选择 Public 或 Private
   - **不要**勾选 "Initialize with README"
   - 点击 "Create repository"

#### 第2步：上传文件（5分钟）

1. **进入上传页面**
   - 在新仓库页面，点击 "uploading an existing file"

2. **上传文件**
   - 将 `dist` 文件夹中的所有文件拖拽到上传区域
   - 或逐个上传：
     - `index.html`
     - `assets` 文件夹（拖拽整个文件夹）
     - `favicon.svg`
     - `icons.svg`

3. **提交文件**
   - Commit message: `Initial commit`
   - 点击 "Commit changes"

#### 第3步：启用 GitHub Pages（3分钟）

1. **进入设置**
   - 在仓库页面，点击 "Settings"

2. **配置 Pages**
   - 左侧菜单找到 "Pages"
   - Source: 选择 "Deploy from a branch"
   - Branch: 选择 `main` 分支
   - Folder: 选择 `/ (root)`
   - 点击 "Save"

3. **等待部署**
   - 等待 1-2 分钟
   - 部署完成后会显示网站地址

#### 第4步：访问网站（即时）

1. **获取地址**
   - 在 Pages 设置页面查看网站地址
   - 格式：`https://your-username.github.io/repository-name/`

2. **访问网站**
   - 点击链接，您的网站就上线了！

## 自定义网站地址

### 修改仓库名称

1. 在仓库设置中，点击 "General"
2. 修改仓库名称
3. 网站地址会自动更新

### 使用自定义域名

#### 获取免费域名

**Freenom（推荐）**
- 访问：https://www.freenom.com/
- 注册免费域名：`.tk`, `.ml`, `.ga`, `.cf`

**EU.org**
- 访问：https://nic.eu.org/
- 申请免费 `.eu.org` 域名

#### 配置域名

1. **在 GitHub Pages 中添加域名**
   - Settings → Pages
   - Custom domain: 输入您的域名
   - 点击 "Save"

2. **配置 DNS**
   - 在域名注册商控制面板
   - 添加 CNAME 记录：
     - Host: `@`
     - Value: `your-username.github.io`

3. **启用 HTTPS**
   - 在 GitHub Pages 设置中
   - 勾选 "Enforce HTTPS"

## 更新网站

### 手动更新

1. 修改代码，重新构建：`npm run build`
2. 在 GitHub 仓库页面点击 "uploading an existing file"
3. 上传新的 `dist` 文件夹内容
4. 提交更改

### 使用 Git（推荐）

```bash
# 进入项目目录
cd e:\daima\goal-predictor

# 重新构建
npm run build

# 提交更改
git add dist/
git commit -m "Update website"
git push
```

## 自动部署（高级）

### 使用 GitHub Actions

1. 创建 `.github/workflows/deploy.yml`：
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
         - name: Install dependencies
           run: npm ci
         - name: Build
           run: npm run build
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

2. 提交并推送，GitHub 会自动构建和部署

## 常见问题

### Q: 部署后网站打不开？
A:
- 检查 `index.html` 是否在根目录
- 等待几分钟让部署完成
- 检查仓库设置中的 Pages 配置

### Q: 样式加载失败？
A:
- 确认 `assets` 文件夹已正确上传
- 检查文件路径是否正确
- 清除浏览器缓存

### Q: 如何删除网站？
A:
- 在仓库设置中禁用 GitHub Pages
- 或删除整个仓库

### Q: 有流量限制吗？
A:
- 每月 100GB 带宽，个人使用完全足够

### Q: 数据会丢失吗？
A:
- 数据存储在浏览器本地，不会因为网站更新而丢失

## 成本对比

| 项目 | 成本 |
|------|------|
| GitHub Pages | 免费 |
| 自定义域名 | 免费（Freenom）或 $10-15/年 |
| SSL 证书 | 免费 |
| 总成本 | $0 |

## 优势总结

✅ **完全免费** - 无需任何费用  
✅ **稳定可靠** - GitHub 基础设施  
✅ **版本控制** - Git 管理代码  
✅ **自动HTTPS** - 安全加密  
✅ **自定义域名** - 支持绑定  
✅ **CI/CD** - 支持自动部署  

## 快速开始

**最简单的方法：**
1. 解压 `goal-predictor-v1.0.0.zip`
2. 在 GitHub 创建仓库
3. 上传 `dist` 文件夹内容
4. 启用 GitHub Pages
5. 完成！

**预计时间：10分钟**  
**总成本：$0**  
**技术要求：零基础**

现在就开始部署您的个人财务管理系统到 GitHub Pages 吧！