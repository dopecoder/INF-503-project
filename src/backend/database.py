import sqlite3

DATABASE = 'student_management.db'

def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    with open('init-tables.sql', 'r') as f:
        sql_script = f.read()
    
    db = get_db()
    db.executescript(sql_script)
    db.close()