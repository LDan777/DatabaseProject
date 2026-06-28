const fs = require('fs');
const p = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(p, 'utf8');

// Fix handleCityDelete catch block - interceptor rejects with raw res, not Axios error
c = c.replace(
  `const handleCityDelete = async (code) => {\r\n  if (!confirm('确定删除城市 ' + code + ' 吗？')) return\r\n  try {\r\n    const res = await deleteCity(code)\r\n    if (res.code === 200) { triggerToast('城市 ' + code + ' 已删除', 'success'); await loadCities() }\r\n    else triggerToast(res.msg || '删除失败', 'error')\r\n  } catch (e) {\r\n    const msg = (e.response?.data?.msg || e.message || '').toLowerCase()\r\n    if (msg.includes('foreign') || msg.includes('constraint') || msg.includes('1451') || msg.includes('关联')) {\r\n      triggerToast('删除失败：该城市下仍有关联机场，请先前往机场管理删除关联记录', 'error')\r\n    } else { triggerToast('删除失败: ' + (e.response?.data?.msg || e.message), 'error') }\r\n  }\r\n}`,
  `const handleCityDelete = async (code) => {\r\n  if (!confirm('确定删除城市 ' + code + ' 吗？')) return\r\n  try {\r\n    const res = await deleteCity(code)\r\n    if (res.code === 200) { triggerToast('城市 ' + code + ' 已删除', 'success'); await loadCities() }\r\n    else triggerToast(res.msg || '删除失败', 'error')\r\n  } catch (e) {\r\n    // 拦截器 reject 的是 response.data 原始对象，不是 AxiosError\r\n    const errMsg = (e.msg || e.message || String(e)).toLowerCase()\r\n    if (errMsg.includes('foreign') || errMsg.includes('constraint') || errMsg.includes('1451') || errMsg.includes('关联') || errMsg.includes('cannot delete') || errMsg.includes('a foreign key')) {\r\n      triggerToast('删除失败：该城市下仍有关联机场，请先前往机场管理删除关联记录', 'error')\r\n    } else {\r\n      triggerToast('删除失败: ' + (e.msg || e.message || String(e)), 'error')\r\n    }\r\n  }\r\n}`
);

// Fix handleAirportDelete similarly
c = c.replace(
  `const handleAirportDelete = async (code) => {\r\n  if (!confirm('确定删除 ' + code + ' ?')) return\r\n  try { const res = await deleteAirport(code); if (res.code === 200) { triggerToast('已删除', 'success'); await loadAirports() } else triggerToast(res.msg, 'error') } catch (e) { triggerToast('网络错误', 'error') }\r\n}`,
  `const handleAirportDelete = async (code) => {\r\n  if (!confirm('确定删除机场 ' + code + ' 吗？')) return\r\n  try {\r\n    const res = await deleteAirport(code)\r\n    if (res.code === 200) { triggerToast('机场 ' + code + ' 已删除', 'success'); await loadAirports() }\r\n    else triggerToast(res.msg || '删除失败', 'error')\r\n  } catch (e) {\r\n    triggerToast('删除失败: ' + (e.msg || e.message || JSON.stringify(e)), 'error')\r\n  }\r\n}`
);

// Fix city/airport submit catch blocks too
c = c.replace(
  `catch (e) { triggerToast('新增失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error') }\r\n}`,
  `catch (e) { triggerToast('新增失败：' + (e.msg || e.message || '网络错误'), 'error') }\r\n}`
);

// Fix saveEdit catch
c = c.replace(
  `catch (e) { triggerToast('请求失败: ' + (e.response?.data?.msg || e.message), 'error'); return }\r\n  }\r\n\r\n  // === 纯前端模拟 ===`,
  `catch (e) { triggerToast('请求失败: ' + (e.msg || e.message || '网络错误'), 'error'); return }\r\n  }\r\n\r\n  // === 纯前端模拟 ===`
);

fs.writeFileSync(p, c, 'utf8');
console.log('Error handling fixed');
