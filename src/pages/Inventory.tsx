
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
  Upload
} from "lucide-react";
import api, { ProductAPI } from "../lib/api";
import DataTable from "../components/DataTable";
import Toast from "../components/Toast";
import Drawer from "../components/Drawer";
import { generateBreadcrumb } from "../utils/categoryHelper";
import { getScoreColorClasses } from "../utils/completenessHelper";
import { InventoryProduct, InventoryStatus, InventoryStats } from "../types/inventory";
import { exportToCSV, parseCSV } from "../utils/csvHelper";
import { isValidInventoryFile } from "../utils/fileValidator";

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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const [sortKey, setSortKey] = useState<string>("product_code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<InventoryStatus>("In Stock");
  const downloadTemplate=()=>{
    const template=[
        {sku:"PRD-EXAMPLE-123",brand:"Garmin",vendor:"Marine-Distrubutor-Ltd",quantity:50}
    ]
    exportToCSV(template,'inventory_update_template.csv')
  }
  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await ProductAPI.getAll() as InventoryProduct[];
      setProducts(data || []);
    } catch (error) {
      setToast({ message: "Failed to load inventory", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  const handleImport=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]
    if(!file)return
    if(!isValidInventoryFile(file))
    {
        setToast({message:'Invalid format.Please upload a csv,.xlsx, or .xls file',type:'error'})
        e.target.value=''
        return
    }
    if(!file)return
    try {
        setLoading(true)
        const rawData=await parseCSV(file)
        const response=await api.post('/inventory/bulk-update',rawData)
        const {success_count,errors_count,errors}=response.data
        if(errors_count===0)
        {
            setToast({message:`Successfully updated ${success_count} products`,type:'success'})
        }
        else
        {
            setToast({message:`Updated  ${success_count}.Failed ${errors_count}`,type:'error'})
        }
        loadInventory()
    } catch (error) {
        setToast({message:"An error occured while importing file",type:'error'})
    }
    finally{
        setLoading(false)
        e.target.value=''
    }
  }
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
        (p.brand?.brand_name || p.brand_name || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || p.inventory_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      const aVal = (a[sortKey as keyof InventoryProduct] || "").toString().toLowerCase();
      const bVal = (b[sortKey as keyof InventoryProduct] || "").toString().toLowerCase();
      
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return result;
  }, [products, searchTerm, statusFilter, sortKey, sortDirection]);

  const stats = useMemo<InventoryStats>(() => ({
    total: products.length,
    available: products.filter(p => p.inventory_status === 'In Stock').length,
    critical: products.filter(p => (p.available_quantity || 0) === 0).length
  }), [products]);

  const handleSave = async (): Promise<void> => {
    if (!selectedProduct) return;
    try {
      await ProductAPI.update(selectedProduct.product_code, {
        available_quantity: editQty,
        inventory_status: editStatus
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
      case "In Stock": return <CheckCircle2 size={14} className="text-green-600" />;
      case "Low Stock": return <AlertTriangle size={14} className="text-amber-600" />;
      case "Out of Stock": return <XCircle size={14} className="text-red-600" />;
      case "Backordered": return <Clock size={14} className="text-blue-600" />;
      case "Discontinued": return <Ban size={14} className="text-gray-600" />;
      default: return null;
    }
  };

  const columns = [
    // { key: "product_code", label: "Code", sortable: true },
    { key: "product_name", label: "Name", sortable: true },
    { 
      key: "brand_name", 
      label: "Brand", 
      sortable: true,
      render: (_: string, row: InventoryProduct) => row.brand?.brand_name || row.brand_name || "N/A" 
    },
    { 
      key: "vendor_name", 
      label: "Vendor", 
      sortable: true,
      render: (_: string, row: InventoryProduct) => row.vendor?.vendor_name || row.vendor_name || "N/A" 
    },
    { key: "industry_name", label: "Industry", sortable: true },
    { 
      key: "category", 
      label: "Category", 
      sortable: false,
      render: (_: string, row: InventoryProduct) => (
        <span className="text-xs text-gray-500">{generateBreadcrumb(row as any)}</span>
      )
    },
    { 
      key: "inventory_status", 
      label: "Status", 
      sortable: true,
      render: (_:string,row:InventoryProduct) => (
        <span className="flex items-center gap-1.5">
         {getStatusIcon(row.inventory?.inventory_status)}
         {row.inventory?.inventory_status||"Pending"}
        </span>
      ) 
    },
    { 
      key: "available_quantity", 
      label: "Qty", 
      sortable: true,
      render: (_:string,row:InventoryProduct) =>(
         <span className="font-bold">{row.inventory?.available_quantity??0}</span> 
      )
    },
    {
      key: "completeness_score",
      label: "Quality Score",
      sortable: true,
      render: (score: number) => {
        const colors = getScoreColorClasses(score || 0);
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
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
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-1">Operational stock control and basic info</p>
      </header>
        <div className="flex gap-2">
            <button onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Download size={18}/>
                Export
            </button>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Upload size={18}/>
                Import
                <input type='file' accept=".csv" onChange={handleImport} className="hidden"/>
            </label>

        </div>
      {/* <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<LayoutGrid size={24}/>} label="Catalog Size" value={`${stats.total} SKUs`} color="blue" />
        <StatCard icon={<CheckCircle2 size={24}/>} label="Available" value={stats.available} color="green" />
        <StatCard icon={<XCircle size={24}/>} label="Critical Stock" value={stats.critical} color="red" />
      </section> */}

      <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search code, name, or brand..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </section>

      {/* --- Dynamic Filter Status Info Bar --- */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500 italic">
          {searchTerm || statusFilter !== "all" ? (
            <span>
              Showing <strong>{filteredAndSortedProducts.length}</strong> matching
              results out of {products.length} total products.
            </span>
          ) : (
            <span>
              Showing all <strong>{products.length}</strong> products.
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

      <DataTable 
        columns={columns} 
        data={filteredAndSortedProducts} 
        isLoading={loading} 
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Update Inventory">
  <div className="p-6 space-y-6">
    {selectedProduct && (
      <>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Product</p>
            <p className="font-bold text-gray-900 leading-tight">{selectedProduct.product_name}</p>
            <p className="text-sm text-gray-500">SKU: {selectedProduct.product_code}</p>
          </div>
          
          <div className="pt-3 border-t border-blue-200/50 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase">Current Qty</p>
              <p className="text-lg font-bold text-blue-900">
                {selectedProduct.inventory?.available_quantity ?? 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-blue-400 uppercase">Current Status</p>
              <p className="text-sm font-bold text-blue-900">
                {selectedProduct.inventory?.inventory_status ?? "Pending"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Manual Status</label>
            <select 
              value={editStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditStatus(e.target.value as InventoryStatus)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Quantity</label>
            <input 
              type="number" 
              min={0}
              value={editQty}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditQty(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-xl font-bold focus:ring-2 focus:ring-blue-500"
            />
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
            Commit Changes
          </button>
        </footer>
      </>
    )}
  </div>
</Drawer>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: "blue" | "green" | "red" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600"
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