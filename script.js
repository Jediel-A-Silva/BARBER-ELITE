// ===============================
// ESTADOS DE SELEÇÃO
// ===============================
window.selectedBarberId = null;
window.selectedBarberName = null;
window.selectedDate = null;
window.selectedTime = null;

document.addEventListener("DOMContentLoaded", function () {
  hideAllDashboards();
  document.getElementById("landingPage").classList.add("hidden");
});

// ===================================
// DATA STRUCTURE & INITIALIZATION
// ===================================

// Sample barbers data
let barbers = [
  {
    id: 1,
    name: "Ricardo Silva",
    email: "ricardo@barberelite.com",
    password: "123456",
    specialty: "Cortes Clássicos & Modernos",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400",
    rating: 4.9,
  },
  {
    id: 2,
    name: "Pedro Santos",
    email: "pedro@barberelite.com",
    password: "123456",
    specialty: "Barba & Acabamento",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400",
    rating: 4.8,
  },
  {
    id: 3,
    name: "Carlos Mendes",
    email: "carlos@barberelite.com",
    password: "123456",
    specialty: "Cortes Premium & Desenhos",
    photo:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400",
    rating: 5.0,
  },
];

// ===================================
// NAVIGATION FUNCTIONS
// ===================================

function showLanding() {
  document.getElementById("landingPage").classList.remove("hidden");
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("clientDashboard").classList.add("hidden");
  document.getElementById("barberDashboard").classList.add("hidden");
  document.getElementById("adminDashboard").classList.add("hidden");
}

function showLogin() {
  document.getElementById("landingPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
  document.getElementById("clientDashboard").classList.add("hidden");
  document.getElementById("barberDashboard").classList.add("hidden");
  document.getElementById("adminDashboard").classList.add("hidden");
}

function showClientDashboard() {
  if (!window.currentUser) {
    alert("Usuário não autenticado.");
    return;
  }

  hideAllDashboards();
  document.getElementById("clientDashboard").classList.remove("hidden");

  if (typeof loadClientData === "function") {
    loadClientData();
  }
}

function showBarberDashboard() {
  if (!window.currentUser) {
    alert("Usuário não autenticado.");
    return;
  }

  hideAllDashboards();
  document.getElementById("barberDashboard").classList.remove("hidden");

  if (typeof loadBarberData === "function") {
    loadBarberData();
  }
}

function showAdminDashboard() {
  if (!window.currentUser) {
    alert("Usuário não autenticado.");
    return;
  }

  hideAllDashboards();
  document.getElementById("adminDashboard").classList.remove("hidden");

  if (typeof loadAdminData === "function") {
    loadAdminData();
  }
}

// ===================================
// CLIENT DASHBOARD FUNCTIONS
// ===================================

function showClientSection(section, event) {
  document
    .querySelectorAll("#clientDashboard .dashboard-section")
    .forEach((s) => s.classList.add("hidden"));

  document.getElementById("client-" + section)?.classList.remove("hidden");

  document
    .querySelectorAll("#clientDashboard .sidebar-menu a")
    .forEach((a) => a.classList.remove("active"));

  if (event?.target) {
    event.target.classList.add("active");
  }

  if (section === "new-appointment") loadBarberSelection();
  if (section === "appointments") loadClientAppointments();
  if (section === "history") loadClientHistory();
}

function loadClientData() {
  loadClientAppointments();
}

function loadClientAppointments() {
  const tbody = document.getElementById("clientAppointmentsTable");

  const upcoming = appointments.filter(
    (apt) =>
      apt.clientId === window.currentUser.uid && apt.status === "confirmed",
  );

  if (upcoming.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 20px;">
          Nenhum agendamento futuro
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = upcoming
    .map((apt) => {
      const barber = barbers.find((b) => b.id === apt.barberId);
      return `
        <tr>
          <td>${apt.date}</td>
          <td>${apt.time}</td>
          <td>${barber ? barber.name : "-"}</td>
          <td><span class="status-badge status-confirmed">Confirmado</span></td>
          <td>
            <button class="btn btn-secondary" onclick="cancelAppointment(${apt.id})">
              Cancelar
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function loadBarberSelection() {
  const grid = document.getElementById("barberSelectionGrid");

  if (!grid) {
    console.error("barberSelectionGrid não encontrado");
    return;
  }

  grid.innerHTML = "<p>Carregando barbeiros...</p>";

  try {
    const snapshot = await firebase
      .firestore()
      .collection("users")
      .where("role", "==", "barber")
      .get();

    if (snapshot.empty) {
      grid.innerHTML = "<p>Nenhum barbeiro cadastrado.</p>";
      return;
    }

    grid.innerHTML = "";

    snapshot.forEach((doc) => {
      const barber = doc.data();

      grid.innerHTML += `
        <div class="barber-select-card"
             onclick="selectBarber('${doc.id}', '${barber.name}', event)">

          <div class="barber-avatar"
               style="background-image: url('${barber.photo || ""}')">
          </div>

          <h4>${barber.name}</h4>
          <p style="font-size: 0.9rem; color: #666;">
            ${barber.specialty || "Barbeiro profissional"}
          </p>

          <p style="font-size: 0.85rem;
                    color: var(--primary-color);
                    font-weight: 600;">
            ⭐ ${barber.rating || 5}
          </p>

        </div>
      `;
    });
  } catch (error) {
    console.error("Erro ao carregar barbeiros:", error);
    grid.innerHTML = "<p>Erro ao carregar barbeiros.</p>";
  }

  document.getElementById("dateTimeSelection")?.classList.add("hidden");

  window.selectedBarberId = null;
  window.selectedTime = null;
}

window.selectBarber = function (barberId, barberName, event) {
  // ✅ USA O NOME CERTO
  window.selectedBarberId = barberId;
  window.selectedBarberName = barberName || "";

  console.log("Barbeiro selecionado:", window.selectedBarberId);

  document.querySelectorAll(".barber-select-card").forEach((card) => {
    card.classList.remove("selected");
  });

  if (event && event.target) {
    event.target.closest(".barber-select-card")?.classList.add("selected");
  }

  document.getElementById("dateTimeSelection")?.classList.remove("hidden");

  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("appointmentDate");

  if (dateInput) {
    dateInput.min = today;
    dateInput.value = today;
    window.selectedDate = today;
  }

  loadTimeSlots();
};

function loadTimeSlots() {
  const date = document.getElementById("appointmentDate").value;
  if (!date || !window.selectedBarberId) return;

  selectedDate = date;
  const grid = document.getElementById("timeSlotsGrid");

  const times = [];
  for (let hour = 9; hour <= 18; hour++) {
    times.push(`${hour.toString().padStart(2, "0")}:00`);
  }

  grid.innerHTML = times
    .map((time) => {
      const isBooked = appointments.some(
        (apt) =>
          apt.barberId === window.selectedBarberId && // ✅ aqui
          apt.date === date &&
          apt.time === time &&
          apt.status === "confirmed",
      );

      const isBlocked = blockedTimes.some(
        (bt) =>
          bt.barberId === selectedBarberId && // ✅ aqui
          bt.date === date &&
          bt.time === time,
      );

      const disabled = isBooked || isBlocked;

      return `
      <div class="time-slot ${disabled ? "disabled" : ""}"
           ${disabled ? "" : `onclick="selectTimeSlot(this, '${time}')"`}>
        ${time}
      </div>
    `;
    })
    .join("");
}

async function confirmAppointment() {
  const user = firebase.auth().currentUser;

  if (!user) {
    alert("Usuário não autenticado");
    return;
  }

  if (
    !window.selectedBarberId ||
    !window.selectedDate ||
    !window.selectedTime
  ) {
    alert("Selecione barbeiro, data e horário.");
    return;
  }

  const appointmentData = {
    clientId: user.uid,
    clientName: window.currentUser?.name || "Cliente",
    barberId: window.selectedBarberId,
    barberName: window.selectedBarberName,
    date: window.selectedDate,
    time: window.selectedTime,
    service: window.selectedService || "Corte",
    value: 50,
    status: "confirmed",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await firebase.firestore().collection("appointments").add(appointmentData);

    alert("✅ Agendamento criado com sucesso!");

    // Volta pra tela de próximos agendamentos
    showClientSection("appointments");

    // Limpa seleção (UX melhor)
    window.selectedTime = null;
    document
      .querySelectorAll(".time-slot")
      .forEach((el) => el.classList.remove("selected"));
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    alert("Erro ao criar agendamento.");
  }
}

function cancelNewAppointment() {
  if (confirm("Deseja cancelar este agendamento?")) {
    showClientSection("appointments");
  }
}

function cancelAppointment(id) {
  if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
    const apt = appointments.find((a) => a.id === id);
    if (apt) {
      apt.status = "cancelled";
      loadClientAppointments();
      alert("Agendamento cancelado com sucesso!");
    }
  }
}

// Event listener for date change
document.addEventListener("DOMContentLoaded", function () {
  const appointmentDate = document.getElementById("appointmentDate");
  if (appointmentDate) {
    appointmentDate.addEventListener("change", loadTimeSlots);
  }
});

// ===================================
// BARBER DASHBOARD FUNCTIONS
// ===================================

function showBarberSection(section, event) {
  document
    .querySelectorAll("#barberDashboard .dashboard-section")
    .forEach((s) => s.classList.add("hidden"));

  document.getElementById("barber-" + section)?.classList.remove("hidden");

  document
    .querySelectorAll("#barberDashboard .sidebar-menu a")
    .forEach((a) => a.classList.remove("active"));

  if (event?.target) {
    event.target.classList.add("active");
  }

  if (section === "schedule") loadBarberSchedule();
  if (section === "earnings") loadBarberEarnings();
  if (section === "block-times") loadBlockTimesSection();
}

function loadBarberData() {
  loadBarberSchedule();
  updateBarberStats();
}

function loadBarberSchedule() {
  const tbody = document.getElementById("barberScheduleTable");
  const today = new Date().toISOString().split("T")[0];

  const todayAppointments = (window.appointments || []).filter(
    (apt) =>
      apt.barberId === window.currentUser.uid &&
      apt.date === today &&
      apt.status === "confirmed",
  );

  if (todayAppointments.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align: center; padding: 40px;">Nenhum agendamento para hoje</td></tr>';
    return;
  }

  tbody.innerHTML = todayAppointments
    .map(
      (apt) => `
        <tr>
            <td>${apt.time}</td>
            <td>${apt.clientName}</td>
            <td><span class="status-badge status-confirmed">Confirmado</span></td>
            <td>${apt.service || "-"}</td>
        </tr>
      `,
    )
    .join("");
}

function updateBarberStats() {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const todayAppointments = appointments.filter(
    (apt) =>
      apt.barberId === window.currentUser.uid &&
      apt.date === today &&
      apt.status === "confirmed",
  );

  const monthAppointments = appointments.filter(
    (apt) =>
      apt.barberId === window.currentUser.uid &&
      apt.date.startsWith(currentMonth) &&
      apt.status === "confirmed",
  );

  const todayEarnings = todayAppointments.reduce(
    (sum, apt) => sum + Number(apt.value || 0),
    0,
  );

  document.getElementById("barberTodayCount").textContent =
    todayAppointments.length;
  document.getElementById("barberMonthCount").textContent =
    monthAppointments.length;
  document.getElementById("barberDailyEarnings").textContent =
    `Ganhos Hoje: R$ ${todayEarnings.toFixed(2)}`;
}

function loadBarberEarnings() {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const todayAppointments = appointments.filter(
    (apt) =>
      apt.barberId === window.currentUser.uid &&
      apt.date === today &&
      apt.status === "confirmed",
  );

  const monthAppointments = appointments.filter(
    (apt) =>
      apt.barberId === window.currentUser.uid &&
      apt.date.startsWith(currentMonth) &&
      apt.status === "confirmed",
  );

  const todayEarnings = todayAppointments.reduce(
    (sum, apt) => sum + Number(apt.value || 0),
    0,
  );
  const monthEarnings = monthAppointments.reduce(
    (sum, apt) => sum + Number(apt.value || 0),
    0,
  );

  document.getElementById("earningsToday").textContent =
    `R$ ${todayEarnings.toFixed(2)}`;
  document.getElementById("earningsMonth").textContent =
    `R$ ${monthEarnings.toFixed(2)}`;

  // Load earnings table
  const tbody = document.getElementById("barberEarningsTable");
  const allEarnings = appointments
    .filter(
      (apt) =>
        apt.barberId === window.currentUser.uid && apt.status === "confirmed",
    )
    .reverse();

  if (allEarnings.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align: center; padding: 40px;">Nenhum ganho registrado</td></tr>';
    return;
  }

  tbody.innerHTML = allEarnings
    .slice(0, 20)
    .map(
      (apt) => `
        <tr>
            <td>${formatDate(apt.date)}</td>
            <td>${apt.clientName}</td>
            <td>${apt.time}</td>
            <td style="color: var(--success); font-weight: 600;">R$ ${Number(apt.value || 0).toFixed(2)}</td>
        </tr>
    `,
    )
    .join("");
}

function loadBlockTimesSection() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("blockDate").min = today;
  document.getElementById("blockDate").value = today;
  loadBlockTimeSlots();
}

function loadBlockTimeSlots() {
  const date = document.getElementById("blockDate").value;
  const grid = document.getElementById("blockTimeSlotsGrid");

  const times = [];
  for (let hour = 9; hour <= 18; hour++) {
    times.push(`${hour.toString().padStart(2, "0")}:00`);
  }

  grid.innerHTML = times
    .map((time) => {
      const isBlocked = blockedTimes.some(
        (bt) =>
          bt.barberId === window.currentUser.uid &&
          bt.date === date &&
          bt.time === time,
      );

      return `
            <div class="time-slot ${isBlocked ? "selected" : ""}" 
                 onclick="toggleBlockTime('${time}')">
                ${time}
                ${isBlocked ? "<br><small>(Bloqueado)</small>" : ""}
            </div>
        `;
    })
    .join("");
}

function toggleBlockTime(time) {
  const date = document.getElementById("blockDate").value;
  const index = blockedTimes.findIndex(
    (bt) =>
      bt.barberId === currentUser.barberId &&
      bt.date === date &&
      bt.time === time,
  );

  if (index >= 0) {
    blockedTimes.splice(index, 1);
  } else {
    blockedTimes.push({
      barberId: currentUser.barberId,
      date: date,
      time: time,
    });
  }

  loadBlockTimeSlots();
}

function saveBlockedTimes() {
  alert("Horários bloqueados salvos com sucesso!");
}

document.addEventListener("DOMContentLoaded", function () {
  const blockDate = document.getElementById("blockDate");
  if (blockDate) {
    blockDate.addEventListener("change", loadBlockTimeSlots);
  }
});

function selectTimeSlot(el, time) {
  if (el.classList.contains("disabled")) return;

  document.querySelectorAll(".time-slot").forEach((slot) => {
    slot.classList.remove("selected");
  });

  el.classList.add("selected");
  selectedTime = time;

  console.log("Horário selecionado:", selectedTime);
}

// ===================================
// ADMIN DASHBOARD FUNCTIONS
// ===================================

function loadAdminData() {
  loadAdminOverview();
}

function loadAdminOverview() {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const todayAppointments = appointments.filter(
    (apt) => apt.date === today && apt.status === "confirmed",
  );

  const monthAppointments = appointments.filter(
    (apt) => apt.date.startsWith(currentMonth) && apt.status === "confirmed",
  );

  const monthRevenue = monthAppointments.reduce(
    (sum, apt) => sum + Number(apt.value || 0),
    0,
  );

  const uniqueClients = new Set(appointments.map((apt) => apt.clientEmail))
    .size;

  document.getElementById("adminTodayAppointments").textContent =
    todayAppointments.length;
  document.getElementById("adminTotalBarbers").textContent = barbers.length;
  document.getElementById("adminMonthRevenue").textContent =
    `R$ ${monthRevenue.toFixed(2)}`;
  document.getElementById("adminActiveClients").textContent = uniqueClients;

  // Load today's table
  const tbody = document.getElementById("adminTodayTable");

  if (todayAppointments.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhum agendamento para hoje</td></tr>';
    return;
  }

  tbody.innerHTML = todayAppointments
    .map((apt) => {
      const barber = barbers.find((b) => b.id === apt.barberId);
      return `
            <tr>
                <td>${apt.time}</td>
                <td>${apt.clientName}</td>
                <td>${barber ? barber.name : "N/A"}</td>
                <td><span class="status-badge status-confirmed">Confirmado</span></td>
                <td style="color: var(--success); font-weight: 600;">R$ ${Number(apt.value || 0).toFixed(2)}</td>
            </tr>
        `;
    })
    .join("");
}

function loadAdminAllAppointments() {
  const tbody = document.getElementById("adminAllAppointmentsTable");

  if (appointments.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; padding: 40px;">Nenhum agendamento registrado</td></tr>';
    return;
  }

  tbody.innerHTML = appointments
    .slice()
    .reverse()
    .map((apt) => {
      const barber = barbers.find((b) => b.id === apt.barberId);
      const statusClass =
        apt.status === "cancelled" ? "status-cancelled" : "status-confirmed";
      const statusText =
        apt.status === "cancelled" ? "Cancelado" : "Confirmado";

      return `
            <tr>
                <td>${formatDate(apt.date)}</td>
                <td>${apt.time}</td>
                <td>${apt.clientName}</td>
                <td>${barber ? barber.name : "N/A"}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td style="color: var(--success); font-weight: 600;">R$ ${Number(apt.value || 0).toFixed(2)}</td>
            </tr>
        `;
    })
    .join("");
}

function loadAdminBarbers() {
  const tbody = document.getElementById("adminBarbersTable");
  const today = new Date().toISOString().split("T")[0];

  tbody.innerHTML = barbers
    .map((barber) => {
      const todayCount = appointments.filter(
        (apt) =>
          apt.barberId === barber.id &&
          apt.date === today &&
          apt.status === "confirmed",
      ).length;

      return `
            <tr>
                <td>${barber.name}</td>
                <td>${barber.email}</td>
                <td>${barber.specialty}</td>
                <td>${todayCount}</td>
                <td>
                    <button class="btn btn-danger" style="padding: 8px 16px; font-size: 0.9rem;" 
                        onclick="removeBarber(${barber.id})">
                        Remover
                    </button>
                </td>
            </tr>
        `;
    })
    .join("");
}

function loadAdminFinancial() {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const todayRevenue = appointments.filter(
    (apt) => apt.date === today && apt.status === "confirmed",
  );
  const todayEarnings = todayAppointments.reduce(
    (sum, apt) => sum + Number(apt.value || 0),
    0,
  );

  const monthRevenue = appointments
    .filter(
      (apt) => apt.date.startsWith(currentMonth) && apt.status === "confirmed",
    )
    .reduce((sum, apt) => sum + (apt.value || 0), 0);

  const expenses = 3500.0;
  const profit = monthRevenue - expenses;

  document.getElementById("financeDayRevenue").textContent =
    `R$ ${todayRevenue.toFixed(2)}`;
  document.getElementById("financeMonthRevenue").textContent =
    `R$ ${monthRevenue.toFixed(2)}`;
  document.getElementById("financeProfit").textContent =
    `R$ ${profit.toFixed(2)}`;
}

function showAddBarberModal() {
  document.getElementById("addBarberModal").classList.add("show");
}

function closeAddBarberModal() {
  document.getElementById("addBarberModal").classList.remove("show");
  document.getElementById("addBarberForm").reset();
}

document.addEventListener("DOMContentLoaded", function () {
  const addBarberForm = document.getElementById("addBarberForm");
  if (addBarberForm) {
    addBarberForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const newBarber = {
        id: barbers.length + 1,
        name: document.getElementById("newBarberName").value,
        email: document.getElementById("newBarberEmail").value,
        password: document.getElementById("newBarberPassword").value,
        specialty: document.getElementById("newBarberSpecialty").value,
        photo:
          document.getElementById("newBarberPhoto").value ||
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400",
        rating: 5.0,
      };

      barbers.push(newBarber);
      closeAddBarberModal();
      loadAdminBarbers();
      renderBarbersOnLanding();
      alert("Barbeiro adicionado com sucesso!");
    });
  }
});

function removeBarber(id) {
  if (confirm("Tem certeza que deseja remover este barbeiro?")) {
    const index = barbers.findIndex((b) => b.id === id);
    if (index >= 0) {
      barbers.splice(index, 1);
      loadAdminBarbers();
      renderBarbersOnLanding();
      alert("Barbeiro removido com sucesso!");
    }
  }
}

function saveSettings() {
  alert("Configurações salvas com sucesso!");
}

// ===================================
// LANDING PAGE FUNCTIONS
// ===================================

function renderBarbersOnLanding() {
  const grid = document.getElementById("barbersGrid");
  grid.innerHTML = barbers
    .map(
      (barber) => `
        <div class="barber-card">
            <div class="barber-image" style="background-image: url('${barber.photo}')"></div>
            <div class="barber-info">
                <h3>${barber.name}</h3>
                <p>⭐ ${barber.rating}/5.0</p>
                <p class="barber-specialty">${barber.specialty}</p>
            </div>
        </div>
    `,
    )
    .join("");
}

// ===================================
// CAROUSEL FUNCTIONS
// ===================================

function initCarousel(carouselId, controlsId) {
  const track = document.getElementById(carouselId);
  const controls = document.getElementById(controlsId);
  const items = track.children.length;
  let currentIndex = 0;

  // Create dots
  for (let i = 0; i < items; i++) {
    const dot = document.createElement("div");
    dot.className = "carousel-dot" + (i === 0 ? " active" : "");
    dot.addEventListener("click", () => goToSlide(i));
    controls.appendChild(dot);
  }

  function goToSlide(index) {
    currentIndex = index;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Update dots
    Array.from(controls.children).forEach((dot, i) => {
      dot.classList.toggle("active", i === currentIndex);
    });
  }

  // Auto-slide
  setInterval(() => {
    currentIndex = (currentIndex + 1) % items;
    goToSlide(currentIndex);
  }, 5000);
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

// ===================================
// SCROLL EFFECTS
// ===================================

window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener("DOMContentLoaded", function () {
  // Render barbers on landing page
  renderBarbersOnLanding();

  // Initialize carousels
  initCarousel("carousel1", "carousel1-controls");
  initCarousel("carousel2", "carousel2-controls");
});

// Smooth scroll for anchor links
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href !== "#" && href.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    });
  });
});

// ===============================
// ESTADO GLOBAL
// ===============================
window.currentUser = null;
window.appointments = [];
window.blockedTimes = [];

// ===============================
// ELEMENTOS
// ===============================
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
const roleSelect = document.getElementById("loginRole");

// Dashboards / Páginas
const loginPage = document.getElementById("loginPage");
const landingPage = document.getElementById("landingPage");
const clientDashboard = document.getElementById("clientDashboard");
const barberDashboard = document.getElementById("barberDashboard");
const adminDashboard = document.getElementById("adminDashboard");

// ===============================
// FUNÇÕES DE SEGURANÇA (EVITA TELA BRANCA)
// ===============================
window.showClientDashboard ||= function () {
  hideAllDashboards();
  clientDashboard?.classList.remove("hidden");
};

window.showBarberDashboard ||= function () {
  hideAllDashboards();
  barberDashboard?.classList.remove("hidden");
};

window.showAdminDashboard ||= function () {
  hideAllDashboards();
  adminDashboard?.classList.remove("hidden");
};

window.loadBarberSchedule ||= function () {};
window.loadClientAppointments ||= function () {};
window.loadAdminAllAppointments ||= function () {};

// ===============================
// FUNÇÃO AUXILIAR
// ===============================
// ===============================
// CONTROLE DE TELAS
// ===============================

function hideAllDashboards() {
  document.getElementById("landingPage")?.classList.add("hidden");
  document.getElementById("loginPage")?.classList.add("hidden");
  document.getElementById("registerPage")?.classList.add("hidden");
  document.getElementById("clientDashboard")?.classList.add("hidden");
  document.getElementById("barberDashboard")?.classList.add("hidden");
  document.getElementById("adminDashboard")?.classList.add("hidden");
}

function showClientDashboard() {
  hideAllDashboards();
  document.getElementById("clientDashboard")?.classList.remove("hidden");
}

function showBarberDashboard() {
  hideAllDashboards();
  document.getElementById("barberDashboard")?.classList.remove("hidden");
}

function showAdminDashboard() {
  hideAllDashboards();
  document.getElementById("adminDashboard")?.classList.remove("hidden");
}

function showLogin() {
  hideAllDashboards();
  document.getElementById("loginPage")?.classList.remove("hidden");
}

function showLanding() {
  hideAllDashboards();
  document.getElementById("landingPage")?.classList.remove("hidden");
}


// ===============================
// LOGIN
// ===============================
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Submit do login disparado");

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const roleSelected = roleSelect.value;

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

      const userData = userDoc.data();

      if (userData.role !== roleSelected) {
        alert("Perfil selecionado incorreto.");
        await firebase.auth().signOut();
        return;
      }

      window.currentUser = { uid, ...userData };

      console.log("Login finalizado com sucesso", window.currentUser);
      // Dashboard é mostrado no onAuthStateChanged
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro no login: " + error.message);
    }
  });
}

// ===============================
// LISTENER GLOBAL DE APPOINTMENTS
// ===============================
let unsubscribeAppointments = null;

function listenAppointments() {
  if (unsubscribeAppointments) unsubscribeAppointments();

  unsubscribeAppointments = firebase
    .firestore()
    .collection("appointments")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      const data = [];

      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });

      window.appointments = data;
      console.log("Appointments atualizados:", data);

      if (window.currentUser?.role === "barber") {
        loadBarberSchedule();
        updateBarberStats(); // 👈 ADICIONE ISSO
      }

      if (window.currentUser?.role === "client") loadClientAppointments();
      if (window.currentUser?.role === "admin") loadAdminAllAppointments();
    });
}

// ===============================
// LOGOUT
// ===============================
async function logout() {
  if (unsubscribeAppointments) {
    unsubscribeAppointments();
    unsubscribeAppointments = null;
  }

  await firebase.auth().signOut();
  window.currentUser = null;

  hideAllDashboards();
  loginPage?.classList.remove("hidden");

  console.log("Logout realizado");
}

// ===============================
// RESTAURA SESSÃO
// ===============================
firebase.auth().onAuthStateChanged(async (user) => {

  if (!user) {
    showLogin();
    return;
  }

  try {
    const userRef = firebase.firestore().collection("users").doc(user.uid);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        name: user.displayName || "Cliente",
        email: user.email,
        role: "client",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      userDoc = await userRef.get();
    }

    const userData = userDoc.data();

    if (userData.role === "client") showClientDashboard();
    if (userData.role === "barber") showBarberDashboard();
    if (userData.role === "admin") showAdminDashboard();

  } catch (error) {
    console.error("Erro ao restaurar sessão:", error);
  }
});
// ===============================
// CRIAR APPOINTMENT
// ===============================
async function createAppointment(data) {
  try {
    await firebase.firestore().collection("appointments").add(data);
    console.log("Agendamento criado com sucesso");
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
  }
}

// Tornar funções globais (porque você usa onclick no HTML)
window.showLogin = showLogin;
window.showLanding = showLanding;
window.showClientDashboard = showClientDashboard;
window.showBarberDashboard = showBarberDashboard;
window.showAdminDashboard = showAdminDashboard;
