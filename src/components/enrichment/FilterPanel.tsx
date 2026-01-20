import { X } from 'lucide-react';
import { EnrichmentFilters } from '../../types/aiEnrichment';

interface FilterPanelProps {
  filters: EnrichmentFilters;
  onFiltersChange: (filters: EnrichmentFilters) => void;
  onClose: () => void;
}

export default function FilterPanel({ filters, onFiltersChange, onClose }: FilterPanelProps) {
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'enriched', label: 'Enriched' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'published', label: 'Published' },
  ];

  const handleStatusToggle = (status: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onFiltersChange({ ...filters, status: newStatuses });
  };

  const handleCompletenessChange = (min: number, max: number) => {
    onFiltersChange({ ...filters, completeness_range: [min, max] });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enrichment Status
          </label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusToggle(option.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.status?.includes(option.value)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Completeness Score Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              value={filters.completeness_range?.[0] || 0}
              onChange={(e) =>
                handleCompletenessChange(
                  parseInt(e.target.value),
                  filters.completeness_range?.[1] || 100
                )
              }
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.completeness_range?.[1] || 100}
              onChange={(e) =>
                handleCompletenessChange(
                  filters.completeness_range?.[0] || 0,
                  parseInt(e.target.value)
                )
              }
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={clearFilters}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
