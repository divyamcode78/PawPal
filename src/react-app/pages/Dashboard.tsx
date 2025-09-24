import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { Plus, Calendar, PawPrint, Bell } from 'lucide-react';
import Navbar from '@/react-app/components/Navbar';
import PetCard from '@/react-app/components/PetCard';
import AddPetModal from '@/react-app/components/AddPetModal';
import UpcomingCard from '@/react-app/components/UpcomingCard';
import type { Pet } from '@/shared/types';

interface DashboardData {
  upcomingItems: Array<{
    id: number;
    title: string;
    record_type: string;
    due_date: string;
    pet_name: string;
    pet_id: number;
  }>;
  petCount: number;
}

export default function Dashboard() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPet, setShowAddPet] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [petsResponse, dashboardResponse] = await Promise.all([
        fetch('/api/pets', { headers }),
        fetch('/api/dashboard', { headers })
      ]);

      if (petsResponse.ok) {
        const petsData = await petsResponse.json();
        setPets(petsData);
      }

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setDashboardData(dashboardData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePetAdded = () => {
    setShowAddPet(false);
    fetchData();
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="animate-spin">
          <PawPrint className="w-10 h-10 text-orange-500" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar user={user} onLogout={logout} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name || 'Pet Parent'}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your furry friends today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pets</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.petCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Items</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.upcomingItems?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.upcomingItems?.filter(item => {
                    const dueDate = new Date(item.due_date);
                    const now = new Date();
                    return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
                  }).length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pets Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Pets</h2>
              <button
                onClick={() => setShowAddPet(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Add Pet</span>
              </button>
            </div>

            {pets.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-white/20 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PawPrint className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No pets yet</h3>
                <p className="text-gray-600 mb-6">Add your first furry friend to get started!</p>
                <button
                  onClick={() => setShowAddPet(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all duration-300"
                >
                  Add Your First Pet
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Items */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Care</h2>
            
            {dashboardData?.upcomingItems && dashboardData.upcomingItems.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcomingItems.map((item) => (
                  <UpcomingCard key={`${item.record_type}-${item.id}`} item={item} />
                ))}
              </div>
            ) : (
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600 text-sm">No upcoming care items in the next 30 days.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddPet && (
        <AddPetModal
          onClose={() => setShowAddPet(false)}
          onPetAdded={handlePetAdded}
        />
      )}
    </div>
  );
}
