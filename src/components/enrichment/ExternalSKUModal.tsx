import React, { useState } from 'react';
import { X, Package, Plus, AlertCircle } from 'lucide-react';

interface ExternalSKUModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExternalSKUData) => void;
}

export interface ExternalSKUData {
  external_sku: string;
  product_name?: string;
  brand_name?: string;
  category?: string;
  attributes?: Record<string, string>;
  image_urls?: string[];
}

export function ExternalSKUModal({ isOpen, onClose, onSubmit }: ExternalSKUModalProps) {
  const [formData, setFormData] = useState<ExternalSKUData>({
    external_sku: '',
    product_name: '',
    brand_name: '',
    category: '',
    attributes: {},
    image_urls: [],
  });

  const [attributeKey, setAttributeKey] = useState('');
  const [attributeValue, setAttributeValue] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddAttribute = () => {
    if (attributeKey && attributeValue) {
      setFormData({
        ...formData,
        attributes: {
          ...formData.attributes,
          [attributeKey]: attributeValue,
        },
      });
      setAttributeKey('');
      setAttributeValue('');
    }
  };

  const handleRemoveAttribute = (key: string) => {
    const newAttributes = { ...formData.attributes };
    delete newAttributes[key];
    setFormData({ ...formData, attributes: newAttributes });
  };

  const handleAddImage = () => {
    if (imageUrl && formData.image_urls) {
      setFormData({
        ...formData,
        image_urls: [...formData.image_urls, imageUrl],
      });
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      image_urls: formData.image_urls?.filter((_, i) => i !== index) || [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.external_sku) {
      alert('External SKU is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        external_sku: '',
        product_name: '',
        brand_name: '',
        category: '',
        attributes: {},
        image_urls: [],
      });
      onClose();
    } catch (error) {
      console.error('Error submitting external SKU:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Add External SKU for AI Enrichment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
         

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                External SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.external_sku}
                onChange={(e) => setFormData({ ...formData, external_sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., CLIENT-SKU-12345"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional - AI can generate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional - AI can suggest"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attributes (Optional)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={attributeKey}
                  onChange={(e) => setAttributeKey(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Attribute name"
                />
                <input
                  type="text"
                  value={attributeValue}
                  onChange={(e) => setAttributeValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Attribute value"
                />
                <button
                  type="button"
                  onClick={handleAddAttribute}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.attributes && Object.keys(formData.attributes).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(formData.attributes).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <span className="text-sm">
                        <strong>{key}:</strong> {value}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URLs (Optional)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.image_urls && formData.image_urls.length > 0 && (
                <div className="space-y-1">
                  {formData.image_urls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <span className="text-sm truncate flex-1">{url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Adding...' : 'Add External SKU'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}