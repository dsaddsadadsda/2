import os

class Config:
    
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(BASE_DIR, "database", "app.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-123'
    
    
    PERMANENT_SESSION_LIFETIME = 1800  
    SESSION_COOKIE_SECURE = False  
    SESSION_COOKIE_HTTPONLY = True
    
    
    DEBUG = True 