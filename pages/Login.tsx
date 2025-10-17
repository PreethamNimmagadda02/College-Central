import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../components/icons/SidebarIcons';

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
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { login, register, loginWithGoogle, resetPassword, isAuthenticated, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
        navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load remembered admission number
  useEffect(() => {
    const remembered = localStorage.getItem('rememberedAdmission');
    if (remembered) {
      setAdmissionNumber(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setIsSubmitting(true);
    const email = `${admissionNumber.trim().toLowerCase()}@iitism.ac.in`;

    // Handle remember me
    if (rememberMe) {
      localStorage.setItem('rememberedAdmission', admissionNumber.trim());
    } else {
      localStorage.removeItem('rememberedAdmission');
    }

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
    setResetSuccess('');
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setIsResetting(true);

    const email = resetEmail.includes('@')
      ? resetEmail
      : `${resetEmail.trim().toLowerCase()}@iitism.ac.in`;

    try {
      await resetPassword(email);
      setResetSuccess('Password reset email sent! Check your inbox.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetSuccess('');
      }, 3000);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsResetting(false);
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
       <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="w-full max-w-md">
            {/* Logo and Header */}
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-40"></div>
                        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-xl">
                            <LogoIcon className="w-12 h-12 text-white" />
                        </div>
                    </div>
                </div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    College Central
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                    IIT (ISM) Dhanbad
                </p>
            </div>

            {/* Login Card */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8">
                {!showForgotPassword ? (
                    <>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Welcome Back!</h2>
            
            <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Admission Number Input */}
                <div>
                    <label htmlFor="admission-number" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Admission Number
                    </label>
                    <div className="relative group">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            id="admission-number"
                            name="admission-number"
                            type="text"
                            autoComplete="username"
                            required
                            value={admissionNumber}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdmissionNumber(e.target.value)}
                            placeholder="21JE0789"
                            className="w-full pl-10 pr-4 py-3 text-slate-900 bg-slate-50 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:focus:ring-blue-400 transition-all"
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Password
                    </label>
                    <div className="relative group">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <LockIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-12 py-3 text-slate-900 bg-slate-50 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:focus:ring-blue-400 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center group cursor-pointer">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                            Remember me
                        </span>
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                        Forgot password?
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                    </div>
                )}

                {/* Success Message */}
                {resetSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                        <p className="text-sm text-green-600 dark:text-green-400 text-center">{resetSuccess}</p>
                    </div>
                )}

                {/* Sign In Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || isGoogleSubmitting}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Signing In...</span>
                        </>
                    ) : 'Sign In'}
                </button>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">Or continue with</span>
                    </div>
                </div>

                {/* Google Sign-In Button */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting || isGoogleSubmitting}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md"
                >
                    {isGoogleSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-slate-700 dark:text-slate-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

                {/* Info Text */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                    First time here? An account will be created automatically.
                </p>
            </form>
            </>
                ) : (
                    /* Forgot Password Form */
                    <>
                        <div className="flex items-center mb-6">
                            <button
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setError('');
                                    setResetSuccess('');
                                }}
                                className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white ml-2">Reset Password</h2>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                            Enter your admission number or email address and we'll send you a link to reset your password.
                        </p>

                        <form className="space-y-5" onSubmit={handlePasswordReset}>
                            <div>
                                <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Admission Number or Email
                                </label>
                                <div className="relative group">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        id="reset-email"
                                        type="text"
                                        required
                                        value={resetEmail}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetEmail(e.target.value)}
                                        placeholder="21JE0789 or email@iitism.ac.in"
                                        className="w-full pl-10 pr-4 py-3 text-slate-900 bg-slate-50 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:focus:ring-blue-400 transition-all"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                                    <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                                </div>
                            )}

                            {resetSuccess && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                                    <p className="text-sm text-green-600 dark:text-green-400 text-center">{resetSuccess}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isResetting}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                            >
                                {isResetting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Sending...</span>
                                    </>
                                ) : 'Send Reset Link'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
       </div>
       <div className="hidden bg-cover bg-center lg:block relative overflow-hidden" style={{ backgroundImage: "url('https://www.iitism.ac.in/iitismnew/assets/img/gallery/main2.jpg')" }}>
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-slate-900/70 to-purple-900/80"></div>

          <div className="relative flex h-full w-full flex-col justify-between p-10">
              {/* Header */}
              <div className="space-y-2">
                  <div className="flex items-center gap-3 text-white">
                      <div className="relative">
                          <div className="absolute inset-0 bg-white rounded-xl blur opacity-40"></div>
                          <div className="relative bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
                              <LogoIcon className="h-8 w-8 text-white" />
                          </div>
                      </div>
                      <div>
                          <span className="text-xl font-bold">College Central</span>
                          <p className="text-xs text-white/80">IIT (ISM) Dhanbad</p>
                      </div>
                  </div>
              </div>

              {/* Main Content */}
              <div className="text-white space-y-6">
                  <div className="space-y-4">
                      <h1 className="text-5xl font-extrabold leading-tight">
                          Welcome to<br />
                          <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
                              IIT (ISM) Dhanbad
                          </span>
                      </h1>
                      <p className="text-xl text-white/90 max-w-md leading-relaxed">
                          Your one-stop hub for academics, campus life, and everything in between.
                      </p>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-4 max-w-lg">
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                          <div className="text-3xl mb-2">📚</div>
                          <p className="text-sm font-medium">Academic Resources</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                          <div className="text-3xl mb-2">📅</div>
                          <p className="text-sm font-medium">Class Schedules</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                          <div className="text-3xl mb-2">🎯</div>
                          <p className="text-sm font-medium">Track Progress</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                          <div className="text-3xl mb-2">🗺️</div>
                          <p className="text-sm font-medium">Campus Map</p>
                      </div>
                  </div>
              </div>

              {/* Footer */}
              <div className="text-white/60 text-sm">
                  <p>© 2025 College Central. All rights reserved.</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Login;
