import React, { useState, useEffect } from 'react';

export default function NovaChronicles({ puzzle, onComplete, onCancel }) {
  const story = puzzle.content.story || '';
  const questions = puzzle.questions || [];
  const minReadingTime = puzzle.puzzleData.minReadingTime || 15; // default 15 seconds

  const [secondsLeft, setSecondsLeft] = useState(minReadingTime);
  const [showQuestions, setShowQuestions] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState(Array(questions.length).fill(null));

  // Countdown timer to unlock questions
  useEffect(() => {
    if (secondsLeft <= 0 || showQuestions) return;

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, showQuestions]);

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
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', fontFamily: 'Outfit', textAlign: 'center' }}>
        {puzzle.title || 'Chronicles of Nova'}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
        {puzzle.description}
      </p>

      {/* Main Story Book Interface */}
      <div className="glass-card" style={{ padding: '30px', marginBottom: '24px', position: 'relative' }}>
        {!showQuestions ? (
          /* BOOK STORY READ MODE */
          <div>
            {/* Story text */}
            <div style={{
              fontSize: '1.15rem',
              lineHeight: '1.7',
              color: 'var(--text-main)',
              textAlign: 'justify',
              padding: '10px 0',
              fontFamily: 'Georgia, serif', // Classy reading font
              borderBottom: '1px solid var(--glass-border)',
              marginBottom: '20px'
            }}>
              {story.split('\n\n').map((para, idx) => (
                <p key={idx} style={{ marginBottom: '16px' }}>{para}</p>
              ))}
            </div>

            {/* Pacing Lock / Unlock bar */}
            {secondsLeft > 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px dashed rgba(245, 158, 11, 0.25)',
                padding: '16px',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--color-solar)'
              }}>
                <span style={{ fontSize: '1.2rem' }}>⏳ Focus Pacing Active</span>
                <span style={{ fontSize: '0.9rem', textAlign: 'center' }}>
                  Slow down and enjoy the story details. Riddle questions will unlock in{' '}
                  <strong style={{ fontSize: '1.1rem' }}>{secondsLeft} seconds</strong>.
                </span>
                <div className="progress-bar-container" style={{ width: '80%', height: '6px', marginTop: '6px' }}>
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${((minReadingTime - secondsLeft) / minReadingTime) * 100}%`,
                      background: 'var(--color-solar)'
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <div style={{ 
                  color: 'var(--color-emerald)', 
                  fontWeight: 600, 
                  fontSize: '0.95rem', 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  ✅ Story fully absorbed! You are ready for the riddle.
                </div>
                <button
                  onClick={() => setShowQuestions(true)}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
                  }}
                >
                  📖 Open Riddle Scrolls
                </button>
              </div>
            )}
          </div>
        ) : (
          /* QUESTIONS ANSWER MODE */
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px', 
              borderBottom: '1px solid var(--glass-border)', 
              paddingBottom: '12px' 
            }}>
              <span style={{ fontWeight: 700, color: 'var(--color-nebula)', fontSize: '1.1rem' }}>
                Scroll Riddles
              </span>
              <button 
                onClick={() => setShowQuestions(false)} 
                className="btn-secondary" 
                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              >
                📖 Re-read Story
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {questions.map((q, qIdx) => (
                <div key={qIdx} style={{ borderBottom: qIdx < questions.length - 1 ? '1px solid var(--glass-border)' : 'none', paddingBottom: qIdx < questions.length - 1 ? '20px' : '0' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ color: 'var(--color-nebula)', fontWeight: 700 }}>Q{qIdx + 1}.</span>
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
                            background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-space-light)',
                            borderColor: isSelected ? 'var(--color-nebula)' : 'var(--glass-border)',
                            color: isSelected ? 'var(--color-nebula)' : 'var(--text-main)',
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
        )}
      </div>

      {/* Control Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        {showQuestions && (
          <button 
            onClick={handleSubmit} 
            className="btn-primary" 
            disabled={!isAllAnswered}
            style={{ padding: '10px 28px', fontSize: '0.95rem' }}
          >
            📜 Seal the Scroll
          </button>
        )}
        <button 
          onClick={onCancel} 
          className="btn-secondary" 
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          Abandon Scroll
        </button>
      </div>
    </div>
  );
}
