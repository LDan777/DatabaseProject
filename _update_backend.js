const fs = require('fs');
const path = 'd:/Project/DatabaseProject/ds-aviation-backend/app.py';
let c = fs.readFileSync(path, 'utf8');

const newFlightCode = `

# ====================== 航班管理 CRUD ======================

# 航班列表
@app.route("/api/admin/flight/list", methods=["GET"])
def flight_list():
    conn, cur = get_db_conn()
    cur.execute("SELECT * FROM flight ORDER BY flight_no")
    res = cur.fetchall()
    conn.close()
    return jsonify({"code":200,"data":res})

# 航班新增（含自动生成7-8月实例）
@app.route("/api/admin/flight/add", methods=["POST"])
def flight_add():
    d = request.json
    flight_no = d["flight_no"]
    plane_model = d["plane_model"]
    first_class_num = int(d["first_class_num"])
    economy_num = int(d["economy_num"])
    departure_city = d.get("departure_city", "")
    arrival_city = d.get("arrival_city", "")
    fly_week_day = d.get("fly_week_day", "1,2,3,4,5,6,7")
    fly_duration = d.get("fly_duration", "")
    
    conn, cur = get_db_conn()
    sql = """
    INSERT INTO flight(flight_no,plane_model,first_class_num,economy_num,departure_city,arrival_city,fly_week_day,fly_duration)
    VALUES(%s,%s,%s,%s,%s,%s,%s,%s)
    """
    cur.execute(sql, (flight_no, plane_model, first_class_num, economy_num,
                       departure_city, arrival_city, fly_week_day, fly_duration))
    
    # 自动生成 7月+8月 航班实例
    fly_days_set = set(fly_week_day.replace(" ", "").split(","))
    dates = get_july_august_dates()
    instance_count = 0
    for dt_obj in dates:
        weekday_str = weekday_to_set_str(dt_obj)
        if weekday_str in fly_days_set:
            fly_date_str = dt_obj.strftime("%Y-%m-%d")
            season = get_season_type(fly_date_str)
            cur.execute(
                "INSERT INTO flight_instance(flight_no, fly_date, flight_status, first_remain, economy_remain, season_type) VALUES(%s,%s,%s,%s,%s,%s)",
                (flight_no, fly_date_str, "计划中", first_class_num, economy_num, season))
            instance_count += 1
    
    conn.commit()
    conn.close()
    return jsonify({"code":200,"msg":f"航班 {flight_no} 创建成功，已自动生成 {instance_count} 个7-8月实例"})

# 航班修改
@app.route("/api/admin/flight/edit", methods=["POST"])
def flight_edit():
    d = request.json
    conn, cur = get_db_conn()
    sql = """
    UPDATE flight 
    SET plane_model=%s, first_class_num=%s, economy_num=%s, departure_city=%s, arrival_city=%s, fly_week_day=%s, fly_duration=%s
    WHERE flight_no=%s
    """
    cur.execute(sql, (d["plane_model"], d["first_class_num"], d["economy_num"],
                       d.get("departure_city",""), d.get("arrival_city",""),
                       d.get("fly_week_day","1,2,3,4,5,6,7"), d.get("fly_duration",""),
                       d["flight_no"]))
    conn.commit()
    conn.close()
    return jsonify({"code":200,"msg":"航班修改成功"})

# 航班删除（同时删除关联实例）
@app.route("/api/admin/flight/del", methods=["POST"])
def flight_del():
    no = request.json["flight_no"]
    conn, cur = get_db_conn()
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
    res = cur.fetchall()
    conn.close()
    return jsonify({"code":200,"data":res})

# 航班实例修改（状态、余票）
@app.route("/api/admin/flight_instance/update", methods=["POST"])
def flight_instance_update():
    d = request.json
    conn, cur = get_db_conn()
    sql = """
    UPDATE flight_instance 
    SET flight_status=%s, first_remain=%s, economy_remain=%s
    WHERE flight_no=%s AND fly_date=%s
    """
    cur.execute(sql, (d["flight_status"],d["first_remain"],d["economy_remain"],d["flight_no"],d["fly_date"]))
    conn.commit()
    conn.close()
    return jsonify({"code":200,"msg":"航班实例设置完成"})`;

// Replace the old flight block (from "# 航班新增" to the line before "if __name__")
// The old block starts at "# 航班新增" and ends just before "if __name__"
const oldStart = c.indexOf('# 航班新增（默认每周飞行日都飞）');
const oldEnd = c.indexOf('if __name__ == "__main__":');
c = c.substring(0, oldStart) + newFlightCode + '\n\n' + c.substring(oldEnd);

fs.writeFileSync(path, c, 'utf8');
console.log('Backend app.py updated!');
