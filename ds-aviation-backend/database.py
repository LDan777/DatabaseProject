# database.py
import pymysql
from pymysql.cursors import DictCursor
from dbutils.pooled_db import PooledDB  # 需要安装 dbutils 库
import getpass

# 1. 初始化数据库连接池
# 这样配置可以保证在高并发抢票时，数据库连接能稳定复用，是“并发防超卖”的基础设施
db_password = getpass.getpass("请输入你的本地 MySQL 数据库密码: ")

MYSQL_POOL = PooledDB(
    creator=pymysql,  # 使用 PyMySQL 驱动
    maxconnections=10,  # 连接池允许的最大连接数
    mincached=2,       # 初始化时连接池中至少创建的空闲连接数
    maxcached=5,       # 连接池中最多闲置的连接数
    host='127.0.0.1',  # 本地数据库地址
    port=3306,         # MySQL 默认端口
    user='root',       # 你的数据库用户名
    password=db_password,  # ⚠️ 记得在这里填入你在 Navicat 链接时用的 root 密码
    database='fproject1',   # 你们刚刚在 Navicat 里创建的数据库名
    charset='utf8mb4',        # 字符集必须保持一致，防止中文乱码
    blocking=True             # 连接池慢的时候排队等待，不直接报错
)

def get_db_connection():
    """
    从连接池中获取一个高效的数据库连接
    """
    return MYSQL_POOL.connection()

def query_db(sql, args=(), one=False):
    """
    封装一个快捷的通用查询函数（执行 SELECT 语句）
    """
    connection = get_db_connection()
    # 使用 DictCursor 讨论里提到的：能把数据库读出来的元组自动变成 Python 的 {} 字典，方便前端 Vue 读取 
    cursor = connection.cursor(DictCursor)
    try:
        cursor.execute(sql, args)
        result = cursor.fetchall()
        return (result[0] if result else None) if one else result
    except Exception as e:
        print(f"数据库查询出错: {e}")
        return None
    finally:
        cursor.close()
        connection.close()  # 这里的 close 并不是真正关闭，而是把连接还回池子里

def execute_db(sql, args=()):
    """
    封装一个快捷的通用写入函数（执行 INSERT, UPDATE, DELETE 语句）
    """
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(sql, args)
        connection.commit()  # 提交事务
        return cursor.rowcount  # 返回受影响的行数
    except Exception as e:
        connection.rollback()  # 发生异常时立刻回滚，确保数据安全 
        print(f"数据库执行出错: {e}")
        return -1
    finally:
        cursor.close()
        connection.close()