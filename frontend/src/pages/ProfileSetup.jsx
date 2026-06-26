import React, { useState, useEffect } from 'react';

export default function ProfileSetup({ setActiveProfile, setActivePage }) {
  const [profiles, setProfiles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState(9);
  const [avatar, setAvatar] = useState('rocket');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const interestOptions = [
    { key: 'space', label: '🚀 Space & Stars' },
    { key: 'dinosaurs', label: '🦖 Dinosaurs' },
    { key: 'dragons', label: '🐲 Dragons & Magic' },
    { key: 'ocean', label: '🐙 Deep Sea' },
    { key: 'science', label: '🔬 Science Lab' },
    { key: 'fantasy', label: '🦄 Magic Forests' }
  ];

  const avatars = [
    { key: 'rocket', icon: '🚀', label: 'Rocket' },
    { key: 'dino', icon: '🦖', label: 'Dino' },
    { key: 'dragon', icon: '🐲', label: 'Dragon' },
    { key: 'koala', icon: '🐨', label: 'Koala' }
  ];

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/profiles');
      const data = await response.json();
      if (response.ok) {
        setProfiles(data);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleSelectProfile = (profile) => {
    setActiveProfile(profile);
    setActivePage('map');
  };

  const handleToggleInterest = (interestKey) => {
    if (selectedInterests.includes(interestKey)) {
      setSelectedInterests(prev => prev.filter(i => i !== interestKey));
    } else {
      setSelectedInterests(prev => [...prev, interestKey]);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          age: parseInt(age),
          avatar,
          interests: selectedInterests
        })
      });

      const data = await response.json();
      if (response.ok) {
        setProfiles(prev => [...prev, data]);
        setActiveProfile(data);
        setActivePage('map');
      } else {
        alert(data.error || 'Failed to create profile');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Network error while creating profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 16px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span style={{ fontSize: '3rem' }}>🚀</span>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }} className="gradient-text-aurora">
          Welcome to FocusPilot
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Train your focus, conquer missions, and earn stars!
        </p>
      </div>

      {!isCreating ? (
        /* PROFILE LIST SELECTION */
        <div className="glass-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center', fontFamily: 'Outfit' }}>
            Choose Your Pilot
          </h2>
          
          {profiles.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {profiles.map(profile => (
                <div 
                  key={profile.id} 
                  onClick={() => handleSelectProfile(profile)}
                  className="glass-card scale-hover"
                  style={{
                    cursor: 'pointer',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  <span style={{ fontSize: '2.5rem' }}>
                    {profile.avatar === 'rocket' && '🚀'}
                    {profile.avatar === 'dino' && '🦖'}
                    {profile.avatar === 'dragon' && '🐲'}
                    {profile.avatar === 'koala' && '🐨'}
                  </span>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Age {profile.age} • ⭐ {profile.stars}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              No pilots found. Let's create your first pilot!
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <button onClick={() => setIsCreating(true)} className="btn-primary">
              ＋ Create New Pilot
            </button>
          </div>
        </div>
      ) : (
        /* CREATE PROFILE FORM */
        <div className="glass-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center', fontFamily: 'Outfit' }}>
            Design Your Pilot
          </h2>

          <form onSubmit={handleCreateProfile}>
            {/* Name */}
            <div className="form-group">
              <label htmlFor="name-input">Pilot Name</label>
              <input
                id="name-input"
                type="text"
                className="form-control"
                placeholder="Enter your hero name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={15}
              />
            </div>

            {/* Age slider */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label>Age</label>
                <span style={{ color: 'var(--color-aurora)', fontWeight: 700, fontSize: '1.1rem' }}>
                  {age} years old
                </span>
              </div>
              <input
                type="range"
                min="7"
                max="14"
                className="form-control"
                style={{ padding: '4px 0', height: '8px', cursor: 'pointer' }}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Age 7</span>
                <span>Age 14</span>
              </div>
            </div>

            {/* Avatar Selection */}
            <div className="form-group">
              <label>Choose Your Spacesuit</label>
              <div className="avatar-grid">
                {avatars.map(av => (
                  <div
                    key={av.key}
                    onClick={() => setAvatar(av.key)}
                    className={`avatar-option ${avatar === av.key ? 'selected' : ''}`}
                  >
                    {av.icon}
                  </div>
                ))}
              </div>
            </div>

            {/* Interests Tag Selector */}
            <div className="form-group">
              <label>Select Your Favorite Missions (Optional)</label>
              <div className="interest-tags">
                {interestOptions.map(option => {
                  const isSelected = selectedInterests.includes(option.key);
                  return (
                    <div
                      key={option.key}
                      onClick={() => handleToggleInterest(option.key)}
                      className={`interest-tag ${isSelected ? 'selected' : ''}`}
                    >
                      {option.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setName('');
                  setSelectedInterests([]);
                }}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading || !name.trim()}
                style={{ flex: 2, justifyContent: 'center' }}
              >
                {isLoading ? 'Launching...' : 'Launch Adventure 🚀'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
