import { useEffect, useState } from 'react';
import Navbar from '@/react-app/components/Navbar';
import { useAuth } from '@/react-app/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router';
import { Scissors, Calendar, Clock, Dog, ArrowRight, Loader2 } from 'lucide-react';

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await fetch('/api/groomings', { headers, credentials: 'include' });
        const apiData = resp.ok ? await resp.json() : [];
        // Merge with localStorage persisted bookings
        let local: any[] = [];
        try {
          local = JSON.parse(localStorage.getItem('grooming_bookings') || '[]');
          if (!Array.isArray(local)) local = [];
        } catch { local = []; }
        // Deduplicate: prefer API objects over local by id; otherwise merge unique by fields
        const merged: any[] = [];
        const pushUnique = (arr: any[]) => arr.forEach((x) => {
          const exists = merged.some((y) => String(y.id) === String(x.id) || (
            y.pet_id === x.pet_id && y.appointment_date === x.appointment_date && y.time_slot === x.time_slot && y.service_type === x.service_type
          ));
          if (!exists) merged.push(x);
        });
        pushUnique(Array.isArray(apiData) ? apiData : []);
        pushUnique(local);
        const optimistic = location?.state?.booking;
        if (optimistic) {
          const inMerged = merged.some((x) => String(x.id) === String(optimistic.id) || (
            x.pet_id === optimistic.pet_id && x.appointment_date === optimistic.appointment_date && x.time_slot === optimistic.time_slot && x.service_type === optimistic.service_type
          ));
          setBookings(inMerged ? merged : [optimistic, ...merged]);
        } else {
          setBookings(merged);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) load();
  }, [isAuthenticated, location?.state]);

  // If we navigated here with a booking in state, insert it optimistically
  useEffect(() => {
    const b = location?.state?.booking;
    if (!b) return;
    setBookings((prev) => {
      const exists = prev.some((x) => String(x.id) === String(b.id) || (
        // if backend generated ID later, match by fields to avoid duplicates
        x.pet_id === b.pet_id && x.appointment_date === b.appointment_date && x.time_slot === b.time_slot && x.service_type === b.service_type
      ));
      return exists ? prev : [b, ...prev];
    });
  }, [location?.state]);

  // If we navigated here with a removal hint, remove matching booking
  useEffect(() => {
    const r = location?.state?.remove;
    if (!r) return;
    setBookings((prev) => prev.filter((x) => {
      if (String(x.id) === String(r.id)) return false;
      // fallback matching by fields
      if (x.pet_id === r.pet_id && x.appointment_date === r.appointment_date && x.time_slot === r.time_slot && x.service_type === r.service_type) return false;
      return true;
    }));
    alert('Booking cancelled');
    // Clear state to avoid repeated removals on back/forward navigation
    navigate('/bookings', { replace: true, state: {} as any });
  }, [location?.state]);

  const cancelBooking = async (id: number) => {
    if (!confirm('Cancel this booking?')) return;
    setCancellingId(id);
    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      // Try PATCH /cancel
      let resp = await fetch(`/api/groomings/${id}/cancel`, { method: 'PATCH', headers, credentials: 'include' });
      if (!resp.ok) {
        // Try POST /cancel
        resp = await fetch(`/api/groomings/${id}/cancel`, { method: 'POST', headers, credentials: 'include' });
      }
      if (!resp.ok) {
        // Try PATCH / with body
        resp = await fetch(`/api/groomings/${id}`, { method: 'PATCH', headers, credentials: 'include', body: JSON.stringify({ status: 'cancelled' }) });
      }
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        try {
          const j = JSON.parse(text);
          throw new Error(j.error || j.message || 'Failed to cancel');
        } catch {
          throw new Error(text || 'Failed to cancel');
        }
      }
      const updated = await resp.json().catch(() => ({ id, status: 'cancelled' }));
      setBookings(prev => prev.map(b => (b.id === id ? { ...b, ...updated } : b)));
      // Remove from localStorage persisted list
      try {
        const key = 'grooming_bookings';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const next = Array.isArray(existing) ? existing.filter((x: any) => String(x.id) !== String(id)) : [];
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
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

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <button
            onClick={() => navigate('/grooming/book')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full hover:from-orange-600 hover:to-pink-600"
          >
            New Booking
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <Scissors className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700">No bookings yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white/70 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white/20">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                      <Scissors className="w-4 h-4 text-orange-500" />
                      <span className="uppercase text-xs tracking-wide bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md border border-orange-100">{b.status}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">Service: <span className="font-medium">{b.service_type}</span></div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{b.appointment_date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{b.time_slot}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                      <Dog className="w-4 h-4 text-gray-500" />
                      <span>Dog ID: {b.pet_id}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-lg font-bold text-gray-900">₹{Number(b.price).toFixed(2)}</div>
                    <button
                      onClick={() => navigate(`/grooming/confirm/${b.id}`)}
                      className="mt-3 text-sm text-orange-600 hover:text-orange-700"
                    >
                      View details
                    </button>
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <button
                        onClick={() => cancelBooking(b.id)}
                        disabled={cancellingId === b.id}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 block w-full text-right"
                      >
                        {cancellingId === b.id ? 'Cancelling...' : 'Cancel booking'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
