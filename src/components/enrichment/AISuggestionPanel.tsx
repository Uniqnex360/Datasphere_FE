import { useState } from 'react';
import { CheckCircle, XCircle, Edit3, Sparkles, TrendingUp } from 'lucide-react';
import { EnrichedProduct, AISuggestion } from '../../types/enrichment';

interface AISuggestionPanelProps {
  product: EnrichedProduct;
  suggestions: AISuggestion[];
  onClose: () => void;
  onAcceptSuggestion: (suggestion: AISuggestion) => Promise<void>;
  onRejectSuggestion: (suggestionId: string, productId: string) => Promise<void>;
}

export function AISuggestionPanel({ product, suggestions, onClose, onAcceptSuggestion, onRejectSuggestion }: AISuggestionPanelProps) {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'data' | 'enriched'>('suggestions');
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAcceptSuggestion = async (suggestion: AISuggestion) => {
    setProcessing(suggestion.id);
    try {
      await onAcceptSuggestion(suggestion);
    } catch (error) {
      console.error('Error accepting suggestion:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    setProcessing(suggestionId);
    try {
      await onRejectSuggestion(suggestionId, product.id);
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'suggestions'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AI Suggestions ({suggestions.length})
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'data'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Raw Data
          </button>
          <button
            onClick={() => setActiveTab('enriched')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'enriched'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Enriched
          </button>
        </div>
      </div>

      <div className="p-4 max-h-[600px] overflow-y-auto">
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No pending suggestions</p>
                <p className="text-sm text-gray-500 mt-1">Run AI operations to generate suggestions</p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{suggestion.field_name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(
                            suggestion.confidence_score
                          )}`}
                        >
                          {suggestion.confidence_score}%
                        </span>
                      </div>
                      {suggestion.reason && (
                        <p className="text-xs text-gray-500 mb-2">{suggestion.reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <p className="text-sm text-gray-700 font-mono">
                      {typeof suggestion.suggested_value === 'object'
                        ? JSON.stringify(suggestion.suggested_value, null, 2)
                        : suggestion.suggested_value}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptSuggestion(suggestion)}
                      disabled={processing === suggestion.id}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectSuggestion(suggestion.id)}
                      disabled={processing === suggestion.id}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center text-sm"
                      disabled={processing === suggestion.id}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Basic Information</h4>
              <div className="bg-gray-50 rounded p-3">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>{' '}
                    <span className="text-gray-600">{product.title}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">SKU:</span>{' '}
                    <span className="text-gray-600">{product.sku}</span>
                  </div>
                  {product.description && (
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>{' '}
                      <span className="text-gray-600">{product.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Attributes</h4>
              <div className="bg-gray-50 rounded p-3">
                <pre className="text-xs text-gray-700 font-mono overflow-x-auto">
                  {JSON.stringify(product.attributes, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enriched' && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">Enrichment Status</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-purple-700">Status:</span>{' '}
                  <span className="text-purple-600">{product.ai_enrichment_status}</span>
                </div>
                <div>
                  <span className="font-medium text-purple-700">Completeness Score:</span>{' '}
                  <span className="text-purple-600">{product.completeness_score}%</span>
                </div>
                {product.last_enriched_at && (
                  <div>
                    <span className="font-medium text-purple-700">Last Enriched:</span>{' '}
                    <span className="text-purple-600">
                      {new Date(product.last_enriched_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {product.ai_generated_description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">AI-Generated Description</h4>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-700">{product.ai_generated_description}</p>
                </div>
              </div>
            )}

            {product.ai_generated_tags && product.ai_generated_tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">AI-Generated Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {product.ai_generated_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
