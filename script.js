// ******************************************************
// Logique JavaScript partagée pour toutes les pages
// Gère l'ouverture/fermeture du menu mobile, l'authentification Firebase
// et la gestion des données utilisateur dans Firestore.
// ******************************************************

// =======================================================
// 1. INITIALISATION FIREBASE ET AUTHENTIFICATION CANVAS
// =======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    signInWithCustomToken, 
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    setLogLevel // Ajout du log level
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";


// Configuration Firebase fournie par l'utilisateur
const firebaseConfig = {
    apiKey: "AIzaSyBu9BAZbgYKQ_C_qHgAgU31uclG-sLEh0c",
    authDomain: "mindcompta-cbb69.firebaseapp.com",
    databaseURL: "https://mindcompta-cbb69-default-rtdb.firebaseio.com",
    projectId: "mindcompta-cbb69",
    storageBucket: "mindcompta-cbb69.firebasestorage.app",
    messagingSenderId: "470368630296",
    appId: "1:470368630296:web:510de914f335b27b3d356d",
    measurementId: "G-SKSVSV0H70"
};

// Variables globales pour les services Firebase
let app;
let auth;
let db;
let analytics;
let userId = null;

if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    setLogLevel('debug'); // Active les logs Firestore pour le débogage
    analytics = getAnalytics(app); 

    // Variable d'application ID pour les chemins Firestore
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Utilise le jeton personnalisé fourni par Canvas s'il est disponible, sinon connexion anonyme.
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    // Fonction pour sauvegarder ou mettre à jour les données de l'utilisateur dans Firestore
    async function saveUserData(user) {
        if (!db || !user || user.isAnonymous) {
            console.warn("Firestore non initialisé ou utilisateur anonyme. Données non sauvegardées.");
            return;
        }

        // Chemin: /artifacts/{appId}/public/data/users/{userId}
        const userRef = doc(db, `artifacts/${appId}/public/data/users`, user.uid);
        const now = new Date().toISOString();

        const userDataUpdate = {
            uid: user.uid,
            email: user.email || 'N/A',
            lastLogin: now,
            // Utilisez 'merge: true' pour mettre à jour sans écraser les champs existants
        };

        try {
            const docSnap = await getDoc(userRef);
            
            // Si le document n'existe pas (nouvelle inscription), ajoutez la date de création
            if (!docSnap.exists()) {
                userDataUpdate.creationTime = now;
            }

            await setDoc(userRef, userDataUpdate, { merge: true });
            console.log(`Données utilisateur (${user.uid}) sauvegardées/mises à jour dans Firestore.`);

        } catch (e) {
            console.error("Erreur lors de la sauvegarde des données utilisateur dans Firestore:", e);
        }
    }


    async function initializeAuth() {
        try {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Échec de l'authentification initiale Firebase:", error);
        }
    }
    
    // Écouteur de l'état d'authentification pour mettre à jour l'ID utilisateur
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userId = user.uid;
            console.log(`Utilisateur connecté. UID: ${userId}`);
            // Mise à jour de la dernière connexion lors du changement d'état (utile après une reconnexion)
            if (!user.isAnonymous && user.email) {
                saveUserData(user); 
            }
        } else {
            userId = null;
            console.log("Utilisateur déconnecté ou anonyme non reconnu.");
        }
    });

    initializeAuth();

} else {
    console.error("La configuration Firebase est manquante. Les fonctions d'authentification seront indisponibles.");
}


// =======================================================
// 2. FONCTIONS D'AUTHENTIFICATION PUBLIQUES (Exposées à window)
// =======================================================

/**
 * Gère la connexion d'un utilisateur existant par e-mail et mot de passe.
 * Fonction appelée depuis login.html.
 */
window.handleLogin = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('auth-message');

    message.textContent = '';
    message.classList.add('hidden');

    if (!auth) {
        message.textContent = "Erreur: Service d'authentification indisponible.";
        message.classList.remove('hidden');
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // --- MISE À JOUR FIREBASE: Enregistrement de la dernière connexion ---
        await saveUserData(userCredential.user);

        // Succès
        message.textContent = `Connexion réussie! Bienvenue, ${userCredential.user.email}. Redirection...`;
        message.classList.remove('text-red-500', 'border-red-300');
        message.classList.add('text-green-500', 'border-green-300');

        setTimeout(() => { window.location.href = 'index.html'; }, 1500);

    } catch (error) {
        console.error("Erreur de connexion:", error.code, error.message);
        let userMessage = "Échec de la connexion. Vérifiez votre e-mail et mot de passe.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
             userMessage = "E-mail ou mot de passe incorrect.";
        }
        
        message.textContent = userMessage;
    } finally {
         message.classList.remove('hidden');
    }
};

/**
 * Gère la création de compte utilisateur par e-mail et mot de passe.
 * Fonction appelée depuis register.html.
 */
window.handleRegister = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    const message = document.getElementById('auth-message');

    message.textContent = '';
    message.classList.add('hidden');

    if (!auth) {
        message.textContent = "Erreur: Service d'authentification indisponible.";
        message.classList.remove('hidden');
        return;
    }

    if (password !== passwordConfirm) {
        message.textContent = "Les mots de passe ne correspondent pas.";
        message.classList.remove('hidden');
        return;
    }

    if (password.length < 6) {
        message.textContent = "Le mot de passe doit comporter au moins 6 caractères.";
        message.classList.remove('hidden');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // --- MISE À JOUR FIREBASE: Enregistrement du nouvel utilisateur ---
        await saveUserData(userCredential.user);

        // Succès
        message.textContent = `Compte créé avec succès! Bienvenue, ${userCredential.user.email}. Redirection...`;
        message.classList.remove('text-red-500', 'border-red-300');
        message.classList.add('text-green-500', 'border-green-300');

        setTimeout(() => { window.location.href = 'index.html'; }, 1500);

    } catch (error) {
        console.error("Erreur d'inscription:", error.code, error.message);
        let userMessage = "Échec de la création du compte. Veuillez réessayer.";
        
        if (error.code === 'auth/email-already-in-use') {
             userMessage = "Cet e-mail est déjà utilisé.";
        } else if (error.code === 'auth/invalid-email') {
             userMessage = "Format d'e-mail invalide.";
        } else if (error.code === 'auth/weak-password') {
             userMessage = "Le mot de passe est trop faible (min. 6 caractères).";
        }

        message.textContent = userMessage;
    } finally {
        message.classList.remove('hidden');
    }
};

/**
 * Déconnecte l'utilisateur et redirige vers la page de connexion.
 */
window.handleSignOut = async function() {
    if (!auth) return;
    try {
        await signOut(auth);
        console.log("Déconnexion réussie.");
        window.location.href = 'login.html'; 
    } catch (error) {
        console.error("Erreur de déconnexion:", error.message);
    }
};


// =======================================================
// 3. LOGIQUE DOM (Menu Mobile et Animation du Carrousel)
// =======================================================

document.addEventListener('DOMContentLoaded', function() {
    // --- GESTION DU MENU MOBILE ---
    const menuButton = document.getElementById('menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- CARROUSEL D'IMAGES À DÉFILEMENT INFINI ---
    const scrollContent = document.querySelector('.image-scroll-content');
    
    if (scrollContent) {
        const imageWidth = 300; 
        const imageMargin = 24; 
        const numOriginalImages = 7; 

        const originalContentWidth = (imageWidth * numOriginalImages) + (imageMargin * (numOriginalImages - 1));

        const totalScrollWidth = originalContentWidth * 2;
        scrollContent.style.width = `${totalScrollWidth}px`;

        let currentPosition = 0;
        const scrollSpeed = 0.5; 
        let isPaused = false;

        function animateScroll() {
            if (!isPaused) {
                currentPosition -= scrollSpeed; 
                
                if (Math.abs(currentPosition) >= originalContentWidth) {
                    currentPosition = 0;
                }
                
                scrollContent.style.transform = `translateX(${currentPosition}px)`;
            }

            requestAnimationFrame(animateScroll);
        }

        animateScroll();

        const scrollContainer = document.querySelector('.image-scroll-container');
        if (scrollContainer) {
            scrollContainer.addEventListener('mouseenter', () => { isPaused = true; });
            scrollContainer.addEventListener('mouseleave', () => { isPaused = false; });
            
            // Gestion du tactile pour mobile
            scrollContainer.addEventListener('touchstart', () => { isPaused = true; });
            scrollContainer.addEventListener('touchend', () => { 
                setTimeout(() => { isPaused = false; }, 500); 
            });
        }
    }
});