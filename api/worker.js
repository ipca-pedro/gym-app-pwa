export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    // Generate workout
    if (url.pathname === '/api/workout' && request.method === 'POST') {
      try {
        const { userId, profile } = await request.json();
        
        // Get user history for personalization
        const userHistory = await env.GYM_DB.get(`user:${userId}:history`) || '[]';
        const history = JSON.parse(userHistory);
        
        // Use custom prompt if provided (from dashboard), otherwise use default
        const prompt = request.prompt || `Crie um treino personalizado para:
- Idade: ${profile.age} anos
- Peso: ${profile.weight}kg, Altura: ${profile.height}cm
- Nível: ${profile.level}
- Objetivo: ${profile.goal}
- Tipo preferido: ${profile.workoutType || 'misto'}
- Local: ${profile.trainingLocation || 'academia'}
- Duração: ${profile.sessionDuration || '45-60'} minutos
- Disponibilidade: ${profile.weeklyAvailability || '3-4 dias'}
- Horário: ${profile.preferredTime || 'flexível'}
- Limitações: ${profile.limitations || 'Nenhuma'}

Histórico de feedback: ${history.slice(-3).map(h => `Dificuldade: ${h.difficulty}/5, Comentários: ${h.comments}`).join('; ')}

Retorne um JSON com: {"name": "Nome do Treino", "duration": "${profile.sessionDuration || '45'} min", "exercises": [{"name": "Exercício", "sets": 3, "reps": "12-15", "description": "Como fazer", "equipment": "equipamento"}]}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        });

        const data = await response.json();
        let workout;
        
        try {
          const content = data.candidates[0].content.parts[0].text;
          workout = JSON.parse(content);
          workout.id = Date.now().toString();
          workout.date = new Date().toISOString();
        } catch {
          // Fallback workout
          workout = {
            id: Date.now().toString(),
            name: "Treino Personalizado",
            duration: "45 min",
            date: new Date().toISOString(),
            exercises: [
              { name: "Agachamento", sets: 3, reps: "12-15", description: "Pés na largura dos ombros, desça até 90°" },
              { name: "Flexão", sets: 3, reps: "8-12", description: "Mantenha o corpo reto, desça até o peito tocar o chão" },
              { name: "Prancha", sets: 3, reps: "30-60s", description: "Corpo reto, apoie nos antebraços" }
            ]
          };
        }

        // Save current workout
        await env.GYM_DB.put(`user:${userId}:current_workout`, JSON.stringify(workout));

        return new Response(JSON.stringify({ workout }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Erro ao gerar treino' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // Submit feedback
    if (url.pathname === '/api/feedback' && request.method === 'POST') {
      try {
        const feedback = await request.json();
        
        // Get existing history
        const userHistory = await env.GYM_DB.get(`user:${feedback.userId}:history`) || '[]';
        const history = JSON.parse(userHistory);
        
        // Add new feedback
        history.push({
          ...feedback,
          date: new Date().toISOString()
        });
        
        // Keep only last 10 feedbacks
        const recentHistory = history.slice(-10);
        
        // Save updated history
        await env.GYM_DB.put(`user:${feedback.userId}:history`, JSON.stringify(recentHistory));
        
        // Clear current workout
        await env.GYM_DB.delete(`user:${feedback.userId}:current_workout`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Erro ao salvar feedback' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // Get user's current workout
    if (url.pathname.match(/\/api\/user\/(.+)\/workout/) && request.method === 'GET') {
      try {
        const userId = url.pathname.split('/')[3];
        const workoutData = await env.GYM_DB.get(`user:${userId}:current_workout`);
        
        if (workoutData) {
          const workout = JSON.parse(workoutData);
          return new Response(JSON.stringify({ workout }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } else {
          return new Response(JSON.stringify({ workout: null }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Erro ao buscar treino' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // AI Chat endpoint
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        const { message } = await request.json();
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: message }]
            }]
          })
        });

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        return new Response(JSON.stringify({ response: aiResponse }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          response: 'Desculpe, não consegui processar sua pergunta no momento.' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    return new Response('Not found', { status: 404 });
  }
};