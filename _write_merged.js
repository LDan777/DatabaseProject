const fs = require('fs');
fs.writeFileSync('d:/Project/DatabaseProject/ds-aviation-backend/app_merged.py', `from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import hashlib

from datetime import datetime, date, timedelta

# ====================== 淡旺季 & 日期工具 ======================
def get_season_type(fly_date: str) -> str:
    d = datetime.strptime(fly_date, "%Y-%m-%d").date()
    month = d.month
    day = d.day
    is_summer = (month == 7) or (month == 8)
    is_national = (month == 10 and day <=7)
    is_may = (month ==5 and day <=5)
    is_spring_festival = (month == 1 and day >=20) or (month ==2 and day <=20)
    if is_summer or is_national or is_may or is_spring_festival:
        return "旺季"
    off_season = (month ==1 and day <=19) or (month ==2 and day >=21) or (month ==6) or (month ==12)
    if off_season:
        return "淡季"
    return "平季"

def get_july_august_dates():
    current_year = datetime.now().year
    date_list = []
    start = date(current_year, 7, 1)
    end = date(current_year, 8, 31)
    day = start
    while day <= end:
        date_list.append(day)
        day += timedelta(days=1)
    return date_list

def weekday_to_set_str(dt: date):
    return str(dt.weekday() + 1)

app = Flask(__name__)
CORS(app)
`, 'utf8');
console.log('Part 1 written');
