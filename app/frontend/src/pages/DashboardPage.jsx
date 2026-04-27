import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Users, Plus, LayoutDashboard, Search, Inbox } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();
  const [votings, setVotings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetch(`${API}/api/votings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVotings(data);
        else setVotings([]);
        setLoading(false);
      })
      .catch(() => {
        setVotings([]);
        setLoading(false);
      });
  }, []);

  const myPolls = votings.filter(v => user && v.user_id === user.id);
  const otherPolls = votings.filter(v => !user || v.user_id !== user.id);

  const filteredMyPolls = myPolls.filter(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOtherPolls = otherPolls.filter(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const PollCard = ({ voting }) => {
    const isEnded = voting.end_date && new Date(voting.end_date) < new Date();
    return (
      <Link to={`/votings/${voting.id}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
        <div className="w-full h-32 relative bg-slate-100 overflow-hidden">
          {voting.image_url ? (
            <img src={voting.image_url} alt={voting.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-3xl font-bold text-slate-400">{voting.title[0]}</span>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge variant={isEnded ? 'ended' : 'default'}>{isEnded ? 'Ended' : voting.category}</Badge>
          </div>
        </div>
        <div className="p-5 flex-grow">
          <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-brand transition-colors line-clamp-1">{voting.title}</h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">{voting.description || 'No description provided.'}</p>
          <div className="flex justify-between items-center text-xs font-medium w-full">
            <span className="text-slate-400">{voting.options?.length || 0} options</span>
            <div className="flex items-center gap-1.5 text-slate-400 text-right">
              <Users className="h-3.5 w-3.5" />
              {voting.total_votes} votes cast
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-24 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-brand" />
            Dashboard
          </h1>
          <p className="text-slate-500 mt-4">Manage your polls and explore community decisions.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search polls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand transition-all"
            />
          </div>
          <Link to="/create">
            <Button className="gap-2 px-6">
              <Plus className="h-4 w-4" />
              New Poll
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-16">
          {/* My Polls Section */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-xl font-bold text-slate-900">My Polls</h2>
              <span className="px-2 py-0.5 bg-brand/10 text-brand text-xs font-bold rounded-full">{myPolls.length}</span>
            </div>

            {filteredMyPolls.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredMyPolls.map(v => <PollCard key={v.id} voting={v} />)}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No polls created by you yet.</p>
              </div>
            )}
          </section>

          {/* Other Polls Section */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-xl font-bold text-slate-900">Community Polls</h2>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">{otherPolls.length}</span>
            </div>

            {filteredOtherPolls.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredOtherPolls.map(v => <PollCard key={v.id} voting={v} />)}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No other polls found.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
