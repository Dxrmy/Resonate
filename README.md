<div align="center">
  <img src="icon.png" alt="Resonate Icon" width="128" />
  <h1>Resonate</h1>
  <p>
    <strong>Your Path to Stoic Clarity, CBT, and DBT Insight</strong>
  </p>
  
  ![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
  ![Philosophy](https://img.shields.io/badge/Philosophy-Stoic-grey)
  ![Mental Health](https://img.shields.io/badge/Focus-Mental--Wellness-purple)
  ![License](https://img.shields.io/badge/License-MIT-green)

  <br />
</div>

## 📖 Overview
**Resonate** is an intelligent mental health and journaling platform designed to turn your data into emotional clarity. By integrating Cognitive Behavioral Therapy (CBT), Dialectical Behavior Therapy (DBT), and Stoic philosophical frameworks, it helps you understand the signals your mind is sending.

## ✨ Features
- **Intelligent Journaling:** Multi-modal journaling designed around CBT/DBT practices with emotional tagging.
- **Stoic Reflection:** Built-in stoic guides and daily reflection tools to build mental resilience.
- **Mood Analytics:** Detailed yearly visualization of your mental states to identify triggers and long-term progress.
- **Correlation Engine:** Automated analysis to find relationships between lifestyle habits and emotional outcomes.
- **AI Insights:** Local LLM-driven analysis providing personalized cognitive insights while maintaining local privacy.

## 🛠 Tech Stack
- **Frontend**: React 19, Framer Motion, Recharts
- **Backend/Runtime**: Electron, SQLite3
- **Intelligence**: @mlc-ai/web-llm (Local Execution)

## ⚙️ Configuration
Resonate is designed for maximum privacy and operates locally.

### 1. Environment Setup
Create a `.env` file in the root directory if you wish to use cloud-based AI fallbacks (optional):
```bash
VITE_APP_GEMINI_API_KEY=your-gemini-api-key
```

### 2. Local Database
The application automatically manages its local SQLite database (`resonate_v2.db`) within your system's application data folder.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Dxrmy/Resonate.git
   cd Resonate
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Launch the app:**
   ```bash
   npm run electron:dev
   ```

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
