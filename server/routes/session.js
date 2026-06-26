const express = require('express');
const router = express.Router();
const db = require('../db');

// POST start session
router.post('/start', async (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }
    const session = await db.startSession(profileId);
    res.json(session);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start focus session' });
  }
});

// POST update session duration
router.post('/update', async (req, res) => {
  try {
    const { sessionId, duration } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    const session = await db.updateSession(sessionId, duration);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// POST end session
router.post('/end', async (req, res) => {
  try {
    const { sessionId, duration } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    const session = await db.endSession(sessionId, duration);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

module.exports = router;
