import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Heart, Loader2, MessageCircle, Reply, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Select } from './ui/Select';

const API = import.meta.env.VITE_API_URL || '';
const MAX_COMMENT_LENGTH = 500;

function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function countComments(comments) {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies || []), 0);
}

function CommentItem({
  comment,
  depth = 0,
  user,
  replyContent,
  replying,
  replyingTo,
  busyLikeId,
  deletingId,
  onDelete,
  onLike,
  onReplyCancel,
  onReplyChange,
  onReplyStart,
  onReplySubmit,
}) {
  const isReplying = replyingTo === comment.id;
  const replies = comment.replies || [];

  return (
    <article className={`${depth > 0 ? 'ml-4 sm:ml-8 pl-4 sm:pl-6 border-l border-slate-200' : ''}`}>
      <div className="py-6">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm shrink-0">
            {getInitials(comment.author)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900">{comment.author}</p>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">{formatDate(comment.created_at)}</p>
              </div>
              {comment.can_delete && (
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="h-9 w-9 rounded-full border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center shrink-0 disabled:opacity-50"
                  aria-label="Delete comment"
                >
                  {deletingId === comment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              )}
            </div>

            <p className="mt-3 text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onLike(comment)}
                disabled={busyLikeId === comment.id}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
                  comment.liked_by_current_user
                    ? 'border-brand-light bg-brand-light text-brand'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-brand-light hover:text-brand'
                }`}
              >
                {busyLikeId === comment.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Heart className={`h-3.5 w-3.5 ${comment.liked_by_current_user ? 'fill-current' : ''}`} />
                )}
                {comment.like_count}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => onReplyStart(comment.id)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </button>
              )}
            </div>

            {isReplying && (
              <form onSubmit={(e) => onReplySubmit(e, comment.id)} className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => onReplyChange(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                  rows={3}
                  placeholder={`Reply to ${comment.author}...`}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand-light"
                />
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-400">
                    {replyContent.length}/{MAX_COMMENT_LENGTH}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={onReplyCancel}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={!replyContent.trim() || replying}>
                      {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Reply
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="pb-1">
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              user={user}
              replyContent={replyContent}
              replying={replying}
              replyingTo={replyingTo}
              busyLikeId={busyLikeId}
              deletingId={deletingId}
              onDelete={onDelete}
              onLike={onLike}
              onReplyCancel={onReplyCancel}
              onReplyChange={onReplyChange}
              onReplyStart={onReplyStart}
              onReplySubmit={onReplySubmit}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export default function CommentsSection({ votingId }) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [sortBy, setSortBy] = useState('oldest');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [busyLikeId, setBusyLikeId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const totalComments = countComments(comments);

  const fetchComments = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/api/votings/${votingId}/comments?sort=${sortBy}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load comments.');
      setComments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [votingId, token, sortBy]);

  const postComment = async (text, parentId = null) => {
    const payload = { content: text };
    if (parentId) payload.parent_id = parentId;

    const res = await fetch(`${API}/api/votings/${votingId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to post comment.');
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || posting) return;

    setPosting(true);
    setError('');
    try {
      await postComment(trimmed);
      setContent('');
      await fetchComments();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    const trimmed = replyContent.trim();
    if (!trimmed || replying) return;

    setReplying(true);
    setError('');
    try {
      await postComment(trimmed, parentId);
      setReplyContent('');
      setReplyingTo(null);
      await fetchComments();
    } catch (err) {
      setError(err.message);
    } finally {
      setReplying(false);
    }
  };

  const handleLike = async (comment) => {
    if (!user) {
      setError('Sign in to like comments.');
      return;
    }

    setBusyLikeId(comment.id);
    setError('');
    try {
      const res = await fetch(`${API}/api/comments/${comment.id}/like`, {
        method: comment.liked_by_current_user ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update like.');
      await fetchComments();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyLikeId(null);
    }
  };

  const handleDelete = async (commentId) => {
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) return;

    setDeletingId(commentId);
    setError('');
    try {
      const res = await fetch(`${API}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete comment.');
      await fetchComments();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReplyStart = (commentId) => {
    setReplyingTo(commentId);
    setReplyContent('');
    setError('');
  };

  const handleReplyCancel = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  return (
    <section className="mt-12 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-8 md:p-10 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-brand-light text-brand flex items-center justify-center">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Discussion</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {totalComments} {totalComments === 1 ? 'comment' : 'comments'}
              </p>
            </div>
          </div>

          <div className="w-full md:w-52">
            <label htmlFor="comment-sort" className="sr-only">Sort comments</label>
            <Select
              id="comment-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-12 rounded-full py-0 pl-5 pr-11 text-sm font-semibold leading-normal"
            >
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
              <option value="best">Best comments</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-8 md:p-10">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 border border-red-100 flex items-center gap-3 font-medium">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {user ? (
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-4">
              <div className="hidden sm:flex h-11 w-11 rounded-full bg-slate-100 text-slate-500 items-center justify-center font-bold text-sm shrink-0">
                {getInitials(user.full_name)}
              </div>
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                  rows={4}
                  placeholder="Add your perspective..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand-light"
                />
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-400">
                    {content.length}/{MAX_COMMENT_LENGTH}
                  </p>
                  <Button type="submit" size="sm" disabled={!content.trim() || posting}>
                    {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-600">Sign in to join the discussion.</p>
            <Link to="/login" className="text-sm font-bold text-brand hover:underline">
              Sign in
            </Link>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-7 w-7 text-brand animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-14 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-50">
            <MessageCircle className="h-8 w-8 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No comments yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                user={user}
                replyContent={replyContent}
                replying={replying}
                replyingTo={replyingTo}
                busyLikeId={busyLikeId}
                deletingId={deletingId}
                onDelete={handleDelete}
                onLike={handleLike}
                onReplyCancel={handleReplyCancel}
                onReplyChange={setReplyContent}
                onReplyStart={handleReplyStart}
                onReplySubmit={handleReplySubmit}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
