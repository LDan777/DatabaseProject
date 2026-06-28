const fs = require('fs');
const path = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(path, 'utf8');

// Remove localStorage persistence block (initData + watches)
c = c.replace(
  "// --- 持久化处理 ---\r\nconst initData = () => {\r\n  const load = (key, target) => { const local = localStorage.getItem(key); if(local) target.value = JSON.parse(local); }\r\n  load('adminNews', systemNews); load('adminUsers', users); load('adminRoutes', routes);\r\n  load('adminFlights', flights); load('adminOrders', orders);\r\n}\r\n// 利用 watch 自动保存变更\r\nwatch(systemNews, (v) => localStorage.setItem('adminNews', JSON.stringify(v)), { deep: true })\r\nwatch(users, (v) => localStorage.setItem('adminUsers', JSON.stringify(v)), { deep: true })\r\nwatch(routes, (v) => localStorage.setItem('adminRoutes', JSON.stringify(v)), { deep: true })\r\nwatch(flights, (v) => localStorage.setItem('adminFlights', JSON.stringify(v)), { deep: true })\r\nwatch(orders, (v) => localStorage.setItem('adminOrders', JSON.stringify(v)), { deep: true })",
  ""
);

// Clean up the onMounted function - remove the broken try-catch blocks
c = c.replace(
  "// 页面加载时检查并抓取后端真实数据\r\nonMounted(async () => {\r\n  isLoggedIn.value = false\r\n  localStorage.removeItem('adminIsLoggedIn')\r\n  \r\n  // 🚀 核心修改：从 Python 后端调取真实的脱敏订单流水\r\n  try {\r\n    // 从后端加载真实数据\r\n    if (true) {\r\n      // 成功获取数据后，绑定到 orders 变量上\r\n      await loadCities(); await loadAirports(); return",
  "// 页面加载时从后端加载城市与机场真实数据\r\nonMounted(async () => {\r\n  isLoggedIn.value = false\r\n  localStorage.removeItem('adminIsLoggedIn')\r\n  await loadCities()\r\n  await loadAirports()"
);

// Remove remaining junk from old onMounted (catch block, flight block, extra calls)
c = c.replace(
  "    }\r\n  } catch (error) {\r\n    console.warn('连接后端失败，未能加载实时流水:', error)\r\n    // 降级兜底，防止前端空白\r\n    orders.value = [\r\n      { id: 'ORD001', name: '乘客(***)', flightNo: 'MU5101', date: '2026-05-10', cabin: '经济', price: 640, status: '已支付', id_card_masked: '310105********1234' }\r\n    ]\r\n  }\r\n\r\n  // 以下代码已安全化处理，不再引用未定义变量\r\n  try {\r\n    // [已注释] const flightResponse = await getFlights()\r\n    if (false) {\r\n      flights.value = flightResponse.data\r\n    }\r\n  } catch (error) {\r\n    console.warn('加载航班列表失败:', error)\r\n  }\r\n  loadCities()\r\n  loadAirports()",
  ""
);

// Remove unused watch import if no longer needed (keep for now, might be used elsewhere)
// Remove empty lines that might have been left
c = c.replace(/\r\n\r\n\r\n/g, '\r\n\r\n');

fs.writeFileSync(path, c, 'utf8');
console.log('AdminView.vue: onMounted & localStorage cleanup done!');
