import React from 'react';

export default function Navbar({ activeProfile, activePage, setActivePage, handleLogout }) {
  return (
    <nav className="glass-card" style={{
      borderRadius: '0 0 16px 16px',
      margin: '0 0 20px 0',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: 'none'
    }}>
      {/* Brand logo */}
      <div 
        onClick={() => activeProfile && setActivePage('map')} 
        style={{ cursor: activeProfile ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <span style={{ fontSize: '1.8rem' }}>🚀</span>
        <span style={{ 
          fontFamily: 'Outfit', 
          fontWeight: 800, 
          fontSize: '1.4rem', 
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, var(--color-aurora) 0%, var(--color-nebula) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          FocusPilot
        </span>
      </div>

      {/* Navigation items */}
      {activeProfile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => setActivePage('map')}
            className={activePage === 'map' || activePage === 'play' ? 'btn-flat' : 'btn-flat'}
            style={{ 
              background: activePage === 'map' || activePage === 'play' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              borderColor: activePage === 'map' || activePage === 'play' ? 'var(--color-aurora)' : 'transparent',
              color: activePage === 'map' || activePage === 'play' ? 'var(--color-aurora)' : 'var(--text-muted)'
            }}
          >
            🗺️ Play Map
          </button>
          
          <button 
            onClick={() => setActivePage('parent-dashboard')}
            className="btn-flat"
            style={{ 
              background: activePage === 'parent-dashboard' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              borderColor: activePage === 'parent-dashboard' ? 'var(--color-nebula)' : 'transparent',
              color: activePage === 'parent-dashboard' ? 'var(--color-nebula)' : 'var(--text-muted)'
            }}
          >
            📊 Parent Hub
          </button>

          <button
            onClick={() => setActivePage('ai-insights')}
            className="btn-flat"
            style={{
              background: activePage === 'ai-insights' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              borderColor: activePage === 'ai-insights' ? 'var(--color-aurora)' : 'transparent',
              color: activePage === 'ai-insights' ? 'var(--color-aurora)' : 'var(--text-muted)'
            }}
          >
            🧭 AI Insights
          </button>

          {/* Profile Status */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            background: 'var(--bg-space-light)',
            padding: '6px 16px',
            borderRadius: 'var(--border-radius-full)',
            border: '1px solid var(--glass-border)'
          }}>
            <span style={{ fontSize: '1.2rem' }}>
              {activeProfile.avatar === 'rocket' && '🚀'}
              {activeProfile.avatar === 'dino' && '🦖'}
              {activeProfile.avatar === 'dragon' && '🐲'}
              {activeProfile.avatar === 'koala' && '🐨'}
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{activeProfile.name}</span>
            <div className="stars-display" title="Stars Earned">
              ⭐ {activeProfile.stars}
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="btn-flat"
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.85rem',
              color: 'var(--color-coral)',
              borderColor: 'transparent',
              background: 'transparent'
            }}
          >
            Switch Profile
          </button>
        </div>
      )}

      {!activeProfile && (
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Onboarding Mode 🌟
        </div>
      )}
    </nav>
  );
}
