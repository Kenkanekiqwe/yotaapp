import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function addImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const needsAPIURL = content.includes('API_URL') && !content.includes("from '../config'") && !content.includes("from './config'");
  const needsAPIBaseURL = content.includes('API_BASE_URL') && !content.includes("from '../config'") && !content.includes("from './config'");
  
  if (needsAPIURL || needsAPIBaseURL) {
    const imports = [];
    if (needsAPIURL) imports.push('API_URL');
    if (needsAPIBaseURL) imports.push('API_BASE_URL');
    
    const depth = filePath.split(path.sep).filter(p => p === 'src').length > 0 
      ? filePath.split(path.sep).slice(filePath.split(path.sep).indexOf('src') + 1).length - 1
      : 0;
    const importPath = '../'.repeat(Math.max(1, depth)) + 'config';
    
    const importStatement = `import { ${imports.join(', ')} } from '${importPath}';\n`;
    
    const lines = content.split('\n');
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        insertIndex = i + 1;
      } else if (insertIndex > 0 && !lines[i].startsWith('import ')) {
        break;
      }
    }
    
    lines.splice(insertIndex, 0, importStatement);
    content = lines.join('\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      addImports(filePath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done!');
