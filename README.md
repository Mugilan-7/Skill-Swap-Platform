# SkillSwap Hub

SkillSwap Hub is a full-stack skill exchange application built with React, Tailwind CSS, Express, MongoDB, JWT authentication, Socket.io chat, and Google Generative AI.

## Features

- JWT registration and login with bcrypt password hashing
- Email verification and forgot password reset via Nodemailer SMTP, with development console fallback
- Editable user profiles with profile picture upload
- Browse, search, and filter users by skill and category
- Send, accept, reject, and complete skill swap requests
- Dashboard stats for sent, received, accepted, and completed swaps
- Real-time one-to-one chat after a swap is accepted
- Real-time notifications for swaps, chat, and ratings
- Floating AI chatbot powered by Google Generative AI
- Social feed with posts, tags, search, latest/oldest sorting, likes, comments, bookmarks, follows, and following-based feed
- Voice-enabled social AI assistant using Web Speech API on the frontend and `/api/chat` with OpenAI or mock fallback
- Skill ratings, Beginner/Pro/Mentor badges, trending skills, and basic partner recommendations
- Responsive professional UI with dark/light mode and Framer Motion animations

## Folder Structure

```text
SkillSwap-Hub/
  client/                 React + Tailwind frontend
  server/                 Express + Socket.io backend
    src/
      config/             MongoDB connection
      controllers/        API logic
      middleware/         Auth, uploads, errors
      models/             Mongoose schemas
      routes/             API routes
      socket/             Real-time chat setup
      uploads/            Profile images
```

## Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI
- Google Generative AI API key for chatbot responses

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

On Windows PowerShell:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

3. Update `server/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/skillswap-hub
JWT_SECRET=replace-with-a-long-random-secret
GOOGLE_GENERATIVE_AI_API_KEY=your-google-generative-ai-key
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM="SkillSwap Hub <no-reply@example.com>"
CLIENT_URL=http://localhost:5173
PORT=5000
```

4. Start the app:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Useful Scripts

```bash
npm run dev          # Run client and server together
npm run build        # Build React frontend
npm run start        # Start Express server
```

## GitHub Pages Deployment

This repository includes a GitHub Actions workflow that builds the React app from `client/` and deploys it to GitHub Pages.

1. In GitHub, open **Settings > Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main`.
4. Open `https://mugilan-7.github.io/Skill-Swap-Platform/`.

GitHub Pages can only host the frontend. Login, register, chat, uploads, and dashboard data need the Express backend running on a hosting service such as Render, Railway, or a VPS with MongoDB configured.

After deploying the backend, add these repository variables in **Settings > Secrets and variables > Actions > Variables**:

```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
```

Set the backend `CLIENT_URL` environment variable to include the GitHub Pages URL:

```env
CLIENT_URL=https://mugilan-7.github.io/Skill-Swap-Platform
```

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/verify-email/:token`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`
- `GET /api/users`
- `PUT /api/users/me`
- `GET /api/users/dashboard`
- `GET /api/users/recommendations`
- `GET /api/swaps`
- `POST /api/swaps`
- `PATCH /api/swaps/:id/status`
- `POST /api/swaps/:id/rate`
- `GET /api/chats/:swapId/messages`
- `POST /api/chats/:swapId/messages`
- `POST /api/ai/chat`
- `GET /api/posts`
- `POST /api/posts`
- `GET /api/posts/feed/following`
- `GET /api/posts/bookmarks/me`
- `POST /api/posts/:id/like`
- `POST /api/posts/:id/comments`
- `POST /api/posts/:id/bookmark`
- `POST /api/posts/users/:userId/follow`
- `POST /api/chat`
- `GET /api/notifications`

## Email Delivery

Nodemailer is fine for local development and small apps when you already have SMTP credentials. For production, a transactional provider such as Resend, Postmark, SendGrid, or AWS SES is usually easier to monitor and less likely to land in spam. If SMTP variables are missing, SkillSwap logs verification/reset links in the server console so the flow can still be tested locally.

## Security Notes

- Secrets are loaded from environment variables.
- Passwords are hashed before storage.
- Protected API routes require `Authorization: Bearer <token>`.
- Chat access is checked against accepted swap participants.
- Profile image uploads are limited to images under 2 MB.
