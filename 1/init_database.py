import os
from flask import Flask
from config import Config
from models import db, WalletRecord


app = Flask(__name__)
app.config.from_object(Config)


db.init_app(app)


os.makedirs('database', exist_ok=True)

def init_sqlalchemy_db():
    """初始化SQLAlchemy数据库"""
    with app.app_context():
        
        db.drop_all()
        
        
        db.create_all()
        
        print("数据库表创建完成!")
        print("钱包记录表创建成功")

if __name__ == '__main__':
    init_sqlalchemy_db()  