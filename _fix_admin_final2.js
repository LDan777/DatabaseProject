const fs = require('fs');
const path = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(path, 'utf8');

// Fix airport delete else: res.msg -> res.data.msg
c = c.replace(
  "if (res.data.code === 200) { triggerToast('机场 ' + code + ' 已删除', 'success'); await loadAirports() }\r\n    else triggerToast(res.msg || '删除失败', 'error')",
  "if (res.data.code === 200) { triggerToast('机场 ' + code + ' 已删除', 'success'); await loadAirports() }\r\n    else triggerToast(res.data.msg || '删除失败', 'error')"
);

// Fix airport delete catch: add response data msg
c = c.replace(
  "triggerToast('删除失败: ' + (e.msg || e.message || JSON.stringify(e)), 'error')",
  "triggerToast('删除失败: ' + (e.response?.data?.msg || e.message || JSON.stringify(e)), 'error')"
);

fs.writeFileSync(path, c, 'utf8');
console.log('AdminView.vue: airport delete response fixed!');
