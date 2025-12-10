import { useContext, useEffect, useState } from 'react';
import { AuthContext, extractCallbackParams } from '../contexts/AuthContext';
import { Logo } from './Logo';

/**
 * Login component for WorkOS authentication
 * Displays application logo and "Sign In" button
 * Handles OAuth callback URL parameters (code and error)
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.3, 2.4
 */
export function Login() {
  const { login, handleCallback } = useContext(AuthContext);
  const [error, setError] = useState(null);

  // Handle OAuth callback on mount
  useEffect(() => {
    const { code, error: callbackError } = extractCallbackParams(window.location.search);
    
    if (callbackError) {
      setError(callbackError);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (code) {
      handleCallback(code);
      // Clear URL parameters after processing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [handleCallback]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md p-8 space-y-8">
        {/* Logo and branding */}
        <div className="flex flex-col items-center space-y-4">
          <Logo />
          <p className="text-slate-600 dark:text-slate-400 text-center">
            Sign in to access your AI-powered business assistant
          </p>
        </div>

        {/* Error message display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm text-center">
              Authentication error: {error}
            </p>
          </div>
        )}

        {/* Sign In button */}
        <button
          onClick={login}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

export default Login;
