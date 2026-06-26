import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import NovaMentor from './components/NovaMentor';
import ProfileSetup from './pages/ProfileSetup';
import GameMap from './pages/GameMap';
import GamePlay from './pages/GamePlay';
import ParentDashboard from './pages/ParentDashboard';
import AIInsights from './pages/AIInsights';

export default function App() {
  const [activeProfile, setActiveProfile] = useState(null);
  const [activePage, setActivePage] = useState('profile-setup');
  const [gameType, setGameType] = useState(null);
  const [worldName, setWorldName] = useState(null);

  // Check LocalStorage on startup for persisted profile
  useEffect(() => {
    const savedProfileId = localStorage.getItem('focuspilot_profile_id');
    if (savedProfileId) {
      autoLogin(savedProfileId);
    }
  }, []);

  const autoLogin = async (profileId) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}`);
      if (response.ok) {
        const profile = await response.json();
        setActiveProfile(profile);
        setActivePage('map');
      } else {
        localStorage.removeItem('focuspilot_profile_id');
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
    }
  };

  const handleSelectProfile = (profile) => {
    setActiveProfile(profile);
    localStorage.setItem('focuspilot_profile_id', profile.id);
    setActivePage('map');
  };

  const handleLogout = () => {
    setActiveProfile(null);
    localStorage.removeItem('focuspilot_profile_id');
    setActivePage('profile-setup');
  };

  const handleSelectGame = (type, world) => {
    setGameType(type);
    setWorldName(world);
    setActivePage('play');
  };

  const handleBackToMap = () => {
    setGameType(null);
    setWorldName(null);
    setActivePage('map');
  };

  const handleRefreshProfile = (updatedProfile) => {
    setActiveProfile(updatedProfile);
  };

  // Determine current task for Nova's AI mentoring context
  const getCurrentTaskTitle = () => {
    if (activePage === 'play' && gameType) {
      const titles = {
        memory: 'Constellation Recall sequence memory',
        patterns: 'Rune Weaver coordinate path tracing',
        patience: 'Breath Beacon focus holding and breathing',
        observation: 'Abyss Scan detailed visual observation',
        comprehension: 'Chronicles of Nova reading comprehension'
      };
      return titles[gameType] || 'focus challenge';
    }
    return 'exploring the map';
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar 
        activeProfile={activeProfile} 
        activePage={activePage} 
        setActivePage={setActivePage} 
        handleLogout={handleLogout}
      />

      {/* Page Arena */}
      <main className="main-content">
        {activePage === 'profile-setup' && (
          <ProfileSetup 
            setActiveProfile={handleSelectProfile} 
            setActivePage={setActivePage} 
          />
        )}

        {activePage === 'map' && activeProfile && (
          <GameMap 
            activeProfile={activeProfile} 
            onSelectGame={handleSelectGame} 
          />
        )}

        {activePage === 'play' && activeProfile && gameType && (
          <GamePlay 
            activeProfile={activeProfile} 
            gameType={gameType} 
            worldName={worldName} 
            onBackToMap={handleBackToMap}
            refreshProfile={handleRefreshProfile}
          />
        )}

        {activePage === 'parent-dashboard' && activeProfile && (
          <ParentDashboard 
            activeProfile={activeProfile} 
          />
        )}

        {activePage === 'ai-insights' && activeProfile && (
          <AIInsights activeProfile={activeProfile} />
        )}
      </main>

      {/* AI Mentor "Nova" overlay widget */}
      {activeProfile && (
        <NovaMentor 
          activeProfile={activeProfile} 
          currentTaskTitle={getCurrentTaskTitle()}
        />
      )}
    </div>
  );
}
