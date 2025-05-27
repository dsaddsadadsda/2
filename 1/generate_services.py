import os
import random
from flask import Flask
from config import Config
from models import db, Service

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

def clear_services():
    """清除所有现有的服务数据"""
    with app.app_context():
        try:
            Service.query.delete()
            db.session.commit()
            print("已清除所有现有服务数据")
        except Exception as e:
            db.session.rollback()
            print(f"清除服务数据时出错: {str(e)}")
            raise e

def generate_services():
    """生成195个常用海内外服务的数据"""
    with app.app_context():
        try:
            
            existing_count = Service.query.count()
            if existing_count >= 195:
                print("数据库中已有足够的服务数据")
                return

            
            services_list = get_services_data()

            
            services_added = 0
            
            
            for category in services_list:
                for service_name, service_en, _, desc in category["services"]:
                    if not Service.query.filter_by(name=service_name).first():
                        
                        base_price = round(1.0 + random.uniform(0, 4.0), 2)
                        
                        service = Service(
                            name=service_name,
                            description=desc,
                            icon="",  
                            price=base_price
                        )
                        db.session.add(service)
                        services_added += 1
            
            
            db.session.commit()
            print(f"成功添加 {services_added} 个服务数据")
            
        except Exception as e:
            db.session.rollback()
            print(f"添加服务数据时出错: {str(e)}")
            raise e

def get_services_data():
    """获取服务数据列表"""
    return [
        
        {"category": "社交媒体", "services": [
            
            ("微信", "WeChat", "", "中国最流行的社交平台，提供即时通讯、支付等服务"),
            ("QQ", "QQ", "", "腾讯旗下的即时通讯软件，深受年轻人喜爱"),
            ("微博", "Weibo", "", "中国最大的社交媒体平台之一，类似Twitter的微博服务"),
            ("抖音", "TikTok", "", "最受欢迎的短视频平台，深受年轻人喜爱"),
            ("快手", "Kuaishou", "", "大众化的短视频平台，覆盖广泛的用户群"),
            ("陌陌", "Momo", "", "社交互动平台"),
            ("小红书", "RED", "", "生活方式分享社区"),
            ("Soul", "Soul", "", "年轻人的社交元宇宙"),
            
            ("Facebook", "Facebook", "", "全球最大的社交网络平台"),
            ("Instagram", "Instagram", "", "图片分享社交平台，年轻人的最爱"),
            ("Twitter", "Twitter", "", "全球知名的微博平台"),
            ("LinkedIn", "LinkedIn", "", "专业社交网络平台"),
            ("WhatsApp", "WhatsApp", "", "全球流行的即时通讯工具"),
            ("Telegram", "Telegram", "", "注重隐私的即时通讯工具"),
            ("Line", "Line", "", "在日韩地区流行的即时通讯工具"),
            ("KakaoTalk", "KakaoTalk", "", "韩国最流行的即时通讯工具"),
            ("VK", "VK", "", "俄罗斯最大的社交网络"),
            ("Discord", "Discord", "", "游戏玩家喜爱的语音聊天平台"),
            ("Reddit", "Reddit", "", "全球知名的社区论坛平台"),
            ("Pinterest", "Pinterest", "", "图片分享和创意灵感平台"),
            ("Snapchat", "Snapchat", "", "年轻人喜爱的图片分享应用"),
            ("Tumblr", "Tumblr", "", "博客和创意分享平台")
        ]},
        
        {"category": "电商平台", "services": [
            
            ("淘宝", "Taobao", "", "中国最大的C2C电商平台"),
            ("京东", "JD", "", "中国领先的B2C电商平台"),
            ("拼多多", "Pinduoduo", "", "社交电商平台，以低价著称"),
            ("天猫", "Tmall", "", "阿里巴巴旗下B2C购物平台"),
            ("抖音商城", "TikTok Shop", "", "短视频平台的电商服务"),
            ("唯品会", "VIPShop", "", "品牌折扣电商平台"),
            ("苏宁易购", "Suning", "", "综合性B2C电商平台"),
            ("当当", "Dangdang", "", "图书及综合电商平台"),
            ("小红书商城", "RED Mall", "", "生活方式电商平台"),
            
            ("亚马逊", "Amazon", "", "全球最大的电商平台"),
            ("eBay", "eBay", "", "全球知名的在线拍卖平台"),
            ("Shopee", "Shopee", "", "东南亚地区领先的电商平台"),
            ("Lazada", "Lazada", "", "东南亚知名电商平台"),
            ("Rakuten", "Rakuten", "", "日本最大的电商平台"),
            ("Coupang", "Coupang", "", "韩国领先的电商平台"),
            ("Walmart", "Walmart", "", "美国零售巨头的在线商城"),
            ("Target", "Target", "", "美国知名零售商的在线平台"),
            ("Etsy", "Etsy", "", "手工艺品和复古商品交易平台"),
            ("Wayfair", "Wayfair", "", "家居用品在线零售平台"),
            ("ASOS", "ASOS", "", "英国时尚电商平台")
        ]},
        
        {"category": "支付", "services": [
            
            ("支付宝", "Alipay", "", "中国领先的移动支付平台"),
            ("微信支付", "WeChatPay", "", "微信内置的支付服务"),
            ("云闪付", "UnionPay", "", "银联推出的移动支付服务"),
            ("财付通", "Tenpay", "", "腾讯旗下支付平台"),
            
            ("PayPal", "PayPal", "", "全球知名的在线支付平台"),
            ("Stripe", "Stripe", "", "流行的支付处理服务"),
            ("Square", "Square", "", "移动支付和商户服务平台"),
            ("Google Pay", "GooglePay", "", "谷歌的移动支付服务"),
            ("Apple Pay", "ApplePay", "", "苹果的移动支付服务"),
            ("Samsung Pay", "SamsungPay", "", "三星的移动支付服务"),
            ("Klarna", "Klarna", "", "欧洲领先的支付服务商"),
            ("Wise", "Wise", "", "国际汇款服务平台"),
            ("Revolut", "Revolut", "", "数字银行和支付服务"),
            ("Venmo", "Venmo", "", "美国流行的个人支付服务")
        ]},
        
        {"category": "出行", "services": [
            
            ("滴滴", "DiDi", "", "中国最大的网约车平台"),
            ("高德地图", "AutoNavi", "", "领先的导航地图服务"),
            ("百度地图", "Baidu Maps", "", "综合地图服务平台"),
            ("美团打车", "Meituan", "", "美团旗下网约车服务"),
            ("哈啰出行", "Hello", "", "共享单车和网约车服务"),
            ("青桔单车", "Qingju", "", "滴滴旗下共享单车服务"),
            ("携程", "Trip.com", "", "在线旅行服务平台"),
            ("飞猪", "Fliggy", "", "阿里巴巴旗下旅行平台"),
            ("去哪儿", "Qunar", "", "综合旅行服务平台"),
            ("马蜂窝", "Mafengwo", "", "旅游社区和预订平台"),
            
            ("Uber", "Uber", "", "全球知名的网约车服务"),
            ("Grab", "Grab", "", "东南亚领先的出行服务平台"),
            ("Lyft", "Lyft", "", "美国知名网约车服务"),
            ("Gojek", "Gojek", "", "印尼领先的出行服务平台"),
            ("Bolt", "Bolt", "", "欧洲流行的网约车服务"),
            ("Lime", "Lime", "", "全球共享电动滑板车服务"),
            ("Bird", "Bird", "", "共享电动滑板车平台"),
            ("Booking.com", "Booking", "", "全球领先的在线旅行平台"),
            ("Expedia", "Expedia", "", "综合旅行服务商"),
            ("Airbnb", "Airbnb", "", "全球短租住宿平台")
        ]},
        
        {"category": "外卖餐饮", "services": [
            
            ("美团外卖", "MeituanFood", "", "中国领先的外卖配送平台"),
            ("饿了么", "Ele", "", "阿里巴巴旗下外卖平台"),
            ("大众点评", "Dianping", "", "餐饮点评和团购平台"),
            ("口碑", "Koubei", "", "阿里本地生活服务平台"),
            ("星巴克", "Starbucks", "", "连锁咖啡品牌会员服务"),
            ("肯德基", "KFC", "", "快餐连锁品牌会员服务"),
            
            ("UberEats", "UberEats", "", "Uber旗下的外卖服务"),
            ("Foodpanda", "Foodpanda", "", "亚洲地区知名外卖平台"),
            ("DoorDash", "DoorDash", "", "美国领先的外卖平台"),
            ("Grubhub", "Grubhub", "", "美国知名外卖服务"),
            ("Deliveroo", "Deliveroo", "", "英国领先的外卖平台"),
            ("Just Eat", "JustEat", "", "欧洲知名外卖服务"),
            ("Swiggy", "Swiggy", "", "印度领先的外卖平台"),
            ("Zomato", "Zomato", "", "印度餐饮服务平台")
        ]},
        
        {"category": "直播", "services": [
            
            ("斗鱼", "Douyu", "", "中国知名游戏直播平台"),
            ("虎牙", "Huya", "", "专业的游戏直播平台"),
            ("B站", "Bilibili", "", "年轻人喜爱的视频平台"),
            ("抖音直播", "TikTok Live", "", "抖音平台的直播功能"),
            ("快手直播", "Kuaishou Live", "", "快手平台的直播服务"),
            ("YY", "YY", "", "老牌语音直播平台"),
            ("映客", "Inke", "", "移动直播平台"),
            
            ("Twitch", "Twitch", "", "全球最大的游戏直播平台"),
            ("YouTube Live", "YouTubeLive", "", "YouTube的直播服务"),
            ("Facebook Live", "FacebookLive", "", "Facebook的直播功能"),
            ("Instagram Live", "InstagramLive", "", "Instagram的直播服务"),
            ("Bigo Live", "BigoLive", "", "全球移动直播平台")
        ]},
        
        {"category": "音视频", "services": [
            
            ("网易云音乐", "NetEaseMusic", "", "深受年轻人喜爱的音乐平台"),
            ("QQ音乐", "QQMusic", "", "腾讯旗下音乐服务"),
            ("酷狗音乐", "Kugou", "", "流行音乐播放平台"),
            ("酷我音乐", "Kuwo", "", "综合音乐服务平台"),
            ("爱奇艺", "iQIYI", "", "领先的视频streaming平台"),
            ("腾讯视频", "TencentVideo", "", "腾讯旗下视频平台"),
            ("优酷", "Youku", "", "阿里巴巴旗下视频平台"),
            ("芒果TV", "MangoTV", "", "湖南广电旗下视频平台"),
            
            ("Spotify", "Spotify", "", "全球最大的音乐流媒体平台"),
            ("Apple Music", "AppleMusic", "", "苹果的音乐订阅服务"),
            ("Amazon Music", "AmazonMusic", "", "亚马逊的音乐服务"),
            ("Netflix", "Netflix", "", "全球领先的视频订阅平台"),
            ("Disney+", "DisneyPlus", "", "迪士尼的流媒体服务"),
            ("HBO Max", "HBOMax", "", "华纳传媒的流媒体平台"),
            ("Hulu", "Hulu", "", "美国知名流媒体服务"),
            ("YouTube", "YouTube", "", "全球最大的视频分享平台"),
            ("SoundCloud", "SoundCloud", "", "音乐分享社区平台"),
            ("Deezer", "Deezer", "", "法国音乐流媒体服务")
        ]},
        
        {"category": "云服务", "services": [
            
            ("阿里云", "Aliyun", "", "阿里巴巴的云计算服务"),
            ("腾讯云", "Tencent Cloud", "", "腾讯的云服务平台"),
            ("百度云", "Baidu Cloud", "", "百度的云服务平台"),
            ("华为云", "Huawei Cloud", "", "华为的云计算服务"),
            ("金山云", "Kingsoft Cloud", "", "金山的云服务平台"),
            ("UCloud", "UCloud", "", "国内知名云服务商"),
            ("钉钉", "DingTalk", "", "阿里巴巴的企业协作平台"),
            ("企业微信", "WeCom", "", "腾讯的企业协作工具"),
            ("飞书", "Lark", "", "字节跳动的企业协作平台"),
            
            ("AWS", "Amazon Web Services", "", "亚马逊的云计算服务"),
            ("Google Cloud", "Google Cloud", "", "谷歌的云平台"),
            ("Microsoft Azure", "Azure", "", "微软的云计算平台"),
            ("Oracle Cloud", "Oracle Cloud", "", "甲骨文的云服务"),
            ("IBM Cloud", "IBM Cloud", "", "IBM的云计算服务"),
            ("DigitalOcean", "DigitalOcean", "", "开发者友好的云平台"),
            ("Salesforce", "Salesforce", "", "企业CRM云服务"),
            ("Microsoft 365", "Microsoft 365", "", "微软的办公套件"),
            ("Zoom", "Zoom", "", "流行的视频会议工具"),
            ("Slack", "Slack", "", "团队协作通讯平台"),
            ("Asana", "Asana", "", "项目管理协作工具"),
            ("Trello", "Trello", "", "看板式项目管理工具"),
            ("Notion", "Notion", "", "协作笔记和知识管理平台"),
            ("Dropbox", "Dropbox", "", "云存储和文件同步服务"),
            ("Box", "Box", "", "企业云存储服务")
        ]},
        
        {"category": "游戏平台", "services": [
            
            ("腾讯游戏", "Tencent Games", "", "中国最大的游戏开发和运营平台"),
            ("网易游戏", "NetEase Games", "", "领先的游戏开发商和运营商"),
            ("米哈游", "miHoYo", "", "《原神》开发商"),
            ("完美世界", "Perfect World", "", "知名游戏开发和发行商"),
            ("莉莉丝游戏", "Lilith Games", "", "移动游戏开发商"),
            ("tap游戏", "TapTap", "", "游戏分发平台"),
            
            ("Steam", "Steam", "", "全球最大的游戏分发平台"),
            ("Epic Games", "Epic Games", "", "知名游戏开发商和平台"),
            ("PlayStation", "PlayStation", "", "索尼游戏平台"),
            ("Xbox", "Xbox", "", "微软游戏平台"),
            ("Nintendo", "Nintendo", "", "任天堂游戏平台"),
            ("EA", "Electronic Arts", "", "电子艺界游戏平台"),
            ("Ubisoft", "Ubisoft", "", "育碧游戏平台"),
            ("Roblox", "Roblox", "", "在线游戏平台"),
            ("Unity", "Unity", "", "游戏开发引擎平台")
        ]},
        
        {"category": "教育平台", "services": [
            
            ("学而思", "xueersi", "", "K12在线教育平台"),
            ("猿辅导", "yuanfudao", "", "在线教育平台"),
            ("作业帮", "zuoyebang", "", "在线教育平台"),
            ("VIPKID", "VIPKID", "", "在线英语教育平台"),
            ("沪江英语", "hujiang", "", "在线语言学习平台"),
            ("网易有道", "Youdao", "", "综合教育平台"),
            
            ("Coursera", "Coursera", "", "全球在线课程平台"),
            ("Udemy", "Udemy", "", "在线技能学习平台"),
            ("edX", "edX", "", "高等教育在线平台"),
            ("Duolingo", "Duolingo", "", "语言学习平台"),
            ("Khan Academy", "Khan Academy", "", "免费教育资源平台"),
            ("Skillshare", "Skillshare", "", "创意技能学习平台")
        ]},
        
        {"category": "金融服务", "services": [
            
            ("蚂蚁财富", "Ant Fortune", "", "综合理财平台"),
            ("京东金融", "JD Finance", "", "综合金融服务平台"),
            ("微众银行", "WeBank", "", "互联网银行"),
            ("网商银行", "MYbank", "", "阿里旗下网络银行"),
            ("陆金所", "Lu.com", "", "综合金融服务平台"),
            ("同花顺", "10jqka", "", "股票交易和资讯平台"),
            ("东方财富", "eastmoney", "", "财经资讯和交易平台"),
            
            ("Robinhood", "Robinhood", "", "零佣金股票交易平台"),
            ("Coinbase", "Coinbase", "", "加密货币交易平台"),
            ("Binance", "Binance", "", "全球加密货币交易所"),
            ("E-Trade", "E-Trade", "", "在线投资交易平台"),
            ("TD Ameritrade", "TD Ameritrade", "", "投资交易服务平台")
        ]},
        
        {"category": "生活服务", "services": [
            
            ("58同城", "58", "", "分类信息服务平台"),
            ("赶集网", "Ganji", "", "分类信息服务平台"),
            ("链家", "Lianjia", "", "房产交易平台"),
            ("贝壳找房", "Beike", "", "房产服务平台"),
            ("安居客", "Anjuke", "", "房产信息平台"),
            ("瓜子二手车", "Guazi", "", "二手车交易平台"),
            ("转转", "Zhuanzhuan", "", "二手商品交易平台"),
            ("闲鱼", "Xianyu", "", "阿里旗下二手交易平台"),
            
            ("Craigslist", "Craigslist", "", "分类广告网站"),
            ("Zillow", "Zillow", "", "房地产信息平台"),
            ("Yelp", "Yelp", "", "本地生活点评平台"),
            ("TaskRabbit", "TaskRabbit", "", "生活服务众包平台")
        ]}
    ]

if __name__ == '__main__':
    clear_services()  
    generate_services() 