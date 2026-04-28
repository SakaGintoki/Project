import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { PlusCircle, LogOut, ChevronDown, Menu, X, LayoutDashboard, Home } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled || mobileMenuOpen
        ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm py-3'
        : 'bg-transparent border-b border-transparent py-5'
    }`}>
      <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-black text-slate-900 tracking-tighter hover:opacity-80 transition-opacity" onClick={() => setMobileMenuOpen(false)}>
            Votely<span className="text-brand">.</span>
          </Link>
        </div>

        <div className="flex gap-4 md:gap-8 items-center">
          {/* Desktop Navigation (Moved to Right) */}
          <div className="hidden md:flex gap-6 items-center">
            <Link to="/" className="text-md font-bold text-slate-600 hover:text-slate-900 transition-colors">Home</Link>
            <Link to="/dashboard" className="text-md font-bold text-slate-600 hover:text-slate-900 transition-colors">Dashboard</Link>
          </div>

          {/* Create Button (Desktop) - Only show if logged in */}
          {user && (
            <Link to="/create" className="hidden sm:block">
              <Button size="sm" className="gap-2 shadow-none hover:shadow-brand px-5 rounded-full">
                <PlusCircle className="h-4 w-4" />
                Create Poll
              </Button>
            </Link>
          )}

          {/* Auth Section */}
          {user ? (
            <div className="relative flex items-center gap-3" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center text-md font-bold shadow-md shadow-brand/20">
                  {getInitials(user.full_name)}
                </div>
                <ChevronDown className={`hidden sm:block h-4 w-4 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="px-5 py-4 border-b border-slate-50 mb-1">
                    <p className="text-md font-black text-slate-900 truncate">{user.full_name}</p>
                    <p className="text-xs font-medium text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-5 py-3 text-md font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/login">
                <Button variant="outline" size="sm" className="font-bold px-5 text-slate-700 border-slate-200">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="font-bold px-5">Get Started</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
          <div className="p-6 space-y-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 py-3 text-slate-700 font-bold hover:text-brand transition-colors">
              <Home className="h-5 w-5" />
              Home
            </Link>
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 py-3 text-slate-700 font-bold hover:text-brand transition-colors">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
            {user && (
              <Link to="/create" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 py-3 text-brand font-bold hover:text-brand-hover transition-colors">
                <PlusCircle className="h-5 w-5" />
                Create Poll
              </Link>
            )}

            {!user && (
              <div className="grid grid-cols-2 gap-4 pt-4 mt-2 border-t border-slate-100">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-2xl py-6 font-bold text-slate-700 border-slate-200">Sign In</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-2xl py-6 font-bold">Register</Button>
                </Link>
              </div>
            )}

            {user && (
              <div className="pt-2 mt-2 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 py-3 text-red-500 font-bold hover:text-red-600 transition-colors w-full"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
