document.addEventListener('DOMContentLoaded', function() {
    initSmoothScroll();
    initCatalogDropdown();
    ultimateFiltersFix();
    initScrollToTop();
    initActiveMenuHighlight();
    initScrollAnimations();
    initForms();
    initProductTooltips();
});

const API_BASE_URL = 'http://coffee-frontend-uckkvg-dde3a2-45-131-214-123.traefik.me/api';

let currentProducts = [];
let filters = {
    size: null,
    minRating: null,
    maxRating: null,
    ingredient: null,
    minPrice: null,
    maxPrice: null
};
let abortController = null;

function initCarousel() {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    
    if (!mainImage || thumbnails.length === 0) return;
    
    let currentIndex = 0;
    const totalImages = thumbnails.length;
    
    function updateMainImage(index) {
        const thumbnail = thumbnails[index];
        const imageSrc = thumbnail.getAttribute('data-image');
        const imageAlt = thumbnail.getAttribute('data-alt');
        
        mainImage.src = imageSrc;
        mainImage.alt = imageAlt;
        
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnail.classList.add('active');
        
        currentIndex = index;
    }
    function nextImage() {
        let nextIndex = currentIndex + 1;
        if (nextIndex >= totalImages) {
            nextIndex = 0;
        }
        updateMainImage(nextIndex);
    }
    
    function prevImage() {
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
            prevIndex = totalImages - 1;
        }
        updateMainImage(prevIndex);
    }
    
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => {
            updateMainImage(index);
        });
        
        thumbnail.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        thumbnail.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1.1)';
        });
    });
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextImage);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', prevImage);
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            nextImage();
        } else if (e.key === 'ArrowLeft') {
            prevImage();
        }
    });
    
    let autoPlayInterval;
    
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextImage, 4000);
    }
    
    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }
    
    startAutoPlay();
    
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopAutoPlay);
        carouselContainer.addEventListener('mouseleave', startAutoPlay);
        carouselContainer.addEventListener('touchstart', stopAutoPlay);
    }
    
    const thumbnailsContainer = document.querySelector('.carousel-thumbnails');
    if (thumbnailsContainer) {
        thumbnailsContainer.addEventListener('mouseenter', stopAutoPlay);
        thumbnailsContainer.addEventListener('mouseleave', startAutoPlay);
    }
    
    function preloadImages() {
        thumbnails.forEach(thumbnail => {
            const img = new Image();
            img.src = thumbnail.getAttribute('data-image');
        });
    }
    
    preloadImages();
}

function initSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#' || href.startsWith('#!')) return;
            
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

function initCatalogDropdown() {
    const catalogBtn = document.querySelector('.catalog-dropdown-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    console.log('Инициализация каталога:', {catalogBtn, dropdownMenu});
    
    if (catalogBtn && dropdownMenu) {
        catalogBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Клик по каталогу!');
            
            dropdownMenu.classList.toggle('active');
            catalogBtn.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
        if (!e.target.closest('.catalog-dropdown-btn') && !e.target.closest('.dropdown-menu')) {
            dropdownMenu.style.opacity = '0';
            dropdownMenu.style.visibility = 'hidden';
            dropdownMenu.style.transform = 'translateY(-10px)';
            catalogBtn.classList.remove('active');
        }
    });
        
        dropdownMenu.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                dropdownMenu.classList.remove('active');
                catalogBtn.classList.remove('active');
            }
        });
        
        console.log('Каталог инициализирован');
    } else {
        console.log('Каталог не найден');
    }
}
function ultimateDropdownFix() {
    const catalogBtn = document.querySelector('.catalog-dropdown-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    dropdownMenu.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        background: #FFF8E1;
        min-width: 200px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        border-radius: 8px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.3s ease;
        z-index: 1001;
    `;
    
    catalogBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isActive = dropdownMenu.style.visibility === 'visible';
        
        if (isActive) {
            dropdownMenu.style.opacity = '0';
            dropdownMenu.style.visibility = 'hidden';
            dropdownMenu.style.transform = 'translateY(-10px)';
        } else {
            dropdownMenu.style.opacity = '1';
            dropdownMenu.style.visibility = 'visible';
            dropdownMenu.style.transform = 'translateY(0)';
        }
    });
}

document.addEventListener('DOMContentLoaded', ultimateDropdownFix);

function initFilters() {
    const filtersToggle = document.querySelector('.filters-toggle');
    const filtersContent = document.querySelector('.filters-content');
    
    if (!filtersToggle || !filtersContent) {
        console.log('Фильтры не найдены на этой странице');
        return;
    }
    
    console.log('Инициализация фильтров');
    
    // Устанавливаем стили для выезжающего окна слева
    filtersContent.style.cssText = `
        position: fixed;
        top: 70px;
        left: -400px;
        width: 350px;
        height: calc(100vh - 80px);
        background: #3E2723;
        border-radius: 0 12px 12px 0;
        padding: 15px;
        box-shadow: 0 0 30px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        opacity: 0;
        z-index: 999;
        display: flex;
        flex-direction: column;
    `;
    
    // Создаем overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 998;
    `;
    overlay.className = 'filters-overlay';
    document.body.appendChild(overlay);
    
    // Обработчик клика по кнопке фильтров
    filtersToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Клик по фильтрам!');
        
        const isActive = filtersContent.style.left === '0px';
        
        if (isActive) {
            // Закрываем
            filtersContent.style.left = '-400px';
            filtersContent.style.opacity = '0';
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            filtersToggle.classList.remove('active');
        } else {
            // Открываем
            filtersContent.style.left = '0';
            filtersContent.style.opacity = '1';
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';
            filtersToggle.classList.add('active');
            
            // Инициализируем ползунок при открытии
            initDualRangeSlider();
        }
    });
    
    // Закрытие по клику на overlay
    overlay.addEventListener('click', function() {
        filtersContent.style.left = '-400px';
        filtersContent.style.opacity = '0';
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        filtersToggle.classList.remove('active');
    });
    
    // Кнопка "Применить"
    const applyBtn = document.querySelector('.apply-filters');
    if (applyBtn) {
        applyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Применить фильтры');
            applyFilters();
            
            // Закрываем после применения
            filtersContent.style.left = '-400px';
            filtersContent.style.opacity = '0';
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            filtersToggle.classList.remove('active');
        });
    }
    
    // Кнопка "Сбросить"
    const resetBtn = document.querySelector('.reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Сбросить фильтры');
            resetFilters();
        });
    }
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && filtersContent.style.left === '0px') {
            filtersContent.style.left = '-400px';
            filtersContent.style.opacity = '0';
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            filtersToggle.classList.remove('active');
        }
    });
}

async function applyFilters() {
    console.log('applyFilters called');
    
    // Собираем параметры фильтрации
    const params = new URLSearchParams();
    
    // Цена
    const minSlider = document.getElementById('minSlider');
    const maxSlider = document.getElementById('maxSlider');
    
    if (minSlider && maxSlider) {
        params.append('minPrice', minSlider.value);
        params.append('maxPrice', maxSlider.value);
    }
    
    // Рейтинг
    const selectedRatings = Array.from(document.querySelectorAll('input[name="rating"]:checked'))
        .map(input => parseInt(input.value));
    
    if (selectedRatings.length > 0) {
        // Берем минимальный выбранный рейтинг
        params.append('minRating', Math.min(...selectedRatings));
        params.append('maxRating', 5);
    }
    
    // Размер
    const selectedSizes = Array.from(document.querySelectorAll('input[name="size"]:checked'))
        .map(input => input.value);
    
    if (selectedSizes.length > 0) {
        // Для простоты берем первый выбранный размер
        params.append('size', selectedSizes[0]);
    }
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/catalog/filter?${params}`);
        const products = await response.json();
        currentProducts = products;
        displayProducts(products);
    } catch (error) {
        console.error('Ошибка применения фильтров:', error);
        showError('Не удалось применить фильтры');
    } finally {
        hideLoading();
    }
}

async function resetFilters() {
    console.log('resetFilters called');
    
    // Сбрасываем ползунки цены
    const minSlider = document.getElementById('minSlider');
    const maxSlider = document.getElementById('maxSlider');
    
    if (minSlider && maxSlider) {
        minSlider.value = 0;
        maxSlider.value = 500;
        
        const event = new Event('input', { bubbles: true });
        minSlider.dispatchEvent(event);
    }
    
    // Снимаем все чекбоксы
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Загружаем все продукты
    await loadAllProducts();
}

function initScrollToTop() {
    if (!document.getElementById('scrollToTop')) {
        const scrollBtn = document.createElement('button');
        scrollBtn.id = 'scrollToTop';
        scrollBtn.innerHTML = '↑';
        scrollBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #8B4513;
            color: white;
            border: none;
            padding: 15px;
            border-radius: 50%;
            cursor: pointer;
            display: none;
            z-index: 1000;
            font-size: 18px;
            width: 50px;
            height: 50px;
            transition: all 0.3s ease;
            opacity: 0;
            transform: scale(0.8);
        `;
        document.body.appendChild(scrollBtn);
        
        window.addEventListener('scroll', function() {
            const scrollBtn = document.getElementById('scrollToTop');
            if (window.scrollY > 300) {
                scrollBtn.style.display = 'block';
                setTimeout(() => {
                    scrollBtn.style.opacity = '1';
                    scrollBtn.style.transform = 'scale(1)';
                }, 10);
            } else {
                scrollBtn.style.opacity = '0';
                scrollBtn.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    scrollBtn.style.display = 'none';
                }, 300);
            }
        });
        
        scrollBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        scrollBtn.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#6b3300';
            this.style.transform = 'scale(1.1)';
        });
        
        scrollBtn.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#8B4513';
            this.style.transform = 'scale(1)';
        });
    }
}

function initActiveMenuHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    if (sections.length > 0 && navLinks.length > 0) {
        window.addEventListener('scroll', function() {
            let current = '';
            const headerHeight = document.querySelector('header')?.offsetHeight || 0;
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop - headerHeight - 100;
                const sectionHeight = section.clientHeight;
                if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                if (href === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }
}

function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.product-card, .promotion-item, .about-content');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

function initForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        if (form.id === 'reviewForm') {
            return;
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Форма отправлена');
            alert('Спасибо! Ваше сообщение отправлено.');
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
} else {
    initAll();
}

const AppUtils = {
    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    },
    
    isMobile() {
        return window.innerWidth <= 768;
    },
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

function ultimateFiltersFix() {
    const filtersToggle = document.querySelector('.filters-toggle');
    const filtersContent = document.querySelector('.filters-content');
    
    if (!filtersToggle || !filtersContent) {
        console.log('Фильтры не найдены на этой странице');
        return;
    }
    
    console.log('Инициализация фильтров');
    
    // Устанавливаем начальные стили (только для анимации)
    filtersContent.style.cssText = `
        border-radius: 12px;
        margin-top: 15px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        max-height: 0;
        overflow: hidden;
        transition: all 0.3s ease;
        opacity: 0;
        position: relative;
        z-index: 1000;
        padding: 0;
    `;
    
    // Удаляем предыдущий обработчик, если был
    filtersToggle.removeEventListener('click', toggleFilters);
    
    // Добавляем обработчик
    filtersToggle.addEventListener('click', toggleFilters);
    
    function toggleFilters(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isActive = filtersContent.style.maxHeight !== '0px' && filtersContent.style.maxHeight !== '0';
        
        filtersContent.style.maxHeight = '1000px';
        filtersContent.style.opacity = '1';
        filtersContent.style.padding = '25px';
        filtersToggle.classList.add('active');
        filtersToggle.innerHTML = 'Фильтры';
            
        // Инициализируем ползунок, если он есть
        setTimeout(() => {
            if (document.getElementById('minSlider') && document.getElementById('maxSlider')) {
                initDualRangeSlider();
            }
        }, 100);
    }
    
    // Обработчики для кнопок (они должны существовать в HTML)
    const applyBtn = document.querySelector('.apply-filters');
    if (applyBtn) {
        applyBtn.removeEventListener('click', handleApply);
        applyBtn.addEventListener('click', handleApply);
    }
    
    const resetBtn = document.querySelector('.reset-filters');
    if (resetBtn) {
        resetBtn.removeEventListener('click', handleReset);
        resetBtn.addEventListener('click', handleReset);
    }
    
    function handleApply(e) {
        e.preventDefault();
        console.log('Применить фильтры');
        applyFilters();
        
        // Закрываем после применения
        filtersContent.style.maxHeight = '0';
        filtersContent.style.opacity = '0';
        filtersContent.style.padding = '0';
        filtersToggle.classList.remove('active');
        filtersToggle.innerHTML = 'Фильтры';
    }
    
    function handleReset(e) {
        e.preventDefault();
        console.log('Сбросить фильтры');
        resetFilters();
    }
    
    // Инициализируем ползунок при загрузке (если фильтры открыты по умолчанию)
    setTimeout(() => {
        if (document.getElementById('minSlider') && document.getElementById('maxSlider')) {
            initDualRangeSlider();
        }
    }, 500);
}

function initFavorites() {
}

function initAll() {
    initSmoothScroll();
    initCatalogDropdown();
    
    loadAllProducts();
    loadFilterCriteria();
    
    if (document.querySelector('.filters-section')) {
        initFilters();
    }
    initScrollToTop();
    initActiveMenuHighlight();
    initScrollAnimations();
    initForms();
    initFavorites();
    initCarousel();
    initSearch();
    initProductTooltips();
}

// Загрузка всех продуктов
async function loadAllProducts() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/catalog`);
        const products = await response.json();
        currentProducts = products;
        displayProducts(products);
    } catch (error) {
        console.error('Ошибка загрузки продуктов:', error);
        showError('Не удалось загрузить продукты');
    } finally {
        hideLoading();
    }
}

// Загрузка критериев фильтрации
async function loadFilterCriteria() {
    try {
        const response = await fetch(`${API_BASE_URL}/catalog/filter/criteria`);
        const criteria = await response.json();
        
        // Обновляем UI с полученными критериями
        updateFilterUI(criteria);
    } catch (error) {
        console.error('Ошибка загрузки критериев:', error);
    }
}

// Отображение продуктов
function displayProducts(products) {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="no-products">Товары не найдены</div>';
        return;
    }
    
    let html = '';
    products.forEach(product => {
        // Кодируем название для использования в URL
        const encodedName = encodeURIComponent(product.name);
        
        html += `
            <div class="product-item" data-id="${product.id}" data-price="${product.cost}" data-rating="${product.stars || 0}" data-size="${getSizeFromSizes(product.sizes)}">
                <div class="product-card" style="background: url('${product.photo}') no-repeat center center; background-size: cover;">
                </div>
                <div class="product-info">
                    <a href="http://coffee-frontend-uckkvg-dde3a2-45-131-214-123.traefik.me/product/${encodedName}" class="product-name-link">
                        <p class="product-name">${product.name}</p>
                    </a>
                    <p class="product-description">${product.description || ''}</p>
                    <p class="product-price">${product.cost}₽</p>
                </div>
            </div>
        `;
    });
    
    productsGrid.innerHTML = html;
    
    // Переинициализируем тултипы для новых продуктов
    initProductTooltips();
}

// Вспомогательная функция для определения размера из строки sizes
function getSizeFromSizes(sizes) {
    if (!sizes) return 'medium';
    if (sizes.includes('S') || sizes.includes('small')) return 'small';
    if (sizes.includes('L') || sizes.includes('large')) return 'large';
    return 'medium';
}

// Обновление UI фильтров
function updateFilterUI(criteria) {
    // Обновляем ценовой диапазон
    const minSlider = document.getElementById('minSlider');
    const maxSlider = document.getElementById('maxSlider');
    
    if (minSlider && maxSlider && criteria.priceRange) {
        minSlider.min = criteria.priceRange.Min;
        minSlider.max = criteria.priceRange.Max;
        maxSlider.min = criteria.priceRange.Min;
        maxSlider.max = criteria.priceRange.Max;
        
        minSlider.value = criteria.priceRange.Min;
        maxSlider.value = criteria.priceRange.Max;
        
        // Обновляем отображение
        const minValue = document.querySelector('.min-value');
        const maxValue = document.querySelector('.max-value');
        if (minValue) minValue.textContent = criteria.priceRange.Min + '₽';
        if (maxValue) maxValue.textContent = criteria.priceRange.Max + '₽';
        
        initDualRangeSlider();
    }
    
    // Обновляем размеры
    const sizeFilter = document.querySelector('.size-filter');
    if (sizeFilter && criteria.sizes) {
        sizeFilter.innerHTML = '';
        criteria.sizes.forEach(size => {
            const sizeClass = size === 'S' ? 'small' : (size === 'M' ? 'medium' : 'large');
            sizeFilter.innerHTML += `
                <label class="size-option">
                    <input type="checkbox" name="size" value="${size}">
                    <span class="size-badge ${sizeClass}">${size}</span> ${getSizeName(size)}
                </label>
            `;
        });
    }
}

function initProductTooltips() {
    const tooltip = document.getElementById('productTooltip');
    if (!tooltip) return;
    
    const productItems = document.querySelectorAll('.product-item');
    let hideTimeout;
    let currentProduct = null;
    let abortController = null;
    
    productItems.forEach(item => {
        const productCard = item.querySelector('.product-card');
        const productName = item.querySelector('.product-name')?.textContent;
        
        if (!productCard || !productName) return;
        
        productCard.addEventListener('mouseenter', function(e) {
            if (hideTimeout) clearTimeout(hideTimeout);
            
            if (abortController) {
                abortController.abort();
            }
            
            setTimeout(() => {
                if (!currentProduct) {
                    fetchProductInfo(e, productName);
                }
            }, 300);
        });
        
        productCard.addEventListener('mousemove', function(e) {
            if (currentProduct === productName) {
                updateTooltipPosition(e);
            }
        });
        
        productCard.addEventListener('mouseleave', function() {
            hideTooltipWithDelay();
            
            if (abortController) {
                abortController.abort();
                abortController = null;
            }
        });
        
        tooltip.addEventListener('mouseenter', function() {
            if (hideTimeout) clearTimeout(hideTimeout);
        });
        
        tooltip.addEventListener('mouseleave', function() {
            hideTooltipWithDelay();
        });
    });
    
    function fetchProductInfo(event, productName) {
        abortController = new AbortController();
        
        const encodedName = encodeURIComponent(productName);
        
        fetch(`http://coffee-frontend-uckkvg-dde3a2-45-131-214-123.traefik.me/product/${encodedName}`, {
            signal: abortController.signal,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (currentProduct === productName || !hideTimeout) {
                showTooltipWithData(event, productName, data);
            }
            abortController = null;
        })
        .catch(error => {
            if (error.name === 'AbortError') {
                console.log('Запрос отменен');
            } else {
                console.error('Ошибка при загрузке данных о продукте:', error);
                hideTooltipWithDelay();
            }
            abortController = null;
        });
    }
    
    function showTooltipWithData(event, productName, data) {
        if (!tooltip) return;
        
        updateTooltipContent(productName, data);
        positionTooltip(event);
        
        tooltip.classList.add('visible');
        currentProduct = productName;
        
        tooltip.style.animation = 'none';
        tooltip.offsetHeight;
        tooltip.style.animation = 'tooltipPulse 0.3s ease';
    }
    
    function positionTooltip(event) {
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        let left = rect.right + 10 + scrollLeft;
        let top = rect.top + scrollTop - 20;
        
        if (left + tooltipRect.width > window.innerWidth) {
            left = rect.left - tooltipRect.width - 10 + scrollLeft;
        }
        
        if (top < scrollTop + 10) {
            top = rect.bottom + scrollTop + 10;
        }
        
        if (top + tooltipRect.height > window.innerHeight + scrollTop) {
            top = rect.top + scrollTop - tooltipRect.height - 10;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }
    
    function updateTooltipPosition(event) {
        if (!tooltip.classList.contains('visible')) return;
        positionTooltip(event);
    }
    
    function updateTooltipContent(productName, data) {
        document.getElementById('tooltipName').textContent = productName;
        
        const starsContainer = document.querySelector('#tooltipRating .stars-container');
        const ratingNumber = document.querySelector('#tooltipRating .rating-number');
        
        if (starsContainer && data.rating !== undefined) {
            const fullStars = Math.floor(data.rating);
            const hasHalfStar = data.rating % 1 >= 0.5;
            
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= fullStars) {
                    starsHtml += '<span class="star filled">★</span>';
                } else if (i === fullStars + 1 && hasHalfStar) {
                    starsHtml += '<span class="star half">★</span>';
                } else {
                    starsHtml += '<span class="star">☆</span>';
                }
            }
            starsContainer.innerHTML = starsHtml;
        }
        
        if (ratingNumber) {
            ratingNumber.textContent = `(${data.rating || '?'})`;
        }
        
        const sizesContainer = document.querySelector('#tooltipSizes .sizes-container');
        if (sizesContainer && data.sizes) {
            let sizesHtml = '';
            data.sizes.forEach(size => {
                const sizeClass = size === 'S' ? 'small' : (size === 'M' ? 'medium' : 'large');
                sizesHtml += `<span class="size-badge-tooltip ${sizeClass}">${size}</span>`;
            });
            sizesContainer.innerHTML = sizesHtml;
        }
        
        const ingredientsList = document.querySelector('#tooltipIngredients .ingredients-list');
        if (ingredientsList && data.ingredients) {
            let ingredientsHtml = '';
            data.ingredients.forEach(ingredient => {
                ingredientsHtml += `<li>${ingredient}</li>`;
            });
            ingredientsList.innerHTML = ingredientsHtml;
        }
    }
    
    function hideTooltipWithDelay() {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            tooltip.classList.remove('visible');
            currentProduct = null;
        }, 200);
    }
}

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || 
                                Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchButton || !searchResults) return;
    
    let selectedIndex = -1;
    let searchTimeout;
    let abortController = null;
    
    async function fetchSuggestions(query) {
        if (!query.trim() || query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }
        
        if (abortController) {
            abortController.abort();
        }
        
        abortController = new AbortController();
        
        try {
            const response = await fetch(`${API_BASE_URL}/catalog/suggest?query=${encodeURIComponent(query)}`, {
                signal: abortController.signal
            });
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки подсказок');
            }
            
            const suggestions = await response.json();
            showSuggestions(suggestions, query);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Запрос отменен');
            } else {
                console.error('Ошибка поиска:', error);
            }
        }
    }
    
    function showSuggestions(suggestions, query) {
        searchResults.innerHTML = '';
        selectedIndex = -1;
        
        if (suggestions.length === 0) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-search-results';
            noResultsDiv.textContent = 'Ничего не найдено';
            searchResults.appendChild(noResultsDiv);
            searchResults.classList.add('active');
            return;
        }
        
        suggestions.forEach((item, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.setAttribute('data-index', index);
            resultItem.setAttribute('data-id', item.id);
            
            let icon = '☕';
            const name = item.name.toLowerCase();
            if (name.includes('чай') || name.includes('tea')) icon = '🍵';
            if (name.includes('десерт') || name.includes('торт') || name.includes('пирож')) icon = '🍰';
            
            const highlightedName = highlightMatch(item.name, query);
            
            resultItem.innerHTML = `
                <span class="result-icon">${icon}</span>
                <div class="result-info">
                    <div class="result-name">${highlightedName}</div>
                </div>
            `;
            
            resultItem.addEventListener('click', () => {
                selectSuggestion(item);
            });
            
            resultItem.addEventListener('mouseenter', () => {
                removeSelectedHighlight();
                resultItem.classList.add('selected');
                selectedIndex = index;
            });
            
            searchResults.appendChild(resultItem);
        });
        
        searchResults.classList.add('active');
    }
    
    function selectSuggestion(item) {
        searchInput.value = item.name;
        hideResults();
        filterByProduct(item);
    }
    
    async function filterByProduct(product) {
        try {
            showLoading();
            const response = await fetch(`${API_BASE_URL}/catalog/search?query=${encodeURIComponent(product.name)}`);
            const products = await response.json();
            displayProducts(products);
            showNotification(`Найден товар: ${product.name}`);
        } catch (error) {
            console.error('Ошибка фильтрации:', error);
        } finally {
            hideLoading();
        }
    }
    
    async function performFullSearch(query) {
        if (!query.trim()) {
            loadAllProducts();
            return;
        }
        
        try {
            showLoading();
            const response = await fetch(`${API_BASE_URL}/catalog/search?query=${encodeURIComponent(query)}`);
            const products = await response.json();
            displayProducts(products);
            
            if (products.length > 0) {
                showNotification(`Найдено товаров: ${products.length}`);
            } else {
                showNotification('Ничего не найдено');
            }
        } catch (error) {
            console.error('Ошибка поиска:', error);
            showError('Ошибка при выполнении поиска');
        } finally {
            hideLoading();
        }
    }
    
    function highlightMatch(text, query) {
        if (!query.trim()) return text;
        
        const searchTerm = query.toLowerCase().trim();
        const textLower = text.toLowerCase();
        
        if (textLower.startsWith(searchTerm)) {
            const startPart = text.substring(0, searchTerm.length);
            const endPart = text.substring(searchTerm.length);
            return `<span class="search-highlight">${startPart}</span>${endPart}`;
        }
        
        const index = textLower.indexOf(searchTerm);
        if (index !== -1) {
            const before = text.substring(0, index);
            const match = text.substring(index, index + searchTerm.length);
            const after = text.substring(index + searchTerm.length);
            return `${before}<span class="search-highlight">${match}</span>${after}`;
        }
        
        return text;
    }
    
    function hideResults() {
        searchResults.classList.remove('active');
        selectedIndex = -1;
    }
    
    function removeSelectedHighlight() {
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.classList.remove('selected');
        });
    }
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        
        const query = this.value;
        
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                fetchSuggestions(query);
            }, 300);
        } else {
            hideResults();
        }
    });
    
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            if (selectedIndex >= 0) {
                const selectedItem = document.querySelector(`.search-result-item[data-index="${selectedIndex}"]`);
                if (selectedItem) {
                    const productId = selectedItem.dataset.id;
                }
            } else {
                performFullSearch(this.value);
                hideResults();
            }
        }
    });
    
    searchInput.addEventListener('keydown', function(e) {
        const items = document.querySelectorAll('.search-result-item');
        
        if (items.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
            updateSelection(items);
        }
    });
    
    function updateSelection(items) {
        removeSelectedHighlight();
        items[selectedIndex].classList.add('selected');
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
        
        const selectedName = items[selectedIndex].querySelector('.result-name').textContent;
        searchInput.value = selectedName;
    }
    
    searchButton.addEventListener('click', function() {
        if (searchInput.value.trim()) {
            performFullSearch(searchInput.value);
            hideResults();
        } else {
            loadAllProducts();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            hideResults();
        }
    });
    
    const resetFiltersBtn = document.querySelector('.reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            searchInput.value = '';
            hideResults();
            loadAllProducts();
        });
    }
}

function initDualRangeSlider() {
    const minSlider = document.getElementById('minSlider');
    const maxSlider = document.getElementById('maxSlider');
    const minValue = document.querySelector('.min-value');
    const maxValue = document.querySelector('.max-value');
    const track = document.querySelector('.slider-track');
    
    if (!minSlider || !maxSlider || !minValue || !maxValue || !track) return;
    
    const min = 0;
    const max = 1000;
    
    minSlider.value = 0;
    maxSlider.value = 500;
    
    function updateSlider() {
        let minVal = parseInt(minSlider.value);
        let maxVal = parseInt(maxSlider.value);
        
        if (minVal > maxVal) {
            minSlider.value = maxVal;
            minVal = maxVal;
        }
        
        minValue.textContent = minVal + '₽';
        maxValue.textContent = maxVal + '₽';
        
        const percentMin = (minVal / max) * 100;
        const percentMax = (maxVal / max) * 100;
        
        track.style.background = `linear-gradient(to right, 
            #F0D8B8 0%, 
            #F0D8B8 ${percentMin}%, 
            #8B4513 ${percentMin}%, 
            #8B4513 ${percentMax}%, 
            #F0D8B8 ${percentMax}%, 
            #F0D8B8 100%)`;
    }
    
    minSlider.addEventListener('input', function() {
        let minVal = parseInt(this.value);
        let maxVal = parseInt(maxSlider.value);
        
        if (minVal > maxVal) {
            this.value = maxVal;
        }
        
        updateSlider();
    });
    
    maxSlider.addEventListener('input', function() {
        let maxVal = parseInt(this.value);
        let minVal = parseInt(minSlider.value);
        
        if (maxVal < minVal) {
            this.value = minVal;
        }
        
        updateSlider();
    });
    
    updateSlider();
}

// Вспомогательные функции
function showLoading() {
    const existingLoader = document.getElementById('global-loader');
    if (existingLoader) existingLoader.remove();
    
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.id = 'global-loader';
    loader.innerHTML = 'Загрузка...';
    loader.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 15px 30px;
        border-radius: 8px;
        z-index: 9999;
        font-family: 'Roboto', sans-serif;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.remove();
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 9999;
        font-family: 'Roboto', sans-serif;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #8B4513;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        font-family: 'Roboto', sans-serif;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

function getSizeName(size) {
    const names = {
        'S': 'Маленький',
        'M': 'Средний',
        'L': 'Большой'
    };
    return names[size] || size;
}

// Добавляем стили
(function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translate(-50%, 20px);
            }
            to {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }
        
        @keyframes slideDown {
            from {
                opacity: 1;
                transform: translate(-50%, 0);
            }
            to {
                opacity: 0;
                transform: translate(-50%, 20px);
            }
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
        
        @keyframes tooltipPulse {
            0% { transform: scale(0.95); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        .hidden {
            display: none !important;
        }
        
        .no-products {
            text-align: center;
            padding: 50px;
            font-size: 18px;
            color: #666;
            grid-column: 1 / -1;
            font-family: 'Roboto', sans-serif;
        }
        
        .product-tooltip {
            position: absolute;
            background: white;
            border-radius: 12px;
            box-shadow: 0 5px 30px rgba(0,0,0,0.2);
            padding: 15px;
            max-width: 300px;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease;
            pointer-events: none;
            border: 1px solid #F0D8B8;
        }
        
        .product-tooltip.visible {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
        }
        
        .tooltip-content {
            font-family: 'Roboto', sans-serif;
        }
        
        .tooltip-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #F0D8B8;
        }
        
        .tooltip-name {
            font-weight: bold;
            color: #3E2723;
            font-size: 16px;
        }
        
        .tooltip-rating {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .stars-container {
            display: flex;
            gap: 2px;
        }
        
        .star {
            color: #ddd;
            font-size: 16px;
        }
        
        .star.filled {
            color: #FFD700;
        }
        
        .star.half {
            color: #FFD700;
            position: relative;
        }
        
        .rating-number {
            color: #666;
            font-size: 14px;
        }
        
        .tooltip-sizes, .tooltip-ingredients {
            margin-top: 10px;
        }
        
        .tooltip-label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .sizes-container {
            display: flex;
            gap: 8px;
        }
        
        .size-badge-tooltip {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .size-badge-tooltip.small {
            background: #E8F5E9;
            color: #2E7D32;
        }
        
        .size-badge-tooltip.medium {
            background: #FFF3E0;
            color: #F57C00;
        }
        
        .size-badge-tooltip.large {
            background: #FFEBEE;
            color: #C62828;
        }
        
        .ingredients-list {
            list-style: none;
            padding: 0;
            margin: 5px 0 0 0;
        }
        
        .ingredients-list li {
            font-size: 13px;
            color: #555;
            padding: 2px 0;
        }
        
        .ingredients-list li:before {
            content: "•";
            color: #8B4513;
            font-weight: bold;
            margin-right: 5px;
        }
        
        .search-highlight {
            background-color: #8B4513;
            color: white;
            padding: 2px 4px;
            border-radius: 4px;
        }
        
        .search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #F0D8B8;
            border-radius: 8px;
            margin-top: 5px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            display: none;
        }
        
        .search-results.active {
            display: block;
        }
        
        .search-result-item {
            display: flex;
            align-items: center;
            padding: 10px;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        
        .search-result-item:hover,
        .search-result-item.selected {
            background: #FFF8E1;
        }
        
        .result-icon {
            font-size: 24px;
            margin-right: 10px;
        }
        
        .result-info {
            flex: 1;
        }
        
        .result-name {
            font-weight: 500;
            color: #3E2723;
        }
        
        .result-category {
            font-size: 11px;
            color: #999;
        }
        
        .no-search-results {
            padding: 20px;
            text-align: center;
            color: #999;
        }
    `;
    document.head.appendChild(style);
})();