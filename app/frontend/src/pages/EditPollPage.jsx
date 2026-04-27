import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ChevronLeft, Plus, X, Image as ImageIcon, CheckCircle2, Calendar, LayoutDashboard, ExternalLink, Save, Copy, Check } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

export default function EditPollPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, loading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [imagePreview, setImagePreview] = useState('');
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [visibility, setVisibility] = useState('public');
  const [endDate, setEndDate] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);

  const dateInputRef = useRef(null);

  const categories = [
    'Politics', 'Education', 'Business', 'Technology',
    'Entertainment', 'Sports', 'Food', 'Lifestyle', 'Gaming', 'Other'
  ];

  useEffect(() => {
    if (!loading && !user) navigate('/login');

    if (id && token) {
      fetch(`${API}/api/votings/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        if (data.user_id !== user.id) {
            navigate('/dashboard');
            return;
        }
        setTitle(data.title);
        setDescription(data.description || '');
        setCategory(data.category);
        setImagePreview(data.image_url);
        setIsMultipleChoice(data.is_multiple_choice);
        setIsAnonymous(data.is_anonymous !== undefined ? data.is_anonymous : true);
        setVisibility(data.visibility);
        setEndDate(data.end_date ? data.end_date.substring(0, 16) : '');
        setOptions(data.options.map(o => o.text));
        setFetching(false);
      })
      .catch(err => {
        setError(err.message);
        setFetching(false);
      });
    }
  }, [id, token, user, loading, navigate]);

  const addOption = () => setOptions([...options, '']);
  const removeOption = (index) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };
  const updateOption = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const filteredOptions = options.filter(o => o.trim() !== '');
    if (filteredOptions.length < 2) {
      setError('Please provide at least 2 options.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/votings/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            title,
            description,
            category,
            is_multiple_choice: isMultipleChoice,
            is_anonymous: isAnonymous,
            visibility,
            end_date: endDate,
            options: filteredOptions
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update poll');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/votings/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (fetching) return (
    <div className="flex justify-center items-center py-64">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-brand rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-28 px-6">
      <Link to={`/votings/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-sm mb-8 transition-colors group">
        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Poll
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Edit Poll</h1>
        <p className="text-lg text-slate-500">Update your survey settings and options.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12 space-y-6">
        <div className="space-y-1.5">
          <label htmlFor="title" className="block font-semibold text-slate-900">Poll Title</label>
          <Input id="title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Presidential Election 2026 or Class Leader Selection" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="block font-semibold text-slate-900">Description (Optional)</label>
          <textarea id="description" value={description} onChange={e => setDescription(e.target.value)}
            className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base shadow-sm transition-all duration-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand-light"
            placeholder="Add some context for your voters..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label htmlFor="category" className="block font-semibold text-slate-900">Category</label>
            <Select id="category" value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="endDate" className="block font-semibold text-slate-900">End Date (Optional)</label>
            <div className="relative group cursor-pointer" onClick={() => dateInputRef.current?.showPicker()}>
              <Input
                id="endDate"
                type="datetime-local"
                ref={dateInputRef}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="pr-10 cursor-pointer"
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none group-hover:text-brand transition-colors" />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${isMultipleChoice ? 'bg-brand' : 'bg-slate-200'}`}
                    onClick={() => setIsMultipleChoice(!isMultipleChoice)}>
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMultipleChoice ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <label className="font-semibold text-slate-900 cursor-pointer select-none text-sm" onClick={() => setIsMultipleChoice(!isMultipleChoice)}>
                    Allow multiple choices
                </label>
            </div>
            <div className="flex-1 flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${visibility === 'private' ? 'bg-brand' : 'bg-slate-200'}`}
                    onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}>
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${visibility === 'private' ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <label className="font-semibold text-slate-900 cursor-pointer select-none text-sm" onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}>
                    Private Poll
                </label>
            </div>
            <div className="flex-1 flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${isAnonymous ? 'bg-brand' : 'bg-slate-200'}`}
                    onClick={() => setIsAnonymous(!isAnonymous)}>
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAnonymous ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <label className="font-semibold text-slate-900 cursor-pointer select-none text-sm" onClick={() => setIsAnonymous(!isAnonymous)}>
                    Anonymous Voter
                </label>
            </div>
        </div>

        <div className="pt-6 border-t border-slate-200">
          <label className="block font-semibold text-slate-900 mb-4 flex items-center justify-between w-full">
            Voting Options
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Editing options will reset current votes!</span>
          </label>
          <div className="space-y-3">
            {options.map((opt, i) => (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1" key={i}>
                <Input type="text" required placeholder={`Option ${i + 1}`} value={opt} onChange={e => updateOption(i, e.target.value)} className="flex-1" />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addOption}
            className="w-full mt-4 py-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:border-brand hover:text-brand hover:bg-brand-light transition-all active:scale-[0.99] text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Option
          </button>
        </div>


        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-end items-center gap-4">
          <Link to={`/votings/${id}`} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors mr-4">Cancel</Link>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-w-[180px]">
            {isSubmitting ? 'Updating...' : (
              <span className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Save Changes
              </span>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-8 p-4 rounded-xl bg-red-50 text-red-800 border border-red-100 flex items-center gap-3 font-medium animate-in fade-in slide-in-from-top-2">
            <X className="h-5 w-5" />
            {error}
          </div>
        )}
      </form>

      {success && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 md:p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-brand-light text-brand rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">Poll Updated!</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">Your changes have been saved successfully.</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCopyLink}
                className="w-fit mx-auto flex items-center justify-center gap-2 p-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all text-sm mb-2"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                {copied ? 'Link Copied!' : 'Share Poll Link'}
              </button>

              <Button onClick={() => navigate(`/votings/${id}`)} className="w-full gap-2 py-6">
                <ExternalLink className="h-4 w-4" />
                View Poll
              </Button>

              <Button onClick={() => navigate('/dashboard')} variant="secondary" className="w-full gap-2 py-6">
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
