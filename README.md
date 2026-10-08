# LosttoFound

LosttoFound is a MERN stack web application designed to help people report, search for, and recover lost and found items.

The platform connects people who have lost an item with people who have found one through location-based discovery, ownership verification, claims, messaging, notifications, and a trust/honor system.

## Features

- User registration and login
- Google Sign-In
- JWT-based authentication
- Forgot-password and password-reset flow
- User profiles
- Lost item reporting
- Found item reporting
- Search and filtering
- Location-based nearby item discovery
- Manual location selection and browser-based current-location detection
- Date and time based filtering
- Item details and ownership verification questions
- Claim/request ownership system
- Claim approval and rejection
- Mark items as returned
- User-to-user chat
- Real-time messaging with Socket.IO
- Message replies and unread message tracking
- In-app notifications
- User blocking
- User and item reporting
- Rule-based scam/trust detection
- Honor/Trust score system
- Admin dashboard and moderation
- Phone verification using OTP
- Responsive React interface

## Trust & Safety

LosttoFound uses an **Honor/Trust score** to provide an indication of user reliability.

The project does not use a points or badge system. Trust is represented through the user's Honor score and related activity.

The platform also includes:

- Ownership verification questions
- User reporting
- Blocking
- Account moderation
- Rule-based scam detection
- Admin controls

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- Socket.IO Client

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Socket.IO
- Nodemailer
- Google OAuth

## Project Structure

```text
LosttoFound/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
└── front-end/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── data/
    │   ├── pages/
    │   ├── services/
    │   └── utils/
    ├── index.html
    └── package.json
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/momuflih/LosttoFound.git
cd LosttoFound
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder and add the required environment variables.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URLS=http://localhost:5174
ADMIN_EMAILS=your_admin_email
```

Add your Google OAuth and other configuration values if they are enabled in your local setup.

### 3. Install frontend dependencies

Open another terminal:

```bash
cd front-end
npm install
```

Create a `.env` file if required by your local configuration.

For example:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Start the backend

From the `backend` directory:

```bash
node server.js
```

### 5. Start the frontend

From the `front-end` directory:

```bash
npm run dev
```

The frontend will normally be available at the local Vite address shown in the terminal.

## Environment Variables

Environment files are intentionally excluded from Git.

Do **not** commit:

```text
.env
```

Never publish database passwords, JWT secrets, OAuth secrets, API keys, or other credentials to GitHub.

## Important Notes

- LosttoFound is a helping/aiding platform, not a conventional marketplace.
- Users are responsible for interactions and arrangements made through the platform.
- The platform should not be considered responsible for payments or private arrangements between users.
- Item ownership is verified through information supplied by users and the application's verification process.
- Location-based results depend on the selected location or the browser's location permission.

## Future Scope

Potential future improvements include:

- Enhanced security
- More advanced scam detection
- Improved moderation tools
- Better location and map-based discovery
- More advanced notification options
- Additional privacy controls
- Production deployment and scalability improvements

## Author

**Mohamed Muflih A B**

MERN Stack Course Project

## License

This project was created as a MERN stack course project.
