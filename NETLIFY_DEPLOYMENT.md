# Netlify 部署指南

## 为什么选择 Netlify？

- **完全免费**：无需信用卡，永久免费
- **简单易用**：拖拽上传即可部署
- **全球CDN**：访问速度快
- **自动HTTPS**：安全加密
- **自定义域名**：支持绑定自己的域名

## 部署步骤

### 方法一：拖拽上传（最简单）

1. **准备文件**
   - 确保您已经有了构建产物：`goal-predictor-v1.0.0.zip`
   - 解压该文件，得到 `dist` 文件夹

2. **注册 Netlify 账号**
   - 访问：https://app.netlify.com/signup
   - 使用邮箱或 GitHub 账号注册

3. **上传网站**
   - 登录后，点击 "Add new site" → "Deploy manually"
   - 将 `dist` 文件夹拖拽到上传区域
   - 等待上传完成（通常几秒钟）

4. **访问网站**
   - 上传完成后，Netlify 会生成一个随机域名
   - 例如：`https://your-site-name.netlify.app`

### 方法二：使用 Netlify CLI（推荐）

1. **安装 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **登录 Netlify**
   ```bash
   netlify login
   ```

3. **部署网站**
   ```bash
   cd e:\daima\goal-predictor
   netlify deploy --prod --dir=dist
   ```

4. **访问网站**
   - 部署完成后，会显示您的网站地址

## 高级配置

### 自定义域名

1. 在 Netlify 控制台中，点击 "Domain settings"
2. 点击 "Add custom domain"
3. 输入您的域名（如：`finance.yourdomain.com`）
4. 按照提示配置 DNS 记录

### 绑定免费域名

如果您没有域名，可以使用以下免费域名服务：
- **Freenom**：`.tk`, `.ml`, `.ga`, `.cf` 等免费域名
- **EU.org**：完全免费的域名

### 自动部署

如果您想将代码推送到 GitHub 后自动部署：

1. 将项目推送到 GitHub
2. 在 Netlify 中点击 "New site from Git"
3. 选择 GitHub 仓库
4. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`

## 性能优化

Netlify 会自动优化您的网站：
- 图片压缩
- CSS/JS 压缩
- CDN 缓存
- Gzip 压缩

## 监控和分析

Netlify 提供免费的分析工具：
- 访问统计
- 性能监控
- 错误日志

## 常见问题

### 1. 部署失败
- 检查 `dist` 文件夹是否包含 `index.html`
- 确保所有文件都已上传

### 2. 网站无法访问
- 检查 DNS 设置
- 等待几分钟让 DNS 生效

### 3. 自定义域名无法访问
- 确认 DNS 记录配置正确
- 检查域名是否已过期

## 成本

- **免费套餐**：每月 100GB 带宽，100 分钟构建时间
- **Pro 套餐**：$19/月，适合商业项目

对于个人使用，免费套餐完全足够！

## 技术支持

- Netlify 文档：https://docs.netlify.com/
- 社区论坛：https://answers.netlify.com/
- 客服支持：免费用户也可获得基础支持