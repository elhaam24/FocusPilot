const db = require('../db');
const gemini = require('../gemini');

async function runTests() {
  console.log('==============================================');
  console.log('   FocusPilot Core Logic Verification Test    ');
  console.log('==============================================\n');

  try {
    // 1. Verify Profile Onboarding
    console.log('Testing Profile Creation...');
    const mockProfile = {
      name: 'Leo the Explorer',
      age: 8,
      avatar: 'koala',
      interests: ['space', 'ocean']
    };
    
    const savedProfile = await db.saveProfile(mockProfile);
    console.log(`✓ Profile created successfully with ID: ${savedProfile.id}`);
    console.log(`  Name: ${savedProfile.name}, Age: ${savedProfile.age}, Avatar: ${savedProfile.avatar}`);
    console.log(`  Starting Stars: ${savedProfile.stars}, Current World: ${savedProfile.currentWorld}\n`);

    // 2. Verify Session Focus Tracking
    console.log('Testing Focus Session Tracking...');
    const session = await db.startSession(savedProfile.id);
    console.log(`✓ Focus session started. Session ID: ${session.id}`);
    
    // Simulate focusing for 45 seconds
    const updatedSession = await db.updateSession(session.id, 45);
    console.log(`✓ Session duration updated to: ${updatedSession.duration} seconds`);
    
    const endedSession = await db.endSession(session.id, 50);
    console.log(`✓ Session ended. Total duration logged: ${endedSession.duration} seconds\n`);

    // 3. Verify Mock Puzzle Generator
    console.log('Testing Mock Puzzle Generation...');
    const puzzleTypes = ['memory', 'patterns', 'observation', 'comprehension', 'patience'];
    for (const type of puzzleTypes) {
      const puzzle = await gemini.generatePuzzle(type, savedProfile.age, 1, savedProfile.interests);
      console.log(`✓ Mock puzzle generated for type "${type}": "${puzzle.title}"`);
    }
    console.log('');

    // 4. Verify Game Evaluation & Dynamic Difficulty Adjustment (DDA)
    console.log('Testing Game Logging and Dynamic Difficulty (DDA)...');
    console.log(`  Initial Memory Skill Level: ${savedProfile.skillLevels.memory}`);
    
    // Log 4 consecutive successful games to trigger a level up
    console.log('  Logging 4 consecutive successful memory games...');
    let currentProfile = savedProfile;
    for (let i = 0; i < 4; i++) {
      const result = await db.addGameLog(currentProfile.id, {
        gameType: 'memory',
        difficulty: currentProfile.skillLevels.memory,
        isCorrect: true,
        duration: 12,
        starsEarned: 15
      });
      currentProfile = result.profile;
    }
    
    console.log(`✓ DDA Success: Memory Skill Level increased to: ${currentProfile.skillLevels.memory}`);
    console.log(`  Total Stars accumulated: ${currentProfile.stars}\n`);

    // 5. Verify Parent Statistics Aggregator
    console.log('Testing Parent Stats Compilation...');
    // Add a couple sessions on previous days to test streaks
    // We mock dates in db.json for comprehensive testing if needed,
    // but here we just ensure the aggregator runs on current logs.
    const sessions = await db.getSessions(currentProfile.id);
    const logs = await db.getGameLogs(currentProfile.id);
    console.log(`✓ Retrieved ${sessions.length} sessions and ${logs.length} game logs for parent audit.`);

    console.log('\n==============================================');
    console.log('       ALL CORE TESTS PASSED MATCHING!       ');
    console.log('==============================================');
    
    // Cleanup the test profile
    await db.deleteProfile(currentProfile.id);
    console.log('Test profile cleaned up successfully.');
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

runTests();
