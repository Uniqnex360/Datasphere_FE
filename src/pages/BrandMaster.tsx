import { useEffect, useState } from "react";
import {
  CheckCircle,
  Download,
  Edit,
  ImageIcon,
  Loader2,
  Plus,
  Search,
  Tag,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { Brand } from "../types/brand";
import Drawer from "../components/Drawer";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import DataTable from "../components/DataTable";
import { exportToCSV, parseCSV } from "../utils/csvHelper";
import { MasterAPI, ProductAPI } from "../lib/api";
import { generateEntityCode } from "../utils/codeGenerator";
import { validateImportFormat } from "../utils/importValidator";
import { clearFieldError, formatWebsiteUrl } from "../utils/formHelpers";
import CustomDownloadIcon from "../assets/download-custom.png";

export function BrandMaster() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [mfgLogoFile, setMfgLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    brand: Brand | null;
  }>({
    isOpen: false,
    brand: null,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("brand_code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const URL_REGEX =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const [formData, setFormData] = useState<Partial<Brand>>({
    brand_name: "",
    brand_logo: "",
    mfg_code: "",
    mfg_name: "",
    mfg_logo: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    filterAndSortBrands();
  }, [brands, searchTerm, sortKey, sortDirection]);
  useEffect(() => {
    return () => {
      if (formData.brand_logo?.startsWith("blob:")) {
        URL.revokeObjectURL(formData.brand_logo);
      }
      if (formData.mfg_logo?.startsWith("blob:")) {
        URL.revokeObjectURL(formData.mfg_logo);
      }
    };
  }, [formData.brand_logo, formData.mfg_logo]);
  const loadBrands = async () => {
    try {
      const data = await MasterAPI.getBrands();

      setBrands(data || []);
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBrands = () => {
    let filtered = [...brands];

    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.brand_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.mfg_name.toLowerCase().includes(searchTerm.toLowerCase())

      );
    }

    filtered.sort((a, b) => {
      const aVal = a[sortKey as keyof Brand] || "";
      const bVal = b[sortKey as keyof Brand] || "";
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredBrands(filtered);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const name = formData.brand_name?.trim() || "";
    const mfgName = formData.mfg_name?.trim() || "";
    const bLogo = formData.brand_logo?.trim() || "";
    const mLogo = formData.mfg_logo?.trim() || "";
    if (!name) newErrors.brand_name = "Brand name is required";
    if (!mfgName) newErrors.mfg_name = "Manufacturer name is required";
    const isDuplicate = brands.find(
      (b) =>
        b.brand_name.trim().toLowerCase() === name.toLowerCase() &&
        (!editingBrand || b.brand_code !== editingBrand.brand_code),
    );
    if (isDuplicate) {
      newErrors.brand_name = "A brand with this name already exists!";
    }
    if (bLogo && !bLogo.startsWith("blob:") && !URL_REGEX.test(bLogo)) {
      newErrors.brand_logo = "Invalid URL format for Brand Logo";
    }
    if (mLogo && !mLogo.startsWith("blob:") && URL_REGEX.test(mLogo)) {
      newErrors.mfg_logo = "Invalid URL format for Manufacturer Logo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBrandLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setToast({ message: "Only JPG,PNG, and WEBP allowed", type: "error" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setToast({ message: "File size must be under 5MB", type: "error" });
      return;
    }
    if (formData.brand_logo?.startsWith("blob:")) {
      URL.revokeObjectURL(formData.brand_logo);
    }
    setBrandLogoFile(file);
    setFormData((prev) => ({ ...prev, brand_logo: URL.createObjectURL(file) }));
    setErrors((prev) => ({ ...prev, brand_logo: "" }));
    e.target.value = "";
  };
  const handleRemoveBrandLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formData.brand_logo?.startsWith("blob:")) {
      URL.revokeObjectURL(formData.brand_logo);
    }
    setFormData((prev) => ({ ...prev, brand_logo: "" }));
    setBrandLogoFile(null);
  };
  const handleMfgLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mfgLogoFile) URL.revokeObjectURL(formData.mfg_logo!);
    setMfgLogoFile(file);
    setFormData((prev) => ({ ...prev, mfg_logo: URL.createObjectURL(file) }));
    e.target.value = "";
  };
  const handleRemoveMfgLogo = () => {
    if (formData.mfg_logo?.startsWith("blob:")) {
      URL.revokeObjectURL(formData.mfg_logo);
    }
    setFormData((prev) => ({ ...prev, mfg_logo: "" }));
    setMfgLogoFile(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    const name = formData.brand_name?.trim().toLowerCase();
    const duplicate = brands.find(
      (b) =>
        b.brand_name.trim().toLowerCase() === name &&
        (!editingBrand || b.brand_code !== editingBrand.brand_code),
    );
    if (duplicate) {
      setToast({ message: "Brand name already exists!", type: "error" });
      return;
    }
    try {
      const sanitized = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key,
          typeof value === "string" ? value.trim() : value ?? ""
        ])
      );
      if (typeof sanitized.brand_logo === 'string' && sanitized.brand_logo?.startsWith("blob:")) {
        sanitized.brand_logo = "";
      }
      if (typeof sanitized.mfg_logo === 'string' && sanitized.mfg_logo?.startsWith("blob:")) {
        sanitized.mfg_logo = "";
      }
      // if (!sanitized.brand_code && !editingBrand) {
      //   sanitized.brand_code = generateEntityCode(
      //     "brand",
      //     typeof sanitized.brand_name === 'string' ? sanitized.brand_name : "",
      //   );
      // }
       if (!editingBrand) {
      delete sanitized.brand_code;
      delete sanitized.mfg_code;
    }
      let payload: any = sanitized;
      if (brandLogoFile || mfgLogoFile) {
        const data = new FormData();
        Object.entries(sanitized).forEach(([key, val]) => {
          if (val !== null && val !== undefined) data.append(key, String(val));
        });
        if (brandLogoFile) data.append("brand_logo_file", brandLogoFile);
        if (mfgLogoFile) data.append("mfg_logo_file", mfgLogoFile);
        payload = data;
      }
      const name = formData.brand_name?.trim().toLowerCase();
      const duplicate = brands.find(
        (b) =>
          b.brand_name.trim().toLowerCase() === name &&
          (!editingBrand || b.brand_code !== editingBrand.brand_code),
      );
      if (duplicate) {
        setToast({ message: "Brand name already exists!", type: "error" });
        return;
      }
      if (editingBrand) {
        await MasterAPI.update("brands", editingBrand.brand_code, payload);
        setToast({ message: "Brand updated successfully", type: "success" });
      } else {
        // if (!(payload instanceof FormData)) {
        //   payload.brand_code = generateEntityCode(
        //     "brand",
        //     payload.brand_name || "",
        //   );
        // }
        // if (!(payload instanceof FormData)) {
        //   payload.mfg_code = generateEntityCode("mfg", payload.mfg_name || "");
        // }

        await MasterAPI.create("brands", payload);
        setToast({ message: "Brand added successfully", type: "success" });
      }

      setIsDrawerOpen(false);
      setEditingBrand(null);
      resetForm();
      loadBrands();
    } catch (error: any) {
      console.log("Error data:", error.response?.data);

      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Request failed";
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };
  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData(brand);
    setErrors({});
    setIsDrawerOpen(true);
  };
  const clearErrors = (fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };
  const handleDelete = async () => {
    console.log("brandmodela", deleteModal);
    if (!deleteModal.brand) return;
    const code = deleteModal.brand.brand_code || deleteModal.brand.id;
    if (!code) {
      setToast({ message: "Error: Brand Code is missing", type: "error" });
      return;
    }
    try {
      const products = await ProductAPI.getAll(0, 1, {
        brand_code: deleteModal.brand.brand_code,
      });

      console.log("Products found for this brand:", products);

      const linkedProducts = products.filter(
        (p: any) => p.brand_code === deleteModal.brand?.brand_code,
      );

      if (linkedProducts.length > 0) {
        setToast({
          message: `Cannot delete. ${linkedProducts.length} product(s) are still using this brand.`,
          type: "error",
        });
        setDeleteModal({ isOpen: false, brand: null });
        return;
      }
      await MasterAPI.delete("brands", code);

      setToast({ message: "Brand deleted successfully", type: "success" });
      setDeleteModal({ isOpen: false, brand: null });
      loadBrands();
    } catch (error: any) {
      setToast({
        message: error.message || "Failed to delete brand",
        type: "error",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      brand_code: "",
      brand_name: "",
      brand_logo: "",
      mfg_code: "",
      mfg_name: "",
      mfg_logo: "",
    });
    setBrandLogoFile(null);
    setMfgLogoFile(null);
    setErrors({});
  };

  const handleExport = () => {
    if (filteredBrands.length === 0) {
      setToast({ message: "No data to export", type: "error" });
      return;
    }
    exportToCSV(filteredBrands, "brands.csv");
    setToast({ message: "Brands exported successfully", type: "success" });
  };
  const handleToggleStatus = async (brand: Brand) => {
    try {
      setLoading(true);
      await MasterAPI.update("brands", brand.brand_code, {
        is_active: !brand.is_active,
      });
      setToast({
        message: `Vendor "${brand.brand_name}" is now ${!brand.is_active ? "Active" : "Inactive"}`,
        type: "success",
      });
      loadBrands();
    } catch (error) {
      setToast({ message: "Failed to update status", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseCSV(file);
      const validData: Partial<Brand>[] = [];
      const ignoredItems: string[] = [];
      const importErrors: string[] = [];
      const validColumns = [
        "brand_code",
        "brand_name",
        "brand_logo",
        "brand_website",
        "mfg_code",
        "mfg_name",
        "mfg_logo",
        "manufacturer_website",
      ];
      const validation = validateImportFormat(data, validColumns);
      if (!validation.isValid) {
        setToast({
          message: validation.errorMessage || "Import failed!",
          type: "error",
        });
        e.target.value = "";
        return;
      }

      data.forEach((row, index) => {
        const rowErrors: string[] = [];

        if (!row.brand_name?.trim()) {
          rowErrors.push("brand_name is required");
        }
        const existingBrand = brands.find(
          (b) =>
            b.brand_name.trim().toLowerCase() ===
            row.brand_name?.trim().toLowerCase(),
        );
        if (existingBrand) {
          ignoredItems.push(
            `Row ${index + 2}:"${row.brand_name}"(already exists!)`,
          );
        }
        const duplicateInImport = validData.find(
          (item) =>
            item.brand_name?.trim().toLowerCase() ===
            row.brand_name?.trim().toLowerCase(),
        );
        if (duplicateInImport) {
          ignoredItems.push(
            `Row ${index + 2}:"${row.brand_name}"(duplicate in file!)`,
          );
          return;
        }
        if (rowErrors.length > 0) {
          importErrors.push(`Row ${index + 2}: ${rowErrors.join(", ")}`);
        } else {
          const brandData: any = {};
          validColumns.forEach((col) => {
            if (row[col] !== undefined && row[col] !== "") {
              brandData[col] = row[col];
            }

          });

          // if (
          //   brandData.brand_code === "" ||
          //   brandData.brand_code === undefined
          // ) {
          //   brandData.brand_code = generateEntityCode(
          //     "brand",
          //     brandData.brand_name || "",
          //   );
          // }
          validData.push(brandData);
        }
      });

      if (importErrors.length > 0) {
        setToast({
          message: `Import failed: ${importErrors.join("; ")}`,
          type: "error",
        });
        return;
      }
      if (validData.length === 0) {
        const totalRows = data.length;
        const ignoredCount = ignoredItems.length;
        setToast({
          message: `No new brands to import.${totalRows} total rows,${ignoredCount} ignored(already exist or duplicates)`,
          type: "error",
        });
        e.target.value = "";
        return;
      }
      let successCount = 0;
      let failedCount = 0;
      const failedItems: string[] = [];
      for (let i = 0; i < validData.length; i++) {
        const brand = validData[i];
        try {
          await MasterAPI.create("brands", brand);
          successCount++;
        } catch (error) {
          failedCount++;
          const errorDetail =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            error.message ||
            "Unknown error";
          failedItems.push(`${brand.brand_name}:${errorDetail}`);
        }
      }

      const totalRows = data.length;
      const ignoredCount = ignoredItems.length;
      const processedCount = validData.length;
      if (failedCount === 0 && ignoredCount === 0) {
        setToast({
          message: `Import successful!${successCount} brands added from ${totalRows} rows!`,
          type: "success",
        });
      } else if (failedCount === 0 && ignoredCount > 0) {
        setToast({
          message: `Import completed! ${successCount} brands added, ${ignoredCount} ignored (already exist). Total rows: ${totalRows}`,
          type: "success",
        });
      } else if (successCount > 0) {
        setToast({
          message: ` Partial import: ${successCount} added, ${failedCount} failed, ${ignoredCount} ignored. Total rows: ${totalRows}. Failed: ${failedItems.join(
            "; ",
          )}`,
          type: "error",
        });
      } else {
        setToast({
          message: ` Import failed: ${failedCount} failed, ${ignoredCount} ignored. Total rows: ${totalRows}. Errors: ${failedItems.join(
            "; ",
          )}`,
          type: "error",
        });
      }
      loadBrands();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    }

    e.target.value = "";
  };

  const downloadTemplate = () => {
    const template = [
      {
        brand_name: "Example Brand",
        brand_logo: "https://example.com/brand-logo.png",
        mfg_code: "MFG001",
        mfg_name: "Example Manufacturer",
        mfg_logo: "https://example.com/mfg-logo.png",
      },
    ];
    exportToCSV(template, "brand_import_template.csv");
  };

  const columns = [
    {
      key: "brand_logo",
      label: "Brand Logo",
      sortable: false,
      width: "150px",
      render: (value: string) =>
        value ? (
          <img
            src={value}
            alt="Brand logo"
            className="h-8 w-8 object-contain"
          />
        ) : (
          <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
            <Tag size={16} className="text-gray-400" />
          </div>
        ),
    },
    { key: "brand_name", label: "Brand Name", sortable: true, width: "100px", },
    {
      key: "mfg_logo",
      width: "100px",
      label: "Mfg Logo",
      sortable: false,
      render: (value: string) =>
        value ? (
          <img src={value} alt="Mfg logo" className="h-8 w-8 object-contain" />
        ) : (
          <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
            <Tag size={16} className="text-gray-400" />
          </div>
        ),
    },
    { key: "mfg_name", label: "Manufacturer", sortable: true, width: "100px", },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      width: "120px",
      render: (val: boolean) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${val
            ? "bg-green-50 text-green-700 border border-green-100"
            : "bg-red-50 text-red-700 border border-red-100"
            }`}
        >
          {val ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      width: "20px",
      render: (_: any, row: Brand) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            className={`p-1.5 rounded-lg transition-colors ${row.is_active
              ? "hover:bg-red-100 text-green-600"
              : "hover:bg-green-100 text-red-600"
              }`}
            title={row.is_active ? "Deactivate Brand" : "Activate Brand"}
          >
            {row.is_active ? <CheckCircle size={16} /> : <XCircle size={16} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between -mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Master</h1>
          <p className="text-gray-600 mt-1">
            Manage brand and manufacturer information
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1 justify-end">
          <div className="relative w-full md:w-[500px] lg:w-[600px] transition-all duration-300">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search Brand"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                clearFieldError("vendor_name", setErrors);
              }}
              className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-full text-base shadow-sm hover:shadow-md focus:shadow-md focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-gray-400 italic"
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
              setEditingBrand(null);
              resetForm();
              setIsDrawerOpen(true);
            }}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-100 font-bold whitespace-nowrap"
          >
            <Plus size={20} />
            Add Brand
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={16} /> Export
            </button>

            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">                  <Upload size={16} /> Import
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Download CSV Template"
            >
              <img
                src={CustomDownloadIcon}
                className="w-5 h-5 object-contain opacity-70 hover:opacity-100"
                alt="Template"
              />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500 italic">
          {searchTerm ? (
            <span>
              Showing <strong>{filteredBrands.length}</strong> matching results
              out of {brands.length} total brands
            </span>
          ) : (
            <span>
              Showing all <strong>{brands.length}</strong> brands
            </span>
          )}
        </p>

        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Clear search
          </button>
        )}
      </div>
      <DataTable
        columns={columns}
        data={filteredBrands}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={(key) => {
          if (sortKey === key) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
          } else {
            setSortKey(key);
            setSortDirection("asc");
          }
        }}
        isLoading={loading}
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingBrand(null);
          resetForm();
        }}
        title={editingBrand ? "Edit Brand" : "Add Brand"}
      >
        <div className="h-full flex flex-col">

          <div className="flex-1 p-6 pb-15 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              {editingBrand && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Code
                  </label>
                  <input
                    type="text"
                    value={formData.brand_code || ""}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />

                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.brand_name}
                  onChange={(e) => {
                    setFormData({ ...formData, brand_name: e.target.value });

                    clearFieldError("brand_name", setErrors);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.brand_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.brand_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Logo
                </label>
                <div className="flex gap-2 items-start">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <ImageIcon size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder={
                        brandLogoFile
                          ? "Image File Selected"
                          : "https://example.com/logo.png"
                      }
                      value={
                        brandLogoFile
                          ? `File: ${brandLogoFile.name}`
                          : formData.brand_logo
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, brand_logo: e.target.value })
                      }
                      disabled={!!brandLogoFile}
                      className={`w-full pl-9 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${brandLogoFile
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "border-gray-300"
                        }`}
                    />
                    {(formData.brand_logo || brandLogoFile) && (
                      <button
                        type="button"
                        onClick={handleRemoveBrandLogo}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                        title="Remove Logo"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white h-[42px]">
                    <Upload size={18} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Upload
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBrandLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.brand_logo && (
                  <div className="mt-3">
                    <span className="text-xs text-gray-500 mb-1 block">
                      Preview:
                    </span>
                    <div className="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-2 relative group">
                      <img
                        src={formData.brand_logo}
                        alt="Logo Preview"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          e.currentTarget.parentElement!.innerHTML =
                            '<span class="text-xs text-red-400 text-center">Invalid Image</span>';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={formData.brand_website}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      brand_website: e.target.value,
                    });
                    clearFieldError("vendor_website", setErrors);
                  }}
                  onBlur={(e) => {
                    const formatted = formatWebsiteUrl(e.target.value);
                    setFormData({ ...formData, brand_website: formatted });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example.com"
                />
                {errors.vendor_website && (
                  <div className="text-red-500 text-sm mt-1">
                    {errors.vendor_website}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* <h3 className="font-semibold text-gray-900">
                  Manufacturer Information
                </h3> */}
              <div className="space-y-4">
                {editingBrand && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer Code
                    </label>
                    <input
                      type="text"
                      value={formData.mfg_code}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer Name
                  </label>
                  <input
                    type="text"
                    value={formData.mfg_name}
                    onChange={(e) => {
                      setFormData({ ...formData, mfg_name: e.target.value });
                      clearFieldError("mfg_name", setErrors);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.mfg_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.mfg_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer Logo
                  </label>
                  <div className="flex gap-2 items-start">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <ImageIcon size={16} />
                      </div>
                      <input
                        type="text"
                        value={
                          mfgLogoFile
                            ? `File: ${mfgLogoFile.name}`
                            : formData.mfg_logo
                        }
                        onChange={(e) =>
                          setFormData({ ...formData, mfg_logo: e.target.value })
                        }
                        disabled={!!mfgLogoFile}
                        placeholder={
                          mfgLogoFile
                            ? "Image File Selected"
                            : "https://example.com/logo.png"
                        }
                        className={`w-full pl-9 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${mfgLogoFile
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : "border-gray-300"
                          }`}
                      />
                      {(formData.mfg_logo || mfgLogoFile) && (
                        <button
                          type="button"
                          onClick={handleRemoveMfgLogo}
                          title="Remove Logo"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white h-[42px]">
                      <Upload size={18} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Upload
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMfgLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {formData.mfg_logo && (
                    <div className="mt-3">
                      <span className="text-xs text-gray-500 mb-1 block">
                        Preview:
                      </span>
                      <div className="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-2 relative group">
                        <img
                          src={formData.mfg_logo}
                          alt="Mfg logo preview"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            e.currentTarget.parentElement!.innerHTML =
                              '<span class="text-xs text-red-400 text-center">Invalid Image</span>';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer_website}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        manufacturer_website: e.target.value,
                      });
                      clearFieldError("manufacturer_website", setErrors);
                    }}
                    onBlur={(e) => {
                      const formatted = formatWebsiteUrl(e.target.value);
                      setFormData({
                        ...formData,
                        manufacturer_website: formatted,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="example.com"
                  />
                  {errors.manufacturer_website && (
                    <div className="text-red-500 text-sm mt-1">
                      {errors.manufacturer_website}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 top left-0 right-0 bg-white border-t border-gray-200 p-6  shadow-lg flex gap-3">
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                setEditingBrand(null);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${submitting
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-blue-700"
                }`}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>{editingBrand ? "Update" : "Add"}</>
              )}
            </button>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, brand: null })}
        title="Delete Brand"
        actions={
          <>
            <button
              onClick={() => setDeleteModal({ isOpen: false, brand: null })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete brand{" "}
          <span className="font-semibold">{deleteModal.brand?.brand_name}</span>
          ? This action cannot be undone.
        </p>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
