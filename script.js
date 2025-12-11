// ******************************************************
// Logique JavaScript partagée pour toutes les pages
// Gère l'ouverture/fermeture du menu mobile et la soumission du formulaire de contact
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

            // CORRECTION: Convertir FormData en objet JSON pour une soumission AJAX fiable
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
});