// ******************************************************
// Logique JavaScript partagée pour toutes les pages
// Gère l'ouverture/fermeture du menu mobile, la soumission du formulaire de contact,
// et l'animation du carrousel d'images.
// ******************************************************

document.addEventListener('DOMContentLoaded', function() {
    // ------------------------------------------
    // 1. GESTION DU MENU MOBILE
    // ------------------------------------------
    const menuButton = document.getElementById('menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            // Toggles the 'hidden' class to show/hide the mobile menu
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
            
            // Hide previous messages and reset styles
            formMessages.classList.add('hidden');
            formMessages.classList.remove('bg-green-100', 'text-green-800', 'border-green-300', 'bg-red-100', 'text-red-800', 'border-red-300');
            
            // Disable submit button during the process
            submitButton.disabled = true;
            submitButton.textContent = 'Envoi en cours...';

            // Formspree Endpoint (Your form ID)
            const endpoint = "https://formspree.io/f/mgvgleko";
            const formData = new FormData(form);

            // Convert FormData to JSON object for reliable AJAX submission
            const data = {};
            formData.forEach((value, key) => data[key] = value);

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    // Send data in JSON format
                    body: JSON.stringify(data), 
                    headers: {
                        'Accept': 'application/json',
                        // Set Content-Type for Formspree to process JSON
                        'Content-Type': 'application/json' 
                    }
                });

                if (response.ok) {
                    formMessages.textContent = "Merci ! Votre message a été envoyé avec succès.";
                    formMessages.classList.add('bg-green-100', 'text-green-800', 'border', 'border-green-300');
                    form.reset(); // Clear the form after success
                } else {
                    // Try to retrieve the error from the Formspree response
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
                // Make the message visible and re-enable the button
                formMessages.classList.remove('hidden');
                submitButton.disabled = false;
                submitButton.textContent = 'Envoyer le Message';
            }
        });
    }

    // ------------------------------------------
    // 3. CAROUSEL D'IMAGES À DÉFILEMENT INFINI (FIX AVEC JS)
    // ------------------------------------------
    const scrollContent = document.querySelector('.image-scroll-content');
    
    if (scrollContent) {
        const imageWidth = 300; // Fixed image width (from CSS)
        const imageMargin = 24; // Fixed margin (1.5rem = 24px)
        const numOriginalImages = 7; // Number of images in the original set

        // Calculate the total width of the original set (W_original)
        const originalContentWidth = (imageWidth * numOriginalImages) + (imageMargin * (numOriginalImages - 1));

        // The scroll content container must be twice the width of the original set
        const totalScrollWidth = originalContentWidth * 2;
        scrollContent.style.width = `${totalScrollWidth}px`;

        let currentPosition = 0;
        const scrollSpeed = 0.5; // Pixels per frame (slower/faster scroll)
        let isPaused = false;

        // Function to animate the scroll
        function animateScroll() {
            if (!isPaused) {
                // Move current position to the left
                currentPosition -= scrollSpeed; 

                // Check for infinite loop condition:
                // If we scroll past the end of the first set (W_original),
                // reset the position back to 0 to simulate seamless loop.
                if (Math.abs(currentPosition) >= originalContentWidth) {
                    currentPosition = 0;
                }
                
                // Apply the new position
                scrollContent.style.transform = `translateX(${currentPosition}px)`;
            }

            // Request the next frame for smooth animation
            requestAnimationFrame(animateScroll);
        }

        // Start the animation loop
        animateScroll();

        // Pause/Play on hover for desktop and touch for mobile
        const scrollContainer = document.querySelector('.image-scroll-container');
        if (scrollContainer) {
            scrollContainer.addEventListener('mouseenter', () => { isPaused = true; });
            scrollContainer.addEventListener('mouseleave', () => { isPaused = false; });
            
            // Handle touch events (less reliable but better than nothing)
            scrollContainer.addEventListener('touchstart', () => { isPaused = true; });
            scrollContainer.addEventListener('touchend', () => { 
                // Delay play slightly to allow user to view image
                setTimeout(() => { isPaused = false; }, 500); 
            });
        }
    }
});