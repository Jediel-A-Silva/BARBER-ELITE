// ===============================
// ESTADO GLOBAL (único ponto de definição)
// ===============================
if (typeof window.selectedBarber === "undefined") {
  window.selectedBarber = null;
}

if (typeof window.selectedTime === "undefined") {
  window.selectedTime = null;
}

// ===============================
// SELEÇÃO DE BARBEIRO
// ===============================
window.selectBarber = function (barberId) {

  window.selectedBarber = barberId;

  document.querySelectorAll(".barber-card")
    .forEach(card => card.classList.remove("selected"));

  const selectedCard =
    document.querySelector(`[data-barber-id="${barberId}"]`);

  if (selectedCard) {
    selectedCard.classList.add("selected");
  }

  document.getElementById("dateTimeSelection")
    ?.classList.remove("hidden");
};

// ===============================
// SELEÇÃO DE HORÁRIO
// ===============================
window.selectTime = function (time) {

  window.selectedTime = time;

  document.querySelectorAll(".time-slot")
    .forEach(btn => btn.classList.remove("selected"));

  const selectedBtn =
    document.querySelector(`[data-time="${time}"]`);

  if (selectedBtn) {
    selectedBtn.classList.add("selected");
  }
};

// ===============================
// CONFIRMAR AGENDAMENTO
// ===============================
window.confirmAppointment = async function () {

  const selectedDate =
    document.getElementById("appointmentDate")?.value;

  if (!window.selectedBarber || !selectedDate || !window.selectedTime) {
    alert("Selecione barbeiro, data e horário");
    return;
  }

  if (!window.currentUser) {
    alert("Você precisa estar logado");
    return;
  }

  if (!window.db) {
    console.error("Firestore (db) não inicializado.");
    alert("Erro interno do sistema.");
    return;
  }

  try {

    await window.db.collection("appointments").add({
      barberId: window.selectedBarber,
      clientId: window.currentUser.uid,
      clientName: window.currentUser.name || "",
      clientEmail: window.currentUser.email || "",
      date: selectedDate,
      time: window.selectedTime,
      status: "confirmed",
      value: 50,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Agendamento confirmado!");

    // Resetar estado
    window.selectedBarber = null;
    window.selectedTime = null;

    document.querySelectorAll(".selected")
      .forEach(el => el.classList.remove("selected"));

    const dateInput = document.getElementById("appointmentDate");
    if (dateInput) dateInput.value = "";

    window.loadClientAppointments();

  } catch (error) {
    console.error("Erro ao agendar:", error);
    alert("Erro ao agendar");
  }
};

// ===============================
// LISTAR AGENDAMENTOS
// ===============================
window.loadClientAppointments = async function () {

  if (!window.currentUser || !window.db) return;

  const container =
    document.getElementById("clientAppointments");

  if (!container) return;

  container.innerHTML = "";

  try {

    const snapshot = await window.db
      .collection("appointments")
      .where("clientId", "==", window.currentUser.uid)
      .orderBy("createdAt", "desc")
      .get();

    snapshot.forEach((doc) => {

      const apt = doc.data();

      container.innerHTML += `
        <div class="appointment-card">
          <p><strong>${apt.date}</strong> - ${apt.time}</p>
          <p>Status: ${apt.status}</p>
          ${
            apt.status === "confirmed"
              ? `<button onclick="cancelAppointment('${doc.id}')">
                    Cancelar
                 </button>`
              : ""
          }
        </div>
      `;
    });

  } catch (error) {
    console.error("Erro ao carregar agendamentos:", error);
  }
};

// ===============================
// CANCELAR AGENDAMENTO
// ===============================
window.cancelAppointment = async function (id) {

  if (!window.db) return;

  try {

    await window.db.collection("appointments")
      .doc(id)
      .update({ status: "cancelled" });

    window.loadClientAppointments();

  } catch (error) {
    console.error("Erro ao cancelar:", error);
    alert("Erro ao cancelar");
  }
};
