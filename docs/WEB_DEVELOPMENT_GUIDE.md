# Complete Web Development Guide for Amateurs
## Learning Through College Central's Code

---

## 📚 Table of Contents
1. [The Big Picture](#1-the-big-picture)
2. [The Entry Point - Where Everything Starts](#2-the-entry-point)
3. [React - The UI Framework](#3-react---the-ui-framework)
4. [Components - Building Blocks](#4-components---building-blocks)
5. [State Management - Remembering Things](#5-state-management)
6. [Routing - Navigation](#6-routing---navigation)
7. [Database - Storing Data](#7-database---storing-data)
8. [Authentication - User Login](#8-authentication---user-login)
9. [Styling - Making It Pretty](#9-styling---making-it-pretty)
10. [Real-Time Updates](#10-real-time-updates)
11. [Forms and User Input](#11-forms-and-user-input)
12. [Deployment - Going Live](#12-deployment---going-live)

---

## 1. The Big Picture

### What is a Web Application?

Think of a web app like a restaurant:
- **Frontend (Client)**: The dining area where customers sit
- **Backend (Server)**: The kitchen where food is prepared
- **Database**: The storage room with ingredients

```
┌─────────────────────────────────────────────────┐
│                   USER                          │
│              (You in browser)                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓ Clicks, types, scrolls
┌─────────────────────────────────────────────────┐
│            FRONTEND (React)                     │
│   - What you see (HTML/CSS)                     │
│   - What you interact with (JavaScript)         │
│   - College Central's beautiful UI              │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓ Sends/receives data
┌─────────────────────────────────────────────────┐
│            BACKEND (Firebase)                   │
│   - Processes requests                          │
│   - Manages authentication                      │
│   - Enforces security rules                     │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓ Reads/writes
┌─────────────────────────────────────────────────┐
│          DATABASE (Firestore)                   │
│   - Stores user data                            │
│   - Stores grades, schedules, etc.              │
│   - Syncs in real-time                          │
└─────────────────────────────────────────────────┘
```

---

## 2. The Entry Point - Where Everything Starts

Every web app needs a starting point. In College Central, it's `index.tsx`:

```typescript
// index.tsx - This is like the main() function in programming

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Step 1: Find the HTML element with id="root"
const rootElement = document.getElementById('root');

// Step 2: Create a React "root" - think of it as planting a tree
const root = ReactDOM.createRoot(rootElement);

// Step 3: Tell React to "render" (show) our App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**What's happening here?**

1. **Finding the Root**:
   - Your HTML file has a `<div id="root"></div>`
   - This is where React will inject your entire application
   - Like hanging a painting on a wall

2. **Rendering**:
   - `render()` tells React: "Put the App component inside this root element"
   - React converts your components into HTML that browsers understand

3. **StrictMode**:
   - A safety tool that warns you about potential problems
   - Like a spell-checker for code

---

## 3. React - The UI Framework

### What is React?

React is a JavaScript library for building user interfaces. Think of it like LEGO blocks:
- Each block is a **component**
- You combine blocks to build complex structures
- You can reuse the same block many times

### Your First Component

```typescript
// A simple button component
function MyButton() {
  return <button>Click Me!</button>;
}

// Using it
function App() {
  return (
    <div>
      <MyButton />
      <MyButton />
      <MyButton />
    </div>
  );
}
```

**Result**: You get 3 buttons on the page!

### JSX - HTML in JavaScript

```typescript
// This looks like HTML but it's actually JavaScript!
const element = <h1>Hello, World!</h1>;

// Behind the scenes, React converts this to:
const element = React.createElement('h1', null, 'Hello, World!');
```

**Why JSX is awesome:**
- Write HTML-like syntax in JavaScript
- Easy to read and understand
- You can embed JavaScript expressions using `{}`

```typescript
const name = "Alice";
const greeting = <h1>Hello, {name}!</h1>;  // Shows: Hello, Alice!
```

---

## 4. Components - Building Blocks

### Understanding Components with Real Examples

Let's look at College Central's Login page:

```typescript
// pages/Login.tsx (simplified)

const Login: React.FC = () => {
  // This is a FUNCTIONAL COMPONENT
  // It's like a function that returns HTML

  return (
    <div className="login-page">
      <h1>Welcome to College Central</h1>
      <button onClick={handleLogin}>Sign in with Google</button>
    </div>
  );
};

export default Login;
```

**Component Breakdown:**

1. **Function**: `const Login: React.FC = () => { ... }`
   - `React.FC` means "React Functional Component"
   - It's a function that returns JSX

2. **Return**: What the component displays
   - Everything inside `return (...)` is what users see

3. **Export**: Makes the component available to other files
   - Like lending a book to a friend

### Component Composition

Components can contain other components:

```typescript
// App.tsx structure
function App() {
  return (
    <div>
      <Header />        {/* Top navigation */}
      <Sidebar />       {/* Left menu */}
      <MainContent />   {/* Center area */}
      <Footer />        {/* Bottom info */}
    </div>
  );
}
```

**Think of it like building a house:**
- `App` is the house
- `Header`, `Sidebar`, etc. are rooms
- Each room can have furniture (smaller components)

---

## 5. State Management - Remembering Things

### What is State?

State is how components "remember" things. Like your brain remembering what you ate for breakfast.

### useState Hook

```typescript
import { useState } from 'react';

function Counter() {
  // Declare a state variable called 'count'
  // Initialize it to 0
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

**Understanding useState:**

```typescript
const [count, setCount] = useState(0);
//     ↑       ↑            ↑
//   current  function    initial
//   value    to update   value
```

1. **count**: The current value (like a variable)
2. **setCount**: Function to change the value
3. **useState(0)**: Starting value is 0

**Why not just use a regular variable?**

```typescript
// ❌ This WON'T work:
let count = 0;
function increment() {
  count = count + 1;  // Changes the variable...
  // But React doesn't know to re-render!
}

// ✅ This WILL work:
const [count, setCount] = useState(0);
function increment() {
  setCount(count + 1);  // React knows to update the UI!
}
```

### Real Example from College Central

```typescript
// pages/Login.tsx
const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // When user clicks Sign In tab
  const handleSignInClick = () => {
    setIsSignUp(false);  // Switch to Sign In mode
    setError('');        // Clear any errors
  };

  return (
    <div>
      {isSignUp ? <h1>Create Account</h1> : <h1>Welcome Back</h1>}
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

**What's happening:**
- `isSignUp` tracks whether we're in Sign Up or Sign In mode
- `error` stores any error messages
- When these change, React automatically updates the UI

---

## 6. Routing - Navigation

### What is Routing?

Routing is like having different pages in your app, but without reloading:

```
yourdomain.com/            → Dashboard
yourdomain.com/grades      → Grades page
yourdomain.com/schedule    → Schedule page
```

### React Router Example

```typescript
// App.tsx (simplified)
import { createHashRouter, RouterProvider } from 'react-router-dom';

const router = createHashRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <Layout />,  // Main layout with sidebar
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'grades', element: <Grades /> },
      { path: 'schedule', element: <Schedule /> }
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}
```

**Understanding the Structure:**

```
/                           (Layout wraps everything)
├── /                      (Dashboard - homepage)
├── /grades                (Grades page)
├── /schedule              (Schedule page)
└── /login                 (Login page - no Layout)
```

### Navigation

```typescript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const goToGrades = () => {
    navigate('/grades');  // Changes URL to /grades
  };

  return <button onClick={goToGrades}>View Grades</button>;
}
```

---

## 7. Database - Storing Data

### Understanding Firestore (Our Database)

Firestore is like a digital filing cabinet:

```
Filing Cabinet (Firestore Database)
│
└── Drawer: users/
    ├── Folder: user123/
    │   ├── Paper: name = "Alice"
    │   ├── Paper: email = "alice@iitism.ac.in"
    │   │
    │   └── Sub-folder: grades/
    │       ├── grade1: Math = A
    │       └── grade2: Physics = B+
    │
    └── Folder: user456/
        └── (Another user's data)
```

### Database Structure

```typescript
users/                              // Collection (like a drawer)
  {userId}/                         // Document (like a folder)
    name: "Alice"
    email: "alice@iitism.ac.in"

    grades/                         // Subcollection (like a sub-folder)
      {gradeId}/                    // Document
        subject: "Mathematics"
        grade: "A"
        credits: 4
```

### Reading Data from Firestore

```typescript
import { db } from './firebaseConfig';

// Read a user's profile
const getUserProfile = async (userId) => {
  const docRef = db.collection('users').doc(userId);
  const docSnap = await docRef.get();

  if (docSnap.exists()) {
    console.log("User data:", docSnap.data());
  } else {
    console.log("No such user!");
  }
};
```

**Step by step:**

1. `db.collection('users')` → Open the "users" drawer
2. `.doc(userId)` → Find the folder with this user's ID
3. `.get()` → Fetch the data
4. `docSnap.data()` → Get the actual data inside

### Writing Data to Firestore

```typescript
// Add a new grade
const addGrade = async (userId, gradeData) => {
  await db
    .collection('users')
    .doc(userId)
    .collection('grades')
    .add({
      subject: "Mathematics",
      grade: "A",
      credits: 4,
      semester: 5
    });
};
```

### Real-Time Updates

This is **magic**! ✨

```typescript
// Listen to changes in real-time
useEffect(() => {
  const unsubscribe = db
    .collection('users')
    .doc(userId)
    .collection('grades')
    .onSnapshot((snapshot) => {
      // This runs EVERY TIME the data changes!
      const grades = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setGrades(grades);  // Update UI automatically
    });

  return () => unsubscribe();  // Stop listening when component unmounts
}, [userId]);
```

**How it works:**
1. `onSnapshot()` creates a "live connection" to the database
2. Whenever data changes, your function runs
3. Your UI updates automatically
4. It's like having a security camera that alerts you of changes!

---

## 8. Authentication - User Login

### Understanding Authentication

Authentication is proving who you are. Like showing your ID card.

### Google OAuth Flow

```typescript
// hooks/useAuth.tsx (simplified)

const loginWithGoogle = async () => {
  // Step 1: Create a Google OAuth provider
  const provider = new firebase.auth.GoogleAuthProvider();

  // Step 2: Only allow IIT(ISM) emails
  provider.setCustomParameters({
    hd: 'iitism.ac.in'  // Hosted domain
  });

  // Step 3: Show Google login popup
  const result = await auth.signInWithPopup(provider);

  // Step 4: Verify email domain
  const email = result.user.email;
  if (!email.endsWith('@iitism.ac.in')) {
    await auth.signOut();
    throw new Error('Only IIT(ISM) emails allowed!');
  }

  // Step 5: User is logged in! 🎉
  console.log('Welcome,', result.user.displayName);
};
```

### Protected Routes

Some pages require login. Here's how we protect them:

```typescript
// components/ProtectedRoute.tsx

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Still checking if user is logged in
  if (loading) {
    return <LoadingSpinner />;
  }

  // Not logged in? Send to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Logged in! Show the page
  return <>{children}</>;
};
```

**Usage:**

```typescript
<Route path="/" element={
  <ProtectedRoute>
    <Dashboard />  {/* Only accessible when logged in */}
  </ProtectedRoute>
} />
```

---

## 9. Styling - Making It Pretty

### Tailwind CSS

College Central uses **Tailwind CSS** - utility classes for styling:

```typescript
// Instead of writing CSS in a separate file:
// ❌ Old way:
// .button { padding: 8px; background: blue; color: white; }

// ✅ New way - Tailwind classes directly in HTML:
<button className="px-4 py-2 bg-blue-500 text-white rounded">
  Click Me
</button>
```

### Common Tailwind Classes

```typescript
// Spacing
<div className="p-4">       {/* padding: 1rem (16px) */}
<div className="m-8">       {/* margin: 2rem (32px) */}
<div className="mt-2">      {/* margin-top: 0.5rem */}

// Colors
<div className="bg-blue-500">    {/* Blue background */}
<div className="text-white">     {/* White text */}

// Layout
<div className="flex">           {/* Display: flex */}
<div className="grid grid-cols-3"> {/* 3 column grid */}

// Responsive
<div className="md:text-lg lg:text-xl"> {/* Different sizes on different screens */}
```

### Real Example from Login Page

```typescript
<button className="
  w-full                  // Full width
  py-4 px-6               // Padding: 16px vertical, 24px horizontal
  bg-gradient-to-r        // Gradient background
  from-blue-500           // Start color
  to-purple-500           // End color
  text-white              // White text
  rounded-2xl             // Rounded corners
  hover:opacity-90        // 90% opacity on hover
  transition-all          // Smooth transitions
">
  Sign in with Google
</button>
```

---

## 10. Real-Time Updates

### Understanding Context API

Context is like a **global state** that any component can access:

```typescript
// Think of Context as a "global variable" for React

// Step 1: Create a Context
const GradesContext = createContext();

// Step 2: Create a Provider (wrapper that stores data)
const GradesProvider = ({ children }) => {
  const [grades, setGrades] = useState([]);

  return (
    <GradesContext.Provider value={{ grades, setGrades }}>
      {children}
    </GradesContext.Provider>
  );
};

// Step 3: Wrap your app
<GradesProvider>
  <App />
</GradesProvider>

// Step 4: Use it anywhere in your app!
const MyComponent = () => {
  const { grades } = useContext(GradesContext);
  return <div>{grades.length} grades found</div>;
};
```

### Real Example: GradesContext

```typescript
// contexts/GradesContext.tsx (simplified)

export const GradesProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to grade changes
    const unsubscribe = db
      .collection('users')
      .doc(currentUser.uid)
      .collection('grades')
      .onSnapshot((snapshot) => {
        const newGrades = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setGrades(newGrades);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [currentUser]);

  // Add a new grade
  const addGrade = async (gradeData) => {
    await db
      .collection('users')
      .doc(currentUser.uid)
      .collection('grades')
      .add(gradeData);

    // No need to manually update UI!
    // onSnapshot() will catch the change automatically
  };

  const value = {
    grades,
    loading,
    addGrade
  };

  return (
    <GradesContext.Provider value={value}>
      {children}
    </GradesContext.Provider>
  );
};

// Custom hook for easy access
export const useGrades = () => {
  const context = useContext(GradesContext);
  return context;
};
```

**Using it in a component:**

```typescript
function GradesPage() {
  const { grades, loading, addGrade } = useGrades();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Grades</h1>
      {grades.map(grade => (
        <div key={grade.id}>
          {grade.subject}: {grade.grade}
        </div>
      ))}
    </div>
  );
}
```

---

## 11. Forms and User Input

### Controlled Components

In React, form inputs are **controlled** by state:

```typescript
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();  // Prevent page reload
    console.log('Email:', email);
    console.log('Password:', password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
      />

      <button type="submit">Login</button>
    </form>
  );
}
```

**What's happening:**

1. **value={email}**: Input shows current state
2. **onChange={...}**: Updates state when user types
3. **e.target.value**: The new value user typed
4. **e.preventDefault()**: Stops page from reloading

### Validation Example

```typescript
function GradeForm() {
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!subject) {
      setError('Subject is required');
      return;
    }

    if (!['A', 'B', 'C', 'D', 'F'].includes(grade)) {
      setError('Invalid grade');
      return;
    }

    // All good! Save to database
    addGrade({ subject, grade });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <input
        value={subject}
        onChange={(e) => {
          setSubject(e.target.value);
          setError('');  // Clear error when user types
        }}
      />

      <select value={grade} onChange={(e) => setGrade(e.target.value)}>
        <option value="">Select grade</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
      </select>

      <button type="submit">Add Grade</button>
    </form>
  );
}
```

---

## 12. Deployment - Going Live

### The Journey from Code to Production

```
Your Computer               Firebase                Internet
    (Dev)                  (Server)                 (Users)
      │                        │                       │
      │  1. npm run build      │                       │
      │  ──────────────→       │                       │
      │  (Creates dist/)       │                       │
      │                        │                       │
      │  2. firebase deploy    │                       │
      │  ───────────────────→  │                       │
      │                        │  (Hosting, CDN)       │
      │                        │                       │
      │                        │  3. Users access      │
      │                        │  ←───────────────────  │
      │                        │  yourdomain.com       │
```

### Build Process

```bash
# 1. Build for production
npm run build

# What happens:
# - TypeScript → JavaScript
# - JSX → Plain JavaScript
# - Bundle all files together
# - Minify (compress) code
# - Generate dist/ folder
```

### Firebase Deploy

```bash
# 2. Deploy to Firebase
firebase deploy

# What happens:
# - Uploads dist/ folder to Firebase Hosting
# - Updates Firestore rules
# - Deploys Cloud Functions
# - Your app is now live! 🚀
```

### Environment Variables

```typescript
// Never commit secrets to Git!

// .env file (NOT committed)
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_PROJECT_ID=your_project

// Access in code
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
```

---

## 📖 Putting It All Together - The Complete Flow

Let's trace what happens when you open College Central:

### Step 1: Initial Load

```typescript
// 1. Browser loads index.html
<html>
  <body>
    <div id="root"></div>  <!-- Empty container -->
    <script src="main.js"></script>
  </body>
</html>

// 2. index.tsx runs
ReactDOM.createRoot(document.getElementById('root')).render(<App />);

// 3. App.tsx loads
function App() {
  return (
    <AuthProvider>      // Checks if user is logged in
      <UserProvider>    // Loads user data
        <RouterProvider router={router} />  // Shows correct page
      </UserProvider>
    </AuthProvider>
  );
}
```

### Step 2: User Logs In

```typescript
// 4. User clicks "Sign in with Google"
const loginWithGoogle = async () => {
  // Opens Google popup
  const result = await auth.signInWithPopup(provider);

  // 5. Google returns user info
  const user = result.user;

  // 6. AuthProvider updates
  setCurrentUser(user);
  setIsAuthenticated(true);

  // 7. Router sees user is authenticated
  // Redirects to Dashboard
  navigate('/');
};
```

### Step 3: Dashboard Loads

```typescript
// 8. Dashboard component renders
function Dashboard() {
  const { grades } = useGrades();    // Gets grades from Context
  const { schedule } = useSchedule(); // Gets schedule from Context

  // 9. Contexts fetch data from Firestore
  useEffect(() => {
    const unsubscribe = db
      .collection('users')
      .doc(userId)
      .collection('grades')
      .onSnapshot((snapshot) => {
        setGrades(snapshot.docs.map(doc => doc.data()));
      });

    return () => unsubscribe();
  }, [userId]);

  // 10. UI renders with data
  return (
    <div>
      <h1>Dashboard</h1>
      <div>CGPA: {calculateCGPA(grades)}</div>
      <div>Next Class: {getNextClass(schedule)}</div>
    </div>
  );
}
```

### Step 4: Real-Time Update

```typescript
// 11. User adds a new grade
const addGrade = async (gradeData) => {
  // Writes to Firestore
  await db.collection('users')
    .doc(userId)
    .collection('grades')
    .add(gradeData);

  // 12. onSnapshot() detects change
  // Automatically updates UI
  // No page refresh needed! ✨
};
```

---

## 🎯 Key Concepts Summary

### 1. **Components**
- Reusable pieces of UI
- Can contain other components
- Return JSX (HTML-like syntax)

### 2. **State**
- Component memory
- Changes trigger re-renders
- Use `useState()` for local state
- Use Context for global state

### 3. **Props**
- Data passed from parent to child
- Like function parameters
- Read-only (cannot be changed by child)

### 4. **Hooks**
- Special functions starting with `use`
- Add functionality to components
- Examples: `useState`, `useEffect`, `useContext`

### 5. **Effects**
- Run code after render
- Handle side effects (API calls, subscriptions)
- Clean up when component unmounts

### 6. **Routing**
- Navigate between pages
- No page reload
- Maintains state

### 7. **Database**
- Firestore stores data
- Real-time synchronization
- User-scoped security

### 8. **Authentication**
- Google OAuth only
- Domain restricted
- Firebase handles tokens

---

## 💡 Best Practices from College Central

### 1. **File Organization**
```
pages/       → Full page components
components/  → Reusable UI pieces
contexts/    → Global state providers
hooks/       → Custom hooks
services/    → API calls, utilities
utils/       → Helper functions
```

### 2. **Naming Conventions**
```typescript
// Components: PascalCase
const MyComponent = () => { };

// Functions: camelCase
const handleClick = () => { };

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Files: Same as component name
MyComponent.tsx
```

### 3. **TypeScript Types**
```typescript
// Always define types
interface User {
  name: string;
  email: string;
  age: number;
}

// Use types for props
interface ButtonProps {
  text: string;
  onClick: () => void;
}

const Button: React.FC<ButtonProps> = ({ text, onClick }) => {
  return <button onClick={onClick}>{text}</button>;
};
```

### 4. **Error Handling**
```typescript
try {
  await loginWithGoogle();
} catch (error) {
  if (error.code === 'auth/popup-closed-by-user') {
    setError('Sign-in cancelled');
  } else {
    setError('An error occurred');
  }
  console.error(error);
}
```

### 5. **Loading States**
```typescript
const [loading, setLoading] = useState(true);

if (loading) {
  return <LoadingSpinner />;
}

return <ActualContent />;
```

---

## 🚀 Next Steps for Learning

### 1. **Start Small**
- Build a simple counter app
- Add a form with state
- Style with Tailwind CSS

### 2. **Add Complexity**
- Multiple pages with routing
- API calls with fetch
- User authentication

### 3. **Go Full Stack**
- Set up Firebase
- Implement real-time updates
- Deploy to production

### 4. **Master Advanced Topics**
- Performance optimization
- Testing
- CI/CD pipelines
- Error monitoring

---

## 📚 Resources

### Official Documentation
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org\]
- **Tailwind CSS**: https://tailwindcss.com
- **Firebase**: https://firebase.google.com/docs

### Learning Platforms
- **freeCodeCamp**: Free coding tutorials
- **MDN Web Docs**: Web development reference
- **React Tutorial**: Official React tutorial
- **Scrimba**: Interactive coding lessons

---

## 🎓 Practice Exercises

### Exercise 1: Simple Component
```typescript
// Create a Greeting component that:
// 1. Takes a 'name' prop
// 2. Displays "Hello, [name]!"
// 3. Has a button that changes to "Goodbye, [name]!"

function Greeting({ name }) {
  // Your code here
}
```

### Exercise 2: State Management
```typescript
// Create a TodoList component that:
// 1. Has an input to add todos
// 2. Displays all todos
// 3. Can delete todos
// 4. Counts remaining todos

function TodoList() {
  // Your code here
}
```

### Exercise 3: API Integration
```typescript
// Create a UserProfile component that:
// 1. Fetches user data from an API
// 2. Shows loading state
// 3. Handles errors
// 4. Displays user info

function UserProfile({ userId }) {
  // Your code here
}
```

---

## 🎉 Conclusion

You've learned:
✅ How web applications work
✅ React fundamentals
✅ State management
✅ Routing and navigation
✅ Database integration
✅ Authentication
✅ Styling
✅ Deployment

**Remember**: Every expert was once a beginner. Keep practicing, keep building, and don't be afraid to make mistakes!

---

**Happy Coding!** 🚀

*This guide uses real code from College Central - a production-ready application serving 500+ students at IIT(ISM) Dhanbad.*
