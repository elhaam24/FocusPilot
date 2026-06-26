# FocusPilot 🚀





FocusPilot is a web-based educational adventure game designed for children aged 7–14 to train and improve their attention spans, working memory, patience, and logical reasoning. 

In an era of short-form video content and instant-gratification loops, FocusPilot actively counters rapid-switching habits by rewarding sustained attention, careful observation, and paced learning through immersive gameplay.

---

## 🌟 Core Features

### 1. Gamified Adventure Map
Players explore three distinct worlds, each focusing on specific cognitive skills:
- **Cosmic Canopy 🪐** (Memory & Logic): Tracing stellar paths and recalling constellation patterns.
- **Submarine Citadel 🐙** (Patience & Vision): Dive deep to practice slow rhythmic breathing and scan for anomalies.
- **Whispering Wilderness 🌲** (Sustained Reading): Decipher ancient scrolls and solve reading comprehension riddles.

### 2. Cognitive Attention-Training Mini-Games
FocusPilot's gameplay mechanics are specifically designed to build concentration:
- **Breath Beacon 🧘** (*Focus Endurance*): An interactive breathing guide where children hold a "Focus Anchor" button in sync with an expanding/shrinking circle. Rushing or releasing the button resets the timer, teaching patience.
- **Constellation Recall 🌌** (*Working Memory*): Nodes light up slowly in a sequence. Children are locked out from clicking until the full pattern is revealed, preventing impulsive clicking.
- **Rune Weaver Grid 🕸️** (*Spatial Patterns*): A 4x4 coordinate board. Children read riddle clues, plan their route, and trace coordinates in order, clicking "Submit" only when they have double-checked their work.
- **Abyss Scanner 🐠** (*Detail Observation*): Children inspect a rich scene description and answer questions about specific details (colors, numbers, items), rewarding slow visual scanning.
- **Chronicles of Nova 📜** (*Sustained Reading*): Stories are generated based on the child's interests. A pacing timer locks the comprehension questions for a minimum of 15 seconds, training children to read complete paragraphs without skimming.

### 3. AI Mentor "Nova" 🤖
A floating star companion widget overlaying the game. Nova provides:
- **Real-time Chat**: Children can chat with Nova at any time for clues, explanations of concepts, or encouragement without giving away puzzle answers.
- **Growth-Mindset Coaching**: Nova celebrates correct answers and explains mistakes supportively (e.g., reminding them that mistakes help the brain grow).
- **Fault-Tolerant Offline Engine**: If the live Gemini API is unreachable or the key is not set, a **procedural offline engine** analyzes the child's message and active game type to provide tailored hints and interactive coaching.

### 4. Parent & Educator Dashboard 📊
A premium analytics hub for parents and teachers showing:
- **Key Metrics**: Total focus time, current streak, longest streak, and stars earned.
- **SVG Trend Chart**: A custom, responsive SVG-rendered bar chart showing daily focus times (in minutes) over the last 7 days.
- **Cognitive Breakdown**: Progress bars tracking accuracy rates and difficulty levels (1–5) across the five core cognitive categories.
- **AI-Generated Reports**: Executive summaries of the child's cognitive growth, list of strengths, improvement areas, and suggested screen-free home activities.

---

## 🛠️ Technical Stack

- **Backend**: Node.js & Express
- **Frontend**: React (built with Vite)
- **Styling**: Vanilla CSS (custom variables, cosmic glassmorphism, responsive scales)
- **Database**: Local file-based JSON transaction database (`server/data/db.json`)
- **AI Integration**: Google Gemini API (`@google/generative-ai`) with a procedural offline mock engine

---

## 🚀 Setup & Installation

### 1. Prerequisite
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Clone and Install Dependencies
In your terminal, navigate to the project directory and run the installation script:
```bash
# Installs backend and frontend dependencies concurrently
npm run init-project
```
*If you encounter SSL verification errors due to proxy or VPN settings, run:*
```bash
npm install --strict-ssl=false
cd frontend
npm install --strict-ssl=false
```

### 3. Configure Environment Variables
Copy the `.env.example` file in the root directory to a new file named `.env`:
```bash
cp .env.example .env
```
Open `.env` and add your Google Gemini API Key:
```env
PORT=5000
GEMINI_API_KEY=your_actual_gemini_api_key_here
NODE_ENV=development
```
*Note: If no API key is set, the application will run in **Mock Mode**, providing offline procedural challenges, parent reports, and mentor responses.*

---

## 🎮 Running the Application

### Development Mode
To run the Express backend and the Vite development server concurrently with hot-reloading:
```bash
npm run dev
```
- **Game Client**: `http://localhost:3000` (Vite proxies API calls to port 5000)
- **Backend API**: `http://localhost:5000`

### Production Mode
To compile the React frontend and run the application as a single self-contained server:
```bash
# Compiles React assets into frontend/dist
npm run build

# Starts the Express server which serves the build
npm start
```
- **Game & Dashboard**: Available at `http://localhost:5000`

### Running the Test Suite
To verify the database transaction logs, cognitive DDA (Dynamic Difficulty Adjustment), and procedural generators:
```bash
node server/tests/verify-api.js
```

---

## 🧠 Cognitive Training Design: How FocusPilot Works
Unlike traditional mobile games that use rapid stimulus loops (which can worsen attention spans), FocusPilot employs several attention-retraining design rules:
1. **Pacing Constraints**: Forcing a delay before questions are revealed trains the brain to remain in a low-stimulus reading state.
2. **Impulse Blocks**: Locking input during animations teaches children to observe events fully before reacting.
3. **Accuracy over Speed**: No timers or "speed runs" are used. Points are awarded for accuracy and completion, demonstrating that calm focus achieves success.
4. **Mindfulness & Breathing**: Rhythmic visual breathing exercises help children self-regulate, calm their nervous system, and transition into deep concentration.
