import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Edit,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Ban,
  LayoutGrid,
  Download,
  Upload,
  X,
} from "lucide-react";
import api, { ProductAPI } from "../lib/api";
import DataTable from "../components/DataTable";
import Toast from "../components/Toast";
import Drawer from "../components/Drawer";
import { generateBreadcrumb } from "../utils/categoryHelper";
import { getScoreColorClasses } from "../utils/completenessHelper";
import {
  InventoryProduct,
  InventoryStatus,
  InventoryStats,
} from "../types/inventory";
import { exportToCSV, parseCSV } from "../utils/csvHelper";
import { isValidInventoryFile } from "../utils/fileValidator";
import { FilterSelect } from "../components/Filter";

const STATUS_OPTIONS: InventoryStatus[] = [
  "In Stock",
  "Low Stock",
  "Out of Stock",
  //   "Backordered",
  //   "Discontinued",
  //   "Pre-order"
];

export default function Inventory() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [sortKey, setSortKey] = useState<string>("product_code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] =
    useState<InventoryProduct | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<InventoryStatus>("In Stock");
  const [tablefilteredInvertoryProduct, settablefilteredInvertoryProduct] =
    useState<InventoryProduct[]>([]);
  const downloadTemplate = () => {
    const template = [
      {
        sku: "PRD-EXAMPLE-123",
        brand: "Garmin",
        vendor: "Marine-Distrubutor-Ltd",
        quantity: 50,
      },
    ];
    exportToCSV(template, "inventory_update_template.csv");
  };
  useEffect(() => {
    loadInventory();
  }, []);

  // use effect for search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadInventory();
    }, 350);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  useEffect(() => {
    if (editQty <= 0) {
      setEditStatus("Out of Stock");
    } else if (editQty < 50) {
      setEditStatus("Low Stock");
    } else {
      setEditStatus("In Stock");
    }
  }, [editQty]);
  const loadInventory = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = (await ProductAPI.getAll(
        0,
        100,
        searchTerm,
      )) as InventoryProduct[];
      setProducts(data || []);
    } catch (error) {
      setToast({ message: "Failed to load inventory", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isValidInventoryFile(file)) {
      setToast({
        message: "Invalid format.Please upload a csv,.xlsx, or .xls file",
        type: "error",
      });
      e.target.value = "";
      return;
    }
    if (!file) return;
    try {
      setLoading(true);
      const rawData = await parseCSV(file);
      const response = await api.post("/inventory/bulk-update", rawData);
      const { success_count, errors_count, errors } = response.data;
      if (errors_count === 0) {
        setToast({
          message: `Successfully updated ${success_count} products`,
          type: "success",
        });
      } else {
        setToast({
          message: `Updated  ${success_count}.Failed ${errors_count}`,
          type: "error",
        });
      }
      loadInventory();
    } catch (error) {
      setToast({
        message: "An error occured while importing file",
        type: "error",
      });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch =
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand?.brand_name || p.brand_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || p.inventory_status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      const aVal = (a[sortKey as keyof InventoryProduct] || "")
        .toString()
        .toLowerCase();
      const bVal = (b[sortKey as keyof InventoryProduct] || "")
        .toString()
        .toLowerCase();

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return result;
  }, [products, searchTerm, statusFilter, sortKey, sortDirection]);

  const stats = useMemo<InventoryStats>(
    () => ({
      total: products.length,
      available: products.filter((p) => p.inventory_status === "In Stock")
        .length,
      critical: products.filter((p) => (p.available_quantity || 0) === 0)
        .length,
    }),
    [products],
  );

  const handleSave = async (): Promise<void> => {
    if (!selectedProduct) return;
    try {
      await ProductAPI.update(selectedProduct.product_code, {
        available_quantity: editQty,
        inventory_status: editStatus,
      });
      setToast({ message: "Inventory updated successfully", type: "success" });
      setIsDrawerOpen(false);
      loadInventory();
    } catch (error) {
      setToast({ message: "Update failed", type: "error" });
    }
  };

  const getStatusIcon = (status: string | undefined): React.ReactNode => {
    switch (status) {
      case "In Stock":
        return <CheckCircle2 size={14} className="text-green-600" />;
      case "Low Stock":
        return <AlertTriangle size={14} className="text-amber-600" />;
      case "Out of Stock":
        return <XCircle size={14} className="text-red-600" />;
      case "Backordered":
        return <Clock size={14} className="text-blue-600" />;
      case "Discontinued":
        return <Ban size={14} className="text-gray-600" />;
      default:
        return null;
    }
  };

  //bulk selection helper functions
  const toggleSelectAll = () => {
    setSelectedCodes((prev) => {
      if (prev.size === products.length) {
        return new Set();
      }
      return new Set(products.map((v) => v.product_code));
    });
  };

  // handling table row selection
  const toggleSelect = (code: string) => {
    setSelectedCodes((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(code)) newSet.delete(code);
      else newSet.add(code);
      console.log(newSet);
      return newSet;
    });
  };

  const columns = [
    // { key: "product_code", label: "Code", sortable: true },
    {
      key: "selection",
      label: (
        <input
          type="checkbox"
          checked={
            selectedCodes.size === filteredAndSortedProducts.length &&
            filteredAndSortedProducts.length > 0
          }
          onChange={toggleSelectAll}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      ) as any,
      width: "100px",
      render: (_: any, row: InventoryProduct) => (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedCodes.has(row.product_code)}
            onChange={() => toggleSelect(row.product_code)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      ),
    },
    { key: "product_name", label: "Name", sortable: true },
    {
      key: "brand_name",
      label: "Brand",
      sortable: true,
      render: (_: string, row: InventoryProduct) =>
        row.brand?.brand_name || row.brand_name || "N/A",
    },
    {
      key: "vendor_name",
      label: "Vendor",
      sortable: true,
      render: (_: string, row: InventoryProduct) =>
        row.vendor?.vendor_name || row.vendor_name || "N/A",
    },
    { key: "industry_name", label: "Industry", sortable: true },
    {
      key: "category",
      label: "Category",
      sortable: false,
      render: (_: string, row: InventoryProduct) => (
        <span className="text-xs text-gray-500">
          {generateBreadcrumb(row as any)}
        </span>
      ),
    },
    {
      key: "inventory_status",
      label: "Status",
      sortable: true,
      render: (_: string, row: InventoryProduct) => (
        <span className="flex items-center gap-1.5">
          {getStatusIcon(row.inventory?.inventory_status)}
          {row.inventory?.inventory_status || "Pending"}
        </span>
      ),
    },
    {
      key: "available_quantity",
      label: "Qty",
      sortable: true,
      render: (_: string, row: InventoryProduct) => (
        <span className="font-bold">
          {row.inventory?.available_quantity ?? 0}
        </span>
      ),
    },
    {
      key: "completeness_score",
      label: "Quality Score",
      sortable: true,
      render: (score: number) => {
        const colors = getScoreColorClasses(score || 0);
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
          >
            {score || 0}%
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Manage",
      sortable: false,
      render: (_: string, row: InventoryProduct) => (
        <button
          onClick={() => {
            setSelectedProduct(row);
            setEditQty(row.inventory?.available_quantity || 0);
            setEditStatus(row.inventory?.inventory_status || "In Stock");
            setIsDrawerOpen(true);
          }}
          className="p-1 hover:bg-blue-100 text-blue-600 rounded"
        >
          <Edit size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between ouline items-center  -mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">
            Operational stock control and basic info
          </p>
        </div>
        {/* Search part */}
        <div className="relative w-full md:w-[500px] lg:w-[600px] transition-all duration-300 me-6">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search Inventory, Brand, Vendor..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
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
      </header>

      <section className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex justify-between gap-4">
        {/* filter */}
        <FilterSelect
          options={["In Stock", "Low Stock", "Out of Stock"]}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
        />

        {/* bulk import export options */}
        <div className="flex gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Download size={18} />
            Export
          </button>
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <Upload size={18} />
            Import
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </section>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500 italic">
          {searchTerm || statusFilter !== "all" ? (
            <span>
              Showing <strong>{filteredAndSortedProducts.length}</strong>{" "}
              matching results out of {products.length} total products
            </span>
          ) : (
            <span>
              Showing all <strong>{products.length}</strong> products
            </span>
          )}
        </p>

        {(searchTerm || statusFilter !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
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
            {/* <button
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
            </button> */}
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
        data={products}
        isLoading={loading}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Update Inventory"
      >
        <div className="p-6 space-y-6">
          {selectedProduct && (
            <>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                    Product
                  </p>
                  <p className="font-bold text-gray-900 leading-tight">
                    {selectedProduct.product_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    SKU: {selectedProduct.product_code}
                  </p>
                </div>

                <div className="pt-3 border-t border-blue-200/50 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase">
                      Current Qty
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {selectedProduct.inventory?.available_quantity ?? 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-blue-400 uppercase">
                      Current Status
                    </p>
                    <p className="text-sm font-bold text-blue-900">
                      {selectedProduct.inventory?.inventory_status ?? "Pending"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adjust Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editQty}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditQty(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-xl font-bold focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stock Status{" "}
                    <span className="text-xs font-normal text-gray-400">
                      (Auto-calculated)
                    </span>
                  </label>
                  <select
                    value={editStatus}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed font-medium"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-blue-500 mt-2 italic px-1">
                    * Status is "In Stock" at 50+, "Low Stock" under 50.
                  </p>
                </div>
              </div>

              <footer className="flex gap-3 pt-6 border-t mt-auto">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Update Inventory
                </button>
              </footer>
            </>
          )}
        </div>
      </Drawer>

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

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "blue" | "green" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
