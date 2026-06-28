const fs = require('fs');
let admin = fs.readFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', 'utf8');

// Fix the broken cancelFlightInstance block - the previous fix left dangling code
const brokenBlock = `  try {
    // 🚀 核心修改：调用订单接口，传入航班号和起飞日期
    // [已注释] const response = await cancelFlightInstance({
      flightNo: order.flightNo,
      date: order.date
    })

    if (response.code === 200) {
      triggerToast(response.message, 'success')
      
      // 联动：让前端页面的表格状态实时变红
      orders.value.forEach(o => {
        if (o.flightNo === order.flightNo && o.date === order.date) {
          o.status = '已取消'
        }
      })
    } else {
      triggerToast(response.message || '一键取消失败', 'error')
    }
  } catch (error) {
    console.error('一键取消功能异常:', error)
    triggerToast('网络错误，联动取消命令执行失败', 'error')
  }`;

const fixedBlock = `  // 🚀 TODO: 后端已有 POST /api/admin/flight_instance/update 接口
  // 可在后端补充 "/api/admin/flight/list" 等管理接口后恢复此功能
  // 目前降级为纯前端模拟：直接修改本地 orders 数组状态
  triggerToast('已向前端模拟取消班次：' + order.flightNo, 'success')
  orders.value.forEach(o => {
    if (o.flightNo === order.flightNo && o.date === order.date) {
      o.status = '已取消'
    }
  })`;

if (admin.includes(brokenBlock)) {
  admin = admin.replace(brokenBlock, fixedBlock);
  fs.writeFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', admin, 'utf8');
  console.log('FIX 3: cancelFlightInstance block fully replaced.');
} else {
  console.log('NOT FOUND. Trying regex-based fix...');
  // Try to find and replace just the dangling lines
  admin = admin.replace(
    /\/\/ \[已注释\] const response = await cancelFlightInstance\(\{[\s\S]*?flightNo: order\.flightNo,[\s\S]*?date: order\.date[\s\S]*?\}\)[\s\S]*?if \(response\.code === 200\) \{[\s\S]*?triggerToast\(response\.message, 'success'\)[\s\S]*?orders\.value\.forEach[\s\S]*?\}\)[\s\S]*?\} else \{[\s\S]*?triggerToast\(response\.message \|\| '一键取消失败', 'error'\)[\s\S]*?\}/,
    `// [已注释] const response = await cancelFlightInstance({...})\n    // TODO: 后端实现管理接口后恢复此功能\n    triggerToast('前端模拟取消: ' + order.flightNo, 'success')\n    orders.value.forEach(o => {\n      if (o.flightNo === order.flightNo && o.date === order.date) {\n        o.status = '已取消'\n      }\n    })`
  );
  fs.writeFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', admin, 'utf8');
  console.log('FIX 3: Regex-based fix attempted.');
}
