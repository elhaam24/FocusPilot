import React, { useState } from 'react';

export default function SpotAnomalies({ puzzle, onComplete, onCancel }) {
  const sceneText = puzzle.content.scene || '';
  const questions = puzzle.questions || [];
  
  // Track selected answers for each question
  const [selectedAnswers, setSelectedAnswers] = useState(Array(questions.length).fill(null));

  const handleSelectOption = (qIdx, optIdx) => {
    setSelectedAnswers(prev => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  };

  const isAllAnswered = selectedAnswers.every(ans => ans !== null);

  const handleSubmit = () => {
    if (!isAllAnswered) return;
    onComplete(selectedAnswers);
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', fontFamily: 'Outfit', textAlign: 'center' }}>
        {puzzle.title || 'Abyss Scanner'}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
        {puzzle.description}
      </p>

      {/* Observation Hangar Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        
        {/* Scanned Scene Description */}
        <div style={{
          background: 'rgba(20, 184, 166, 0.03)',
          border: '1px solid rgba(20, 184, 166, 0.25)',
          padding: '20px',
          borderRadius: 'var(--border-radius-md)',
          marginBottom: '28px',
          boxShadow: '0 0 15px rgba(20, 184, 166, 0.05)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--color-aurora)', 
            fontWeight: 700, 
            fontSize: '0.95rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '10px'
          }}>
            <span>🔍 Scanner Feed: Active</span>
          </div>
          <p style={{ 
            color: 'var(--text-main)', 
            lineHeight: '1.6', 
            fontSize: '1.05rem',
            fontStyle: 'italic'
          }}>
            "{sceneText}"
          </p>
        </div>

        {/* Observation Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {questions.map((q, qIdx) => (
            <div key={qIdx} style={{ borderBottom: qIdx < questions.length - 1 ? '1px solid var(--glass-border)' : 'none', paddingBottom: qIdx < questions.length - 1 ? '20px' : '0' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: 'var(--color-aurora)', fontWeight: 700 }}>Q{qIdx + 1}.</span>
                {q.question}
              </h4>
              
              {/* Grid of MCQ options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[qIdx] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className="btn-flat"
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        background: isSelected ? 'rgba(20, 184, 166, 0.15)' : 'var(--bg-space-light)',
                        borderColor: isSelected ? 'var(--color-aurora)' : 'var(--glass-border)',
                        color: isSelected ? 'var(--color-aurora)' : 'var(--text-main)',
                        borderRadius: 'var(--border-radius-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game controls */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button 
          onClick={handleSubmit} 
          className="btn-primary" 
          disabled={!isAllAnswered}
          style={{ padding: '10px 28px', fontSize: '0.95rem' }}
        >
          🛰️ Submit Observations
        </button>
        <button 
          onClick={onCancel} 
          className="btn-secondary" 
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          Abort Scan
        </button>
      </div>
    </div>
  );
}
