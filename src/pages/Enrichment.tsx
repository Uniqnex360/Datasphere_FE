import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Sparkles, Package, CheckSquare, Square } from 'lucide-react';
import { Toast } from '../components/Toast';
// import { AIDetailPanel } from '../components/enrichment/AIDetailPanel';
import { EnrichmentStatusBadge } from '../components/enrichment/EnrichmentStatusBadge';
import { ExternalSKUModal, ExternalSKUData } from '../components/enrichment/ExternalSKUModal';
import { EnrichmentAPI, MasterAPI, ProductAPI } from '../lib/api';

interface Product {
  product_code: string;
  product_name: string;
  brand_name?: string;
  category_1?: string;
  completeness_score?: number;
  prod_short_desc?: string;
  prod_long_desc?: string;
  image_url_1?: string;
  enrichment_status?:string
  is_external?: boolean;
}

interface EnrichmentStatus {
  product_id: string;
  enrichment_status: string;
  completeness_score: number;
  is_external_sku: boolean;
  last_enriched_at?: string;
}

const SELECTED_PRODUCTS_KEY = 'enrichment_selected_products';

export function Enrichment() {
  const [products, setProducts] = useState<Product[]>([]);
  const [enrichmentStatuses, setEnrichmentStatuses] = useState<Map<string, EnrichmentStatus>>(new Map());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isExternalSKUModalOpen, setIsExternalSKUModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    completeness: 'all',
    externalOnly: false,
    brand: 'all',
    category: 'all',
  });
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadData();
    loadSelectedProducts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadPendingSuggestions();
    }, 10000);
    return () => clearInterval(interval);
  }, [products]);

  useEffect(() => {
    saveSelectedProducts();
  }, [selectedProducts]);

  const loadSelectedProducts = () => {
    const saved = localStorage.getItem(SELECTED_PRODUCTS_KEY);
    if (saved) {
      try {
        const productIds = JSON.parse(saved);
        setSelectedProducts(new Set(productIds));
      } catch (e) {
        console.error('Failed to load selected products:', e);
      }
    }
  };

  const saveSelectedProducts = () => {
    localStorage.setItem(SELECTED_PRODUCTS_KEY, JSON.stringify(Array.from(selectedProducts)));
  };

    const loadData = async () => {
    setLoading(true);
    console.log("🔄 Loading Data...");
    try {
      const [productsData, brandsData, categoriesData] = await Promise.all([
        ProductAPI.getAll(),
        MasterAPI.getBrands(),
        MasterAPI.getCategories()
      ]);
      console.log(" Loaded Products:", productsData.length);
      setProducts(productsData || []);
      
      const uniqueBrands = Array.from(new Set(productsData.map((p: any) => p.brand_name).filter(Boolean))).sort() as string[];
      const uniqueCategories = Array.from(new Set(productsData.map((p: any) => p.category_1).filter(Boolean))).sort() as string[];
      
      setBrands(uniqueBrands);
      setCategories(uniqueCategories);

      const statusMap = new Map<string, EnrichmentStatus>();
      productsData.forEach((p: any) => {
          statusMap.set(p.product_code, {
              product_id: p.product_code,
              enrichment_status: p.enrichment_status || 'pending',
              completeness_score: p.completeness_score || 0,
              is_external_sku: p.is_external || false,
              last_enriched_at: p.updated_at
          });
      });
      setEnrichmentStatuses(statusMap);

    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };
  const loadPendingSuggestions = async () => {
    try {
        const pendingItems = await EnrichmentAPI.getSuggestions(''); 
        if (pendingItems) {
            const countMap = new Map<string, number>();
            pendingItems.forEach((item: any) => {
                const pid = item.product_code;
                countMap.set(pid, (countMap.get(pid) || 0) + 1);
            });
            setPendingSuggestionsCount(countMap);
        }
    } catch (e) { console.error(e); }
  };

    const handleAddExternalSKU = async (data: ExternalSKUData) => {
    try {
      showToast('Adding external SKU...', 'success');

      await ProductAPI.create({
          product_code: data.external_sku,
          product_name: data.product_name || data.external_sku,
          brand_name: data.brand_name,
          category_1: data.category,
          attributes: data.attributes || {}, 
          image_url_1: data.image_urls?.[0] || ''
      });

      showToast('External SKU added! Starting AI enrichment...', 'success');

      await EnrichmentAPI.enrich(data.external_sku);
      
      showToast('AI enrichment started!', 'success');
      await loadData();

      // Open Panel
      const newProduct = products.find(p => p.product_code === data.external_sku) || {
        product_code: data.external_sku,
        product_name: data.product_name || data.external_sku,
        brand_name: data.brand_name,
        category_1: data.category,
        is_external: true,
      };
      setSelectedProduct(newProduct);
      setIsDetailPanelOpen(true);

    } catch (error: any) {
      console.error('Error adding external SKU:', error);
      showToast(`Failed: ${error.response?.data?.detail || error.message}`, 'error');
    }
  };

  const handleBulkAIOperation = async (operation: string) => {
    const selectedProductIds = Array.from(selectedProducts);
    if (selectedProductIds.length === 0) {
      showToast('Please select at least one product', 'error');
      return;
    }

    setBulkProcessing(true);
    showToast(`Processing ${selectedProductIds.length} products...`, 'success');

    try {
      let successCount = 0;
      let failCount = 0;

      for (const productId of selectedProductIds) {
        try {
          if (operation === 'enrich') {
             const res=await EnrichmentAPI.enrich(productId);
             console.log(`✅ Enrich Result for ${productId}:`, res);
          } else if (operation === 'normalize') {
            const res=await EnrichmentAPI.standardize(productId)
            console.log(`✅ Normalize Result for ${productId}:`, res);

          }
          else if(operation==='score')
          {
            const res=await EnrichmentAPI.calculateScore(productId)
            console.log(`✅ Score Result for ${productId}:`, res);
          }
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Error for product ${productId}:`, error);
        }
      }

      showToast(`Completed: ${successCount} successful, ${failCount} failed`, successCount > 0 ? 'success' : 'error');
      await loadData();
    } catch (error) {
      showToast('Bulk operation failed', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };
  const handleProductClick = (product: Product, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('.checkbox-container')) {
      return;
    }
    setSelectedProduct(product);
    setIsDetailPanelOpen(true);
  };

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.product_code)));
    }
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
  };

  

  const getFilteredProducts = () => {
    return products.filter(product => {
      if (filters.externalOnly && !product.is_external) return false;

      if (filters.brand !== 'all' && product.brand_name !== filters.brand) return false;

      if (filters.category !== 'all' && product.category_1 !== filters.category) return false;

      if (filters.status !== 'all') {
        const status = enrichmentStatuses.get(product.product_code);
        if (!status || status.enrichment_status !== filters.status) return false;
      }

      if (filters.completeness !== 'all') {
        const score = product.completeness_score || enrichmentStatuses.get(product.product_code)?.completeness_score || 0;
        if (filters.completeness === 'high' && score < 80) return false;
        if (filters.completeness === 'medium' && (score < 50 || score >= 80)) return false;
        if (filters.completeness === 'low' && score >= 50) return false;
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          product.product_code.toLowerCase().includes(searchLower) ||
          product.product_name.toLowerCase().includes(searchLower) ||
          product.brand_name?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles className="w-7 h-7 text-blue-600" />
                  AI Enrichment Center
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Select products and enrich with AI-powered suggestions
                </p>
              </div>
              <button
                onClick={() => setIsExternalSKUModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add External SKU
              </button>
            </div>
          </div>

          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
  <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
  <select
    value={filters.brand}
    onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="all"  hidden>Brand</option>
    {[...brands].sort((a, b) => a.localeCompare(b)).map(brand => (
      <option key={brand} value={brand}>{brand}</option>
    ))}
  </select>
</div>

              <div>
  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
  <select
    value={filters.category}
    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="all" hidden>Categories</option>
    {[...categories].sort((a, b) => a.localeCompare(b)).map(category => (
      <option key={category} value={category}>{category}</option>
    ))}
  </select>
</div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status Filter</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all"hidden>Status</option>
                  <option value="enriched">Enriched</option>

                  <option value="pending">Pending</option>

                  <option value="enriched_pending_approval">Pending Approval</option>
                  <option value="published">Published</option>


                  <option value="reviewed">Reviewed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Completeness</label>
                <select
                  value={filters.completeness}
                  onChange={(e) => setFilters({ ...filters, completeness: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all"hidden>Score</option>
                  <option value="high">High (80%+)</option>
                  <option value="low">Low (&lt;50%)</option>

                  <option value="medium">Medium (50-79%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search products..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={filters.externalOnly}
                    onChange={(e) => setFilters({ ...filters, externalOnly: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">External SKUs Only</span>
                </label>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <strong>{filteredProducts.length}</strong> products • <strong>{selectedProducts.size}</strong> selected
              </div>
              {selectedProducts.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAIOperation('enrich')}
                disabled={bulkProcessing || selectedProducts.size === 0}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Enrich Selected
              </button>
              <button
                onClick={() => handleBulkAIOperation('normalize')}
                disabled={bulkProcessing || selectedProducts.size === 0}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Normalize Selected
              </button>
              <button
                onClick={() => handleBulkAIOperation('score')}
                disabled={bulkProcessing || selectedProducts.size === 0}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Calculate Scores
              </button>
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
              >
                {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={() => loadData()}
                disabled={loading}
                className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or add a new external SKU</p>
            <button
              onClick={() => setIsExternalSKUModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add External SKU
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((product) => {
              const status = enrichmentStatuses.get(product.product_code);
              const suggestionsCount = pendingSuggestionsCount.get(product.product_code) || 0;
              const isSelected = selectedProducts.has(product.product_code);

              return (
                <div
                  key={product.product_code}
                  onClick={(e) => handleProductClick(product, e)}
                  className={`bg-white rounded-lg shadow-sm border-2 p-4 transition-all cursor-pointer ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="checkbox-container flex-shrink-0 pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => toggleProductSelection(product.product_code)}
                        className="focus:outline-none"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Square className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>

                                   <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {(() => {
                    let displayImage = null;
                    
                    if ((product as any).images && typeof (product as any).images === 'object') {
                       const imgs = (product as any).images;
                       const firstKey = Object.keys(imgs).sort()[0]; 
                       if (firstKey && imgs[firstKey]) {
                         const imgEntry = imgs[firstKey];
                         displayImage = typeof imgEntry === 'object' ? imgEntry.url : imgEntry;
                       }
                    }
                    
                    if (!displayImage) {
                        displayImage = product.image_url_1;
                    }

                    return displayImage ? (
                      <img
                        src={displayImage}
                        alt={product.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-8 h-8" />
                      </div>
                    );
                  })()}
                </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{product.product_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">SKU: {product.product_code}</span>
                            {product.is_external && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                External
                              </span>
                            )}
                            {suggestionsCount > 0 && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {suggestionsCount} Suggestion{suggestionsCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <EnrichmentStatusBadge
                          status={(status?.enrichment_status || 'pending') as any}
                          completenessScore={product.completeness_score || status?.completeness_score || 0}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        {product.brand_name && (
                          <div>
                            <span className="text-gray-500">Brand:</span>
                            <span className="ml-1 font-medium text-gray-700">{product.brand_name}</span>
                          </div>
                        )}
                        {product.category_1 && (
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <span className="ml-1 font-medium text-gray-700">{product.category_1}</span>
                          </div>
                        )}
                        {status?.last_enriched_at && (
                          <div>
                            <span className="text-gray-500">Last Enriched:</span>
                            <span className="ml-1 font-medium text-gray-700">
                              {new Date(status.last_enriched_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {(product.prod_short_desc || product.prod_long_desc) && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {product.prod_short_desc || product.prod_long_desc}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* <AIDetailPanel
        productId={selectedProduct?.product_code || ''}
        productName={selectedProduct?.product_name || ''}
        isOpen={isDetailPanelOpen}
        onClose={() => setIsDetailPanelOpen(false)}
        onRefresh={loadData}
      /> */}

      <ExternalSKUModal
        isOpen={isExternalSKUModalOpen}
        onClose={() => setIsExternalSKUModalOpen(false)}
        onSubmit={handleAddExternalSKU}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
