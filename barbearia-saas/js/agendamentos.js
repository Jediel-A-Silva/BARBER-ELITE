/* ===================================
   APPOINTMENTS MODULE
   Gerencia agendamentos (criação, listagem, cancelamento)
=================================== */

class AppointmentsService {
    constructor() {
        this.db = window.firebaseDb;
        this.authService = window.authService;
    }

    // Cria um novo agendamento
    async createAppointment(appointmentData) {
        try {
            const user = this.authService.getCurrentUser();
            
            // Validação básica
            if (!this.validateAppointmentData(appointmentData)) {
                throw new Error('Dados do agendamento inválidos');
            }

            // Verifica se o horário está disponível
            const isAvailable = await this.checkTimeSlotAvailability(
                appointmentData.barberId,
                appointmentData.date,
                appointmentData.time
            );

            if (!isAvailable) {
                throw new Error('Horário já reservado');
            }

            // Prepara dados do agendamento
            const appointment = {
                ...appointmentData,
                clientId: user.uid,
                clientName: user.displayName || user.email,
                clientEmail: user.email,
                status: 'confirmed',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                price: appointmentData.price || 50.00 // Valor padrão
            };

            // Adiciona ao Firestore
            const docRef = await this.db.collection('appointments').add(appointment);
            
            return {
                success: true,
                id: docRef.id,
                message: 'Agendamento criado com sucesso!'
            };
        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            return {
                success: false,
                error: error.message || 'Erro ao criar agendamento'
            };
        }
    }

    // Valida dados do agendamento
    validateAppointmentData(data) {
        const requiredFields = ['barberId', 'date', 'time', 'serviceId'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                return false;
            }
        }

        // Valida formato da data (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.date)) {
            return false;
        }

        // Valida formato do horário (HH:MM)
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(data.time)) {
            return false;
        }

        return true;
    }

    // Verifica disponibilidade do horário
    async checkTimeSlotAvailability(barberId, date, time) {
        try {
            const snapshot = await this.db
                .collection('appointments')
                .where('barberId', '==', barberId)
                .where('date', '==', date)
                .where('time', '==', time)
                .where('status', '==', 'confirmed')
                .get();

            return snapshot.empty; // Disponível se não houver agendamentos
        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            return false;
        }
    }

    // Lista agendamentos do cliente atual
    async getUserAppointments(status = null) {
        try {
            const user = this.authService.getCurrentUser();
            let query = this.db
                .collection('appointments')
                .where('clientId', '==', user.uid)
                .orderBy('date', 'desc')
                .orderBy('time', 'desc');

            // Filtra por status se fornecido
            if (status) {
                query = query.where('status', '==', status);
            }

            const snapshot = await query.get();
            const appointments = [];

            snapshot.forEach(doc => {
                appointments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return {
                success: true,
                appointments
            };
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
            return {
                success: false,
                error: 'Erro ao buscar agendamentos',
                appointments: []
            };
        }
    }

    // Lista todos os agendamentos (para admin/barbeiro)
    async getAllAppointments(filters = {}) {
        try {
            const user = this.authService.getCurrentUser();
            const userRole = this.authService.userRole;
            
            let query = this.db.collection('appointments');

            // Barbeiros veem apenas seus agendamentos
            if (userRole === 'barber') {
                const barber = await this.getBarberByUserId(user.uid);
                if (barber) {
                    query = query.where('barberId', '==', barber.id);
                }
            }

            // Aplicar filtros
            if (filters.date) {
                query = query.where('date', '==', filters.date);
            }

            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }

            if (filters.barberId) {
                query = query.where('barberId', '==', filters.barberId);
            }

            // Ordenar por data e hora
            query = query.orderBy('date', 'desc').orderBy('time', 'desc');

            const snapshot = await query.get();
            const appointments = [];

            snapshot.forEach(doc => {
                appointments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return {
                success: true,
                appointments
            };
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
            return {
                success: false,
                error: 'Erro ao buscar agendamentos',
                appointments: []
            };
        }
    }

    // Busca barbeiro pelo ID do usuário
    async getBarberByUserId(userId) {
        try {
            const snapshot = await this.db
                .collection('barbers')
                .where('userId', '==', userId)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }

            return null;
        } catch (error) {
            console.error('Erro ao buscar barbeiro:', error);
            return null;
        }
    }

    // Cancela um agendamento
    async cancelAppointment(appointmentId) {
        try {
            const user = this.authService.getCurrentUser();
            const appointmentRef = this.db.collection('appointments').doc(appointmentId);
            
            // Busca o agendamento
            const appointmentDoc = await appointmentRef.get();
            
            if (!appointmentDoc.exists) {
                throw new Error('Agendamento não encontrado');
            }

            const appointment = appointmentDoc.data();
            
            // Verifica permissões
            const userRole = this.authService.userRole;
            const isOwner = appointment.clientId === user.uid;
            const isBarber = userRole === 'barber' || userRole === 'admin';
            
            if (!isOwner && !isBarber) {
                throw new Error('Sem permissão para cancelar este agendamento');
            }

            // Atualiza status
            await appointmentRef.update({
                status: 'cancelled',
                cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
                cancelledBy: user.uid,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                message: 'Agendamento cancelado com sucesso'
            };
        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            return {
                success: false,
                error: error.message || 'Erro ao cancelar agendamento'
            };
        }
    }

    // Atualiza status do agendamento
    async updateAppointmentStatus(appointmentId, status) {
        try {
            await this.db.collection('appointments').doc(appointmentId).update({
                status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                message: `Status atualizado para ${status}`
            };
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            return {
                success: false,
                error: 'Erro ao atualizar status'
            };
        }
    }

    // Busca horários disponíveis de um barbeiro
    async getAvailableTimeSlots(barberId, date) {
        try {
            // Busca agendamentos do barbeiro na data
            const appointmentsSnapshot = await this.db
                .collection('appointments')
                .where('barberId', '==', barberId)
                .where('date', '==', date)
                .where('status', '==', 'confirmed')
                .get();

            const bookedTimes = appointmentsSnapshot.docs.map(doc => doc.data().time);

            // Horário de funcionamento padrão (9h às 19h)
            const workingHours = this.generateWorkingHours('09:00', '19:00', 60); // Intervalo de 60 minutos
            
            // Filtra horários disponíveis
            const availableSlots = workingHours.filter(time => !bookedTimes.includes(time));

            return {
                success: true,
                availableSlots,
                bookedTimes
            };
        } catch (error) {
            console.error('Erro ao buscar horários disponíveis:', error);
            return {
                success: false,
                error: 'Erro ao buscar horários disponíveis',
                availableSlots: [],
                bookedTimes: []
            };
        }
    }

    // Gera array de horários de trabalho
    generateWorkingHours(start, end, intervalMinutes = 60) {
        const slots = [];
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            slots.push(timeString);
            
            currentMinute += intervalMinutes;
            if (currentMinute >= 60) {
                currentHour += Math.floor(currentMinute / 60);
                currentMinute = currentMinute % 60;
            }
        }
        
        return slots;
    }

    // Busca estatísticas de agendamentos
    async getAppointmentStats() {
        try {
            const user = this.authService.getCurrentUser();
            const userRole = this.authService.userRole;
            
            let query = this.db.collection('appointments');
            
            if (userRole === 'barber') {
                const barber = await this.getBarberByUserId(user.uid);
                if (barber) {
                    query = query.where('barberId', '==', barber.id);
                }
            } else if (userRole === 'client') {
                query = query.where('clientId', '==', user.uid);
            }

            const today = new Date().toISOString().split('T')[0];
            
            // Agendamentos de hoje
            const todayQuery = query.where('date', '==', today).where('status', '==', 'confirmed');
            const todaySnapshot = await todayQuery.get();
            
            // Total de agendamentos
            const totalSnapshot = await query.where('status', '==', 'confirmed').get();
            
            // Mês atual
            const currentMonth = new Date().toISOString().slice(0, 7);
            const monthQuery = query.where('date', '>=', `${currentMonth}-01`)
                                   .where('date', '<=', `${currentMonth}-31`)
                                   .where('status', '==', 'confirmed');
            const monthSnapshot = await monthQuery.get();
            
            return {
                success: true,
                stats: {
                    today: todaySnapshot.size,
                    total: totalSnapshot.size,
                    thisMonth: monthSnapshot.size
                }
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return {
                success: false,
                error: 'Erro ao buscar estatísticas',
                stats: {
                    today: 0,
                    total: 0,
                    thisMonth: 0
                }
            };
        }
    }
}

// Inicializa serviço de agendamentos
const appointmentsService = new AppointmentsService();

// Exportar para uso global
window.appointmentsService = appointmentsService;

// Funções globais para uso em HTML
window.createAppointment = async function(formData) {
    const result = await appointmentsService.createAppointment(formData);
    
    if (result.success) {
        showToast(result.message, 'success');
        // Redireciona ou atualiza a lista
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } else {
        showToast(result.error, 'error');
    }
    
    return result;
};

window.cancelAppointment = async function(appointmentId) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
        return;
    }
    
    const result = await appointmentsService.cancelAppointment(appointmentId);
    
    if (result.success) {
        showToast(result.message, 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } else {
        showToast(result.error, 'error');
    }
    
    return result;
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