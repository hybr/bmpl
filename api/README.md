# BMPL Moleculer Microservices API

Backend API for the BMPL application using Moleculer microservices framework.

## Features

- **Moleculer Microservices**: Scalable microservices architecture
- **JWT Authentication**: Secure token-based authentication
- **CouchDB Integration**: Direct integration with CouchDB for data persistence
- **RESTful API**: Clean REST endpoints via API Gateway
- **User Management**: User search and profile retrieval
- **Organization Management**: Organization search and membership queries
- **Common Data**: Organization legal types and reference data

## Prerequisites

- Node.js 14+ installed
- CouchDB running on localhost:5984 (or configure in .env)
- Required databases created in CouchDB:
  - `bmpl_users`
  - `bmpl_organizations`
  - `bmpl_common`
  - `bmpl_members`

## Installation

```bash
cd api
npm install
```

## Configuration

Edit `.env` file to configure:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# CouchDB Configuration
COUCHDB_URL=http://localhost:5984
COUCHDB_USER=admin
COUCHDB_PASSWORD=password

# Database Names
DB_USERS=bmpl_users
DB_ORGANIZATIONS=bmpl_organizations
DB_COMMON=bmpl_common

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:8080
```

## Running the API

```bash
# Production mode
npm start

# Development mode
npm run dev
```

The API will start on `http://localhost:3000`

## API Endpoints

### Authentication

#### POST /api/auth/login
Login user and get JWT token

**Request:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user:johndoe",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

#### POST /api/auth/register
Register new user

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

### Users (Authenticated)

#### POST /api/users/search
Search users by query

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "query": "john",
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "user:johndoe",
      "username": "johndoe",
      "email": "john@example.com",
      "name": "John Doe"
    }
  ]
}
```

#### GET /api/users/:id
Get user by ID

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user:johndoe",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

### Organizations (Authenticated)

#### POST /api/organizations/search
Search organizations

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "query": "tech",
  "limit": 10,
  "filters": {
    "industry": "Technology",
    "legalType": "LLC"
  }
}
```

**Response:**
```json
{
  "success": true,
  "organizations": [
    {
      "_id": "org:techcorp",
      "shortName": "TechCorp",
      "fullName": "TechCorp LLC",
      "industry": "Technology",
      "legalType": "LLC"
    }
  ]
}
```

#### GET /api/organizations/:id
Get organization by ID

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "organization": {
    "_id": "org:techcorp",
    "shortName": "TechCorp",
    "fullName": "TechCorp LLC"
  }
}
```

#### GET /api/organizations/user-memberships
Get organizations where current user is a member

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "organizations": [
    {
      "_id": "org:techcorp",
      "shortName": "TechCorp",
      "fullName": "TechCorp LLC"
    }
  ]
}
```

### Common Data (Authenticated)

#### GET /api/common/legal-types
Get organization legal types

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `country` (optional): Filter by country ISO code (e.g., "US")
- `search` (optional): Search query
- `limit` (optional): Maximum results (default: 100)
- `activeOnly` (optional): Return only active types (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "organization_legal_type:us:llc",
      "type": "organization_legal_type",
      "country_iso_code": "US",
      "country_name": "United States",
      "legal_type": "LLC",
      "full_name": "Limited Liability Company",
      "abbreviation": "LLC",
      "is_active": true
    }
  ]
}
```

## Architecture

```
/api
├── /services
│   ├── api.service.js           # API Gateway (HTTP entry point)
│   ├── auth.service.js          # Authentication & JWT
│   ├── users.service.js         # User operations
│   ├── organizations.service.js # Organization operations
│   └── common.service.js        # Common/reference data
├── /middlewares
│   └── auth.middleware.js       # JWT authentication middleware
├── moleculer.config.js          # Moleculer configuration
├── .env                         # Environment variables
├── index.js                     # Entry point
└── package.json
```

## Services

### API Gateway Service
- Routes HTTP requests to appropriate services
- Handles CORS
- Applies authentication middleware

### Auth Service
- User login and registration
- JWT token generation
- Password validation

### Users Service
- User search
- User retrieval by ID
- Excludes passwords from responses

### Organizations Service
- Organization search with filters
- Organization retrieval by ID
- User membership queries

### Common Service
- Organization legal types
- Country-specific legal types
- Reference data management

## Security

- **JWT Authentication**: All endpoints (except auth) require valid JWT token
- **Password Hashing**: TODO - Implement bcrypt for password hashing in production
- **CORS**: Configurable CORS origin in .env
- **Data Sanitization**: Passwords excluded from all API responses

## Development

### Adding a New Service

1. Create service file in `/services` directory
2. Export Moleculer service definition
3. Define actions with validation
4. Implement methods for database access
5. Broker will auto-load on startup

### Testing Endpoints

Use curl or Postman:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Search users (with token)
curl -X POST http://localhost:3000/api/users/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query":"john","limit":10}'
```

## Production Deployment

1. Set `NODE_ENV=production` in .env
2. Change `JWT_SECRET` to a strong random value
3. Implement password hashing with bcrypt
4. Configure proper COUCHDB_URL for production database
5. Set up process manager (PM2, systemd, Docker)
6. Enable HTTPS/SSL
7. Configure firewall rules
8. Set up logging and monitoring

## TODO

- [ ] Implement bcrypt password hashing
- [ ] Add rate limiting
- [ ] Add request validation middleware
- [ ] Implement refresh tokens
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Set up CI/CD pipeline
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement role-based access control (RBAC)
- [ ] Add database migration scripts
