// AI Chat Personal Trainer
class AIChat {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.loadMessages();
    }

    async sendMessage(message) {
        if (!message.trim() || this.isTyping) return;

        // Add user message
        this.addMessage('user', message);
        
        // Show typing indicator
        this.showTyping();
        
        try {
            const response = await this.getAIResponse(message);
            this.hideTyping();
            this.addMessage('ai', response);
        } catch (error) {
            this.hideTyping();
            this.addMessage('ai', 'Desculpe, não consegui processar sua pergunta. Tente novamente!');
        }
    }

    async getAIResponse(message) {
        const context = this.buildContext();
        const prompt = `Você é um personal trainer experiente e motivador. Responda de forma amigável e útil.

Contexto do usuário:
${context}

Pergunta: ${message}

Responda de forma concisa (máximo 150 palavras) e sempre inclua dicas práticas.`;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: prompt })
        });

        if (!response.ok) throw new Error('API Error');
        
        const data = await response.json();
        return data.response;
    }

    buildContext() {
        const user = app.currentUser;
        if (!user?.profile) return 'Usuário sem perfil definido.';

        const recentWorkouts = JSON.parse(localStorage.getItem(`workouts_${user.id}`)) || [];
        const recentFeedback = JSON.parse(localStorage.getItem(`feedback_${user.id}`)) || [];
        
        return `
- Idade: ${user.profile.age} anos
- Peso: ${user.profile.weight}kg
- Altura: ${user.profile.height}cm  
- Objetivo: ${user.profile.goal}
- Nível: ${user.profile.level}
- Treinos realizados: ${recentWorkouts.length}
- Última dificuldade relatada: ${recentFeedback[0]?.difficulty || 'N/A'}/5
        `.trim();
    }

    addMessage(sender, content) {
        const message = {
            id: Date.now(),
            sender,
            content,
            timestamp: new Date().toISOString()
        };

        this.messages.push(message);
        this.saveMessages();
        this.renderMessage(message);
        this.scrollToBottom();
    }

    renderMessage(message) {
        const chatContainer = document.getElementById('chatMessages');
        if (!chatContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = `message message-${message.sender}`;
        messageEl.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">
                    ${message.sender === 'ai' ? '🤖' : '👤'}
                </div>
                <div class="message-bubble">
                    <div class="message-text">${message.content}</div>
                    <div class="message-time">
                        ${new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </div>
                </div>
            </div>
        `;

        chatContainer.appendChild(messageEl);
        
        // Animate message in
        setTimeout(() => messageEl.classList.add('message-show'), 100);
    }

    showTyping() {
        this.isTyping = true;
        const chatContainer = document.getElementById('chatMessages');
        if (!chatContainer) return;

        const typingEl = document.createElement('div');
        typingEl.id = 'typing-indicator';
        typingEl.className = 'message message-ai typing';
        typingEl.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">🤖</div>
                <div class="message-bubble">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;

        chatContainer.appendChild(typingEl);
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        const typingEl = document.getElementById('typing-indicator');
        if (typingEl) typingEl.remove();
    }

    scrollToBottom() {
        const chatContainer = document.getElementById('chatMessages');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    loadMessages() {
        const saved = localStorage.getItem(`chat_${app.currentUser?.id}`);
        if (saved) {
            this.messages = JSON.parse(saved);
        } else {
            // Welcome message
            this.messages = [{
                id: Date.now(),
                sender: 'ai',
                content: '👋 Olá! Sou seu personal trainer virtual. Como posso ajudar você hoje? Posso tirar dúvidas sobre exercícios, nutrição, técnicas de treino e muito mais!',
                timestamp: new Date().toISOString()
            }];
        }
    }

    saveMessages() {
        // Keep only last 50 messages
        const recentMessages = this.messages.slice(-50);
        localStorage.setItem(`chat_${app.currentUser?.id}`, JSON.stringify(recentMessages));
    }

    renderAllMessages() {
        const chatContainer = document.getElementById('chatMessages');
        if (!chatContainer) return;

        chatContainer.innerHTML = '';
        this.messages.forEach(message => this.renderMessage(message));
    }

    // Quick responses
    getQuickResponses() {
        return [
            '💪 Como melhorar minha força?',
            '🏃 Exercícios para cardio?',
            '🥗 Dicas de alimentação?',
            '😴 Importância do descanso?',
            '📈 Como acompanhar progresso?',
            '🤕 Exercícios para dor nas costas?'
        ];
    }

    addQuickResponseButtons() {
        const container = document.getElementById('quickResponses');
        if (!container) return;

        const responses = this.getQuickResponses();
        container.innerHTML = responses.map(response => `
            <button class="quick-response-btn" onclick="aiChat.sendQuickResponse('${response.substring(2)}')">
                ${response}
            </button>
        `).join('');
    }

    sendQuickResponse(message) {
        document.getElementById('chatInput').value = message;
        this.sendMessage(message);
    }

    // Voice input (if supported)
    startVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            uiManager.showToast('Reconhecimento de voz não suportado', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            uiManager.showToast('🎤 Fale agora...', 'info', 2000);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chatInput').value = transcript;
            this.sendMessage(transcript);
        };

        recognition.onerror = () => {
            uiManager.showToast('Erro no reconhecimento de voz', 'error');
        };

        recognition.start();
    }

    // Export chat history
    exportChat() {
        const chatData = {
            user: app.currentUser.username,
            messages: this.messages,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `gym-app-chat-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        uiManager.showToast('Chat exportado!', 'success');
    }

    // Clear chat
    clearChat() {
        if (confirm('Tem certeza que deseja limpar todo o histórico do chat?')) {
            this.messages = [];
            this.saveMessages();
            this.loadMessages(); // Reload with welcome message
            this.renderAllMessages();
            uiManager.showToast('Chat limpo!', 'success');
        }
    }
}

// Initialize AI Chat
const aiChat = new AIChat();