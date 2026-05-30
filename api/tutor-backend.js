// archivo: api/tutor.js (para Vercel) O server.js (para Node.js local)
// Este archivo maneja las llamadas a la API de forma SEGURA

// Para Vercel Edge Function:
export default async function handler(req, res) {
  // Permitir solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  const { userText, level } = req.body;

  // Validar entrada
  if (!userText || !level) {
    return res.status(400).json({ error: 'Missing userText or level' });
  }

  try {
    // 🔒 La API key viene de variables de entorno (SEGURA)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY no está configurada');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Construir el prompt
    const systemPrompt = `You are a highly educated, cultured English tutor who can discuss ANY topic - history, science, literature, philosophy, current events, art, technology, sports, culture, travel, and more. You have deep knowledge across all subjects and engage in intellectually stimulating conversations.

A student (${level} level) just said: "${userText}"

Your role is to:
1. CORRECT their English naturally (grammar, vocabulary, idioms, pronunciation tips)
2. ENGAGE meaningfully with the CONTENT and TOPIC they're discussing
3. Ask follow-up questions to deepen the conversation
4. Share relevant knowledge and insights about the topic
5. Make the conversation enjoyable and educational

Respond in JSON format (and ONLY JSON, no preamble) with:
{
  "corrections": {
    "original": "${userText}",
    "corrected": "the corrected version (or original if perfect)",
    "explanation": "brief explanation of grammar/vocabulary improvements (in Spanish for clarity)"
  },
  "feedback": "specific, encouraging feedback about their language use (or 'Excellent!' if perfect)",
  "response": "Your engaging, conversational response that: addresses their topic intelligently, demonstrates knowledge, asks thoughtful follow-up questions, and naturally incorporates more advanced vocabulary and expressions for them to learn",
  "topic": "The main topic they're discussing"
}

IMPORTANT:
- Be knowledgeable and conversational, not robotic
- If they discuss literature, philosophy, history, science - show your expertise
- Use interesting facts, nuances, and perspectives
- Adapt to their level: ${level === 'beginner' ? 'use simpler sentences but stay cultured' : level === 'intermediate' ? 'use varied sentence structures and interesting vocabulary' : 'challenge them with sophisticated expressions and nuanced discussions'}
- Make them WANT to keep talking
- Be warm, encouraging, and genuinely interested in what they say`;

    // Llamar a la API de Anthropic desde el backend (seguro)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey, // 🔒 La key está segura en el backend
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: systemPrompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({ 
        error: error.message || 'Error calling Anthropic API' 
      });
    }

    const data = await response.json();
    const textContent = data.content[0].text;
    const cleaned = textContent.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);

    // Devolver el resultado al frontend
    return res.status(200).json(result);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

// ============================================
// PARA USAR EN NODE.JS LOCAL (alternativa)
// ============================================
/*

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // Lee variables de .env

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Tu frontend
  credentials: true
}));

app.post('/api/tutor', async (req, res) => {
  const { userText, level } = req.body;

  if (!userText || !level) {
    return res.status(400).json({ error: 'Missing userText or level' });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const systemPrompt = `You are a highly educated, cultured English tutor...
    ${// el mismo prompt de arriba
    }`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: systemPrompt }]
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message });
    }

    const data = await response.json();
    const textContent = data.content[0].text;
    const cleaned = textContent.replace(/\`\`\`json|\`\`\`/g, '').trim();
    const result = JSON.parse(cleaned);

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));

*/
