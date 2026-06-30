/* ============================================ */
/* Raj Studio Gift - JavaScript Functionality */
/* ============================================ */

(function() {
    'use strict';

    // ============================================
    // DOM Elements - Initialize after DOM ready
    // ============================================
    let preloader, navbar, navLinks, hamburger, cartSidebar, cartOverlay;
    let closeCartBtn, cartItemsContainer, cartTotalEl, checkoutBtn;
    let filterBtns, productsGrid, contactForm;
    let cart = [];
    let cartCount = 0;

    // ============================================
    // Product Data (load from localStorage or defaults)
    // ============================================
    function getDefaultProducts() {
        return [
            { id: 1, name: "Premium Cotton T-Shirt", category: "tshirt", price: 24.99, icon: "fas fa-tshirt", image: "img-tshirt.jpg", description: "100% premium cotton with vibrant print quality" },
            { id: 2, name: "Classic Polo T-Shirt", category: "tshirt", price: 29.99, icon: "fas fa-tshirt", image: "img-polo.jpg", description: "Elegant polo design for corporate events" },
            { id: 3, name: "Ceramic Coffee Mug", category: "mug", price: 12.99, icon: "fas fa-mug-hot", image: "img-mug.jpg", description: "Premium ceramic mug with custom printing" },
            { id: 4, name: "Travel Insulated Mug", category: "mug", price: 18.99, icon: "fas fa-mug-hot", image: "img-travel-mug.jpg", description: "Double-wall insulated for hot & cold drinks" },
            { id: 5, name: "Wooden Photo Frame", category: "frame", price: 15.99, icon: "fas fa-image", image: "img-frame.jpg", description: "Handcrafted wooden frame with glass cover" },
            { id: 6, name: "Acrylic Modern Frame", category: "frame", price: 19.99, icon: "fas fa-image", image: "img-acrylic-frame.jpg", description: "Sleek acrylic design for contemporary spaces" },
            { id: 7, name: "Executive Ballpoint Pen", category: "pen", price: 8.99, icon: "fas fa-pen", image: "img-pen.jpg", description: "Metal barrel with smooth writing mechanism" },
            { id: 8, name: "Fountain Pen Set", category: "pen", price: 34.99, icon: "fas fa-pen-fancy", image: "img-fountain-pen.jpg", description: "Luxury fountain pen with ink and gift box" }
        ];
    }

    function loadProducts() {
        try {
            const saved = localStorage.getItem('rajStudioGift_products');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) { /* ignore */ }
        return getDefaultProducts();
    }

    let products = loadProducts();

    async function fetchProductsFromApi() {
        try {
            const r = await fetch('/api/products');
            if (!r.ok) return;
            const data = await r.json();
            if (Array.isArray(data) && data.length > 0) {
                products = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category_key,
                    price: p.price,
                    icon: p.icon || 'fas fa-box',
                    image: p.image || '',
                    description: p.description || ''
                }));
                localStorage.setItem('rajStudioGift_products', JSON.stringify(products));
                if (typeof renderProducts === 'function') {
                    renderProducts(products);
                    if (typeof initScrollReveal === 'function') initScrollReveal();
                }
            }
        } catch (e) { /* API not available, use local data */ }
    }

    // ============================================
    // Initialize Application
    // ============================================
    function init() {
        // Get DOM elements
        preloader = document.querySelector('.preloader');
        navbar = document.querySelector('header');
        navLinks = document.querySelector('.nav-links');
        hamburger = document.querySelector('.hamburger');
        cartSidebar = document.getElementById('cartSidebar');
        cartOverlay = document.createElement('div');
        cartOverlay.className = 'cart-overlay';
        document.body.appendChild(cartOverlay);
        closeCartBtn = document.getElementById('closeCart');
        cartItemsContainer = document.getElementById('cartItems');
        cartTotalEl = document.getElementById('cartTotal');
        checkoutBtn = document.getElementById('checkoutBtn');
        filterBtns = document.querySelectorAll('.filter-btn');
        productsGrid = document.querySelector('.products-grid');
        contactForm = document.getElementById('contactForm');

        // Load cart from localStorage
        loadCart();

        // Render products
        renderProducts(products);

        // Try to load products from backend API (if server is running)
        fetchProductsFromApi();

        // Setup event listeners
        setupEventListeners();

        // Hide preloader
        setTimeout(() => {
            if (preloader) {
                preloader.classList.add('hidden');
            }
        }, 800);

        // Initialize scroll reveal
        initScrollReveal();

        // Initialize gallery lightbox
        initGalleryLightbox();

        // Close cart on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && cartSidebar.classList.contains('open')) {
                closeCart();
            }
        });

        // Handle window resize
        window.addEventListener('resize', handleResize);
    }

    // ============================================
    // Handle Window Resize
    // ============================================
    function handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768) {
            navLinks.classList.remove('open');
            hamburger.classList.remove('open');
        }
    }

    // ============================================
    // Event Listeners Setup
    // ============================================
    function setupEventListeners() {
        // Scroll event for navbar
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(function() {
                    handleScroll();
                    scrollTimeout = null;
                }, 10);
            }
        });

        // Hamburger menu
        if (hamburger) {
            hamburger.addEventListener('click', toggleMobileMenu);
        }

        // Close mobile menu on link click
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                hamburger.classList.remove('open');
            });
        });

        // Single-page navigation
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.dataset.page;
                if (page) switchPage(page);
            });
        });

        // Cart sidebar
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', closeCart);
        }
        cartOverlay.addEventListener('click', closeCart);

        // Filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', handleFilter);
        });

        // Checkout button
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', handleCheckout);
        }

        // Contact form
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactSubmit);
        }

        // Smooth scroll for anchor links (skip data-page nav links)
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                if (this.dataset.page) return;
                const href = this.getAttribute('href');
                if (href !== '#') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        const offsetTop = target.offsetTop - (window.innerWidth > 768 ? 80 : 70);
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });

        // Touch support for mobile devices
        document.addEventListener('touchstart', function() {}, {passive: true});
    }

    // ============================================
    // Scroll Handler
    // ============================================
    function handleScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    let currentPage = 'home';

    function switchPage(page) {
        currentPage = page;
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById('page-' + page);
        if (target) target.classList.add('active');
        updateActiveNavLink();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof initScrollReveal === 'function') setTimeout(initScrollReveal, 100);
    }

    function updateActiveNavLink() {
        document.querySelectorAll('.bottom-nav-link, .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === currentPage) {
                link.classList.add('active');
            }
        });
    }

    // ============================================
    // Mobile Menu Toggle
    // ============================================
    function toggleMobileMenu() {
        navLinks.classList.toggle('open');
        hamburger.classList.toggle('open');
    }

    // ============================================
    // Scroll Reveal Animation
    // ============================================
    function initScrollReveal() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe section headers
        document.querySelectorAll('.section-header').forEach(el => {
            observer.observe(el);
        });

        // Observe product cards
        document.querySelectorAll('.product-card').forEach(el => {
            observer.observe(el);
        });

        // Observe feature cards
        document.querySelectorAll('.feature-card').forEach(el => {
            observer.observe(el);
        });

        // Observe stat items
        document.querySelectorAll('.stat-item').forEach(el => {
            observer.observe(el);
        });

        // Observe option cards
        document.querySelectorAll('.option-card').forEach(el => {
            observer.observe(el);
        });

        // Observe gallery items
        document.querySelectorAll('.gallery-item').forEach(el => {
            observer.observe(el);
        });

        // Observe contact elements
        document.querySelectorAll('.info-item').forEach(el => {
            observer.observe(el);
        });

        const contactMap = document.querySelector('.contact-map');
        if (contactMap) observer.observe(contactMap);

        const contactFormEl = document.querySelector('.contact-form');
        if (contactFormEl) observer.observe(contactFormEl);
    }

    // ============================================
    // Product Rendering
    // ============================================
    function renderProducts(productsToRender) {
        if (!productsGrid) return;

        productsGrid.innerHTML = '';

        productsToRender.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.style.transitionDelay = `${index * 0.1}s`;
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <span class="product-price">₹${product.price.toFixed(2)}</span>
                    <button class="add-to-cart" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            `;
            productsGrid.appendChild(card);
        });

        // Add event listeners to Add to Cart buttons
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const productId = parseInt(this.getAttribute('data-id'));
                addToCart(productId);
            });
        });
    }

    // ============================================
    // Gallery Lightbox
    // ============================================
    function initGalleryLightbox() {
        const items = document.querySelectorAll('.gallery-item');
        if (!items.length) return;

        const lightbox = document.createElement('div');
        lightbox.className = 'gallery-lightbox';
        lightbox.innerHTML = '<button class="gallery-lightbox-close">&times;</button><img src="" alt="">';
        document.body.appendChild(lightbox);

        const lightboxImg = lightbox.querySelector('img');
        const closeBtn = lightbox.querySelector('.gallery-lightbox-close');

        items.forEach(item => {
            item.addEventListener('click', function() {
                const img = this.querySelector('img');
                if (img) {
                    lightboxImg.src = img.src;
                    lightbox.classList.add('open');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        function closeLightbox() {
            lightbox.classList.remove('open');
            document.body.style.overflow = '';
        }

        closeBtn.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', function(e) {
            if (e.target === this) closeLightbox();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
        });
    }

    // ============================================
    // Filter Handler
    // ============================================
    function handleFilter(e) {
        const filter = e.target.getAttribute('data-filter');

        // Update active button
        filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Filter products
        let filteredProducts;
        if (filter === 'all') {
            filteredProducts = products;
        } else {
            filteredProducts = products.filter(p => p.category === filter);
        }

        renderProducts(filteredProducts);
        initScrollReveal(); // Re-init for new cards
    }

    // ============================================
    // Google Sheets Config
    // ============================================
    // IMPORTANT: Replace this with your Google Apps Script Web App URL after deployment
    const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

    // ============================================
    // Save to Google Sheet
    // ============================================
    async function saveToGoogleSheet(data) {
        try {
            // Skip if using placeholder URL
            if (GOOGLE_SHEET_URL.includes('YOUR_DEPLOYMENT_ID')) {
                console.log('Google Sheets URL not configured yet. Skipping sync.');
                return;
            }

            await fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } catch (err) {
            console.warn('Failed to sync with Google Sheet:', err);
        }
    }

    // ============================================
    // Cart Functions
    // ============================================
    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }

        saveCart();
        updateCartUI();

        // Save to Google Sheet
        saveToGoogleSheet({
            timestamp: new Date().toISOString(),
            product: product.name,
            price: product.price,
            quantity: existingItem ? existingItem.quantity : 1,
            total: (existingItem ? existingItem.quantity : 1) * product.price,
            action: 'Added to Cart'
        });

        showToast(`${product.name} added to cart!`);

        // Animate button
        const btn = document.querySelector(`.add-to-cart[data-id="${productId}"]`);
        if (btn) {
            btn.classList.add('added');
            btn.innerHTML = '<i class="fas fa-check"></i> Added!';
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
            }, 1500);
        }
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        updateCartUI();
    }

    function updateQuantity(productId, change) {
        const item = cart.find(i => i.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeFromCart(productId);
            } else {
                saveCart();
                updateCartUI();
            }
        }
    }

    function updateCartUI() {
        if (!cartItemsContainer || !cartTotalEl) return;

        // Update cart count in nav (if we had one)
        cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            cartTotalEl.textContent = '₹0.00';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        if (checkoutBtn) checkoutBtn.disabled = false;

        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>₹${item.price.toFixed(2)} each</p>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button class="cart-item-remove" onclick="app.updateQuantity(${item.id}, -1)" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem;">-</button>
                        <span style="color: var(--gold); font-weight: 600;">${item.quantity}</span>
                        <button class="cart-item-remove" onclick="app.updateQuantity(${item.id}, 1)" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem;">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="app.removeFromCart(${item.id})" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalEl.textContent = `₹${total.toFixed(2)}`;
    }

    function openCart() {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    function toggleCart() {
        if (cartSidebar.classList.contains('open')) {
            closeCart();
        } else {
            openCart();
        }
    }

    function handleCheckout() {
        if (cart.length === 0) return;

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const email = prompt('Enter your Gmail to place the order:', '');
        if (!email) return;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address!', true);
            return;
        }

        const orderData = {
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity
            })),
            total: total,
            customer_email: email
        };

        fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        }).then(r => r.json()).then(data => {
            if (data.success) {
                cart.forEach(item => {
                    saveToGoogleSheet({
                        timestamp: new Date().toISOString(),
                        product: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        total: item.price * item.quantity,
                        email: email,
                        action: 'Ordered'
                    });
                });

                cart = [];
                saveCart();
                updateCartUI();
                closeCart();
                showToast('Order placed successfully! We\'ll contact you at ' + email);
            }
        }).catch(() => {
            showToast('Server not reachable. Please try again.', true);
        });
    }

    // ============================================
    // Contact Form Handler
    // ============================================
    function handleContactSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!name || !email || !message) {
            showToast('Please fill in all required fields!', true);
            return;
        }

        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address!', true);
            return;
        }

        // Simulate form submission
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            contactForm.reset();
            showToast('Message sent successfully! We\'ll get back to you soon.');
        }, 1500);
    }

    // ============================================
    // Toast Notification
    // ============================================
    function showToast(message, isError = false) {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        if (isError) {
            toast.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a52)';
        }
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // ============================================
    // Cart Persistence
    // ============================================
    function saveCart() {
        try {
            localStorage.setItem('rajStudioGift_cart', JSON.stringify(cart));
        } catch (e) {
            console.warn('Could not save cart to localStorage');
        }
    }

    function loadCart() {
        try {
            const saved = localStorage.getItem('rajStudioGift_cart');
            if (saved) {
                cart = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Could not load cart from localStorage');
            cart = [];
        }
    }

    // ============================================
    // Ripple Effect for Buttons
    // ============================================
    function createRipple(event) {
        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
        circle.classList.add('ripple');

        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);
    }

    // Add ripple to buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-primary, .btn-secondary, .btn-outline, .add-to-cart')) {
            createRipple(e);
        }
    });

    // ============================================
    // Public API for inline handlers
    // ============================================
    window.app = {
        removeFromCart: removeFromCart,
        updateQuantity: updateQuantity,
        toggleCart: toggleCart
    };

    // ============================================
    // Initialize on DOM ready
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();