import React, { useState } from 'react';

export default function PatternWeaver({ puzzle, onComplete, onCancel }) {
  const gridSize = puzzle.content.gridSize || 4;
  const gridClues = puzzle.content.gridClues || '';
  
  const [selectedPath, setSelectedPath] = useState([]);
  
  // Truncate path submission to prevent infinite loops, but let the child click
  const handleCellClick = (x, y) => {
    const coord = `${x},${y}`;
    
    // Toggle cell: if it's the last cell clicked, remove it. 
    // Otherwise, append it if it's not already in the path (or allow custom sequences).
    if (selectedPath[selectedPath.length - 1] === coord) {
      setSelectedPath(prev => prev.slice(0, -1));
    } else if (!selectedPath.includes(coord)) {
      setSelectedPath(prev => [...prev, coord]);
    }
  };

  const handleClear = () => {
    setSelectedPath([]);
  };

  const handleSubmit = () => {
    if (selectedPath.length === 0) return;
    onComplete(selectedPath);
  };

  // Generate cells for a 4x4 grid (row by row)
  const renderGrid = () => {
    const cells = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const coord = `${c},${r}`;
        const pathIndex = selectedPath.indexOf(coord);
        const isSelected = pathIndex !== -1;
        
        cells.push(
          <div
            key={coord}
            onClick={() => handleCellClick(c, r)}
            className={`grid-cell ${isSelected ? 'active-pattern' : ''}`}
            style={{
              height: '64px',
              position: 'relative',
              fontSize: '0.8rem',
              fontWeight: 600,
              userSelect: 'none',
              background: isSelected ? 'var(--color-aurora)' : 'rgba(255, 255, 255, 0.02)',
              color: isSelected ? 'var(--text-dark)' : 'var(--text-muted)',
              border: isSelected ? '2px solid var(--color-aurora)' : '1px solid var(--glass-border)',
              boxShadow: isSelected ? '0 0 10px var(--color-aurora-glow)' : 'none'
            }}
          >
            {/* Coordinate Label */}
            <span>({c},{r})</span>
            
            {/* Trace order tag */}
            {isSelected && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '6px',
                background: 'var(--bg-space-dark)',
                color: 'var(--color-solar)',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 800
              }}>
                {pathIndex + 1}
              </span>
            )}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', fontFamily: 'Outfit', textAlign: 'center' }}>
        {puzzle.title || 'Rune Pattern Weaver'}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
        {puzzle.description}
      </p>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        {/* Clues Card */}
        <div style={{
          background: 'rgba(168, 85, 247, 0.05)',
          borderLeft: '4px solid var(--color-nebula)',
          padding: '16px',
          borderRadius: '0 var(--border-radius-sm) var(--border-radius-sm) 0',
          marginBottom: '24px',
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--color-nebula)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📜 Decoded Clues:
          </div>
          <p style={{ color: 'var(--text-main)' }}>{gridClues}</p>
        </div>

        {/* 4x4 Grid Board */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          maxWidth: '280px',
          margin: '0 auto 24px auto'
        }}>
          {renderGrid()}
        </div>

        {/* Path Tracker readout */}
        <div style={{ 
          background: 'rgba(0,0,0,0.2)', 
          padding: '12px', 
          borderRadius: 'var(--border-radius-sm)', 
          textAlign: 'center',
          fontSize: '0.9rem',
          color: 'var(--text-muted)',
          minHeight: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {selectedPath.length > 0 ? (
            <div>
              <span style={{ fontWeight: 600, color: 'var(--color-aurora)' }}>Your Path:</span>{' '}
              {selectedPath.map(coord => `(${coord})`).join(' ➜ ')}
            </div>
          ) : (
            <span>Tap coordinates on the grid above to weave your path.</span>
          )}
        </div>
      </div>

      {/* Grid Controls */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button 
          onClick={handleClear} 
          className="btn-secondary" 
          disabled={selectedPath.length === 0}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          🗑️ Reset Path
        </button>
        <button 
          onClick={handleSubmit} 
          className="btn-primary" 
          disabled={selectedPath.length === 0}
          style={{ padding: '8px 24px', fontSize: '0.9rem' }}
        >
          🚀 Submit Transmission
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
