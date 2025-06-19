import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { email } = state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/auth/verify-otp', { email, otp });
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    navigate('/register');
    return null;
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-amber-50 p-4 font-caveat text-gray-800 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-6 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2 animate-pulseSketchy">
            Verify Your Email
          </h2>
          <p className="text-gray-600 text-base">
            Enter the OTP sent to {email}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-md border-2 border-red-200 mb-5 text-center text-sm font-semibold animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-6">
            <label className="block mb-2 font-semibold text-sm text-amber-900">
              OTP
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength="6"
              className="w-full p-3 rounded-md border-2 border-amber-200 bg-white text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 placeholder-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500">
              Check your email (including spam/junk)
            </p>
          </div>
          <button
            type="submit"
            disabled={isLoading || !otp}
            className="w-full bg-amber-600 text-white p-3 rounded-md text-lg font-bold hover:bg-amber-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="text-center pt-5 border-t border-amber-100">
          <p className="text-gray-600 text-base">
            Back to{' '}
            <a
              href="/register"
              className="text-amber-600 font-semibold hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
            >
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
