import { Search } from 'lucide-react';
import { FilterState } from '../../types/enrichment';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  industries: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; industry_id: string }>;
  brands: Array<{ id: string; name: string }>;
  productTypes: string[];
}

export function FilterBar({
  filters,
  onFilterChange,
  industries,
  categories,
  brands,
  productTypes,
}: FilterBarProps) {
  const filteredCategories = categories.filter(
    (cat) => !filters.industry_id || cat.industry_id === filters.industry_id
  );

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-4 flex-wrap">
        <select
          value={filters.industry_id}
          onChange={(e) =>
            onFilterChange({ ...filters, industry_id: e.target.value, category_id: '' })
          }
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Industries</option>
          {industries.map((industry) => (
            <option key={industry.id} value={industry.id}>
              {industry.name}
            </option>
          ))}
        </select>

        <select
          value={filters.category_id}
          onChange={(e) => onFilterChange({ ...filters, category_id: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!filters.industry_id}
        >
          <option value="">All Categories</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={filters.product_type}
          onChange={(e) => onFilterChange({ ...filters, product_type: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Product Types</option>
          {productTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={filters.brand_id}
          onChange={(e) => onFilterChange({ ...filters, brand_id: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>

        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search by product name, SKU, MPN..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
