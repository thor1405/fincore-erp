const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git') continue;
    if (fs.statSync(fullPath).isDirectory()) {
      search(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('DEBUG: The backend is successfully returning history')) {
        console.log(`Found in: ${fullPath}`);
      }
    }
  }
}
search('C:\\Users\\johan\\.gemini\\antigravity\\scratch\\fincore-erp');
