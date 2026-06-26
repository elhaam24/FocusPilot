const express = require('express');
const router = express.Router();
const db = require('../db');
const gemini = require('../gemini');

// GET parent dashboard stats
router.get('/stats/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const profile = await db.getProfile(profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const sessions = await db.getSessions(profileId);
    const gamelogs = await db.getGameLogs(profileId);

    // 1. Calculate Daily Focus Time (in minutes) for the last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD
      last7Days.push({
        date: dateString,
        label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }),
        focusMinutes: 0,
        gamesPlayed: 0
      });
    }

    // Accumulate focus minutes from sessions
    sessions.forEach(session => {
      if (session.startTime) {
        const dateStr = session.startTime.split('T')[0];
        const matchingDay = last7Days.find(day => day.date === dateStr);
        if (matchingDay) {
          matchingDay.focusMinutes += (session.duration / 60); // convert seconds to minutes
        }
      }
    });

    // Accumulate focus minutes from gamelogs (assuming game durations also count towards focus)
    gamelogs.forEach(log => {
      if (log.timestamp) {
        const dateStr = log.timestamp.split('T')[0];
        const matchingDay = last7Days.find(day => day.date === dateStr);
        if (matchingDay) {
          matchingDay.gamesPlayed += 1;
          // Add game play duration to total focus time if it wasn't already covered by a session
          matchingDay.focusMinutes += (log.duration / 60);
        }
      }
    });

    // Round minutes to 1 decimal place
    last7Days.forEach(day => {
      day.focusMinutes = Math.round(day.focusMinutes * 10) / 10;
    });

    // 2. Calculate Streaks (consecutive days with activity)
    // Combine all unique activity dates (sessions or game plays)
    const activityDates = new Set();
    sessions.forEach(s => {
      if (s.startTime) activityDates.add(s.startTime.split('T')[0]);
    });
    gamelogs.forEach(g => {
      if (g.timestamp) activityDates.add(g.timestamp.split('T')[0]);
    });

    const sortedDates = Array.from(activityDates).sort();
    
    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (sortedDates.length > 0) {
      // Calculate streaks
      let prevDate = null;
      for (let i = 0; i < sortedDates.length; i++) {
        const currDate = new Date(sortedDates[i]);
        if (prevDate === null) {
          tempStreak = 1;
        } else {
          const diffTime = Math.abs(currDate - prevDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
            tempStreak = 1;
          }
        }
        prevDate = currDate;
      }
      
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      // Check if current streak is active (activity today or yesterday)
      const hasActivityToday = activityDates.has(todayStr);
      const hasActivityYesterday = activityDates.has(yesterdayStr);
      
      if (hasActivityToday || hasActivityYesterday) {
        // Find how far back the current consecutive chain goes from the end
        currentStreak = 0;
        let checkDate = hasActivityToday ? new Date() : new Date(Date.now() - 86400000);
        
        while (true) {
          const checkStr = checkDate.toISOString().split('T')[0];
          if (activityDates.has(checkStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // 3. Cognitive Skill Performance
    // Count games and success rates per category
    const skillsSummary = {
      memory: { played: 0, correct: 0 },
      patterns: { played: 0, correct: 0 },
      patience: { played: 0, correct: 0 },
      observation: { played: 0, correct: 0 },
      comprehension: { played: 0, correct: 0 }
    };

    gamelogs.forEach(log => {
      const type = log.gameType.toLowerCase();
      if (skillsSummary[type]) {
        skillsSummary[type].played += 1;
        if (log.isCorrect) {
          skillsSummary[type].correct += 1;
        }
      }
    });

    const cognitiveSkills = Object.keys(skillsSummary).map(skill => {
      const data = skillsSummary[skill];
      const accuracy = data.played > 0 ? Math.round((data.correct / data.played) * 100) : 0;
      return {
        name: skill.charAt(0).toUpperCase() + skill.slice(1),
        key: skill,
        level: profile.skillLevels[skill] || 1,
        gamesPlayed: data.played,
        accuracy
      };
    });

    // 4. Cumulative Stats
    const totalFocusSeconds = sessions.reduce((sum, s) => sum + s.duration, 0) + 
                              gamelogs.reduce((sum, g) => sum + g.duration, 0);
    const totalFocusMinutes = Math.round(totalFocusSeconds / 60);

    // 5. Get AI suggestions for the parent
    // Slice gamelogs to the last 15 items to keep payload light for Gemini analysis
    const lightHistory = gamelogs.slice(-15).map(g => ({
      gameType: g.gameType,
      difficulty: g.difficulty,
      isCorrect: g.isCorrect,
      duration: g.duration,
      timestamp: g.timestamp
    }));

    const aiReport = await gemini.getParentReport(
      {
        name: profile.name,
        age: profile.age,
        interests: profile.interests,
        skillLevels: profile.skillLevels
      },
      lightHistory
    );

    res.json({
      summary: {
        totalFocusMinutes,
        longestStreak,
        currentStreak,
        totalStars: profile.stars || 0,
        currentWorld: profile.currentWorld
      },
      dailyFocusChart: last7Days,
      cognitiveSkills,
      aiReport
    });

  } catch (error) {
    console.error('Error compiling parent stats:', error);
    res.status(500).json({ error: 'Failed to retrieve parent statistics' });
  }
});

module.exports = router;

// POST generate weekly report (explicit endpoint)
router.get('/weekly/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await db.getProfile(profileId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const gamelogs = await db.getGameLogs(profileId);
    const history = gamelogs.slice(-50).map(g => ({ gameType: g.gameType, isCorrect: g.isCorrect, duration: g.duration, timestamp: g.timestamp }));

    const report = await require('../gemini').getParentReport({ name: profile.name, age: profile.age, interests: profile.interests, skillLevels: profile.skillLevels }, history);
    res.json({ report });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});
