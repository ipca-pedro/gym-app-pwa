// Weekly Workout Planner
class WeeklyPlanner {
    constructor() {
        this.currentPlan = null;
        this.loadCurrentPlan();
    }

    async generateWeeklyPlan(profile) {
        const loadingId = uiManager.showLoading('Gerando plano semanal personalizado...', 'weeklyPlanContent');
        
        try {
            const plan = await this.createIntelligentPlan(profile);
            this.currentPlan = plan;
            this.savePlan();
            
            uiManager.hideLoading(loadingId);
            this.renderPlan();
            uiManager.showToast('Plano semanal gerado!', 'success');
            
            return plan;
        } catch (error) {
            uiManager.hideLoading(loadingId);
            uiManager.showToast('Erro ao gerar plano', 'error');
            throw error;
        }
    }

    async createIntelligentPlan(profile) {
        const frequency = parseInt(profile.frequency);
        const level = profile.level;
        const goal = profile.goal;
        
        // Get user's workout history for better planning
        const history = this.getUserHistory();
        
        const plan = {
            id: Date.now().toString(),
            created: new Date().toISOString(),
            profile: profile,
            frequency: frequency,
            days: []
        };

        // Define workout split based on frequency and level
        const splits = this.getWorkoutSplits(frequency, level, goal);
        const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
        
        for (let i = 0; i < 7; i++) {
            const dayPlan = {
                day: days[i],
                dayIndex: i,
                type: splits[i],
                completed: false,
                workout: null
            };

            if (splits[i] !== 'Descanso') {
                dayPlan.workout = await this.generateDayWorkout(splits[i], profile, history);
            }

            plan.days.push(dayPlan);
        }

        return plan;
    }

    getWorkoutSplits(frequency, level, goal) {
        const splits = {
            3: {
                beginner: ['Corpo Todo A', 'Descanso', 'Corpo Todo B', 'Descanso', 'Corpo Todo C', 'Descanso', 'Descanso'],
                intermediate: ['Push', 'Descanso', 'Pull', 'Descanso', 'Legs', 'Descanso', 'Descanso'],
                advanced: ['Push', 'Pull', 'Descanso', 'Legs', 'Descanso', 'Upper', 'Descanso']
            },
            4: {
                beginner: ['Upper', 'Lower', 'Descanso', 'Upper', 'Lower', 'Descanso', 'Descanso'],
                intermediate: ['Push', 'Pull', 'Descanso', 'Legs', 'Push', 'Descanso', 'Descanso'],
                advanced: ['Push', 'Pull', 'Legs', 'Descanso', 'Push', 'Pull', 'Descanso']
            },
            5: {
                beginner: ['Push', 'Pull', 'Descanso', 'Legs', 'Upper', 'Descanso', 'Descanso'],
                intermediate: ['Push', 'Pull', 'Legs', 'Descanso', 'Push', 'Pull', 'Descanso'],
                advanced: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Descanso', 'Legs']
            },
            6: {
                beginner: ['Push', 'Pull', 'Legs', 'Descanso', 'Push', 'Pull', 'Descanso'],
                intermediate: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Descanso'],
                advanced: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Cardio']
            }
        };

        return splits[frequency]?.[level] || splits[3].beginner;
    }

    async generateDayWorkout(workoutType, profile, history) {
        // Use AI to generate specific workout for the day
        const prompt = `Crie um treino de ${workoutType} para:
- Nível: ${profile.level}
- Objetivo: ${profile.goal}
- Duração: ${profile.duration} minutos
- Equipamentos: ${profile.equipment}
- Limitações: ${profile.limitations || 'Nenhuma'}

Histórico recente: ${history.slice(-3).map(h => `${h.type} - Dificuldade: ${h.difficulty}/5`).join(', ')}

Retorne JSON: {"exercises": [{"name": "Nome", "sets": 3, "reps": "8-12", "rest": 60, "description": "Como fazer", "tips": "Dica importante"}]}`;

        try {
            const response = await fetch('/api/workout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: app.currentUser.id, 
                    profile: profile,
                    workoutType: workoutType,
                    prompt: prompt
                })
            });

            const data = await response.json();
            return {
                name: `${workoutType} - ${profile.level}`,
                type: workoutType,
                exercises: data.workout?.exercises || this.getFallbackExercises(workoutType),
                estimatedDuration: profile.duration,
                difficulty: this.calculateDifficulty(profile.level)
            };
        } catch (error) {
            return {
                name: `${workoutType} - ${profile.level}`,
                type: workoutType,
                exercises: this.getFallbackExercises(workoutType),
                estimatedDuration: profile.duration,
                difficulty: this.calculateDifficulty(profile.level)
            };
        }
    }

    getFallbackExercises(workoutType) {
        const exercises = {
            'Push': [
                { name: 'Flexão', sets: 3, reps: '8-12', rest: 60, description: 'Flexão tradicional', tips: 'Mantenha o corpo reto' },
                { name: 'Supino', sets: 3, reps: '8-10', rest: 90, description: 'Supino com barra', tips: 'Controle na descida' },
                { name: 'Desenvolvimento', sets: 3, reps: '10-12', rest: 75, description: 'Ombros com halteres', tips: 'Não force o pescoço' }
            ],
            'Pull': [
                { name: 'Puxada', sets: 3, reps: '8-12', rest: 90, description: 'Puxada alta', tips: 'Puxe até o peito' },
                { name: 'Remada', sets: 3, reps: '10-12', rest: 75, description: 'Remada curvada', tips: 'Mantenha as costas retas' },
                { name: 'Rosca', sets: 3, reps: '12-15', rest: 60, description: 'Rosca bíceps', tips: 'Movimento controlado' }
            ],
            'Legs': [
                { name: 'Agachamento', sets: 4, reps: '12-15', rest: 90, description: 'Agachamento livre', tips: 'Desça até 90 graus' },
                { name: 'Leg Press', sets: 3, reps: '15-20', rest: 75, description: 'Leg press 45°', tips: 'Amplitude completa' },
                { name: 'Panturrilha', sets: 4, reps: '15-20', rest: 45, description: 'Elevação de panturrilha', tips: 'Contração máxima' }
            ]
        };

        return exercises[workoutType] || exercises['Push'];
    }

    calculateDifficulty(level) {
        const difficulties = {
            'beginner': 2,
            'intermediate': 3,
            'advanced': 4
        };
        return difficulties[level] || 2;
    }

    getUserHistory() {
        const workouts = JSON.parse(localStorage.getItem(`workouts_${app.currentUser?.id}`)) || [];
        const feedback = JSON.parse(localStorage.getItem(`feedback_${app.currentUser?.id}`)) || [];
        
        return feedback.slice(-10).map(f => ({
            type: f.workoutType || 'Unknown',
            difficulty: f.difficulty,
            comments: f.comments,
            date: f.date
        }));
    }

    renderPlan() {
        const container = document.getElementById('weeklyPlanContent');
        if (!container || !this.currentPlan) return;

        const completedDays = this.currentPlan.days.filter(d => d.completed).length;
        const totalWorkoutDays = this.currentPlan.days.filter(d => d.type !== 'Descanso').length;
        const progress = (completedDays / totalWorkoutDays) * 100;

        let html = `
            <div class="plan-header">
                <h3>Plano da Semana</h3>
                <div class="plan-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span>${completedDays}/${totalWorkoutDays} treinos concluídos</span>
                </div>
            </div>
            <div class="plan-days">
        `;

        this.currentPlan.days.forEach((day, index) => {
            const isToday = new Date().getDay() === (index + 1) % 7;
            const canStart = this.canStartWorkout(day);
            
            html += `
                <div class="plan-day ${day.completed ? 'completed' : ''} ${isToday ? 'today' : ''}">
                    <div class="day-header">
                        <h4>${day.day}</h4>
                        <span class="day-type">${day.type}</span>
                    </div>
                    
                    ${day.type === 'Descanso' ? `
                        <div class="rest-day">
                            <div class="rest-icon">😴</div>
                            <p>Dia de descanso</p>
                            <small>Recuperação é essencial!</small>
                        </div>
                    ` : `
                        <div class="workout-preview">
                            <div class="workout-info">
                                <span class="duration">⏱️ ${day.workout?.estimatedDuration || 45} min</span>
                                <span class="difficulty">🔥 ${this.getDifficultyText(day.workout?.difficulty || 2)}</span>
                                <span class="exercises">💪 ${day.workout?.exercises?.length || 0} exercícios</span>
                            </div>
                            
                            ${day.completed ? `
                                <div class="completed-badge">✅ Concluído</div>
                            ` : `
                                <button class="btn ${canStart ? '' : 'btn-disabled'}" 
                                        onclick="weeklyPlanner.startDayWorkout(${index})"
                                        ${!canStart ? 'disabled' : ''}>
                                    ${isToday ? '🚀 Iniciar Hoje' : '📅 Ver Treino'}
                                </button>
                            `}
                        </div>
                    `}
                </div>
            `;
        });

        html += `
            </div>
            <div class="plan-actions">
                <button class="btn btn-secondary" onclick="weeklyPlanner.regeneratePlan()">
                    🔄 Gerar Novo Plano
                </button>
                <button class="btn btn-secondary" onclick="weeklyPlanner.exportPlan()">
                    📤 Exportar Plano
                </button>
            </div>
        `;

        container.innerHTML = html;
    }

    getDifficultyText(difficulty) {
        const texts = {
            1: 'Muito Fácil',
            2: 'Fácil',
            3: 'Moderado',
            4: 'Difícil',
            5: 'Muito Difícil'
        };
        return texts[difficulty] || 'Moderado';
    }

    canStartWorkout(day) {
        // Can start if it's today or if previous days are completed
        const today = new Date().getDay();
        const dayIndex = (day.dayIndex + 1) % 7; // Adjust for Monday = 0
        
        return dayIndex <= today;
    }

    async startDayWorkout(dayIndex) {
        const day = this.currentPlan.days[dayIndex];
        if (!day.workout) return;

        // Create workout session
        const workout = {
            id: Date.now().toString(),
            name: day.workout.name,
            type: day.workout.type,
            exercises: day.workout.exercises.map(ex => ({
                ...ex,
                completed: false,
                setsCompleted: 0,
                actualSets: []
            })),
            planDayIndex: dayIndex,
            startTime: new Date().toISOString(),
            status: 'active'
        };

        workoutManager.currentWorkout = workout;
        workoutManager.saveWorkout();
        
        app.navigate('workout');
        uiManager.showToast(`Iniciando ${day.workout.name}!`, 'success');
    }

    markDayCompleted(dayIndex) {
        if (this.currentPlan && this.currentPlan.days[dayIndex]) {
            this.currentPlan.days[dayIndex].completed = true;
            this.savePlan();
            this.renderPlan();
            
            // Check if week is completed
            const workoutDays = this.currentPlan.days.filter(d => d.type !== 'Descanso');
            const completedDays = workoutDays.filter(d => d.completed);
            
            if (completedDays.length === workoutDays.length) {
                this.celebrateWeekCompletion();
            }
        }
    }

    celebrateWeekCompletion() {
        uiManager.showToast('🎉 Semana de treinos concluída! Parabéns!', 'success', 5000);
        
        // Schedule notification for next week
        setTimeout(() => {
            uiManager.showNotification(
                '📅 Nova Semana!',
                'Que tal gerar um novo plano semanal?'
            );
        }, 24 * 60 * 60 * 1000); // 24 hours
    }

    async regeneratePlan() {
        if (confirm('Tem certeza que deseja gerar um novo plano? O progresso atual será perdido.')) {
            const profile = app.currentUser.profile;
            if (profile) {
                await this.generateWeeklyPlan(profile);
            }
        }
    }

    exportPlan() {
        if (!this.currentPlan) return;

        const exportData = {
            plan: this.currentPlan,
            user: app.currentUser.username,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `plano-semanal-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        uiManager.showToast('Plano exportado!', 'success');
    }

    loadCurrentPlan() {
        const saved = localStorage.getItem(`weeklyPlan_${app.currentUser?.id}`);
        if (saved) {
            this.currentPlan = JSON.parse(saved);
            
            // Check if plan is from this week
            const planDate = new Date(this.currentPlan.created);
            const weekStart = this.getWeekStart(new Date());
            
            if (planDate < weekStart) {
                // Plan is from previous week, clear it
                this.currentPlan = null;
                localStorage.removeItem(`weeklyPlan_${app.currentUser?.id}`);
            }
        }
    }

    savePlan() {
        if (this.currentPlan) {
            localStorage.setItem(`weeklyPlan_${app.currentUser?.id}`, JSON.stringify(this.currentPlan));
        }
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }

    // Integration with workout manager
    onWorkoutCompleted(workoutId) {
        if (!this.currentPlan) return;

        // Find the day that corresponds to this workout
        const dayIndex = this.currentPlan.days.findIndex(day => 
            day.workout && workoutManager.currentWorkout?.planDayIndex === day.dayIndex
        );

        if (dayIndex !== -1) {
            this.markDayCompleted(dayIndex);
        }
    }
}

// Initialize Weekly Planner
const weeklyPlanner = new WeeklyPlanner();