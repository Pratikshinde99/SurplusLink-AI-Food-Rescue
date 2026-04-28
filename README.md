# 🌍 SurplusLink: AI-Powered Food Redistribution System

[![Google Solution Challenge 2026](https://img.shields.io/badge/Google-Solution%20Challenge%202026-4285F4?style=for-the-badge&logo=google)](https://developers.google.com/community/gdsc-solution-challenge)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-8E75B2?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SurplusLink** is a real-time, AI-driven logistics platform designed to solve the urban food waste crisis. It bridges the gap between food suppliers (restaurants, hotels, vendors) and community NGOs using advanced urgency scoring and secure verification protocols.

---

## 📖 Table of Contents
- [Problem Statement](#-problem-statement)
- [The Solution](#-the-solution)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Setup](#-environment-setup)
- [Contributing](#-contributing)

---

## ⚠️ Problem Statement
Every day, massive amounts of perfectly edible surplus food are discarded by vendors, while millions face hunger. Current redistribution methods are manual, slow, and lack the "intelligence" to prioritize food before it spoils. This **perishability gap** leads to preventable environmental damage and social inequity.

## 💡 The Solution
SurplusLink uses **Google Gemini AI** to transform static food listings into dynamic "Rescue Missions." By analyzing perishability, quantity, and distance, the system provides:
1. **Intelligent Prioritization**: AI-calculated Urgency Scores.
2. **Impact Prediction**: Real-time CO2 offset and lives impacted metrics.
3. **Secure Logistics**: QR-based verification for safe and transparent food transfer.

---

## ✨ Key Features
### 🏢 For Food Suppliers
- **AI-Forecasted Impact**: See how many people you'll feed as you type.
- **One-Tap Listing**: Share surplus food in seconds.
- **Verification Portal**: Scan NGO QR codes to confirm secure handovers.

### 🏥 For NGOs & Rescue Teams
- **Mission Desk**: A prioritized list of food rescues ranked by time-sensitivity.
- **Google Maps Integration**: Optimized routes to donor locations.
- **Digital Authorization**: Encrypted QR slips for zero-paperwork verification.

### 🌍 Global Impact Dashboard
- Real-time network metrics tracking total food saved and community impact.

---

## 🛠️ Technology Stack
- **Frontend**: React 18, Vite, Framer Motion (Animations), Lucide Icons.
- **Backend**: FastAPI (Python 3.10+), Uvicorn.
- **AI Engine**: Google Gemini 1.5 Flash.
- **Database**: Supabase (PostgreSQL with Real-time Sync).
- **Authentication**: JWT (JSON Web Tokens) + Bcrypt.
- **Maps**: Google Maps Platform.

---

## 🏗️ Architecture
SurplusLink follows a decoupled, cloud-native architecture:
1. **Intelligence Layer**: Google Gemini API processes listings and calculates scores.
2. **Synchronization Layer**: Supabase Real-time Engine pushes updates to all clients instantly.
3. **Security Layer**: Stateless JWT auth ensures all API transactions are secure.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Supabase Account
- Google AI (Gemini) API Key

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/Pratikshinde99/SurplusLink-AI-Food-Rescue.git
   cd SurplusLink-AI-Food-Rescue
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

---

## 🔐 Environment Setup
Create a `.env` file in the `backend` directory (do not commit this!):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GOOGLE_API_KEY=your_gemini_key
JWT_SECRET=your_secret_key
```

---

## 🤝 Contributing
We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
**Built with ❤️ for the Google Solution Challenge 2026.**
