/* eslint-env node */
// eslint-disable-next-line no-undef
const fs = require('fs');
// eslint-disable-next-line no-undef
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.vue') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      let newContent = content
        .replace(/\bMuta\b/g, 'Manicchia')
        .replace(/\bMute\b/g, 'Manicchie')
        .replace(/\bmuta\b/g, 'manicchia')
        .replace(/\bmute\b/g, 'manicchie');

      // Special logic for remaining 'Gruppo/Gruppi' Strings we want translated visually
      newContent = newContent
        .replace(/>Gruppo</g, '>Manicchia<')
        .replace(/>Gruppi</g, '>Manicchie<')
        .replace(/per Gruppo\b/g, 'per Manicchia')
        .replace(/per Gruppi\b/g, 'per Manicchie')
        .replace(/Gestione Gruppi\b/g, 'Gestione Manicchie')
        .replace(/Totale Gruppi\b/g, 'Totale Manicchie')
        .replace(/Gruppo:/g, 'Manicchia:')
        .replace(/Gruppi:/g, 'Manicchie:')
        .replace(/'Gruppo'/g, "'Manicchia'")
        .replace(/"Gruppo"/g, '"Manicchia"')
        .replace(/'Gruppi'/g, "'Manicchie'")
        .replace(/"Gruppi"/g, '"Manicchie"');

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Updated:', fullPath);
      }
    }
  }
}

processDir('src');
console.log('Script execution completed.');
