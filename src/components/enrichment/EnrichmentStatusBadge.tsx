import React from 'react';
import { CheckCircle, Clock, Eye, Send } from 'lucide-react';

interface EnrichmentStatusBadgeProps {
  status: 'pending' | 'enriched' | 'reviewed' | 'published';
  completenessScore?: number;
}

export function EnrichmentStatusBadge({ status, completenessScore }: EnrichmentStatusBadgeProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-gray-100 text-gray-700 border-gray-300',
    },
    enriched: {
      icon: CheckCircle,
      label: 'Enriched',
      className: 'bg-blue-100 text-blue-700 border-blue-300',
    },
    reviewed: {
      icon: Eye,
      label: 'Reviewed',
      className: 'bg-purple-100 text-purple-700 border-purple-300',
    },
    published: {
      icon: Send,
      label: 'Published',
      className: 'bg-green-100 text-green-700 border-green-300',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>

      {completenessScore !== undefined && (
        <div className="flex items-center gap-1">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                completenessScore >= 80
                  ? 'bg-green-500'
                  : completenessScore >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${completenessScore}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 font-medium">{completenessScore}%</span>
        </div>
      )}
    </div>
  );
}