# DS 航空票务管理系统

一个功能完整的航空票务管理系统，包含用户端和管理端，支持航班查询、机票购买、订单管理、航班实例管理等功能。

## 📋 项目概述

DS 航空票务管理系统是一个前后端分离的 Web 应用，为航空公司提供完整的票务管理解决方案。系统包括：

- **用户端**：乘客可以注册登录、查询航班、购买机票、办理退票/改签等
- **管理端**：管理员可以管理城市、机场、航班、航班实例、用户档案、订单流水等

## 🏗️ 项目架构

```
DatabaseProject/
├── airline-frontend/          # 前端应用（Vue 3 + Vite）
│   ├── src/
│   │   ├── views/
│   │   │   ├── CustomerView.vue    # 用户端界面
│   │   │   ├── AdminView.vue       # 管理员端界面
│   │   │   └── App.vue             # 应用根组件
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js
├── ds-aviation-backend/       # 后端应用（Python Flask）
│   ├── app.py                 # Flask 主应用
│   ├── database.py            # 数据库工具函数
│   └── requirements.txt
├── docs/                      # 项目文档
│   ├── API_AND_CODE_DOC.md
│   └── USER_OPERATION_DOC.md
└── airline_ticket.sql         # 数据库初始化脚本，需要导入本地数据库使用
```

## 🛠️ 技术栈

### 前端
- **框架**：Vue 3（Composition API）
- **构建工具**：Vite
- **路由**：Vue Router 4
- **HTTP 客户端**：Axios
- **UI 框架**：Bootstrap 5
- **图标库**：Font Awesome 7
- **数据可视化**：ECharts 6

### 后端
- **框架**：Flask
- **数据库**：MySQL
- **并发控制**：SELECT ... FOR UPDATE（悲观行锁）

## 🚀 快速开始

### 环境要求
- Node.js 16+
- Python 3.8+
- MySQL 5.7+

### 后端启动

1. **安装依赖**
```bash
pip install -r requirements.txt
```

2. **初始化数据库**
请先登录 MySQL 执行 CREATE DATABASE airline_ticket CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```bash
mysql -u root -p airline_ticket < ../airline_ticket.sql
```

3. **启动服务**
```bash
python app.py
```
输入你的本地 MySQL 密码后，服务将启动在 `http://127.0.0.1:5000`

### 前端启动

1. **安装依赖**
```bash
cd airline-frontend
npm install
```

2. **开发模式**
```bash
npm run dev
```
访问 `http://localhost:5173`

3. **生产构建**
```bash
npm run build
npm run preview
```

## 📱 使用指南

### 用户端功能

#### 1. 用户注册与登录
- 身份证号 + 密码注册新账户
- 注册后默认为普通乘客

#### 2. 航班查询与购买
- 按起落城市和日期查询航班
- 查看舱位定价和剩余座位
- 支持季节浮动定价和会员折扣
- 支持提前购票折扣

#### 3. 订单管理
- 查看个人行程记录
- 支持退票（订单改为"已退票"，座位自动返还）
- 支持改签（更换航班日期）
- 实时查看订单状态

### 管理员端功能

#### 登录
- 账号：`admin`
- 密码：`123456`
- 每次进入都需要重新登录

#### 1. 基础管理
- **资讯中心**：发布和管理航空相关资讯
- **用户档案**：查看乘客信息，修改会员等级
- **城市管理**：添加、编辑、删除城市
- **机场管理**：添加、编辑、删除机场

#### 2. 航班调度
- **航线管理**：新增/编辑/删除航班及经停信息
- **航班实例**：管理具体日期的航班实例
  - 修改航班状态（计划/延误/取消/完成）
  - 调整座位余量
  - 设置实际起降时间
  - 状态改为"取消"时自动同步用户订单为"航班取消"

#### 3. 交易处理
- **订单流水**：查看所有订单记录
- **订单筛选**：按状态、乘客名、航班号筛选
- **实时数据**：15 秒自动刷新航班实例数据

## 📊 数据模型

### 核心表结构

| 表名 | 说明 |
|-----|------|
| passenger | 乘客信息（身份证、姓名、手机号、会员等级） |
| flight | 航线基本信息（航班号、机型、座位数、起降时间） |
| flight_instance | 航班实例（特定日期的航班执行计划） |
| flight_stop | 航班停靠（起飞、经停、降落机场） |
| cabin_price | 舱位定价（头等舱、经济舱基准价） |
| ticket_record | 订单记录（乘客购票信息、状态、价格） |
| city | 城市基础数据 |
| airport | 机场基础数据 |
| vip_discount | 会员折扣规则 |

## 🔒 安全性

### 并发控制
- 使用 `SELECT ... FOR UPDATE` 实现悲观行锁
- 防止并发购票时座位超卖
- 原子扣减座位数，乐观兜底防负数

### 数据保护
- 密码采用 MD5 加密存储
- 前端显示用户身份证号时做掩码处理
- 交易记录完整追溯

## 🌟 核心特性

### 1. 动态票价系统
- **季节浮动**：旺季（7-8月、五一、中秋、国庆、春运）1.2x 基准价
- **会员折扣**：金卡/银卡/普通乘客差异化折扣
- **提前购票优惠**：提前购票、临期购票

### 2. 航班状态管理
- **自动更新**：后台定时任务每 15 秒检查过期航班
- **自动完成**：到达时间已过的航班自动标记为"完成"
- **订单同步**：航班取消时自动同步所有用户订单

### 3. 实时数据刷新
- 管理端航班实例列表每 15 秒自动刷新
- 显示最新的座位情况和航班状态
- 支持手动刷新

## 📝 API 接口

### 用户端接口
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `GET /api/search_flight` - 查询航班
- `GET /api/my_ticket` - 查看我的行程
- `POST /api/buy_ticket` - 购买机票
- `POST /api/refund_ticket` - 办理退票
- `POST /api/change_ticket` - 办理改签

### 管理端接口
- `GET /api/admin/flight/list` - 航班列表
- `POST /api/admin/flight/add` - 新增航班
- `POST /api/admin/flight_instance/list` - 航班实例列表
- `POST /api/admin/flight_instance/update` - 更新航班实例
- `POST /api/admin/flight_instance/del` - 删除航班实例
- `GET /api/admin/ticket_record/list` - 订单流水
- `GET /api/admin/passenger/list` - 用户档案列表
- `POST /api/admin/passenger/update_vip` - 修改会员等级
- `GET /api/admin/city/list` - 城市列表
- `POST /api/admin/city/add` - 新增城市
- `GET /api/admin/airport/list` - 机场列表
- `POST /api/admin/airport/add` - 新增机场

详见 `/docs/API_AND_CODE_DOC.md`

## 🔧 配置

### 数据库连接
编辑 `ds-aviation-backend/app.py` 第 44-50 行的数据库配置：
```python
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password":  enterpassword, #运行代码后会要求你输入本地数据库密码
    "database": "airline_ticket",
    "charset": "utf8mb4"
}
```

### 前端 API 地址
编辑 `airline-frontend/src/views/AdminView.vue` 和 `CustomerView.vue` 第 6 行：
```javascript
const API_BASE = 'http://127.0.0.1:5000/api'  // 修改为你的后端地址
```

## 📚 文档

- [API 与代码文档](./docs/API_AND_CODE_DOC.md) - 详细的 API 说明和代码注解
- [用户操作指南](./docs/USER_OPERATION_DOC.md) - 功能使用说明和业务流程


## 📄 许可

本项目为数据库课程作业用途。

---

**更新时间**: 2026-06-30  

