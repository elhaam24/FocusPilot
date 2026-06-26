import React, { useState, useEffect } from 'react';

export default function MemoryEchoes({ puzzle, onComplete, onCancel }) {
  const items = puzzle.content.items || [];
  
  const [isPlayingSequence, setIsPlayingSequence] = useState(true);
  const [activeItemIndex, setActiveItemIndex] = useState(-1);
  const [userSequence, setUserSequence] = useState([]);
  const [statusText, setStatusText] = useState('Watch the constellation light up slowly...');
  const [shuffledItems, setShuffledItems] = useState([]);

  // Shuffle items for the click grid so they aren't in the correct order,
  // forcing the player to search and focus on the labels rather than just physical positions!
  useEffect(() => {
    const arranged = [...items].map((item, idx) => ({ name: item, originalIndex: idx }));
    // Simple shuffle
    for (let i = arranged.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arranged[i], arranged[j]] = [arranged[j], arranged[i]];
    }
    setShuffledItems(arranged);
    playSequence();
  }, [puzzle]);

  // Play the sequence slowly
  const playSequence = async () => {
    setIsPlayingSequence(true);
    setUserSequence([]);
    setStatusText('🌌 Nova is drawing the constellation... Watch closely!');
    
    const delay = puzzle.content.showDelay || 1200;
    
    // Initial pause
    await new Promise(r => setTimeout(r, 1000));
    
    for (let i = 0; i < items.length; i++) {
      setActiveItemIndex(i);
      await new Promise(r => setTimeout(r, delay));
    }
    
    setActiveItemIndex(-1);
    setIsPlayingSequence(false);
    setStatusText('💫 Your turn! Recreate the constellation sequence from memory.');
  };

  const handleItemClick = (itemName) => {
    if (isPlayingSequence) return; // Prevent clicks during sequence play

    const nextSeq = [...userSequence, itemName];
    setUserSequence(nextSeq);

    // Provide visual feedback for the clicked item
    // If the sequence is completed, submit it
    if (nextSeq.length === items.length) {
      setStatusText('Analyzing your transmission...');
      setTimeout(() => {
        onComplete(nextSeq);
      }, 800);
    }
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', fontFamily: 'Outfit' }}>
        {puzzle.title || 'Constellation Recall'}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
        {puzzle.description}
      </p>

      {/* Main Game Card */}
      <div className="glass-card" style={{ padding: '30px', marginBottom: '24px' }}>
        {/* Status Message */}
        <div style={{ 
          minHeight: '40px',
          color: isPlayingSequence ? 'var(--color-nebula)' : 'var(--color-aurora)',
          fontWeight: 600,
          fontSize: '1rem',
          marginBottom: '20px'
        }}>
          {statusText}
        </div>

        {/* Constellation Display Screen (Sequence Guide) */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: 'var(--border-radius-md)',
          padding: '24px',
          minHeight: '100px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          border: '1px solid var(--glass-border)'
        }}>
          {items.map((item, index) => {
            const isLit = index === activeItemIndex;
            const isRevealed = userSequence.includes(item) || isPlayingSequence;

            return (
              <div
                key={index}
                className={isLit ? 'grid-cell active-memory' : ''}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: isLit ? '2px solid var(--color-nebula)' : '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'var(--transition-smooth)',
                  background: isLit 
                    ? 'var(--color-nebula)' 
                    : (userSequence[index] ? 'rgba(20, 184, 166, 0.2)' : 'rgba(255, 255, 255, 0.02)'),
                  color: isLit ? 'var(--text-dark)' : 'var(--text-main)',
                  boxShadow: isLit ? '0 0 15px var(--color-nebula-glow)' : 'none'
                }}
              >
                {/* Show details slowly */}
                {isLit ? '⭐' : (userSequence[index] ? '✓' : '?')}
              </div>
            );
          })}
        </div>

        {/* Click Grid (Rumbled items) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '12px',
          pointerEvents: isPlayingSequence ? 'none' : 'auto',
          opacity: isPlayingSequence ? 0.6 : 1,
          transition: 'opacity 0.3s'
        }}>
          {shuffledItems.map((item) => {
            const hasBeenClicked = userSequence.includes(item.name);
            return (
              <button
                key={item.name}
                onClick={() => handleItemClick(item.name)}
                disabled={isPlayingSequence || hasBeenClicked}
                className="btn-flat"
                style={{
                  padding: '16px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  background: hasBeenClicked ? 'rgba(20, 184, 166, 0.1)' : 'var(--bg-space-light)',
                  borderColor: hasBeenClicked ? 'var(--color-aurora)' : 'var(--glass-border)',
                  color: hasBeenClicked ? 'var(--color-aurora)' : 'var(--text-main)',
                  borderRadius: 'var(--border-radius-sm)',
                  cursor: hasBeenClicked ? 'default' : 'pointer'
                }}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Current user input tracker */}
        <div style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Selected: {userSequence.length} of {items.length} stars
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button 
          onClick={playSequence} 
          className="btn-secondary" 
          disabled={isPlayingSequence}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          🔄 Replay Pattern
        </button>
        <button 
          onClick={onCancel} 
          className="btn-flat" 
          style={{ padding: '8px 16px', fontSize: '0.9rem', color: 'var(--color-coral)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
