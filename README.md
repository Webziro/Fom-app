# Finfom API

## Overview
Finfom is a robust document management backend built with Node.js, TypeScript, and Express. It provides a secure infrastructure for file versioning, content deduplication via MD5 hashing, and granular access controls for private and public sharing.

## Features
- TypeScript: Strongly typed codebase for maintainability and error prevention.
- MongoDB: NoSQL database for flexible document and folder metadata management.
- Redis: Integrated caching layer to optimize public file access and group queries.
- Cloudinary: Cloud-based storage for high-availability binary file hosting.
- JWT & OAuth: Secure authentication via JSON Web Tokens and Google login integration.
- Docker: Containerized environment for consistent deployment across stages.

## Getting Started
### Installation
1. Clone the Repository:
```bash
git clone https://github.com/Webziro/Fom-app.git
cd finfom-backend
```

2. Install Dependencies:
```bash
npm install
```

3. Setup Services:
```bash
docker-compose up -d
```

4. Seed System Groups:
```bash
npm run seed
```

### Environment Variables
Create a `.env` file in the root directory:
```text
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finfom
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_NAME=Finfom
FROM_EMAIL=noreply@finfom.com
```

## API Documentation
### Base URL
`http://localhost:5000/api`

### Endpoints

#### POST /auth/register
**Request**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "StrongPassword123!"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "64f8a7...",
    "username": "johndoe",
    "email": "john@example.com",
    "token": "eyJhbGci..."
  }
}
```
**Errors**:
- 400: User already exists or validation failed.

#### POST /auth/login
**Request**:
```json
{
  "email": "john@example.com",
  "password": "StrongPassword123!"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci..."
  }
}
```
**Errors**:
- 401: Invalid credentials.

#### POST /auth/google
**Request**:
```json
{
  "token": "google_access_token"
}
```
**Response**:
```json
{
  "token": "jwt_token",
  "user": { "id": "...", "username": "..." }
}
```

#### GET /auth/me
**Request**:
- Headers: `Authorization: Bearer <token>`
**Response**:
```json
{
  "success": true,
  "data": { "username": "johndoe", "email": "..." }
}
```

#### POST /files/upload
**Request**:
- Content-Type: `multipart/form-data`
- Body: `file` (Binary), `title`, `description`, `groupId`, `visibility` (public|private|password), `password` (optional)
**Response**:
```json
{
  "success": true,
  "data": {
    "title": "Document.pdf",
    "url": "https://res.cloudinary.com/...",
    "currentVersion": 1
  }
}
```

#### GET /files
**Request**:
- Query: `page`, `limit`, `search`, `folderId`
**Response**:
```json
{
  "success": true,
  "data": [],
  "pagination": { "total": 0, "pages": 0 }
}
```

#### POST /files/:id/access
**Request**:
- Body: `{ "password": "..." }` (Required if visibility is "password")
**Response**:
```json
{
  "success": true,
  "data": { "secureUrl": "...", "title": "..." }
}
```

#### POST /files/:id/download
**Request**:
- Headers: `Authorization: Bearer <token>` (if private)
**Response**:
- File Stream (Binary)

#### GET /files/analytics
**Request**:
- Headers: `Authorization: Bearer <token>`
**Response**:
```json
{
  "success": true,
  "data": {
    "totalDownloads": 150,
    "storageUsed": 1048576,
    "fileTypes": [{ "_id": "application/pdf", "count": 5 }]
  }
}
```

#### POST /files/folders
**Request**:
```json
{
  "title": "Work Folders",
  "description": "Important work files",
  "parentFolder": "id_if_nested"
}
```
**Response**:
```json
{
  "success": true,
  "data": { "id": "...", "title": "Work Folders" }
}
```

#### GET /groups
**Request**:
- Headers: `Authorization: Bearer <token>`
**Response**:
```json
{
  "success": true,
  "data": [
    { "title": "tech", "displayName": "Technology", "isSystem": true }
  ]
}
```

#### POST /groups
**Request**:
```json
{
  "title": "Custom Group",
  "description": "My custom collection"
}
```

## Technologies Used
| Technology | Purpose | Link |
| :--- | :--- | :--- |
| TypeScript | Language | [Website](https://www.typescriptlang.org/) |
| Node.js | Runtime | [Website](https://nodejs.org/) |
| Express | Framework | [Website](https://expressjs.com/) |
| MongoDB | Database | [Website](https://www.mongodb.com/) |
| Redis | Caching | [Website](https://redis.io/) |
| Cloudinary | Storage | [Website](https://cloudinary.com/) |
| Docker | Deployment | [Website](https://www.docker.com/) |

## Usage
The API is designed for a frontend consumer (React/Vite). To use the file versioning system, upload a file with the same title as an existing one within the same group; the backend will automatically archive the previous version and increment the version counter. For shared files, public links are generated based on the file ID, with optional password protection verified server-side.

## Contributing
- Fork the project and create a new branch.
- Ensure all TypeScript types are correctly defined.
- Follow the existing middleware pattern for security and logging.
- Submit a pull request with a detailed description of changes.

## Author Info
- Github: [Webziro](https://github.com/Webziro)
- Twitter: [Placeholder]
- LinkedIn: [Placeholder]

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)