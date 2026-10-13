import fs from 'fs';
import path from 'path';

function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath));
    } else if (file.endsWith('.vue') || (file.endsWith('.js') && !filePath.includes('__tests__'))) {
      results.push(filePath);
    }
  });
  return results;
}

const specialChars = ['✕', '✓', '✗', '✏', '🗑', '⚠', '🕯', '🔥', '⚙', '★', '☆', '▲', '▼', '◄', '►', '►'];

const files = findFiles('c:/Users/cioti/Desktop/PROGETTI/ceraiolo-digitale/src');

console.log('--- SCANNING FOR SPECIAL CHARACTERS IN SRC TEMPLATES ---');
let totalFound = 0;

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Only search in template or script, ignore comments
    specialChars.forEach(ch => {
      if (line.includes(ch)) {
        totalFound++;
        console.log(`${path.relative('c:/Users/cioti/Desktop/PROGETTI/ceraiolo-digitale', filePath)}:${idx + 1}: Found '${ch}' in -> ${line.trim()}`);
      }
    });
  });
});

console.log(`\nTotal special characters found: ${totalFound}`);
