import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ResultSummaryProps {
  totalProducts: number;
  needsEnrichment: number;
}

export function ResultSummary({ totalProducts, needsEnrichment }: ResultSummaryProps) {
  const allEnriched = needsEnrichment === 0 && totalProducts > 0;
  const hasIssues = needsEnrichment === totalProducts && totalProducts > 0;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Total Products Matching Filters:
          </span>
          <span className="text-lg font-bold text-gray-900">{totalProducts}</span>
        </div>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            hasIssues ? 'bg-orange-50' : 'bg-gray-50'
          }`}
        >
          <span className="text-sm font-medium text-gray-700">
            Products Needing Enrichment (&lt;70%):
          </span>
          <span
            className={`text-lg font-bold ${
              hasIssues ? 'text-orange-600' : 'text-gray-900'
            }`}
          >
            {needsEnrichment}
          </span>
        </div>

        {allEnriched && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle2 size={20} />
            <span className="font-medium">All products are fully enriched</span>
          </div>
        )}

        {hasIssues && (
          <div className="flex items-center gap-2 text-orange-600">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">Action needed</span>
          </div>
        )}
      </div>
    </div>
  );
}
