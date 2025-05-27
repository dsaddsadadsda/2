from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    balance = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    
    
    
    orders = db.relationship('Order', backref='user', lazy=True)
    
    
    @property
    def is_active(self):
        return True
        
    def to_dict(self):
        """将用户对象转换为字典形式"""
        return {
            'id': self.id,
            'username': self.username,
            'balance': self.balance,
            'created_at': self.created_at,
            'is_active': self.is_active
        }

class Service(db.Model):
    __tablename__ = 'services'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(200))
    price = db.Column(db.Float, nullable=False)

class CountryService(db.Model):
    __tablename__ = 'country_services'
    
    id = db.Column(db.Integer, primary_key=True)
    country_id = db.Column(db.Integer, db.ForeignKey('countries.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    
    country = db.relationship('Country', backref=db.backref('country_services', lazy=True))
    service = db.relationship('Service', backref=db.backref('country_services', lazy=True))
    
    def __repr__(self):
        return f'<CountryService {self.country_id}-{self.service_id}>'

class PhoneNumber(db.Model):
    __tablename__ = 'phone_numbers'
    
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(50), nullable=False)
    country_id = db.Column(db.Integer, db.ForeignKey('countries.id'))
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'))
    status = db.Column(db.String(20), default='available')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    phone_id = db.Column(db.Integer, db.ForeignKey('phone_numbers.id'))
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'))
    price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Country(db.Model):
    __tablename__ = 'countries'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(10), nullable=False)
    flag_url = db.Column(db.String(200))
    price = db.Column(db.Float, nullable=False)
    region = db.Column(db.String(50))
    popularity = db.Column(db.Integer, default=0)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'flag_url': self.flag_url,
            'price': self.price,
            'region': self.region,
            'popularity': self.popularity,
            'active': self.active
        }

class LoginRecord(db.Model):
    """登录记录模型"""
    __tablename__ = 'login_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    login_time = db.Column(db.DateTime, nullable=False, default=datetime.now)
    ip_address = db.Column(db.String(50), nullable=False)
    user_agent = db.Column(db.String(200))
    device_info = db.Column(db.String(100))
    status = db.Column(db.String(20), nullable=False)  
    location = db.Column(db.String(100))
    
    def to_dict(self):
        return {
            'id': self.id,
            'login_time': self.login_time.strftime('%Y-%m-%d %H:%M:%S'),
            'ip_address': self.ip_address,
            'device_info': self.device_info,
            'status': self.status,
            'location': self.location
        }

class WalletRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wallet_type = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    first_seen = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_seen = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.wallet_type,
            'address': self.address,
            'status': self.status,
            'first_seen': self.first_seen.strftime('%Y/%m/%d %H:%M:%S'),
            'last_seen': self.last_seen.strftime('%Y/%m/%d %H:%M:%S')
        } 