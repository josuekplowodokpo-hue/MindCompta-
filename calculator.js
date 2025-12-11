// ******************************************************
// Logique spécifique à la page Calculator.html (Comptabilité OHADA)
// ******************************************************

document.addEventListener('DOMContentLoaded', function() {
    // ------------------------------------------
    // 1. GESTION DES ONGLETS (Tabs)
    // ------------------------------------------

    const tabsContainer = document.getElementById('tabs-container');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabsContainer) {
        tabsContainer.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (button && button.dataset.tab) {
                const targetTab = button.dataset.tab;

                // Désactiver tous les onglets
                document.querySelectorAll('#tabs-container button').forEach(btn => {
                    btn.classList.remove('bg-accent', 'text-white', 'shadow-md');
                    btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
                });

                // Activer l'onglet sélectionné
                button.classList.add('bg-accent', 'text-white', 'shadow-md');
                button.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');

                // Cacher tous les contenus et afficher le contenu cible
                tabContents.forEach(content => {
                    content.classList.add('hidden');
                });

                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                }
            }
        });
        
        // Afficher l'onglet par défaut (le premier) au chargement
        const defaultTabButton = tabsContainer.querySelector('button');
        if (defaultTabButton) defaultTabButton.click();
    }
    
    // ------------------------------------------
    // 2. LOGIQUE DE CALCUL
    // ------------------------------------------
    
    // Helper function to format currency
    function formatCurrency(value) {
        return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' FCFA';
    }


    // --- Fonction de calcul du Seuil de Rentabilité (SR) ---
    function calculateSeuilRentabilite() {
        const CA = parseFloat(document.getElementById('sr-ca').value);
        const CF = parseFloat(document.getElementById('sr-cf').value);
        const CV = parseFloat(document.getElementById('sr-cv').value);
        
        const srResultElement = document.getElementById('sr-result');
        const srInterpretationElement = document.getElementById('sr-interpretation');

        // Reset display
        srResultElement.classList.remove('text-red-600', 'text-green-600');
        srResultElement.classList.add('text-gray-900');

        if (isNaN(CA) || isNaN(CF) || isNaN(CV)) {
            srResultElement.textContent = "Veuillez entrer toutes les valeurs.";
            srInterpretationElement.textContent = "";
            return;
        }

        if (CA <= 0) {
            srResultElement.textContent = "Erreur (CA = 0)";
            srInterpretationElement.textContent = "Le Chiffre d'Affaires doit être supérieur à zéro.";
            srResultElement.classList.add('text-red-600');
            return;
        }

        const MCV = CA - CV; // Marge sur Coûts Variables
        const TMS = MCV / CA; // Taux de Marge sur Coûts Variables (Ratio)

        if (TMS <= 0) {
             srResultElement.textContent = "Erreur (TMS < 0)";
             srInterpretationElement.textContent = "Le Taux de Marge est négatif ou nul. Le Seuil de Rentabilité est impossible à atteindre dans ces conditions.";
             srResultElement.classList.add('text-red-600');
             return;
        }

        const SR = CF / TMS; // Seuil de Rentabilité

        srResultElement.textContent = formatCurrency(SR);
        srResultElement.classList.add('text-green-600');
        
        const securite = CA - SR;
        let interpretationText = `Le Seuil de Rentabilité est de ${formatCurrency(SR)}. Cela représente le Chiffre d'Affaires minimum à atteindre pour couvrir l'intégralité des charges (fixes et variables), c'est-à-dire avoir un Résultat nul.`;

        if (CA > SR) {
            interpretationText += `<br>Votre Marge de Sécurité actuelle est positive : ${formatCurrency(securite)}.`;
        } else {
             interpretationText += `<br>Attention : Votre Chiffre d'Affaires actuel (${formatCurrency(CA)}) est inférieur au SR. Votre entreprise est en perte.`;
        }

        srInterpretationElement.innerHTML = interpretationText;
    }

    // --- Fonction de calcul du Taux de Marge sur Coûts Variables (TMS) ---
    function calculateTMS() {
        const CA = parseFloat(document.getElementById('tms-ca').value);
        const CV = parseFloat(document.getElementById('tms-cv').value);

        const tmsResultElement = document.getElementById('tms-result');
        const mcvResultElement = document.getElementById('mcv-result');
        const tmsInterpretationElement = document.getElementById('tms-interpretation');

        // Reset classes
        tmsResultElement.classList.remove('text-red-600', 'text-green-600');
        tmsResultElement.classList.add('text-gray-900');

        if (isNaN(CA) || isNaN(CV) || CA <= 0) {
            tmsResultElement.textContent = "Veuillez entrer des valeurs valides.";
            mcvResultElement.textContent = "0 FCFA";
            tmsInterpretationElement.textContent = "";
            return;
        }
        
        const MCV = CA - CV; // Marge sur Coûts Variables
        
        if (MCV < 0) {
             mcvResultElement.textContent = formatCurrency(MCV);
             mcvResultElement.classList.add('text-red-600');
             tmsResultElement.textContent = "Négatif";
             tmsInterpretationElement.textContent = "La Marge sur Coûts Variables est négative. Les Coûts Variables ne sont pas couverts par le Chiffre d'Affaires.";
             return;
        }

        const TMS_rate = (MCV / CA) * 100;

        mcvResultElement.textContent = formatCurrency(MCV);
        mcvResultElement.classList.remove('text-red-600');
        mcvResultElement.classList.add('text-green-600');
        
        tmsResultElement.textContent = `${TMS_rate.toFixed(2)} %`;
        tmsResultElement.classList.add('text-green-600');

        tmsInterpretationElement.textContent = `La Marge sur Coûts Variables (MCV) est de ${formatCurrency(MCV)}. Le Taux de Marge (TMS) de ${TMS_rate.toFixed(2)}% est la proportion du Chiffre d'Affaires qui contribue à la couverture des Coûts Fixes et au Bénéfice.`;
    }

    // --- Fonction de gestion des événements ---
    // Écouteurs pour le Seuil de Rentabilité (SR)
    document.getElementById('sr-ca')?.addEventListener('input', calculateSeuilRentabilite);
    document.getElementById('sr-cf')?.addEventListener('input', calculateSeuilRentabilite);
    document.getElementById('sr-cv')?.addEventListener('input', calculateSeuilRentabilite);
    
    // Écouteurs pour la Marge (TMS)
    document.getElementById('tms-ca')?.addEventListener('input', calculateTMS);
    document.getElementById('tms-cv')?.addEventListener('input', calculateTMS);

    // Initialiser les calculs au chargement
    calculateSeuilRentabilite();
    calculateTMS();
});

