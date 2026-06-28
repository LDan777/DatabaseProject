let fs = require('fs');
let c = fs.readFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', 'utf8');
let lines = c.split('\r\n');
let r = [];
for (let i = 0; i < lines.length; i++) {
  if (i > 0 && lines[i] === lines[i-1] && lines[i].includes('library-box')) continue;
  r.push(lines[i]);
}
fs.writeFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', r.join('\r\n'), 'utf8');
console.log('Duplicate removed');
