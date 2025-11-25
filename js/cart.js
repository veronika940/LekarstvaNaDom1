class Cart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.freeDeliveryThreshold = 999;
        this.deliveryCost = 199;
        this.init();
    }

    init() {
        this.renderCart();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Оформление заказа
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.checkout();
            });
        }

        // Очистка корзины
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                this.clearCart();
            });
        }

        // Обновление корзины при изменении localStorage
        window.addEventListener('storage', () => {
            this.cart = JSON.parse(localStorage.getItem('cart')) || [];
            this.renderCart();
        });
    }

    renderCart() {
        const emptyCart = document.getElementById('emptyCart');
        const cartContent = document.getElementById('cartContent');
        const cartItems = document.getElementById('cartItems');
        const itemsCount = document.getElementById('itemsCount');
        const itemsTotal = document.getElementById('itemsTotal');
        const deliveryCost = document.getElementById('deliveryCost');
        const totalAmount = document.getElementById('totalAmount');

        if (this.cart.length === 0) {
            if (emptyCart) emptyCart.style.display = 'block';
            if (cartContent) cartContent.style.display = 'none';
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        if (cartContent) cartContent.style.display = 'block';

        let total = 0;
        let itemsTotalCount = 0;

        cartItems.innerHTML = this.cart.map((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            itemsTotalCount += item.quantity;
            
            return `
                <div class="cart-item" style="animation-delay: ${index * 0.1}s">
                    <div class="item-image">
                     <img src="${item.image || this.getMedicineImage(item.category, item.name)}" 
                     alt="${item.name}" 
                     onerror="this.src='${this.getDefaultMedicineImage()}'">
                    </div>
                    <div class="item-details">
                        <h4 class="item-name">${item.name}</h4>
                        <p class="item-manufacturer">${item.manufacturer}</p>
                        <p class="item-category">${this.formatCategory(item.category)}</p>
                        <div class="item-stock ${item.stock < 10 ? 'low-stock' : ''}">
                            <i class="fas fa-${item.stock < 10 ? 'exclamation-triangle' : 'check'}"></i>
                            ${item.stock < 10 ? `Осталось мало: ${item.stock} шт.` : 'В наличии'}
                        </div>
                    </div>
                    <div class="item-controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="cart.updateQuantity('${item._id}', -1)" 
                                    ${item.quantity <= 1 ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" onclick="cart.updateQuantity('${item._id}', 1)"
                                    ${item.quantity >= item.stock ? 'disabled' : ''}>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div class="item-price">
                            <div class="price-total">${this.formatPrice(itemTotal)} ₽</div>
                            <div class="price-unit">${this.formatPrice(item.price)} ₽/шт</div>
                        </div>
                        <button class="btn-remove" onclick="cart.removeItem('${item._id}')" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Расчет доставки
        const isFreeDelivery = total >= this.freeDeliveryThreshold;
        const delivery = isFreeDelivery ? 0 : this.deliveryCost;
        const finalTotal = total + delivery;

        if (itemsCount) itemsCount.textContent = this.getItemsText(itemsTotalCount);
        if (itemsTotal) itemsTotal.textContent = this.formatPrice(total) + ' ₽';
        if (deliveryCost) {
            deliveryCost.textContent = isFreeDelivery ? 'Бесплатно' : this.formatPrice(delivery) + ' ₽';
            deliveryCost.style.color = isFreeDelivery ? 'var(--success)' : 'inherit';
        }
        if (totalAmount) totalAmount.textContent = this.formatPrice(finalTotal) + ' ₽';

        this.updateProgressBar(total);
        this.setupAnimations();
    }

    updateQuantity(itemId, change) {
        const item = this.cart.find(item => item._id === itemId);
        if (item) {
            const newQuantity = item.quantity + change;
            
            if (newQuantity <= 0) {
                this.removeItemWithAnimation(itemId);
            } else if (newQuantity > item.stock) {
                this.showNotification(`Максимальное количество: ${item.stock} шт.`, 'warning');
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                this.renderCart();
                this.updateMedicineStock(itemId, -change); // Обновляем запас
                this.showQuantityChange(item, change);
            }
        }
    }

    removeItem(itemId) {
        const item = this.cart.find(item => item._id === itemId);
        if (item) {
            // Возвращаем товар в запас
            this.updateMedicineStock(itemId, item.quantity);
            this.removeItemWithAnimation(itemId);
        }
    }

    removeItemWithAnimation(itemId) {
        const itemElement = document.querySelector(`[onclick*="${itemId}"]`)?.closest('.cart-item');
        if (itemElement) {
            itemElement.style.animation = 'slideOutRight 0.4s ease-in forwards';
            setTimeout(() => {
                this.cart = this.cart.filter(item => item._id !== itemId);
                this.saveCart();
                this.renderCart();
            }, 400);
        } else {
            this.cart = this.cart.filter(item => item._id !== itemId);
            this.saveCart();
            this.renderCart();
        }
    }

    updateMedicineStock(medicineId, quantity) {
        // Обновляем запас через главное приложение
        if (window.app && typeof window.app.updateMedicineStock === 'function') {
            window.app.updateMedicineStock(medicineId, quantity);
        }
        
        // Также обновляем локально в корзине
        const cartItem = this.cart.find(item => item._id === medicineId);
        if (cartItem) {
            cartItem.stock += quantity;
            // Гарантируем, что запас не станет отрицательным
            if (cartItem.stock < 0) {
                cartItem.stock = 0;
            }
        }
    }

    showQuantityChange(item, change) {
        const changeElement = document.createElement('div');
        changeElement.className = `quantity-change ${change > 0 ? 'positive' : 'negative'}`;
        changeElement.innerHTML = `<i class="fas fa-${change > 0 ? 'plus' : 'minus'}"></i>`;
        changeElement.style.cssText = `
            position: absolute;
            background: ${change > 0 ? 'var(--success)' : 'var(--error)'};
            color: white;
            padding: 0.5rem;
            border-radius: 50%;
            font-size: 0.8rem;
            z-index: 10;
            animation: fadeOutUp 0.6s ease-out forwards;
        `;

        const itemElement = document.querySelector(`[onclick*="${item._id}"]`)?.closest('.cart-item');
        if (itemElement) {
            itemElement.style.position = 'relative';
            itemElement.appendChild(changeElement);
            setTimeout(() => changeElement.remove(), 600);
        }
    }

    updateProgressBar(total) {
        const progressBar = document.getElementById('freeDeliveryProgress');
        const progressText = document.getElementById('freeDeliveryText');
        
        if (progressBar && progressText) {
            const progress = Math.min((total / this.freeDeliveryThreshold) * 100, 100);
            
            progressBar.style.width = `${progress}%`;
            
            if (total >= this.freeDeliveryThreshold) {
                progressText.innerHTML = '<i class="fas fa-check-circle"></i> <strong>Бесплатная доставка активирована!</strong>';
                progressBar.style.background = 'var(--success)';
            } else {
                const remaining = this.freeDeliveryThreshold - total;
                progressText.innerHTML = `До бесплатной доставки осталось: <strong>${this.formatPrice(remaining)} ₽</strong>`;
                progressBar.style.background = 'var(--primary)';
            }
        }
    }

    setupAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'slideInUp 0.6s ease-out forwards';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.cart-item').forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            observer.observe(item);
        });
    }

    getDefaultMedicineImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNENBRjUwIi8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTMwIDkwTDE3MCA3MEwxMDAgMTEwTDMwIDcwTDcwIDkwTDEwMCA1MFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==';
    }

    getItemsText(count) {
        if (count % 10 === 1 && count % 100 !== 11) return `${count} товар`;
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return `${count} товара`;
        return `${count} товаров`;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    formatCategory(category) {
        const categories = {
            'антибиотики': 'Антибиотики',
            'витамины': 'Витамины',
            'обезболивающие': 'Обезболивающие',
            'сердечно-сосудистые': 'Сердечно-сосудистые',
            'другое': 'Прочее'
        };
        return categories[category] || category;
    }

    clearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('Вы уверены, что хотите очистить корзину?')) {
            // Возвращаем все товары в запас
            this.cart.forEach(item => {
                this.updateMedicineStock(item._id, item.quantity);
            });

            const cartItems = document.getElementById('cartItems');
            if (cartItems) {
                cartItems.style.animation = 'fadeOut 0.5s ease-out forwards';
                setTimeout(() => {
                    this.cart = [];
                    this.saveCart();
                    this.renderCart();
                }, 500);
            } else {
                this.cart = [];
                this.saveCart();
                this.renderCart();
            }
            this.showNotification('Корзина очищена', 'warning');
        }
    }

    async checkout() {
        if (this.cart.length === 0) {
            this.showNotification('Корзина пуста!', 'error');
            return;
        }

        // Проверка наличия товаров
        const outOfStockItems = this.cart.filter(item => item.quantity > item.stock);
        if (outOfStockItems.length > 0) {
            this.showNotification('Некоторые товары закончились', 'error');
            return;
        }

        const checkoutBtn = document.getElementById('checkoutBtn');
        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.innerHTML = '<div class="loading-spinner-small"></div> Оформление...';
        checkoutBtn.disabled = true;

        try {
            // Имитация API запроса
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.showNotification('Заказ успешно оформлен!', 'success');
            
            // Очищаем корзину после успешного оформления
            setTimeout(() => {
                this.cart = [];
                this.saveCart();
                this.renderCart();
                checkoutBtn.innerHTML = originalText;
                checkoutBtn.disabled = false;
            }, 1500);

        } catch (error) {
            this.showNotification('Ошибка оформления заказа', 'error');
            checkoutBtn.innerHTML = originalText;
            checkoutBtn.disabled = false;
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        window.dispatchEvent(new Event('storage'));
    }

    showNotification(message, type = 'success') {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        } else {
            const notification = document.createElement('div');
            const bgColor = {
                success: 'var(--success)',
                error: 'var(--error)',
                warning: 'var(--warning)'
            }[type];
            
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: ${bgColor};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: var(--radius);
                box-shadow: var(--shadow-hover);
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                max-width: 300px;
                font-weight: 500;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }
    }
}

// Добавляем CSS для корзины
const cartStyles = document.createElement('style');
cartStyles.textContent = `
    .cart-layout {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 2rem;
        align-items: start;
    }
    
    .cart-items {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .cart-item {
        background: var(--surface);
        padding: 1.5rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        display: flex;
        gap: 1.5rem;
        align-items: center;
        transition: var(--transition);
        opacity: 0;
        transform: translateY(30px);
    }
    
    .cart-item:hover {
        box-shadow: var(--shadow-hover);
    }
    
    .item-image {
        flex-shrink: 0;
    }
    
    .item-image img {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        object-fit: cover;
    }
    
    .item-details {
        flex: 1;
    }
    
    .item-name {
        margin: 0 0 0.5rem 0;
        color: var(--text-dark);
    }
    
    .item-manufacturer, .item-category {
        margin: 0 0 0.25rem 0;
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .item-stock {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        margin-top: 0.5rem;
    }
    
    .item-stock.low-stock {
        color: var(--warning);
    }
    
    .item-controls {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }
    
    .quantity-controls {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: var(--background);
        padding: 0.5rem;
        border-radius: 8px;
    }
    
    .quantity-btn {
        background: none;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: var(--transition);
        color: var(--text-light);
    }
    
    .quantity-btn:hover:not(:disabled) {
        background: var(--primary);
        color: white;
    }
    
    .quantity-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .quantity-display {
        font-weight: 600;
        min-width: 30px;
        text-align: center;
    }
    
    .item-price {
        text-align: right;
    }
    
    .price-total {
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--primary);
    }
    
    .price-unit {
        font-size: 0.8rem;
        color: var(--text-light);
    }
    
    .btn-remove {
        background: none;
        border: none;
        color: var(--error);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 6px;
        transition: var(--transition);
    }
    
    .btn-remove:hover {
        background: var(--error);
        color: white;
    }
    
    .cart-actions {
        margin-top: 2rem;
    }
    
    .cart-sidebar {
        position: sticky;
        top: 140px;
    }
    
    .order-summary {
        background: var(--surface);
        padding: 1.5rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
    }
    
    .order-summary h3 {
        margin: 0 0 1.5rem 0;
        color: var(--text-dark);
    }
    
    .summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        color: var(--text-light);
    }
    
    .summary-divider {
        height: 1px;
        background: var(--border);
        margin: 1rem 0;
    }
    
    .summary-total {
        display: flex;
        justify-content: space-between;
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--text-dark);
        margin-bottom: 1.5rem;
    }
    
    .delivery-progress {
        margin-bottom: 1.5rem;
    }
    
    .progress-bar {
        height: 6px;
        background: var(--border);
        border-radius: 3px;
        margin-bottom: 0.5rem;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: var(--primary);
        border-radius: 3px;
        transition: width 0.3s ease;
        width: 0%;
    }
    
    .progress-text {
        font-size: 0.8rem;
        color: var(--text-light);
        text-align: center;
    }
    
    .security-notice {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1rem;
        font-size: 0.8rem;
        color: var(--text-light);
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem;
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    @keyframes fadeOutUp {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @media (max-width: 768px) {
        .cart-layout {
            grid-template-columns: 1fr;
        }
        
        .cart-item {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
        }
        
        .item-controls {
            width: 100%;
            justify-content: space-between;
        }
        
        .cart-sidebar {
            position: static;
        }
        
        .item-image img {
            width: 50px;
            height: 50px;
        }
    }
`;

document.head.appendChild(cartStyles);

// Инициализация корзины
const cart = new Cart();