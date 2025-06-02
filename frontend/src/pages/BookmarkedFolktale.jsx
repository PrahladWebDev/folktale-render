import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaTrash } from 'react-icons/fa';

function BookmarkedFolktale() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!token) {
        toast.error('Please log in to view bookmarks.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get('/api/folktales/bookmark', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        const validBookmarks = response.data.data?.filter(bookmark => bookmark.folktaleId?._id) || [];
        if (validBookmarks.length < response.data.data?.length) {
          console.warn('Filtered out invalid bookmarks:', response.data.data?.length - validBookmarks.length);
          toast.warn('Some invalid bookmarks were filtered out.');
        }
        setBookmarks(validBookmarks);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
        handleError(error, 'Failed to load bookmarks.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookmarks();
  }, [token]);

  const handleError = (error, defaultMessage) => {
    const errorData = error.response?.data;
    const errorCode = errorData?.error;
    let message = errorData?.message || defaultMessage;

    switch (errorCode) {
      case 'auth_required':
      case 'invalid_token':
      case 'token_expired':
        message = 'Session expired. Redirecting to login...';
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 2000);
        break;
      case 'not_found':
        message = 'No bookmarks found.';
        break;
      case 'server_error':
        message = 'Server error. Please try again later.';
        break;
      case 'ECONNABORTED':
        message = 'Request timed out. Please check your connection.';
        break;
    }
    toast.error(message);
    return message;
  };

  const handleRemoveBookmark = async (folktaleId, e) => {
    e.stopPropagation();
    if (!folktaleId) {
      toast.error('Invalid bookmark ID.');
      return;
    }

    try {
      await axios.delete(`/api/folktales/bookmarks/${folktaleId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setBookmarks(bookmarks.filter(bookmark => bookmark.folktaleId._id !== folktaleId));
      toast.success('Bookmark removed successfully!');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      handleError(error, 'Failed to remove bookmark.');
    }
  };

  const handleFolktaleClick = (folktaleId) => {
    if (!folktaleId) {
      toast.error('Invalid folktale ID.');
      return;
    }
    try {
      navigate(`/folktale/${folktaleId}`);
    } catch (error) {
      console.error('Error navigating to folktale:', error);
      toast.error('Failed to navigate to folktale.');
    }
  };

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center bg-yellow-100 rounded-lg mt-8">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          theme="light"
        />
        <p className="text-lg text-red-600">
          Please{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-blue-600 underline cursor-pointer hover:text-blue-800"
          >
            log in
          </span>{' '}
          to view your bookmarked folktales.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 border-4 border-t-amber-600 border-gray-200 rounded-full animate-spin mb-2"></div>
        <p className="text-gray-600 font-medium">Loading your bookmarks...</p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-4 sm:p-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <h1 className="text-3xl font-serif text-amber-700 text-center mb-6 border-b-2 border-amber-200 pb-2">
        Your Bookmarked Folktales
      </h1>
      {bookmarks.length === 0 ? (
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-amber-100">
          <p className="text-lg text-gray-600 mb-4">You haven't bookmarked any folktales yet.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-all duration-200"
          >
            Explore Folktales
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map(bookmark => (
            <div
              key={bookmark.folktaleId._id}
              className="flex bg-white rounded-lg shadow-sm border border-amber-100 hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => handleFolktaleClick(bookmark.folktaleId._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleFolktaleClick(bookmark.folktaleId._id);
                }
              }}
              aria-label={`View folktale ${bookmark.folktaleId.title || 'Unknown Title'}`}
            >
              <div className="w-32 h-32 flex-shrink-0 overflow-hidden">
                <img
                  src={bookmark.folktaleId.imageUrl || '/placeholder.jpg'}
                  alt={bookmark.folktaleId.title || 'Unknown Folktale'}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder.jpg';
                    toast.warn('Failed to load folktale image.');
                  }}
                />
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif text-amber-900 mb-2 hover:text-amber-700 transition-colors">
                    {bookmark.folktaleId.title || 'Unknown Title'}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <strong>Region:</strong> {bookmark.folktaleId.region || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Genre:</strong> {bookmark.folktaleId.genre || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Age Group:</strong> {bookmark.folktaleId.ageGroup || 'Unknown'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleRemoveBookmark(bookmark.folktaleId._id, e)}
                  className="self-end text-red-600 hover:text-red-800 transition-colors text-lg"
                  aria-label={`Remove bookmark for ${bookmark.folktaleId.title || 'Unknown Title'}`}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookmarkedFolktale;
