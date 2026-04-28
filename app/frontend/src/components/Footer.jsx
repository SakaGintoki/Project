import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-10 px-6 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 md:gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 sm:col-span-2 text-center sm:text-left">
            <Link to="/" className="text-3xl font-black text-slate-900 tracking-tighter hover:opacity-80 transition-opacity mb-4 block">
              Votely<span className="text-brand">.</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-sm mx-auto sm:mx-0">
              Empowering communities and teams to make democratic, transparent, and lightning-fast decisions through modern voting infrastructure.
            </p>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Developed by
              <div className="text-slate-900 mt-1 text-sm font-bold normal-case tracking-normal">Team 3 DevSecOps</div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h4 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-slate-500 hover:text-brand text-sm transition-colors font-medium">Home</Link></li>
              <li><Link to="/dashboard" className="text-slate-500 hover:text-brand text-sm transition-colors font-medium">Dashboard</Link></li>
              <li><Link to="/create" className="text-slate-500 hover:text-brand text-sm transition-colors font-medium">Create Poll</Link></li>
            </ul>
          </div>

          {/* Support/Legal */}
          <div className="text-center sm:text-left">
            <h4 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-slate-500 hover:text-brand text-sm transition-colors font-medium">Documentation</a></li>
              <li><a href="#" className="text-slate-500 hover:text-brand text-sm transition-colors font-medium">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-500 hover:text-brand text-sm transition-colors font-medium">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="text-center sm:text-left">
            <h4 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-wider">Connect</h4>
            <div className="flex flex-col items-center sm:items-start gap-4">
              <a href="mailto:support@votely.com" className="flex items-center gap-3 text-slate-500 hover:text-brand text-sm transition-colors font-medium">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Mail className="h-4 w-4" />
                </div>
                support@votely.com
              </a>
              <a href="https://instagram.com/votely_official" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-500 hover:text-brand text-sm transition-colors font-medium">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                @votely_official
              </a>
              <a href="https://twitter.com/votely_app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-500 hover:text-brand text-sm transition-colors font-medium">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </div>
                @votely_app
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-xs font-medium text-slate-400">
            &copy; {new Date().getFullYear()} Votely Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-bold text-slate-300 uppercase tracking-wide hover:text-brand transition-colors">Privacy</a>
            <a href="#" className="text-[10px] font-bold text-slate-300 uppercase tracking-wide hover:text-brand transition-colors">Terms</a>
            <a href="#" className="text-[10px] font-bold text-slate-300 uppercase tracking-wide hover:text-brand transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
