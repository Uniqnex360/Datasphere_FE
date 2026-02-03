import { useEffect, useState } from "react";
import {
  Building2,
  Download,
  Edit,
  ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Vendor } from "../types/vendor";
import Drawer from "../components/Drawer";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import DataTable from "../components/DataTable";
import { exportToCSV, parseCSV } from "../utils/csvHelper";
import { DigitalAssetAPI, MasterAPI, ProductAPI } from "../lib/api";
import { generateEntityCode } from "../utils/codeGenerator";
import { validateImportFormat } from "../utils/importValidator";
const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "China",
  "Japan",
  "India",
  "Brazil",
  "Mexico",
  "Italy",
  "Spain",
  "Netherlands",
  "Switzerland",
  "Sweden",
  "Other",
];
const DEFAULT_INDUSTRIES = [
  "HVAC",
  "Furniture",
  "Electrical",
  "Safety Supplies",
  "Hardware",
  "Tools & Equipments",
  "Plumbing",
  "Home Improvements",
  "Home & Decor",
  "Industrial Supplies",
];
export function VendorMaster() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    vendor: Vendor | null;
    isDeleting: boolean;
  }>({ isOpen: false, vendor: null, isDeleting: false });
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [submitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [sortKey, setSortKey] = useState("vendor_code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
const PHONE_REGEX = /^\+?[0-9\s\-\(\)]{7,20}$/; 
const MAX_FILE_SIZE = 5 * 1024 * 1024; 
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const [isCustomIndustry, setIsCustomIndustry] = useState(false);
  const [industryOptions, setIndustryOptions] =
    useState<string[]>(DEFAULT_INDUSTRIES);

  const [isCustomCountry, setCustomCountry] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState<Partial<Vendor>>({
    vendor_name: "",
    contact_email: "",
    contact_phone: "",
    vendor_website: "",
    business_type: "",
    industry: "",
    description: "",
    address: "",
    city: "",
    country: "",
    tax_info: "",
    vendor_logo_url: "",
    dept1_poc_name: "",
    dept1_email: "",
    dept1_phone: "",
    dept2_poc_name: "",
    dept2_email: "",
    dept2_phone: "",
    dept3_poc_name: "",
    dept3_email: "",
    dept3_phone: "",
    dept4_poc_name: "",
    dept4_email: "",
    dept4_phone: "",
    dept5_poc_name: "",
    dept5_email: "",
    dept5_phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    loadVendors();
  }, []);
  useEffect(() => {
    filterAndSortVendors();
  }, [
    vendors,
    searchTerm,
    businessTypeFilter,
    industryFilter,
    sortKey,
    sortDirection,
  ]);
    // Cleanup object URLs when component unmounts or logo changes
  useEffect(() => {
    return () => {
      if (formData.vendor_logo_url?.startsWith('blob:')) {
        URL.revokeObjectURL(formData.vendor_logo_url);
      }
    };
  }, [formData.vendor_logo_url]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await MasterAPI.getVendors();
      setVendors(data || []);
      if (data) {
        const usedIndustries = data
          .map((v: Vendor) => v.industry)
          .filter((i): i is string => !!i);
        const merged = Array.from(
          new Set([...DEFAULT_INDUSTRIES, ...usedIndustries]),
        ).sort();
        setIndustryOptions(merged);
      }
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };
  const filterAndSortVendors = () => {
    let filtered = [...vendors];
    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.vendor_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (businessTypeFilter) {
      filtered = filtered.filter((v) => v.business_type === businessTypeFilter);
    }
    if (industryFilter) {
      filtered = filtered.filter((v) => v.industry === industryFilter);
    }
    filtered.sort((a, b) => {
      const aVal = a[sortKey as keyof Vendor] || "";
      const bVal = b[sortKey as keyof Vendor] || "";
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    setFilteredVendors(filtered);
  };
    const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Helper to safely trim
    const getName = () => formData.vendor_name?.trim() || "";
    const getEmail = () => formData.contact_email?.trim() || "";
    const getPhone = () => formData.contact_phone?.trim() || "";
    const getWebsite = () => formData.vendor_website?.trim() || "";
        const country = formData.country?.trim();

    // 1. Critical Fields (Cannot be empty or just spaces)
    if (!getName()) {
      newErrors.vendor_name = "Vendor name is required";
    }

    if (!getEmail()) {
      newErrors.contact_email = "Contact email is required";
    } else if (!/\S+@\S+\.\S+/.test(getEmail())) {
      newErrors.contact_email = "Invalid email format";
    }
     if (!country) {
      newErrors.country = "Country is required";
    } 
     else if (isCustomCountry) {
        const validCountryRegex = /^[a-zA-Z][a-zA-Z\s\.\-']{2,}$/;
        
        if (!validCountryRegex.test(country)) {
            newErrors.country = "Invalid country name (min 3 chars)";
        }
    }
    if (!getPhone()) {
      newErrors.contact_phone = "Contact phone is required";
    } else if (!PHONE_REGEX.test(getPhone())) {
      newErrors.contact_phone = "Invalid phone number format";
    }

    // 2. Optional Fields with Format Validation
    if (getWebsite() && !URL_REGEX.test(getWebsite())) {
      newErrors.vendor_website = "Invalid website URL format";
    }

    // 3. Duplicate Check (Case insensitive, trimmed)
    const duplicateVendor = vendors.find(
      (v) =>
        v.vendor_name.trim().toLowerCase() === getName().toLowerCase() &&
        (!editingVendor || v.vendor_code !== editingVendor.vendor_code),
    );

    if (duplicateVendor) {
      newErrors.vendor_name = "A vendor with this name already exists";
    }

    // 4. Validate Department Emails (Optional but must be valid if present)
    for (let i = 1; i <= 5; i++) {
      const val = formData[`dept${i}_email` as keyof Vendor];
      if (val && typeof val === 'string' && val.trim() !== '') {
        if (!/\S+@\S+\.\S+/.test(val.trim())) {
          newErrors[`dept${i}_email`] = "Invalid email format";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // const handleSubmit = async () => {
  //   if (!validateForm()) return;
  //   try {
  //     setIsSubmitting(true);
  //     let payload: any = { ...formData };
  //     if (logoFile) {
  //       const data = new FormData();
  //       Object.entries(formData).forEach(([key, value]) => {
  //         if (key === "vendor_logo_url" && value?.startsWith("blob:")) {
  //           return;
  //         }
  //         data.append(key, value as string);
  //       });
  //       data.append("logo_file", logoFile);
  //       payload = data;
  //     } else {
  //       payload.vendor_code =
  //         payload.vendor_code ||
  //         generateEntityCode("vendor", payload.vendor_name || "");
  //     }
  //     if (editingVendor) {
  //       await MasterAPI.update("vendors", editingVendor.vendor_code, formData);
  //       setToast({ message: "Vendor updated successfully", type: "success" });
  //     } else {
  //       if (!logoFile) {
  //         payload.vendor_code =
  //           payload.vendor_code ||
  //           generateEntityCode("vendor", payload.vendor_name || "");
  //       }
  //       const dataToSubmit = {
  //         ...formData,
  //         vendor_code:
  //           formData.vendor_code ||
  //           generateEntityCode("vendor", formData.vendor_name || ""),
  //       };
  //       await MasterAPI.create("vendors", dataToSubmit);
  //     }
  //     if (isCustomIndustry && formData.industry) {
  //       setIndustryOptions(prev => {
  //         if (!prev.includes(formData.industry!)) {
  //           return [...prev, formData.industry!].sort();
  //         }
  //         return prev;
  //       });
  //     }
  //     setToast({ message: "Vendor saved successfully", type: "success" }); 
  //     setIsDrawerOpen(false);
  //     setEditingVendor(null);
  //     resetForm();
  //     loadVendors();
  //   } catch (error: any) {
  //     setIsSubmitting(false);
  //     setToast({ message: error.message, type: "error" });
  //   }
  // };
    const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      let payload: any = { ...formData };
      
       if (editingVendor) {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Skip blob URLs
        if (key === "vendor_logo_url" && value?.startsWith("blob:")) return;
        // Include all fields (including empty strings)
        if (value !== null && value !== undefined) {
          data.append(key, String(value));
        }
      });
      // Add file if present
      if (logoFile) {
        data.append("logo_file", logoFile);
      }
      payload = data;
    } 
    // For creating: use FormData if file, otherwise JSON
    else {
      if (logoFile) {
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (key === "vendor_logo_url" && value?.startsWith("blob:")) return;
          if (value !== null && value !== undefined) {
            data.append(key, String(value));
          }
        });
        data.append("logo_file", logoFile);
        payload = data;
      } else {
        payload = { ...formData };
        payload.vendor_code = generateEntityCode("vendor", payload.vendor_name || "");
      }
    }

      if (editingVendor) {
        await MasterAPI.update("vendors", editingVendor.vendor_code, payload);
        setToast({ message: "Vendor updated successfully", type: "success" });
      } else {
        await MasterAPI.create("vendors", payload);
        setToast({ message: "Vendor added successfully", type: "success" });
      }

      if (isCustomIndustry && formData.industry) {
        setIndustryOptions(prev => {
          if (!prev.includes(formData.industry!)) {
            return [...prev, formData.industry!].sort();
          }
          return prev;
        });
      }

      setIsDrawerOpen(false);
      setEditingVendor(null);
      resetForm();
      loadVendors();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setIsSubmitting(false); 
    }
  };
   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate File Type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setToast({ message: "Only JPG, PNG, and WEBP files are allowed.", type: "error" });
      e.target.value = "";
      return;
    }

    // 2. Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      setToast({ message: "File size must be less than 5MB.", type: "error" });
      e.target.value = "";
      return;
    }

    // 3. Set State
    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, vendor_logo_url: objectUrl }));
    
    // Clear input to allow re-selecting same file if user clears it and picks again
    e.target.value = "";
  };
  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setErrors({});
    setIsCustomIndustry(false);
    setIsDrawerOpen(true);
    const isStandard = COUNTRIES.includes(vendor.country || "");
    setCustomCountry(!!vendor.country && !isStandard);
  };

  const handleDelete = async () => {
    if (!deleteModal.vendor) return;

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      const products = await ProductAPI.getAll(0, 1, {
        vendor_name: deleteModal.vendor.vendor_name,
      });
      if (products && products.length > 0) {
        setToast({
          message: "Cannot delete vendor. It is linked to products.",
          type: "error",
        });
        setDeleteModal({ isOpen: false, vendor: null, isDeleting: false });
        return;
      }

      await MasterAPI.delete("vendors", deleteModal.vendor.vendor_code);

      setToast({ message: "Vendor deleted successfully", type: "success" });
      setDeleteModal({ isOpen: false, vendor: null, isDeleting: false });
      loadVendors();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };
  const resetForm = () => {
    setFormData({
      vendor_code: "",
      vendor_name: "",
      contact_email: "",
      contact_phone: "",
      vendor_website: "",
      business_type: "",
      industry: "",
      description: "",
      address: "",
      city: "",
      country: "",
      tax_info: "",
      vendor_logo_url: "",
      dept1_poc_name: "",
      dept1_email: "",
      dept1_phone: "",
      dept2_poc_name: "",
      dept2_email: "",
      dept2_phone: "",
      dept3_poc_name: "",
      dept3_email: "",
      dept3_phone: "",
      dept4_poc_name: "",
      dept4_email: "",
      dept4_phone: "",
      dept5_poc_name: "",
      dept5_email: "",
      dept5_phone: "",
    });
    setErrors({});
    setIsCustomIndustry(false);
    setCustomCountry(false);
    setLogoFile(null);
  };

  const handleUrlInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (logoFile) {
      if (formData.vendor_logo_url?.startsWith("blob:")) {
        URL.revokeObjectURL(formData.vendor_logo_url);
      }
      setLogoFile(null);
    }
    setFormData({ ...formData, vendor_logo_url: e.target.value });
  };

  const handleRemoveLogo = () => {
    if (formData.vendor_logo_url?.startsWith("blob:")) {
      URL.revokeObjectURL(formData.vendor_logo_url);
    }
    setFormData({ ...formData, vendor_logo_url: "" });
    setLogoFile(null);
    
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = "";
  };
  const handleExport = () => {
    if (filteredVendors.length === 0) {
      setToast({ message: "No data to export", type: "error" });
      return;
    }
    exportToCSV(filteredVendors, "vendors.csv");
    setToast({ message: "Vendors exported successfully", type: "success" });
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseCSV(file);
      const validData: Partial<Vendor>[] = [];
      const importErrors: string[] = [];
      const ignoredItems: string[] = [];
      const validColumns = [
        "vendor_code",
        "vendor_name",
        "contact_email",
        "contact_phone",
        "vendor_website",
        "business_type",
        "industry",
        "description",
        "address",
        "city",
        "tax_info",
        "vendor_logo_url",
        "dept1_poc_name",
        "dept1_email",
        "dept1_phone",
        "dept2_poc_name",
        "dept2_email",
        "dept2_phone",
        "dept3_poc_name",
        "dept3_email",
        "dept3_phone",
        "dept4_poc_name",
        "dept4_email",
        "dept4_phone",
        "dept5_poc_name",
        "dept5_email",
        "dept5_phone",
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
        const existingVendor = vendors.find(
          (v) =>
            v.vendor_name.trim().toLowerCase() ===
            row.vendor_name?.trim().toLowerCase(),
        );
        const duplicateInImport = validData.find(
          (item) =>
            item.vendor_name?.trim().toLowerCase() ===
            row.vendor_name?.trim().toLowerCase(),
        );
        if (existingVendor) {
          ignoredItems.push(
            `Row ${index + 2}:"${row.vendor_name}"(already exists!)`,
          );
          return;
        }
        if (duplicateInImport) {
          ignoredItems.push(
            `Row ${index + 2}:"${row.vendor_name}"(duplicate in file!)`,
          );
          return;
        }
        const vendor_name = row.vendor_name
          ? String(row.vendor_name).trim()
          : "";
        const contact_email = row.contact_email
          ? String(row.contact_email).trim()
          : "";
        const contact_phone = row.contact_phone
          ? String(row.contact_phone).trim()
          : "";
        if (!vendor_name) {
          rowErrors.push("vendor_name is required");
        }
        if (!contact_email) {
          rowErrors.push("contact_email is required");
        } else if (!/\S+@\S+\.\S+/.test(contact_email)) {
          rowErrors.push("invalid email format");
        }
        if (!contact_phone) {
          rowErrors.push("contact_phone is required");
        }
        if (rowErrors.length > 0) {
          importErrors.push(`Row ${index + 2}: ${rowErrors.join(", ")}`);
        } else {
          const vendorData: any = {};
          validColumns.forEach((col) => {
            if (
              row[col] !== null &&
              row[col] !== undefined &&
              row[col] !== ""
            ) {
              let value =
                typeof row[col] === "number" ? String(row[col]) : row[col];
              if (col === "business_type" && typeof value === "string") {
                value =
                  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
              }
              vendorData[col] = value;
            }
          });
          if (
            vendorData.vendor_code === "" ||
            vendorData.vendor_code === undefined
          ) {
            vendorData.vendor_code = generateEntityCode(
              "vendor",
              vendorData.vendor_name || "",
            );
          }
          validData.push(vendorData);
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
          message: `No new vendors to import.${totalRows} total rows,${ignoredCount} ignored(already exist or duplicates)`,
          type: "error",
        });
        e.target.value = "";
        return;
      }
      let successCount = 0;
      let failedCount = 0;
      const failedItems: string[] = [];
      for (let i = 0; i < validData.length; i++) {
        const vendor = validData[i];
        try {
          await MasterAPI.create("vendors", vendor);
          successCount++;
        } catch (error) {
          failedCount++;
          const errorDetail =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            error.message ||
            "Unknown error";
          failedItems.push(`${vendor.vendor_name}:${errorDetail}`);
        }
      }
      const totalRows = data.length;
      const ignoredCount = ignoredItems.length;
      const processedCount = validData.length;
      if (failedCount === 0 && ignoredCount === 0) {
        setToast({
          message: `Import successful!${successCount} vendors added from ${totalRows} rows!`,
          type: "success",
        });
      } else if (failedCount === 0 && ignoredCount > 0) {
        setToast({
          message: `Import completed! ${successCount} vendors added, ${ignoredCount} ignored (already exist). Total rows: ${totalRows}`,
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
      loadVendors();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    }
    e.target.value = "";
  };
  const downloadTemplate = () => {
    const template = [
      {
        vendor_code: "",
        vendor_name: "Example Vendor",
        contact_email: "contact@example.com",
        contact_phone: "555-1234",
        vendor_website: "https://example.com",
        business_type: "Wholesaler",
        industry: "HVAC",
        description: "Sample description",
        address: "123 Main St",
        city: "New York",
        tax_info: "TAX123",
        vendor_logo_url: "",
        dept1_poc_name: "John Doe",
        dept1_email: "john@example.com",
        dept1_phone: "555-1111",
        dept2_poc_name: "",
        dept2_email: "",
        dept2_phone: "",
        dept3_poc_name: "",
        dept3_email: "",
        dept3_phone: "",
        dept4_poc_name: "",
        dept4_email: "",
        dept4_phone: "",
        dept5_poc_name: "",
        dept5_email: "",
        dept5_phone: "",
      },
    ];
    exportToCSV(template, "vendor_import_template.csv");
  };
  const getDepartmentCount = (vendor: Vendor) => {
    let count = 0;
    if (vendor.dept1_poc_name) count++;
    if (vendor.dept2_poc_name) count++;
    if (vendor.dept3_poc_name) count++;
    if (vendor.dept4_poc_name) count++;
    if (vendor.dept5_poc_name) count++;
    return count;
  };
  const columns = [
    { key: "vendor_code", label: "Vendor Code", sortable: true },
    { key: "vendor_name", label: "Vendor Name", sortable: true },
    { key: "business_type", label: "Business Type", sortable: true },
    { key: "industry", label: "Industry", sortable: true },
    { key: "contact_email", label: "Email", sortable: false },
    { key: "contact_phone", label: "Phone", sortable: false },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_: any, row: Vendor) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => setDeleteModal({ isOpen: true, vendor: row })}
            className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Master</h1>
          <p className="text-gray-600 mt-1">
            Manage vendor information and contacts
          </p>
        </div>
        <button
          onClick={() => {
            setEditingVendor(null);
            resetForm();
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Vendor
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search vendor code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={businessTypeFilter}
            onChange={(e) => setBusinessTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Business Types</option>
            <option value="Wholesaler">Wholesaler</option>
            <option value="Manufacturer">Manufacturer</option>
            <option value="Distributor">Distributor</option>
            <option value="Dealer">Dealer</option>
            <option value="Retailer">Retailer</option>
          </select>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Industries</option>
            {industryOptions.map((ind) => (
               <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={20} />
              Export
            </button>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Upload size={20} />
              Import
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Download Template"
            >
              <Building2 size={20} />
            </button>
          </div>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredVendors}
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
          setEditingVendor(null);
          resetForm();
        }}
        title={editingVendor ? "Edit Vendor" : "Add Vendor"}
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {editingVendor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Code
                  </label>
                  <input
                    type="text"
                    value={formData.vendor_code || ""}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated upon creation
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.vendor_name}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.vendor_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.vendor_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.contact_email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.contact_email}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.contact_phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.contact_phone}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                  <span>Industry</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomIndustry(!isCustomIndustry)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {isCustomIndustry ? <X size={12} /> : <Plus size={12} />}
                    {isCustomIndustry ? "Select List" : "Add New"}
                  </button>
                </label>
                {isCustomIndustry ? (
                  <input
                    type="text"
                    placeholder="Enter new industry"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <select
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Industry</option>
                     {industryOptions.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type
                </label>
                <select
                  value={formData.business_type}
                  onChange={(e) =>
                    setFormData({ ...formData, business_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Dealer">Dealer</option>
                  <option value="Retailer">Retailer</option>
                </select>
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                  <span>Industry</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomIndustry(!isCustomIndustry)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {isCustomIndustry ? <X size={12} /> : <Plus size={12} />}
                    {isCustomIndustry ? "Select List" : "Add New"}
                  </button>
                </label>
                {isCustomIndustry ? (
                  <input
                    type="text"
                    placeholder="Enter new industry"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <select
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select industry</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Safety Supplies">Safety Supplies</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Tools & Equipments">Tools & Equipments</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Home Improvements">Home Improvements</option>
                    <option value="Home & Decor">Home & Decor</option>
                    <option value="Industrial Supplies">Industrial Supplies</option>
                  </select>
                )}
              </div> */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={formData.vendor_website}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vendor_website: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
                            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                  <span>Country <span className="text-red-500">*</span></span>
                  {isCustomCountry && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomCountry(false);
                        setFormData({ ...formData, country: "" });
                      }}
                      className="text-xs  text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <X size={12} />
                      Select List
                    </button>
                  )}
                </label>
                
                {isCustomCountry ? (
                  <input
                    type="text"
                    placeholder="Enter country name"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.country ? "border-red-500" : "border-blue-400"
                    }`}
                    autoFocus
                  />
                ) : (
                  <select
                    value={formData.country}
                    onChange={(e) => {
                      if (e.target.value === "Other") {
                        setCustomCountry(true);
                        setFormData({ ...formData, country: "" });
                      } else {
                        setFormData({ ...formData, country: e.target.value });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.country ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Other" className="font-semibold text-blue-600">+ Other (Add New)</option>
                  </select>
                )}
                
                {/* --- ERROR MESSAGE --- */}
                {errors.country && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{errors.country}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Info
                </label>
                <input
                  type="text"
                  value={formData.tax_info}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_info: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
                            {/* --- VENDOR LOGO SECTION --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Logo
                </label>
                
                <div className="flex gap-2 items-start">
                  {/* Text Input Wrapper */}
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <ImageIcon size={16} />
                    </div>
                    
                    <input
                      type="text"
                      placeholder={logoFile ? "Image File Selected" : "https://example.com/logo.png"}
                      value={logoFile ? `File: ${logoFile.name}` : formData.vendor_logo_url}
                      onChange={handleUrlInput}
                      disabled={!!logoFile} // Lock text input if file is uploaded
                      className={`w-full pl-9 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        logoFile ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "border-gray-300"
                      }`}
                    />

                    {/* REMOVE BUTTON - Shows if there is content */}
                    {(formData.vendor_logo_url || logoFile) && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                        title="Remove Logo"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Upload Button */}
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white h-[42px]">
                    {uploadingLogo ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Upload size={18} className="text-gray-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700">Upload</span>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>

                {/* Preview Area */}
                {formData.vendor_logo_url && (
                  <div className="mt-3">
                    <span className="text-xs text-gray-500 mb-1 block">Preview:</span>
                    <div className="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-2 relative group">
                      <img
                        src={formData.vendor_logo_url}
                        alt="Logo Preview"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-red-400 text-center">Invalid Image</span>';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {[1, 2, 3, 4, 5].map((dept) => (
            <div key={dept} className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Department {dept} Contact
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    POC Name
                  </label>
                  <input
                    type="text"
                    value={
                      formData[`dept${dept}_poc_name` as keyof typeof formData]
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [`dept${dept}_poc_name`]: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={
                      formData[`dept${dept}_email` as keyof typeof formData]
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [`dept${dept}_email`]: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={
                      formData[`dept${dept}_phone` as keyof typeof formData]
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [`dept${dept}_phone`]: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                setEditingVendor(null);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                submitting
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
                <>{editingVendor ? "Update" : "Add"} Vendor</>
              )}
            </button>
          </div>
        </div>
      </Drawer>
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, vendor: null })}
        title="Delete Vendor"
        actions={
          <>
            <button
              onClick={() => setDeleteModal({ isOpen: false, vendor: null })}
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
          Are you sure you want to delete vendor{" "}
          <span className="font-semibold">
            {deleteModal.vendor?.vendor_name}
          </span>
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
