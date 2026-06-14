# 💬 TeamTalk Frontend – Modern Real-Time Chat Application

A modern and responsive chat application frontend built with **React**, **Redux Toolkit**, **Socket.IO Client**, and **Tailwind CSS**. TeamTalk provides seamless real-time communication, user presence tracking, typing indicators, and conversation management for teams and organizations.

## 🚀 Features

* 🔐 Secure Authentication & Authorization
* 💬 Real-Time Messaging
* ⚡ Live Typing Indicators
* 🟢 Online / Offline User Presence
* 📌 Pin Important Conversations
* 👥 Team-Based Communication
* 🛡️ Protected Routes
* 🔄 Automatic Token Refresh
* 📱 Fully Responsive Design
* 🎨 Modern UI/UX Experience

## 📸 Demo

**Live Application:**
https://team-talk-frontend-alpha.vercel.app

## 🛠️ Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,vite,redux,tailwind,js,git,github,vscode" alt="Frontend Tech Stack" />
</p>

## 🌐 Frontend Architecture

1. User authenticates using secure JWT authentication.
2. Access tokens are managed in memory.
3. Refresh tokens are stored securely in HTTP-only cookies.
4. Socket.IO establishes a real-time connection with the backend.
5. Messages, presence updates, and typing events are synchronized instantly.
6. Redux manages application-wide state.

## 📂 Project Structure

```bash
src/
├── components/
├── pages/
├── routes/
├── store/
├── context/
├── hooks/
├── services/
├── utils/
└── assets/
```

## ⚙️ Environment Variables

Create a `.env` file:

```env
VITE_API_URL=https://your-backend-url/api
VITE_SOCKET_URL=https://your-backend-url
```

## 🚀 Installation

```bash
git clone <repository-url>

cd teamtalk-frontend

npm install

npm run dev
```

## 🔗 Backend Repository

This project works together with the TeamTalk Backend API.

## 👨‍💻 Author

### Jay Parmar

GitHub: https://github.com/Jayparmar123

LinkedIn: https://www.linkedin.com/in/jay-parmar-10465a2b3/
