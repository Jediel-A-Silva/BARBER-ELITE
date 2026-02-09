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

// Appointments storage
let appointments = [];

// Blocked times storage
let blockedTimes = [];

// Selected values for new appointment
let selectedBarber = null;
let selectedDate = null;
let selectedTime = null;

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
  if (!window.currentUser) return; // 🔒 só entra se estiver logado

  document.getElementById("landingPage").classList.add("hidden");
  document.getElementById("loginPage").classList.add("hidden");

  document.getElementById("clientDashboard").classList.remove("hidden");
  document.getElementById("barberDashboard").classList.add("hidden");
  document.getElementById("adminDashboard").classList.add("hidden");

  if (typeof loadClientData === "function") {
    loadClientData();
  }
}

function showBarberDashboard() {
  if (!window.currentUser) return; // 🔒 só entra se estiver logado

  document.getElementById("landingPage").classList.add("hidden");
  document.getElementById("loginPage").classList.add("hidden");

  document.getElementById("barberDashboard").classList.remove("hidden");
  document.getElementById("clientDashboard").classList.add("hidden");
  document.getElementById("adminDashboard").classList.add("hidden");

  if (typeof loadBarberData === "function") {
    loadBarberData();
  }
}

function showAdminDashboard() {
  if (!window.currentUser) return; // 🔒 só entra se estiver logado

  document.getElementById("landingPage").classList.add("hidden");
  document.getElementById("loginPage").classList.add("hidden");

  document.getElementById("adminDashboard").classList.remove("hidden");
  document.getElementById("clientDashboard").classList.add("hidden");
  document.getElementById("barberDashboard").classList.add("hidden");

  if (typeof loadAdminData === "function") {
    loadAdminData();
  }
}

function logout() {
  currentUser = null;
  showLanding();
}


// ===================================
// CLIENT DASHBOARD FUNCTIONS
// ===================================

function showClientSection(section) {
  // Hide all sections
  document
    .querySelectorAll("#clientDashboard .dashboard-section")
    .forEach((s) => {
      s.classList.add("hidden");
    });

  // Show selected section
  document.getElementById("client-" + section).classList.remove("hidden");

  // Update active menu
  document.querySelectorAll("#clientDashboard .sidebar-menu a").forEach((a) => {
    a.classList.remove("active");
  });
  event.target.classList.add("active");

  // Load section data
  if (section === "new-appointment") {
    loadBarberSelection();
  } else if (section === "appointments") {
    loadClientAppointments();
  } else if (section === "history") {
    loadClientHistory();
  }
}

function loadClientData() {
  loadClientAppointments();
}

function loadClientAppointments() {
  const tbody = document.getElementById("clientAppointmentsTable");
  const today = new Date().toISOString().split("T")[0];

  const userAppointments = appointments.filter(
    (apt) =>
      apt.clientEmail === currentUser.email &&
      apt.date >= today &&
      apt.status === "confirmed",
  );

  if (userAppointments.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align: center; padding: 40px;">Você não tem agendamentos futuros</td></tr>';
    return;
  }

  tbody.innerHTML = userAppointments
    .map((apt) => {
      const barber = barbers.find((b) => b.id === apt.barberId);
      return `
            <tr>
                <td>${formatDate(apt.date)}</td>
                <td>${apt.time}</td>
                <td>${barber ? barber.name : "N/A"}</td>
                <td><span class="status-badge status-confirmed">Confirmado</span></td>
                <td>
                    <button class="btn btn-danger" style="padding: 8px 16px; font-size: 0.9rem;" 
                        onclick="cancelAppointment(${apt.id})">
                        Cancelar
                    </button>
                </td>
            </tr>
        `;
    })
    .join("");
}

function loadClientHistory() {
  const tbody = document.getElementById("clientHistoryTable");
  const today = new Date().toISOString().split("T")[0];

  const pastAppointments = appointments.filter(
    (apt) =>
      apt.clientEmail === currentUser.email &&
      (apt.date < today || apt.status === "cancelled"),
  );

  if (pastAppointments.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align: center; padding: 40px;">Sem histórico de agendamentos</td></tr>';
    return;
  }

  tbody.innerHTML = pastAppointments
    .map((apt) => {
      const barber = barbers.find((b) => b.id === apt.barberId);
      const statusClass =
        apt.status === "cancelled" ? "status-cancelled" : "status-confirmed";
      const statusText = apt.status === "cancelled" ? "Cancelado" : "Concluído";

      return `
            <tr>
                <td>${formatDate(apt.date)}</td>
                <td>${apt.time}</td>
                <td>${barber ? barber.name : "N/A"}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    })
    .join("");
}

function loadBarberSelection() {
  const grid = document.getElementById("barberSelectionGrid");
  grid.innerHTML = barbers
    .map(
      (barber) => `
        <div class="barber-select-card" onclick="selectBarber(${barber.id})">
            <div class="barber-avatar" style="background-image: url('${barber.photo}')"></div>
            <h4>${barber.name}</h4>
            <p style="font-size: 0.9rem; color: #666;">${barber.specialty}</p>
            <p style="font-size: 0.85rem; color: var(--primary-color); font-weight: 600;">⭐ ${barber.rating}</p>
        </div>
    `,
    )
    .join("");

  document.getElementById("dateTimeSelection").classList.add("hidden");
  selectedBarber = null;
  selectedDate = null;
  selectedTime = null;
}

function selectBarber(barberId) {
  selectedBarber = barberId;

  // Update UI
  document.querySelectorAll(".barber-select-card").forEach((card) => {
    card.classList.remove("selected");
  });
  event.target.closest(".barber-select-card").classList.add("selected");

  // Show date/time selection
  document.getElementById("dateTimeSelection").classList.remove("hidden");

  // Set min date to today
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("appointmentDate");
  dateInput.min = today;
  dateInput.value = today;

  loadTimeSlots();
}

function loadTimeSlots() {
  const date = document.getElementById("appointmentDate").value;
  if (!date || !selectedBarber) return;

  selectedDate = date;
  const grid = document.getElementById("timeSlotsGrid");

  // Generate time slots from 9:00 to 18:00
  const times = [];
  for (let hour = 9; hour <= 18; hour++) {
    times.push(`${hour.toString().padStart(2, "0")}:00`);
  }

  grid.innerHTML = times
    .map((time) => {
      const isBooked = appointments.some(
        (apt) =>
          apt.barberId === selectedBarber &&
          apt.date === date &&
          apt.time === time &&
          apt.status === "confirmed",
      );

      const isBlocked = blockedTimes.some(
        (bt) =>
          bt.barberId === selectedBarber &&
          bt.date === date &&
          bt.time === time,
      );

      const disabled = isBooked || isBlocked;

      return `
            <div class="time-slot ${disabled ? "disabled" : ""}" 
                 onclick="${disabled ? "" : `selectTimeSlot('${time}')`}">
                ${time}
                ${disabled ? "<br><small>(Ocupado)</small>" : ""}
            </div>
        `;
    })
    .join("");
}

function selectTimeSlot(time) {
  selectedTime = time;

  document.querySelectorAll(".time-slot").forEach((slot) => {
    slot.classList.remove("selected");
  });
  event.target.classList.add("selected");
}

function confirmAppointment() {
  if (!selectedBarber || !selectedDate || !selectedTime) {
    alert("Por favor, selecione barbeiro, data e horário");
    return;
  }

  const appointment = {
    id: appointments.length + 1,
    barberId: selectedBarber,
    clientEmail: currentUser.email,
    clientName: currentUser.name,
    date: selectedDate,
    time: selectedTime,
    status: "confirmed",
    value: 50.0,
  };

  appointments.push(appointment);

  alert("Agendamento confirmado com sucesso!");
  showClientSection("appointments");
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

function showBarberSection(section) {
  document
    .querySelectorAll("#barberDashboard .dashboard-section")
    .forEach((s) => {
      s.classList.add("hidden");
    });

  document.getElementById("barber-" + section).classList.remove("hidden");

  document.querySelectorAll("#barberDashboard .sidebar-menu a").forEach((a) => {
    a.classList.remove("active");
  });
  event.target.classList.add("active");

  if (section === "schedule") {
    loadBarberSchedule();
  } else if (section === "earnings") {
    loadBarberEarnings();
  } else if (section === "block-times") {
    loadBlockTimesSection();
  }
}

function loadBarberData() {
  loadBarberSchedule();
  updateBarberStats();
}

function loadBarberSchedule() {
  const tbody = document.getElementById("barberScheduleTable");
  const today = new Date().toISOString().split("T")[0];

  const todayAppointments = appointments.filter(
    (apt) =>
      apt.barberId === currentUser.barberId &&
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
            <td>R$ ${apt.value.toFixed(2)}</td>
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
      apt.barberId === currentUser.barberId &&
      apt.date === today &&
      apt.status === "confirmed",
  );

  const monthAppointments = appointments.filter(
    (apt) =>
      apt.barberId === currentUser.barberId &&
      apt.date.startsWith(currentMonth) &&
      apt.status === "confirmed",
  );

  const todayEarnings = todayAppointments.reduce(
    (sum, apt) => sum + apt.value,
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
      apt.barberId === currentUser.barberId &&
      apt.date === today &&
      apt.status === "confirmed",
  );

  const monthAppointments = appointments.filter(
    (apt) =>
      apt.barberId === currentUser.barberId &&
      apt.date.startsWith(currentMonth) &&
      apt.status === "confirmed",
  );

  const todayEarnings = todayAppointments.reduce(
    (sum, apt) => sum + apt.value,
    0,
  );
  const monthEarnings = monthAppointments.reduce(
    (sum, apt) => sum + apt.value,
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
        apt.barberId === currentUser.barberId && apt.status === "confirmed",
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
            <td style="color: var(--success); font-weight: 600;">R$ ${apt.value.toFixed(2)}</td>
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
          bt.barberId === currentUser.barberId &&
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

// ===================================
// ADMIN DASHBOARD FUNCTIONS
// ===================================

function showAdminSection(section) {
  document
    .querySelectorAll("#adminDashboard .dashboard-section")
    .forEach((s) => {
      s.classList.add("hidden");
    });

  document.getElementById("admin-" + section).classList.remove("hidden");

  document.querySelectorAll("#adminDashboard .sidebar-menu a").forEach((a) => {
    a.classList.remove("active");
  });
  event.target.classList.add("active");

  if (section === "overview") {
    loadAdminOverview();
  } else if (section === "appointments") {
    loadAdminAllAppointments();
  } else if (section === "barbers") {
    loadAdminBarbers();
  } else if (section === "financeiro") {
    loadAdminFinancial();
  }
}

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
    (sum, apt) => sum + apt.value,
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
                <td style="color: var(--success); font-weight: 600;">R$ ${apt.value.toFixed(2)}</td>
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
                <td style="color: var(--success); font-weight: 600;">R$ ${apt.value.toFixed(2)}</td>
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

  const todayRevenue = appointments
    .filter((apt) => apt.date === today && apt.status === "confirmed")
    .reduce((sum, apt) => sum + apt.value, 0);

  const monthRevenue = appointments
    .filter(
      (apt) => apt.date.startsWith(currentMonth) && apt.status === "confirmed",
    )
    .reduce((sum, apt) => sum + apt.value, 0);

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

  // Add sample appointments for demo
  appointments = [
    {
      id: 1,
      barberId: 1,
      clientEmail: "cliente@teste.com",
      clientName: "João Silva",
      date: new Date().toISOString().split("T")[0],
      time: "10:00",
      status: "confirmed",
      value: 50.0,
    },
    {
      id: 2,
      barberId: 2,
      clientEmail: "cliente@teste.com",
      clientName: "João Silva",
      date: new Date().toISOString().split("T")[0],
      time: "14:00",
      status: "confirmed",
      value: 50.0,
    },
  ];
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
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) {
    console.error("Formulário de login não encontrado");
    return;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // 🔥 ESSENCIAL

    console.log("Submit do login disparado");

    const email = document.getElementById("loginEmail").value;
    const senha = document.getElementById("loginPassword").value;
    const roleSelecionado = document.getElementById("loginRole").value;

    try {
      const userCredential = await firebase
        .auth()
        .signInWithEmailAndPassword(email, senha);

      console.log("Auth OK");

      const uid = userCredential.user.uid;

      const userDoc = await firebase
        .firestore()
        .collection("users")
        .doc(uid)
        .get();

      if (!userDoc.exists) {
        alert("Usuário sem perfil no sistema");
        return;
      }

      const roleBanco = userDoc.data().role;

      if (roleBanco !== roleSelecionado) {
        alert("Perfil incorreto para este usuário");
        return;
      }

      // 🔀 CONTROLE DE TELAS
      showClientDashboard();
      // ou
      showBarberDashboard();
      // ou
      showAdminDashboard();

      if (roleBanco === "cliente") {
        document.getElementById("clientDashboard").classList.remove("hidden");
      }

      if (roleBanco === "barbeiro") {
        document.getElementById("barberDashboard").classList.remove("hidden");
      }

      if (roleBanco === "admin") {
        document.getElementById("adminDashboard").classList.remove("hidden");
      }

      console.log("Login finalizado com sucesso");
    } catch (error) {
      console.error(error);
      alert("Erro ao fazer login: " + error.message);
    }
  });
});

// ===============================
// ESTADO GLOBAL
// ===============================
window.currentUser = null;

// ===============================
// ELEMENTOS
// ===============================
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
const roleSelect = document.getElementById("loginRole");

// Dashboards
const loginSection = document.getElementById("loginPage");
const clientDashboard = document.getElementById("clientDashboard");
const barberDashboard = document.getElementById("barberDashboard");
const adminDashboard = document.getElementById("adminDashboard");

// ===============================
// FUNÇÃO AUXILIAR
// ===============================
function hideAllDashboards() {
  loginSection.classList.add("hidden");
  clientDashboard.classList.add("hidden");
  barberDashboard.classList.add("hidden");
  adminDashboard.classList.add("hidden");
}

// ===============================
// DASHBOARDS
// ===============================
function showClientDashboard() {
  hideAllDashboards();
  clientDashboard.classList.remove("hidden");
  console.log("Dashboard do CLIENTE carregado");
}

function showBarberDashboard() {
  hideAllDashboards();
  barberDashboard.classList.remove("hidden");
  console.log("Dashboard do BARBEIRO carregado");
}

function showAdminDashboard() {
  hideAllDashboards();
  adminDashboard.classList.remove("hidden");
  console.log("Dashboard do ADMIN carregado");
}

// ===============================
// LOGIN
// ===============================
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
    // 🔐 Firebase Auth
    const userCredential = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);

    console.log("Auth OK");

    const uid = userCredential.user.uid;

    // 🔎 Busca no Firestore
    const userDoc = await firebase
      .firestore()
      .collection("users")
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      alert("Usuário não encontrado no sistema.");
      await firebase.auth().signOut();
      return;
    }

    const userData = userDoc.data();

    // 🔐 Validação de perfil
    if (userData.role !== roleSelected) {
      alert("Perfil selecionado incorreto.");
      await firebase.auth().signOut();
      return;
    }

    // ✅ Estado global correto
    window.currentUser = {
      uid,
      ...userData
    };

    console.log("Login finalizado com sucesso", window.currentUser);

    // 🚀 Redirecionamento por perfil
    if (userData.role === "cliente") showClientDashboard();
    if (userData.role === "barbeiro") showBarberDashboard();
    if (userData.role === "admin") showAdminDashboard();

  } catch (error) {
    console.error("Erro no login:", error);
    alert("Erro no login: " + error.message);
  }
});

// ===============================
// LOGOUT
// ===============================
async function logout() {
  await firebase.auth().signOut();
  window.currentUser = null;
  hideAllDashboards();
  loginSection.classList.remove("hidden");
  console.log("Logout realizado");
}
