class UserProfile {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    init() {
        this.loadUserProfile();
        this.loadOrderHistory();
        this.setupEventListeners();
        this.setupTabs();
        this.setupFormValidation();
    }

    getCurrentUser() {
        // Проверяем, есть ли данные пользователя в localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            return JSON.parse(savedUser);
        }

        // Возвращаем данные по умолчанию для демонстрации
        return {
            id: 1,
            name: 'Иван Иванов',
            email: 'ivan@example.com',
            phone: '+7 (999) 123-45-67',
            address: {
                street: 'ул. Примерная, д. 123',
                city: 'Москва',
                postalCode: '123456'
            },
            joined: '2024-01-15',
            notifications: {
                email: true,
                sms: false,
                promotions: false
            }
        };
    }

    setupEventListeners() {
        // Редактирование профиля
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.toggleEditMode(true);
            });
        }

        // Сохранение профиля
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Отмена редактирования
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.toggleEditMode(false);
                this.resetForm();
            });
        }

        // Выход из аккаунта
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Настройки уведомлений
        this.setupNotificationSettings();
    }

    setupFormValidation() {
        const form = document.getElementById('profileForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.validateForm()) {
                    this.saveProfile();
                }
            });
        }
    }

    setupNotificationSettings() {
        const notificationSwitches = document.querySelectorAll('.settings-list input[type="checkbox"]');
        notificationSwitches.forEach(switchElement => {
            switchElement.addEventListener('change', (e) => {
                const setting = e.target.closest('.setting-item');
                const settingName = setting.querySelector('h4').textContent.toLowerCase();
                
                // Обновляем настройки пользователя
                if (settingName.includes('email')) {
                    this.currentUser.notifications.email = e.target.checked;
                } else if (settingName.includes('sms')) {
                    this.currentUser.notifications.sms = e.target.checked;
                } else if (settingName.includes('рекламные')) {
                    this.currentUser.notifications.promotions = e.target.checked;
                }

                this.saveUserData();
                this.showNotification('Настройки сохранены', 'success');
            });
        });
    }

    setupTabs() {
        const navItems = document.querySelectorAll('.nav-item');
        const tabContents = document.querySelectorAll('.tab-content');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = item.dataset.tab;
                
                // Обновляем активные элементы навигации
                navItems.forEach(navItem => navItem.classList.remove('active'));
                item.classList.add('active');
                
                // Показываем активную вкладку
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(`${tabId}Tab`).classList.add('active');
                
                // Загружаем данные для вкладки если нужно
                if (tabId === 'orders') {
                    this.loadOrderHistory();
                } else if (tabId === 'favorites') {
                    this.loadFavorites();
                } else if (tabId === 'addresses') {
                    this.loadAddresses();
                }
            });
        });
    }

    loadUserProfile() {
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }

        this.updateProfileDisplay();
        this.updateNotificationSettings();
    }

    updateProfileDisplay() {
        // Основная информация в сайдбаре
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userEmail').textContent = this.currentUser.email;

        // Информация в профиле
        document.getElementById('displayName').textContent = this.currentUser.name;
        document.getElementById('displayEmail').textContent = this.currentUser.email;
        document.getElementById('displayPhone').textContent = this.currentUser.phone || 'Не указан';
        document.getElementById('displayAddress').textContent = this.currentUser.address ? 
            `${this.currentUser.address.street}, ${this.currentUser.address.city}` : 'Не указан';

        // Формы редактирования
        document.getElementById('editName').value = this.currentUser.name;
        document.getElementById('editEmail').value = this.currentUser.email;
        document.getElementById('editPhone').value = this.currentUser.phone || '';
        document.getElementById('editAddress').value = this.currentUser.address?.street || '';
        document.getElementById('editCity').value = this.currentUser.address?.city || '';
        document.getElementById('editPostalCode').value = this.currentUser.address?.postalCode || '';
    }

    updateNotificationSettings() {
        if (!this.currentUser.notifications) return;

        const settings = {
            'Уведомления по email': this.currentUser.notifications.email,
            'SMS уведомления': this.currentUser.notifications.sms,
            'Рекламные рассылки': this.currentUser.notifications.promotions
        };

        Object.keys(settings).forEach(settingName => {
            const settingItem = Array.from(document.querySelectorAll('.setting-item'))
                .find(item => item.querySelector('h4').textContent === settingName);
            
            if (settingItem) {
                const checkbox = settingItem.querySelector('input[type="checkbox"]');
                checkbox.checked = settings[settingName];
            }
        });
    }

    validateForm() {
        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const phone = document.getElementById('editPhone').value.trim();

        // Очистка предыдущих ошибок
        this.clearErrors();

        let isValid = true;

        // Проверка имени
        if (!name) {
            this.showError('editName', 'Имя обязательно для заполнения');
            isValid = false;
        } else if (name.length < 2) {
            this.showError('editName', 'Имя должно содержать минимум 2 символа');
            isValid = false;
        }

        // Проверка email
        if (!email) {
            this.showError('editEmail', 'Email обязателен для заполнения');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showError('editEmail', 'Введите корректный email адрес');
            isValid = false;
        }

        // Проверка телефона (если указан)
        if (phone && !this.isValidPhone(phone)) {
            this.showError('editPhone', 'Введите корректный номер телефона');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^(\+7|8)[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        field.classList.add('error');
    }

    clearErrors() {
        document.querySelectorAll('.error-message').forEach(error => error.remove());
        document.querySelectorAll('.form-group input.error').forEach(input => {
            input.classList.remove('error');
        });
    }

    toggleEditMode(editing) {
        const displaySection = document.getElementById('profileDisplay');
        const editSection = document.getElementById('profileEdit');

        if (editing) {
            displaySection.style.display = 'none';
            editSection.style.display = 'block';
        } else {
            displaySection.style.display = 'block';
            editSection.style.display = 'none';
        }
    }

    resetForm() {
        this.updateProfileDisplay();
        this.clearErrors();
    }

    async saveProfile() {
        if (!this.validateForm()) {
            return;
        }

        const saveBtn = document.getElementById('saveProfileBtn');
        const originalText = saveBtn.innerHTML;

        try {
            saveBtn.innerHTML = '<div class="loading-spinner-small"></div> Сохранение...';
            saveBtn.disabled = true;

            // Имитация API запроса
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Обновляем данные пользователя
            this.currentUser = {
                ...this.currentUser,
                name: document.getElementById('editName').value.trim(),
                email: document.getElementById('editEmail').value.trim(),
                phone: document.getElementById('editPhone').value.trim(),
                address: {
                    street: document.getElementById('editAddress').value.trim(),
                    city: document.getElementById('editCity').value.trim(),
                    postalCode: document.getElementById('editPostalCode').value.trim()
                }
            };

            // Сохраняем в localStorage
            this.saveUserData();

            this.updateProfileDisplay();
            this.toggleEditMode(false);
            this.showNotification('Профиль успешно обновлен', 'success');

        } catch (error) {
            console.error('Ошибка сохранения профиля:', error);
            this.showNotification('Ошибка сохранения профиля', 'error');
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }

    saveUserData() {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }

    async loadOrderHistory() {
        const container = document.getElementById('ordersList');
        if (!container) return;

        try {
            container.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>Загрузка истории заказов...</p>
                </div>
            `;

            // Имитация API запроса
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const orders = this.getMockOrders();
            this.renderOrders(orders, container);
            
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            container.innerHTML = `
                <div class="error-state">
                    <p>Не удалось загрузить историю заказов</p>
                    <button onclick="userProfile.loadOrderHistory()" class="btn btn-outline">
                        Попробовать снова
                    </button>
                </div>
            `;
        }
    }

    async loadFavorites() {
        const container = document.getElementById('favoritesList');
        if (!container) return;

        // В реальном приложении здесь была бы загрузка избранного
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❤️</div>
                <h3>У вас пока нет избранных товаров</h3>
                <p>Добавляйте товары в избранное, чтобы не потерять</p>
                <a href="catalog.html" class="btn btn-primary" style="margin-top: 1rem;">
                    Перейти в каталог
                </a>
            </div>
        `;
    }

    async loadAddresses() {
        const container = document.getElementById('addressesList');
        if (!container) return;

        if (!this.currentUser.address?.street) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🏠</div>
                    <h3>У вас пока нет сохраненных адресов</h3>
                    <p>Добавьте адрес для быстрой доставки</p>
                    <button class="btn btn-primary" style="margin-top: 1rem;" onclick="userProfile.showAddAddressForm()">
                        Добавить адрес
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="addresses-grid">
                    <div class="address-card">
                        <div class="address-header">
                            <h4>Основной адрес</h4>
                            <button class="btn-icon" onclick="userProfile.editAddress()">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                        <div class="address-details">
                            <p><strong>${this.currentUser.address.street}</strong></p>
                            <p>${this.currentUser.address.city}</p>
                            <p>Индекс: ${this.currentUser.address.postalCode}</p>
                        </div>
                        <div class="address-actions">
                            <button class="btn btn-outline" onclick="userProfile.setDefaultAddress()">
                                Основной
                            </button>
                            <button class="btn btn-outline" onclick="userProfile.editAddress()">
                                Изменить
                            </button>
                            <button class="btn btn-outline" onclick="userProfile.deleteAddress()">
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
                <div class="address-actions-main">
                    <button class="btn btn-primary" onclick="userProfile.showAddAddressForm()">
                        <i class="fas fa-plus"></i> Добавить новый адрес
                    </button>
                </div>
            `;
        }
    }

    showAddAddressForm() {
        const container = document.getElementById('addressesList');
        container.innerHTML = `
            <div class="address-form-card">
                <h3>Добавить новый адрес</h3>
                <form id="addressForm">
                    <div class="form-grid">
                        <div class="form-group full-width">
                            <label for="newAddressStreet">Улица, дом, квартира *</label>
                            <input type="text" id="newAddressStreet" required>
                        </div>
                        <div class="form-group">
                            <label for="newAddressCity">Город *</label>
                            <input type="text" id="newAddressCity" required>
                        </div>
                        <div class="form-group">
                            <label for="newAddressPostalCode">Индекс</label>
                            <input type="text" id="newAddressPostalCode">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="userProfile.loadAddresses()">
                            Отмена
                        </button>
                        <button type="submit" class="btn btn-primary">
                            Сохранить адрес
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('addressForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNewAddress();
        });
    }

    saveNewAddress() {
        const street = document.getElementById('newAddressStreet').value.trim();
        const city = document.getElementById('newAddressCity').value.trim();
        const postalCode = document.getElementById('newAddressPostalCode').value.trim();

        if (!street || !city) {
            this.showNotification('Заполните обязательные поля', 'error');
            return;
        }

        this.currentUser.address = {
            street,
            city,
            postalCode
        };

        this.saveUserData();
        this.loadAddresses();
        this.showNotification('Адрес успешно сохранен', 'success');
    }

    editAddress() {
        this.showAddAddressForm();
        
        // Заполняем форму текущими данными
        setTimeout(() => {
            document.getElementById('newAddressStreet').value = this.currentUser.address.street;
            document.getElementById('newAddressCity').value = this.currentUser.address.city;
            document.getElementById('newAddressPostalCode').value = this.currentUser.address.postalCode;
        }, 100);
    }

    deleteAddress() {
        if (confirm('Вы уверены, что хотите удалить этот адрес?')) {
            this.currentUser.address = null;
            this.saveUserData();
            this.loadAddresses();
            this.showNotification('Адрес удален', 'success');
        }
    }

    setDefaultAddress() {
        this.showNotification('Адрес установлен как основной', 'success');
    }

    renderOrders(orders, container) {
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                    <h3>У вас пока нет заказов</h3>
                    <p>Сделайте свой первый заказ и он появится здесь</p>
                    <a href="catalog.html" class="btn btn-primary" style="margin-top: 1rem;">
                        Сделать заказ
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h4>Заказ #${order.id}</h4>
                        <div class="order-meta">
                            <span class="order-date">${this.formatDate(order.date)}</span>
                            <span class="order-amount">${this.formatPrice(order.total)} ₽</span>
                        </div>
                    </div>
                    <div class="order-status ${order.status}">
                        ${this.getStatusText(order.status)}
                    </div>
                </div>
                
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <div class="item-image">
                                <div class="medicine-photo">💊</div>
                            </div>
                            <div class="item-details">
                                <h5>${item.name}</h5>
                                <p>${item.manufacturer}</p>
                            </div>
                            <div class="item-quantity">${item.quantity} × ${this.formatPrice(item.price)} ₽</div>
                            <div class="item-total">${this.formatPrice(item.total)} ₽</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-footer">
                    <div class="order-actions">
                        <button class="btn btn-outline" onclick="userProfile.reorder('${order.id}')">
                            Повторить заказ
                        </button>
                        <button class="btn btn-outline" onclick="userProfile.viewOrderDetails('${order.id}')">
                            Подробнее
                        </button>
                        ${order.status === 'delivered' ? `
                            <button class="btn btn-outline" onclick="userProfile.rateOrder('${order.id}')">
                                Оценить
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    async reorder(orderId) {
        try {
            // Имитация повторного заказа
            this.showNotification('Заказ добавлен в корзину', 'success');
            
            // В реальном приложении здесь была бы логика добавления товаров в корзину
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            window.location.href = 'cart.html';
            
        } catch (error) {
            this.showNotification('Ошибка при повторном заказе', 'error');
        }
    }

    viewOrderDetails(orderId) {
        // В реальном приложении здесь был бы переход на страницу деталей заказа
        this.showNotification(`Детали заказа #${orderId}`, 'info');
    }

    rateOrder(orderId) {
        // В реальном приложении здесь было бы окно оценки заказа
        this.showNotification('Функция оценки скоро будет доступна', 'info');
    }

    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            // Очищаем данные пользователя
            localStorage.removeItem('currentUser');
            this.showNotification('Вы вышли из аккаунта', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    }

    showLoginPrompt() {
        const profileSection = document.querySelector('.profile-content');
        if (profileSection) {
            profileSection.innerHTML = `
                <div class="auth-prompt">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🔐</div>
                    <h2>Войдите в аккаунт</h2>
                    <p>Чтобы просматривать историю заказов и управлять профилем</p>
                    <div style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: center;">
                        <button class="btn btn-primary" onclick="window.location.href='index.html'">
                            Войти
                        </button>
                        <button class="btn btn-outline" onclick="window.location.href='index.html'">
                            Регистрация
                        </button>
                    </div>
                </div>
            `;
        }
    }

    getMockOrders() {
        return [
            {
                id: 'ORD-001',
                date: '2024-03-15',
                status: 'delivered',
                total: 1540,
                items: [
                    { name: 'Парацетамол', 
                    manufacturer: 'Фармстандарт', 
                    quantity: 2, 
                    price: 150, 
                    total: 300,
                    image: 'images/Парацетамол.jpg',
                    category: 'обезболивающие'
                },
                { 
                    name: 'Витамин C', 
                    manufacturer: 'Солгар', 
                    quantity: 1, 
                    price: 280, 
                    total: 280,
                    image: 'images/витамин C.jpg',
                    category: 'витамины'
                },
                { 
                    name: 'Амоксициллин', 
                    manufacturer: 'Синтез', 
                    quantity: 1, 
                    price: 760, 
                    total: 760,
                    image: 'images/Амоксициллин.jpg',
                    category: 'антибиотики'
                }
            ]
        },
        {
            id: 'ORD-002',
            date: '2024-03-10',
            status: 'delivering',
            total: 850,
            items: [
                { 
                    name: 'Валидол', 
                    manufacturer: 'Обновление', 
                    quantity: 1, 
                    price: 120, 
                    total: 120,
                    image: 'images/Валидол.jpg',
                    category: 'сердечно-сосудистые'
                },
                { 
                    name: 'Компливит', 
                    manufacturer: 'Фармстандарт', 
                    quantity: 2, 
                    price: 280, 
                    total: 560,
                    image: 'images/Компливит.jpg',
                    category: 'витамины'
                },
                { 
                    name: 'Нурофен Экспресс', 
                    manufacturer: 'Рекитт Бенкизер', 
                    quantity: 1, 
                    price: 450, 
                    total: 450,
                    image: 'images/Нурофен экспресс.png',
                    category: 'обезболивающие'
                }
            ]
        },
        {
            id: 'ORD-003',
            date: '2024-03-05',
            status: 'preparing',
            total: 620,
            items: [
                { 
                    name: 'Амоксициллин', 
                    manufacturer: 'Фармстандарт', 
                    quantity: 1, 
                    price: 320, 
                    total: 320,
                    image: 'images/Амоксициллин.jpg',
                    category: 'антибиотики'
                },
                { 
                    name: 'Парацетамол', 
                    manufacturer: 'Фармстандарт', 
                    quantity: 2, 
                    price: 150, 
                    total: 300,
                    image: 'images/Парацетамол.jpg',
                    category: 'обезболивающие'
                }
            ]
        }
    ];
}

    getStatusText(status) {
        const statuses = {
            'pending': 'Ожидает подтверждения',
            'confirmed': 'Подтвержден',
            'preparing': 'Готовится к отправке',
            'delivering': 'В пути',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statuses[status] || status;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    showNotification(message, type = 'success') {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        } else {
            // Простая реализация уведомлений
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: ${type === 'success' ? 'var(--success)' : 
                           type === 'error' ? 'var(--error)' : 'var(--warning)'};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: var(--radius);
                box-shadow: var(--shadow-hover);
                z-index: 10001;
                transform: translateX(400px);
                transition: transform 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => notification.style.transform = 'translateX(0)', 100);
            setTimeout(() => {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
}

// Добавляем CSS для профиля
const profileStyles = document.createElement('style');
profileStyles.textContent = `
    .profile-layout {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 2rem;
        align-items: start;
    }
    
    .profile-sidebar {
        background: var(--surface);
        padding: 1.5rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        position: sticky;
        top: 140px;
    }
    
    .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--border);
    }
    
    .user-avatar {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.5rem;
    }
    
    .user-details h3 {
        margin: 0 0 0.25rem 0;
        color: var(--text-dark);
    }
    
    .user-details p {
        margin: 0;
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .profile-nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 2rem;
    }
    
    .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        text-decoration: none;
        color: var(--text-light);
        border-radius: var(--radius);
        transition: var(--transition);
    }
    
    .nav-item:hover,
    .nav-item.active {
        background: rgba(46, 125, 50, 0.08);
        color: var(--primary);
    }
    
    .nav-item i {
        width: 20px;
        text-align: center;
    }
    
    .profile-content {
        min-height: 500px;
    }
    
    .profile-card {
        background: var(--surface);
        padding: 2rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        margin-bottom: 1.5rem;
    }
    
    .profile-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border);
    }
    
    .profile-header h2 {
        margin: 0;
        color: var(--text-dark);
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }
    
    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .info-item label {
        font-weight: 600;
        color: var(--text-dark);
        font-size: 0.9rem;
    }
    
    .info-item span {
        color: var(--text-light);
    }
    
    .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-group.full-width {
        grid-column: 1 / -1;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-dark);
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 1rem;
        transition: var(--transition);
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
    }
    
    .form-group input.error {
        border-color: var(--error);
    }
    
    .error-message {
        color: var(--error);
        font-size: 0.8rem;
        margin-top: 0.25rem;
    }
    
    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border);
    }
    
    .tab-content {
        display: none;
    }
    
    .tab-content.active {
        display: block;
        animation: fadeIn 0.3s ease-out;
    }
    
    .order-card {
        background: var(--surface);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        margin-bottom: 1.5rem;
        overflow: hidden;
    }
    
    .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid var(--border);
    }
    
    .order-status {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .order-status.delivered {
        background: var(--success);
        color: white;
    }
    
    .order-status.delivering {
        background: var(--secondary);
        color: white;
    }
    
    .order-status.preparing {
        background: var(--warning);
        color: white;
    }
    
    .order-status.pending {
        background: var(--text-light);
        color: white;
    }
    
    .order-items {
        padding: 1.5rem;
    }
    
    .order-item {
        display: flex;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid var(--border);
    }
    
    .order-item:last-child {
        border-bottom: none;
    }
    
    .item-image {
        margin-right: 1rem;
        flex-shrink: 0;
    }
    
    .item-image img {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    display: block;
    }

    .medicine-photo {
        display: none;
    }
    
    .item-details {
        flex: 1;
    }
    
    .item-details h5 {
        margin: 0 0 0.25rem 0;
    }
    
    .item-details p {
        margin: 0;
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .item-quantity {
        margin: 0 1rem;
        color: var(--text-light);
    }
    
    .item-total {
        font-weight: 600;
        color: var(--primary);
    }
    
    .order-footer {
        padding: 1rem 1.5rem;
        background: var(--background);
        border-top: 1px solid var(--border);
    }
    
    .order-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }
    
    .settings-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid var(--border);
    }
    
    .setting-item:last-child {
        border-bottom: none;
    }
    
    .setting-info h4 {
        margin: 0 0 0.25rem 0;
        color: var(--text-dark);
    }
    
    .setting-info p {
        margin: 0;
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
    }
    
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--border);
        transition: var(--transition);
        border-radius: 24px;
    }
    
    .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: var(--transition);
        border-radius: 50%;
    }
    
    input:checked + .slider {
        background-color: var(--primary);
    }
    
    input:checked + .slider:before {
        transform: translateX(26px);
    }
    
    .addresses-grid {
        display: grid;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    
    .address-card {
        background: var(--background);
        padding: 1.5rem;
        border-radius: var(--radius);
        border: 1px solid var(--border);
    }
    
    .address-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .address-header h4 {
        margin: 0;
        color: var(--text-dark);
    }
    
    .btn-icon {
        background: none;
        border: none;
        color: var(--text-light);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 6px;
        transition: var(--transition);
    }
    
    .btn-icon:hover {
        background: var(--border);
        color: var(--text-dark);
    }
    
    .address-details p {
        margin: 0.25rem 0;
        color: var(--text-light);
    }
    
    .address-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
    }
    
    .address-actions .btn {
        flex: 1;
    }
    
    .address-actions-main {
        text-align: center;
    }
    
    .address-form-card {
        background: var(--background);
        padding: 2rem;
        border-radius: var(--radius);
        border: 1px solid var(--border);
    }
    
    .auth-prompt, .empty-state {
        text-align: center;
        padding: 3rem;
    }
    
    .loading {
        text-align: center;
        padding: 3rem;
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--border);
        border-left: 4px solid var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    .loading-spinner-small {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-left: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-right: 8px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @media (max-width: 768px) {
        .profile-layout {
            grid-template-columns: 1fr;
        }
        
        .profile-sidebar {
            position: static;
        }
        
        .info-grid {
            grid-template-columns: 1fr;
        }
        
        .form-grid {
            grid-template-columns: 1fr;
        }
        
        .order-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
        }
        
        .order-actions {
            justify-content: flex-start;
            flex-wrap: wrap;
        }
        
        .address-actions {
            flex-direction: column;
        }
    }
`;

document.head.appendChild(profileStyles);

// Инициализация профиля
const userProfile = new UserProfile();