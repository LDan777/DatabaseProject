# 📋 前后端联调接口清单（API Contract）

> 这是前后端联调的标准文档。前端和后端团队需要严格按照此文档定义的接口进行开发。
> 
> **版本：** 1.0.0  
> **最后更新：** 2026-06-14  
> **维护者：** 前后端联合小组

---

## 📌 文档说明

本文档定义了前端 (`src/api/` 下的 3 个模块) 和后端之间的所有 HTTP 请求接口。

- **前端导入方式**：`import { functionName } from '@/api/auth.js|flight.js|order.js'`
- **后端实现方式**：按照下表的 "接口路径" 创建对应的路由处理器
- **数据格式**：所有请求/响应都必须遵循统一的 JSON 格式

---

## 🔄 通用规范

### 请求方式
- `GET` - 查询数据（使用 URL 参数）
- `POST` - 创建数据（使用 Request Body）
- `PUT` - 更新数据（使用 Request Body）
- `DELETE` - 删除数据（使用 URL 路径参数）

### 统一响应格式

所有接口的响应都必须是以下 JSON 格式：

```json
{
  "code": 200,                    // HTTP 状态码
  "data": { /* 业务数据 */ },     // 实际返回的数据
  "message": "请求成功"           // 人类可读的提示信息
}
```

### 常见状态码

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 200 | 成功 | 请求成功处理 |
| 400 | 客户端错误 | 参数错误、验证失败 |
| 401 | 未认证 | 需要登录或 Token 无效 |
| 403 | 禁止 | 权限不足（如非管理员） |
| 404 | 未找到 | 资源不存在 |
| 500 | 服务器错误 | 后端异常 |

### 认证方式

需要认证的接口在请求头中附加 Token：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

前端会在 `api/request.js` 的请求拦截器中自动添加。

---

## 🔐 认证模块接口 (`src/api/auth.js`)

### 1. 发送验证码

| 项 | 值 |
|----|----|
| **功能** | 向手机号发送验证码 |
| **前端函数** | `sendCode(phone)` |
| **请求方法** | `POST` |
| **接口路径** | `/api/auth/sendCode` |
| **认证** | 否 |
| **前端发送** | `{ phone: "13800138000" }` |
| **后端返回** | `{ code: 200, data: { phone, expiresIn: 300 }, message: "验证码已发送" }` |

---

### 2. 用户注册

| 项 | 值 |
|----|----|
| **功能** | 用户通过验证码和密码注册 |
| **前端函数** | `register(data)` |
| **请求方法** | `POST` |
| **接口路径** | `/api/auth/register` |
| **认证** | 否 |
| **前端发送** | `{ phone: "13800138000", verifyCode: "123456", password: "pass123" }` |
| **后端返回** | `{ code: 200, data: { userId: "U001", token: "xxx", user: {...} }, message: "注册成功" }` |

---

### 3. 用户/管理员登录

| 项 | 值 |
|----|----|
| **功能** | 用户通过验证码或密码登录 |
| **前端函数** | `login(data)` |
| **请求方法** | `POST` |
| **接口路径** | `/api/auth/login` |
| **认证** | 否 |
| **前端发送（验证码登录）** | `{ phone: "13800138000", verifyCode: "123456" }` |
| **前端发送（密码登录）** | `{ phone: "13800138000", password: "pass123" }` |
| **后端返回** | `{ code: 200, data: { token: "xxx", user: { id, phone, name, level, ... } }, message: "登录成功" }` |

---

### 4. 用户登出

| 项 | 值 |
|----|----|
| **功能** | 用户登出 |
| **前端函数** | `logout()` |
| **请求方法** | `POST` |
| **接口路径** | `/api/auth/logout` |
| **认证** | 是 |
| **前端发送** | 无 |
| **后端返回** | `{ code: 200, message: "登出成功" }` |

---

### 5. 获取用户信息

| 项 | 值 |
|----|----|
| **功能** | 获取当前登录用户的个人信息 |
| **前端函数** | `getUserProfile()` |
| **请求方法** | `GET` |
| **接口路径** | `/api/user/profile` |
| **认证** | 是 |
| **前端发送** | 无 |
| **后端返回** | `{ code: 200, data: { id, phone, name, idCard, gender, level, createdAt, ... }, message: "success" }` |

---

### 6. 更新用户信息

| 项 | 值 |
|----|----|
| **功能** | 用户修改个人信息 |
| **前端函数** | `updateUserProfile(data)` |
| **请求方法** | `PUT` |
| **接口路径** | `/api/user/profile` |
| **认证** | 是 |
| **前端发送** | `{ name: "张三", gender: "M" }` |
| **后端返回** | `{ code: 200, message: "更新成功" }` |

---

### 7. 绑定身份证

| 项 | 值 |
|----|----|
| **功能** | 用户绑定身份证进行实名认证 |
| **前端函数** | `bindIdCard(data)` |
| **请求方法** | `POST` |
| **接口路径** | `/api/user/bind-idcard` |
| **认证** | 是 |
| **前端发送** | `{ idCard: "110101199001011234" }` |
| **后端返回** | `{ code: 200, message: "身份证已绑定" }` |

---

## ✈️ 航班模块接口 (`src/api/flight.js`)

### 1. 乘客查询航班 ⭐ 重点

| 项 | 值 |
|----|----|
| **功能** | 乘客查询航班，支持按出发地、目的地、日期过滤 |
| **前端函数** | `searchFlights(params)` |
| **请求方法** | `GET` |
| **接口路径** | `/api/flights/search` |
| **认证** | 否 |
| **前端发送** | `{ origin: "SHA", destination: "PKX", date: "2026-05-02" }` |
| **后端返回** | `{ code: 200, data: [ 航班对象列表 ], message: "success" }` |

**航班对象示例：**
```json
{
  "id": "F001",
  "flightNo": "MU5101",
  "name": "东方5101",
  "origin": "SHA",
  "destination": "PKX",
  "depTime": "10:30",
  "arrTime": "12:45",
  "aircraft": "A330",
  "price": 1280,
  "firstSeats": 30,
  "economySeats": 220,
  "status": "SCHEDULED"
}
```

---

### 2. 获取航班详情

| 项 | 值 |
|----|----|
| **功能** | 获取单个航班的详细信息 |
| **前端函数** | `getFlightDetail(flightId)` |
| **请求方法** | `GET` |
| **接口路径** | `/api/flights/:id` |
| **认证** | 否 |
| **前端发送** | 无 |
| **后端返回** | `{ code: 200, data: { 航班详情 }, message: "success" }` |

---

### 3. 获取所有机场

| 项 | 值 |
|----|----|
| **功能** | 获取系统中所有可用的机场 |
| **前端函数** | `getAirports()` |
| **请求方法** | `GET` |
| **接口路径** | `/api/airports` |
| **认证** | 否 |
| **前端发送** | 无 |
| **后端返回** | `{ code: 200, data: [ { id, code, name, city, ... }, ... ], message: "success" }` |

---

### 4. 获取所有城市

| 项 | 值 |
|----|----|
| **功能** | 获取系统中所有城市 |
| **前端函数** | `getCities()` |
| **请求方法** | `GET` |
| **接口路径** | `/api/cities` |
| **认证** | 否 |
| **前端发送** | 无 |
| **后端返回** | `{ code: 200, data: [ { id, name, code, ... }, ... ], message: "success" }` |

---

### 5. 获取所有航班（B端）

| 项 | 值 |
|----|----|
| **功能** | 管理员查看排班编排列表 |
| **前端函数** | `getFlights(params)` |
| **请求方法** | `GET` |
| **接口路径** | `/api/flights` |
| **认证** | 是 |
| **前端发送** | `{ page: 1, limit: 20 }` |
| **后端返回** | `{ code: 200, data: [ 航班列表 ], message: "success" }` |

---

### 6. 新增航班（B端）

| 项 | 值 |
|----|----|
| **功能** | 管理员添加新航班 |
| **前端函数** | `createFlight(data)` |
| **请求方法** | `POST` |
| **接口路径** | `/api/flights` |
| **认证** | 是（需管理员权限） |
| **前端发送** | `{ flightNo, origin, destination, depTime, arrTime, aircraft, schedule, firstSeats, economySeats }` |
| **后端返回** | `{ code: 200, data: { id, ... }, message: "航班创建成功" }` |

---

### 7. 修改航班（B端）

| 项 | 值 |
|----|----|
| **功能** | 管理员修改航班信息 |
| **前端函数** | `updateFlight(flightId, data)` |
| **请求方法** | `PUT` |
| **接口路径** | `/api/flights/:id` |
| **认证** | 是（需管理员权限） |
| **前端发送** | `{ depTime, arrTime, aircraft, firstSeats, economySeats, ... }` |
| **后端返回** | `{ code: 200, message: "航班更新成功" }` |

---

### 8. 删除航班（B端）

| 项 | 值 |
|----|----|
| **功能** | 管理员删除航班 |
| **前端函数** | `deleteFlight(flightId)` |
| **请求方法** | `DELETE` |
| **接口路径** | `/api/flights/:id` |
| **认证** | 是（需管理员权限） |
| **前端发送** | 无 |
| **后端返回** | `{ code: 200, message: "航班删除成功" }` |

---

### 9. 获取航班实例列表

| 项 | 值 |
|----|----|
| **功能** | 获取某航班在特定日期的多个班次 |
| **前端函数** | `getFlightInstances(params)` |
| **请求方法** | `GET` |
| **接口路径** | `/api/flight-instances` |
| **认证** | 是 |
| **前端发送** | `{ flightNo: "MU5101", date: "2026-05-02" }` |
| **后端返回** | `{ code: 200, data: [ 实例列表 ], message: "success" }` |

---

### 10. 创建航班实例（B端）

| 项 | 值 |
|----|----|
| **功能** | 管理员为某航班创建一个班次实例 |
| **前端函数** | `createFlightInstance(data)` |
| **请求方法** | `POST` |
| **接口路径** | `/api/flight-instances` |
| **认证** | 是（需管理员权限） |
| **前端发送** | `{ flightNo, actualDepTime, actualArrTime, status }` |
| **后端返回** | `{ code: 200, message: "航班实例创建成功" }` |

---

### 11. 更新航班实例（B端）

| 项 | 值 |
|----|----|
| **功能** | 管理员修改航班班次的状态 |
| **前端函数** | `updateFlightInstance(instanceId, data)` |
| **请求方法** | `PUT` |
| **接口路径** | `/api/flight-instances/:id` |
| **认证** | 是（需管理员权限） |
| **前端发送** | `{ status, actualDepTime, actualArrTime }` |
| **后端返回** | `{ code: 200, message: "航班实例更新成功" }` |

---

### 12. 获取舱位定价

| 项 | 值 |
|----|----|
| **功能** | 获取所有舱位定价 |
| **前端函数** | `getCabinPrices()` |
| **请求方法** | `GET` |
| **接口路径** | `/api/cabin-prices` |
| **认证** | 是 |
| **前端发送** | 无 |
| **后端返回** | `{ code: 200, data: [ { flightNo, cabin, price }, ... ], message: "success" }` |

---

### 13. 设置舱位定价（B端）

| 项 | 值 |
|----|----|
| **功能** | 管理员设置航班的舱位定价 |
| **前端函数** | `setCabinPrice(data)` |
| **请求方法** | `POST` |
| **接口路径** | `/api/cabin-prices` |
| **认证** | 是（需管理员权限） |
| **前端发送** | `{ flightNo, cabin: "F" or "Y", price: 1280 }` |
| **后端返回** | `{ code: 200, message: "定价设置成功" }` |

---

### 14. 获取会员折扣

| 项 | 值 |
|----|----|
| **功能** | 获取各会员等级的折扣 |
| **前端函数** | `getMemberDiscounts()` |
| **请求方法** | `GET` |
| **接口路径** | `/api/member-discounts` |
| **认证** | 是 |
| **前端发送** | 无 |
| **后端返回** | `{ code: 200, data: [ { level, discount }, ... ], message: "success" }` |

---

### 15. 设置会员折扣（B端）

| 项 | 值 |
|----|----|
| **功能** | 管理员设置会员折扣 |
| **前端函数** | `setMemberDiscount(data)` |
| **请求方法** | `POST` |
| **接口路径** | `/api/member-discounts` |
| **认证** | 是（需管理员权限） |
| **前端发送** | `{ level: "GOLD", discount: 0.9 }` |
| **后端返回** | `{ code: 200, message: "折扣设置成功" }` |

---

### 16. 获取热门航线

| 项 | 值 |
|----|----|
| **功能** | 获取热门航线统计 |
| **前端函数** | `getPopularRoutes()` |
| **请求方法** | `GET` |
| **接口路径** | `/api/statistics/popular-routes` |
| **认证** | 是 |
| **前端发送** | 无 |
| **后端返回** | `{ code: 200, data: [ { origin, destination, count }, ... ], message: "success" }` |

---

## 🎫 订单模块接口 (`src/api/order.js`)

### 1. 创建预订（下单抢票）⭐ 重点

| 项 | 值 |
|----|----|
| **功能** | 乘客预订机票，后端触发 `SELECT ... FOR UPDATE` 防超卖锁 |
| **前端函数** | `createOrder(data)` |
| **请求方法** | `POST` |
| **接口路径** | `/api/orders/book` |
| **认证** | 是 |
| **前端发送** | `{ flightNo: "MU5101", cabin: "Y", passengerName: "王芳", passengerIdCard: "110101199001011234", quantity: 1 }` |
| **后端返回** | `{ code: 200, data: { orderId: "ORD001", totalPrice: 640, status: "UNPAID", ... }, message: "预订成功" }` |

---

### 2. 查询我的行程记录

| 项 | 值 |
|----|----|
| **功能** | 乘客查看自己的订单列表 |
| **前端函数** | `getOrderHistory(params)` |
| **请求方法** | `GET` |
| **接口路径** | `/api/orders/history` |
| **认证** | 是 |
| **前端发送** | `{ page: 1, limit: 10, status: "PAID" }` |
| **后端返回** | `{ code: 200, data: [ 订单列表 ], message: "success" }` |

**订单对象示例：**
```json
{
  "id": "ORD001",
  "flightNo": "MU5101",
  "passengerName": "王芳",
  "cabin": "Y",
  "totalPrice": 640,
  "status": "PAID",
  "travelDate": "2026-05-02",
  "createdAt": "2026-05-01T10:00:00Z"
}
```

---

### 3. 获取订单详情

| 项 | 值 |
|----|----|
| **功能** | 获取某个订单的详细信息 |
| **前端函数** | `getOrderDetail(orderId)` |
| **请求方法** | `GET` |
| **接口路径** | `/api/orders/:id` |
| **认证** | 是 |
| **前端发送** | 无 |
| **后端返回** | `{ code: 200, data: { 订单详情 }, message: "success" }` |

---

### 4. 退票

| 项 | 值 |
|----|----|
| **功能** | 乘客或管理员退票，触发状态变更，回收配额 |
| **前端函数** | `refundOrder(orderId)` |
| **请求方法** | `POST` |
| **接口路径** | `/api/orders/refund` |
| **认证** | 是 |
| **前端发送** | `{ id: "ORD001" }` |
| **后端返回** | `{ code: 200, message: "退票成功，库存已释放" }` |

---

### 5. 支付订单

| 项 | 值 |
|----|----|
| **功能** | 乘客支付订单 |
| **前端函数** | `payOrder(data)` |
| **请求方法** | `POST` |
| **接口路径** | `/api/orders/pay` |
| **认证** | 是 |
| **前端发送** | `{ orderId: "ORD001", paymentMethod: "ALIPAY" }` |
| **后端返回** | `{ code: 200, message: "支付成功" }` |

---

### 6. 获取所有订单（B端）

| 项 | 值 |
|----|----|
| **功能** | 管理员查看订单流水 |
| **前端函数** | `getAllOrders(params)` |
| **请求方法** | `GET` |
| **接口路径** | `/api/orders` |
| **认证** | 是（需管理员权限） |
| **前端发送** | `{ page: 1, limit: 20, status: "PAID", startDate: "2026-05-01", endDate: "2026-05-31" }` |
| **后端返回** | `{ code: 200, data: [ 订单列表 ], message: "success" }` |

---

### 7. 更新订单状态（B端）

| 项 | 值 |
|----|----|
| **功能** | 管理员修改订单状态 |
| **前端函数** | `updateOrderStatus(orderId, data)` |
| **请求方法** | `PUT` |
| **接口路径** | `/api/orders/:id/status` |
| **认证** | 是（需管理员权限） |
| **前端发送** | `{ status: "COMPLETED", remark: "已完成" }` |
| **后端返回** | `{ code: 200, message: "订单状态已更新" }` |

---

### 8. 获取待处理订单（B端）

| 项 | 值 |
|----|----|
| **功能** | 人工处理队列 - 获取待处理的订单 |
| **前端函数** | `getPendingOrders(params)` |
| **请求方法** | `GET` |
| **接口路径** | `/api/orders/pending` |
| **认证** | 是（需管理员权限） |
| **前端发送** | `{ page: 1, limit: 20 }` |
| **后端返回** | `{ code: 200, data: [ 待处理订单列表 ], message: "success" }` |

---

### 9. 人工处理订单（B端）

| 项 | 值 |
|----|----|
| **功能** | 人工处理队列 - 处理一个待处理的订单 |
| **前端函数** | `handlePendingOrder(orderId, data)` |
| **请求方法** | `POST` |
| **接口路径** | `/api/orders/:id/handle` |
| **认证** | 是（需管理员权限） |
| **前端发送** | `{ action: "APPROVE", remark: "已核实" }` |
| **后端返回** | `{ code: 200, message: "订单已处理" }` |

---

### 10. 获取订单统计（B端）

| 项 | 值 |
|----|----|
| **功能** | 获取运营看板的订单统计数据 |
| **前端函数** | `getOrderStatistics(params)` |
| **请求方法** | `GET` |
| **接口路径** | `/api/statistics/orders` |
| **认证** | 是（需管理员权限） |
| **前端发送** | `{ startDate: "2026-05-01", endDate: "2026-05-31" }` |
| **后端返回** | `{ code: 200, data: { totalOrders: 100, totalRevenue: 64000, refundedOrders: 5, ... }, message: "success" }` |

---

### 11. 获取用户购票历史（B端）

| 项 | 值 |
|----|----|
| **功能** | 获取指定用户的购票历史 |
| **前端函数** | `getUserOrderHistory(userId, params)` |
| **请求方法** | `GET` |
| **接口路径** | `/api/users/:userId/orders` |
| **认证** | 是（需管理员权限） |
| **前端发送** | `{ page: 1, limit: 10 }` |
| **后端返回** | `{ code: 200, data: [ 订单列表 ], message: "success" }` |

---

## 📊 数据对象定义

### 用户对象

```json
{
  "id": "U001",                           // 用户ID
  "phone": "13800138000",                 // 手机号
  "name": "张三",                         // 真实姓名
  "idCard": "110101199001011234",         // 身份证号
  "gender": "M",                          // 性别 (M/F)
  "level": "NORMAL",                      // 会员等级
  "createdAt": "2026-05-01T10:00:00Z",    // 创建时间
  "updatedAt": "2026-05-10T14:30:00Z"     // 最后更新时间
}
```

### 航班对象

```json
{
  "id": "F001",                           // 航班ID
  "flightNo": "MU5101",                   // 航班号
  "name": "东方5101",                     // 航班名称
  "origin": "SHA",                        // 出发机场代码
  "destination": "PKX",                   // 到达机场代码
  "depTime": "10:30",                     // 起飞时间 (HH:MM)
  "arrTime": "12:45",                     // 到达时间 (HH:MM)
  "aircraft": "A330",                     // 机型
  "price": 1280,                          // 基准票价
  "firstSeats": 30,                       // 头等舱座位数
  "economySeats": 220,                    // 经济舱座位数
  "schedule": "1,3,5",                    // 执行周期
  "status": "SCHEDULED"                   // 航班状态
}
```

### 订单对象

```json
{
  "id": "ORD001",                         // 订单ID
  "userId": "U001",                       // 用户ID
  "flightNo": "MU5101",                   // 航班号
  "passengerName": "王芳",                // 乘客姓名
  "passengerIdCard": "110101199001011234",// 乘客身份证
  "cabin": "Y",                           // 舱位 (F=头等, Y=经济)
  "quantity": 1,                          // 购买数量
  "totalPrice": 640,                      // 总价
  "status": "PAID",                       // 订单状态
  "paymentMethod": "ALIPAY",              // 支付方式
  "travelDate": "2026-05-02",             // 出行日期
  "createdAt": "2026-05-01T10:00:00Z",    // 创建时间
  "updatedAt": "2026-05-01T10:30:00Z"     // 最后更新时间
}
```

---

## ✅ 使用示例

### 在 Vue 组件中调用接口

```javascript
import { searchFlights } from '@/api/flight.js'
import { createOrder } from '@/api/order.js'
import { login } from '@/api/auth.js'

export default {
  methods: {
    async handleSearch() {
      try {
        const response = await searchFlights({
          origin: 'SHA',
          destination: 'PKX',
          date: '2026-05-02'
        })
        
        if (response.code === 200) {
          console.log('航班列表:', response.data)
        } else {
          console.error('查询失败:', response.message)
        }
      } catch (error) {
        console.error('请求出错:', error)
      }
    },
    
    async handleBook() {
      try {
        const response = await createOrder({
          flightNo: 'MU5101',
          cabin: 'Y',
          passengerName: '王芳',
          passengerIdCard: '110101199001011234',
          quantity: 1
        })
        
        if (response.code === 200) {
          console.log('预订成功，订单号:', response.data.orderId)
        }
      } catch (error) {
        console.error('预订失败:', error)
      }
    }
  }
}
```

---

## 🔗 接口清单速查表

### 认证模块 (7 个)
| 功能 | 方法 | 路径 |
|------|------|------|
| 发送验证码 | POST | `/api/auth/sendCode` |
| 用户注册 | POST | `/api/auth/register` |
| 用户登录 | POST | `/api/auth/login` |
| 用户登出 | POST | `/api/auth/logout` |
| 获取用户信息 | GET | `/api/user/profile` |
| 更新用户信息 | PUT | `/api/user/profile` |
| 绑定身份证 | POST | `/api/user/bind-idcard` |

### 航班模块 (16 个)
| 功能 | 方法 | 路径 |
|------|------|------|
| 查询航班 | GET | `/api/flights/search` |
| 获取航班详情 | GET | `/api/flights/:id` |
| 获取所有机场 | GET | `/api/airports` |
| 获取所有城市 | GET | `/api/cities` |
| 获取所有航班 | GET | `/api/flights` |
| 新增航班 | POST | `/api/flights` |
| 修改航班 | PUT | `/api/flights/:id` |
| 删除航班 | DELETE | `/api/flights/:id` |
| 获取航班实例 | GET | `/api/flight-instances` |
| 创建航班实例 | POST | `/api/flight-instances` |
| 修改航班实例 | PUT | `/api/flight-instances/:id` |
| 获取舱位定价 | GET | `/api/cabin-prices` |
| 设置舱位定价 | POST | `/api/cabin-prices` |
| 获取会员折扣 | GET | `/api/member-discounts` |
| 设置会员折扣 | POST | `/api/member-discounts` |
| 获取热门航线 | GET | `/api/statistics/popular-routes` |

### 订单模块 (11 个)
| 功能 | 方法 | 路径 |
|------|------|------|
| 创建预订 | POST | `/api/orders/book` |
| 查询行程记录 | GET | `/api/orders/history` |
| 获取订单详情 | GET | `/api/orders/:id` |
| 退票 | POST | `/api/orders/refund` |
| 支付订单 | POST | `/api/orders/pay` |
| 获取所有订单 | GET | `/api/orders` |
| 更新订单状态 | PUT | `/api/orders/:id/status` |
| 获取待处理订单 | GET | `/api/orders/pending` |
| 人工处理订单 | POST | `/api/orders/:id/handle` |
| 获取订单统计 | GET | `/api/statistics/orders` |
| 获取用户订单 | GET | `/api/users/:userId/orders` |

**总计：34 个接口**

---

## 📝 变更日志

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-06-14 | 初始版本，包含所有核心接口定义 |

---

## 💡 开发建议

### 前端开发
1. 严格按照此文档的接口路径和请求/响应格式编写代码
2. 使用 `src/api/auth.js`、`src/api/flight.js`、`src/api/order.js` 中提供的函数
3. 在调用接口时进行错误处理，检查 `response.code`
4. 本地测试时可使用 Mock 数据临时替代后端接口

### 后端开发
1. 严格按照此文档创建相应的路由处理器
2. 所有响应必须遵循统一的 JSON 格式 `{ code, data, message }`
3. 实现认证校验，需要认证的接口检查 `Authorization` 请求头
4. 实现权限校验，管理员接口需要检查用户角色
5. 异常处理：返回合适的 HTTP 状态码和错误信息

### 联调测试
1. 使用 Postman 或 curl 命令逐个测试后端接口
2. 验证请求参数和响应数据格式是否匹配
3. 测试各种异常场景（缺少参数、无效参数、未认证等）
4. 确保前端能正确解析后端响应


