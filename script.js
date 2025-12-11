// 
// Fichier JavaScript global pour les fonctionnalités partagées du site.
//

document.addEventListener('DOMContentLoaded', function() {
    // 1. Logique du Menu Mobile (Hamburger)
    const menuButton = document.getElementById('menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
        
        // Cacher le menu mobile si l'utilisateur redimensionne l'écran
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 640) { // sm: breakpoint in Tailwind
                mobileMenu.classList.add('hidden');
            }
        });
    }

    // Ajoutez ici toute autre logique JS partagée par toutes les pages.
});

