const fs = require('fs');
const p = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(p, 'utf8');

// Replace all escaped quotes in modals section
c = c.replace(/\\\"/g, '"');
fs.writeFileSync(p, c, 'utf8');
console.log('Quotes fixed');
