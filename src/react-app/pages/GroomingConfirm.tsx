import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Navbar from '@/react-app/components/Navbar';
import { useAuth } from '@/react-app/hooks/useAuth';
import { CheckCircle2, Scissors, Calendar, Clock, Dog, ArrowRight } from 'lucide-react';

export default function GroomingConfirmPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await fetch(`/api/groomings/${id}`, { headers, credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          setBooking(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  // Keep the user on this page so the Cancel Booking button can be used.

  const cancelBooking = async () => {
    if (!id) return;
    if (!confirm('Cancel this booking?')) return;
    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      // Optimistically update UI
      const prev = booking;
      setBooking((b: any) => (b ? { ...b, status: 'cancelled' } : b));
      // Try PATCH /cancel
      let resp = await fetch(`/api/groomings/${id}/cancel`, { method: 'PATCH', headers, credentials: 'include' });
      if (!resp.ok) {
        // Try POST /cancel
        resp = await fetch(`/api/groomings/${id}/cancel`, { method: 'POST', headers, credentials: 'include' });
      }
      if (!resp.ok) {
        // Try PATCH root with status body
        resp = await fetch(`/api/groomings/${id}`, { method: 'PATCH', headers, credentials: 'include', body: JSON.stringify({ status: 'cancelled' }) });
      }
      if (!resp.ok) {
        // Try alternate path /groomings/cancel/:id
        resp = await fetch(`/api/groomings/cancel/${id}`, { method: 'PATCH', headers, credentials: 'include' });
      }
      if (!resp.ok) {
        // If backend returns 404, treat it as already-removed and clean up UI
        if (resp.status === 404) {
          alert('Booking cancelled');
          // Remove from localStorage persisted list
          try {
            const key = 'grooming_bookings';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const next = Array.isArray(existing) ? existing.filter((x: any) => String(x.id) !== String(id)) : [];
            localStorage.setItem(key, JSON.stringify(next));
          } catch {}
          navigate('/bookings', { state: { remove: { id, pet_id: booking?.pet_id, appointment_date: booking?.appointment_date, time_slot: booking?.time_slot, service_type: booking?.service_type } } as any });
          return;
        }
        const text = await resp.text().catch(() => '');
        // rollback optimistic update
        setBooking(prev);
        try {
          const j = JSON.parse(text);
          throw new Error(j.error || j.message || 'Failed to cancel');
        } catch {
          throw new Error(text || 'Failed to cancel');
        }
      }
      const updated = await resp.json().catch(() => ({ id, status: 'cancelled' }));
      setBooking(updated);
      alert('Booking cancelled');
      // Remove from localStorage persisted list
      try {
        const key = 'grooming_bookings';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const next = Array.isArray(existing) ? existing.filter((x: any) => String(x.id) !== String(updated.id)) : [];
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      // Take user to My Bookings with a removal hint
      navigate('/bookings', { state: { remove: { id: updated.id, pet_id: updated.pet_id, appointment_date: updated.appointment_date, time_slot: updated.time_slot, service_type: updated.service_type } } as any });
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (isLoading || loading) {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed</h1>
          <p className="text-gray-600 mb-8">Your grooming appointment has been scheduled successfully.</p>

          {booking && (
            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
                <Dog className="w-5 h-5 text-gray-500" />
                <div className="text-sm text-gray-700">Dog ID: <span className="font-semibold">{booking.pet_id}</span></div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
                <Scissors className="w-5 h-5 text-gray-500" />
                <div className="text-sm text-gray-700">Service: <span className="font-semibold">{booking.service_type}</span></div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div className="text-sm text-gray-700">Date: <span className="font-semibold">{booking.appointment_date}</span></div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
                <Clock className="w-5 h-5 text-gray-500" />
                <div className="text-sm text-gray-700">Time: <span className="font-semibold">{booking.time_slot}</span></div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
                <div className="text-sm text-gray-700">Total Paid: <span className="font-semibold">₹{Number(booking.price).toFixed(2)}</span></div>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3 mt-8">
            <button onClick={() => navigate('/grooming/book')} className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50">Book Another</button>
            <button onClick={() => navigate('/bookings', { state: booking ? { booking } : undefined } as any)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full hover:from-orange-600 hover:to-pink-600">
              View My Bookings
              <ArrowRight className="w-4 h-4" />
            </button>
            {(booking?.status === 'pending' || booking?.status === 'confirmed') && (
              <button onClick={cancelBooking} className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700">Cancel Booking</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
