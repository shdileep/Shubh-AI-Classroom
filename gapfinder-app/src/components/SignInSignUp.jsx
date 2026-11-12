import React, { useState, useRef, useEffect } from 'react';
import { useSignIn, useSignUp, useClerk } from '@clerk/react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle, Edit2, Sparkles, GraduationCap, Zap } from 'lucide-react';
import WelcomeDileepCard from './WelcomeDileepCard';

// 6-digit OTP Box Component with auto-focus, backspace, and paste support
function OtpBoxes({ value, onChange, disabled, onComplete }) {
  const inputsRef = useRef([]);

  const handleDigitChange = (index, char) => {
    const digits = (value || '').padEnd(6, ' ').split('');
    const lastChar = char.slice(-1);
    if (lastChar && !/^\d$/.test(lastChar)) return;

    digits[index] = lastChar || ' ';
    const newValue = digits.join('').trimEnd();
    onChange(newValue);

    if (lastChar && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newValue.replace(/\s/g, '').length === 6 && onComplete) {
      onComplete(newValue.replace(/\s/g, ''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, 5);
      inputsRef.current[nextIndex]?.focus();
      if (pasted.length === 6 && onComplete) {
        onComplete(pasted);
      }
    }
  };

  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2 my-2" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((idx) => {
        const digit = (value || '')[idx] || '';
        return (
          <input
            key={idx}
            ref={(el) => (inputsRef.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleDigitChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className={`w-9 h-11 sm:w-10 sm:h-12 text-center text-lg font-bold font-mono rounded-lg border transition-all duration-150 focus:outline-none ${
              digit 
                ? 'bg-white border-black text-black shadow-xs ring-1 ring-black/10' 
                : 'bg-[#F5F3EF] border-[#C4C7C8]/70 text-[#1B1C1A] focus:border-black focus:bg-white focus:ring-1 focus:ring-black'
            }`}
          />
        );
      })}
    </div>
  );
}

export default function SignInSignUp({ initialMode = 'signin', onBackToLanding, onLoginSuccess }) {
  const clerk = useClerk();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();

  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  // subView transitions:
  // For Sign In: 'initial' -> 'forgot_otp'
  // For Sign Up: 'initial' -> 'signup_otp' -> 'signup_password'
  const [subView, setSubView] = useState('initial'); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0); // 60s Resend Cooldown
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null);

  const emailInputRef = useRef(null);

  // Active 60-second Resend Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const getFirstName = (fullName, emailAddress) => {
    if (fullName && fullName.trim()) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length > 1 && parts[0].toLowerCase() === 'galla') {
        return parts[1];
      }
      return parts[0];
    }
    if (emailAddress && emailAddress.includes('@')) {
      const handle = emailAddress.split('@')[0];
      const cleaned = handle.replace(/[._\d]/g, ' ').trim().split(' ')[0];
      return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : 'Dileep';
    }
    return 'Dileep';
  };

  const handleSwitchTab = (newMode) => {
    setMode(newMode);
    setSubView('initial');
    setError(null);
    setResetSuccess(null);
    setOtpCode('');
  };

  // Direct Google OAuth via Clerk - strictly no intermediate floating modals
  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup' && signUp) {
        await signUp.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/#dashboard',
          continueSignIn: true,
        });
        return;
      }

      if (signIn) {
        await signIn.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/#dashboard',
          continueSignUp: true,
        });
        return;
      }

      if (signUp) {
        await signUp.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/#dashboard',
          continueSignIn: true,
        });
        return;
      }

      throw new Error('Clerk service is initializing. Please wait a moment.');
    } catch (err) {
      console.error('Google OAuth direct redirect error:', err);
      setError(err.errors?.[0]?.longMessage || err.message || 'Unable to connect to Google OAuth.');
      setLoading(false);
    }
  };

  // In-Place Sign In submit
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Sign in failed. Please verify your credentials.');
      }

      if (onLoginSuccess) {
        onLoginSuccess({ token: data.token, user: data.user });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 1. FORGOT PASSWORD FLOW (IN-PLACE CARD CONVERSION)
  // Step 1: User enters email, clicks "Forgot password?"
  // =========================================================================
  const handleStartForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter your academic email address above first to receive the code.');
      emailInputRef.current?.focus();
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Trigger Clerk reset password code
      if (isSignInLoaded && signIn) {
        try {
          await signIn.create({
            strategy: 'reset_password_email_code',
            identifier: cleanEmail,
          });
        } catch (clerkErr) {
          console.warn('Clerk reset_password_email_code notice:', clerkErr);
        }
      }

      // 2. Trigger backend OTP generation & real Resend dispatch
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose: 'password_reset' })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Unable to send password reset code.');
      }

      setCooldown(data.cooldown_seconds || 60);
      setSubView('forgot_otp');
      setOtpCode('');
      setResetSuccess(data.message || `Verification code dispatched to ${cleanEmail}. Check your inbox.`);
    } catch (err) {
      setError(err.message || 'Unable to send password reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Reusable Resend OTP handler with 60-second cooldown enforcement
  const handleResendOtp = async (purpose) => {
    if (cooldown > 0 || loading) return;
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Unable to resend verification code.');
      }
      setCooldown(data.cooldown_seconds || 60);
      setResetSuccess(data.message || `New verification code sent to ${cleanEmail}. Check your inbox.`);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP + New Password in-place (The button says "Continue")
  const handleVerifyForgotOtpAndReset = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    const cleanOtp = (otpCode || '').replace(/\s/g, '');

    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Try Clerk factor
      let clerkDone = false;
      if (isSignInLoaded && signIn) {
        try {
          const result = await signIn.attemptFirstFactor({
            strategy: 'reset_password_email_code',
            code: cleanOtp,
            password: newPassword,
          });
          if (result.status === 'complete') {
            clerkDone = true;
            if (clerk?.setActive) {
              await clerk.setActive({ session: result.createdSessionId });
            }
          }
        } catch (factorErr) {
          console.warn('Clerk factor attempt notice:', factorErr);
        }
      }

      // 2. Verify OTP with backend (mandatory backend verification)
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanOtp, purpose: 'password_reset' })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.detail || 'Invalid verification code.');
      }

      // 3. Update password in backend database
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, new_password: newPassword })
      });

      const data = await res.json();
      if (!res.ok && !clerkDone) {
        throw new Error(data.detail || 'Password reset verification failed.');
      }

      // Automatically sign in with newly set credentials
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: newPassword })
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        if (onLoginSuccess) {
          onLoginSuccess({ token: loginData.token, user: loginData.user });
          return;
        }
      }

      setResetSuccess('Password successfully updated! You may now sign in.');
      setPassword(newPassword);
      setSubView('initial');
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 2. SIGN UP FLOW (IN-PLACE STEP PROGRESSION)
  // Step 1: User enters Name & Email -> Click "Continue" -> Show OTP Boxes
  // (Password is NOT shown yet, strictly avoiding early password entry)
  // =========================================================================
  const handleStartSignUpOtp = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid academic email address.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Try Clerk prepare verification
      if (isSignUpLoaded && signUp) {
        try {
          await signUp.create({
            emailAddress: cleanEmail,
            password: 'tempInitialPassword2026!#',
          });
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        } catch (signUpErr) {
          console.warn('Clerk signUp prepare notice:', signUpErr);
        }
      }

      // 2. Backend OTP generation & real Resend email delivery
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose: 'signup_verification' })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Unable to send verification code.');
      }

      setCooldown(data.cooldown_seconds || 60);
      setSubView('signup_otp');
      setOtpCode('');
      setResetSuccess(data.message || `Verification code sent to ${cleanEmail}. Check your inbox.`);
    } catch (err) {
      setError(err.message || 'Unable to initiate sign up.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of Sign Up: Enter OTP -> Click "Continue" -> Verify OTP
  // Only after successful OTP verification, show Password creation!
  const handleVerifySignUpOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    const cleanOtp = (otpCode || '').replace(/\s/g, '');

    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Try Clerk verify
      if (isSignUpLoaded && signUp) {
        try {
          await signUp.attemptEmailAddressVerification({ code: cleanOtp });
        } catch (clerkVerifyErr) {
          console.warn('Clerk verify attempt notice:', clerkVerifyErr);
        }
      }

      // 2. Verify OTP with backend
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanOtp })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Verification code failed. Please check the code.');
      }

      // OTP Verified successfully! Now advance to Step 3: Password creation!
      setSubView('signup_password');
      setPassword('');
      setResetSuccess('Email verified successfully! Now create your account password.');
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 of Sign Up: Create Password -> Click "Continue" -> Register & Show Warm Greeting Card
  const handleCompleteSignUpWithPassword = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Register user with backend database (automatically sends welcome email via Resend)
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: password,
          course: 'MATH 204 · Multivariable Calculus'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Sign up registration failed.');
      }

      // 2. Show warm greeting card with fetched name and details!
      setWelcomeUser({
        name: cleanName,
        email: cleanEmail,
        token: data.token,
        course: data.user?.course || 'MATH 204 · Multivariable Calculus'
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const leftImage = subView === 'forgot_otp'
    ? '/assets/screen_5_student_writing_library.png'
    : mode === 'signup'
    ? '/assets/screen_7_student_smiling_cafe.png'
    : '/assets/screen_6_student_sweater_tablet.png';

  return (
    <div className="bg-[#FAF8F5] font-sans text-[#1B1C1A] antialiased h-screen max-h-screen overflow-hidden flex flex-col justify-between selection:bg-[#FEDEB2] selection:text-[#000000]">
      {/* 1. Header (Fixed Compact Height) */}
      <header className="w-full flex-shrink-0 bg-[#FAF8F5]/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-50 h-14">
        <div className="h-full max-w-[1360px] mx-auto px-5 lg:px-12 flex items-center justify-between">
          <button 
            type="button" 
            onClick={onBackToLanding} 
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0A0D0E] flex items-center justify-center text-[#FAF8F5] shadow-xs group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 text-[#FAF8F5]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M12 2.5V21.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="12" cy="12" r="1.2" fill="#0DFA6C" />
                <path d="M6 8.5L18 15.5M6 15.5L18 8.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif italic text-lg tracking-tight text-[#000000] font-medium">GapFinder</span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#000000] text-white">AI</span>
            </div>
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={onBackToLanding} 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#434748] hover:text-[#000000] transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#747879] group-hover:text-[#000000] group-hover:-translate-x-0.5 transition-all" />
              <span>Back to Platform</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Center Split Container */}
      <main className="flex-1 flex items-center justify-center w-full px-4 sm:px-6 lg:px-8 relative overflow-hidden py-1">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundColor: 'rgb(251, 249, 245)',
              backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.16) 1.5px, transparent 1.5px), linear-gradient(rgba(15, 23, 42, 0.16) 1.5px, transparent 1.5px), linear-gradient(to right, rgba(15, 23, 42, 0.09) 1px, transparent 1px), linear-gradient(rgba(15, 23, 42, 0.09) 1px, transparent 1px), linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(rgba(15, 23, 42, 0.04) 1px, transparent 1px)',
              backgroundSize: '200px 200px, 200px 200px, 40px 40px, 40px 40px, 8px 8px, 8px 8px',
              backgroundPosition: 'center center'
            }}
          />
          <div className="absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-[#FEDEB2] opacity-35 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-40 -right-40 w-[26rem] h-[26rem] rounded-full bg-[#0dfa6c] opacity-20 blur-3xl pointer-events-none"></div>
        </div>

        <div className="relative z-10 flex flex-col w-full max-w-4xl justify-center items-center my-auto">
          <div className="w-full bg-[#F5F3EF] rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.05)] flex flex-col md:flex-row overflow-hidden relative border border-[#C4C7C8]/40 max-h-[calc(100vh-80px)]">
            
            {/* Left Column (Authentic Portrait) */}
            <div className="w-full md:w-5/12 bg-[#000000] text-white p-5 lg:p-7 flex flex-col justify-between relative overflow-hidden shrink-0 min-h-[160px] md:min-h-[470px]">
              <div className="absolute inset-0 z-0">
                <img 
                  id="left-auth-img" 
                  src={leftImage} 
                  alt="College student studying on campus" 
                  className="w-full h-full object-cover transition-opacity duration-300" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"></div>
              </div>
              <div className="relative z-10">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white border border-white/20">
                  {subView === 'forgot_otp' 
                    ? 'Security Verification' 
                    : subView === 'signup_otp' || subView === 'signup_password'
                    ? 'Student Registration'
                    : mode === 'signin' 
                    ? 'Welcome Back' 
                    : 'Join GapFinder AI'}
                </span>
              </div>
              <div className="relative z-10 text-white">
                <h3 className="font-serif italic text-xl lg:text-2xl font-bold leading-tight">
                  {subView === 'forgot_otp'
                    ? 'Verify code to reset your password.'
                    : subView === 'signup_otp'
                    ? 'Enter 6-digit code sent to your email.'
                    : subView === 'signup_password'
                    ? 'Create your password to activate account.'
                    : mode === 'signin' 
                    ? 'Resume your targeted revision drills.' 
                    : 'Target and fix your exam blindspots.'}
                </h3>
                <p className="text-[11px] text-white/80 mt-1.5 leading-relaxed">
                  Calibrated for university STEM courses and adaptive mastery.
                </p>
              </div>
            </div>

            {/* Right Column (Auth Form) */}
            <div className="w-full md:w-7/12 bg-white p-5 lg:p-7 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Switcher Tabs (Only in initial mode) */}
                {subView === 'initial' ? (
                  <div className="w-full bg-[#EFEEEA] p-1 rounded-lg flex items-center justify-between mb-3 border border-[#E4DFD5]">
                    <button 
                      type="button"
                      onClick={() => handleSwitchTab('signin')}
                      className={`w-1/2 py-1.5 px-3 text-center rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        mode === 'signin' 
                          ? 'bg-white text-[#000000] shadow-sm font-bold' 
                          : 'text-[#5C6368] hover:text-[#000000]'
                      }`}
                    >
                      Sign In
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleSwitchTab('signup')}
                      className={`w-1/2 py-1.5 px-3 text-center rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        mode === 'signup' 
                          ? 'bg-white text-[#000000] shadow-sm font-bold' 
                          : 'text-[#5C6368] hover:text-[#000000]'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-between mb-2.5 pb-2 border-b border-[#E4DFD5]">
                    <button 
                      type="button" 
                      onClick={() => { 
                        if (subView === 'signup_password') {
                          setSubView('signup_otp');
                        } else {
                          setSubView('initial');
                        }
                        setError(null); 
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#434748] hover:text-black transition-colors cursor-pointer group"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      <span>{subView === 'forgot_otp' ? 'Back to Sign In' : 'Back'}</span>
                    </button>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#747879]">
                      {subView === 'forgot_otp' 
                        ? 'Forgot Password' 
                        : subView === 'signup_otp' 
                        ? 'Verify OTP' 
                        : 'Create Password'}
                    </span>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-xs animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span className="leading-tight font-medium">{error}</span>
                  </div>
                )}

                {/* ========================================================
                    SUBVIEW A: IN-PLACE FORGOT PASSWORD OTP & NEW PASSWORD
                    ======================================================== */}
                {subView === 'forgot_otp' ? (
                  <div className="space-y-2.5 text-left">
                    {/* Top Accent Bar from Stitch */}
                    <div className="h-1 w-full bg-gradient-to-r from-[#0D1117] via-[#0a2d21] to-[#0dfa6c] rounded-full"></div>

                    {/* Stitch-Styled Message Box */}
                    <div className="bg-[#FAF8F5] border border-[#ECE6DC] rounded-xl p-3 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative w-7 h-7 rounded-lg bg-[#0D1117] flex items-center justify-center p-1 shrink-0 shadow-xs">
                            <svg className="w-4 h-4 text-[#FAF8F5]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                              <path d="M12 2.5V21.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                              <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                              <circle cx="12" cy="12" r="1.2" fill="#0DFA6C" />
                              <path d="M6 8.5L18 15.5M6 15.5L18 8.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
                            </svg>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#0dfa6c] rounded-full border border-white"></span>
                          </div>
                          <span className="font-serif italic text-sm text-[#0D1117] font-semibold">GapFinder AI</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-[#C4C7C8]/50 text-[11px] font-mono text-[#1B1C1A]">
                          <span>{email}</span>
                          <button 
                            type="button" 
                            onClick={() => { setSubView('initial'); setError(null); }}
                            className="p-0.5 text-[#747879] hover:text-black cursor-pointer"
                            title="Edit email"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-serif text-sm font-bold text-[#0b0f10]">
                          Hi {getFirstName(name, email)},
                        </h4>
                        <p className="text-xs font-serif italic text-stone-600">
                          Forgot your password? Don't worry, here is your verification code.
                        </p>
                        <p className="text-[10.5px] text-stone-500 font-sans mt-0.5 leading-relaxed">
                          We generated a secure 6-digit code for your account. Enter it below to reset your password and restore access to your diagnostic workspace.
                        </p>
                      </div>
                    </div>

                    <form className="space-y-2" onSubmit={handleVerifyForgotOtpAndReset}>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-[#434748] font-bold">
                          Verification Code (6 Digits)
                        </label>
                        <OtpBoxes 
                          value={otpCode} 
                          onChange={setOtpCode} 
                          disabled={loading} 
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-[#434748] font-bold" htmlFor="input-forgot-new-pwd">
                          New Password (min 6 characters)
                        </label>
                        <div className="relative flex items-center">
                          <Lock className="absolute left-3 w-3.5 h-3.5 text-[#747879] pointer-events-none" />
                          <input 
                            id="input-forgot-new-pwd" 
                            type={showPassword ? 'text' : 'password'} 
                            required 
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••••" 
                            className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#F5F3EF] text-[#1B1C1A] focus:outline-none focus:bg-[#FAF8F5] focus:ring-1 focus:ring-black transition-all placeholder:text-[#9A9E9F] rounded-lg border border-transparent focus:border-[#C4C7C8]"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute right-2.5 p-0.5 text-[#747879] hover:text-[#1B1C1A] transition-colors focus:outline-none cursor-pointer"
                            title={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Stitch Separate Realm CTA Box */}
                      <div className="bg-[#F5F1EB] border border-[#E4DCcf] rounded-xl p-2.5 flex items-center justify-between gap-3 mt-1.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="font-serif text-xs font-semibold text-[#0D1117]">GapFinder AI</span>
                          </div>
                          <p className="text-[10px] text-stone-500">Security & recovery ready.</p>
                        </div>
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D1117] text-white text-xs font-semibold hover:bg-black transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <span>{loading ? 'Verifying...' : 'Reset & Enter Workspace'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#0dfa6c]" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#747879] pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleResendOtp('password_reset')}
                          disabled={loading || cooldown > 0}
                          className="hover:text-black underline cursor-pointer disabled:opacity-50 disabled:no-underline font-medium"
                        >
                          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive a code? Resend"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubView('initial')}
                          className="hover:text-black transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : subView === 'signup_otp' ? (
                  /* ========================================================
                      SUBVIEW B: IN-PLACE SIGN UP OTP VERIFICATION STEP
                      ======================================================== */
                  <div className="space-y-2.5 text-left">
                    <div className="h-1 w-full bg-gradient-to-r from-[#0D1117] via-[#0a2d21] to-[#0dfa6c] rounded-full"></div>

                    <div className="bg-[#FAF8F5] border border-[#ECE6DC] rounded-xl p-3 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative w-7 h-7 rounded-lg bg-[#0D1117] flex items-center justify-center p-1 shrink-0 shadow-xs">
                            <svg className="w-4 h-4 text-[#FAF8F5]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                              <path d="M12 2.5V21.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                              <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                              <circle cx="12" cy="12" r="1.2" fill="#0DFA6C" />
                              <path d="M6 8.5L18 15.5M6 15.5L18 8.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
                            </svg>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#0dfa6c] rounded-full border border-white"></span>
                          </div>
                          <span className="font-serif italic text-sm text-[#0D1117] font-semibold">GapFinder AI</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-[#C4C7C8]/50 text-[11px] font-mono text-[#1B1C1A]">
                          <span>{email}</span>
                          <button 
                            type="button" 
                            onClick={() => { setSubView('initial'); setError(null); }}
                            className="p-0.5 text-[#747879] hover:text-black cursor-pointer"
                            title="Edit email"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-serif text-sm font-bold text-[#0b0f10]">
                          Hi {getFirstName(name, email)},
                        </h4>
                        <p className="text-xs font-serif italic text-stone-600">
                          Check your email to activate your workspace.
                        </p>
                        <p className="text-[10.5px] text-stone-500 font-sans mt-0.5 leading-relaxed">
                          We sent a 6-digit verification code to your student email. Enter it below to verify your email and set your password.
                        </p>
                      </div>
                    </div>

                    <form className="space-y-2.5" onSubmit={handleVerifySignUpOtp}>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-[#434748] font-bold">
                          Enter 6-Digit Verification Code
                        </label>
                        <OtpBoxes 
                          value={otpCode} 
                          onChange={setOtpCode} 
                          disabled={loading} 
                          onComplete={(code) => setOtpCode(code)}
                        />
                      </div>

                      <div className="bg-[#F5F1EB] border border-[#E4DCcf] rounded-xl p-2.5 flex items-center justify-between gap-3 mt-1.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="font-serif text-xs font-semibold text-[#0D1117]">GapFinder AI</span>
                          </div>
                          <p className="text-[10px] text-stone-500">Student verification.</p>
                        </div>
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D1117] text-white text-xs font-semibold hover:bg-black transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <span>{loading ? 'Verifying...' : 'Verify Code & Continue'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#0dfa6c]" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#747879] pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleResendOtp('signup_verification')}
                          disabled={loading || cooldown > 0}
                          className="hover:text-black underline cursor-pointer disabled:opacity-50 disabled:no-underline font-medium"
                        >
                          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive a code? Resend"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubView('initial')}
                          className="hover:text-black transition-colors cursor-pointer"
                        >
                          Change Email
                        </button>
                      </div>
                    </form>
                  </div>
                ) : subView === 'signup_password' ? (
                  /* ========================================================
                      SUBVIEW C: IN-PLACE PASSWORD CREATION (ONLY AFTER OTP VERIFIED)
                      ======================================================== */
                  <div className="space-y-2.5 text-left">
                    <div className="h-1 w-full bg-gradient-to-r from-[#0D1117] via-[#0a2d21] to-[#0dfa6c] rounded-full"></div>

                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="leading-tight">
                        <p className="font-bold">Email verified: {email}</p>
                        <p className="text-[11px] text-emerald-700">Hi {getFirstName(name, email)}, now create your secure password.</p>
                      </div>
                    </div>

                    <form className="space-y-2.5" onSubmit={handleCompleteSignUpWithPassword}>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-[#434748] font-bold" htmlFor="input-signup-password">
                          Create Account Password (min 6 characters)
                        </label>
                        <div className="relative flex items-center">
                          <Lock className="absolute left-3 w-3.5 h-3.5 text-[#747879] pointer-events-none" />
                          <input 
                            id="input-signup-password" 
                            type={showPassword ? 'text' : 'password'} 
                            required 
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a strong password" 
                            className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#F5F3EF] text-[#1B1C1A] focus:outline-none focus:bg-[#FAF8F5] focus:ring-1 focus:ring-black transition-all placeholder:text-[#9A9E9F] rounded-lg border border-transparent focus:border-[#C4C7C8]"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute right-2.5 p-0.5 text-[#747879] hover:text-[#1B1C1A] transition-colors focus:outline-none cursor-pointer"
                            title={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#F5F1EB] border border-[#E4DCcf] rounded-xl p-2.5 flex items-center justify-between gap-3 mt-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="font-serif text-xs font-semibold text-[#0D1117]">GapFinder AI</span>
                          </div>
                          <p className="text-[10px] text-stone-500">Account calibration ready.</p>
                        </div>
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D1117] text-white text-xs font-semibold hover:bg-black transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <span>{loading ? 'Activating...' : 'Enter Workspace'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#0dfa6c]" />
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* ========================================================
                      SUBVIEW D: INITIAL SIGN IN / SIGN UP FORM
                      ======================================================== */
                  <>
                    {/* Google Auth Button (Direct OAuth without floating modals) */}
                    <button 
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={loading}
                      className="w-full py-2 px-3 bg-[#FAF8F5] hover:bg-[#EFEEEA] text-[#1B1C1A] text-xs font-medium flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all duration-150 group rounded-lg border border-[#E4DFD5] cursor-pointer disabled:opacity-60"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      <span className="text-[#1B1C1A] group-hover:text-[#000000] tracking-tight font-medium">
                        {loading ? 'Redirecting to Google...' : 'Continue with Google'}
                      </span>
                    </button>



                    {/* Divider */}
                    <div className="relative my-2.5 flex items-center justify-center">
                      <div className="w-full h-px bg-[#E4E2DE]"></div>
                      <span className="absolute bg-white px-2.5 text-[9px] uppercase font-bold tracking-widest text-[#747879]">
                        or continue with
                      </span>
                    </div>

                    {/* Sign In Form */}
                    {mode === 'signin' ? (
                      <form className="space-y-2.5" onSubmit={handleSignInSubmit}>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#434748] font-bold" htmlFor="input-email">
                            Academic Email Address
                          </label>
                          <div className="relative flex items-center">
                            <Mail className="absolute left-3 w-3.5 h-3.5 text-[#747879] pointer-events-none" />
                            <input 
                              id="input-email" 
                              ref={emailInputRef}
                              type="email" 
                              required 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="alex.chen@stanford.edu" 
                              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F5F3EF] text-[#1B1C1A] focus:outline-none focus:bg-[#FAF8F5] focus:ring-1 focus:ring-black transition-all placeholder:text-[#9A9E9F] rounded-lg border border-transparent focus:border-[#C4C7C8]"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase tracking-wider text-[#434748] font-bold" htmlFor="input-password">
                              Password
                            </label>
                            <button 
                              type="button" 
                              onClick={handleStartForgotPassword}
                              className="text-[10px] text-[#725B38] hover:text-[#000000] font-medium transition-colors cursor-pointer"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <div className="relative flex items-center">
                            <Lock className="absolute left-3 w-3.5 h-3.5 text-[#747879] pointer-events-none" />
                            <input 
                              id="input-password" 
                              type={showPassword ? 'text' : 'password'} 
                              required 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••••" 
                              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#F5F3EF] text-[#1B1C1A] focus:outline-none focus:bg-[#FAF8F5] focus:ring-1 focus:ring-black transition-all placeholder:text-[#9A9E9F] rounded-lg border border-transparent focus:border-[#C4C7C8]"
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPassword(!showPassword)} 
                              className="absolute right-2.5 p-0.5 text-[#747879] hover:text-[#1B1C1A] transition-colors focus:outline-none cursor-pointer"
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-1.5">
                          <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-2 px-3 bg-[#000000] hover:bg-[#181C1D] text-white text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 group rounded-lg cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
                          >
                            <span>{loading ? 'Authenticating...' : 'Sign In to GapFinder'}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#0DFA6C] transition-transform group-hover:translate-x-1" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Sign Up Step 1 Form (Name & Email -> Click "Continue" to show OTP)
                         Note: Password field is intentionally not shown yet, fulfilling user requirement! */
                      <form className="space-y-2.5" onSubmit={handleStartSignUpOtp}>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#434748] font-bold" htmlFor="input-name">
                            Full Name & Academic Title
                          </label>
                          <div className="relative flex items-center">
                            <User className="absolute left-3 w-3.5 h-3.5 text-[#747879] pointer-events-none" />
                            <input 
                              id="input-name" 
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Elena Vance" 
                              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F5F3EF] text-[#1B1C1A] focus:outline-none focus:bg-[#FAF8F5] focus:ring-1 focus:ring-black transition-all placeholder:text-[#9A9E9F] rounded-lg border border-transparent focus:border-[#C4C7C8]"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#434748] font-bold" htmlFor="input-email-signup">
                            Academic Email Address
                          </label>
                          <div className="relative flex items-center">
                            <Mail className="absolute left-3 w-3.5 h-3.5 text-[#747879] pointer-events-none" />
                            <input 
                              id="input-email-signup" 
                              type="email" 
                              required 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="elena.vance@stanford.edu" 
                              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F5F3EF] text-[#1B1C1A] focus:outline-none focus:bg-[#FAF8F5] focus:ring-1 focus:ring-black transition-all placeholder:text-[#9A9E9F] rounded-lg border border-transparent focus:border-[#C4C7C8]"
                            />
                          </div>
                        </div>

                        <div className="pt-1.5">
                          <button 
                            type="submit" 
                            disabled={loading || !email.includes('@')}
                            className="w-full py-2 px-3 bg-[#000000] hover:bg-[#181C1D] text-white text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 group rounded-lg cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
                          >
                            <span>{loading ? 'Preparing Verification...' : 'Continue'}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#0DFA6C] transition-transform group-hover:translate-x-1" />
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-[#E4E2DE] text-center text-[10px] text-[#747879] flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-[#747879]" />
                <span>Encrypted authentication · Zero-trust telemetry</span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full flex-shrink-0 bg-[#F5F3EF] py-2.5 shadow-[0_-1px_6px_rgba(0,0,0,0.02)] h-10 flex items-center">
        <div className="max-w-[1360px] mx-auto px-5 lg:px-12 w-full flex flex-col sm:flex-row items-center justify-between gap-1 text-[#434748] text-[11px]">
          <span>© 2026 GapFinder AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <button type="button" onClick={onBackToLanding} className="hover:text-black transition-colors cursor-pointer">Platform</button>
            <button type="button" className="hover:text-black transition-colors cursor-pointer">Privacy</button>
            <button type="button" className="hover:text-black transition-colors cursor-pointer">Terms</button>
          </div>
        </div>
      </footer>

      {/* ========================================================
          WARM GREETING WELCOME DILEEP CARD (FROM STITCH SPECIFICATION)
          ======================================================== */}
      {welcomeUser && (
        <WelcomeDileepCard
          name={welcomeUser.name}
          email={welcomeUser.email}
          onEnterWorkspace={() => {
            const u = welcomeUser;
            setWelcomeUser(null);
            if (onLoginSuccess) {
              onLoginSuccess({ token: u.token, user: u });
            }
          }}
        />
      )}
    </div>
  );
}
