import { useRef, useEffect, useState } from "react";
import {
  Upload,
  Search,
  X,
  Archive,
  ImageIcon,
  FileText,
  Film,
  File,
  FolderOpen,
  ExternalLink,
  AlertCircle,
  LayoutGrid,
  List,
} from "lucide-react";
import { DigitalAssetAPI, MasterAPI } from "../lib/api";
import DataTable from "../components/DataTable";

const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_API_KEY_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_PRESET_NAME,
};

interface DigitalAsset {
  id: string;
  file_name: string;
  file_url: string;
  file_type: "image" | "video" | "document";
  file_size: number;
  created_at: string;
  public_id: string;
  user_id: string;
  is_archived?: boolean;
  mpn?: string;
  brand?: string;
  category?: string;
}

type BrandMeta = {
  id: string;
  name: string;
};

export default function DigitalAssets() {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [archiveModal, setArchiveModal] = useState<{
    isOpen: boolean;
    asset: DigitalAsset | null;
  }>({
    isOpen: false,
    asset: null,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const heighDiv = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);
  const [isGridView, setIsGridView] = useState(true);

  // filter brands states
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");

  const loadBrandData = async () => {
    const data: BrandMeta[] = await MasterAPI.getBrandMeta();
    const brandName = data.map((brand) => brand.name);
    setBrands(brandName);
  };
  // filter category states
  const [category, setCategories] = useState<CategoryMeta[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  type CategoryMeta = {
    id: string;
    code: string;
    value: string;
  };

  const loadCategoryData = async () => {
    // Make the function async
    try {
      const data: CategoryMeta[] = await MasterAPI.getCategorymeta();

      // Map to objects with only code and value
      const category = data.map((category) => ({
        id: category.id,
        code: category.code,
        value: category.value,
      }));

      setCategories(category);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const updateHeight = () => {
    if (heighDiv.current) {
      const top = heighDiv.current.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      setHeight(Math.floor(windowHeight - top)); // remaining height
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const delayDebounce = setTimeout(() => {
      loadAssets();
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  useEffect(() => {
    loadAssets();
  }, [selectedBrand, selectedCategory]);

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
      loadAssets();
      loadBrandData();
      loadCategoryData();
    }
  }, []);

  useEffect(() => {
    // delay to let DOM paint

    updateHeight(); // calculate after DOM has rendered

    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, [assets]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await DigitalAssetAPI.getAll({
        search: searchTerm,
        brand_name: selectedBrand,
        category: selectedCategory,
      });
      setAssets(data || []);
    } catch (error: any) {
      setToast({
        message: error.message || "Failed to load assets",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (fileName: string): "image" | "video" | "document" => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const imageFormats = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "bmp",
      "ico",
    ];
    const videoFormats = ["mp4", "mov", "avi", "webm", "mkv", "flv", "wmv"];

    if (imageFormats.includes(ext)) return "image";
    if (videoFormats.includes(ext)) return "video";
    return "document";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !CLOUDINARY_CONFIG.cloudName ||
      !CLOUDINARY_CONFIG.uploadPreset ||
      CLOUDINARY_CONFIG.cloudName === "your-cloud-name"
    ) {
      setToast({
        message: "Please configure Cloudinary settings in the code",
        type: "error",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Upload failed");
      }

      const cloudinaryData = await response.json();

      // Save metadata to Supabase
      const assetData = {
        file_name: cloudinaryData.original_filename || file.name,
        file_url: cloudinaryData.secure_url,
        file_type: getFileType(cloudinaryData.format || file.name),
        file_size: cloudinaryData.bytes,
        public_id: cloudinaryData.public_id,
      };

      await DigitalAssetAPI.create(assetData);

      setToast({ message: "File uploaded successfully", type: "success" });
      setUploadModal(false);
      loadAssets();
    } catch (error: any) {
      setToast({ message: error.message || "Upload failed", type: "error" });
    } finally {
      setUploading(false);
    }

    e.target.value = "";
  };

  const handleArchive = async () => {
    if (!archiveModal.asset) return;

    try {
      await DigitalAssetAPI.archive(archiveModal.asset.id);

      setToast({
        message: "Asset archived successfully.",
        type: "success",
      });
      setArchiveModal({ isOpen: false, asset: null });
      loadAssets();
    } catch (error: any) {
      setToast({ message: error.message || "Delete failed", type: "error" });
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (filterType === "all") return true;
    return asset.file_type === filterType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon size={20} className="text-blue-600" />;
      case "video":
        return <Film size={20} className="text-green-600" />;
      case "document":
        return <FileText size={20} className="text-orange-600" />;
      default:
        return <File size={20} className="text-gray-600" />;
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setToast({ message: "URL copied to clipboard", type: "success" });
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

  const columns = [
    {
      key: "image",
      label: "Image",
      render: (_: any, row: DigitalAsset) => {
        if (!row?.file_url) {
          return "N/A";
        }

        return (
          <img
            src={row?.file_url}
            alt={row?.file_name || "Asset Image"}
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        );
      },
    },
    {
      key: "file_name",
      label: "Name",
      customTruncate: true,
      truncateLength: 15,
    },
    { key: "file_type", label: "File Type" },
    { key: "mpn", label: "MPN" },
    { key: "brand", label: "Brand" },
    { key: "category", label: "Category" },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_: any, row: DigitalAsset) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setArchiveModal({ isOpen: true, asset: row })}
            className="p-1 hover:bg-gray-100 text-gray-600 rounded transition-colors"
            title="Archive"
          >
            <Archive size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <div className="sticky top-0 z-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Digital Assets
              </h1>
              <p className="text-gray-600 mt-1">
                Manage product images, videos, and documents using Cloudinary
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1 justify-end">
              <div className="relative w-full md:w-[400px] lg:w-[500px] transition-all duration-300">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search image names..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-full text-base shadow-sm hover:shadow-md focus:shadow-md focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setUploadModal(true);
                }}
                className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-100 font-bold whitespace-nowrap"
              >
                <Upload size={20} />
                Upload Asset
              </button>
            </div>
            {/* <button
          onClick={() => setUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload size={20} />
          Upload Asset
        </button> */}
          </div>

          {(!CLOUDINARY_CONFIG.cloudName ||
            !CLOUDINARY_CONFIG.uploadPreset ||
            CLOUDINARY_CONFIG.cloudName === "your-cloud-name" ||
            CLOUDINARY_CONFIG.uploadPreset === "your-upload-preset") && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-yellow-900">
                    Configuration Required
                  </h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    Please update the CLOUDINARY_CONFIG at the top of the file
                    with your:
                  </p>
                  <ul className="text-sm text-yellow-800 mt-2 ml-4 list-disc space-y-1">
                    <li>
                      <strong>cloudName</strong>: Your Cloudinary cloud name
                    </li>
                    <li>
                      <strong>uploadPreset</strong>: Create an unsigned upload
                      preset in Cloudinary Dashboard
                    </li>
                  </ul>
                  <p className="text-sm text-yellow-800 mt-2">
                    Also create a <strong>digital_assets</strong> table in
                    Supabase with columns: id (uuid), file_name (text), file_url
                    (text), file_type (text), file_size (bigint), public_id
                    (text), user_id (uuid), created_at (timestamp)
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 mt-[-5]">
            <div className="flex items-center gap-4 justify-between">
              <div className="flex gap-4 justify-center items-center">
                <label className="text-sm font-medium text-gray-700">
                  Filter by type:
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterType === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All ({assets.length})
                  </button>
                  <button
                    onClick={() => setFilterType("image")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterType === "image"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Images (
                    {assets.filter((a) => a.file_type === "image").length})
                  </button>
                  <button
                    onClick={() => setFilterType("video")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterType === "video"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Videos (
                    {assets.filter((a) => a.file_type === "video").length})
                  </button>
                  <button
                    onClick={() => setFilterType("document")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterType === "document"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Documents (
                    {assets.filter((a) => a.file_type === "document").length})
                  </button>
                </div>

                {/* filters */}
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Brands</option>

                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand.toUpperCase()}
                    </option>
                  ))}
                </select>

                {/* category filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border max-w-40 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Category</option>

                  {category.map((c) => (
                    <option key={c?.id} value={c?.code}>
                      {c?.value}
                    </option>
                  ))}
                </select>
              </div>

              {/* list grid view toggle */}
              <div className="flex items-center justify-center mx-4 space-x-2">
                <button
                  onClick={() => setIsGridView(true)}
                  className={`p-2 rounded flex items-center justify-center transition-colors ${
                    isGridView
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <LayoutGrid size={20} />
                </button>

                <button
                  onClick={() => setIsGridView(false)}
                  className={`p-2 rounded flex items-center justify-center transition-colors ${
                    !isGridView
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <List size={20} />
                </button>
              </div>

              {/* <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isGridView}
                  onChange={() => setIsGridView(!isGridView)}
                />
                <div className="w-10 h-5 bg-gray-300 rounded-full relative peer-checked:bg-blue-500 transition-colors">
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                      isGridView ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
                {/* <span className="ml-3 text-sm font-medium text-gray-800">
                  {isGridView ? "List" : "Grid"}
                </span> 
              </label> */}
            </div>
            <div className="flex items-center justify-between p-1">
              <p className="text-sm text-gray-500 italic">
                {searchTerm || selectedBrand || selectedCategory ? (
                  <span>
                    Showing <strong>{filteredAssets.length}</strong> matching
                    results out of {assets.length} total assets
                  </span>
                ) : (
                  <span>
                    Showing all <strong>{assets.length}</strong> assets
                  </span>
                )}
              </p>
              {(searchTerm || selectedBrand || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedBrand("");
                    setSelectedCategory("");
                  }}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Clear all filters
                </button>
              )}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No assets found
            </h3>
            <p className="text-gray-600 mb-4">
              Upload your first asset to get started
            </p>
            <button
              onClick={() => setUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload size={20} />
              Upload Asset
            </button>
          </div>
        ) : isGridView ? (
          <div ref={heighDiv} style={{ maxHeight: height, overflowY: "auto" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mt-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    {asset.file_type === "image" ? (
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
                    <p className="text-xs text-gray-500 mb-3">
                      {formatFileSize(asset.file_size)}
                    </p>
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
                      onClick={() => setArchiveModal({ isOpen: true, asset })}
                      className="w-full p-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <Archive size={14} />
                      {asset?.is_archived ? "Un Archive" : "Archive"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredAssets}
            isLoading={loading}
          />
        )}
      </div>

      {uploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Upload Digital Asset
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select an image, video, or document to upload to Cloudinary.
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  {uploading ? "Uploading..." : "Choose File"}
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 10MB (Free tier)
                </p>
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

      {archiveModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {archiveModal.asset?.is_archived
                ? "Un Archive Asset"
                : "Archive Asset"}
            </h2>
            <p className="text-gray-600">
              Are you sure you want to{" "}
              {archiveModal.asset?.is_archived ? "Un Archive" : "Archive"}{" "}
              <span className="font-semibold">
                {archiveModal.asset?.file_name}
              </span>
              ?
            </p>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setArchiveModal({ isOpen: false, asset: null })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {archiveModal.asset?.is_archived ? "Un Archive" : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
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
