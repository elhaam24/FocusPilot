import React, { useState, useEffect, useRef } from 'react';

export default function NovaMentor({ activeProfile, currentTaskTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'nova', text: "Hi! I'm Nova, your focus guide! 🌟 Click on me anytime if you want a hint or just want to chat about your mission!" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll to bottom when history updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !activeProfile) return;

    const userMsg = message.trim();
    setMessage('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/games/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activeProfile.id,
          message: userMsg,
          currentTaskTitle: currentTaskTitle || 'Exploring the map'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setChatHistory(prev => [...prev, { sender: 'nova', text: data.reply }]);
      } else {
        setChatHistory(prev => [...prev, { sender: 'nova', text: "Oh, I had a little star-hiccup! Let's try again in a moment. 💫" }]);
      }
    } catch (error) {
      console.error('Error talking to Nova:', error);
      setChatHistory(prev => [...prev, { sender: 'nova', text: "My space waves are a bit weak right now, but you're doing great! Keep focusing! 🚀" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nova-widget-container">
      {/* Chat bubble */}
      <div className={`nova-chat-bubble glass-card ${isOpen ? 'visible' : ''}`} style={{
        width: '100%',
        maxWidth: '340px',
        padding: '16px',
        display: isOpen ? 'flex' : 'none',
        flexDirection: 'column',
        gap: '12px',
        border: '1.5px solid var(--color-nebula)',
        maxHeight: '380px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>⭐</span>
            <span style={{ fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-nebula)' }}>Nova the Mentor</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ✕
          </button>
        </div>

        {/* Conversation Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '4px',
          maxHeight: '220px',
          fontSize: '0.9rem',
          lineHeight: '1.4'
        }}>
          {chatHistory.map((msg, idx) => (
            <div 
              key={idx} 
              style={{
                alignSelf: msg.sender === 'nova' ? 'flex-start' : 'flex-end',
                background: msg.sender === 'nova' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(168, 85, 247, 0.15)',
                border: msg.sender === 'nova' ? '1px solid var(--glass-border)' : '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: msg.sender === 'nova' ? '0px 12px 12px 12px' : '12px 0px 12px 12px',
                padding: '8px 12px',
                maxWidth: '85%',
                color: msg.sender === 'nova' ? 'var(--text-main)' : 'var(--text-main)'
              }}
            >
              {msg.text}
            </div>
          ))}
          {isLoading && (
            <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '0 12px 12px 12px', padding: '8px 12px', color: 'var(--text-muted)' }}>
              Nova is thinking... ✨
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="nova-chat-input-wrapper">
          <input
            type="text"
            className="form-control"
            placeholder="Ask Nova a question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          />
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading || !message.trim()}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Send
          </button>
        </form>
      </div>

      {/* Robot Trigger button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="nova-trigger-btn"
        title="Talk to Nova"
      >
        ⭐
      </button>
    </div>
  );
}
