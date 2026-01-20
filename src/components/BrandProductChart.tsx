import { useState } from 'react';
import { ChevronRight, Tag } from 'lucide-react';
import Modal from './Modal';

interface BrandData {
  brand_name: string;
  product_count: number;
}

interface BrandProductChartProps {
  data: BrandData[];
  onNavigate?: (page: string, filters?: any) => void;
}

export function BrandProductChart({ data, onNavigate }: BrandProductChartProps) {
  const [showAll, setShowAll] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const sortedData = [...data].sort((a, b) => b.product_count - a.product_count);
  const displayData = sortedData.slice(0, 12);
  const hasMore = sortedData.length > 12;
  const maxProducts = Math.max(...sortedData.map((b) => b.product_count), 1);

  const handleNavigateToBrand = (brandName: string) => {
    setModalOpen(false);
    onNavigate?.('products', { brand: brandName });
  };

  const getBrandColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-teal-500',
      'bg-violet-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-emerald-500',
      'bg-rose-500',
      'bg-indigo-500',
      'bg-amber-500',
      'bg-lime-500',
    ];
    return colors[index % colors.length];
  };

  const BrandBar = ({ brand, index, maxValue }: { brand: BrandData; index: number; maxValue: number }) => {
    const widthPercent = (brand.product_count / maxValue) * 100;
    const colorClass = getBrandColor(index);

    return (
      <div
        onClick={() => handleNavigateToBrand(brand.brand_name)}
        className="group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-32 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {brand.brand_name}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div
                  className={`${colorClass} h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2 group-hover:opacity-90`}
                  style={{ width: `${Math.max(widthPercent, 5)}%` }}
                >
                  {widthPercent > 20 && (
                    <span className="text-xs font-semibold text-white">{brand.product_count}</span>
                  )}
                </div>
              </div>
              {widthPercent <= 20 && (
                <span className="text-xs font-semibold text-gray-700 w-12 text-right">
                  {brand.product_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No brand data available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayData.map((brand, index) => (
            <BrandBar key={brand.brand_name} brand={brand} index={index} maxValue={maxProducts} />
          ))}

          {hasMore && (
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all font-medium"
          >
            View All Brands ({sortedData.length})
            <ChevronRight size={18} />
          </button>
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="All Brands by Product Count"
        size="large"
        actions={
          <button
            onClick={() => setModalOpen(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        }
      >
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {sortedData.map((brand, index) => (
            <BrandBar key={brand.brand_name} brand={brand} index={index} maxValue={maxProducts} />
          ))}
        </div>
      </Modal>
    </>
  );
}
