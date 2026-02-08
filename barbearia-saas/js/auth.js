/* ===================================
   AUTHENTICATION MODULE
   Gerencia autenticação com Firebase Auth
=================================== */

class AuthService {
  constructor() {
    this.auth = window.firebaseAuth;
    this.db = window.firebaseDb;
    this.currentUser = null;
    this.userRole = null;
    this.userData = null;

    // Monitorar estado de autenticação
    this.auth.onAuthStateChanged((user) => {
      this.handleAuthStateChange(user);
    });
  }

  // Manipula mudanças no estado de autenticação
  async handleAuthStateChange(user) {
    this.currentUser = user;

    if (user) {
      // Usuário logado → buscar perfil no Firestore
      await this.fetchUserProfile(user.uid);

      // 🔥 Fonte da verdade global (ETAPA 3)
      window.currentUser = {
        uid: user.uid,
        email: user.email,
        name: this.userData?.name || '',
        role: this.userRole,
        barberId: this.userData?.barberId || null
      };
    } else {
      // Usuário deslogado
      this.userRole = null;
      this.userData = null;
      window.currentUser = null;
    }
  }

  // Busca perfil do usuário no Firestore
  async fetchUserProfile(uid) {
    try {
      const userDoc = await this.db.collection('users').doc(uid).get();

      if (userDoc.exists) {
        this.userData = userDoc.data();
        this.userRole = userDoc.data().role;
      } else {
        // Se não existe documento, cria padrão (client)
        await this.createUserDocument(uid);
        this.userRole = 'client';
        this.userData = {
          name: this.currentUser.displayName || '',
          email: this.currentUser.email,
          role: 'client',
          barberId: null
        };
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      this.userRole = 'client'; // Fallback seguro
      this.userData = null;
    }
  }

  // Cria documento do usuário no Firestore
  async createUserDocument(uid) {
    try {
      const userData = {
        name: this.currentUser.displayName || '',
        email: this.currentUser.email,
        role: 'client',       // Role padrão
        barberId: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('users').doc(uid).set(userData);
    } catch (error) {
      console.error('Erro ao criar documento do usuário:', error);
    }
  }

  // Login com Google
  async loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const result = await this.auth.signInWithPopup(provider);

      return { success: true, user: result.user };
    } catch (error) {
      console.error('Erro no login com Google:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Logout
  async logout() {
    try {
      await this.auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Verifica se usuário está autenticado
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Verifica role do usuário
  hasRole(role) {
    return this.userRole === role;
  }

  // Obtém mensagem de erro amigável
  getErrorMessage(error) {
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        return 'Login cancelado pelo usuário';
      case 'auth/popup-blocked':
        return 'Popup bloqueado pelo navegador. Permita popups para este site.';
      case 'auth/network-request-failed':
        return 'Erro de conexão. Verifique sua internet.';
      case 'auth/unauthorized-domain':
        return 'Domínio não autorizado. Entre em contato com o suporte.';
      default:
        return 'Erro ao fazer login. Tente novamente.';
    }
  }

  // Atualiza perfil do usuário
  async updateProfile(name) {
    try {
      await this.db.collection('users').doc(this.currentUser.uid).update({
        name,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { success: false, error: 'Erro ao atualizar perfil' };
    }
  }

  // Obtém dados do usuário atual
  getCurrentUser() {
    return {
      uid: this.currentUser?.uid,
      email: this.currentUser?.email,
      name: this.userData?.name || '',
      role: this.userRole,
      barberId: this.userData?.barberId || null
    };
  }
}

// Inicializa serviço de autenticação
const authService = new AuthService();
window.authService = authService;

// Funções globais para uso em HTML
window.loginWithGoogle = async function (event) {
  const button = event?.target;
  const originalText = button?.innerHTML;

  if (button) {
    button.innerHTML = 'Entrando...';
    button.disabled = true;
  }

  const result = await authService.loginWithGoogle();

  if (button) {
    button.innerHTML = originalText;
    button.disabled = false;
  }

  if (!result.success) {
    showToast(result.error, 'error');
  }

  return result;
};

window.logout = async function () {
  const result = await authService.logout();

  if (result.success) {
    window.location.href = 'index.html';
  } else {
    showToast(result.error, 'error');
  }
};

// Toast helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  const container = document.querySelector('.toast-container') || createToastContainer();
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}
