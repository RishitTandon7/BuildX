// ===================================
// THEME MANAGEMENT
// ===================================
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Load saved theme or default to light
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);

themeToggle?.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// ===================================
// NAVIGATION SCROLL EFFECT
// ===================================
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar?.classList.add('scrolled');
    } else {
        navbar?.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// ===================================
// MOBILE MENU
// ===================================
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navLinks = document.querySelector('.nav-links');

mobileMenuToggle?.addEventListener('click', () => {
    mobileMenuToggle.classList.toggle('active');
    navLinks?.classList.toggle('active');
});

// ===================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);

        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ===================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all service cards and steps
document.querySelectorAll('.service-card, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// ===================================
// ACTIVE NAV LINK HIGHLIGHTING
// ===================================
const sections = document.querySelectorAll('section[id]');
const navLinksAll = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinksAll.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ===================================
// HERO 3D PREVIEW PLACEHOLDER
// ===================================
const heroPreview = document.getElementById('heroPreview');

if (heroPreview) {
    // Create a simple animated placeholder
    const canvas = document.createElement('canvas');
    canvas.width = heroPreview.clientWidth;
    canvas.height = heroPreview.clientHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    heroPreview.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let rotation = 0;

    function drawCube() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const size = 80;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);

        // Draw cube wireframe
        const gradient = ctx.createLinearGradient(-size, -size, size, size);
        gradient.addColorStop(0, '#4F46E5');
        gradient.addColorStop(1, '#7C3AED');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;

        // Front face
        ctx.strokeRect(-size / 2, -size / 2, size, size);

        // Back face (offset)
        const offset = 40;
        ctx.strokeRect(-size / 2 + offset, -size / 2 - offset, size, size);

        // Connecting lines
        ctx.beginPath();
        ctx.moveTo(-size / 2, -size / 2);
        ctx.lineTo(-size / 2 + offset, -size / 2 - offset);
        ctx.moveTo(size / 2, -size / 2);
        ctx.lineTo(size / 2 + offset, -size / 2 - offset);
        ctx.moveTo(-size / 2, size / 2);
        ctx.lineTo(-size / 2 + offset, size / 2 - offset);
        ctx.moveTo(size / 2, size / 2);
        ctx.lineTo(size / 2 + offset, size / 2 - offset);
        ctx.stroke();

        ctx.restore();

        rotation += 0.01;
        requestAnimationFrame(drawCube);
    }

    drawCube();
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Debounce function for performance
function debounce(func, wait) {
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

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Format currency
function formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatFileSize,
        formatCurrency,
        debounce
    };
}
