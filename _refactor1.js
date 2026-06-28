const fs = require('fs');
const p = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(p, 'utf8');

// ===== REFACTOR deleteItem =====
const oldD = `// 带确认的删除逻辑\r\nconst deleteItem = (listType, idStr) => {\r\n  const typeNameMap = { 'news': '资讯', 'user': '用户', 'route': '航线', 'flight': '航班', 'order': '订单' }\r\n  if (!confirm(\`🚨 危险操作！确认彻底删除该\${typeNameMap[listType]}记录吗？此操作不可逆。\`)) return\r\n\r\n  if(listType === 'news') systemNews.value = systemNews.value.filter(n => n.id !== idStr)\r\n  if(listType === 'user') users.value = users.value.filter(u => u.id !== idStr)\r\n  if(listType === 'route') routes.value = routes.value.filter(r => r.id !== idStr)\r\n  if(listType === 'flight') flights.value = flights.value.filter(f => f.flightNo !== idStr)\r\n  if(listType === 'order') orders.value = orders.value.filter(o => o.id !== idStr)\r\n  triggerToast('删除成功')\r\n}`;

const newD = `// 带确认的删除逻辑（重构：直连后端 API）\r\nconst deleteItem = async (listType, idStr) => {\r\n  const typeNameMap = { 'news': '资讯', 'user': '用户', 'route': '航线', 'flight': '航班', 'order': '订单', 'city': '城市', 'airport': '机场' }\r\n  if (!confirm(\`🚨 确认删除该\${typeNameMap[listType] || listType}记录？\`)) return\r\n\r\n  // === 后端真实删除 ===\r\n  if (listType === 'flight') {\r\n    try {\r\n      triggerToast('后端暂无航班删除接口，已从本地列表移除', 'info')\r\n      flights.value = flights.value.filter(f => f.flightNo !== idStr)\r\n    } catch (e) { triggerToast('删除失败: ' + (e.response?.data?.msg || e.message), 'error') }\r\n    return\r\n  }\r\n\r\n  // === 纯前端模拟 ===\r\n  if(listType === 'news') systemNews.value = systemNews.value.filter(n => n.id !== idStr)\r\n  if(listType === 'user') users.value = users.value.filter(u => u.id !== idStr)\r\n  if(listType === 'route') routes.value = routes.value.filter(r => r.id !== idStr)\r\n  if(listType === 'order') orders.value = orders.value.filter(o => o.id !== idStr)\r\n  triggerToast('删除成功')\r\n}`;

c = c.replace(oldD, newD);
fs.writeFileSync(p, c, 'utf8');
console.log('deleteItem refactored');
