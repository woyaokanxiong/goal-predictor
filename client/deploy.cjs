const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const DIST_DIR = path.join(CLIENT_DIR, 'dist');

function runCommand(cmd, cwd) {
  console.log(`\x1b[36m执行: ${cmd}\x1b[0m`);
  try {
    const output = execSync(cmd, { cwd, stdio: 'inherit' });
    return output?.toString() || '';
  } catch (error) {
    console.error(`\x1b[31m命令执行失败: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}

function main() {
  console.log('\x1b[36m========================================\x1b[0m');
  console.log('\x1b[36mGitHub Pages 部署脚本\x1b[0m');
  console.log('\x1b[36m========================================\x1b[0m');
  console.log('');

  if (!fs.existsSync(DIST_DIR)) {
    console.log('\x1b[33m构建目录不存在，开始构建...\x1b[0m');
    runCommand('npm run build', CLIENT_DIR);
  }

  console.log('');
  console.log('\x1b[36m进入构建目录...\x1b[0m');
  process.chdir(DIST_DIR);

  console.log('\x1b[36m初始化git仓库...\x1b[0m');
  runCommand('rm -rf .git || del /s /q .git 2>nul', DIST_DIR);
  runCommand('git init', DIST_DIR);

  console.log('\x1b[36m创建并切换到gh-pages分支...\x1b[0m');
  runCommand('git checkout -b gh-pages', DIST_DIR);

  console.log('\x1b[36m配置git用户...\x1b[0m');
  runCommand('git config user.email "deploy@github.com"', DIST_DIR);
  runCommand('git config user.name "Deploy Bot"', DIST_DIR);

  console.log('\x1b[36m添加.nojekyll文件...\x1b[0m');
  fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '');

  console.log('\x1b[36m添加所有文件...\x1b[0m');
  runCommand('git add .', DIST_DIR);

  console.log('\x1b[36m提交文件...\x1b[0m');
  runCommand('git commit -m "Deploy to GitHub Pages"', DIST_DIR);

  console.log('\x1b[36m推送到gh-pages分支...\x1b[0m');
  runCommand('git push -f https://github.com/woyaokanxiong/goal-predictor.git gh-pages', DIST_DIR);

  console.log('');
  console.log('\x1b[36m========================================\x1b[0m');
  console.log('\x1b[32m部署完成!\x1b[0m');
  console.log('\x1b[36m========================================\x1b[0m');
  console.log('');
  console.log('\x1b[36m部署地址: https://woyaokanxiong.github.io/goal-predictor/\x1b[0m');
}

main();