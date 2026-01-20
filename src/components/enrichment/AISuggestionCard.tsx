import React from 'react';
import { Check, X, Edit2, AlertCircle } from 'lucide-react';

interface AISuggestion {
  id: string;
  field_name: string;
  current_value?: string;
  suggested_value: string;
  confidence_score: number;
  status: string;
  reason?: string;
  ai_model?: string;
  created_at: string;
}

interface AISuggestionCardProps {
  suggestion: AISuggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, value: string) => void;
}

export function AISuggestionCard({ suggestion, onAccept, onReject, onEdit }: AISuggestionCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(suggestion.suggested_value);

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return 'High Confidence';
    if (score >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const handleSaveEdit = () => {
    onEdit(suggestion.id, editValue);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-700">{suggestion.field_name}</span>
            <span className={`text-xs px-2 py-1 rounded-full border ${getConfidenceColor(suggestion.confidence_score)}`}>
              {getConfidenceLabel(suggestion.confidence_score)} ({suggestion.confidence_score}%)
            </span>
          </div>

          {suggestion.current_value && (
            <div className="mb-2">
              <span className="text-xs text-gray-500 block mb-1">Current Value:</span>
              <span className="text-sm text-gray-600 line-through">{suggestion.current_value}</span>
            </div>
          )}

          <div className="mb-2">
            <span className="text-xs text-gray-500 block mb-1">AI Suggested Value:</span>
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
            ) : (
              <span className="text-sm text-blue-700 font-medium">{suggestion.suggested_value}</span>
            )}
          </div>

          {suggestion.reason && (
            <div className="flex items-start gap-1 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{suggestion.reason}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-400">
          {suggestion.ai_model && <span className="mr-2">Model: {suggestion.ai_model}</span>}
          <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditValue(suggestion.suggested_value);
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onAccept(suggestion.id)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                title="Accept suggestion"
              >
                <Check className="w-3 h-3" />
                Accept
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                title="Edit suggestion"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => onReject(suggestion.id)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                title="Reject suggestion"
              >
                <X className="w-3 h-3" />
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}