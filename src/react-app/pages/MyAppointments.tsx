import { useEffect, useState } from 'react';
import Navbar from '@/react-app/components/Navbar';
import { useAuth } from '@/react-app/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router';
import { Stethoscope, Calendar, Clock, Dog, ArrowRight, Loader2 } from 'lucide-react';

export default function MyAppointmentsPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await fetch('/api/doctor-appointments', { headers, credentials: 'include' });
        const apiData = resp.ok ? await resp.json() : [];
        // Merge with localStorage persisted appointments
        let local: any[] = [];
        try {
          local = JSON.parse(localStorage.getItem('doctor_appointments') || '[]');
          if (!Array.isArray(local)) local = [];
        } catch { local = []; }
        const merged: any[] = [];
        const pushUnique = (arr: any[]) => arr.forEach((x) => {
          const exists = merged.some((y) => String(y.id) === String(x.id) || (
            y.pet_id === x.pet_id && y.appointment_date === x.appointment_date && y.time_slot === x.time_slot && y.visit_type === x.visit_type
          ));
          if (!exists) merged.push(x);
        });
        pushUnique(Array.isArray(apiData) ? apiData : []);
        pushUnique(local);
        const optimistic = location?.state?.appointment;
        if (optimistic) {
          const inMerged = merged.some((x) => String(x.id) === String(optimistic.id) || (
            x.pet_id === optimistic.pet_id && x.appointment_date === optimistic.appointment_date && x.time_slot === optimistic.time_slot && x.visit_type === optimistic.visit_type
          ));
          setAppointments(inMerged ? merged : [optimistic, ...merged]);
        } else {
          setAppointments(merged);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) load();
  }, [isAuthenticated, location?.state]);

  useEffect(() => {
    const a = location?.state?.appointment;
    if (!a) return;
    setAppointments((prev) => {
      const exists = prev.some((x) => String(x.id) === String(a.id) || (
        x.pet_id === a.pet_id && x.appointment_date === a.appointment_date && x.time_slot === a.time_slot && x.visit_type === a.visit_type
      ));
      return exists ? prev : [a, ...prev];
    });
  }, [location?.state]);

  useEffect(() => {
    const r = location?.state?.remove;
    if (!r) return;
    setAppointments((prev) => prev.filter((x) => {
      if (String(x.id) === String(r.id)) return false;
      if (x.pet_id === r.pet_id && x.appointment_date === r.appointment_date && x.time_slot === r.time_slot && x.visit_type === r.visit_type) return false;
      return true;
    }));
    alert('Appointment cancelled');
    navigate('/appointments', { replace: true, state: {} as any });
  }, [location?.state]);

  const cancelAppointment = async (id: number) => {
    if (!confirm('Cancel this appointment?')) return;
    setCancellingId(id);
    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      let resp = await fetch(`/api/doctor-appointments/${id}/cancel`, { method: 'PATCH', headers, credentials: 'include' });
      if (!resp.ok) {
        resp = await fetch(`/api/doctor-appointments/${id}/cancel`, { method: 'POST', headers, credentials: 'include' });
      }
      if (!resp.ok) {
        resp = await fetch(`/api/doctor-appointments/${id}`, { method: 'PATCH', headers, credentials: 'include', body: JSON.stringify({ status: 'cancelled' }) });
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
      setAppointments(prev => prev.map(b => (b.id === id ? { ...b, ...updated } : b)));
      // Remove from localStorage persisted list
      try {
        const key = 'doctor_appointments';
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
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
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
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <button
            onClick={() => navigate('/doctor/book')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full hover:from-blue-600 hover:to-cyan-600"
          >
            New Appointment
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <Stethoscope className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700">No appointments yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {appointments.map((b) => (
              <div key={b.id} className="bg-white/70 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white/20">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                      <Stethoscope className="w-4 h-4 text-blue-500" />
                      <span className="uppercase text-xs tracking-wide bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">{b.status}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">Visit: <span className="font-medium">{b.visit_type}</span></div>
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
                      onClick={() => navigate(`/doctor/confirm/${b.id}`)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                    >
                      View details
                    </button>
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <button
                        onClick={() => cancelAppointment(b.id)}
                        disabled={cancellingId === b.id}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 block w-full text-right"
                      >
                        {cancellingId === b.id ? 'Cancelling...' : 'Cancel appointment'}
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
