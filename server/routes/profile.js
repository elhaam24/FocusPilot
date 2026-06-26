const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all profiles
router.get('/', async (req, res) => {
  try {
    const profiles = await db.getProfiles();
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// GET profile by ID
router.get('/:id', async (req, res) => {
  try {
    const profile = await db.getProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST create/update profile
router.post('/', async (req, res) => {
  try {
    const { id, name, age, interests, avatar, currentWorld, stars, skillLevels } = req.body;
    
    if (!id && !name) {
      return res.status(400).json({ error: 'Name is required for new profiles' });
    }
    
    const profileData = { id, name, age, interests, avatar, currentWorld, stars, skillLevels };
    const savedProfile = await db.saveProfile(profileData);
    res.json(savedProfile);
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// DELETE profile
router.delete('/:id', async (req, res) => {
  try {
    const success = await db.deleteProfile(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

module.exports = router;
