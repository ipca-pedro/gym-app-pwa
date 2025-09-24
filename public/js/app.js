// Main App Controller
class GymApp {
    constructor() {
        this.currentUser = null;
        this.currentScreen = 'login';
        this.init();
    }

    init() {
        this.loadUser();
        this.setupEventListeners();
        this.router();
    }

    loadUser() {
        const userData = localStorage.getItem('gymAppUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    saveUser() {
        localStorage.setItem('gymAppUser', JSON.stringify(this.currentUser));
    }

    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('[data-nav]');
            if (navItem) {
                this.navigate(navItem.dataset.nav);
            }
        });


    }

    navigate(screen) {
        this.hideAllScreens();
        this.currentScreen = screen;
        
        const screenElement = document.getElementById(`${screen}Screen`);
        if (screenElement) {
            screenElement.classList.remove('hidden');
            this.updateNavigation();
            this.onScreenChange(screen);
        }
    }

    hideAllScreens() {
        const screens = [
            'dashboard', 'profile', 'workout', 'progress', 
            'nutrition', 'social', 'settings', 'bodyTracker'
        ];
        
        screens.forEach(screen => {
            const element = document.getElementById(`${screen}Screen`);
            if (element) element.classList.add('hidden');
        });
    }

    updateNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-nav="${this.currentScreen}"]`);
        if (activeNav) activeNav.classList.add('active');
    }

    onScreenChange(screen) {
        switch(screen) {
            case 'dashboard':
                if (typeof dashboard !== 'undefined') dashboard.load();
                break;
            case 'profile':
                if (typeof profile !== 'undefined') profile.load();
                break;
            case 'workout':
                if (typeof workoutManager !== 'undefined') workoutManager.load();
                break;
            case 'progress':
                if (typeof progressTracker !== 'undefined') progressTracker.load();
                break;
            case 'bodyTracker':
                if (typeof bodyTracker !== 'undefined') bodyTracker.load();
                break;
        }
    }

    router() {
        // Criar usuário automático se não existir
        if (!this.currentUser) {
            const userName = prompt('👋 Bem-vindo! Qual é o seu nome?') || 'Usuário';
            
            this.currentUser = {
                id: 'local_user',
                username: userName,
                provider: 'local',
                joinDate: new Date().toISOString()
            };
            this.saveUser();
        }
        
        // Navegar baseado no perfil
        if (!this.currentUser.profile) {
            this.navigate('profile');
        } else {
            this.navigate('dashboard');
        }
    }



    // Reset app data
    resetApp() {
        if (confirm('Tem certeza que deseja apagar todos os dados?')) {
            localStorage.clear();
            location.reload();
        }
    }
}

// Initialize app
const app = new GymApp();