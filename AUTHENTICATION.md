# PawPal Authentication System

This document describes the authentication system implemented for the PawPal application.

## Overview

The PawPal application supports two authentication methods:

1. **Google OAuth** - Using the existing `@getmocha/users-service` integration
2. **Local Authentication** - Email/password authentication with JWT tokens

## Backend API Endpoints

### Local Authentication

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "Anytown",
  "state": "CA",
  "zip_code": "12345",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "+1234567891"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    // ... other user fields
  },
  "token": "jwt_token_here"
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    // ... other user fields
  },
  "token": "jwt_token_here"
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

#### Update Profile
```
PUT /api/auth/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+1234567890",
  // ... other updatable fields
}
```

#### Logout
```
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

### Google OAuth (Existing)

The existing Google OAuth endpoints remain unchanged:
- `GET /api/oauth/google/redirect_url`
- `POST /api/sessions`
- `GET /api/users/me`
- `GET /api/logout`

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  is_verified BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### JWT Tokens
- 7-day expiration
- Signed with configurable secret
- Includes user ID and email

### Password Hashing
- Uses bcryptjs with 12 salt rounds
- Secure password storage

## Frontend Integration

### Custom useAuth Hook

The application uses a custom `useAuth` hook that supports both authentication methods:

```typescript
const { 
  user, 
  isAuthenticated, 
  isLoading, 
  login, 
  register, 
  logout, 
  updateProfile 
} = useAuth();
```

### Authentication Flow

1. **Registration/Login**: User submits form with email/password
2. **Token Storage**: JWT token stored in localStorage
3. **API Requests**: Token included in Authorization header
4. **Auto-redirect**: Authenticated users redirected to dashboard
5. **Logout**: Token removed from localStorage

## Environment Variables

Required environment variables:

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MOCHA_USERS_SERVICE_API_URL=your-mocha-api-url
MOCHA_USERS_SERVICE_API_KEY=your-mocha-api-key
```

## Unified Authentication

The backend uses a unified authentication middleware that supports both Google OAuth and local authentication. This allows the same API endpoints to work with either authentication method.

## Error Handling

The system includes comprehensive error handling:

- Password validation errors
- Duplicate email registration
- Invalid credentials
- Token expiration
- Network errors

## Testing

To test the authentication system:

1. Start the development server: `npm run dev`
2. Navigate to the auth page
3. Try registering with a new email/password
4. Test login with the created credentials
5. Verify protected routes require authentication

## Security Considerations

- JWT secrets should be strong and unique per environment
- Consider implementing token blacklisting for enhanced security
- Regular security audits recommended
- HTTPS required in production
- Consider rate limiting for auth endpoints
