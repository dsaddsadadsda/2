let selectedCountryId = null;
let selectedServiceId = null;
let allCountries = [];
let allServices = [];
let currentPage = 1;
let itemsPerPage = 18;
let totalPages = 1;
let currentRegion = '';
let currentSearch = '';
let currentSort = 'popular';


let servicesCurrentPage = 1;
let servicesItemsPerPage = 12;
let servicesAllData = [];


document.addEventListener('DOMContentLoaded', function() {
    
    loadCountries();
    
    
    const getNumberBtn = document.getElementById('get-number-btn');
    if (getNumberBtn) {
        getNumberBtn.addEventListener('click', handleGetNumber);
    }
    
    
    const countrySearch = document.getElementById('countrySearch');
    if (countrySearch) {
        let searchTimeout;
        countrySearch.addEventListener('input', function() {
            
            const container = document.getElementById('countries-container');
            if (container) {
                container.innerHTML = `
                    <div class="col-12 text-center my-3">
                        <div class="spinner-border text-primary spinner-border-sm" role="status">
                            <span class="visually-hidden">搜索中...</span>
                        </div>
                        <p class="mt-2 small text-muted">正在搜索"${this.value}"...</p>
                    </div>
                `;
            }

            
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            
            searchTimeout = setTimeout(async () => {
                try {
                    currentSearch = this.value.trim();
                    currentPage = 1; 

                    
                    const params = new URLSearchParams({
                        page: currentPage,
                        per_page: itemsPerPage,
                        region: currentRegion,
                        search: currentSearch,
                        sort: currentSort
                    });

                    
                    const response = await fetch(`/api/countries?${params}`);
                    if (!response.ok) {
                        throw new Error(`搜索失败: ${response.status}`);
                    }

                    const data = await response.json();
                    
                    
                    allCountries = data.countries;
                    totalPages = data.pages || 1;

                    
                    displayCountries(data.countries);

                    
                    updatePagination(data.total);

                } catch (error) {
                    console.error('搜索国家失败:', error);
                    if (container) {
                        container.innerHTML = `
                            <div class="col-12">
                                <div class="alert alert-danger">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    搜索失败，请重试
                                    <button class="btn btn-sm btn-outline-danger ms-3" onclick="loadCountries()">
                                        <i class="bi bi-arrow-clockwise me-1"></i>重试
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                }
            }, 300); 
        });

        
        const searchWrapper = countrySearch.parentElement;
        if (searchWrapper) {
            const clearButton = document.createElement('button');
            clearButton.className = 'btn btn-link btn-sm position-absolute end-0 top-50 translate-middle-y text-muted d-none';
            clearButton.style.zIndex = '4';
            clearButton.innerHTML = '<i class="bi bi-x-lg"></i>';
            clearButton.onclick = function() {
                countrySearch.value = '';
                clearButton.classList.add('d-none');
                
                countrySearch.dispatchEvent(new Event('input'));
            };
            searchWrapper.style.position = 'relative';
            searchWrapper.appendChild(clearButton);

            
            countrySearch.addEventListener('input', function() {
                if (this.value) {
                    clearButton.classList.remove('d-none');
                } else {
                    clearButton.classList.add('d-none');
                }
            });
        }
    }
    
    
    const regionFilter = document.getElementById('regionFilter');
    if (regionFilter) {
        regionFilter.addEventListener('change', async function() {
            try {
                
                const container = document.getElementById('countries-container');
                container.innerHTML = `
                    <div class="col-12 text-center my-3">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">筛选中...</span>
                        </div>
                        <p class="mt-2">正在筛选国家数据...</p>
                    </div>
                `;
                
                
                currentRegion = this.value;
                currentPage = 1; 
                
                
                const params = new URLSearchParams({
                    page: currentPage,
                    per_page: itemsPerPage,
                    region: currentRegion,
                    search: currentSearch,
                    sort: currentSort
                });
                
                
                const response = await fetch(`/api/countries?${params}`);
                if (!response.ok) {
                    throw new Error(`筛选失败: ${response.status}`);
                }
                
                const data = await response.json();
                
                
                allCountries = data.countries;
                totalPages = data.pages || 1;
                
                
                displayCountries(data.countries);
                
                
                updatePagination(data.total);
                
            } catch (error) {
                console.error('筛选国家数据失败:', error);
                container.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            筛选国家数据失败，请重试
                            <button class="btn btn-sm btn-outline-danger ms-3" onclick="loadCountries()">
                                <i class="bi bi-arrow-clockwise me-1"></i>重试
                            </button>
                        </div>
                    </div>
                `;
            }
        });
    }
    
    
    const sortOrder = document.getElementById('sortOrder');
    if (sortOrder) {
        sortOrder.addEventListener('change', function() {
            currentSort = this.value;
            currentPage = 1; 
            loadCountries();
        });
    }
    
    
    animateCounters();
});


function generateMockCountries() {
    
    const countryData = [
        {name: "阿富汗", code: "AF"}, {name: "阿尔巴尼亚", code: "AL"}, 
        {name: "阿尔及利亚", code: "DZ"}, {name: "安道尔", code: "AD"}, 
        {name: "安哥拉", code: "AO"}, {name: "安提瓜和巴布达", code: "AG"}, 
        {name: "阿根廷", code: "AR"}, {name: "亚美尼亚", code: "AM"}, 
        {name: "澳大利亚", code: "AU"}, {name: "奥地利", code: "AT"}, 
        {name: "阿塞拜疆", code: "AZ"}, {name: "巴哈马", code: "BS"}, 
        {name: "巴林", code: "BH"}, {name: "孟加拉国", code: "BD"}, 
        {name: "巴巴多斯", code: "BB"}, {name: "白俄罗斯", code: "BY"}, 
        {name: "比利时", code: "BE"}, {name: "伯利兹", code: "BZ"}, 
        {name: "贝宁", code: "BJ"}, {name: "不丹", code: "BT"}, 
        {name: "玻利维亚", code: "BO"}, {name: "波斯尼亚和黑塞哥维那", code: "BA"}, 
        {name: "博茨瓦纳", code: "BW"}, {name: "巴西", code: "BR"}, 
        {name: "文莱", code: "BN"}, {name: "保加利亚", code: "BG"}, 
        {name: "布基纳法索", code: "BF"}, {name: "布隆迪", code: "BI"}, 
        {name: "柬埔寨", code: "KH"}, {name: "喀麦隆", code: "CM"}, 
        {name: "加拿大", code: "CA"}, {name: "佛得角", code: "CV"}, 
        {name: "中非共和国", code: "CF"}, {name: "乍得", code: "TD"}, 
        {name: "智利", code: "CL"}, {name: "中国", code: "CN"}, 
        {name: "哥伦比亚", code: "CO"}, {name: "科摩罗", code: "KM"}, 
        {name: "刚果（布）", code: "CG"}, {name: "刚果（金）", code: "CD"}, 
        {name: "哥斯达黎加", code: "CR"}, {name: "科特迪瓦", code: "CI"}, 
        {name: "克罗地亚", code: "HR"}, {name: "古巴", code: "CU"}, 
        {name: "塞浦路斯", code: "CY"}, {name: "捷克", code: "CZ"}, 
        {name: "丹麦", code: "DK"}, {name: "吉布提", code: "DJ"}, 
        {name: "多米尼克", code: "DM"}, {name: "多米尼加共和国", code: "DO"}, 
        {name: "厄瓜多尔", code: "EC"}, {name: "埃及", code: "EG"}, 
        {name: "萨尔瓦多", code: "SV"}, {name: "赤道几内亚", code: "GQ"}, 
        {name: "厄立特里亚", code: "ER"}, {name: "爱沙尼亚", code: "EE"}, 
        {name: "埃塞俄比亚", code: "ET"}, {name: "斐济", code: "FJ"}, 
        {name: "芬兰", code: "FI"}, {name: "法国", code: "FR"}, 
        {name: "加蓬", code: "GA"}, {name: "冈比亚", code: "GM"}, 
        {name: "格鲁吉亚", code: "GE"}, {name: "德国", code: "DE"}, 
        {name: "加纳", code: "GH"}, {name: "希腊", code: "GR"}, 
        {name: "格林纳达", code: "GD"}, {name: "危地马拉", code: "GT"}, 
        {name: "几内亚", code: "GN"}, {name: "几内亚比绍", code: "GW"}, 
        {name: "圭亚那", code: "GY"}, {name: "海地", code: "HT"}, 
        {name: "洪都拉斯", code: "HN"}, {name: "匈牙利", code: "HU"}, 
        {name: "冰岛", code: "IS"}, {name: "印度", code: "IN"}, 
        {name: "印度尼西亚", code: "ID"}, {name: "伊朗", code: "IR"}, 
        {name: "伊拉克", code: "IQ"}, {name: "爱尔兰", code: "IE"}, 
        {name: "以色列", code: "IL"}, {name: "意大利", code: "IT"}, 
        {name: "牙买加", code: "JM"}, {name: "日本", code: "JP"}, 
        {name: "约旦", code: "JO"}, {name: "哈萨克斯坦", code: "KZ"}, 
        {name: "肯尼亚", code: "KE"}, {name: "基里巴斯", code: "KI"}, 
        {name: "韩国", code: "KR"}, {name: "科威特", code: "KW"}, 
        {name: "吉尔吉斯斯坦", code: "KG"}, {name: "老挝", code: "LA"}, 
        {name: "拉脱维亚", code: "LV"}, {name: "黎巴嫩", code: "LB"}, 
        {name: "莱索托", code: "LS"}, {name: "利比里亚", code: "LR"}, 
        {name: "利比亚", code: "LY"}, {name: "列支敦士登", code: "LI"}, 
        {name: "立陶宛", code: "LT"}, {name: "卢森堡", code: "LU"}, 
        {name: "马达加斯加", code: "MG"}, {name: "马拉维", code: "MW"}, 
        {name: "马来西亚", code: "MY"}, {name: "马尔代夫", code: "MV"}, 
        {name: "马里", code: "ML"}, {name: "马耳他", code: "MT"}, 
        {name: "马绍尔群岛", code: "MH"}, {name: "毛里塔尼亚", code: "MR"}, 
        {name: "毛里求斯", code: "MU"}, {name: "墨西哥", code: "MX"}, 
        {name: "密克罗尼西亚", code: "FM"}, {name: "摩尔多瓦", code: "MD"}, 
        {name: "摩纳哥", code: "MC"}, {name: "蒙古", code: "MN"}, 
        {name: "黑山", code: "ME"}, {name: "摩洛哥", code: "MA"}, 
        {name: "莫桑比克", code: "MZ"}, {name: "缅甸", code: "MM"}, 
        {name: "纳米比亚", code: "NA"}, {name: "瑙鲁", code: "NR"}, 
        {name: "尼泊尔", code: "NP"}, {name: "荷兰", code: "NL"}, 
        {name: "新西兰", code: "NZ"}, {name: "尼加拉瓜", code: "NI"}, 
        {name: "尼日尔", code: "NE"}, {name: "尼日利亚", code: "NG"}, 
        {name: "朝鲜", code: "KP"}, {name: "北马其顿", code: "MK"}, 
        {name: "挪威", code: "NO"}, {name: "阿曼", code: "OM"}, 
        {name: "巴基斯坦", code: "PK"}, {name: "帕劳", code: "PW"}, 
        {name: "巴拿马", code: "PA"}, {name: "巴布亚新几内亚", code: "PG"}, 
        {name: "巴拉圭", code: "PY"}, {name: "秘鲁", code: "PE"}, 
        {name: "菲律宾", code: "PH"}, {name: "波兰", code: "PL"}, 
        {name: "葡萄牙", code: "PT"}, {name: "卡塔尔", code: "QA"}, 
        {name: "罗马尼亚", code: "RO"}, {name: "俄罗斯", code: "RU"}, 
        {name: "卢旺达", code: "RW"}, {name: "圣基茨和尼维斯", code: "KN"}, 
        {name: "圣卢西亚", code: "LC"}, {name: "圣文森特和格林纳丁斯", code: "VC"}, 
        {name: "萨摩亚", code: "WS"}, {name: "圣马力诺", code: "SM"}, 
        {name: "圣多美和普林西比", code: "ST"}, {name: "沙特阿拉伯", code: "SA"}, 
        {name: "塞内加尔", code: "SN"}, {name: "塞尔维亚", code: "RS"}, 
        {name: "塞舌尔", code: "SC"}, {name: "塞拉利昂", code: "SL"}, 
        {name: "新加坡", code: "SG"}, {name: "斯洛伐克", code: "SK"}, 
        {name: "斯洛文尼亚", code: "SI"}, {name: "所罗门群岛", code: "SB"}, 
        {name: "索马里", code: "SO"}, {name: "南非", code: "ZA"}, 
        {name: "南苏丹", code: "SS"}, {name: "西班牙", code: "ES"}, 
        {name: "斯里兰卡", code: "LK"}, {name: "苏丹", code: "SD"}, 
        {name: "苏里南", code: "SR"}, {name: "瑞典", code: "SE"}, 
        {name: "瑞士", code: "CH"}, {name: "叙利亚", code: "SY"}, 
        {name: "塔吉克斯坦", code: "TJ"}, {name: "坦桑尼亚", code: "TZ"}, 
        {name: "泰国", code: "TH"}, {name: "东帝汶", code: "TL"}, 
        {name: "多哥", code: "TG"}, {name: "汤加", code: "TO"}, 
        {name: "特立尼达和多巴哥", code: "TT"}, {name: "突尼斯", code: "TN"}, 
        {name: "土耳其", code: "TR"}, {name: "土库曼斯坦", code: "TM"}, 
        {name: "图瓦卢", code: "TV"}, {name: "乌干达", code: "UG"}, 
        {name: "乌克兰", code: "UA"}, {name: "阿联酋", code: "AE"}, 
        {name: "英国", code: "GB"}, {name: "美国", code: "US"}, 
        {name: "乌拉圭", code: "UY"}, {name: "乌兹别克斯坦", code: "UZ"}, 
        {name: "瓦努阿图", code: "VU"}, {name: "梵蒂冈", code: "VA"}, 
        {name: "委内瑞拉", code: "VE"}, {name: "越南", code: "VN"}, 
        {name: "也门", code: "YE"}, {name: "赞比亚", code: "ZM"}, 
        {name: "津巴布韦", code: "ZW"}, {name: "台湾", code: "TW"}, 
        {name: "香港", code: "HK"}, {name: "澳门", code: "MO"}, 
        {name: "英属维尔京群岛", code: "VG"}, {name: "美属维尔京群岛", code: "VI"},
        {name: "法属圭亚那", code: "GF"}, {name: "法属波利尼西亚", code: "PF"},
        {name: "荷属安的列斯", code: "AN"}, {name: "波多黎各", code: "PR"},
        {name: "格陵兰", code: "GL"}, {name: "百慕大", code: "BM"},
        {name: "库拉索", code: "CW"}, {name: "开曼群岛", code: "KY"},
        {name: "直布罗陀", code: "GI"}, {name: "法罗群岛", code: "FO"}
    ];
    
    
    let selectedCountries = [];
    let countriesCount = Math.min(countryData.length, 250); 
    
    
    let indices = Array.from(Array(countryData.length).keys());
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    
    for (let i = 0; i < countriesCount; i++) {
        const country = countryData[indices[i]];
        selectedCountries.push({
            id: i + 1,
            name: country.name,
            code: country.code,
            flag_url: `https:
            price: (Math.random() * 5 + 0.5).toFixed(2),
            popularity: Math.floor(Math.random() * 100)
        });
    }
    
    
    selectedCountries.sort((a, b) => b.popularity - a.popularity);
    
    return selectedCountries;
}


function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
        const targetValue = counter.textContent.replace(/,/g, '');
        const duration = 2000;
        const steps = 50;
        const stepValue = parseInt(targetValue) / steps;
        let currentValue = 0;
        
        counter.textContent = '0';
        
        const updateCounter = () => {
            currentValue += stepValue;
            if (currentValue < targetValue) {
                counter.textContent = Math.ceil(currentValue).toLocaleString();
                setTimeout(updateCounter, duration / steps);
            } else {
                counter.textContent = parseInt(targetValue).toLocaleString();
            }
        };
        
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(updateCounter, 200);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(counter);
    });
}


async function loadCountries() {
    try {
        const container = document.getElementById('countries-container');
        container.innerHTML = `
            <div class="col-12 text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <p class="mt-3">正在加载国家数据...</p>
                <div class="progress mt-2" style="height: 6px; max-width: 250px; margin: 0 auto;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>
                </div>
            </div>
        `;

        
        const params = new URLSearchParams({
            page: currentPage,
            per_page: itemsPerPage,
            region: currentRegion,
            search: currentSearch,
            sort: currentSort
        });

        const response = await fetch(`/api/countries?${params}`);
        
        if (!response.ok) {
            throw new Error(`加载失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        allCountries = data.countries; 
        totalPages = data.pages || 1;
        
        
        displayCountries(data.countries);
        
        
        updatePagination(data.total);

    } catch (error) {
        console.error('加载国家数据失败:', error);
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    加载国家数据失败，请刷新页面重试
                </div>
            </div>
        `;
    }
}


function displayCountries(countries) {
    console.log('显示国家列表:', countries); 
    const container = document.getElementById('countries-container');
    container.innerHTML = '';
    
    if (!countries || countries.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    没有找到匹配的国家/地区
                </div>
            </div>
        `;
        return;
    }
    
    countries.forEach((country, index) => {
        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3 col-lg-2 mb-3';
        
        const card = document.createElement('div');
        card.className = 'country-card';
        card.dataset.id = country.id;
        card.dataset.name = country.name;
        card.dataset.code = country.code;
        
        const flagUrl = `https:
        const flagFallback = '/static/images/flag-placeholder.png';
        
        card.innerHTML = `
            <div class="flag-container mb-2">
                <img src="${flagUrl}" alt="${country.name}" class="country-flag" 
                    onerror="this.onerror=null; this.src='${flagFallback}';">
            </div>
            <h6 class="mb-0">${country.name}</h6>
            <div class="d-flex justify-content-between align-items-center mt-1">
                <div class="text-muted small">${country.code}</div>
            </div>
        `;
        
        
        card.addEventListener('click', () => {
            
            document.querySelectorAll('.country-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            
            selectedCountryId = country.id;
            
            
            const countriesSection = document.querySelector('.countries-section');
            if (countriesSection) {
                countriesSection.style.display = 'none';
            }
            
            
            const servicesSection = document.getElementById('services-section');
            if (servicesSection) {
                servicesSection.classList.remove('d-none');
                
                
                const servicesSectionTitle = servicesSection.querySelector('h5');
                if (servicesSectionTitle) {
                    servicesSectionTitle.innerHTML = `
                        <div class="d-flex align-items-center">
                            <button class="btn btn-sm btn-outline-secondary me-3" onclick="showCountriesList()">
                                <i class="bi bi-arrow-left"></i> 返回
                            </button>
                            <span>
                                <img src="${flagUrl}" 
                                     alt="${country.name}" 
                                     style="height: 24px; margin-right: 8px;">
                                ${country.name} (${country.code}) 支持的服务
                            </span>
                        </div>
                    `;
                }
                
                
                loadServices(country.id);
            }
        });
        
        col.appendChild(card);
        container.appendChild(col);
        
        
        setTimeout(() => {
            card.classList.add('animate-fade-in');
        }, index * 50);
    });
}


function showCountriesList() {
    
    const countriesSection = document.querySelector('.countries-section');
    if (countriesSection) {
        countriesSection.style.display = 'block';
    }
    
    
    const servicesSection = document.getElementById('services-section');
    if (servicesSection) {
        servicesSection.classList.add('d-none');
    }
    
    
    selectedCountryId = null;
    selectedServiceId = null;
    
    
    const getNumberSection = document.getElementById('get-number-section');
    if (getNumberSection) {
        getNumberSection.classList.add('d-none');
    }
    
    
    countriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


function filterCountries() {
    const searchTerm = document.getElementById('countrySearch').value.toLowerCase();
    const regionFilter = document.getElementById('regionFilter').value;
    const sortOrder = document.getElementById('sortOrder').value;
    
    
    const regionMap = {
        'asia': ['CN', 'JP', 'KR', 'IN', 'SG', 'TH', 'MY', 'ID', 'PH', 'VN'],
        'europe': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'CH', 'RU', 'PL'],
        'america': ['US', 'CA', 'MX', 'BR', 'AR', 'CO', 'CL', 'PE'],
        'africa': ['ZA', 'EG', 'NG', 'KE', 'MA', 'GH', 'TN', 'DZ'],
        'oceania': ['AU', 'NZ', 'PG', 'FJ']
    };
    
    
    let filteredCountries = [...allCountries];
    
    if (searchTerm) {
        filteredCountries = filteredCountries.filter(country => 
            country.name.toLowerCase().includes(searchTerm) || 
            country.code.toLowerCase().includes(searchTerm)
        );
    }
    
    if (regionFilter) {
        filteredCountries = filteredCountries.filter(country => 
            regionMap[regionFilter].includes(country.code)
        );
    }
    
    
    displayCountries(filteredCountries);
    
    
    sortCountries(sortOrder);
}


function sortCountries(sortType) {
    
    const countryCards = document.querySelectorAll('.country-card');
    const countryElements = Array.from(countryCards);
    const countriesContainer = document.getElementById('countries-container');
    
    if (countryElements.length === 0) return;
    
    
    switch (sortType) {
        case 'popular':
            
            countryElements.sort((a, b) => parseInt(a.dataset.id) - parseInt(b.dataset.id));
            break;
        case 'name':
            
            countryElements.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
            break;
        case 'code':
            
            countryElements.sort((a, b) => a.dataset.code.localeCompare(b.dataset.code));
            break;
    }
    
    
    countryElements.forEach(card => {
        card.parentNode.remove();
    });
    
    
    countryElements.forEach((card, index) => {
        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3 col-lg-2 mb-3';
        col.appendChild(card);
        countriesContainer.appendChild(col);
        
        
        setTimeout(() => {
            card.classList.add('animate-fade-in');
        }, index * 30);
    });
}


function updatePagination(totalItems) {
    
    createPagination(totalItems);
}


function createPagination(totalItems) {
    const countriesContainer = document.getElementById('countries-container');
    
    
    const oldPagination = document.querySelector('.countries-pagination');
    if (oldPagination) {
        oldPagination.remove();
    }
    
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'col-12 mt-3 countries-pagination';
    
    
    if (totalPages <= 1) {
        return;
    }
    
    
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    
    let paginationHTML = `
        <div class="d-flex flex-column align-items-center">
            <nav aria-label="国家列表分页">
                <ul class="pagination pagination-sm">
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="1">1</a>
                    </li>
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${currentPage - 1}">
                            <i class="bi bi-chevron-left"></i>
                        </a>
                    </li>
                    <li class="page-item active">
                        <span class="page-link">${currentPage}</span>
                    </li>
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${currentPage + 1}">
                            <i class="bi bi-chevron-right"></i>
                        </a>
                    </li>
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
                    </li>
                </ul>
            </nav>
            <div class="text-center text-muted small mt-2">
                显示 ${startItem}-${endItem} 项，共 ${totalItems} 项
            </div>
        </div>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
    countriesContainer.parentNode.appendChild(paginationContainer);
    
    
    const pageLinks = paginationContainer.querySelectorAll('.page-link');
    pageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const page = this.dataset.page;
            let newPage = currentPage;
            
            if (page === 'prev') {
                newPage = Math.max(1, currentPage - 1);
            } else if (page === 'next') {
                newPage = Math.min(totalPages, currentPage + 1);
            } else {
                newPage = parseInt(page);
            }
            
            if (newPage !== currentPage) {
                currentPage = newPage;
                loadCountries();
            }
        });
    });
}


async function loadServices(countryId) {
    const servicesContainer = document.getElementById('services-container');
    const servicesSection = document.getElementById('services-section');
    if (!servicesContainer) return;

    if (servicesSection) {
        servicesSection.classList.remove('d-none');
    }
    
    servicesContainer.innerHTML = `
        <div class="col-12 text-center my-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <p class="mt-3">正在加载服务列表...</p>
            <div class="progress mt-2" style="height: 6px; max-width: 250px; margin: 0 auto;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>
            </div>
        </div>
    `;

    try {
        
        const response = await fetch(`/api/services/${countryId}`);
        if (!response.ok) {
            throw new Error(`加载失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        servicesContainer.innerHTML = '';

        if (!data.services || data.services.length === 0) {
            servicesContainer.innerHTML = `
                <div class="col-12 text-center my-4">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        该国家暂无可用服务
                    </div>
                </div>
            `;
            return;
        }

        
        servicesAllData = data.services;
        
        
        const totalPages = Math.ceil(servicesAllData.length / servicesItemsPerPage);
        
        
        const startIndex = (servicesCurrentPage - 1) * servicesItemsPerPage;
        const endIndex = startIndex + servicesItemsPerPage;
        const currentPageData = servicesAllData.slice(startIndex, endIndex);

        
        currentPageData.forEach((service, index) => {
            const col = document.createElement('div');
            col.className = 'col-6 col-sm-4 col-md-3 mb-3';
            
            
            setTimeout(() => {
                col.style.opacity = '1';
                col.style.transform = 'translateY(0)';
            }, index * 50);
            
            col.style.opacity = '0';
            col.style.transform = 'translateY(20px)';
            col.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

            
            const successRate = Math.floor(Math.random() * 5) + 95;
            
            
            const serviceInitial = service.name.charAt(0);
            
            col.innerHTML = `
                <div class="service-card" data-id="${service.id}">
                    <div class="service-icon-placeholder">${serviceInitial}</div>
                    <h6 class="mb-2">${service.name}</h6>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-success bg-opacity-10 text-success small">
                            成功率 ${successRate}%
                        </span>
                        <span class="text-primary fw-bold">¥${service.price.toFixed(2)}</span>
                    </div>
                </div>
            `;
            
            servicesContainer.appendChild(col);
        });

        
        addServiceCardClickHandlers();

        
        createServicesPagination(servicesAllData.length);

    } catch (error) {
        console.error('加载服务列表失败:', error);
        servicesContainer.innerHTML = `
            <div class="col-12 my-4">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    加载服务数据失败: ${error.message}
                    <button class="btn btn-sm btn-danger ms-3" onclick="loadServices('${countryId}')">重试</button>
                </div>
            </div>
        `;
    }
}


function createServicesPagination(totalItems) {
    const servicesContainer = document.getElementById('services-container');
    const servicesSection = document.getElementById('services-section');
    
    const oldPagination = document.querySelector('.services-pagination');
    if (oldPagination) {
        oldPagination.remove();
    }
    
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'col-12 mt-3 services-pagination';
    
    const totalPages = Math.ceil(totalItems / servicesItemsPerPage);
    
    if (totalPages <= 1) {
        return;
    }
    
    const startItem = (servicesCurrentPage - 1) * servicesItemsPerPage + 1;
    const endItem = Math.min(servicesCurrentPage * servicesItemsPerPage, totalItems);
    
    let paginationHTML = '<div class="d-flex justify-content-center">' +
        '<nav aria-label="服务列表分页">' +
        '<ul class="pagination pagination-sm">' +
        '<li class="page-item ' + (servicesCurrentPage === 1 ? 'disabled' : '') + '">' +
        '<a class="page-link" href="#" data-page="1">1</a>' +
        '</li>' +
        '<li class="page-item ' + (servicesCurrentPage === 1 ? 'disabled' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + (servicesCurrentPage - 1) + '">' +
        '<i class="bi bi-chevron-left"></i>' +
        '</a>' +
        '</li>' +
        '<li class="page-item active">' +
        '<span class="page-link">' + servicesCurrentPage + '</span>' +
        '</li>' +
        '<li class="page-item ' + (servicesCurrentPage === totalPages ? 'disabled' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + (servicesCurrentPage + 1) + '">' +
        '<i class="bi bi-chevron-right"></i>' +
        '</a>' +
        '</li>' +
        '<li class="page-item ' + (servicesCurrentPage === totalPages ? 'disabled' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + totalPages + '">' + totalPages + '</a>' +
        '</li>' +
        '</ul>' +
        '</nav>' +
        '</div>' +
        '<div class="text-center text-muted small mt-2">显示 ' + startItem + '-' + endItem + ' 项，共 ' + totalItems + ' 项</div>';
    
    paginationContainer.innerHTML = paginationHTML;
    
    if (servicesSection) {
        servicesSection.appendChild(paginationContainer);
    } else {
        servicesContainer.parentNode.appendChild(paginationContainer);
    }
    
    addServicesPaginationEventListeners(totalPages);
}


function addServicesPaginationEventListeners(totalPages) {
    
    document.querySelectorAll('.services-pagination .page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.closest('.page-link').dataset.page);
            if (!isNaN(page) && page !== servicesCurrentPage) {
                servicesCurrentPage = page;
                loadServices(selectedCountryId);
                
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
        });
    });
}


function addServiceCardClickHandlers() {
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', function() {
            
            document.querySelectorAll('.service-card').forEach(c => {
                c.classList.remove('active');
                
                const selectedOverlay = c.querySelector('.selected-overlay');
                if (selectedOverlay) {
                    selectedOverlay.remove();
                }
                
                const selectedBadge = c.querySelector('.badge.bg-success.w-100');
                if (selectedBadge) {
                    selectedBadge.remove();
                }
            });
            
            
            this.classList.add('active');
            
            
            selectedServiceId = this.dataset.id;
            
            
            if (!this.querySelector('.selected-overlay')) {
                this.innerHTML += `
                    <div class="selected-overlay">
                        <div class="badge bg-success w-100 mt-2">
                            <i class="bi bi-check-circle me-1"></i> 已选择
                        </div>
                    </div>
                `;
            }
            
            
            const getNumberSection = document.getElementById('get-number-section');
            if (getNumberSection) {
                getNumberSection.classList.remove('d-none');
                getNumberSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
}


function fetchServicesByCountry(countryId) {
    const servicesSection = document.getElementById('services-section');
    const servicesContainer = document.getElementById('services-container');
    const getNumberSection = document.getElementById('get-number-section');
    
    if (!servicesSection || !servicesContainer) return;
    
    
    servicesSection.classList.remove('d-none');
    
    
    servicesContainer.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <p class="mb-2">加载服务列表...</p>
            <div class="progress" style="height: 6px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 70%"></div>
            </div>
        </div>
    `;
    
    
    getNumberSection.classList.add('d-none');
    
    
    setTimeout(() => {
        
        allServices = generateMockServices(countryId);
        
        
        servicesContainer.innerHTML = '';
        
        if (allServices.length === 0) {
            servicesContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-warning border-0">
                        <i class="bi bi-exclamation-circle-fill me-2"></i> 该国家暂无可用服务
                    </div>
                </div>
            `;
            return;
        }
        
        
        allServices.forEach((service, index) => {
            const serviceCard = createServiceCard(service);
            servicesContainer.appendChild(serviceCard);
            
            
            setTimeout(() => {
                serviceCard.querySelector('.service-card').classList.add('animate-fade-in');
            }, index * 50);
        });
    }, 800); 
    
    
    
}


function createServiceCard(service) {
    const col = document.createElement('div');
    col.className = 'col-6 col-sm-4 col-md-3 mb-3';
    
    const card = document.createElement('div');
    card.className = 'service-card shadow-sm';
    card.dataset.id = service.id;
    
    
    const serviceInitial = service.name.charAt(0);
    
    
    const successRate = Math.floor(Math.random() * 5) + 95;
    
    card.innerHTML = `
        <div class="service-icon-placeholder">${serviceInitial}</div>
        <h6 class="mb-0 mt-2">${service.name}</h6>
        <div class="d-flex justify-content-between align-items-center my-2">
            <span class="badge bg-success bg-opacity-10 text-success small">成功率 ${successRate}%</span>
            <span class="text-primary fw-bold">¥${service.price}</span>
        </div>
    `;
    
    
    card.addEventListener('click', function() {
        
        document.querySelectorAll('.service-card').forEach(c => {
            c.classList.remove('active');
            
            const selectedBadge = c.querySelector('.badge.bg-success.w-100');
            if (selectedBadge) {
                selectedBadge.remove();
            }
        });
        
        
        this.classList.add('active');
        
        
        selectedServiceId = service.id;
        
        
        const existingBadge = this.querySelector('.badge.bg-success.w-100');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        
        this.innerHTML = `
            <div class="service-icon-placeholder">${serviceInitial}</div>
            <h6 class="mb-0 mt-2">${service.name}</h6>
            <div class="d-flex justify-content-between align-items-center my-2">
                <span class="badge bg-success bg-opacity-10 text-success small">成功率 ${successRate}%</span>
                <span class="text-primary fw-bold">¥${service.price}</span>
            </div>
            <div class="mt-2 badge bg-success w-100">
                <i class="bi bi-check-circle me-1"></i> 已选择
            </div>
        `;
        
        
        const getNumberSection = document.getElementById('get-number-section');
        if (getNumberSection) {
            getNumberSection.classList.remove('d-none');
            getNumberSection.classList.add('animate-fade-in');
            
            
            getNumberSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    col.appendChild(card);
    return col;
}


function handleGetNumber() {
    if (!selectedCountryId || !selectedServiceId) {
        alert('请先选择国家和服务');
        return;
    }
    
    
    const getNumberBtn = document.getElementById('get-number-btn');
    const originalButtonText = getNumberBtn.innerHTML;
    getNumberBtn.disabled = true;
    getNumberBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        处理中...
    `;
    
    
    fetch('/api/get_number', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            country_id: selectedCountryId,
            service_id: selectedServiceId
        })
    })
    .then(response => response.json())
    .then(data => {
        
        getNumberBtn.disabled = false;
        getNumberBtn.innerHTML = originalButtonText;
        
        if (data.status === 'error' && data.needRecharge) {
            
            const rechargeModal = new bootstrap.Modal(document.getElementById('rechargeModal'));
            rechargeModal.show();
        } else if (data.status === 'success') {
            
            
            alert(`成功获取号码: ${data.phone_number}`);
        } else {
            
            alert(data.message || '获取号码失败，请重试');
        }
    })
    .catch(error => {
        console.error('Error getting phone number:', error);
        
        
        getNumberBtn.disabled = false;
        getNumberBtn.innerHTML = originalButtonText;
        
        alert('网络错误，请重试');
    });
}