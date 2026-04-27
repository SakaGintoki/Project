import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ChevronLeft, Check, AlertCircle, Users, Trash2, Pencil, Share2, Copy, X, CheckCircle2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

export default function VotingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [voting, setVoting] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API}/api/votings/${id}`, { headers })
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.json(); })
      .then(data => { setVoting(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, token]);

  const isEnded = voting && voting.end_date && new Date(voting.end_date) < new Date();

  const toggleOption = (optionId) => {
    if (isEnded) return;
    if (voting.is_multiple_choice) {
      setSelected(prev =>
        prev.includes(optionId) ? prev.filter(x => x !== optionId) : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (selected.length === 0) { setError('Please select an option.'); return; }

    try {
      const res = await fetch(`${API}/api/vote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ voting_id: id, options: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Vote failed');
      navigate(`/results/${id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/api/votings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      navigate('/');
    } catch (err) {
      setError(err.message);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-40">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-brand rounded-full animate-spin"></div>
    </div>
  );

  if (!voting) return (
    <div className="max-w-4xl mx-auto py-28 px-6 text-center">
      <div className="py-20 px-8 bg-white rounded-[2rem] border border-dashed border-slate-300">
        <p className="text-lg text-slate-500 font-semibold">Poll not found.</p>
        <Link to="/" className="text-brand hover:underline mt-4 inline-block font-semibold">Return home</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-28 px-6">
      <div className="flex items-center justify-between mb-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold text-sm transition-colors group">
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          {/* Owner actions moved below */}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="p-4 mb-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between gap-4">
          <p className="text-sm text-red-700 font-medium">Are you sure you want to delete this poll? This action cannot be undone.</p>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      )}

      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="hero">{voting.category}</Badge>
                {isEnded && <Badge variant="ended">Voting Closed</Badge>}
                {voting.is_anonymous === false && <Badge variant="outline" className="text-blue-500 border-blue-200">Public Voters</Badge>}
                {voting.is_multiple_choice && <Badge variant="outline" className="text-[10px]">Multiple Choice</Badge>}
              </div>

              <div className="flex-grow text-right">
                <div className="inline-flex items-center gap-1.5 text-slate-400 font-medium text-sm">
                  <Users className="h-4 w-4" />
                  <span>{voting.total_votes || 0} votes cast</span>
                </div>
              </div>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">{voting.title}</h1>
            {voting.author && <p className="text-base font-semibold text-slate-500 mt-5 mb-1">Created by {voting.author}</p>}
          </div>
          <div className="flex gap-3 shrink-0">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }} 
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
            {voting.is_owner && (
              <>
                <Link to={`/edit/${voting.id}`} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95 shadow-sm">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-red-500 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 shadow-sm">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>


      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {voting.image_url && (
          <div className="w-full h-64 md:h-80 overflow-hidden border-b border-slate-100">
            <img src={voting.image_url} alt={voting.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-8 md:p-12">
          {voting.description && <p className="text-base text-slate-600 mb-10 leading-relaxed">{voting.description}</p>}

          <div className="space-y-6">
            <p className="font-semibold text-slate-900 text-lg">
              {voting.is_multiple_choice ? 'Select one or more options:' : 'Select one option:'}
            </p>

            <div className="flex flex-col gap-4">
              {voting.options.map(option => {
                const isSelected = selected.includes(option.id);
                return (
                  <label key={option.id}
                    className={`flex items-center gap-5 p-5 border-2 rounded-xl transition-all duration-300 bg-white ${
                      isSelected
                        ? 'border-brand bg-brand-light ring-4 ring-brand-light'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    } ${isEnded ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleOption(option.id);
                    }}>
                    <input type={voting.is_multiple_choice ? 'checkbox' : 'radio'}
                      name="vote-option" value={option.id}
                      checked={isSelected} readOnly disabled={isEnded} className="hidden" />

                    <div className={`w-6 h-6 border-2 flex items-center justify-center transition-all duration-300 ${
                      voting.is_multiple_choice ? 'rounded-md' : 'rounded-full'
                    } ${
                      isSelected ? 'bg-brand border-brand text-white scale-110' : 'border-slate-300 bg-transparent'
                    }`}>
                      <Check className={`h-3.5 w-3.5 transition-all duration-300 ${isSelected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={4} />
                    </div>

                    <span className={`text-base font-medium transition-colors ${isSelected ? 'text-brand' : 'text-slate-900'}`}>{option.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-6">
            <Link to={`/results/${voting.id}`} className="text-sm font-semibold text-slate-400 hover:text-brand transition-colors order-2 sm:order-1">
              View Live Results
            </Link>
            <Button type="submit" disabled={isEnded} className="w-full sm:w-auto min-w-[200px] order-1 sm:order-2">
              {isEnded ? 'Voting Closed' : 'Cast Your Vote'}
            </Button>
          </div>
        </div>
        {error && (
          <div className="p-4 mx-8 mb-8 rounded-xl bg-red-50 text-red-800 border border-red-100 flex items-center gap-3 font-medium">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}
      </form>

    </div>
  );
}
