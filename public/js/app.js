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
        this.initTheme();
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
            if (e.target.matches('[data-nav]')) {
                this.navigate(e.target.dataset.nav);
            }
        });

        // Theme toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('.theme-toggle') || e.target.closest('.theme-toggle')) {
                this.toggleTheme();
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
            'login', 'dashboard', 'profile', 'workout', 'progress', 
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
        if (!this.currentUser) {
            this.navigate('login');
        } else if (!this.currentUser.profile) {
            this.navigate('profile');
        } else {
            this.navigate('dashboard');
        }
    }

    // Theme Management
    initTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '🌞' : '🌙';
        }
    }

    // Authentication
    async login(email, password) {
        if (!email || !password) {
            throw new Error('Email e senha são obrigatórios');
        }

        // Simulate authentication
        this.currentUser = {
            id: btoa(email),
            email,
            joinDate: new Date().toISOString(),
            profile: null
        };

        this.saveUser();
        this.navigate('profile');
        return this.currentUser;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('gymAppUser');
        this.navigate('login');
    }
}

// Initialize app
const app = new GymApp();