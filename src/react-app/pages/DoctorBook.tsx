import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, Clock, Dog, Stethoscope, ArrowRight } from 'lucide-react';
import Navbar from '@/react-app/components/Navbar';
import { useAuth } from '@/react-app/hooks/useAuth';
import type { Pet } from '@/shared/types';

const VISIT_OPTIONS = [
  { id: 'checkup', label: 'Routine Checkup', price: 35.0 },
  { id: 'consultation', label: 'Consultation', price: 49.0 },
  { id: 'emergency', label: 'Emergency Visit', price: 79.0 },
  { id: 'follow_up', label: 'Follow-up', price: 25.0 },
] as const;

type VisitId = typeof VISIT_OPTIONS[number]['id'];

type Availability = { time_slot: string; available: boolean }[];

export default function DoctorBookPage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [visitType, setVisitType] = useState<VisitId>('checkup');
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [availability, setAvailability] = useState<Availability>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loadingAvail, setLoadingAvail] = useState(false);

  const todayLocalStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const selectedVisit = useMemo(() => VISIT_OPTIONS.find(v => v.id === visitType)!, [visitType]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await fetch('/api/pets', { headers, credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          setPets(data);
          if (data.length > 0) setSelectedPetId(data[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (isAuthenticated) fetchPets();
  }, [isAuthenticated]);

  useEffect(() => {
    const run = async () => {
      if (!date) { setAvailability([]); return; }
      setLoadingAvail(true);
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await fetch(`/api/doctor-appointments/availability?date=${encodeURIComponent(date)}`, { headers, credentials: 'include' });
        if (!resp.ok) {
          const fallback = generateLocalSlots();
          setAvailability(fallback.map(s => ({ time_slot: s, available: true })));
        } else {
          const json = await resp.json().catch(() => ({}));
          const arr = Array.isArray(json?.availability) ? json.availability : [];
          if (!arr.length) {
            const fallback = generateLocalSlots();
            setAvailability(fallback.map(s => ({ time_slot: s, available: true })));
          } else {
            setAvailability(arr);
          }
        }
      } catch (e) {
        console.error(e);
        const fallback = generateLocalSlots();
        setAvailability(fallback.map(s => ({ time_slot: s, available: true })));
      } finally {
        setLoadingAvail(false);
      }
    };
    run();
  }, [date]);

  function generateLocalSlots() {
    const startHour = 9;
    const endHour = 19; // Doctors available longer
    const slots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  }

  const proceedToCheckout = () => {
    if (!selectedPetId || !date || !selectedSlot) return;
    const params = new URLSearchParams({
      petId: String(selectedPetId),
      visit: visitType,
      date,
      time: selectedSlot,
      price: String(selectedVisit.price),
    });
    navigate(`/doctor/checkout?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar user={user} onLogout={logout} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-blue-500" /> Book Doctor Appointment
            </h1>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Dog</label>
              <div className="space-y-2">
                {pets.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPetId(p.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${selectedPetId === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                  >
                    <Dog className="w-5 h-5 text-gray-500" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.breed || p.species}</div>
                    </div>
                  </button>
                ))}
                {pets.length === 0 && (
                  <div className="text-sm text-gray-600">No pets yet. Add a pet in Dashboard.</div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visit Type</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {VISIT_OPTIONS.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setVisitType(v.id)}
                      className={`p-4 rounded-xl border text-left transition ${visitType === v.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                    >
                      <div className="font-semibold text-gray-900">{v.label}</div>
                      <div className="text-sm text-gray-600">₹{v.price.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => { setDate(e.target.value); setSelectedSlot(''); }}
                      className="w-full outline-none"
                      min={todayLocalStr}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-auto p-1 bg-white rounded-xl border border-gray-200">
                    {loadingAvail && <div className="col-span-3 text-center text-gray-500 py-4">Loading slots...</div>}
                    {!loadingAvail && availability.length === 0 && (
                      <div className="col-span-3 text-center text-gray-500 py-4">No slots to show. Try another date.</div>
                    )}
                    {!loadingAvail && availability.map((slot) => (
                      <button
                        key={slot.time_slot}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time_slot)}
                        className={`px-2 py-2 rounded-lg text-sm border transition ${selectedSlot === slot.time_slot ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'} ${!slot.available ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-1 justify-center">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{slot.time_slot}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={proceedToCheckout}
                  disabled={!selectedPetId || !date || !selectedSlot}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:from-blue-600 hover:to-cyan-600 transition disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
