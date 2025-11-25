class Catalog {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.currentPage = 1;
        this.filters = {
            name: '',
            category: '',
            priceMin: '',
            priceMax: '',
            manufacturer: '',
            inStock: false,
            sortBy: 'name',
            sortOrder: 'asc'
        };
        this.allMedicines = [];
        this.filteredMedicines = [];
        this.init();
    }

    init() {
        this.loadMedicines();
        this.setupEventListeners();
        this.checkUrlParams();
        this.setupViewToggle();
    }

    setupEventListeners() {
        // Фильтры
        document.getElementById('applyFilters')?.addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('resetFilters')?.addEventListener('click', () => {
            this.resetFilters();
        });

        // Живые фильтры
        ['searchInput', 'categoryFilter', 'manufacturerFilter', 'priceMin', 'priceMax'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', this.debounce(() => {
                    this.applyFilters();
                }, 500));
            }
        });

        // Чекбокс наличия
        const inStockCheckbox = document.getElementById('inStockFilter');
        if (inStockCheckbox) {
            inStockCheckbox.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Сортировка
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const [sortBy, sortOrder] = e.target.value.split('_');
                this.filters.sortBy = sortBy;
                this.filters.sortOrder = sortOrder;
                this.applySorting();
            });
        }

        // Добавление в корзину
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-cart') && !e.target.closest('.btn-cart').disabled) {
                const card = e.target.closest('.medicine-card');
                if (card) {
                    const medicineId = card.dataset.medicineId;
                    const medicine = this.allMedicines.find(m => m._id === medicineId);
                    if (medicine) {
                        this.addToCart(medicine);
                    }
                }
            }
        });
    }

    setupViewToggle() {
        const viewButtons = document.querySelectorAll('.view-btn');
        const medicinesGrid = document.getElementById('medicinesList');

        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const view = button.dataset.view;
                
                // Обновляем активные кнопки
                viewButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Меняем вид
                if (medicinesGrid) {
                    medicinesGrid.className = `medicines-grid ${view}-view`;
                    localStorage.setItem('preferredView', view);
                }
            });
        });

        // Восстанавливаем предпочтительный вид
        const preferredView = localStorage.getItem('preferredView') || 'grid';
        const activeButton = document.querySelector(`[data-view="${preferredView}"]`);
        if (activeButton) {
            activeButton.click();
        }
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('search')) {
            this.filters.name = urlParams.get('search');
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = this.filters.name;
        }
        
        if (urlParams.get('category')) {
            this.filters.category = urlParams.get('category');
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) categoryFilter.value = this.filters.category;
        }
    }

    async loadMedicines() {
        const container = document.getElementById('medicinesList');
        const loading = document.querySelector('.loading');
        const resultsInfo = document.getElementById('resultsInfo');

        if (!container) return;

        try {
            if (loading) loading.style.display = 'block';
            if (resultsInfo) resultsInfo.style.display = 'none';

            const response = await fetch(`${this.apiBaseUrl}/medicines`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            this.allMedicines = await response.json();
            
            if (loading) loading.style.display = 'none';
            
            this.applyFilters();
            this.updateManufacturerFilter();
            
        } catch (error) {
            console.error('Ошибка загрузки лекарств:', error);
            this.loadMockMedicines();
        }
    }

    loadMockMedicines() {
        this.allMedicines = [
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
                price: 150,
                category: 'обезболивающие',
                description: 'Жаропонижающее и обезболивающее средство',
                stock: 0,
                image: 'images/парацетамол.jpg' 

            },
            {
                _id: '6',
                name: 'Витамин C',
                manufacturer: 'Солгар',
                price: 280,
                category: 'витамины',
                description: 'Витамин C в таблетках, 1000 мг',
                stock: 100,
                image: 'images/витамин C.jpg' 
            }
        ];
        
        this.applyFilters();
        this.updateManufacturerFilter();
    }

    applyFilters() {
        this.updateFiltersFromForm();
        
        this.filteredMedicines = this.allMedicines.filter(medicine => {
            // Фильтр по названию
            if (this.filters.name && 
                !medicine.name.toLowerCase().includes(this.filters.name.toLowerCase())) {
                return false;
            }

            // Фильтр по категории
            if (this.filters.category && medicine.category !== this.filters.category) {
                return false;
            }

            // Фильтр по производителю
            if (this.filters.manufacturer && 
                !medicine.manufacturer.toLowerCase().includes(this.filters.manufacturer.toLowerCase())) {
                return false;
            }

            // Фильтр по цене
            if (this.filters.priceMin && medicine.price < parseInt(this.filters.priceMin)) {
                return false;
            }
            if (this.filters.priceMax && medicine.price > parseInt(this.filters.priceMax)) {
                return false;
            }

            // Фильтр по наличию
            if (this.filters.inStock && medicine.stock === 0) {
                return false;
            }

            return true;
        });

        this.applySorting();
        this.renderMedicines();
        this.updateResultsInfo();
    }

applySorting() {
    this.filteredMedicines.sort((a, b) => {
        let aValue, bValue;

        switch (this.filters.sortBy) {
            case 'price':
                aValue = a.price;
                bValue = b.price;
                break;
            case 'name':
            default:
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
        }

        if (this.filters.sortOrder === 'desc') {
            if (this.filters.sortBy === 'price') {
                return bValue - aValue;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        } else {
            if (this.filters.sortBy === 'price') {
                return aValue - bValue;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        }
    });
    
    // Добавьте эти строки для автоматического обновления отображения
    this.renderMedicines();
    this.updateResultsInfo();
}

    updateFiltersFromForm() {
        this.filters.name = document.getElementById('searchInput').value;
        this.filters.category = document.getElementById('categoryFilter').value;
        this.filters.manufacturer = document.getElementById('manufacturerFilter').value;
        this.filters.priceMin = document.getElementById('priceMin').value;
        this.filters.priceMax = document.getElementById('priceMax').value;
        this.filters.inStock = document.getElementById('inStockFilter').checked;
    }

    updateManufacturerFilter() {
        const manufacturerFilter = document.getElementById('manufacturerFilter');
        if (!manufacturerFilter) return;

        const manufacturers = [...new Set(this.allMedicines.map(m => m.manufacturer))].sort();
        const currentValue = manufacturerFilter.value;

        manufacturerFilter.innerHTML = '<option value="">Все производители</option>' +
            manufacturers.map(m => `<option value="${m}">${m}</option>`).join('');

        // Восстанавливаем значение
        if (manufacturers.includes(currentValue)) {
            manufacturerFilter.value = currentValue;
        }
    }

    renderMedicines() {
        const container = document.getElementById('medicinesList');
        if (!container) return;

        if (this.filteredMedicines.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте изменить параметры фильтрации</p>
                    <button onclick="catalog.resetFilters()" class="btn btn-outline" style="margin-top: 1rem;">
                        Сбросить фильтры
                    </button>
                </div>
            `;
            return;
        }

        const isListView = container.classList.contains('list-view');
        
        container.innerHTML = this.filteredMedicines.map((medicine, index) => `
            <div class="medicine-card ${isListView ? 'list-item' : ''}" 
                 data-medicine-id="${medicine._id}"
                 style="animation-delay: ${index * 0.05}s">
                ${medicine.stock < 10 && medicine.stock > 0 ? 
                    '<div class="medicine-badge">Заканчивается</div>' : ''}
                ${medicine.stock === 0 ? 
                    '<div class="medicine-badge error">Нет в наличии</div>' : ''}
                
                <div class="medicine-image">
                    <img src="${medicine.image || this.getMedicineImage(medicine.category)}" alt="${medicine.name}" 
                         onerror="this.src='${this.getMedicineImage(medicine.category)}'">
                    ${medicine.stock === 0 ? '<div class="out-of-stock-overlay">Нет в наличии</div>' : ''}
                </div>
                
                <div class="medicine-content">
                    <div class="medicine-category">${this.formatCategory(medicine.category)}</div>
                    <h3 class="medicine-name">${medicine.name}</h3>
                    <div class="medicine-manufacturer">${medicine.manufacturer}</div>
                    
                    <p class="medicine-description">${medicine.description || 'Эффективный препарат для лечения и профилактики заболеваний'}</p>
                    
                    <div class="medicine-stock ${medicine.stock === 0 ? 'out-of-stock' : medicine.stock < 10 ? 'low-stock' : ''}">
                        <i class="fas fa-${medicine.stock === 0 ? 'times' : medicine.stock < 10 ? 'exclamation-triangle' : 'check'}"></i>
                        ${medicine.stock === 0 ? 'Нет в наличии' : 
                          medicine.stock < 10 ? `Осталось мало: ${medicine.stock} шт.` : 
                          `В наличии: ${medicine.stock} шт.`}
                    </div>
                    
                    <div class="medicine-footer">
                        <div class="medicine-price">${this.formatPrice(medicine.price)} ₽</div>
                        
                        <button class="btn-cart ${medicine.stock === 0 ? 'disabled' : ''}" 
                                ${medicine.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i>
                            ${medicine.stock === 0 ? 'Нет в наличии' : 'В корзину'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Анимация появления
        this.animateCards();
    }

     getMedicineImage(category, medicineName = '') {
    const categoryImages = {
        'антибиотики': 'images/антибиотики.jpg',
        'витамины': 'images/витамины.jpg',
        'обезболивающие': 'images/обезболивающие.jpg',
        'сердечно-сосудистые': 'images/сердечно-сосудистые.jpg',
        'другое': 'images/другое.jpg'
    };
        return categoryImages[category] || categoryImages['другое'];
    }

    animateCards() {
        const cards = document.querySelectorAll('.medicine-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.05}s`;
            card.style.animation = 'slideInUp 0.5s ease-out forwards';
        });
    }

    updateResultsInfo() {
        const resultsInfo = document.getElementById('resultsInfo');
        if (resultsInfo) {
            resultsInfo.style.display = 'block';
            resultsInfo.innerHTML = `
                Найдено препаратов: <strong>${this.filteredMedicines.length}</strong>
                ${this.filters.name ? ` по запросу "${this.filters.name}"` : ''}
            `;
        }
    }

    resetFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('manufacturerFilter').value = '';
        document.getElementById('priceMin').value = '';
        document.getElementById('priceMax').value = '';
        document.getElementById('inStockFilter').checked = false;
        document.getElementById('sortSelect').value = 'name_asc';

        this.filters = {
            name: '',
            category: '',
            manufacturer: '',
            priceMin: '',
            priceMax: '',
            inStock: false,
            sortBy: 'name',
            sortOrder: 'asc'
        };

        this.applyFilters();
        this.showNotification('Фильтры сброшены', 'success');
    }

    addToCart(medicine) {
        if (window.app && typeof window.app.addToCart === 'function') {
            window.app.addToCart(medicine);
            
            // Обновляем отображение запаса в каталоге
            const medicineCard = document.querySelector(`[data-medicine-id="${medicine._id}"]`);
            if (medicineCard) {
                this.updateMedicineDisplay(medicineCard, medicine._id);
            }
        } else {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingItem = cart.find(item => item._id === medicine._id);
            
            if (existingItem) {
                if (existingItem.quantity >= medicine.stock) {
                    this.showNotification(`Достигнут максимум для "${medicine.name}"`, 'warning');
                    return;
                }
                existingItem.quantity += 1;
            } else {
                cart.push({ ...medicine, quantity: 1 });
            }
            
            // Обновляем запас
            medicine.stock -= 1;
            if (medicine.stock < 0) medicine.stock = 0;
            
            localStorage.setItem('cart', JSON.stringify(cart));
            this.showNotification(`"${medicine.name}" добавлен в корзину`);
            
            // Обновляем отображение
            this.updateMedicineDisplay(document.querySelector(`[data-medicine-id="${medicine._id}"]`), medicine._id);
            window.dispatchEvent(new Event('storage'));
        }
    }

    updateMedicineDisplay(medicineCard, medicineId) {
        const medicine = this.allMedicines.find(m => m._id === medicineId);
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

    showNotification(message, type = 'success') {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }
}

// Добавляем CSS для каталога
const catalogStyles = document.createElement('style');
catalogStyles.textContent = `
    .catalog-layout {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 2rem;
        align-items: start;
    }
    
    .filters-sidebar {
        background: var(--surface);
        padding: 1.5rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        position: sticky;
        top: 140px;
    }
    
    .filter-section {
        margin-bottom: 1.5rem;
    }
    
    .filter-section h3 {
        margin-bottom: 0.75rem;
        font-size: 1rem;
        color: var(--text-dark);
    }
    
    .filter-input, .filter-select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.9rem;
        transition: var(--transition);
    }
    
    .filter-input:focus, .filter-select:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
    }
    
    .price-range {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .price-range input {
        flex: 1;
    }
    
    .price-range span {
        color: var(--text-light);
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.9rem;
    }
    
    .checkbox-label input {
        display: none;
    }
    
    .checkmark {
        width: 18px;
        height: 18px;
        border: 2px solid var(--border);
        border-radius: 4px;
        position: relative;
        transition: var(--transition);
    }
    
    .checkbox-label input:checked + .checkmark {
        background: var(--primary);
        border-color: var(--primary);
    }
    
    .checkbox-label input:checked + .checkmark::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 12px;
        font-weight: bold;
    }
    
    .filter-actions {
        display: flex;
        gap: 0.75rem;
    }
    
    .filter-actions .btn {
        flex: 1;
    }
    
    .catalog-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding: 1rem;
        background: var(--surface);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
    }
    
    .results-info {
        color: var(--text-light);
    }
    
    .sorting {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .sorting label {
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .sorting select {
        width: auto;
    }
    
    .view-toggle {
        display: flex;
        gap: 0.5rem;
    }
    
    .view-btn {
        background: var(--surface);
        border: 1px solid var(--border);
        padding: 0.5rem;
        border-radius: 6px;
        cursor: pointer;
        transition: var(--transition);
        color: var(--text-light);
    }
    
    .view-btn.active {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
    }
    
    .medicines-grid.list-view {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .medicine-card.list-item {
        display: flex;
        flex-direction: row;
        max-width: 100%;
    }
    
    .medicine-card.list-item .medicine-image {
        width: 120px;
        height: 120px;
        flex-shrink: 0;
    }
    
    .medicine-card.list-item .medicine-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1rem;
    }
    
    .medicine-card.list-item .medicine-footer {
        margin-top: auto;
    }
    
    .medicine-image {
        width: 100%;
        height: 200px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 3rem;
        position: relative;
        overflow: hidden;
    }
    
    .medicine-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .out-of-stock-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem;
        grid-column: 1 / -1;
    }
    
    @media (max-width: 968px) {
        .catalog-layout {
            grid-template-columns: 1fr;
        }
        
        .filters-sidebar {
            position: static;
        }
        
        .catalog-toolbar {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
        }
        
        .medicine-card.list-item {
            flex-direction: column;
        }
        
        .medicine-card.list-item .medicine-image {
            width: 100%;
            height: 200px;
        }
        
        .medicine-image {
            height: 150px;
        }
    }
`;

document.head.appendChild(catalogStyles);

// Инициализация каталога
const catalog = new Catalog();