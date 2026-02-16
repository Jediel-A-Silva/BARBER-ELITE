class AdminService {
  constructor() {
    this.db = db;
  }

  // =========================
  // BARBEIROS
  // =========================
  async getBarbers() {
    try {
      const snapshot = await this.db
        .collection("barbers")
        .orderBy("name")
        .get();

      const barbers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, barbers };

    } catch (error) {
      console.error(error);
      return { success: false, barbers: [], error: "Erro ao buscar barbeiros" };
    }
  }

  async addBarber(barberData) {
    try {

      const barber = {
        ...barberData,
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        services: barberData.services || [],
      };

      const docRef = await this.db
        .collection("barbers")
        .add(barber);

      return { success: true, id: docRef.id, message: "Barbeiro adicionado!" };

    } catch (error) {
      console.error(error);
      return { success: false, message: "Erro ao adicionar barbeiro" };
    }
  }

  async updateBarber(barberId, barberData) {
    try {

      await this.db
        .collection("barbers")
        .doc(barberId)
        .update({
          ...barberData,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

      return { success: true, message: "Barbeiro atualizado!" };

    } catch (error) {
      console.error(error);
      return { success: false, message: "Erro ao atualizar barbeiro" };
    }
  }

  async removeBarber(barberId) {
    try {

      await this.db
        .collection("barbers")
        .doc(barberId)
        .delete();

      return { success: true, message: "Barbeiro removido!" };

    } catch (error) {
      console.error(error);
      return { success: false, message: "Erro ao remover barbeiro" };
    }
  }

  // =========================
  // SERVIÇOS
  // =========================
  async getServices() {
    try {

      const snapshot = await this.db
        .collection("services")
        .orderBy("name")
        .get();

      return {
        success: true,
        services: snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })),
      };

    } catch (error) {
      console.error(error);
      return { success: false, services: [] };
    }
  }

  async addService(serviceData) {
    try {

      const service = {
        ...serviceData,
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.db
        .collection("services")
        .add(service);

      return { success: true, id: docRef.id, message: "Serviço adicionado!" };

    } catch (error) {
      console.error(error);
      return { success: false, message: "Erro ao adicionar serviço" };
    }
  }
}

window.adminService = new AdminService();

// ===============================
// FUNÇÕES GLOBAIS
// ===============================

window.addBarber = async (event) => {
  event.preventDefault();

  const form = event.target;

  const formData = {
    name: form.querySelector("#barberName").value,
    email: form.querySelector("#barberEmail").value,
    phone: form.querySelector("#barberPhone").value,
    specialty: form.querySelector("#barberSpecialty").value,
    services: form.querySelector("#barberServices").value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };

  const result = await window.adminService.addBarber(formData);

  alert(result.message);
  form.reset();
};

window.addService = async (event) => {
  event.preventDefault();

  const form = event.target;

  const formData = {
    name: form.querySelector("#serviceName").value,
    description: form.querySelector("#serviceDescription").value,
    price: Number(form.querySelector("#servicePrice").value),
    duration: Number(form.querySelector("#serviceDuration").value),
  };

  const result = await window.adminService.addService(formData);

  alert(result.message);
  form.reset();
};
