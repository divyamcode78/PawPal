import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import Navbar from '@/react-app/components/Navbar';
import { useAuth } from '@/react-app/hooks/useAuth';
import { CheckCircle2, Dog, Scissors, Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react';

const SERVICE_LABELS: Record<string, string> = {
  bath: 'Bath & Blow Dry',
  full_groom: 'Full Groom',
  nail_trim: 'Nail Trim',
  teeth_cleaning: 'Teeth Cleaning',
};

export default function GroomingCheckoutPage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [params] = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cash'>('card');
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');
  const [placing, setPlacing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const petId = Number(params.get('petId'));
  const service = params.get('service') || 'bath';
  const date = params.get('date') || '';
  const time = params.get('time') || '';
  const price = Number(params.get('price') || '0');

  const summary = useMemo(() => ({ petId, service, date, time, price }), [petId, service, date, time, price]);

  const validatePayment = (): string | null => {
    if (paymentMethod === 'card') {
      const num = card.number.replace(/\s+/g, '');
      const cvv = card.cvv.trim();
      const name = card.name.trim();
      const exp = card.expiry.trim();
      if (name.length < 2) return 'Enter cardholder name';
      if (!/^\d{16}$/.test(num)) return 'Card number must be 16 digits';
      if (!/^\d{3}$/.test(cvv)) return 'CVV must be 3 digits';
      // expiry MM/YY
      if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(exp)) return 'Expiry must be MM/YY';
      // basic expiry check
      const [mm, yy] = exp.split('/');
      const expDate = new Date(2000 + Number(yy), Number(mm));
      const now = new Date();
      if (expDate < now) return 'Card expired';
    } else if (paymentMethod === 'upi') {
      if (!/^[\w\.\-]{2,}@[\w]{2,}$/.test(upiId.trim())) return 'Enter valid UPI ID (e.g., name@bank)';
    }
    return null;
  };

  const placeOrder = async () => {
    setErrorMsg(null);
    // Validate summary inputs
    if (!summary.petId || !summary.date || !summary.time || !summary.price) {
      setErrorMsg('Missing booking details');
      return;
    }
    // Validate payment
    const paymentError = validatePayment();
    if (paymentError) {
      setErrorMsg(paymentError);
      return;
    }
    setPlacing(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const body = {
        pet_id: summary.petId,
        service_type: summary.service,
        appointment_date: summary.date,
        time_slot: summary.time,
        price: summary.price,
      };

      const resp = await fetch('/api/groomings', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        // Try to read JSON, else text
        const text = await resp.text();
        let msg = 'Failed to place booking';
        try {
          const j = JSON.parse(text);
          msg = j.error || j.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const created = await resp.json();
      // Persist to localStorage as a fallback so it shows in My Bookings
      try {
        const key = 'grooming_bookings';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const next = Array.isArray(existing) ? existing : [];
        const withoutDup = next.filter((x: any) => String(x.id) !== String(created.id));
        localStorage.setItem(key, JSON.stringify([created, ...withoutDup]));
      } catch {}
      navigate(`/grooming/confirm/${created.id}`, { state: { booking: created } as any });
    } catch (e) {
      // Redirect to generic confirmation page and pass summary for optimistic display in MyBookings
      const optimistic = {
        id: 'temp',
        pet_id: summary.petId,
        service_type: summary.service,
        appointment_date: summary.date,
        time_slot: summary.time,
        price: summary.price,
        status: 'confirmed',
      };
      // Persist optimistic booking to localStorage so it appears later
      try {
        const key = 'grooming_bookings';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const next = Array.isArray(existing) ? existing : [];
        const exists = next.some((x: any) => String(x.id) === String(optimistic.id) || (
          x.pet_id === optimistic.pet_id && x.appointment_date === optimistic.appointment_date && x.time_slot === optimistic.time_slot && x.service_type === optimistic.service_type
        ));
        if (!exists) localStorage.setItem(key, JSON.stringify([optimistic, ...next]));
      } catch {}
      navigate('/grooming/confirmed', { state: { booking: optimistic } as any });
      return;
    }
    finally {
      setPlacing(false);
    }
  };

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

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Scissors className="w-6 h-6 text-orange-500" /> Grooming Checkout
            </h1>
            <div className="w-8" />
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
              <Dog className="w-5 h-5 text-gray-500" />
              <div className="text-sm text-gray-700">Dog ID: <span className="font-semibold">{summary.petId}</span></div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
              <Scissors className="w-5 h-5 text-gray-500" />
              <div className="text-sm text-gray-700">Service: <span className="font-semibold">{SERVICE_LABELS[summary.service] || summary.service}</span></div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="text-sm text-gray-700">Date: <span className="font-semibold">{summary.date}</span></div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
              <Clock className="w-5 h-5 text-gray-500" />
              <div className="text-sm text-gray-700">Time: <span className="font-semibold">{summary.time}</span></div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
              <CheckCircle2 className="w-5 h-5 text-gray-500" />
              <div className="text-sm text-gray-700">Total: <span className="font-semibold">₹{summary.price.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Payment Method</h2>
            <div className="flex gap-3">
              {([
                { id: 'card', label: 'Card' },
                { id: 'upi', label: 'UPI' },
                { id: 'cash', label: 'Cash' },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`px-4 py-2 rounded-full border text-sm ${paymentMethod === m.id ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'card' && (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Cardholder Name</label>
                  <input value={card.name} onChange={(e)=>setCard({...card, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-white outline-none" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Card Number</label>
                  <input value={card.number} onChange={(e)=>setCard({...card, number: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-white outline-none" placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Expiry (MM/YY)</label>
                    <input value={card.expiry} onChange={(e)=>setCard({...card, expiry: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-white outline-none" placeholder="08/28" maxLength={5} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">CVV</label>
                    <input value={card.cvv} onChange={(e)=>setCard({...card, cvv: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-white outline-none" placeholder="123" maxLength={3} />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'upi' && (
              <div className="mt-4">
                <label className="block text-sm text-gray-700 mb-1">UPI ID</label>
                <input value={upiId} onChange={(e)=>setUpiId(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 bg-white outline-none" placeholder="username@bank" />
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="mt-4 text-sm text-gray-600">Pay with cash at the center on arrival.</div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={placeOrder}
              disabled={placing}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-pink-600 transition disabled:opacity-50"
            >
              {placing ? 'Processing...' : 'Pay & Book'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
