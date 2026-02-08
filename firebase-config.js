/* ===================================
   FIREBASE CONFIGURATION (COMPAT)
=================================== */

let currentUser = null; // global (declare SÓ AQUI)

const firebaseConfig = {
  apiKey: "AIzaSyDoeYJiuDQqsSk3kM_D1PRHIfuu2BHCFsg",
  authDomain: "barbearia-saas-97844.firebaseapp.com",
  projectId: "barbearia-saas-97844",
  storageBucket: "barbearia-saas-97844.appspot.com",
  messagingSenderId: "20048637129",
  appId: "1:20048637129:web:32f133716bf04f049e7118"
};

// Evita inicializar duas vezes
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;

console.log("🔥 Firebase inicializado");

// Observa login/logout
auth.onAuthStateChanged(async (user) => {
  if (!user) return; // não está logado

  try {
    const doc = await db.collection("users").doc(user.uid).get();

    if (!doc.exists) {
      console.warn("Usuário sem perfil no Firestore");
      alert("Usuário sem perfil no Firestore. Crie o documento users/" + user.uid);
      return;
    }

    const data = doc.data();
    currentUser = { uid: user.uid, ...data };

    if (data.role === "client") showClientDashboard();
    if (data.role === "barber") showBarberDashboard();
    if (data.role === "admin") showAdminDashboard();

  } catch (err) {
    console.error("Erro ao buscar/criar perfil:", err);
  }
});
