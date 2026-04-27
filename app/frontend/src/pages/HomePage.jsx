import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowRight, Zap, ShieldCheck, BarChart3, Inbox, Users, MessageSquare } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

export default function HomePage() {
  const [votings, setVotings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/votings/public`)
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

  return (
    <>
      {/* Animated Mesh Gradient Background (Kept in CSS) */}
      <div className="mesh-bg">
        <div className="mesh-blob blob-1"></div>
        <div className="mesh-blob blob-2"></div>
        <div className="mesh-blob blob-3"></div>
      </div>

      {/* Hero Section */}
      <section className="relative w-full max-w-6xl mx-auto min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center">
        <div className="flex flex-col items-center z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Badge variant="hero" className="mb-8 scale-110">E-VOTING APP</Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8 text-slate-900">
            Decision infrastructure for <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-purple-500 to-brand-hover">teams and communities.</span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 font-medium">
            Thousands of organizations use Votely to make democratic, transparent,
            and lightning-fast decisions. Create a poll in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/create">
              <Button size="lg" className="text-lg px-8 rounded-full shadow-md hover:scale-105 transition-all">
                Start a poll now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <a href="#active-polls">
              <Button variant="secondary" size="lg" className="text-lg px-8 rounded-full bg-white/50 backdrop-blur-sm border-slate-200 hover:bg-white hover:scale-105 transition-all">
                Explore Active Polls
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto py-16 px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-brand uppercase tracking-widest mb-3">Core Advantages</h2>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Why Choose Votely?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-8 bg-white/60 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-brand-light text-brand rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-colors duration-300">
              <Zap className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Lightning Fast</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Our infrastructure ensures votes are counted in milliseconds. Experience zero latency even with thousands of concurrent voters.</p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 bg-white/60 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-brand-light text-brand rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-colors duration-300">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Secure & Anti-Fraud</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Advanced IP tracking and session management prevent duplicate voting, ensuring absolute integrity for your decisions.</p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 bg-white/60 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-brand-light text-brand rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-colors duration-300">
              <BarChart3 className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Real-time Analytics</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Watch the results unfold with beautiful, animated charts. Export data easily for further analysis.</p>
          </div>

          {/* Feature 4 */}
          <div className="p-8 bg-white/60 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-brand-light text-brand rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-colors duration-300">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Collaborative</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Build communities and teams. Gather opinions from members in a structured way that leads to action.</p>
          </div>

          {/* Feature 5 */}
          <div className="p-8 bg-white/60 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-brand-light text-brand rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-colors duration-300">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Seamless Sharing</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Share your polls anywhere with unique, beautiful links that look great on social media and chat apps.</p>
          </div>

          {/* Feature 6 */}
          <div className="p-8 bg-white/60 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-brand-light text-brand rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-colors duration-300">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Social Interactions</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Engage with other voters through comments. Discuss options, share viewpoints, and build a more informed community.</p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-slate-50 border-y border-slate-100 py-24 px-6 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">How it works</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Three simple steps to gather insights and make data-driven decisions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 relative">
            {/* Connecting Line (Desktop only) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-1 bg-gradient-to-r from-brand-light via-brand/30 to-brand-light z-0 rounded-full"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-brand-light shadow-xl flex items-center justify-center text-3xl font-black text-brand mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:border-brand group-hover:bg-brand-light group-hover:text-brand-hover">
                1
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Create a Poll</h3>
              <p className="text-slate-600 leading-relaxed">Design your survey with multiple options, add images, and set custom rules like multi-choice or end dates.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-brand-light shadow-xl flex items-center justify-center text-3xl font-black text-brand mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:border-brand group-hover:bg-brand-light group-hover:text-brand-hover">
                2
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Share the Link</h3>
              <p className="text-slate-600 leading-relaxed">Distribute your poll via a secure, unique link. Participants can vote instantly from any device without installing apps.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-brand-light shadow-xl flex items-center justify-center text-3xl font-black text-brand mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:border-brand group-hover:bg-brand-light group-hover:text-brand-hover">
                3
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Analyze Results</h3>
              <p className="text-slate-600 leading-relaxed">Watch the votes roll in with real-time, animated charts. See the winning option clearly highlighted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Polls Section */}
      <section id="active-polls" className="max-w-5xl mx-auto py-24 px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">Active Polls</h2>
          <p className="text-lg text-slate-500">Join the conversation and cast your vote on these trending topics.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-brand rounded-full animate-spin"></div>
          </div>
        ) : votings.length === 0 ? (
          <div className="text-center py-16 px-8 bg-white rounded-3xl border border-dashed border-slate-300">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-500 mb-6">No active polls found.</p>
            <Link to="/create"><Button>Create the first poll</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {votings.map(voting => {
              const isEnded = voting.end_date && new Date(voting.end_date) < new Date();
              return (
                <Link to={`/votings/${voting.id}`} key={voting.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="w-full h-40 relative bg-slate-100 overflow-hidden">
                    {voting.image_url ? (
                      <img src={voting.image_url} alt={voting.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <span className="text-4xl font-bold text-slate-400">{voting.title[0]}</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge variant={isEnded ? 'ended' : 'default'}>{isEnded ? 'Ended' : voting.category}</Badge>
                    </div>
                  </div>
                  <div className="p-6 flex-grow">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand transition-colors line-clamp-1">{voting.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{voting.description || 'No description provided.'}</p>
                  </div>
                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-medium w-full">
                    <span className="text-slate-400">{voting.options?.length || 0} options</span>
                    <div className="flex items-center gap-1.5 text-slate-400 text-right">
                      <Users className="h-3.5 w-3.5" />
                      {voting.total_votes} votes cast
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
