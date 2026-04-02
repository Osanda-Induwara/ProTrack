# 🚀 QUICK START GUIDE

## One-Time Setup (5 minutes)

### 1. Prerequisites Check
```bash
node --version   # Should be v14 or higher
npm --version    # Should work
```

### 2. Start MongoDB
```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux with bash
mongod

# Or use MongoDB Atlas (cloud) - no local install needed
# https://www.mongodb.com/cloud/atlas
```

### 3. Backend Setup
```bash
cd backend
npm install
# Edit .env and set your JWT_SECRET
npm run dev     # Starts on http://localhost:5000
```

### 4. Frontend Setup (in new terminal)
```bash
cd frontend
npm install
npm run dev     # Starts on http://localhost:3000
```

✅ **Done!** App is running at http://localhost:3000

---

## First Time Using the App

### 1. Sign Up
1. Go to http://localhost:3000
2. Click "Sign up"
3. Enter name, email, password
4. **Welcome! You're logged in!**

### 2. Create a Board
1. Click **+ New Board**
2. Enter title (e.g., "My First Project")
3. Click **Create**
4. Click on the board to view it

### 3. Add Tasks
1. Type task title in the form
2. Click **Add Task**
3. Task appears in "To Do" column

### 4. Move Tasks (Drag-Drop)
1. Click and hold a task card
2. Drag to another column
3. **Release!** Task moves instantly
4. Open another browser tab with same board
5. **See the update in real-time!** 🎉

### 5. Edit Task Details
1. Click on a task card
2. Modal opens with full details
3. Click **Edit** button
4. Change title, assignee, due date, tags
5. Click **Save Changes**

### 6. Add Comments
1. In task modal, scroll to comments section
2. Type comment in text area
3. Click **Post Comment**
4. Comment appears instantly
5. (Real-time if using multiple browsers!)

---

## File Structure Quick Reference

### Key Backend Files

| File | What it does |
|------|-----------|
| `server.js` | Starts the server, sets up routes |
| `config/db.js` | Connects to MongoDB |
| `models/*Model.js` | Database schemas |
| `controllers/*Controller.js` | Business logic |
| `routes/*Routes.js` | URL endpoints |
| `middlewares/authMiddleware.js` | JWT verification |
| `utils/socketManager.js` | Real-time events |

### Key Frontend Files

| File | What it does |
|------|-----------|
| `App.jsx` | Main component, routing |
| `context/AuthContext.jsx` | Global auth state |
| `services/api.js` | Backend API calls |
| `services/socket.js` | WebSocket setup |
| `components/Auth/` | Login/SignUp pages |
| `components/Board/` | Board list view |
| `components/Kanban/` | Main Kanban board |

---

## Common Commands

### Terminal 1 (Backend)
```bash
cd backend
npm run dev          # Start backend server
npm start            # Production mode
npm test             # Run tests (if added)
```

### Terminal 2 (Frontend)
```bash
cd frontend
npm run dev          # Start frontend dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## Testing the Real-Time Features

### 1. Open 2 Browser Windows
```
Window 1: http://localhost:3000
Window 2: http://localhost:3000 (in different browser or incognito)
```

### 2. Login in Both
- Window 1: Login as user1
- Window 2: Login as user2

### 3. Both Open Same Board
- Click on the board in both windows

### 4. Test Real-Time Updates
- **Window 1**: Drag a task
- **Window 2**: Watch it move instantly! (no page refresh)

### 5. Test Comments
- **Window 1**: Add a comment
- **Window 2**: See it appear instantly!

---

## Debugging Tips

### See API Calls
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Make API request (create board, etc)
4. Click on request
5. See Request and Response

### See WebSocket Events
1. Open DevTools console (F12 → Console)
2. Backend logs and frontend logs will appear
3. Watch events as they happen:
   - `✅ Socket.io connected`
   - `📦 Task updated`
   - `💬 New comment received`

### See Database Changes
```bash
# In separate terminal
mongosh                    # Open MongoDB shell
use project-manager        # Select database
db.tasks.find()            # View all tasks
db.boards.find()           # View all boards
db.users.find()            # View all users
```

---

## Stopping the App

```bash
# In each terminal
Ctrl + C    # Stops the server

# Or kill specific port
lsof -ti:5000 | xargs kill -9    # Kill backend
lsof -ti:3000 | xargs kill -9    # Kill frontend
```

---

## Environment Variables Explained

### Backend (.env)

```
MONGO_URI            = Where MongoDB is
JWT_SECRET           = Secret key for tokens (change this!)
PORT                 = Server port
CLIENT_URL           = Frontend URL (for CORS)
NODE_ENV             = development or production
```

### Frontend (.env)

```
VITE_API_URL         = Backend URL
VITE_SOCKET_URL      = Backend URL (same for Socket.io)
```

---

## Beginner Mistakes to Avoid

❌ **DON'T**
- Commit `.env` files (they have secrets!)
- Run `npm install` multiple times (only when package.json changes)
- Have both frontend and backend on same port
- Use expired tokens (they're good for 7 days)
- Edit passwords in database (they're hashed!)

✅ **DO**
- Keep backend and frontend in separate terminal windows
- Check console (F12) for errors
- Restart server after .env changes
- Test with 2 browsers for real-time features
- Comment your own code for learning

---

## Next Steps After Getting It Working

1. **Understand the code**
   - Read BACKEND_GUIDE.md for backend concepts
   - Read FRONTEND_GUIDE.md for React concepts

2. **Try modifying things**
   - Change colors in CSS files
   - Add a new task field (e.g., priority)
   - Change "To Do" column name

3. **Review the explanations**
   - Every file has comments explaining the WHY
   - Trace a flow from frontend to backend
   - Understand JWT and Socket.io

4. **Break things (intentionally!)**
   - Change API endpoints and see errors
   - Disconnect MongoDB and see error handling
   - Expire a token and see login redirect

---

## Getting Help

### Server won't start
1. Check if port 5000 is free: `lsof -i :5000`
2. Check .env file is set up correctly
3. Check MongoDB is running: `mongosh`
4. Check Node version: `node --version`

### Frontend shows blank page
1. Open DevTools (F12) → Console
2. Look for error messages
3. Check that backend is running
4. Try clearing cache: `Ctrl+Shift+Delete` (Chrome)

### Real-time updates not working
1. Check browser console for WebSocket errors
2. Make sure both connections open (look for socket IDs)
3. Check CORS settings in server.js match your frontend URL
4. Restart both server and frontend

### Database errors
1. Check MongoDB is running
2. Check MONGO_URI in .env is correct
3. If using Atlas, check IP whitelist settings
4. See actual error in backend terminal

---

## Project Structure TL;DR

```
Backend (Node.js):
  receives request → checks auth → runs business logic 
  → updates database → sends response

Frontend (React):
  shows UI → user clicks → calls API/Socket.io 
  → updates state → re-renders UI

Real-Time (Socket.io):
  Frontend emits event → Backend receives & broadcasts 
  → All frontends receive → Update UI instantly!
```

---

**You're all set!** Start with the signup, create a board, and explore. The code is heavily commented to help you learn. Have fun! 🎉

Need clarification on something? Check the relevant guide:
- Backend logic → **BACKEND_GUIDE.md**
- React components → **FRONTEND_GUIDE.md**
- Full overview → **README.md**
