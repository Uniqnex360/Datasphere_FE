import { useEffect, useState } from 'react';
import { Upload, Trash2, ImageIcon, FileText, Film, File, FolderOpen, ExternalLink, AlertCircle } from 'lucide-react';
import { DigitalAssetAPI } from '../lib/api';

// Configure your Cloudinary credentials here
const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_API_KEY_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_PRESET_NAME
};

interface DigitalAsset {
  id: string;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'video' | 'document';
  file_size: number;
  created_at: string;
  public_id: string;
  user_id: string;
}

export default function DigitalAssets() {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; asset: DigitalAsset | null }>({
    isOpen: false,
    asset: null,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadAssets();
    }
  }, []);

  
 

  const loadAssets = async () => {

    setLoading(true);
    try {

      const data=await DigitalAssetAPI.getAll()


      setAssets(data || []);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to load assets', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (fileName: string): 'image' | 'video' | 'document' => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const videoFormats = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv'];
    
    if (imageFormats.includes(ext)) return 'image';
    if (videoFormats.includes(ext)) return 'video';
    return 'document';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;



    if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset || 
        CLOUDINARY_CONFIG.cloudName === 'your-cloud-name') {
      setToast({ 
        message: 'Please configure Cloudinary settings in the code', 
        type: 'error' 
      });
      return;
    }

    setUploading(true);
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Upload failed');
      }

      const cloudinaryData = await response.json();
      
      // Save metadata to Supabase
      const assetData = {
        file_name: cloudinaryData.original_filename || file.name,
        file_url: cloudinaryData.secure_url,
        file_type: getFileType(cloudinaryData.format || file.name),
        file_size: cloudinaryData.bytes,
        public_id: cloudinaryData.public_id,
        created_at: new Date().toISOString(),
      };

     await DigitalAssetAPI.create(assetData);

      setToast({ message: 'File uploaded successfully', type: 'success' });
      setUploadModal(false);
      loadAssets();
    } catch (error: any) {
      setToast({ message: error.message || 'Upload failed', type: 'error' });
    } finally {
      setUploading(false);
    }

    e.target.value = '';
  };

  const handleDelete = async () => {
    if (!deleteModal.asset) return;

    try {
     await DigitalAssetAPI.delete(deleteModal.asset.id);

      setToast({ 
        message: 'Asset deleted successfully.', 
        type: 'success' 
      });
      setDeleteModal({ isOpen: false, asset: null });
      loadAssets();
    } catch (error: any) {
      setToast({ message: error.message || 'Delete failed', type: 'error' });
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (filterType === 'all') return true;
    return asset.file_type === filterType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={20} className="text-blue-600" />;
      case 'video':
        return <Film size={20} className="text-green-600" />;
      case 'document':
        return <FileText size={20} className="text-orange-600" />;
      default:
        return <File size={20} className="text-gray-600" />;
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setToast({ message: 'URL copied to clipboard', type: 'success' });
  };

  // if (!currentUser) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="text-center">
  //         <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
  //         <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
  //         <p className="text-gray-600">Please log in to manage digital assets</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Digital Assets</h1>
          <p className="text-gray-600 mt-1">
            Manage product images, videos, and documents using Cloudinary
          </p>
        </div>
        <button
          onClick={() => setUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload size={20} />
          Upload Asset
        </button>
      </div>

      {(!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset || 
        CLOUDINARY_CONFIG.cloudName === 'your-cloud-name' || 
        CLOUDINARY_CONFIG.uploadPreset === 'your-upload-preset') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-yellow-900">Configuration Required</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Please update the CLOUDINARY_CONFIG at the top of the file with your:
              </p>
              <ul className="text-sm text-yellow-800 mt-2 ml-4 list-disc space-y-1">
                <li><strong>cloudName</strong>: Your Cloudinary cloud name</li>
                <li><strong>uploadPreset</strong>: Create an unsigned upload preset in Cloudinary Dashboard</li>
              </ul>
              <p className="text-sm text-yellow-800 mt-2">
                Also create a <strong>digital_assets</strong> table in Supabase with columns: id (uuid), file_name (text), 
                file_url (text), file_type (text), file_size (bigint), public_id (text), user_id (uuid), created_at (timestamp)
              </p>
            </div>
          </div>
        </div>
      )}

    

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by type:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({assets.length})
            </button>
            <button
              onClick={() => setFilterType('image')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === 'image'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Images ({assets.filter((a) => a.file_type === 'image').length})
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === 'video'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Videos ({assets.filter((a) => a.file_type === 'video').length})
            </button>
            <button
              onClick={() => setFilterType('document')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === 'document'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Documents ({assets.filter((a) => a.file_type === 'document').length})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No assets found</h3>
          <p className="text-gray-600 mb-4">Upload your first asset to get started</p>
          <button
            onClick={() => setUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload size={20} />
            Upload Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {asset.file_type === 'image' ? (
                  <img
                    src={asset.file_url}
                    alt={asset.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-8">{getIcon(asset.file_type)}</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start gap-2 mb-2">
                  {getIcon(asset.file_type)}
                  <h3 className="text-sm font-medium text-gray-900 truncate flex-1">
                    {asset.file_name}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">{formatFileSize(asset.file_size)}</p>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => copyToClipboard(asset.file_url)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                  >
                    Copy URL
                  </button>
                  <a
                    href={asset.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink size={12} />
                    View
                  </a>
                </div>
                <button
                  onClick={() => setDeleteModal({ isOpen: true, asset })}
                  className="w-full p-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Digital Asset</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select an image, video, or document to upload to Cloudinary.
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  {uploading ? 'Uploading...' : 'Choose File'}
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">Maximum file size: 10MB (Free tier)</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setUploadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Asset</h2>
            <p className="text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteModal.asset?.file_name}</span>?
            </p>
    
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setDeleteModal({ isOpen: false, asset: null })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white max-w-md`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 text-white hover:text-gray-200 text-xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}