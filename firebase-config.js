/* =================================== 
   FIREBASE CONFIGURATION (COMPAT)
=================================== */

const firebaseConfig = {
  apiKey: "AIzaSyDoeYJiuDQqsSk3kM_D1PRHIfuu2BHCFsg",
  authDomain: "barbearia-saas-97844.firebaseapp.com",
  projectId: "barbearia-saas-97844",
  storageBucket: "barbearia-saas-97844.appspot.com",
  messagingSenderId: "20048637129",
  appId: "1:20048637129:web:32f133716bf04f049e7118",
};

// 🔥 Evita inicializar duas vezes
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// 🔐 Serviços globais
window.auth = firebase.auth();
window.db = firebase.firestore();
window.storage = firebase.storage();

console.log("🔥 Firebase inicializado");

// ===================================
// 🔐 CONTROLE GLOBAL DE LOGIN
// ===================================

window.auth.onAuthStateChanged(async (user) => {
    if (!user) {
    window.currentUser = null;
    if (typeof showLogin === "function") showLogin();
    return;
  }

  if (!user.emailVerified) {
    alert("Você precisa verificar seu email antes de acessar.");
    await window.auth.signOut();
    return;
  }

  if (!user) {
    window.currentUser = null;
    console.log("🚫 Nenhum usuário logado");
    if (typeof showLogin === "function") showLogin();
    return;
  }

  try {

    const userRef = window.db.collection("users").doc(user.uid);
    let docSnap = await userRef.get();

    // 🔥 Se não existir, cria automaticamente
if (!docSnap.exists) {
  console.log("🆕 Criando perfil automaticamente...");

  await window.db.collection("users").doc(user.uid).set({
    name: user.displayName || "Usuário",
    email: user.email,
    role: "client",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  return; // deixa o onAuthStateChanged rodar novamente
}


    const data = docSnap.data();

    window.currentUser = {
      uid: user.uid,
      ...data
    };

    console.log("✅ Usuário carregado:", window.currentUser);

    // 🔥 Redirecionamento
    if (data.role === "barber" && typeof showBarberDashboard === "function") {
      showBarberDashboard();
    } 
    else if (data.role === "admin" && typeof showAdminDashboard === "function") {
      showAdminDashboard();
    } 
    else {
      if (typeof showClientDashboard === "function") {
        showClientDashboard();
      }
    }

  } catch (error) {

    console.error("Erro ao carregar perfil:", error);
    await window.auth.signOut();
    if (typeof showLogin === "function") showLogin();

  }

});

// ===================================
// 🔥 FUNÇÃO GLOBAL DO ADMIN
// ===================================

function showAdminSection(section) {
  // Esconde todas as seções
  document.querySelectorAll(".dashboard-section").forEach(sec => {
    sec.classList.add("hidden");
  });

  // Remove active do menu
  document.querySelectorAll(".sidebar-menu a").forEach(link => {
    link.classList.remove("active");
  });

  // Mostra a seção correta
  const target = document.getElementById("admin-" + section);
  if (target) {
    target.classList.remove("hidden");
  }

  // Marca o menu como ativo
  document.querySelectorAll(".sidebar-menu a").forEach(link => {
    if (link.getAttribute("onclick")?.includes(section)) {
      link.classList.add("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado");
});

