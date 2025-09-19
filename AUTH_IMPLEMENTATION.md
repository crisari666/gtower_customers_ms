# JWT Authentication Implementation

This document describes the JWT authentication implementation for the GTower Customers API.

## Overview

The authentication system uses JWT tokens signed with RSA256 algorithm using a private/public key pair. The system includes:

- User registration and login
- JWT token generation and validation
- Password hashing using HMAC-SHA256
- Middleware for protecting routes
- Guards for specific endpoints

## Files Created

### Authentication Module (`src/auth/`)

- `auth.module.ts` - Main authentication module
- `auth.service.ts` - Authentication service with user validation and login
- `auth.controller.ts` - Authentication endpoints
- `jwt.service.ts` - JWT token generation and validation service

### DTOs (`src/auth/dto/`)

- `login.dto.ts` - Login request validation
- `auth-response.dto.ts` - Authentication response structure

### Strategies (`src/auth/strategies/`)

- `jwt.strategy.ts` - JWT token validation strategy
- `local.strategy.ts` - Username/password validation strategy

### Guards (`src/auth/guards/`)

- `jwt-auth.guard.ts` - JWT authentication guard
- `local-auth.guard.ts` - Local authentication guard

### Middleware (`src/auth/middleware/`)

- `jwt.middleware.ts` - Global JWT validation middleware

### Certificates

- `private.pem` - Private key for JWT signing
- `public.pem` - Public key for JWT verification

## API Endpoints

### Authentication Endpoints

- `POST /auth/login` - Login with username and password
- `POST /auth/login-local` - Alternative login endpoint using Passport local strategy

### Protected Endpoints

All user management endpoints are now protected:
- `GET /users` - Get all users (requires JWT)
- `GET /users/:id` - Get user by ID (requires JWT)
- `PATCH /users/:id` - Update user (requires JWT)
- `PUT /users/:id/disable` - Disable user (requires JWT)
- `PUT /users/:id/enable` - Enable user (requires JWT)
- `DELETE /users/:id` - Delete user (requires JWT)

### Public Endpoints

- `POST /users` - Create new user (public for registration)

## Usage

### 1. Create a User

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "username": "testuser",
    "enabled": true
  }
}
```

### 3. Access Protected Routes

```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Features

1. **Password Hashing**: Passwords are hashed using HMAC-SHA256 with a configurable hash key
2. **JWT Signing**: Tokens are signed using RSA256 with a private key
3. **Token Validation**: All protected routes validate JWT tokens
4. **User Status Check**: Disabled users cannot authenticate
5. **Middleware Protection**: Global middleware protects all routes except auth endpoints

## Configuration

The system uses environment variables for configuration:

- `HASH_KEY` - Key for password hashing (from AppConfigService)
- Database connection variables for user storage

## Testing

A test script `test-auth.js` is provided to test the authentication flow:

```bash
node test-auth.js
```

## Dependencies Added

- `@nestjs/jwt` - JWT module for NestJS
- `@nestjs/passport` - Passport integration for NestJS
- `passport` - Authentication middleware
- `passport-jwt` - JWT strategy for Passport
- `passport-local` - Local strategy for Passport
- `@types/passport-jwt` - TypeScript types
- `@types/passport-local` - TypeScript types

## Notes

- The private and public keys are generated in the project root
- JWT tokens expire after 7 days
- The middleware skips authentication for `/auth` routes
- All other routes require a valid JWT token in the Authorization header
