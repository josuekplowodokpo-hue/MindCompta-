// ******************************************************
// Logique JavaScript partagée pour toutes les pages
// Gère l'ouverture/fermeture du menu mobile, la soumission du formulaire de contact,
// et la largeur dynamique du carrousel d'images.
// ******************************************************

document.addEventListener('DOMContentLoaded', function() {
    // ------------------------------------------
    // 1. GESTION DU MENU MOBILE
    // ------------------------------------------
    const menuButton = document.getElementById('menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            // Bascule la classe 'hidden' pour afficher/cacher le menu mobile
            mobileMenu.classList.toggle('hidden');
        });
    }

    // ------------------------------------------
    // 2. GESTION DU FORMULAIRE DE CONTACT (non-redirectionnel)
    // ------------------------------------------
    const form = document.getElementById('contactForm');
    const formMessages = document.getElementById('form-messages');
    const submitButton = document.getElementById('submitButton');

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Masquer les messages précédents et réinitialiser les styles
            formMessages.classList.add('hidden');
            formMessages.classList.remove('bg-green-100', 'text-green-800', 'border-green-300', 'bg-red-100', 'text-red-800', 'border-red-300');
            
            // Désactiver le bouton d'envoi pendant le processus
            submitButton.disabled = true;
            submitButton.textContent = 'Envoi en cours...';

            // Endpoint Formspree (Identifiant de votre formulaire)
            const endpoint = "https://formspree.io/f/mgvgleko";
            const formData = new FormData(form);

            // Convertir FormData en objet JSON pour une soumission AJAX fiable
            const data = {};
            formData.forEach((value, key) => data[key] = value);

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    // Envoyer les données au format JSON
                    body: JSON.stringify(data), 
                    headers: {
                        'Accept': 'application/json',
                        // Définir le Content-Type pour que Formspree traite le JSON
                        'Content-Type': 'application/json' 
                    }
                });

                if (response.ok) {
                    formMessages.textContent = "Merci ! Votre message a été envoyé avec succès.";
                    formMessages.classList.add('bg-green-100', 'text-green-800', 'border', 'border-green-300');
                    form.reset(); // Effacer le formulaire après succès
                } else {
                    // Tente de récupérer l'erreur de la réponse Formspree
                    const responseData = await response.json();
                    let errorMessage = responseData.error || "Oups! Il y a eu un problème lors de l'envoi de votre message. Vérifiez l'adresse email.";
                    
                    formMessages.textContent = errorMessage;
                    formMessages.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-300');
                }
            } catch (error) {
                console.error('Erreur de soumission du formulaire:', error);
                formMessages.textContent = "Erreur de connexion. Veuillez réessayer plus tard.";
                formMessages.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-300');
            } finally {
                // Rendre le message visible et réactiver le bouton
                formMessages.classList.remove('hidden');
                submitButton.disabled = false;
                submitButton.textContent = 'Envoyer le Message';
            }
        });
    }

    // ------------------------------------------
    // 3. FIX DU CAROUSEL D'IMAGES (Définition de la largeur dynamique)
    // ------------------------------------------
    const scrollContent = document.querySelector('.image-scroll-content');
    
    // Cette fonction est appelée au chargement et au redimensionnement
    function setScrollContentWidth() {
        if (!scrollContent) return;

        // Récupérer tous les enfants (images) de la première moitié du contenu
        // Puisque nous avons deux groupes d'images dupliquées dans le HTML, 
        // nous ne mesurons que le premier groupe (les 5 premières images).
        const images = scrollContent.querySelectorAll('img');
        
        let totalWidth = 0;
        
        // Mesurer la largeur des 5 premières images (le set original)
        for (let i = 0; i < 5 && i < images.length; i++) {
            // Utiliser offsetWidth pour inclure la bordure/padding si nécessaire, mais surtout la marge droite.
            // La marge droite est de 1.5rem (24px)
            const imageWidth = images[i].offsetWidth;
            const marginRight = 24; // 1.5rem Tailwind margin
            totalWidth += imageWidth + marginRight;
        }

        // Il faut s'assurer que l'élément .image-scroll-content soit deux fois
        // plus large que le contenu visible (totalWidth * 2) pour l'effet de boucle.
        // On définit la largeur du conteneur en pixels pour que l'animation CSS fonctionne correctement.
        scrollContent.style.width = `${totalWidth * 2}px`;
    }

    if (scrollContent) {
        setScrollContentWidth();
        window.addEventListener('resize', setScrollContentWidth);
    }
});