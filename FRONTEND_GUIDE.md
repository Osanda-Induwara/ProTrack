# Frontend Guide - React Component Architecture

## Component Hierarchy

```
App.jsx (Main component, router logic)
 │
 ├─ AuthProvider (Context wrapper)
 │   │
 │   ├─ Login.jsx (Auth page)
 │   ├─ SignUp.jsx (Auth page)
 │   │
 │   ├─ BoardList.jsx (Dashboard)
 │   │   └─ Fetches all user's boards
 │   │
 │   └─ KanbanBoard.jsx (Main board view)
 │       ├─ Column.jsx (Each column in board)
 │       │   └─ TaskCard.jsx (Individual task card)
 │       │       └─ Drag-drop enabled
 │       │
 │       └─ TaskModal.jsx (Task detail view)
 │           └─ CommentSection.jsx (Comments on task)
```

## How React Components Work

### Component State & Props

```javascript
// Props = data passed DOWN from parent
function TaskCard({ task, onDragStart }) {
  return <div>{task.title}</div>;  // Props are read-only
}

// State = data managed WITHIN component
const KanbanBoard = ({ board }) => {
  const [tasks, setTasks] = useState([]);  // Local state
  return <div>{tasks.map(...)}</div>;
};
```

### React Hooks Used

1. **useState** - Manage local component state
2. **useEffect** - Run code when component mounts/updates
3. **useContext** - Access global state (AuthContext)

### Component Lifecycle

```javascript
const MyComponent = () => {
  // 1. Initialization (see useEffect)
  
  // 2. Mount - Called once when component appears
  useEffect(() => {
    loadData();
    return () => cleanup();  // Cleanup (unmount)
  }, []);

  // 3. Render - Return JSX
  return <div>Content</div>;

  // 4. Update - Triggers when state/props change
  
  // 5. Unmount (cleanup function above)
};
```

## Key Services

### API Service (api.js)

**Why centralized?**
- All backend calls in one place
- Easy to debug (all calls logged here)
- Easy to change endpoints
- Token automatically added to all requests

**How requests work:**

```javascript
// 1. Component calls API
const response = await api.createBoard(title, description);

// 2. Axios interceptor automatically adds token
// Authorization: Bearer {token}

// 3. Request sent to backend
// POST http://localhost:5000/api/boards

// 4. Backend processes and responds

// 5. Component receives response
// { success: true, board: {...} }
```

### Socket.io Service (socket.js)

**Why separated?**
- One place to manage WebSocket connection
- Components just call `getSocket()` when needed
- Easy to trace real-time events

**How real-time works:**

```javascript
// 1. User moves task on their board
const socket = getSocket();
socket.emit('task:move', { taskId, newStatus });

// 2. Backend receives event and broadcasts
socket.on('task:updated', (data) => {
  // Update local state to re-render
  setTasks(prev => prev.map(t => 
    t._id === data.taskId ? {...t, status: data.status} : t
  ));
});
```

## Context API (State Management)

### What is Context?

Context let you share data across many components without manually passing props through each level.

```javascript
// Without Context (prop drilling)
<App user={user} />
  <Dashboard user={user} />
    <Header user={user} />
      <UserMenu user={user} />  // Too many levels!

// With Context
<AuthProvider>  {/*  Provides user via Context */}
  <App />
    <Dashboard />
      <Header />
        <UserMenu />  {/* Access user with useAuth() */}
</AuthProvider>
```

### How AuthContext Works

1. **Create Context**: `createContext()` creates the context object
2. **Create Provider**: Wraps app and provides state
3. **Create Hook**: `useAuth()` lets components access state

```javascript
// Inside component
const { user, token, login, logout } = useAuth();

// This hook gives you:
// - user: Current logged-in user
// - token: JWT token
// - login: Function to login
// - logout: Function to logout
```

## Drag-and-Drop Implementation

### Plain HTML Drag-Drop API

```javascript
// Make element draggable
<div draggable>...</div>

// When drag starts
onDragStart={() => setDraggedTask(task)}

// When dragging over column
onDragOver={(e) => e.preventDefault()}  // Allow drop

// When dropped
onDrop={() => handleDrop(columnName)}
```

### How Kanban Board Handles Drag-Drop

1. **User drags task** → `onDragStart` stores it
2. **Over column** → `onDragOver` allows drop
3. **Drop on column** → `onDrop` triggers:
   - Update local state (optimistic)
   - Emit Socket.io event
   - Backend updates database
   - Backend broadcasts to all users
4. **Other users** receive update via Socket.io
5. **Their UIs** re-render with new data

## Real-Time Comment Example

```javascript
// Component mounts
useEffect(() => {
  loadComments();
  
  const socket = getSocket();
  
  // Listen for new comments
  socket.on('comment:added', (data) => {
    if (data.taskId === taskId) {
      setComments(prev => [data.comment, ...prev]);
    }
  });
  
  return () => socket.off('comment:added');
}, [taskId]);

// User types comment
const handleAddComment = async () => {
  // 1. Post via API
  await api.addComment(taskId, text);
  
  // 2. Emit Socket event
  socket.emit('comment:add', { taskId, text });
  
  // 3. Clear form
  setNewComment('');
};
```

## Error Handling in Frontend

### User-Friendly Errors

```javascript
try {
  const response = await api.loginUser(email, password);
  login(response.user, response.token);
} catch (err) {
  // Show user-friendly message
  const errorMsg = err.response?.data?.message || 'Login failed';
  setError(errorMsg);
}
```

### Axios Response Interceptor

If token expires:
```javascript
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired
      localStorage.removeItem('token');
      window.location.href = '/login';  // Redirect to login
    }
  }
);
```

## Performance Optimizations

### 1. Unnecessary Re-renders

```javascript
// Bad - component re-renders on every state change
const KanbanBoard = () => {
  const [tasks, setTasks] = useState([]);
  
  // Re-renders even if tasks didn't change
};

// Good - only re-render if tasks actually change
const [tasks, setTasks] = useState(tasks);
```

### 2. Lazy Loading

```javascript
// Only fetch task details when modal opens
const [selectedTask, setSelectedTask] = useState(null);
const handleSelectTask = (task) => {
  // Fetch full details with comments
  const full = await api.getTaskDetail(task._id);
  setSelectedTask(full.task);
};
```

## Common Patterns

### Form Handling

```javascript
const [title, setTitle] = useState('');
const [error, setError] = useState('');

const handleSubmit = async (e) => {
  e.preventDefault();  // Prevent page reload
  
  // Validate
  if (!title.trim()) {
    setError('Title required');
    return;
  }
  
  try {
    // API call
    await api.createBoard(title);
    setTitle('');  // Clear form
  } catch (err) {
    setError(err.message);
  }
};
```

### Data Fetching

```javascript
useEffect(() => {
  // Fetch when component mounts
  const loadData = async () => {
    try {
      const response = await api.getAllBoards();
      setBoards(response.boards);
    } catch (err) {
      setError('Failed to load');
    }
  };
  
  loadData();
}, []);  // Empty dependency = run once on mount
```

## Styling Approach

### CSS Organization

```
styles/
├── Auth.css          - Login/SignUp styles
├── Board.css         - Board list styles
├── Kanban.css        - Kanban board styles
├── TaskModal.css     - Modal styles
├── Comments.css      - Comments styles
└── App.css           - Global styles
```

### Responsive Design

```css
/* Mobile first */
.kanban-board {
  grid-template-columns: 1fr;
}

/* Tablet and up */
@media (min-width: 768px) {
  .kanban-board {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .kanban-board {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Browser APIs Used

### localStorage

```javascript
// Store token so user stays logged in
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));

// Retrieve on app load
const token = localStorage.getItem('token');

// Clear on logout
localStorage.removeItem('token');
```

### Drag-Drop API

```javascript
<div 
  draggable
  onDragStart={(e) => e.dataTransfer.setData('text/html', e.target)}
  onDrop={(e) => e.preventDefault()}
/>
```

### WebSocket (Socket.io)

```javascript
const socket = io('http://localhost:5000');

// Emit event
socket.emit('user:join-board', { boardId });

// Listen for event
socket.on('task:updated', (data) => {...});

// Remove listener
socket.off('task:updated');
```

---

## Troubleshooting

### State not updating
```javascript
// Wrong - modifying state directly
tasks[0].title = 'New Title';
setTasks(tasks);

// Right - create new array
setTasks(tasks.map((t, i) => 
  i === 0 ? {...t, title: 'New Title'} : t
));
```

### Memory leaks in useEffect
```javascript
useEffect(() => {
  const subscription = socket.on('event', handler);
  
  return () => {
    // Cleanup to prevent memory leak
    socket.off('event');
  };
}, []);
```

### API call in loop
```javascript
// Bad - runs in every render
useEffect(() => {
  api.loadData();
});

// Good - run only once
useEffect(() => {
  api.loadData();
}, []);  // Empty dependency array
```

---

Good luck! Remember: React is all about **components → props/state → render → update**. Master this cycle and you'll understand everything! 🎯
