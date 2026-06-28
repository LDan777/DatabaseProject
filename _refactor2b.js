const fs = require('fs');
const p = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(p, 'utf8');

// City delete: foreign key error handling
c = c.replace(
  `const handleCityDelete = async (code) => {\r\n  if (!confirm('确定删除 ' + code + ' ?')) return\r\n  try { const res = await deleteCity(code); if (res.code === 200) { triggerToast('已删除', 'success'); await loadCities() } else triggerToast(res.msg, 'error') } catch (e) { triggerToast('网络错误', 'error') }\r\n}`,
  `const handleCityDelete = async (code) => {\r\n  if (!confirm('确定删除城市 ' + code + ' 吗？')) return\r\n  try {\r\n    const res = await deleteCity(code)\r\n    if (res.code === 200) { triggerToast('城市 ' + code + ' 已删除', 'success'); await loadCities() }\r\n    else triggerToast(res.msg || '删除失败', 'error')\r\n  } catch (e) {\r\n    const msg = (e.response?.data?.msg || e.message || '').toLowerCase()\r\n    if (msg.includes('foreign') || msg.includes('constraint') || msg.includes('1451') || msg.includes('关联')) {\r\n      triggerToast('删除失败：该城市下仍有关联机场，请先前往机场管理删除关联记录', 'error')\r\n    } else { triggerToast('删除失败: ' + (e.response?.data?.msg || e.message), 'error') }\r\n  }\r\n}`
);

fs.writeFileSync(p, c, 'utf8');
console.log('city delete error done');
