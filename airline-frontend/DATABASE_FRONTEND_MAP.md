# 📊 数据库功能前端实现文档

> 基于 `ds-aviation-backend/app.py` 与 `airline-frontend/src/api/` 对齐后  
> 生成日期：2026-06-27

---

## 一、项目架构概览

```
ds-aviation-backend/          airline-frontend/
├── app.py (Flask 后端)       ├── src/api/
│   17个路由 ←──HTTP──→        │   ├── request.js    (Axios 核心配置)
│   端口: 5000                │   ├── auth.js       (认证模块)
│                             │   ├── flight.js     (航班/管理模块)
│                             │   └── order.js      (订单模块)
数据库: MySQL                  ├── src/views/
  airline_ticket               │   ├── CustomerView.vue  (乘客端)
                               │   └── AdminView.vue     (管理员端)
```

---

## 二、已删除的 3 个函数及其原有位置

这些函数在旧版前端 API 文件中存在，但**后端没有对应的路由**，因此在本次对齐中被移除。

### 2.1 `getFlights()` → 被移除

| 项目 | 说明 |
|------|------|
| **旧路由** | `GET /api/flight/list` |
| **后端实际** | ❌ 不存在此路由 |
| **前端调用位置** | `AdminView.vue` 第 50 行，`onMounted()` 生命周期 |
| **原用途** | 管理员登录后台时，自动加载所有航班列表到 `flights` 表格 |
| **原代码** | `const flightResponse = await getFlights()` |
| **失败降级** | 使用硬编码模拟数据（MU5101、CA1831 等）填充表格 |

> 📌 **AdminView 中显示位置**：侧边菜单「航班管理 → 航班参数」`activeMenu === 'flights'`

### 2.2 `getAllOrders()` → 被移除

| 项目 | 说明 |
|------|------|
| **旧路由** | `GET /api/admin/orders` |
| **后端实际** | ❌ 不存在此路由 |
| **前端调用位置** | `AdminView.vue` 第 35 行，`onMounted()` 生命周期 |
| **原用途** | 管理员登录时自动加载所有脱敏订单流水到 `orders` 表格 |
| **原代码** | `const orderResponse = await getAllOrdersFromOrder()` |
| **失败降级** | 使用硬编码模拟数据填充订单表格 |

> 📌 **AdminView 中显示位置**：首页 Dashboard 统计卡片 +「订单管理 → 订单流水」表格 `activeMenu === 'orders'` +「人工处理队列」`activeMenu === 'manualQueue'`

### 2.3 `cancelFlightInstance()` → 被移除

| 项目 | 说明 |
|------|------|
| **旧路由** | `POST /api/admin/flight/cancel` |
| **后端实际** | ❌ 不存在（可用 `POST /api/admin/flight_instance/update` 替代） |
| **前端调用位置** | `AdminView.vue` 第 313 行，`handleCancelFlightAction()` |
| **原用途** | 管理员在「人工处理队列」点击 **"一键取消班次"** 按钮 |
| **触发按钮** | 第 901 行：`<button @click="handleCancelFlightAction(o)">一键取消班次</button>` |
| **原代码** | `cancelFlightInstance({ flightNo, date })` |

> 📌 **AdminView 中显示位置**：订单流水表格每行右侧操作按钮区域

---

## 三、当前前端 API 与数据库对应关系

### 3.1 `auth.js` — 乘客用户表 (`passenger`)

| 前端函数 | 方法 | API 路径 | 操作的表 | 字段 |
|----------|------|----------|---------|------|
| `register(data)` | POST | `/api/register` | `passenger` | id_card, name, vip_level, phone, password |
| `login(data)` | POST | `/api/login` | `passenger` | id_card, password (SELECT 校验) |
| `getMyTickets(idCard)` | GET | `/api/my_ticket` | `ticket_record` + `flight_instance` + `flight` | JOIN 查询行程 |

### 3.2 `flight.js` — 航班相关表

| 前端函数 | 方法 | API 路径 | 操作的表 |
|----------|------|----------|---------|
| `searchFlights(params)` | GET | `/api/search_flight` | `flight` + `flight_stop` + `airport` + `flight_instance` + `cabin_price` |
| `getCityList()` | GET | `/api/admin/city/list` | `city` |
| `addCity(data)` | POST | `/api/admin/city/add` | `city` |
| `editCity(data)` | POST | `/api/admin/city/edit` | `city` |
| `deleteCity(areaCode)` | POST | `/api/admin/city/del` | `city` |
| `getAirportList()` | GET | `/api/admin/airport/list` | `airport` |
| `addAirport(data)` | POST | `/api/admin/airport/add` | `airport` |
| `editAirport(data)` | POST | `/api/admin/airport/edit` | `airport` |
| `deleteAirport(code)` | POST | `/api/admin/airport/del` | `airport` |
| `addFlight(data)` | POST | `/api/admin/flight/add` | `flight` |
| `updateFlightInstance(data)` | POST | `/api/admin/flight_instance/update` | `flight_instance` |

### 3.3 `order.js` — 售票记录表 (`ticket_record`)

| 前端函数 | 方法 | API 路径 | 操作的表 | 说明 |
|----------|------|----------|---------|------|
| `buyTicket(data)` | POST | `/api/buy_ticket` | `ticket_record` + `flight_instance` | 插入订单 + 扣减余票 |
| `refundTicket(id)` | POST | `/api/refund_ticket` | `ticket_record` + `flight_instance` | 状态→已退票 + 归还座位 |
| `changeTicket(data)` | POST | `/api/change_ticket` | `ticket_record` + `flight_instance` | 归还旧座位 + 扣新座位 + 更新订单 |

---

## 四、数据库表 ↔ 前端函数 完整映射图

```
┌──────────────────────────────────────────────────────────────┐
│                     MySQL: airline_ticket                     │
├───────────────┬──────────────┬──────────────┬────────────────┤
│   passenger   │    city      │   airport    │    flight      │
│   (乘客表)     │   (城市表)    │   (机场表)    │   (航班表)      │
├───────────────┼──────────────┼──────────────┼────────────────┤
│ register()    │ getCityList()│getAirportList│ addFlight()    │
│ login()       │ addCity()    │ addAirport() │ searchFlights()│
│               │ editCity()   │ editAirport()│                │
│               │ deleteCity() │deleteAirport│                │
├───────────────┴──────────────┴──────────────┼────────────────┤
│            ticket_record (售票记录)           │flight_instance │
│                                             │ (航班实例)      │
├─────────────────────────────────────────────┼────────────────┤
│ buyTicket()    refundTicket()               │updateFlight    │
│ changeTicket() getMyTickets()               │Instance()      │
└─────────────────────────────────────────────┴────────────────┘
```

---

## 五、前端页面实际使用情况

### 5.1 `CustomerView.vue`（乘客端）

此页面**不使用** `src/api/` 模块，直接用 `axios` 调后端：

| 功能 | 调用方式 | 触发位置 |
|------|----------|----------|
| 搜索航班 | `axios.get('/search_flight', {params})` | 首页自动加载 + 搜索按钮 |
| 用户注册 | `axios.post('/register', data)` | 登录弹窗 → 注册模式 |
| 用户登录 | `axios.post('/login', data)` | 登录弹窗 |
| 我的行程 | `axios.get('/my_ticket', {params})` | 「我的行程」标签页 |
| 购买机票 | `axios.post('/buy_ticket', data)` | 航班列表 → 预订按钮 |
| 退票 | `axios.post('/refund_ticket', data)` | 行程列表 → 退票按钮 |
| 改签 | `axios.post('/change_ticket', data)` | 行程列表 → 改签流程 |

### 5.2 `AdminView.vue`（管理员端）

此页面依赖 `src/api/` 模块，当前状态：

| 功能 | 调用 | 状态 |
|------|------|------|
| 加载订单流水 | `getAllOrdersFromOrder()` | ⚠️ 函数已移除，降级为硬编码模拟数据 |
| 加载航班列表 | `getFlights()` | ⚠️ 函数已移除，降级为硬编码模拟数据 |
| 一键取消航班 | `cancelFlightInstance(data)` | ⚠️ 函数已移除，按钮点击将报错 |
| 管理员登录 | 前端硬编码 `admin / 123456` | ✅ 不依赖后端 API |

---

## 六、后端缺少的接口（后续扩充）

基于 AdminView.vue 原设计，以下接口后端未实现：

| 需求 | 建议路由 | 方法 | 备注 |
|------|----------|------|------|
| 查询所有航班 | `/api/admin/flight/list` | GET | 需新增 |
| 查询所有订单（脱敏） | `/api/admin/ticket/list` | GET | 需新增 |
| 一键取消航班 | `/api/admin/flight_instance/update` | POST | ✅ 已有，传 `flight_status='已取消'` 即可 |

> 💡 `cancelFlightInstance` 可改用现有的 `updateFlightInstance()` 替代

---

## 七、总结

| 模块 | 函数数 | 覆盖的数据库表 |
|------|--------|---------------|
| `auth.js` | 3 | `passenger`, `ticket_record` |
| `flight.js` | 11 | `city`, `airport`, `flight`, `flight_instance`, `flight_stop`, `cabin_price` |
| `order.js` | 3 | `ticket_record`, `flight_instance` |
| **合计** | **17** | **覆盖全部 7 张核心表** |