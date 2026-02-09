import React, { useState, useEffect } from "react";
import { 
  ChevronRight, 
  Building2,
  RefreshCw
} from "lucide-react";
import api, { MasterAPI } from "../lib/api";
import { SearchableSelect } from "../components/SearchableSelect";
import Toast from "../components/Toast";

interface VendorData {
  vendor_code: string;
  vendor_name: string;
}

export default function PriceManagement() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const [vendors, setVendors] = useState<VendorData[]>([]); 
  const [categories, setCategories] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  
  const [selectedVendorCode, setSelectedVendorCode] = useState<string>(""); 
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [catPriceValue, setCatPriceValue] = useState<number>(0);
  const [catPriceOption, setCatPriceOption] = useState("finished_price");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [vendorData, catData] = await Promise.all([
        MasterAPI.getVendors(),
        MasterAPI.getCategories()
      ]);
      setVendors(vendorData || []);
      setCategories(catData || []);
    } catch (e) {
      setToast({ message: "Failed to load vendor or category data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCategoryPricing = async () => {
    if (!selectedVendorCode || selectedCats.length === 0 || catPriceValue === 0) {
      setToast({ message: "Please select a Vendor, Categories, and enter a Price", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/updateRetailPrice/", {
        category_id_list: selectedCats,
        vendor_code: selectedVendorCode, 
        price_option: catPriceOption,
        price: catPriceValue,
      });

      if (response.status === 200) {
        setToast({ message: "Pricing rules applied successfully", type: "success" });
      }
    } catch (e) {
      setToast({ message: "Failed to apply pricing rule", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Retail Pricing Schema</h1>
        <p className="text-gray-600 mt-1">Manage pricing adjustments by Vendor and Category</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building2 size={20}/></div>
            <h2 className="text-lg font-bold text-gray-800">Based on Vendor & Categories</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Vendor *</label>
              <SearchableSelect 
                options={vendors.map(v => v.vendor_name)}
                value={vendors.find(v => v.vendor_code === selectedVendorCode)?.vendor_name || ""}
                onChange={(val) => {
                    const found = vendors.find(v => v.vendor_name === val);
                    setSelectedVendorCode(found?.vendor_code || "");
                }}
                placeholder="Search vendors..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Categories *</label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer border-b mb-1">
                    <input 
                      type="checkbox" 
                      onChange={(e) => e.target.checked ? setSelectedCats(categories.map(c => c.category_code)) : setSelectedCats([])}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-sm font-bold text-blue-600">Select All Categories</span>
                </label>
                {categories.map(cat => (
                  <label key={cat.category_code} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedCats.includes(cat.category_code)}
                      onChange={() => {
                        setSelectedCats(prev => 
                          prev.includes(cat.category_code) 
                          ? prev.filter(c => c !== cat.category_code) 
                          : [...prev, cat.category_code]
                        )
                      }}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{cat.breadcrumb || cat.category_1}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* <div className="bg-gray-50 p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adjustment Logic</h3>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input 
                    type="number"
                    value={catPriceValue}
                    onChange={(e) => setCatPriceValue(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <select 
                  className="px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-sm font-medium"
                  value={catPriceOption}
                  onChange={(e) => setCatPriceOption(e.target.value)}
                >
                  <option value="finished_price">Finished Wholesale</option>
                  <option value="un_finished_price">Unfinished Wholesale</option>
                </select>
              </div>
            </div> */}

            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleApplyCategoryPricing}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              >
                Apply Changes <ChevronRight size={18}/>
              </button>
              <button 
                onClick={() => {
                    setSelectedVendorCode("");
                    setSelectedCats([]);
                    setCatPriceValue(0);
                }}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center items-center text-center space-y-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-full">
                <RefreshCw size={32} className="animate-spin-slow" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Variant-Based Pricing</h3>
            <p className="text-sm text-gray-500 max-w-xs">
                Configure adjustments based on specific product variants (e.g., Wood Type, Color, Size).
            </p>
            <button className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg font-bold hover:bg-purple-200 transition-colors">
                Coming Soon
            </button>
        </div> */}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}