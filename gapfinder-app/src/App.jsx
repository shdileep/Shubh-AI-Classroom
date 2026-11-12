import React, { useState, useEffect, useRef } from 'react';
import { useUser, useClerk, AuthenticateWithRedirectCallback } from '@clerk/react';
import { Sparkles, ArrowRight, Mail } from 'lucide-react';
import LandingPage from './components/LandingPage';
import SignInSignUp from './components/SignInSignUp';
import LmsDashboard from './components/LmsDashboard';
import WelcomeDileepCard from './components/WelcomeDileepCard';

export default function App() {
  const { isSignedIn, user, isLoaded: isClerkLoaded } = useUser();
  const { signOut } = useClerk();
  const syncAttemptedRef = useRef(false);
  const [welcomeGoogleUser, setWelcomeGoogleUser] = useState(null);

  const [authToken, setAuthToken] = useState(() => localStorage.getItem('gapfinder_token'));
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gapfinder_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const getViewFromLocation = () => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('sso-callback') || hash.includes('sso-callback') || hash.includes('callback')) {
      return { view: 'sso-callback', mode: 'signin' };
    }
    if (hash.includes('login') || hash.includes('signin') || hash.includes('auth')) {
      return { view: 'auth', mode: 'signin' };
    }
    if (hash.includes('signup') || hash.includes('register')) {
      return { view: 'auth', mode: 'signup' };
    }
    if (hash.includes('dashboard') || hash.includes('lms')) {
      return { view: 'dashboard', mode: 'signin' };
    }
    return { view: 'landing', mode: 'signin' };
  };

  const initial = getViewFromLocation();
  const [currentView, setCurrentView] = useState(initial.view); // 'landing' | 'auth' | 'dashboard' | 'sso-callback'
  const [authMode, setAuthMode] = useState(initial.mode); // 'signin' | 'signup'

  // Automatic Clerk Google OAuth Synchronization with Backend
  useEffect(() => {
    if (isClerkLoaded && isSignedIn && user && !syncAttemptedRef.current) {
      syncAttemptedRef.current = true;
      const syncWithBackend = async () => {
        try {
          const res = await fetch('/api/auth/clerk-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerk_id: user.id,
              email: user.primaryEmailAddress?.emailAddress || `${user.id}@clerk.user`,
              name: user.fullName || user.firstName || 'Google Student',
              avatar_url: user.imageUrl,
              course: 'MATH 204 · Multivariable Calculus'
            })
          });

          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('gapfinder_token', data.token);
            localStorage.setItem('gapfinder_user', JSON.stringify(data.user));
            setAuthToken(data.token);
            setCurrentUser(data.user);

            if (data.is_new_user) {
              fetch('/api/auth/send-greeting-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: data.user.email,
                  name: data.user.name,
                  course: data.user.course
                })
              }).catch(() => {});
              setWelcomeGoogleUser(data.user);
            } else {
              setCurrentView('dashboard');
              window.location.hash = '#dashboard';
              if (window.location.pathname !== '/') {
                window.history.replaceState({}, '', '/#dashboard');
              }
            }
          }
        } catch (err) {
          console.error('Failed to sync Clerk OAuth user with backend:', err);
        }
      };

      syncWithBackend();
    }
  }, [isClerkLoaded, isSignedIn, user]);

  // Enforce Protected Route: Direct unauthenticated access is strictly disabled
  useEffect(() => {
    const handleLocationChange = () => {
      const state = getViewFromLocation();
      const token = localStorage.getItem('gapfinder_token');
      const hasAuth = !!token || (isClerkLoaded && isSignedIn);

      if (state.view === 'dashboard' && !hasAuth) {
        // Direct unauthenticated access is disabled to prevent unauthorized data exposure
        setCurrentView('auth');
        setAuthMode('signin');
        window.location.hash = '#login';
      } else {
        setCurrentView(state.view);
        setAuthMode(state.mode);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    
    // Initial check on load
    const token = localStorage.getItem('gapfinder_token');
    const hasAuth = !!token || (isClerkLoaded && isSignedIn);
    if (initial.view === 'dashboard' && !hasAuth) {
      setCurrentView('auth');
      setAuthMode('signin');
      window.location.hash = '#login';
    }

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [isClerkLoaded, isSignedIn, initial.view]);

  const handleOpenAuth = (mode = 'signin') => {
    setAuthMode(mode);
    setCurrentView('auth');
    window.location.hash = mode === 'signup' ? '#signup' : '#login';
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenDashboard = () => {
    const token = localStorage.getItem('gapfinder_token');
    const hasAuth = !!token || (isClerkLoaded && isSignedIn);
    if (!hasAuth) {
      // Unauthenticated -> Redirect to login
      handleOpenAuth('signin');
      return;
    }
    setCurrentView('dashboard');
    window.location.hash = '#dashboard';
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleLoginSuccess = ({ token, user }) => {
    if (token) {
      localStorage.setItem('gapfinder_token', token);
      setAuthToken(token);
    }
    if (user) {
      localStorage.setItem('gapfinder_user', JSON.stringify(user));
      setCurrentUser(user);
    }
    // Authenticated -> Redirect to dashboard
    setCurrentView('dashboard');
    window.location.hash = '#dashboard';
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleLogout = async () => {
    syncAttemptedRef.current = false;
    localStorage.removeItem('gapfinder_token');
    localStorage.removeItem('gapfinder_user');
    setAuthToken(null);
    setCurrentUser(null);
    
    if (isSignedIn && signOut) {
      try {
        await signOut();
      } catch (err) {
        console.warn('Clerk signOut note:', err);
      }
    }
    setCurrentView('landing');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen">
      {currentView === 'landing' && (
        <LandingPage 
          onOpenAuth={handleOpenAuth}
          onOpenDashboard={handleOpenDashboard}
          isAuthenticated={!!authToken || (isClerkLoaded && isSignedIn)}
        />
      )}

      {currentView === 'auth' && (
        <SignInSignUp 
          initialMode={authMode}
          onBackToLanding={() => {
            setCurrentView('landing');
            window.location.hash = '';
          }}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {currentView === 'sso-callback' && (
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="font-serif italic text-xl font-bold text-black mb-1">Verifying Google Authentication</h2>
          <p className="text-xs text-[#747879] max-w-sm mb-6">
            Confirming credentials via Clerk secure OAuth and establishing your protected session...
          </p>
          <AuthenticateWithRedirectCallback 
            signInForceRedirectUrl="/#dashboard"
            signUpForceRedirectUrl="/#dashboard"
          />
        </div>
      )}

      {currentView === 'dashboard' && (
        <LmsDashboard 
          onLogout={handleLogout}
          onBackToLanding={() => {
            setCurrentView('landing');
            window.location.hash = '';
          }}
          currentUser={currentUser}
          authToken={authToken}
        />
      )}

      {/* Warm Greeting Welcome Dileep Card Modal (From Stitch Specification) */}
      {welcomeGoogleUser && (
        <WelcomeDileepCard 
          name={welcomeGoogleUser.name}
          email={welcomeGoogleUser.email}
          onEnterWorkspace={() => {
            setWelcomeGoogleUser(null);
            setCurrentView('dashboard');
            window.location.hash = '#dashboard';
            if (window.location.pathname !== '/') {
              window.history.replaceState({}, '', '/#dashboard');
            }
          }}
        />
      )}
    </div>
  );
}
