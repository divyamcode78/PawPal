import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PawPrint, Shield, Heart, Sparkles, Mail, Lock, User, Phone, MapPin, UserCheck } from 'lucide-react';
import { CreateUserSchema, SignInSchema, type CreateUser, type SignIn } from '@/shared/types';
import { useAuth } from '../hooks/useAuth';

export default function Auth() {
  const { user, isLoading, redirectToLogin, login, register } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState<CreateUser & SignIn>({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const handleGoogleAuth = async () => {
    try {
      await redirectToLogin();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const schema = authMode === 'signup' ? CreateUserSchema : SignInSchema;
    try {
      schema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({}); // Clear previous errors

    try {
      if (authMode === 'signup') {
        const result = await register(formData);
        
        if (!result.success) {
          setErrors({ submit: result.error || 'Registration failed' });
          return;
        }
        
        // Registration successful, user will be redirected by useEffect
      } else {
        const result = await login(formData.email, formData.password);
        
        if (!result.success) {
          setErrors({ submit: result.error || 'Login failed' });
          return;
        }
        
        // Login successful, user will be redirected by useEffect
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="animate-spin">
          <PawPrint className="w-10 h-10 text-orange-500" />
        </div>
      </div>
    );
  }

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
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
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
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Join the
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                PawPal Family
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              {authMode === 'signin' 
                ? "Welcome back! Sign in to continue managing your pet's health and wellness journey."
                : "Create your account and join thousands of pet parents using PawPal to keep their furry friends healthy and happy."
              }
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Auth Form Section */}
            <div className="order-2 lg:order-1">
              <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
                {/* Toggle Buttons */}
                <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
                  <button
                    onClick={() => setAuthMode('signin')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      authMode === 'signin'
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      authMode === 'signup'
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleSubmit} className="mb-6">
                  <div className="space-y-4">
                    {/* Email Field */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email address"
                        className={`w-full pl-12 pr-4 py-4 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ${
                          errors.email ? 'border-red-300' : 'border-gray-200'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1 ml-1">{errors.email}</p>
                      )}
                    </div>
                    
                    {/* Password Field */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Password"
                        className={`w-full pl-12 pr-4 py-4 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ${
                          errors.password ? 'border-red-300' : 'border-gray-200'
                        }`}
                      />
                      {errors.password ? (
                        <p className="text-red-500 text-sm mt-1 ml-1">{errors.password}</p>
                      ) : (
                        authMode === 'signup' && (
                          <p className="text-gray-500 text-xs mt-1 ml-1">
                            Use 8+ chars with uppercase, lowercase, number, and special character
                          </p>
                        )
                      )}
                    </div>

                    {/* Additional fields for signup */}
                    {authMode === 'signup' && (
                      <>
                        {/* Name Field */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Full name"
                            className={`w-full pl-12 pr-4 py-4 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ${
                              errors.name ? 'border-red-300' : 'border-gray-200'
                            }`}
                          />
                          {errors.name && (
                            <p className="text-red-500 text-sm mt-1 ml-1">{errors.name}</p>
                          )}
                        </div>

                        {/* Phone Field */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Phone number (optional)"
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>

                        {/* Address Field */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MapPin className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Address (optional)"
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>

                        {/* City and State Row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              placeholder="City (optional)"
                              className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                            />
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              placeholder="State (optional)"
                              className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                            />
                          </div>
                        </div>

                        {/* Zip Code Field */}
                        <div className="relative">
                          <input
                            type="text"
                            name="zip_code"
                            value={formData.zip_code}
                            onChange={handleInputChange}
                            placeholder="ZIP code (optional)"
                            className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>

                        {/* Emergency Contact Section */}
                        <div className="border-t border-gray-200 pt-4">
                          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <UserCheck className="w-4 h-4 mr-2" />
                            Emergency Contact (Optional)
                          </h3>
                          <div className="space-y-4">
                            <div className="relative">
                              <input
                                type="text"
                                name="emergency_contact_name"
                                value={formData.emergency_contact_name}
                                onChange={handleInputChange}
                                placeholder="Emergency contact name"
                                className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                              />
                            </div>
                            <div className="relative">
                              <input
                                type="tel"
                                name="emergency_contact_phone"
                                value={formData.emergency_contact_phone}
                                onChange={handleInputChange}
                                placeholder="Emergency contact phone"
                                className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-4 font-semibold rounded-2xl transition-all duration-300 ${
                        isSubmitting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isSubmitting ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
                    </button>

                    {/* Error Message */}
                    {errors.submit && (
                      <div className="text-center">
                        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          {errors.submit}
                        </p>
                      </div>
                    )}
                  </div>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 rounded-full">Continue with</span>
                  </div>
                </div>

                {/* Google Auth */}
                <button
                  onClick={handleGoogleAuth}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-lg transition-all duration-300 group"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                    {authMode === 'signin' ? 'Sign in' : 'Sign up'} with Google
                  </span>
                </button>

                {/* Terms */}
                <div className="mt-6 text-center text-sm text-gray-500">
                  By {authMode === 'signin' ? 'signing in' : 'creating an account'}, you agree to our{' '}
                  <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">Privacy Policy</a>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="order-1 lg:order-2 space-y-6">
              <div className="text-center lg:text-left mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-4 shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure & Trusted</h2>
                <p className="text-gray-600">
                  Your pet's data is protected with enterprise-grade security. We use Google's secure authentication to keep your account safe.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="bg-white/50 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <PawPrint className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Complete Health Records</h3>
                      <p className="text-sm text-gray-600">Track checkups, vaccinations, and medical history all in one place.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/50 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Smart Reminders</h3>
                      <p className="text-sm text-gray-600">Never miss important appointments or vaccination due dates.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/50 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Beautiful Interface</h3>
                      <p className="text-sm text-gray-600">Designed with love for pet parents - intuitive and delightful to use.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/50 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Multi-Pet Support</h3>
                      <p className="text-sm text-gray-600">Manage multiple pets with individual profiles and care schedules.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-orange-100 to-pink-100 rounded-2xl border border-orange-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-orange-900">Why Google Auth?</span>
                </div>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• No passwords to remember or forget</li>
                  <li>• Two-factor authentication built-in</li>
                  <li>• Instant account recovery</li>
                  <li>• Industry-leading security</li>
                </ul>
              </div>
            </div>
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
