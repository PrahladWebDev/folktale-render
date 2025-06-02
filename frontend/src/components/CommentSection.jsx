import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CommentSection({ folktaleId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        if (!folktaleId) {
          toast.error('Invalid folktale ID');
          return;
        }

        const response = await axios.get(`/api/folktales/${folktaleId}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setComments(response.data.data || []);
      } catch (error) {
        console.error('Error fetching comments:', error);
        const errorMessage = handleError(error);
        toast.error(errorMessage);
      }
    };
    fetchComments();
  }, [folktaleId, token]);

  const handleError = (error) => {
    const errorData = error.response?.data;
    const errorCode = errorData?.error;
    const message = errorData?.message || 'An unexpected error occurred';

    switch (errorCode) {
      case 'invalid_id':
        return 'Invalid folktale ID format';
      case 'not_found':
        return 'Folktale not found';
      case 'server_error':
        return 'Failed to load comments due to a server issue. Please try again later.';
      default:
        return message;
    }
  };

  const handleComment = async () => {
    if (!token) {
      toast.warn('Please log in to post a comment.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!content.trim()) {
      toast.warn('Comment cannot be empty.');
      return;
    }

    try {
      const response = await axios.post(
        `/api/folktales/${folktaleId}/comments`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments([...comments, response.data.data]);
      setContent('');
      toast.success('Comment posted successfully!');
    } catch (error) {
      console.error('Error posting comment:', error);
      const errorData = error.response?.data;
      const errorCode = errorData?.error;
      let errorMessage = errorData?.message || 'Failed to post comment';

      switch (errorCode) {
        case 'validation_error':
          errorMessage = errorData.details?.map(err => err.msg).join(', ') || 'Invalid comment data';
          break;
        case 'invalid_id':
          errorMessage = 'Invalid folktale ID format';
          break;
        case 'not_found':
          errorMessage = 'Folktale not found';
          break;
        case 'already_commented':
          errorMessage = 'You have already commented on this folktale';
          break;
        case 'auth_required':
          errorMessage = 'Authentication required. Please log in again.';
          setTimeout(() => navigate('/login'), 2000);
          break;
        case 'invalid_token':
        case 'token_expired':
          errorMessage = 'Your session has expired. Please log in again.';
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 2000);
          break;
        case 'server_error':
          errorMessage = 'Failed to post comment due to a server issue. Please try again later.';
          break;
      }
      toast.error(errorMessage);
    }
  };

  return (
    <div className="mt-10 p-6 bg-amber-50 rounded-lg border border-amber-200">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <h3 className="text-2xl font-serif text-amber-900 mb-5 pb-2 border-b-2 border-amber-200">
        Comments ({comments.length})
      </h3>
      <div className="max-h-[500px] overflow-y-auto pr-2 mb-8">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="bg-white rounded-md p-4 mb-4 shadow-sm"
            >
              <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                <span className="font-semibold text-amber-900">
                  {comment.userId?.username || 'Anonymous'}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.timestamp).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 italic py-5">
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
            className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 font-serif text-base resize-y focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={handleComment}
            disabled={!content.trim()}
            className={`mt-2 px-4 py-2 rounded-md text-white font-medium transition-colors duration-300 ${
              content.trim()
                ? 'bg-amber-900 hover:bg-amber-800'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Post Comment
          </button>
        </div>
      ) : (
        <div className="text-center p-4 bg-white rounded-md">
          <p className="text-gray-600">
            Please{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-amber-600 font-semibold hover:underline"
            >
              log in
            </button>{' '}
            to comment.
          </p>
        </div>
      )}
    </div>
  );
}

export default CommentSection;
