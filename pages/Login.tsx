import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../components/icons/SidebarIcons';
import { App as CapacitorApp } from '@capacitor/app';

// Local icon components for clarity
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeSlashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);


const Login: React.FC = () => {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, register, loginWithGoogle, isAuthenticated, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const navigate = useNavigate();
  const admissionInputRef = React.useRef<HTMLInputElement>(null);
  const passwordInputRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
        navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const email = `${admissionNumber.trim().toLowerCase()}@iitism.ac.in`;

    try {
      await login(email, password);
      // On success, useEffect will navigate
    } catch (err: any) {
      // In newer Firebase versions, 'auth/invalid-credential' can mean user not found OR wrong password.
      // So, we try to register, but if that fails with 'email-already-in-use', it was a wrong password.
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await register(email, password);
          // On successful registration, useEffect will handle navigation
        } catch (registerErr: any) {
          if (registerErr.code === 'auth/weak-password') {
            setError('Password is too weak. It should be at least 6 characters.');
          } else if (registerErr.code === 'auth/email-already-in-use') {
            setError('Invalid credentials. Please check your admission number and password.');
          } else {
            setError('Registration failed. Please try again.');
          }
          console.error("Registration Error:", registerErr);
        }
      } else if (err.code === 'auth/invalid-email') {
         setError('The admission number format is invalid. Please check for spaces or typos.');
      } else if (err.code === 'auth/wrong-password') {
         setError('Invalid credentials. Please check your admission number and password.');
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error("Login Error:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
       <div className="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-screen">
        {/* Background Image */}
        <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/Login_Page.jpeg')" }}
        ></div>

        {/* Overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 via-blue-900/25 to-purple-900/30 dark:from-slate-900/50 dark:via-blue-900/40 dark:to-purple-900/50"></div>

        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/5 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-400/5 dark:bg-purple-400/5 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
            {/* Logo and Header */}
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity"></div>
                        <div className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 p-4 rounded-3xl shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                            <LogoIcon className="w-16 h-16 text-white" />
                        </div>
                    </div>
                </div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 tracking-tight leading-tight pb-1">
                    College Central
                </h1>
                <p className="text-slate-100 dark:text-slate-200 text-lg font-bold">
                    IIT (ISM) Dhanbad
                </p>
            </div>

            {/* Login Card */}
            <div className="relative bg-white/[0.015] backdrop-blur-sm rounded-3xl shadow-2xl border border-white/15 p-8 overflow-hidden group hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_50px_rgba(139,92,246,0.3)]">
                {/* Animated gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/[0.05] group-hover:via-purple-500/[0.05] group-hover:to-pink-500/[0.05] transition-all duration-700 rounded-3xl"></div>

                {/* Animated border glow */}
                <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-700"></div>

                {/* Moving gradient orbs */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-blue-600/10 rounded-full blur-3xl animate-blob"></div>
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 -right-12 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-pink-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1500ms] ease-in-out bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                </div>

                <div className="relative z-10">
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
                        <p className="text-white/70 text-sm flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Sign in to access your campus hub
                        </p>
                    </div>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Admission Number Input */}
                <div className="space-y-2">
                    <label htmlFor="admission-number" className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></span>
                        Admission Number
                    </label>
                    <div className="relative group">
                        {/* Focus glow effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>

                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                            <UserIcon className="h-5 w-5 text-white/60 group-focus-within:text-blue-300 transition-colors duration-300" />
                        </div>
                        <input
                            id="admission-number"
                            name="admission-number"
                            type="text"
                            autoComplete="username"
                            required
                            ref={admissionInputRef}
                            value={admissionNumber}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdmissionNumber(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && admissionNumber) {
                                    e.preventDefault();
                                    passwordInputRef.current?.focus();
                                }
                            }}
                            placeholder="21JE0789"
                            className="relative w-full pl-10 pr-4 py-3 text-white bg-white/10 border border-white/20 rounded-xl shadow-sm focus:outline-none focus:bg-white/15 focus:border-blue-400/50 transition-all duration-300 placeholder:text-white/40 hover:bg-white/12"
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></span>
                        Password
                    </label>
                    <div className="relative group">
                        {/* Focus glow effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>

                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                            <LockIcon className="h-5 w-5 text-white/60 group-focus-within:text-purple-300 transition-colors duration-300" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            ref={passwordInputRef}
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="relative w-full pl-10 pr-12 py-3 text-white bg-white/10 border border-white/20 rounded-xl shadow-sm focus:outline-none focus:bg-white/15 focus:border-purple-400/50 transition-all duration-300 placeholder:text-white/40 hover:bg-white/12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/60 hover:text-purple-300 transition-all duration-300 z-10 cursor-pointer hover:scale-110"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="relative bg-red-500/10 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 animate-shake overflow-hidden">
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


                {/* Sign In Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || isGoogleSubmitting}
                    className="relative w-full overflow-hidden rounded-2xl mt-6 group/btn"
                >
                    {/* Glowing border effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl opacity-75 group-hover/btn:opacity-100 blur-sm group-hover/btn:blur transition-all duration-500"></div>

                    {/* Button background */}
                    <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl transition-all duration-500">
                        {/* Animated shine overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover/btn:via-white/25 rounded-2xl transition-all duration-700"></div>

                        {/* Shimmer effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                        {/* Inner glow on hover */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/0 via-purple-600/0 to-pink-600/0 group-hover/btn:from-blue-600/30 group-hover/btn:via-purple-600/30 group-hover/btn:to-pink-600/30 transition-all duration-500"></div>

                        <div className="relative flex justify-center items-center gap-1.5 py-4 px-6 text-white font-bold text-base tracking-wide focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-[0.98]">
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="drop-shadow-lg">Signing In...</span>
                                </>
                            ) : (
                                <>
                                    <span className="drop-shadow-lg">Sign In</span>
                                    <svg className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform duration-300 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </div>
                    </div>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 py-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-white/30"></div>
                    <span className="text-white/70 font-medium text-sm px-3 py-1 bg-white/5 rounded-full border border-white/10">Or</span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/30 to-white/30"></div>
                </div>

                {/* Google Sign-In Button */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting || isGoogleSubmitting}
                    className="relative w-full flex items-center justify-center gap-3 py-3 px-4 border border-white/30 rounded-xl font-semibold text-white bg-white/5 hover:bg-white/15 hover:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-xl group overflow-hidden"
                >
                    {isGoogleSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Signing In...</span>
                        </>
                    ) : (
                        <>
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span>Sign in with Google</span>
                        </>
                    )}
                </button>
            </form>

            {/* Security badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-white/50 text-xs">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Secured with end-to-end encryption</span>
            </div>
        </div>
            </div>
        </div>
       </div>
       <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 min-h-screen flex-col justify-center items-center p-12 text-center">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>

          <div className="relative flex h-full w-full flex-col justify-center items-center p-12 text-center">
              {/* Main Heading */}
              <div className="max-w-md space-y-6">
                  <div className="space-y-3">
                      <div className="inline-block">
                          <h1 className="text-5xl font-black text-white leading-tight mb-2">
                              Your Campus,
                          </h1>
                          <h1 className="text-5xl font-black leading-tight">
                              <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-orange-300 bg-clip-text text-transparent">
                                  Simplified
                              </span>
                          </h1>
                      </div>
                      <p className="text-xl text-white/95 font-light leading-relaxed max-w-xl mx-auto">
                          Everything you need for campus life in one place
                      </p>
                  </div>

                  {/* Features Grid */}
                  <div className="grid grid-cols-2 gap-4 mt-8">
                      {/* Feature 1 */}
                      <div className="group bg-white/15 backdrop-blur-lg border border-white/30 rounded-2xl p-4 hover:bg-white/25 hover:scale-105 transition-all duration-300 shadow-xl">
                          <div className="flex flex-col items-center space-y-2">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                                  📊
                              </div>
                              <h3 className="text-md font-bold text-white">Smart Analytics</h3>
                              <p className="text-xs text-white/80 leading-relaxed">
                                  Track your academic performance with detailed insights
                              </p>
                          </div>
                      </div>

                      {/* Feature 2 */}
                      <div className="group bg-white/15 backdrop-blur-lg border border-white/30 rounded-2xl p-4 hover:bg-white/25 hover:scale-105 transition-all duration-300 shadow-xl">
                          <div className="flex flex-col items-center space-y-2">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                                  ⏰
                              </div>
                              <h3 className="text-md font-bold text-white">Live Schedules</h3>
                              <p className="text-xs text-white/80 leading-relaxed">
                                  Never miss a class with real-time timetables
                              </p>
                          </div>
                      </div>

                      {/* Feature 3 */}
                      <div className="group bg-white/15 backdrop-blur-lg border border-white/30 rounded-2xl p-4 hover:bg-white/25 hover:scale-105 transition-all duration-300 shadow-xl">
                          <div className="flex flex-col items-center space-y-2">
                              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                                  🎓
                              </div>
                              <h3 className="text-md font-bold text-white">Grade Tracker</h3>
                              <p className="text-xs text-white/80 leading-relaxed">
                                  Monitor your CGPA and semester progress
                              </p>
                          </div>
                      </div>

                      {/* Feature 4 */}
                      <div className="group bg-white/15 backdrop-blur-lg border border-white/30 rounded-2xl p-4 hover:bg-white/25 hover:scale-105 transition-all duration-300 shadow-xl">
                          <div className="flex flex-col items-center space-y-2">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                                  🗺️
                              </div>
                              <h3 className="text-md font-bold text-white">Campus Guide</h3>
                              <p className="text-xs text-white/80 leading-relaxed">
                                  Navigate campus with our interactive map
                              </p>
                          </div>
                      </div>
                  </div>

                  {/* Trust Badge */}
                  <div className="mt-8 pt-6 border-t border-white/20">
                      <p className="text-white/70 text-sm font-medium">
                          Trusted by <span className="text-yellow-300 font-bold">5,000+</span> IIT (ISM) students
                      </p>
                  </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-4 text-white/50 text-xs">
                  <p>© 2025 College Central</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Login;