// Dashboard Manager
class Dashboard {
    constructor() {
        this.achievements = this.loadAchievements();
        this.recentActivity = this.loadRecentActivity();
    }

    load() {
        this.updateWelcomeMessage();
        this.updateStats();
        this.updateNextWorkout();
        this.updateRecentActivity();
        this.updateAchievements();
    }

    updateWelcomeMessage() {
        const user = app.currentUser;
        const welcomeEl = document.getElementById('welcomeMessage');
        const motivationEl = document.getElementById('motivationalMessage');
        
        if (!welcomeEl || !motivationEl) return;

        const name = user?.profile?.name || 'Atleta';
        const hour = new Date().getHours();
        
        let greeting = '🌅 Bom dia';
        if (hour >= 12 && hour < 18) greeting = '☀️ Boa tarde';
        if (hour >= 18) greeting = '🌙 Boa noite';
        
        welcomeEl.textContent = `${greeting}, ${name}!`;
        
        // Motivational messages based on progress
        const workouts = JSON.parse(localStorage.getItem(`workouts_${user?.id}`)) || [];
        const lastWorkout = workouts[0];
        const daysSinceLastWorkout = lastWorkout ? 
            Math.floor((Date.now() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24)) : 999;
        
        let motivation = '';
        if (daysSinceLastWorkout === 0) {
            motivation = '🔥 Você já treinou hoje! Que tal um alongamento?';
        } else if (daysSinceLastWorkout === 1) {
            motivation = '💪 Hora de manter o ritmo! Vamos treinar?';
        } else if (daysSinceLastWorkout <= 3) {
            motivation = '⚡ Que tal retomar os treinos hoje?';
        } else {
            motivation = '🚀 Vamos começar uma nova jornada fitness!';
        }
        
        motivationEl.textContent = motivation;
    }

    updateStats() {
        const user = app.currentUser;
        if (!user) return;

        const workouts = JSON.parse(localStorage.getItem(`workouts_${user.id}`)) || [];
        const feedback = JSON.parse(localStorage.getItem(`feedback_${user.id}`)) || [];
        
        // Total workouts
        document.getElementById('totalWorkouts').textContent = workouts.length;
        
        // This week workouts
        const thisWeek = workouts.filter(w => {
            const workoutDate = new Date(w.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return workoutDate >= weekAgo;
        }).length;
        document.getElementById('weekStreak').textContent = thisWeek;
        
        // Current streak
        const streak = this.calculateStreak(workouts);
        document.getElementById('currentStreak').textContent = streak;
        
        // BMI
        this.updateBMI();
    }

    updateBMI() {
        const user = app.currentUser;
        const bmiEl = document.getElementById('currentBMI');
        if (!bmiEl || !user?.profile) return;

        const measurements = JSON.parse(localStorage.getItem(`measurements_${user.id}`)) || {};
        const latestWeight = measurements.weight?.[0];
        
        if (latestWeight && user.profile.height) {
            const heightM = user.profile.height / 100;
            const bmi = (latestWeight.weight / (heightM * heightM)).toFixed(1);
            bmiEl.querySelector('.stat-number').textContent = bmi;
        }
    }

    calculateStreak(workouts) {
        if (workouts.length === 0) return 0;
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < workouts.length; i++) {
            const workoutDate = new Date(workouts[i].date);
            workoutDate.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    updateNextWorkout() {
        const user = app.currentUser;
        const nextWorkoutEl = document.getElementById('nextWorkoutType');
        const startBtn = document.getElementById('startWorkoutBtn');
        
        if (!nextWorkoutEl || !startBtn) return;

        if (!user?.profile) {
            nextWorkoutEl.textContent = 'Configure seu perfil primeiro';
            startBtn.textContent = '⚙️ Configurar Perfil';
            startBtn.onclick = () => app.navigate('profile');
            return;
        }

        // Get recommended workout based on profile and history
        const recommendation = this.getWorkoutRecommendation();
        nextWorkoutEl.textContent = recommendation.name;
        startBtn.textContent = '🚀 Iniciar Treino';
        startBtn.onclick = () => this.startRecommendedWorkout();
    }

    getWorkoutRecommendation() {
        const user = app.currentUser;
        const profile = user.profile;
        const workouts = JSON.parse(localStorage.getItem(`workouts_${user.id}`)) || [];
        
        // Analyze recent workouts to avoid repetition
        const recentTypes = workouts.slice(0, 3).map(w => w.type || 'general');
        
        // Base recommendation on profile
        let recommendations = [];
        
        switch (profile.workoutType) {
            case 'strength':
                recommendations = ['Push (Peito/Ombros)', 'Pull (Costas/Bíceps)', 'Legs (Pernas)', 'Upper Body'];
                break;
            case 'cardio':
                recommendations = ['HIIT Cardio', 'Cardio Moderado', 'Cardio + Core', 'Cardio Intervalado'];
                break;
            case 'hiit':
                recommendations = ['HIIT Full Body', 'HIIT Upper', 'HIIT Lower', 'Tabata'];
                break;
            case 'functional':
                recommendations = ['Funcional Core', 'Funcional Força', 'Mobilidade', 'Funcional Cardio'];
                break;
            default:
                recommendations = ['Corpo Todo', 'Upper Body', 'Lower Body', 'Core + Cardio'];
        }
        
        // Filter out recent types
        const filtered = recommendations.filter(rec => 
            !recentTypes.some(recent => rec.toLowerCase().includes(recent.toLowerCase()))
        );
        
        const chosen = filtered.length > 0 ? filtered[0] : recommendations[0];
        
        return {
            name: chosen,
            type: chosen.toLowerCase().replace(/\s+/g, '_'),
            duration: profile.sessionDuration || '45-60',
            location: profile.trainingLocation || 'gym'
        };
    }

    async startRecommendedWorkout() {
        const user = app.currentUser;
        if (!user?.profile) {
            app.navigate('profile');
            return;
        }

        const recommendation = this.getWorkoutRecommendation();
        
        // Show loading
        const loadingId = uiManager.showLoading('Gerando seu treino personalizado...');
        
        try {
            // Generate workout based on full profile
            const workout = await this.generatePersonalizedWorkout(recommendation);
            
            workoutManager.currentWorkout = workout;
            workoutManager.saveWorkout();
            
            uiManager.hideLoading(loadingId);
            app.navigate('workout');
            
            uiManager.showToast(`Treino ${recommendation.name} gerado!`, 'success');
        } catch (error) {
            uiManager.hideLoading(loadingId);
            uiManager.showToast('Erro ao gerar treino', 'error');
        }
    }

    async generatePersonalizedWorkout(recommendation) {
        const user = app.currentUser;
        const profile = user.profile;
        
        // Build comprehensive prompt based on all profile data
        const prompt = this.buildWorkoutPrompt(profile, recommendation);
        
        try {
            const response = await fetch('/api/workout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: user.id, 
                    profile: profile,
                    recommendation: recommendation,
                    prompt: prompt
                })
            });

            const data = await response.json();
            
            if (data.workout) {
                return {
                    id: Date.now().toString(),
                    name: recommendation.name,
                    type: recommendation.type,
                    date: new Date().toISOString(),
                    exercises: data.workout.exercises || this.getFallbackExercises(recommendation),
                    duration: recommendation.duration,
                    location: recommendation.location,
                    status: 'active'
                };
            }
        } catch (error) {
            console.error('AI workout generation failed:', error);
        }
        
        // Fallback to rule-based generation
        return this.generateRuleBasedWorkout(recommendation);
    }

    buildWorkoutPrompt(profile, recommendation) {
        const history = this.getUserWorkoutHistory();
        const feedback = this.getUserFeedback();
        
        return `Crie um treino de ${recommendation.name} personalizado para:

PERFIL DO USUÁRIO:
- Idade: ${profile.age} anos
- Peso: ${profile.weight}kg, Altura: ${profile.height}cm
- Objetivo: ${profile.goal}
- Nível: ${profile.level}
- Tipo preferido: ${profile.workoutType}
- Local: ${profile.trainingLocation}
- Duração: ${profile.sessionDuration} minutos
- Disponibilidade: ${profile.weeklyAvailability}
- Horário: ${profile.preferredTime}
- Limitações: ${profile.limitations || 'Nenhuma'}

HISTÓRICO RECENTE:
${history.slice(0, 3).map(h => `- ${h.name}: Dificuldade ${h.difficulty}/5`).join('\n')}

FEEDBACK RECENTE:
${feedback.slice(0, 2).map(f => `- "${f.comments}" (Dificuldade: ${f.difficulty}/5)`).join('\n')}

REQUISITOS:
- Adapte exercícios para ${profile.trainingLocation}
- Considere nível ${profile.level}
- Duração: ${profile.sessionDuration} minutos
- Foco em ${profile.goal}

Retorne JSON: {
  "exercises": [
    {
      "name": "Nome do Exercício",
      "sets": 3,
      "reps": "8-12",
      "rest": 60,
      "description": "Como executar",
      "tips": "Dica importante",
      "equipment": "equipamento necessário"
    }
  ]
}`;
    }

    generateRuleBasedWorkout(recommendation) {
        const profile = app.currentUser.profile;
        const exercises = this.getExercisesByTypeAndLocation(recommendation.type, profile.trainingLocation);
        
        return {
            id: Date.now().toString(),
            name: recommendation.name,
            type: recommendation.type,
            date: new Date().toISOString(),
            exercises: exercises,
            duration: recommendation.duration,
            location: recommendation.location,
            status: 'active'
        };
    }

    getExercisesByTypeAndLocation(type, location) {
        const exerciseDB = {
            gym: {
                push: [
                    { name: 'Supino Reto', sets: 4, reps: '8-10', rest: 90, description: 'Supino com barra', equipment: 'Barra' },
                    { name: 'Desenvolvimento', sets: 3, reps: '10-12', rest: 75, description: 'Ombros com halteres', equipment: 'Halteres' },
                    { name: 'Tríceps Pulley', sets: 3, reps: '12-15', rest: 60, description: 'Tríceps na polia', equipment: 'Polia' }
                ],
                pull: [
                    { name: 'Puxada Alta', sets: 4, reps: '8-12', rest: 90, description: 'Puxada até o peito', equipment: 'Máquina' },
                    { name: 'Remada Curvada', sets: 3, reps: '10-12', rest: 75, description: 'Remada com barra', equipment: 'Barra' },
                    { name: 'Rosca Direta', sets: 3, reps: '12-15', rest: 60, description: 'Bíceps com barra', equipment: 'Barra' }
                ]
            },
            home: {
                push: [
                    { name: 'Flexão', sets: 3, reps: '8-15', rest: 60, description: 'Flexão tradicional', equipment: 'Peso corporal' },
                    { name: 'Pike Push-up', sets: 3, reps: '8-12', rest: 60, description: 'Flexão para ombros', equipment: 'Peso corporal' },
                    { name: 'Tríceps no Solo', sets: 3, reps: '10-15', rest: 45, description: 'Tríceps apoiado', equipment: 'Peso corporal' }
                ],
                pull: [
                    { name: 'Pull-up', sets: 3, reps: '5-10', rest: 90, description: 'Barra fixa', equipment: 'Barra fixa' },
                    { name: 'Remada Invertida', sets: 3, reps: '8-12', rest: 75, description: 'Remada com mesa', equipment: 'Mesa/Cadeira' },
                    { name: 'Superman', sets: 3, reps: '15-20', rest: 45, description: 'Fortalecimento das costas', equipment: 'Peso corporal' }
                ]
            }
        };

        const locationKey = location === 'gym' ? 'gym' : 'home';
        const typeKey = type.includes('push') ? 'push' : type.includes('pull') ? 'pull' : 'push';
        
        return exerciseDB[locationKey]?.[typeKey] || exerciseDB.home.push;
    }

    async generateSmartWorkout() {
        const user = app.currentUser;
        if (!user?.profile) {
            uiManager.showToast('Configure seu perfil primeiro!', 'warning');
            app.navigate('profile');
            return;
        }

        await this.startRecommendedWorkout();
    }

    showWorkoutHistory() {
        app.navigate('bodyTracker'); // Redirect to history section
    }

    updateRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        const user = app.currentUser;
        const workouts = JSON.parse(localStorage.getItem(`workouts_${user?.id}`)) || [];
        const measurements = JSON.parse(localStorage.getItem(`measurements_${user?.id}`)) || {};
        
        let activities = [];
        
        // Add recent workouts
        workouts.slice(0, 3).forEach(workout => {
            activities.push({
                type: 'workout',
                date: workout.date,
                description: `Treino: ${workout.name}`,
                icon: '🏋️'
            });
        });
        
        // Add recent measurements
        Object.entries(measurements).forEach(([type, values]) => {
            if (values && values.length > 0) {
                activities.push({
                    type: 'measurement',
                    date: values[0].date,
                    description: `Medida registrada: ${type}`,
                    icon: '📏'
                });
            }
        });
        
        // Sort by date
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        activities = activities.slice(0, 5);
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-center">Nenhuma atividade ainda</p>';
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <span class="activity-icon">${activity.icon}</span>
                <div class="activity-content">
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-date">${new Date(activity.date).toLocaleDateString('pt-BR')}</div>
                </div>
            </div>
        `).join('');
    }

    updateAchievements() {
        const container = document.getElementById('achievementsList');
        if (!container) return;

        const achievements = this.calculateAchievements();
        
        if (achievements.length === 0) {
            container.innerHTML = '<p class="text-center">Complete treinos para desbloquear conquistas!</p>';
            return;
        }
        
        container.innerHTML = achievements.map(achievement => `
            <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <span class="achievement-icon">${achievement.icon}</span>
                <div class="achievement-content">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            </div>
        `).join('');
    }

    calculateAchievements() {
        const user = app.currentUser;
        const workouts = JSON.parse(localStorage.getItem(`workouts_${user?.id}`)) || [];
        const streak = this.calculateStreak(workouts);
        
        const achievements = [
            {
                id: 'first_workout',
                title: 'Primeiro Passo',
                description: 'Complete seu primeiro treino',
                icon: '🎯',
                unlocked: workouts.length >= 1
            },
            {
                id: 'week_warrior',
                title: 'Guerreiro da Semana',
                description: 'Complete 3 treinos em uma semana',
                icon: '⚡',
                unlocked: this.getWeeklyWorkouts() >= 3
            },
            {
                id: 'streak_master',
                title: 'Mestre da Consistência',
                description: 'Mantenha uma sequência de 7 dias',
                icon: '🔥',
                unlocked: streak >= 7
            },
            {
                id: 'month_champion',
                title: 'Campeão do Mês',
                description: 'Complete 12 treinos em um mês',
                icon: '🏆',
                unlocked: this.getMonthlyWorkouts() >= 12
            }
        ];
        
        return achievements.filter(a => a.unlocked);
    }

    getWeeklyWorkouts() {
        const user = app.currentUser;
        const workouts = JSON.parse(localStorage.getItem(`workouts_${user?.id}`)) || [];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        return workouts.filter(w => new Date(w.date) >= weekAgo).length;
    }

    getMonthlyWorkouts() {
        const user = app.currentUser;
        const workouts = JSON.parse(localStorage.getItem(`workouts_${user?.id}`)) || [];
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        
        return workouts.filter(w => new Date(w.date) >= monthAgo).length;
    }

    getUserWorkoutHistory() {
        const user = app.currentUser;
        const workouts = JSON.parse(localStorage.getItem(`workouts_${user?.id}`)) || [];
        const feedback = JSON.parse(localStorage.getItem(`feedback_${user?.id}`)) || [];
        
        return workouts.slice(0, 5).map(workout => {
            const workoutFeedback = feedback.find(f => f.workoutId === workout.id);
            return {
                name: workout.name,
                date: workout.date,
                difficulty: workoutFeedback?.difficulty || 3
            };
        });
    }

    getUserFeedback() {
        const user = app.currentUser;
        return JSON.parse(localStorage.getItem(`feedback_${user?.id}`)) || [];
    }

    loadAchievements() {
        const user = app.currentUser;
        const saved = localStorage.getItem(`achievements_${user?.id}`);
        return saved ? JSON.parse(saved) : [];
    }

    loadRecentActivity() {
        const user = app.currentUser;
        const saved = localStorage.getItem(`activity_${user?.id}`);
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize dashboard
const dashboard = new Dashboard();