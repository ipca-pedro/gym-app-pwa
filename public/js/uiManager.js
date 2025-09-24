// UI Manager - Loading, Notifications, Animations
class UIManager {
    constructor() {
        this.setupNotifications();
        this.setupOnboarding();
    }

    // Loading States
    showLoading(message = 'Carregando...', container = 'body') {
        const loadingId = 'loading-' + Date.now();
        const loadingHTML = `
            <div id="${loadingId}" class="loading-overlay">
                <div class="loading-content">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            </div>
        `;
        
        if (container === 'body') {
            document.body.insertAdjacentHTML('beforeend', loadingHTML);
        } else {
            const containerEl = document.getElementById(container);
            if (containerEl) {
                containerEl.innerHTML = loadingHTML;
            }
        }
        
        return loadingId;
    }

    hideLoading(loadingId) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => loadingEl.remove(), 300);
        }
    }

    // Notifications
    setupNotifications() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            this.requestNotificationPermission();
        }
    }

    async requestNotificationPermission() {
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }

    scheduleWorkoutReminder() {
        if (!('serviceWorker' in navigator)) return;

        // Schedule for tomorrow at 9 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);

        const delay = tomorrow.getTime() - Date.now();
        
        setTimeout(() => {
            this.showNotification(
                '🏋️ Hora do Treino!',
                'Que tal fazer um treino hoje? Seu corpo agradece!',
                '/public/assets/icon-192.png'
            );
        }, delay);
    }

    showNotification(title, body, icon = null) {
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body,
                icon: icon || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E🏋️%3C/text%3E%3C/svg%3E',
                badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E💪%3C/text%3E%3C/svg%3E',
                tag: 'gym-app',
                requireInteraction: false
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            setTimeout(() => notification.close(), 5000);
        }
    }

    // Onboarding
    setupOnboarding() {
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenOnboarding && app.currentUser) {
            setTimeout(() => this.showOnboarding(), 1000);
        }
    }

    showOnboarding() {
        const steps = [
            {
                target: '.nav-item[data-nav="dashboard"]',
                title: '🏠 Dashboard',
                content: 'Aqui você vê suas estatísticas e pode iniciar treinos rápidos.'
            },
            {
                target: '.nav-item[data-nav="workout"]',
                title: '🏋️ Treinos',
                content: 'Treinos personalizados gerados pela IA baseados no seu perfil.'
            },
            {
                target: '.nav-item[data-nav="bodyTracker"]',
                title: '📊 Acompanhamento',
                content: 'Registre seu peso, medidas e fotos de progresso.'
            },
            {
                target: '.theme-toggle',
                title: '🌙 Tema',
                content: 'Alterne entre modo claro e escuro.'
            }
        ];

        this.showTutorial(steps);
    }

    showTutorial(steps) {
        let currentStep = 0;
        
        const showStep = () => {
            if (currentStep >= steps.length) {
                this.completeTutorial();
                return;
            }

            const step = steps[currentStep];
            const target = document.querySelector(step.target);
            
            if (!target) {
                currentStep++;
                showStep();
                return;
            }

            const tooltip = this.createTooltip(step, () => {
                currentStep++;
                showStep();
            });

            this.positionTooltip(tooltip, target);
            this.highlightElement(target);
        };

        showStep();
    }

    createTooltip(step, onNext) {
        const tooltip = document.createElement('div');
        tooltip.className = 'onboarding-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <h3>${step.title}</h3>
                <p>${step.content}</p>
                <div class="tooltip-actions">
                    <button class="btn-skip" onclick="uiManager.completeTutorial()">Pular</button>
                    <button class="btn-next">Próximo</button>
                </div>
            </div>
            <div class="tooltip-arrow"></div>
        `;

        tooltip.querySelector('.btn-next').onclick = () => {
            tooltip.remove();
            document.querySelector('.highlight-overlay')?.remove();
            onNext();
        };

        document.body.appendChild(tooltip);
        return tooltip;
    }

    positionTooltip(tooltip, target) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top = targetRect.bottom + 10;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        
        // Adjust if tooltip goes off screen
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        
        if (top + tooltipRect.height > window.innerHeight - 10) {
            top = targetRect.top - tooltipRect.height - 10;
            tooltip.classList.add('tooltip-above');
        }

        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    }

    highlightElement(element) {
        const overlay = document.createElement('div');
        overlay.className = 'highlight-overlay';
        
        const rect = element.getBoundingClientRect();
        overlay.style.cssText = `
            position: fixed;
            top: ${rect.top - 4}px;
            left: ${rect.left - 4}px;
            width: ${rect.width + 8}px;
            height: ${rect.height + 8}px;
            border: 2px solid #667eea;
            border-radius: 8px;
            pointer-events: none;
            z-index: 9999;
            animation: pulse 2s infinite;
        `;
        
        document.body.appendChild(overlay);
    }

    completeTutorial() {
        localStorage.setItem('hasSeenOnboarding', 'true');
        document.querySelectorAll('.onboarding-tooltip, .highlight-overlay').forEach(el => el.remove());
        this.showToast('Tutorial concluído! 🎉', 'success');
    }

    // Visual Feedback
    celebrateExerciseComplete(element) {
        // Confetti effect
        this.createConfetti(element);
        
        // Success animation
        element.classList.add('exercise-completed');
        
        // Sound effect (if enabled)
        this.playSuccessSound();
        
        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    createConfetti(element) {
        const rect = element.getBoundingClientRect();
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
        
        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: ${rect.top + rect.height / 2}px;
                left: ${rect.left + rect.width / 2}px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                animation: confetti-fall ${0.5 + Math.random() * 0.5}s ease-out forwards;
                transform: rotate(${Math.random() * 360}deg);
            `;
            
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 1000);
        }
    }

    playSuccessSound() {
        // Create audio context for success sound
        if ('AudioContext' in window || 'webkitAudioContext' in window) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    }

    // Toast Messages
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getToastIcon(type)}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('toast-show'), 100);
        
        // Animate out
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Progress Animations
    animateProgressBar(element, targetWidth, duration = 1000) {
        let currentWidth = 0;
        const increment = targetWidth / (duration / 16);
        
        const animate = () => {
            currentWidth += increment;
            if (currentWidth >= targetWidth) {
                element.style.width = targetWidth + '%';
                return;
            }
            
            element.style.width = currentWidth + '%';
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // Workout Completion Celebration
    celebrateWorkoutComplete() {
        // Full screen celebration
        const celebration = document.createElement('div');
        celebration.className = 'workout-celebration';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-icon">🎉</div>
                <h2>Parabéns!</h2>
                <p>Treino concluído com sucesso!</p>
                <div class="celebration-stats">
                    <div class="stat">
                        <span class="stat-number">${this.getWorkoutDuration()}</span>
                        <span class="stat-label">minutos</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${this.getCaloriesBurned()}</span>
                        <span class="stat-label">calorias</span>
                    </div>
                </div>
                <button class="btn" onclick="this.parentElement.parentElement.remove()">Continuar</button>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (celebration.parentElement) {
                celebration.remove();
            }
        }, 5000);
        
        // Schedule next workout reminder
        this.scheduleWorkoutReminder();
    }

    getWorkoutDuration() {
        // Calculate workout duration from start time
        if (workoutManager.currentWorkout?.startTime) {
            const start = new Date(workoutManager.currentWorkout.startTime);
            const duration = Math.floor((Date.now() - start.getTime()) / 60000);
            return duration;
        }
        return 45; // Default
    }

    getCaloriesBurned() {
        // Estimate calories based on workout duration and user weight
        const duration = this.getWorkoutDuration();
        const weight = app.currentUser?.profile?.weight || 70;
        return Math.floor(duration * weight * 0.1); // Rough estimate
    }
}

// Initialize UI Manager
const uiManager = new UIManager();