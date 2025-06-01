
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
    e.stopPropagation(); // Prevent card click from triggering navigation
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
      const errorMessage = error.response?.data?.message || 'Failed to remove bookmark. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleFolktaleClick = (folktaleId) => {
    navigate(`/folktale/${folktaleId}`);
  };

  if (!token) {
    return (
      <div className="container">
        <div className="error">
          Please <span onClick={() => navigate('/login')} className="link">log in</span> to view your bookmarked folktales.
        </div>
      </div>
    );
  }

  if (isLoading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="loading-text">Loading your bookmarks...</p>
    </div>
  );
  
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <h1 className="title">Your Bookmarked Folktales</h1>
      {bookmarks.length === 0 ? (
        <div className="no-bookmarks-container">
          <p className="no-bookmarks">You haven't bookmarked any folktales yet.</p>
          <button 
            onClick={() => navigate('/')}
            className="explore-button"
          >
            Explore Folktales
          </button>
        </div>
      ) : (
        <div className="bookmark-list">
          {bookmarks
            .filter((bookmark) => bookmark.folktaleId)
            .map((bookmark) => (
              <div 
                key={bookmark.folktaleId._id} 
                className="bookmark-card"
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
                <div className="thumbnail-container">
                  <img
                    src={bookmark.folktaleId.imageUrl || 'https://via.placeholder.com/150?text=No+Image'}
                    alt={bookmark.folktaleId.title || 'Unknown Folktale'}
                    className="thumbnail"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                    }}
                  />
                </div>
                <div className="bookmark-details">
                  <h3 className="bookmark-title">
                    {bookmark.folktaleId.title || 'Unknown Title'}
                  </h3>
                  <div className="meta-container">
                    <p className="bookmark-meta">
                      <strong>Region:</strong> {bookmark.folktaleId.region || 'Unknown'}
                    </p>
                    <p className="bookmark-meta">
                      <strong>Genre:</strong> {bookmark.folktaleId.genre || 'Unknown'}
                    </p>
                    <p className="bookmark-meta">
                      <strong>Age Group:</strong> {bookmark.folktaleId.ageGroup || 'Unknown'}
                    </p>
                  </div>
                 <button
  onClick={(e) => handleRemoveBookmark(bookmark.folktaleId._id, e)}
  className="remove-button"
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

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  :root {
    --primary-color: #2c3e50;
    --accent-color: #e67e22;
    --background-color: #f8f9fa;
    --card-background: #ffffff;
    --text-color: #333333;
    --secondary-text: #666666;
    --error-color: #e74c3c;
    --border-radius: 12px;
    --shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    --transition: all 0.3s ease;
  }

  .container {
    max-width: 90%;
    margin: 0 auto;
    padding: 2rem 1rem;
    font-family: 'Inter', sans-serif;
    color: var(--text-color);
    min-height: calc(100vh - 100px);
    background-color: var(--background-color);
  }

  .title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 5vw, 2.5rem);
    color: var(--primary-color);
    text-align: center;
    margin-bottom: 2rem;
    border-bottom: 2px solid var(--accent-color);
    padding-bottom: 0.75rem;
  }

  .no-bookmarks-container {
    text-align: center;
    padding: 2.5rem;
    background-color: var(--card-background);
    border-radius: var(--border-radius);
    margin: 2rem 0;
    box-shadow: var(--shadow);
  }

  .no-bookmarks {
    font-size: 1.1rem;
    color: var(--secondary-text);
    margin-bottom: 1.5rem;
  }

  .bookmark-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 1rem;
  }

  .bookmark-card {
    display: flex;
    background-color: var(--card-background);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow);
    transition: var(--transition);
    cursor: pointer;
  }

  .bookmark-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  .bookmark-card:focus {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
  }

  .thumbnail-container {
    flex-shrink: 0;
    width: 140px;
    height: 140px;
    overflow: hidden;
  }

  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: var(--transition);
  }

  .bookmark-card:hover .thumbnail {
    transform: scale(1.05);
  }

  .bookmark-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1rem;
  }

  .bookmark-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.25rem;
    color: var(--primary-color);
    margin: 0 0 0.5rem 0;
    transition: color 0.2s ease;
  }

  .bookmark-card:hover .bookmark-title {
    color: var(--accent-color);
  }

 

  .bookmark-meta {
    font-size: 0.9rem;
    color: var(--secondary-text);
    background-color: #ecf0f1;
    padding: 0.3rem 0.8rem;
    border-radius: 1rem;
  }

 .remove-button {
  background: none;
  border: none;
  color: #e3342f; /* red */
  cursor: pointer;
  font-size: 1.2rem;
}


  .remove-button:focus {
    outline: 2px solid var(--error-color);
    outline-offset: 2px;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
  }

  .spinner {
    border: 5px solid #f3f3f3;
    border-top: 5px solid var(--primary-color);
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-text {
    font-size: 1.1rem;
    color: var(--primary-color);
    font-family: 'Inter', sans-serif;
  }

  .error {
    text-align: center;
    padding: 3rem;
    font-size: 1.1rem;
    color: var(--error-color);
    background-color: #fff3cd;
    border-radius: var(--border-radius);
    max-width: 600px;
    margin: 2rem auto;
  }

  .link {
    color: var(--primary-color);
    text-decoration: underline;
    cursor: pointer;
    font-weight: 600;
    transition: color 0.2s ease;
  }

  .link:hover {
    color: var(--accent-color);
  }

  .explore-button {
    background-color: var(--primary-color);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: var(--transition);
    font-family: 'Inter', sans-serif;
  }

  .explore-button:hover {
    background-color: var(--accent-color);
    transform: translateY(-2px);
  }

  .explore-button:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .bookmark-list {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .bookmark-card {
      flex-direction: column;
    }

    .thumbnail-container {
      width: 100%;
      height: 200px;
    }
  }

  @media (max-width: 480px) {
    .container {
      padding: 1rem;
    }

    .title {
      font-size: 1.8rem;
    }

    .bookmark-title {
      font-size: 1.1rem;
    }

    .bookmark-meta {
      font-size: 0.85rem;
    }

    .remove-button, .explore-button {
      width: 100%;
      padding: 0.6rem;
    }
  }
`;
document.head.appendChild(styleSheet);

export default BookmarkedFolktale;
