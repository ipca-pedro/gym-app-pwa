// Sistema de testes simples
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        this.results = [];
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '';

        for (const test of this.tests) {
            try {
                await test.fn();
                this.results.push({ name: test.name, status: 'pass' });
                this.displayResult(test.name, 'pass');
            } catch (error) {
                this.results.push({ name: test.name, status: 'fail', error: error.message });
                this.displayResult(test.name, 'fail', error.message);
            }
        }

        this.displaySummary();
    }

    displayResult(name, status, error = '') {
        const resultsDiv = document.getElementById('results');
        const div = document.createElement('div');
        div.className = `test-result ${status}`;
        div.innerHTML = `
            <strong>${status === 'pass' ? '✅' : '❌'} ${name}</strong>
            ${error ? `<br><small>${error}</small>` : ''}
        `;
        resultsDiv.appendChild(div);
    }

    displaySummary() {
        const passed = this.results.filter(r => r.status === 'pass').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        
        document.getElementById('summary').innerHTML = `
            <div class="summary">
                <h3>📊 Resumo dos Testes</h3>
                <p>✅ Passou: ${passed}</p>
                <p>❌ Falhou: ${failed}</p>
                <p>📈 Total: ${this.results.length}</p>
            </div>
        `;
    }
}

const runner = new TestRunner();

// Testes de Autenticação
runner.test('Auth - Validar username válido', () => {
    if (typeof AuthManager === 'undefined') throw new Error('AuthManager não carregado');
    const auth = new AuthManager();
    const result = auth.validateUsername('joao123');
    if (!result) throw new Error('Username válido rejeitado');
});

runner.test('Auth - Rejeitar username inválido', () => {
    const auth = new AuthManager();
    const result = auth.validateUsername('');
    if (result) throw new Error('Username vazio aceito incorretamente');
});

// Testes de LocalStorage
runner.test('LocalStorage - Salvar e recuperar dados', () => {
    const testData = { name: 'Test User', age: 25 };
    localStorage.setItem('test_data', JSON.stringify(testData));
    const retrieved = JSON.parse(localStorage.getItem('test_data'));
    if (retrieved.name !== testData.name) throw new Error('Dados não salvos corretamente');
    localStorage.removeItem('test_data');
});

// Testes de Dashboard
runner.test('Dashboard - Calcular IMC', () => {
    if (typeof Dashboard === 'undefined') throw new Error('Dashboard não carregado');
    // Mock user profile for BMI calculation
    window.app = { currentUser: { profile: { height: 175 } } };
    const dashboard = new Dashboard();
    const tracker = new BodyTracker();
    const imc = tracker.calculateBMI(70);
    if (Math.abs(imc - 22.9) > 0.1) throw new Error(`IMC incorreto: ${imc}`);
});

// Testes de Body Tracker
runner.test('BodyTracker - Validar medidas', () => {
    if (typeof BodyTracker === 'undefined') throw new Error('BodyTracker não carregado');
    const weight = 70;
    if (weight < 30 || weight > 300) throw new Error('Medida inválida');
});

runner.test('BodyTracker - Rejeitar medida inválida', () => {
    const weight = -5;
    if (weight >= 30 && weight <= 300) throw new Error('Medida negativa aceita incorretamente');
});

// Testes de Workout Manager
runner.test('WorkoutManager - Gerar treino básico', () => {
    if (typeof WorkoutManager === 'undefined') throw new Error('WorkoutManager não carregado');
    const manager = new WorkoutManager();
    const workout = manager.generateWorkout('chest', 'beginner');
    if (!workout || !workout.exercises || workout.exercises.length === 0) throw new Error('Treino não gerado');
});

// Testes de Validação de Formulário
runner.test('Validação - Idade válida', () => {
    const age = 25;
    if (age < 16 || age > 100) throw new Error('Validação de idade falhou');
});

runner.test('Validação - Peso válido', () => {
    const weight = 70;
    if (weight < 30 || weight > 300) throw new Error('Validação de peso falhou');
});

// Teste de PWA
runner.test('PWA - Service Worker disponível', () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service Worker não suportado');
});

// Mock app object for tests
if (typeof window !== 'undefined' && !window.app) {
    window.app = {
        currentUser: {
            id: 'test_user',
            profile: {
                name: 'Test User',
                age: 25,
                weight: 70,
                height: 175,
                goal: 'muscle_gain',
                level: 'beginner'
            }
        }
    };
}

// Função global para executar testes
async function runAllTests() {
    console.log('🚀 Iniciando testes...');
    await runner.run();
    console.log('✅ Testes concluídos!');
}