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
        const { userId, profile, prompt } = await request.json();
        
        const workoutPrompt = prompt || `Crie um treino personalizado para:
- Idade: ${profile.age} anos
- Peso: ${profile.weight}kg, Altura: ${profile.height}cm
- Nível: ${profile.level}
- Objetivo: ${profile.goal}
- Tipo preferido: ${profile.workoutType || 'misto'}
- Local: ${profile.trainingLocation || 'academia'}
- Duração: ${profile.sessionDuration || '45-60'} minutos

Retorne APENAS um JSON válido com esta estrutura:
{"exercises": [{"name": "Nome do Exercício", "sets": 3, "reps": "8-12", "rest": 60, "description": "Como executar", "equipment": "equipamento"}]}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: workoutPrompt }]
            }]
          })
        });

        const data = await response.json();
        let workout;
        
        try {
          const content = data.candidates[0].content.parts[0].text;
          const cleanContent = content.replace(/```json|```/g, '').trim();
          const aiWorkout = JSON.parse(cleanContent);
          
          workout = {
            id: Date.now().toString(),
            name: "Treino IA Personalizado",
            date: new Date().toISOString(),
            exercises: aiWorkout.exercises,
            status: 'active'
          };
        } catch (error) {
          console.log('AI parsing failed, using fallback');
          // Fallback workout
          workout = {
            id: Date.now().toString(),
            name: "Treino Personalizado",
            date: new Date().toISOString(),
            exercises: [
              { name: "Agachamento", sets: 3, reps: "12-15", rest: 90, description: "Pés na largura dos ombros, desça até 90°", equipment: "Peso corporal" },
              { name: "Flexão", sets: 3, reps: "8-12", rest: 60, description: "Mantenha o corpo reto, desça até o peito tocar o chão", equipment: "Peso corporal" },
              { name: "Prancha", sets: 3, reps: "30-60s", rest: 45, description: "Corpo reto, apoie nos antebraços", equipment: "Peso corporal" }
            ],
            status: 'active'
          };
        }

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

    return new Response('Gym App API - Funcionando! 🚀', { 
      headers: { 'Content-Type': 'text/plain', ...corsHeaders } 
    });
  }
};