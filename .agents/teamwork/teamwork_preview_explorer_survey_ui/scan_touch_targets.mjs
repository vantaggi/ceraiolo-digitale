import fs from 'fs';
import path from 'path';

function findFiles(dir, extList) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extList));
    } else if (extList.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  return results;
}

const files = findFiles('c:/Users/cioti/Desktop/PROGETTI/ceraiolo-digitale/src', ['.vue', '.css']);

console.log('--- CSS BLOCKS WITH DIMENSIONS < 44px ---');

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match CSS rule blocks: selector { ... }
  // Find style tags or full css
  const styleMatches = content.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || (filePath.endsWith('.css') ? [`<style>${content}</style>`] : []);
  
  styleMatches.forEach(styleBlock => {
    const rules = styleBlock.replace(/<style[^>]*>|<\/style>/g, '').split('}');
    rules.forEach(rule => {
      const parts = rule.split('{');
      if (parts.length === 2) {
        const selector = parts[0].trim();
        const body = parts[1];
        
        // Check if selector likely interactive (button, btn, input, select, nav, a, chip, checkmark, toggle, etc)
        const isInteractive = /btn|button|input|select|nav|chip|toggle|icon-btn|close|action|checkmark|page-btn|link/i.test(selector);
        
        if (isInteractive) {
          const dimMatches = [...body.matchAll(/(?:min-)?(height|width)\s*:\s*(\d+)px/gi)];
          dimMatches.forEach(m => {
            const prop = m[0];
            const val = parseInt(m[2], 10);
            if (val > 0 && val < 44) {
              console.log(`${path.relative('c:/Users/cioti/Desktop/PROGETTI/ceraiolo-digitale', filePath)} -> [${selector}] : ${prop}`);
            }
          });
        }
      }
    });
  });
});
