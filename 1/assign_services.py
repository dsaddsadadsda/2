import random
from flask import Flask
from config import Config
from models import db, Country, Service, CountryService

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

def assign_services_to_countries():
    """为每个国家分配服务并设置价格"""
    with app.app_context():
        try:
            
            countries = Country.query.all()
            services = Service.query.all()
            
            
            for country in countries:
                
                num_services = random.randint(
                    int(len(services) * 0.7),
                    len(services)
                )
                
                
                selected_services = random.sample(services, num_services)
                
                
                for service in selected_services:
                    price_multiplier = random.uniform(0.8, 1.2)
                    final_price = round(service.price * price_multiplier, 2)
                    
                    country_service = CountryService(
                        country_id=country.id,
                        service_id=service.id,
                        price=final_price
                    )
                    db.session.add(country_service)
            
            db.session.commit()
            print(f"成功为所有国家分配服务")
            
        except Exception as e:
            db.session.rollback()
            print(f"分配服务时出错: {str(e)}")
            raise e

if __name__ == '__main__':
    assign_services_to_countries() 