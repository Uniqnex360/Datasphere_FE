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
  ImageIcon,
  Film,
  FileText,
  X,
  Eye,
  Heading1,
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
import CustomDownloadIcon from "../assets/download-custom.png";
import ImageComingSoonIcon from "../assets/image-coming-soon-placeholder.webp";
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
import { FilterSelect } from "../components/Filter";
import { Attribute } from "../types/attribute";
import {ProductAttributeUpdate} from "./helperComponents/ProductAttribute";
import { MultiSelect } from "../components/MultiSelect";

export function Products() {
  const [products, setProducts] = useState<ProductWithVariantStatus[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<
    ProductWithVariantStatus[]
  >([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<
    "basic" | "descriptions" | "attributes" | "variants" | "related" | "assets"
  >("basic");
  const [deleteVariantModal, setDeleteVariantModal] = useState<{
    isOpen: boolean;
    variant: any | null;
  }>({ isOpen: false, variant: null });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    product: ProductWithVariantStatus | null;
  }>({ isOpen: false, product: null });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [industryFilter, setIndustryFilter] = useState<string[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [vendorOptions, setVendorOptions] = useState<string[]>([])
  const [vendorFilter, setVendorFilter] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [category1Filter, setCategory1Filter] = useState<string[]>([]);
  const [variantStatusFilter, setVariantStatusFilter] = useState("");
  
  const [regularAttributes, setRegularAttributes] = useState<Attribute[]>([]);
  const [variants, setVariants] = useState<Product[]>([]);
  const [productTypeFilter, setProductTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState("product_code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [variantAttributes, setVariantAttributes] = useState<Attribute[]>([]);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantFormData, setVariantFormData] = useState<{
    selectedValues: Record<string, string>;
    sku: string;
    mpn: string;
    price: number;
    qty: number;
  }>({
    selectedValues: {},
    sku: "",
    mpn: "",
    price: 0,
    qty: 0,
  });
  const [formData, setFormData] = useState<Partial<Product>>({
    product_name: "",
    brand_code: "",
    brand_name: "",
    mfg_code: "",
    mfg_name: "",
    vendor_code: "",
    vendor_name: "",
    images: {},
    videos: {},
    documents: {},
    attributes: {},
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
    price: 0,
    sale_price: 0,
    list_price: 0,
    base_price: 0,
    regular_price: 0,
    retail_price: 0,
    msrp: 0,
    map_price: 0,
    unspsc: "",
    meta_title: "",
    meta_desc: "",
    meta_keywords: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    loadData();
  }, [searchTerm, industryFilter, brandFilter, vendorFilter, category1Filter]);
  useEffect(() => {
    if (formData.category_code) {
      loadVariantAttributes(formData.category_code);
    }
  }, [formData.category_code]);
  const loadVariantAttributes = async (categoryCode: string) => {
    try {
      const attributes = await MasterAPI.getAttributes();

      const categoryVariants = attributes.filter((attr: Attribute) => {
        const applicableCategories =
          attr.applicable_categories?.split(",").map((c) => c.trim()) || [];
        return (
          applicableCategories.includes(categoryCode) && attr.variants === true
        );
      });

      if (categoryVariants.length >= 2) {
        setVariantAttributes(categoryVariants);
        setRegularAttributes([]);
      } else if (categoryVariants.length === 1) {
        setVariantAttributes([]);
        setRegularAttributes(categoryVariants);
      } else {
        setVariantAttributes([]);
        setRegularAttributes([]);
      }
    } catch (error) {
      console.error("Failed to load variant attributes:", error);
    }
  };

  useEffect(() => {
    if (editingProduct && editingProduct.product_code) {
      loadVariants(editingProduct.product_code);
    }
  }, [editingProduct]);

  const loadVariants = async (parentProductCode: string) => {
    try {
      const response = await ProductAPI.getVariants(parentProductCode);

      const variantsObj = response.variants || {};
      const variantsArray = Object.entries(variantsObj).map(
        ([id, data]: [string, any]) => ({
          variant_id: id,
          ...data,
        }),
      );

      setVariants(variantsArray);
    } catch (error) {
      console.error("Failed to load variants:", error);
      setToast({ message: "Failed to load variants", type: "error" });
    }
  };

  const processCategoryData = (categories: Category[]): Category[] => {
    const sorted = [...categories].sort(
      (a, b) => b.breadcrumb.split(">").length - a.breadcrumb.split(">").length,
    );

    const result: Category[] = [];

    sorted.forEach((cat) => {
      const catParts = cat.breadcrumb.split(">").map((s) => s.trim());

      const isPrefix = result.some((existing) => {
        const existingParts = existing.breadcrumb
          .split(">")
          .map((s) => s.trim());
        if (catParts.length >= existingParts.length) return false;
        return catParts.every((part, idx) => part === existingParts[idx]);
      });

      if (!isPrefix) {
        result.push(cat);
      }
    });

    return result;
  };

  useEffect(() => {
    filterAndSortProducts();
  }, [
    products,
    variantStatusFilter,
    productTypeFilter,
    sortKey,
    sortDirection,
  ]);
  const loadData = async () => {
    try {
      setLoading(true);
      const [
        productsResponse,
        brandsData,
        vendorsData,
        categoriesData,
        industriesData,
      ] = await Promise.all([
        ProductAPI.getAll(0, 100, searchTerm, {
          industry: industryFilter,
          industry_filter: industryOptions,
          brand: brandFilter,
          brand_filter: brandOptions,
          vendor: vendorFilter,
          vendor_filter: vendorOptions,
          category: category1Filter,
          category_filter: categoryOptions,
        } ),
        MasterAPI.getBrands(),
        MasterAPI.getVendors(),
        MasterAPI.getCategories(),
        MasterAPI.getIndustries(),
      ]);
      const productsData = productsResponse?.products;
      const productsWithStatus = await calculateVariantStatus(
        productsData || [],
      );
      setIndustryOptions(productsResponse?.filter_meta?.industry)
      setBrandOptions(productsResponse?.filter_meta?.brand)
      setVendorOptions(productsResponse?.filter_meta?.vendor)
      setCategoryOptions(productsResponse?.filter_meta?.category)
      setProducts(productsWithStatus);
      setBrands(brandsData || []);
      setVendors(vendorsData || []);
      const prossedCategories = processCategoryData(categoriesData || []);
      setCategories(prossedCategories || []);
      setIndustries(industriesData || []);
    } catch (error: any) {
      console.log('error', error)
      setToast({ message: "Failed to load data", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateVariant = async () => {
    if (!editingProduct || !editingVariant) return;

    try {
      if (
        Object.keys(variantFormData.selectedValues).length !==
        variantAttributes.length
      ) {
        setToast({
          message: "Please select all variant attributes",
          type: "error",
        });
        return;
      }

      if (!variantFormData.sku.trim()) {
        setToast({ message: "SKU is required", type: "error" });
        return;
      }

      if (!variantFormData.price || variantFormData.price <= 0) {
        setToast({ message: "Valid price is required", type: "error" });
        return;
      }

      const variantAttrsPayload = Object.entries(
        variantFormData.selectedValues,
      ).reduce(
        (acc, [code, value]) => {
          const attr = variantAttributes.find((a) => a.attribute_code === code);
          if (attr) {
            acc[code] = {
              name: attr.attribute_name,
              value: value,
              uom: attr.unit || "",
              type: attr.attribute_type,
            };
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      const variantName = `${editingProduct.product_name} - ${Object.entries(
        variantFormData.selectedValues,
      )
        .map(([, value]) => value)
        .join(" ")}`;

      const updateData = {
        product_name: variantName,
        sku: variantFormData.sku,
        mpn: variantFormData.mpn || editingVariant.mpn,
        price: variantFormData.price,
        qty: variantFormData.qty || 0,
        attributes: variantAttrsPayload,
      };

      await ProductAPI.updateVariant(
        editingProduct.product_code,
        editingVariant.variant_id,
        updateData,
      );
      setToast({ message: "Variant updated successfully", type: "success" });
      setShowVariantModal(false);
      setEditingVariant(null);
      setVariantFormData({
        selectedValues: {},
        sku: "",
        mpn: "",
        price: 0,
        qty: 0,
      });

      await loadVariants(editingProduct.product_code);
    } catch (error: any) {
      setToast({
        message: error.message || "Failed to update variant",
        type: "error",
      });
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
    if (variantStatusFilter) {
      filtered = filtered.filter(
        (p) => p.variant_status === variantStatusFilter,
      );
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
      setToast({ message: error?.response?.data?.detail?.mpn || error.message, type: "error" });
    }
  };
  const handleEdit = (product: ProductWithVariantStatus) => {
    setEditingProduct(product);
    setFormData(
      {...product, 
        brand_code: product?.brand?.brand_code, 
        brand_name: product?.brand?.brand_name,
        vendor_code: product?.vendor?.vendor_code,
        vendor_name: product?.vendor?.vendor_name
      }
      );
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

    const code = deleteModal.product.product_code?.trim();

    if (!code) {
      setToast({ message: "Error: Product Code is missing", type: "error" });
      return;
    }

    try {
      if (deleteModal.product.variant_status === "Parent") {
        setToast({
          message: `Cannot delete. Child variants exist: ${deleteModal.product.variant_count} items.`,
          type: "error",
        });
        setDeleteModal({ isOpen: false, product: null });
        return;
      }

      await ProductAPI.delete(code);

      setToast({ message: "Product deleted successfully", type: "success" });
      setDeleteModal({ isOpen: false, product: null });
      loadData();
    } catch (error: any) {
      setToast({
        message: error.message || "Failed to delete product",
        type: "error",
      });
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
      images: {},
      videos: {},
      documents: {},
      attributes: {},
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
      price: 0,
      sale_price: 0,
      list_price: 0,
      base_price: 0,
      regular_price: 0,
      retail_price: 0,
      msrp: 0,
      map_price: 0,
    });
    setErrors({});
    setActiveTab("basic");
  };
  const handleExport = () => {
    if (filteredProducts.length === 0) {
      setToast({ message: "No data to export", type: "error" });
      return;
    }
    exportToCSV(filteredProducts, "product_export.csv");
    setToast({ message: "Products exported successfully", type: "success" });
  };

  // const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   try {
  //     setLoading(true);
  //     const rawData = await parseCSV(file);

  //     if (rawData.length > 0) {
  //       console.log("FIRST ROW KEYS:", Object.keys(rawData[0]));
  //     }

  //     const hasProductName =
  //       rawData.length > 0 &&
  //       (rawData[0].product_name ||
  //         rawData[0].product_title ||
  //         rawData[0].title ||
  //         rawData[0].name);

  //     if (!hasProductName) {
  //       setToast({
  //         message:
  //           "Import failed: Product name column is required (product_name, product_title, title, or name)",
  //         type: "error",
  //       });
  //       e.target.value = "";
  //       return;
  //     }

  //     const bundleAssets = (row: any, type: string) => {
  //       const assets: Record<string, { name: string; url: string }> = {};
  //       Object.keys(row).forEach((key) => {
  //         const urlMatch = key.match(
  //           new RegExp(`^${type}[_\\s]*url[_\\s]*(\\d+)$`, "i"),
  //         );
  //         const nameMatch = key.match(
  //           new RegExp(`^${type}[_\\s]*name[_\\s]*(\\d+)$`, "i"),
  //         );

  //         if (urlMatch) {
  //           const idx = urlMatch[1];
  //           if (!assets[idx]) assets[idx] = { name: "", url: "" };
  //           assets[idx].url = String(row[key] || "").trim();
  //         }
  //         if (nameMatch) {
  //           const idx = nameMatch[1];
  //           if (!assets[idx]) assets[idx] = { name: "", url: "" };
  //           assets[idx].name = String(row[key] || "").trim();
  //         }
  //       });

  //       const cleaned: Record<string, any> = {};
  //       Object.entries(assets).forEach(([idx, data]) => {
  //         if (data.url) {
  //           cleaned[idx] = {
  //             url: data.url,
  //             name:
  //               data.name ||
  //               `${type.charAt(0).toUpperCase() + type.slice(1)} ${idx}`,
  //           };
  //         }
  //       });
  //       return Object.keys(cleaned).length > 0 ? cleaned : {};
  //     };

  //     const validData: Partial<Product>[] = [];
  //     const importErrors: string[] = [];
  //     const brandsToCreate = new Map<string, any>();
  //     const vendorsToCreate = new Map<string, any>();
  //     const categoriesToCreate = new Map<string, any>();
  //     const industriesToCreate = new Map<string, any>();

  //     // @ts-ignore
  //     const safeTrim = (value) => (value != null ? String(value).trim() : "");

  //     const data = rawData
  //       .map((row: any, index: number) => {
  //         const mapped: any = {};

  //         try {
  //           const productNameKey = Object.keys(row).find(
  //             (k) =>
  //               k.toLowerCase().replace(/_/g, " ") === "product name" ||
  //               k.toLowerCase() === "name",
  //           );
  //           mapped.product_name = String(
  //             row[productNameKey || "product_name"] || "",
  //           ).trim();

  //           if (!mapped.product_name) {
  //             throw new Error("Missing Product Name column or empty value");
  //           }
  //           mapped.product_code = row.product_code?.trim() || null;
  //           mapped.price = parseFloat(row.price) || 0;
  //           mapped.sale_price = parseFloat(row.sale_price) || 0;
  //           mapped.list_price = parseFloat(row.list_price) || 0;
  //           mapped.base_price = parseFloat(row.base_price) || 0;
  //           mapped.regular_price = parseFloat(row.regular_price) || 0;
  //           mapped.retail_price = parseFloat(row.retail_price) || 0;
  //           mapped.msrp = parseFloat(row.msrp) || 0;
  //           mapped.map_price = parseFloat(row.map_price || row.map) || 0;
  //           mapped.sku = safeTrim(row.sku);
  //           mapped.variant_sku = safeTrim(row.variant_sku);
  //           mapped.mpn = safeTrim(row.mpn);
  //           mapped.model_series = safeTrim(row.model_series) ;
  //           mapped.ean = safeTrim(row.ean);
  //           mapped.upc = safeTrim(row.upc);
  //           mapped.unspsc = safeTrim(row.unspc);
  //           mapped.gtin = safeTrim(row.gtin);
  //           mapped.product_type = safeTrim(row.product_type);
  //           mapped.prod_short_desc = safeTrim(row.prod_short_desc);
  //           mapped.prod_long_desc = safeTrim(row.prod_long_desc);
  //           mapped.meta_title =safeTrim(row.meta_title);
  //           mapped.meta_desc =safeTrim(row.meta_desc);
  //           mapped.meta_keywords = safeTrim(row.meta_keywords);

  //           const brandName = safeTrim(row.brand_name);
  //           const mfgName = safeTrim(row.mfg_name);
  //           const industryName = safeTrim(row.industry_name);
  //           mapped.industry_name = industryName || "";
  //           if (industryName) {
  //             const industryKey = industryName.toLowerCase().trim();
  //             if (!industriesToCreate.has(industryKey)) {
  //               industriesToCreate.set(industryKey, {
  //                 industry_code:
  //                   row.industry_code?.trim() ||
  //                   industryName
  //                     .substring(0, 4)
  //                     .toUpperCase()
  //                     .replace(/[^A-Z]/g, ""),
  //                 industry_name: industryName,
  //               });
  //             }
  //           }

  //           if (brandName) {
  //             mapped.brand_name = brandName;
  //             mapped.mfg_name = mfgName || brandName;
  //             const existingBrand = brands.find(
  //               (b) => b.brand_name.toLowerCase() === brandName.toLowerCase(),
  //             );
  //             if (existingBrand) {
  //               mapped.brand_code = existingBrand.brand_code;
  //             } else {
  //               // const brandCode = `BRND-${brandName
  //               //   .substring(0, 8)
  //               //   .toUpperCase()
  //               //   .replace(/[^A-Z0-9]/g, "")}`;
  //               // mapped.brand_code = brandCode;
  //               brandsToCreate.set(brandName, {
  //                 // brand_code: brandCode,
  //                 brand_name: brandName,
  //                 mfg_name: mfgName || brandName,
  //               });
  //             }
  //           }

  //           const vendorName = row.vendor_name?.trim();
  //           if (vendorName) {
  //             mapped.vendor_name = vendorName;
  //             const existingVendor = vendors.find(
  //               (v) => v.vendor_name.toLowerCase() === vendorName.toLowerCase(),
  //             );
  //             if (existingVendor) {
  //               mapped.vendor_code = existingVendor.vendor_code;
  //             } else {
  //               // const vendorCode = `VEND-${vendorName
  //               //   .substring(0, 8)
  //               //   .toUpperCase()
  //               //   .replace(/[^A-Z0-9]/g, "")}`;
  //               const vendorCode = "";
  //               mapped.vendor_code = vendorCode;
  //               if (vendorName) {
  //                 vendorsToCreate.set(vendorName.toLowerCase(), {
  //                   vendor_code: vendorCode,
  //                   vendor_name: vendorName,
  //                   industry_name: industryName,
  //                   contact_email: `info@${vendorName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
  //                   contact_phone: "000-000-0000",
  //                 });
  //               }
  //             }
  //           }

  //           // const industryName = row.industry_name?.trim();
  //           // mapped.industry_name = industryName || "";

  //           const categoryLevels: string[] = [];
  //           Object.keys(row).forEach((key) => {
  //             const categoryMatch = key.match(/^category[_\s]*(\d+)$/i);
  //             if (categoryMatch) {
  //               const level = parseInt(categoryMatch[1]);
  //               const value = row[key]?.trim();
  //               if (value) {
  //                 categoryLevels[level - 1] = value;
  //                 mapped[`category_${level}`] = value;
  //               }
  //             }
  //           });

  //           if (categoryLevels.length > 0) {
  //             const cat1 = categoryLevels[0];
  //             const breadcrumb = categoryLevels.filter(Boolean).join(" > ");
  //             const existingCategory = categories.find(
  //               (c) => c.category_1?.toLowerCase() === cat1.toLowerCase(),
  //             );

  //             if (existingCategory) {
  //               mapped.category_code = existingCategory.category_code;
  //             } else {
  //               const categoryCode = `CAT-${cat1
  //                 .substring(0, 8)
  //                 .toUpperCase()
  //                 .replace(/[^A-Z0-9]/g, "")}`;
  //               mapped.category_code = categoryCode;
  //               const categoryData: any = {
  //                 category_code: categoryCode,
  //                 industry_name: industryName || "General",
  //                 breadcrumb: breadcrumb,
  //               };
  //               categoryLevels.forEach((cat, index) => {
  //                 if (cat) categoryData[`category_${index + 1}`] = cat;
  //               });
  //               categoriesToCreate.set(categoryCode, categoryData);
  //             }
  //           }

  //           Object.keys(row).forEach((key) => {
  //             const featureMatch = key.match(/^features?_?(\d+)$/i);
  //             if (featureMatch) {
  //               const num = featureMatch[1];
  //               const value = row[key]?.trim();
  //               if (value) mapped[`features_${num}`] = value;
  //             }
  //           });

  //           const attributeData = new Map();
  //           Object.keys(row).forEach((key) => {
  //             const nameMatch = key.match(/^attribute_?names?_?(\d+)$/i);
  //             const valueMatch = key.match(/^attribute_?values?_?(\d+)$/i);
  //             const uomMatch = key.match(/^attribute_?uoms?_?(\d+)$/i);

  //             if (nameMatch) {
  //               const num = nameMatch[1];
  //               const value = String(row[key] || "").trim();
  //               if (value) {
  //                 if (!attributeData.has(num)) attributeData.set(num, {});
  //                 attributeData.get(num).name = value;
  //               }
  //             }
  //             if (valueMatch) {
  //               const num = valueMatch[1];
  //               const value = String(row[key] || "").trim();
  //               if (value) {
  //                 if (!attributeData.has(num)) attributeData.set(num, {});
  //                 attributeData.get(num).value = value;
  //               }
  //             }
  //             if (uomMatch) {
  //               const num = uomMatch[1];
  //               const value = String(row[key] || "").trim();
  //               if (value) {
  //                 if (!attributeData.has(num)) attributeData.set(num, {});
  //                 attributeData.get(num).uom = value;
  //               }
  //             }
  //           });
  //           const attributesJson: Record<string, any> = {};
  //           attributeData.forEach((attr, num) => {
  //             if (attr.name && attr.value) {
  //               attributesJson[num] = {
  //                 name: attr.name,
  //                 value: attr.value,
  //                 uom: attr.uom || null,
  //               };
  //             }
  //           });
  //           if (Object.keys(attributesJson).length > 0) {
  //             mapped.attributes = attributesJson;
  //           }

  //           mapped.images = bundleAssets(row, "image");
  //           mapped.videos = bundleAssets(row, "video");

  //           let documents = bundleAssets(row, "document");

  //           if (Object.keys(documents).length === 0) {
  //             let docCount = 1;
  //             const allKeys = Object.keys(row);
  //             allKeys.forEach((key, idx) => {
  //               const value = String(row[key] || "").trim();
  //               if (value.toLowerCase().match(/^http.*\.pdf(\?.*)?$/i)) {
  //                 let docName = "";
  //                 if (idx > 0) {
  //                   const prevKey = allKeys[idx - 1];
  //                   const prevValue = String(row[prevKey] || "").trim();
  //                   if (prevValue && !prevValue.startsWith("http")) {
  //                     docName = prevValue;
  //                   }
  //                 }
  //                 if (!docName) {
  //                   docName = key.replace(/_/g, " ").replace(/url/i, "").trim();
  //                   docName =
  //                     docName.charAt(0).toUpperCase() + docName.slice(1);
  //                 }
  //                 // let name = key.replace(/_/g, " ").trim();

  //                 // if (!name || name.length > 50) {
  //                 //   name = `Document ${docCount}`;
  //                 // }

  //                 documents[docCount] = { name: docName, url: value };
  //                 docCount++;
  //               }
  //             });
  //           }
  //           mapped.documents = documents;

  //           return mapped;
  //         } catch (error: any) {
  //           console.error(`Error processing row ${index + 1}:`, error);
  //           importErrors.push(
  //             `Row ${index + 2}: Error processing data - ${error.message}`,
  //           );
  //           return null;
  //         }
  //       })
  //       .filter(Boolean);

  //     data.forEach((row: any, index: number) => {
  //       if (!row.product_name?.trim()) {
  //         importErrors.push(`Row ${index + 2}: Product Name is required`);
  //       } else {
  //         validData.push(row);
  //       }
  //     });

  //     if (importErrors.length > 0) {
  //       setToast({
  //         message: `Import failed with ${importErrors.length} errors. First error: ${importErrors[0]}`,
  //         type: "error",
  //       });
  //       return;
  //     }

  //     let createdBrands = 0;
  //     let createdVendors = 0;
  //     let createdCategories = 0;
  //     let createdIndustries = 0;
  //     let createdCount = 0;
  //     let skippedCount = 0;

  //     if (brandsToCreate.size > 0) {
  //       try {
  //         const existingBrands = await MasterAPI.getBrands();
  //         const existingCodes = new Set(
  //           existingBrands.map((b: any) => b.brand_code),
  //         );
  //         const newBrands = Array.from(brandsToCreate.values()).filter(
  //           (b) => !existingCodes.has(b.brand_code),
  //         );

  //         for (const brand of newBrands) {
  //           try {
  //             await MasterAPI.create("brands", brand);
  //             createdBrands++;
  //           } catch (err) {
  //             console.warn("Brand create failed", err);
  //           }
  //         }
  //       } catch (e) {
  //         console.error("Brand sync error", e);
  //       }
  //     }
  //     if (industriesToCreate.size > 0) {
  //       try {
  //         const existingIndustries = await MasterAPI.getIndustries();
  //         const existingNames = new Set(
  //           (existingIndustries || []).map((i: any) =>
  //             (i.industry_name || "").toLowerCase().trim(),
  //           ),
  //         );
  //         const newIndustries = Array.from(industriesToCreate.values()).filter(
  //           (i) => !existingNames.has((i.industry_name || "").toLowerCase()),
  //         );
  //         if (newIndustries.length > 0) {
  //           for (const ind of newIndustries) {
  //             try {
  //               await MasterAPI.create("industries", ind);
  //               createdIndustries++;
  //             } catch (error) {
  //               console.warn(
  //                 `Failed to create industry: ${ind.industry_name}`,
  //                 error,
  //               );
  //             }
  //           }
  //         }
  //       } catch (error) {
  //         console.error("Industry sync error", error);
  //       }
  //     }

  //     const latestIndustries = await MasterAPI.getIndustries();

  //     const industryNameToIdMap = new Map(
  //       (latestIndustries || [])
  //         .filter((i: any) => i.industry_name)
  //         .map((i: any) => [i.industry_name.toLowerCase().trim(), i.id]),
  //     );
  //     if (vendorsToCreate.size > 0) {
  //       try {
  //         const industryNameToIdMap = new Map(
  //           (latestIndustries || [])
  //             .filter((i: any) => i.industry_name)
  //             .map((i: any) => [i.industry_name.toLowerCase().trim(), i.id]),
  //         );

  //         const existingVendors = await MasterAPI.getVendors();
  //         const existingNames = new Set(
  //           existingVendors.map((v: any) => v.vendor_name.toLowerCase().trim()),
  //         );

  //         const newVendors = Array.from(vendorsToCreate.values()).filter(
  //           (v) => !existingNames.has(v.vendor_name.toLowerCase()),
  //         );

  //         for (const vendor of newVendors) {
  //           try {
  //             const indName = (vendor as any).industry_name
  //               ?.toLowerCase()
  //               .trim();
  //             if (indName && industryNameToIdMap.has(indName)) {
  //               vendor.industry_id = industryNameToIdMap.get(indName);
  //             }

  //             await MasterAPI.create("vendors", vendor);
  //             createdVendors++;
  //           } catch (err) {
  //             console.warn("Vendor create failed", err);
  //           }
  //         }
  //       } catch (e) {
  //         console.error("Vendor sync error", e);
  //       }
  //     }
  //     if (categoriesToCreate.size > 0) {
  //       try {
  //         const existingCategories = await MasterAPI.getCategories();
  //         const existingCodes = new Set(
  //           (existingCategories || []).map((c: any) => c.category_code),
  //         );
  //         const newCategories = Array.from(categoriesToCreate.values()).filter(
  //           (c) => !existingCodes.has(c.category_code),
  //         );

  //         for (const category of newCategories) {
  //           try {
  //             const catIndName = (category as any).industry_name
  //               ?.toLowerCase()
  //               .trim();
  //             if (catIndName && industryNameToIdMap.has(catIndName)) {
  //               (category as any).industry_id =
  //                 industryNameToIdMap.get(catIndName);
  //             }

  //             await MasterAPI.create("categories", category);
  //             createdCategories++; // Use the variable that shows up in your toast!
  //           } catch (err) {
  //             console.warn("Category create failed", err);
  //           }
  //         }
  //       } catch (e) {
  //         console.error("Category sync error", e);
  //       }
  //     }

  //     let processedCount = 0;
  //     let errorCount = 0;
  //     const existingProductMap = new Map(
  //       products.map((p) => [p.mpn?.trim().toLowerCase(), p.product_code]),
  //     );

  //     for (const productData of validData) {
  //       if (!productData.product_code) {
  //         const mpnKey = productData.mpn?.trim().toLowerCase();
  //         if (mpnKey && existingProductMap.has(mpnKey)) {
  //           productData.product_code = existingProductMap.get(mpnKey);
  //         } else {
  //           productData.product_code = `PRD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  //         }
  //       }

  //       try {
  //         await ProductAPI.upsert(productData);
  //         processedCount++;
  //       } catch (e) {
  //         console.error(
  //           "Failed to import product:",
  //           productData.product_name,
  //           e,
  //         );
  //         errorCount++;
  //       }
  //     }
  //     loadData();

  //     const masterDataMessage = [];
  //     if (createdBrands > 0) masterDataMessage.push(`${createdBrands} brands`);
  //     if (createdVendors > 0)
  //       masterDataMessage.push(`${createdVendors} vendors`);
  //     if (createdCategories > 0)
  //       masterDataMessage.push(`${createdCategories} categories`);
  //     if (createdIndustries > 0) {
  //       masterDataMessage.push(`${createdIndustries} industries`);
  //     }
  //     const masterDataText =
  //       masterDataMessage.length > 0
  //         ? ` (Auto-created: ${masterDataMessage.join(", ")})`
  //         : "";

  //     setToast({
  //       message: `Import complete: ${processedCount} products processed, ${errorCount} failed${masterDataText}`,
  //       type: errorCount === 0 ? "success" : "error",
  //     });

  //     loadData();
  //   } catch (error: any) {
  //     setToast({ message: error.message || "Import failed", type: "error" });
  //   } finally {
  //     setLoading(false);
  //     e.target.value = "";
  //   }
  // };
  
  
const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setLoading(true);

    const rawData = await parseCSV(file);
    let successCount = 0;
    const errorRows: { row: number; message: string }[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];

      const mappedRow = {
        sku: row?.sku,
        product_name: row?.product_name,
        brand_name: row?.brand,
        model_3d_url: row["3d_model_url"],
        ...row,
      };

      try {
        await ProductAPI.upsert(mappedRow);
        successCount++;
      } catch (error: any) {
        // Extract error text from response
        let errorMessage = "Unknown error";
        if (error?.response?.data) {
          const data = error.response.data;

          if (typeof data === "string") {
            errorMessage = data;
          } else if (data.detail) {
            errorMessage = data.detail;
          } else if (data.errors) {
            // handle nested errors array/object
            if (Array.isArray(data.errors)) {
              errorMessage = data.errors.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
            } else {
              errorMessage = JSON.stringify(data.errors);
            }
          } else {
            errorMessage = JSON.stringify(data);
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        errorRows.push({
          row: i + 2, // +2 if row 1 is header in CSV
          message: errorMessage,
        });
      }
    }

    if (errorRows.length === 0) {
      setToast({
        message: `Import completed ✅ ${successCount} rows inserted.`,
        type: "success",
      });
    } 
    else if (errorRows.length > 0) {
      const errorMessages = errorRows
        .map((e) => `Row ${e.row}: ${e.message}`)
        .join(" | "); // or "\n" if your toast supports multiline

      setToast({
        message: `Import finished. ✅ ${successCount} success, ❌ ${errorRows.length} failed. Errors: ${errorMessages}`,
        type: "error",
      });
    }
  } catch (err: any) {
    setToast({
      message: err.message || "Failed to process file",
      type: "error",
    });
  } finally {
    setLoading(false);
    e.target.value = "";
  }
};
  
  const downloadTemplate = () => {
  const template: Record<string, any> = {
    // Product basic info
    "Prod ID": "010-02092-00",
    sku: "10100388",
    product_name: `High Bay Light, 80 CRI, 4000K, 11.33 in. Dia, 8.67 in. ht, White,
Die-Cast Aluminum Housing, LED, 18000 lm, 11 to 14 in. Mount, Suspension, UL, DLC`,
    brand: "Cooper Lighting LLC",
    gtin: "0753759197087",
    ean: "0753759197087",
    upc: "753759197087",
    unspc: "43191501",
    mpn: "010-02092-00",
    industry_name: "Marine",
    category_1: "Electronics",
    category_2: "Marine Electronics",
    category_3: "GPS & Chartplotters",
    category_4: "17-inch Models",
    category_5: "",
    category_6: "",
    category_7: "",
    category_8: "",
    taxonomy: "Marine > Electronics > GPS & Chartplotters",
    country_of_origin: "USA",
    warranty: "3 years",

    // Dimensions & Pricing
    weight: "4.2",
    weight_unit: "kg",
    length: "30",
    width: "25",
    height: "10",
    dimension_unit: "cm",
    currency: "USD",
    base_price: "2499.99",
    sale_price: "2299.99",
    selling_price: "2299.99",
    special_price: "2199.99",
    stock_qty: "50",
    stock_status: "In Stock",

    // Vendor info
    vendor_name: "Garmin",
    vendor_sku: "GAR-8617",

    // Images
    image_name_1: "010-02092-00-Image-1",
    image_url_1: "https://example.com/images/gpsmap-8617-front.jpg",
    image_name_2: "010-02092-00-Image-2",
    image_url_2: "https://example.com/images/gpsmap-8617-side.jpg",
    image_name_3: "010-02092-00-Image-3",
    image_url_3: "https://example.com/images/gpsmap-8617-back.jpg",
    image_name_4: "010-02092-00-Image-3",
    image_url_4: "https://example.com/images/gpsmap-8617-back.jpg",
    image_name_5: "010-02092-00-Image-3",
    image_url_5: "https://example.com/images/gpsmap-8617-back.jpg",
    image_name_6: "010-02092-00-Image-3",
    image_url_6: "https://example.com/images/gpsmap-8617-back.jpg",
    image_name_7: "010-02092-00-Image-3",
    image_url_7: "https://example.com/images/gpsmap-8617-back.jpg",
    image_name_8: "010-02092-00-Image-3",
    image_url_8: "https://example.com/images/gpsmap-8617-back.jpg",

    // Videos
    video_name_1: "010-02092-00-Video-1",
    video_url_1: "https://example.com/videos/gpsmap-8617-overview.mp4",
    video_name_2: "010-02092-00-Video-1",
    video_url_2: "https://example.com/videos/gpsmap-8617-overview.mp4",
    video_name_3: "010-02092-00-Video-1",
    video_url_3: "https://example.com/videos/gpsmap-8617-overview.mp4",

    // Documents
    document_name_1: "010-02092-00-Manual",
    document_url_1: "https://example.com/docs/gpsmap-8617-manual.pdf",
    document_name_2: "010-02092-00-Manual",
    document_url_2: "https://example.com/docs/gpsmap-8617-manual.pdf",
    document_name_3: "010-02092-00-Manual",
    document_url_3: "https://example.com/docs/gpsmap-8617-manual.pdf",
    document_name_4: "010-02092-00-Manual",
    document_url_4: "https://example.com/docs/gpsmap-8617-manual.pdf",
    document_name_5: "010-02092-00-Manual",
    document_url_5: "https://example.com/docs/gpsmap-8617-manual.pdf",

    // 3D Model
    "3d_model_url": "https://example.com/models/gpsmap-8617.glb",

    // Descriptions
    short_description: "17-inch marine chartplotter with Wi-Fi connectivity",
    long_description: `Professional 17-inch marine chartplotter with worldwide basemap, built-in Wi-Fi, and premium chart support. Ideal for recreational and commercial vessels. IPX7 waterproof, NMEA 2000 and 0183 compatible.`,

    // Features
    features_1: "17-inch multi-touch widescreen display",
    features_2: "Worldwide basemap included",
    features_3: "Built-in Wi-Fi connectivity",
    features_4: "NMEA 2000 and NMEA 0183 network support",
    features_5: "Premium chart compatibility",
    features_6: "Garmin Marine Network compatible",
    features_7: "IPX7 waterproof rating",
    features_8: "Auto guidance technology",
    features_9: "Sonar support",
    features_10: "Radar integration",

    // SEO
    meta_title: "Garmin GPSMAP 8617 17-inch Marine Chartplotter | Marine Electronics",
    meta_description: "Professional 17-inch marine chartplotter with worldwide basemap, Wi-Fi, and premium chart support. Perfect for serious boaters and commercial vessels.",
    search_keywords: "marine GPS, chartplotter, Garmin, navigation, marine electronics",

    // Compliance
    certification: "UL, CE, FCC",
    safety_standard: "IPX7 waterproof",
    hazardous_material: "None",
    prop65_warning: "Not applicable",
  };

  // --- Dynamically add 20 attribute slots ---
  for (let i = 1; i <= 20; i++) {
    template[`attribute_name${i}`] = "";
    template[`attribute_value${i}`] = "";
    template[`attribute_uom${i}`] = "";
    template[`validation_value${i}`] = "";
    template[`validation_uom${i}`] = "";
  }

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
  const handleDeleteVariant = async () => {
    if (!editingProduct || !deleteVariantModal.variant) return;

    try {
      await ProductAPI.deleteVariant(
        editingProduct.product_code,
        deleteVariantModal.variant.variant_id,
      );
      setToast({ message: "Variant deleted successfully", type: "success" });
      setDeleteVariantModal({ isOpen: false, variant: null });
      await loadVariants(editingProduct.product_code);
    } catch (error: any) {
      setToast({
        message: error.message || "Failed to delete variant",
        type: "error",
      });
    }
  };
  const handleEditVariant = (variant: any) => {
    const selectedValues: Record<string, string> = {};

    variantAttributes.forEach((attr) => {
      const variantAttrData = variant.attributes?.[attr.attribute_code];
      if (variantAttrData) {
        selectedValues[attr.attribute_code] = variantAttrData.value || "";
      }
    });

    setVariantFormData({
      selectedValues,
      sku: variant.sku || "",
      mpn: variant.mpn || "",
      price: variant.price || 0,
      qty: variant.qty || 0,
    });

    setEditingVariant(variant);
    setShowVariantModal(true);
  };
  interface ImageItem {
    url?: string;
    name?: string;
  }

  interface ImagesObj {
    [key: string]: ImageItem;
  }

  interface Row {
    images?: ImagesObj;
  }
  const columns = [
    {
      key: "image",
      label: "Image",
      render: (_: any, row: Row) => {
        const imagesObj = row?.images;

        if (!imagesObj || Object.keys(imagesObj).length === 0) {
          return (
            <img
              src={ImageComingSoonIcon}
              alt="product default fallback image"
              style={{
                width: 50,
                height: 50,
                objectFit: "cover",
                borderRadius: 4,
              }}
            />
          );
        }

        const imagesArray = Object.values(imagesObj).filter(
          (img): img is ImageItem => !!img?.url,
        );

        if (imagesArray.length === 0) {
          return (
            <img
              src={ImageComingSoonIcon}
              alt="product default fallback image"
              style={{
                width: 50,
                height: 50,
                objectFit: "cover",
                borderRadius: 4,
              }}
            />
          );
        }

        const randomIndex = Math.floor(Math.random() * imagesArray.length);
        const randomImage = imagesArray[randomIndex];

        return (
          <img
            src={randomImage.url}
            alt={randomImage.name || "Product Image"}
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        );
      },
    },
    { key: "mpn", label: "MPN", customTruncate: true, truncateLength: 15 },
    {
      key: "product_name",
      label: "Name",
      width: "20%",
      render: (_: any, row: ProductWithVariantStatus) => (
        <div
          className="overflow-hidden break-words text-wrap"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
          }}
          title={row.product_name}
        >
          {row.product_name}
        </div>
      ),
    },
    {
      key: "vendor_name",
      label: "Vendor",
      sortable: true,
      customTruncate: true,
      truncateLength: 15,
      render: (_: any, row: any) => row.vendor?.vendor_name || "N/A",
    },
    {
      key: "brand_name",
      label: "Brand",
      sortable: true,
      customTruncate: true,
      truncateLength: 15,
      render: (_: any, row: any) => row.brand?.brand_name || "N/A",
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
      key: "category_breadcrumb",
      label: "Category",
      width: "20%",
      render: (_: any, row: ProductWithVariantStatus) => (
        <div
          className="overflow-hidden break-words text-wrap"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
          }}
          title={row.category_breadcrumb}
        >
          {row.category_breadcrumb}
        </div>
      ),
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
            className="p-1 hover:bg-gray-100 text-gray-600 rounded transition-colors"
            title="Delete"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];
  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "descriptions", label: "Descriptions" },
    { id: "pricing", label: "Pricing" },
    { id: "attributes", label: "Attributes" },
    { id: "variants", label: "Variants" },
    { id: "related", label: "Related" },
    { id: "assets", label: "Assets" },
  ];

  const handleCreateVariant = async () => {
    if (!editingProduct) return;

    try {
      if (
        Object.keys(variantFormData.selectedValues).length !==
        variantAttributes.length
      ) {
        setToast({
          message: "Please select all variant attributes",
          type: "error",
        });
        return;
      }

      if (!variantFormData.sku.trim()) {
        setToast({ message: "SKU is required", type: "error" });
        return;
      }

      if (!variantFormData.price || variantFormData.price <= 0) {
        setToast({ message: "Valid price is required", type: "error" });
        return;
      }

      const variantSuffix = Object.entries(variantFormData.selectedValues)
        .map(([code, value]) => value.substring(0, 3).toUpperCase())
        .join("-");

      const variantMPN =
        variantFormData.mpn || `${editingProduct.mpn}-${variantSuffix}`;

      const variantName = `${editingProduct.product_name} - ${Object.entries(
        variantFormData.selectedValues,
      )
        .map(([code, value]) => value)
        .join(" ")}`;

      const variantAttrsPayload = Object.entries(
        variantFormData.selectedValues,
      ).reduce(
        (acc, [code, value]) => {
          const attr = variantAttributes.find((a) => a.attribute_code === code);
          if (attr) {
            acc[code] = {
              name: attr.attribute_name,
              value: value,
              uom: attr.unit || "",
              type: attr.attribute_type,
            };
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      const variantData = {
        product_name: variantName,
        sku: variantFormData.sku,
        mpn: variantMPN,
        price: variantFormData.price,
        qty: variantFormData.qty || 0,
        attributes: variantAttrsPayload,
      };

      await ProductAPI.createVariant(editingProduct.product_code, variantData);

      setToast({ message: "Variant created successfully", type: "success" });
      setShowVariantModal(false);
      setVariantFormData({
        selectedValues: {},
        sku: "",
        mpn: "",
        price: 0,
        qty: 0,
      });

      await loadVariants(editingProduct.product_code);
    } catch (error: any) {
      setToast({
        message: error.message || "Failed to create variant",
        type: "error",
      });
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col h-full">
        <div className="sticky top-0 left-0">
          <div className="flex items-center justify-between ">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Product Master
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your complete product catalog
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1 justify-end">
              <div className="relative w-full md:w-[400px] lg:w-[500px] transition-all duration-300">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search categories or product types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-full text-base shadow-sm hover:shadow-md focus:shadow-md focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-gray-400"
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
                  setEditingProduct(null);
                  resetForm();
                  setIsDrawerOpen(true);
                }}
                className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-100 font-bold whitespace-nowrap"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>
          </div>
          <div className="z-30 bg-white rounded-xl border border-slate-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <MultiSelect
              options={industryOptions}
              value={industryFilter}
              onChange={setIndustryFilter}
              placeholder="Select Industry"
            />
            <MultiSelect
              options={brandOptions}
              value={brandFilter}
              onChange={setBrandFilter}
              placeholder="Select Brand"
            />
            <MultiSelect
              options={vendorOptions}
              value={vendorFilter}
              onChange={setVendorFilter}
              placeholder="Select Vendor"
            />
            <FilterSelect
                options={["Base", "Variant", "Parent"]}
                value={variantStatusFilter}
                onChange={setVariantStatusFilter}
                placeholder="All Status"
            />
            <MultiSelect
              options={categoryOptions}
              value={category1Filter}
              onChange={setCategory1Filter}
              placeholder="Select Category"
            />

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
                {/* <button
                onClick={downloadTemplate}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors "
                title="Download Template"
              >
                <img
                  src={CustomDownloadIcon}
                  alt="Download"
                  className="w-7 h-7 p-1 object-contain opacity-70 hover:opacity-100"
                />
              </button> */}
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Download template"
                >
                  <img
                    src={CustomDownloadIcon}
                    className="block flex-shrink-0 w-7 h-7 object-contain opacity-70 hover:opacity-100"
                    alt="Template"
                  />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-1 py-4">
            <p className="text-sm text-gray-500 italic">
              {industryFilter ||
              brandFilter ||
              vendorFilter ||
              variantStatusFilter ||
              category1Filter ||
              productTypeFilter ? (
                <span>
                  Showing <strong>{filteredProducts.length}</strong> matching
                  results out of {products.length} total products
                </span>
              ) : (
                <span>
                  Showing all <strong>{products.length}</strong> products
                </span>
              )}
            </p>

            {(searchTerm ||
              industryFilter ||
              brandFilter ||
              vendorFilter ||
              variantStatusFilter ||
              category1Filter ||
              productTypeFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setIndustryFilter([]);
                  setBrandFilter([]);
                  setVendorFilter([]);
                  setVariantStatusFilter("");
                  setCategory1Filter([]);
                  setProductTypeFilter("");
                }}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        <div className="">
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
        </div>
      </div>

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
        <div className="p-6 pb-22 space-y-6">
          {activeTab === "basic" && (
            <div className="space-y-4">
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
                    {[...brands]
                      .sort((a, b) =>
                        (a.brand_name || "").localeCompare(b.brand_name || ""),
                      )
                      .map((brand) => (
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
                    {[...vendors]
                      .sort((a, b) =>
                        (a.vendor_name || "").localeCompare(
                          b.vendor_name || "",
                        ),
                      )
                      .map((vendor) => (
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
                    {[...categories]
                      .sort((a, b) =>
                        (a.breadcrumb || "").localeCompare(b.breadcrumb || ""),
                      )
                      .map((category) => (
                        <option
                          key={category.breadcrumb}
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
                    {[...industries]
                      .sort((a, b) =>
                        (a.industry_name || "").localeCompare(
                          b.industry_name || "",
                        ),
                      )
                      .map((industry) => (
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
          {activeTab === "pricing" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">
                Pricing Details
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: "Price", key: "price" },
                  { label: "Sale Price", key: "sale_price" },
                  { label: "List Price", key: "list_price" },
                  { label: "Base Price", key: "base_price" },
                  { label: "Regular Price", key: "regular_price" },
                  { label: "Retail Price", key: "retail_price" },
                  { label: "MSRP", key: "msrp" },
                  { label: "MAP", key: "map_price" },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {item.label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData[item.key as keyof Product] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [item.key]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ))}
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
          {/* {activeTab === "attributes" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Product Attributes
              </h3>

              {formData.attributes &&
              Object.keys(formData.attributes).length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(formData.attributes)
                    .filter(([key, attr]: any) => {
                      const isSingleVariant = regularAttributes.some(
                        (ra) => ra.attribute_code === key,
                      );
                      const isVariant = variantAttributes.some(
                        (va) => va.attribute_code === key,
                      );
                      return !isVariant || isSingleVariant;
                    })
                    .map(([key, attr]: any) => (
                      <div
                        key={key}
                        className="flex gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50 items-center"
                      >
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                          {key.startsWith("ATTR") ? "A" : key}
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              value={attr.name}
                              readOnly
                              className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Value
                            </label>

                            {attr.options && attr.options.length > 0 ? (
                              <select
                                value={attr.value || ""}
                                onChange={(e) => {
                                  const selectedOpt = attr.options.find(
                                    (opt: any) => opt.value === e.target.value,
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    attributes: {
                                      ...prev.attributes,
                                      [key]: {
                                        ...prev.attributes![key],
                                        value: e.target.value,
                                        uom: selectedOpt
                                          ? selectedOpt.uom
                                          : attr.uom,
                                      },
                                    },
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-blue-300 rounded bg-white focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select...</option>
                                {attr.options.map((opt: any, idx: number) => (
                                  <option key={idx} value={opt.value}>
                                    {opt.value}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={attr.value}
                                onChange={(e) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    attributes: {
                                      ...prev.attributes,
                                      [key]: {
                                        ...prev.attributes![key],
                                        value: e.target.value,
                                      },
                                    },
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white focus:border-blue-500"
                              />
                            )}
                            {attr.options && attr.options.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {attr.options.map((opt: any, idx: number) => {
                                const checked = attr.value?.includes(opt.value) || false;

                                return (
                                  <h1>Delson</h1>
                                );
                              })}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={attr.value}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  attributes: {
                                    ...prev.attributes,
                                    [key]: {
                                      ...prev.attributes![key],
                                      value: e.target.value,
                                    },
                                  },
                                }));
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded bg-white focus:border-blue-500"
                            />
                          )}
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              UOM
                            </label>
                            <input
                              type="text"
                              value={attr.uom || "-"}
                              readOnly={
                                !!(attr.options && attr.options.length > 0)
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100 text-gray-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                  <p>No attributes found for this product.</p>
                </div>
              )}
            </div>
          )} */}
          {activeTab === "attributes" && (
            <div className="space-y-4">
              {formData.attributes && Object.keys(formData.attributes).length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {/* Use ProductAttributeUpdate component */}
                  <ProductAttributeUpdate
                    //@ts-ignore
                    product_id={formData.product_code}
                    data={Object.entries(formData.attributes).map(([key, attr]: any) => ({
                      id: attr.id,
                      attribute_code: attr.attribute_code,
                      name: attr.name,
                      selected_values: attr.selected_values || [], // keep existing selected values
                      options: attr.options || [], // <-- include options always
                    }),)}
                    parentFormData={formData}
                    setParentFormData={setFormData}
                  />
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                  <p>No attributes found for this product.</p>
                </div>
              )}
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
                    {variantAttributes.length === 0
                      ? "No variant attributes (2+ required)"
                      : `${variantAttributes.length} variant attributes configured`}
                  </p>
                </div>

                {editingProduct && variantAttributes.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => setShowVariantModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Variant
                  </button>
                )}
              </div>

              {variantAttributes.length >= 2 ? (
                editingProduct ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Variant Attributes
                      </h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                Attribute Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                Values
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {variantAttributes.map((attr) => {
                              const values = [];
                              for (let i = 1; i <= 50; i++) {
                                const value =
                                  attr[
                                    `attribute_value_${i}` as keyof Attribute
                                  ];
                                if (value && String(value).trim()) {
                                  values.push(String(value).trim());
                                }
                              }

                              return (
                                <tr
                                  key={attr.attribute_code}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-4 py-3">
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {attr.attribute_name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {attr.attribute_code}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {values.length > 0 ? (
                                        values.map((val, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                          >
                                            {val}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-sm text-gray-400">
                                          No values
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Created Variants
                      </h4>
                      {variants.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                {variantAttributes.map((attr) => (
                                  <th
                                    key={attr.attribute_code}
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                                  >
                                    {attr.attribute_name}
                                  </th>
                                ))}
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                  SKU
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                  Price
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                  Qty
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {variants.map((variant: any) => (
                                <tr
                                  key={variant.variant_id}
                                  className="hover:bg-gray-50"
                                >
                                  {variantAttributes.map((attr) => {
                                    const attrValue =
                                      variant.attributes?.[attr.attribute_code]
                                        ?.value || "-";
                                    return (
                                      <td
                                        key={attr.attribute_code}
                                        className="px-4 py-3 text-sm text-gray-900"
                                      >
                                        {attrValue}
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-3 text-sm font-mono text-gray-700">
                                    {variant.sku}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    ${variant.price?.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {variant.qty || 0}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          handleEditVariant(variant)
                                        }
                                        className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                                        title="Edit"
                                      >
                                        <Edit size={14} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          setDeleteVariantModal({
                                            isOpen: true,
                                            variant: variant,
                                          })
                                        }
                                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                                        title="Delete"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-lg p-8 text-center">
                          <Package
                            size={48}
                            className="mx-auto text-gray-400 mb-3"
                          />
                          <p className="text-gray-600 mb-2">
                            No variants created yet
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-600">
                      Save the product first to add variants
                    </p>
                  </div>
                )
              ) : variantAttributes.length === 1 ? (
                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-700 font-bold text-sm">
                        !
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">
                        Only 1 variant attribute found
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        "{variantAttributes[0].attribute_name}" is shown in the
                        Attributes tab. Add at least one more variant attribute
                        to enable variant product creation.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <Package size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">
                    No variant attributes configured
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Configure 2+ variant attributes in Attributes Master for
                    this category
                  </p>
                </div>
              )}
            </div>
          )}
          <Modal
            isOpen={deleteVariantModal.isOpen}
            onClose={() =>
              setDeleteVariantModal({ isOpen: false, variant: null })
            }
            title="Delete Variant"
            actions={
              <>
                <button
                  onClick={() =>
                    setDeleteVariantModal({ isOpen: false, variant: null })
                  }
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteVariant}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </>
            }
          >
            <p className="text-gray-600">
              Are you sure you want to delete variant{" "}
              <span className="font-semibold">
                {deleteVariantModal.variant?.sku ||
                  deleteVariantModal.variant?.variant_id}
              </span>
              ? This action cannot be undone.
            </p>
          </Modal>
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
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon size={20} className="text-blue-600" />
                  Product Images
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const asset = formData.images?.[num] || {
                      name: "",
                      url: "",
                    };
                    return (
                      <div
                        key={num}
                        className="grid grid-cols-[1fr_2fr_auto] gap-3 p-3 border rounded-lg bg-gray-50 items-center"
                      >
                        <input
                          type="text"
                          placeholder="Image Name"
                          value={asset.name}
                          onChange={(e) => {
                            const currentImages = formData.images || {};
                            const updatedImages = {
                              ...currentImages,
                              [num]: { ...asset, name: e.target.value },
                            };
                            setFormData({ ...formData, images: updatedImages });
                          }}
                          className="px-3 py-1.5 border rounded-md text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={asset.url}
                          onChange={(e) => {
                            const currentImages = formData.images || {};
                            const updatedImages = {
                              ...currentImages,
                              [num]: { ...asset, url: e.target.value },
                            };
                            setFormData({ ...formData, images: updatedImages });
                          }}
                          className="px-3 py-1.5 border rounded-md text-sm"
                        />
                        {asset.url && (
                          <div className="w-10 h-10 rounded border overflow-hidden bg-white">
                            <img
                              src={asset.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Film size={20} className="text-green-600" />
                  Videos
                </h3>
                {[1, 2, 3].map((num) => {
                  const asset = formData.videos?.[num] || { name: "", url: "" };
                  return (
                    <div
                      key={num}
                      className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-gray-50"
                    >
                      <input
                        type="text"
                        placeholder="Video Name"
                        value={asset.name}
                        onChange={(e) => {
                          const currentVideos = formData.videos || {};
                          setFormData({
                            ...formData,
                            videos: {
                              ...currentVideos,
                              [num]: { ...asset, name: e.target.value },
                            },
                          });
                        }}
                        className="px-3 py-1.5 border rounded-md text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Video URL"
                        value={asset.url}
                        onChange={(e) => {
                          const currentVideos = formData.videos || {};
                          setFormData({
                            ...formData,
                            videos: {
                              ...currentVideos,
                              [num]: { ...asset, url: e.target.value },
                            },
                          });
                        }}
                        className="px-3 py-1.5 border rounded-md text-sm"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-orange-600" />
                  Documents (PDFs)
                </h3>
                {[1, 2, 3, 4, 5].map((num) => {
                  const asset = formData.documents?.[num] || {
                    name: "",
                    url: "",
                  };
                  return (
                    <div
                      key={num}
                      className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-gray-50"
                    >
                      <input
                        type="text"
                        placeholder="Document Name"
                        value={asset.name}
                        onChange={(e) => {
                          const currentDocs = formData.documents || {};
                          setFormData({
                            ...formData,
                            documents: {
                              ...currentDocs,
                              [num]: { ...asset, name: e.target.value },
                            },
                          });
                        }}
                        className="px-3 py-1.5 border rounded-md text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Document URL"
                        value={asset.url}
                        onChange={(e) => {
                          const currentDocs = formData.documents || {};
                          setFormData({
                            ...formData,
                            documents: {
                              ...currentDocs,
                              [num]: { ...asset, url: e.target.value },
                            },
                          });
                        }}
                        className="px-3 py-1.5 border rounded-md text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 shadow-lg flex gap-3">
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
      </Drawer>
      <Modal
        isOpen={showVariantModal}
        onClose={() => {
          setShowVariantModal(false);
          setVariantFormData({
            selectedValues: {},
            sku: "",
            mpn: "",
            price: 0,
            qty: 0,
          });
          setEditingVariant(null);
        }}
        title={
          editingVariant ? "Edit Product Variant" : "Create Product Variant"
        }
      >
        <div className="space-y-4 p-4">
          {variantAttributes.map((attr) => {
            const values = [];
            for (let i = 1; i <= 50; i++) {
              const value = attr[`attribute_value_${i}` as keyof Attribute];
              if (value && String(value).trim()) {
                values.push(String(value).trim());
              }
            }

            return (
              <div key={attr.attribute_code}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {attr.attribute_name} <span className="text-red-500">*</span>
                </label>
                <select
                  value={
                    variantFormData.selectedValues[attr.attribute_code] || ""
                  }
                  onChange={(e) => {
                    setVariantFormData({
                      ...variantFormData,
                      selectedValues: {
                        ...variantFormData.selectedValues,
                        [attr.attribute_code]: e.target.value,
                      },
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select {attr.attribute_name}</option>
                  {values.map((val, idx) => (
                    <option key={idx} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={variantFormData.sku}
              onChange={(e) =>
                setVariantFormData({ ...variantFormData, sku: e.target.value })
              }
              placeholder="e.g., SKU-RED-LARGE"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={variantFormData.price || ""}
                onChange={(e) =>
                  setVariantFormData({
                    ...variantFormData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={variantFormData.qty || ""}
              onChange={(e) =>
                setVariantFormData({
                  ...variantFormData,
                  qty: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={() => {
              setShowVariantModal(false);
              setEditingVariant(null);
              setVariantFormData({
                selectedValues: {},
                sku: "",
                mpn: "",
                price: 0,
                qty: 0,
              });
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={editingVariant ? handleUpdateVariant : handleCreateVariant}
            disabled={
              Object.keys(variantFormData.selectedValues).length !==
                variantAttributes.length ||
              !variantFormData.sku.trim() ||
              !variantFormData.price
            }
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {editingVariant ? "Update Variant" : "Create Variant"}
          </button>
        </div>
      </Modal>

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
