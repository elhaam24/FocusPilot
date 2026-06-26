import React, { useState, useEffect } from 'react';
import FocusBeacon from '../minigames/FocusBeacon';
import MemoryEchoes from '../minigames/MemoryEchoes';
import PatternWeaver from '../minigames/PatternWeaver';
import SpotAnomalies from '../minigames/SpotAnomalies';
import NovaChronicles from '../minigames/NovaChronicles';

export default function GamePlay({ activeProfile, gameType, worldName, onBackToMap, refreshProfile }) {
  const [isLoading, setIsLoading] = useState(true);
  const [puzzle, setPuzzle] = useState(null);
  const [skillLevel, setSkillLevel] = useState(1);
  const [sessionId, setSessionId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [error, setError] = useState(null);
  
  // Game finished overlay states
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // 1. Load the puzzle and start focus session
  useEffect(() => {
    generateMission();
    startTrackingSession();
    
    return () => {
      // Clean up/end session if component unmounts mid-game
      if (sessionId) {
        endTrackingSession(false);
      }
    };
  }, [gameType]);

  const generateMission = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/games/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activeProfile.id,
          gameType
        })
      });
      const data = await response.json();
      if (response.ok) {
        setPuzzle(data.puzzle);
        setSkillLevel(data.skillLevel);
        setStartTime(Date.now());
      } else {
        setError(data.error || 'Failed to generate challenge.');
      }
    } catch (err) {
      console.error('Error generating mission:', err);
      setError('Network error. Failed to connect to Nova.');
    } finally {
      setIsLoading(false);
    }
  };

  const startTrackingSession = async () => {
    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: activeProfile.id })
      });
      const data = await response.json();
      if (response.ok) {
        setSessionId(data.id);
      }
    } catch (err) {
      console.error('Error starting focus session:', err);
    }
  };

  const endTrackingSession = async (completed = true, finalDurationSeconds = 0) => {
    if (!sessionId) return;
    try {
      await fetch('/api/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          duration: finalDurationSeconds || Math.round((Date.now() - startTime) / 1000)
        })
      });
      setSessionId(null);
    } catch (err) {
      console.error('Error ending focus session:', err);
    }
  };

  // 2. Handle mini-game completion
  const handleGameComplete = async (answers) => {
    if (isEvaluating) return;
    setIsEvaluating(true);

    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

    try {
      // Submit answers to server for evaluation
      const response = await fetch('/api/games/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activeProfile.id,
          answers,
          duration: elapsedSeconds
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setEvaluationResult(data);
        setIsEvaluated(true);
        
        // Save focus tracking duration
        await endTrackingSession(true, elapsedSeconds);
        
        // Trigger profile refresh in parent to update stars/levels
        if (data.updatedProfile) {
          refreshProfile(data.updatedProfile);
        }
      } else {
        alert(data.error || 'Failed to evaluate answers');
      }
    } catch (err) {
      console.error('Error submitting game answers:', err);
      alert('Network error while evaluating your answers');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAbort = () => {
    endTrackingSession(false);
    onBackToMap();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '500px', margin: '40px auto' }}>
        <span style={{ fontSize: '3.5rem' }} className="floating-element">⭐</span>
        <h2 style={{ fontSize: '1.6rem', marginTop: '20px', fontFamily: 'Outfit' }} className="gradient-text-nebula">
          Nova is weaving your mission...
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
          Preparing a custom challenge for level {activeProfile.skillLevels[gameType.toLowerCase()] || 1}.
        </p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '500px', margin: '40px auto' }}>
        <span style={{ fontSize: '3rem' }}>🛰️</span>
        <h2 style={{ fontSize: '1.5rem', marginTop: '16px', color: 'var(--color-coral)', fontFamily: 'Outfit' }}>
          Mission Link Disconnected
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
          {error}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
          <button onClick={generateMission} className="btn-primary">Retry</button>
          <button onClick={onBackToMap} className="btn-secondary">Abort</button>
        </div>
      </div>
    );
  }

  // Render evaluation overlay
  if (isEvaluated && evaluationResult) {
    const { isCorrect, starsEarned, feedback } = evaluationResult;
    return (
      <div className="glass-card" style={{ 
        maxWidth: '550px', 
        margin: '40px auto', 
        padding: '36px 24px', 
        textAlign: 'center',
        border: `2px solid ${isCorrect ? 'var(--color-emerald)' : 'var(--color-solar)'}`,
        boxShadow: isCorrect ? '0 0 30px rgba(16, 185, 129, 0.2)' : '0 0 30px rgba(245, 158, 11, 0.2)'
      }}>
        <span style={{ fontSize: '4rem' }} className="floating-element">
          {isCorrect ? '🏆' : '✨'}
        </span>
        
        <h2 style={{ 
          fontSize: '2rem', 
          marginTop: '16px', 
          fontFamily: 'Outfit',
          color: isCorrect ? 'var(--color-emerald)' : 'var(--color-solar)'
        }}>
          {isCorrect ? 'Mission Accomplished!' : 'Challenge Explored!'}
        </h2>
        
        <div className="stars-display" style={{ 
          fontSize: '1.5rem', 
          justifyContent: 'center', 
          margin: '12px 0 24px 0' 
        }}>
          ⭐ +{starsEarned} Stars Earned!
        </div>

        {/* AI Mentor feedback box */}
        <div className="glass-card" style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          padding: '20px', 
          borderRadius: 'var(--border-radius-md)',
          textAlign: 'left',
          marginBottom: '32px',
          border: '1.5px solid var(--color-nebula)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>⭐</span>
            <span style={{ fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-nebula)' }}>Nova's Cosmic Guidance:</span>
          </div>
          <p style={{ 
            color: 'var(--text-main)', 
            lineHeight: '1.6', 
            fontSize: '1.05rem',
            fontStyle: 'italic'
          }}>
            "{feedback}"
          </p>
        </div>

        <button onClick={onBackToMap} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }}>
          Back to World Map 🗺️
        </button>
      </div>
    );
  }

  // 3. Render active mini-game
  return (
    <div style={{ padding: '10px 0' }}>
      {/* Small top hud */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span>World: <strong>{worldName}</strong></span>
        <span>Challenge Difficulty: <strong>Level {skillLevel}/5</strong></span>
      </div>

      {gameType === 'patience' && (
        <FocusBeacon 
          puzzle={puzzle} 
          onComplete={(success, detail) => handleGameComplete(true)} 
          onCancel={handleAbort} 
        />
      )}

      {gameType === 'memory' && (
        <MemoryEchoes 
          puzzle={puzzle} 
          onComplete={(answers) => handleGameComplete(answers)} 
          onCancel={handleAbort} 
        />
      )}

      {gameType === 'patterns' && (
        <PatternWeaver 
          puzzle={puzzle} 
          onComplete={(path) => handleGameComplete(path)} 
          onCancel={handleAbort} 
        />
      )}

      {gameType === 'observation' && (
        <SpotAnomalies 
          puzzle={puzzle} 
          onComplete={(answers) => handleGameComplete(answers)} 
          onCancel={handleAbort} 
        />
      )}

      {gameType === 'comprehension' && (
        <NovaChronicles 
          puzzle={puzzle} 
          onComplete={(answers) => handleGameComplete(answers)} 
          onCancel={handleAbort} 
        />
      )}
    </div>
  );
}
