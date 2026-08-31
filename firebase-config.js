/**
 * CHRIS LEGEND OF SHADOWS UNIVERSE
 * Firebase Configuration
 *
 * ─────────────────────────────────────────────────────────────────
 * SETUP INSTRUCTIONS
 * ─────────────────────────────────────────────────────────────────
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (e.g. "chris-legend-universe")
 * 3. Add a Web App to the project
 * 4. Copy your Firebase config object and replace the placeholder
 *    values below with your REAL values.
 * 5. Enable Firebase Authentication → Email/Password provider
 * 6. Enable Firestore Database (start in production mode)
 * 7. Apply the Firestore Security Rules from firestore.rules
 * 8. Create your owner account:
 *    - In Firebase Console → Authentication → Users → Add User
 *    - Email: christijerina46@gmail.com
 *    - Set your private password there — NEVER put it in code
 * ─────────────────────────────────────────────────────────────────
 */

const firebaseConfig = {
  apiKey: "AIzaSyDZimcu5nHkavXTaOW4VY3kdoczStKdt2w",
  authDomain: "hubs-98455.firebaseapp.com",
  projectId: "hubs-98455",
  storageBucket: "hubs-98455.firebasestorage.app",
  messagingSenderId: "543773154464",
  appId: "1:543773154464:web:8c9e3d86c26e5f0203fdc5",
  measurementId: "G-357D9NS9R6"
};

// Owner email — used only for UI gating, auth enforced server-side via Security Rules
const OWNER_EMAIL = "christijerina46@gmail.com";

export { firebaseConfig, OWNER_EMAIL };
