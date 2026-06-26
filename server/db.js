const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Initialize the database file if it doesn't exist
async function initDb() {
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    try {
      await fs.access(DB_PATH);
    } catch {
      // File does not exist, create it with default structure
      const defaultDb = {
        profiles: {},
        sessions: [],
        gamelogs: []
      };
      await fs.writeFile(DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Read database contents
async function readDb() {
  await initDb();
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database, returning empty structure:', error);
    return { profiles: {}, sessions: [], gamelogs: [] };
  }
}

// Write database contents
async function writeDb(data) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

module.exports = {
  // Profiles
  async getProfiles() {
    const db = await readDb();
    return Object.values(db.profiles);
  },

  async getProfile(id) {
    const db = await readDb();
    return db.profiles[id] || null;
  },

  async saveProfile(profile) {
    const db = await readDb();
    const id = profile.id || uuidv4();
    
    // Default structure for new profiles
    if (!profile.id) {
      db.profiles[id] = {
        id,
        name: profile.name || 'Explorer',
        age: parseInt(profile.age) || 9,
        interests: profile.interests || [],
        avatar: profile.avatar || 'rocket',
        currentWorld: 'Cosmic Canopy',
        stars: 0,
        skillLevels: {
          memory: 1,
          patterns: 1,
          patience: 1,
          observation: 1,
          comprehension: 1
        },
        createdAt: new Date().toISOString()
      };
    } else {
      // Update existing profile
      db.profiles[id] = {
        ...db.profiles[id],
        ...profile,
        // Ensure sub-objects aren't accidentally wiped
        skillLevels: {
          ...db.profiles[id].skillLevels,
          ...(profile.skillLevels || {})
        }
      };
    }
    
    await writeDb(db);
    return db.profiles[id];
  },

  async deleteProfile(id) {
    const db = await readDb();
    if (db.profiles[id]) {
      delete db.profiles[id];
      // Clean up associated sessions and gamelogs
      db.sessions = db.sessions.filter(s => s.profileId !== id);
      db.gamelogs = db.gamelogs.filter(g => g.profileId !== id);
      await writeDb(db);
      return true;
    }
    return false;
  },

  // Sessions (Focus tracking)
  async startSession(profileId) {
    const db = await readDb();
    const sessionId = uuidv4();
    const newSession = {
      id: sessionId,
      profileId,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0, // in seconds
      active: true
    };
    db.sessions.push(newSession);
    await writeDb(db);
    return newSession;
  },

  async updateSession(sessionId, duration) {
    const db = await readDb();
    const sessionIndex = db.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      db.sessions[sessionIndex].duration = parseInt(duration) || 0;
      await writeDb(db);
      return db.sessions[sessionIndex];
    }
    return null;
  },

  async endSession(sessionId, finalDuration) {
    const db = await readDb();
    const sessionIndex = db.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      db.sessions[sessionIndex].endTime = new Date().toISOString();
      db.sessions[sessionIndex].duration = parseInt(finalDuration) || db.sessions[sessionIndex].duration;
      db.sessions[sessionIndex].active = false;
      await writeDb(db);
      return db.sessions[sessionIndex];
    }
    return null;
  },

  async addSessionAnalysis(sessionId, analysis) {
    const db = await readDb();
    const sessionIndex = db.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      db.sessions[sessionIndex].analysis = analysis;
      await writeDb(db);
      return db.sessions[sessionIndex];
    }
    return null;
  },

  async getSessions(profileId) {
    const db = await readDb();
    return db.sessions.filter(s => s.profileId === profileId);
  },

  // Game Logs (Challenge completions)
  async addGameLog(profileId, logData) {
    const db = await readDb();
    const log = {
      id: uuidv4(),
      profileId,
      gameType: logData.gameType, // memory, patterns, observation, comprehension, patience
      difficulty: parseInt(logData.difficulty) || 1,
      isCorrect: !!logData.isCorrect,
      duration: parseInt(logData.duration) || 0, // seconds spent on the challenge
      timestamp: new Date().toISOString(),
      starsEarned: parseInt(logData.starsEarned) || 0
    };
    db.gamelogs.push(log);
    
    // If correct, award stars and potentially update skill level
    if (db.profiles[profileId]) {
      db.profiles[profileId].stars = (db.profiles[profileId].stars || 0) + log.starsEarned;
      
      // Dynamic Difficulty: Check recent performance to adjust skill level
      const gameType = log.gameType.toLowerCase();
      const recentLogs = db.gamelogs
        .filter(g => g.profileId === profileId && g.gameType.toLowerCase() === gameType)
        .slice(-5); // Get last 5 games of this type
      
      const correctCount = recentLogs.filter(g => g.isCorrect).length;
      const currentSkill = db.profiles[profileId].skillLevels[gameType] || 1;

      if (correctCount >= 4 && recentLogs.length >= 4) {
        // Success rate >= 80%: level up! (max 5)
        if (currentSkill < 5) {
          db.profiles[profileId].skillLevels[gameType] = currentSkill + 1;
        }
      } else if (correctCount <= 1 && recentLogs.length >= 4) {
        // Success rate <= 20%: scale down to avoid frustration (min 1)
        if (currentSkill > 1) {
          db.profiles[profileId].skillLevels[gameType] = currentSkill - 1;
        }
      }
    }
    
    await writeDb(db);
    return { log, profile: db.profiles[profileId] };
  },

  async getGameLogs(profileId) {
    const db = await readDb();
    return db.gamelogs.filter(g => g.profileId === profileId);
  }

  ,
  async saveProfileMissions(profileId, missions) {
    const db = await readDb();
    if (!db.profiles[profileId]) return null;
    db.profiles[profileId].missions = db.profiles[profileId].missions || [];
    // Append new missions
    db.profiles[profileId].missions = db.profiles[profileId].missions.concat(missions);
    await writeDb(db);
    return db.profiles[profileId];
  }
};
