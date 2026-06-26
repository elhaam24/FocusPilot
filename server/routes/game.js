const express = require('express');
const router = express.Router();
const db = require('../db');
const gemini = require('../gemini');

// In-memory cache for active puzzles (keyed by profileId)
const activePuzzles = {};

// POST generate a new puzzle
router.post('/generate', async (req, res) => {
  try {
    const { profileId, gameType } = req.body;
    
    if (!profileId || !gameType) {
      return res.status(400).json({ error: 'Profile ID and Game Type are required' });
    }

    const profile = await db.getProfile(profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Determine difficulty level from profile skillLevels
    const gameTypeKey = gameType.toLowerCase();
    const skillLevel = profile.skillLevels[gameTypeKey] || 1;
    
    // Generate the puzzle
    const puzzle = await gemini.generatePuzzle(
      gameTypeKey,
      profile.age,
      skillLevel,
      profile.interests
    );

    // Cache the full puzzle on the server for secure evaluation
    activePuzzles[profileId] = {
      puzzle,
      gameType: gameTypeKey,
      skillLevel,
      generatedAt: Date.now()
    };

    // Create a sanitized version of the puzzle for the client (hide correct answers)
    const sanitizedPuzzle = JSON.parse(JSON.stringify(puzzle));
    
    if (sanitizedPuzzle.questions && sanitizedPuzzle.questions.length > 0) {
      sanitizedPuzzle.questions.forEach(q => {
        delete q.correctAnswerIndex;
        delete q.explanation;
      });
    }
    
    if (sanitizedPuzzle.puzzleData && sanitizedPuzzle.puzzleData.correctPath) {
      // Hide correct path for pattern games
      delete sanitizedPuzzle.puzzleData.correctPath;
    }
    
    if (sanitizedPuzzle.puzzleData && sanitizedPuzzle.puzzleData.sequence) {
      // Hide correct sequence for memory games
      delete sanitizedPuzzle.puzzleData.sequence;
    }

    res.json({
      puzzle: sanitizedPuzzle,
      skillLevel
    });
  } catch (error) {
    console.error('Error generating game:', error);
    res.status(500).json({ error: 'Failed to generate game' });
  }
});

// POST submit game answers for evaluation
router.post('/submit', async (req, res) => {
  try {
    const { profileId, answers, duration } = req.body;
    
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }

    const cached = activePuzzles[profileId];
    if (!cached) {
      return res.status(400).json({ error: 'No active puzzle session found. Please start a new puzzle.' });
    }

    const { puzzle, gameType, skillLevel } = cached;
    const profile = await db.getProfile(profileId);
    
    let isCorrect = false;
    let starsEarned = 0;
    let evaluationDetail = '';

    // Evaluate answers based on game type
    if (gameType === 'comprehension' || gameType === 'observation') {
      // Expects answers to be an array of chosen option indices: [1, 0, 3]
      const correctIndices = puzzle.questions.map(q => q.correctAnswerIndex);
      const userAnswers = Array.isArray(answers) ? answers : [];
      
      let correctCount = 0;
      userAnswers.forEach((ans, idx) => {
        if (ans === correctIndices[idx]) {
          correctCount++;
        }
      });

      isCorrect = correctCount === puzzle.questions.length;
      starsEarned = correctCount * 5; // 5 stars per correct answer
      evaluationDetail = `Answered ${correctCount}/${puzzle.questions.length} questions correctly.`;
    } 
    else if (gameType === 'patterns') {
      // Expects answers to be an array of coordinates matching correct path: ['0,0', '1,0', '1,1']
      const correctPath = puzzle.puzzleData.correctPath || [];
      const userPath = Array.isArray(answers) ? answers : [];
      
      isCorrect = userPath.length === correctPath.length && 
                  userPath.every((coord, idx) => coord === correctPath[idx]);
      
      starsEarned = isCorrect ? 15 : 2; // Reward patience even for mistakes
      evaluationDetail = isCorrect ? 'Pattern traced correctly!' : 'Pattern path mismatch.';
    } 
    else if (gameType === 'memory') {
      // Expects answers to be an array of recalled items in order
      const correctSeq = puzzle.puzzleData.sequence || [];
      const userSeq = Array.isArray(answers) ? answers : [];
      
      isCorrect = userSeq.length === correctSeq.length &&
                  userSeq.every((item, idx) => item.toLowerCase() === correctSeq[idx].toLowerCase());
      
      starsEarned = isCorrect ? 15 : 2;
      evaluationDetail = isCorrect ? 'Sequence recalled perfectly!' : 'Sequence recall error.';
    } 
    else if (gameType === 'patience') {
      // Patience/Mindfulness tasks are completed by finishing the breathing time
      isCorrect = true; 
      starsEarned = 20; // High stars for focusing for the whole duration
      evaluationDetail = 'Focus breathing session completed!';
    }

    // Call Gemini to get Nova's supportive feedback
    const feedback = await gemini.getNovaFeedback(
      gameType,
      { title: puzzle.title, questions: puzzle.questions, detail: evaluationDetail },
      answers,
      isCorrect,
      profile.age
    );

    // Save game log to DB (which handles Dynamic Difficulty adjustment automatically!)
    const result = await db.addGameLog(profileId, {
      gameType,
      difficulty: skillLevel,
      isCorrect,
      duration,
      starsEarned
    });

    // Clear the active puzzle cache
    delete activePuzzles[profileId];

    res.json({
      isCorrect,
      starsEarned,
      feedback,
      evaluationDetail,
      updatedProfile: result.profile
    });

  } catch (error) {
    console.error('Error submitting game answers:', error);
    res.status(500).json({ error: 'Failed to evaluate answers' });
  }
});

// POST chat with Nova (AI Mentor interactive guidance)
router.post('/mentor/chat', async (req, res) => {
  try {
    const { profileId, message, currentTaskTitle } = req.body;
    
    if (!profileId || !message) {
      return res.status(400).json({ error: 'Profile ID and Message are required' });
    }

    const profile = await db.getProfile(profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const cached = activePuzzles[profileId];
    const puzzleContext = cached ? cached.puzzle : null;

    // Call Gemini in mentor mode
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    let mentorReply = '';

    if (gemini.isMockMode()) {
      mentorReply = `Hello, explorer ${profile.name}! I am Nova. For the task "${currentTaskTitle || 'your adventure'}", my best advice is to take a deep breath, read the instructions carefully, and look for patterns. What specific part can I help you think through?`;
    } else {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
          You are "Nova", a magical, glowing star-like AI mentor who helps children learn to focus and concentrate.
          The child's name is ${profile.name}, and they are ${profile.age} years old.
          They are currently playing FocusPilot.
          Active puzzle details: ${puzzleContext ? JSON.stringify(puzzleContext) : 'Generic exploration map'}.
          
          The child says: "${message}".
          
          Provide a encouraging reply.
          Rules:
          1. Never give away the direct answer to the active puzzle.
          2. Give clues, ask guiding questions, or explain concepts simply.
          3. Teach focus, patience, and a growth-mindset.
          4. Keep your response under 3 sentences, using child-friendly language.
        `;
        const result = await model.generateContent(prompt);
        mentorReply = result.response.text().trim();
      } catch (apiError) {
        console.error('Error calling live Gemini in mentor chat, falling back to mock:', apiError);
        mentorReply = `Hello, explorer ${profile.name}! I am Nova. For the task "${currentTaskTitle || 'your adventure'}", my best advice is to take a deep breath, read the instructions carefully, and look for patterns. What specific part can I help you think through?`;
      }
    }

    res.json({ reply: mentorReply });
  } catch (error) {
    console.error('Error in Nova chat:', error);
    res.status(500).json({ error: 'Failed to communicate with Nova' });
  }
});

module.exports = router;
