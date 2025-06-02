import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchBar from './SearchBar';
import { FaBookmark } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const checkAdmin = async () => {
      if (!token) {
        setIsAdmin(false);
        return;
      }

      try {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAdmin(response.data.isAdmin || false);
      } catch (error) {
        console.error('Error checking admin:', error);
        const errorMessage = handleError(error);
        toast.error(errorMessage);
        if (
          error.response?.data?.error === 'invalid_token' ||
          error.response?.data?.error === 'token_expired'
        ) {
          localStorage.removeItem('token');
          setIsAdmin(false);
          setTimeout(() => navigate('/login'), 2000);
        }
      }
    };
    checkAdmin();
  }, [token, navigate]);

  const handleError = (error) => {
    const errorData = error.response?.data;
    const errorCode = errorData?.error;
    const message = errorData?.message || 'An unexpected error occurred';

    switch (errorCode) {
      case 'auth_required':
        return 'Authentication required. Please log in.';
      case 'invalid_token':
      case 'token_expired':
        return 'Your session has expired. Redirecting to login...';
      case 'server_error':
        return 'Failed to verify user status due to a server issue. Please try again later.';
      default:
        return message;
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      setIsAdmin(false);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  const handleNavigation = (path) => {
    try {
      navigate(path);
    } catch (error) {
      console.error(`Error navigating to ${path}:`, error);
      toast.error(`Failed to navigate to ${path}. Please try again.`);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-gray-50 to-white shadow-md py-3 px-4 sticky top-0 z-50">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <h1
          className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors max-md:text-xl"
          onClick={() => handleNavigation('/')}
        >
          Folktale संसार
        </h1>
        <div className="flex-1 max-w-md mx-4 max-md:w-full max-md:mx-0 max-md:my-2">
          <SearchBar />
        </div>
        <div className="flex items-center gap-3 max-md:w-full max-md:flex-wrap max-md:justify-start">
          <button
            onClick={() => handleNavigation('/map')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 hover:-translate-y-px transition-all max-md:flex-1 max-md:text-center"
          >
            <span>🌍</span> Map
          </button>
          <button
            onClick={() => handleNavigation('/bookmarks')}
            title="Bookmarks"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 hover:-translate-y-px transition-all max-md:flex-1 max-md:text-center"
          >
            <FaBookmark />
          </button>
          {token ? (
            <>
              {isAdmin && (
                <button
                  onClick={() => handleNavigation('/admin')}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 hover:-translate-y-px transition-all max-md:flex-1 max-md:text-center"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 hover:-translate-y-px transition-all max-md:flex-1 max-md:text-center"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavigation('/login')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 hover:-translate-y-px transition-all max-md:flex-1 max-md:text-center"
              >
                Login
              </button>
              <button
                onClick={() => handleNavigation('/register')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 hover:-translate-y-px transition-all max-md:flex-1 max-md:text-center"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
