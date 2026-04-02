# 🏗️ SYSTEM BLUEPRINT & WORKFLOW

## Overview
Your MERN app has **4 distinct layers**:
1. **Frontend** (React Components) - User Interface
2. **Communication** (HTTP/WebSocket) - Data Transport
3. **Backend** (Express) - Business Logic
4. **Database** (MongoDB) - Data Storage

---

## 📋 LAYER 1: FRONTEND (React - Port 3000)

### Component Hierarchy
```
App.jsx (Main Router)
├── AuthContext (Global State)
├── Login.jsx / SignUp.jsx (Auth Pages)
└── Dashboard (When Logged In)
    ├── BoardList.jsx (All Boards)
    └── KanbanBoard.jsx (Board Detail)
        ├── Column.jsx (To Do, In Progress, Done)
        │   └── TaskCard.jsx (Individual Tasks)
        │       └── TaskModal.jsx (Edit Task)
        │           └── CommentSection.jsx (Comments)
        └── Services
            ├── api.js (HTTP - Axios)
            └── socket.js (WebSocket - Socket.io)
```

### State Management
**AuthContext** (src/context/AuthContext.jsx):
- Stores: `user`, `token`, `loading`
- Methods: `login()`, `logout()`
- Persists to localStorage
- Accessed via `useAuth()` hook

**Component State** (useState):
- BoardList: `boards`, `newBoardTitle`, `showCreateForm`
- KanbanBoard: `tasks`, `selectedTask`, `selectedBoard`
- TaskModal: `editMode`, `taskData`
- CommentSection: `comments`, `newComment`

---

## 🔄 LAYER 2: COMMUNICATION (HTTP & WebSocket)

### HTTP (REST API) - Used For:
✅ Initial data fetch (page load)  
✅ Create/Update/Delete (one-time operations)  
✅ Authentication (login/signup)

**Client:** `api.js` (Axios instance)
```javascript
// Automatically adds Authorization header
// With: Bearer {token}
```

### WebSocket (Socket.io) - Used For:
✅ Real-time updates  
✅ Broadcast to multiple users  
✅ Instant comment/task sync

**Client:** `socket.js`
```javascript
socket.emit('task:move', {taskId, newStatus})
socket.on('task:updated', (data) => {...})
```

---

## 🖧 LAYER 3: BACKEND (Express - Port 5000)

### 3.1 Route Layer (URLs)
Maps HTTP requests to controllers.

```
POST /api/auth/signup       → authController.signup
POST /api/auth/login        → authController.login
GET  /api/auth/me           → authController.getCurrentUser

POST   /api/boards          → boardController.createBoard
GET    /api/boards          → boardController.getAllBoards
GET    /api/boards/:id      → boardController.getBoardDetail
PUT    /api/boards/:id      → boardController.updateBoard
DELETE /api/boards/:id      → boardController.deleteBoard

POST   /api/boards/:id/tasks    → taskController.createTask
GET    /api/boards/:id/tasks    → taskController.getTasksByBoard
GET    /api/tasks/:id           → taskController.getTaskDetail
PUT    /api/tasks/:id           → taskController.updateTask
DELETE /api/tasks/:id           → taskController.deleteTask

POST   /api/comments/:taskId    → commentController.addComment
GET    /api/comments/:taskId    → commentController.getComments
DELETE /api/comments/:id        → commentController.deleteComment
```

### 3.2 Middleware Layer (Processing)
Intercepts requests before controllers.

**authMiddleware.js** (protect):
```javascript
// 1. Extract JWT from "Authorization: Bearer {token}"
// 2. Verify signature
// 3. Check expiration
// 4. Attach user to req.user
// 5. next() → controller
// 6. If invalid → 401 error
```

**errorHandler.js**:
```javascript
// Catches all errors
// Formats response
// Returns 400/401/500 with message
```

### 3.3 Controller Layer (Business Logic)
Contains the actual logic.

**authController.js**:
```
signup(req, res):
  ├─ Validate input (email, password, name)
  ├─ Check if email exists
  ├─ Hash password (pre-save hook)
  ├─ Save user to DB
  ├─ Generate JWT token
  └─ Return {success, token, user}

login(req, res):
  ├─ Validate input
  ├─ Find user by email
  ├─ Compare password via bcrypt.compare()
  ├─ Generate JWT token
  └─ Return {success, token, user}
```

**boardController.js**:
```
createBoard(req, res):
  ├─ Get title & description from request
  ├─ Get user ID from req.user (from middleware)
  ├─ Create Board with user as owner
  ├─ Add user to members array
  └─ Return board

getAllBoards(req, res):
  ├─ Find all boards where user is owner OR member
  ├─ Populate owner and members (get full user objects)
  ├─ Populate tasks (count)
  └─ Return boards array

getBoardDetail(req, res):
  ├─ Find board by ID
  ├─ Verify user is owner or member (authorization)
  ├─ Populate all relationships (tasks, members)
  └─ Return complete board object
```

**taskController.js**:
```
createTask(req, res):
  ├─ Get boardId from URL
  ├─ Get task data from request
  ├─ Create task linked to board
  ├─ Add task ID to board.tasks array
  └─ Return task

getTasksByBoard(req, res):
  ├─ Find all tasks by boardId
  ├─ Group by status ("To Do", "In Progress", "Done")
  └─ Return organized by column

updateTask(req, res):
  ├─ Find task by ID
  ├─ Update fields (title, status, assignee, etc)
  ├─ Emit Socket.io event (for real-time)
  └─ Return updated task
```

**commentController.js**:
```
addComment(req, res):
  ├─ Get taskId from URL
  ├─ Create comment with author = req.user
  ├─ Add to task.comments array
  ├─ Emit Socket.io event to board room
  └─ Return comment

getComments(req, res):
  ├─ Find all comments for task
  ├─ Populate author (get user details)
  └─ Return sorted by date
```

### 3.4 Model Layer (Database Schema)
Defines data structure.

```javascript
User {
  email: String (unique, lowercase)
  password: String (hashed by pre-save hook)
  name: String
  boards: [Board ID] (references)
  createdAt: Date
}

Board {
  title: String
  description: String
  owner: User ID (reference)
  members: [User ID] (array of references)
  tasks: [Task ID] (array of references)
  columns: ["To Do", "In Progress", "Done"] (enum)
  createdAt: Date
}

Task {
  title: String
  description: String
  board: Board ID (reference)
  status: String (enum: "To Do", "In Progress", "Done")
  assignee: User ID (reference, optional)
  dueDate: Date (optional)
  tags: [String] (array)
  comments: [Comment ID] (array of references)
  position: Number (for ordering)
  createdAt: Date
}

Comment {
  text: String
  author: User ID (reference)
  task: Task ID (reference)
  createdAt: Date
}
```

### 3.5 Utility Functions

**tokenGen.js**:
```javascript
generateToken(userId, email):
  ├─ Create JWT payload {userId, email, iat, exp}
  ├─ Sign with JWT_SECRET
  ├─ Set expiration to 7 days
  └─ Return token string
```

**socketManager.js**:
```javascript
setupSocketEvents(socket, io):
  ├─ 'user:join-board' event
  │  └─ socket.join(`board-${boardId}`)
  │
  ├─ 'task:move' event
  │  ├─ Update task status in DB
  │  ├─ io.to(`board-${boardId}`).emit('task:updated')
  │  └─ Broadcast to all users in board room
  │
  ├─ 'comment:add' event
  │  ├─ Create comment in DB
  │  └─ Broadcast to board room
  │
  └─ 'disconnect' event
     └─ Clean up room membership
```

---

## 💾 LAYER 4: DATABASE (MongoDB)

### Collections
```
users {
  _id, email, password (hashed), name, boards[]
}

boards {
  _id, title, description, owner, members[], tasks[]
}

tasks {
  _id, title, description, board, status, assignee, tags[]
}

comments {
  _id, text, author, task, createdAt
}
```

### Relationships
```
User ← owns → Board
User ← added as → Board.members[]
Board ← contains → Task[]
Task ← assigned to → User
Task ← has → Comment[]
User ← author of → Comment
```

---

## 🔀 REQUEST FLOW EXAMPLES

### Example 1: User Signs Up
```
1. FRONTEND (React)
   User fills form → clicks Sign Up
   └─ SignUp.jsx calls api.signupUser(email, password, name)

2. COMMUNICATION (HTTP)
   Axios sends: POST /api/auth/signup
   Body: {email, password, name}
   └─ No Authorization header (not logged in yet)

3. BACKEND (Express)
   Route: POST /api/auth/signup → authRoutes
   └─ Middleware: No auth required
   └─ Controller: authController.signup()
      ├─ Validate input
      ├─ Check if email exists
      ├─ Create User object
      ├─ pre-save hook hashes password with bcrypt
      ├─ Save to MongoDB
      ├─ Generate JWT token
      └─ Return {success, token, user}

4. COMMUNICATION (HTTP Response)
   Backend sends: {success: true, token: "eyJ...", user: {id, email, name}}
   └─ Axios receives response

5. FRONTEND (React)
   SignUp.jsx receives response
   └─ login() stores token in localStorage
   └─ Updates AuthContext
   └─ Redirects to dashboard
   └─ User sees "Welcome, John!"

6. FRONTEND (Socket.io)
   App.jsx detects token exists
   └─ Calls initSocket()
   └─ Connects WebSocket to backend
```

### Example 2: User Creates Board
```
1. FRONTEND (React)
   User clicks "+ New Board" → BoardList.jsx
   └─ Shows create form → enters "My Project" → submits

2. COMMUNICATION (HTTP)
   Axios sends: POST /api/boards
   Headers: Authorization: Bearer {token}
   Body: {title: "My Project", description: "..."}
   └─ Interceptor auto-adds Authorization header

3. BACKEND (Express)
   Route: POST /api/boards → boardRoutes
   └─ Middleware: authMiddleware
      ├─ Extracts token from header
      ├─ Verifies JWT signature
      ├─ Attaches user to req.user
      └─ calls next()
   └─ Controller: boardController.createBoard()
      ├─ Gets title from req.body
      ├─ Gets userId from req.user._id
      ├─ Creates Board {title, owner: userId, members: [userId]}
      ├─ Saves to MongoDB
      └─ Returns board object

4. COMMUNICATION (HTTP Response)
   Returns: {success: true, board: {_id, title, owner, members}}

5. FRONTEND (React)
   BoardList receives response
   └─ setBoards([...boards, newBoard])
   └─ Component re-renders
   └─ User sees "My Project" in grid
```

### Example 3: User Moves Task (Real-Time)
```
1. FRONTEND (React)
   User drags Task A from "To Do" → "In Progress"
   └─ KanbanBoard.jsx detects drop event

2. FRONTEND - Optimistic Update (Instant UI)
   └─ setTasks() updates state immediately
   └─ User sees task moved instantly (fast!)

3. COMMUNICATION (WebSocket)
   socket.emit('task:move', {taskId, newStatus: "In Progress"})
   └─ Sends event to backend via WebSocket

4. BACKEND (Express)
   socketManager receives 'task:move' event
   └─ Controller: taskController.updateTask()
      ├─ Finds task by ID
      ├─ Updates status in MongoDB
      └─ Returns updated task

5. COMMUNICATION - Broadcast (WebSocket)
   io.to(`board-${boardId}`).emit('task:updated', task)
   └─ Sends update to ALL users in board room

6. FRONTEND (React)
   All connected browsers receive 'task:updated' event
   └─ setTasks() updates state
   └─ All users see task moved (real-time sync!)
   └─ No page refresh needed!
```

### Example 4: User Adds Comment
```
1. FRONTEND (React)
   User types comment in CommentSection
   └─ Calls api.addComment() (REST API)
   └─ Also emits socket.emit('comment:add')

2. COMMUNICATION (Dual Approach)
   
   A) REST API:
      POST /api/comments/:taskId
      Authorization: Bearer {token}
      Body: {text: "I'll handle this"}
   
   B) WebSocket:
      socket.emit('comment:add', {taskId, text: "..."})

3. BACKEND - REST Path
   Route → authMiddleware → commentController.addComment()
   ├─ Creates comment with author = req.user
   ├─ Saves to MongoDB
   └─ Returns comment

4. BACKEND - WebSocket Path
   socketManager listens to 'comment:add' event
   ├─ Creates comment (same logic)
   ├─ Broadcasts to board room
   └─ io.to(`board-${boardId}`).emit('comment:added', comment)

5. FRONTEND (React)
   CommentSection listens to 'comment:added' event
   ├─ socket.on('comment:added', (comment) => {...})
   ├─ setComments([...comments, comment])
   └─ All users see comment instantly!
```

---

## 🔒 SECURITY FLOW

### Password Protection
```
signup:
  User enters password → Hashed by bcrypt (10 rounds) → Stored encrypted in DB
  
login:
  User enters password → Compare with bcrypt.compare() → Match returns true
  
Result: Password never stored in plaintext
```

### JWT Authentication
```
signup/login:
  ├─ Generate JWT = base64(header.payload.signature)
  ├─ Payload contains: {userId, email, iat, exp}
  ├─ Signed with: JWT_SECRET (only server knows)
  └─ Send to frontend

Frontend storage:
  ├─ Save token to localStorage
  ├─ Include in every API request header

Backend verification:
  ├─ authMiddleware extracts token
  ├─ Verifies signature using JWT_SECRET
  ├─ If valid & not expired → req.user = payload
  ├─ If invalid/expired → 401 Unauthorized
  └─ Interceptor redirects to login
```

---

## ⚡ REAL-TIME WORKFLOW (Socket.io)

### Connection Phase
```
1. Frontend connects
   └─ initSocket() when token available
   └─ io() creates WebSocket connection

2. Backend accepts
   └─ socketIO initializes on server
   └─ socket connection established

3. User joins board
   └─ socket.emit('user:join-board', {boardId})
   └─ Backend: socket.join(`board-${boardId}`)
   └─ Now receives broadcasts for this board
```

### Broadcast to Room
```
User A changes something:
└─ socket.emit('event', data)
└─ OR api.call() which internally emits

Backend handler:
├─ Updates database
├─ io.to(`board-${boardId}`).emit('event-updated', data)
└─ Sends to ALL sockets in room

All Users (A, B, C) receive:
└─ socket.on('event-updated', (data) => {...})
└─ Update local state
└─ React re-renders
└─ Everyone sees update!
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React Components)                                 │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ AuthContext (user, token)                            │  │
│ │ - Login/SignUp pages ┌─────────────────────────────┐ │  │
│ │ - BoardList          │ useAuth() Hook              │ │  │
│ │ - KanbanBoard        │ setToken, setUser          │ │  │
│ │ - TaskModal          │ localStorage               │ │  │
│ │ - Comments           └─────────────────────────────┘ │  │
│ └───────────────────────────────────────────────────────┘  │
│         ↓                                           ↓        │
│    api.js (Axios)                          socket.js       │
│    + Authorization header                  (WebSocket)     │
│    + Error interceptors                                    │
└─────────────────────────────────────────────────────────────┘
         │                                           │
         ↓                                           ↓
    ┌──────────────────────────────────────────────────────┐
    │ COMMUNICATION LAYER                                  │
    │ HTTP (REST API)        WebSocket (Real-Time)        │
    │ POST /api/auth/...     socket.emit/on               │
    │ GET  /api/boards       Bidirectional                │
    │ POST /api/tasks        Instant sync                 │
    │ DELETE /api/...                                      │
    └──────────────────────────────────────────────────────┘
         │                                           │
         ↓                                           ↓
    ┌──────────────────────────────────────────────────────┐
    │ BACKEND (Express Server)                             │
    │ ┌──────────────────────────────────────────────────┐ │
    │ │ Routes (URL mapping)                             │ │
    │ │ /api/auth, /api/boards, /api/tasks               │ │
    │ │         ↓                                         │ │
    │ │ Middleware (Processing)                          │ │
    │ │ - authMiddleware (JWT verify)                    │ │
    │ │ - errorHandler                                   │ │
    │ │         ↓                                         │ │
    │ │ Controllers (Business Logic)                     │ │
    │ │ - authController                                 │ │
    │ │ - boardController                                │ │
    │ │ - taskController                                 │ │
    │ │ - commentController                              │ │
    │ │         ↓                                         │ │
    │ │ Models (Database layer)                          │ │
    │ │ - User, Board, Task, Comment                     │ │
    │ │         ↓                                         │ │
    │ │ socketManager (Real-time events)                 │ │
    │ └──────────────────────────────────────────────────┘ │
    └──────────────────────────────────────────────────────┘
                             ↓
    ┌──────────────────────────────────────────────────────┐
    │ DATABASE (MongoDB)                                   │
    │ - users collection                                  │
    │ - boards collection                                 │
    │ - tasks collection                                  │
    │ - comments collection                               │
    └──────────────────────────────────────────────────────┘
```

---

## 🎯 Key Functions Reference

### Frontend Key Functions
| File | Function | Purpose |
|------|----------|---------|
| AuthContext.jsx | useAuth() | Access auth state anywhere |
| api.js | api.loginUser() | Send login request |
| api.js | api.getTasksByBoard() | Fetch tasks for board |
| socket.js | initSocket() | Create WebSocket connection |
| KanbanBoard.jsx | handleDrop() | Drag-drop handler |
| CommentSection.jsx | handleAddComment() | Submit comment |

### Backend Key Functions
| File | Function | Purpose |
|------|----------|---------|
| authController.js | signup() | Create new user account |
| authController.js | login() | Authenticate user, return token |
| boardController.js | createBoard() | Create new board |
| boardController.js | getAllBoards() | Fetch user's boards |
| taskController.js | createTask() | Add task to board |
| taskController.js | updateTask() | Change task status/details |
| socketManager.js | setupSocketEvents() | Setup real-time listeners |
| tokenGen.js | generateToken() | Create JWT |

---

## 🚀 Understanding the Flow

**Remember:**
1. **Frontend** = What user sees & interacts with (React)
2. **Routes** = URL mapping (which endpoint does what)
3. **Middleware** = Request processing (security, validation)
4. **Controllers** = Business logic (actual work)
5. **Models** = Data structure (what goes in database)
6. **Database** = Persistent storage (MongoDB)
7. **Socket.io** = Real-time magic (instant sync)

**Flow Summary:**
```
User Action → Component → API/Socket → Route → Middleware → Controller → Model → Database
Database → Response → Component → State → Re-render → User sees update
```

That's your entire system! 🎉
