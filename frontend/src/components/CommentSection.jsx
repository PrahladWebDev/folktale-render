import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CommentSection({ folktaleId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/folktales/${folktaleId}/comments`);
        if (!Array.isArray(response.data)) {
          throw new Error('Unexpected comments response format');
        }
        setComments(response.data);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error(error.response?.data?.message || 'Failed to load comments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [folktaleId]);

  const handleComment = async (parentId = null) => {
    if (!token) {
      toast.warning('Please log in to post a comment.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!content.trim()) {
      toast.warning('Comment cannot be empty.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(
        `/api/folktales/${folktaleId}/comments`,
        { content, parentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid comment response');
      }
      setComments((prevComments) => {
        if (parentId) {
          return prevComments.map((comment) =>
            comment._id === parentId
              ? { ...comment, replies: [...(comment.replies || []), response.data] }
              : comment
          );
        }
        return [...prevComments, response.data];
      });
      setContent('');
      setReplyingTo(null);
      toast.success('Comment posted successfully!');
    } catch (error) {
      console.error('Error posting comment:', error);
      if (error.response?.status === 401) {
        toast.warning('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Failed to post comment.');
      } else {
        toast.error('Failed to post comment. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = (commentId, username) => {
    if (!token) {
      toast.warning('Please log in to reply to comments.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    setReplyingTo({ commentId, username });
    setContent(`@${username} `);
    document.getElementById('comment-input')?.focus();
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-orange-100 rounded-b-2xl font-caveat text-gray-800">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar closeOnClick pauseOnHover theme="light" />

      {isLoading && (
        <div className="text-center text-lg text-amber-900 animate-pulse">
          Loading comments...
        </div>
      )}

      <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-100">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className="mb-4 animate-fade-in">
              <div className="bg-white rounded-md p-4 shadow-sm border-2 border-amber-200">
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <span className="font-bold text-amber-900">{comment.userId?.username || 'Anonymous'}</span>
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
                  onClick={() => handleReply(comment._id, comment.userId?.username)}
                  className="mt-2 text-amber-600 text-sm font-semibold hover:text-amber-800 transition-colors duration-200"
                >
                  Reply
                </button>
              </div>
              {comment.replies?.length > 0 && (
                <div className="ml-4 sm:ml-6 mt-2 border-l-2 border-amber-300 pl-4">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply._id}
                      className="bg-white rounded-md p-3 shadow-sm border-2 border-amber-100 mb-2 animate-fade-in"
                    >
                      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                        <span className="font-bold text-amber-900">{reply.userId?.username || 'Anonymous'}</span>
                        <span className="text-sm text-gray-600">
                          {new Date(reply.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="m-0 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
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
        <div className="mt-5 sticky bottom-0 bg-gradient-to-br from-amber-50 to-orange-100 p-4 border-t-2 border-amber-200">
          {replyingTo && (
            <div className="mb-2 text-sm text-amber-900 flex items-center">
              <span>Replying to {replyingTo.username}</span>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setContent('');
                }}
                className="ml-2 text-amber-600 hover:text-amber-800"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              id="comment-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={replyingTo ? 'Write your reply...' : 'Share your thoughts about this folktale...'}
              className="w-full min-h-[60px] max-h-[120px] p-3 rounded-md border-2 border-gray-200 bg-amber-50 text-gray-800 text-lg resize-y focus:outline-none focus:border-amber-300 transition-colors duration-300"
            />
            <button
              onClick={() => handleComment(replyingTo?.commentId)}
              disabled={!content.trim() || isLoading}
              className={`px-4 py-2 rounded-md text-lg font-bold text-white transition-all duration-300 ${
                content.trim() && !isLoading
                  ? 'bg-amber-900 hover:bg-amber-800 hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Posting...' : 'Post'}
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
