/* ===================================
   ADMIN MODULE
   Gerencia funcionalidades administrativas
=================================== */

class AdminService {
    constructor() {
        this.db = window.firebaseDb;
        this.authService = window.authService;
    }

    // ========== GERENCIAMENTO DE BARBEIROS ==========

    // Lista todos os barbeiros
    async getBarbers() {
        try {
            const snapshot = await this.db
                .collection('barbers')
                .orderBy('name')
                .get();

            const barbers = [];
            snapshot.forEach(doc => {
                barbers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return {
                success: true,
                barbers
            };
        } catch (error) {
            console.error('Erro ao buscar barbeiros:', error);
            return {
                success: false,
                error: 'Erro ao buscar barbeiros',
                barbers: []
            };
        }
    }

    // Adiciona novo barbeiro
    async addBarber(barberData) {
        try {
            // Valida dados
            if (!this.validateBarberData(barberData)) {
                throw new Error('Dados do barbeiro inválidos');
            }

            // Verifica se email já existe
            const emailExists = await this.checkBarberEmailExists(barberData.email);
            if (emailExists) {
                throw new Error('Email já cadastrado');
            }

            // Prepara dados
            const barber = {
                ...barberData,
                isActive: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                services: barberData.services || ['Corte de Cabelo', 'Barba', 'Hidratação']
            };

            // Adiciona ao Firestore
            const docRef = await this.db.collection('barbers').add(barber);

            return {
                success: true,
                id: docRef.id,
                message: 'Barbeiro adicionado com sucesso!'
            };
        } catch (error) {
            console.error('Erro ao adicionar barbeiro:', error);
            return {
                success: false,
                error: error.message || 'Erro ao adicionar barbeiro'
            };
        }
    }

    // Atualiza barbeiro
    async updateBarber(barberId, barberData) {
        try {
            await this.db.collection('barbers').doc(barberId).update({
                ...barberData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                message: 'Barbeiro atualizado com sucesso!'
            };
        } catch (error) {
            console.error('Erro ao atualizar barbeiro:', error);
            return {
                success: false,
                error: 'Erro ao atualizar barbeiro'
            };
        }
    }

    // Remove barbeiro
    async removeBarber(barberId) {
        try {
            // Verifica se há agendamentos futuros
            const hasFutureAppointments = await this.checkBarberFutureAppointments(barberId);
            
            if (hasFutureAppointments) {
                // Marca como inativo em vez de excluir
                await this.db.collection('barbers').doc(barberId).update({
                    isActive: false,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                return {
                    success: true,
                    message: 'Barbeiro marcado como inativo (há agendamentos futuros)'
                };
            } else {
                // Remove o barbeiro
                await this.db.collection('barbers').doc(barberId).delete();
                
                return {
                    success: true,
                    message: 'Barbeiro removido com sucesso!'
                };
            }
        } catch (error) {
            console.error('Erro ao remover barbeiro:', error);
            return {
                success: false,
                error: 'Erro ao remover barbeiro'
            };
        }
    }

    // ========== VALIDAÇÕES ==========

    // Valida dados do barbeiro
    validateBarberData(data) {
        const requiredFields = ['name', 'email', 'phone', 'specialty'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                return false;
            }
        }

        // Valida email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return false;
        }

        return true;
    }

    // Verifica se email já existe
    async checkBarberEmailExists(email) {
        const snapshot = await this.db
            .collection('barbers')
            .where('email', '==', email)
            .limit(1)
            .get();

        return !snapshot.empty;
    }

    // Verifica se barbeiro tem agendamentos futuros
    async checkBarberFutureAppointments(barberId) {
        const today = new Date().toISOString().split('T')[0];
        
        const snapshot = await this.db
            .collection('appointments')
            .where('barberId', '==', barberId)
            .where('date', '>=', today)
            .where('status', '==', 'confirmed')
            .limit(1)
            .get();

        return !snapshot.empty;
    }

    // ========== RELATÓRIOS ==========

    // Obtém estatísticas gerais
    async getDashboardStats() {
        try {
            // Conta barbeiros ativos
            const barbersSnapshot = await this.db
                .collection('barbers')
                .where('isActive', '==', true)
                .get();

            // Conta clientes (usuários com role 'client')
            const clientsSnapshot = await this.db
                .collection('users')
                .where('role', '==', 'client')
                .get();

            // Agendamentos de hoje
            const today = new Date().toISOString().split('T')[0];
            const todayAppointmentsSnapshot = await this.db
                .collection('appointments')
                .where('date', '==', today)
                .where('status', '==', 'confirmed')
                .get();

            // Receita do mês
            const currentMonth = new Date().toISOString().slice(0, 7);
            const monthAppointmentsSnapshot = await this.db
                .collection('appointments')
                .where('date', '>=', `${currentMonth}-01`)
                .where('date', '<=', `${currentMonth}-31`)
                .where('status', '==', 'confirmed')
                .get();

            // Calcula receita do mês
            let monthRevenue = 0;
            monthAppointmentsSnapshot.forEach(doc => {
                const appointment = doc.data();
                monthRevenue += appointment.price || 50;
            });

            // Agendamentos por barbeiro hoje
            const appointmentsByBarber = {};
            todayAppointmentsSnapshot.forEach(doc => {
                const appointment = doc.data();
                const barberId = appointment.barberId;
                appointmentsByBarber[barberId] = (appointmentsByBarber[barberId] || 0) + 1;
            });

            return {
                success: true,
                stats: {
                    totalBarbers: barbersSnapshot.size,
                    totalClients: clientsSnapshot.size,
                    todayAppointments: todayAppointmentsSnapshot.size,
                    monthRevenue,
                    appointmentsByBarber
                }
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return {
                success: false,
                error: 'Erro ao buscar estatísticas',
                stats: {
                    totalBarbers: 0,
                    totalClients: 0,
                    todayAppointments: 0,
                    monthRevenue: 0,
                    appointmentsByBarber: {}
                }
            };
        }
    }

    // ========== SERVIÇOS ==========

    // Lista todos os serviços
    async getServices() {
        try {
            const snapshot = await this.db
                .collection('services')
                .orderBy('name')
                .get();

            const services = [];
            snapshot.forEach(doc => {
                services.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return {
                success: true,
                services
            };
        } catch (error) {
            console.error('Erro ao buscar serviços:', error);
            return {
                success: false,
                error: 'Erro ao buscar serviços',
                services: []
            };
        }
    }

    // Adiciona novo serviço
    async addService(serviceData) {
        try {
            const service = {
                ...serviceData,
                isActive: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await this.db.collection('services').add(service);

            return {
                success: true,
                id: docRef.id,
                message: 'Serviço adicionado com sucesso!'
            };
        } catch (error) {
            console.error('Erro ao adicionar serviço:', error);
            return {
                success: false,
                error: 'Erro ao adicionar serviço'
            };
        }
    }

    // ========== HORÁRIOS DE FUNCIONAMENTO ==========

    // Obtém horários de funcionamento
    async getBusinessHours() {
        try {
            const doc = await this.db.collection('settings').doc('businessHours').get();
            
            if (doc.exists) {
                return {
                    success: true,
                    businessHours: doc.data()
                };
            } else {
                // Horários padrão
                const defaultHours = {
                    monday: { open: '09:00', close: '19:00', isOpen: true },
                    tuesday: { open: '09:00', close: '19:00', isOpen: true },
                    wednesday: { open: '09:00', close: '19:00', isOpen: true },
                    thursday: { open: '09:00', close: '19:00', isOpen: true },
                    friday: { open: '09:00', close: '19:00', isOpen: true },
                    saturday: { open: '09:00', close: '17:00', isOpen: true },
                    sunday: { open: '00:00', close: '00:00', isOpen: false },
                    appointmentInterval: 60 // minutos
                };

                await this.db.collection('settings').doc('businessHours').set(defaultHours);

                return {
                    success: true,
                    businessHours: defaultHours
                };
            }
        } catch (error) {
            console.error('Erro ao buscar horários:', error);
            return {
                success: false,
                error: 'Erro ao buscar horários',
                businessHours: null
            };
        }
    }

    // Atualiza horários de funcionamento
    async updateBusinessHours(businessHours) {
        try {
            await this.db.collection('settings').doc('businessHours').update({
                ...businessHours,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                message: 'Horários atualizados com sucesso!'
            };
        } catch (error) {
            console.error('Erro ao atualizar horários:', error);
            return {
                success: false,
                error: 'Erro ao atualizar horários'
            };
        }
    }
}

// Inicializa serviço administrativo
const adminService = new AdminService();

// Exportar para uso global
window.adminService = adminService;

// ========== FUNÇÕES GLOBAIS ==========

// Adicionar barbeiro
window.addBarber = async function(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = {
        name: form.querySelector('#barberName').value,
        email: form.querySelector('#barberEmail').value,
        phone: form.querySelector('#barberPhone').value,
        specialty: form.querySelector('#barberSpecialty').value,
        photoURL: form.querySelector('#barberPhoto').value || '',
        bio: form.querySelector('#barberBio').value || '',
        services: form.querySelector('#barberServices').value.split(',').map(s => s.trim()).filter(s => s)
    };

    const result = await adminService.addBarber(formData);
    
    if (result.success) {
        showToast(result.message, 'success');
        form.reset();
        // Fecha modal se existir
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
        // Atualiza lista
        if (typeof loadBarbers === 'function') loadBarbers();
    } else {
        showToast(result.error, 'error');
    }
};

// Remover barbeiro
window.removeBarber = async function(barberId, barberName) {
    if (!confirm(`Tem certeza que deseja remover o barbeiro ${barberName}?`)) {
        return;
    }

    const result = await adminService.removeBarber(barberId);
    
    if (result.success) {
        showToast(result.message, 'success');
        // Atualiza lista
        if (typeof loadBarbers === 'function') loadBarbers();
    } else {
        showToast(result.error, 'error');
    }
};

// Adicionar serviço
window.addService = async function(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = {
        name: form.querySelector('#serviceName').value,
        description: form.querySelector('#serviceDescription').value,
        price: parseFloat(form.querySelector('#servicePrice').value),
        duration: parseInt(form.querySelector('#serviceDuration').value),
        category: form.querySelector('#serviceCategory').value
    };

    const result = await adminService.addService(formData);
    
    if (result.success) {
        showToast(result.message, 'success');
        form.reset();
        // Atualiza lista
        if (typeof loadServices === 'function') loadServices();
    } else {
        showToast(result.error, 'error');
    }
};

// Helper para mostrar toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const container = document.querySelector('.toast-container') || createToastContainer();
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Inicializa dashboard admin
document.addEventListener('DOMContentLoaded', async () => {
    const userRole = window.authService?.userRole;
    
    if (userRole === 'admin' || userRole === 'barber') {
        // Carrega estatísticas do dashboard
        const statsResult = await adminService.getDashboardStats();
        
        if (statsResult.success) {
            const stats = statsResult.stats;
            
            // Atualiza elementos da página
            document.getElementById('totalBarbers')?.textContent = stats.totalBarbers;
            document.getElementById('totalClients')?.textContent = stats.totalClients;
            document.getElementById('todayAppointments')?.textContent = stats.todayAppointments;
            document.getElementById('monthRevenue')?.textContent = `R$ ${stats.monthRevenue.toFixed(2)}`;
        }
    }
});