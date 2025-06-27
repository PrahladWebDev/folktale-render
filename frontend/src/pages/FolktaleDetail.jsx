import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CommentSection from '../components/CommentSection';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BsBookmark, BsBookmarkFill, BsChat, BsArrowLeft, BsArrowRight, BsShare, BsDownload } from 'react-icons/bs';
import { FaStar } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton, EmailShareButton, FacebookIcon, TwitterIcon, WhatsappIcon, EmailIcon } from 'react-share';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

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
          params: { genre, limit: 10 },
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

    if (genre) fetchSimilarFolktales();
  }, [genre, currentFolktaleId]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) return <div className="text-center p-4 text-amber-900 font-caveat">Loading similar legends...</div>;
  if (error) return <div className="text-center p-4 text-red-600 font-caveat">{error}</div>;
  if (similarFolktales.length === 0) return (
    <div className="text-center p-4 text-gray-600 font-caveat">
      No similar legend found in this genre.
    </div>
  );

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
        <div ref={scrollRef} className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
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
  const [user, setUser] = useState(null);
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
  const imageRef = useRef(null);

  const shareUrl = `${window.location.origin}/folktale/${id}`;
  const shareTitle = folktale?.title || 'Discover a Fascinating Folktale!';
  const shareDescription = folktale?.content
    ? `${folktale.content.replace(/<[^>]+>/g, '').slice(0, 160)}... Read more at ${window.location.origin}!`
    : 'Explore a captivating folktale from around the world. Dive into the story now!';
  const shareImage = folktale?.imageUrl || 'https://via.placeholder.com/800x400?text=Folktale+Image';

  useEffect(() => {
    // Load Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchFolktaleAndBookmarks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [folktaleResponse, commentsResponse, userResponse] = await Promise.all([
          axios.get(`/api/folktales/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/folktales/${id}/comments`),
          token ? axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ data: null }),
        ]);

        if (!folktaleResponse.data || typeof folktaleResponse.data !== 'object') {
          throw new Error('Invalid legend data received');
        }
        setFolktale(folktaleResponse.data);
        setUser(userResponse.data?.user || null);

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
            if (!Array.isArray(bookmarkResponse.data)) throw new Error('Unexpected bookmark response format');
            setIsBookmarked(bookmarkResponse.data.some((bookmark) => bookmark.folktaleId && bookmark.folktaleId._id === id));
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
        setError(err.response?.status === 404 ? 'Folktale not found.' : err.code === 'ERR_NETWORK' ? 'Network error. Please check your connection and try again.' : 'Failed to load legend. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFolktaleAndBookmarks();
  }, [id, token, navigate]);

  const handleDownloadPDF = async () => {
    if (!token) {
      toast.warning('Please log in to download the legend as PDF.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yOffset = margin;

      const amber900 = [120, 79, 23];
      const gray600 = [75, 85, 99];
      const amber200 = [253, 230, 138];

      doc.setFont('Helvetica', 'normal');

      if (imageRef.current && folktale.imageUrl) {
        try {
          const imgData = await htmlToImage.toPng(imageRef.current);
          const imgProps = doc.getImageProperties(imgData);
          const imgWidth = maxWidth;
          const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
          doc.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
          yOffset += imgHeight + 15;
        } catch (imgError) {
          console.error('Error adding image to PDF:', imgError);
        }
      }

      doc.setFontSize(24);
      doc.setTextColor(...amber900);
      const titleLines = doc.splitTextToSize(folktale.title, maxWidth);
      doc.text(titleLines, margin, yOffset);
      yOffset += titleLines.length * 10 + 15;

      doc.setFontSize(12);
      doc.setTextColor(...gray600);
      doc.text(`Region: ${folktale.region}`, margin, yOffset);
      yOffset += 10;
      doc.text(`Genre: ${folktale.genre}`, margin, yOffset);
      yOffset += 10;
      doc.text(`Age Group: ${folktale.ageGroup}`, margin, yOffset);
      yOffset += 10;
      doc.text(`Rating: ${folktale.ratings?.length ? (folktale.ratings.reduce((sum, r) => sum + r.rating, 0) / folktale.ratings.length).toFixed(1) : 'No ratings'}`, margin, yOffset);
      yOffset += 20;

      doc.setFontSize(14);
      const plainText = folktale.content.replace(/<[^>]+>/g, '');
      const contentLines = doc.splitTextToSize(plainText, maxWidth);
      let pageCount = 1;

      contentLines.forEach((line) => {
        if (yOffset + 10 > pageHeight - margin) {
          doc.addPage();
          pageCount++;
          yOffset = margin;
          doc.setFontSize(12);
          doc.setTextColor(...gray600);
          doc.text(`Page ${pageCount}`, pageWidth - margin - 20, yOffset);
          yOffset += 15;
          doc.setFontSize(14);
          doc.setTextColor(...gray600);
        }
        doc.text(line, margin, yOffset);
        yOffset += 10;
      });

      doc.setDrawColor(...amber200);
      doc.line(margin, pageHeight - margin, pageWidth - margin, pageHeight - margin);
      doc.setFontSize(10);
      doc.setTextColor(...gray600);
      doc.text(`Generated from ${window.location.origin}`, margin, pageHeight - margin + 10);

      doc.save(`${folktale.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

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
        toast.error(error.response?.data?.message || 'Failed to submit rating.');
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
        await axios.delete(`/api/folktales/bookmarks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setIsBookmarked(false);
        toast.success('Bookmark removed.');
      } else {
        await axios.post(`/api/folktales/bookmarks`, { folktaleId: id }, { headers: { Authorization: `Bearer ${token}` } });
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

  const handleAudioPlay = async () => {
    if (!token) {
      toast.warning('Please log in to listen to the podcast.');
      setTimeout(() => navigate('/login'), 2000);
      return false;
    }
    if (!user.isAdmin && !user.isSubscribed) {
      toast.warning('Please subscribe to listen to the podcast.');
      setTimeout(() => navigate('/profile'), 2000);
      return false;
    }
    return true;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareDescription, url: shareUrl });
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

  if (isLoading) return <div className="text-center p-12 text-lg text-amber-900 font-caveat animate-pulse">Loading Legend...</div>;
  if (error) return <div className="text-center p-12 text-lg text-red-600 font-caveat bg-amber-100 rounded-lg border-2 border-amber-200 mx-auto max-w-md animate-shake">{error}</div>;
  if (!folktale) return <div className="text-center p-12 text-lg text-red-600 font-caveat bg-amber-100 rounded-lg border-2 border-amber-200 mx-auto max-w-md animate-shake">Folktale not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{`${folktale.title} | Legend Sansar`}</title>
        <meta name="description" content={shareDescription} />
        <meta name="keywords" content={`folktale, ${folktale.genre}, ${folktale.region}, ${folktale.ageGroup}, Legend Sansar`} />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:url" content={shareUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl border-2 border-amber-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
          <div className="w-full sm:w-1/3 mb-4 sm:mb-0 sm:mr-6">
            <img
              ref={imageRef}
              src={folktale.imageUrl}
              alt={folktale.title}
              className="w-full h-64 object-cover rounded-lg shadow-md"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
              }}
            />
          </div>
          <div className="w-full sm:w-2/3">
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2">{folktale.title}</h1>
            <div className="text-sm text-gray-600 mb-4">
              <p><strong>Region:</strong> {folktale.region}</p>
              <p><strong>Genre:</strong> {folktale.genre}</p>
              <p><strong>Age Group:</strong> {folktale.ageGroup}</p>
              <p><strong>Views:</strong> {folktale.views}</p>
              <p>
                <strong>Rating:</strong>{' '}
                {folktale.ratings?.length
                  ? (folktale.ratings.reduce((sum, r) => sum + r.rating, 0) / folktale.ratings.length).toFixed(1)
                  : 'No ratings yet'}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleBookmark}
                className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                {isBookmarked ? <BsBookmarkFill className="mr-2" /> : <BsBookmark className="mr-2" />}
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button
                onClick={() => {
                  setShowComments(!showComments);
                  if (!showComments && commentSectionRef.current) {
                    commentSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                aria-label="Toggle comments"
              >
                <BsChat className="mr-2" />
                Comments ({commentCount})
              </button>
              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                aria-label="Share folktale"
              >
                <BsShare className="mr-2" />
                Share
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                aria-label="Download as PDF"
              >
                <BsDownload className="mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {folktale.audioUrl && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-amber-900 mb-2">Listen to the Podcast</h2>
            <audio
              controls
              className="w-full"
              onPlay={handleAudioPlay}
              onError={() => toast.error('Failed to load podcast.')}
            >
              <source src={folktale.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <div className="prose prose-sm sm:prose lg:prose-lg max-w-none mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4">The Legend</h2>
          <div dangerouslySetInnerHTML={{ __html: folktale.content }} />
        </div>

        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4">Rate this Legend</h2>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`text-2xl cursor-pointer transition-colors ${
                  star <= (hoverRating || rating) ? 'text-amber-600' : 'text-gray-300'
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`Rate ${star} stars`}
              />
            ))}
          </div>
          {rating > 0 && (
            <button
              onClick={handleRate}
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Submit Rating
            </button>
          )}
        </div>

        {showComments && (
          <div ref={commentSectionRef}>
            <CommentSection folktaleId={id} updateCommentCount={setCommentCount} />
          </div>
        )}

        <SimilarFolktales genre={folktale.genre} currentFolktaleId={id} />
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-amber-900 mb-4">Share this Legend</h3>
            <div className="flex space-x-4 mb-4">
              <FacebookShareButton url={shareUrl} quote={shareDescription} hashtag="#LegendSansar">
                <FacebookIcon size={32} round />
              </FacebookShareButton>
              <TwitterShareButton url={shareUrl} title={shareTitle} hashtags={['LegendSansar']}>
                <TwitterIcon size={32} round />
              </TwitterShareButton>
              <WhatsappShareButton url={shareUrl} title={shareTitle}>
                <WhatsappIcon size={32} round />
              </WhatsappShareButton>
              <EmailShareButton url={shareUrl} subject={shareTitle} body={shareDescription}>
                <EmailIcon size={32} round />
              </EmailShareButton>
            </div>
            <div className="flex items-center">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 p-2 border border-gray-300 rounded-l-lg text-sm"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 bg-amber-600 text-white rounded-r-lg hover:bg-amber-700"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FolktaleDetail;
