# Solar Wealth Grow - Backend API

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/solar-wealth-grow

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Twilio Configuration
TWILIO_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Server Configuration
PORT=5000
NODE_ENV=development
```

3. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Registration Flow:
1. `POST /api/auth/register` - Register with username, phone, email, password, confirmPassword
2. `POST /api/auth/send-otp` - Resend OTP to phone number
3. `POST /api/auth/verify-otp` - Verify OTP and complete registration

#### Login:
- `POST /api/auth/login` - Login with username/phone and password

#### User Management:
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

### Protected Routes (`/api`)

All protected routes require JWT token in Authorization header:
`Authorization: Bearer <your-jwt-token>`

- `GET /api/home` - Dashboard data with financial stats
- `GET /api/profile` - User profile (read-only)
- `GET /api/teams` - Get teams

### Health Check

- `GET /api/health` - Server health check

## Authentication Flow

### Registration Process:
1. User submits registration form with username, phone, email, password, confirmPassword
2. Backend validates data and checks for existing users
3. User is created (not verified) and OTP is sent via SMS
4. User enters OTP and verifies via `/api/auth/verify-otp`
5. User is marked as verified and JWT token is returned
6. User is redirected to home page

### Login Process:
1. User submits login form with username/phone and password
2. Backend finds user by username or phone
3. Password is verified using bcrypt
4. If verified, JWT token is generated and returned
5. User is redirected to home page with session data

## User Data Structure

### User Model Fields:
- `username` (required, unique, 3-30 chars)
- `phone` (required, unique)
- `email` (required, unique)
- `password` (required, min 6 chars, hashed)
- `isVerified` (boolean, default false)
- `totalAmount` (number, default 0)
- `depositedAmount` (number, default 0)
- `withdrawnAmount` (number, default 0)
- `profile` (avatar, bio, location, website)
- `preferences` (theme, notifications)
- `lastLogin` (date)
- `timestamps` (createdAt, updatedAt)

## Middleware

- `auth` middleware protects routes and verifies JWT tokens
- CORS is enabled for frontend communication
- Error handling middleware for consistent error responses
- Password hashing with bcrypt
- OTP verification with Twilio SMS

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- OTP verification for registration
- Input validation and sanitization
- Duplicate user prevention
- Session management with JWT expiry 