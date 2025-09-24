import { useNavigate } from 'react-router';
import { Calendar, Stethoscope, Syringe, Scissors, Pill, ChefHat, AlertTriangle } from 'lucide-react';

interface UpcomingItem {
  id: number;
  title: string;
  record_type: string;
  due_date: string;
  pet_name: string;
  pet_id: number;
}

interface UpcomingCardProps {
  item: UpcomingItem;
}

export default function UpcomingCard({ item }: UpcomingCardProps) {
  const navigate = useNavigate();

  const getIcon = (recordType: string) => {
    switch (recordType) {
      case 'checkup':
        return <Stethoscope className="w-5 h-5" />;
      case 'vaccination':
        return <Syringe className="w-5 h-5" />;
      case 'grooming':
        return <Scissors className="w-5 h-5" />;
      case 'medication':
        return <Pill className="w-5 h-5" />;
      case 'diet':
        return <ChefHat className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getColor = (recordType: string) => {
    switch (recordType) {
      case 'checkup':
        return 'from-blue-400 to-cyan-500';
      case 'vaccination':
        return 'from-green-400 to-emerald-500';
      case 'grooming':
        return 'from-purple-400 to-indigo-500';
      case 'medication':
        return 'from-red-400 to-pink-500';
      case 'diet':
        return 'from-yellow-400 to-orange-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const isOverdue = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  };

  const isUrgent = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  return (
    <div
      onClick={() => navigate(`/pets/${item.pet_id}`)}
      className="bg-white/70 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
    >
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${getColor(item.record_type)} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          {getIcon(item.record_type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                {item.title}
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                {item.pet_name}
              </p>
            </div>
            
            {(isOverdue(item.due_date) || isUrgent(item.due_date)) && (
              <div className="flex-shrink-0 ml-2">
                <AlertTriangle className={`w-4 h-4 ${isOverdue(item.due_date) ? 'text-red-500' : 'text-yellow-500'}`} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              isOverdue(item.due_date) 
                ? 'bg-red-100 text-red-700' 
                : isUrgent(item.due_date)
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {formatDate(item.due_date)}
            </span>
            
            <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
