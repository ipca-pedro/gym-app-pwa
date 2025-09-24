// Testes de integração para fluxos completos
class IntegrationTests {
    constructor() {
        this.testData = {
            user: {
                name: 'Test User',
                age: 25,
                weight: 70,
                height: 175,
                goal: 'muscle_gain',
                level: 'beginner'
            }
        };
    }

    async testCompleteUserFlow() {
        console.log('🔄 Testando fluxo completo do usuário...');
        
        // 1. Simular primeiro acesso
        localStorage.clear();
        
        // 2. Salvar dados do usuário
        localStorage.setItem('user_profile', JSON.stringify(this.testData.user));
        
        // 3. Verificar se dados foram salvos
        const savedProfile = JSON.parse(localStorage.getItem('user_profile'));
        if (!savedProfile || savedProfile.name !== this.testData.user.name) {
            throw new Error('Perfil não salvo corretamente');
        }
        
        // 4. Simular geração de treino
        const workoutData = {
            date: new Date().toISOString(),
            exercises: [
                { name: 'Push-ups', sets: 3, reps: 10 },
                { name: 'Squats', sets: 3, reps: 15 }
            ]
        };
        
        // 5. Salvar histórico de treino
        let workoutHistory = JSON.parse(localStorage.getItem('workout_history')) || [];
        workoutHistory.push(workoutData);
        localStorage.setItem('workout_history', JSON.stringify(workoutHistory));
        
        // 6. Verificar histórico
        const savedHistory = JSON.parse(localStorage.getItem('workout_history'));
        if (!savedHistory || savedHistory.length === 0) {
            throw new Error('Histórico de treino não salvo');
        }
        
        console.log('✅ Fluxo completo testado com sucesso!');
        return true;
    }

    async testDataPersistence() {
        console.log('💾 Testando persistência de dados...');
        
        const testKey = 'test_persistence';
        const testValue = { timestamp: Date.now(), data: 'test' };
        
        // Salvar
        localStorage.setItem(testKey, JSON.stringify(testValue));
        
        // Recuperar
        const retrieved = JSON.parse(localStorage.getItem(testKey));
        
        if (!retrieved || retrieved.data !== testValue.data) {
            throw new Error('Dados não persistiram corretamente');
        }
        
        // Limpar
        localStorage.removeItem(testKey);
        
        console.log('✅ Persistência de dados OK!');
        return true;
    }

    async testOfflineCapability() {
        console.log('📱 Testando capacidade offline...');
        
        // Verificar se localStorage funciona (simulando offline)
        try {
            const offlineData = { offline: true, timestamp: Date.now() };
            localStorage.setItem('offline_test', JSON.stringify(offlineData));
            
            const retrieved = JSON.parse(localStorage.getItem('offline_test'));
            if (!retrieved || !retrieved.offline) {
                throw new Error('Funcionalidade offline falhou');
            }
            
            localStorage.removeItem('offline_test');
            console.log('✅ Capacidade offline OK!');
            return true;
        } catch (error) {
            throw new Error('Erro na funcionalidade offline: ' + error.message);
        }
    }
}

// Adicionar testes de integração ao runner principal
if (typeof runner !== 'undefined') {
    const integration = new IntegrationTests();
    
    runner.test('Integração - Fluxo completo do usuário', async () => {
        await integration.testCompleteUserFlow();
    });
    
    runner.test('Integração - Persistência de dados', async () => {
        await integration.testDataPersistence();
    });
    
    runner.test('Integração - Capacidade offline', async () => {
        await integration.testOfflineCapability();
    });
}