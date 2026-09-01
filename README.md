# MeetLink Backend

Advanced real-time communication and collaboration backend for the MeetLink video meeting platform.

MeetLink provides the server-side foundation for authentication, meeting management, real-time communication, chat, file sharing, attendance tracking, recordings, groups, notifications, and administration.

## ✨ Features

- 🔐 JWT-based authentication and protected routes
- 👤 User profiles, roles, verification and presence status
- 🎥 Meeting creation, scheduling, joining and ending
- 👥 Host, co-host, participant and viewer roles
- 🚪 Waiting room and meeting lock controls
- 🔑 Password-protected meetings and invitation tokens
- 🖥️ Host controls and meeting settings
- 💬 Real-time communication with Socket.IO
- 📎 Chat message persistence and file/image uploads
- 🔔 Notifications and read/unread management
- 📊 Meeting attendance tracking
- 📑 Attendance export to Excel
- 🎬 Meeting recording lifecycle management
- 👨‍👩‍👧‍👦 Group/workspace-oriented meeting support
- 🛡️ Admin dashboard APIs for users, meetings, attendance, analytics and system settings
- 🔒 Helmet security headers, CORS and API rate limiting
- 🗄️ MongoDB with Mongoose
- 📧 Optional SMTP email support
- ☁️ Storage abstraction with local storage configuration
- ❤️ Health-check endpoint

## 🏗️ Technology Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 18+ |
| Framework | Express.js 4 |
| Database | MongoDB |
| ODM | Mongoose 7 |
| Real-time | Socket.IO 4 |
| Authentication | JWT + bcryptjs |
| Validation | Zod |
| Security | Helmet + CORS + express-rate-limit |
| File Uploads | Multer |
| Email | Nodemailer |
| Excel Export | ExcelJS |
| Logging | Morgan |
| Development | Nodemon |

## 📁 Project Structure

```text
Meetlink-backend/
├── src/
│   ├── config/              # Application and database configuration
│   ├── controllers/         # Business logic
│   ├── middleware/          # Authentication, validation, uploads, errors
│   ├── models/              # Mongoose models
│   ├── routes/              # REST API route definitions
│   ├── socket/              # Socket.IO real-time event handling
│   └── utils/               # Seed/admin/database utilities
├── uploads/                 # Local uploaded chat files
├── server.js                # HTTP/Express/Socket.IO entry point
├── package.json
├── .env.example
└── README.md
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Tauhid-Topu-007/Meetlink-backend.git
cd Meetlink-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

On Windows PowerShell, you can use:

```powershell
Copy-Item .env.example .env
```

Configure at minimum:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/meetlink
JWT_SECRET=your-long-random-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

For email features, configure the SMTP variables in `.env`. Local file storage is enabled by default.

### 4. Start the development server

```bash
npm run dev
```

For production-style startup:

```bash
npm start
```

The default server runs on:

```text
http://localhost:5000
```

## 🔧 Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the production Node.js server |
| `npm run dev` | Start the server with Nodemon |
| `npm run seed` | Seed database data |
| `npm run clear-users` | Clear user data using the project utility |
| `npm run admin` | Create an admin user using the project utility |

## 🔗 API Overview

All protected API routes use authentication middleware.

### Health & Information

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Health/status check |
| GET | `/` | API information and endpoint summary |

### Authentication

Base URL: `/api/auth`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/register` | Register a user |
| POST | `/login` | Authenticate a user |
| GET | `/me` | Get current authenticated user |
| POST | `/logout-all` | Invalidate all active sessions/tokens |
| PATCH | `/profile` | Update profile |

### Meetings

Base URL: `/api/meetings`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/` | Create a meeting |
| GET | `/mine` | List the current user's meetings |
| GET | `/:meetingId` | Get meeting details |
| POST | `/:meetingId/join` | Join a meeting |
| POST | `/:meetingId/end` | End a meeting |
| POST | `/:meetingId/invite` | Invite a participant |
| PATCH | `/:meetingId/settings` | Update meeting settings |
| POST | `/:meetingId/transfer-host` | Transfer host |
| POST | `/:meetingId/recording/start` | Start recording |
| POST | `/:meetingId/recording/stop` | Stop recording |
| GET | `/:meetingId/recordings` | List recordings |

### Notifications

Base URL: `/api/notifications`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | List notifications |
| POST | `/read` | Mark notifications as read |
| POST | `/read-all` | Mark all notifications as read |

### Attendance

Base URL: `/api/attendance`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/:meetingId` | Get meeting attendance |
| GET | `/:meetingId/excel` | Download attendance as Excel |

### Chat

Base URL: `/api/chat`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/upload` | Upload a chat attachment |
| POST | `/messages` | Save a chat message |
| GET | `/messages/:meetingId` | Get meeting messages |

### Groups

Base URL: `/api/groups`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | List user's groups |
| POST | `/` | Create a group |
| GET | `/:id` | Get a group |
| PUT | `/:id` | Update a group |
| DELETE | `/:id` | Delete a group |
| POST | `/:id/schedule` | Schedule a group meeting |

### Admin

Base URL: `/api/admin`

Admin authentication/authorization is required.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/overview` | System overview |
| GET | `/analytics` | Platform analytics |
| GET | `/users` | Manage users |
| PATCH | `/users/:id` | Update a user |
| DELETE | `/users/:id` | Remove a user |
| GET | `/meetings` | Manage meetings |
| PATCH | `/meetings/:meetingId` | Update a meeting |
| DELETE | `/meetings/:meetingId` | Remove a meeting |
| GET | `/attendance` | Platform attendance data |
| GET | `/settings` | Get system settings |
| PATCH | `/settings` | Update system settings |

## 🔌 Real-Time Communication

MeetLink uses Socket.IO alongside the REST API for real-time meeting functionality.

The Socket.IO server is configured with:

- WebSocket and polling transports
- CORS support
- 60-second ping timeout
- 25-second ping interval
- 5 MB maximum HTTP buffer size

Real-time events are handled in `src/socket/socketHandler.js`.

## 🗃️ Data Models

The backend uses MongoDB/Mongoose models for core platform entities. The main models include:

- **User** — accounts, authentication data, roles, profile, preferences, contacts and activity statistics.
- **Meeting** — meeting metadata, scheduling, participants, invitations, access controls, settings, resources and recordings.
- Additional models support the platform's notification, chat, group and administrative functionality.

## 🔐 Security

The backend includes several security layers:

- JWT authentication for protected resources
- Password hashing with bcryptjs
- Role-based authorization for admin operations
- Helmet security headers
- CORS configuration
- API rate limiting
- Environment-based secrets and configuration
- Protected meeting access and invitation tokens
- Centralized error handling

**Important:** Never commit your real `.env` file, JWT secret, SMTP credentials, or cloud storage credentials to GitHub.

## 🌐 Frontend Integration

The MeetLink backend is designed to work with a separate React frontend.

Typical local development setup:

```text
Frontend:  http://localhost:5173
Backend:   http://localhost:5000
MongoDB:   mongodb://localhost:27017/meetlink
```

Make sure the frontend's origin is included in `CORS_ORIGINS`.

## 🩺 Health Check

After starting the backend, open:

```text
GET /health
```

A successful response contains the backend status, version, environment, timestamp and enabled platform features.

## 📦 Deployment Notes

For deployment:

1. Provision a MongoDB database.
2. Configure all required environment variables.
3. Set `NODE_ENV=production`.
4. Configure the frontend URL and CORS origins.
5. Use a persistent storage solution for uploaded files if running multiple instances.
6. Configure SMTP credentials if email functionality is required.
7. Start the server with:

```bash
npm start
```

The application requires **Node.js 18 or newer**.

## 🔗 Repository

**MeetLink Backend:**  
https://github.com/Tauhid-Topu-007/Meetlink-backend

## 👨‍💻 Author

**Tauhidul Islam Topu**

Computer Science & Engineering | AI/ML & Full-Stack Development

---

⭐ If you find this project useful, consider giving the repository a star!
