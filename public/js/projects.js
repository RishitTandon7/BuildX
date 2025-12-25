const products = [
    // Hardware
    {
        id: 1,
        name: "IoT Home Automation Kit",
        type: "hardware",
        price: 2499,
        description: "Control lights and fans via WiFi using ESP8266. Includes 4-channel relay module.",
        image: "iot-home.jpg"
    },
    {
        id: 2,
        name: "Line Follower Robot",
        type: "hardware",
        price: 1899,
        description: "Complete chassis, motors, wheels, and IR sensors. Pre-programmed Arduino Uno included.",
        image: "line-robot.jpg"
    },
    {
        id: 3,
        name: "Smart Dustbin (Ultrasonic)",
        type: "hardware",
        price: 1299,
        description: "Automatic lid opening using ultrasonic sensor and servo motor.",
        image: "smart-dustbin.jpg"
    },
    {
        id: 4,
        name: "Obstacle Avoidance Car",
        type: "hardware",
        price: 2199,
        description: "Autonomous robot that avoids obstacles. Great for beginners.",
        image: "obs-car.jpg"
    },

    // Software
    {
        id: 5,
        name: "Library Management System",
        type: "software",
        price: 999,
        description: "Full stack web application (MERN/PHP) with admin dashboard and student login.",
        image: "lib-sys.jpg"
    },
    {
        id: 6,
        name: "Face Recognition Attendance",
        type: "software",
        price: 1499,
        description: "Python OpenCV based attendance system with Excel export.",
        image: "face-rec.jpg"
    },
    {
        id: 7,
        name: "E-Commerce Web App",
        type: "software",
        price: 1999,
        description: "Complete shopping site with cart, payment gateway integration code, and admin panel.",
        image: "e-com.jpg"
    },
    {
        id: 8,
        name: "Hospital Management System",
        type: "software",
        price: 1299,
        description: "Patient records, doctor appointment scheduling, and billing system.",
        image: "hosp-sys.jpg"
    }
];

let cart = JSON.parse(localStorage.getItem('buildx_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    renderProducts('all');
    updateCartUI();

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter logic
            renderProducts(btn.dataset.filter);
        });
    });

    // Cart Modal
    const modal = document.getElementById('cartModal');
    const floatCart = document.getElementById('floatingCart');
    const closeCart = document.getElementById('closeCart');

    floatCart.addEventListener('click', () => {
        modal.classList.add('open');
        renderCartItems();
    });

    closeCart.addEventListener('click', () => {
        modal.classList.remove('open');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });
});

function renderProducts(filter) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    const filtered = filter === 'all' ? products : products.filter(p => p.type === filter);

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" stroke-width="1">
                    ${product.type === 'hardware'
                ? '<rect x="2" y="2" width="20" height="20" rx="2"></rect><circle cx="12" cy="12" r="4"></circle>'
                : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>'}
                </svg>
                <div class="product-type-badge">${product.type === 'hardware' ? 'Hardware' : 'Software'}</div>
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price">₹${product.price}</div>
                    <button class="btn-cart" onclick="addToCart(${product.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    cart.push(product);
    localStorage.setItem('buildx_cart', JSON.stringify(cart));
    updateCartUI();

    // Visual feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Added!';
    btn.style.background = 'var(--color-primary)';
    btn.style.color = 'white';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
    }, 1000);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('buildx_cart', JSON.stringify(cart));
    updateCartUI();
    renderCartItems();
}

function updateCartUI() {
    const count = document.getElementById('cartCount');
    const total = document.getElementById('cartTotal');
    const floatCart = document.getElementById('floatingCart');

    count.textContent = cart.length;

    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    total.textContent = '₹' + totalPrice;

    if (cart.length > 0) {
        floatCart.classList.add('visible');
    } else {
        floatCart.classList.remove('visible');
    }
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    const modalTotal = document.getElementById('modalTotal');

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); margin-top: 2rem;">Your cart is empty.</p>';
        modalTotal.textContent = '₹0';
        return;
    }

    container.innerHTML = '';
    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <div style="font-weight: 600;">${item.name}</div>
                <div style="font-size: 0.85rem; color: var(--color-text-secondary);">${item.type.toUpperCase()}</div>
                <div style="font-weight: 600; color: var(--color-primary);">₹${item.price}</div>
            </div>
            <button onclick="removeFromCart(${index})" style="color: #ef4444; padding: 0.5rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;
        container.appendChild(div);
    });

    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    modalTotal.textContent = '₹' + totalPrice;
}
