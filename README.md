# 📊 Real-Time Project Manager (MERN Stack)

A fully-functional, real-time Trello-style project management application built with **MERN Stack** (MongoDB, Express, React, Node.js) and **Socket.io** for instant collaboration.

## 🎯 Core Features

### 1. **JWT Authentication**
- Secure signup and login
- Password hashing with bcrypt
- Token-based authorization
- Session persistence across refreshes

### 2. **Boards & Projects**
- Create, read, update, delete boards
- Invite team members to boards
- Organize tasks by project

### 3. **Kanban Board with Drag-and-Drop**
- Visual task management with columns (To Do, In Progress, Done)
- Drag-and-drop tasks between columns
- Instant UI updates without page refresh

### 4. **Real-Time Collaboration** (Socket.io)
- Live task updates when users move cards
- Real-time comments on tasks
- Instant notifications of team changes
- Multiple users viewing same board simultaneously

### 5. **Task Management**
- Create and edit tasks
- Assign tasks to team members
- Set due dates
- Add tags/labels
- View task details in modal

### 6. **Team Collaboration**
- Add comments to tasks
- Real-time comment updates
- Team member assignment
- User management

---

## 📁 Project Structure

```
Project Manager/
├── backend/                    # Node.js/Express Server
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middlewares/
│   │   ├── authMiddleware.js   # JWT verification
│   │   └── errorHandler.js     # Global error handling
│   ├── models/
│   │   ├── userModel.js        # User schema & methods
│   │   ├── boardModel.js       # Board schema
│   │   ├── taskModel.js        # Task schema
│   │   └── commentModel.js     # Comment schema
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   ├── boardRoutes.js      # Board endpoints
│   │   ├── taskRoutes.js       # Task endpoints
│   │   └── commentRoutes.js    # Comment endpoints
│   ├── controllers/
│   │   ├── authController.js   # Auth logic
│   │   ├── boardController.js  # Board logic
│   │   ├── taskController.js   # Task logic
│   │   └── commentController.js# Comment logic
│   ├── utils/
│   │   ├── tokenGen.js         # JWT generation
│   │   └── socketManager.js    # Socket.io events
│   ├── server.js               # Main server file
│   ├── package.json
│   ├── .env                    # Environment variables
│   └── .gitignore
│
└── frontend/                   # React Application
    ├── src/
    │   ├── components/
    │   │   ├── Auth/
    │   │   │   ├── Login.jsx
    │   │   │   └── SignUp.jsx
    │   │   ├── Board/
    │   │   │   └── BoardList.jsx
    │   │   ├── Kanban/
    │   │   │   ├── KanbanBoard.jsx
    │   │   │   ├── Column.jsx
    │   │   │   └── TaskCard.jsx
    │   │   ├── TaskModal/
    │   │   │   └── TaskModal.jsx
    │   │   └── Comments/
    │   │       └── CommentSection.jsx
    │   ├── services/
    │   │   ├── api.js          # API calls
    │   │   └── socket.js       # Socket.io setup
    │   ├── context/
    │   │   └── AuthContext.jsx # Auth state
    │   ├── styles/
    │   │   ├── Auth.css
    │   │   ├── Board.css
    │   │   ├── Kanban.css
    │   │   ├── TaskModal.css
    │   │   ├── Comments.css
    │   │   └── App.css
    │   ├── App.jsx
    │   ├── index.js
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env
    └── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create a `.env` file with:
```
MONGO_URI=mongodb://localhost:27017/project-manager
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

4. **Start the server:**
```bash
npm run dev    # Development with auto-reload (requires nodemon)
# OR
npm start      # Production
```

Server will run on http://localhost:5000

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create a `.env` file with:
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

4. **Start development server:**
```bash
npm run dev
```

Frontend will run on http://localhost:3000

---

## 🔄 WebSocket & REST API Integration

### Real-Time Workflow Example: Moving a Task

**Client Side (React):**
```javascript
// User drags task from "To Do" to "In Progress"
socket.emit('task:move', {
  taskId: '123',
  newStatus: 'In Progress',
  boardId: 'board-456'
});
```

**Server Processing:**
1. Receives `task:move` event (Socket.io)
2. Validates task belongs to board
3. Updates MongoDB database
4. Broadcasts to all connected users in that board room
5. All clients receive `task:updated` event instantly

**Other Users (React):**
```javascript
socket.on('task:updated', (data) => {
  // Update local state to re-render board
  setTasks(prevTasks => 
    prevTasks.map(t => 
      t._id === data.taskId 
        ? { ...t, status: data.status }
        : t
    )
  );
});
```

**Result:** No page refresh, instant visual update for all users! 🎉

### REST API Alternative
Tasks can also be updated via traditional REST API:
```bash
PUT /api/tasks/:taskId
{
  "status": "In Progress"
}
```

Both paths update the database. Socket.io broadcasts instantly, REST API requires manual sync.

---

## 🔐 Authentication Flow

### Signup
1. User fills name, email, password
2. Password is hashed with bcrypt (10 salt rounds)
3. User document created in MongoDB
4. JWT token generated
5. User logged in automatically

### Login
1. User enters email and password
2. Backend finds user by email
3. Compares provided password with bcrypt hash
4. If match: generates JWT token
5. Frontend stores token in localStorage
6. Token included in all future API requests via Axios interceptor

### Protected Routes
- All board/task/comment endpoints require valid JWT
- `protect` middleware verifies token before controller runs
- If token invalid/expired: returns 401 Unauthorized

---

## 📚 Key Technologies & Concepts

### Backend
- **Express.js**: HTTP server framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM with validation
- **Socket.io**: Real-time bidirectional communication
- **JWT**: Token-based authentication
- **bcrypt**: Password hashing

### Frontend
- **React**: UI library with hooks
- **Axios**: HTTP client with interceptors
- **Socket.io-client**: WebSocket client
- **Context API**: State management
- **CSS**: Modern responsive design
- **Vite**: Fast build tool and dev server

### Real-Time Architecture
- **Socket.io Rooms**: Group users viewing same board
- **Event Emitters**: Structured real-time communication
- **Optimistic UI**: Update UI before server confirmation
- **Auto-reconnection**: Handles network drops gracefully

---

## 🧠 Learning Key Concepts

### 1. **JWT Authentication**
- Located in: `backend/middlewares/authMiddleware.js`
- How it works: Token is generated on login, stored on client, sent with every request
- Why: Stateless authentication, scales better than sessions

### 2. **Socket.io Real-Time Events**
- Located in: `backend/utils/socketManager.js`
- Key events: `task:move`, `task:update`, `comment:add`
- How it works: Server listens for events, broadcasts updates to relevant clients

### 3. **Optimistic UI Updates**
- Located in: `frontend/src/components/Kanban/KanbanBoard.jsx`
- How it works: Update UI immediately, then sync with server
- Why: Makes app feel fast and responsive

### 4. **API Interceptors**
- Located in: `frontend/src/services/api.js`
- How it works: Automatically add token to requests, handle 401 errors
- Why: DRY principle, centralized error handling

### 5. **Database Relationships**
- User → Boards (1:many)
- Board → Tasks (1:many)
- Task → Comments (1:many)
- See `backend/models/` for schema relationships

---

## 🎓 Assignment & Grading Tips

### Strong Points to Highlight
1. ✅ **Full CRUD Operations**: All endpoints fully functional
2. ✅ **Real-Time Collaboration**: Socket.io working perfectly
3. ✅ **Security**: JWT auth, password hashing, error handling
4. ✅ **Code Quality**: Well-commented, modular structure
5. ✅ **User Experience**: Drag-drop, instant updates, smooth transitions

### For Your Presentation
1. **Demo drag-drop with two browsers** showing real-time sync
2. **Explain JWT flow** during login
3. **Show Socket.io events** in browser console
4. **Discuss scalability** (node clustering, load balancing)
5. **Performance optimizations** (indexes, pagination for scale)

---

## 🔧 API Endpoints Reference

### Authentication
```
POST   /api/auth/signup              Create account
POST   /api/auth/login               Login & get token
GET    /api/auth/me                  Get current user
```

### Boards
```
POST   /api/boards                   Create board
GET    /api/boards                   Get all user's boards
GET    /api/boards/:id               Get board details
PUT    /api/boards/:id               Update board
DELETE /api/boards/:id               Delete board
POST   /api/boards/:id/members       Add member
```

### Tasks
```
POST   /api/boards/:id/tasks         Create task
GET    /api/boards/:id/tasks         Get all board tasks
GET    /api/tasks/:id                Get task details
PUT    /api/tasks/:id                Update task
DELETE /api/tasks/:id                Delete task
```

### Comments
```
POST   /api/comments/:taskId/comments   Add comment
GET    /api/comments/:taskId/comments   Get comments
DELETE /api/comments/:id                Delete comment
```

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 5000 is in use
lsof -i :5000  (Mac/Linux)
netstat -ano | findstr :5000  (Windows)

# Use different port
PORT=3001 npm start
```

### MongoDB connection error
```bash
# Start MongoDB
# macOS with Homebrew:
brew services start mongodb-community

# Or use MongoDB Atlas (cloud):
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db-name
```

### Socket.io not connecting
- Check CORS origins in server.js
- Ensure backend is running on correct port
- Check browser console for WebSocket errors

### Token not persisting
- Ensure localStorage is enabled in browser
- Check Axios interceptor is reading token: `localStorage.getItem('token')`

---

## 📈 Future Enhancements

1. **User Avatar Upload**: Add profile pictures
2. **Notifications**: Email/browser notifications
3. **Webhooks**: Integration with Slack, GitHub
4. **Analytics**: Track productivity metrics
5. **Offline Mode**: Work offline, sync when online
6. **Mobile App**: React Native version
7. **Dark Mode**: Theme switching

---

## 📝 License

MIT License - Feel free to use this for learning and projects!

---

## 💡 Remember

This code is heavily commented to help you **understand the 'why'** behind decisions. When studying:

1. **Read the comments first** - understand the logic
2. **Trace the data flow** - how does data move?
3. **Experiment** - modify and see what breaks
4. **Compare REST vs Socket.io** - understand the differences
5. **Ask yourself** - why was this design chosen?

Good luck with your project! 🚀
