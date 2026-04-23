# GitHub Pages 部署指南

## 为什么选择 GitHub Pages？

- **完全免费**：GitHub 提供的免费静态网站托管服务
- **稳定可靠**：GitHub 基础设施，99.9% 在线时间
- **自动HTTPS**：免费 SSL 证书
- **支持自定义域名**：可以绑定自己的域名
- **版本控制**：Git 版本管理，便于回滚
- **CI/CD**：支持自动部署

## 部署步骤

### 方法一：手动上传（最简单）

#### 第1步：准备文件

1. **解压构建产物**
   - 找到文件：`e:\daima\goal-predictor\goal-predictor-v1.0.0.zip`
   - 解压该文件，得到 `dist` 文件夹

2. **检查文件结构**
   ```
   dist/
   ├── index.html
   ├── assets/
   │   ├── index-DOtk92XL.js
   │   └── index-DlukyFmw.css
   ├── favicon.svg
   ├── icons.svg
   └── DEPLOYMENT.md
   ```

#### 第2步：创建 GitHub 仓库

1. **登录 GitHub**
   - 访问：https://github.com
   - 登录您的账号（如果没有，先注册）

2. **创建新仓库**
   - 点击右上角的 "+" → "New repository"
   - 仓库名称：例如 `goal-predictor`
   - 描述：个人财务管理系统
   - 设置为 Public（公开）或 Private（私有）
   - **不要**勾选 "Initialize this repository with a README"
   - 点击 "Create repository"

#### 第3步：上传文件

1. **上传文件到 GitHub**
   - 在新创建的仓库页面，点击 "uploading an existing file"
   - 将 `dist` 文件夹中的所有文件拖拽到上传区域
   - 或者逐个上传文件：
     - 先上传 `index.html`
     - 然后上传 `assets` 文件夹
     - 最后上传其他文件

2. **提交文件**
   - 在 "Commit changes" 框中输入提交信息：
     - Title: `Initial commit`
     - Description: `部署个人财务管理系统`
   - 点击 "Commit changes"

#### 第4步：启用 GitHub Pages

1. **进入仓库设置**
   - 在仓库页面，点击 "Settings" 标签

2. **配置 Pages**
   - 在左侧菜单中找到 "Pages"（在 "Code and automation" 部分）
   - 在 "Build and deployment" 部分：
     - Source: 选择 "Deploy from a branch"
     - Branch: 选择 `main` 分支
     - Folder: 选择 `/ (root)` 目录
   - 点击 "Save"

3. **等待部署**
   - GitHub 会自动部署您的网站
   - 通常需要 1-2 分钟
   - 部署完成后，页面会显示您的网站地址

#### 第5步：访问网站

1. **获取网站地址**
   - 在 Pages 设置页面，您会看到网站地址
   - 格式：`https://your-username.github.io/repository-name/`
   - 例如：`https://johnsmith.github.io/goal-predictor/`

2. **访问网站**
   - 点击该链接，您的网站就上线了！

### 方法二：使用 Git 命令行（推荐）

#### 第1步：安装 Git

1. **下载 Git**
   - 访问：https://git-scm.com/download/win
   - 下载 Windows 版本
   - 安装时使用默认设置

2. **验证安装**
   ```bash
   git --version
   ```

#### 第2步：配置 Git

1. **设置用户信息**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

#### 第3步：创建 GitHub 仓库

1. 在 GitHub 上创建新仓库（同方法一）
2. 不要初始化 README

#### 第4步：初始化本地仓库

```bash
# 进入项目目录
cd e:\daima\goal-predictor

# 初始化 Git 仓库
git init

# 添加所有文件
git add dist/

# 提交更改
git commit -m "Initial commit: Deploy goal predictor"
```

#### 第5步：推送到 GitHub

```bash
# 添加远程仓库
git remote add origin https://github.com/your-username/goal-predictor.git

# 推送到 GitHub
git push -u origin main
```

#### 第6步：启用 GitHub Pages

按照方法一的步骤启用 GitHub Pages。

### 方法三：使用 GitHub Actions（自动化部署）

#### 第1步：创建工作流文件

1. 在项目根目录创建 `.github/workflows/deploy.yml`：
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

#### 第2步：提交工作流文件

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow"
git push
```

#### 第3步：启用 GitHub Pages

1. 在仓库设置中启用 GitHub Pages
2. Source 选择 "GitHub Actions"

#### 第4步：自动部署

以后每次推送到 `main` 分支，GitHub Actions 会自动构建并部署。

## 自定义域名

### 获取免费域名

#### Freenom
1. 访问：https://www.freenom.com/
2. 搜索并注册免费域名（.tk, .ml, .ga, .cf）
3. 完成注册流程

#### EU.org
1. 访问：https://nic.eu.org/
2. 申请免费 .eu.org 域名
3. 等待审核

### 配置 DNS

1. **在 GitHub Pages 设置中添加域名**
   - 进入仓库 → Settings → Pages
   - 在 "Custom domain" 中输入您的域名
   - 点击 "Save"

2. **配置 DNS 记录**
   - 在域名注册商的控制面板中
   - 添加 CNAME 记录：
     - Host: `@` 或 `www`
     - Value: `your-username.github.io`
   - 或添加 A 记录：
     - Host: `@`
     - Value: `185.199.108.153`（或其他 GitHub IP）

3. **启用 HTTPS**
   - 在 GitHub Pages 设置中
   - 勾选 "Enforce HTTPS"
   - 等待 SSL 证书生成

## 更新网站

### 手动更新

1. **修改代码**
   - 编辑源代码
   - 重新构建：`npm run build`

2. **上传新文件**
   - 在 GitHub 仓库页面
   - 点击 "uploading an existing file"
   - 上传新的 `dist` 文件夹内容

3. **提交更改**
   - 输入提交信息
   - 点击 "Commit changes"

### Git 命令更新

```bash
# 重新构建
npm run build

# 提交更改
git add dist/
git commit -m "Update website"
git push
```

### 自动更新（使用 GitHub Actions）

```bash
# 修改代码
# 提交并推送
git add .
git commit -m "Update features"
git push

# GitHub Actions 会自动构建并部署
```

## 性能优化

### GitHub Pages 自动优化

- CDN 加速
- Gzip 压缩
- 浏览器缓存
- HTTP/2 支持

### 手动优化

1. **图片优化**
   - 使用 WebP 格式
   - 压缩图片大小

2. **代码分割**
   - 使用动态导入
   - 懒加载组件

3. **缓存策略**
   - 设置合适的缓存头
   - 使用 Service Worker

## 监控和分析

### GitHub Pages 内置功能

- 访问统计（基础）
- 构建日志
- 部署历史

### 第三方分析工具

#### Google Analytics
1. 注册 Google Analytics 账号
2. 创建跟踪代码
3. 将代码添加到 `index.html`

#### Cloudflare Analytics
1. 使用 Cloudflare 代理
2. 启用 Cloudflare Analytics
3. 查看详细统计

## 安全建议

1. **启用 HTTPS**
   - 在 GitHub Pages 设置中强制 HTTPS

2. **定期备份**
   - 导出 localStorage 数据
   - 备份源代码

3. **访问控制**
   - 私有仓库限制访问
   - 使用 GitHub Pages 访问限制

4. **安全头**
   - 设置 CSP 头
   - 启用 HSTS

## 常见问题

### Q: 部署后网站显示 404？
A:
- 检查 `index.html` 是否在根目录
- 确认 GitHub Pages 已正确配置
- 等待几分钟让部署完成

### Q: 网站样式加载失败？
A:
- 检查 `assets` 文件夹是否正确上传
- 确认文件路径是否正确
- 清除浏览器缓存

### Q: 如何回滚到之前的版本？
A:
- 在 GitHub 仓库中查看提交历史
- 使用 `git checkout` 回滚
- 或在 GitHub 网页上恢复旧版本

### Q: 有流量限制吗？
A:
- GitHub Pages 免费套餐：每月 100GB 带宽
- 对于个人使用完全足够

### Q: 可以使用私有仓库吗？
A:
- 可以，但私有仓库的 GitHub Pages 也是公开的
- 如需私有访问，考虑使用其他服务

### Q: 如何删除网站？
A:
- 在仓库设置中禁用 GitHub Pages
- 或删除整个仓库

## 成本

- **GitHub Pages**：完全免费
- **自定义域名**：免费（使用 Freenom）或 $10-15/年
- **SSL 证书**：免费（Let's Encrypt）

## 技术支持

- GitHub Pages 文档：https://docs.github.com/pages
- GitHub 支持：https://support.github.com/
- 社区论坛：https://github.community/

## 总结

**GitHub Pages 优势：**
- ✅ 完全免费
- ✅ 稳定可靠
- ✅ 版本控制
- ✅ 自动部署
- ✅ 支持自定义域名

**推荐配置：**
- 使用 Git 命令行管理
- 启用 GitHub Actions 自动部署
- 配置自定义域名
- 启用 HTTPS

**预计时间：**
- 首次部署：10-15分钟
- 后续更新：2-3分钟（使用 Git）

现在就开始部署您的个人财务管理系统到 GitHub Pages 吧！