import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  Copy,
  Package,
} from "lucide-react";
import {
  Product,
  ProductWithVariantStatus,
  VariantStatus,
} from "../types/product";
import { Brand } from "../types/brand";
import { Vendor } from "../types/vendor";
import { Category } from "../types/category";
import { Industry } from "../types/industry";
import { ProductVariant } from "../types/variant";
import Drawer from "../components/Drawer";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import DataTable from "../components/DataTable";
import { exportToCSV, parseCSV } from "../utils/csvHelper";
import { generateBreadcrumb } from "../utils/categoryHelper";
import {
  calculateCompletenessScore,
  getScoreColorClasses,
} from "../utils/completenessHelper";
import { MasterAPI, ProductAPI } from "../lib/api";
import { validateImportFormat } from "../utils/importValidator";
export function Products() {
  const [products, setProducts] = useState<ProductWithVariantStatus[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<
    ProductWithVariantStatus[]
  >([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<
    "basic" | "descriptions" | "attributes" | "variants" | "related" | "assets"
  >("basic");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    product: ProductWithVariantStatus | null;
  }>({ isOpen: false, product: null });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [variantStatusFilter, setVariantStatusFilter] = useState("");
  const [category1Filter, setCategory1Filter] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState("product_code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [formData, setFormData] = useState<Partial<Product>>({
    product_name: "",
    brand_code: "",
    brand_name: "",
    mfg_code: "",
    mfg_name: "",
    vendor_code: "",
    vendor_name: "",
    industry_name: "",
    category_code: "",
    product_type: "",
    sku: "",
    variant_sku: "",
    prod_short_desc: "",
    prod_long_desc: "",
    model_series: "",
    mpn: "",
    gtin: "",
    upc: "",
    unspsc: "",
    meta_title: "",
    meta_desc: "",
    meta_keywords: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    filterAndSortProducts();
  }, [
    products,
    searchTerm,
    industryFilter,
    brandFilter,
    vendorFilter,
    variantStatusFilter,
    category1Filter,
    productTypeFilter,
    sortKey,
    sortDirection,
  ]);
  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch everything in parallel
      const [
        productsData,
        brandsData,
        vendorsData,
        categoriesData,
        industriesData,
      ] = await Promise.all([
        ProductAPI.getAll(),
        MasterAPI.getBrands(),
        MasterAPI.getVendors(),
        MasterAPI.getCategories(),
        MasterAPI.getIndustries(),
      ]);
      const productsWithStatus = await calculateVariantStatus(
        productsData || [],
      );
      setProducts(productsWithStatus);
      setBrands(brandsData || []);
      setVendors(vendorsData || []);
      setCategories(categoriesData || []);
      setIndustries(industriesData || []);
    } catch (error: any) {
      setToast({ message: "Failed to load data", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  const calculateVariantStatus = async (
    productList: Product[],
  ): Promise<ProductWithVariantStatus[]> => {
    return productList.map((product) => {
      let variant_status: VariantStatus = "Base";
      let variant_count = 0;
      if (product.parent_sku) {
        variant_status = "Variant";
      } else {
        const children = productList.filter(
          (p) => p.parent_sku === product.product_code,
        );
        if (children.length > 0) {
          variant_status = "Parent";
          variant_count = children.length;
        }
      }
      return { ...product, variant_status, variant_count };
    });
  };
  const filterAndSortProducts = () => {
    let filtered = [...products];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.product_code.toLowerCase().includes(term) ||
          p.product_name.toLowerCase().includes(term) ||
          p.brand_name.toLowerCase().includes(term) ||
          generateBreadcrumb(p as any)
            .toLowerCase()
            .includes(term),
      );
    }
    if (industryFilter) {
      filtered = filtered.filter((p) => p.industry_name === industryFilter);
    }
    if (brandFilter) {
      filtered = filtered.filter(
        (p) => p.brand_code === brandFilter || p.brand_name === brandFilter,
      );
    }
    if (vendorFilter) {
      filtered = filtered.filter(
        (p) => p.vendor_code === vendorFilter || p.vendor_name === vendorFilter,
      );
    }
    if (variantStatusFilter) {
      filtered = filtered.filter(
        (p) => p.variant_status === variantStatusFilter,
      );
    }
    if (category1Filter) {
      filtered = filtered.filter((p) => p.category_1 === category1Filter);
    }
    if (productTypeFilter) {
      filtered = filtered.filter((p) => p.product_type === productTypeFilter);
    }
    filtered.sort((a, b) => {
      const aVal = a[sortKey as keyof Product] || "";
      const bVal = b[sortKey as keyof Product] || "";
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    setFilteredProducts(filtered);
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.product_name?.trim()) {
      newErrors.product_name = "Product name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleBrandChange = (brandCode: string) => {
    const brand = brands.find((b) => b.brand_code === brandCode);
    if (brand) {
      setFormData({
        ...formData,
        brand_code: brandCode,
        brand_name: brand.brand_name,
        mfg_code: brand.mfg_code,
        mfg_name: brand.mfg_name,
      });
    }
  };
  const handleVendorChange = (vendorCode: string) => {
    const vendor = vendors.find((v) => v.vendor_code === vendorCode);
    if (vendor) {
      setFormData({
        ...formData,
        vendor_code: vendorCode,
        vendor_name: vendor.vendor_name,
      });
    }
  };
  const handleCategoryChange = (categoryCode: string) => {
    const category = categories.find((c) => c.category_code === categoryCode);
    if (category) {
      setFormData({
        ...formData,
        category_code: categoryCode,
        industry_name: category.industry_name,
        category_level_1: category.category_1,
        category_level_2: category.category_2,
        category_level_3: category.category_3,
        category_level_4: category.category_4,
        category_level_5: category.category_5,
        category_level_6: category.category_6,
        category_level_7: category.category_7,
        category_level_8: category.category_8,
      });
    }
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingProduct) {
        await ProductAPI.update(editingProduct.product_code, formData);
        setToast({ message: "Product updated successfully", type: "success" });
      } else {
        await ProductAPI.create(formData);
        setToast({ message: "Product added successfully", type: "success" });
      }
      setIsDrawerOpen(false);
      setEditingProduct(null);
      resetForm();
      loadData();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    }
  };
  const handleEdit = (product: ProductWithVariantStatus) => {
    setEditingProduct(product);
    setFormData(product);
    setErrors({});
    setActiveTab("basic");
    setIsDrawerOpen(true);
  };
  const handleClone = (product: ProductWithVariantStatus) => {
    const clonedData = { ...product };
    delete clonedData.product_code;
    delete clonedData.created_at;
    delete clonedData.updated_at;
    clonedData.product_name = `${product.product_name} (Copy)`;
    setEditingProduct(null);
    setFormData(clonedData);
    setErrors({});
    setActiveTab("basic");
    setIsDrawerOpen(true);
    setToast({
      message: "Product cloned. Update code and save.",
      type: "success",
    });
  };
  const handleDelete = async () => {
    if (!deleteModal.product) return;
    try {
      if (deleteModal.product.variant_status === "Parent") {
        setToast({
          message: `Cannot delete. Child variants exist: ${deleteModal.product.variant_count} items.`,
          type: "error",
        });
        setDeleteModal({ isOpen: false, product: null });
        return;
      }
      await ProductAPI.delete(deleteModal.product.product_code);
      setToast({ message: "Product deleted successfully", type: "success" });
      setDeleteModal({ isOpen: false, product: null });
      loadData();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    }
  };
  const resetForm = () => {
    setFormData({
      product_code: "",
      product_name: "",
      brand_code: "",
      brand_name: "",
      mfg_code: "",
      mfg_name: "",
      vendor_code: "",
      vendor_name: "",
      industry_name: "",
      category_code: "",
      product_type: "",
      sku: "",
      variant_sku: "",
      prod_short_desc: "",
      prod_long_desc: "",
      model_series: "",
      mpn: "",
      gtin: "",
      upc: "",
      unspsc: "",
      meta_title: "",
      meta_desc: "",
      meta_keywords: "",
    });
    setErrors({});
    setActiveTab("basic");
  };
  const handleExport = () => {
    if (filteredProducts.length === 0) {
      setToast({ message: "No data to export", type: "error" });
      return;
    }
    exportToCSV(filteredProducts, "products.csv");
    setToast({ message: "Products exported successfully", type: "success" });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const rawData = await parseCSV(file);
       if (rawData.length > 0) {
          console.log("FIRST ROW KEYS:", Object.keys(rawData[0]));
          console.log("FIRST ROW DATA:", rawData[0]);
      } 
      const expectedColumns=[
        "product_name",
      "brand_code",
      "vendor_code",
      "category_code",
     "product_type",
      "sku",
      "variant_sku",
      "prod_short_desc",
      "prod_long_desc",
      "model_series",
      "mpn",
      "gtin",
      "upc",
      "unspsc",
      ]
      
      const validation=validateImportFormat(rawData,expectedColumns)
      if (!validation.isValid) {
        setToast({
          message: validation.errorMessage || "Import failed!",
          type: "error",
        });
        e.target.value = "";
        return;
      }
      const validData: Partial<Product>[] = [];
      const importErrors: string[] = [];
      const brandsToCreate = new Map<string, any>();

            const data = rawData.map((row: any) => {
        const mapped: any = { ...row };

        // --- Core Mapping ---
        if (row.product_title) mapped.product_name = row.product_title;
        if (row.product_id) mapped.product_code = row.product_id;
        if (row.vendor_name) mapped.vendor_name = row.vendor_name;
        if (row.description) mapped.prod_long_desc = row.description;
        
        mapped.features_1 = row.features_1 || row['Features 1'];
        mapped.features_2 = row.features_2 || row['Features 2'];
        mapped.image_url_1 = row.image_url_1 || row['Image URL 1'];
        
        const dynamicAttributes: Record<string, string> = {};
        
        for (let i = 1; i <= 50; i++) {
            const name = 
                row[`attribute_name_${i}`] || 
                row[`attribute_name${i}`] || 
                row[`Attribute Name ${i}`];
            const val = 
                row[`attribute_value_${i}`] || 
                row[`attribute_value${i}`] || 
                row[`Attribute Value ${i}`];
            
            if (name && val) {
                dynamicAttributes[name] = String(val).trim();
            }
        }
        
        // Base pair
        if (row.attribute_name && row.attribute_value) {
            dynamicAttributes[row.attribute_name] = String(row.attribute_value).trim();
        }
        
        mapped.attributes = dynamicAttributes;

        // Cleanup ID
        if (!mapped.product_code || String(mapped.product_code).trim() === '') {
            delete mapped.product_code;
        }

        return mapped;
      });

      // 2. VALIDATION
      data.forEach((row: any, index: number) => {
        if (!row.product_name?.trim()) {
          importErrors.push(`Row ${index + 2}: Product Name is required`);
        } else {
          validData.push(row);

          // Collect unique brands to create
          if (row.brand_name) {
             // Generate a simple code if missing, e.g. "GARMIN" -> "BRND-GARMIN"
             const code = row.brand_code || `BRND-${row.brand_name.substring(0, 6).toUpperCase()}`;
             brandsToCreate.set(code, {
                 brand_code: code,
                 brand_name: row.brand_name
             });
          }
        }
      });

      if (importErrors.length > 0) {
        setToast({ 
            message: `Import failed with ${importErrors.length} errors. First error: ${importErrors[0]}`, 
            type: 'error' 
        });
        return;
      }

      // 3. SYNC BRANDS
      if (brandsToCreate.size > 0) {
          try {
            const existingBrands = await MasterAPI.getBrands();
            const existingCodes = new Set(existingBrands.map((b: any) => b.brand_code));
            
            const newBrands = Array.from(brandsToCreate.values()).filter(b => !existingCodes.has(b.brand_code));
            
            // In production, use a bulk create endpoint if available.
            // For now, parallel requests are faster than serial.
            await Promise.all(newBrands.map(b => MasterAPI.create('brands', b).catch(err => console.warn("Brand create failed", err))));
            
          } catch (e) { 
              console.error("Brand sync error", e); 
          }
      }

      // 4. UPSERT PRODUCTS
      let processedCount = 0;
      let errorCount = 0;

      // Use a for...of loop to avoid overwhelming the server (serial processing)
      // Or use Promise.all with chunks for speed (e.g., batches of 10)
      for (const productData of validData) {
        
        // Generate ID if missing
        if (!productData.product_code) {
             productData.product_code = `PRD-${Date.now()}-${Math.floor(Math.random()*10000)}`;
        }

        try {
            await ProductAPI.upsert(productData);
            processedCount++;
        } catch (e) {
            console.error("Failed to import product:", productData.product_name, e);
            errorCount++;
        }
      }

      setToast({
        message: `Import complete: ${processedCount} processed, ${errorCount} failed`,
        type: errorCount === 0 ? 'success' : 'error',
      });
      
      loadData();
    } catch (error: any) {
      setToast({ message: error.message || "Import failed", type: 'error' });
    } finally {
        setLoading(false);
        e.target.value = '';
    }
  };
  const downloadTemplate = () => {
    const template: any = {
      product_name: "Example Product",
      brand_code: "BRAND001",
      vendor_code: "VENDOR001",
      category_code: "CAT001",
      product_type: "Standard",
      sku: "",
      variant_sku: "",
      prod_short_desc: "Short description",
      prod_long_desc: "Long description",
      model_series: "Series A",
      mpn: "MPN123",
      gtin: "",
      upc: "",
      unspsc: "",
    };
    exportToCSV([template], "product_import_template.csv");
  };
  const getVariantStatusBadge = (status: VariantStatus) => {
    const styles = {
      Base: "bg-blue-100 text-blue-800",
      Variant: "bg-green-100 text-green-800",
      Parent: "bg-orange-100 text-orange-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}
      >
        {status}
      </span>
    );
  };
  const getCategoryBreadcrumb = (product: Product): string => {
    return generateBreadcrumb(product as any);
  };
  const columns = [
    { key: "product_code", label: "Code", sortable: true },
    { key: "product_name", label: "Name", sortable: true },
    { key: "brand_name", label: "Brand", sortable: true },
    { key: "vendor_name", label: "Vendor", sortable: true },
    { key: "industry_name", label: "Industry", sortable: true },
    {
      key: "category",
      label: "Category",
      sortable: false,
      render: (_: any, row: Product) => (
        <span className="text-sm text-gray-600">
          {getCategoryBreadcrumb(row)}
        </span>
      ),
    },
    { key: "product_type", label: "Type", sortable: true },
    {
      key: "variant_status",
      label: "Status",
      sortable: false,
      render: (_: any, row: ProductWithVariantStatus) =>
        getVariantStatusBadge(row.variant_status),
    },
    {
      key: "completeness_score",
      label: "Quality Score",
      sortable: true,
      render: (_: any, row: Product) => {
        const score =
          row.completeness_score ||
          calculateCompletenessScore(row).overall_score;
        const colors = getScoreColorClasses(score);
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
            title="DataSphere Completeness Score reflects content readiness level for commerce channels"
          >
            {score}%
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_: any, row: ProductWithVariantStatus) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleClone(row)}
            className="p-1 hover:bg-green-100 text-green-600 rounded transition-colors"
            title="Clone"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={() => setDeleteModal({ isOpen: true, product: row })}
            className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];
  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "descriptions", label: "Descriptions" },
    { id: "attributes", label: "Attributes" },
    { id: "variants", label: "Variants" },
    { id: "related", label: "Related" },
    { id: "assets", label: "Assets" },
  ];
  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-40 bg-white py-6 -mx-6 px-6 shadows-sm flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Master</h1>
          <p className="text-gray-600 mt-1">
            Manage your complete product catalog
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>
      <div className="sticky top-24 z-30   bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Industries</option>
            {industries.map((industry) => (
              <option
                key={industry.industry_code}
                value={industry.industry_name}
              >
                {industry.industry_name}
              </option>
            ))}
          </select>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Brands</option>
            {Array.from(
              new Set(
                products.filter((p) => p.brand_name).map((p) => p.brand_name),
              ),
            )
              .sort()
              .map((brandName) => (
                <option key={brandName} value={brandName}>
                  {brandName}
                </option>
              ))}
          </select>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Vendors</option>
            {Array.from(
              new Set(
                products.filter((p) => p.vendor_name).map((p) => p.vendor_name),
              ),
            )
              .sort()
              .map((vendorName) => (
                <option key={vendorName} value={vendorName}>
                  {vendorName}
                </option>
              ))}
          </select>
          <select
            value={variantStatusFilter}
            onChange={(e) => setVariantStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="Base">Base</option>
            <option value="Variant">Variant</option>
            <option value="Parent">Parent</option>
          </select>
          <select
            value={category1Filter}
            onChange={(e) => {
              setCategory1Filter(e.target.value);
              setProductTypeFilter("");
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Category 1</option>
            {Array.from(
              new Set(
                categories.filter((c) => c.category_1).map((c) => c.category_1),
              ),
            )
              .sort()
              .map((cat1) => (
                <option key={cat1} value={cat1}>
                  {cat1}
                </option>
              ))}
          </select>
          <select
            value={productTypeFilter}
            onChange={(e) => setProductTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!category1Filter}
          >
            <option value="">All Product Types</option>
            {category1Filter &&
              Array.from(
                new Set(
                  products
                    .filter(
                      (p) => p.category_1 === category1Filter && p.product_type,
                    )
                    .map((p) => p.product_type),
                ),
              )
                .sort()
                .map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
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
              <Package size={20} />
            </button>
          </div>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredProducts}
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
          setEditingProduct(null);
          resetForm();
        }}
        title={editingProduct ? "Edit Product" : "Add Product"}
      >
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6 space-y-6">
          {activeTab === "basic" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {editingProduct && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Code
                    </label>
                    <input
                      type="text"
                      value={formData.product_code || ""}
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
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData({ ...formData, product_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.product_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.product_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <select
                    value={formData.brand_code}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand.brand_code} value={brand.brand_code}>
                        {brand.brand_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <select
                    value={formData.vendor_code}
                    onChange={(e) => handleVendorChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select vendor</option>
                    {vendors.map((vendor) => (
                      <option
                        key={vendor.vendor_code}
                        value={vendor.vendor_code}
                      >
                        {vendor.vendor_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category_code}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option
                        key={category.category_code}
                        value={category.category_code}
                      >
                        {category.breadcrumb}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <select
                    value={formData.industry_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        industry_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select industry</option>
                    {industries.map((industry) => (
                      <option
                        key={industry.industry_code}
                        value={industry.industry_name}
                      >
                        {industry.industry_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Type
                  </label>
                  <input
                    type="text"
                    value={formData.product_type}
                    onChange={(e) =>
                      setFormData({ ...formData, product_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU (Internal ID)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="Parent SKU for variants"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MPN (Primary Identifier){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.mpn}
                    onChange={(e) => {
                      setFormData({ ...formData, mpn: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.mpn && (
                    <p className="text-red-500 text-sm mt-1">{errors.mpn}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model Number
                  </label>
                  <input
                    type="text"
                    value={formData.model_no}
                    onChange={(e) =>
                      setFormData({ ...formData, model_no: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UPC
                  </label>
                  <input
                    type="text"
                    value={formData.upc}
                    onChange={(e) =>
                      setFormData({ ...formData, upc: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EAN
                  </label>
                  <input
                    type="text"
                    value={formData.ean}
                    onChange={(e) =>
                      setFormData({ ...formData, ean: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UNSPSC
                  </label>
                  <input
                    type="text"
                    value={formData.unspsc}
                    onChange={(e) =>
                      setFormData({ ...formData, unspsc: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
          {activeTab === "descriptions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Descriptions & Identifiers
                </h3>
                {formData.product_name && (
                  <div className="text-right">
                    {(() => {
                      const breakdown = calculateCompletenessScore(formData);
                      const colors = getScoreColorClasses(
                        breakdown.overall_score,
                      );
                      return (
                        <div className="space-y-1">
                          <div
                            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
                          >
                            Quality Score: {breakdown.overall_score}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Content readiness level
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              {formData.product_name && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Score Breakdown
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    {(() => {
                      const breakdown = calculateCompletenessScore(formData);
                      return (
                        <>
                          <div>
                            <div className="font-medium text-gray-700">
                              Attributes
                            </div>
                            <div className="text-gray-900 font-semibold">
                              {breakdown.attributes_score}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {breakdown.attributes_detail}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              Features
                            </div>
                            <div className="text-gray-900 font-semibold">
                              {breakdown.features_score}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {breakdown.features_detail}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              Images
                            </div>
                            <div className="text-gray-900 font-semibold">
                              {breakdown.images_score}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {breakdown.images_detail}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              Title
                            </div>
                            <div className="text-gray-900 font-semibold">
                              {breakdown.title_score}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {breakdown.title_detail}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">
                              Description
                            </div>
                            <div className="text-gray-900 font-semibold">
                              {breakdown.description_score}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {breakdown.description_detail}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <textarea
                  value={formData.prod_short_desc}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prod_short_desc: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Long Description
                </label>
                <textarea
                  value={formData.prod_long_desc}
                  onChange={(e) =>
                    setFormData({ ...formData, prod_long_desc: e.target.value })
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model Series
                  </label>
                  <input
                    type="text"
                    value={formData.model_series}
                    onChange={(e) =>
                      setFormData({ ...formData, model_series: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MPN
                  </label>
                  <input
                    type="text"
                    value={formData.mpn}
                    onChange={(e) =>
                      setFormData({ ...formData, mpn: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GTIN
                  </label>
                  <input
                    type="text"
                    value={formData.gtin}
                    onChange={(e) =>
                      setFormData({ ...formData, gtin: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UPC
                  </label>
                  <input
                    type="text"
                    value={formData.upc}
                    onChange={(e) =>
                      setFormData({ ...formData, upc: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UNSPSC
                  </label>
                  <input
                    type="text"
                    value={formData.unspsc}
                    onChange={(e) =>
                      setFormData({ ...formData, unspsc: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features (8 items)
                </label>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <input
                    key={num}
                    type="text"
                    value={formData[`features_${num}` as keyof Product] || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [`features_${num}`]: e.target.value,
                      })
                    }
                    placeholder={`Feature ${num}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                  />
                ))}
              </div>
            </div>
          )}
          {activeTab === "attributes" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Product Attributes
              </h3>
              <p className="text-sm text-gray-600">
                Attributes will be dynamically loaded based on selected category
                and product family.
              </p>
              <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                <p>Select a category to load relevant attributes</p>
              </div>
            </div>
          )}
          {activeTab === "variants" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Product Variants
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage product variants with different attributes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setToast({
                      message: "Variant management coming soon!",
                      type: "success",
                    })
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Variant
                </button>
              </div>
              {editingProduct ? (
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <Package size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-2">No variants created yet</p>
                  <p className="text-sm text-gray-500">
                    Click "Add Variant" to create variations of this product
                    with different attributes
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-gray-600">
                    Save the product first to add variants
                  </p>
                </div>
              )}
            </div>
          )}
          {activeTab === "related" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Related Products (up to 5)
                </h3>
                <p className="text-sm text-gray-600">
                  Add product code, MPN, and name for related products
                </p>
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    className="grid grid-cols-3 gap-4 p-3 border border-gray-200 rounded-lg"
                  >
                    <input
                      type="text"
                      value={
                        formData[`related_product_${num}` as keyof Product] ||
                        ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`related_product_${num}`]: e.target.value,
                        })
                      }
                      placeholder="Product Code"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={
                        formData[
                          `related_product_${num}_mpn` as keyof Product
                        ] || ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`related_product_${num}_mpn`]: e.target.value,
                        })
                      }
                      placeholder="MPN"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={
                        formData[
                          `related_product_${num}_name` as keyof Product
                        ] || ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`related_product_${num}_name`]: e.target.value,
                        })
                      }
                      placeholder="Product Name"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Pairs Well With (up to 5)
                </h3>
                <p className="text-sm text-gray-600">
                  Add product code, MPN, and name for complementary products
                </p>
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    className="grid grid-cols-3 gap-4 p-3 border border-gray-200 rounded-lg"
                  >
                    <input
                      type="text"
                      value={
                        formData[`pairs_well_with_${num}` as keyof Product] ||
                        ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`pairs_well_with_${num}`]: e.target.value,
                        })
                      }
                      placeholder="Product Code"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={
                        formData[
                          `pairs_well_with_${num}_mpn` as keyof Product
                        ] || ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`pairs_well_with_${num}_mpn`]: e.target.value,
                        })
                      }
                      placeholder="MPN"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={
                        formData[
                          `pairs_well_with_${num}_name` as keyof Product
                        ] || ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`pairs_well_with_${num}_name`]: e.target.value,
                        })
                      }
                      placeholder="Product Name"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "assets" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Images (up to 5)
                </h3>
                <p className="text-sm text-gray-600">
                  Image names auto-generated from MPN
                </p>
                {[1, 2, 3, 4, 5].map((num) => {
                  const autoName = formData.mpn
                    ? `${formData.mpn}-Image-${num}`
                    : `Image-${num}`;
                  return (
                    <div key={num} className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={autoName}
                        disabled
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                      <input
                        type="text"
                        value={
                          formData[`image_${num}_url` as keyof Product] || ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [`image_${num}_name`]: autoName,
                            [`image_${num}_url`]: e.target.value,
                          })
                        }
                        placeholder={`Image ${num} URL`}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Videos (up to 3)
                </h3>
                <p className="text-sm text-gray-600">
                  Video names auto-generated from MPN
                </p>
                {[1, 2, 3].map((num) => {
                  const autoName = formData.mpn
                    ? `${formData.mpn}-Video-${num}`
                    : `Video-${num}`;
                  return (
                    <div key={num} className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={autoName}
                        disabled
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                      <input
                        type="text"
                        value={
                          formData[`video_${num}_url` as keyof Product] || ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [`video_${num}_name`]: autoName,
                            [`video_${num}_url`]: e.target.value,
                          })
                        }
                        placeholder={`Video ${num} URL`}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Documents (up to 5)
                </h3>
                <p className="text-sm text-gray-600">
                  Document names auto-generated from MPN
                </p>
                {[1, 2, 3, 4, 5].map((num) => {
                  const autoName = formData.mpn
                    ? `${formData.mpn}-Document-${num}`
                    : `Document-${num}`;
                  return (
                    <div key={num} className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={autoName}
                        disabled
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                      <input
                        type="text"
                        value={
                          formData[`document_${num}_url` as keyof Product] || ""
                        }
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            [`document_${num}_name`]: autoName,
                            [`document_${num}_url`]: e.target.value,
                          });
                        }}
                        placeholder={`Document ${num} URL`}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                setEditingProduct(null);
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
              {editingProduct ? "Update" : "Add"} Product
            </button>
          </div>
        </div>
      </Drawer>
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        title="Delete Product"
        actions={
          <>
            <button
              onClick={() => setDeleteModal({ isOpen: false, product: null })}
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
          Are you sure you want to delete product{" "}
          <span className="font-semibold">
            {deleteModal.product?.product_name}
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
