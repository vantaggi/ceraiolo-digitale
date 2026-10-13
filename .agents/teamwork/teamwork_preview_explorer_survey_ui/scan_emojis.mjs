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

// Regex matching unicode emojis
const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu;

const files = findFiles('c:/Users/cioti/Desktop/PROGETTI/ceraiolo-digitale/src');

console.log('--- SCANNING FOR EMOJIS IN SRC (excluding __tests__) ---');
let totalEmojiFound = 0;

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const matches = line.match(emojiRegex);
    if (matches) {
      // Filter out false positives if any (e.g. copyright symbols, or standard latin-1)
      const filtered = matches.filter(m => {
        const code = m.codePointAt(0);
        // Exclude ©, ®, ™, etc if desired, or include everything
        return code > 0x2000;
      });
      if (filtered.length > 0) {
        totalEmojiFound += filtered.length;
        console.log(`${path.relative('c:/Users/cioti/Desktop/PROGETTI/ceraiolo-digitale', filePath)}:${idx + 1}: [${filtered.join(' ')}] in -> ${line.trim()}`);
      }
    }
  });
});

console.log(`\nTotal emojis found in src (non-test files): ${totalEmojiFound}`);
