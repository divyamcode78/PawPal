import { Calendar, Stethoscope, Syringe, Scissors, Pill, ChefHat, DollarSign, MapPin, User } from 'lucide-react';
import type { HealthRecord } from '@/shared/types';

interface HealthRecordCardProps {
  record: HealthRecord;
}

export default function HealthRecordCard({ record }: HealthRecordCardProps) {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date < now && !record.is_completed;
  };

  const isUpcoming = (dateString: string | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0 && !record.is_completed;
  };

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${getColor(record.record_type)} rounded-lg flex items-center justify-center shadow-lg flex-shrink-0`}>
          {getIcon(record.record_type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                {record.title}
              </h4>
              <p className="text-sm text-gray-600 capitalize mb-2">
                {record.record_type.replace('_', ' ')}
              </p>
            </div>
            
            <div className="flex flex-col items-end space-y-1">
              {record.is_completed && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Completed
                </span>
              )}
              {!record.is_completed && isOverdue(record.next_due_date) && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  Overdue
                </span>
              )}
              {!record.is_completed && isUpcoming(record.next_due_date) && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                  Due Soon
                </span>
              )}
              {record.is_recurring && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Recurring
                </span>
              )}
            </div>
          </div>

          {record.description && (
            <p className="text-gray-600 text-sm mb-3 leading-relaxed">
              {record.description}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {record.date_scheduled && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Scheduled: {formatDate(record.date_scheduled)}</span>
              </div>
            )}
            
            {record.date_completed && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Completed: {formatDate(record.date_completed)}</span>
              </div>
            )}
            
            {record.next_due_date && !record.is_completed && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className={isOverdue(record.next_due_date) ? 'text-red-600 font-medium' : ''}>
                  Next Due: {formatDate(record.next_due_date)}
                </span>
              </div>
            )}

            {record.veterinarian_name && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Dr. {record.veterinarian_name}</span>
              </div>
            )}

            {record.clinic_name && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{record.clinic_name}</span>
              </div>
            )}

            {record.cost && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>${record.cost.toFixed(2)}</span>
              </div>
            )}
          </div>

          {record.notes && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600 italic">
                <span className="font-medium">Notes:</span> {record.notes}
              </p>
            </div>
          )}

          {record.is_recurring && record.recurrence_interval_days && (
            <div className="pt-2">
              <p className="text-xs text-blue-600">
                Repeats every {record.recurrence_interval_days} days
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
