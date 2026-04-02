# Backend API Documentation

## Quick Start

```bash
# Install dependencies
npm install

# Configure .env file
# See .env.example for required variables

# Start development server
npm run dev

# Start production server
npm start
```

## Architecture Overview

### Folder Structure Rationale

- **config/**: Initialization (database connection)
- **middlewares/**: Request processing (auth, error handling)
- **models/**: Data schemas (describe what data looks like)
- **controllers/**: Business logic (what to do with data)
- **routes/**: HTTP endpoints (which URLs map to which controllers)
- **utils/**: Helper functions (JWT generation, Socket.io setup)

### Request Flow

```
HTTP Request → Route → Middleware (Auth Check) 
  → Controller (Logic) → Database (MongoDB) 
  → Response back to Frontend
```

### Real-Time Event Flow (Socket.io)

```
Frontend: socket.emit('task:move', {...})
  ↓
Backend: socket.on('task:move', async (data) => { ... })
  ↓
Database: Update task status
  ↓
Backend: io.to('board-123').emit('task:updated', {...})
  ↓
All Frontends in room: socket.on('task:updated', (data) => {...})
  ↓
React: Update state → Re-render UI
```

## Authentication Detailed Flow

### JWT Token Structure

```javascript
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload (decoded)
{
  "userId": "60d5ec49c1234567890abcde",
  "email": "user@example.com",
  "iat": 1639478400,           // issued at
  "exp": 1640083200            // expires in 7 days
}

// Signature
HMACSHA256(
  base64UrlEncode(header) + "." + 
  base64UrlEncode(payload),
  JWT_SECRET
)
```

### How Auth Middleware Works

1. **Request comes in**: `GET /api/boards`
2. **Route finds protect middleware**: Checks if endpoint requires auth
3. **Middleware extracts token**: Looks in `Authorization: Bearer {token}` header
4. **Verifies signature**: Uses JWT_SECRET to confirm token wasn't tampered
5. **Checks expiration**: Ensures token isn't old
6. **Adds user to request**: `req.user = { userId, email, ... }`
7. **Calls next()**: Allows controller to run

### How Password Hashing Works

```javascript
// User enters password: "myPassword123"

// During signup:
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash("myPassword123", salt);
// hashedPassword: "$2b$10$..."

// Store in database: "$2b$10$..."  (NOT "myPassword123")

// During login:
const inputPassword = "myPassword123";
const matches = await bcrypt.compare(
  inputPassword,
  "$2b$10$..."  // from database
);
// Returns: true or false
```

## Database Schema Relationships

```
User (1) -------- (many) Board
 ^                         |
 |                         |
 +- assigned to      owns/contains
   Task                     |
                            |
                      (1) --+-- (many) Task
                                        |
                                        |
                                   (many) Comment
                                        ^
                                        |
                                    written by
                                        |
                                      User
```

## Socket.io Rooms Explained

```javascript
// User opens Board #123
socket.emit('user:join-board', { boardId: '123' });

// Backend adds socket to room
socket.join('board-123');

// Now socket is in room. When task moves:
io.to('board-123').emit('task:updated', {...});

// All sockets in that room receive message
// Users viewing different boards don't get the update
```

## Common Patterns Used

### 1. **Pre-Save Hook (Mongoose)**
```javascript
schema.pre('save', async function(next) {
  // Runs BEFORE saving to database
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
```

### 2. **Instance Methods (Mongoose)**
```javascript
schema.methods.matchPassword = async function(incomingPassword) {
  return await bcrypt.compare(incomingPassword, this.password);
};

// Usage:
const user = await User.findById(id);
const matches = await user.matchPassword('password123');
```

### 3. **Request Interceptor (Axios)**
```javascript
// Automatically add token to EVERY request
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

## Error Handling Strategy

### Standard Error Response
```javascript
{
  success: false,
  message: "User-friendly error message",
  error: "Detailed error (dev only)"
}
```

### Error Middleware Flow
```
Any route throws error
  ↓
Error caught via try-catch
  ↓
next(error) → error handler middleware
  ↓
errorHandler formats response
  ↓
Sends to frontend with appropriate status code
```

## Security Best Practices Implemented

1. ✅ **Passwords hashed** - bcrypt with salt
2. ✅ **Tokens expire** - 7 day expiration
3. ✅ **CORS enabled** - Only your frontend
4. ✅ **Input validation** - Mongoose schema validation
5. ✅ **Authorization checks** - Only owners can modify
6. ✅ **No sensitive data in JWT** - Never passwords
7. ✅ **Error hiding** - Don't leak database structure

## Testing the API

### Using cURL

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'

# Get boards (with token)
curl -X GET http://localhost:5000/api/boards \
  -H "Authorization: Bearer eyJhbGc..."

# Create board
curl -X POST http://localhost:5000/api/boards \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"title":"My Board","description":"Test board"}'
```

### Using Postman

1. (Already have it installed?)
2. Create new request
3. Set method (POST, GET, etc)
4. Set URL (http://localhost:5000/api/...)
5. In Headers tab: Add `Authorization: Bearer {token}`
6. In Body tab: Set to JSON, paste JSON body
7. Click Send

## Performance Tips

### 1. **Indexes for Faster Queries**
```javascript
// Already implemented in models
taskSchema.index({ board: 1, status: 1 });

// Speeds up queries like:
Task.find({ board: boardId, status: 'In Progress' });
```

### 2. **Populate Selectively**
```javascript
// Good - only get needed fields
Board.findById(id).populate('owner', 'name email');

// Bad - gets entire user object
Board.findById(id).populate('owner');
```

### 3. **Lean Queries for Read-Only**
```javascript
// Returns plain objects faster than full Mongoose documents
await Task.find({ board: id }).lean();
```

## Scaling Considerations

1. **Clustering** - Run multiple Node processes with load balancer
2. **Caching** - Add Redis for frequently accessed data
3. **Database Replica Sets** - MongoDB replication for redundancy
4. **CDN** - Serve static files from edge servers
5. **Microservices** - Split into separate services as it grows

---

Good luck with your project! Remember: Code is read more often than it's written. Comments help future-you (and your professor) understand your thinking! 🚀
