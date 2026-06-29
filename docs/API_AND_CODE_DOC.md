# 航空售票系统 — 代码与 API 文档

## 目录

1. [项目结构](#一项目结构)
2. [环境依赖与安装](#二环境依赖与安装)
3. [后端启动](#三后端启动)
4. [前端启动](#四前端启动)
5. [数据库结构与访问逻辑](#五数据库结构与访问逻辑)
6. [后端 API 说明](#六后端-api-说明)
7. [前端代码说明](#七前端代码说明)
8. [测试方法](#八测试方法)

---

## 一、项目结构

```
DatabaseProject/
├── airline-frontend/          # 前端（Vue 3 + Vite）
│   ├── src/
│   │   ├── api/
│   │   │   ├── request.js     # Axios 实例、拦截器配置
│   │   │   ├── auth.js        # 注册/登录/我的行程 API
│   │   │   ├── order.js       # 购票/退票/改签 API
│   │   │   └── flight.js      # 航班/机场/城市查询 API（含管理员接口）
│   │   ├── router/
│   │   │   └── index.js       # 路由配置（/ 乘客页，/admin 管理页）
│   │   ├── views/
│   │   │   ├── CustomerView.vue   # 乘客端界面
│   │   │   └── AdminView.vue      # 管理员端界面
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js
│
├── ds-aviation-backend/       # 后端（Python Flask）
│   ├── app.py                 # 全部路由与业务逻辑
│   └── database.py            # （如存在）数据库辅助工具
│
├── airline_ticket.sql          # 数据库建表与初始化脚本
└── docs/
    ├── API_AND_CODE_DOC.md     # 本文档
    └── USER_OPERATION_DOC.md   # 用户操作文档
```

---

## 二、环境依赖与安装

### 2.1 后端依赖

| 依赖 | 版本要求 | 说明 |
|---|---|---|
| Python | ≥ 3.8 | 推荐 3.10+ |
| Flask | ≥ 2.x | Web 框架 |
| flask-cors | ≥ 3.x | 跨域支持 |
| pymysql | ≥ 1.x | MySQL 驱动 |
| MySQL | ≥ 5.7（推荐 8.0） | 数据库，必须使用 InnoDB 引擎 |

**安装后端依赖：**

```bash
pip install flask flask-cors pymysql
```

或者使用 requirements.txt（如有）：

```bash
pip install -r ds-aviation-backend/requirements.txt
```

### 2.2 前端依赖

| 依赖 | 版本 | 说明 |
|---|---|---|
| Node.js | ≥ 18 | 运行环境 |
| Vue 3 | ^3.5.32 | UI 框架 |
| Vite | ^8.0.10 | 构建工具 |
| Axios | ^1.17.0 | HTTP 请求 |
| Bootstrap | ^5.3.8 | CSS 样式 |
| ECharts | ^6.0.0 | 图表（管理页统计图） |
| vue-router | ^4.6.4 | 前端路由 |

**安装前端依赖：**

```bash
cd airline-frontend
npm install
```

### 2.3 数据库初始化

```bash
# 登录 MySQL
mysql -u root -p

# 在 MySQL 命令行中执行
source /path/to/DatabaseProject/airline_ticket.sql
```

或者通过客户端（Navicat / DBeaver）直接导入 `airline_ticket.sql`。

---

## 三、后端启动

```bash
cd ds-aviation-backend
python app.py
```

启动时会提示输入 MySQL 密码（通过 `getpass` 安全读取，密码不会显示在终端）：

```
请输入你的本地 MySQL 数据库密码: 
```

输入密码后，Flask 开发服务器启动在 `http://0.0.0.0:5000`。

**后端配置（`app.py` 顶部 `DB_CONFIG`）：**

```python
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",       # 修改为你的 MySQL 用户名
    "password": enterpassword,
    "database": "airline_ticket",
    "charset": "utf8mb4"
}
```

如需修改端口，修改 `app.py` 末尾：

```python
app.run(host="0.0.0.0", port=5000, debug=True)
```

---

## 四、前端启动

```bash
cd airline-frontend
npm run dev
```

默认访问地址：`http://localhost:5173`

前端通过 `src/api/request.js` 中的 `baseURL` 连接后端：

```js
const service = axios.create({
  baseURL: 'http://127.0.0.1:5000/api',
  timeout: 5000
})
```

如后端端口改变，同步修改此处 `baseURL`。

---

## 五、数据库结构与访问逻辑

### 5.1 核心表结构

```
passenger       乘客信息（身份证、姓名、手机号、会员等级、密码MD5）
city            城市（区号、城市名、省份）
airport         机场（机场代码、名称、所属城市）
flight          航班航线（航班号、机型、座位数、起降时间、执飞周期）
flight_stop     经停表（航班号、机场代码、顺序：起飞/经停N/降落）
flight_instance 航班实例（航班号+日期、余票、实际起降时间、状态）
cabin_price     舱位标准定价（航班号、舱位、标准价）
ticket_record   售票记录/订单（订单号、身份证、航班、日期、舱位、实付价、状态）
vip_discount    会员折扣（会员等级、提前天数区间、折扣率）
```

### 5.2 数据库连接方式

每个 API 函数通过 `get_db_conn()` 获取独立连接，请求结束后在 `finally` 块关闭：

```python
def get_db_conn():
    conn = pymysql.connect(**DB_CONFIG)
    cur = conn.cursor(pymysql.cursors.DictCursor)  # 返回字典格式，字段名即键名
    return conn, cur
```

使用 `DictCursor`，查询结果为字典列表，可直接通过字段名访问，例如：
```python
cur.execute("SELECT * FROM passenger WHERE id_card=%s", (id_card,))
user = cur.fetchone()
print(user["name"], user["phone"])
```

### 5.3 密码加密

```python
def encrypt_pwd(pwd):
    return hashlib.md5(pwd.encode('utf-8')).hexdigest()
```

密码以 MD5 摘要存储，注册时加密写入，登录时加密后比对，**原始密码不落库**。

### 5.4 定价计算逻辑

```
实际售价 = 标准定价 × 季节系数 × 会员折扣率

季节系数：
  旺季（7-8月暑假、五一、国庆、春运）→ 1.2
  淡季（1月上旬、2月节后、6月、12月）→ 0.8
  平季（其余）                        → 1.0

会员折扣率：从 vip_discount 表按（会员等级 + 提前购票天数）查询
```

---

## 六、后端 API 说明

所有接口均以 `http://127.0.0.1:5000/api` 为根路径。  
响应统一格式：`{ "code": 200/400/500, "msg": "...", "data": ... }`

---

### 6.1 用户注册

- **路径：** `POST /api/register`
- **描述：** 新乘客注册，默认会员等级为"普通"

**请求体：**
```json
{
  "id_card": "110101199001011234",
  "name": "张三",
  "phone": "13800138000",
  "password": "abc123"
}
```

**成功响应：**
```json
{ "code": 200, "msg": "注册成功" }
```

**失败响应：**
```json
{ "code": 400, "msg": "该身份证已注册，请直接登录" }
```

---

### 6.2 用户登录

- **路径：** `POST /api/login`
- **描述：** 身份证 + 密码登录，分步校验（先验证身份证存在，再验证密码）

**请求体：**
```json
{
  "id_card": "110101199001011234",
  "password": "abc123"
}
```

**成功响应：**
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "id_card": "110101199001011234",
    "name": "张三",
    "phone": "13800138000",
    "vip_level": "普通"
  }
}
```

**失败响应：**
```json
{ "code": 400, "msg": "该身份证还未注册，请先注册" }
{ "code": 400, "msg": "身份证或密码错误" }
```

---

### 6.3 查询我的行程

- **路径：** `GET /api/my_ticket?id_card={身份证号}`
- **描述：** 查询指定乘客的所有订单，含航班信息、起落机场、城市

**请求示例：**
```
GET /api/my_ticket?id_card=110101199001011234
```

**成功响应（data 为订单数组）：**
```json
{
  "code": 200,
  "data": [
    {
      "ticket_id": 1,
      "flight_no": "CA1001",
      "fly_date": "2025-07-15",
      "cabin_level": "经济舱",
      "real_price": 960.0,
      "ticket_status": "已支付",
      "dep_city_name": "北京",
      "arr_city_name": "上海",
      "depart_time": "08:00:00",
      "arrive_time": "10:05:00"
    }
  ]
}
```

---

### 6.4 查询航班

- **路径：** `GET /api/search_flight`
- **描述：** 按出发城市、到达城市、日期查询可订航班，含季节定价和会员折扣

**请求参数（Query String）：**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| start_city | string | 否 | 出发城市名/机场名/机场代码（模糊匹配） |
| end_city | string | 否 | 到达城市（模糊匹配） |
| fly_date | string | 否 | 出行日期 YYYY-MM-DD，不传则返回30天内航班 |
| id_card | string | 否 | 登录用户身份证（用于查询会员折扣），不登录可不传 |

**请求示例：**
```
GET /api/search_flight?start_city=北京&end_city=上海&fly_date=2025-07-15&id_card=110101199001011234
```

**成功响应：**
```json
{
  "code": 200,
  "data": [
    {
      "flight_no": "CA1001",
      "plane_model": "B737",
      "dep_city": "北京",
      "arr_city": "上海",
      "dep_airport": "首都国际机场",
      "arr_airport": "虹桥国际机场",
      "fly_date": "2025-07-15",
      "depart_time": "08:00:00",
      "arrive_time": "10:05:00",
      "first_remain": 8,
      "economy_remain": 120,
      "season_type": "旺季",
      "season_mult": 1.2,
      "discount_rate": 0.95,
      "advance_days": 30,
      "user_vip": "银卡",
      "cabins": [
        { "cabin_level": "头等舱", "standard_price": 2000, "seasonal_price": 2400, "real_price": 2280 },
        { "cabin_level": "经济舱", "standard_price": 800, "seasonal_price": 960, "real_price": 912 }
      ]
    }
  ],
  "extra": {
    "advance_days": 30,
    "user_vip_level": "银卡",
    "current_season": "旺季",
    "season_mult": 1.2
  }
}
```

---

### 6.5 购买机票

- **路径：** `POST /api/buy_ticket`
- **描述：** 购票，扣减对应舱位余票。已加悲观锁防并发超卖。

**请求体：**
```json
{
  "id_card": "110101199001011234",
  "flight_no": "CA1001",
  "fly_date": "2025-07-15",
  "cabin_level": "经济舱",
  "real_price": 912.0
}
```

**成功响应：**
```json
{ "code": 200, "msg": "购票成功" }
```

**失败响应：**
```json
{ "code": 400, "msg": "经济舱已售罄，余票不足" }
{ "code": 400, "msg": "您已购买过该航班，不可重复购票" }
```

---

### 6.6 退票

- **路径：** `POST /api/refund_ticket`
- **描述：** 订单状态改为"已退票"，归还对应舱位余票。已加悲观锁防重复退票。

**请求体：**
```json
{ "ticket_id": 1 }
```

**成功响应：**
```json
{ "code": 200, "msg": "退票成功" }
```

---

### 6.7 改签

- **路径：** `POST /api/change_ticket`
- **描述：** 更换航班/日期。旧订单标记"已改签"，生成新订单。已加悲观锁防超卖。

**请求体：**
```json
{
  "ticket_id": 1,
  "new_flight_no": "CA1002",
  "new_fly_date": "2025-07-20"
}
```

**成功响应：**
```json
{ "code": 200, "msg": "改签成功，新订单已生成" }
```

---

### 6.8 管理员接口（城市）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/city/list` | 获取所有城市 |
| POST | `/api/admin/city/add` | 新增城市（area_code, city_name, province） |
| POST | `/api/admin/city/edit` | 修改城市（area_code, city_name, province） |
| POST | `/api/admin/city/del` | 删除城市（area_code） |

---

### 6.9 管理员接口（机场）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/airport/list` | 获取所有机场 |
| POST | `/api/admin/airport/add` | 新增机场（airport_code, airport_name, area_code） |
| POST | `/api/admin/airport/edit` | 修改机场 |
| POST | `/api/admin/airport/del` | 删除机场（airport_code） |

---

### 6.10 管理员接口（航班航线）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/flight/list` | 获取所有航班（含经停、定价） |
| POST | `/api/admin/flight/add` | 新增航班（自动生成 7-8 月实例） |
| POST | `/api/admin/flight/edit` | 修改航班（含经停更新） |
| POST | `/api/admin/flight/del` | 删除航班及关联实例 |

**新增航班请求体示例：**
```json
{
  "flight_no": "CA1001",
  "plane_model": "B737",
  "first_class_num": 20,
  "economy_num": 150,
  "fly_week_day": "1,2,3,4,5",
  "depart_time": "08:00:00",
  "arrive_time": "10:05:00",
  "first_price": 2000,
  "economy_price": 800,
  "stops": [
    { "airport_code": "PEK", "stop_sort": "起飞" },
    { "airport_code": "SHA", "stop_sort": "降落" }
  ]
}
```

---

### 6.11 管理员接口（航班实例）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/flight_instance/list` | 获取所有实例 |
| POST | `/api/admin/flight_instance/add` | 新增实例（flight_no + fly_date） |
| POST | `/api/admin/flight_instance/update` | 修改实例状态、余票、实际时间 |
| POST | `/api/admin/flight_instance/del` | 删除实例 |

---

### 6.12 管理员接口（乘客与订单）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/passenger/list` | 乘客列表（不返回密码） |
| POST | `/api/admin/passenger/update_vip` | 修改会员等级（普通/银卡/金卡） |
| GET | `/api/admin/ticket_record/list` | 全部订单流水 |

---

## 七、前端代码说明

### 7.1 路由配置（`src/router/index.js`）

| 路径 | 组件 | 说明 |
|---|---|---|
| `/` | `CustomerView.vue` | 乘客端（查询/购票/行程/个人设置） |
| `/admin` | `AdminView.vue` | 管理员端（城市/机场/航班/订单管理） |

### 7.2 Axios 封装（`src/api/request.js`）

- `baseURL` 指向后端 `http://127.0.0.1:5000/api`
- 请求拦截器：从 `localStorage` 取 `token`，附加到 `Authorization: Bearer ...` 头
- 响应拦截器：`code === 200` 直接返回数据，其他 code 抛出异常供调用方 `.catch` 处理；`code === 401` 自动清除 token 并跳转登录

### 7.3 API 模块职责

| 文件 | 职责 | 对应后端路由 |
|---|---|---|
| `auth.js` | 注册、登录、我的行程 | `/register` `/login` `/my_ticket` |
| `order.js` | 购票、退票、改签 | `/buy_ticket` `/refund_ticket` `/change_ticket` |
| `flight.js` | 航班查询、管理员 CRUD | `/search_flight` 及 `/admin/...` 系列 |

---

## 八、测试方法

### 8.1 使用 curl 测试后端接口

**注册：**
```bash
curl -X POST http://127.0.0.1:5000/api/register \
  -H "Content-Type: application/json" \
  -d "{\"id_card\":\"110101199001011234\",\"name\":\"张三\",\"phone\":\"13800138000\",\"password\":\"abc123\"}"
```

**登录：**
```bash
curl -X POST http://127.0.0.1:5000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"id_card\":\"110101199001011234\",\"password\":\"abc123\"}"
```

**查询航班：**
```bash
curl "http://127.0.0.1:5000/api/search_flight?start_city=北京&end_city=上海&fly_date=2025-07-15"
```

### 8.2 并发安全测试（Python 脚本）

以下脚本模拟 10 个用户同时购买同一张余票为 1 的机票，正确结果是仅 1 人成功：

```python
import concurrent.futures
import requests

URL = "http://127.0.0.1:5000/api/buy_ticket"

def buy(i):
    resp = requests.post(URL, json={
        "id_card": f"11010119900101{1000+i:04d}",  # 每人不同身份证
        "flight_no": "CA1001",
        "fly_date": "2025-07-15",
        "cabin_level": "经济舱",
        "real_price": 912.0
    })
    return resp.json()

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
    results = list(pool.map(buy, range(10)))

success = [r for r in results if r["code"] == 200]
print(f"成功购票: {len(success)} 人（期望：1 人）")
for r in results:
    print(r["msg"])
```

### 8.3 浏览器测试流程

1. 打开 `http://localhost:5173`
2. 注册新账号（填写身份证、姓名、手机号、密码）
3. 登录 → 进入乘客界面
4. 输入起始城市、日期 → 点击搜索
5. 选择航班 → 点击购票
6. 进入"我的行程" → 测试退票、改签

管理员页面访问 `http://localhost:5173/admin`，无需登录验证（当前版本）。

---

*文档版本：v1.0 | 生成时间：2026-06-29*
