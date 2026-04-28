import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Trophy, RefreshCw, Users, Share2, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [voting, setVoting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchResults = () => {
    setLoading(true);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API}/api/results/${id}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch results');
        return res.json();
      })
      .then(data => {
        if (data.options) {
          data.options.sort((a, b) => b.vote_count - a.vote_count);
        }
        setVoting(data);
        setLoading(false);
        setAnimated(false);
        setTimeout(() => setAnimated(true), 100);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => { fetchResults(); }, [id, token]);

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

  const hasVotes = voting.total_votes > 0;
  const isTie = hasVotes && voting.options.length > 1 && voting.options[0].vote_count === voting.options[1].vote_count;
  const winnerId = (!isTie && hasVotes) ? voting.options[0].id : null;

  if (voting.is_anonymous && !voting.is_owner) {
    return (
      <div className="max-w-4xl mx-auto py-28 px-6 text-center">
        <div className="py-20 px-8 bg-white rounded-[2rem] border border-dashed border-slate-300 flex flex-col items-center">
          <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">Access Denied</h2>
          <p className="text-lg text-slate-500 font-medium mb-8 max-w-md">This is an anonymous poll. The live results are hidden from the public and can only be viewed by the poll creator.</p>
          <Link to={`/votings/${id}`}>
            <Button>Return to Poll</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-28 px-6">
      <div className="flex items-center justify-between mb-8">
        <Link to={`/votings/${voting.id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold text-sm transition-colors group">
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Poll
        </Link>
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
                <Badge variant="outline" className="text-[10px]">Live Results</Badge>
                {voting.is_anonymous === false && <Badge variant="outline" className="text-blue-500 border-blue-200">Public Voters</Badge>}
              </div>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 leading-tight">{voting.title}</h1>
            {voting.author && <p className="text-base font-semibold text-slate-500 mt-5 mb-1">Created by {voting.author}</p>}
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0 border-t border-slate-100 md:border-0 pt-4 md:pt-0">
            <div className="inline-flex items-center gap-1.5 text-slate-400 font-medium text-sm">
              <Users className="h-4 w-4" />
              <span>{voting.total_votes} votes cast</span>
            </div>
            <div className="flex flex-wrap justify-end gap-2 sm:gap-3 w-full">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Share'}
              </button>
              {voting.is_owner && (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-red-500 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 shadow-sm">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {voting.image_url && (
          <div className="w-full h-48 md:h-64 overflow-hidden border-b border-slate-100 opacity-80 grayscale-[30%]">
            <img src={voting.image_url} alt={voting.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-8 md:p-16">
          <div className="flex flex-col gap-10">
            {voting.options.map((option, index) => {
              const isWinner = option.id === winnerId;
              return (
                <div key={option.id} className={`flex flex-col gap-3 p-4 rounded-2xl transition-all duration-500 ${isWinner ? 'bg-brand-light/30 ring-1 ring-brand-light' : ''}`}>
                  <div className="flex justify-between items-end">
                    <span className={`flex items-center gap-3 text-lg font-semibold ${isWinner ? 'text-brand' : 'text-slate-900'}`}>
                      {option.text}
                      {isWinner && (
                        <div className="p-1.5 bg-yellow-100 rounded-full animate-bounce">
                          <Trophy className="text-yellow-600 h-4 w-4" />
                        </div>
                      )}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-bold ${isWinner ? 'text-brand' : 'text-slate-900'}`}>
                        {option.percentage}%
                      </span>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        ({option.vote_count} votes)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-[1500ms] ${
                        isWinner ? 'bg-brand shadow-[0_0_10px_rgba(100,100,255,0.5)]' : 'bg-slate-300'
                      }`}
                      style={{ width: animated ? `${option.percentage}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Results update in real-time</p>
            <button className="group inline-flex items-center gap-3 bg-white border border-slate-200 text-slate-600 px-8 py-3 rounded-full text-sm font-semibold hover:bg-slate-50 hover:text-brand hover:border-brand-light transition-all active:scale-95" onClick={fetchResults}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-8 p-4 rounded-xl bg-red-50 text-red-800 border border-red-100 flex items-center gap-3 font-medium">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Voter Activity (Public Polls Only) */}
      {voting.voters && voting.voters.length > 0 && (
        <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Voter Activity</h2>
            <p className="text-slate-500 text-sm mt-1">Detailed breakdown of public participants and their choices.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voting.voters.map((voter, i) => (
              <div key={i} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                      {voter.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{voter.name}</p>
                      {voter.email && <p className="text-xs text-slate-400">{voter.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Clock className="h-3 w-3" />
                    {new Date(voter.time).toLocaleDateString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Voted for:</p>
                  <div className="flex flex-wrap gap-2">
                    {voter.choices.map((choice, ci) => (
                      <span key={ci} className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-light text-brand rounded-full text-xs font-bold">
                        <CheckCircle2 className="h-3 w-3" />
                        {choice}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
