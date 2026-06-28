const fs = require('fs');
const content = fs.readFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', 'utf8');
const lines = content.split(/\r?\n/);
// Print first 15 lines
for (let i = 0; i < Math.min(lines.length, 15); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

