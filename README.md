# IIT(ISM) Student Central

A comprehensive web application designed specifically for IIT (ISM) Dhanbad students to manage their academic life, stay connected with campus activities, and access essential resources all in one place.

## 🌟 Features

### 📚 Academic Management
- **Dashboard**: Personalized overview with today's schedule, CGPA tracking, and semester progress
- **Class Schedule**: View and manage your weekly timetable with detailed class information
- **Grades & CGPA**: Track academic performance with semester-wise grades and CGPA calculation
- **Academic Calendar**: Interactive calendar with semester events, exam schedules, and custom reminders
- **Study Resources**: Access and organize subject-specific study materials

### 🗺️ Campus Navigation
- **Interactive Campus Map**: Navigate the campus with Google Maps integration
- **Location Directory**: Comprehensive list of academic buildings, hostels, and facilities
- **Popular Routes**: Quick access to frequently used campus routes
- **Saved Places**: Bookmark important locations for quick access

### 📰 Stay Updated
- **News & Events**: Real-time campus announcements and upcoming events
- **Activity Feed**: Track your interactions and activities within the app 
- **Weather Widget**: Campus weather updates with AI-powered recommendations

### 🎯 Additional Features
- **User Profile Management**: Customize your profile with personal information and preferences
- **Quick Links**: Customizable shortcuts to important portals (Email, LMS, CDC, Library, etc.)
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices

## 🚀 Run Locally

**Prerequisites:**  Node.js (v16 or higher)

1. Clone the repository:
   ```bash
   git clone <https://github.com/PreethamNimmagadda02/Student-Central>
   cd Student-Central
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env.local` file in the root directory
   - Set the `VITE_GEMINI_API_KEY` to your Gemini API key:
     ```
     VITE_GEMINI_API_KEY=your_api_key_here
     ```

4. Run the app:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## 🏗️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **AI Integration**: Google Gemini API
- **Maps**: Google Maps Platform
- **Weather**: Open-Meteo API

## 📁 Project Structure

```
iit-ism-student-hub/
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React Context providers
│   ├── data/             # Static data and constants
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── services/         # API and Firebase services
│   ├── types/            # TypeScript type definitions
│   └── App.tsx           # Main application component
├── public/               # Static assets
└── ...config files
```

## 🔑 Key Dependencies

- `react` & `react-dom` - UI library
- `firebase` - Backend services
- `react-router-dom` - Client-side routing
- `tailwindcss` - Utility-first CSS framework
- `@google/generative-ai` - Gemini AI integration

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📝 Configuration

### Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication, Firestore, and Storage
3. Add your Firebase configuration to `src/firebaseConfig.ts`

### Gemini API Setup
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to `.env.local` as `VITE_GEMINI_API_KEY`

## 👨‍💻 Developed By

### Preetham Nimagadda
### IIT(ISM) Dhanbad

---

**Note**: This application is specifically designed for IIT (ISM) Dhanbad students and contains features tailored to the campus environment.
