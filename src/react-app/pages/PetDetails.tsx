import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { 
  ArrowLeft, 
  Calendar, 
  Plus, 
  Stethoscope, 
  Syringe, 
  ChefHat,
  Heart,
  Weight,
  MapPin
} from 'lucide-react';
import Navbar from '@/react-app/components/Navbar';
import HealthRecordCard from '@/react-app/components/HealthRecordCard';
import AddHealthRecordModal from '@/react-app/components/AddHealthRecordModal';
import type { Pet, HealthRecord, Vaccination, DietPlan } from '@/shared/types';

export default function PetDetails() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user, isPending, logout } = useAuth();
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'vaccinations' | 'diet'>('overview');
  const [showAddRecord, setShowAddRecord] = useState(false);

  useEffect(() => {
    if (!isPending && !user) {
      navigate('/');
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    if (user && petId) {
      fetchPetData();
    }
  }, [user, petId]);

  const fetchPetData = async () => {
    if (!petId) return;

    try {
      const [petResponse, healthResponse, vaccinationsResponse, dietResponse] = await Promise.all([
        fetch(`/api/pets/${petId}`),
        fetch(`/api/pets/${petId}/health-records`),
        fetch(`/api/pets/${petId}/vaccinations`),
        fetch(`/api/pets/${petId}/diet-plans`)
      ]);

      if (petResponse.ok) {
        const petData = await petResponse.json();
        setPet(petData);
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthRecords(healthData);
      }

      if (vaccinationsResponse.ok) {
        const vaccinationData = await vaccinationsResponse.json();
        setVaccinations(vaccinationData);
      }

      if (dietResponse.ok) {
        const dietData = await dietResponse.json();
        setDietPlans(dietData);
      }
    } catch (error) {
      console.error('Failed to fetch pet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordAdded = () => {
    setShowAddRecord(false);
    fetchPetData();
  };

  const formatAge = (birthDate: string | null) => {
    if (!birthDate) return 'Unknown age';
    
    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      return `${years} year${years !== 1 ? 's' : ''} old`;
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="animate-spin">
          <Heart className="w-10 h-10 text-orange-500" />
        </div>
      </div>
    );
  }

  if (!user || !pet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pet not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all duration-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar user={user} onLogout={logout} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {pet.name}'s Profile
          </h1>
        </div>

        {/* Pet Info Card */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
          <div className="flex items-start space-x-6">
            <div className="relative">
              {pet.photo_url ? (
                <img
                  src={pet.photo_url}
                  alt={pet.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-orange-300 to-pink-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <Heart className="w-12 h-12 text-white" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{pet.name}</h2>
              <p className="text-lg text-gray-600 mb-4">
                {pet.species} {pet.breed && `• ${pet.breed}`}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{formatAge(pet.birth_date)}</span>
                </div>
                {pet.weight && (
                  <div className="flex items-center space-x-2">
                    <Weight className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">{pet.weight} lbs</span>
                  </div>
                )}
                {pet.gender && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {pet.gender === 'male' ? '♂️' : pet.gender === 'female' ? '♀️' : '❓'} {pet.gender}
                    </span>
                  </div>
                )}
                {pet.microchip_id && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Microchipped</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowAddRecord(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Add Record</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 mb-8">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: Heart },
              { id: 'health', label: 'Health Records', icon: Stethoscope },
              { id: 'vaccinations', label: 'Vaccinations', icon: Syringe },
              { id: 'diet', label: 'Diet Plans', icon: ChefHat },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Health Records</h3>
                    <Stethoscope className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{healthRecords.length}</p>
                  <p className="text-sm text-gray-600">Total records</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Vaccinations</h3>
                    <Syringe className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-green-600">{vaccinations.length}</p>
                  <p className="text-sm text-gray-600">Total vaccines</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Diet Plans</h3>
                    <ChefHat className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{dietPlans.length}</p>
                  <p className="text-sm text-gray-600">Total plans</p>
                </div>
              </div>
            )}

            {activeTab === 'health' && (
              <div className="space-y-4">
                {healthRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No health records yet</h3>
                    <p className="text-gray-600 mb-6">Start tracking your pet's health by adding the first record.</p>
                    <button
                      onClick={() => setShowAddRecord(true)}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all duration-300"
                    >
                      Add First Record
                    </button>
                  </div>
                ) : (
                  healthRecords.map((record) => (
                    <HealthRecordCard key={record.id} record={record} />
                  ))
                )}
              </div>
            )}

            {activeTab === 'vaccinations' && (
              <div className="space-y-4">
                {vaccinations.length === 0 ? (
                  <div className="text-center py-12">
                    <Syringe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No vaccinations recorded</h3>
                    <p className="text-gray-600">Keep track of your pet's vaccination history.</p>
                  </div>
                ) : (
                  vaccinations.map((vaccination) => (
                    <div key={vaccination.id} className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{vaccination.vaccine_name}</h4>
                          {vaccination.date_administered && (
                            <p className="text-sm text-gray-600">
                              Administered: {new Date(vaccination.date_administered).toLocaleDateString()}
                            </p>
                          )}
                          {vaccination.next_due_date && (
                            <p className="text-sm text-gray-600">
                              Next due: {new Date(vaccination.next_due_date).toLocaleDateString()}
                            </p>
                          )}
                          {vaccination.veterinarian_name && (
                            <p className="text-sm text-gray-600">Dr. {vaccination.veterinarian_name}</p>
                          )}
                        </div>
                        {vaccination.is_core_vaccine && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Core
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'diet' && (
              <div className="space-y-4">
                {dietPlans.length === 0 ? (
                  <div className="text-center py-12">
                    <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No diet plans yet</h3>
                    <p className="text-gray-600">Create a feeding schedule for your pet.</p>
                  </div>
                ) : (
                  dietPlans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {plan.food_brand} {plan.food_type}
                          </h4>
                          {plan.daily_amount && (
                            <p className="text-sm text-gray-600">Daily amount: {plan.daily_amount}</p>
                          )}
                          {plan.feeding_times && (
                            <p className="text-sm text-gray-600">
                              Feeding times: {JSON.parse(plan.feeding_times).join(', ')}
                            </p>
                          )}
                          {plan.special_instructions && (
                            <p className="text-sm text-gray-600">{plan.special_instructions}</p>
                          )}
                        </div>
                        {plan.is_active && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddRecord && (
        <AddHealthRecordModal
          petId={pet.id}
          onClose={() => setShowAddRecord(false)}
          onRecordAdded={handleRecordAdded}
        />
      )}
    </div>
  );
}
