# Zoom Clone

A full-stack video conferencing platform inspired by Zoom, built with **Next.js, FastAPI, and SQLite**. The application supports instant meetings, meeting scheduling, joining via Meeting ID or invite link, participant management, and a responsive meeting interface.

## 🔗 Links

* **Live App:** https://zoom-clone-chi-plum.vercel.app
* **API / Swagger:** https://zoom-clone-api-mfqe.onrender.com/docs
* **GitHub:** https://github.com/yashjain8448/zoom-clone

> The backend is hosted on a free Render instance and may take a few seconds to wake up after inactivity.

## ✨ Features

* **Dashboard** — Upcoming and recent meetings with quick actions for New Meeting, Join Meeting, and Schedule Meeting.
* **Instant Meetings** — Generate a unique Meeting ID and shareable invite link.
* **Join Meetings** — Join using a Meeting ID or invite link with display-name validation.
* **Scheduled Meetings** — Create meetings with title, description, date, time, duration, timezone, and passcode.
* **Meeting Room** — Participant grid, camera preview, mute/video states, participant panel, meeting timer, and leave/end controls.
* **Host Controls** — Mute all participants and remove participants.
* **Responsive UI** — Optimized for desktop, tablet, and mobile.
* **Seeded Database** — Sample meetings are automatically created for demonstration.

## 🛠 Tech Stack

**Frontend**

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Lucide React

**Backend**

* Python
* FastAPI
* SQLAlchemy
* Pydantic

**Database**

* SQLite

**Deployment**

* Vercel — Frontend
* Render — Backend

## 🏗 Architecture

```text
Next.js Frontend
       │
       │ REST API
       ▼
FastAPI Backend
       │
       ▼
   SQLite DB
```

The frontend communicates with the FastAPI backend through a typed API client. Backend routers handle HTTP requests while service layers contain business logic and database operations.

## 🗄 Database Design

The application uses four main entities:

```text
Users
  │
  ├── Meetings
  │      │
  │      ├── Participants
  │      │
  │      └── Invitees
```

Meetings store scheduling, status, host, timezone, and meeting-code information, while participants track roles, mute/video state, and join/leave information.

## 🚀 Run Locally

### Backend

```bash
cd backend

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt

copy .env.example .env

uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

### Frontend

In another terminal:

```bash
cd frontend
npm install

copy .env.example .env.local

npm run dev
```

Frontend:

```text
http://localhost:3000
```

## ⚙️ Environment Variables

### Backend

```env
DATABASE_URL=sqlite:///./zoom.db
FRONTEND_URL=http://localhost:3000
DEFAULT_USER_EMAIL=alex.morgan@example.com
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📁 Project Structure

```text
zoom-clone/
├── backend/
│   └── app/
│       ├── models/
│       ├── schemas/
│       ├── services/
│       ├── routers/
│       ├── main.py
│       ├── database.py
│       └── config.py
│
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       └── lib/
│
└── README.md
```

## ⚠️ Current Limitations

This project focuses on the core meeting workflow rather than production-scale infrastructure.

* Authentication is simulated using a default user.
* Participant state is synchronized through polling.
* Audio/video is currently represented through local camera preview and meeting state; production deployment would use WebRTC with WebSocket signaling and an SFU.
* SQLite on free-tier hosting may reset when the backend restarts; production would use PostgreSQL with migrations.

## 📌 Future Improvements

* Real-time WebRTC audio/video
* WebSocket-based signaling
* User authentication
* Persistent chat
* Screen sharing
* Meeting recording
* PostgreSQL + migrations
* Email/calendar integrations
