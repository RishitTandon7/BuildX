// Reliable loading screen with minimum display time
(function () {
    const MIN_DISPLAY_TIME = 2500; // Minimum 2.5 seconds
    const startTime = Date.now();

    function hideLoading() {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime);

        setTimeout(() => {
            const loadingElement = document.getElementById('loadingScreen');
            const mainContent = document.getElementById('mainContent');

            if (loadingElement) {
                // Add hidden class to trigger CSS fade out
                loadingElement.style.opacity = '0';

                // Show main content
                if (mainContent) {
                    mainContent.classList.add('visible-content');
                }

                // Restore scrolling
                document.body.style.overflow = '';

                // Remove from DOM after transition completes (0.5s)
                setTimeout(() => {
                    loadingElement.remove();
                }, 500);
            }
        }, remainingTime);
    }

    // Check if page is already loaded (e.g. from cache)
    if (document.readyState === 'complete') {
        hideLoading();
    } else {
        window.addEventListener('load', hideLoading);
    }

    // Failsafe: Force hide after 5 seconds just in case
    setTimeout(() => {
        const loadingElement = document.getElementById('loadingScreen');
        if (loadingElement && document.body.contains(loadingElement)) {
            hideLoading();
        }
    }, 5000);
})();
