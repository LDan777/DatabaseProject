from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import hashlib
import getpass
import threading
import time

from datetime import datetime, date, timedelta

# 获取当年7、8月所有日期
def get_july_august_dates():
    current_year = datetime.now().year
    date_list = []
    # 7月1日 ~ 8月31日
    start = date(current_year, 7, 1)
    end = date(current_year, 8, 31)
    day = start
    while day <= end:
        date_list.append(day)
        day += timedelta(days=1)
    return date_list

# 数字转星期字符串：python weekday() 0=周一,6=周日 → 对应SET '1','2'...'7'
def weekday_to_set_str(dt: date):
    w = dt.weekday()  # 0周一,6周日
    return str(w + 1)

app = Flask(__name__)
CORS(app)  # 解决前端跨域

# 1. 使用 input() 接收键盘输入的密码
enterpassword = getpass.getpass("请输入你的本地 MySQL 数据库密码: ")


# ======================【需要你修改1：数据库连接配置】======================
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",       # 你的mysql用户名
    "password": enterpassword, 
    "database": "airline_ticket",
    "charset": "utf8mb4"
}

# 数据库连接工具
def get_db_conn():
    conn = pymysql.connect(**DB_CONFIG)
    cur = conn.cursor(pymysql.cursors.DictCursor)
    return conn, cur

# 密码加密工具
def encrypt_pwd(pwd):
    try:
        return hashlib.md5(pwd.encode('utf-8')).hexdigest()
    except Exception:
        return hashlib.md5(str(pwd).encode('utf-8')).hexdigest()

# ====================== 后台定时任务：检查过期航班并更新状态 ======================
def check_and_update_completed_flights():
    """每15秒检查一次：如果航班到达时间已过，自动更新航班实例和订单状态"""
    while True:
        try:
            time.sleep(15)  # 每15秒检查一次
            conn, cur = get_db_conn()
            
            # 获取当前时刻
            now = datetime.now()
            now_time_str = now.strftime("%H:%M:%S")
            today_str = now.strftime("%Y-%m-%d")
            
            # 1. 检查已到达的航班实例（日期小于今天，或日期等于今天但到达时间已过）
            cur.execute("""
                SELECT fi.flight_no, fi.fly_date, fi.arrive_time_actual
                FROM flight_instance fi
                WHERE fi.flight_status = '计划'
                AND (fi.fly_date < %s 
                     OR (fi.fly_date = %s AND fi.arrive_time_actual <= %s))
            """, (today_str, today_str, now_time_str))
            
            completed_instances = cur.fetchall()
            
            for inst in completed_instances:
                flight_no = inst["flight_no"]
                fly_date = inst["fly_date"]
                
                # 更新航班实例状态为"完成"
                cur.execute("""
                    UPDATE flight_instance 
                    SET flight_status = '完成'
                    WHERE flight_no = %s AND fly_date = %s
                """, (flight_no, fly_date))
                
                # 更新该航班所有"已支付"订单为"已完成"
                cur.execute("""
                    UPDATE ticket_record 
                    SET ticket_status = '已完成'
                    WHERE flight_no = %s AND fly_date = %s 
                    AND ticket_status = '已支付'
                """, (flight_no, fly_date))
            
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[定时任务] 检查过期航班失败: {e}")
            try:
                conn.rollback()
                conn.close()
            except:
                pass

def get_season_type(fly_date: str) -> str:
    d = datetime.strptime(fly_date, "%Y-%m-%d").date()
    year = d.year
    month = d.month
    day = d.day

    # 旺季：7.1-8.31暑假、五一、中秋、国庆、春运春节（简化规则，基础区间判断）
    is_summer = (month == 7) or (month == 8)
    is_national = (month == 10 and day <=7)
    is_may = (month ==5 and day <=5)
    # 1月下旬/2月春节简化判定（业务可自行微调）
    is_spring_festival = (month == 1 and day >=20) or (month ==2 and day <=20)
    if is_summer or is_national or is_may or is_spring_festival:
        return "旺季"

    # 淡季：1月上旬、2月节后、6月全月、12月非假期
    off_season = (month ==1 and day <=19) or (month ==2 and day >=21) or (month ==6) or (month ==12)
    if off_season:
        return "淡季"

    # 其余全部平季
    return "平季"

# ====================== 乘客用户接口 ======================
# 1. 用户注册
@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.json
        id_card = data.get("id_card", "").strip()
        name = data.get("name", "").strip()
        phone = data.get("phone", "").strip()
        password = data.get("password", "")
        if not all([id_card, name, phone, password]):
            return jsonify({"code": 400, "msg": "请填写完整的注册信息（身份证、姓名、手机号、密码）"})
        vip_level = "普通"  # 新用户默认普通乘客

        conn, cur = get_db_conn()
        # 判断身份证是否已注册
        cur.execute("SELECT 1 FROM passenger WHERE id_card=%s", (id_card,))
        if cur.fetchone():
            conn.close()
            return jsonify({"code": 400, "msg": "该身份证已注册，请直接登录"})
        
        sql = """
        INSERT INTO passenger(id_card, name, vip_level, phone, password)
        VALUES (%s, %s, %s, %s, %s)
        """
        cur.execute(sql, (id_card, name, vip_level, phone, encrypt_pwd(password)))
        conn.commit()
        conn.close()
        return jsonify({"code": 200, "msg": "注册成功"})
    except Exception as e:
        try: conn.rollback()
        except: pass
        try: conn.close()
        except: pass
        return jsonify({"code": 500, "msg": f"注册失败: {str(e)}"})

# 2. 用户登录（身份证+密码）——分步校验
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    id_card = data.get("id_card")
    password = data.get("password")
    pwd_md5 = encrypt_pwd(password)

    conn, cur = get_db_conn()
    # 第一步：查询身份证是否存在（不验证密码）
    cur.execute("SELECT * FROM passenger WHERE id_card=%s", (id_card,))
    user = cur.fetchone()
    if not user:
        conn.close()
        return jsonify({"code": 400, "msg": "该身份证还未注册，请先注册"})

    # 第二步：身份证存在，验证密码是否匹配
    cur.execute("SELECT * FROM passenger WHERE id_card=%s AND password=%s", (id_card, pwd_md5))
    user = cur.fetchone()
    conn.close()
    if not user:
        return jsonify({"code": 400, "msg": "身份证或密码错误"})
    return jsonify({"code": 200, "msg": "登录成功", "data": user})

# 3. 查询我的已定行程（售票记录）+ 起落机场
@app.route("/api/my_ticket", methods=["GET"])
def my_ticket():
    id_card = request.args.get("id_card")
    conn, cur = get_db_conn()
    sql = """
    SELECT tr.ticket_id, tr.id_card, tr.flight_no, tr.fly_date,
           tr.cabin_level, tr.real_price, tr.ticket_status,
           f.flight_no AS flight_no_display, f.plane_model, f.depart_time, f.arrive_time,
           fi.flight_status, fi.depart_time_actual,
           a1.airport_name AS dep_airport, a2.airport_name AS arr_airport,
           c1.area_code AS dep_city_code, c2.area_code AS arr_city_code,
           c1.city_name AS dep_city_name, c2.city_name AS arr_city_name
    FROM ticket_record tr
    LEFT JOIN flight f ON tr.flight_no=f.flight_no
    LEFT JOIN flight_instance fi ON tr.flight_no=fi.flight_no AND tr.fly_date=fi.fly_date
    LEFT JOIN flight_stop s1 ON f.flight_no=s1.flight_no AND s1.stop_sort='起飞'
    LEFT JOIN airport a1 ON s1.airport_code=a1.airport_code
    LEFT JOIN city c1 ON a1.area_code=c1.area_code
    LEFT JOIN flight_stop s2 ON f.flight_no=s2.flight_no AND s2.stop_sort='降落'
    LEFT JOIN airport a2 ON s2.airport_code=a2.airport_code
    LEFT JOIN city c2 ON a2.area_code=c2.area_code
    WHERE tr.id_card=%s
    ORDER BY tr.fly_date DESC
    """
    cur.execute(sql, (id_card,))
    tickets = cur.fetchall()
    conn.close()
    for t in tickets:
        for key in ("depart_time", "arrive_time", "depart_time_actual"):
            val = t.get(key)
            if val is not None and hasattr(val, "total_seconds"):
                total = int(val.total_seconds())
                h, m = divmod(total // 60, 60)
                t[key] = f"{h:02d}:{m:02d}:{total % 60:02d}"
        if hasattr(t.get("fly_date"), "isoformat"):
            t["fly_date"] = t["fly_date"].isoformat()
    return jsonify({"code": 200, "data": tickets})

# 4. 根据起落城市+日期查询航班、舱位定价、剩余座位（含季节浮动+会员折扣+提前购票）
@app.route("/api/search_flight", methods=["GET"])
def search_flight():
    start_city = (request.args.get("start_city") or "").strip()
    end_city = (request.args.get("end_city") or "").strip()
    fly_date = (request.args.get("fly_date") or "").strip()
    id_card = request.args.get("id_card", "")  # 可选：登录用户传身份证，未登录为空

    conn, cur = get_db_conn()

    # 动态构建查询条件
    where_parts = ["s1.stop_sort='起飞'", "s2.stop_sort='降落'"]
    params = []

    # 日期范围：有指定日期则精确匹配，否则默认今天起30天内
    if fly_date:
        date_start = fly_date
        date_end = fly_date
    else:
        today = date.today()
        date_start = today.isoformat()
        date_end = (today + timedelta(days=30)).isoformat()
    params.extend([date_start, date_end])

    # 出发城市模糊搜索
    if start_city:
        like_start = f"%{start_city}%"
        where_parts.append("(c1.city_name LIKE %s OR a1.airport_name LIKE %s OR a1.airport_code LIKE %s)")
        params.extend([like_start, like_start, like_start])

    # 到达城市模糊搜索
    if end_city:
        like_end = f"%{end_city}%"
        where_parts.append("(c2.city_name LIKE %s OR a2.airport_name LIKE %s OR a2.airport_code LIKE %s)")
        params.extend([like_end, like_end, like_end])

    where_clause = " AND ".join(where_parts)

    sql = f"""
    SELECT DISTINCT f.flight_no, f.plane_model, f.depart_time, f.arrive_time,
           fi.fly_date, fi.first_remain, fi.economy_remain, fi.flight_status,
           cp.cabin_level, cp.standard_price,
           a1.airport_name AS dep_airport, c1.city_name AS dep_city,
           a2.airport_name AS arr_airport, c2.city_name AS arr_city
    FROM flight f
    JOIN flight_stop s1 ON f.flight_no = s1.flight_no
    JOIN airport a1 ON s1.airport_code = a1.airport_code
    JOIN city c1 ON a1.area_code = c1.area_code
    JOIN flight_stop s2 ON f.flight_no = s2.flight_no
    JOIN airport a2 ON s2.airport_code = a2.airport_code
    JOIN city c2 ON a2.area_code = c2.area_code
    LEFT JOIN flight_instance fi ON f.flight_no=fi.flight_no 
        AND fi.fly_date >= %s AND fi.fly_date <= %s
        AND fi.first_remain + fi.economy_remain > 0
    LEFT JOIN cabin_price cp ON f.flight_no=cp.flight_no
    WHERE {where_clause}
    ORDER BY fi.fly_date, f.flight_no
    LIMIT 50
    """
    cur.execute(sql, params)
    flight_raw = cur.fetchall()

    # 季节浮动系数
    season = "平季"
    season_mult = 1.0
    if fly_date:
        season = get_season_type(fly_date)
        season_map = {"旺季": 1.2, "平季": 1.0, "淡季": 0.8}
        season_mult = season_map.get(season, 1.0)

    # 提前购票天数
    if fly_date:
        fly_dt = datetime.strptime(fly_date, "%Y-%m-%d").date()
        advance_days = (fly_dt - date.today()).days
        if advance_days < 0:
            advance_days = 0
    else:
        advance_days = 0

    # 用户会员等级与折扣
    user_vip = "普通"
    discount = 1.00
    if id_card:
        cur.execute("SELECT vip_level FROM passenger WHERE id_card=%s", (id_card,))
        user_row = cur.fetchone()
        if user_row:
            user_vip = user_row["vip_level"]
    try:
        cur.execute("""
            SELECT discount_rate FROM vip_discount
            WHERE vip_level=%s AND %s BETWEEN min_advance_day AND max_advance_day
            LIMIT 1
        """, (user_vip, advance_days))
        discount_row = cur.fetchone()
        if discount_row:
            discount = float(discount_row["discount_rate"])
    except Exception:
        discount = 1.00  # vip_discount 表不存在时降级

    conn.close()

    # 遍历结果，按航班号聚合舱位，计算实际售价
    flight_map = {}
    for item in flight_raw:
        fno = item["flight_no"]
        # 跳过没有实例的航班（LEFT JOIN 返回 NULL 或 first_remain 为空）
        if item.get("fly_date") is None or item.get("first_remain") is None:
            continue
        if fno not in flight_map:
            f = {}
            for k, v in item.items():
                if k in ("cabin_level", "standard_price"):
                    continue
                if hasattr(v, "total_seconds"):
                    total = int(v.total_seconds())
                    h, m = divmod(total // 60, 60)
                    f[k] = f"{h:02d}:{m:02d}:{total % 60:02d}"
                elif hasattr(v, "isoformat"):
                    f[k] = v.isoformat()
                else:
                    f[k] = v
            f["season_type"] = season
            f["season_mult"] = season_mult
            f["discount_rate"] = discount
            f["advance_days"] = advance_days
            f["user_vip"] = user_vip
            f["cabins"] = []
            flight_map[fno] = f

        cabin = item.get("cabin_level")
        base_price = float(item["standard_price"]) if item.get("standard_price") else 0
        if cabin and base_price > 0:
            # 🔧 防御性去重：当 fly_date 为空（如改签模式）时，
            # LEFT JOIN flight_instance 可能匹配多条实例记录，
            # 与 cabin_price 形成笛卡尔积导致同一 cabin_level 被多次 append
            existing_levels = [c["cabin_level"] for c in flight_map[fno]["cabins"]]
            if cabin not in existing_levels:
                seasonal_price = round(base_price * season_mult, 2)
                real_price = round(seasonal_price * discount, 2)
                flight_map[fno]["cabins"].append({
                    "cabin_level": cabin,
                    "standard_price": base_price,
                    "seasonal_price": seasonal_price,
                    "real_price": real_price
                })

    # 为每个航班加载经停信息
    conn, cur = get_db_conn()
    for fno, fdata in flight_map.items():
        cur.execute("""
            SELECT a.airport_name FROM flight_stop fs
            JOIN airport a ON fs.airport_code = a.airport_code
            WHERE fs.flight_no=%s AND fs.stop_sort LIKE '经停%%'
            ORDER BY fs.stop_sort
        """, (fno,))
        stops = [r["airport_name"] for r in cur.fetchall()]
        if stops:
            fdata["stopovers"] = " → ".join(stops)
    conn.close()

    return jsonify({
        "code": 200,
        "data": list(flight_map.values()),
        "extra": {
            "advance_days": advance_days,
            "user_vip_level": user_vip,
            "current_season": season,
            "season_mult": season_mult
        }
    })

# 5. 购买机票（生成订单，扣减余票）—— 并发安全版本
# 并发控制策略：
#   1. SELECT ... FOR UPDATE 对目标行加悲观行锁，阻塞同一航班的并发购票请求
#   2. UPDATE ... WHERE remain > 0 原子扣减，即使锁粒度失效也不会写出负数
#   3. 检查 rowcount == 0 判断是否被并发抢光（乐观兜底）
@app.route("/api/buy_ticket", methods=["POST"])
def buy_ticket():
    data = request.json
    id_card = data["id_card"]
    flight_no = data["flight_no"]
    fly_date = data["fly_date"]
    cabin_level = data["cabin_level"]
    real_price = data["real_price"]

    conn, cur = get_db_conn()
    try:
        # 0. 用 FOR UPDATE 对航班实例行加悲观行锁
        #    同一 (flight_no, fly_date) 的并发请求将在此处串行化排队
        cur.execute(
            "SELECT first_remain, economy_remain FROM flight_instance "
            "WHERE flight_no=%s AND fly_date=%s FOR UPDATE",
            (flight_no, fly_date)
        )
        inst = cur.fetchone()
        if not inst:
            conn.rollback()
            return jsonify({"code": 400, "msg": "该航班实例不存在或已取消"})

        remain = inst["first_remain"] if cabin_level == "头等舱" else inst["economy_remain"]
        if remain <= 0:
            conn.rollback()
            return jsonify({"code": 400, "msg": f"{cabin_level}已售罄，余票不足"})

        # 0.5 校验用户是否已购买同一航班（防止重复购票）
        cur.execute(
            "SELECT 1 FROM ticket_record WHERE id_card=%s AND flight_no=%s AND fly_date=%s "
            "AND ticket_status NOT IN ('已退票')",
            (id_card, flight_no, fly_date)
        )
        if cur.fetchone():
            conn.rollback()
            return jsonify({"code": 400, "msg": "您已购买过该航班，不可重复购票"})

        # 1. 原子扣减座位：WHERE remain > 0 是第二道防线
        #    即使锁因配置问题未生效，此条件也能保证不写出负数
        if cabin_level == "头等舱":
            cur.execute(
                "UPDATE flight_instance SET first_remain=first_remain-1 "
                "WHERE flight_no=%s AND fly_date=%s AND first_remain > 0",
                (flight_no, fly_date)
            )
        else:
            cur.execute(
                "UPDATE flight_instance SET economy_remain=economy_remain-1 "
                "WHERE flight_no=%s AND fly_date=%s AND economy_remain > 0",
                (flight_no, fly_date)
            )

        # rowcount == 0 说明刚才的 FOR UPDATE 读到余票后被并发请求抢光
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"code": 400, "msg": f"{cabin_level}已售罄，请重新查询"})

        # 2. 插入售票记录 状态=已支付
        sql_ticket = """
        INSERT INTO ticket_record(id_card, flight_no, fly_date, cabin_level, real_price, ticket_status)
        VALUES (%s, %s, %s, %s, %s, '已支付')
        """
        cur.execute(sql_ticket, (id_card, flight_no, fly_date, cabin_level, real_price))

        conn.commit()
        return jsonify({"code": 200, "msg": "购票成功"})
    except Exception as e:
        conn.rollback()
        return jsonify({"code": 500, "msg": f"购票失败:{str(e)}"})
    finally:
        conn.close()

# 6. 退票接口（订单改为已退票，返还座位）—— 并发安全版本
# 并发控制：用 FOR UPDATE 锁住订单行，防止同一张票被并发退两次（重复归还座位）
@app.route("/api/refund_ticket", methods=["POST"])
def refund_ticket():
    ticket_id = request.json["ticket_id"]
    conn, cur = get_db_conn()
    try:
        # 用 FOR UPDATE 锁住订单行，防止并发重复退票
        cur.execute(
            "SELECT * FROM ticket_record WHERE ticket_id=%s FOR UPDATE",
            (ticket_id,)
        )
        ticket = cur.fetchone()
        if not ticket or ticket["ticket_status"] in ["已退票", "已完成"]:
            conn.rollback()
            return jsonify({"code": 400, "msg": "无法退票（订单不存在或已处理）"})

        flight_no = ticket["flight_no"]
        fly_date = ticket["fly_date"]
        cabin = ticket["cabin_level"]

        # 原子修改订单状态（WHERE 加状态条件防并发二次退票）
        cur.execute(
            "UPDATE ticket_record SET ticket_status='已退票' "
            "WHERE ticket_id=%s AND ticket_status NOT IN ('已退票', '已完成')",
            (ticket_id,)
        )
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"code": 400, "msg": "退票失败，订单状态已变更，请刷新后重试"})

        # 归还座位
        if cabin == "头等舱":
            cur.execute(
                "UPDATE flight_instance SET first_remain=first_remain+1 "
                "WHERE flight_no=%s AND fly_date=%s",
                (flight_no, fly_date)
            )
        else:
            cur.execute(
                "UPDATE flight_instance SET economy_remain=economy_remain+1 "
                "WHERE flight_no=%s AND fly_date=%s",
                (flight_no, fly_date)
            )
        conn.commit()
        return jsonify({"code": 200, "msg": "退票成功"})
    except Exception as e:
        conn.rollback()
        return jsonify({"code": 500, "msg": str(e)})
    finally:
        conn.close()

# 7. 改签接口（起落城市不变，更换航班日期）—— 并发安全版本
# 并发控制：
#   - FOR UPDATE 锁住原订单行，防止同一张票被并发改签两次
#   - FOR UPDATE 锁住目标航班实例行，防止新航班被并发超卖
#   - 原子扣减 + rowcount 兜底防止目标舱位在锁内被抢光
@app.route("/api/change_ticket", methods=["POST"])
def change_ticket():
    data = request.json
    ticket_id = data["ticket_id"]
    new_flight_no = data["new_flight_no"]
    new_fly_date = data["new_fly_date"]
    conn, cur = get_db_conn()
    try:
        # 1. FOR UPDATE 锁住原订单行，防止并发重复改签
        cur.execute(
            "SELECT * FROM ticket_record WHERE ticket_id=%s FOR UPDATE",
            (ticket_id,)
        )
        old = cur.fetchone()
        if not old:
            conn.rollback()
            return jsonify({"code": 400, "msg": "订单不存在"})
        if old["ticket_status"] in ("已退票", "已改签"):
            conn.rollback()
            return jsonify({"code": 400, "msg": f"订单状态为「{old['ticket_status']}」，不可改签"})

        old_flight = old["flight_no"]
        old_date = old["fly_date"]
        cabin = old["cabin_level"]

        # 2. FOR UPDATE 锁住目标航班实例行，防止并发超卖
        cur.execute(
            "SELECT first_remain, economy_remain FROM flight_instance "
            "WHERE flight_no=%s AND fly_date=%s FOR UPDATE",
            (new_flight_no, new_fly_date)
        )
        new_inst = cur.fetchone()
        if not new_inst:
            conn.rollback()
            return jsonify({"code": 400, "msg": "目标航班实例不存在"})
        new_remain = new_inst["first_remain"] if cabin == "头等舱" else new_inst["economy_remain"]
        if new_remain <= 0:
            conn.rollback()
            return jsonify({"code": 400, "msg": f"目标航班{cabin}已售罄"})

        # 3. 原航班归还座位
        if cabin == "头等舱":
            cur.execute(
                "UPDATE flight_instance SET first_remain=first_remain+1 "
                "WHERE flight_no=%s AND fly_date=%s",
                (old_flight, old_date)
            )
        else:
            cur.execute(
                "UPDATE flight_instance SET economy_remain=economy_remain+1 "
                "WHERE flight_no=%s AND fly_date=%s",
                (old_flight, old_date)
            )

        # 4. 原子扣减新航班座位（WHERE remain > 0 兜底防负数）
        if cabin == "头等舱":
            cur.execute(
                "UPDATE flight_instance SET first_remain=first_remain-1 "
                "WHERE flight_no=%s AND fly_date=%s AND first_remain > 0",
                (new_flight_no, new_fly_date)
            )
        else:
            cur.execute(
                "UPDATE flight_instance SET economy_remain=economy_remain-1 "
                "WHERE flight_no=%s AND fly_date=%s AND economy_remain > 0",
                (new_flight_no, new_fly_date)
            )
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"code": 400, "msg": f"目标航班{cabin}已售罄，请重新选择"})

        # 5. 原子标记旧订单为已改签（WHERE 加状态条件防并发二次改签）
        cur.execute(
            "UPDATE ticket_record SET ticket_status='已改签' "
            "WHERE ticket_id=%s AND ticket_status NOT IN ('已退票', '已改签')",
            (ticket_id,)
        )
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"code": 400, "msg": "改签失败，订单状态已变更，请刷新后重试"})

        # 6. 为新航班创建新订单（状态=已支付）
        cur.execute(
            "INSERT INTO ticket_record(id_card, flight_no, fly_date, cabin_level, real_price, ticket_status) "
            "VALUES (%s, %s, %s, %s, %s, '已支付')",
            (old["id_card"], new_flight_no, new_fly_date, old["cabin_level"], old["real_price"])
        )

        conn.commit()
        return jsonify({"code": 200, "msg": "改签成功，新订单已生成"})
    except Exception as e:
        conn.rollback()
        return jsonify({"code": 500, "msg": str(e)})
    finally:
        conn.close()

# ====================== 管理员接口（城市、机场、航班、航班实例CRUD） ======================

# 乘客列表（管理员查看，密码不返回）
# 订单流水（管理员查看全部 ticket_record）
@app.route("/api/admin/ticket_record/list", methods=["GET"])
def admin_ticket_record_list():
    conn, cur = get_db_conn()
    sql = """
    SELECT tr.*, p.name AS passenger_name, p.phone,
           f.depart_time, f.arrive_time,
           a1.airport_name AS dep_airport, a2.airport_name AS arr_airport
    FROM ticket_record tr
    LEFT JOIN passenger p ON tr.id_card = p.id_card
    LEFT JOIN flight f ON tr.flight_no = f.flight_no
    LEFT JOIN flight_stop s1 ON f.flight_no=s1.flight_no AND s1.stop_sort='起飞'
    LEFT JOIN airport a1 ON s1.airport_code=a1.airport_code
    LEFT JOIN flight_stop s2 ON f.flight_no=s2.flight_no AND s2.stop_sort='降落'
    LEFT JOIN airport a2 ON s2.airport_code=a2.airport_code
    ORDER BY tr.ticket_id DESC
    """
    cur.execute(sql)
    rows = cur.fetchall()
    conn.close()
    for r in rows:
        for k in ("depart_time", "arrive_time"):
            v = r.get(k)
            if v is not None and hasattr(v, "total_seconds"):
                total = int(v.total_seconds())
                h, m = divmod(total // 60, 60)
                r[k] = f"{h:02d}:{m:02d}:{total % 60:02d}"
        if hasattr(r.get("fly_date"), "isoformat"):
            r["fly_date"] = r["fly_date"].isoformat()
        if hasattr(r.get("create_time"), "isoformat"):
            r["create_time"] = r["create_time"].isoformat()
    return jsonify({"code": 200, "data": rows})

@app.route("/api/admin/passenger/list", methods=["GET"])
def passenger_list():
    conn, cur = get_db_conn()
    cur.execute("SELECT id_card, name, vip_level, phone FROM passenger ORDER BY id_card")
    rows = cur.fetchall()
    conn.close()
    return jsonify({"code":200,"data":rows})

# 修改乘客会员等级（仅管理员可修改vip_level，其他字段不可改）
@app.route("/api/admin/passenger/update_vip", methods=["POST"])
def passenger_update_vip():
    d = request.json
    id_card = d.get("id_card", "").strip()
    vip_level = d.get("vip_level", "普通").strip()
    if not id_card:
        return jsonify({"code":400,"msg":"身份证号不能为空"})
    valid_levels = ["普通", "银卡", "金卡"]
    if vip_level not in valid_levels:
        return jsonify({"code":400,"msg":f"无效的会员等级，仅支持: {', '.join(valid_levels)}"})
    conn, cur = get_db_conn()
    try:
        cur.execute("UPDATE passenger SET vip_level=%s WHERE id_card=%s", (vip_level, id_card))
        if cur.rowcount == 0:
            conn.close()
            return jsonify({"code":404,"msg":f"未找到身份证 {id_card} 对应的乘客"})
        conn.commit()
        conn.close()
        return jsonify({"code":200,"msg":f"会员等级已更新为 {vip_level}"})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"code":500,"msg":f"数据库错误: {str(e)}"})
# 城市管理 CRUD
@app.route("/api/admin/city/list", methods=["GET"])
def city_list():
    conn, cur = get_db_conn()
    cur.execute("SELECT * FROM city")
    res = cur.fetchall()
    conn.close()
    return jsonify({"code":200,"data":res})

@app.route("/api/admin/city/add", methods=["POST"])
def city_add():
    d = request.json
    conn, cur = get_db_conn()
    cur.execute("INSERT INTO city(area_code,city_name,province) VALUES(%s,%s,%s)",
                (d["area_code"],d["city_name"],d["province"]))
    conn.commit()
    conn.close()
    return jsonify({"code":200,"msg":"新增城市成功"})

@app.route("/api/admin/city/edit", methods=["POST"])
def city_edit():
    d = request.json
    conn, cur = get_db_conn()
    cur.execute("UPDATE city SET city_name=%s,province=%s WHERE area_code=%s",
                (d["city_name"],d["province"],d["area_code"]))
    conn.commit()
    conn.close()
    return jsonify({"code":200,"msg":"修改城市成功"})

@app.route("/api/admin/city/del", methods=["POST"])
def city_del():
    code = request.json["area_code"]
    conn, cur = get_db_conn()
    cur.execute("DELETE FROM city WHERE area_code=%s", (code,))
    conn.commit()
    conn.close()
    return jsonify({"code":200,"msg":"删除城市成功"})

# 机场管理 CRUD
@app.route("/api/admin/airport/list", methods=["GET"])
def airport_list():
    conn, cur = get_db_conn()
    cur.execute("SELECT * FROM airport")
    res = cur.fetchall()
    conn.close()
    return jsonify({"code":200,"data":res})

@app.route("/api/admin/airport/add", methods=["POST"])
def airport_add():
    d = request.json
    conn, cur = get_db_conn()
    cur.execute("INSERT INTO airport(airport_code,airport_name,area_code) VALUES(%s,%s,%s)",
                (d["airport_code"],d["airport_name"],d["area_code"]))
    conn.commit()
    conn.close()
    return jsonify({"code":200,"msg":"新增机场成功"})

@app.route("/api/admin/airport/edit", methods=["POST"])
def airport_edit():
    d = request.json
    conn, cur = get_db_conn()
    cur.execute("UPDATE airport SET airport_name=%s,area_code=%s WHERE airport_code=%s",
                (d["airport_name"],d["area_code"],d["airport_code"]))
    conn.commit()
    conn.close()
    return jsonify({"code":200,"msg":"修改机场成功"})

@app.route("/api/admin/airport/del", methods=["POST"])
def airport_del():
    code = request.json["airport_code"]
    conn, cur = get_db_conn()
    cur.execute("DELETE FROM airport WHERE airport_code=%s", (code,))
    conn.commit()
    conn.close()
    return jsonify({"code":200,"msg":"删除机场成功"})



# ====================== 航班管理 CRUD ======================

# 航班列表（含经停信息）
@app.route("/api/admin/flight/list", methods=["GET"])
def flight_list():
    conn, cur = get_db_conn()
    cur.execute("SELECT * FROM flight ORDER BY flight_no")
    flights = cur.fetchall()
    for f in flights:
        # timedelta → "HH:MM:SS" 字符串转换
        for key in ("depart_time", "arrive_time"):
            val = f.get(key)
            if hasattr(val, "total_seconds"):
                total = int(val.total_seconds())
                h, m = divmod(total // 60, 60)
                f[key] = f"{h:02d}:{m:02d}:{total % 60:02d}"
        # 加载经停信息
        cur.execute(
            "SELECT fs.*, a.airport_name FROM flight_stop fs "
            "LEFT JOIN airport a ON fs.airport_code = a.airport_code "
            "WHERE fs.flight_no=%s "
            "ORDER BY FIELD(fs.stop_sort,'起飞','经停1','经停2','经停3','降落')",
            (f["flight_no"],)
        )
        f["stops"] = cur.fetchall()
        # 加载舱位定价
        cur.execute("SELECT cabin_level, standard_price FROM cabin_price WHERE flight_no=%s", (f["flight_no"],))
        prices = cur.fetchall()
        f["first_price"] = None
        f["economy_price"] = None
        for p in prices:
            if p["cabin_level"] == "头等舱":
                f["first_price"] = float(p["standard_price"])
            elif p["cabin_level"] == "经济舱":
                f["economy_price"] = float(p["standard_price"])
    conn.close()
    return jsonify({"code":200,"data":flights})

# 航班新增（含自动生成7-8月实例 + flight_stop 经停）
@app.route("/api/admin/flight/add", methods=["POST"])
def flight_add():
    d = request.json
    flight_no = d["flight_no"]
    plane_model = d["plane_model"]
    first_class_num = int(d["first_class_num"])
    economy_num = int(d["economy_num"])
    fly_week_day = d.get("fly_week_day", "1,2,3,4,5,6,7")
    depart_time = d.get("depart_time", "00:00:00")
    arrive_time = d.get("arrive_time", "00:00:00")
    stops = d.get("stops", [])  # [{airport_code, stop_sort}, ...]
    
    conn, cur = get_db_conn()
    try:
        sql = """
        INSERT INTO flight(flight_no,plane_model,first_class_num,economy_num,fly_week_day,depart_time,arrive_time)
        VALUES(%s,%s,%s,%s,%s,%s,%s)
        """
        cur.execute(sql, (flight_no, plane_model, first_class_num, economy_num,
                           fly_week_day, depart_time, arrive_time))
        
        # 插入经停记录
        for stop in stops:
            cur.execute(
                "INSERT INTO flight_stop(flight_no, airport_code, stop_sort) VALUES(%s,%s,%s)",
                (flight_no, stop["airport_code"], stop["stop_sort"])
            )
        
        # 自动生成 7月+8月 航班实例（实际起降时间与航线一致）
        all_dates = get_july_august_dates()
        insert_data = []
        for day in all_dates:
            w_str = weekday_to_set_str(day)
            if w_str in fly_week_day.split(","):
                insert_data.append((
                    flight_no,
                    day,
                    "计划",
                    first_class_num,
                    economy_num,
                    depart_time,
                    arrive_time
                ))
        if insert_data:
            sql_instance = """
            INSERT INTO flight_instance(flight_no, fly_date, flight_status, first_remain, economy_remain, depart_time_actual, arrive_time_actual)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cur.executemany(sql_instance, insert_data)
        
        # 保存舱位定价
        first_price = d.get("first_price")
        economy_price = d.get("economy_price")
        if first_price is not None:
            cur.execute(
                "INSERT INTO cabin_price(flight_no, cabin_level, standard_price) VALUES(%s,'头等舱',%s) "
                "ON DUPLICATE KEY UPDATE standard_price=%s",
                (flight_no, first_price, first_price)
            )
        if economy_price is not None:
            cur.execute(
                "INSERT INTO cabin_price(flight_no, cabin_level, standard_price) VALUES(%s,'经济舱',%s) "
                "ON DUPLICATE KEY UPDATE standard_price=%s",
                (flight_no, economy_price, economy_price)
            )

        conn.commit()
        conn.close()
        return jsonify({"code":200,"msg":f"航班创建成功，自动生成{len(insert_data) if 'insert_data' in dir() else 0}条7/8月航班实例"})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"code":500,"msg":f"数据库错误: {str(e)}"})

# 航班修改（含 flight_stop 经停更新 + cabin_price 更新）
@app.route("/api/admin/flight/edit", methods=["POST"])
def flight_edit():
    d = request.json
    conn, cur = get_db_conn()
    try:
        sql = """
        UPDATE flight 
        SET plane_model=%s, first_class_num=%s, economy_num=%s, fly_week_day=%s, depart_time=%s, arrive_time=%s
        WHERE flight_no=%s
        """
        cur.execute(sql, (d["plane_model"], d["first_class_num"], d["economy_num"],
                           d.get("fly_week_day","1,2,3,4,5,6,7"),
                           d.get("depart_time","00:00:00"), d.get("arrive_time","00:00:00"),
                           d["flight_no"]))
        
        # 删除旧经停记录，重新插入
        cur.execute("DELETE FROM flight_stop WHERE flight_no=%s", (d["flight_no"],))
        stops = d.get("stops", [])
        for stop in stops:
            cur.execute(
                "INSERT INTO flight_stop(flight_no, airport_code, stop_sort) VALUES(%s,%s,%s)",
                (d["flight_no"], stop["airport_code"], stop["stop_sort"])
            )
        
        # 更新舱位定价
        first_price = d.get("first_price")
        economy_price = d.get("economy_price")
        if first_price is not None:
            cur.execute(
                "INSERT INTO cabin_price(flight_no, cabin_level, standard_price) VALUES(%s,'头等舱',%s) "
                "ON DUPLICATE KEY UPDATE standard_price=%s",
                (d["flight_no"], first_price, first_price)
            )
        if economy_price is not None:
            cur.execute(
                "INSERT INTO cabin_price(flight_no, cabin_level, standard_price) VALUES(%s,'经济舱',%s) "
                "ON DUPLICATE KEY UPDATE standard_price=%s",
                (d["flight_no"], economy_price, economy_price)
            )

        conn.commit()
        conn.close()
        return jsonify({"code":200,"msg":"航班修改成功"})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"code":500,"msg":f"数据库错误: {str(e)}"})

# 航班删除（同时删除关联实例）
@app.route("/api/admin/flight/del", methods=["POST"])
def flight_del():
    no = request.json["flight_no"]
    conn, cur = get_db_conn()
    # 在删除实例之前，将该航班所有未完成的订单标记为"航班取消"
    cur.execute(
        """UPDATE ticket_record
           SET ticket_status = '航班取消'
           WHERE flight_no = %s
             AND ticket_status NOT IN ('已退票', '已改签', '航班取消')""",
        (no,)
    )
    cur.execute("DELETE FROM flight_instance WHERE flight_no=%s", (no,))
    cur.execute("DELETE FROM flight WHERE flight_no=%s", (no,))
    conn.commit()
    conn.close()
    return jsonify({"code":200,"msg":"航班及关联实例已删除"})

# ====================== 航班实例管理 ======================

# 航班实例列表
@app.route("/api/admin/flight_instance/list", methods=["GET"])
def flight_instance_list():
    conn, cur = get_db_conn()
    cur.execute("SELECT * FROM flight_instance ORDER BY fly_date, flight_no")
    instances = cur.fetchall()
    conn.close()
    for inst in instances:
        # date → "YYYY-MM-DD" 字符串
        if hasattr(inst.get("fly_date"), "isoformat"):
            inst["fly_date"] = inst["fly_date"].isoformat()
        # timedelta (TIME列) → "HH:MM:SS" 字符串
        for key in ("depart_time_actual", "arrive_time_actual"):
            val = inst.get(key)
            if val is not None and hasattr(val, "total_seconds"):
                total = int(val.total_seconds())
                h, m = divmod(total // 60, 60)
                inst[key] = f"{h:02d}:{m:02d}:{total % 60:02d}"
    return jsonify({"code":200,"data":instances})

# 航班实例新增（仅需航班号+飞行日期，其他属性与flight表一致）
@app.route("/api/admin/flight_instance/add", methods=["POST"])
def flight_instance_add():
    d = request.json
    flight_no = d.get("flight_no", "").strip()
    fly_date = d.get("fly_date", "").strip()
    if not flight_no or not fly_date:
        return jsonify({"code":400,"msg":"航班号和飞行日期不能为空"})
    conn, cur = get_db_conn()
    try:
        # 查找对应航班信息
        cur.execute(
            "SELECT first_class_num, economy_num, depart_time, arrive_time, fly_week_day FROM flight WHERE flight_no=%s",
            (flight_no,)
        )
        flight = cur.fetchone()
        if not flight:
            conn.close()
            return jsonify({"code":400,"msg":f"航班 {flight_no} 在航线表中不存在，请先在「航线管理」中新增"})
        # 检查是否已存在同航班同日期的实例
        cur.execute(
            "SELECT 1 FROM flight_instance WHERE flight_no=%s AND fly_date=%s",
            (flight_no, fly_date)
        )
        if cur.fetchone():
            conn.close()
            return jsonify({"code":400,"msg":f"航班 {flight_no} 在 {fly_date} 的实例已存在"})
        # 插入新实例：状态=计划，余票=航线座位数，实际起降=航线起降时间
        sql = """
        INSERT INTO flight_instance(flight_no, fly_date, flight_status, first_remain, economy_remain, depart_time_actual, arrive_time_actual)
        VALUES (%s, %s, '计划', %s, %s, %s, %s)
        """
        cur.execute(sql, (
            flight_no, fly_date,
            flight["first_class_num"], flight["economy_num"],
            str(flight["depart_time"]), str(flight["arrive_time"])
        ))
        conn.commit()
        conn.close()
        return jsonify({"code":200,"msg":f"航班实例 {flight_no} / {fly_date} 创建成功"})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"code":500,"msg":f"数据库错误: {str(e)}"})

# 航班实例删除
@app.route("/api/admin/flight_instance/del", methods=["POST"])
def flight_instance_del():
    d = request.json
    flight_no = d.get("flight_no", "").strip()
    fly_date = d.get("fly_date", "").strip()
    if not flight_no or not fly_date:
        return jsonify({"code":400,"msg":"航班号和飞行日期不能为空"})
    conn, cur = get_db_conn()
    try:
        cur.execute(
            "DELETE FROM flight_instance WHERE flight_no=%s AND fly_date=%s",
            (flight_no, fly_date)
        )
        if cur.rowcount == 0:
            conn.close()
            return jsonify({"code":404,"msg":f"未找到航班实例 {flight_no} / {fly_date}"})
        conn.commit()
        conn.close()
        return jsonify({"code":200,"msg":f"航班实例 {flight_no} / {fly_date} 已删除"})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"code":500,"msg":f"数据库错误: {str(e)}"})

# 航班实例修改（状态、余票、实际起降时间）
@app.route("/api/admin/flight_instance/update", methods=["POST"])
def flight_instance_update():
    d = request.json
    conn, cur = get_db_conn()
    sql = """
    UPDATE flight_instance 
    SET flight_status=%s, first_remain=%s, economy_remain=%s,
        depart_time_actual=%s, arrive_time_actual=%s
    WHERE flight_no=%s AND fly_date=%s
    """
    cur.execute(sql, (d["flight_status"],d["first_remain"],d["economy_remain"],
                       d.get("depart_time_actual","00:00:00"), d.get("arrive_time_actual","00:00:00"),
                       d["flight_no"],d["fly_date"]))
    conn.commit()
    conn.close()
    return jsonify({"code":200,"msg":"航班实例设置完成"})

if __name__ == "__main__":
    # 启动后台定时任务线程
    check_thread = threading.Thread(target=check_and_update_completed_flights, daemon=True)
    check_thread.start()
    print("[系统] 后台定时任务已启动，每15秒检查一次过期航班...")
    
    app.run(host="0.0.0.0", port=5000, debug=True)
    # ======================【需要你修改3：后端启动端口】======================
