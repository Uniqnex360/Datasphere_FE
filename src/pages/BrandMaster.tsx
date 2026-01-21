import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  Tag,
} from "lucide-react";
import { Brand } from "../types/brand";
import Drawer from "../components/Drawer";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import DataTable from "../components/DataTable";
import { exportToCSV, parseCSV } from "../utils/csvHelper";
import { MasterAPI, ProductAPI } from "../lib/api";
import { generateEntityCode } from "../utils/codeGenerator";

export function BrandMaster() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
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

  const loadBrands = async () => {
    try {
      const data=await MasterAPI.getBrands()

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
          b.brand_name.toLowerCase().includes(searchTerm.toLowerCase()),
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

    if (!formData.brand_name?.trim()) {
      newErrors.brand_name = "Brand name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingBrand) {
        await MasterAPI.update('brands',editingBrand.brand_code,formData)
        setToast({ message: "Brand updated successfully", type: "success" });
      } else {
        const dataToSubmit={
          ...formData,
          brand_code:formData.brand_code||generateEntityCode('brand',formData.brand_name||"")
        }
        await MasterAPI.create('brands',formData)
        setToast({ message: "Brand added successfully", type: "success" });
      }

      setIsDrawerOpen(false);
      setEditingBrand(null);
      resetForm();
      loadBrands();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData(brand);
    setErrors({});
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.brand) return;

    try {
      // const { data: products } = await supabase
      //   .from("product_master")
      //   .select("product_code")
      //   .eq("brand_code", deleteModal.brand.brand_code)
      //   .limit(1);
      const products=await ProductAPI.getAll(0,1,{brand_name:deleteModal.brand.brand_name})
       if (Array.isArray(products) && products.length > 0) {
        setToast({
          message: "Cannot delete brand. It is linked to products.",
          type: "error",
        });
        setDeleteModal({ isOpen: false, brand: null });
        return;
      }

      // const { error } = await supabase
      //   .from("brand_master")
      //   .delete()
      //   .eq("brand_code", deleteModal.brand.brand_code);

      // if (error) throw error;

      setToast({ message: "Brand deleted successfully", type: "success" });
      setDeleteModal({ isOpen: false, brand: null });
      loadBrands();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseCSV(file);
      const validData: Partial<Brand>[] = [];
      const importErrors: string[] = [];
      const validColumns = [
        "brand_code",
        "brand_name",
        "brand_logo",
        "mfg_code",
        "mfg_name",
        "mfg_logo",
      ];

      data.forEach((row, index) => {
        const rowErrors: string[] = [];

        if (!row.brand_name?.trim()) {
          rowErrors.push("brand_name is required");
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

          if (
            brandData.brand_code === "" ||
            brandData.brand_code === undefined
          ) {
            brandData.brand_code = generateEntityCode('brand',brandData.brand_name || '');
          }
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
      let count=0
      for (const brand of validData)
      {
        await MasterAPI.create('brands',brand)
        count++
      }


      setToast({
        message: `${count} brands imported successfully`,
        type: "success",
      });
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
    { key: "brand_name", label: "Brand Name", sortable: true },
    {
      key: "mfg_logo",
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
    { key: "mfg_name", label: "Manufacturer", sortable: true },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
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
            onClick={() => setDeleteModal({ isOpen: true, brand: row })}
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
          <h1 className="text-3xl font-bold text-gray-900">Brand Master</h1>
          <p className="text-gray-600 mt-1">
            Manage brand and manufacturer information
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBrand(null);
            resetForm();
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Brand
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search brand code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
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
              <Tag size={20} />
            </button>
          </div>
        </div>
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
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Brand Information</h3>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated upon creation
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.brand_name}
                  onChange={(e) =>
                    setFormData({ ...formData, brand_name: e.target.value })
                  }
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
                  Brand Logo URL
                </label>
                <input
                  type="text"
                  value={formData.brand_logo}
                  onChange={(e) =>
                    setFormData({ ...formData, brand_logo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/logo.png"
                />
                {formData.brand_logo && (
                  <img
                    src={formData.brand_logo}
                    alt="Brand logo preview"
                    className="mt-2 h-16 w-16 object-contain border border-gray-200 rounded"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              Manufacturer Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer Code
                </label>
                <input
                  type="text"
                  value={formData.mfg_code}
                  onChange={(e) =>
                    setFormData({ ...formData, mfg_code: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer Name
                </label>
                <input
                  type="text"
                  value={formData.mfg_name}
                  onChange={(e) =>
                    setFormData({ ...formData, mfg_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer Logo URL
                </label>
                <input
                  type="text"
                  value={formData.mfg_logo}
                  onChange={(e) =>
                    setFormData({ ...formData, mfg_logo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/mfg-logo.png"
                />
                {formData.mfg_logo && (
                  <img
                    src={formData.mfg_logo}
                    alt="Mfg logo preview"
                    className="mt-2 h-16 w-16 object-contain border border-gray-200 rounded"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingBrand ? "Update" : "Add"} Brand
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
