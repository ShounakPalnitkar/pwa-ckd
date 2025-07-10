// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
                
                // Check for updates periodically
                setInterval(() => {
                    registration.update().catch(err => {
                        console.log('Service Worker update check failed:', err);
                    });
                }, 60 * 60 * 1000); // Check every hour
                
                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(err => {
                console.error('Service Worker registration failed:', err);
            });
    }
}

// Show update notification
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <p>New version available!</p>
        <button id="refresh-btn">Refresh</button>
    `;
    document.body.appendChild(notification);
    
    document.getElementById('refresh-btn').addEventListener('click', () => {
        window.location.reload();
    });
}

// Handle PWA installation
function setupInstallPrompt() {
    let deferredPrompt;
    const installButton = document.getElementById('install-btn');
    
    if (!installButton) return;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButton.style.display = 'block';
        
        installButton.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(choiceResult => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted install');
                        installButton.style.display = 'none';
                        // Track installation in analytics if needed
                    }
                    deferredPrompt = null;
                });
            }
        });
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('App installed successfully');
        if (installButton) installButton.style.display = 'none';
    });
}

// Initialize PWA features
function initPWA() {
    registerServiceWorker();
    setupInstallPrompt();
    
    // Detect standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        document.body.classList.add('pwa-mode');
    }
    
    // Detect if launched from home screen
    if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Launched from home screen');
    }
}

// Start PWA features when DOM is loaded
document.addEventListener('DOMContentLoaded', initPWA);
