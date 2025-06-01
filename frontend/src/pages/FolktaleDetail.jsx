import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CommentSection from '../components/CommentSection';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs'; // Importing bookmark icons from react-icons

function FolktaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [folktale, setFolktale] = useState(null);
  const [rating, setRating] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false); // State for bookmark status
  const token = localStorage.getItem('token');

 useEffect(() => {
  const fetchFolktaleAndBookmarks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch folktale details
      const folktaleResponse = await axios.get(`http://localhost:5000/api/folktales/${id}`);
      setFolktale(folktaleResponse.data);

      // Fetch user's bookmarks if authenticated
      if (token) {
        const bookmarkResponse = await axios.get('http://localhost:5000/api/folktales/bookmark', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!Array.isArray(bookmarkResponse.data)) {
          throw new Error('Bookmark data is not an array');
        }
        const isBookmarked = bookmarkResponse.data.some(
          (bookmark) => bookmark.folktaleId && bookmark.folktaleId._id === id
        );
        setIsBookmarked(isBookmarked);
      }
    } catch (error) {
      console.error('Error fetching folktale or bookmarks:', error);
      setError('Failed to load folktale or bookmarks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  fetchFolktaleAndBookmarks();
}, [id, token]);

  const handleRate = async () => {
    if (!token) {
      toast.warning('Please log in to rate this folktale.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    try {
      const response = await axios.post(
        `http://localhost:5000/api/folktales/${id}/rate`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFolktale(response.data);
      toast.success('Rating submitted successfully!');
    } catch (error) {
      console.error('Error rating folktale:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit rating. Please try again.';
      toast.error(errorMessage);
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
        // Remove bookmark
        await axios.delete(`http://localhost:5000/api/folktales/bookmarks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsBookmarked(false);
        toast.success('Bookmark removed successfully!');
      } else {
        // Add bookmark
        await axios.post(
          'http://localhost:5000/api/folktales/bookmarks',
          { folktaleId: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsBookmarked(true);
        toast.success('Folktale bookmarked successfully!');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update bookmark. Please try again.';
      toast.error(errorMessage);
    }
  };

  if (isLoading) return <div style={styles.loading}>Loading folktale...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!folktale) return <div style={styles.error}>Folktale not found.</div>;

  const averageRating = folktale.ratings.length
    ? (folktale.ratings.reduce((sum, r) => sum + r.rating, 0) / folktale.ratings.length).toFixed(1)
    : 'No ratings';

  return (
    <div style={styles.container}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <div style={styles.searchContainer}></div>

      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>{folktale.title}</h1>
          <div style={styles.meta}>
            <span style={styles.metaItem}><strong>Region:</strong> {folktale.region}</span>
            <span style={styles.metaItem}><strong>Genre:</strong> {folktale.genre}</span>
            <span style={styles.metaItem}><strong>Age Group:</strong> {folktale.ageGroup}</span>
            <span style={styles.rating}>
              <strong>Rating:</strong> {averageRating}
              <span style={styles.star}>⭐</span>
              {folktale.ratings.length > 0 && (
                <span style={styles.ratingCount}>({folktale.ratings.length} ratings)</span>
              )}
            </span>
            <button
              onClick={handleBookmark}
              style={styles.bookmarkButton}
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {isBookmarked ? (
                <BsBookmarkFill style={styles.bookmarkIcon} />
              ) : (
                <BsBookmark style={styles.bookmarkIcon} />
              )}
            </button>
          </div>
        </div>

        <div style={styles.imageContainer}>
          <img
            src={folktale.imageUrl}
            alt={folktale.title}
            style={styles.image}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
            }}
          />
        </div>

        {folktale.ageGroup === 'Adults' && (
          <div style={styles.adultWarning}>
            <p><strong>⚠️ Warning:</strong> This folktale contains content intended for adult readers. Viewer discretion is advised.</p>
          </div>
        )}

        <div style={styles.storyContainer}>
          <h2 style={styles.storyTitle}>The Story</h2>
          <div style={styles.storyContent}>
            {token ? (
              <div
                style={styles.paragraph}
                dangerouslySetInnerHTML={{ __html: folktale.content }}
              />
            ) : (
              <>
                <div
                  style={styles.paragraph}
                  dangerouslySetInnerHTML={{ __html: folktale.content.slice(0, 300) + '...' }}
                />
                <div style={styles.loginPrompt}>
                  <p>Want to read the full story?</p>
                  <button
                    style={styles.loginButton}
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
          <div style={styles.ratingSection}>
            <h3 style={styles.ratingTitle}>Rate this folktale</h3>
            <div style={styles.ratingControls}>
              <select
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                style={styles.ratingSelect}
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                ))}
              </select>
              <button
                onClick={handleRate}
                style={styles.rateButton}
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

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: "'Merriweather', serif",
    color: '#3a3a3a',
    lineHeight: '1.6',
  },
  searchContainer: {
    marginBottom: '30px',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '2.5rem',
    color: '#5c3c10',
    marginBottom: '15px',
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '20px',
    fontSize: '0.95rem',
    alignItems: 'center', // Align items vertically
  },
  metaItem: {
    backgroundColor: '#f9f5e9',
    padding: '5px 12px',
    borderRadius: '20px',
  },
  rating: {
    backgroundColor: '#f9f5e9',
    padding: '5px 12px',
    borderRadius: '20px',
  },
  star: {
    marginLeft: '5px',
    color: '#d4a017',
  },
  ratingCount: {
    marginLeft: '5px',
    fontSize: '0.85rem',
    color: '#666',
  },
  bookmarkButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
  },
  bookmarkIcon: {
    fontSize: '1.5rem',
    color: '#5c3c10',
  },
  imageContainer: {
    margin: '0 auto 30px',
    maxWidth: '800px',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  image: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  adultWarning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    border: '1px solid #ffeeba',
    padding: '15px 20px',
    borderRadius: '5px',
    marginBottom: '25px',
    fontSize: '1rem',
    lineHeight: '1.6',
  },
  storyContainer: {
    margin: '40px 0',
  },
  storyTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.8rem',
    color: '#5c3c10',
    borderBottom: '2px solid #e0c9a6',
    paddingBottom: '10px',
    marginBottom: '20px',
  },
  storyContent: {
    fontSize: '1.1rem',
    lineHeight: '1.8',
  },
  paragraph: {
    marginBottom: '20px',
  },
  loginPrompt: {
    textAlign: 'center',
    margin: '30px 0',
    padding: '20px',
    backgroundColor: '#f9f5e9',
    borderRadius: '8px',
  },
  loginButton: {
    backgroundColor: '#5c3c10',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '15px',
    transition: 'background-color 0.3s',
  },
  ratingSection: {
    margin: '40px 0',
    padding: '25px',
    backgroundColor: '#f9f5e9',
    borderRadius: '8px',
  },
  ratingTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.5rem',
    color: '#5c3c10',
    marginBottom: '15px',
  },
  ratingControls: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ratingSelect: {
    padding: '8px 15px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    backgroundColor: '#fff',
  },
  rateButton: {
    backgroundColor: '#d4a017',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 20px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '1.2rem',
    color: '#5c3c10',
  },
  error: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '1.2rem',
    color: '#d32f2f',
  },
};

export default FolktaleDetail;
