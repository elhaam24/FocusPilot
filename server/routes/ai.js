const express = require('express');
const router = express.Router();
const db = require('../db');

// GET AI insights for a profile
router.get('/insights/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await db.getProfile(profileId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const sessions = await db.getSessions(profileId);
    const recentAnalyses = sessions.slice(-5).map(s => ({ sessionId: s.id, analysis: s.analysis || null, startTime: s.startTime }));

    res.json({ profile: { id: profile.id, name: profile.name, age: profile.age, skillLevels: profile.skillLevels, missions: profile.missions || [] }, recentAnalyses });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

module.exports = router;
