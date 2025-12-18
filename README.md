# Finfom API

## Overview
Finfom is a robust document management and secure sharing platform built using Node.js, Express, and TypeScript. It leverages a modern microservice-ready architecture to handle file versioning, granular access control, and real-time analytics for digital assets.

## Tools
- Node.js & TypeScript: High-performance server-side logic with static typing for maintainability.
- MongoDB & Mongoose: Flexible NoSQL data modeling for documents, folders, and group structures.
- Redis: In-memory data store used for API response caching to optimize public resource access.
- Cloudinary: Integrated cloud storage for secure asset hosting and optimized file delivery.
- Multer: Efficient handling of multipart/form-data for seamless document uploads.
- JWT: Stateless authentication mechanism using JSON Web Tokens for secure session management.
- Winston & Morgan: Comprehensive logging suite for auditing HTTP traffic and system events.

## Getting Started
### Installation
1. Clone the repository:
```bash
git clone https://github.com/Webziro/Fom-app.git
```
2. Navigate to the backend directory:
```bash
cd finfom-backend
```
3. Install production and development dependencies:
```bash
npm install
```
4. Seed the system groups (Technology, Business, etc.):
```bash
npm run seed
```
5. Launch the development server:
```bash
npm run dev
```

### Environment Variables
Create a `.env` file in the backend root and configure the following:
```text
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/finfom
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret_key
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
FROM_EMAIL=no-reply@finfom.com
```

## API Documentation
### Base URL
`http://localhost:5000`

### Endpoints

#### POST /api/auth/register
**Request**:
```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "StrongPassword123!"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "64f8a7b2c9d4e5f6a7b8c9d0",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
**Errors**:
- 400: User already exists or validation failed (password too weak, invalid email).

#### POST /api/auth/login
**Request**:
```json
{
  "email": "john.doe@example.com",
  "password": "StrongPassword123!"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "64f8a7b2c9d4e5f6a7b8c9d0",
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
}
```
**Errors**:
- 401: Invalid credentials.

#### POST /api/files/upload
**Request**:
_Multipart Form Data_
- `file`: binary data (PDF, JPG, PNG, DOCX)
- `title`: "Quarterly Report"
- `description`: "Final version for Q3"
- `groupId`: "64f8a..."
- `visibility`: "private" | "public" | "password"
- `password`: "secret123" (if visibility is password)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "64f8a7b2c9d4e5f6a7b8c9d1",
    "title": "Quarterly Report",
    "url": "https://res.cloudinary.com/...",
    "currentVersion": 1
  }
}
```
**Errors**:
- 400: Missing required fields or invalid file type.

#### GET /api/files
**Request**:
`GET /api/files?page=1&limit=10&search=report&folderId=64f...`
_Header: Authorization: Bearer <token>_

**Response**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 25,
    "pages": 3
  }
}
```

#### POST /api/files/:id/download
**Request**:
```json
{
  "password": "secret123"
}
```
**Response**:
_Binary stream with Content-Disposition header_

**Errors**:
- 403: Access denied (private file or incorrect password).

#### GET /api/files/analytics
**Request**:
_Header: Authorization: Bearer <token>_

**Response**:
```json
{
  "success": true,
  "data": {
    "totalDownloads": 150,
    "storageUsed": 10485760,
    "topFiles": [...],
    "fileTypes": [{"_id": "application/pdf", "count": 10}]
  }
}
```

#### POST /api/groups
**Request**:
```json
{
  "title": "work_docs",
  "description": "Professional documentation"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "64f8a7b2c9d4e5...",
    "displayName": "Work docs"
  }
}
```

#### POST /api/files/folders
**Request**:
```json
{
  "title": "Tax Returns 2024",
  "description": "Financial folders"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "64f8a7...",
    "title": "Tax Returns 2024"
  }
}
```

## Technologies Used
| Technology | Description | Link |
| :--- | :--- | :--- |
| Node.js | JavaScript Runtime | [Link](https://nodejs.org/) |
| TypeScript | Typed JavaScript | [Link](https://www.typescriptlang.org/) |
| Express | Web Framework | [Link](https://expressjs.com/) |
| MongoDB | NoSQL Database | [Link](https://www.mongodb.com/) |
| Redis | Caching Engine | [Link](https://redis.io/) |
| Cloudinary | Cloud Storage | [Link](https://cloudinary.com/) |
| Vite | Frontend Tooling | [Link](https://vitejs.dev/) |
| Tailwind CSS | Utility-first CSS | [Link](https://tailwindcss.com/) |

## Contributing
- Fork the repository.
- Create a new feature branch (`git checkout -b feature/NewFeature`).
- Commit your changes with descriptive messages.
- Push to the branch (`git push origin feature/NewFeature`).
- Open a Pull Request for review.

## Author Info
**Project Lead**
- GitHub: [Webziro](https://github.com/Webziro)
- Twitter: [Placeholder]
- LinkedIn: [Placeholder]

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)