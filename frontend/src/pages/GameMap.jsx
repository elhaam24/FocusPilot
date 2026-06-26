import React, { useState } from 'react';

export default function GameMap({ activeProfile, onSelectGame }) {
  const [selectedWorld, setSelectedWorld] = useState(null);

  const worlds = [
    {
      id: 'cosmic',
      name: 'Cosmic Canopy',
      icon: '🪐',
      badge: 'Memory & Logic',
      description: 'Fly through glowing constellations and celestial rune networks. Train your memory and pattern tracing skills in the high stars.',
      nodeColor: 'var(--color-nebula)',
      nodeGlow: 'var(--color-nebula-glow)',
      games: [
        { type: 'memory', label: '✨ Constellation Recall', desc: 'Watch stars light up slowly, then retrace the memory path.', icon: '🌌' },
        { type: 'patterns', label: '🌀 Rune Weaver Grid', desc: 'Read pattern clues and connect the glowing cosmic runes.', icon: '🕸️' }
      ]
    },
    {
      id: 'submarine',
      name: 'Submarine Citadel',
      icon: '🐙',
      badge: 'Patience & Vision',
      description: 'Dive deep into the quiet turquoise abyss. Practice patience, slow rhythmic focus, and scan the marine depths for hidden anomalies.',
      nodeColor: 'var(--color-aurora)',
      nodeGlow: 'var(--color-aurora-glow)',
      games: [
        { type: 'patience', label: '🌟 Breath Beacon', desc: 'Sync your focus with the breathing beacon. Practice deep patience.', icon: '🧘' },
        { type: 'observation', label: '🔎 Abyss Scan', desc: 'Patiently inspect underwater scenes and identify subtle details.', icon: '🐠' }
      ]
    },
    {
      id: 'wilderness',
      name: 'Whispering Wilderness',
      icon: '🌲',
      badge: 'Sustained Reading',
      description: 'Wander into the ancient green forests. Sit down to read the magical scrolls, and solve riddles using deep reading comprehension.',
      nodeColor: 'var(--color-solar)',
      nodeGlow: 'var(--color-solar-glow)',
      games: [
        { type: 'comprehension', label: '📖 Chronicles of Nova', desc: 'Read engaging short stories at a steady pace and solve the riddles.', icon: '📜' }
      ]
    }
  ];

  const handleBackToMap = () => {
    setSelectedWorld(null);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }} className="gradient-text-nebula">
          Select Your Focus Mission
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Choose a world, focus your mind, and unlock cosmic treasures.
        </p>
      </div>

      {!selectedWorld ? (
        /* WORLD SELECTION MAP */
        <div className="world-map-container">
          {worlds.map(world => (
            <div
              key={world.id}
              onClick={() => setSelectedWorld(world)}
              className="world-node scale-hover"
              style={{
                '--node-color': world.nodeColor,
                '--node-glow': world.nodeGlow,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              <span className="world-badge" style={{ background: world.nodeColor }}>
                {world.badge}
              </span>
              <span className="world-icon">{world.icon}</span>
              <h2 style={{ fontSize: '1.4rem', fontFamily: 'Outfit', color: 'var(--text-main)' }}>
                {world.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {world.description}
              </p>
              
              <div style={{ 
                marginTop: '16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: world.nodeColor,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Explore World ➜
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* WORLD MISSION SUBMENU */
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div 
            className="glass-card" 
            style={{ 
              borderLeft: `6px solid ${selectedWorld.nodeColor}`,
              boxShadow: `0 0 20px ${selectedWorld.nodeGlow}`
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '2.5rem' }}>{selectedWorld.icon}</span>
                <div>
                  <span className="world-badge" style={{ background: selectedWorld.nodeColor, margin: 0 }}>
                    {selectedWorld.badge}
                  </span>
                  <h2 style={{ fontSize: '1.8rem', fontFamily: 'Outfit', marginTop: '4px' }}>
                    {selectedWorld.name}
                  </h2>
                </div>
              </div>
              <button onClick={handleBackToMap} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                ⬅ Map
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.5', fontSize: '0.95rem' }}>
              {selectedWorld.description}
            </p>

            {/* List of mini-games (Missions) */}
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', fontFamily: 'Outfit', color: 'var(--text-main)' }}>
              Active Missions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'col', gap: '16px' }}>
              {selectedWorld.games.map(game => (
                <div
                  key={game.type}
                  onClick={() => onSelectGame(game.type, selectedWorld.name)}
                  className="glass-card scale-hover"
                  style={{
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--glass-border)',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '2.2rem', background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '12px' }}>
                      {game.icon}
                    </span>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {game.label}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {game.desc}
                      </p>
                    </div>
                  </div>
                  <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem', flexShrink: 0 }}>
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
