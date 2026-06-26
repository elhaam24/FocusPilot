const express = require('express');
const router = express.Router();
const db = require('../db');
const gemini = require('../gemini');

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

// POST session summary: accepts detailed metrics, triggers Gemini analysis and mission generation
router.post('/summary', async (req, res) => {
  try {
    const { sessionId, profileId, metrics } = req.body;
    if (!sessionId || !profileId || !metrics) {
      return res.status(400).json({ error: 'sessionId, profileId and metrics are required' });
    }

    // Store analysis placeholder in DB
    const analysis = await gemini.analyzeSession(metrics);

    // Persist analysis on session
    const updatedSession = await db.addSessionAnalysis(sessionId, analysis);

    // Generate personalized missions
    const profile = await db.getProfile(profileId);
    const missions = await gemini.generateMissions(analysis, profile || {});

    // Save missions to profile
    await db.saveProfileMissions(profileId, missions);

    // Build Nova coach message (summary)
    const novaMessage = `Great job! Nova tailored ${missions.length} new missions based on your session. Keep going!`;

    res.json({ analysis, missions, novaMessage, updatedSession });
  } catch (error) {
    console.error('Error handling session summary:', error);
    res.status(500).json({ error: 'Failed to process session summary' });
  }
});

module.exports = router;
