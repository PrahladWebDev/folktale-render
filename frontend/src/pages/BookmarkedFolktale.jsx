
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
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!token) {
        setError('Please log in to view bookmarks.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5000/api/folktales/bookmark`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const validBookmarks = response.data.filter((bookmark) => bookmark.folktaleId);
        if (validBookmarks.length < response.data.length) {
          console.warn('Filtered out invalid bookmarks:', response.data.length - validBookmarks.length);
        }
        setBookmarks(validBookmarks);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
        setError('Failed to load bookmarks. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookmarks();
  }, [token]);

  const handleRemoveBookmark = async (folktaleId, e) => {
    e.stopPropagation();
    if (!folktaleId) {
      toast.error('Invalid bookmark ID');
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/folktales/bookmarks/${folktaleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookmarks(bookmarks.filter((bookmark) => 
        bookmark.folktaleId && bookmark.folktaleId._id !== folktaleId
      ));
      toast.success('Bookmark removed!');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      const errorMessage = error.response?.data?.message || 'Failed to remove bookmark.';
      toast.error(errorMessage);
    }
  };

  const handleFolktaleClick = (folktaleId) => {
    navigate(`/folktale/${folktaleId}`);
  };

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 min-h-[calc(100vh-100px)]">
        <div className="text-center bg-amber-100 text-red-600 p-6 rounded-full border-2 border-gray-200 text-lg animate-shake mx-auto max-w-md">
          Please <span onClick={() => navigate('/login')} className="text-blue-600 font-bold underline cursor-pointer hover:text-blue-700">log in</span> to view your bookmarked folktales.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="border-8 border-gray-200 border-t-amber-200 rounded-full w-12 h-12 animate-spin"></div>
        <p className="mt-2 text-amber-800 text-lg font-semibold">Loading your bookmarks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-100 text-red-600 p-6 rounded-full border-2 border-gray-200 text-center mx-auto max-w-md text-lg font-semibold animate-shake">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 min-h-screen font-caveat text-gray-800">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <h1 className="text-2xl sm:text-3xl font-semibold text-center text-amber-900 mb-6 border-b-4 border-amber-300 pb-3 animate-pulseSketchy">
        Your Bookmarked Folktales
      </h1>
      {bookmarks.length === 0 ? (
        <div className="text-center p-8 bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl shadow-lg border-2 border-amber-200 mx-auto max-w-lg animate-fadeIn">
          <p className="text-lg text-gray-600 mb-4 font-semibold animate-shake">
            You haven't bookmarked any folktales yet.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-900 text-white px-6 py-2 rounded-md text-lg font-bold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Explore Folktales
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {bookmarks
            .filter((bookmark) => bookmark.folktaleId)
            .map((bookmark) => (
              <div
                key={bookmark.folktaleId._id}
                className="flex bg-white rounded-xl shadow-md border-2 border-amber-200 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fadeIn focus:outline focus:outline-2 focus:outline-amber-300 focus:outline-offset-2"
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
                <div className="w-[140px] h-[140px] flex-shrink-0 overflow-hidden">
                  <img
                    src={bookmark.folktaleId.imageUrl || 'https://via.placeholder.com/150?text=No+Image'}
                    alt={bookmark.folktaleId.title || 'Unknown Folktale'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                    }}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between p-4">
                  <h3 className="text-lg font-bold text-amber-900 mb-2 hover:text-amber-700 transition-colors duration-200">
                    {bookmark.folktaleId.title || 'Unknown Title'}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm bg-amber-50 px-2 py-1 rounded-full text-gray-600">
                      <span className="font-bold text-amber-900">Region:</span> {bookmark.folktaleId.region || 'Unknown'}
                    </p>
                    <p className="text-sm bg-amber-50 px-2 py-1 rounded-full text-gray-600">
                      <span className="font-bold text-amber-900">Genre:</span> {bookmark.folktaleId.genre || 'Unknown'}
                    </p>
                    <p className="text-sm bg-amber-50 px-2 py-1 rounded-full text-gray-600">
                      <span className="font-bold text-amber-900">Age Group:</span> {bookmark.folktaleId.ageGroup || 'Unknown'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleRemoveBookmark(bookmark.folktaleId._id, e)}
                    className="self-end mt-2 text-red-600 bg-transparent border-none text-xl cursor-pointer hover:text-red-800 focus:outline focus:outline-2 focus:outline-red-600 focus:outline-offset-2 transition-colors duration-200"
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
