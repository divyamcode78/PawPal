import { useEffect, useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { PawPrint } from 'lucide-react';

export default function AuthCallback() {
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();
  const [, setIsNewUser] = useState<boolean | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        
        // Check if this is a new user by calling the backend
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const user = await response.json();
          // Check if user was just created (created_at is very recent)
          const userCreatedAt = new Date(user.created_at);
          const now = new Date();
          const timeDiff = now.getTime() - userCreatedAt.getTime();
          const isRecentlyCreated = timeDiff < 60000; // Less than 1 minute ago
          
          setIsNewUser(isRecentlyCreated);
          
          // Redirect based on whether it's a new user or returning user
          if (isRecentlyCreated) {
            // New user - redirect to home page to see the welcome
            navigate('/');
          } else {
            // Existing user - redirect to dashboard
            navigate('/dashboard');
          }
        } else {
          navigate('/dashboard'); // Default to dashboard if we can't determine
        }
      } catch (error) {
        console.error('Authentication failed:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <div className="animate-spin mb-4">
        <PawPrint className="w-12 h-12 text-orange-500" />
      </div>
      <p className="text-lg text-gray-600">Setting up your account...</p>
    </div>
  );
}
