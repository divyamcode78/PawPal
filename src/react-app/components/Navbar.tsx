import { PawPrint, Settings, LogOut, User, ChevronDown, LayoutDashboard, CreditCard, Scissors, Stethoscope } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.google_user_data?.given_name || user?.name || user?.email || 'User';
  const avatarUrl = user?.google_user_data?.picture;

  const goToProfile = () => {
    setOpen(false);
    navigate('/settings');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent group-hover:opacity-90">
              PawPal
            </span>
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-white/60 transition"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">{displayName}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <button
                  onClick={() => { setOpen(false); navigate('/dashboard'); }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => { setOpen(false); navigate('/bookings'); }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <Scissors className="w-4 h-4" />
                  <span>My Bookings</span>
                </button>
                <button
                  onClick={() => { setOpen(false); navigate('/appointments'); }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Appointments</span>
                </button>
                <button
                  onClick={() => { setOpen(false); navigate('/subscriptions'); }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Subscriptions</span>
                </button>
                <button
                  onClick={goToProfile}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  <span>Profile Settings</span>
                </button>
                <button
                  onClick={() => { setOpen(false); onLogout(); }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
