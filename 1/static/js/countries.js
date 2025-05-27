let selectedCountryId = null;
let selectedServiceId = null;
let allCountries = [];
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
    console.log('国家加载模块初始化中...');
    
    hideLoginOverlayIfLoggedIn();
    
    loadCountries();
    
    initializeSearch();
    
    initializeFilter();
    
    initializeSort();
});

function hideLoginOverlayIfLoggedIn() {
    const loginOverlay = document.querySelector('.login-overlay');
    if (loginOverlay) {
        console.log('检测到登录覆盖层，处理中');
        loginOverlay.style.display = 'none';
        loginOverlay.style.zIndex = '-1';
    }
}

async function loadCountries() {
    try {
        const container = document.getElementById('countries-container');
        if (!container) {
            console.error('找不到国家容器元素');
            return;
        }
        
        container.innerHTML = '<div class="col-12 text-center my-5">' +
            '<div class="spinner-border text-primary" role="status">' +
            '<span class="visually-hidden">加载中...</span>' +
            '</div>' +
            '<p class="mt-3">正在加载国家数据...</p>' +
            '</div>';

        const params = new URLSearchParams({
            page: currentPage,
            per_page: itemsPerPage,
            region: currentRegion,
            search: currentSearch,
            sort: currentSort
        });

        console.log('请求国家数据，参数:', Object.fromEntries(params));
        
        const response = await fetch(`/api/countries?${params}`);
        if (!response.ok) {
            throw new Error(`加载失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('成功获取国家数据，数量:', data.countries?.length || 0);
        
        allCountries = data.countries || []; 
        totalPages = data.pages || 1;
        
        displayCountries(allCountries);
        
        updatePagination(data.total || 0);

    } catch (error) {
        console.error('加载国家数据失败:', error);
        const container = document.getElementById('countries-container');
        if (container) {
            container.innerHTML = '<div class="col-12 text-center my-5">' +
                '<div class="spinner-border text-primary" role="status">' +
                '<span class="visually-hidden">重新连接中...</span>' +
                '</div>' +
                '<p class="mt-3">重新连接中...</p>' +
                '</div>';
            
            console.log('将在2秒后自动重试加载国家数据');
            setTimeout(() => {
                loadCountries();
            }, 2000);
        }
    }
}

function displayCountries(countries) {
    console.log('显示国家列表，数量:', countries.length);
    const container = document.getElementById('countries-container');
    if (!container) {
        console.error('找不到国家容器元素');
        return;
    }
    
    container.innerHTML = '';
    
    if (!countries || countries.length === 0) {
        container.innerHTML = '<div class="col-12">' +
            '<div class="alert alert-warning">' +
            '<i class="bi bi-exclamation-circle me-2"></i>' +
            '没有找到匹配的国家/地区' +
            '</div>' +
            '</div>';
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
        
        const flagUrl = country.flag_url || `https://flagcdn.com/w80/${country.code.toLowerCase()}.png`;
        const flagFallback = '/static/images/flag-placeholder.png';
        
        card.innerHTML = '<div class="flag-container mb-2">' +
            '<img src="' + flagUrl + '" alt="' + country.name + '" class="country-flag" ' +
            'onerror="this.onerror=null; this.src=\'' + flagFallback + '\';">' +
            '</div>' +
            '<h6 class="mb-0">' + country.name + '</h6>' +
            '<div class="d-flex justify-content-between align-items-center mt-1">' +
            '<div class="text-muted small">' + country.code + '</div>' +
            '</div>';
        
        card.addEventListener('click', () => {
            document.querySelectorAll('.country-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            selectedCountryId = country.id;
            
            const countriesSection = document.querySelector('.countries-section');
            if (countriesSection) {
                countriesSection.style.display = 'none';
            }
            
            const searchFilterCard = document.querySelector('.search-filter-card');
            if (searchFilterCard) {
                searchFilterCard.classList.add('hidden');
            }
            
            const servicesSection = document.getElementById('services-section');
            if (servicesSection) {
                servicesSection.classList.remove('d-none');
                
                const servicesSectionTitle = servicesSection.querySelector('h5');
                if (servicesSectionTitle) {
                    servicesSectionTitle.innerHTML = '<div class="d-flex align-items-center">' +
                        '<button class="btn btn-sm btn-outline-secondary me-3" onclick="showCountriesList()">' +
                        '<i class="bi bi-arrow-left"></i> 返回' +
                        '</button>' +
                        '<span>' +
                        '<img src="' + flagUrl + '" ' +
                        'alt="' + country.name + '" ' +
                        'style="height: 24px; margin-right: 8px;">' +
                        country.name + ' (' + country.code + ') 支持的服务' +
                        '</span>' +
                        '</div>';
                }
                
                loadServices(country.id);
            }
        });
        
        col.appendChild(card);
        container.appendChild(col);
        
        setTimeout(() => {
            card.classList.add('animate-fade-in');
        }, index * 30);
    });
}

function showCountriesList() {
    const countriesSection = document.querySelector('.countries-section');
    if (countriesSection) {
        countriesSection.style.display = 'block';
    }
    
    const searchFilterCard = document.querySelector('.search-filter-card');
    if (searchFilterCard) {
        searchFilterCard.classList.remove('hidden');
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

function initializeSearch() {
    const countrySearch = document.getElementById('countrySearch');
    if (countrySearch) {
        let searchTimeout;
        countrySearch.addEventListener('input', function() {
            const container = document.getElementById('countries-container');
            if (container) {
                container.innerHTML = '<div class="col-12 text-center my-3">' +
                    '<div class="spinner-border text-primary spinner-border-sm" role="status">' +
                    '<span class="visually-hidden">搜索中...</span>' +
                    '</div>' +
                    '<p class="mt-2 small text-muted">正在搜索"' + this.value + '"...</p>' +
                    '</div>';
            }

            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            searchTimeout = setTimeout(() => {
                currentSearch = this.value.trim();
                currentPage = 1; 
                loadCountries();
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
}

function initializeFilter() {
    const regionFilter = document.getElementById('regionFilter');
    if (regionFilter) {
        regionFilter.addEventListener('change', function() {
            currentRegion = this.value;
            currentPage = 1; 
            loadCountries();
        });
    }
}

function initializeSort() {
    const sortOrder = document.getElementById('sortOrder');
    if (sortOrder) {
        sortOrder.addEventListener('change', function() {
            currentSort = this.value;
            currentPage = 1; 
            loadCountries();
        });
    }
}

function updatePagination(totalItems) {
    const countriesContainer = document.getElementById('countries-container');
    if (!countriesContainer) return;
    
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
    
    let paginationHTML = '<div class="d-flex flex-column align-items-center">' +
        '<nav aria-label="国家列表分页">' +
        '<ul class="pagination pagination-sm">' +
        '<li class="page-item ' + (currentPage === 1 ? 'disabled' : '') + '">' +
        '<a class="page-link" href="#" data-page="1">1</a>' +
        '</li>' +
        '<li class="page-item ' + (currentPage === 1 ? 'disabled' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + (currentPage - 1) + '">' +
        '<i class="bi bi-chevron-left"></i>' +
        '</a>' +
        '</li>' +
        '<li class="page-item active">' +
        '<span class="page-link">' + currentPage + '</span>' +
        '</li>' +
        '<li class="page-item ' + (currentPage === totalPages ? 'disabled' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + (currentPage + 1) + '">' +
        '<i class="bi bi-chevron-right"></i>' +
        '</a>' +
        '</li>' +
        '<li class="page-item ' + (currentPage === totalPages ? 'disabled' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + totalPages + '">' + totalPages + '</a>' +
        '</li>' +
        '</ul>' +
        '</nav>' +
        '<div class="text-center text-muted small mt-2">' +
        '显示 ' + startItem + '-' + endItem + ' 项，共 ' + totalItems + ' 项' +
        '</div>' +
        '</div>';
    
    paginationContainer.innerHTML = paginationHTML;
    countriesContainer.parentNode.appendChild(paginationContainer);
    
    const pageLinks = paginationContainer.querySelectorAll('.page-link');
    pageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const page = this.dataset.page;
            if (!page) return;
            
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
    if (!servicesContainer) return;

    const servicesSection = document.getElementById('services-section');
    if (servicesSection) {
        servicesSection.classList.remove('d-none');
    }

    servicesContainer.innerHTML = '<div class="col-12 text-center my-5">' +
        '<div class="spinner-border text-primary" role="status">' +
        '<span class="visually-hidden">加载中...</span>' +
        '</div>' +
        '<p class="mt-3">正在加载服务列表...</p>' +
        '</div>';

    try {
        const response = await fetch(`/api/services/${countryId}`);
        if (!response.ok) {
            throw new Error(`加载失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        servicesContainer.innerHTML = '';

        if (!data.services || data.services.length === 0) {
            servicesContainer.innerHTML = '<div class="col-12 text-center my-4">' +
                '<div class="alert alert-warning">' +
                '<i class="bi bi-exclamation-triangle me-2"></i>' +
                '该国家暂无可用服务' +
                '</div>' +
                '</div>';
            return;
        }

        servicesAllData = data.services;
        
        addServiceSearchBar();
        
        displayServices(servicesAllData);

        displayServicesPagination(servicesAllData.length);

    } catch (error) {
        console.error('加载服务列表失败:', error);
        
        console.log('自动重试加载服务...');
        
        servicesContainer.innerHTML = '<div class="col-12 text-center my-4">' +
            '<div class="spinner-border text-primary spinner-border-sm" role="status">' +
            '<span class="visually-hidden">加载中...</span>' +
            '</div>' +
            '<p class="small text-muted">重新连接中...</p>' +
            '</div>';
        
        setTimeout(() => {
            loadServices(countryId);
        }, 2000);
    }
}

function addServiceSearchBar() {
    const servicesSection = document.getElementById('services-section');
    if (!servicesSection) return;
    
    if (servicesSection.querySelector('.service-search-container')) return;
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'service-search-container mb-3';
    
    searchContainer.innerHTML = `
        <div class="input-group">
            <span class="input-group-text bg-light border-end-0"><i class="bi bi-search text-muted"></i></span>
            <input type="text" class="form-control border-start-0 bg-light" id="serviceSearch" placeholder="搜索服务..." aria-label="搜索服务">
            <button class="btn btn-outline-secondary border-start-0 d-none" type="button" id="clearServiceSearch"><i class="bi bi-x-lg"></i></button>
        </div>
    `;
    
    const title = servicesSection.querySelector('h5');
    if (title) {
        title.parentNode.insertBefore(searchContainer, title.nextSibling);
    } else {
        servicesSection.insertBefore(searchContainer, servicesSection.firstChild);
    }
    
    const searchInput = document.getElementById('serviceSearch');
    const clearButton = document.getElementById('clearServiceSearch');
    
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                clearButton.classList.remove('d-none');
            } else {
                clearButton.classList.add('d-none');
            }
            
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            searchTimeout = setTimeout(() => {
                filterServices(this.value.trim().toLowerCase());
            }, 300);
        });
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                clearButton.classList.add('d-none');
                filterServices('');
            }
        });
    }
}

function filterServices(keyword) {
    if (!servicesAllData) return;
    
    const servicesContainer = document.getElementById('services-container');
    if (!servicesContainer) return;
    
    if (!keyword) {
        displayServices(servicesAllData);
        displayServicesPagination(servicesAllData.length);
        return;
    }
    
    servicesContainer.innerHTML = '<div class="col-12 text-center my-3">' +
        '<div class="spinner-border spinner-border-sm text-primary" role="status">' +
        '<span class="visually-hidden">搜索中...</span>' +
        '</div>' +
        '<p class="small text-muted mt-2">正在搜索"' + keyword + '"...</p>' +
        '</div>';
    
    setTimeout(() => {
        const filteredServices = servicesAllData.filter(service => 
            service.name.toLowerCase().includes(keyword.toLowerCase())
        );
        
        servicesCurrentPage = 1;
        
        displayServices(filteredServices);
        
        displayServicesPagination(filteredServices.length);
    }, 300);
}

function displayServices(services) {
    const servicesContainer = document.getElementById('services-container');
    if (!servicesContainer) return;
    
    servicesContainer.innerHTML = '';
    
    if (!services || services.length === 0) {
        servicesContainer.innerHTML = '<div class="col-12 text-center my-4">' +
            '<div class="alert alert-warning">' +
            '<i class="bi bi-exclamation-triangle me-2"></i>' +
            '没有找到服务' +
            '</div>' +
            '</div>';
        return;
    }
    
    const startIndex = (servicesCurrentPage - 1) * servicesItemsPerPage;
    const endIndex = Math.min(startIndex + servicesItemsPerPage, services.length);
    const pageServices = services.slice(startIndex, endIndex);
    
    pageServices.forEach((service, index) => {
        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3 mb-3';
        col.style.opacity = '0';
        col.style.transform = 'translateY(20px)';
        col.style.transition = 'opacity 0.3s, transform 0.3s';
        
        const successRate = Math.floor(Math.random() * 5) + 95;
        const firstChar = service.name.charAt(0);
        
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.dataset.id = service.id;
        
        serviceCard.innerHTML = 
            '<div class="service-icon-placeholder">' + firstChar + '</div>' +
            '<h6 class="mb-2">' + service.name + '</h6>' +
            '<div class="d-flex justify-content-between align-items-center">' +
                '<span class="badge bg-success bg-opacity-10 text-success small">' +
                    '成功率 ' + successRate + '%' +
                '</span>' +
                '<span class="text-primary fw-bold">¥' + service.price.toFixed(2) + '</span>' +
            '</div>';
        
        if (selectedServiceId === service.id) {
            serviceCard.classList.add('active');
            
            const overlay = document.createElement('div');
            overlay.className = 'selected-overlay';
            overlay.innerHTML = '<div class="badge bg-success w-100 mt-2"><i class="bi bi-check-circle me-1"></i> 已选择</div>';
            serviceCard.appendChild(overlay);
        }
        
        serviceCard.addEventListener('click', () => {
            document.querySelectorAll('.service-card').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.selected-overlay').forEach(o => o.remove());
            
            serviceCard.classList.add('active');
            
            const overlay = document.createElement('div');
            overlay.className = 'selected-overlay';
            overlay.innerHTML = '<div class="badge bg-success w-100 mt-2"><i class="bi bi-check-circle me-1"></i> 已选择</div>';
            serviceCard.appendChild(overlay);
            
            selectedServiceId = service.id;
            
            const getNumberSection = document.getElementById('get-number-section');
            if (getNumberSection) {
                getNumberSection.classList.remove('d-none');
            }
        });
        
        col.appendChild(serviceCard);
        servicesContainer.appendChild(col);
        
        setTimeout(() => {
            col.style.opacity = '1';
            col.style.transform = 'translateY(0px)';
        }, index * 50);
    });
}

function handleGetNumber() {
    if (!selectedCountryId || !selectedServiceId) {
        alert('请先选择国家和服务');
        return;
    }
    
    const getNumberBtn = document.getElementById('get-number-btn');
    if (!getNumberBtn) return;
    
    const originalButtonText = getNumberBtn.innerHTML;
    getNumberBtn.disabled = true;
    getNumberBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 处理中...';
    
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
            alert('成功获取号码: ' + data.phone_number);
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

function displayServicesPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / servicesItemsPerPage);
    if (totalPages <= 1) return; 
    
    const oldPagination = document.querySelector('.services-pagination');
    if (oldPagination) {
        oldPagination.remove();
    }
    
    const servicesSection = document.getElementById('services-section');
    if (!servicesSection) return;
    
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'col-12 mt-3 services-pagination';
    
    const startItem = (servicesCurrentPage - 1) * servicesItemsPerPage + 1;
    const endItem = Math.min(servicesCurrentPage * servicesItemsPerPage, totalItems);
    
    const paginationInnerDiv = document.createElement('div');
    paginationInnerDiv.className = 'd-flex flex-column align-items-center';
    
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', '国家列表分页');
    
    const ul = document.createElement('ul');
    ul.className = 'pagination pagination-sm';
    
    const liFirst = document.createElement('li');
    liFirst.className = 'page-item ' + (servicesCurrentPage === 1 ? 'disabled' : '');
    const aFirst = document.createElement('a');
    aFirst.className = 'page-link';
    aFirst.href = '#';
    aFirst.dataset.page = '1';
    aFirst.textContent = '1';
    liFirst.appendChild(aFirst);
    ul.appendChild(liFirst);
    
    const liPrev = document.createElement('li');
    liPrev.className = 'page-item ' + (servicesCurrentPage === 1 ? 'disabled' : '');
    const aPrev = document.createElement('a');
    aPrev.className = 'page-link';
    aPrev.href = '#';
    aPrev.dataset.page = (servicesCurrentPage - 1).toString();
    const iPrev = document.createElement('i');
    iPrev.className = 'bi bi-chevron-left';
    aPrev.appendChild(iPrev);
    liPrev.appendChild(aPrev);
    ul.appendChild(liPrev);
    
    const liCurrent = document.createElement('li');
    liCurrent.className = 'page-item active';
    const spanCurrent = document.createElement('span');
    spanCurrent.className = 'page-link';
    spanCurrent.textContent = servicesCurrentPage.toString();
    liCurrent.appendChild(spanCurrent);
    ul.appendChild(liCurrent);
    
    const liNext = document.createElement('li');
    liNext.className = 'page-item ' + (servicesCurrentPage === totalPages ? 'disabled' : '');
    const aNext = document.createElement('a');
    aNext.className = 'page-link';
    aNext.href = '#';
    aNext.dataset.page = (servicesCurrentPage + 1).toString();
    const iNext = document.createElement('i');
    iNext.className = 'bi bi-chevron-right';
    aNext.appendChild(iNext);
    liNext.appendChild(aNext);
    ul.appendChild(liNext);
    
    const liLast = document.createElement('li');
    liLast.className = 'page-item ' + (servicesCurrentPage === totalPages ? 'disabled' : '');
    const aLast = document.createElement('a');
    aLast.className = 'page-link';
    aLast.href = '#';
    aLast.dataset.page = totalPages.toString();
    aLast.textContent = totalPages.toString();
    liLast.appendChild(aLast);
    ul.appendChild(liLast);
    
    nav.appendChild(ul);
    paginationInnerDiv.appendChild(nav);
    
    const pageInfo = document.createElement('div');
    pageInfo.className = 'text-center text-muted small mt-2';
    pageInfo.textContent = `显示 ${startItem}-${endItem} 项，共 ${totalItems} 项`;
    paginationInnerDiv.appendChild(pageInfo);
    
    paginationDiv.appendChild(paginationInnerDiv);
    servicesSection.appendChild(paginationDiv);
    
    addPaginationEvents();
}

function addPaginationEvents() {
    document.querySelectorAll('.services-pagination .page-link').forEach(link => {
        if (!link.dataset.page) return;
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.dataset.page);
            
            if (isNaN(page) || page === servicesCurrentPage) return;
            
            servicesCurrentPage = page;
            displayServices(servicesAllData);
            displayServicesPagination(servicesAllData.length);
            
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
    });
}

window.loadCountries = loadCountries;
window.showCountriesList = showCountriesList;
window.handleGetNumber = handleGetNumber; 