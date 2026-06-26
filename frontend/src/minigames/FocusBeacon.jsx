import React, { useState, useEffect } from 'react';

export default function FocusBeacon({ puzzle, onComplete, onCancel }) {
  const [focusProgress, setFocusProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [breathPhase, setBreathPhase] = useState('Inhale...');
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [feedback, setFeedback] = useState('Press and hold the Focus Anchor below to begin.');
  
  const targetDuration = 30; // 30 seconds total focus
  const [holdStart, setHoldStart] = useState(null);
  const [totalHoldMs, setTotalHoldMs] = useState(0);

  // Timer for breathing phase visual cues
  useEffect(() => {
    let interval = null;
    if (isHolding && focusProgress < 100) {
      interval = setInterval(() => {
        setFocusProgress(prev => {
          const next = prev + (100 / targetDuration);
          if (next >= 100) {
            clearInterval(interval);
            return 100;
          }
          return next;
        });

        setSecondsRemaining(prev => {
          const next = prev - 1;
          if (next <= 0) return 0;
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isHolding, focusProgress]);

  // Handle breathing phase cycle text
  useEffect(() => {
    let phaseInterval = null;
    if (isHolding) {
      phaseInterval = setInterval(() => {
        setBreathPhase(prev => prev === 'Inhale...' ? 'Exhale...' : 'Inhale...');
      }, 5000); // 5 seconds inhale, 5 seconds exhale
    } else {
      setBreathPhase('Inhale...');
    }
    return () => clearInterval(phaseInterval);
  }, [isHolding]);

  // Handle successful completion
  useEffect(() => {
    if (focusProgress >= 100) {
      setIsHolding(false);
      setFeedback('Incredible concentration! You recharged your Focus Fuel!');
      // finalize hold time if user was holding
      if (holdStart) {
        setTotalHoldMs(prev => prev + (Date.now() - holdStart));
        setHoldStart(null);
      }
      // Wait a moment before returning completion
      const timeout = setTimeout(() => {
        const holdMsNow = totalHoldMs + (holdStart ? (Date.now() - holdStart) : 0);
        const breathConsistency = Math.round((holdMsNow / (targetDuration * 1000)) * 100);
        onComplete({ success: true, metrics: { breathConsistency, totalHoldMs: holdMsNow } });
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [focusProgress, onComplete, holdStart, totalHoldMs]);

  const handleMouseDown = () => {
    if (focusProgress >= 100) return;
    setIsHolding(true);
    setFeedback('Perfect. Keep holding, breathe deeply, and sync with the expanding circle.');
    setHoldStart(Date.now());
  };

  const handleMouseUp = () => {
    if (focusProgress >= 100) return;
    setIsHolding(false);
    setFeedback('You released the anchor! Take a deep breath and press down again to continue.');
    if (holdStart) {
      setTotalHoldMs(prev => prev + (Date.now() - holdStart));
      setHoldStart(null);
    }
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', fontFamily: 'Outfit' }}>
        {puzzle.title || 'Breath Beacon'}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
        {puzzle.description}
      </p>

      {/* Breathing Beacon Container */}
      <div className="glass-card" style={{ padding: '30px', position: 'relative', marginBottom: '24px' }}>
        {/* Progress Display */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Focus Fuel: {Math.min(100, Math.round(focusProgress))}%</span>
          <span>{secondsRemaining}s remaining</span>
        </div>
        <div className="progress-bar-container" style={{ margin: '8px 0 24px 0' }}>
          <div className="progress-bar-fill" style={{ width: `${focusProgress}%` }}></div>
        </div>

        {/* Breathing Orb */}
        <div 
          className={`breathing-star ${isHolding ? 'breathing-star-active' : ''}`}
          style={{
            '--color-aurora': 'var(--color-aurora)',
            transition: 'transform 5s ease-in-out',
            width: '130px',
            height: '130px'
          }}
        >
          <div className="pulsing-ring"></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem' }}>🧘</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '4px' }}>
              {isHolding ? breathPhase : 'Ready'}
            </span>
          </div>
        </div>

        {/* Feedback text */}
        <div style={{ 
          minHeight: '48px', 
          color: isHolding ? 'var(--color-aurora)' : 'var(--color-solar)',
          fontWeight: 600,
          fontSize: '0.95rem',
          lineHeight: '1.4',
          margin: '20px 0'
        }}>
          {feedback}
        </div>

        {/* Interactive Hold Button */}
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '1.1rem',
            background: isHolding 
              ? 'linear-gradient(135deg, var(--color-aurora) 0%, hsl(172, 80%, 35%) 100%)' 
              : 'linear-gradient(135deg, var(--color-nebula) 0%, hsl(265, 80%, 55%) 100%)',
            boxShadow: isHolding ? '0 0 20px var(--color-aurora-glow)' : '0 4px 15px var(--color-nebula-glow)',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          {isHolding ? '🤝 Holding Anchor...' : '⚓ Press & Hold to Focus'}
        </button>
      </div>

      <button onClick={onCancel} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
        Abort Mission
      </button>
    </div>
  );
}
