// ===============================
// CONTROLE DE TELAS
// ===============================

window.showLogin = function () {
  document.getElementById("landingPage")?.classList.add("hidden");
  document.getElementById("loginPage")?.classList.remove("hidden");
  document.getElementById("registerPage")?.classList.add("hidden");
};

window.showLanding = function () {
  document.getElementById("landingPage")?.classList.remove("hidden");
  document.getElementById("loginPage")?.classList.add("hidden");
  document.getElementById("registerPage")?.classList.add("hidden");
};

window.openRegister = function () {
  document.getElementById("landingPage")?.classList.add("hidden");
  document.getElementById("loginPage")?.classList.add("hidden");
  document.getElementById("registerPage")?.classList.remove("hidden");
};

// ===============================
// TUDO RODA APÓS DOM CARREGAR
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // LOGIN
  // ===============================

  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail")?.value.trim();
      const password = document.getElementById("loginPassword")?.value.trim();
      const roleSelected = document.getElementById("loginRole")?.value;

      if (!email || !password || !roleSelected) {
        alert("Preencha todos os campos.");
        return;
      }

      try {

        const userCredential = await firebase
          .auth()
          .signInWithEmailAndPassword(email, password);

        const uid = userCredential.user.uid;

        const userDoc = await firebase
          .firestore()
          .collection("users")
          .doc(uid)
          .get();

        if (!userDoc.exists) {
          alert("Usuário não encontrado.");
          await firebase.auth().signOut();
          return;
        }

        const userData = userDoc.data();

if (userData.role !== roleSelected) {
  alert("Perfil selecionado incorreto.");
  return; // ❌ NÃO DESLOGA
}


      } catch (error) {
        alert("Erro no login: " + error.message);
      }
    });
  }

  // ===============================
  // REGISTRO
  // ===============================

  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("registerName").value.trim();
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value;
      const confirmPassword = document.getElementById("registerConfirmPassword").value;

      if (password !== confirmPassword) {
        alert("As senhas não coincidem!");
        return;
      }

      if (password.length < 6) {
        alert("A senha precisa ter no mínimo 6 caracteres.");
        return;
      }

      try {

        const userCredential = await firebase
          .auth()
          .createUserWithEmailAndPassword(email, password);

        const user = userCredential.user;

        await firebase
          .firestore()
          .collection("users")
          .doc(user.uid)
          .set({
            name: name,
            email: email,
            role: "client",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });

        alert("Conta criada com sucesso!");

      } catch (error) {
        alert("Erro ao criar conta: " + error.message);
      }
    });
  }

});

// ===============================
// LOGIN COM GOOGLE
// ===============================

window.loginWithGoogle = async function () {

  const provider = new firebase.auth.GoogleAuthProvider();

  try {

    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;

    const userRef = firebase.firestore().collection("users").doc(user.uid);
    const docSnap = await userRef.get();

    if (!docSnap.exists) {
      await userRef.set({
        name: user.displayName,
        email: user.email,
        role: "client",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }

  } catch (error) {
    alert("Erro ao entrar com Google: " + error.message);
  }
};
