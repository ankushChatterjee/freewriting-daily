import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';

export function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await signup(username, password);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Newspaper Title */}
        <div className="text-center mb-12">
          <h1 className="newspaper-title mb-2">The Freewriting Daily</h1>
          <p className="newspaper-date">{format(today, 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/50 backdrop-blur-sm px-8 py-12">
          <h2 className="text-3xl text-center mb-8" style={{ fontFamily: 'var(--font-title)', color: 'var(--color-charcoal)' }}>
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm mb-2" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-charcoal)', opacity: 0.7 }}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-underline w-full"
                required
                minLength={3}
                maxLength={50}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-2" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-charcoal)', opacity: 0.7 }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-underline w-full"
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center" style={{ fontFamily: 'var(--font-body)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Login')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              className="text-sm transition-colors underline hover:opacity-100"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--color-charcoal)', opacity: 0.7, cursor: 'pointer' }}
            >
              {isSignup ? 'Already have an account? Login' : 'Need an account? Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

