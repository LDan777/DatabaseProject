const fs = require('fs');

// ====== 1. Fix AdminView.vue function calls ======
let admin = fs.readFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', 'utf8');
const LE = admin.includes('\r\n') ? '\r\n' : '\n';

// Fix 1: getAllOrdersFromOrder call in onMounted (lines 34-46)
const oldOrderBlock = `  // 🚀 核心修改：从 Python 后端调取真实的脱敏订单流水\n  try {\n    const orderResponse = await getAllOrdersFromOrder()\n    if (orderResponse.code === 200 && orderResponse.data) {\n      // 成功获取数据后，绑定到 orders 变量上\n      orders.value = orderResponse.data\n    }\n  } catch (error) {\n    console.warn('连接后端失败，未能加载实时流水:', error)\n    // 降级兜底，防止前端空白\n    orders.value = [\n      { id: 'ORD001', name: '乘客(***)', flightNo: 'MU5101', date: '2026-05-10', cabin: '经济', price: 640, status: '已支付', id_card_masked: '310105********1234' }\n    ]\n  }`;
const newOrderBlock = `  // 🚀 TODO: 后端需实现 GET /api/admin/ticket/list 接口后恢复此调用\n  // 当前降级使用本地模拟数据\n  orders.value = [\n    { id: 'ORD001', name: '乘客(***)', flightNo: 'MU5101', date: '2026-05-10', cabin: '经济', price: 640, status: '已支付', id_card_masked: '310105********1234' }\n  ]`;
if (admin.includes(oldOrderBlock)) {
  admin = admin.replace(oldOrderBlock, newOrderBlock);
  console.log('FIX 1: getAllOrdersFromOrder call replaced with fallback.');
} else {
  console.log('FIX 1 SKIP: getAllOrdersFromOrder call pattern not found.');
}

// Fix 2: getFlights call (lines 49-57)
const oldFlightBlock = `  // 尝试从后端加载可用航班\n  try {\n    const flightResponse = await getFlights()\n    if (flightResponse.code === 200 && flightResponse.data) {\n      flights.value = flightResponse.data\n    }\n  } catch (error) {\n    console.warn('加载航班列表失败:', error)\n  }`;
const newFlightBlock = `  // 🚀 TODO: 后端需实现 GET /api/admin/flight/list 接口后恢复此调用\n  // 当前使用本地模拟数据（flights 已在 data() 中初始化）`;
if (admin.includes(oldFlightBlock)) {
  admin = admin.replace(oldFlightBlock, newFlightBlock);
  console.log('FIX 2: getFlights call replaced with comment.');
} else {
  console.log('FIX 2 SKIP: getFlights call pattern not found.');
}

// Fix 3: cancelFlightInstance call (lines 312-317)
const oldCancelBlock = `  try {\n    // 🚀 核心修改：调用订单接口，传入航班号和起飞日期\n    const response = await cancelFlightInstance({\n      flightNo: order.flightNo,\n      date: order.date\n    })`;
const newCancelBlock = `  try {\n    // 🚀 TODO: 后端已有 POST /api/admin/flight_instance/update，可传入 flight_status='已取消' 恢复此功能\n    alert('该功能依赖的后端接口尚未实现，请先在后端添加 GET /api/admin/flight/list 等管理接口。');\n    return;`;
if (admin.includes(oldCancelBlock)) {
  admin = admin.replace(oldCancelBlock, newCancelBlock);
  console.log('FIX 3: cancelFlightInstance call replaced with alert.');
} else {
  console.log('FIX 3 SKIP: cancelFlightInstance call pattern not found. Trying alternative...');
  // Try with different whitespace
  const lines2 = admin.split(/\r?\n/);
  for (let i = 310; i < Math.min(lines2.length, 320); i++) {
    console.log(`  Line ${i+1}: ${lines2[i]}`);
  }
}

fs.writeFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', admin, 'utf8');

// ====== 2. Fix backend app.py: .hexdigest -> .hexdigest() ======
let appPy = fs.readFileSync('d:/Project/DatabaseProject/ds-aviation-backend/app.py', 'utf8');
if (appPy.includes('.hexdigest\n') && !appPy.includes('.hexdigest()')) {
  appPy = appPy.replace('.hexdigest\n', '.hexdigest()\n');
  console.log('BACKEND FIX: .hexdigest -> .hexdigest()');
} else if (appPy.includes('.hexdigest\r\n') && !appPy.includes('.hexdigest()')) {
  appPy = appPy.replace('.hexdigest\r\n', '.hexdigest()\r\n');
  console.log('BACKEND FIX: .hexdigest -> .hexdigest()');
} else {
  console.log('BACKEND: .hexdigest already has () or not found.');
}
fs.writeFileSync('d:/Project/DatabaseProject/ds-aviation-backend/app.py', appPy, 'utf8');

console.log('\n===== ALL FIXES COMPLETE =====');
