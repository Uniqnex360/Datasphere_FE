import { useState } from 'react';
import { X, ChevronRight, Package } from 'lucide-react';
import Modal from './Modal';

interface CategoryData {
  parent_category: string;
  total_products: number;
  subcategories: Array<{
    subcategory: string;
    product_count: number;
  }>;
}

interface CategoryCoverageChartProps {
  data: CategoryData[];
  onNavigate?: (page: string, filters?: any) => void;
}

export function CategoryCoverageChart({ data, onNavigate }: CategoryCoverageChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCategoryClick = (category: CategoryData) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleNavigateToProducts = (categoryCode?: string) => {
    setModalOpen(false);
    onNavigate?.('products', { category: categoryCode });
  };

  const maxProducts = Math.max(...data.map((c) => c.total_products), 1);

  const getColorForIndex = (index: number) => {
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

  return (
    <>
      <div className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No category data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.map((category, index) => {
            const heightPercent = (category.total_products / maxProducts) * 100;
            const colorClass = getColorForIndex(index);

            return (
              <div
                key={category.parent_category}
                onClick={() => handleCategoryClick(category)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1 flex items-end mb-3">
                    <div className="w-full">
                      <div
                        className={`${colorClass} rounded-t transition-all group-hover:opacity-90`}
                        style={{
                          height: `${Math.max(heightPercent, 20)}px`,
                          minHeight: '40px',
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {category.parent_category}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{category.total_products} products</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded">
                        {category.subcategories.length} sub
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${selectedCategory?.parent_category || 'Category'} Breakdown`}
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
        {selectedCategory && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    {selectedCategory.parent_category}
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Total: {selectedCategory.total_products} products across{' '}
                    {selectedCategory.subcategories.length} subcategories
                  </p>
                </div>
                <button
                  onClick={() => handleNavigateToProducts(selectedCategory.parent_category)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View All
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Subcategories</h4>
              {selectedCategory.subcategories.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No subcategories found</p>
              ) : (
                <div className="space-y-2">
                  {selectedCategory.subcategories.map((sub, index) => {
                    const percentage = Math.round(
                      (sub.product_count / selectedCategory.total_products) * 100
                    );
                    return (
                      <div
                        key={`${sub.subcategory}-${index}`}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-900">{sub.subcategory}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-gray-900">
                              {sub.product_count}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">({percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
