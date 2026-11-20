/**
 * Clinic Queue Tracking System - Firebase Configuration & Bridge
 * Author: Vivek Kumar (MSOT B.Tech CSE)
 * 
 * Purpose:
 * Initializes Firebase App, Authentication, and Cloud Firestore.
 * Includes automatic offline/local fallback so the app can be tested immediately
 * before or after connecting to a live Firebase project.
 */

// 1. Firebase Project Configuration
// Project ID: clinic-queue-tracker-a3b1b
// Public Web App credentials from Firebase Console:
// https://console.firebase.google.com/project/clinic-queue-tracker-a3b1b/settings/general
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "clinic-queue-tracker-a3b1b.firebaseapp.com",
  projectId: "clinic-queue-tracker-a3b1b",
  storageBucket: "clinic-queue-tracker-a3b1b.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if valid Firebase credentials have been configured
function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY" &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
}

// Global Firebase service references
let app = null;
let auth = null;
let db = null;

// Local fallback auth key
const LOCAL_STAFF_AUTH_KEY = "clinic_reception_auth_session";

/**
 * Initializes Firebase SDK if configured.
 */
async function initializeFirebase() {
  if (isFirebaseConfigured()) {
    try {
      // Import Firebase v10 from Google's official CDN
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
      const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
      const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);

      console.log("✅ Firebase initialized successfully with Cloud Firestore & Auth.");
      return { isLive: true, app, auth, db };
    } catch (err) {
      console.warn("⚠️ Failed to load Firebase CDN, falling back to local simulation mode:", err);
    }
  } else {
    console.log("ℹ️ Running in Local Mode (sample data). Add your Firebase credentials in js/firebase-config.js to go live!");
  }

  return { isLive: false, app: null, auth: null, db: null };
}

// Auth state listeners registry
const authListeners = [];

function notifyAuthListeners(user) {
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (err) {
      console.warn("Auth listener notification error:", err);
    }
  });
}

/**
 * Staff Authentication: Sign In
 * Uses Firebase Auth signInWithEmailAndPassword if configured, or simulated session if local.
 */
async function loginReceptionist(email, password) {
  if (isFirebaseConfigured() && auth) {
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    notifyAuthListeners(cred.user);
    window.dispatchEvent(new CustomEvent("clinic_auth_updated", { detail: cred.user }));
    return cred;
  } else {
    // Local demo verification: Accepts clinic staff email & password
    if (email.trim().toLowerCase() === "reception@clinic.com" && password === "clinic123") {
      const user = {
        uid: "staff-patna-001",
        email: "reception@clinic.com",
        displayName: "Patna Clinic Reception Desk",
        role: "receptionist"
      };
      localStorage.setItem(LOCAL_STAFF_AUTH_KEY, JSON.stringify(user));
      notifyAuthListeners(user);
      window.dispatchEvent(new CustomEvent("clinic_auth_updated", { detail: user }));
      return { user };
    } else {
      const error = new Error("Invalid staff credentials. (Demo hint: reception@clinic.com / clinic123)");
      error.code = "auth/invalid-credential";
      throw error;
    }
  }
}

/**
 * Staff Authentication: Sign Out
 */
async function logoutReceptionist() {
  if (isFirebaseConfigured() && auth) {
    const { signOut } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    await signOut(auth);
    notifyAuthListeners(null);
    window.dispatchEvent(new CustomEvent("clinic_auth_updated", { detail: null }));
    return true;
  } else {
    localStorage.removeItem(LOCAL_STAFF_AUTH_KEY);
    notifyAuthListeners(null);
    window.dispatchEvent(new CustomEvent("clinic_auth_updated", { detail: null }));
    return true;
  }
}

/**
 * Staff Authentication: State Observer
 * @param {Function} callback - Invoked whenever auth state changes
 */
async function observeAuthState(callback) {
  if (typeof callback === "function" && !authListeners.includes(callback)) {
    authListeners.push(callback);
  }

  if (isFirebaseConfigured() && auth) {
    const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    return onAuthStateChanged(auth, callback);
  } else {
    // Local check
    const checkLocal = () => {
      const saved = localStorage.getItem(LOCAL_STAFF_AUTH_KEY);
      if (saved) {
        try {
          callback(JSON.parse(saved));
          return;
        } catch (e) {}
      }
      callback(null);
    };

    checkLocal();
    // Listen for cross-tab auth sync & same-window custom event
    window.addEventListener("storage", (e) => {
      if (e.key === LOCAL_STAFF_AUTH_KEY) {
        checkLocal();
      }
    });

    window.addEventListener("clinic_auth_updated", (e) => {
      callback(e.detail);
    });
  }
}

// Export for app usage
window.FirebaseBridge = {
  firebaseConfig,
  isFirebaseConfigured,
  initializeFirebase,
  loginReceptionist,
  logoutReceptionist,
  observeAuthState
};
