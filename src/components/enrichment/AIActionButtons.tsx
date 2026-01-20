import { Sparkles, FileText, AlertCircle, RefreshCw } from 'lucide-react';

interface AIActionButtonsProps {
  productId: string;
  onAction: (operation: string, productId: string) => void;
  loading: boolean;
}

export default function AIActionButtons({ productId, onAction, loading }: AIActionButtonsProps) {
  const actions = [
    {
      id: 'normalize',
      label: 'Normalize',
      icon: RefreshCw,
      color: 'text-blue-600 hover:bg-blue-50'
    },
    {
      id: 'enrich',
      label: 'Enrich',
      icon: Sparkles,
      color: 'text-purple-600 hover:bg-purple-50'
    },
    {
      id: 'missing-fields',
      label: 'Detect Missing',
      icon: AlertCircle,
      color: 'text-orange-600 hover:bg-orange-50'
    },
    {
      id: 'completeness-score',
      label: 'Score',
      icon: FileText,
      color: 'text-green-600 hover:bg-green-50'
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={(e) => {
              e.stopPropagation();
              onAction(action.id, productId);
            }}
            disabled={loading}
            className={`p-2 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 ${action.color}`}
            title={action.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
