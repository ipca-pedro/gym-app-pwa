# Gym App - PWA com IA

App de treinos personalizados com IA que aprende com seu feedback.

## 🚀 Deploy Gratuito

### 1. Instalar Wrangler
```bash
npm install -g wrangler
wrangler login
```

### 2. Criar KV Storage
```bash
wrangler kv:namespace create "GYM_DB"
wrangler kv:namespace create "GYM_DB" --preview
# Copie os IDs gerados para wrangler.toml
```

### 3. Configurar API Key do Google AI
```bash
wrangler secret put GEMINI_API_KEY
# Cole sua chave do Google AI quando solicitado
```

### 4. Deploy da API
```bash
npm run worker:deploy
```

### 5. Deploy do Frontend
```bash
npm run deploy
```

## 🛠️ Desenvolvimento Local

```bash
# Frontend
npm run dev

# API (em outro terminal)
npm run worker:dev
```

## 📱 Funcionalidades

- ✅ Login/Cadastro simples
- ✅ Formulário de perfil fitness
- ✅ Treinos gerados por IA (Google Gemini - Gratuito)
- ✅ Sistema de feedback
- ✅ IA aprende e refina treinos
- ✅ PWA (funciona offline)
- ✅ Deploy 100% gratuito

## 🔄 Fluxo do App

1. **Login** → Usuário faz conta
2. **Perfil** → Preenche dados (idade, peso, objetivo, etc.)
3. **Treino** → IA Google Gemini gera treino personalizado
4. **Feedback** → Usuário avalia dificuldade e comenta
5. **Refinamento** → IA ajusta próximos treinos baseado no feedback