/* ===================================
   ROUTE GUARDS (Firebase)
=================================== */

class RouteGuard {
  constructor() {
    this.protectedRoutes = {
      'dashboard-cliente.html': ['client', 'admin', 'barber'],
      'dashboard-admin.html': ['admin'],
      'dashboard-barber.html': ['barber', 'admin']
    };
  }

  init() {
    this.checkAccess();

    firebase.auth().onAuthStateChanged(() => {
      this.checkAccess();
    });
  }

  async checkAccess() {
    const currentPage = this.getCurrentPage();

    if (!this.protectedRoutes[currentPage]) return true;

    // Não logado
    if (!firebase.auth().currentUser) {
      this.redirectToLogin();
      return false;
    }

    // Ainda não carregou o perfil do Firestore
    if (!window.currentUser) {
      console.log('⏳ Aguardando perfil do usuário...');
      return false;
    }

    const allowedRoles = this.protectedRoutes[currentPage];
    const userRole = window.currentUser.role;

    if (!allowedRoles.includes(userRole)) {
      this.redirectToUnauthorized();
      return false;
    }

    return true;
  }

  getCurrentPage() {
    return window.location.pathname.split('/').pop();
  }

  redirectToLogin() {
    if (this.getCurrentPage() === 'login.html') return;

    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `login.html?returnUrl=${returnUrl}`;
  }

  redirectToUnauthorized() {
    document.body.innerHTML = `
      <div class="unauthorized-container" style="
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        min-height:100vh;text-align:center;padding:2rem;">
        <h1 style="color:#e53935;margin-bottom:1rem;">Acesso Negado</h1>
        <p style="margin-bottom:2rem;">Você não tem permissão para acessar esta página.</p>
        <div style="display:flex;gap:1rem;">
          <button onclick="window.location.href='index.html'">Página Inicial</button>
          <button onclick="window.location.href='dashboard-cliente.html'">Meu Dashboard</button>
        </div>
      </div>
    `;
  }

  canAccess(route) {
    const allowedRoles = this.protectedRoutes[route];
    if (!allowedRoles) return true;

    return window.currentUser && allowedRoles.includes(window.currentUser.role);
  }

  hasPermission(action) {
    const permissions = {
      admin: ['manage_barbers','manage_services','view_all_appointments','view_financial_reports','manage_settings','create_appointments','cancel_appointments'],
      barber: ['view_own_schedule','update_availability','view_earnings','create_appointments','cancel_own_appointments'],
      client: ['create_appointments','cancel_own_appointments','view_own_history']
    };

    return permissions[window.currentUser?.role]?.includes(action) || false;
  }

  getPermissions() {
    const permissions = {
      admin: ['manage_barbers','manage_services','view_all_appointments','view_financial_reports','manage_settings','create_appointments','cancel_appointments'],
      barber: ['view_own_schedule','update_availability','view_earnings','create_appointments','cancel_own_appointments'],
      client: ['create_appointments','cancel_own_appointments','view_own_history']
    };

    return permissions[window.currentUser?.role] || [];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const routeGuard = new RouteGuard();
  routeGuard.init();
  window.routeGuard = routeGuard;
});

window.canAccess = (route) => window.routeGuard?.canAccess(route) || false;
window.hasPermission = (action) => window.routeGuard?.hasPermission(action) || false;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-permission]').forEach(el => {
    if (!window.hasPermission(el.dataset.permission)) {
      el.style.display = 'none';
    }
  });

  document.querySelectorAll('[data-role]').forEach(el => {
    if (window.currentUser?.role !== el.dataset.role) {
      el.style.display = 'none';
    }
  });
});
