// Track the install prompt event
let deferredPrompt;
let installButton = document.getElementById('install-btn');

// Show install button when PWA can be installed
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show and animate the install button
    if (installButton) {
        installButton.classList.remove('hidden');
        installButton.classList.add('pulse');
        
        // Hide after 30 seconds if not clicked
        setTimeout(() => {
            if (installButton && !installButton.classList.contains('clicked')) {
                installButton.classList.remove('pulse');
                installButton.classList.add('hidden');
            }
        }, 30000);
    }
});

// Handle install button click
if (installButton) {
    installButton.addEventListener('click', (e) => {
        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Track the user's choice
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                // Track in analytics if needed
                installButton.classList.add('clicked');
                installButton.innerHTML = '<i class="fas fa-check"></i> Installed!';
                setTimeout(() => {
                    installButton.classList.remove('pulse');
                    installButton.classList.add('hidden');
                }, 2000);
            } else {
                console.log('User dismissed the install prompt');
                // You might want to show the button again later
                setTimeout(() => {
                    installButton.classList.remove('pulse');
                    installButton.classList.add('hidden');
                }, 1000);
            }
            deferredPrompt = null;
        });
    });
}

// Hide install button when app is already installed
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    if (installButton) {
        installButton.classList.remove('pulse');
        installButton.classList.add('hidden');
    }
});

// Check if running as PWA and hide button if so
if (window.matchMedia('(display-mode: standalone)').matches) {
    if (installButton) {
        installButton.classList.add('hidden');
    }
}
