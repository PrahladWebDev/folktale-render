import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CommentSection({ folktaleId, closeModal }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [alert, setAlert] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
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
      // Only include parentCommentId if replyTo exists
      const commentData = { content };
      if (replyTo?._id) {
        commentData.parentCommentId = replyTo._id;
      }

      const response = await axios.post(
        `/api/folktales/${folktaleId}/comments`,
        commentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([...comments, response.data]);
      setContent('');
      setReplyTo(null);
      setAlert({ type: 'success', message: 'Comment posted successfully!' });
    } catch (error) {
      console.error('Error posting comment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to post comment. Please try again.';
      setAlert({ type: 'error', message: errorMessage });
    }
  };

  const handleReply = (comment) => {
    if (!token) {
      setAlert({ type: 'warning', message: 'Please log in to reply to a comment.' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    setReplyTo(comment);
    setContent(`@${comment.userId.username} `);
  };

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <div className="p-4 font-caveat text-gray-800">
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

      <div className="mb-8 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-50">
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
              <button
                onClick={() => handleReply(comment)}
                className="text-sm text-amber-600 hover:text-amber-700 mt-2"
              >
                Reply
              </button>
              {comment.replies?.length > 0 && (
                <div className="ml-4 mt-2 border-l-2 border-amber-200 pl-4">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply._id}
                      className="bg-amber-50 rounded-md p-3 mb-2 shadow-sm border border-amber-100"
                    >
                      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                        <span className="font-bold text-amber-800">{reply.userId.username}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(reply.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 italic p-5 animate-shake">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>

      {token ? (
        <div className="sticky bottom-0 bg-white p-4 border-t-2 border-amber-200">
          {replyTo && (
            <div className="flex items-center mb-2 text-sm text-gray-600">
              <span>Replying to {replyTo.userId.username}</span>
              <button
                onClick={() => setReplyTo(null)}
                className="ml-2 text-amber-600 hover:text-amber-700"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={replyTo ? 'Write your reply...' : 'Share your thoughts about this legend...'}
              className="w-full min-h-[50px] p-3 rounded-md border-2 border-gray-200 bg-amber-50 text-gray-800 text-lg resize-y focus:outline-none focus:border-amber-300 transition-colors duration-300"
            />
            <button
              onClick={handleComment}
              disabled={!content.trim()}
              className={`px-4 py-2 rounded-md text-lg font-bold text-white transition-all duration-300 ${
                content.trim()
                  ? 'bg-amber-900 hover:bg-amber-800 hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Post
            </button>
          </div>
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
                closeModal();
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
