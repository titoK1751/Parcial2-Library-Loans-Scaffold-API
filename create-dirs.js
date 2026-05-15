// Temporary file to create directory structure
const fs = require('fs');
const path = require('path');

const dirs = [
  'src/modules/items',
  'src/modules/loans',
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created: ${fullPath}`);
  }
});
