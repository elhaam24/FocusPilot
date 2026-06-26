const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API if key is available
let genAI = null;
let isMockMode = true;

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    isMockMode = false;
    console.log('Gemini API successfully initialized.');
  } catch (error) {
    console.error('Failed to initialize Gemini API. Falling back to Mock Mode.', error);
  }
} else {
  console.log('No GEMINI_API_KEY found in environment. Running in Mock Mode.');
}

/**
 * Generate a personalized puzzle using Gemini (or Mock Generator).
 */
async function generatePuzzle(gameType, age, skillLevel, interests = []) {
  const theme = interests.length > 0 ? interests[Math.floor(Math.random() * interests.length)] : 'adventure';
  
  if (isMockMode) {
    return getMockPuzzle(gameType, age, skillLevel, theme);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      You are Nova, an educational game designer and AI mentor for children.
      Generate a fun, educational game puzzle of type "${gameType}" for a child who is ${age} years old, at skill level ${skillLevel} out of 5 (where 1 is beginner and 5 is advanced/challenging).
      The puzzle theme should be related to: "${theme}".
      
      Requirements based on gameType:
      1. "comprehension": Create a short, engaging story (150-250 words) suitable for a ${age}-year-old. Follow with 3 multiple-choice questions testing reading comprehension, detail retention, and patient reading. Each question must have 4 options and 1 correct answer (0-indexed).
      2. "patterns": Create a visual or logical grid pattern game. Provide a description, a set of clues, and a sequence of coordinates (e.g. ["0,1", "1,1", "2,1"]) on a 4x4 grid (columns 0-3, rows 0-3) that represents the correct path.
      3. "memory": Create a themed memory recall challenge. Provide a sequence of 4 to 8 items (words/symbols) with descriptions, and a question asking the child to identify or re-order them.
      4. "observation": Create a detailed description of a scene containing specific characters or items. List 5 items they must find in the text, or describe an anomaly they must spot, with a set of multiple-choice questions.
      5. "patience": Create a meditative/focus endurance challenge where they must focus on a theme and complete a breathing exercise or a steady-state visual focus task.
      
      You must respond ONLY with a JSON object matching this schema:
      {
        "title": "A catchy child-friendly title",
        "description": "Short instructions for the child on what to do, encouraging and clear.",
        "content": {
          // For comprehension: "story": "..."
          // For patterns: "gridSize": 4, "gridClues": "..."
          // For memory: "items": ["item1", "item2"], "delay": 2000
          // For observation: "scene": "..."
          // For patience: "guide": "..."
        },
        "puzzleData": {
          // Specific data structured for the mini-game component
        },
        "questions": [ // Array of questions if MCQ
          {
            "question": "The question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswerIndex": 0,
            "explanation": "Why this is correct."
          }
        ]
      }
      Do not include markdown wrappers around the JSON. Return raw JSON.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error generating puzzle with Gemini, falling back to mock:', error);
    return getMockPuzzle(gameType, age, skillLevel, theme);
  }
}

/**
 * Get Nova the AI Mentor's supportive feedback.
 */
async function getNovaFeedback(gameType, questionContext, answer, isCorrect, age, puzzleTitle) {
  if (isMockMode) {
    return getMockNovaFeedback(gameType, isCorrect, age);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are "Nova", a glowing star-like AI mentor guiding children through focus-training missions.
      Your tone is extremely warm, encouraging, positive, and educational.
      The child is ${age} years old.
      They just played a "${gameType}" game.
      The puzzle context was: "${JSON.stringify(questionContext)}".
      The child answered: "${answer}".
      Was their answer correct? ${isCorrect ? 'YES' : 'NO'}.
      
      Write a short feedback message (2-3 sentences max) to the child.
      Rules:
      - If correct: Celebrate their focus, explain why their thinking was correct, and award them verbal praise.
      - If incorrect: Do NOT use negative words like "wrong" or "failed". Instead, say things like "That was a super close try!", explain the mistake gently in a simple way, and remind them that mistakes are how our brains grow stronger!
      - Keep it short and suitable for a ${age}-year-old.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error getting Nova feedback, using mock:', error);
    return getMockNovaFeedback(gameType, isCorrect, age);
  }
}

/**
 * Generate parent suggestions and analysis.
 */
async function getParentReport(profile, history) {
  if (isMockMode) {
    return getMockParentReport(profile, history);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      You are an expert child psychologist and cognitive development educator.
      Analyze the following gameplay and focus history for a child:
      Profile: ${JSON.stringify(profile)}
      History logs: ${JSON.stringify(history)}
      
      Generate a personalized progress report and actionable advice for their parents.
      You must respond ONLY with a JSON object matching this schema:
      {
        "executiveSummary": "A warm, professional summary of the child's focus progress, highlighting strengths and improvements (2-3 sentences).",
        "cognitiveStrengths": ["Strength 1 (e.g. High patience during reading)", "Strength 2"],
        "areasForImprovement": ["Area 1 (e.g. Tends to rush through pattern sequences)", "Area 2"],
        "suggestedActivities": [
          {
            "title": "Activity name",
            "description": "A screen-free or educational activity for the parent to do with the child.",
            "targetSkill": "e.g. Working Memory"
          }
        ],
        "focusScore": 78 // A calculated score out of 100 representing overall engagement
      }
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Error generating parent report, using mock:', error);
    return getMockParentReport(profile, history);
  }
}

// ==========================================
// MOCK GENERATION FALLBACKS
// ==========================================

function getMockPuzzle(gameType, age, skillLevel, theme) {
  const titles = {
    comprehension: {
      space: 'The Wandering Space Rover',
      dinosaurs: 'The Sleepy Triceratops',
      dragons: 'The Dragon Who Lost His Spark',
      default: 'The Mystery of the Whispering Woods'
    },
    patterns: {
      space: 'Star Map Navigation',
      dinosaurs: 'Fossil Path Finder',
      dragons: 'Fire Rune Grid',
      default: 'Labyrinth Path'
    },
    memory: {
      space: 'Constellation Recall',
      dinosaurs: 'Dino Herd Sequence',
      dragons: 'Gemstone Stash',
      default: 'Magic Forest Sequence'
    },
    observation: {
      space: 'Galaxy Scan',
      dinosaurs: 'Jungle Canopy Scan',
      dragons: 'Treasure Cave Anomalies',
      default: 'Spot the Difference'
    },
    patience: {
      space: 'Cosmic Breathing Beacon',
      dinosaurs: 'Preshistoric Deep Breathing',
      dragons: 'Calming the Dragon Fire',
      default: 'Mindful Breathing Star'
    }
  };

  const selectedTitle = titles[gameType][theme] || titles[gameType]['default'];

  if (gameType === 'comprehension') {
    let story = '';
    let questions = [];

    if (theme === 'space') {
      story = `Zippy was a small, three-wheeled rover exploring the red sands of Mars. Unlike the big science rovers, Zippy's job was to look for shiny crystals hidden inside Martian caves. One sunny morning, Zippy received a message from the space station: "Zippy, a dust storm is coming in two hours. Please head back to your cozy dome." Zippy wanted to find one last crystal. Moving slowly to save battery, Zippy rolled into a deep cave. There, glowing under his headlights, was a beautiful blue crystal! Zippy carefully picked it up with his robotic arm. He looked at his clock—only 30 minutes left. Instead of speeding back, which could make him slip on the loose rocks, Zippy carefully navigated the bumpy path and rolled into his dome just as the first dust storm winds began to blow. He was safe, and he had the rarest crystal of all.`;
      questions = [
        {
          question: 'What was Zippy\'s main job on Mars?',
          options: [
            'To search for water',
            'To look for shiny crystals inside caves',
            'To build houses for astronauts',
            'To take photos of the sun'
          ],
          correctAnswerIndex: 1,
          explanation: 'The story mentions Zippy\'s job was to look for shiny crystals hidden inside Martian caves.'
        },
        {
          question: 'Why did Zippy decide NOT to speed back to the dome?',
          options: [
            'He wanted to take a nap',
            'Speeding could make him slip on loose rocks',
            'His wheels were broken',
            'He lost his way'
          ],
          correctAnswerIndex: 1,
          explanation: 'Zippy knew that speeding on the bumpy path could make him slip on loose rocks, so he chose patience and care.'
        },
        {
          question: 'How much time did Zippy have left when he found the crystal?',
          options: [
            'Two hours',
            'Ten minutes',
            'Thirty minutes',
            'Five minutes'
          ],
          correctAnswerIndex: 2,
          explanation: 'The story states Zippy looked at his clock and saw he had only 30 minutes left.'
        }
      ];
    } else {
      story = `Deep in the Whispering Woods lived Barnaby, a tiny green dragon who could only blow bubbles instead of fire. The older dragons laughed, but Barnaby practiced blowing bubbles every single afternoon by the calm river. He learned to blow bubbles of all sizes: tiny ones that floated like sparkles, and massive ones that could hold a whole apple. One day, a baby squirrel fell from a high oak branch. Barnaby didn't panic. He took a deep breath, concentrated with all his focus, and blew the biggest, strongest bubble he had ever made. The bubble floated slowly under the falling squirrel. *Pop!* The squirrel landed softly on the soapy cushion, completely safe. The other dragons cheered and realized that Barnaby's patient bubble practice was a wonderful gift.`;
      questions = [
        {
          question: 'What made Barnaby different from other dragons?',
          options: [
            'He was blue and huge',
            'He could only blow bubbles instead of fire',
            'He could swim under water',
            'He could speak to birds'
          ],
          correctAnswerIndex: 1,
          explanation: 'The story says Barnaby was a tiny green dragon who could only blow bubbles instead of fire.'
        },
        {
          question: 'Where did Barnaby practice bubble-making every afternoon?',
          options: [
            'On top of a mountain',
            'In a dark cave',
            'By the calm river',
            'In the village square'
          ],
          correctAnswerIndex: 2,
          explanation: 'Barnaby practiced blowing bubbles every afternoon by the calm river.'
        },
        {
          question: 'How did Barnaby save the baby squirrel?',
          options: [
            'He caught it in his mouth',
            'He blew a massive, strong bubble to cushion its fall',
            'He caught it with a net',
            'He flew up and grabbed it'
          ],
          correctAnswerIndex: 1,
          explanation: 'Barnaby concentrated and blew a massive bubble that floated under the falling squirrel, cushioning its land.'
        }
      ];
    }

    return {
      title: selectedTitle,
      description: 'Read the story carefully at a relaxed pace. Take your time to enjoy the details—Nova will ask you questions when you are finished!',
      content: { story },
      puzzleData: { minReadingTime: 15 }, // seconds
      questions
    };
  }

  if (gameType === 'patterns') {
    // A coordinates path puzzle
    // Create grid and path
    const gridClues = theme === 'space' 
      ? 'Connect the stars from lowest brightness to highest brightness: Alpha (0,0) is dim, Beta (1,1) is medium, Gamma (2,2) is bright, and Delta (3,3) is blazing!'
      : 'Connect the path from the cave entrance (0,0) through the forest path (1,0) -> (1,1) -> (2,1) and finally to the magic gate (3,2). Avoid the lava traps!';
    
    const path = theme === 'space' 
      ? ['0,0', '1,1', '2,2', '3,3']
      : ['0,0', '1,0', '1,1', '2,1', '3,2'];

    return {
      title: selectedTitle,
      description: 'Trace the path on the grid by clicking the runes in the exact order described in the clues. Take your time to plan the route before clicking.',
      content: {
        gridSize: 4,
        gridClues
      },
      puzzleData: {
        correctPath: path,
        gridTheme: theme
      },
      questions: []
    };
  }

  if (gameType === 'memory') {
    const items = theme === 'space'
      ? ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn']
      : ['T-Rex', 'Triceratops', 'Stegosaurus', 'Raptor', 'Brachiosaurus'];
    
    return {
      title: selectedTitle,
      description: 'Watch the sequence light up slowly. Memorize the order carefully without rushing, then recreate the sequence once it is finished.',
      content: {
        items,
        showDelay: 1200 // ms per item
      },
      puzzleData: {
        sequence: items
      },
      questions: []
    };
  }

  if (gameType === 'observation') {
    const scene = theme === 'space'
      ? 'A busy spaceship hangar. A green alien is painting a rocket blue. A robot is holding 3 metal bolts. Near the window, there is a tiny sleeping cat wearing a space helmet. On the shelf, there are 5 glowing space jars, but only the middle one is pulsing green.'
      : 'A peaceful prehistoric valley. A large yellow dinosaur is drinking from a blue lake. Three flying pterodactyls are gliding in circles. Hidden in a bush, a red egg with white polka dots is shaking gently. A little orange lizard is sunbathing on a flat black rock.';

    const questions = [
      {
        question: theme === 'space' ? 'What color is the green alien painting the rocket?' : 'What color is the lake where the dinosaur is drinking?',
        options: theme === 'space' ? ['Red', 'Blue', 'Yellow', 'Green'] : ['Green', 'Blue', 'Purple', 'Grey'],
        correctAnswerIndex: 1,
        explanation: theme === 'space' ? 'The text says: "A green alien is painting a rocket blue."' : 'The text says: "A large yellow dinosaur is drinking from a blue lake."'
      },
      {
        question: theme === 'space' ? 'Which jar on the shelf is pulsing green?' : 'What is shaking gently in the bush?',
        options: theme === 'space' ? ['The first one', 'The middle one', 'The last one', 'None of them'] : ['A small bird', 'A green leaf', 'A red egg with white polka dots', 'A lizard'],
        correctAnswerIndex: 1,
        explanation: theme === 'space' ? 'The text says: "On the shelf, there are 5 glowing space jars, but only the middle one is pulsing green."' : 'The text says: "Hidden in a bush, a red egg with white polka dots is shaking gently."'
      }
    ];

    return {
      title: selectedTitle,
      description: 'Scan the scene description patiently. Pay attention to small details, colors, and numbers. Nova will ask you about what you saw!',
      content: { scene },
      puzzleData: {},
      questions
    };
  }

  // default to patience (FocusBeacon)
  return {
    title: selectedTitle,
    description: 'Let\'s take a moment to recharge our Focus Fuel. Watch the breathing star, breathe in as it expands, and breathe out as it shrinks. Stay focused on your breathing.',
    content: {
      guide: 'Inhale peace, exhale distractions. Follow the expanding beacon.'
    },
    puzzleData: {
      duration: 30, // seconds for breathing task
      breathPace: 5000 // 5 seconds inhale/exhale cycles
    },
    questions: []
  };
}

function getMockNovaFeedback(gameType, isCorrect, age, questionContext) {
  const gameTypeNormalized = (gameType || '').toLowerCase();
  
  if (isCorrect) {
    // Smart context-aware success feedback based on game type
    const successResponses = {
      comprehension: [
        `Amazing! You read so carefully and caught every detail. That's the power of patient, focused reading! 📖✨`,
        `Brilliant! Your attention to the story was incredible. You showed true focus power!`,
        `Perfect score! You paid such close attention to the whole story. Your brain is getting stronger!`
      ],
      patterns: [
        `Wow! You traced the path flawlessly! That required real focus and planning. You're a puzzle master! 🎯`,
        `Incredible! You solved the pattern with laser-sharp focus. That was strategic thinking at its best!`,
        `Fantastic! You navigated every coordinate perfectly. Your concentration is unstoppable!`
      ],
      memory: [
        `Outstanding! You remembered the entire sequence perfectly! Your memory is like a fortress! 🧠💫`,
        `Wow! Your recall was flawless. You focused and locked that sequence into your brain beautifully!`,
        `Perfect recall! That shows incredible focus and mental strength!`
      ],
      observation: [
        `Excellent eye! You caught all the details and observed so carefully. Your focus power is real! 👁️✨`,
        `Amazing observation skills! You noticed everything. That's true focus at work!`,
        `Perfect observation! You spotted every detail. Your concentration was laser-focused!`
      ],
      patience: [
        `Beautiful! You stayed calm and focused for the whole breathing session. That's true peace! 🧘‍♂️✨`,
        `Perfect! You breathed with such patience and focus. Your mind is getting stronger!`,
        `Wonderful! You maintained focus throughout. Your inner calm power is growing!`
      ]
    };
    
    const responses = successResponses[gameTypeNormalized] || successResponses.comprehension;
    return responses[Math.floor(Math.random() * responses.length)];
  } else {
    // Smart context-aware struggle feedback based on game type
    const encouragingResponses = {
      comprehension: [
        `Good try! Sometimes stories have tricky details. Read it one more time slowly—you'll spot what you missed. That's how our brains learn! 💡`,
        `So close! Take a breath and look at the story again carefully. Every attempt makes your focus sharper!`,
        `Great effort! This one was tricky, but you're close. Let's slow down and read it again together.`
      ],
      patterns: [
        `Nice effort! Pattern puzzles need strategic planning. Think about the coordinates like a treasure map and plan your whole path before clicking! 🗺️`,
        `Good try! Let's trace this path more carefully. Remember, planning each step first helps our focus!`,
        `You got it! The path just needs a bit more careful planning. That's how we build focus!`
      ],
      memory: [
        `Good effort! Memory tasks get stronger with practice. Try saying each item out loud as it appears—that helps your brain lock it in! 🎯`,
        `Close! Memory takes time to build. Your brain is learning how to focus and recall better!`,
        `Great try! Next time, focus on each item as it appears. Your memory is getting stronger!`
      ],
      observation: [
        `Good observation! You caught some details, but there were a few more to find. Read the scene description twice next time—slow scanning finds everything! 🔍`,
        `Nice try! Observation takes patience. Read it carefully one more time and look for colors, numbers, and small details!`,
        `Good effort! You're close. Take a deep breath and scan the description again slowly. You've got this!`
      ],
      patience: [
        `Good effort! Patience is like a muscle—it gets stronger with practice. Next time, try staying focused the whole way through! 🌟`,
        `Great try! Your focus is building. Keep practicing staying calm and centered!`,
        `You're doing well! Keep practicing patience and focus. Every session makes you stronger!`
      ]
    };
    
    const responses = encouragingResponses[gameTypeNormalized] || encouragingResponses.comprehension;
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

function getMockParentReport(profile, history) {
  const name = profile.name || 'Your child';
  return {
    executiveSummary: `${name} is demonstrating steady progress, showing a wonderful capacity for sustained attention in structured readings. They respond very well to gamified goals and show high accuracy when pacing themselves.`,
    cognitiveStrengths: [
      'Excellent detail retention during Reading Comprehension tasks.',
      'Strong patient breathing and focus endurance during Beacon tasks.',
      'Consistent daily login habits, showing great learning discipline.'
    ],
    areasForImprovement: [
      'Tends to click slightly fast during Memory sequences; encouraging a 3-second wait before answering would help.',
      'Pattern recognition is solid but can be improved with multi-step logical planning.'
    ],
    suggestedActivities: [
      {
        title: 'Storytelling Check-ins',
        description: 'Read a short chapter book together at night. Stop at the end of a page and ask your child to describe what just happened in their own words, rewarding patient listening.',
        targetSkill: 'Sustained Auditory Attention'
      },
      {
        title: 'Screen-Free Puzzle Race (Slow Pace)',
        description: 'Work on a physical jigsaw puzzle together. Challenge each other to find pieces matching specific colors without rushing, creating a calm, focused environment.',
        targetSkill: 'Visual Observation'
      }
    ],
    focusScore: 82
  };
}

module.exports = {
  generatePuzzle,
  getNovaFeedback,
  getParentReport,
  isMockMode() { return isMockMode; }
};
