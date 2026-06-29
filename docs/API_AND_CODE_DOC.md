# 航空售票系统 — 代码与 API 文档

## 目录

1. [项目结构](#一项目结构)
2. [环境依赖](#二环境依赖)
3. [系统启动（前端+后端）](#三系统启动前端后端)
4. [数据库结构](#四数据库结构)
5. [后端 API 说明](#五后端-api-说明)
6. [前端代码说明](#六前端代码说明)

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

## 二、环境依赖

**详见用户操作手册**

| 后端 | 版本 | 前端 | 版本 |
|---|---|---|---|
| Python | ≥ 3.8 | Node.js | ≥ 18 |
| Flask | ≥ 2.x | Vue 3 | ^3.5.32 |
| pymysql | ≥ 1.x | Axios | ^1.17.0 |
| MySQL | ≥ 5.7 | Vite | ^8.0.10 |

---

## 三、系统启动（前端+后端）

**详见用户操作手册**


**登录凭证：**
- 乘客：注册后用身份证+密码登录
- 管理员：账号 `admin`，密码 `123456`



如需修改端口，修改 `app.py` 末尾：

```python
app.run(host="0.0.0.0", port=5000, debug=True)
```
---


## 四、数据库结构

### 4.1 核心表结构


|表名|关系模式|
|---|---|
|passenger|       乘客信息（身份证号、姓名、手机号码、会员等级、密码）|
|city          |  城市（行政区划代码、城市名称、省份）|
|airport        | 机场（机场代码、机场名称、行政区划代码）|
|flight        |  航班航线（航班号、飞机机型、头等舱数、经济舱数、每周飞行日、起飞时间、到达时间）|
|flight_stop    | 经停表（航班号、机场代码、停靠类型）|
|flight_instance| 航班实例（航班号、飞行日期、航班状态、实际起飞时间、实际到达时间、头等舱剩余、经济舱剩余）|
|cabin_price   |  舱位标准定价（航班号、舱位等级、标准票价）|
|ticket_record  | 售票记录（售票编号、身份证号、航班号、飞行日期、舱位等级、实际售价、售票状态）|
|vip_discount   | 会员折扣（会员折扣档、会员等级、提前天数区间（最小提前天数，最大提前天数）、购票折扣率）|


### 4.2 数据库连接方式

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

### 4.3 密码加密

```python
def encrypt_pwd(pwd):
    return hashlib.md5(pwd.encode('utf-8')).hexdigest()
```

密码以 MD5 摘要存储，注册时加密写入，登录时加密后比对，**原始密码不以明文存储**。


---

## 五、后端 API 说明（app.py）

### 乘客接口

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/register` | POST | 用户注册 |
| `/api/login` | POST | 用户登录 |
| `/api/my_ticket` | GET | 查询我的行程 |
| `/api/search_flight` | GET | 搜索航班 |
| `/api/buy_ticket` | POST | 购买机票 |
| `/api/refund_ticket` | POST | 退票 |
| `/api/change_ticket` | POST | 改签 |

### 管理员接口

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/admin/passenger/list` | GET | 用户列表 |
| `/api/admin/passenger/update_vip` | POST | 更新会员等级 |
| `/api/admin/city/list` | GET | 城市列表 |
| `/api/admin/city/add` | POST | 新增城市 |
| `/api/admin/city/edit` | POST | 编辑城市 |
| `/api/admin/city/del` | POST | 删除城市 |
| `/api/admin/airport/list` | GET | 机场列表 |
| `/api/admin/airport/add` | POST | 新增机场 |
| `/api/admin/airport/edit` | POST | 编辑机场 |
| `/api/admin/airport/del` | POST | 删除机场 |
| `/api/admin/flight/list` | GET | 航线列表 |
| `/api/admin/flight/add` | POST | 新增航线 |
| `/api/admin/flight/edit` | POST | 编辑航线 |
| `/api/admin/flight/del` | POST | 删除航线 |
| `/api/admin/flight_instance/list` | GET | 航班实例列表 |
| `/api/admin/flight_instance/add` | POST | 新增航班实例 |
| `/api/admin/flight_instance/del` | POST | 删除航班实例 |
| `/api/admin/flight_instance/update` | POST | 更新航班实例 |
| `/api/admin/ticket_record/list` | GET | 订单流水 |

---

## 六、前端代码说明

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
| `auth.js` | 注册、登录、我的行程等 | `/register` `/login` `/my_ticket` |
| `order.js` | 购票、退票、改签等 | `/buy_ticket` `/refund_ticket` `/change_ticket` |
| `flight.js` | 航班查询、管理员 CRUD等 | `/search_flight` 及 `/admin/...` 系列 |



---
