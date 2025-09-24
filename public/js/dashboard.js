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
        
        // Dynamic motivational messages
        const workouts = JSON.parse(localStorage.getItem(`workouts_${user?.id}`)) || [];
        const streak = this.calculateStreak(workouts);
        const totalWorkouts = workouts.length;
        const goal = user?.profile?.goal;
        
        const motivationalMessages = this.getMotivationalMessage(streak, totalWorkouts, goal);
        motivationEl.textContent = motivationalMessages;
        
        // Add goal-based styling with smooth transition
        if (goal) {
            document.body.classList.add(`goal-${goal.replace('_', '-')}`);
            
            // Update welcome card with goal-specific gradient
            const welcomeCard = document.querySelector('.welcome-card');
            if (welcomeCard) {
                welcomeCard.style.transition = 'background 0.5s ease';
            }
        }
    }
    
    getMotivationalMessage(streak, totalWorkouts, goal) {
        const goalMessages = {
            lose_weight: [
                '🔥 Cada treino queima calorias e constrói disciplina!',
                '⚡ Você está mais forte que suas desculpas!',
                '🎯 Foco no objetivo - cada dia conta!'
            ],
            gain_muscle: [
                '💪 Músculos crescem no descanso, mas são construídos no treino!',
                '🏗️ Construindo o corpo dos seus sonhos, rep por rep!',
                '⚡ Força não vem do que você consegue fazer, mas do que você supera!'
            ],
            get_stronger: [
                '🏋️ A força mental é tão importante quanto a física!',
                '💎 Pressão faz diamantes - você está se forjando!',
                '⚡ Cada peso levantado é um limite quebrado!'
            ],
            endurance: [
                '🏃 Resistência é sobre não desistir quando fica difícil!',
                '⚡ Seu coração fica mais forte a cada batida!',
                '🎯 Vai além do que você pensava ser possível!'
            ]
        };
        
        if (streak >= 7) {
            return `🔥 ${streak} dias consecutivos! Você é imparável!`;
        } else if (streak >= 3) {
            return `💪 ${streak} dias seguidos! Continue assim!`;
        } else if (totalWorkouts >= 10) {
            return `🏆 ${totalWorkouts} treinos completados! Que evolução!`;
        } else if (goal && goalMessages[goal]) {
            const messages = goalMessages[goal];
            return messages[Math.floor(Math.random() * messages.length)];
        }
        
        return '🚀 Hoje é o dia perfeito para treinar!';
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
        console.log('Current user:', user);
        
        if (!user?.profile) {
            console.log('No profile found, redirecting to profile page');
            authManager.showError('Configure seu perfil primeiro!');
            app.navigate('profile');
            return;
        }
        
        console.log('User profile:', user.profile);
        const recommendation = this.getWorkoutRecommendation();
        console.log('Workout recommendation:', recommendation);
        
        this.showEnhancedLoading('Gerando treino personalizado...', '🤖');
        
        try {
            // Generate workout based on full profile
            const workout = await this.generatePersonalizedWorkout(recommendation);
            console.log('Generated workout:', workout);
            
            if (!workout) {
                throw new Error('No workout generated');
            }
            
            workoutManager.currentWorkout = workout;
            workoutManager.saveWorkout();
            
            app.navigate('workout');
            
            this.showWorkoutCelebration(recommendation.name);
            this.hideEnhancedLoading();
            authManager.showSuccess(`Treino ${recommendation.name} gerado!`);
        } catch (error) {
            console.error('Error generating workout:', error);
            this.hideEnhancedLoading();
            authManager.showError('Erro ao gerar treino: ' + error.message);
        }
    }

    async generatePersonalizedWorkout(recommendation) {
        const user = app.currentUser;
        const profile = user.profile;
        
        // Build comprehensive prompt based on all profile data
        const prompt = this.buildWorkoutPrompt(profile, recommendation);
        
        try {
            // Try API endpoint (local dev or deployed)
            const apiUrl = window.location.hostname === 'localhost' ? 
                'http://localhost:8787/api/workout' : 
                'https://gym-app-api.a25453.workers.dev/api/workout';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: user.id, 
                    profile: profile,
                    recommendation: recommendation,
                    prompt: prompt
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('API Response:', data);
                
                if (data.workout && data.workout.exercises) {
                    return {
                        id: Date.now().toString(),
                        name: recommendation.name,
                        type: recommendation.type,
                        date: new Date().toISOString(),
                        exercises: data.workout.exercises,
                        duration: recommendation.duration,
                        location: recommendation.location,
                        status: 'active'
                    };
                } else {
                    console.error('Invalid API response structure:', data);
                }
            } else {
                console.error('API request failed:', response.status, response.statusText);
            }
        } catch (error) {
            console.log('API não disponível, usando geração offline:', error.message);
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
            authManager.showError('Configure seu perfil primeiro!');
            app.navigate('profile');
            return;
        }

        await this.startRecommendedWorkout();
    }
    
    showWorkoutCelebration(workoutName) {
        // Create celebration overlay
        const celebration = document.createElement('div');
        celebration.className = 'workout-celebration';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-icon">🎉</div>
                <h2>Treino Gerado!</h2>
                <p>${workoutName}</p>
                <div class="celebration-message">Vamos arrasar! 💪</div>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        // Auto remove after 2 seconds
        setTimeout(() => {
            celebration.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => celebration.remove(), 300);
        }, 2000);
    }
    
    showEnhancedLoading(message, icon = '⏳') {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="pulse-loader"></div>
                <h3 style="margin: 20px 0 10px; color: white;">${icon} ${message}</h3>
                <p style="color: rgba(255,255,255,0.8); margin: 0;">Isso pode levar alguns segundos...</p>
            </div>
        `;
        
        document.body.appendChild(loading);
        
        // Store reference for removal
        this.currentLoading = loading;
        
        return loading;
    }
    
    hideEnhancedLoading() {
        if (this.currentLoading) {
            this.currentLoading.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (this.currentLoading) {
                    this.currentLoading.remove();
                    this.currentLoading = null;
                }
            }, 300);
        }
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