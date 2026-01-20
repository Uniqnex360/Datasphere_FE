import { useEffect, useState } from 'react';
import {
  Plus,
  Settings,
  Download,
  Trash2,
  Upload,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Save,
  FileText,
  Filter,
  ArrowRight,
  Link as LinkIcon,
} from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { Channel, ChannelFieldMapping, ExportFilters } from '../types/channel';
import { ChannelAPI, MasterAPI } from '../lib/api';

type ViewMode = 'list' | 'mapping' | 'export';

const PIM_FIELDS = [
  'product_code',
  'product_name',
  'brand_code',
  'brand_name',
  'vendor_code',
  'vendor_name',
  'category_code',
  'category_1',
  'category_2',
  'category_3',
  'product_type',
  'description',
  'prod_short_desc',
  'prod_long_desc',
  'model_series',
  'mpn',
  'gtin',
  'upc',
  'unspc',
  'image_url_1',
  'image_url_2',
  'image_url_3',
  'image_url_4',
  'image_url_5',
  'meta_title',
  'meta_desc',
  'meta_keywords',
];

export function Channels() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [addChannelModal, setAddChannelModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; channel: Channel | null }>({
    isOpen: false,
    channel: null,
  });

  const [newChannel, setNewChannel] = useState({
    channel_name: '',
    template_file: null as File | null,
  });

  const [mappings, setMappings] = useState<ChannelFieldMapping[]>([]);
  const [exportFilters, setExportFilters] = useState<ExportFilters>({
    scope: 'all',
  });
  const [categories, setCategories] = useState<Array<{ category_code: string; category_name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ brand_code: string; brand_name: string }>>([]);
  const [industries, setIndustries] = useState<Array<{ industry_code: string; industry_name: string }>>([]);

  useEffect(() => {
    loadChannels();
    loadMetadata();
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    try {
      
      const data=await ChannelAPI.getAll()
      setChannels(data || []);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

 const loadMetadata = async () => {
    try {
      const [cats, brs, inds] = await Promise.all([
        MasterAPI.getCategories(),
        MasterAPI.getBrands(),
        MasterAPI.getIndustries(),
      ]);
      setCategories(cats || []);
      setBrands(brs || []);
      setIndustries(inds || []);
    } catch (error: any) {
      console.error('Error loading metadata:', error);
    }
  };

  const parseCSV = (text: string): string[] => {
    const lines = text.split('\n');
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map((h) => h.trim().replace(/['"]/g, ''));
    return headers.filter((h) => h.length > 0);
  };

   const handleAddChannel = async () => {
    if (!newChannel.channel_name || !newChannel.template_file) {
      setToast({ message: 'Please provide name and template', type: 'error' });
      return;
    }

    try {
      const headers = await parseCSVHeaders(newChannel.template_file);
      
      if (headers.length === 0) {
        setToast({ message: 'Invalid template file', type: 'error' });
        return;
      }

      // NEW: API Call
      await ChannelAPI.create({
          channel_name: newChannel.channel_name,
          template_headers: headers,
          channel_status: 'active'
      });

      setToast({ message: 'Channel added successfully', type: 'success' });
      setAddChannelModal(false);
      setNewChannel({ channel_name: '', template_file: null });
      loadChannels();
    } catch (error: any) {
      setToast({ message: "Failed to create channel", type: 'error' });
    }
  };

 const handleDeleteChannel = async () => {
    if (!deleteModal.channel) return;

    try {
      await ChannelAPI.delete(deleteModal.channel.id);

      setToast({ message: 'Channel deleted successfully', type: 'success' });
      setDeleteModal({ isOpen: false, channel: null });
      loadChannels();
    } catch (error: any) {
      setToast({ message: "Delete failed", type: 'error' });
    }
  };

  const loadMappings = async (channelId: string) => {
    try {
      // NEW: API Call
      const data = await ChannelAPI.getMappings(channelId);
      setMappings(data || []);
    } catch (error: any) {
      setToast({ message: "Failed to load mappings", type: 'error' });
    }
  };

  

  const handleOpenMapping = (channel: Channel) => {
    setSelectedChannel(channel);
    loadMappings(channel.id);
    setViewMode('mapping');
  };

  const handleOpenExport = (channel: Channel) => {
    setSelectedChannel(channel);
    loadMappings(channel.id);
    setViewMode('export');
  };

   const handleSaveMappings = async () => {
    if (!selectedChannel) return;

    try {
      await ChannelAPI.saveMappings(selectedChannel.id, mappings);

      setToast({ message: 'Mappings saved successfully', type: 'success' });
      setViewMode('list');
    } catch (error: any) {
      setToast({ message: "Save failed", type: 'error' });
    }
  };

  const handleAddMapping = () => {
    setMappings([
      ...mappings,
      {
        id: `temp-${Date.now()}`,
        channel_id: selectedChannel?.id || '',
        pim_field: '',
        channel_field: '',
        mapping_type: 'direct',
        is_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  };

  const handleUpdateMapping = (index: number, updates: Partial<ChannelFieldMapping>) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], ...updates };
    setMappings(updated);
  };

  const handleRemoveMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

   const handleExport = async () => {
    if (!selectedChannel) return;

    try {
      const blob = await ChannelAPI.exportFeed(selectedChannel.id, exportFilters);
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedChannel.channel_name}_feed.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setToast({ message: `Export generated successfully`, type: 'success' });
      loadChannels(); // Refresh last export date
    } catch (error: any) {
      setToast({ message: "Export failed", type: 'error' });
    }
  };

  if (viewMode === 'mapping' && selectedChannel) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode('list')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Field Mapping</h1>
              <p className="text-gray-600 mt-1">{selectedChannel.channel_name}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddMapping}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
              Add Mapping
            </button>
            <button
              onClick={handleSaveMappings}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={20} />
              Save Mappings
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Mapping Types</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Direct:</strong> Map PIM field directly to channel field</li>
            <li><strong>Static:</strong> Use a fixed value for all products</li>
            <li><strong>Concatenation:</strong> Combine multiple fields (e.g., {'{brand_name}'} - {'{product_name}'})</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    PIM Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mapping Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Channel Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Value / Pattern
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No mappings configured. Click "Add Mapping" to start.
                    </td>
                  </tr>
                ) : (
                  mappings.map((mapping, index) => (
                    <tr key={mapping.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <select
                          value={mapping.pim_field}
                          onChange={(e) => handleUpdateMapping(index, { pim_field: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select PIM Field</option>
                          {PIM_FIELDS.map((field) => (
                            <option key={field} value={field}>
                              {field}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={mapping.mapping_type}
                          onChange={(e) =>
                            handleUpdateMapping(index, {
                              mapping_type: e.target.value as 'direct' | 'static' | 'concatenation',
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="direct">Direct</option>
                          <option value="static">Static</option>
                          <option value="concatenation">Concatenation</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={mapping.channel_field}
                          onChange={(e) => handleUpdateMapping(index, { channel_field: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Channel Field</option>
                          {selectedChannel.template_headers.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {mapping.mapping_type === 'static' ? (
                          <input
                            type="text"
                            value={mapping.static_value || ''}
                            onChange={(e) => handleUpdateMapping(index, { static_value: e.target.value })}
                            placeholder="Enter static value"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : mapping.mapping_type === 'concatenation' ? (
                          <input
                            type="text"
                            value={mapping.concatenation_pattern || ''}
                            onChange={(e) =>
                              handleUpdateMapping(index, { concatenation_pattern: e.target.value })
                            }
                            placeholder="{field1} - {field2}"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">Auto-mapped</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={mapping.is_required}
                          onChange={(e) => handleUpdateMapping(index, { is_required: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRemoveMapping(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  if (viewMode === 'export' && selectedChannel) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode('list')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Export Products</h1>
              <p className="text-gray-600 mt-1">{selectedChannel.channel_name}</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={20} />
            Generate Export
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Scope</label>
              <select
                value={exportFilters.scope}
                onChange={(e) =>
                  setExportFilters({ ...exportFilters, scope: e.target.value as ExportFilters['scope'] })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Products</option>
                <option value="category">Filter by Category</option>
                <option value="brand">Filter by Brand</option>
                <option value="industry">Filter by Industry</option>
              </select>
            </div>

            {exportFilters.scope === 'category' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Category</label>
                <select
                  value={exportFilters.category_code || ''}
                  onChange={(e) => setExportFilters({ ...exportFilters, category_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a category</option>
                  {categories.map((cat) => (
                    <option key={cat.category_code} value={cat.category_code}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {exportFilters.scope === 'brand' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Brand</label>
                <select
                  value={exportFilters.brand_code || ''}
                  onChange={(e) => setExportFilters({ ...exportFilters, brand_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a brand</option>
                  {brands.map((brand) => (
                    <option key={brand.brand_code} value={brand.brand_code}>
                      {brand.brand_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {exportFilters.scope === 'industry' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Industry</label>
                <select
                  value={exportFilters.industry_code || ''}
                  onChange={(e) => setExportFilters({ ...exportFilters, industry_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an industry</option>
                  {industries.map((industry) => (
                    <option key={industry.industry_code} value={industry.industry_code}>
                      {industry.industry_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Preview</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Channel</span>
              <span className="font-medium">{selectedChannel.channel_name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Template Fields</span>
              <span className="font-medium">{selectedChannel.template_headers?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Mapped Fields</span>
              <span className="font-medium">{mappings.length}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Scope</span>
              <span className="font-medium capitalize">{exportFilters.scope}</span>
            </div>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Channels</h1>
          <p className="text-gray-600 mt-1">Manage marketplace integrations and export mappings</p>
        </div>
        <button
          onClick={() => setAddChannelModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Channel
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : channels.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No channels configured</h3>
          <p className="text-gray-600 mb-4">Add your first channel to start exporting product feeds</p>
          <button
            onClick={() => setAddChannelModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Channel
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Channel Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Products Mapped
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Export
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {channels.map((channel) => (
                <tr key={channel.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{channel.channel_name}</div>
                    <div className="text-sm text-gray-500">
                      {channel.template_headers?.length || 0} template fields
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {channel.channel_status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        <CheckCircle size={14} />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                        <XCircle size={14} />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {channel.products_mapped_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {channel.last_export_date
                      ? new Date(channel.last_export_date).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenMapping(channel)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Configure Mapping"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenExport(channel)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Export Feed"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, channel })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={addChannelModal}
        onClose={() => setAddChannelModal(false)}
        title="Add New Channel"
        actions={
          <>
            <button
              onClick={() => setAddChannelModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddChannel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Channel
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel Name</label>
            <input
              type="text"
              value={newChannel.channel_name}
              onChange={(e) => setNewChannel({ ...newChannel, channel_name: e.target.value })}
              placeholder="e.g., Amazon, eBay, Shopify"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Channel Template (CSV)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                Choose File
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) =>
                    setNewChannel({ ...newChannel, template_file: e.target.files?.[0] || null })
                  }
                  className="hidden"
                />
              </label>
              {newChannel.template_file && (
                <p className="text-sm text-gray-600 mt-2">{newChannel.template_file.name}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">Upload a CSV file with column headers</p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, channel: null })}
        title="Delete Channel"
        actions={
          <>
            <button
              onClick={() => setDeleteModal({ isOpen: false, channel: null })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteChannel}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{deleteModal.channel?.channel_name}</span>? This will also delete
          all field mappings and export history.
        </p>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
