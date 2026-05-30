import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MessageSquare, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';

export default function EnglishTutor() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hello! I\'m your English tutor with a passion for knowledge across all subjects—literature, science, history, philosophy, art, technology, you name it! I\'m here to help you master English while we discuss anything that fascinates you. Whether you want to debate ideas, explore fascinating topics, or simply chat, I\'ll gently correct your English and make our conversation intellectually stimulating. What\'s on your mind today?',
      corrections: null,
      feedback: null,
      topic: 'Introduction'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [level, setLevel] = useState('intermediate');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInput(prev => prev + transcript);
          } else {
            interimTranscript += transcript;
          }
        }
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  // ✅ SEGURO: Llamar al backend en lugar de la API directamente
  const analyzeEnglish = async (userText) => {
    setIsLoading(true);
    setError(null);
    try {
      // Llamamos a tu backend en lugar de la API de Anthropic directamente
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userText,
          level,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.text
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      return {
        corrections: { explanation: 'Error processing your text' },
        feedback: 'Let\'s try again!',
        response: 'I had trouble analyzing that. Can you try again?',
        topic: 'Error'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      text: input,
      corrections: null,
      feedback: null
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const analysis = await analyzeEnglish(input);

    const assistantMessage = {
      id: messages.length + 2,
      role: 'assistant',
      text: analysis.response,
      corrections: analysis.corrections,
      feedback: analysis.feedback,
      topic: analysis.topic
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-teal-900 p-4 font-sans">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur">
            <BookOpen className="text-amber-300" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">English Tutor</h1>
            <p className="text-blue-200 text-sm">Master English while exploring fascinating ideas</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 mb-4 text-red-200 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Topics discussed */}
        {messages.filter(m => m.topic && m.role === 'assistant').length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 mb-4">
            <p className="text-white text-xs font-semibold uppercase tracking-widest mb-2">Topics discussed:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(messages
                .filter(m => m.topic && m.role === 'assistant')
                .map(m => m.topic)
              )).map((topic, idx) => (
                <span key={idx} className="bg-amber-500/30 text-amber-200 text-xs px-3 py-1 rounded-full border border-amber-400/30">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Level Selector */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <p className="text-white text-xs font-semibold uppercase tracking-widest mb-3">
            Your Level
          </p>
          <div className="flex gap-2">
            {['beginner', 'intermediate', 'advanced'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  level === lvl
                    ? 'bg-amber-400 text-blue-950 shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-2xl mx-auto h-[600px] bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col shadow-2xl">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                {/* Main Message */}
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-blue-950 font-semibold'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Corrections - Solo para mensajes del usuario */}
                {msg.role === 'user' && msg.corrections && (
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 text-white text-sm space-y-2 w-full">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-blue-300" />
                      <div>
                        <p className="font-semibold text-blue-200 mb-1">Correction:</p>
                        {msg.corrections.corrected && msg.corrections.corrected !== msg.text && (
                          <>
                            <p className="text-blue-100">{msg.corrections.corrected}</p>
                            <p className="text-blue-300 text-xs mt-1 italic">{msg.corrections.explanation}</p>
                          </>
                        )}
                        {(!msg.corrections.corrected || msg.corrections.corrected === msg.text) && (
                          <p className="text-green-300 font-semibold flex items-center gap-1">
                            <CheckCircle size={14} /> Perfect!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback - Solo para respuestas del tutor */}
                {msg.role === 'assistant' && msg.feedback && (
                  <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg p-3 text-white text-sm space-y-2">
                    {msg.topic && (
                      <p className="text-amber-300 font-bold text-xs uppercase tracking-wide">📚 Topic: {msg.topic}</p>
                    )}
                    <div>
                      <p className="font-semibold text-amber-200 mb-1">💡 Language tips:</p>
                      <p className="text-amber-100">{msg.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 px-4 py-3 rounded-2xl text-white">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Write something in English..."
              className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-2 border border-white/20 focus:border-amber-400 focus:outline-none transition"
            />
            <button
              onClick={startListening}
              disabled={isListening}
              className={`p-2 rounded-lg transition-all ${
                isListening
                  ? 'bg-red-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title="Speak (English)"
            >
              <Mic size={20} />
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-blue-950 font-bold px-6 py-2 rounded-lg hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-white/50 text-xs text-center">
            {isListening ? '🎤 Listening...' : 'Write or speak in English'}
          </p>
        </div>
      </div>

      {/* Footer Tips */}
      <div className="max-w-2xl mx-auto mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="bg-white/5 backdrop-blur rounded-lg p-3 border border-white/10">
          <p className="text-white text-xs font-bold uppercase tracking-wide">🌍 Any Topic</p>
          <p className="text-white/60 text-xs mt-1">From science to art</p>
        </div>
        <div className="bg-white/5 backdrop-blur rounded-lg p-3 border border-white/10">
          <p className="text-white text-xs font-bold uppercase tracking-wide">✍️ Corrections</p>
          <p className="text-white/60 text-xs mt-1">Real-time feedback</p>
        </div>
        <div className="bg-white/5 backdrop-blur rounded-lg p-3 border border-white/10">
          <p className="text-white text-xs font-bold uppercase tracking-wide">🧠 Learn</p>
          <p className="text-white/60 text-xs mt-1">While you chat</p>
        </div>
      </div>
    </div>
  );
}
