# Finfom: Secure Document Management System 📁

Finfom is a robust and intuitive full-stack application designed to help users efficiently upload, organize, and securely manage their digital documents. Whether for personal use or collaborative teams, Finfom provides a centralized platform with flexible visibility options, group management, and seamless file access.

## ✨ Features

*   **User Authentication**: Secure registration and login, including Google OAuth integration.
*   **File Upload & Management**: Effortlessly upload documents with titles, descriptions, and flexible visibility settings (public, private, password-protected).
*   **Group Organization**: Create custom groups to categorize files, making retrieval and management straightforward.
*   **File Preview & Download**: View various file types directly within the application and download them when needed.
*   **Share Files**: Share files with others by generating a link or embedding code.
*   **Access Control**: Granular control over file visibility and access permissions.
*   **Search & Filter**: Easily find documents using powerful search and filtering capabilities.
*   **Robust Backend**: Built with Node.js, Express, MongoDB, and Redis for high performance and scalability.
*   **Modern Frontend**: Developed with React and Tailwind CSS for a responsive and user-friendly experience.
*   **Containerized Deployment**: Docker and Docker Compose for easy setup and deployment.

## 🚀 Technologies Used

| Category   | Technology     | Description                                             | Link                                                  |
| :--------- | :------------- | :------------------------------------------------------ | :---------------------------------------------------- |
| **Backend** | Node.js        | JavaScript runtime for server-side logic                | [https://nodejs.org/](https://nodejs.org/)            |
|            | Express.js     | Web framework for Node.js APIs                          | [https://expressjs.com/](https://expressjs.com/)      |
|            | TypeScript     | Superset of JavaScript for type safety                  | [https://www.typescriptlang.org/](https://www.typescriptlang.org/) |
|            | MongoDB        | NoSQL database for flexible data storage                | [https://www.mongodb.com/](https://www.mongodb.com/)  |
|            | Mongoose       | MongoDB object modeling for Node.js                     | [https://mongoosejs.com/](https://mongoosejs.com/)    |
|            | Redis          | In-memory data store for caching and rate limiting      | [https://redis.io/](https://redis.io/)                |
|            | Cloudinary     | Cloud-based image and video management                  | [https://cloudinary.com/](https://cloudinary.com/)    |
|            | JWT            | JSON Web Tokens for secure authentication               | [https://jwt.io/](https://jwt.io/)                    |
|            | bcryptjs       | Password hashing library                                | [https://www.npmjs.com/package/bcryptjs](https://www.npmjs.com/package/bcryptjs) |
|            | Multer         | Middleware for handling `multipart/form-data`           | [https://www.npmjs.com/package/multer](https://www.npmjs.com/package/multer) |
|            | Docker         | Containerization platform                               | [https://www.docker.com/](https://www.docker.com/)    |
| **Frontend** | React          | JavaScript library for building user interfaces         | [https://react.dev/](https://react.dev/)              |
|            | Vite           | Next-generation frontend tooling                        | [https://vitejs.dev/](https://vitejs.dev/)            |
|            | Tailwind CSS   | Utility-first CSS framework                             | [https://tailwindcss.com/](https://tailwindcss.com/)  |
|            | React Router   | Declarative routing for React apps                      | [https://reactrouter.com/](https://reactrouter.com/)  |
|            | React Query    | Data-fetching, caching, and state management for React  | [https://tanstack.com/query/](https://tanstack.com/query/) |
|            | Axios          | Promise-based HTTP client                               | [https://axios-http.com/](https://axios-http.com/)    |
|            | Google OAuth   | User authentication via Google accounts                 | [https://developers.google.com/identity/one-tap/web/guides/use-google-button](https://developers.google.com/identity/one-tap/web/guides/use-google-button) |

## 🏁 Getting Started

Follow these steps to set up and run Finfom on your local machine.

### Prerequisites

*   Node.js (v18 or higher)
*   npm (v9 or higher) or Yarn
*   Docker & Docker Compose
*   A Cloudinary account for file storage
*   A Google Cloud Project for Google OAuth (optional, but recommended for full functionality)

### ⬇️ Cloning the Repository

```bash
git clone https://github.com/Webziro/Fom-app.git
cd Fom-app
```

### ⚙️ Environment Setup

Create a `.env` file in the `finfom-backend` directory based on the example below.

```dotenv
# .env in finfom-backend/

NODE_ENV=development
PORT=5000

# MongoDB (if not using Docker Compose default)
MONGODB_URI=mongodb://admin:password123@mongodb:27017/finfom?authSource=admin

# Redis (if not using Docker Compose default)
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret for authentication tokens
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRE=7d

# Cloudinary Credentials for file uploads
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Frontend URL for CORS configuration
CLIENT_URL=http://localhost:5173

# File upload restrictions (in bytes)
MAX_FILE_SIZE=10485760 # 10MB
ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.txt,.jpg,.png

# .env in finfom-frontend/ (for Google OAuth)
# Only if using Google OAuth on the frontend
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 🐳 Docker Compose Setup (Recommended for Local Services)

Navigate to the `finfom-backend` directory and start the MongoDB and Redis services:

```bash
cd finfom-backend
docker-compose up -d mongodb redis
```

This will start MongoDB on `localhost:27017` and Redis on `localhost:6379`. The backend application will connect to these services using their service names (`mongodb`, `redis`) within the Docker network.

### 📦 Backend Installation & Running

1.  Navigate to the `finfom-backend` directory:
    ```bash
    cd finfom-backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or yarn install
    ```
3.  Seed initial system groups (optional, but good for starting):
    ```bash
    npm run seed
    ```
4.  Start the backend server in development mode:
    ```bash
    npm run dev
    # or to run in production mode (requires `npm run build` first)
    # npm run build
    # npm start
    ```
    The backend API will be available at `http://localhost:5000`.

### 🌐 Frontend Installation & Running

1.  Navigate to the `finfom-frontend` directory:
    ```bash
    cd finfom-frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or yarn install
    ```
3.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    The frontend application will typically be available at `http://localhost:5173`.

## Finfom Backend API

### Overview
The Finfom Backend is a robust API server built with **Node.js** and **Express.js**, leveraging **TypeScript** for enhanced type safety and maintainability. It utilizes **MongoDB** for persistent data storage and **Redis** for efficient caching and rate limiting, ensuring a responsive and scalable experience. File uploads are seamlessly handled through **Cloudinary**, providing reliable cloud storage for various document types.

### Features
-   **Secure Authentication**: JWT-based authentication for user login, registration, and profile management, including Google OAuth.
-   **File Management**: Endpoints for uploading, retrieving, updating, and deleting documents with customizable visibility and password protection.
-   **Group Organization**: APIs to create, manage, and retrieve document groups, enabling structured content organization.
-   **Middleware Protection**: Implements `helmet`, `cors`, `compression`, `express-mongo-sanitize`, `xss-clean`, `hpp`, and `express-rate-limit` for comprehensive API security and performance.
-   **Logging**: Integrates `morgan` and `winston` for robust request and application logging.
-   **Containerization**: Dockerized setup for consistent development and production environments.
-   **Cache Layer**: Utilizes Redis for caching frequently accessed data to improve response times.

### Getting Started
Refer to the main "Getting Started" section above for comprehensive instructions on cloning the repository and setting up local services with Docker Compose.

#### Environment Variables
The following environment variables are required for the backend to function correctly. These should be set in a `.env` file within the `finfom-backend` directory.

*   **`NODE_ENV`**: `string` - Environment mode (e.g., `development`, `production`).
    *   Example: `NODE_ENV=development`
*   **`PORT`**: `number` - Port on which the server will run.
    *   Example: `PORT=5000`
*   **`MONGODB_URI`**: `string` - Connection string for MongoDB.
    *   Example: `MONGODB_URI=mongodb://admin:password123@mongodb:27017/finfom?authSource=admin`
*   **`REDIS_HOST`**: `string` - Hostname for the Redis server.
    *   Example: `REDIS_HOST=redis` (if using Docker Compose) or `REDIS_HOST=localhost`
*   **`REDIS_PORT`**: `number` - Port for the Redis server.
    *   Example: `REDIS_PORT=6379`
*   **`JWT_SECRET`**: `string` - Secret key for signing JWTs. **Crucial for security, must be strong.**
    *   Example: `JWT_SECRET=supersecretjwtkeythatisverylongandrandom`
*   **`JWT_EXPIRE`**: `string` - Expiration time for JWTs.
    *   Example: `JWT_EXPIRE=7d`
*   **`CLOUDINARY_CLOUD_NAME`**: `string` - Your Cloudinary cloud name.
    *   Example: `CLOUDINARY_CLOUD_NAME=mycloudaccount`
*   **`CLOUDINARY_API_KEY`**: `string` - Your Cloudinary API key.
    *   Example: `CLOUDINARY_API_KEY=123456789012345`
*   **`CLOUDINARY_API_SECRET`**: `string` - Your Cloudinary API secret. **Keep this secure.**
    *   Example: `CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456`
*   **`CLIENT_URL`**: `string` - The URL of your frontend application for CORS.
    *   Example: `CLIENT_URL=http://localhost:5173`
*   **`MAX_FILE_SIZE`**: `number` - Maximum allowed file size for uploads in bytes.
    *   Example: `MAX_FILE_SIZE=10485760` (10MB)
*   **`ALLOWED_FILE_TYPES`**: `string` - Comma-separated list of allowed file extensions.
    *   Example: `ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.txt,.jpg,.png`

### API Documentation

#### Base URL
`http://localhost:5000/api`

#### Endpoints

#### POST /api/auth/register
Registers a new user account.
**Request**:
```json
{
  "username": "stanleyamaziro",
  "email": "stanleyamaziro@gmail.com",
  "password": "StrongPassword123!"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "64f8a7b2c9d4e5f6a7b8c9d0",
    "username": "stanleyamaziro",
    "email": "stanleyamaziro@gmail.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
**Errors**:
- 400: User already exists with that email or username.
- 400: Username must be between 3 and 30 characters.
- 400: Invalid email format.
- 400: Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number and one special character.
- 500: Server error during registration.

#### POST /api/auth/login
Authenticates an existing user and returns a JWT.
**Request**:
```json
{
  "email": "stanleyamaziro@gmail.com",
  "password": "StrongPassword123!"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "64f8a7b2c9d4e5f6a7b8c9d0",
    "username": "stanleyamaziro",
    "email": "stanleyamaziro@gmail.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
**Errors**:
- 401: Invalid credentials.
- 500: Server error during login.

#### POST /api/auth/google
Authenticates or registers a user via Google OAuth access token.
**Request**:
```json
{
  "token": "google_access_token_string"
}
```
**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a7b2c9d4e5f6a7b8c9d0",
    "username": "stanleyamaziro",
    "email": "stanleyamaziro@gmail.com"
  }
}
```
**Errors**:
- 400: Google login failed.
- 400: Google account does not have an email.
- 500: Server error.

#### GET /api/auth/me
Retrieves the profile of the currently authenticated user.
**Request**:
_No body required. Requires `Authorization: Bearer <token>` header._
**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "64f8a7b2c9d4e5f6a7b8c9d0",
    "username": "stanleyamaziro",
    "email": "stanleyamaziro@gmail.com",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```
**Errors**:
- 401: Not authorized, no token or token failed.
- 404: User not found.
- 500: Server error.

#### PUT /api/auth/profile
Updates the profile information (username or email) for the authenticated user.
**Request**:
```json
{
  "username": "stanleyamaziro_updated",
  "email": "stanley.new@example.com"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "64f8a7b2c9d4e5f6a7b8c9d0",
    "username": "stanleyamaziro_updated",
    "email": "stanley.new@example.com",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```
**Errors**:
- 400: Username already taken.
- 400: Email already taken.
- 401: Not authorized.
- 404: User not found.
- 500: Server error.

#### PUT /api/auth/password
Changes the password for the authenticated user.
**Request**:
```json
{
  "currentPassword": "StrongPassword123!",
  "newPassword": "NewStrongPassword456!"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```
**Errors**:
- 400: Current password and new password are required.
- 400: New password must be different from current password.
- 400: Password does not meet complexity requirements.
- 401: Current password is incorrect.
- 401: Not authorized.
- 404: User not found.
- 500: Server error.

#### POST /api/files/upload
Uploads a new file to Cloudinary and saves its metadata to the database.
**Request**: `multipart/form-data`
```
Form Data:
- file: [binary file] (Required)
- title: "My Important Document" (Optional, defaults to original filename)
- description: "A detailed summary of the document." (Required)
- groupId: "64f8a7b2c9d4e5f6a7b8c9d0" (Required, ID of the group the file belongs to)
- visibility: "private" | "public" | "password" (Optional, default: "private")
- password: "secret123" (Required if visibility is "password")
```
**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "64f8a7b2c9d4e5f6a7b8c9d1",
    "title": "My Important Document",
    "description": "A detailed summary of the document.",
    "uploaderId": "64f8a7b2c9d4e5f6a7b8c9d0",
    "groupId": "64f8a7b2c9d4e5f6a7b8c9d0",
    "cloudinaryId": "finfom-uploads/unique_id",
    "url": "http://res.cloudinary.com/...",
    "secureUrl": "https://res.cloudinary.com/...",
    "visibility": "private",
    "size": 1048576,
    "fileType": "application/pdf",
    "downloads": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "File uploaded and saved successfully!"
}
```
**Errors**:
- 400: No file uploaded.
- 400: Group selection is required.
- 400: File description is required.
- 401: User not authenticated.
- 404: Selected group does not exist.
- 500: Failed to upload to Cloudinary.
- 500: Failed to save new file metadata to database.
- 500: Server error during upload.

#### GET /api/files
Retrieves files uploaded by the authenticated user, or public files. Supports pagination and search.
**Request**: `GET /api/files?page=1&limit=10&search=document`
_No body required. Requires `Authorization: Bearer <token>` header._
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a7b2c9d4e5f6a7b8c9d1",
      "title": "My Document",
      "description": "Important document",
      "uploaderId": { "_id": "64f8a7b2c9d4e5f6a7b8c9d0", "username": "stanleyamaziro" },
      "groupId": { "_id": "64f8a7b2c9d4e5f6a7b8c9d0", "title": "Work Documents" },
      "visibility": "private",
      "size": 1048576,
      "fileType": "application/pdf",
      "downloads": 5,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```
**Errors**:
- 401: Not authorized.
- 500: Server error.

#### GET /api/files/public
Retrieves all public files. Supports pagination and search.
**Request**: `GET /api/files/public?page=1&limit=10&search=report`
_No body required._
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a7b2c9d4e5f6a7b8c9d2",
      "title": "Public Annual Report",
      "description": "Annual financial report for public viewing.",
      "uploaderId": { "_id": "64f8a7b2c9d4e5f6a7b8c9d0", "username": "stanleyamaziro" },
      "groupId": { "_id": "64f8a7b2c9d4e5f6a7b8c9d0", "title": "Company Reports" },
      "visibility": "public",
      "size": 2048576,
      "fileType": "application/pdf",
      "downloads": 15,
      "createdAt": "2024-01-10T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```
**Errors**:
- 500: Server error.

#### GET /api/files/:id
Retrieves a single file by its ID. For password-protected files, requires a password in the request body.
**Request**: `GET /api/files/64f8a7b2c9d4e5f6a7b8c9d1`
_No body for public/private. For password-protected:_
```json
{
  "password": "secret123"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "64f8a7b2c9d4e5f6a7b8c9d1",
    "title": "My Document",
    "description": "Important document",
    "uploaderId": { "_id": "64f8a7b2c9d4e5f6a7b8c9d0", "username": "stanleyamaziro", "email": "stanleyamaziro@gmail.com" }, 
    "groupId": { "_id": "64f8a7b2c9d4e5f6a7b8c9d0", "title": "Work Documents" },
    "cloudinaryId": "finfom-uploads/unique_id",
    "url": "http://res.cloudinary.com/...",
    "secureUrl": "https://res.cloudinary.com/...",
    "visibility": "public",
    "size": 1048576,
    "fileType": "application/pdf",
    "downloads": 5,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```
**Errors**:
- 401: Password required (for password-protected files).
- 401: Incorrect password (for password-protected files).
- 403: Access denied (for private files not owned by user).
- 404: File not found.
- 500: Server error.

#### POST /api/files/:id/download
Initiates a download for a specific file by its ID. Increments the download count. For password-protected files, requires a password in the request body.
**Request**: `POST /api/files/64f8a7b2c9d4e5f6a7b8c9d1/download`
_No body for public/private. For password-protected:_
```json
{
  "password": "secret123"
}
```
**Response**:
_Direct file stream (binary data) with `Content-Disposition` header set to prompt download. No JSON response for success._
**Errors**:
- 403: Access denied (for private files not owned by user).
- 404: File not found.
- 500: Error downloading file.
- 500: Server error.

#### PUT /api/files/:id
Updates the metadata (title, description, group, visibility, password) of a file.
**Request**: `PUT /api/files/64f8a7b2c9d4e5f6a7b8c9d1`
```json
{
  "title": "Updated Document Title",
  "description": "This is an updated description for the document.",
  "groupId": "64f8a7b2c9d4e5f6a7b8c9d5",
  "visibility": "public",
  "password": ""
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "64f8a7b2c9d4e5f6a7b8c9d1",
    "title": "Updated Document Title",
    "description": "This is an updated description for the document.",
    "uploaderId": "64f8a7b2c9d4e5f6a7b8c9d0",
    "groupId": { "_id": "64f8a7b2c9d4e5f6a7b8c9d5", "title": "New Category" },
    "cloudinaryId": "finfom-uploads/unique_id",
    "url": "http://res.cloudinary.com/...",
    "secureUrl": "https://res.cloudinary.com/...",
    "visibility": "public",
    "size": 1048576,
    "fileType": "application/pdf",
    "downloads": 6,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:40:00.000Z"
  }
}
```
**Errors**:
- 400: Invalid group.
- 403: Not authorized (only uploader can update).
- 404: File not found.
- 500: Server error.

#### DELETE /api/files/:id
Deletes a file from both Cloudinary and the database.
**Request**: `DELETE /api/files/64f8a7b2c9d4e5f6a7b8c9d1`
_No body required. Requires `Authorization: Bearer <token>` header._
**Response**:
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```
**Errors**:
- 403: Not authorized (only uploader can delete).
- 404: File not found.
- 500: Server error.

#### POST /api/groups
Creates a new group.
**Request**:
```json
{
  "title": "Work Documents",
  "description": "All work-related files and reports."
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "64f8a7b2c9d4e5f6a7b8c9d0",
    "title": "work documents",
    "displayName": "Work Documents",
    "description": "All work-related files and reports.",
    "ownerId": "64f8a7b2c9d4e5f6a7b8c9d0",
    "fileCount": 0,
    "isSystem": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```
**Errors**:
- 400: Group title is required.
- 401: Not authorized.
- 500: Server error.

#### POST /api/groups/create-or-get
Creates a new group if it doesn't exist, or returns an existing one.
**Request**:
```json
{
  "groupName": "Company Projects"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "64f8a7b2c9d4e5f6a7b8c9d0",
    "title": "company projects",
    "displayName": "Company Projects",
    "description": "Group for Company Projects",
    "ownerId": "64f8a7b2c9d4e5f6a7b8c9d0",
    "fileCount": 0,
    "isSystem": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```
**Errors**:
- 400: Group name is required.
- 401: Not authorized.
- 500: Server error.

#### GET /api/groups
Retrieves all groups (both user-owned and system groups).
**Request**: `GET /api/groups`
_No body required. Requires `Authorization: Bearer <token>` header._
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a7b2c9d4e5f6a7b8c9d0",
      "title": "work documents",
      "displayName": "Work Documents",
      "description": "All work-related files",
      "ownerId": "64f8a7b2c9d4e5f6a7b8c9d0",
      "fileCount": 5,
      "isSystem": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "65b8a7b2c9d4e5f6a7b8c9e0",
      "title": "technology",
      "displayName": "Technology",
      "description": "All things tech and innovation",
      "isSystem": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```
**Errors**:
- 401: Not authorized.
- 500: Server error.

#### GET /api/groups/my-groups
Retrieves all groups owned by the authenticated user.
**Request**: `GET /api/groups/my-groups`
_No body required. Requires `Authorization: Bearer <token>` header._
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a7b2c9d4e5f6a7b8c9d0",
      "title": "work documents",
      "displayName": "Work Documents",
      "description": "All work-related files",
      "ownerId": "64f8a7b2c9d4e5f6a7b8c9d0",
      "fileCount": 5,
      "isSystem": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```
**Errors**:
- 401: Not authorized.
- 500: Server error.

#### GET /api/groups/:id
Retrieves a single group by its ID.
**Request**: `GET /api/groups/64f8a7b2c9d4e5f6a7b8c9d0`
_No body required. Requires `Authorization: Bearer <token>` header._
**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "64f8a7b2c9d4e5f6a7b8c9d0",
    "title": "work documents",
    "displayName": "Work Documents",
    "description": "All work-related files",
    "ownerId": "64f8a7b2c9d4e5f6a7b8c9d0",
    "fileCount": 5,
    "isSystem": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```
**Errors**:
- 401: Not authorized.
- 404: Group not found.
- 500: Server error.

#### GET /api/groups/:id/files
Retrieves all files belonging to a specific group.
**Request**: `GET /api/groups/64f8a7b2c9d4e5f6a7b8c9d0/files`
_No body required. Requires `Authorization: Bearer <token>` header._
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a7b2c9d4e5f6a7b8c9d1",
      "title": "Grouped Doc 1",
      "description": "First document in this group.",
      "uploaderId": "64f8a7b2c9d4e5f6a7b8c9d0",
      "groupId": "64f8a7b2c9d4e5f6a7b8c9d0",
      "cloudinaryId": "finfom-uploads/group_doc_1",
      "url": "http://res.cloudinary.com/...",
      "secureUrl": "https://res.cloudinary.com/...",
      "visibility": "private",
      "size": 512000,
      "fileType": "application/pdf",
      "downloads": 2,
      "createdAt": "2024-01-15T10:31:00.000Z",
      "updatedAt": "2024-01-15T10:31:00.000Z"
    }
  ]
}
```
**Errors**:
- 401: Not authorized.
- 404: Group not found.
- 500: Server error.

#### PUT /api/groups/:id
Updates the title or description of a group.
**Request**: `PUT /api/groups/64f8a7b2c9d4e5f6a7b8c9d0`
```json
{
  "title": "Updated Work Documents",
  "description": "This group now contains updated work-related files."
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "64f8a7b2c9d4e5f6a7b8c9d0",
    "title": "updated work documents",
    "displayName": "Updated Work Documents",
    "description": "This group now contains updated work-related files.",
    "ownerId": "64f8a7b2c9d4e5f6a7b8c9d0",
    "fileCount": 5,
    "isSystem": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:45:00.000Z"
  }
}
```
**Errors**:
- 401: Not authorized.
- 403: Not authorized (only owner can update).
- 404: Group not found.
- 500: Server error.

#### DELETE /api/groups/:id
Deletes a group. All files previously associated with this group will have their `groupId` unlinked (set to `null`).
**Request**: `DELETE /api/groups/64f8a7b2c9d4e5f6a7b8c9d0`
_No body required. Requires `Authorization: Bearer <token>` header._
**Response**:
```json
{
  "success": true,
  "message": "Group deleted successfully"
}
```
**Errors**:
- 401: Not authorized.
- 403: Not authorized (only owner can delete).
- 404: Group not found.
- 500: Server error.

## 🖥️ Usage

Once both the backend and frontend are running:

1.  **Access the Frontend**: Open your web browser and navigate to `http://localhost:5173`.
2.  **Register / Login**: Create a new account using the registration page or log in with existing credentials. You can also use Google for quick authentication.
3.  **Dashboard**: Upon successful login, you'll be redirected to the dashboard, providing an overview of your files and groups.
4.  **Files Management**:
    *   Navigate to the "My Files" section.
    *   Click "Upload File" to add new documents. Provide a title, description, select or create a group, and choose its visibility (private, public, or password-protected).
    *   Browse, search, and filter your uploaded files.
    *   Click on a file to view its preview (if supported) and access download options.
    *   Use the context menu (`...`) for download and delete actions.
5.  **Group Management**:
    *   Go to the "Groups" section.
    *   Create new groups to categorize your documents.
    *   Each group can hold multiple files, helping you maintain a structured archive.
6.  **Profile Settings**: Update your username, email, or change your password from the "Profile" page.

## 🤝 Contributing

We welcome contributions to the Finfom project! If you'd like to contribute, please follow these guidelines:

*   **Fork the repository** 🍴
*   **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-feature-name`
*   **Make your changes**, ensuring consistent code style and adding appropriate tests.
*   **Write clear and concise commit messages** 📝
*   **Push your branch** and submit a **pull request** 📤
*   **Describe your changes** in detail in the pull request description.

## 📝 License

This project is licensed under the MIT License.

## 🧑‍💻 Author Info

*   **Your Name**: [Stanley Amaziro](https://stanleyamaziro.netlify.app/)
*   **LinkedIn**: [https://www.linkedin.com/in/stanleyamaziro](https://www.linkedin.com/in/stanleyamaziro)  
*   **Twitter**: [https://twitter.com/amazirostanley](https://twitter.com/amazirostanley)

---
[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)