import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../components/icons/SidebarIcons';
import { App as CapacitorApp } from '@capacitor/app';


const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { loginWithGoogle, isAuthenticated, loading: authLoading } = useAuth();
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
        navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Smooth parallax scroll effect with requestAnimationFrame
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Capacitor back button handler
  useEffect(() => {
    const registerBackButton = async () => {
      const listener = await CapacitorApp.addListener('backButton', () => {
        CapacitorApp.exitApp();
      });
      return listener;
    };

    const listenerPromise = registerBackButton();

    return () => {
      const removeListener = async () => {
        const listener = await listenerPromise;
        listener.remove();
      };
      removeListener();
    };
  }, []);


  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      // On success, useEffect will navigate
    } catch (err: any) {
      if (err.message && err.message.includes('INVALID_DOMAIN')) {
        setError('Only IIT(ISM) email addresses (@iitism.ac.in) are allowed. Please use your institutional email.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked. Please allow pop-ups for this site.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // User opened multiple pop-ups, ignore this error
        setError('');
      } else {
        setError('Google sign-in failed. Please try again.');
        console.error("Google Sign-In Error:", err);
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };


  if (authLoading || isAuthenticated) {
     return (
        <div className="flex items-center justify-center h-screen bg-light-bg dark:bg-dark-bg">
            <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
        </div>
     );
  }

  return (
    <>
      {/* Fixed Logo and Name - Top Left (appears when scrolling past first section) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed top-6 left-6 z-50 transition-all duration-700 ease-out cursor-pointer group/logo ${
          scrollY > window.innerHeight * 0.8
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-8 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 p-2 rounded-xl shadow-lg group-hover/logo:shadow-xl group-hover/logo:scale-110 transition-all duration-300">
              <LogoIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-lg md:text-xl font-black text-white tracking-tight leading-tight drop-shadow-lg group-hover/logo:text-blue-200 transition-colors duration-300">
              College Central
            </h1>
            <p className="text-[10px] md:text-xs text-white/80 font-light drop-shadow-md">
              IIT (ISM) Dhanbad
            </p>
          </div>
        </div>
      </button>

      {/* Main Scrolling Content - Full Width */}
      <div className="w-full">
        {/* Section 1: Hero with Background Image */}
        <section className="relative min-h-screen flex items-center justify-center">
          {/* Background Image with Parallax */}
          <div
            className="absolute inset-0 bg-cover bg-center will-change-transform"
            style={{
              backgroundImage: "url('/iitism_banner_new.gif')",
              transform: `translate3d(0, ${scrollY * 0.3}px, 0)`,
              backfaceVisibility: 'hidden'
            }}
          ></div>

          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-blue-900/30 to-purple-900/40"></div>

          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>
          </div>

          {/* Centered Content */}
          <div className="relative z-10 w-full px-4 flex flex-col items-center justify-center min-h-screen -mt-32">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              {/* Logo */}
              <div className="flex justify-center mb-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 p-4 rounded-3xl shadow-2xl">
                    <LogoIcon className="w-16 h-16 text-white" />
                  </div>
                </div>
              </div>

              {/* App Name */}
              <h1 className="text-2xl md:text-3xl font-black text-white/90 tracking-tight">
                College Central
              </h1>

              {/* Main Headline */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight pb-2">
                Your Campus Life,
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mt-2 pb-1">
                  Reimagined
                </span>
              </h2>

              {/* Subheadline */}
              <p className="text-base md:text-lg lg:text-xl text-white/70 font-light max-w-2xl mx-auto">
                Everything you need for IIT (ISM) — in one place
              </p>

            </div>

            {/* Scroll Indicator - Positioned below content */}
            <div className="w-full absolute bottom-12 flex justify-center">
              <button
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                className="flex flex-col items-center gap-2 text-white/50 hover:text-white/80 transition-colors cursor-pointer animate-bounce"
                aria-label="Scroll to next section"
              >
                <span className="text-xs font-medium uppercase tracking-wider">Scroll to explore</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Continuous Content Section */}
        <section className="relative overflow-hidden">
          {/* Gradient Background - More vibrant and student-friendly */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"></div>

          {/* Decorative Elements - More playful and dynamic */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Top left blob */}
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
            {/* Top right blob */}
            <div className="absolute top-40 -right-20 w-80 h-80 bg-cyan-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            {/* Middle left blob */}
            <div className="absolute top-[600px] -left-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            {/* Middle right blob */}
            <div className="absolute top-[800px] -right-24 w-[500px] h-[500px] bg-pink-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            {/* Bottom left blob */}
            <div className="absolute top-[1200px] left-20 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            {/* Bottom right blob */}
            <div className="absolute top-[1600px] -right-32 w-96 h-96 bg-violet-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2.5s' }}></div>
            {/* Accent blob */}
            <div className="absolute top-[400px] left-1/2 transform -translate-x-1/2 w-64 h-64 bg-yellow-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
          </div>

          {/* Mission Statement */}
          <div className="relative flex flex-col justify-center items-center px-6 py-12 md:py-16">
            <div className="max-w-4xl space-y-6 text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-full text-base md:text-lg text-white/90 border border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>Built by students, for students</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                Your Complete Campus Companion
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-white/80 leading-relaxed max-w-3xl mx-auto">
                College Central is the all-in-one platform designed specifically for IIT (ISM) Dhanbad students.
                From tracking your academic performance to navigating campus and staying organized, we bring
                everything you need into one seamless experience.
              </p>

              {/* Key Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pt-4 max-w-3xl mx-auto">
                <div className="group bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">⚡</div>
                  <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Save Time Daily</h3>
                  <p className="text-white/60 text-xs sm:text-sm md:text-base">No more app switching. Access grades, schedules, and campus info instantly.</p>
                </div>
                <div className="group bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">📈</div>
                  <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Stay Organized</h3>
                  <p className="text-white/60 text-xs sm:text-sm md:text-base">Keep track of assignments, exams, and important dates effortlessly.</p>
                </div>
                <div className="group bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1 sm:col-span-2 md:col-span-1">
                  <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">🎯</div>
                  <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Focus on What Matters</h3>
                  <p className="text-white/60 text-xs sm:text-sm md:text-base">Spend less time managing, more time learning and connecting.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="relative flex flex-col justify-center items-center px-6 py-10 md:py-14">
            <div className="max-w-5xl w-full space-y-8 relative z-10">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white">
                  Powerful Features at Your Fingertips
                </h2>
                <p className="text-base md:text-lg lg:text-xl text-white/70 max-w-2xl mx-auto">
                  Designed specifically for IIT (ISM) students to streamline your academic journey
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                {/* Feature 1 */}
                <div className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 sm:p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-3xl sm:text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      📊
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">CGPA Tracker</h3>
                      <p className="text-sm sm:text-base md:text-lg text-white/70 leading-relaxed">
                        Calculate your CGPA and SGPA instantly. Track your grades semester-wise with
                        detailed analytics and performance insights. Know exactly where you stand academically.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 sm:p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-3xl sm:text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      📅
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Smart Schedule Manager</h3>
                      <p className="text-sm sm:text-base md:text-lg text-white/70 leading-relaxed">
                        Organize your class timetable, assignments, and important dates. Get reminders
                        for upcoming classes and never miss what matters. Your schedule, perfectly synced.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 sm:p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center text-3xl sm:text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      🗺️
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Campus Navigation</h3>
                      <p className="text-sm sm:text-base md:text-lg text-white/70 leading-relaxed">
                        Interactive campus maps help you find any building, classroom, or facility instantly.
                        Perfect for new students and anyone exploring our vast campus.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 sm:p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-3xl sm:text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      📚
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Resource Hub</h3>
                      <p className="text-sm sm:text-base md:text-lg text-white/70 leading-relaxed">
                        Access college forms, academic calendars, and important documents all in one place.
                        Never miss a deadline or struggle to find essential resources again.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Features Highlight */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-white/10 max-w-3xl mx-auto">
                <h4 className="text-white font-bold text-base sm:text-lg md:text-xl text-center mb-3 sm:mb-4">And More...</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-base md:text-lg text-white/70">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-lg sm:text-xl">✓</span>
                    <span>Academic calendar & event tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-lg sm:text-xl">✓</span>
                    <span>College forms & resources access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-lg sm:text-xl">✓</span>
                    <span>Activity history & analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-lg sm:text-xl">✓</span>
                    <span>Dark mode support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="relative flex flex-col justify-center items-center px-6 py-10 md:py-14">
            <div className="max-w-4xl w-full space-y-8 relative z-10">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                  Trusted by the IIT (ISM) Community
                </h2>
                <p className="text-base md:text-lg lg:text-xl text-white/70 max-w-2xl mx-auto">
                  Join hundreds of students who are already using College Central to stay organized,
                  track their progress, and make the most of their college experience.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-3xl mx-auto">
                <div className="group flex flex-col items-center justify-center space-y-1 sm:space-y-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-black text-yellow-300 group-hover:scale-110 transition-transform duration-300">500+</div>
                  <div className="text-white/80 text-xs sm:text-sm md:text-base text-center">Active Students</div>
                </div>
                <div className="group flex flex-col items-center justify-center space-y-1 sm:space-y-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-black text-yellow-300 group-hover:scale-110 transition-transform duration-300">10K+</div>
                  <div className="text-white/80 text-xs sm:text-sm md:text-base text-center">Grades Tracked</div>
                </div>
                <div className="group flex flex-col items-center justify-center space-y-1 sm:space-y-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-black text-yellow-300 group-hover:scale-110 transition-transform duration-300">4.8★</div>
                  <div className="text-white/80 text-xs sm:text-sm md:text-base text-center">User Rating</div>
                </div>
                <div className="group flex flex-col items-center justify-center space-y-1 sm:space-y-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-black text-yellow-300 group-hover:scale-110 transition-transform duration-300">98%</div>
                  <div className="text-white/80 text-xs sm:text-sm md:text-base text-center">Uptime</div>
                </div>
              </div>

              {/* Testimonials */}
              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-3xl mx-auto">
                <div className="group bg-white/10 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <p className="text-white/90 text-sm sm:text-base md:text-lg italic leading-relaxed mb-3 md:mb-4">
                    "College Central has made my life so much easier. I can check my schedule, track my CGPA, and find classrooms all in one app!"
                  </p>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 group-hover:scale-110 transition-transform duration-300"></div>
                    <div className="text-left">
                      <p className="text-white/80 text-xs sm:text-sm md:text-base font-semibold">CSE Student</p>
                      <p className="text-white/60 text-xs md:text-sm">2nd Year</p>
                    </div>
                  </div>
                </div>

                <div className="group bg-white/10 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <p className="text-white/90 text-sm sm:text-base md:text-lg italic leading-relaxed mb-3 md:mb-4">
                    "The CGPA tracker is amazing! No more manual calculations. It's accurate, fast, and helps me stay on top of my academics."
                  </p>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-500 group-hover:scale-110 transition-transform duration-300"></div>
                    <div className="text-left">
                      <p className="text-white/80 text-xs sm:text-sm md:text-base font-semibold">ECE Student</p>
                      <p className="text-white/60 text-xs md:text-sm">3rd Year</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why Choose Section */}
              <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-5 sm:p-6 md:p-8 border border-white/10">
                <h4 className="text-white font-bold text-lg sm:text-xl md:text-2xl text-center mb-4 sm:mb-6">Why Students Love College Central</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="group text-center p-4 rounded-lg hover:bg-white/5 transition-all duration-300 hover:-translate-y-1">
                    <div className="text-2xl sm:text-3xl md:text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">🔒</div>
                    <h5 className="text-white font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Secure & Private</h5>
                    <p className="text-white/60 text-xs sm:text-sm md:text-base">Your data is encrypted and only accessible by you</p>
                  </div>
                  <div className="group text-center p-4 rounded-lg hover:bg-white/5 transition-all duration-300 hover:-translate-y-1">
                    <div className="text-2xl sm:text-3xl md:text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">📱</div>
                    <h5 className="text-white font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Works Everywhere</h5>
                    <p className="text-white/60 text-xs sm:text-sm md:text-base">Access from any device, anytime, anywhere</p>
                  </div>
                  <div className="group text-center p-4 rounded-lg hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 sm:col-span-2 md:col-span-1">
                    <div className="text-2xl sm:text-3xl md:text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">⚡</div>
                    <h5 className="text-white font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Lightning Fast</h5>
                    <p className="text-white/60 text-xs sm:text-sm md:text-base">Optimized performance for quick access to all features</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="relative flex flex-col justify-center items-center px-6 py-8 md:py-10">
            <div className="max-w-2xl text-center space-y-4 relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                Ready to Simplify Your College Life?
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-white/70">
                Sign in with your IIT (ISM) email and get started in seconds. No setup required.
              </p>
              <div className="flex items-center justify-center gap-2 text-white/60 text-sm md:text-base">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Only @iitism.ac.in emails accepted</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="relative flex flex-col justify-center items-center px-6 pb-16 md:pb-20">
            <div className="w-full max-w-md relative z-10">

            {/* Login Card */}
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 overflow-hidden group hover:bg-white/[0.12] hover:border-white/30 transition-all duration-300">
                {/* Floating gradient orbs - static positioning */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl opacity-70"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl opacity-70"></div>

                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>

                {/* Top border accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                    {/* Tab Selector */}
                    <div className="mb-8">
                        <div className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/20">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(false);
                                    setError('');
                                }}
                                className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-all duration-300 ${
                                    !isSignUp
                                        ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg scale-105'
                                        : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(true);
                                    setError('');
                                }}
                                className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-all duration-300 ${
                                    isSignUp
                                        ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg scale-105'
                                        : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-white/70 text-base md:text-lg flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            {isSignUp ? 'Join your campus community today' : 'Sign in to access your campus hub'}
                        </p>
                    </div>

                {/* Error Message */}
                {error && (
                    <div className="relative bg-red-500/10 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 animate-shake overflow-hidden mb-4">
                        {/* Animated error glow */}
                        <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>

                        <div className="relative flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-red-200 leading-relaxed">{error}</p>
                        </div>
                    </div>
                )}

                {/* Google Sign-In Button */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleSubmitting}
                    className="relative w-full group/btn"
                >
                    <div className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-[2px] group-hover/btn:shadow-lg group-hover/btn:shadow-purple-500/50 transition-all duration-300">
                        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl group-hover/btn:from-indigo-500 group-hover/btn:via-purple-500 group-hover/btn:to-pink-500 transition-all duration-300">
                            {/* Subtle top light */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                            <div className="relative flex justify-center items-center gap-3 py-4 px-6 text-white font-bold text-base md:text-lg focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-[0.98]">
                                {isGoogleSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Signing In...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                                            <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#FFFFFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#FFFFFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        <span>{isSignUp ? 'Sign up with Google' : 'Sign in with Google'}</span>
                                        <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </button>

            {/* Security badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-white/60 text-sm md:text-base">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Secured with end-to-end encryption</span>
            </div>
        </div>
            </div>
            </div>
          </div>

        </section>
      </div>
    </>
  );
};

export default Login;