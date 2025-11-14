# 📊 Financial Research AI Agent (Track A – Essential)

An **AI-powered financial research assistant** that analyzes **Indian stock market data** and visualizes key trends through interactive charts and technical indicators.  
This project is part of the **8-Week Financial Research AI Agent Development Program** focused on practical fintech data analysis and AI integration.

---

## 🧠 Project Overview

This application helps users analyze Indian stock data in real-time using financial APIs and basic AI tools.  
It provides:
- 📈 **Live Stock Analysis** via Yahoo Finance  
- ⚙️ **Technical Indicators** such as Moving Average (MA20) and Relative Strength Index (RSI)  
- 🧾 **Stock Comparison** between two Indian stocks  
- 💬 **Expandable AI Features** (sentiment analysis and portfolio insights planned in future weeks)  

The goal is to develop a working **financial research assistant** that demonstrates core fintech skills — data handling, analytics, visualization, and API integration.

---

## 🧩 Features Implemented (Up to Week 2)

✅ Real-time Indian stock data fetching  
✅ Interactive price charts using Plotly  
✅ Company info and summary statistics display  
✅ Technical indicators: 20-day MA & 14-day RSI  
✅ Two-stock comparison view  
✅ Streamlit-based interactive UI  
✅ Ready for Streamlit Cloud deployment  

---


for execution 
terminal 1
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload or python -m uvicorn app.main:app --reload


for frontend 
terminal 2
cd frontend 
cd s
npm i
npm run dev

create a .env file in backend

NEWS_API_KEY=your api key
# backend/.env.example
MONGO_URI=mongodb+srv://username:password@agenticai.vpefmoj.mongodb.net/?appName=AgenticAi
MONGO_DB_NAME=financial
REDIS_URL=redis://redis:6379/0