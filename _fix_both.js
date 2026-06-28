const fs = require('fs');
const p = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(p, 'utf8');

// ===== 1. Fix city delete: handle both AxiosError (500) and raw data (400) formats =====
const oldCityDel = `const handleCityDelete = async (code) => {\r\n  if (!confirm('确定删除城市 ' + code + ' 吗？')) return\r\n  try {\r\n    const res = await deleteCity(code)\r\n    if (res.code === 200) { triggerToast('城市 ' + code + ' 已删除', 'success'); await loadCities() }\r\n    else triggerToast(res.msg || '删除失败', 'error')\r\n  } catch (e) {\r\n    // 拦截器 reject 的是 response.data 原始对象，不是 AxiosError\r\n    const errMsg = (e.msg || e.message || String(e)).toLowerCase()\r\n    if (errMsg.includes('foreign') || errMsg.includes('constraint') || errMsg.includes('1451') || errMsg.includes('关联') || errMsg.includes('cannot delete') || errMsg.includes('a foreign key')) {\r\n      triggerToast('删除失败：该城市下仍有关联机场，请先前往机场管理删除关联记录', 'error')\r\n    } else {\r\n      triggerToast('删除失败: ' + (e.msg || e.message || String(e)), 'error')\r\n    }\r\n  }\r\n}`;

const newCityDel = `const handleCityDelete = async (code) => {\r\n  if (!confirm('确定删除城市 ' + code + ' 吗？')) return\r\n  try {\r\n    const res = await deleteCity(code)\r\n    if (res.code === 200) { triggerToast('城市 ' + code + ' 已删除', 'success'); await loadCities() }\r\n  } catch (e) {\r\n    // 兼容两种错误格式：拦截器 reject 的原始数据 或 AxiosError(500)\r\n    const msg = e.response?.data?.message || e.response?.data?.msg || e.msg || e.message || JSON.stringify(e)\r\n    if (/foreign|constraint|1451|外键|关联|cannot delete/i.test(msg)) {\r\n      triggerToast('删除失败：[' + code + '] 下仍有注册机场，请先前往【机场管理】删除关联机场后再试', 'error')\r\n    } else {\r\n      triggerToast('删除失败 [' + code + ']：' + msg, 'error')\r\n    }\r\n  }\r\n}`;

c = c.replace(oldCityDel, newCityDel);

// ===== 2. Fix airport filter: use local filter instead of backend (backend has request.json bug on GET) =====
const oldAirportFilter = `const handleAirportFilterByArea = async () => {\r\n  if (!airportFilterArea.value) { await loadAirports(); return }\r\n  try { const res = await getAirportByArea(airportFilterArea.value); if (res.code === 200) airports.value = res.data } catch (e) {}\r\n}`;

const newAirportFilter = `const handleAirportFilterByArea = async () => {\r\n  if (!airportFilterArea.value) { await loadAirports(); return }\r\n  // 后端 GET /api/admin/airport/getByArea 目前用 request.json 取值有 Bug\r\n  // 改用本地过滤：先从全量机场中按 area_code 筛选\r\n  try { await loadAirports() } catch (e) {}\r\n  const code = airportFilterArea.value.trim().toUpperCase()\r\n  airports.value = airports.value.filter(ap => ap.area_code?.toUpperCase() === code)\r\n  if (airports.value.length === 0) triggerToast('未找到代码为 ' + code + ' 的机场', 'info')\r\n  else triggerToast('找到 ' + airports.value.length + ' 个机场', 'success')\r\n}`;

c = c.replace(oldAirportFilter, newAirportFilter);

// ===== 3. Fix request.js: remove blocking alert for non-200 responses =====
const reqP = 'd:/Project/DatabaseProject/airline-frontend/src/api/request.js';
let req = fs.readFileSync(reqP, 'utf8');
req = req.replace(
  `    if (error.response) {\r\n      alert(\`网络请求失败！状态码: \${error.response.status}，请联系后端战友排查。\`)`,
  `    if (error.response) {\r\n      console.warn(\`请求返回状态码: \${error.response.status}\`, error.response.data)`
);
fs.writeFileSync(reqP, req, 'utf8');

fs.writeFileSync(p, c, 'utf8');
console.log('Both fixes done');
