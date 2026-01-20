import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ApprovalPanelProps {
  productId: string;
  suggestions: any[];
  onApprove: () => void;
  onReject: () => void;
}

export function ApprovalPanel({ productId, suggestions, onApprove, onReject }: ApprovalPanelProps) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  if (pendingSuggestions.length === 0) {
    return null;
  }

  const handleApproveAll = async () => {
    setApproving(true);
    try {
      for (const suggestion of pendingSuggestions) {
        await supabase
          .from('ai_field_history')
          .insert({
            product_id: productId,
            field_name: suggestion.field_name,
            old_value: '',
            new_value: suggestion.suggested_value,
            change_type: 'ai_accepted',
            suggestion_id: suggestion.id,
          });

        const isExternalSku = !suggestion.field_name.includes('_');

        if (isExternalSku) {
          const { data: externalSku } = await supabase
            .from('external_skus')
            .select('enriched_data')
            .eq('external_sku', productId)
            .maybeSingle();

          if (externalSku) {
            const enrichedData = externalSku.enriched_data || {};
            enrichedData[suggestion.field_name] = suggestion.suggested_value;

            await supabase
              .from('external_skus')
              .update({ enriched_data: enrichedData })
              .eq('external_sku', productId);
          }
        } else {
          await supabase
            .from('product_master')
            .update({ [suggestion.field_name]: suggestion.suggested_value })
            .eq('product_code', productId);
        }

        await supabase
          .from('ai_suggestions')
          .update({
            status: 'accepted',
            approved_by: 'current_user',
            approved_at: new Date().toISOString(),
          })
          .eq('id', suggestion.id);
      }

      await supabase
        .from('product_enrichment_status')
        .update({ enrichment_status: 'enriched' })
        .eq('product_id', productId);

      alert('All suggestions approved successfully!');
      onApprove();
    } catch (error) {
      console.error('Error approving suggestions:', error);
      alert('Failed to approve suggestions');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectAll = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setRejecting(true);
    try {
      for (const suggestion of pendingSuggestions) {
        await supabase
          .from('ai_suggestions')
          .update({
            status: 'rejected',
            rejection_reason: rejectionReason,
          })
          .eq('id', suggestion.id);
      }

      await supabase
        .from('product_enrichment_status')
        .update({ enrichment_status: 'pending' })
        .eq('product_id', productId);

      alert('All suggestions rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      onReject();
    } catch (error) {
      console.error('Error rejecting suggestions:', error);
      alert('Failed to reject suggestions');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">Approval Required</h3>
            <p className="text-sm text-gray-700 mb-3">
              This product has <strong>{pendingSuggestions.length} pending AI suggestion{pendingSuggestions.length > 1 ? 's' : ''}</strong> that require your review and approval.
            </p>
            <div className="bg-white rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-gray-600 mb-2">PENDING SUGGESTIONS:</p>
              <ul className="space-y-1">
                {pendingSuggestions.slice(0, 3).map(suggestion => (
                  <li key={suggestion.id} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    <span><strong>{suggestion.field_name}:</strong> {String(suggestion.suggested_value).substring(0, 60)}{String(suggestion.suggested_value).length > 60 ? '...' : ''}</span>
                  </li>
                ))}
                {pendingSuggestions.length > 3 && (
                  <li className="text-sm text-gray-500 italic">
                    ...and {pendingSuggestions.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleApproveAll}
            disabled={approving}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5" />
            {approving ? 'Approving...' : `Approve All ${pendingSuggestions.length} Suggestions`}
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={rejecting}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-5 h-5" />
            Reject All
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-3 text-center">
          Review individual suggestions below before approving or rejecting all
        </p>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject All Suggestions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting these AI suggestions. This will help improve future suggestions.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectAll}
                disabled={rejecting || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
