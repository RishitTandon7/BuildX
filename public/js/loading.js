// Simple, reliable loading screen
(function () {
    // Create loading screen immediately
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

    // Insert at the very beginning of body
    document.body.insertAdjacentHTML('afterbegin', loadingHTML);

    // Function to hide loading screen
    function hideLoading() {
        const loadingElement = document.getElementById('loadingScreen');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
            // Remove from DOM after animation
            setTimeout(() => {
                loadingElement.remove();
            }, 1000);
        }
    }

    // Hide on page load
    window.addEventListener('load', hideLoading);

    // Failsafe: Always hide after 2.5 seconds
    setTimeout(hideLoading, 2500);
})();
