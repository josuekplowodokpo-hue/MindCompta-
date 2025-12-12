import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,     
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    onSnapshot, 
    collection, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";


// --- 1. CONFIGURATION ET INITIALISATION GLOBALE ---

// Récupération des variables globales de l'environnement Canvas
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    // Clés de configuration de votre projet MindCompta (issues des captures d'écran)
    apiKey: "AIzaSyBu9BAZbgYKQ_C_qHgAgU31uclG-sLEh0c",
    authDomain: "mindcompta-cbb69.firebaseapp.com",
    projectId: "mindcompta-cbb69",
    storageBucket: "mindcompta-cbb69.firebasestorage.app",
    messagingSenderId: "470368630296",
    appId: "1:470368630296:web:510de914f335b27b3d356d",
    measurementId: "G-SKSVSV0H70"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialisation des services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserId = null;
let isAdmin = false;

// Authentification initiale
const initializeAuth = async () => {
    try {
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
            console.log("Authenticated with custom token.");
        } else {
            // Tentative de connexion anonyme pour l'accès public
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
        }
    } catch (error) {
        console.error("Firebase Auth initialization error:", error);
    }
};

// Écouteur d'état d'authentification
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("User UID:", currentUserId);
        
        // 1. Récupérer les informations de l'utilisateur (y compris le rôle)
        await fetchUserRole(currentUserId);
    } else {
        currentUserId = null;
        isAdmin = false;
        console.log("User is signed out.");
    }
    // Après le changement d'état, on s'assure que la logique de la page est lancée
    if (window.initPage) {
        window.initPage();
    }
});

// Récupère le rôle de l'utilisateur dans Firestore
const fetchUserRole = async (uid) => {
    if (!uid) {
        isAdmin = false;
        return;
    }
    try {
        // Chemin de la collection : /artifacts/{appId}/public/data/users/{userId}
        const userDocRef = doc(db, 'artifacts', appId, 'public/data/users', uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            isAdmin = userData.role === 'admin';
        } else {
            // Si le document n'existe pas, l'utilisateur est considéré comme normal (ou doit s'inscrire)
            isAdmin = false;
        }
        console.log("Is Admin:", isAdmin);
    } catch (error) {
        console.error("Error fetching user role:", error);
        isAdmin = false;
    }
};

// Initialisation lors du chargement de la page
initializeAuth();

// --- 2. LOGIQUE DU FORMULAIRE D'INSCRIPTION ---

// Fonction pour afficher un message (succès/erreur)
const displayMessage = (elementId, message, isSuccess = true) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
        if (isSuccess) {
            element.classList.add('bg-green-100', 'text-green-700');
        } else {
            element.classList.add('bg-red-100', 'text-red-700');
        }
    }
};

/**
 * Gère la soumission du formulaire d'inscription.
 * @param {Event} e L'événement de soumission du formulaire.
 */
const handleSignUp = async (e) => {
    e.preventDefault();
    const messageElementId = 'signup-message';
    displayMessage(messageElementId, 'Création du compte en cours...', true); // Utiliser true pour un fond neutre en cours

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    // E-mail spécifique pour le rôle d'administrateur
    const ADMIN_EMAIL = 'admin@mindcompta.com'; 
    const role = (email === ADMIN_EMAIL) ? 'admin' : 'user';

    try {
        // 1. Création du compte Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // 2. Enregistrement des données utilisateur (y compris le rôle) dans Firestore
        const userDocRef = doc(db, 'artifacts', appId, 'public/data/users', user.uid);
        
        await setDoc(userDocRef, {
            name: name,
            email: email,
            role: role,
            createdAt: new Date().toISOString(),
        });

        displayMessage(messageElementId, `Compte créé avec succès ! Vous êtes un utilisateur ${role}. Redirection...`, true);
        
        // Redirection après succès
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

    } catch (error) {
        console.error("Erreur d'inscription:", error);
        let errorMessage = "Erreur lors de la création du compte. Veuillez réessayer.";

        // Traduction des erreurs Firebase communes
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = "Cette adresse e-mail est déjà utilisée.";
                break;
            case 'auth/invalid-email':
                errorMessage = "L'adresse e-mail n'est pas valide.";
                break;
            case 'auth/weak-password':
                errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
                break;
            default:
                errorMessage = `Erreur: ${error.code}`;
        }

        displayMessage(messageElementId, errorMessage, false);
    }
};

// Écouteur pour le formulaire d'inscription
document.addEventListener('DOMContentLoaded', () => {
    const signUpForm = document.getElementById('signup-form');
    if (signUpForm) {
        signUpForm.addEventListener('submit', handleSignUp);
    }
});


// --- 3. LOGIQUE DU FORMULAIRE DE CONNEXION ---

/**
 * Gère la soumission du formulaire de connexion.
 * @param {Event} e L'événement de soumission du formulaire.
 */
const handleSignIn = async (e) => {
    e.preventDefault();
    const messageElementId = 'login-message';
    displayMessage(messageElementId, 'Connexion en cours...', true); // Utiliser true pour un fond neutre en cours

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        // 1. Connexion Firebase Auth
        await signInWithEmailAndPassword(auth, email, password);
        
        displayMessage(messageElementId, `Connexion réussie ! Redirection...`, true);

        // Redirection après succès
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        console.error("Erreur de connexion:", error);
        let errorMessage = "Erreur de connexion. Veuillez vérifier votre email et mot de passe.";

        // Traduction des erreurs Firebase communes
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage = "Identifiants invalides.";
                break;
            case 'auth/invalid-email':
                errorMessage = "L'adresse e-mail n'est pas valide.";
                break;
            default:
                errorMessage = `Erreur: ${error.code}`;
        }

        displayMessage(messageElementId, errorMessage, false);
    }
};

// Écouteur pour le formulaire de connexion
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleSignIn);
    }
});


// Exporte les variables et fonctions nécessaires pour les autres fichiers
export { currentUserId, isAdmin, db, appId, auth, fetchUserRole };