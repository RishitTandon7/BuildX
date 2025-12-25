// Ultra Premium Loading Screen
class LoadingScreen {
    constructor() {
        this.loadingElement = null;
        this.minDisplayTime = 2500; // 2.5 seconds for premium experience
        this.startTime = Date.now();
        this.init();
    }

    init() {
        const loadingHTML = `
            <div class="loading-screen" id="loadingScreen">
                <div class="loading-animation">
                    <h1 class="premium-logo">BuildX</h1>
                    <div class="premium-progress-container">
                        <div class="premium-progress-bar"></div>
                    </div>
                    <div class="premium-status">Loading</div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', loadingHTML);
        this.loadingElement = document.getElementById('loadingScreen');
    }

    show() {
        if (this.loadingElement) {
            this.loadingElement.classList.remove('hidden');
            this.startTime = Date.now();
        }
    }

    hide() {
        if (!this.loadingElement) return;

        const elapsedTime = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.minDisplayTime - elapsedTime);

        setTimeout(() => {
            this.loadingElement.classList.add('hidden');
        }, remainingTime);
    }

    updateText(text) {
        const statusElement = this.loadingElement?.querySelector('.premium-status');
        if (statusElement) {
            statusElement.textContent = text;
        }
    }
}

// Initialize
window.loadingScreen = new LoadingScreen();

// Auto-hide when page loads
if (document.readyState === 'complete') {
    // Page already loaded (e.g., on refresh)
    window.loadingScreen.hide();
} else {
    // Page still loading
    window.addEventListener('load', () => {
        window.loadingScreen.hide();
    });
}

// Also hide after DOMContentLoaded as backup
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.loadingScreen.hide();
    }, 100);
});

// Failsafe: Always hide after 3 seconds no matter what
setTimeout(() => {
    if (window.loadingScreen && window.loadingScreen.loadingElement) {
        window.loadingScreen.loadingElement.classList.add('hidden');
    }
}, 3000);
