import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Sparkles, Send, Bot, User, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import styles from './Reports.module.css';

export function AIPredictor() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your FinCore AI Business Predictor. Ask me about your business trends, like: "How much profit can I make in the next two months?"'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/ai/sync-chat?t=${Date.now()}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          console.log("Loaded history from DB:", data.length, "messages");
          if (data.length > 0) {
            setMessages(data);
          }
        } else {
          console.error("History fetch failed with status:", res.status);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };
    if (token) fetchHistory();
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: userMsg.content })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to get prediction.'}`
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Network error communicating with the AI service."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>AI Business Predictor</h1>
          <p className={styles.subtitle}>Forecast your business trends based on your real financial data.</p>
        </div>
      </div>

      <Card style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <CardHeader 
          title="FinCore AI Assistant" 
          icon={<Sparkles size={20} color="var(--color-indigo)" />} 
        />
        <CardContent style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', minHeight: 0 }}>
          
          {/* Chat Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--bg-body)', minHeight: 0 }}>
            {messages.map(msg => (
              <div 
                key={msg.id} 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'flex-start',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: msg.role === 'user' ? 'var(--color-indigo)' : 'var(--bg-element)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                  {msg.role === 'user' ? <User size={20} color="white" /> : <Bot size={20} color="var(--color-indigo)" />}
                </div>
                <div style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: msg.role === 'user' ? 'var(--color-indigo)' : 'var(--bg-element)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                  borderTopRightRadius: msg.role === 'user' ? 0 : '12px',
                  borderTopLeftRadius: msg.role === 'assistant' ? 0 : '12px',
                }}>
                  <div className="markdown-body" style={{ color: 'inherit', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: 'var(--bg-element)', border: '1px solid var(--border-color)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                  <Bot size={20} color="var(--color-indigo)" />
                </div>
                <div style={{
                  padding: '12px 16px', borderRadius: '12px', borderTopLeftRadius: 0,
                  backgroundColor: 'var(--bg-element)', border: '1px solid var(--border-color)'
                }}>
                  <Loader size={18} className="animate-spin" color="var(--text-secondary)" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-element)', borderTop: '1px solid var(--border-color)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="Ask about your future profit, revenue, or expenses..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isTyping}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: '8px',
                  border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)',
                  color: 'var(--text-primary)', fontSize: '1rem', outline: 'none'
                }}
              />
              <Button type="submit" disabled={!input.trim() || isTyping} style={{ padding: '0 24px' }}>
                <Send size={18} style={{ marginRight: '8px' }} /> Ask AI
              </Button>
            </form>
            <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              FinCore AI predicts based on your historical transaction data.
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

