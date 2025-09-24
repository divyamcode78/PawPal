import { useEffect, useState } from 'react';
import Navbar from '@/react-app/components/Navbar';
import { useAuth } from '@/react-app/hooks/useAuth';
import { useNavigate } from 'react-router';
import { Heart, Calendar, Stethoscope, ChefHat, Sparkles, PawPrint } from 'lucide-react';
import AddPetModal from '@/react-app/components/AddPetModal';
export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [showAddPet, setShowAddPet] = useState(false);
  useEffect(() => {
    // Stay on home after login/signup as requested
  }, [user, isLoading, navigate]);
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="animate-spin">
          <PawPrint className="w-10 h-10 text-orange-500" />
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Navigation */}
      {user ? (
        <Navbar user={user} onLogout={logout} />
      ) : (
        <nav className="relative z-10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                PawPal
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/subscriptions')} className="px-6 py-3 bg-white/70 text-gray-800 font-semibold rounded-full hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/40">Subscriptions</button>
              <button onClick={() => navigate('/auth')} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">Get Started</button>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Section */}
      <div className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-yellow-700" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Your Pet's Health,
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                Beautifully Managed
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Say goodbye to fragmented pet care. PawPal brings together health checkups, vaccinations, 
              diet planning, and grooming schedules in one beautiful, easy-to-use platform.
            </p>
            
            <button onClick={() => navigate('/services')} className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 text-lg">
              Start Managing Your Pet's Health
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Stethoscope className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Health Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Keep track of checkups, symptoms, and medical history with detailed health records.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Scheduling</h3>
              <p className="text-gray-600 leading-relaxed">
                Never miss important vaccinations or appointments with intelligent reminders.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Diet Planning</h3>
              <p className="text-gray-600 leading-relaxed">
                Create personalized feeding schedules and track dietary requirements.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Grooming Care</h3>
              <p className="text-gray-600 leading-relaxed">
                Schedule grooming sessions and maintain your pet's hygiene routines.
              </p>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full opacity-30 blur-3xl"></div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/20 bg-white/10 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              PawPal
            </span>
          </div>
          <p className="text-gray-600">
            Made with ❤️ for pet owners everywhere
          </p>
        </div>
      </footer>
      {showAddPet && (
        <AddPetModal onClose={() => setShowAddPet(false)} onPetAdded={() => setShowAddPet(false)} />
      )}
    </div>;
}
