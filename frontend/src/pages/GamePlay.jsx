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
  const handleGameComplete = async (result) => {
    if (isEvaluating) return;
    setIsEvaluating(true);

    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

    // Normalize result -> { answers: [...], metrics: { ... } }
    let answers = null;
    let componentMetrics = {};
    if (Array.isArray(result)) answers = result;
    else if (result && typeof result === 'object') {
      answers = result.answers || null;
      componentMetrics = result.metrics || {};
    } else {
      answers = result;
    }

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
      if (!response.ok) throw new Error(data.error || 'Failed to evaluate answers');

      // Build session metrics payload
      const metricsPayload = {
        totalFocusTime: elapsedSeconds,
        sessionDuration: elapsedSeconds,
        readingCompletionRate: 0,
        readingComprehensionAccuracy: 0,
        memoryGameAccuracy: 0,
        observationAccuracy: 0,
        patienceScore: 0,
        breathExerciseConsistency: 0,
        prematureClicks: componentMetrics.prematureClicks || 0,
        skippedInstructions: componentMetrics.skippedInstructions || 0,
        focusStreaks: { current: 0, longest: 0 },
        difficultyProgression: {}
      };

      // Parse evaluationDetail for comprehension/observation accuracy
      if (data.evaluationDetail && /Answered\s+(\d+)\/(\d+)/i.test(data.evaluationDetail)) {
        const m = data.evaluationDetail.match(/Answered\s+(\d+)\/(\d+)/i);
        const correct = parseInt(m[1], 10);
        const total = parseInt(m[2], 10);
        metricsPayload.readingComprehensionAccuracy = Math.round((correct / total) * 100);
        metricsPayload.readingCompletionRate = componentMetrics.minReadingTime ? Math.min(100, Math.round((componentMetrics.readingTimeSec || 0) / componentMetrics.minReadingTime * 100)) : 100;
      }

      // Memory game accuracy
      if (gameType === 'memory') {
        metricsPayload.memoryGameAccuracy = data.isCorrect ? 100 : 0;
      }

      // Observation accuracy
      if (gameType === 'observation') {
        // Use same parsing as comprehension
        if (data.evaluationDetail && /Answered\s+(\d+)\/(\d+)/i.test(data.evaluationDetail)) {
          const m = data.evaluationDetail.match(/Answered\s+(\d+)\/(\d+)/i);
          metricsPayload.observationAccuracy = Math.round((parseInt(m[1],10)/parseInt(m[2],10))*100);
        } else {
          metricsPayload.observationAccuracy = data.isCorrect ? 100 : 0;
        }
      }

      // Patience / breathing metrics
      if (gameType === 'patience') {
        metricsPayload.patienceScore = componentMetrics.breathConsistency || 0;
        metricsPayload.breathExerciseConsistency = componentMetrics.totalHoldMs || 0;
      }

      // Fetch parent stats to get streaks
      try {
        const statResp = await fetch(`/api/parent/stats/${activeProfile.id}`);
        if (statResp.ok) {
          const statData = await statResp.json();
          metricsPayload.focusStreaks = { current: statData.summary.currentStreak || 0, longest: statData.summary.longestStreak || 0 };
        }
      } catch (e) {
        // ignore
      }

      // Difficulty progression (compare old vs updated profile levels)
      if (data.updatedProfile && activeProfile.skillLevels) {
        const diffs = {};
        Object.keys(activeProfile.skillLevels).forEach(k => {
          const before = activeProfile.skillLevels[k] || 1;
          const after = data.updatedProfile.skillLevels ? data.updatedProfile.skillLevels[k] || before : before;
          if (after !== before) diffs[k] = { before, after };
        });
        metricsPayload.difficultyProgression = diffs;
      }

      // Merge component-reported metrics
      Object.assign(metricsPayload, componentMetrics);

      // Persist session summary and trigger Gemini analysis on server
      if (sessionId) {
        await fetch('/api/sessions/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, profileId: activeProfile.id, metrics: metricsPayload })
        });
      }

      // Update UI with evaluation result
      setEvaluationResult(data);
      setIsEvaluated(true);

      // Save focus tracking duration
      await endTrackingSession(true, elapsedSeconds);

      // Trigger profile refresh in parent to update stars/levels
      if (data.updatedProfile) {
        refreshProfile(data.updatedProfile);
      }
    } catch (err) {
      console.error('Error submitting game answers:', err);
      alert(err.message || 'Network error while evaluating your answers');
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
          onComplete={(res) => handleGameComplete(res)} 
          onCancel={handleAbort} 
        />
      )}

      {gameType === 'memory' && (
        <MemoryEchoes 
          puzzle={puzzle} 
          onComplete={(res) => handleGameComplete(res)} 
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
          onComplete={(res) => handleGameComplete(res)} 
          onCancel={handleAbort} 
        />
      )}
    </div>
  );
}
