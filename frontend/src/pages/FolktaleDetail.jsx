import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CommentSection from '../components/CommentSection';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { FaStar, FaComment } from 'react-icons/fa';

function FolktaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [folktale, setFolktale] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchFolktaleAndBookmarks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const folktaleResponse = await axios.get(`/api/folktales/${id}`);
        if (!folktaleResponse.data || typeof folktaleResponse.data !== 'object') {
          throw new Error('Invalid legend data received');
        }
        setFolktale(folktaleResponse.data);

        if (token) {
          try {
            const bookmarkResponse = await axios.get('/api/folktales/bookmark', {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!Array.isArray(bookmarkResponse.data)) {
              throw new Error('Unexpected bookmark response format');
            }

            const isBookmarked = bookmarkResponse.data.some(
              (bookmark) => bookmark.folktaleId && bookmark.folktaleId._id === id
            );
            setIsBookmarked(isBookmarked);
          } catch (bookmarkError) {
            if (bookmarkError.response?.status === 401) {
              toast.warning('Session expired. Please log in again.');
              localStorage.removeItem('token');
              navigate('/login');
            } else {
              console.error('Bookmark fetch error:', bookmarkError);
              toast.error('Failed to fetch bookmark status.');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching legend:', err);
        if (err.response?.status === 404) {
          setError('Folktale not found.');
        } else {
          setError('Failed to load legend. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolktaleAndBookmarks();
  }, [id, token, navigate]);

  const handleRate = async () => {
    if (!token) {
      toast.warning('Please log in to rate this folktale.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (rating === 0) {
      toast.warning('Please select a rating before submitting.');
      return;
    }

    try {
      const response = await axios.post(
        `/api/folktales/${id}/rate`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFolktale(response.data);
      toast.success('Rating submitted successfully!');
    } catch (error) {
      console.error('Error rating folktale:', error);
      if (error.response?.status === 401) {
        toast.warning('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to submit rating.';
        toast.error(errorMessage);
      }
    }
  };

  const handleBookmark = async () => {
    if (!token) {
      toast.warning('Please log in to bookmark this folktale.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      if (isBookmarked) {
        await axios.delete(`/api/folktales/bookmarks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsBookmarked(false);
        toast.success('Bookmark removed.');
      } else {
        await axios.post(
          '/api/folktales/bookmarks',
          { folktaleId: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsBookmarked(true);
        toast.success('Legend bookmarked!');
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      if (error.response?.status === 401) {
        toast.warning('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to update bookmark.');
      }
    }
  };

  const handleAudioPlay = () => {
    if (!token) {
      toast.warning('Please log in to listen to the podcast.');
      setTimeout(() => navigate('/login'), 2000);
      return false;
    }
    return true;
  };

  const toggleCommentModal = () => {
    setIsCommentModalOpen(!isCommentModalOpen);
  };

  if (isLoading) {
    return (
      <div className="text-center p-12 text-lg text-amber-900 font-caveat animate-pulseSketchy">
        Loading Legend...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12 text-lg text-red-600 font-caveat bg-amber-100 rounded-lg border-2 border-amber-200 mx-auto max-w-md animate-shake">
        {error}
      </div>
    );
  }

  if (!folktale) {
    return (
      <div className="text-center p-12 text-lg text-red-600 font-caveat bg-amber-100 rounded-lg border-2 border-amber-200 mx-auto max-w-md animate-shake">
        No legend data available.
      </div>
    );
  }

  const averageRating = folktale.ratings?.length
    ? (folktale.ratings.reduce((sum, r) => sum + r.rating, 0) / folktale.ratings.length).toFixed(1)
    : 'No ratings';

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 font-caveat text-gray-800 animate-fadeIn">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar closeOnClick pauseOnHover theme="light" />

      <div className="bg-white rounded-lg p-6 sm:p-8 shadow-md border-2 border-amber-200 relative">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-amber-900 mb-4 animate-pulseSketchy">
            {folktale.title}
          </h1>
          <div className="flex flex-wrap justify-center gap-3 mb-5 items-center text-sm">
            <span className="bg-amber-50 px-3 py-1 rounded-full text-gray-600">
              <strong className="text-amber-900">Region:</strong> {folktale.region}
            </span>
            <span className="bg-amber-50 px-3 py-1 rounded-full text-gray-600">
              <strong className="text-amber-900">Genre:</strong> {folktale.genre}
            </span>
            <span className="bg-amber-50 px-3 py-1 rounded-full text-gray-600">
              <strong className="text-amber-900">Age Group:</strong> {folktale.ageGroup}
            </span>
            <span className="bg-amber-50 px-3 py-1 rounded-full text-gray-600">
              <strong className="text-amber-900">Rating:</strong> {averageRating}
              <span className="ml-1 text-amber-600">⭐</span>
              {folktale.ratings.length > 0 && (
                <span className="ml-1 text-xs text-gray-500">({folktale.ratings.length} ratings)</span>
              )}
            </span>
            <button
              onClick={handleBookmark}
              className="bg-transparent border-none cursor-pointer p-1 text-amber-900 hover:text-amber-700 transition-colors duration-200"
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {isBookmarked ? <BsBookmarkFill className="text-2xl" /> : <BsBookmark className="text-2xl" />}
            </button>
            <button
              onClick={toggleCommentModal}
              className="bg-transparent border-none cursor-pointer p-1 text-amber-900 hover:text-amber-700 transition-colors duration-200"
              title="View comments"
            >
              <FaComment className="text-2xl" />
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-8 rounded-lg overflow-hidden shadow-lg border-2 border-amber-200">
          <img
            src={folktale.imageUrl}
            alt={folktale.title}
            className="w-full h-auto object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
            }}
          />
        </div>

        {folktale.audioUrl && (
          <div className="max-w-3xl mx-auto mb-8 p-6 bg-amber-50 rounded-lg border-2 border-amber-200">
            <h2 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4">Listen to the Podcast</h2>
            {token ? (
              <audio controls className="w-full" onPlay={handleAudioPlay}>
                <source src={folktale.audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <div className="text-center">
                <p className="text-lg text-gray-600 mb-4 font-semibold">Please log in to listen to the podcast.</p>
                <button
                  className="bg-amber-900 text-white px-5 py-2 rounded-md text-lg font-bold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  onClick={() => {
                    toast.warning('Please log in to listen to the podcast.');
                    setTimeout(() => navigate('/login'), 2000);
                  }}
                >
                  Log in or Register
                </button>
              </div>
            )}
          </div>
        )}

        {folktale.ageGroup === 'Adults' && (
          <div className="bg-amber-100 text-amber-800 p-4 rounded-lg border-2 border-amber-200 mb-6 text-base animate-shake">
            <p><strong className="text-amber-900">⚠️ Warning:</strong> This folktale contains content intended for adult readers.</p>
          </div>
        )}

        <div className="my-10">
          <h2 className="text-xl sm:text-2xl font-bold text-amber-900 border-b-2 border-amber-300 pb-2 mb-5">
            {folktale.genre === 'Conspiracy Theory' ? 'The Theory' : 'The Story'}
          </h2>
          <div className="text-lg leading-relaxed">
            {token ? (
              <div
                className="mb-5 prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: folktale.content }}
              />
            ) : (
              <>
                <div
                  className="mb-5 prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: folktale.content.slice(0, 300) + '...' }}
                />
                <div className="text-center p-6 bg-amber-50 rounded-lg border-2 border-amber-200">
                  <p className="text-lg text-gray-600 mb-4 font-semibold">Want to read the full story?</p>
                  <button
                    className="bg-amber-900 text-white px-5 py-2 rounded-md text-lg font-bold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => navigate('/login')}
                  >
                    Log in or Register
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {token && (
          <div className="p-6 bg-amber-50 rounded-lg border-2 border-amber-200 my-10">
            <h3 className="text-lg sm:text-xl font-bold text-amber-900 mb-4">Rate this folktale</h3>
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`text-2xl cursor-pointer transition-colors duration-200 ${
                      star <= (hoverRating || rating) ? 'text-amber-600' : 'text-gray-300'
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
              <button
                onClick={handleRate}
                className="bg-amber-600 text-white px-5 py-2 rounded-md text-lg font-bold hover:bg-amber-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Submit Rating
              </button>
            </div>
          </div>
        )}

        {isCommentModalOpen && (
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-lg shadow-2xl max-h-[80vh] overflow-y-auto transform transition-transform duration-300 ease-in-out sm:max-w-md sm:mx-auto"
               style={{ transform: isCommentModalOpen ? 'translateY(0)' : 'translateY(100%)' }}>
            <div className="flex justify-between items-center p-4 border-b-2 border-amber-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-amber-900">Comments</h3>
              <button
                onClick={toggleCommentModal}
                className="text-amber-900 hover:text-amber-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <CommentSection folktaleId={id} closeModal={toggleCommentModal} />
          </div>
        )}
        {isCommentModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={toggleCommentModal}></div>
        )}
      </div>
    </div>
  );
}

export default FolktaleDetail;
