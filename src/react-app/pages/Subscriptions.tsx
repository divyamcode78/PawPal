import { PawPrint, Check, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function Subscriptions() {
  const navigate = useNavigate();

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      priceInINR: 199,
      period: 'month',
      features: [
        'Track vaccinations and appointments',
        'Add unlimited pets',
        'Smart reminders',
      ],
      gradient: 'from-orange-400 to-pink-500',
      bg: 'from-orange-50 to-pink-50',
    },
    {
      id: 'yearly',
      name: 'Yearly',
      priceInINR: 1799,
      period: 'year',
      features: [
        'Everything in Monthly',
        '2 months free (save ₹589)',
        'Priority support',
      ],
      gradient: 'from-purple-500 to-indigo-500',
      bg: 'from-purple-50 to-indigo-50',
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              PawPal
            </span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/auth')} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Plans */}
      <div className="relative px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
            <p className="text-gray-600">Simple pricing in INR. Switch or cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.id} className={`bg-gradient-to-br ${plan.bg} rounded-3xl p-8 shadow-xl border border-white/20 backdrop-blur-lg relative ${plan.highlight ? 'ring-2 ring-purple-400' : ''}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 right-6 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">Best Value</div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                </div>
                <div className="flex items-end gap-1 mb-6">
                  <IndianRupee className="w-6 h-6 text-gray-900" />
                  <span className="text-4xl font-extrabold text-gray-900">{plan.priceInINR}</span>
                  <span className="text-gray-600 mb-1">/ {plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-gray-700">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white`}>
                        <Check className="w-4 h-4" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/auth')} className={`w-full px-6 py-3 bg-gradient-to-r ${plan.gradient} text-white font-semibold rounded-full hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]`}>
                  Continue with {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}


