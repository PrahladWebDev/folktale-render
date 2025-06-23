import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CommentSection from '../components/CommentSection';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BsBookmark, BsBookmarkFill, BsChat, BsArrowLeft, BsArrowRight, BsShare } from 'react-icons/bs';
import { FaStar } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton, EmailShareButton, FacebookIcon, TwitterIcon, WhatsappIcon, EmailIcon } from 'react-share';

// SimilarFolktales Component
function SimilarFolktales({ genre, currentFolktaleId }) {
  const [similarFolktales, setSimilarFolktales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSimilarFolktales = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/folktales', {
          params: {
            genre,
            limit: 10,
          },
        });
        const filteredFolktales = response.data.folktales.filter(
          (folktale) => folktale._id !== currentFolktaleId
        );
        setSimilarFolktales(filteredFolktales);
      } catch (err) {
        console.error('Error fetching similar legends:', err);
        setError('Failed to load similar legends.');
      } finally {
        setIsLoading(false);
      }
    };

    if (genre) {
      fetchSimilarFolktales();
    }
  }, [genre, currentFolktaleId]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return <div className="text-center p-4 text-amber-900 font-caveat">Loading similar legends...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600 font-caveat">{error}</div>;
  }

  if (similarFolktales.length === 0) {
    return (
      <div className="text-center p-4 text-gray-600 font-caveat">
        No similar legend found in this genre.
      </div>
    );
  }

  return (
    <div className="my-10">
      <h2 className="text-xl sm:text-2xl font-bold text-amber-900 border-b-2 border-amber-300 pb-2 mb-5">
        You might also like:
      </h2>
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-amber-600 text-white p-2 rounded-full shadow-md hover:bg-amber-700 z-10"
          aria-label="Scroll left"
        >
          <BsArrowLeft className="text-xl" />
        </button>
        <div
          ref={scrollRef}
          className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {similarFolktales.map((folktale) => (
            <div
              key={folktale._id}
              className="flex-none w-64 bg-white rounded-lg shadow-md border-2 border-amber-200 cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => navigate(`/folktale/${folktale._id}`)}
            >
              <img
                src={folktale.imageUrl}
                alt={folktale.title}
                className="w-full h-40 object-cover rounded-t-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/256x160?text=No+Image';
                }}
              />
              <div className="p-4">
                <h3 className="text-lg font-bold text-amber-900 truncate">{folktale.title}</h3>
                <p className="text-sm text-gray-600">Region: {folktale.region}</p>
                <p className="text-sm text-gray-600">Age Group: {folktale.ageGroup}</p>
                <div className="flex items-center mt-2">
                  <FaStar className="text-amber-600 mr-1" />
                  <span className="text-sm text-gray-600">
                    {folktale.ratings?.length
                      ? (folktale.ratings.reduce((sum, r) => sum + r.rating, 0) / folktale.ratings.length).toFixed(1)
                      : 'No ratings'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-amber-600 text-white p-2 rounded-full shadow-md hover:bg-amber-700 z-10"
          aria-label="Scroll right"
        >
          <BsArrowRight className="text-xl" />
        </button>
      </div>
    </div>
  );
}

// FolktaleDetail Component
function FolktaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [folktale, setFolktale] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const token = localStorage.getItem('token');
  const commentSectionRef = useRef(null);

  // Generate share URL and metadata
  const shareUrl = `${window.location.origin}/folktale/${id}`;
  const shareTitle = folktale?.title || 'Discover a Fascinating Folktale!';
  const shareDescription = folktale?.content
    ? `${folktale.content.replace(/<[^>]+>/g, '').slice(0, 160)}... Read more at ${window.location.origin}!`
    : 'Explore a captivating folktale from around the world. Dive into the story now!';
  const shareImage = folktale?.imageUrl || 'https://via.placeholder.com/800x400?text=Folktale+Image';

  useEffect(() => {
    const fetchFolktaleAndBookmarks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [folktaleResponse, commentsResponse] = await Promise.all([
          axios.get(`/api/folktales/${id}`),
          axios.get(`/api/folktales/${id}/comments`),
        ]);

        if (!folktaleResponse.data || typeof folktaleResponse.data !== 'object') {
          throw new Error('Invalid legend data received');
        }
        setFolktale(folktaleResponse.data);

        const comments = commentsResponse.data || [];
        const totalComments = comments.reduce(
          (count, comment) => count + 1 + (comment.replies?.length || 0),
          0
        );
        setCommentCount(totalComments);

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
        } else if (err.code === 'ERR_NETWORK') {
          setError('Network error. Please check your connection and try again.');
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
      toast.warning('Please log in to rate this legend.');
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
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your connection.');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to submit rating.';
        toast.error(errorMessage);
      }
    }
  };

  const handleBookmark = async () => {
    if (!token) {
      toast.warning('Please log in to bookmark this legend.');
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
          `/api/folktales/bookmarks`,
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
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your connection.');
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
    setShowShareModal(false);
  };

  if (isLoading) {
    return (
      <div className="text-center p-12 text-lg text-amber-900 font-caveat animate-pulse">
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
        No Legend data available.
      </div>
    );
  }

  const averageRating = folktale.ratings?.length
    ? (folktale.ratings.reduce((sum, r) => sum + r.rating, 0) / folktale.ratings.length).toFixed(1)
    : 'No ratings';

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 font-caveat text-gray-800 animate-fade-in">
      <Helmet>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDescription} />
        <meta name="twitter:image" content={shareImage} />
      </Helmet>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar closeOnClick pauseOnHover theme="light" />

      <div className="bg-white rounded-lg p-6 sm:p-8 shadow-md border-2 border-amber-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-amber-900 mb-4 animate-pulse">
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
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {isBookmarked ? <BsBookmarkFill className="text-2xl" /> : <BsBookmark className="text-2xl" />}
            </button>
            <button
              onClick={() => setShowComments(true)}
              className="bg-transparent border-none cursor-pointer p-1 text-amber-900 hover:text-amber-700 transition-colors duration-200 relative"
              title="View comments"
              aria-label={`View ${commentCount} comments`}
            >
              <BsChat className="text-2xl" />
              {commentCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full px-1.5 py-0.5">
                  {commentCount}
                </span>
              )}
            </button>
            <button
              onClick={handleShare}
              className="bg-transparent border-none cursor-pointer p-1 text-amber-900 hover:text-amber-700 transition-colors duration-200"
              title="Share folktale"
              aria-label="Share folktale"
            >
              <BsShare className="text-2xl" />
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
            <p><strong className="text-amber-900">⚠️ Warning:</strong> This Legend contains content intended for adult readers.</p>
          </div>
        )}

        <div className="my-10">
          <h2 className="text-xl sm:text-2xl font-bold text-amber-900 border-b-2 border-amber-300 pb-2 mb-5">
            {(() => {
              switch (folktale.genre) {
                case 'Conspiracy Theory': return 'The Theory';
                case 'Fable': return 'The Fable';
                case 'Myth': return 'The Myth';
                case 'Legend': return 'The Legend';
                case 'Fairy Tale': return 'The Fairy Tale';
                case 'Horror': return 'The Horror Story';
                case 'Fantasy': return 'The Fantasy';
                case 'Adventure': return 'The Adventure';
                case 'Mystery': return 'The Mystery';
                case 'Historical': return 'The Historical Tale';
                case 'Ghost Story': return 'The Ghost Story';
                case 'Supernatural': return 'The Supernatural Tale';
                case 'Tragedy': return 'The Tragedy';
                case 'Moral Tale': return 'The Moral Tale';
                case 'Urban Legend': return 'The Urban Legend';
                case 'Comedy': return 'The Comedy';
                case 'Parable': return 'The Parable';
                case 'Epic': return 'The Epic';
                case 'Romance': return 'The Romance';
                case 'Unsolved Mysteries': return 'The Mystery';
                case 'Supernatural/Paranormal Entities': return 'The Entity';
                default: return 'The Story';
              }
            })()}
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
                    onClick={() => toast.warning('Please log in to read the full story.')}
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
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  />
                ))}
              </div>
              <button
                onClick={handleRate}
                className="bg-amber-600 text-white px-5 py-2 rounded-md text-lg font-bold hover:bg-amber-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                aria-label="Submit rating"
              >
                Submit Rating
              </button>
            </div>
          </div>
        )}

        <SimilarFolktales genre={folktale.genre} currentFolktaleId={id} />

        {showComments && (
          <div
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto transform transition-transform duration-300 ease-in-out"
            role="dialog"
            aria-modal="true"
            aria-labelledby="comments-title"
          >
            <div className="flex justify-between items-center p-4 border-b-2 border-amber-200">
              <h3 id="comments-title" className="text-2xl font-bold text-amber-900">
                Comments ({commentCount})
              </h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-amber-900 hover:text-amber-700 text-xl font-bold"
                aria-label="Close comments"
              >
                Close
              </button>
            </div>
            <CommentSection
              folktaleId={id}
              ref={commentSectionRef}
              onCommentPosted={() => {
                axios.get(`/api/folktales/${id}/comments`).then((res) => {
                  const totalComments = res.data.reduce(
                    (count, comment) => count + 1 + (comment.replies?.length || 0),
                    0
                  );
                  setCommentCount(totalComments);
                });
              }}
            />
          </div>
        )}

        {showShareModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 id="share-modal-title" className="text-xl font-bold text-amber-900">
                  Share this Folktale
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-amber-900 hover:text-amber-700 text-xl font-bold"
                  aria-label="Close share modal"
                >
                  Close
                </button>
              </div>
              <div className="mb-4">
                <img
                  src={shareImage}
                  alt={shareTitle}
                  className="w-full h-40 object-cover rounded-lg mb-2"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/800x400?text=Folktale+Image';
                  }}
                />
                <p className="text-lg font-semibold text-amber-900">{shareTitle}</p>
                <p className="text-sm text-gray-600">{shareDescription}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <FacebookShareButton url={shareUrl} quote={shareTitle}>
                  <FacebookIcon size={48} round />
                </FacebookShareButton>
                <TwitterShareButton url={shareUrl} title={shareTitle}>
                  <TwitterIcon size={48} round />
                </TwitterShareButton>
                <WhatsappShareButton url={shareUrl} title={`${shareTitle}\n${shareDescription}`}>
                  <WhatsappIcon size={48} round />
                </WhatsappShareButton>
                <EmailShareButton url={shareUrl} subject={shareTitle} body={`${shareDescription}\n\nRead more: ${shareUrl}`}>
                  <EmailIcon size={48} round />
                </EmailShareButton>
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 p-2 border-2 border-amber-200 rounded-l-md text-gray-600"
                />
                <button
                  onClick={copyLink}
                  className="bg-amber-600 text-white px-4 py-2 rounded-r-md hover:bg-amber-700"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FolktaleDetail;