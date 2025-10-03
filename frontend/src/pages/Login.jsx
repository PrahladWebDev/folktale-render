import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setErrors([{ field: 'general', message: 'Email and password cannot be empty' }]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/login', {
        email: normalizedEmail,
        password: normalizedPassword,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors([{ 
          field: 'general', 
          message: error.response?.data?.message || 'An unexpected error occurred' 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderError = (field) => {
    const error = errors.find(err => err.field === field || err.field === 'general');
    return error ? (
      <div className="bg-red-100 text-red-600 p-3 rounded-md border-b-2 border-red-200 mb-5 text-center text-sm font-semibold animate-shake">
        {error.message}
      </div>
    ) : null;
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-amber-50 p-4 font-caveat text-gray-800 animate-fadeIn">
      <div className="w-full max-w-7xl mb-8">
      </div>
      
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-6 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2 animate-pulse">
            Welcome Back
          </h2>
          <p className="text-gray-600 text-base">
            Sign in to continue to Legend Sansar
          </p>
        </div>

        {renderError('general')}
        {renderError('email')}
        {renderError('password')}

        <div className="mb-6">
          <label className="block mb-2 font-semibold text-sm text-amber-700">
            Email
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`w-full p-3 rounded-md border-2 ${
              errors.find(err => err.field === 'email') 
                ? 'border-red-200' 
                : 'border-amber-200'
            } bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-blue-200 transition-all duration-300 placeholder-gray-400`}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold text-sm text-gray-600">
            Password
          </label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={`w-full p-3 rounded-md border-2 ${
              errors.find(err => err.field === 'password') 
                ? 'border-red-200' 
                : 'border-amber-200'
            } bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 placeholder-gray-400`}
          />
        </div>

        <div className="text-right mb-4">
          <a
            href="/forgot-password"
            className="text-amber-600 text-sm font-semibold hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate('/forgot-password');
            }}
          >
            Forgot Password?
          </a>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-amber-900 text-white p-3 rounded-md text-lg font-bold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>

        <div className="text-center pt-5 border-t border-amber-100">
          <p className="text-gray-600 text-base">
            Don't have an account?{' '}
            <a
              href="/register"
              className="text-amber-600 font-semibold hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
