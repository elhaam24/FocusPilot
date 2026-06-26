require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/profiles', require('./routes/profile'));
app.use('/api/sessions', require('./routes/session'));
app.use('/api/games', require('./routes/game'));
app.use('/api/parent', require('./routes/parent'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode, serving frontend assets.');
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('FocusPilot API Server is running in development mode.');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize DB and start server
async function startServer() {
  try {
    // Perform any startup db checks
    await db.getProfiles();
    console.log('Local database initialized successfully.');
    
    app.listen(PORT, () => {
      console.log(`=============================================`);
      console.log(` FocusPilot Server is active on port: ${PORT}`);
      console.log(` Env: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
