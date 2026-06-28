const fs = require('fs');
let content = fs.readFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', 'utf8');

// Detect line ending
const hasCRLF = content.includes('\r\n');
const LE = hasCRLF ? '\r\n' : '\n';

// Fix broken imports by commenting them out line by line
const lines = content.split(/\r?\n/);
const fixed = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim() === `import { login } from '@/api/auth.js'`) {
    fixed.push('// ===== 以下 API 导入已注释（后端尚无对应路由，AdminView 降级使用本地模拟数据）=====');
    fixed.push('// ' + line.trim());
  } else if (line.trim() === `import { getFlights, getAllOrders } from '@/api/flight.js'`) {
    fixed.push('// ' + line.trim());
  } else if (line.trim() === `import { getAllOrders as getAllOrdersFromOrder } from '@/api/order.js'`) {
    fixed.push('// ' + line.trim());
  } else if (line.trim() === `import { cancelFlightInstance } from '@/api/order.js'`) {
    fixed.push('// ' + line.trim());
  } else {
    fixed.push(line);
  }
}

fs.writeFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', fixed.join(LE), 'utf8');
console.log('SUCCESS: AdminView.vue imports fixed.');
console.log('Lines total:', lines.length, 'Lines written:', fixed.length);

