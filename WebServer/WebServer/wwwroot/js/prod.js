document.addEventListener('DOMContentLoaded', function () {
    // Получаем catalogId из данных страницы
    window.productCatalogId = null;

    // Сначала загружаем данные продукта, затем инициализируем страницу
    loadProductData().then(() => {
        initProductPage();
        initFavoriteButton();
        initImageZoom();
    }).catch(error => {
        console.error('Ошибка загрузки данных продукта:', error);
        // В случае ошибки все равно инициализируем страницу
        initProductPage();
        initFavoriteButton();
        initImageZoom();
    });
});

// Функция для загрузки данных продукта из бэкенда
async function loadProductData() {
    try {
        // Получаем имя продукта из URL
        const pathParts = window.location.pathname.split('/');
        const productName = pathParts[pathParts.length - 1];

        if (!productName) {
            console.warn('Имя продукта не найдено в URL');
            return;
        }

        console.log('Загрузка продукта:', productName);

        // Используем правильный эндпоинт для получения данных
        const response = await fetch(`/api/catalog/short/info?name=${encodeURIComponent(productName)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
      

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Продукт с именем "${productName}" не найден`);
                return;
            }
            throw new Error(`Ошибка загрузки продукта: ${response.status}`);
        }

        const productData = await response.json();
        console.log('Данные продукта из API:', productData);

        // Сохраняем ID в глобальную переменную
        window.productCatalogId = productData.id;
        window.productId = productData.id;

        // Сохраняем полные данные продукта
        window.productData = productData;

        // Обновляем страницу
        updateProductPageWithData(productData);

        return productData;
    } catch (error) {
        console.error('Ошибка при загрузке данных продукта:', error);
        throw error;
    }
}

// Функция для обновления страницы данными из бэкенда
function updateProductPageWithData(productData) {
    // Обновляем заголовок страницы
    const titleElement = document.querySelector('.product-title');
    if (titleElement && productData.name) {
        titleElement.textContent = productData.name;
        document.title = `${productData.name} - Кофейня`;
    }

    // Обновляем описание - если есть description, используем его
    const descriptionElement = document.querySelector('.product-description');
    if (descriptionElement && productData.description) {
        descriptionElement.textContent = productData.description;
    }

    // Обновляем цену (для первого размера или базовую цену)
    const priceElement = document.querySelector('.current-price');
    if (priceElement && productData.sizes && productData.sizes.length > 0) {
        // Используем цену первого размера или базовую стоимость
        const firstSizePrice = productData.sizes[0].price || productData.cost;
        priceElement.textContent = `${firstSizePrice} ₽`;
    } else if (priceElement && productData.cost) {
        priceElement.textContent = `${productData.cost} ₽`;
    }

    // Обновляем ингредиенты (ingredients из ответа)
    const ingredientsElement = document.querySelector('.ingredients-content');
    if (ingredientsElement && productData.ingredients) {
        // ingredients приходит как массив из Utils.ParseStringToArray
        if (Array.isArray(productData.ingredients)) {
            ingredientsElement.innerHTML = `<p>${productData.ingredients.join(', ')}</p>`;
        } else {
            ingredientsElement.innerHTML = `<p>${productData.ingredients}</p>`;
        }
    }

    // Обновляем изображение (если есть photo в ответе)
    const mainImage = document.getElementById('mainProductImage');
    if (mainImage && productData.photo) {
        mainImage.src = productData.photo;
        mainImage.alt = productData.name;
    }

    // Обновляем рейтинг (rating из ответа)
    const starsElement = document.querySelector('.product-rating');
    if (starsElement && productData.rating) {
        const fullStars = Math.floor(productData.rating);
        const hasHalfStar = productData.rating % 1 >= 0.5;

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHtml += '<span class="star filled">★</span>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                starsHtml += '<span class="star half">½</span>';
            } else {
                starsHtml += '<span class="star">☆</span>';
            }
        }
        starsElement.innerHTML = starsHtml;
    }

    // Обновляем размеры, если они есть
    if (productData.sizes) {
        updateSizeOptions(productData.sizes, productData.cost);
    }
}

// Функция для обновления опций размеров
function updateSizeOptions(sizesArray, baseCost) {
    const sizeOptionsContainer = document.querySelector('.size-options');
    if (!sizeOptionsContainer) return;

    try {
        // sizes уже приходит как массив из ShortInfoItem
        const sizes = Array.isArray(sizesArray) ? sizesArray : [];

        if (sizes.length > 0) {
            let sizesHtml = '';
            sizes.forEach((size, index) => {
                const isActive = index === 0 ? 'active' : '';
                // Если size это строка, используем базовую цену
                // Если size это объект с name и price, используем price
                const sizeName = typeof size === 'string' ? size : size.name;
                const sizePrice = (typeof size === 'object' && size.price) ? size.price : baseCost;

                sizesHtml += `
                    <div class="size-option ${isActive}" data-size="${sizeName}" data-price="${sizePrice}">
                        <input type="radio" name="size" value="${sizeName}" id="size-${sizeName}" ${index === 0 ? 'checked' : ''}>
                        <label for="size-${sizeName}">
                            <span class="size-name">${sizeName}</span>
                            <span class="size-price">${sizePrice} ₽</span>
                        </label>
                    </div>
                `;
            });
            sizeOptionsContainer.innerHTML = sizesHtml;

            // Переинициализируем обработчики размеров
            initSizeSelection();
        }
    } catch (error) {
        console.error('Ошибка при обработке размеров:', error);
    }
}

function initProductPage() {
    initImageGallery();
    initSizeSelection();
    initQuantitySelector();
    initTabs();
    initAddToCart();
    initReviews();
}

function initImageZoom() {
    const mainImage = document.getElementById('mainProductImage');

    if (!mainImage) return;
    if (!document.getElementById('imageModal')) {
        const modalHTML = `
            <div class="image-modal" id="imageModal">
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <img src="" alt="" id="modalImage">
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        if (!document.querySelector('#modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .image-modal {
                    display: none;
                    position: fixed;
                    z-index: 10000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.9);
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .modal-content {
                    position: relative;
                    margin: auto;
                    width: 90%;
                    max-width: 800px;
                    height: 90vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    top: 50%;
                    transform: translateY(-50%);
                }
                
                .modal-content img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    border-radius: 10px;
                    box-shadow: 0 5px 25px rgba(0,0,0,0.5);
                    transition: transform 0.3s ease;
                }
                
                .close-modal {
                    position: absolute;
                    top: -40px;
                    right: 0;
                    color: white;
                    font-size: 35px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: color 0.3s ease;
                    z-index: 10001;
                }
                
                .close-modal:hover {
                    color: #8B4513;
                }
                
                .main-image {
                    cursor: pointer;
                    transition: transform 0.3s ease;
                }
                
                .main-image:hover {
                    transform: scale(1.02);
                }
                
                .main-image img {
                    border-radius: 15px;
                    transition: all 0.3s ease;
                }
                
                .main-image:hover img {
                    box-shadow: 0 8px 25px rgba(139, 69, 19, 0.3);
                }
                
                @media (max-width: 768px) {
                    .modal-content {
                        width: 95%;
                        height: 80vh;
                    }
                    
                    .close-modal {
                        top: -50px;
                        right: -10px;
                        font-size: 30px;
                    }
                }
                
                @media (max-width: 480px) {
                    .modal-content {
                        width: 98%;
                        height: 70vh;
                    }
                    
                    .close-modal {
                        top: -60px;
                        right: -5px;
                        font-size: 25px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close-modal');

    mainImage.addEventListener('click', function () {
        modal.style.display = 'block';
        modalImage.src = this.src;
        modalImage.alt = this.alt;
        modalImage.style.transform = 'scale(1)';
        document.body.style.overflow = 'hidden';
    });

    closeModal.addEventListener('click', function () {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    modalImage.addEventListener('wheel', function (e) {
        e.preventDefault();
        const scale = e.deltaY > 0 ? 0.9 : 1.1;
        const currentScale = parseFloat(this.style.transform.replace('scale(', '').replace(')', '')) || 1;
        const newScale = Math.max(0.5, Math.min(3, currentScale * scale));

        this.style.transform = `scale(${newScale})`;
        this.style.transformOrigin = `${e.offsetX}px ${e.offsetY}px`;
    });

    modal.addEventListener('click', function () {
        if (modalImage.style.transform && modalImage.style.transform !== 'scale(1)') {
            modalImage.style.transform = 'scale(1)';
        }
    });
}

function initFavoriteButton() {
    const favoriteBtn = document.getElementById('addToFavorites');

    if (!favoriteBtn) return;

    const productId = window.productCatalogId || getCatalogId();
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const isInFavorites = favorites.some(item => item.id === productId);

    if (isInFavorites) {
        favoriteBtn.classList.add('added');
        favoriteBtn.querySelector('.favorite-text').textContent = 'В избранном';
    }

    favoriteBtn.addEventListener('click', function () {
        const productData = {
            id: productId,
            name: getProductName(),
            description: getProductDescription(),
            price: getProductPrice(),
            icon: getProductIcon(),
            image: getProductImage(),
            category: getProductCategory(),
            link: window.location.pathname
        };

        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const existingIndex = favorites.findIndex(item => item.id === productData.id);

        if (existingIndex > -1) {
            favorites.splice(existingIndex, 1);
            favoriteBtn.classList.remove('added');
            favoriteBtn.querySelector('.favorite-text').textContent = 'Добавить в избранное';
            showNotification('Товар удален из избранного');
        } else {
            favorites.push(productData);
            favoriteBtn.classList.add('added');
            favoriteBtn.querySelector('.favorite-text').textContent = 'В избранном';
            showNotification('Товар добавлен в избранное!');
        }

        localStorage.setItem('favorites', JSON.stringify(favorites));
    });
}

function initImageGallery() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.getElementById('mainProductImage');

    if (!thumbnails.length || !mainImage) return;

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function () {
            const imageSrc = this.getAttribute('data-image');
            const imageAlt = this.getAttribute('data-alt') || this.querySelector('img').alt;

            mainImage.src = imageSrc;
            mainImage.alt = imageAlt;

            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function initSizeSelection() {
    const sizeOptions = document.querySelectorAll('.size-option');

    if (!sizeOptions.length) return;

    sizeOptions.forEach(option => {
        option.addEventListener('click', function () {
            const price = this.getAttribute('data-price');
            const size = this.getAttribute('data-size');

            sizeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');

            const priceElement = document.querySelector('.current-price');
            if (priceElement) {
                priceElement.textContent = price + ' ₽';
            }

            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
            }
        });
    });
}

function initQuantitySelector() {
    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');
    const quantityDisplay = document.querySelector('.quantity');

    if (!minusBtn || !plusBtn || !quantityDisplay) return;

    let quantity = 1;

    minusBtn.addEventListener('click', function () {
        if (quantity > 1) {
            quantity--;
            quantityDisplay.textContent = quantity;
        }
    });

    plusBtn.addEventListener('click', function () {
        quantity++;
        quantityDisplay.textContent = quantity;
    });
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-content .tab-pane');

    if (!tabBtns.length || !tabPanes.length) return;

    if (!document.querySelector('#tab-styles')) {
        const style = document.createElement('style');
        style.id = 'tab-styles';
        style.textContent = `
            .tab-pane {
                display: none;
                animation: fadeIn 0.3s ease;
            }
            .tab-pane.active {
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === tabId) {
                    pane.classList.add('active');
                }
            });
        });
    });
}

function initAddToCart() {
    const addToCartBtn = document.querySelector('.add-to-cart-btn');

    if (!addToCartBtn) return;

    addToCartBtn.addEventListener('click', function () {
        const productName = document.querySelector('.product-title');
        const selectedSize = document.querySelector('.size-option.active');
        const price = document.querySelector('.current-price');
        const quantity = document.querySelector('.quantity');

        if (!productName || !selectedSize || !price || !quantity) {
            console.error('Не найдены необходимые элементы для добавления в корзину');
            return;
        }

        const productData = {
            id: (window.productCatalogId || getCatalogId()) + '_' + Date.now(),
            name: productName.textContent,
            size: selectedSize.getAttribute('data-size'),
            price: price.textContent,
            quantity: quantity.textContent,
            image: getProductImage(),
            icon: getProductIcon()
        };

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItemIndex = cart.findIndex(item =>
            item.name === productData.name && item.size === productData.size
        );

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity = parseInt(cart[existingItemIndex].quantity) + parseInt(productData.quantity);
        } else {
            cart.push(productData);
        }

        localStorage.setItem('cart', JSON.stringify(cart));

        showNotification(`Товар "${productData.name}" (${productData.size}) добавлен в корзину!`);

        console.log('Добавлено в корзину:', productData);
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #8B4513;
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-family: 'Roboto', sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ========== Функции для работы с продуктом ==========
function getCatalogId() {
    console.log('Попытка получить catalogId...');

    // 1. Проверяем глобальную переменную window.productId
    if (window.productId && !isNaN(window.productId)) {
        console.log('Найден window.productId:', window.productId);
        return window.productId;
    }

    // 2. Проверяем window.productCatalogId (для обратной совместимости)
    if (window.productCatalogId && !isNaN(window.productCatalogId)) {
        console.log('Найден window.productCatalogId:', window.productCatalogId);
        return window.productCatalogId;
    }

    // 3. Пытаемся получить из мета-тега
    const metaId = document.querySelector('meta[name="product-id"]');
    if (metaId && metaId.getAttribute('content')) {
        const id = parseInt(metaId.getAttribute('content'));
        if (!isNaN(id)) {
            console.log('Найден ID из мета-тега:', id);
            return id;
        }
    }

    // 4. Пытаемся получить из data-атрибута
    const productContainer = document.querySelector('.product-container');
    if (productContainer && productContainer.getAttribute('data-product-id')) {
        const id = parseInt(productContainer.getAttribute('data-product-id'));
        if (!isNaN(id)) {
            console.log('Найден ID из data-атрибута:', id);
            return id;
        }
    }

    // 5. Пытаемся получить из URL параметра
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('id');
    if (urlId && !isNaN(urlId)) {
        const id = parseInt(urlId);
        console.log('Найден ID из URL:', id);
        return id;
    }

    console.error('Не удалось найти catalogId ни в одном источнике');
    return null;
}

function getProductName() {
    const title = document.querySelector('.product-title');
    return title ? title.textContent : 'Кофе';
}

function getProductDescription() {
    const desc = document.querySelector('.product-description');
    return desc ? desc.textContent : '';
}

function getProductPrice() {
    const price = document.querySelector('.current-price');
    return price ? price.textContent : '0 ₽';
}

function getProductIcon() {
    return '☕';
}

function getProductImage() {
    const mainImage = document.getElementById('mainProductImage');
    if (mainImage && mainImage.src) {
        return mainImage.src.split('/').pop();
    }
    return 'default.jpg';
}

function getProductCategory() {
    return 'coffee';
}

// ========== Отзывы ==========
function initReviews() {
    const reviewsContainer = document.getElementById('reviewsContainer');
    const reviewsLoading = document.getElementById('reviewsLoading');
    const reviewForm = document.getElementById('reviewForm');

    if (!reviewsContainer || !reviewsLoading || !reviewForm) return;

    // Ждем загрузки catalogId или используем его если уже загружен
    const loadReviews = () => {
        const catalogId = getCatalogId();
        if (catalogId) {
            loadReviewsFromAPI(catalogId);
        } else {
            console.warn('catalogId не получен, отзывы не загружены');
            reviewsContainer.innerHTML = '<p class="error-message">Ошибка загрузки отзывов</p>';
        }
    };

    // Если catalogId уже загружен, сразу загружаем отзывы
    if (window.productCatalogId) {
        loadReviews();
    } else {
        // Иначе ждем загрузки данных продукта
        const checkInterval = setInterval(() => {
            if (window.productCatalogId) {
                clearInterval(checkInterval);
                loadReviews();
            }
        }, 100);

        // Таймаут на случай ошибки
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.productCatalogId) {
                console.error('Таймаут загрузки catalogId');
                reviewsContainer.innerHTML = '<p class="error-message">Ошибка загрузки отзывов</p>';
            }
        }, 5000);
    }

    // Инициализируем звезды рейтинга
    initRatingStars();

    // Обработка отправки формы
    reviewForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const nameInput = document.getElementById('reviewName');
        const textInput = document.getElementById('reviewText');
        const ratingInput = document.getElementById('reviewRating');

        const name = nameInput.value.trim();
        const text = textInput.value.trim();
        const stars = parseInt(ratingInput.value);
        const catalogId = getCatalogId();

        console.log('Проверка полей:', { name, text, stars, catalogId });

        // Валидация
        if (!name) {
            showNotification('Пожалуйста, введите ваше имя');
            nameInput.focus();
            return;
        }

        if (!text) {
            showNotification('Пожалуйста, напишите отзыв');
            textInput.focus();
            return;
        }

        if (stars === 0) {
            showNotification('Пожалуйста, поставьте оценку');
            return;
        }

        if (!catalogId) {
            showNotification('Ошибка: идентификатор продукта не найден');
            return;
        }

        // Показываем загрузку
        showLoading();

        try {
            const reviewData = {
                name: name,
                text: text,
                stars: stars,
                catalogId: catalogId
            };

            console.log('Отправляемые данные:', reviewData);

            // Отправляем POST запрос на /api/user
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Ошибка HTTP: ${response.status}`);
            }

            const result = await response.json();
            console.log('Ответ сервера:', result);

            // Очищаем форму
            reviewForm.reset();
            ratingInput.value = '0';

            // Сбрасываем звезды
            document.querySelectorAll('.rating-star').forEach(star => {
                star.classList.remove('active', 'filled');
                star.textContent = '☆';
            });

            showNotification('Спасибо! Ваш отзыв добавлен');

            // Перезагружаем отзывы
            await loadReviewsFromAPI(catalogId);

        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Ошибка при отправке отзыва: ' + error.message);
        } finally {
            hideLoading();
        }
    });

    async function loadReviewsFromAPI(catalogId) {
        showLoading();

        try {
            // Получаем отзывы с C# бэкенда по catalogId
            const response = await fetch(`/api/user/${catalogId}`);

            if (!response.ok) {
                throw new Error(`Ошибка загрузки: ${response.status}`);
            }

            const reviews = await response.json();
            console.log('Загруженные отзывы:', reviews);

            if (!reviews || reviews.length === 0) {
                reviewsContainer.innerHTML = '<p class="no-reviews">Пока нет отзывов. Будьте первым!</p>';
            } else {
                displayReviews(reviews);
            }

        } catch (error) {
            console.error('Ошибка при загрузке отзывов:', error);
            reviewsContainer.innerHTML = '<p class="error-message">Ошибка при загрузке отзывов. Пожалуйста, попробуйте позже.</p>';

            if (!document.querySelector('#error-styles')) {
                const style = document.createElement('style');
                style.id = 'error-styles';
                style.textContent = `
                    .error-message {
                        color: #e74c3c;
                        text-align: center;
                        padding: 30px;
                        font-size: 16px;
                        background: #fff5f5;
                        border-radius: 10px;
                        border: 1px solid #ffcdd2;
                    }
                    .no-reviews {
                        text-align: center;
                        padding: 30px;
                        color: #666;
                        font-size: 16px;
                        background: #f9f9f9;
                        border-radius: 10px;
                    }
                `;
                document.head.appendChild(style);
            }
        } finally {
            hideLoading();
        }
    }

    function showLoading() {
        if (reviewsLoading) {
            reviewsLoading.classList.add('active');
        }
        if (reviewsContainer) {
            reviewsContainer.style.opacity = '0.5';
            reviewsContainer.style.pointerEvents = 'none';
        }
    }

    function hideLoading() {
        if (reviewsLoading) {
            reviewsLoading.classList.remove('active');
        }
        if (reviewsContainer) {
            reviewsContainer.style.opacity = '1';
            reviewsContainer.style.pointerEvents = 'auto';
        }
    }

    function displayReviews(reviews) {
        if (!reviewsContainer) return;

        if (!reviews || reviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="no-reviews">Пока нет отзывов. Будьте первым!</p>';
            return;
        }

        let html = '';
        reviews.forEach(review => {
            if (!review) return;

            const name = review.userName || review.name || 'Аноним';
            const stars = review.stars || 0;
            const text = review.text || '';
            const date = review.date ? new Date(review.date) : new Date();
            const id = review.id || Math.random().toString(36).substr(2, 9);

            const formattedDate = formatDate(date);

            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                starsHtml += `<span class="star ${i <= stars ? 'filled' : ''}">★</span>`;
            }

            html += `
                <div class="review" data-id="${id}">
                    <div class="review-header">
                        <span class="review-author">${escapeHtml(name)}</span>
                        <span class="review-date">${formattedDate}</span>
                    </div>
                    <div class="review-rating">
                        ${starsHtml}
                    </div>
                    <p class="review-text">${escapeHtml(text)}</p>
                </div>
            `;
        });

        reviewsContainer.innerHTML = html;
    }

    function formatDate(date) {
        if (!date) return 'Дата не указана';

        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;

            if (isNaN(dateObj.getTime())) {
                return 'Дата не указана';
            }

            const day = dateObj.getDate().toString().padStart(2, '0');
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const year = dateObj.getFullYear();
            return `${day}.${month}.${year}`;
        } catch (e) {
            return 'Дата не указана';
        }
    }

    function initRatingStars() {
        const stars = document.querySelectorAll('.rating-star');
        const ratingInput = document.getElementById('reviewRating');

        if (!stars.length || !ratingInput) return;

        ratingInput.value = '0';

        stars.forEach(star => {
            star.addEventListener('mouseenter', function () {
                const rating = parseInt(this.dataset.rating);
                highlightStars(rating);
            });

            star.addEventListener('mouseleave', function () {
                const currentRating = parseInt(ratingInput.value);
                highlightStars(currentRating);
            });

            star.addEventListener('click', function () {
                const rating = parseInt(this.dataset.rating);

                ratingInput.value = rating;

                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.add('active', 'filled');
                        s.textContent = '★';
                    } else {
                        s.classList.remove('active', 'filled');
                        s.textContent = '☆';
                    }
                });

                console.log('Выбрана оценка:', rating);
            });
        });
    }

    function highlightStars(rating) {
        const stars = document.querySelectorAll('.rating-star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('filled');
                star.textContent = '★';
            } else {
                star.classList.remove('filled');
                if (!star.classList.contains('active')) {
                    star.textContent = '☆';
                }
            }
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Добавляем CSS для звезд рейтинга, если его нет
if (!document.querySelector('#review-styles')) {
    const style = document.createElement('style');
    style.id = 'review-styles';
    style.textContent = `
        .star {
            font-size: 20px;
            cursor: pointer;
            color: #ddd;
            transition: color 0.2s;
        }
        .star.filled, .star.active {
            color: #ffc107;
        }
        .star.half {
            color: #ffc107;
            position: relative;
        }
        .product-rating {
            display: flex;
            gap: 5px;
        }
    `;
    document.head.appendChild(style);
}