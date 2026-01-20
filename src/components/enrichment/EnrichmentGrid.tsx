import { useState } from 'react';
import { Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { EnrichedProduct, EnrichmentAttribute, CellChange } from '../../types/enrichment';
import { EditableCell } from './EditableCell';
import { CompletenessScore } from './CompletenessScore';

interface EnrichmentGridProps {
  products: EnrichedProduct[];
  attributes: EnrichmentAttribute[];
  selectedProducts: Set<string>;
  onToggleProduct: (productId: string) => void;
  onToggleAll: () => void;
  onCellChange: (change: CellChange) => void;
  changes: Map<string, CellChange>;
}

export function EnrichmentGrid({
  products,
  attributes,
  selectedProducts,
  onToggleProduct,
  onToggleAll,
  onCellChange,
  changes,
}: EnrichmentGridProps) {
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const toggleExpand = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const getCellChangeKey = (productId: string, attributeId: string) =>
    `${productId}-${attributeId}`;

  const isChanged = (productId: string, attributeId: string) =>
    changes.has(getCellChangeKey(productId, attributeId));

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No products found matching the current filters
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="sticky left-0 bg-gray-50 z-20 px-4 py-3 border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === products.length && products.length > 0}
                    onChange={onToggleAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="sticky left-12 bg-gray-50 z-20 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 min-w-[80px]">
                  Image
                </th>
                <th className="sticky left-[176px] bg-gray-50 z-20 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 min-w-[200px]">
                  Product
                </th>
                <th className="sticky left-[440px] bg-gray-50 z-20 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 min-w-[250px]">
                  Description
                </th>
                {attributes.map((attr) => (
                  <th
                    key={attr.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 min-w-[180px] bg-gray-50"
                  >
                    <div className="text-gray-500 text-[10px] font-normal mb-0.5">
                      {attr.group_name}
                    </div>
                    {attr.name}
                  </th>
                ))}
                <th className="sticky right-0 bg-gray-50 z-20 px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 min-w-[100px]">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <>
                  <tr key={product.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="sticky left-0 bg-white z-10 px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => onToggleProduct(product.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="sticky left-12 bg-white z-10 px-4 py-2">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {product.primary_image ? (
                          <img
                            src={product.primary_image}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="text-gray-400" size={24} />
                        )}
                      </div>
                    </td>
                    <td className="sticky left-[176px] bg-white z-10 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExpand(product.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedProducts.has(product.id) ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-2">
                            {product.title}
                          </div>
                          <div className="text-xs text-gray-500">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="sticky left-[440px] bg-white z-10 px-4 py-2">
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {product.short_description || (
                          <span className="text-gray-400 italic">No description</span>
                        )}
                      </div>
                    </td>
                    {attributes.map((attr) => (
                      <td key={attr.id} className="px-4 py-2 bg-white border-l border-gray-200">
                        <EditableCell
                          value={product.attributes[attr.id] || ''}
                          attributeType={attr.attribute_type}
                          options={attr.options}
                          isChanged={isChanged(product.id, attr.id)}
                          onChange={(newValue) =>
                            onCellChange({
                              productId: product.id,
                              attributeId: attr.id,
                              oldValue: product.attributes[attr.id],
                              newValue,
                            })
                          }
                        />
                      </td>
                    ))}
                    <td className="sticky right-0 bg-white z-10 px-4 py-2 text-center">
                      <div className="flex justify-center">
                        <CompletenessScore
                          score={product.completeness_score}
                          onClick={() => console.log('Show breakdown for', product.id)}
                        />
                      </div>
                    </td>
                  </tr>
                  {expandedProducts.has(product.id) && (
                    <tr>
                      <td colSpan={5 + attributes.length} className="bg-gray-50 px-4 py-4">
                        <div className="pl-20">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Additional Images
                          </h4>
                          <div className="flex gap-2">
                            {product.images.length > 0 ? (
                              product.images.map((img, idx) => (
                                <div
                                  key={idx}
                                  className="w-20 h-20 bg-white rounded-lg overflow-hidden border border-gray-200"
                                >
                                  <img
                                    src={img}
                                    alt={`${product.title} ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <ImageIcon size={16} />
                                No additional images
                              </div>
                            )}
                            <button className="w-20 h-20 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
                              <ImageIcon className="text-gray-400" size={20} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
