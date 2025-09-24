// Authentication Manager
class AuthManager {
    constructor() {
        // Simple email/password authentication only
    }

    // Username/Password Authentication
    async loginWithUsername(username, password) {
        try {
            if (!username || username.length < 3) {
                throw new Error('Usuário deve ter pelo menos 3 caracteres');
            }

            if (password.length < 4) {
                throw new Error('Senha deve ter pelo menos 4 caracteres');
            }

            // Simulate API call
            await this.delay(500);

            const user = {
                id: btoa(username),
                username,
                provider: 'local',
                joinDate: new Date().toISOString()
            };

            app.currentUser = user;
            app.saveUser();
            app.navigate('dashboard');
            
            this.showSuccess('Login realizado com sucesso!');
            return user;
        } catch (error) {
            this.showError(error.message);
            throw error;
        }
    }

    async registerWithUsername(username, password, confirmPassword) {
        try {
            if (!username || username.length < 3) {
                throw new Error('Usuário deve ter pelo menos 3 caracteres');
            }

            if (password.length < 4) {
                throw new Error('Senha deve ter pelo menos 4 caracteres');
            }

            if (password !== confirmPassword) {
                throw new Error('Senhas não coincidem');
            }

            // Check if user already exists
            const existingUser = localStorage.getItem(`user_${btoa(username)}`);
            if (existingUser) {
                throw new Error('Usuário já existe');
            }

            // Simulate API call
            await this.delay(500);

            const user = {
                id: btoa(username),
                username,
                provider: 'local',
                joinDate: new Date().toISOString()
            };

            // Save user data
            localStorage.setItem(`user_${user.id}`, JSON.stringify(user));

            app.currentUser = user;
            app.saveUser();
            app.navigate('profile');
            
            this.showSuccess('Conta criada com sucesso!');
            return user;
        } catch (error) {
            this.showError(error.message);
            throw error;
        }
    }

    // Password Recovery
    async resetPassword(username) {
        try {
            if (!username || username.length < 3) {
                throw new Error('Usuário inválido');
            }

            // Simulate API call
            await this.delay(500);

            this.showSuccess('Senha resetada! Use: 123456');
            return true;
        } catch (error) {
            this.showError(error.message);
            throw error;
        }
    }

    // Validation
    validateUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }

    // Utilities
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideDown 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    logout() {
        app.currentUser = null;
        localStorage.removeItem('gymAppUser');
        app.navigate('login');
        this.showSuccess('Logout realizado com sucesso!');
    }
}

// Initialize auth manager
const authManager = new AuthManager();