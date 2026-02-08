/* ===================================
   FIREBASE CONFIGURATION
=================================== */

// 🔥 Config do seu projeto (o correto)
const firebaseConfig = {
  apiKey: "AIzaSyDoeYJiuDQqsSk3kM_D1PRHIfuu2BHCFsg",
  authDomain: "barbearia-saas-97844.firebaseapp.com",
  projectId: "barbearia-saas-97844",
  storageBucket: "barbearia-saas-97844.appspot.com",
  messagingSenderId: "20048637129",
  appId: "1:20048637129:web:32f133716bf04f049e7118"
};

// Inicializa o Firebase (evita inicializar duas vezes)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Serviços (UMA VEZ SÓ)
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log("🔥 Firebase OK");

// ❌ Remove isso (é legado e pode causar warning/erro)
// db.settings({ timestampsInSnapshots: true });

// Função para verificar se o Firebase está inicializado
function checkFirebase() {
  if (!firebase.apps.length) {
    console.error('Firebase não foi inicializado corretamente');
    return false;
  }
  return true;
}

// Disponibiliza no escopo global para outros scripts
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;
window.checkFirebase = checkFirebase;

firebase.auth().onAuthStateChanged((user) => {
  if (!user) return;

  firebase.firestore()
    .collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        alert("Usuário sem perfil no Firestore");
        return;
      }

      const data = doc.data();

      currentUser = {
        uid: user.uid,
        ...data
      };

      if (data.role === "client") showClientDashboard();
      if (data.role === "barber") showBarberDashboard();
      if (data.role === "admin") showAdminDashboard();
    })
    .catch(err => {
      console.error("Erro ao buscar perfil:", err);
    });
});
