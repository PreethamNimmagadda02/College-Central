<div align="center">

# 🎓 College Central

### Your Complete Academic Companion

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.4-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**A Progressive Web Application for college students to manage academics, navigate campus, and stay connected.**

**Multi-tenant architecture** - Deploy to multiple colleges with separate Firebase projects.

[Architecture](./docs/ARCHITECTURE.md) • [Onboarding](./docs/COLLEGE_ONBOARDING.md)

</div>

---

## ✨ Highlights

🎯 **All-in-One Platform** • 🤖 **AI-Powered** • 📱 **Progressive Web App** • 🔒 **Secure & Private** • ⚡ **Lightning Fast** • 🎨 **Beautiful UI**

---

## 🌟 Features

### 📚 Academic Management
- **Dashboard** - Personalized overview, CGPA tracking, AI weather widget, activity feed, quick links
- **Grades & CGPA** - Semester-wise tracking, automatic CGPA/SGPA calculation, attendance monitoring, PDF export
- **Class Schedule** - Weekly timetable, custom tasks, room/faculty info, recurring events, notifications
- **Academic Calendar** - Event management, exam schedules, holiday tracking, custom reminders

### 🗺️ Campus & Resources
- **Interactive Campus Map** - Google Maps integration, location search, directions, saved places
- **Campus Directory** - Contact directory, buildings, hostels, dining, sports, medical facilities
- **College Forms** - Categorized repository, direct links, deadline tracking, search & filter

### 👤 Profile & Personalization
- Profile picture upload, personal/academic info, activity history, data export, dark mode, Google OAuth

### 🔧 Admin Dashboard
- **Role-based Access** - Admin emails configured in Firestore
- **College Configuration** - Manage college info, branches, hostels
- **Content Management** - Quick links, quotes, forms, academic calendar
- **Directory Management** - Faculty and student directories with Excel import
- **Course Catalog** - Manage courses with CBCS/NEP support
- **User Analytics** - Track user engagement, demographics, activity
- **Campus Map Editor** - Manage locations and routes

---

## 🏗️ Tech Stack

**Frontend:** React 19.2 • TypeScript 5.8 • Vite 6.2 • React Router 7.9 • Tailwind CSS 4.1 • Framer Motion • Lucide React

**Backend:** Firebase (Authentication, Firestore, Storage, Hosting, Cloud Functions, Performance, Analytics)

**AI & Services:** Google Gemini AI • Google OAuth • Google Maps • Open-Meteo API

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+) • npm/yarn • Firebase Account • Google Gemini API Key

### Installation

```bash
# Clone repository
git clone https://github.com/PreethamNimmagadda02/College-Central.git
cd College-Central

# Install dependencies
npm install

# Create .env.local file
echo "VITE_GEMINI_API_KEY=your_gemini_api_key_here" > .env.local

# Update src/lib/firebase.ts with your Firebase credentials

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run seed:firestore -- --admin <email>` | Seed a new project's config and grant admin |

---

## 🔧 Configuration

### Firebase Setup
1. Create project at [Firebase Console](https://console.firebase.google.com/)
2. Enable: Authentication (Google), Firestore, Storage, Hosting, Cloud Functions
3. Update `src/lib/firebase.ts` with your credentials
4. Deploy the security rules: `firebase deploy --only firestore,storage`
5. Seed the config and your admin account: `npm run seed:firestore -- --admin you@college.edu` (sign in once, then run it again to set your role)

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Google Gemini API
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env.local`: `VITE_GEMINI_API_KEY=your_api_key`

### Domain Restriction
App restricted to configured email domain (e.g., `@iitism.ac.in`). Set via `VITE_ALLOWED_EMAIL_DOMAIN` environment variable.

---

## 📁 Project Structure

```
College Central/
├── src/                    # All source code
│   ├── main.tsx            # Application entry point
│   ├── App.tsx             # Root component, router & providers
│   ├── components/         # Shared UI components
│   │   ├── common/         # ErrorBoundary, ProtectedRoute, etc.
│   │   ├── layout/         # Header, Sidebar, Footer
│   │   └── icons/          # SVG icon components
│   ├── features/           # Feature modules
│   │   ├── admin/          # Admin dashboard (20+ components)
│   │   └── auth/           # Authentication hooks
│   ├── pages/              # Route-level page components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Shared custom hooks
│   ├── services/           # API & external services
│   ├── lib/                # Core utilities (firebase, utils/)
│   ├── config/             # Static configuration data
│   ├── data/               # Static data files
│   └── types/              # Global TypeScript types
├── docs/                   # ARCHITECTURE.md, guides
├── public/                 # Static assets
├── scripts/                # Build/deployment scripts
└── functions/              # Firebase Cloud Functions
```

---

## 🎯 Key Features

**Real-time Sync** - Firestore `onSnapshot()` listeners sync data across devices instantly  
**Optimistic Updates** - UI updates immediately, syncs in background  
**Activity Logging** - All user actions logged for audit trail  
**PWA** - Install on any device, works offline, push notifications  
**Security** - Google OAuth, domain restriction, Firestore security rules, user-scoped data  
**Admin Panel** - Role-based configuration management with real-time sync  
**Path Aliases** - Clean imports with `@components/`, `@features/`, `@lib/`, etc.

---

## 🚀 Deployment

```bash
npm run build                    # Build for production
npm install -g firebase-tools    # Install Firebase CLI
firebase login                   # Login to Firebase
firebase init                    # Initialize (if needed)
firebase deploy                  # Deploy
```

### Multi-Tenant Deployment

For deploying to multiple colleges with separate Firebase projects:

```bash
# Deploy single college (via GitHub Actions)
Actions → "Deploy to College" → Run workflow → Select college

# Deploy all colleges (via GitHub Actions, requires confirmation)
Actions → "Deploy to All Colleges" → Run workflow → Type "deploy-all"
```

**Adding a new college:**
1. Create Firebase project (see [COLLEGE_ONBOARDING.md](./docs/COLLEGE_ONBOARDING.md))
2. Create `colleges/<college-id>/.env.production.template`
3. Add GitHub secrets: `<COLLEGE>_FIREBASE_*`, `<COLLEGE>_GEMINI_API_KEY`
4. Update workflow files to include new college in options

---

## 📊 Performance

⚡ Bundle: ~200KB • 🚀 TTI: <2s • 🎨 FCP: <1s • 📱 Lighthouse: 95+

---

## 👨‍💻 Founder

<div align="center">

**Preetham Nimmagadda** • IIT(ISM) Dhanbad

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/preethamnimmagadda)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/PreethamNimmagadda02)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:preethamnimmagadda@gmail.com)

</div>
