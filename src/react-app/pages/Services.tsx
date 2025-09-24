import { useNavigate } from 'react-router';
import { Scissors, Stethoscope, ChefHat, Syringe, ArrowRight, PawPrint } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Services() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const services = [
    {
      id: 'grooming',
      title: 'Grooming',
      description: 'Keep your pet looking and feeling their best with regular grooming schedules',
      icon: Scissors,
      color: 'from-purple-400 to-indigo-500',
      bgColor: 'from-purple-50 to-indigo-50',
      features: ['Bathing schedules', 'Nail trimming', 'Hair cuts', 'Dental care']
    },
    {
      id: 'appointments',
      title: 'Doctor Appointments',
      description: 'Schedule and track veterinary checkups and medical consultations',
      icon: Stethoscope,
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      features: ['Health checkups', 'Emergency visits', 'Specialist consultations', 'Medical records']
    },
    {
      id: 'diet',
      title: 'Diet Planning',
      description: 'Create personalized nutrition plans and feeding schedules for optimal health',
      icon: ChefHat,
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50',
      features: ['Meal planning', 'Feeding schedules', 'Nutrition tracking', 'Special diets']
    },
    {
      id: 'vaccinations',
      title: 'Vaccinations',
      description: 'Never miss important vaccines with automated reminders and tracking',
      icon: Syringe,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      features: ['Vaccine schedules', 'Reminder alerts', 'Medical history', 'Core vaccines']
    }
  ];

  const handleServiceSelect = async (serviceId: string) => {
    // If not authenticated, go to auth
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Grooming goes to new booking flow
    if (serviceId === 'grooming') {
      navigate('/grooming/book');
      return;
    }

    // Doctor appointments go to their own booking flow
    if (serviceId === 'appointments') {
      navigate('/doctor/book');
      return;
    }

    // Check for user's pets
    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetch('/api/pets', { headers });
      if (!resp.ok) {
        // Fallback to dashboard to add pet
        navigate('/dashboard?addPet=1');
        return;
      }
      const pets = await resp.json();
      if (!Array.isArray(pets) || pets.length === 0) {
        navigate('/dashboard?addPet=1');
        return;
      }

      const firstPet = pets[0];
      navigate(`/pets/${firstPet.id}?book=${serviceId}`);
    } catch {
      navigate('/dashboard?addPet=1');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              PawPal
            </span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/subscriptions')}
              className="px-6 py-3 bg-white/70 text-gray-800 font-semibold rounded-full hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/40"
            >
              Subscriptions
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Choose Your Pet Care
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                Journey
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Select the services you need to keep your furry friend healthy and happy. 
              Our comprehensive platform covers all aspects of pet care.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                className={`bg-gradient-to-br ${service.bgColor} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer group border border-white/20 backdrop-blur-lg`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-orange-500" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {service.description}
                </p>

                <div className="space-y-2">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full"></div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Start managing today</span>
                    <div className="flex items-center space-x-2 text-orange-500">
                      <span className="text-sm font-semibold">Get Started</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/20 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to give your pet the best care?
              </h2>
              <p className="text-gray-600 mb-6">
                Join thousands of pet owners who trust PawPal to keep their furry friends healthy and happy.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start Your Journey Now
              </button>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full opacity-15 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
