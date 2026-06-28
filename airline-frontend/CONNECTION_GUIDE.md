# 🔌 前后端连接手册

> 一份帮你从零跑通整个项目的指南

---

## 一、架构速览

```
浏览器 (localhost:5173)
    │
    ▼ HTTP
Vite 前端 dev server
    │ import { ... } from '@/api/flight.js'
    ▼ 请求 http://127.0.0.1:5000/api/...
Flask 后端 (app.py)
    │ pymysql
    ▼
MySQL (airline_ticket 数据库)
```

---

## 二、后端启动步骤

### 2.1 确保 MySQL 已运行

```powershell
# 检查 MySQL 服务
net start mysql    # 或 sc query mysql

# 登录验证
mysql -u root -p
```

### 2.2 创建数据库（如果还没有）

```sql
CREATE DATABASE IF NOT EXISTS airline_ticket CHARACTER SET utf8mb4;
USE airline_ticket;
```

### 2.3 检查 `app.py` 数据库配置

打开 `ds-aviation-backend/app.py`，确认第 10-17 行：

```python
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",          # ← 改成你的用户名
    "password": "123456",     # ← 改成你的密码
    "database": "airline_ticket",
    "charset": "utf8mb4"
}
```

### 2.4 ⚠️ 修复密码加密 Bug（致命！）

`app.py` 第 27 行必须加 `()`：

```python
# ❌ 当前（Bug）
return hashlib.md5(pwd.encode()).hexdigest

# ✅ 正确
return hashlib.md5(pwd.encode()).hexdigest()
```

### 2.5 安装 Python 依赖 & 启动

```powershell
cd ds-aviation-backend
pip install flask flask-cors pymysql
python app.py
```

看到 `Running on http://0.0.0.0:5000` 即成功。

### 2.6 快速验证后端

浏览器访问：`http://127.0.0.1:5000/api/admin/city/list`

应返回 JSON：`{"code": 200, "data": [...]}`

---

## 三、前端启动步骤

```powershell
cd airline-frontend
npm install        # 首次运行
npm run dev        # 启动 Vite dev server
```

看到 `http://localhost:5173/` 即成功。

---

## 四、常见故障排查

### ❌ 页面白屏

| 原因 | 解决方法 |
|------|----------|
| 后端未启动 | `python app.py` |
| 端口被占用 | 改 `app.py` 端口或 `taskkill /F /IM python.exe` |
| Vite 编译报错 | 查看终端红色错误信息 |
| 浏览器控制台报错 | F12 → Console 查看具体错误 |

### ❌ 后端连接失败 / 网络错误

| 原因 | 检查 |
|------|------|
| Flask 未启动 | 访问 `http://127.0.0.1:5000/api/admin/city/list` 验证 |
| CORS 已配置 | `app.py` 有 `CORS(app)` ✅ |
| MySQL 未运行 | `net start mysql` |
| 数据库不存在 | `CREATE DATABASE airline_ticket` |
| 表不存在 | 需要建表 SQL（联系 DBA） |
| 密码错误 | `.hexdigest` 是否加了 `()` |

### ❌ 注册/登录失败

| 原因 | 检查 |
|------|------|
| `.hexdigest` 缺 `()` | `app.py` 第 27 行 |
| 身份证已注册 | 换一个身份证号 |

### ❌ 城市/机场管理空白

| 原因 | 检查 |
|------|------|
| 表中无数据 | 先通过「新增城市/机场」添加数据 |
| `city`/`airport` 表不存在 | 执行建表 SQL |

---

## 五、接口连通性测试清单

在浏览器/Postman 依次测试：

```
✅ GET  http://127.0.0.1:5000/api/admin/city/list
✅ GET  http://127.0.0.1:5000/api/admin/airport/list
✅ POST http://127.0.0.1:5000/api/register  (Body: JSON)
✅ GET  http://127.0.0.1:5000/api/search_flight?start_city=SHA&end_city=PKX&fly_date=2026-06-01
```

全部返回 `"code": 200` 即表示后端完全正常。

---

## 六、快速启动命令（一键）

```powershell
# 终端 1：启动后端
cd ds-aviation-backend && python app.py

# 终端 2：启动前端
cd airline-frontend && npm run dev
```

然后浏览器打开 `http://localhost:5173/`
