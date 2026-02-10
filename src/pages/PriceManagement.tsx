import React, { useState, useEffect, useMemo } from "react";
import { 
  ChevronRight, 
  Building2, 
  Tag, 
  Layers, 
  DollarSign, 
  Percent, 
  RotateCcw 
} from "lucide-react";
import api, { MasterAPI, ProductAPI } from "../lib/api";
import { SearchableSelect } from "../components/SearchableSelect";
import Toast from "../components/Toast";

interface VendorData { vendor_code: string; vendor_name: string; }
interface BrandData { brand_code: string; brand_name: string; }
interface CategoryData { category_code: string; category_1: string; breadcrumb: string; }

export default function PriceManagement() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allVendors, setAllVendors] = useState<VendorData[]>([]);
  const [allBrands, setAllBrands] = useState<BrandData[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryData[]>([]);

  const [selectedVendorCode, setSelectedVendorCode] = useState<string>(""); 
  const [selectedBrandCode, setSelectedBrandCode] = useState<string>("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  
  const [priceValue, setPriceValue] = useState<number>(0);
  const [priceOption, setPriceOption] = useState("price");
  const [adjustmentType, setAdjustmentType] = useState<"amount" | "percentage">("amount");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [ven, brn, cat, prd] = await Promise.all([
        MasterAPI.getVendors(),
        MasterAPI.getBrands(),
        MasterAPI.getCategories(),
        ProductAPI.getAll(0, 1000) 
      ]);
      setAllVendors(ven || []);
      setAllBrands(brn || []);
      setAllCategories(cat || []);
      setAllProducts(prd || []);
    } catch (e) {
      setToast({ message: "Failed to load relationship data", type: "error" });
    } finally {
      setLoading(false);
    }
  };


  const availableBrands = useMemo(() => {
    if (!selectedVendorCode) return allBrands;
    const linkedBrandCodes = new Set(
      allProducts
        .filter(p => p.vendor_code === selectedVendorCode)
        .map(p => p.brand_code)
    );
    return allBrands.filter(b => linkedBrandCodes.has(b.brand_code));
  }, [selectedVendorCode, allBrands, allProducts]);

  const availableCategories = useMemo(() => {
    if (!selectedBrandCode) return allCategories;
    const linkedCatCodes = new Set(
      allProducts
        .filter(p => p.brand_code === selectedBrandCode && (!selectedVendorCode || p.vendor_code === selectedVendorCode))
        .map(p => p.category_code)
    );
    return allCategories.filter(c => linkedCatCodes.has(c.category_code));
  }, [selectedBrandCode, selectedVendorCode, allCategories, allProducts]);

  const handleVendorChange = (val: string) => {
    const found = allVendors.find(v => v.vendor_name === val);
    setSelectedVendorCode(found?.vendor_code || "");
    setSelectedBrandCode(""); 
    setSelectedCats([]);       
  };

  const handleBrandChange = (val: string) => {
    const found = allBrands.find(b => b.brand_name === val);
    setSelectedBrandCode(found?.brand_code || "");
    setSelectedCats([]); 
  };

  const handleApplyPricing = async () => {
    if (!selectedVendorCode || !selectedBrandCode || selectedCats.length === 0 || priceValue === 0) {
      setToast({ message: "Please select Vendor, Brand, Categories, and enter a value", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/updateRetailPrice/", {
        vendor_code: selectedVendorCode,
        brand_code: selectedBrandCode,
        category_id_list: selectedCats,
        adjustment_type: adjustmentType,
        price_option: priceOption,
        value: priceValue,
      });

      if (response.status === 200) {
        setToast({ message: "Pricing updated successfully", type: "success" });
      }
    } catch (e) {
      setToast({ message: "Failed to apply pricing changes", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Retail Pricing Schema</h1>
        <p className="text-gray-600 mt-1">Cascading price adjustments based on product relationships</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Building2 size={16} className="text-blue-500" /> 1. Select Vendor
              </label>
              <SearchableSelect 
                options={allVendors.map(v => v.vendor_name)}
                value={allVendors.find(v => v.vendor_code === selectedVendorCode)?.vendor_name || ""}
                onChange={handleVendorChange}
                placeholder="Choose Vendor..."
              />
            </div>

            <div className={!selectedVendorCode ? "opacity-50 pointer-events-none" : ""}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Tag size={16} className="text-blue-500" /> 2. Select Brand
              </label>
              <SearchableSelect 
                options={availableBrands.map(b => b.brand_name)}
                value={allBrands.find(b => b.brand_code === selectedBrandCode)?.brand_name || ""}
                onChange={handleBrandChange}
                placeholder={selectedVendorCode ? "Choose Brand..." : "Select Vendor first"}
              />
            </div>
          </div>

          <div className={!selectedBrandCode ? "opacity-50 pointer-events-none" : ""}>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Layers size={16} className="text-blue-500" /> 3. Applicable Categories
            </label>
            <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50/30">
              {availableCategories.length > 0 ? (
                <>
                  <label className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer border-b border-gray-100 mb-1 sticky top-0 bg-white z-10">
                      <input 
                        type="checkbox" 
                        onChange={(e) => e.target.checked ? setSelectedCats(availableCategories.map(c => c.category_code)) : setSelectedCats([])}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-bold text-blue-600 uppercase tracking-tight text-xs">Select all available</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-2">
                    {availableCategories.map(cat => (
                      <label key={cat.category_code} className="flex items-center gap-2 p-2 hover:bg-white hover:shadow-sm rounded-lg cursor-pointer transition-all">
                        <input 
                          type="checkbox" 
                          checked={selectedCats.includes(cat.category_code)}
                          onChange={() => setSelectedCats(prev => prev.includes(cat.category_code) ? prev.filter(c => c !== cat.category_code) : [...prev, cat.category_code])}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700 truncate">{cat.breadcrumb || cat.category_1}</span>
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm italic">
                  {selectedBrandCode ? "No categories found for this selection" : "Select a Brand to see categories"}
                </div>
              )}
            </div>
          </div>

          <div className={`bg-blue-50/50 rounded-2xl p-6 border border-blue-100 transition-opacity ${(!selectedVendorCode || !selectedBrandCode || selectedCats.length === 0) ? 'opacity-50' : 'opacity-100'}`}>
            <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
               Adjustment Strategy
            </h3>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex bg-white p-1 rounded-xl border border-gray-200 w-fit h-fit">
                <button 
                  onClick={() => setAdjustmentType("amount")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${adjustmentType === 'amount' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <DollarSign size={16}/> Fixed $
                </button>
                <button 
                  onClick={() => setAdjustmentType("percentage")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${adjustmentType === 'percentage' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Percent size={16}/> Percentage %
                </button>
              </div>

              <div className="flex-1 flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{adjustmentType === 'amount' ? '$' : '%'}</span>
                  <input 
                    type="number"
                    value={priceValue}
                    onChange={(e) => setPriceValue(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                    placeholder="0.00"
                  />
                </div>
                <select 
                  className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500"
                  value={priceOption}
                  onChange={(e) => setPriceOption(e.target.value)}
                >
                  <option value="price">Retail Price</option>
                  <option value="msrp">MSRP</option>
                  <option value="sale_price">Sale Price</option>
                  <option value="list_price">List Price</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={handleApplyPricing}
              disabled={loading || selectedCats.length === 0}
              className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Commit Pricing Rule"}
              <ChevronRight size={20}/>
            </button>
            <button 
              onClick={() => { setSelectedVendorCode(""); setSelectedBrandCode(""); setSelectedCats([]); setPriceValue(0); }}
              className="flex-1 py-4 border border-gray-300 rounded-2xl text-gray-600 hover:bg-gray-50 font-bold flex items-center justify-center gap-2"
            >
              <RotateCcw size={18}/> Reset
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}