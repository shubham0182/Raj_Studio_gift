(function() {
    'use strict';

    const API = window.location.origin + '/api';
    let token = sessionStorage.getItem('rajStudioGift_token');
    let categories = [];
    let products = [];
    let nextId = 1;
    let confirmCallback = null;

    function apiHeaders(method, body) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return { method, headers, body: body ? JSON.stringify(body) : undefined };
    }

    async function apiGet(path) {
        const r = await fetch(API + path, apiHeaders('GET'));
        if (r.status === 401 && token) { token = null; sessionStorage.removeItem('rajStudioGift_token'); }
        return r.json();
    }

    async function apiPost(path, data) {
        const r = await fetch(API + path, apiHeaders('POST', data));
        if (r.status === 401 && token) { token = null; sessionStorage.removeItem('rajStudioGift_token'); }
        return r.json();
    }

    async function apiPut(path, data) {
        const r = await fetch(API + path, apiHeaders('PUT', data));
        if (r.status === 401 && token) { token = null; sessionStorage.removeItem('rajStudioGift_token'); }
        return r.json();
    }

    async function apiDelete(path) {
        const r = await fetch(API + path, apiHeaders('DELETE'));
        if (r.status === 401 && token) { token = null; sessionStorage.removeItem('rajStudioGift_token'); }
        return r.json();
    }

    function showToast(message, type) {
        type = type || 'success';
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast-notif toast-' + type;
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle' };
        toast.innerHTML = '<i class="fas ' + (icons[type] || 'fa-info-circle') + '"></i> ' + message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function showConfirm(title, message, callback) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        confirmCallback = callback;
        document.getElementById('confirmModal').style.display = 'flex';
    }

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
        return r + ',' + g + ',' + b;
    }

    document.addEventListener('DOMContentLoaded', function() {
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('logoutBtn');
        const adminLogin = document.getElementById('adminLogin');
        const adminDashboard = document.getElementById('adminDashboard');
        const loginError = document.getElementById('loginError');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const adminSidebar = document.getElementById('adminSidebar');
        const navItems = document.querySelectorAll('.admin-nav-item');
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        const addProductBtn = document.getElementById('addProductBtn');
        const categoryModal = document.getElementById('categoryModal');
        const productModal = document.getElementById('productModal');
        const confirmModal = document.getElementById('confirmModal');
        const catClose = document.getElementById('categoryModalClose');
        const prodClose = document.getElementById('productModalClose');
        const confClose = document.getElementById('confirmModalClose');
        const categoryForm = document.getElementById('categoryForm');
        const productForm = document.getElementById('productForm');
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const productImageInput = document.getElementById('productImage');
        const previewImg = document.getElementById('previewImg');
        const previewPlaceholder = document.getElementById('previewPlaceholder');
        const productSearch = document.getElementById('productSearch');

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                categoryModal.style.display = 'none';
                productModal.style.display = 'none';
                confirmModal.style.display = 'none';
            }
        });

        if (token) {
            apiGet('/auth/me').then(user => {
                if (user.username) {
                    adminLogin.style.display = 'none';
                    adminDashboard.style.display = 'block';
                    loadAndRender();
                } else {
                    token = null;
                    sessionStorage.removeItem('rajStudioGift_token');
                }
            }).catch(() => {
                token = null;
                sessionStorage.removeItem('rajStudioGift_token');
            });
        }

        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            apiPost('/auth/login', { username, password }).then(data => {
                if (data.token) {
                    token = data.token;
                    sessionStorage.setItem('rajStudioGift_token', token);
                    adminLogin.style.display = 'none';
                    adminDashboard.style.display = 'block';
                    loadAndRender();
                } else {
                    loginError.textContent = data.error || 'Login failed';
                    loginError.style.animation = 'none';
                    setTimeout(() => loginError.style.animation = 'shake 0.4s ease', 10);
                }
            }).catch(() => {
                loginError.textContent = 'Server unreachable. Start the backend with: cd backend && npm start';
            });
        });

        logoutBtn.addEventListener('click', function() {
            token = null;
            sessionStorage.removeItem('rajStudioGift_token');
            adminLogin.style.display = 'flex';
            adminDashboard.style.display = 'none';
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            loginError.textContent = '';
        });

        sidebarToggle.addEventListener('click', function() {
            adminSidebar.classList.toggle('collapsed');
        });

        navItems.forEach(function(item) {
            item.addEventListener('click', function() {
                navItems.forEach(n => n.classList.remove('active'));
                this.classList.add('active');
                const tab = this.dataset.tab;
                document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
                const panel = document.getElementById('panel' + tab.charAt(0).toUpperCase() + tab.slice(1));
                if (panel) panel.classList.add('active');
                if (window.innerWidth <= 768) adminSidebar.classList.add('collapsed');
            });
        });

        addCategoryBtn.addEventListener('click', () => openCategoryModal(-1));
        catClose.addEventListener('click', () => categoryModal.style.display = 'none');
        categoryModal.addEventListener('click', function(e) { if (e.target === this) this.style.display = 'none'; });
        categoryModal.querySelectorAll('.modal-cancel-btn').forEach(b => {
            b.addEventListener('click', () => categoryModal.style.display = 'none');
        });

        categoryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const key = document.getElementById('categoryKey').value.trim();
            const label = document.getElementById('categoryLabel').value.trim();
            const icon = document.getElementById('categoryIcon').value.trim();
            const editIndex = document.getElementById('editCategoryIndex').value;

            if (editIndex) {
                const oldKey = categories[parseInt(editIndex)].key_id;
                await apiPut('/categories/' + oldKey, { label, icon });
                showToast('Category updated');
            } else {
                await apiPost('/categories', { key_id: key, label, icon });
                showToast('Category added');
            }
            await loadAndRender();
            categoryModal.style.display = 'none';
        });

        addProductBtn.addEventListener('click', () => openProductModal(-1));
        prodClose.addEventListener('click', () => productModal.style.display = 'none');
        productModal.addEventListener('click', function(e) { if (e.target === this) this.style.display = 'none'; });
        productModal.querySelectorAll('.modal-cancel-btn').forEach(b => {
            b.addEventListener('click', () => productModal.style.display = 'none');
        });

        productImageInput.addEventListener('input', function() {
            updateImagePreview(this.value);
        });

        productForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('productName').value.trim();
            const category_key = document.getElementById('productCategory').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const image = document.getElementById('productImage').value.trim();
            const description = document.getElementById('productDescription').value.trim();
            const editId = document.getElementById('editProductId').value;

            const catObj = categories.find(c => c.key_id === category_key);
            const icon = catObj ? catObj.icon : 'fas fa-box';

            if (editId) {
                await apiPut('/products/' + editId, { name, category_key, price, image, icon, description });
                showToast('Product updated');
            } else {
                await apiPost('/products', { name, category_key, price, image, icon, description });
                showToast('Product added');
            }
            await loadAndRender();
            productModal.style.display = 'none';
        });

        confClose.addEventListener('click', () => confirmModal.style.display = 'none');
        confirmModal.addEventListener('click', function(e) { if (e.target === this) this.style.display = 'none'; });
        confirmCancelBtn.addEventListener('click', () => confirmModal.style.display = 'none');
        confirmDeleteBtn.addEventListener('click', function() {
            if (confirmCallback) confirmCallback();
            confirmCallback = null;
            confirmModal.style.display = 'none';
        });

        productSearch.addEventListener('input', function() {
            renderProducts(this.value);
        });
    });

    function updateImagePreview(src) {
        const img = document.getElementById('previewImg');
        const placeholder = document.getElementById('previewPlaceholder');
        if (src) {
            img.src = src;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            img.onerror = function() {
                img.style.display = 'none';
                placeholder.style.display = 'flex';
                placeholder.querySelector('p').textContent = 'Image not found';
            };
        } else {
            img.style.display = 'none';
            placeholder.style.display = 'flex';
            placeholder.querySelector('p').textContent = 'Image preview will appear here';
        }
    }

    function openCategoryModal(index) {
        document.getElementById('editCategoryIndex').value = index !== -1 ? index : '';
        if (index !== -1) {
            const c = categories[index];
            document.getElementById('categoryKey').value = c.key_id;
            document.getElementById('categoryLabel').value = c.label;
            document.getElementById('categoryIcon').value = c.icon;
        } else {
            document.getElementById('categoryKey').value = '';
            document.getElementById('categoryLabel').value = '';
            document.getElementById('categoryIcon').value = '';
        }
        document.getElementById('categoryModalTitle').textContent = index !== -1 ? 'Edit Category' : 'Add Category';
        document.getElementById('categoryModal').style.display = 'flex';
    }

    function openProductModal(id) {
        const p = id !== -1 ? products.find(x => x.id === id) : null;
        document.getElementById('editProductId').value = p ? p.id : '';
        document.getElementById('productName').value = p ? p.name : '';
        document.getElementById('productCategory').value = p ? p.category_key : '';
        document.getElementById('productPrice').value = p ? p.price : '';
        document.getElementById('productImage').value = p ? p.image : '';
        document.getElementById('productDescription').value = p ? p.description : '';
        document.getElementById('productModalTitle').textContent = p ? 'Edit Product' : 'Add Product';
        updateImagePreview(p ? p.image : '');
        document.getElementById('productModal').style.display = 'flex';
    }

    function populateCategorySelect() {
        const select = document.getElementById('productCategory');
        select.innerHTML = '';
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.key_id;
            opt.textContent = c.label;
            select.appendChild(opt);
        });
    }

    async function loadAndRender() {
        try {
            const [cats, prods, stats] = await Promise.all([
                apiGet('/categories'),
                apiGet('/products'),
                apiGet('/stats')
            ]);
            categories = Array.isArray(cats) ? cats : [];
            products = Array.isArray(prods) ? prods : [];
            renderStats(stats);
            renderCategories();
            renderProducts();
            renderOrders();
            populateCategorySelect();
        } catch (e) {
            showToast('Failed to load data from server', 'error');
        }
    }

    function renderStats(stats) {
        const container = document.getElementById('statsCards');
        if (!container) return;
        const cards = [
            { icon: 'fa-box', label: 'Total Products', value: stats.productCount, color: '#f5c542' },
            { icon: 'fa-tags', label: 'Categories', value: stats.categoryCount, color: '#4db8ff' },
            { icon: 'fa-shopping-bag', label: 'Orders', value: stats.orderCount, color: '#6fcf97' },
            { icon: 'fa-rupee-sign', label: 'Revenue', value: '₹' + parseFloat(stats.totalRevenue || 0).toFixed(2), color: '#f5c542' }
        ];
        container.innerHTML = '';
        cards.forEach(card => {
            const div = document.createElement('div');
            div.className = 'stat-card';
            div.innerHTML = '<div class="stat-card-icon" style="background:rgba(' + hexToRgb(card.color) + ',0.15);color:' + card.color + '"><i class="fas ' + card.icon + '"></i></div><div class="stat-card-info"><span class="stat-card-value">' + card.value + '</span><span class="stat-card-label">' + card.label + '</span></div>';
            container.appendChild(div);
        });
    }

    function renderCategories() {
        const tbody = document.getElementById('categoriesTableBody');
        const empty = document.getElementById('categoriesEmpty');
        tbody.innerHTML = '';
        if (!categories.length) { empty.style.display = 'block'; return; }
        empty.style.display = 'none';

        categories.forEach((cat, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td style="text-align:center;font-size:1.3rem;color:var(--gold);"><i class="' + cat.icon + '"></i></td><td><code>' + cat.key_id + '</code></td><td>' + cat.label + '</td><td><div class="action-cell"><button class="action-btn edit-btn" data-index="' + index + '" title="Edit"><i class="fas fa-pen"></i></button><button class="action-btn delete-btn" data-index="' + index + '" title="Delete"><i class="fas fa-trash"></i></button></div></td>';
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() { openCategoryModal(parseInt(this.dataset.index)); });
        });
        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                const cat = categories[index];
                showConfirm('Delete Category', 'Delete "' + cat.label + '"? All products in this category will also be removed.', async function() {
                    await apiDelete('/categories/' + cat.key_id);
                    showToast('Category deleted');
                    await loadAndRender();
                });
            });
        });
    }

    function renderProducts(searchTerm) {
        searchTerm = searchTerm || '';
        const tbody = document.getElementById('productsTableBody');
        const empty = document.getElementById('productsEmpty');
        tbody.innerHTML = '';

        const filtered = products.filter(p =>
            !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (!filtered.length) { empty.style.display = 'block'; return; }
        empty.style.display = 'none';

        filtered.forEach(p => {
            const catLabel = categories.find(c => c.key_id === p.category_key);
            const tr = document.createElement('tr');
            tr.innerHTML = '<td style="font-weight:600;">' + p.id + '</td><td><img src="' + p.image + '" alt="' + p.name + '" class="admin-thumb" onerror="this.style.display=\'none\'"></td><td><strong>' + p.name + '</strong></td><td><span class="cat-badge">' + (catLabel ? catLabel.label : p.category_key) + '</span></td><td style="color:var(--gold);font-weight:600;">₹' + parseFloat(p.price).toFixed(2) + '</td><td class="desc-cell">' + (p.description || '') + '</td><td><div class="action-cell"><button class="action-btn edit-btn" data-id="' + p.id + '" title="Edit"><i class="fas fa-pen"></i></button><button class="action-btn delete-btn" data-id="' + p.id + '" title="Delete"><i class="fas fa-trash"></i></button></div></td>';
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() { openProductModal(parseInt(this.dataset.id)); });
        });
        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                const p = products.find(x => x.id === id);
                showConfirm('Delete Product', 'Delete "' + p.name + '"?', async function() {
                    await apiDelete('/products/' + id);
                    showToast('Product deleted');
                    await loadAndRender();
                });
            });
        });
    }

    function renderOrders() {
        const tbody = document.getElementById('ordersTableBody');
        const empty = document.getElementById('ordersEmpty');
        if (!tbody) return;

        apiGet('/orders').then(orders => {
            tbody.innerHTML = '';
            if (!orders || !orders.length) { empty.style.display = 'block'; return; }
            empty.style.display = 'none';

            orders.forEach((order, oi) => {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                const itemsHtml = items.map(item =>
                    '<span class="order-item"><img src="' + (item.image || '') + '" onerror="this.style.display=\'none\'"> ' + (item.name || '') + ' x' + (item.quantity || 1) + '</span>'
                ).join('');
                const tr = document.createElement('tr');
                tr.innerHTML = '<td style="font-weight:600;">#' + (oi + 1) + '</td><td class="order-items-cell">' + itemsHtml + '</td><td>₹' + parseFloat(order.total).toFixed(2) + '</td><td><span class="order-status delivered">' + (order.status || 'Delivered') + '</span></td>';
                tbody.appendChild(tr);
            });
        }).catch(() => {
            empty.style.display = 'block';
        });
    }
})();
