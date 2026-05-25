import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Minus, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getChatResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hello! I am your Wealth Architect AI. How can I assist you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const history = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const aiResponse = await getChatResponse(userMessage, history);
    
    setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '64px' : '500px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[350px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden mb-4 flex flex-col"
          >
            {/* Header */}
            <div className="bg-wealth-navy p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-wealth-gold/20 flex items-center justify-center">
                  <Bot size={18} className="text-wealth-gold" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Wealth Architect AI</h4>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[8px] text-slate-300 uppercase tracking-widest font-black">Online</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                >
                  {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-wealth-navy text-white rounded-tr-none' 
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ask me anything..."
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-wealth-navy/10 outline-none"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-wealth-navy text-white rounded-lg hover:bg-slate-900 transition-all disabled:opacity-50"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={`w-14 h-14 rounded-full bg-wealth-navy text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group relative ${isOpen ? 'hidden' : ''}`}
      >
        <MessageSquare size={24} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-wealth-gold rounded-full border-2 border-white flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-wealth-navy rounded-full animate-ping" />
        </div>
      </button>
    </div>
  );
};

export default ChatBot;
