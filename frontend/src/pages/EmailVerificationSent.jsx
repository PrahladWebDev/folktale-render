import { useLocation, useNavigate } from 'react-router-dom';

function EmailVerificationSent() {
  const { state } = useLocation();
  const { email } = state || {};
  const navigate = useNavigate();

  if (!email) {
    navigate('/register');
    return null;
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-amber-50 p-4 font-caveat text-gray-800 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-6 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2 animate-pulse">
            Verify Your Email
          </h2>
          <p className="text-gray-600 text-base">
            A verification link has been sent to <strong>{email}</strong>. Please check your inbox (and spam/junk folder) and click the link to verify your account.
          </p>
        </div>

        <div className="text-center pt-5 border-t border-amber-100">
          <p className="text-gray-600 text-base">
            Already verified?{' '}
            <a
              href="/login"
              className="text-amber-600 font-semibold hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationSent;
