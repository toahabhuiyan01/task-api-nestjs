# Task Manager API

## Overview

This Task Manager API is built using NestJS, a progressive Node.js framework, with MongoDB as the database. The application follows a modular architecture with separate modules for authentication, task management, and user management. Key design decisions include:

- **Modular Architecture**: Separate modules for auth, tasks, and users for better code organization and maintainability
- **MongoDB Integration**: Using Mongoose ODM for robust data modeling and validation
- **JWT Authentication**: Secure authentication system with token-based access
- **Testing**: Comprehensive E2E tests using Jest and Supertest

## Setup Instructions

1. **Prerequisites**

   - Node.js (v14 or higher)
   - MongoDB (local instance or connection string)

2. **Installation**

   ```bash
   # Clone the repository
   git clone [repository-url]
   cd naria-api

   # Install dependencies
   npm install
   ```

3. **Configuration**

   - Create a `.env` file in the root directory
   - Add necessary environment variables:
     ```
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     ```

4. **Running the Application**

   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

## API Documentation

### Authentication Endpoints

#### POST /auth/register

- **Description**: Register a new user
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response Body**:
  ```json
  {
    "user": {
      "_id": "string",
      "name": "string",
      "email": "string",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    },
    "token": "JWT token string"
  }
  ```

#### POST /auth/login

- **Description**: Login with existing credentials
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response Body**:
  ```json
  {
    "user": {
      "_id": "string",
      "name": "string",
      "email": "string",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    },
    "token": "JWT token string"
  }
  ```

### Task Management Endpoints

#### GET /tasks

- **Description**: Get all tasks for authenticated user
- **Authentication**: Required (JWT token)
- **Response Body**:
  ```json
  [
    {
      "_id": "string",
      "title": "string",
      "description": "string",
      "status": "pending" | "completed",
      "dueDate": "ISO date string",
      "userId": "string",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ]
  ```

#### POST /tasks

- **Description**: Create a new task
- **Authentication**: Required (JWT token)
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "dueDate": "ISO date string"
  }
  ```
- **Response Body**:
  ```json
  {
    "_id": "string",
    "title": "string",
    "description": "string",
    "status": "pending",
    "dueDate": "ISO date string",
    "userId": "string",
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
  ```

#### PUT /tasks/:id

- **Description**: Update existing task
- **Authentication**: Required (JWT token)
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "status": "pending" | "completed",
    "dueDate": "ISO date string"
  }
  ```
- **Response Body**:
  ```json
  {
    "_id": "string",
    "title": "string",
    "description": "string",
    "status": "pending" | "completed",
    "dueDate": "ISO date string",
    "userId": "string",
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
  ```

#### DELETE /tasks/:id

- **Description**: Delete a task
- **Authentication**: Required (JWT token)
- **Response**: HTTP 204 No Content

### User Management Endpoints

#### GET /users/profile

- **Description**: Get user profile
- **Authentication**: Required (JWT token)
- **Response Body**:
  ```json
  {
    "_id": "string",
    "name": "string",
    "email": "string",
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
  ```

#### PUT /users/profile

- **Description**: Update user profile
- **Authentication**: Required (JWT token)
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string"
  }
  ```
- **Response Body**:
  ```json
  {
    "_id": "string",
    "name": "string",
    "email": "string",
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
  ```

## Security Measures

1. **Password Security**

   - Passwords are hashed using bcrypt before storage
   - Salt rounds are automatically generated for each password

2. **Authentication**

   - JWT (JSON Web Tokens) for stateless authentication
   - Tokens are required for protected endpoints
   - Token validation on each protected request

3. **Request Validation**

   - Input validation for all endpoints
   - MongoDB ObjectId validation for task operations
   - Date format validation for task due dates

4. **Error Handling**
   - Proper error responses with appropriate HTTP status codes
   - Validation errors return detailed messages
   - Generic error messages for security-sensitive operations

## Testing

The application includes comprehensive end-to-end tests:

```bash
# Run e2e tests
npm run test:e2e

# Run unit tests
npm run test
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).
