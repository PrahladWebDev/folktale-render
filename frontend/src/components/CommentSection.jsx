import { useState, useEffect, useRef, forwardRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CommentSection = forwardRef(({ folktaleId, onCommentPosted }, ref) => {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const commentListRef = useRef(null);
  const commentInputRef = useRef(null);

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
        if (error.code === 'ERR_NETWORK') {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error(error.response?.data?.message || 'Failed to load comments. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [folktaleId]);

  const handleComment = async (parentId) => {
    if (!token) {
      toast.warning('Please log in to post a comment.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!content.trim()) {
      toast.warning('Comment cannot be empty.');
      return;
    }

    if (content.length > 500) {
      toast.warning('Comment must be 500 characters or less.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    // Include @username in optimistic comment if replying
    const displayContent = replyingTo ? `@${replyingTo.username} ${content}` : content;
    const optimisticComment = {
      _id: tempId,
      folktaleId,
      userId: { username: 'You' },
      content: displayContent,
      timestamp: new Date(),
      replies: [],
      parentId,
    };

    // Optimistic update
    setComments((prevComments) => {
      if (parentId) {
        return prevComments.map((comment) =>
          comment._id === parentId
            ? { ...comment, replies: [...(comment.replies || []), optimisticComment] }
            : comment
        );
      }
      return [...prevComments, optimisticComment];
    });
    setContent('');
    setReplyingTo(null);

    // Scroll to the new comment
    setTimeout(() => {
      const newComment = commentListRef.current?.querySelector(`[data-comment-id="${tempId}"]`);
      if (newComment) {
        newComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    try {
      setIsSubmitting(true);
      const requestBody = { content: displayContent };
      if (parentId) {
        requestBody.parentId = parentId;
      }
      const response = await axios.post(
        `/api/folktales/${folktaleId}/comments`,
        requestBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid comment response');
      }

      // Replace optimistic comment with server response
      setComments((prevComments) => {
        if (parentId) {
          return prevComments.map((comment) =>
            comment._id === parentId
              ? {
                  ...comment,
                  replies: [
                    ...(comment.replies || []).filter((c) => c._id !== tempId),
                    response.data,
                  ],
                }
              : comment
          );
        }
        return [...prevComments.filter((c) => c._id !== tempId), response.data];
      });

      toast.success('Comment posted successfully!');
      onCommentPosted();
    } catch (error) {
      console.error('Error posting comment:', error);
      // Rollback optimistic update
      setComments((prevComments) => {
        if (parentId) {
          return prevComments.map((comment) =>
            comment._id === parentId
              ? { ...comment, replies: (comment.replies || []).filter((c) => c._id !== tempId) }
              : comment
          );
        }
        return prevComments.filter((c) => c._id !== tempId);
      });

      if (error.response?.status === 401) {
        toast.warning('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response?.status === 429) {
        toast.error('You are posting too quickly. Please try again later.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to post comment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId, username) => {
    if (!token) {
      toast.warning('Please log in to reply to a comment.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    if (!username) {
      console.warn('No username provided for reply, defaulting to "Anonymous"');
      username = 'Anonymous';
    }
    console.log('Handling reply:', { commentId, username }); // Debug log
    setReplyingTo({ commentId, username });
    setContent('');
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-orange-100 rounded-b-2xl font-caveat text-gray-800">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar closeOnClick pauseOnHover theme="light" />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-md p-4 shadow-sm border-2 border-amber-200 animate-pulse">
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={commentListRef}
          className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-100"
        >
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment._id} data-comment-id={comment._id} className="mb-4 animate-fade-in">
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
                    aria-label={`Reply to ${comment.userId?.username || 'comment'}`}
                  >
                    Reply
                  </button>
                </div>
                {comment.replies?.length > 0 && (
                  <div className="ml-4 sm:ml-6 mt-2 border-l-2 border-amber-300 pl-4">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply._id}
                        data-comment-id={reply._id}
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
      )}

      {token ? (
        <div className="mt-5 sticky bottom-0 bg-gradient-to-br from-amber-50 to-orange-100 p-4 border-t-2 border-amber-200">
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm text-amber-900 bg-amber-200 px-2 py-1 rounded-md">
                Replying to @{replyingTo.username}
              </span>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setContent('');
                }}
                className="text-amber-600 hover:text-amber-800 text-sm font-semibold"
                aria-label="Cancel reply"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            {replyingTo && (
              <span className="text-lg text-amber-900 font-semibold bg-amber-100 px-2 py-3 rounded-md">
                @{replyingTo.username}
              </span>
            )}
            <textarea
              ref={commentInputRef}
              id="comment-input"
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setContent(e.target.value);
                } else {
                  toast.warning('Comment cannot exceed 500 characters.');
                }
              }}
              placeholder={replyingTo ? 'Write your reply...' : 'Share your thoughts about this folktale...'}
              className="flex-1 min-h-[60px] max-h-[120px] p-3 rounded-md border-2 border-gray-200 bg-amber-50 text-gray-800 text-lg resize-y focus:outline-none focus:border-amber-300 transition-colors duration-300"
              aria-label={replyingTo ? 'Reply input' : 'Comment input'}
            />
            <button
              onClick={() => handleComment(replyingTo?.commentId)}
              disabled={!content.trim() || isSubmitting}
              className={`px-4 py-2 rounded-md text-lg font-bold text-white transition-all duration-300 ${
                content.trim() && !isSubmitting
                  ? 'bg-amber-900 hover:bg-amber-800 hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
              aria-label="Post comment"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{content.length}/500</p>
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
});

export default CommentSection;
