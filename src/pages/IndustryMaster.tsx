import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  CheckCircle,
  X,
  XCircle,
  Loader2,
  Eye, // Import Eye icon
  FolderTree, // Icon for empty state
} from "lucide-react";
import { MasterAPI } from "../lib/api";
import Drawer from "../components/Drawer";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import DataTable from "../components/DataTable";
import { exportToCSV, parseCSV } from "../utils/csvHelper";
import CustomDownloadIcon from "../assets/download-custom.png";
import { generateEntityCode } from "../utils/codeGenerator";

// Define Interfaces
export interface Industry {
  industry_code: string;
  industry_name: string;
  is_active: boolean;
}

// Minimal Category interface for display
interface Category {
  category_code: string;
  category_1: string;
  category_2?: string;
  industry_code: string;
  breadcrumb: string;
}

export function IndustryMaster() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // Store categories
  const [filteredIndustries, setFilteredIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState("industry_code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  // Drawers & Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  
  // New State for Viewing Categories
  const [viewIndustry, setViewIndustry] = useState<Industry | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    industry: Industry | null;
  }>({ isOpen: false, industry: null });

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [formData, setFormData] = useState<Partial<Industry>>({
    industry_code: "",
    industry_name: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortIndustries();
  }, [industries, searchTerm, statusFilter, sortKey, sortDirection]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch both Industries and Categories
      const [indData, catData] = await Promise.all([
        MasterAPI.getIndustries(),
        MasterAPI.getCategories(),
      ]);
      setIndustries(indData || []);
      setCategories(catData || []);
    } catch (error: any) {
      setToast({ message: "Failed to load data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortIndustries = () => {
    let filtered = [...industries];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          (i.industry_code || "").toLowerCase().includes(term) ||
          (i.industry_name || "").toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      const isActive = statusFilter === "Active";
      filtered = filtered.filter((i) => i.is_active === isActive);
    }

    filtered.sort((a, b) => {
      const aVal = String(a[sortKey as keyof Industry] || "").toLowerCase();
      const bVal = String(b[sortKey as keyof Industry] || "").toLowerCase();
      if (sortDirection === "asc") return aVal.localeCompare(bVal);
      return bVal.localeCompare(aVal);
    });

    setFilteredIndustries(filtered);
  };

  // ... (toggleSelect, toggleSelectAll, handleBulkStatusChange, handleToggleStatus remain the same)
  const toggleSelect = (code: string) => {
    const newSet = new Set(selectedCodes);
    if (newSet.has(code)) newSet.delete(code);
    else newSet.add(code);
    setSelectedCodes(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedCodes.size === filteredIndustries.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(filteredIndustries.map((i) => i.industry_code)));
    }
  };

  const handleBulkStatusChange = async (active: boolean) => {
    const codes = Array.from(selectedCodes);
    try {
      setLoading(true);
      await Promise.all(
        codes.map((code) =>
          MasterAPI.update("industries", code, { is_active: active })
        )
      );
      setToast({
        message: `Updated ${codes.length} industries successfully`,
        type: "success",
      });
      setSelectedCodes(new Set());
      loadData();
    } catch (error) {
      setToast({ message: "Bulk update failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (industry: Industry) => {
    try {
      await MasterAPI.update("industries", industry.industry_code, {
        is_active: !industry.is_active,
      });
      setToast({
        message: `Industry ${!industry.is_active ? "activated" : "deactivated"}`,
        type: "success",
      });
      loadData();
    } catch (error) {
      setToast({ message: "Failed to update status", type: "error" });
    }
  };

  // ... (validateForm, handleSubmit, handleDelete, resetForm remain the same, just call loadData() instead of loadIndustries())
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.industry_name?.trim()) {
      newErrors.industry_name = "Industry Name is required";
    }

    const duplicate = industries.find(
      (i) =>
        i.industry_name.toLowerCase() ===
          formData.industry_name?.trim().toLowerCase() &&
        (!editingIndustry || i.industry_code !== editingIndustry.industry_code)
    );

    if (duplicate) {
      newErrors.industry_name = "Industry name already exists";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        industry_name: formData.industry_name?.trim(),
      };

      if (!editingIndustry && !payload.industry_code) {
        payload.industry_code = generateEntityCode(
          "industry",
          payload.industry_name || ""
        );
      }

      if (editingIndustry) {
        await MasterAPI.update(
          "industries",
          editingIndustry.industry_code,
          payload
        );
        setToast({ message: "Industry updated", type: "success" });
      } else {
        await MasterAPI.create("industries", payload);
        setToast({ message: "Industry created", type: "success" });
      }

      setIsDrawerOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      setToast({ message: error.message || "Operation failed", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.industry) return;
    try {
      await MasterAPI.delete("industries", deleteModal.industry.industry_code);
      setToast({ message: "Industry deleted", type: "success" });
      setDeleteModal({ isOpen: false, industry: null });
      loadData();
    } catch (error: any) {
      setToast({ message: "Cannot delete industry in use", type: "error" });
    }
  };

  const resetForm = () => {
    setFormData({ industry_code: "", industry_name: "", is_active: true });
    setEditingIndustry(null);
    setErrors({});
  };

  const handleExport = () => {
    if (filteredIndustries.length === 0) {
      setToast({ message: "No data to export", type: "error" });
      return;
    }
    exportToCSV(filteredIndustries, "industries.csv");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await parseCSV(file);
      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        if (!row.industry_name) {
          errorCount++;
          continue;
        }

        const payload = {
          industry_name: row.industry_name.trim(),
          industry_code:
            row.industry_code ||
            generateEntityCode("industry", row.industry_name),
          is_active:
            row.is_active !== undefined
              ? String(row.is_active).toLowerCase() === "true"
              : true,
        };

        try {
          const exists = industries.find(
            (i) =>
              i.industry_name.toLowerCase() ===
              payload.industry_name.toLowerCase()
          );
          if (!exists) {
            await MasterAPI.create("industries", payload);
            successCount++;
          } else {
            errorCount++; 
          }
        } catch (e) {
          errorCount++;
        }
      }

      setToast({
        message: `Imported ${successCount} industries. ${errorCount} skipped/failed.`,
        type: successCount > 0 ? "success" : "error",
      });
      loadData();
    } catch (e) {
      setToast({ message: "Import failed", type: "error" });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const downloadTemplate = () => {
    exportToCSV(
      [{ industry_name: "Automotive", industry_code: "", is_active: "true" }],
      "industry_template.csv"
    );
  };

  // Helpers for View Logic
  const getIndustryCategories = (industryCode: string) => {
    return categories.filter(c => c.industry_code === industryCode);
  };

  const columns = [
    {
      key: "selection",
      label: (
        <input
          type="checkbox"
          checked={
            selectedCodes.size === filteredIndustries.length &&
            filteredIndustries.length > 0
          }
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ) as any,
      render: (_: any, row: Industry) => (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedCodes.has(row.industry_code)}
            onChange={() => toggleSelect(row.industry_code)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      ),
      width: "50px",
    },
    // Industry Name Column - Clickable to View
    { 
      key: "industry_name", 
      label: "Industry Name", 
      sortable: true,
      render: (val: string, row: Industry) => (
        <button 
          onClick={() => setViewIndustry(row)}
          className="text-gray-900 hover:text-blue-600 font-medium hover:underline text-left"
        >
          {val}
        </button>
      )
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      render: (val: boolean) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
      render: (_: any, row: Industry) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewIndustry(row)}
            className="p-1 hover:bg-purple-50 text-purple-600 rounded"
            title="View Categories"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setEditingIndustry(row);
              setFormData(row);
              setIsDrawerOpen(true);
            }}
            className="p-1 hover:bg-blue-50 text-blue-600 rounded"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            className={`p-1.5 rounded ${
              row.is_active
                ? "hover:bg-red-50 text-red-600"
                : "hover:bg-green-50 text-green-600"
            }`}
            title={row.is_active ? "Deactivate" : "Activate"}
          >
            {row.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
          </button>
          <button
            onClick={() => setDeleteModal({ isOpen: true, industry: row })}
            className="p-1 hover:bg-red-50 text-red-600 rounded"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden space-y-4">
      <div className="flex-shrink-0 space-y-4 px-1 pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Industry Master
            </h1>
            <p className="text-gray-600 mt-1">Manage industry categories</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full md:w-[400px]">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search Industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 border border-gray-200 rounded-full shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setEditingIndustry(null);
                resetForm();
                setIsDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md font-bold transition-all"
            >
              <Plus size={20} />
              Add Industry
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value=""hidden>Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Download size={16} /> Export
              </button>
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer">
                <Upload size={16} /> Import
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Download Template"
              >
                <img
                  src={CustomDownloadIcon}
                  alt="Template"
                  className="w-5 h-5 opacity-70"
                />
              </button>
            </div>
          </div>
        </div>

        {selectedCodes.size > 0 && (
          <div className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
                {selectedCodes.size} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusChange(true)}
                  className="px-3 py-1 bg-green-500 hover:bg-green-400 rounded text-xs font-bold"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkStatusChange(false)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-400 rounded text-xs font-bold"
                >
                  Deactivate
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedCodes(new Set())}
              className="text-white/80 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <DataTable
          columns={columns}
          data={filteredIndustries}
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
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingIndustry ? "Edit Industry" : "Add Industry"}
      >
        <div className="p-6 space-y-6">
          {editingIndustry && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry Code
              </label>
              <input
                type="text"
                value={formData.industry_code}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.industry_name}
              onChange={(e) => {
                setFormData({ ...formData, industry_name: e.target.value });
                if (errors.industry_name)
                  setErrors({ ...errors, industry_name: "" });
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                errors.industry_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g. Automotive"
            />
            {errors.industry_name && (
              <p className="text-red-500 text-xs mt-1">
                {errors.industry_name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.is_active ? "Active" : "Inactive"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  is_active: e.target.value === "Active",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="animate-spin" size={16} />}
            {editingIndustry ? "Update" : "Add"} Industry
          </button>
        </div>
      </Drawer>

      <Drawer
        isOpen={!!viewIndustry}
        onClose={() => setViewIndustry(null)}
        title={viewIndustry ? `Categories in ${viewIndustry.industry_name}` : "Categories"}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4">
            {viewIndustry ? (
              getIndustryCategories(viewIndustry.industry_code).length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-500 mb-2">
                    Found {getIndustryCategories(viewIndustry.industry_code).length} categories.
                  </div>
                  {getIndustryCategories(viewIndustry.industry_code).sort((a,b) => (a.breadcrumb||'').localeCompare(b.breadcrumb||'')).map((cat) => (
                    <div 
                      key={cat.category_code}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{cat.category_1}</div>
                          {cat.breadcrumb && (
                            <div className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-0.5 rounded inline-block">
                              {cat.breadcrumb}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {cat.category_code}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <FolderTree size={48} className="mb-2 opacity-50" />
                  <p>No categories linked to this industry.</p>
                </div>
              )
            ) : null}
          </div>
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={() => setViewIndustry(null)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, industry: null })}
        title="Delete Industry"
        actions={
          <>
            <button
              onClick={() => setDeleteModal({ isOpen: false, industry: null })}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete industry{" "}
          <span className="font-bold text-gray-900">
            {deleteModal.industry?.industry_name}
          </span>
          ? This cannot be undone.
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