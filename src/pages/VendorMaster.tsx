import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle,
  ChevronDown,
  Download,
  Edit,
  ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { Vendor } from "../types/vendor";
import Drawer from "../components/Drawer";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import DataTable from "../components/DataTable";
import { exportToCSV, parseCSV } from "../utils/csvHelper";
import { MasterAPI, ProductAPI } from "../lib/api";
import { validateImportFormat } from "../utils/importValidator";
import { SearchableSelect } from "../components/SearchableSelect";
import { clearFieldError, formatWebsiteUrl } from "../utils/formHelpers";
import { useIndustryManager } from "../hooks/useIndustryManager";
import { City, Country, State } from "country-state-city";
import CustomDownloadIcon from "../assets/download-custom.png";
const ALLOWED_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Ireland",
  "Australia",
  "United Arab Emirates",
];
export function VendorMaster() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const customCountryRef = useRef<HTMLDivElement>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    vendor: Vendor | null;
    isDeleting: boolean;
  }>({ isOpen: false, vendor: null, isDeleting: false });
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [deptCount, setDeptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [stateOptions, setStateOptions] = useState<any[]>([]);
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const countryOptions = useMemo(
    () =>
      Country.getAllCountries().filter((c) =>
        ALLOWED_COUNTRIES.includes(c.name),
      ),
    [],
  );
  const toggleSelect = (code: string) => {
    const newSet = new Set(selectedCodes);
    if (newSet.has(code)) newSet.delete(code);
    else newSet.add(code);
    setSelectedCodes(newSet);
  };
  const toggleSelectAll = () => {
    if (selectedCodes.size === filteredVendors.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(filteredVendors.map((v) => v.vendor_code)));
    }
  };
  const handleToggleStatus = async (vendor: Vendor) => {
    try {
      setLoading(true);
      await MasterAPI.update("vendors", vendor.vendor_code, {
        is_active: !vendor.is_active,
      });
      setToast({
        message: `Vendor "${vendor.vendor_name}" is now ${
          !vendor.is_active ? "Active" : "Inactive"
        }`,
        type: "success",
      });
      loadVendors();
    } catch (error) {
      setToast({ message: "Failed to update status", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        customCountryRef.current &&
        !customCountryRef.current.contains(event.target as Node)
      ) {
        setShowCountrySuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleBulkStatusChange = async (active: boolean) => {
    const codes = Array.from(selectedCodes);
    try {
      setLoading(true);
      await Promise.all(
        codes.map((code) =>
          MasterAPI.update("vendors", code, { is_active: active }),
        ),
      );
      setToast({
        message: `Successfully updated ${codes.length} vendors`,
        type: "success",
      });
      setSelectedCodes(new Set());
      loadVendors();
    } catch (error) {
      setToast({ message: "Bulk update failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  const initialContactState = useMemo(() => {
    const obj: any = {};
    for (let i = 1; i <= 10; i++) {
      obj[`dept${i}_poc_name`] = "";
      obj[`dept${i}_poc_designation`] = "";
      obj[`dept${i}_email`] = "";
      obj[`dept${i}_phone`] = "";
    }
    return obj;
  }, []);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [submitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [sortKey, setSortKey] = useState("vendor_code");
  const [industries, setIndustries] = useState<any[]>([]);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const URL_REGEX =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  const PHONE_REGEX = /^\+?[0-9\s\-\(\)]{7,20}$/;
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
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
    is_active: true,
    ...initialContactState,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const {
    isCustom: isCustomIndustry,
    handleIndustryChange,
    setIsCustom: setIsCustomIndustry,
  } = useIndustryManager(industries, setFormData, setErrors, "industry");

  const handleCountryChange = (countryName: string) => {
  const libCountry = Country.getAllCountries().find(
    (c) => c.name.toLowerCase() === countryName.toLowerCase(),
  );

  const isPreferred = ALLOWED_COUNTRIES.includes(countryName);

  if (libCountry) {
    // Country exists in library - check if it's in preferred list
    if (isPreferred) {
      // Top 5 country - use dropdowns
      setCustomCountry(false);
      setSelectedCountryCode(libCountry.isoCode);
      setStateOptions(State.getStatesOfCountry(libCountry.isoCode));
    } else {
      // Country exists in library but not in Top 5 - still enable state/city lookups
      setCustomCountry(false); // Changed from true
      setSelectedCountryCode(libCountry.isoCode);
      setStateOptions(State.getStatesOfCountry(libCountry.isoCode));
    }
  } else {
    // Country doesn't exist in library - manual mode
    setCustomCountry(true);
    setSelectedCountryCode("");
    setSelectedStateCode("");
    setStateOptions([]);
    setCityOptions([]);
  }

  setFormData((prev) => ({
    ...prev,
    country: countryName,
    state: "",
    city: "",
  }));
  clearFieldError("country", setErrors);
};
  // const handleCountryChange = (countryName: string) => {
  //   const libCountry = Country.getAllCountries().find(
  //     (c) => c.name.toLowerCase() === countryName.toLowerCase()
  //   );

  //   const isPreferred = libCountry ? ALLOWED_COUNTRIES.includes(libCountry.name) : false;

  //   if (libCountry && isPreferred) {
  //     setCustomCountry(false);
  //     setSelectedCountryCode(libCountry.isoCode);
  //     setStateOptions(State.getStatesOfCountry(libCountry.isoCode));

  //     setFormData((prev) => ({
  //       ...prev,
  //       country: libCountry.name,
  //       state: "",
  //       city: "",
  //     }));
  //   } else {
  //     setCustomCountry(true);
  //     setSelectedCountryCode("");
  //     setStateOptions([]);

  //     setFormData((prev) => ({
  //       ...prev,
  //       country: countryName,
  //       state: "",
  //       city: "",
  //     }));
  //   }
  //   clearFieldError("country", setErrors);
  // };
  const handleStateChange = (stateName: string) => {
    const state = stateOptions.find((s) => s.name === stateName);
    if (state && selectedCountryCode) {
      setSelectedStateCode(state.isoCode);
      setFormData((prev) => ({ ...prev, state: state.name, city: "" }));
      setCityOptions(City.getCitiesOfState(selectedCountryCode, state.isoCode));
    } else {
      setFormData((prev) => ({ ...prev, state: stateName, city: "" }));
    }
  };
  useEffect(() => {
    loadVendors();
  }, []);
  useEffect(() => {
    filterAndSortVendors();
  }, [
    vendors,
    searchTerm,
    businessTypeFilter,
    countryFilter,
    industryFilter,
    sortKey,
    sortDirection,
  ]);
  useEffect(() => {
    return () => {
      if (formData.vendor_logo_url?.startsWith("blob:")) {
        URL.revokeObjectURL(formData.vendor_logo_url);
      }
    };
  }, [formData.vendor_logo_url]);
  const loadVendors = async () => {
    try {
      setLoading(true);
      const [vendorData, industryData] = await Promise.all([
        MasterAPI.getVendors(),
        MasterAPI.getIndustries(),
      ]);
      setVendors(vendorData || []);
      if (vendorData) {
        const usedIndustries = vendorData
          .map((v: Vendor) => v.industry)
          .filter((i): i is string => !!i);
      }
      if (industryData) {
        setIndustries(industryData);
        const names = industryData.map((i: any) => i.industry_name).sort();
        setIndustryOptions(names);
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
          (v.vendor_code||"").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (v.vendor_name||"").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (v.business_type||"").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (v.industry||"").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (v.vendor_website||"").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (v.country||"")?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (businessTypeFilter) {
      filtered = filtered.filter((v) => v.business_type === businessTypeFilter);
    }
    if (countryFilter) {
      filtered = filtered.filter((v) => v.country === countryFilter);
    }
    if (statusFilter) {
      const activeBool = statusFilter === "Active";
      filtered = filtered.filter((v) => v.is_active === activeBool);
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
    const getName = () => formData.vendor_name?.trim() || "";
    const getEmail = () => formData.contact_email?.trim() || "";
    // const getPhone = () => formData.contact_phone?.trim() || "";
    const getWebsite = () => formData.vendor_website?.trim() || "";
    const getIndustry = () => formData.industry?.trim() || "";
    const getBusinessType = () => formData.business_type?.trim() || "";
    const country = formData.country?.trim();
    if (!getName()) {
      newErrors.vendor_name = "Vendor name is required";
    }
    if (!getEmail()) {
      newErrors.contact_email = "Contact email is required";
    } else if (!/\S+@\S+\.\S+/.test(getEmail())) {
      newErrors.contact_email = "Invalid email format";
    }
    if (!getIndustry()) {
      newErrors.industry = "Industry  is required";
    }
    if (!getBusinessType()) {
      newErrors.business_type = "Business type is required";
    }
    if (!country) {
      newErrors.country = "Country is required";
    } else if (isCustomCountry) {
      const validCountryRegex = /^[a-zA-Z][a-zA-Z\s\.\-']{2,}$/;
      if (!validCountryRegex.test(country)) {
        newErrors.country = "Invalid country name (min 3 chars)";
      }
    }
    if (getWebsite() && !URL_REGEX.test(getWebsite())) {
      newErrors.vendor_website = "Invalid website URL format";
    }
    const duplicateVendor = vendors.find(
      (v) =>
        v.vendor_name.trim().toLowerCase() === getName().toLowerCase() &&
        (!editingVendor || v.vendor_code !== editingVendor.vendor_code),
    );
    if (duplicateVendor) {
      newErrors.vendor_name = "A vendor with this name already exists";
    }
    for (let i = 1; i <= deptCount; i++) {
      const pocName = formData[
        `dept${i}_poc_name` as keyof typeof formData
      ] as string;
      const pocEmail = formData[
        `dept${i}_email` as keyof typeof formData
      ] as string;
      if (!pocName) {
        newErrors[`dept${i}_poc_name`] = "Contact Name is required";
      }
      if (pocEmail?.trim() && !/\S+@\S+\.\S+/.test(pocEmail.trim())) {
        newErrors[`dept${i}_email`] = "Invalid email format";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const sanitizedData: any = { ...formData };
      for (let i = 1; i <= 10; i++) {
        if (i > deptCount) {
          sanitizedData[`dept${i}_poc_name`] = "";
          sanitizedData[`dept${i}_poc_designation`] = "";
          sanitizedData[`dept${i}_email`] = "";
          sanitizedData[`dept${i}_phone`] = "";
        }
      }
      if (sanitizedData.vendor_website) {
        sanitizedData.vendor_website = formatWebsiteUrl(
          sanitizedData.vendor_website,
        );
      }
      Object.keys(sanitizedData).forEach((key) => {
        const value = sanitizedData[key];
        if (typeof value === "string") {
          sanitizedData[key] = value.trim();
        } else if (value === null || value === undefined) {
          sanitizedData[key] = "";
        }
      });
      if (sanitizedData.vendor_logo_url?.startsWith("blob:")) {
        sanitizedData.vendor_logo_url = "";
      }
      let finalPayload: any;
      if (logoFile) {
        const data = new FormData();
        Object.entries(sanitizedData).forEach(([key, value]) => {
          data.append(key, String(value));
        });
        data.append("logo_file", logoFile);
        finalPayload = data;
      } else {
        // if (!sanitizedData.vendor_code && !editingVendor) {
        //   const currentCodes = vendors.map((v) => v.vendor_code);
        //   sanitizedData.vendor_code = generateEntityCode(
        //     "vendor",
        //     sanitizedData.vendor_name || "",
        //     currentCodes,
        //   );
        // }
        finalPayload = sanitizedData;
      }
      if (editingVendor) {
        await MasterAPI.update(
          "vendors",
          editingVendor.vendor_code,
          finalPayload,
        );
        setToast({ message: "Vendor updated successfully", type: "success" });
      } else {
        await MasterAPI.create("vendors", finalPayload);
        setToast({ message: "Vendor added successfully", type: "success" });
      }
      if (isCustomIndustry && formData.industry?.trim()) {
        const newInd = formData.industry.trim();
        setIndustryOptions((prev) =>
          prev.includes(newInd) ? prev : [...prev, newInd].sort(),
        );
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
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setToast({
        message: "Only JPG, PNG, and WEBP files are allowed.",
        type: "error",
      });
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setToast({ message: "File size must be less than 5MB.", type: "error" });
      e.target.value = "";
      return;
    }
    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, vendor_logo_url: objectUrl }));
    e.target.value = "";
  };
  // const handleEdit = (vendor: Vendor) => {
  //   setEditingVendor(vendor);
  //   setFormData(vendor);
  //   setErrors({});
  //   const country = countryOptions.find((c) => c.name === vendor.country);
  //   const isPreferred = ALLOWED_COUNTRIES.includes(vendor.country || "");
  //   if (country && isPreferred) {
  //     setSelectedCountryCode(country.isoCode);
  //     const states = State.getStatesOfCountry(country.isoCode);
  //     setStateOptions(states);
  //     const state = states.find((s) => s.name === vendor.state);
  //     if (state) {
  //       setSelectedStateCode(state.isoCode);
  //       setCityOptions(City.getCitiesOfState(country.isoCode, state.isoCode));
  //     } else {
  //       setSelectedStateCode("");
  //       setCityOptions([]);
  //     }
  //   } else {
  //     setCustomCountry(true);
  //     setSelectedCountryCode("");
  //     setSelectedStateCode("");
  //     setStateOptions([]);
  //     setCityOptions([]);
  //   }
  //   let maxDept = 0;
  //   for (let i = 1; i <= 10; i++) {
  //     if (vendor[`dept${i}_poc_name` as keyof Vendor]) maxDept = i;
  //   }
  //   setDeptCount(maxDept);
  //   const isStandard = industryOptions.includes(vendor.industry || "");
  //   setIsCustomIndustry(!!vendor.industry && !isStandard);
  //   setIsDrawerOpen(true);
  //   const isStandardCountry = ALLOWED_COUNTRIES.includes(vendor.country || "");
  //   setCustomCountry(!!vendor.country && !isStandardCountry);
  // };
  const handleEdit = (vendor: Vendor) => {
  setEditingVendor(vendor);
  setFormData(vendor);
  setErrors({});

  // Check if country exists in the library
  const libCountry = Country.getAllCountries().find(
    (c) => c.name.toLowerCase() === (vendor.country || "").toLowerCase()
  );

  if (libCountry) {
    // Country exists in library - enable dropdowns
    setCustomCountry(false);
    setSelectedCountryCode(libCountry.isoCode);
    const states = State.getStatesOfCountry(libCountry.isoCode);
    setStateOptions(states);

    const state = states.find((s) => s.name === vendor.state);
    if (state) {
      setSelectedStateCode(state.isoCode);
      setCityOptions(City.getCitiesOfState(libCountry.isoCode, state.isoCode));
    } else {
      setSelectedStateCode("");
      setCityOptions([]);
    }
  } else {
    // Country doesn't exist in library - manual mode
    setCustomCountry(true);
    setSelectedCountryCode("");
    setSelectedStateCode("");
    setStateOptions([]);
    setCityOptions([]);
  }

  let maxDept = 0;
  for (let i = 1; i <= 10; i++) {
    if (vendor[`dept${i}_poc_name` as keyof Vendor]) maxDept = i;
  }
  setDeptCount(maxDept);

  const isStandard = industryOptions.includes(vendor.industry || "");
  setIsCustomIndustry(!!vendor.industry && !isStandard);
  setIsDrawerOpen(true);
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
      ...initialContactState,
      is_active: true,
    });
    setErrors({});
    setDeptCount(0);
    setIsCustomIndustry(false);
    setCustomCountry(false);
    setLogoFile(null);
    setSelectedCountryCode("");
    setSelectedStateCode("");
    setStateOptions([]);
    setCityOptions([]);
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
    const fileInput = document.getElementById(
      "logo-upload",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
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
              if (typeof value === "string") {
                value = value.trim();
              }
              if (col === "business_type" && typeof value === "string") {
                value =
                  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
              }
              vendorData[col] = value;
            }
          });
          // if (
          //   vendorData.vendor_code === "" ||
          //   vendorData.vendor_code === undefined
          // ) {
          //   vendorData.vendor_code = generateEntityCode(
          //     "vendor",
          //     vendorData.vendor_name || "",
          //   );
          // }
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
  const allSelectableCountries = useMemo(() => {
    const existingVendors = Array.from(
      new Set(vendors.map((v) => v.country).filter(Boolean)),
    ) as string[];
    const combined = new Set([...ALLOWED_COUNTRIES, ...existingVendors]);
    return Array.from(combined).sort();
  }, [vendors]);

  const checkDuplicateVendorName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const isDuplicate = vendors.find(
      (v) =>
        v.vendor_name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        (!editingVendor || v.vendor_code !== editingVendor.vendor_code),
    );
    if (isDuplicate) {
      setToast({
        message: `A vendor has been already added`,
        type: "error",
      });
      // setErrors((prev) => ({
      //   ...prev,
      //   vendor_name: "DUPLICATE",
      // }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors.vendor_name === "DUPLICATE") {
          delete newErrors.vendor_name;
        }
        return newErrors;
      });
    }
  };
  const columns = [
    // { key: "vendor_code", label: "Vendor Code", sortable: true },
    {
      key: "selection",
      label: (
        <input
          type="checkbox"
          checked={
            selectedCodes.size === filteredVendors.length &&
            filteredVendors.length > 0
          }
          onChange={toggleSelectAll}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      ) as any,
      width: "100px",
      render: (_: any, row: Vendor) => (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedCodes.has(row.vendor_code)}
            onChange={() => toggleSelect(row.vendor_code)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      ),
    },
    { key: "vendor_name", label: "Vendor Name", sortable: true },
    { key: "business_type", label: "Business Type", sortable: true },
    {
      key: "industry",
      label: "Industry",
      sortable: true,
      render: (_: any, row: any) =>
        row.industry_obj?.industry_name || row.industry || "N/A",
    },
    {
      key: "vendor_website",
      label: "Website",
      sortable: false,
      render: (value: string) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            // onClick={(e) => {
            //   e.stopPropagation();
            // }}
          >
            {value}
            {value.length > 30 && "..."}
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    { key: "country", label: "Country", sortable: false },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      render: (val: boolean) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
            val
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
            onClick={() => handleToggleStatus(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.is_active
                ? "hover:bg-red-100 text-red-600"
                : "hover:bg-green-100 text-green-600"
            }`}
            title={row.is_active ? "Deactivate Vendor" : "Activate Vendor"}
          >
            {row.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
          </button>
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-40 bg-white pb-4 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-6 -mb-6">
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Vendor Master
          </h1>
          <p className="text-gray-600 mt-1">Manage vendor information</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1 justify-end">
          <div className="relative w-full md:w-[500px] lg:w-[600px] transition-all duration-300">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search Vendor"
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
              setEditingVendor(null);
              resetForm();
              setIsDrawerOpen(true);
            }}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-100 font-bold whitespace-nowrap"
          >
            <Plus size={20} />
            Add Vendor
          </button>
        </div>
      </div>
      <div className="sticky top-24 z-30 bg-white rounded-xl shadow-sm border border-gray-200 p-3">

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select
              value={businessTypeFilter}
              onChange={(e) => setBusinessTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" hidden>Select Business Type</option>
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
              <option value="" hidden> Select Industry</option>
              {industryOptions.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" hidden>Select Country</option>
              {ALLOWED_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {Array.from(new Set(vendors.map((v) => v.country)))
                .filter((c) => c && !ALLOWED_COUNTRIES.includes(c))
                .map((c) => (
                  <option key={c} value={c!}>
                    {c}
                  </option>
                ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value=""hidden>Select Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4 border-gray-100">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={16} /> Export
            </button>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Upload size={16} /> Import
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
            >
              <img
                src={CustomDownloadIcon}
                alt="Template"
                className="w-6 h-6 object-contain"
              />
            </button>
          </div>
        </div>
      </div>
      <div className="sticky top-44 z-20 bg-white py-2 flex items-center justify-between px-1">

        <p className="text-sm text-gray-500 italic">
          {searchTerm ||
          businessTypeFilter ||
          industryFilter ||
          countryFilter ? (
            <span>
              Showing <strong>{filteredVendors.length}</strong> matching results
              out of {vendors.length} total vendors
            </span>
          ) : (
            <span>
              Showing all <strong>{vendors.length}</strong> vendors
            </span>
          )}
        </p>
        {(searchTerm ||
          businessTypeFilter ||
          industryFilter ||
          statusFilter ||
          countryFilter) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setBusinessTypeFilter("");
              setIndustryFilter("");
              setCountryFilter("");
              setStatusFilter("");
            }}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>
      {selectedCodes.size > 0 && (
        <div className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
              {selectedCodes.size} selected
            </span>
            <p className="text-sm font-medium">Bulk Actions:</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-green-500 hover:bg-green-400 rounded-lg text-xs font-bold transition-colors"
            >
              <CheckCircle size={14} /> Set Active
            </button>
            <button
              onClick={() => handleBulkStatusChange(false)}
              className="flex items-center gap-2 px-4 py-1.5 bg-red-500 hover:bg-red-400 rounded-lg text-xs font-bold transition-colors"
            >
              <X size={14} /> Set Inactive
            </button>
            <div className="w-px h-6 bg-white/20 mx-2"></div>
            <button
              onClick={() => setSelectedCodes(new Set())}
              className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
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
        <div className="p-6 pb-15  space-y-6">
          <div className="space-y-4">
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
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.vendor_name}
                  onChange={(e) => {
                    setFormData({ ...formData, vendor_name: e.target.value });
                    if (errors.vendor_name) {
                      clearFieldError("vendor_name", setErrors);
                    }
                  }}
                  onBlur={(e) => checkDuplicateVendorName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all ${
                    errors.vendor_name
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter vendor name"
                />
                {errors.vendor_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.vendor_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.is_active ? "Active" : "Inactive"}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      is_active: e.target.value === "Active",
                    });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                    formData.is_active
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => {
                    setFormData({ ...formData, contact_email: e.target.value });
                    clearFieldError("contact_email", setErrors);
                  }}
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
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => {
                    setFormData({ ...formData, contact_phone: e.target.value });
                    clearFieldError("contact_phone", setErrors);
                  }}
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
                  <span className="flex items-center gap-2">
                    Industry
                    {isCustomIndustry && formData.industry?.trim() && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
                        New
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomIndustry(!isCustomIndustry);
                      if (isCustomIndustry) {
                        setFormData({ ...formData, industry: "" });
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {isCustomIndustry ? <X size={12} /> : <Plus size={12} />}
                    {isCustomIndustry ? "Select Existing" : "Create New"}
                  </button>
                </label>
                {isCustomIndustry ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type new industry name..."
                        value={formData.industry || ""}
                        onChange={(e) => handleIndustryChange(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && e.currentTarget.blur()
                        }
                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.industry ? "border-red-500" : "border-blue-400"
                        }`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.industry?.trim()) return;
                          setToast({
                            message: `"${formData.industry}" is ready to be added.`,
                            type: "success",
                          });
                        }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"
                        title="Confirm name"
                      >
                        <CheckCircle size={20} />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                      <AlertCircle size={12} />
                      This will be saved to your master list permanently when
                      you save the vendor.
                    </p>
                  </div>
                ) : (
                  <SearchableSelect
                    options={industryOptions}
                    value={formData.industry || ""}
                    onChange={(val) => handleIndustryChange(val)}
                    placeholder="Search or select from list..."
                    onAddNew={() => setIsCustomIndustry(true)}
                    error={!!errors.industry}
                  />
                )}
                {errors.industry && (
                  <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type
                </label>
                <div className="relative group">
                  <select
                    value={formData.business_type}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        business_type: e.target.value,
                      });
                      clearFieldError("business_type", setErrors);
                    }}
                    className={`w-full appearance-none px-3 py-2 border rounded-lg text-sm transition-all outline-none focus:ring-2 bg-white cursor-pointer ${
                      !formData.business_type
                        ? "text-gray-400"
                        : "text-gray-900"
                    } ${
                      errors.business_type
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Select Business Type</option>
                    <option value="Wholesaler" className="text-gray-900">
                      Wholesaler
                    </option>
                    <option value="Manufacturer" className="text-gray-900">
                      Manufacturer
                    </option>
                    <option value="Distributor" className="text-gray-900">
                      Distributor
                    </option>
                    <option value="Dealer" className="text-gray-900">
                      Dealer
                    </option>
                    <option value="Retailer" className="text-gray-900">
                      Retailer
                    </option>
                  </select>

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>

                {errors.business_type && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.business_type}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={formData.vendor_website}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      vendor_website: e.target.value,
                    });
                    clearFieldError("vendor_website", setErrors);
                  }}
                  onBlur={(e) => {
                    const formatted = formatWebsiteUrl(e.target.value);
                    setFormData({ ...formData, vendor_website: formatted });
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
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                  <span className="flex items-center gap-2">
                    Country <span className="text-red-500">*</span>
                    {formData.country &&
                      !ALLOWED_COUNTRIES.includes(formData.country) && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          CUSTOM
                        </span>
                      )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCountry(!isCustomCountry);
                      if (!isCustomCountry) {
                        setFormData({
                          ...formData,
                          country: "",
                          state: "",
                          city: "",
                        });
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {isCustomCountry ? <X size={12} /> : <Plus size={12} />}
                    {isCustomCountry ? "Select from List" : "Add New"}
                  </button>
                </label>

                {isCustomCountry ? (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type country name..."
                      value={formData.country || ""}
                      onChange={(e) => {
                        handleCountryChange(e.target.value);
                        setShowCountrySuggestions(true);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none ${
                        errors.country ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {showCountrySuggestions &&
                      formData.country &&
                      allSelectableCountries.some((c) =>
                        c
                          .toLowerCase()
                          .includes(formData.country?.toLowerCase() || ""),
                      ) && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          <div className="px-3 py-1 text-xs text-gray-500 border-b">
                            Existing countries:
                          </div>
                          {allSelectableCountries
                            .filter((c) =>
                              c
                                .toLowerCase()
                                .includes(
                                  formData.country?.toLowerCase() || "",
                                ),
                            )
                            .slice(0, 5)
                            .map((country) => (
                              <div
                                key={country}
                                onClick={() => {
                                  handleCountryChange(country);
                                  setCustomCountry(false);
                                  setShowCountrySuggestions(false);
                                }}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700"
                              >
                                {country}
                              </div>
                            ))}
                        </div>
                      )}
                  </div>
                ) : (
                  <SearchableSelect
                    options={allSelectableCountries}
                    value={formData.country || ""}
                    onChange={handleCountryChange}
                    placeholder="Select country"
                    onAddNew={() => setCustomCountry(true)}
                    error={!!errors.country}
                  />
                )}

                {errors.country && (
                  <p className="text-red-500 text-[10px] mt-1">
                    {errors.country}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                {isCustomCountry ||
                (selectedCountryCode && stateOptions.length === 0) ? (
                  <input
                    type="text"
                    value={formData.state || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    placeholder="Enter state"
                  />
                ) : !selectedCountryCode || isCustomCountry ? (
                  <input
                    type="text"
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                    placeholder="Select Country first"
                  />
                ) : (
                  <SearchableSelect
                    options={stateOptions.map((s) => s.name)}
                    value={formData.state || ""}
                    onChange={handleStateChange}
                    placeholder="Select State"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                {isCustomCountry ||
                (selectedStateCode && cityOptions.length === 0) ? (
                  /* Manual input for custom countries */
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    placeholder="Enter city"
                  />
                ) : !selectedStateCode ? (
                  /* Locked state if no state is picked yet */
                  <input
                    type="text"
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                    placeholder="Pick State first"
                  />
                ) : (
                  /* Dropdown for Top 5 countries */
                  <SearchableSelect
                    options={cityOptions.map((c) => c.name)}
                    value={formData.city || ""}
                    onChange={(val) => setFormData({ ...formData, city: val })}
                    placeholder="Select City"
                  />
                )}
              </div>
              <div className="hidden md:block"></div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Street name, Building, Area..."
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Info
                </label>
                <input
                  type="text"
                  value={formData.tax_info}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_info: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Logo
                </label>
                <div className="flex gap-2 items-start">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <ImageIcon size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder={
                        logoFile
                          ? "Image File Selected"
                          : "https://example.com/logo.png"
                      }
                      value={
                        logoFile
                          ? `File: ${logoFile.name}`
                          : formData.vendor_logo_url
                      }
                      onChange={handleUrlInput}
                      disabled={!!logoFile}
                      className={`w-full pl-9 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        logoFile
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "border-gray-300"
                      }`}
                    />
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
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white h-[42px]">
                    {uploadingLogo ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Upload size={18} className="text-gray-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      Upload
                    </span>
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
                {formData.vendor_logo_url && (
                  <div className="mt-3">
                    <span className="text-xs text-gray-500 mb-1 block">
                      Preview:
                    </span>
                    <div className="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-2 relative group">
                      <img
                        src={formData.vendor_logo_url}
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
            </div>
          </div>
          <div className="space-y-6 border-t pt-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Contact Persons
                </h3>
                <p className="text-xs text-gray-500">
                  Add up to 10 authorized contacts for this vendor
                </p>
              </div>
              {deptCount > 0 && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100">
                  {deptCount} ACTIVE
                </span>
              )}
            </div>
            <div className="space-y-4">
              {deptCount === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-sm italic">
                  No contacts added yet.
                </div>
              ) : (
                Array.from({ length: deptCount }).map((_, index) => {
                  const num = index + 1;
                  return (
                    <div
                      key={num}
                      className="p-4 border border-gray-200 rounded-2xl bg-gray-50/30 hover:bg-white hover:shadow-md transition-all group relative"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                            {num}
                          </div>
                          Contact {num}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              [`dept${num}_poc_name`]: "",
                              [`dept${num}_poc_designation`]: "",
                              [`dept${num}_email`]: "",
                              [`dept${num}_phone`]: "",
                            }));
                            setDeptCount((prev) => prev - 1);
                            setErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors[`dept${num}_poc_name`];
                              delete newErrors[`dept${num}_email`];
                              delete newErrors[`dept${num}_phone`];
                              return newErrors;
                            });
                          }}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={
                              formData[
                                `dept${num}_poc_name` as keyof typeof formData
                              ] || ""
                            }
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                [`dept${num}_poc_name`]: e.target.value,
                              });
                              if (errors[`dept${num}_poc_name`]) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors[`dept${num}_poc_name`];
                                  return newErrors;
                                });
                              }
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. John Doe"
                          />
                          {errors[`dept${num}_poc_name`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`dept${num}_poc_name`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Designation
                          </label>
                          <input
                            type="text"
                            value={
                              formData[
                                `dept${num}_poc_designation` as keyof typeof formData
                              ] || ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [`dept${num}_poc_designation`]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Sales Manager"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={
                              formData[
                                `dept${num}_email` as keyof typeof formData
                              ] || ""
                            }
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                [`dept${num}_email`]: e.target.value,
                              });
                              if (errors[`dept${num}_email`]) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors[`dept${num}_email`];
                                  return newErrors;
                                });
                              }
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="email@company.com"
                          />
                          {errors[`dept${num}_email`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`dept${num}_email`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={
                              formData[
                                `dept${num}_phone` as keyof typeof formData
                              ] || ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [`dept${num}_phone`]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="+1..."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {deptCount < 10 && (
                <button
                  type="button"
                  onClick={() => setDeptCount((prev) => prev + 1)}
                  className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                >
                  <Plus size={20} />
                  Add {deptCount === 0 ? "First Contact" : "Additional Contact"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6  shadow-lg flex gap-3">
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
              submitting ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
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
