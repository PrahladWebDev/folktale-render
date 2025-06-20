import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CommentSection from '../components/CommentSection';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import './FolktaleDetail.css';

function FolktaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [folktale, setFolktale] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
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
      setRating(0);
      setHoverRating(0);
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

  const renderStars = (ratingValue) => {
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-amber-500" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-amber-500" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-amber-500" />);
      }
    }

    return stars;
  };

  if (isLoading) {
    return (
      <div className="text-center p-12 text-lg text-amber-900 font-caveat animate-pulse">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
        </div>
        Loading Legend...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12 text-lg text-white bg-gradient-to-r from-red-400 to-amber-600 rounded-lg shadow-lg mx-auto max-w-md animate-fade-in">
        <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <FaExclamationCircle className="text-red-500 text-3xl" />
        </div>
        {error}
      </div>
    );
  }

  if (!folktale) {
    return (
      <div className="text-center p-12 text-lg text-white bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg shadow-lg mx-auto max-w-md animate-fade-in">
        <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <FaExclamationCircle className="text-amber-500 text-3xl" />
        </div>
        No legend data available.
      </div>
    );
  }

  const averageRating = folktale.ratings?.length
    ? folktale.ratings.reduce((sum, r) => sum + r.rating, 0) / folktale.ratings.length
    : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 font-caveat text-gray-800 animate-fade-in">
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar 
        closeOnClick 
        pauseOnHover 
        theme="colored"
        toastClassName="font-caveat"
      />

      <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl border-2 border-amber-200 hover:shadow-2xl transition-shadow duration-300">
        <div className="text-center mb-8 relative">
          <button
            onClick={handleBookmark}
            className="absolute top-0 right-0 bg-amber-100 p-2 rounded-full hover:bg-amber-200 transition-colors duration-200 group"
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            {isBookmarked ? (
              <BsBookmarkFill className="text-2xl text-amber-700 group-hover:text-amber-900" />
            ) : (
              <BsBookmark className="text-2xl text-amber-700 group-hover:text-amber-900" />
            )}
          </button>
          
          <h1 className="text-3xl sm:text-5xl font-bold text-amber-900 mb-4 animate-fade-in">
            {folktale.title}
          </h1>
          
          <div className="flex flex-wrap justify-center gap-3 mb-5 items-center">
            <span className="bg-gradient-to-r from-amber-50 to-amber-100 px-4 py-2 rounded-full text-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <strong className="text-amber-900">Region:</strong> {folktale.region}
            </span>
            <span className="bg-gradient-to-r from-amber-50 to-amber-100 px-4 py-2 rounded-full text-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <strong className="text-amber-900">Genre:</strong> {folktale.genre}
            </span>
            <span className="bg-gradient-to-r from-amber-50 to-amber-100 px-4 py-2 rounded-full text-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <strong className="text-amber-900">Age Group:</strong> {folktale.ageGroup}
            </span>
            
            <div className="flex items-center bg-gradient-to-r from-amber-50 to-amber-100 px-4 py-2 rounded-full text-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <strong className="text-amber-900 mr-1">Rating:</strong>
              <div className="flex items-center">
                {renderStars(averageRating)}
                <span className="ml-2 text-amber-700 font-bold">
                  {averageRating.toFixed(1)}
                  {folktale.ratings.length > 0 && (
                    <span className="ml-1 text-xs text-gray-500">({folktale.ratings.length})</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-8 rounded-xl overflow-hidden shadow-lg border-2 border-amber-200 hover:border-amber-300 transition-all duration-300">
          <img
            src={folktale.imageUrl}
            alt={folktale.title}
            className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
            }}
          />
        </div>

        {folktale.audioUrl && (
          <div className="max-w-3xl mx-auto mb-8 p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200 hover:shadow-lg transition-shadow">
            <h2 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
              </svg>
              Listen to the Podcast
            </h2>
            {token ? (
              <audio controls className="w-full rounded-lg" onPlay={handleAudioPlay}>
                <source src={folktale.audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <div className="text-center p-4 bg-white rounded-lg shadow-inner">
                <p className="text-lg text-gray-600 mb-4 font-semibold">Please log in to listen to the podcast.</p>
                <button
                  className="bg-gradient-to-r from-amber-600 to-amber-800 text-white px-6 py-3 rounded-lg text-lg font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  onClick={() => navigate('/login')}
                >
                  Log in or Register
                </button>
              </div>
            )}
          </div>
        )}

        {folktale.ageGroup === 'Adults' && (
          <div className="bg-gradient-to-r from-amber-200 to-amber-300 text-amber-900 p-4 rounded-xl border-2 border-amber-300 mb-6 text-base animate-pulse">
            <p className="flex items-center gap-2">
              <FaExclamationCircle className="text-xl" />
              <strong>Warning:</strong> This folktale contains content intended for adult readers.
            </p>
          </div>
        )}

        <div className="my-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-900 border-b-2 border-amber-300 pb-2 mb-5 flex items-center gap-2">
            {folktale.genre === 'Conspiracy Theory' ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                The Theory
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                The Story
              </>
            )}
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
                <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200 shadow-inner">
                  <p className="text-xl text-gray-600 mb-4 font-semibold">Want to read the full story?</p>
                  <button
                    className="bg-gradient-to-r from-amber-600 to-amber-800 text-white px-6 py-3 rounded-lg text-lg font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
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
          <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200 my-10 hover:shadow-lg transition-shadow">
            <h3 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <FaStar className="text-amber-500" />
              Rate this folktale
            </h3>
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="text-3xl focus:outline-none"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {(hoverRating || rating) >= star ? (
                      <FaStar className="text-amber-500 hover:text-amber-600 transition-colors" />
                    ) : (
                      <FaRegStar className="text-amber-400 hover:text-amber-500 transition-colors" />
                    )}
                  </button>
                ))}
                <span className="ml-2 text-amber-700 font-bold text-xl">
                  {hoverRating ? hoverRating : rating || '0'}
                </span>
              </div>
              <button
                onClick={handleRate}
                disabled={rating === 0}
                className={`px-6 py-3 rounded-lg text-lg font-bold transition-all duration-300 ${
                  rating === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 to-amber-800 text-white hover:shadow-lg transform hover:scale-105'
                }`}
              >
                Submit Rating
              </button>
            </div>
          </div>
        )}

        <CommentSection folktaleId={id} />
      </div>
    </div>
  );
}

export default FolktaleDetail;
