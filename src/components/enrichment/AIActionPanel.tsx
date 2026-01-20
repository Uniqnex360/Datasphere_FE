import React from 'react';
import { Sparkles, RefreshCw, AlertCircle, FileText, Image, BarChart3 } from 'lucide-react';

interface AIActionPanelProps {
  productId: string;
  isLoading?: boolean;
  onEnrich: () => void;
  onNormalize: () => void;
  onMissingFields: () => void;
  onCompletenessScore: () => void;
  onImageTag?: () => void;
}

export function AIActionPanel({
  productId,
  isLoading = false,
  onEnrich,
  onNormalize,
  onMissingFields,
  onCompletenessScore,
  onImageTag,
}: AIActionPanelProps) {
  const actions = [
    {
      label: 'AI Enrich',
      icon: Sparkles,
      onClick: onEnrich,
      description: 'Generate descriptions, titles, and keywords',
      color: 'blue',
    },
    {
      label: 'Normalize',
      icon: RefreshCw,
      onClick: onNormalize,
      description: 'Standardize attribute values',
      color: 'purple',
    },
    {
      label: 'Missing Fields',
      icon: AlertCircle,
      onClick: onMissingFields,
      description: 'Detect and suggest missing attributes',
      color: 'orange',
    },
    {
      label: 'Score',
      icon: BarChart3,
      onClick: onCompletenessScore,
      description: 'Calculate completeness score',
      color: 'green',
    },
  ];

  if (onImageTag) {
    actions.push({
      label: 'Image Tag',
      icon: Image,
      onClick: onImageTag,
      description: 'Extract attributes from images',
      color: 'pink',
    });
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200',
      green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
      pink: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">AI Operations</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={isLoading}
              className={`
                ${getColorClasses(action.color)}
                border rounded-lg p-3 text-left transition-all duration-200
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                disabled:hover:bg-opacity-50
              `}
              title={action.description}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{action.label}</span>
              </div>
              <p className="text-xs opacity-80 line-clamp-2">{action.description}</p>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
}