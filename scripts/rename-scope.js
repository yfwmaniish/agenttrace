const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('.git') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.tsx') || file.endsWith('.mjs')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('.');
let changed = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('@agenttrace/')) {
    const newContent = content.replace(/@agenttrace\//g, '@yfwdecimal/');
    fs.writeFileSync(file, newContent, 'utf8');
    changed++;
  }
}
console.log(`Updated ${changed} files.`);
