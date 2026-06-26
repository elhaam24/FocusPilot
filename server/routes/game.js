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
      profile.age,
      puzzle.title
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

// Helper to generate dynamic, context-aware offline/mock mentor responses
function generateMockMentorReply(name, message, taskTitle) {
  const msg = message.toLowerCase();
  const task = (taskTitle || '').toLowerCase();

  // 1. Greetings
  if (msg.includes('hello') || msg.includes('hi') || msg.startsWith('hey')) {
    return `Hi, explorer ${name}! 🌟 I am Nova, your focus companion. I'm so excited to help you train your attention muscles today! What can I help you with?`;
  }

  // 2. Expressions of thanks
  if (msg.includes('thank') || msg.includes('thanks')) {
    return `You're very welcome, ${name}! Remember, every challenge we attempt makes our focus power stronger. Keep up the amazing work! 🚀`;
  }

  // 3. Requests for hints or help
  if (msg.includes('hint') || msg.includes('help') || msg.includes('stuck') || msg.includes('clue') || msg.includes('how to')) {
    if (task.includes('memory')) {
      return `Here's a stellar hint for Constellation Recall: Try saying the names of the stars out loud as they light up! This verbal trick helps your brain lock the sequence in your working memory.`;
    }
    if (task.includes('pattern')) {
      return `For the Rune Weaver path: Look at the coordinates like a treasure map! Remember, the first number (X) is how many steps to the right, and the second (Y) is how many steps down. Plan your whole route before clicking!`;
    }
    if (task.includes('breath') || task.includes('patience') || task.includes('beacon')) {
      return `For the Breath Beacon: This is all about patience, ${name}. Breathe in slowly as the beacon grows, and breathe out as it shrinks. Keep your focus on the rhythm, and don't rush!`;
    }
    if (task.includes('observation') || task.includes('scan') || task.includes('anomalies')) {
      return `For the Abyss Scan: Take a deep breath and read the description twice. Pay close attention to colors, numbers, and details like what characters are holding. Slow scanning finds the treasures!`;
    }
    if (task.includes('reading') || task.includes('comprehension') || task.includes('chronicles')) {
      return `For the Chronicles of Nova: Enjoy the story like a fun book! Don't rush to get to the questions. Try to paint a picture of the adventure in your mind as you read.`;
    }
    return `To solve this focus mission, my best advice is to slow down, take a deep breath, and read the instructions carefully. Your concentration is your superpower, ${name}!`;
  }

  // 4. Confusion or "I don't know" patterns
  if (msg.includes("don't know") || msg.includes("dunno") || msg.includes('confused') || msg.includes('lost')) {
    return `No worries, ${name}! That's completely normal. 🌟 Let's break it down together step by step. What part is confusing you the most? We'll solve it with patience and focus!`;
  }

  // 5. Questions about difficulty or being too hard
  if (msg.includes('too hard') || msg.includes('difficult') || msg.includes('impossible') || msg.includes('can\'t do')) {
    return `I believe in you, ${name}! 💪 Every challenge starts hard, but your focus grows stronger with each try. Want to approach it differently? Sometimes slowing down reveals all the clues!`;
  }

  // 6. Questions about instructions
  if (msg.includes('what') && (msg.includes('do') || msg.includes('task') || msg.includes('supposed'))) {
    if (task) {
      return `Great question! For "${taskTitle}", the goal is to stay focused and complete it carefully. Read the instructions at the top slowly, and remember—there's no rush. What specific step needs clarification?`;
    }
    return `For any FocusPilot mission, the goal is always the same: slow down, concentrate, and give it your best focused effort. What would you like to know more about?`;
  }

  // 7. Praise or confidence statements
  if (msg.includes('i can') || msg.includes('i will') || msg.includes('yes') || msg.includes('ready')) {
    return `YES! That's the spirit, ${name}! 🚀 With that kind of focus and determination, you're going to crush this. Go show this puzzle your amazing concentration power!`;
  }

  // 8. Questions about focus or concentration
  if (msg.includes('focus') || msg.includes('concentrate') || msg.includes('attention')) {
    return `Focus is like a superpower, ${name}! 🧠✨ Here's the trick: breathe slowly, eliminate distractions, and tell yourself "I can do this carefully." The more you practice, the stronger your focus gets!`;
  }

  // 9. Asking for motivation or encouragement
  if (msg.includes('can you help') || msg.includes('encourage') || msg.includes('motivate') || msg.includes('push me')) {
    return `You've got this, ${name}! 💫 Every puzzle you attempt trains your brain to be more powerful. I believe in your focus. Take a deep breath and let's show this puzzle what you're made of!`;
  }

  // 10. Generic/random questions - now much smarter fallbacks
  const smartFallbacks = [
    `That's a great question, ${name}! 🤔 Let me ask you this: What do YOU think the clue is telling us? Sometimes our own focused thinking finds the answer!`,
    `Interesting! You know what? Your curiosity shows real focus, ${name}. Let's think about this step by step. What's your best guess?`,
    `I love how you're thinking, ${name}! 🌟 You're using your brain's power. Take a deep breath and look at the clues again slowly. What do you notice?`,
    `Great observation, ${name}! Remember, focus is about noticing details others miss. Look closely at what you're working on. What stands out to you?`,
    `You're asking all the right questions, ${name}! That shows real focus. Let's slow down together and examine the details. What's challenging you right now?`
  ];
  
  // Choose a fallback based on message content for consistency
  const index = Math.abs(message.length) % smartFallbacks.length;
  return smartFallbacks[index];
}

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
      mentorReply = generateMockMentorReply(profile.name, message, currentTaskTitle);
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
        // Fall back to the smart procedural mock response instead of a static error
        mentorReply = generateMockMentorReply(profile.name, message, currentTaskTitle);
      }
    }

    res.json({ reply: mentorReply });
  } catch (error) {
    console.error('Error in Nova chat:', error);
    res.status(500).json({ error: 'Failed to communicate with Nova' });
  }
});

module.exports = router;
