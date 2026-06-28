# Patch script to update login endpoint in app.py
filepath = 'd:/Project/DatabaseProject/ds-aviation-backend/app.py'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_login_block = '''    conn, cur = get_db_conn()
    cur.execute("SELECT * FROM passenger WHERE id_card=%s AND password=%s", (id_card, pwd_md5))
    user = cur.fetchone()
    conn.close()
    if not user:
        return jsonify({"code": 400, "msg": "身份证或密码错误"})
    return jsonify({"code": 200, "msg": "登录成功", "data": user})'''

new_login_block = '''    conn, cur = get_db_conn()
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
    return jsonify({"code": 200, "msg": "登录成功", "data": user})'''

import os

# Directly read, modify, and write the file
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the login function body boundaries
login_start = None
login_end = None
for i, line in enumerate(lines):
    if 'def login():' in line:
        login_start = i
    if login_start is not None and i > login_start and line.strip().startswith('# 3.'):
        login_end = i
        break

if login_start is None or login_end is None:
    with open('d:/Project/DatabaseProject/patch_result.txt', 'w', encoding='utf-8') as f:
        f.write(f"FAILED: login_start={login_start}, login_end={login_end}")
    os._exit(0)

# Print current lines
with open('d:/Project/DatabaseProject/patch_result.txt', 'w', encoding='utf-8') as f:
    f.write(f"login_start={login_start}, login_end={login_end}\n")
    for i in range(login_start, login_end):
        f.write(f"{i}: {repr(lines[i])}\n")
    f.write("\nDONE")
