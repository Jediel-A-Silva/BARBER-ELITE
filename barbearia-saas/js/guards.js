window.requireAuth = function () {

  if (!window.currentUser) {
    alert("Você precisa estar logado");
    return false;
  }

  return true;
};
