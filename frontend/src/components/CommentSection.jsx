import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CommentSection({ folktaleId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [alert, setAlert] = useState(null); // State for alert message
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/folktales/${folktaleId}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setAlert({ type: 'error', message: 'Failed to load comments. Please try again.' });
      }
    };
    fetchComments();
  }, [folktaleId]);

  const handleComment = async () => {
    if (!token) {
      setAlert({ type: 'warning', message: 'Please log in to post a comment.' });
      setTimeout(() => navigate('/login'), 2000); // Navigate after showing alert
      return;
    }

    if (!content.trim()) {
      setAlert({ type: 'warning', message: 'Comment cannot be empty.' });
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/folktales/${folktaleId}/comments`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([...comments, response.data]);
      setContent('');
      setAlert({ type: 'success', message: 'Comment posted successfully!' });
    } catch (error) {
      console.error('Error posting comment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to post comment. Please try again.';
      setAlert({ type: 'error', message: errorMessage });
    }
  };

  // Clear alert after 3 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <div style={styles.container}>
      {alert && (
        <div style={{
          ...styles.alert,
          backgroundColor: alert.type === 'success' ? '#d4edda' : '#f8d7da',
          color: alert.type === 'success' ? '#155724' : '#721c24',
          borderColor: alert.type === 'success' ? '#c3e6cb' : '#f5c6cb',
        }}>
          {alert.message}
        </div>
      )}

      <h3 style={styles.title}>Comments ({comments.length})</h3>
      
      <div style={styles.commentsList}>
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} style={styles.comment}>
              <div style={styles.commentHeader}>
                <span style={styles.commentAuthor}>{comment.userId.username}</span>
                <span style={styles.commentDate}>
                  {new Date(comment.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p style={styles.commentContent}>{comment.content}</p>
            </div>
          ))
        ) : (
          <p style={styles.noComments}>No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>

      {token ? (
        <div style={styles.commentForm}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about this folktale..."
            style={styles.textarea}
          />
          <button 
            onClick={handleComment}
            style={{
              ...styles.submitButton,
              ...(content.trim() ? {} : styles.submitButtonDisabled)
            }}
            disabled={!content.trim()}
          >
            Post Comment
          </button>
        </div>
      ) : (
        <div style={styles.loginPrompt}>
          <p style={styles.loginText}>
            Please{' '}
            <a 
              href="/login" 
              style={styles.loginLink}
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              log in
            </a>{' '}
            to comment.
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginTop: '40px',
    padding: '25px',
    backgroundColor: '#f9f5e9',
    borderRadius: '8px',
    border: '1px solid #e0c9a6'
  },
  alert: {
    padding: '10px 15px',
    marginBottom: '20px',
    borderRadius: '4px',
    border: '1px solid',
    fontSize: '1rem',
    textAlign: 'center',
    fontFamily: "'Merriweather', serif"
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.5rem',
    color: '#5c3c10',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #e0c9a6'
  },
  commentsList: {
    marginBottom: '30px',
    maxHeight: '500px',
    overflowY: 'auto',
    paddingRight: '10px'
  },
  comment: {
    backgroundColor: '#fff',
    borderRadius: '6px',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap'
  },
  commentAuthor: {
    fontWeight: '600',
    color: '#5c3c10'
  },
  commentDate: {
    fontSize: '0.85rem',
    color: '#777'
  },
  commentContent: {
    margin: '0',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap'
  },
  noComments: {
    textAlign: 'center',
    color: '#777',
    fontStyle: 'italic',
    padding: '20px'
  },
  commentForm: {
    marginTop: '20px'
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontFamily: "'Merriweather', serif",
    fontSize: '1rem',
    marginBottom: '10px',
    resize: 'vertical'
  },
  submitButton: {
    backgroundColor: '#5c3c10',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  loginPrompt: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '6px'
  },
  loginText: {
    margin: '0',
    color: '#555'
  },
  loginLink: {
    color: '#d4a017',
    fontWeight: '600',
    textDecoration: 'none'
  }
};

export default CommentSection;