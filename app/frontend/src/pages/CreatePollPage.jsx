import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ChevronLeft, Plus, X, Image as ImageIcon, CheckCircle2, Calendar, LayoutDashboard, ExternalLink, Share2, Copy, Check } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

export default function CreatePollPage() {
  const navigate = useNavigate();
  const { user, token, loading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [visibility, setVisibility] = useState('public');
  const [endDate, setEndDate] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPollId, setSuccessPollId] = useState(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const dateInputRef = useRef(null);

  const categories = [
    'Politics', 'Education', 'Business', 'Technology',
    'Entertainment', 'Sports', 'Food', 'Lifestyle', 'Gaming', 'Other'
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

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

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('is_multiple_choice', isMultipleChoice);
    formData.append('is_anonymous', isAnonymous);
    formData.append('visibility', visibility);
    if (endDate) formData.append('end_date', endDate);
    formData.append('options', JSON.stringify(filteredOptions));
    if (imageFile) formData.append('image', imageFile);

    try {
      const res = await fetch(`${API}/api/votings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create poll');
      setSuccessPollId(data.id);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };
  const handleCopyLink = () => {
    const url = `${window.location.origin}/votings/${successPollId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-28 px-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-sm mb-8 transition-colors group">
        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Create a New Poll</h1>
        <p className="text-lg text-slate-500">Design your survey and start gathering insights in minutes.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12 space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="block font-semibold text-slate-900">Poll Title</label>
          <Input id="title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Presidential Election 2026 or Class Leader Selection" />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block font-semibold text-slate-900">Description (Optional)</label>
          <textarea id="description" value={description} onChange={e => setDescription(e.target.value)}
            className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base shadow-sm transition-all duration-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand-light"
            placeholder="Add some context for your voters..." />
        </div>

        {/* Category & Date */}
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

        {/* Image Upload */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-900">Cover Image</label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 transition-colors hover:border-slate-300">
            {imagePreview ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }}
                  className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-red-500 hover:bg-red-50 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current.click()}
                className="flex flex-col items-center gap-2 text-slate-500 hover:text-brand transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <span className="font-bold text-sm">Click to upload image</span>
                  <p className="text-[10px] mt-0.5">PNG, JPG, or WEBP up to 5MB</p>
                </div>
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          </div>
        </div>

        {/* Multi Choice, Visibility & Anonymous Toggle */}
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

        {/* Options */}
        <div className="pt-6 border-t border-slate-200">
          <label className="block font-semibold text-slate-900 mb-4 flex items-center justify-between">
            Voting Options
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">{options.length} added</span>
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


        {/* Submit */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-end items-center gap-4">
          <Link to="/" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors mr-4">Cancel</Link>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-w-[180px]">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Create Poll
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

      {/* Success Dialog Popup */}
      {successPollId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 md:p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">Your Poll is Live!</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">Your poll has been successfully created. Share the link below with your audience to start gathering responses instantly.</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCopyLink}
                className="w-fit mx-auto flex items-center justify-center gap-2 p-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all text-sm mb-2"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                {copied ? 'Link Copied!' : 'Share Poll Link'}
              </button>

              <Button onClick={() => navigate(`/votings/${successPollId}`)} className="w-full gap-2 py-6">
                <ExternalLink className="h-4 w-4" />
                Go to Vote
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
