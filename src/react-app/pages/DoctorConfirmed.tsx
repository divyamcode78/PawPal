import Navbar from '@/react-app/components/Navbar';
import { useAuth } from '@/react-app/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function DoctorConfirmedPage() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  useEffect(() => {
    const state = location?.state && typeof location.state === 'object' ? location.state : undefined;
    const t = setTimeout(() => navigate('/appointments', { replace: true, state }), 800);
    return () => clearTimeout(t);
  }, [navigate, location?.state]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar user={user} onLogout={logout} />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/30 text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointment Confirmed</h1>
          <p className="text-gray-600 mb-8">Your doctor appointment has been scheduled successfully.</p>

          <div className="flex justify-center gap-3 mt-2">
            <button onClick={() => navigate('/doctor/book')} className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50">Book Another</button>
            <button onClick={() => navigate('/appointments')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full hover:from-blue-600 hover:to-cyan-600">
              View My Appointments
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
