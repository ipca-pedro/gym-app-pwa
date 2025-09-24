// Enhanced Animation System
class AnimationManager {
    constructor() {
        this.observers = new Map();
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
    }

    observeElement(element, animationType = 'slideUp') {
        element.dataset.animation = animationType;
        element.style.opacity = '0';
        element.style.transform = this.getInitialTransform(animationType);
        this.observer.observe(element);
    }

    getInitialTransform(type) {
        switch (type) {
            case 'slideUp': return 'translateY(30px)';
            case 'slideLeft': return 'translateX(-30px)';
            case 'slideRight': return 'translateX(30px)';
            case 'scale': return 'scale(0.9)';
            case 'rotate': return 'rotate(-5deg) scale(0.9)';
            default: return 'translateY(30px)';
        }
    }

    animateElement(element) {
        const animationType = element.dataset.animation || 'slideUp';
        
        element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0) translateX(0) scale(1) rotate(0)';
        
        // Add success class for additional styling
        setTimeout(() => {
            element.classList.add('animated-in');
        }, 600);
    }

    // Utility animations
    pulse(element, duration = 600) {
        element.style.animation = `successPulse ${duration}ms ease-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    shake(element, duration = 500) {
        element.style.animation = `shake ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    bounce(element, duration = 1000) {
        element.style.animation = `bounce ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    // Page transition
    fadeOut(element, callback) {
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0';
        setTimeout(() => {
            if (callback) callback();
        }, 300);
    }

    fadeIn(element) {
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            element.style.opacity = '1';
        }, 50);
    }
}

// Initialize animation manager
const animationManager = new AnimationManager();

// Auto-observe elements with animation classes
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach(element => {
        const animationType = element.dataset.animate;
        animationManager.observeElement(element, animationType);
    });
});

// Export for use in other modules
window.animationManager = animationManager;