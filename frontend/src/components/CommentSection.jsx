import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CommentSection({ folktaleId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`/api/folktales/${folktaleId}/comments`);
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
      setTimeout(() => navigate('/login'), 2000);
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

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <div className="mt-10 p-6 bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg border-2 border-amber-300 shadow-lg font-caveat text-gray-800">
      {alert && (
        <div
          className={`p-3 mb-5 rounded-md text-center text-lg animate-shake ${
            alert.type === 'success'
              ? 'bg-green-100 text-green-800 border-green-300'
              : 'bg-red-100 text-red-800 border-red-300'
          } border-2`}
        >
          {alert.message}
        </div>
      )}

      <h3 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-5 pb-3 border-b-4 border-amber-300 text-center animate-pulseSketchy">
        Comments ({comments.length})
      </h3>

      <div className="mb-8 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="bg-white rounded-md p-4 mb-4 shadow-sm border-2 border-amber-200 animate-fadeIn"
            >
              <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                <span className="font-bold text-amber-900">{comment.userId.username}</span>
                <span className="text-sm text-gray-600">
                  {new Date(comment.timestamp).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="m-0 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 italic p-5 animate-shake">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>

      {token ? (
        <div className="mt-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about this folktale..."
            className="w-full min-h-[100px] p-3 rounded-md border-2 border-gray-200 bg-amber-50 text-gray-800 text-lg resize-y focus:outline-none focus:border-amber-300 transition-colors duration-300"
          />
          <button
            onClick={handleComment}
            disabled={!content.trim()}
            className={`mt-3 px-5 py-2 rounded-md text-lg font-bold text-white transition-all duration-300 ${
              content.trim()
                ? 'bg-amber-900 hover:bg-amber-800 hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Post Comment
          </button>
        </div>
      ) : (
        <div className="text-center p-4 bg-white rounded-md shadow-sm border-2 border-amber-200">
          <p className="m-0 text-gray-600 text-lg">
            Please{' '}
            <a
              href="/login"
              className="text-amber-600 font-bold no-underline hover:text-amber-700 transition-colors duration-300"
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

export default CommentSection;
