# Cairn Backend API

A RESTful API for managing scientific research projects, researchers, and impact verification on the Cairn platform.

## Features

- **User Management**: Registration, authentication, and profile management
- **Project Management**: Create, retrieve, and manage research projects with status tracking
- **Project Status Tracking**: Support for project lifecycle (Draft → Pending Evaluation → Evaluated → Funded)
- **PoR (Proof of Reproducibility) Management**: Track PoR status through phases (InReview → Phase1/Phase2)
- **Funding Tracking**: Track funded amounts for projects
- **Enhanced Project Metadata**: Support for project descriptions and licensing information
- **Authentication**: JWT-based authentication with secure token management
- **Validation**: Comprehensive input validation and error handling
- **Database**: MongoDB with Mongoose ODM for data persistence

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=24h
   JWT_REFRESH_SECRET=your_refresh_secret_key
   JWT_REFRESH_EXPIRE=7d
   ```

3. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Verify setup**
   ```bash
   curl http://localhost:3000/health
   ```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/v1/users/signup` - Register new user
- `POST /api/v1/users/login` - User login

### Projects
- `GET /api/v1/projects` - Get all projects
- `GET /api/v1/projects/:id` - Get project by ID
- `GET /api/v1/projects/field/:field` - Get projects by research field
- `POST /api/v1/projects` - Create new project (authenticated)

## Usage Examples

### User Registration
```bash
curl -X POST http://localhost:3000/api/v1/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "researcher1",
    "email": "researcher@example.com",
    "password": "SecurePass123!",
    "role": "researcher",
    "address": "0x742d35Cc6635C0532925a3b8D456deDc35CD8901",
    "profile": {
      "firstName": "Jane",
      "lastName": "Doe"
    }
  }'
```

### User Login
```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "researcher@example.com",
    "password": "SecurePass123!"
  }'
```

### Create Project
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Machine Learning for Climate Prediction",
    "field": "ml",
    "description": "Advanced machine learning techniques for accurate climate modeling and prediction.",
    "project_status": "Pending Evaluation",
    "por_status": "Phase1",
    "funded_amount": 50000,
    "paper": {
      "doi": "10.1234/example.2024",
      "title": "Deep Learning for Weather Forecasting",
      "abstract": "Advanced ML techniques for climate modeling."
    },
    "huggingface": {
      "repo_url": "https://huggingface.co/user/climate-model",
      "commit_hash": "abc123def456",
      "licence": "Apache-2.0"
    },
    "por": {
      "por_cid": "QmX1234567890abcdefghijklmnopqrstuvwxyzABCDEF"
    }
  }'
```

### Get All Projects
```bash
# Get all projects
curl -X GET http://localhost:3000/api/v1/projects

```

## Data Models

### User
```javascript
{
  email: String (optional, unique),
  username: String (optional, unique),
  address: String (optional, unique, Ethereum address),
  password: String (required, hashed),
  role: String (researcher|funder|admin),
  profile: {
    firstName: String,
    lastName: String,
    bio: String
  }
}
```

### Project
```javascript
{
  title: String (required, 3-200 chars),
  researcher_id: ObjectId (required, references User),
  field: String (llm|vision|nlp|robotics|ml|ai|other),
  description: String (optional, max 500 chars),
  project_status: String (Draft|Pending Evaluation|Evaluated|Funded, default: Draft),
  por_status: String (InReview|Disputed|Phase1|Phase2, default: InReview),
  funded_amount: Number (optional, non-negative, default: 0),
  paper: {
    doi: String (optional, DOI format),
    arxiv_id: String (optional, arXiv format),
    title: String (optional, max 300 chars),
    abstract: String (optional, max 5000 chars)
  },
  huggingface: {
    repo_url: String (optional, HuggingFace URL),
    commit_hash: String (optional, hex format),
    files: String (optional, semicolon-separated),
    licence: String (optional, default: MIT)
  },
  por: {
    por_cid: String (optional, IPFS CID format)
  }
}
```

## Validation Rules

### User Validation
- **Email**: Valid email format, unique
- **Username**: 3-30 characters, alphanumeric with underscores/hyphens, unique
- **Password**: Minimum 8 characters, must contain uppercase, lowercase, and number
- **Address**: Valid Ethereum address format (0x + 40 hex characters), unique

### Project Validation
- **Title**: 3-200 characters, required
- **Field**: Must be one of the predefined research fields (llm|vision|nlp|robotics|ml|ai|other)
- **Description**: Optional, maximum 500 characters
- **Project Status**: Must be one of: Draft, Pending Evaluation, Evaluated, Funded
- **PoR Status**: Must be one of: InReview, Disputed, Phase1, Phase2
- **Funded Amount**: Non-negative number, defaults to 0
- **DOI**: Standard DOI format (10.xxxx/xxxxx)
- **arXiv ID**: arXiv format (YYYY.NNNNN)
- **HuggingFace URL**: Valid HuggingFace repository URL
- **HuggingFace Licence**: String, defaults to "MIT"
- **IPFS CID**: Valid IPFS content identifier format

## Error Handling

The API returns consistent error responses:

```javascript
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "type": "field",
      "value": "invalid_value",
      "msg": "Specific error message",
      "path": "field_name",
      "location": "body"
    }
  ]
}
```

## Security

- JWT tokens for authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting and CORS protection
- Secure HTTP headers with Helmet

## Development

### Scripts
- `npm run dev` - Development mode with nodemon
- `npm start` - Production mode
- `npm test` - Run tests (when implemented)

### Project Structure
```
src/
├── controllers/     # Request handlers
├── middleware/      # Authentication, validation, error handling
├── models/         # MongoDB schemas
├── routes/         # API route definitions
├── services/       # Business logic
├── utils/          # Utility functions
└── server.js       # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is part of the Cairn ecosystem for scientific research impact verification.