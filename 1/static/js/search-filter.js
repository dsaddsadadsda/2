
let searchTimeout;
let currentSearch = '';
let currentRegion = '';
let currentSort = 'popular';


document.addEventListener('DOMContentLoaded', function() {
    initializeSearchFilter();
    
    
    checkFilterVisibility();
});


function checkFilterVisibility() {
    const searchFilterCard = document.querySelector('.search-filter-card');
    if (!searchFilterCard) return;
    
    
    const servicesSection = document.getElementById('services-section');
    if (servicesSection && !servicesSection.classList.contains('d-none')) {
        searchFilterCard.classList.add('hidden');
    } else {
        searchFilterCard.classList.remove('hidden');
    }
}

function initializeSearchFilter() {
    initializeSearch();
    initializeRegionFilter();
    initializeSortOrder();
}


function initializeSearch() {
    const searchInput = document.getElementById('countrySearch');
    if (!searchInput) return;

    
    searchInput.addEventListener('input', handleSearchInput);

    
    initializeClearButton(searchInput);
}


function handleSearchInput() {
    const container = document.getElementById('countries-container');
    if (!container) return;

    
    showSearchLoading(container, this.value);

    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
        currentSearch = this.value.trim();
        if (typeof loadCountries === 'function') {
            loadCountries();
        }
    }, 300);
}


function showSearchLoading(container, searchValue) {
    container.innerHTML = `
        <div class="col-12 text-center my-3">
            <div class="spinner-border text-primary spinner-border-sm" role="status">
                <span class="visually-hidden">搜索中...</span>
            </div>
            <p class="mt-2 small text-muted">正在搜索"${searchValue}"...</p>
        </div>
    `;
}


function initializeClearButton(searchInput) {
    const searchWrapper = searchInput.parentElement;
    if (!searchWrapper) return;

    const clearButton = document.createElement('button');
    clearButton.className = 'search-clear-btn btn btn-link btn-sm position-absolute end-0 top-50 translate-middle-y text-muted d-none';
    clearButton.innerHTML = '<i class="bi bi-x-lg"></i>';
    
    
    clearButton.onclick = () => {
        searchInput.value = '';
        clearButton.classList.add('d-none');
        searchInput.dispatchEvent(new Event('input'));
    };

    
    searchInput.addEventListener('input', () => {
        clearButton.classList.toggle('d-none', !searchInput.value);
    });

    searchWrapper.appendChild(clearButton);
}


function initializeRegionFilter() {
    const regionFilter = document.getElementById('regionFilter');
    if (!regionFilter) return;

    regionFilter.addEventListener('change', function() {
        currentRegion = this.value;
        if (typeof loadCountries === 'function') {
            loadCountries();
        }
    });
}


function initializeSortOrder() {
    const sortOrder = document.getElementById('sortOrder');
    if (!sortOrder) return;

    sortOrder.addEventListener('change', function() {
        currentSort = this.value;
        if (typeof loadCountries === 'function') {
            loadCountries();
        }
    });
}


function getSearchState() {
    return {
        search: currentSearch,
        region: currentRegion,
        sort: currentSort
    };
}


window.searchFilter = {
    getState: getSearchState,
    initialize: initializeSearchFilter
}; 