// Advanced Workout Manager
class WorkoutManager {
    constructor() {
        this.currentWorkout = null;
        this.restTimer = null;
        this.workoutTimer = null;
        this.currentExerciseIndex = 0;
        this.currentSetIndex = 0;
    }

    load() {
        this.renderCurrentWorkout();
    }

    // Workout Generation with Progression
    generateWorkout(muscleGroup, difficulty = 'intermediate') {
        const exercises = this.getExercisesByGroup(muscleGroup);
        const workoutPlan = this.createProgressiveWorkout(exercises, difficulty);
        
        this.currentWorkout = {
            id: Date.now().toString(),
            name: `Treino ${muscleGroup}`,
            muscleGroup,
            difficulty,
            date: new Date().toISOString(),
            exercises: workoutPlan,
            status: 'active',
            startTime: null,
            endTime: null,
            totalVolume: 0
        };

        this.saveWorkout();
        this.renderCurrentWorkout();
        return this.currentWorkout;
    }

    createProgressiveWorkout(exercises, difficulty) {
        const difficultySettings = {
            beginner: { sets: [2, 3], reps: [8, 12], rest: 90 },
            intermediate: { sets: [3, 4], reps: [8, 15], rest: 75 },
            advanced: { sets: [4, 5], reps: [6, 12], rest: 60 }
        };

        const settings = difficultySettings[difficulty] || difficultySettings.intermediate;
        
        return exercises.map(exercise => {
            const sets = settings.sets[0] + Math.floor(Math.random() * (settings.sets[1] - settings.sets[0] + 1));
            const reps = `${settings.reps[0]}-${settings.reps[1]}`;
            
            return {
                ...exercise,
                sets: sets,
                reps: reps,
                restTime: settings.rest,
                weight: this.calculateProgressiveWeight(exercise.name),
                completed: false,
                setsCompleted: 0,
                actualSets: []
            };
        });
    }

    calculateProgressiveWeight(exerciseName) {
        // Get previous workout data for this exercise
        const history = this.getExerciseHistory(exerciseName);
        if (history.length === 0) return 0;

        const lastWorkout = history[0];
        const avgDifficulty = this.getAverageDifficulty();

        // Progressive overload logic
        if (avgDifficulty < 3) {
            // Too easy - increase weight by 5-10%
            return Math.round(lastWorkout.weight * 1.075);
        } else if (avgDifficulty > 4) {
            // Too hard - decrease weight by 2-5%
            return Math.round(lastWorkout.weight * 0.975);
        } else {
            // Just right - small increase
            return Math.round(lastWorkout.weight * 1.025);
        }
    }

    // Exercise Database
    getExercisesByGroup(muscleGroup) {
        const exerciseDB = {
            chest: [
                { name: 'Supino Reto', primary: 'chest', secondary: ['triceps', 'shoulders'], equipment: 'barbell' },
                { name: 'Supino Inclinado', primary: 'chest', secondary: ['triceps', 'shoulders'], equipment: 'barbell' },
                { name: 'Flexão', primary: 'chest', secondary: ['triceps', 'shoulders'], equipment: 'bodyweight' },
                { name: 'Crucifixo', primary: 'chest', secondary: ['shoulders'], equipment: 'dumbbell' }
            ],
            back: [
                { name: 'Puxada Alta', primary: 'back', secondary: ['biceps'], equipment: 'machine' },
                { name: 'Remada Curvada', primary: 'back', secondary: ['biceps'], equipment: 'barbell' },
                { name: 'Remada Sentada', primary: 'back', secondary: ['biceps'], equipment: 'machine' },
                { name: 'Levantamento Terra', primary: 'back', secondary: ['legs', 'core'], equipment: 'barbell' }
            ],
            legs: [
                { name: 'Agachamento', primary: 'legs', secondary: ['glutes', 'core'], equipment: 'barbell' },
                { name: 'Leg Press', primary: 'legs', secondary: ['glutes'], equipment: 'machine' },
                { name: 'Extensão de Pernas', primary: 'legs', secondary: [], equipment: 'machine' },
                { name: 'Flexão de Pernas', primary: 'legs', secondary: [], equipment: 'machine' }
            ],
            shoulders: [
                { name: 'Desenvolvimento', primary: 'shoulders', secondary: ['triceps'], equipment: 'barbell' },
                { name: 'Elevação Lateral', primary: 'shoulders', secondary: [], equipment: 'dumbbell' },
                { name: 'Elevação Frontal', primary: 'shoulders', secondary: [], equipment: 'dumbbell' },
                { name: 'Remada Alta', primary: 'shoulders', secondary: ['traps'], equipment: 'barbell' }
            ],
            arms: [
                { name: 'Rosca Direta', primary: 'biceps', secondary: [], equipment: 'barbell' },
                { name: 'Tríceps Testa', primary: 'triceps', secondary: [], equipment: 'barbell' },
                { name: 'Rosca Martelo', primary: 'biceps', secondary: ['forearms'], equipment: 'dumbbell' },
                { name: 'Tríceps Pulley', primary: 'triceps', secondary: [], equipment: 'machine' }
            ]
        };

        return exerciseDB[muscleGroup] || exerciseDB.chest;
    }

    // Rest Timer
    startRestTimer(duration = 60) {
        this.clearRestTimer();
        
        let timeLeft = duration;
        const timerDisplay = document.getElementById('restTimer');
        
        if (timerDisplay) {
            timerDisplay.textContent = this.formatTime(timeLeft);
            timerDisplay.classList.add('active');
        }

        this.restTimer = setInterval(() => {
            timeLeft--;
            
            if (timerDisplay) {
                timerDisplay.textContent = this.formatTime(timeLeft);
                
                // Visual feedback
                if (timeLeft <= 10) {
                    timerDisplay.classList.add('warning');
                }
            }

            // Notification at 10 seconds
            if (timeLeft === 10) {
                this.showNotification('10 segundos restantes!', 'warning');
            }

            if (timeLeft <= 0) {
                this.clearRestTimer();
                this.showNotification('Descanso terminado! Próxima série!', 'success');
                
                if (timerDisplay) {
                    timerDisplay.classList.remove('active', 'warning');
                }
            }
        }, 1000);
    }

    clearRestTimer() {
        if (this.restTimer) {
            clearInterval(this.restTimer);
            this.restTimer = null;
        }
    }

    // Workout Timer
    startWorkout() {
        this.currentWorkout.startTime = new Date().toISOString();
        this.currentWorkout.status = 'in-progress';
        
        const startTime = Date.now();
        const timerDisplay = document.getElementById('workoutTimer');
        
        this.workoutTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (timerDisplay) {
                timerDisplay.textContent = this.formatTime(Math.floor(elapsed / 1000));
            }
        }, 1000);

        this.saveWorkout();
    }

    completeWorkout() {
        this.currentWorkout.endTime = new Date().toISOString();
        this.currentWorkout.status = 'completed';
        
        // Calculate total volume
        this.currentWorkout.totalVolume = this.calculateTotalVolume();
        
        this.clearRestTimer();
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }

        this.saveWorkout();
        this.showWorkoutSummary();
    }

    // Set Management
    completeSet(exerciseIndex, weight, reps) {
        const exercise = this.currentWorkout.exercises[exerciseIndex];
        
        const setData = {
            weight: parseFloat(weight),
            reps: parseInt(reps),
            timestamp: new Date().toISOString(),
            volume: parseFloat(weight) * parseInt(reps)
        };

        exercise.actualSets.push(setData);
        exercise.setsCompleted++;

        // Check if exercise is complete
        if (exercise.setsCompleted >= exercise.sets) {
            exercise.completed = true;
        }

        // Start rest timer
        if (exercise.setsCompleted < exercise.sets) {
            this.startRestTimer(exercise.restTime);
        }

        this.saveWorkout();
        this.renderCurrentWorkout();
    }

    // Exercise Substitution
    substituteExercise(exerciseIndex, reason = 'equipment') {
        const currentExercise = this.currentWorkout.exercises[exerciseIndex];
        const alternatives = this.getAlternativeExercises(currentExercise, reason);
        
        if (alternatives.length > 0) {
            const newExercise = alternatives[Math.floor(Math.random() * alternatives.length)];
            
            // Preserve progress data
            newExercise.sets = currentExercise.sets;
            newExercise.reps = currentExercise.reps;
            newExercise.restTime = currentExercise.restTime;
            newExercise.weight = this.calculateProgressiveWeight(newExercise.name);
            newExercise.setsCompleted = currentExercise.setsCompleted;
            newExercise.actualSets = currentExercise.actualSets;
            newExercise.completed = currentExercise.completed;
            
            this.currentWorkout.exercises[exerciseIndex] = newExercise;
            this.saveWorkout();
            this.renderCurrentWorkout();
            
            this.showNotification(`Exercício substituído: ${newExercise.name}`, 'info');
        }
    }

    getAlternativeExercises(exercise, reason) {
        const allExercises = Object.values(this.getExercisesByGroup('chest'))
            .concat(Object.values(this.getExercisesByGroup('back')))
            .concat(Object.values(this.getExercisesByGroup('legs')))
            .concat(Object.values(this.getExercisesByGroup('shoulders')))
            .concat(Object.values(this.getExercisesByGroup('arms')));

        return allExercises.filter(alt => 
            alt.name !== exercise.name &&
            alt.primary === exercise.primary &&
            (reason !== 'equipment' || alt.equipment !== exercise.equipment)
        );
    }

    // Rendering
    renderCurrentWorkout() {
        const container = document.getElementById('currentWorkout');
        if (!container || !this.currentWorkout) return;

        const workout = this.currentWorkout;
        const completedExercises = workout.exercises.filter(ex => ex.completed).length;
        const progress = (completedExercises / workout.exercises.length) * 100;

        let html = `
            <div class="workout-header">
                <h2>${workout.name}</h2>
                <div class="workout-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span>${completedExercises}/${workout.exercises.length} exercícios</span>
                </div>
                <div class="workout-timers">
                    <div class="timer" id="workoutTimer">00:00</div>
                    <div class="rest-timer" id="restTimer">Descanso</div>
                </div>
            </div>
            <div class="exercises-list">
        `;

        workout.exercises.forEach((exercise, index) => {
            html += `
                <div class="exercise-card ${exercise.completed ? 'completed' : ''}">
                    <div class="exercise-header">
                        <h3>${exercise.name}</h3>
                        <button class="btn-substitute" onclick="workoutManager.substituteExercise(${index})">
                            🔄 Substituir
                        </button>
                    </div>
                    <div class="exercise-info">
                        <span>${exercise.sets} séries × ${exercise.reps} reps</span>
                        <span>Descanso: ${exercise.restTime}s</span>
                    </div>
                    <div class="sets-tracker">
                        ${this.renderSetsTracker(exercise, index)}
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <div class="workout-actions">
                ${workout.status === 'active' ? 
                    '<button class="btn btn-success" onclick="workoutManager.startWorkout()">Iniciar Treino</button>' :
                    '<button class="btn btn-warning" onclick="workoutManager.completeWorkout()">Finalizar Treino</button>'
                }
            </div>
        `;

        container.innerHTML = html;
    }

    renderSetsTracker(exercise, exerciseIndex) {
        let html = '';
        
        for (let i = 0; i < exercise.sets; i++) {
            const setCompleted = i < exercise.setsCompleted;
            const actualSet = exercise.actualSets[i];
            
            html += `
                <div class="set-row ${setCompleted ? 'completed' : ''}">
                    <span class="set-number">${i + 1}</span>
                    ${setCompleted ? `
                        <span class="set-data">${actualSet.weight}kg × ${actualSet.reps}</span>
                    ` : `
                        <input type="number" placeholder="Peso" class="weight-input" id="weight_${exerciseIndex}_${i}">
                        <input type="number" placeholder="Reps" class="reps-input" id="reps_${exerciseIndex}_${i}">
                        <button class="btn-complete-set" onclick="workoutManager.completeSetFromInputs(${exerciseIndex}, ${i})">✓</button>
                    `}
                </div>
            `;
        }
        
        return html;
    }

    completeSetFromInputs(exerciseIndex, setIndex) {
        const weightInput = document.getElementById(`weight_${exerciseIndex}_${setIndex}`);
        const repsInput = document.getElementById(`reps_${exerciseIndex}_${setIndex}`);
        
        const weight = weightInput.value;
        const reps = repsInput.value;
        
        if (weight && reps) {
            this.completeSet(exerciseIndex, weight, reps);
        } else {
            this.showNotification('Preencha peso e repetições', 'error');
        }
    }

    // Utilities
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    calculateTotalVolume() {
        return this.currentWorkout.exercises.reduce((total, exercise) => {
            return total + exercise.actualSets.reduce((exerciseTotal, set) => {
                return exerciseTotal + set.volume;
            }, 0);
        }, 0);
    }

    getExerciseHistory(exerciseName) {
        const workouts = JSON.parse(localStorage.getItem(`workouts_${app.currentUser?.id}`)) || [];
        const history = [];
        
        workouts.forEach(workout => {
            workout.exercises?.forEach(exercise => {
                if (exercise.name === exerciseName && exercise.actualSets?.length > 0) {
                    history.push({
                        date: workout.date,
                        weight: exercise.actualSets[0].weight,
                        sets: exercise.actualSets
                    });
                }
            });
        });
        
        return history.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getAverageDifficulty() {
        const feedbacks = JSON.parse(localStorage.getItem(`feedback_${app.currentUser?.id}`)) || [];
        if (feedbacks.length === 0) return 3;
        
        const recent = feedbacks.slice(0, 5);
        return recent.reduce((sum, f) => sum + parseInt(f.difficulty), 0) / recent.length;
    }

    saveWorkout() {
        if (!this.currentWorkout) return;
        
        const workouts = JSON.parse(localStorage.getItem(`workouts_${app.currentUser?.id}`)) || [];
        const existingIndex = workouts.findIndex(w => w.id === this.currentWorkout.id);
        
        if (existingIndex >= 0) {
            workouts[existingIndex] = this.currentWorkout;
        } else {
            workouts.unshift(this.currentWorkout);
        }
        
        localStorage.setItem(`workouts_${app.currentUser?.id}`, JSON.stringify(workouts.slice(0, 100)));
    }

    showWorkoutSummary() {
        const summary = {
            duration: this.formatTime((new Date(this.currentWorkout.endTime) - new Date(this.currentWorkout.startTime)) / 1000),
            totalVolume: this.currentWorkout.totalVolume,
            exercisesCompleted: this.currentWorkout.exercises.filter(ex => ex.completed).length
        };
        
        this.showNotification(`Treino concluído! ${summary.duration} - ${summary.totalVolume}kg volume total`, 'success');
    }

    showNotification(message, type = 'info') {
        // Reuse notification system from auth.js
        authManager.showNotification(message, type);
    }
}

// Initialize workout manager
const workoutManager = new WorkoutManager();