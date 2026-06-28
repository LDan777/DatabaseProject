let fs = require('fs');
let c = fs.readFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', 'utf8');
// Remove one of the duplicate lines
c = c.replace(
  'class="library-box">\r\n            <div v-if="activeMenu === \'flights\'" class="library-box">',
  'class="library-box">'
);
fs.writeFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', c, 'utf8');
console.log('Fixed');
