import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function VerifyEmail() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`/api/auth/verify-email/${token}`);
        localStorage.setItem('token', response.data.token);
        setMessage('Email verified successfully! Redirecting to home page...');
        setTimeout(() => navigate('/'), 3000);
      } catch (error) {
        console.error('Email verification error:', error);
        setMessage(error.response?.data?.message || 'Email verification failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-amber-50 p-4 font-caveat text-gray-800 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-6 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2 animate-pulse">
            Email Verification
          </h2>
          {isLoading ? (
            <p className="text-gray-600 text-base">
              Verifying your email...
            </p>
          ) : (
            <p className="text-gray-600 text-base">
              {message}
            </p>
          )}
        </div>

        {!isLoading && message.includes('failed') && (
          <div className="text-center pt-5 border-t border-amber-100">
            <p className="text-gray-600 text-base">
              Go back to{' '}
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
              {' '}or{' '}
              <a
                href="/login"
                className="text-amber-600 font-semibold hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                Login
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
