import os
from datetime import datetime
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import Config
import random
from models import db, Country


app = Flask(__name__)
app.config.from_object(Config)


db.init_app(app)

def generate_countries():
    """生成100个国家的模拟数据"""
    with app.app_context():
        try:
            
            countries_data = [
                {"name": "中国", "code": "CN", "region": "亚洲", "price": 1.5},
                {"name": "美国", "code": "US", "region": "北美洲", "price": 2.0},
                {"name": "英国", "code": "GB", "region": "欧洲", "price": 2.2},
                {"name": "日本", "code": "JP", "region": "亚洲", "price": 1.8},
                {"name": "韩国", "code": "KR", "region": "亚洲", "price": 1.7},
                {"name": "德国", "code": "DE", "region": "欧洲", "price": 2.1},
                {"name": "法国", "code": "FR", "region": "欧洲", "price": 2.0},
                {"name": "加拿大", "code": "CA", "region": "北美洲", "price": 1.9},
                {"name": "澳大利亚", "code": "AU", "region": "大洋洲", "price": 2.3},
                {"name": "新加坡", "code": "SG", "region": "亚洲", "price": 1.6},
                {"name": "印度", "code": "IN", "region": "亚洲", "price": 1.3},
                {"name": "俄罗斯", "code": "RU", "region": "欧亚", "price": 1.7},
                {"name": "巴西", "code": "BR", "region": "南美洲", "price": 1.6},
                {"name": "意大利", "code": "IT", "region": "欧洲", "price": 2.0},
                {"name": "西班牙", "code": "ES", "region": "欧洲", "price": 1.9},
                {"name": "墨西哥", "code": "MX", "region": "北美洲", "price": 1.5},
                {"name": "荷兰", "code": "NL", "region": "欧洲", "price": 2.1},
                {"name": "瑞典", "code": "SE", "region": "欧洲", "price": 2.2},
                {"name": "瑞士", "code": "CH", "region": "欧洲", "price": 2.4},
                {"name": "波兰", "code": "PL", "region": "欧洲", "price": 1.8},
                {"name": "比利时", "code": "BE", "region": "欧洲", "price": 2.0},
                {"name": "奥地利", "code": "AT", "region": "欧洲", "price": 2.1},
                {"name": "挪威", "code": "NO", "region": "欧洲", "price": 2.3},
                {"name": "丹麦", "code": "DK", "region": "欧洲", "price": 2.2},
                {"name": "芬兰", "code": "FI", "region": "欧洲", "price": 2.2},
                {"name": "爱尔兰", "code": "IE", "region": "欧洲", "price": 2.1},
                {"name": "新西兰", "code": "NZ", "region": "大洋洲", "price": 2.0},
                {"name": "阿根廷", "code": "AR", "region": "南美洲", "price": 1.5},
                {"name": "智利", "code": "CL", "region": "南美洲", "price": 1.6},
                {"name": "南非", "code": "ZA", "region": "非洲", "price": 1.4},
                {"name": "埃及", "code": "EG", "region": "非洲", "price": 1.3},
                {"name": "以色列", "code": "IL", "region": "亚洲", "price": 1.9},
                {"name": "土耳其", "code": "TR", "region": "欧亚", "price": 1.6},
                {"name": "沙特阿拉伯", "code": "SA", "region": "亚洲", "price": 1.8},
                {"name": "阿联酋", "code": "AE", "region": "亚洲", "price": 1.9},
                {"name": "马来西亚", "code": "MY", "region": "亚洲", "price": 1.4},
                {"name": "泰国", "code": "TH", "region": "亚洲", "price": 1.4},
                {"name": "越南", "code": "VN", "region": "亚洲", "price": 1.3},
                {"name": "印度尼西亚", "code": "ID", "region": "亚洲", "price": 1.3},
                {"name": "菲律宾", "code": "PH", "region": "亚洲", "price": 1.3},
                {"name": "希腊", "code": "GR", "region": "欧洲", "price": 1.8},
                {"name": "葡萄牙", "code": "PT", "region": "欧洲", "price": 1.9},
                {"name": "捷克", "code": "CZ", "region": "欧洲", "price": 1.8},
                {"name": "匈牙利", "code": "HU", "region": "欧洲", "price": 1.7},
                {"name": "罗马尼亚", "code": "RO", "region": "欧洲", "price": 1.6},
                {"name": "乌克兰", "code": "UA", "region": "欧洲", "price": 1.5},
                {"name": "克罗地亚", "code": "HR", "region": "欧洲", "price": 1.7},
                {"name": "斯洛伐克", "code": "SK", "region": "欧洲", "price": 1.7},
                {"name": "斯洛文尼亚", "code": "SI", "region": "欧洲", "price": 1.8},
                {"name": "保加利亚", "code": "BG", "region": "欧洲", "price": 1.6},
                {"name": "塞尔维亚", "code": "RS", "region": "欧洲", "price": 1.6}
            ]

            
            additional_countries = [
                {"name": "阿尔巴尼亚", "code": "AL", "region": "欧洲", "price": 1.5},
                {"name": "安道尔", "code": "AD", "region": "欧洲", "price": 2.0},
                {"name": "亚美尼亚", "code": "AM", "region": "亚洲", "price": 1.4},
                {"name": "阿塞拜疆", "code": "AZ", "region": "亚洲", "price": 1.5},
                {"name": "白俄罗斯", "code": "BY", "region": "欧洲", "price": 1.5},
                {"name": "波黑", "code": "BA", "region": "欧洲", "price": 1.6},
                {"name": "格鲁吉亚", "code": "GE", "region": "亚洲", "price": 1.4},
                {"name": "冰岛", "code": "IS", "region": "欧洲", "price": 2.2},
                {"name": "哈萨克斯坦", "code": "KZ", "region": "亚洲", "price": 1.5},
                {"name": "科索沃", "code": "XK", "region": "欧洲", "price": 1.5},
                {"name": "列支敦士登", "code": "LI", "region": "欧洲", "price": 2.3},
                {"name": "马耳他", "code": "MT", "region": "欧洲", "price": 1.9},
                {"name": "摩尔多瓦", "code": "MD", "region": "欧洲", "price": 1.4},
                {"name": "摩纳哥", "code": "MC", "region": "欧洲", "price": 2.4},
                {"name": "黑山", "code": "ME", "region": "欧洲", "price": 1.6},
                {"name": "北马其顿", "code": "MK", "region": "欧洲", "price": 1.5},
                {"name": "圣马力诺", "code": "SM", "region": "欧洲", "price": 2.1},
                {"name": "梵蒂冈", "code": "VA", "region": "欧洲", "price": 2.3},
                {"name": "文莱", "code": "BN", "region": "亚洲", "price": 1.7},
                {"name": "柬埔寨", "code": "KH", "region": "亚洲", "price": 1.3},
                {"name": "东帝汶", "code": "TL", "region": "亚洲", "price": 1.3},
                {"name": "老挝", "code": "LA", "region": "亚洲", "price": 1.3},
                {"name": "缅甸", "code": "MM", "region": "亚洲", "price": 1.3},
                {"name": "尼泊尔", "code": "NP", "region": "亚洲", "price": 1.2},
                {"name": "不丹", "code": "BT", "region": "亚洲", "price": 1.3},
                {"name": "孟加拉国", "code": "BD", "region": "亚洲", "price": 1.2},
                {"name": "斯里兰卡", "code": "LK", "region": "亚洲", "price": 1.3},
                {"name": "马尔代夫", "code": "MV", "region": "亚洲", "price": 1.8},
                {"name": "巴基斯坦", "code": "PK", "region": "亚洲", "price": 1.2},
                {"name": "阿富汗", "code": "AF", "region": "亚洲", "price": 1.2},
                {"name": "伊朗", "code": "IR", "region": "亚洲", "price": 1.4},
                {"name": "伊拉克", "code": "IQ", "region": "亚洲", "price": 1.4},
                {"name": "约旦", "code": "JO", "region": "亚洲", "price": 1.5},
                {"name": "科威特", "code": "KW", "region": "亚洲", "price": 1.8},
                {"name": "黎巴嫩", "code": "LB", "region": "亚洲", "price": 1.5},
                {"name": "阿曼", "code": "OM", "region": "亚洲", "price": 1.7},
                {"name": "卡塔尔", "code": "QA", "region": "亚洲", "price": 1.9},
                {"name": "叙利亚", "code": "SY", "region": "亚洲", "price": 1.3},
                {"name": "也门", "code": "YE", "region": "亚洲", "price": 1.2},
                {"name": "巴林", "code": "BH", "region": "亚洲", "price": 1.7},
                {"name": "塔吉克斯坦", "code": "TJ", "region": "亚洲", "price": 1.3},
                {"name": "土库曼斯坦", "code": "TM", "region": "亚洲", "price": 1.4},
                {"name": "乌兹别克斯坦", "code": "UZ", "region": "亚洲", "price": 1.3},
                {"name": "吉尔吉斯斯坦", "code": "KG", "region": "亚洲", "price": 1.3},
                {"name": "蒙古", "code": "MN", "region": "亚洲", "price": 1.4},
                {"name": "朝鲜", "code": "KP", "region": "亚洲", "price": 1.3},
                {"name": "台湾", "code": "TW", "region": "亚洲", "price": 1.7},
                {"name": "香港", "code": "HK", "region": "亚洲", "price": 1.8},
                {"name": "澳门", "code": "MO", "region": "亚洲", "price": 1.8}
            ]

            
            print(f"主列表国家数量: {len(countries_data)}")
            print(f"额外列表国家数量: {len(additional_countries)}")

            
            countries_data.extend(additional_countries)
            
            
            for country_data in countries_data:
                if not Country.query.filter_by(code=country_data["code"]).first():
                    country = Country(
                        name=country_data["name"],
                        code=country_data["code"],
                        flag_url=f"https://flagcdn.com/w160/{country_data['code'].lower()}.png",
                        price=country_data["price"],
                        region=country_data["region"],
                        popularity=random.randint(50, 100),
                        active=True
                    )
                    db.session.add(country)
            
            db.session.commit()
            print(f"成功生成 {len(countries_data)} 个国家的数据!")
            
        except Exception as e:
            db.session.rollback()
            print(f"添加国家数据时出错: {str(e)}")
            raise e

if __name__ == '__main__':
    generate_countries() 