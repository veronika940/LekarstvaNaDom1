class MedExpressApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.medicines = []; // Храним данные о лекарствах
        this.init();
    }

    init() {
        this.updateCartCount();
        this.setupEventListeners();
        this.setupModals();
        this.setupMobileMenu();
        this.loadPopularMedicines();
    }

    setupEventListeners() {
        // Обновление счетчика корзины при изменении localStorage
        window.addEventListener('storage', () => {
            this.updateCartCount();
        });

        // Поиск в хедере
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(searchInput.value);
                }
            });
        }

        // Поиск в герое
        const heroSearch = document.querySelector('.hero-search button');
        if (heroSearch) {
            heroSearch.addEventListener('click', () => {
                const input = document.querySelector('.hero-search input');
                this.performSearch(input.value);
            });
        }

        // Добавление в корзину (делегирование событий)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-cart') && !e.target.closest('.btn-cart').disabled) {
                const card = e.target.closest('.medicine-card');
                if (card) {
                    const medicineId = card.dataset.medicineId;
                    const medicine = this.medicines.find(m => m._id === medicineId);
                    if (medicine) {
                        this.addToCart(medicine);
                    }
                }
            }
        });

        // Формы авторизации
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    setupModals() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const closeButtons = document.querySelectorAll('.close-modal');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');

        if (loginBtn && loginModal) {
            loginBtn.addEventListener('click', () => {
                loginModal.classList.add('active');
            });
        }

        if (registerBtn && registerModal) {
            registerBtn.addEventListener('click', () => {
                registerModal.classList.add('active');
            });
        }

        if (showRegister && registerModal && loginModal) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                loginModal.classList.remove('active');
                registerModal.classList.add('active');
            });
        }

        if (showLogin && registerModal && loginModal) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                registerModal.classList.remove('active');
                loginModal.classList.add('active');
            });
        }

        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                loginModal.classList.remove('active');
                registerModal.classList.remove('active');
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.remove('active');
            }
            if (e.target === registerModal) {
                registerModal.classList.remove('active');
            }
        });
    }

    setupMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');

        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    async loadPopularMedicines() {
        const container = document.getElementById('popularMedicines');
        if (!container) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/medicines?limit=4`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            this.medicines = await response.json();
            this.renderMedicines(this.medicines, container);
        } catch (error) {
            console.error('Ошибка загрузки популярных лекарств:', error);
            this.loadMockMedicines();
            this.renderMedicines(this.medicines, container);
        }
    }

    renderMedicines(medicines, container) {
        if (medicines.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <p style="color: var(--text-light);">Препараты не найдены</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = medicines.map(medicine => `
            <div class="medicine-card" data-medicine-id="${medicine._id}">
                ${medicine.stock < 10 && medicine.stock > 0 ? '<div class="medicine-badge">Заканчивается</div>' : ''}
                ${medicine.stock === 0 ? '<div class="medicine-badge error">Нет в наличии</div>' : ''}
                
                <div class="medicine-image">
                    <img src="${medicine.image || this.getMedicineImage(medicine.category)}" alt="${medicine.name}" onerror="this.src='${this.getMedicineImage(medicine.category)}'">
                </div>
                <div class="medicine-content">
                    <div class="medicine-category">${this.formatCategory(medicine.category)}</div>
                    <h3 class="medicine-name">${medicine.name}</h3>
                    <div class="medicine-manufacturer">${medicine.manufacturer}</div>
                    <p class="medicine-description">${medicine.description || 'Эффективный препарат для лечения и профилактики'}</p>
                    <div class="medicine-stock ${medicine.stock === 0 ? 'out-of-stock' : medicine.stock < 10 ? 'low-stock' : ''}">
                        <i class="fas fa-${medicine.stock === 0 ? 'times' : medicine.stock < 10 ? 'exclamation-triangle' : 'check'}"></i>
                        ${medicine.stock === 0 ? 'Нет в наличии' : 
                          medicine.stock < 10 ? `Осталось мало: ${medicine.stock} шт.` : 
                          `В наличии: ${medicine.stock} шт.`}
                    </div>
                    <div class="medicine-footer">
                        <div class="medicine-price">${this.formatPrice(medicine.price)} ₽</div>
                        <button class="btn-cart" ${medicine.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i> 
                            ${medicine.stock === 0 ? 'Нет в наличии' : 'В корзину'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getMedicineImage(category, medicineName = '') {
    const categoryImages = {
        'антибиотики': 'images/антибиотики.jpg',
        'витамины': 'images/витамины.jpg',
        'обезболивающие': 'images/обезболивающие.jpg',
        'сердечно-сосудистые': 'images/сердечно-сосудистые.jpg',
        'другое': 'images/другое.jpg'
    };
    
    const specificImages = {
        'Нурофен Экспресс': 'images/Нурофен экспресс.jpg',
        'Амоксициллин': 'images/Амоксициллин.jpg',
        'Компливит': 'images/Компливит.jpg',
        'Валидол': 'images/Валидол.jpg',
        'Парацетамол': 'images/парацетамол.jpg',
        'Витамин C': 'images/витамин C.jpg'
    };
    
    return specificImages[medicineName] || categoryImages[category] || categoryImages['другое'];
}

    addToCart(medicine) {
        if (medicine.stock <= 0) {
            this.showNotification(`"${medicine.name}" нет в наличии`, 'error');
            return;
        }

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item._id === medicine._id);
        
        if (existingItem) {
            // Проверяем, не превышает ли количество доступный запас
            if (existingItem.quantity >= medicine.stock) {
                this.showNotification(`Достигнут максимум для "${medicine.name}"`, 'warning');
                return;
            }
            existingItem.quantity += 1;
        } else {
            // Добавляем новый товар с количеством 1
            cart.push({
                ...medicine,
                quantity: 1
            });
        }

        // Обновляем запас товара
        this.updateMedicineStock(medicine._id, -1);
        
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartCount();
        this.showNotification(`"${medicine.name}" добавлен в корзину`);
    }

    updateMedicineStock(medicineId, change) {
        // Обновляем запас в локальном массиве medicines
        const medicineIndex = this.medicines.findIndex(m => m._id === medicineId);
        if (medicineIndex !== -1) {
            this.medicines[medicineIndex].stock += change;
            // Гарантируем, что запас не станет отрицательным
            if (this.medicines[medicineIndex].stock < 0) {
                this.medicines[medicineIndex].stock = 0;
            }
            
            // Обновляем отображение на странице
            this.updateMedicineDisplay(medicineId);
        }
    }

    updateMedicineDisplay(medicineId) {
        const medicineCard = document.querySelector(`[data-medicine-id="${medicineId}"]`);
        if (!medicineCard) return;

        const medicine = this.medicines.find(m => m._id === medicineId);
        if (!medicine) return;

        // Обновляем бейдж наличия
        const badge = medicineCard.querySelector('.medicine-badge');
        if (badge) {
            badge.remove();
        }

        if (medicine.stock < 10 && medicine.stock > 0) {
            medicineCard.insertAdjacentHTML('afterbegin', '<div class="medicine-badge">Заканчивается</div>');
        } else if (medicine.stock === 0) {
            medicineCard.insertAdjacentHTML('afterbegin', '<div class="medicine-badge error">Нет в наличии</div>');
        }

        // Обновляем информацию о наличии
        const stockElement = medicineCard.querySelector('.medicine-stock');
        if (stockElement) {
            stockElement.className = `medicine-stock ${medicine.stock === 0 ? 'out-of-stock' : medicine.stock < 10 ? 'low-stock' : ''}`;
            stockElement.innerHTML = `
                <i class="fas fa-${medicine.stock === 0 ? 'times' : medicine.stock < 10 ? 'exclamation-triangle' : 'check'}"></i>
                ${medicine.stock === 0 ? 'Нет в наличии' : 
                  medicine.stock < 10 ? `Осталось мало: ${medicine.stock} шт.` : 
                  `В наличии: ${medicine.stock} шт.`}
            `;
        }

        // Обновляем кнопку корзины
        const cartButton = medicineCard.querySelector('.btn-cart');
        if (cartButton) {
            cartButton.disabled = medicine.stock === 0;
            cartButton.innerHTML = `
                <i class="fas fa-shopping-cart"></i> 
                ${medicine.stock === 0 ? 'Нет в наличии' : 'В корзину'}
            `;
        }
    }

    loadMockMedicines() {
        this.medicines = [
            {
                _id: '1',
                name: 'Нурофен Экспресс',
                manufacturer: 'Рекитт Бенкизер',
                price: 450,
                category: 'обезболивающие',
                description: 'Капсулы для снятия боли и воспаления',
                stock: 25,
                image: 'images/Нурофен Экспресс.png'
            },
            {
                _id: '2',
                name: 'Амоксициллин',
                manufacturer: 'Фармстандарт',
                price: 320,
                category: 'антибиотики',
                description: 'Антибактериальный препарат широкого спектра',
                stock: 18,
                image: 'images/Амоксициллин.jpg'
            },
            {
                _id: '3',
                name: 'Компливит',
                manufacturer: 'Фармстандарт',
                price: 280,
                category: 'витамины',
                description: 'Комплекс витаминов и минералов',
                stock: 42,
                image: 'images/Компливит.jpg'
            },
            {
                _id: '4',
                name: 'Валидол',
                manufacturer: 'Обновление',
                price: 120,
                category: 'сердечно-сосудистые',
                description: 'Успокаивающее средство при стенокардии',
                stock: 5,
                image: 'images/Валидол.jpg'
            },
            {
            _id: '5',
            name: 'Парацетамол',
            manufacturer: 'Фармстандарт',
            price: 80,
            category: 'обезболивающие',
            description: 'Жаропонижающее и обезболивающее средство',
            stock: 30,
            image: 'images/парацетамол.jpg' 
        },
        {
            _id: '6',
            name: 'Витамин C',
            manufacturer: 'Эвалар',
            price: 150,
            category: 'витамины',
            description: 'Витамин C для укрепления иммунитета',
            stock: 25,
            image: 'images/витамин C.jpg' 
        }
        ];
    }

    performSearch(query) {
        if (query.trim()) {
            window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
        }
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCounts = document.querySelectorAll('.cart-count');
        cartCounts.forEach(cartCount => {
            cartCount.textContent = totalItems;
            if (totalItems > 0) {
                cartCount.classList.add('show');
            } else {
                cartCount.classList.remove('show');
            }
        });
    }

    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Имитация успешного входа
        const userData = {
            id: 1,
            name: 'Иван Иванов',
            email: email,
            phone: '+7 (999) 123-45-67',
            address: {
                street: 'ул. Примерная, д. 123',
                city: 'Москва',
                postalCode: '123456'
            },
            joined: new Date().toISOString().split('T')[0],
            notifications: {
                email: true,
                sms: false,
                promotions: false
            }
        };
        
        // Сохраняем данные пользователя
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        this.showNotification('Вход выполнен успешно!', 'success');
        document.getElementById('loginModal').classList.remove('active');
        
        // Очистка формы
        document.getElementById('loginForm').reset();
        
        // Обновляем интерфейс если на странице профиля
        if (window.userProfile) {
            window.userProfile.currentUser = userData;
            window.userProfile.loadUserProfile();
        }
    }

    handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        if (password !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        // Имитация успешной регистрации
        const userData = {
            id: Date.now(),
            name: name,
            email: email,
            phone: '',
            address: null,
            joined: new Date().toISOString().split('T')[0],
            notifications: {
                email: true,
                sms: false,
                promotions: false
            }
        };
        
        // Сохраняем данные пользователя
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        this.showNotification('Регистрация прошла успешно!', 'success');
        document.getElementById('registerModal').classList.remove('active');
        
        // Очистка формы
        document.getElementById('registerForm').reset();
        
        // Обновляем интерфейс если на странице профиля
        if (window.userProfile) {
            window.userProfile.currentUser = userData;
            window.userProfile.loadUserProfile();
        }
    }

    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
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

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    showNotification(message, type = 'success') {
        // Удаляем существующие уведомления
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        const bgColor = {
            success: 'var(--success)',
            error: 'var(--error)',
            warning: 'var(--warning)'
        }[type];
        
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius);
            box-shadow: var(--shadow-hover);
            z-index: 10001;
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

// Инициализация приложения
const app = new MedExpressApp();