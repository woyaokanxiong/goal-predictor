const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ROOT_DIR = path.join(__dirname, '..');
const UPLOAD_DIR = path.join(ROOT_DIR, 'upload-ready');

const filesToUpload = [
  {
    name: 'client源代码',
    source: path.join(ROOT_DIR, 'client'),
    destination: 'client',
    exclude: ['node_modules', '.git', 'dist']
  },
  {
    name: 'server源代码',
    source: path.join(ROOT_DIR, 'server'),
    destination: 'server',
    exclude: ['node_modules', '.git']
  },
  {
    name: '根目录配置文件',
    source: path.join(ROOT_DIR),
    destination: '.',
    files: ['.gitignore', 'README.md', 'package.json', 'package-lock.json']
  }
];

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase());
    });
  });
}

function shouldExclude(fileName, excludeList) {
  return excludeList.some(exclude => fileName === exclude || fileName.startsWith(exclude + path.sep));
}

async function copyFiles(sourceDir, destDir, exclude = [], specificFiles = null) {
  if (!fs.existsSync(sourceDir)) {
    console.log(`\x1b[33m警告: 源目录不存在: ${sourceDir}\x1b[0m`);
    return;
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const items = fs.readdirSync(sourceDir);

  for (const item of items) {
    const sourcePath = path.join(sourceDir, item);
    const destPath = path.join(destDir, item);

    if (shouldExclude(item, exclude)) {
      console.log(`\x1b[33m跳过: ${item}\x1b[0m`);
      continue;
    }

    if (specificFiles && !specificFiles.includes(item)) {
      continue;
    }

    const stats = fs.statSync(sourcePath);

    if (stats.isDirectory()) {
      await copyFiles(sourcePath, destPath, exclude);
    } else {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`\x1b[32m已复制: ${destPath}\x1b[0m`);
    }
  }
}

async function main() {
  console.log('\x1b[36m========================================\x1b[0m');
  console.log('\x1b[36m文件上传管理系统\x1b[0m');
  console.log('\x1b[36m========================================\x1b[0m');
  console.log('');

  if (fs.existsSync(UPLOAD_DIR)) {
    console.log(`检测到上传目录已存在: ${UPLOAD_DIR}`);
    const answer = await askQuestion('是否清空现有目录并重新整理? (y/n): ');
    if (answer === 'y') {
      fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
      console.log('\x1b[33m已清空现有上传目录\x1b[0m');
    } else {
      console.log('\x1b[33m操作已取消\x1b[0m');
      rl.close();
      return;
    }
  } else {
    const answer = await askQuestion(`上传目录不存在，是否创建? (${UPLOAD_DIR}) (y/n): `);
    if (answer !== 'y') {
      console.log('\x1b[33m操作已取消\x1b[0m');
      rl.close();
      return;
    }
  }

  console.log('');
  console.log('\x1b[36m开始整理文件...\x1b[0m');
  console.log('');

  for (const item of filesToUpload) {
    console.log(`\x1b[34m正在处理: ${item.name}\x1b[0m`);
    
    const destDir = item.destination === '.' ? UPLOAD_DIR : path.join(UPLOAD_DIR, item.destination);
    
    if (item.files) {
      for (const file of item.files) {
        const sourcePath = path.join(item.source, file);
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, path.join(UPLOAD_DIR, file));
          console.log(`\x1b[32m已复制: ${file}\x1b[0m`);
        } else {
          console.log(`\x1b[33m跳过(不存在): ${file}\x1b[0m`);
        }
      }
    } else {
      await copyFiles(item.source, destDir, item.exclude || []);
    }
    
    console.log('');
  }

  console.log('\x1b[36m========================================\x1b[0m');
  console.log('\x1b[32m文件整理完成!\x1b[0m');
  console.log('\x1b[36m========================================\x1b[0m');
  
  const totalFiles = countFiles(UPLOAD_DIR);
  console.log(`\x1b[32m总共整理了 ${totalFiles} 个文件\x1b[0m`);
  console.log(`\x1b[36m上传目录: ${UPLOAD_DIR}\x1b[0m`);
  
  console.log('');
  console.log('\x1b[36m上传清单:\x1b[0m');
  console.log('----------------------------------------');
  printDirectoryTree(UPLOAD_DIR);
  
  rl.close();
}

function countFiles(dir) {
  let count = 0;
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }
  
  return count;
}

function printDirectoryTree(dir, prefix = '') {
  const items = fs.readdirSync(dir).sort();
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    const isLast = i === items.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    
    console.log(`${prefix}${connector}${item}${stats.isDirectory() ? '/' : ''}`);
    
    if (stats.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      printDirectoryTree(fullPath, newPrefix);
    }
  }
}

main().catch((error) => {
  console.error('\x1b[31m发生错误:', error.message, '\x1b[0m');
  rl.close();
  process.exit(1);
});