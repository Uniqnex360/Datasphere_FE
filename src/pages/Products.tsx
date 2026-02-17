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
      }

      const hasProductName =
        rawData.length > 0 &&
        (rawData[0].product_name ||
          rawData[0].product_title ||
          rawData[0].title ||
          rawData[0].name);

      if (!hasProductName) {
        setToast({
          message:
            "Import failed: Product name column is required (product_name, product_title, title, or name)",
          type: "error",
        });
        e.target.value = "";
        return;
      }

      const bundleAssets = (row: any, type: string) => {
        const assets: Record<string, { name: string; url: string }> = {};
        Object.keys(row).forEach((key) => {
          const urlMatch = key.match(
            new RegExp(`^${type}[_\\s]*url[_\\s]*(\\d+)$`, "i"),
          );
          const nameMatch = key.match(
            new RegExp(`^${type}[_\\s]*name[_\\s]*(\\d+)$`, "i"),
          );

          if (urlMatch) {
            const idx = urlMatch[1];
            if (!assets[idx]) assets[idx] = { name: "", url: "" };
            assets[idx].url = String(row[key] || "").trim();
          }
          if (nameMatch) {
            const idx = nameMatch[1];
            if (!assets[idx]) assets[idx] = { name: "", url: "" };
            assets[idx].name = String(row[key] || "").trim();
          }
        });

        const cleaned: Record<string, any> = {};
        Object.entries(assets).forEach(([idx, data]) => {
          if (data.url) {
            cleaned[idx] = {
              url: data.url,
              name:
                data.name ||
                `${type.charAt(0).toUpperCase() + type.slice(1)} ${idx}`,
            };
          }
        });
        return Object.keys(cleaned).length > 0 ? cleaned : {};
      };

      const validData: Partial<Product>[] = [];
      const importErrors: string[] = [];
      const brandsToCreate = new Map<string, any>();
      const vendorsToCreate = new Map<string, any>();
      const categoriesToCreate = new Map<string, any>();
      const industriesToCreate = new Map<string, any>();

      const data = rawData
        .map((row: any, index: number) => {
          const mapped: any = {};

          try {
            const productNameKey = Object.keys(row).find(
              (k) =>
                k.toLowerCase().replace(/_/g, " ") === "product name" ||
                k.toLowerCase() === "name",
            );
            mapped.product_name = String(
              row[productNameKey || "product_name"] || "",
            ).trim();

            if (!mapped.product_name) {
              throw new Error("Missing Product Name column or empty value");
            }
            mapped.product_code = row.product_code?.trim() || null;
            mapped.price = parseFloat(row.price) || 0;
            mapped.sale_price = parseFloat(row.sale_price) || 0;
            mapped.list_price = parseFloat(row.list_price) || 0;
            mapped.base_price = parseFloat(row.base_price) || 0;
            mapped.regular_price = parseFloat(row.regular_price) || 0;
            mapped.retail_price = parseFloat(row.retail_price) || 0;
            mapped.msrp = parseFloat(row.msrp) || 0;
            mapped.map_price = parseFloat(row.map_price || row.map) || 0;
            mapped.sku = row.sku?.trim() || "";
            mapped.variant_sku = row.variant_sku?.trim() || "";
            mapped.mpn = row.mpn?.trim() || "";
            mapped.model_series = row.model_series?.trim() || "";
            mapped.ean = row.ean?.trim() || "";
            mapped.upc = row.upc?.trim() || "";
            mapped.unspsc = row.unspc?.trim() || row.unspsc?.trim() || "";
            mapped.gtin = row.gtin?.trim() || "";
            mapped.product_type = row.product_type?.trim() || "";
            mapped.prod_short_desc = row.prod_short_desc?.trim() || "";
            mapped.prod_long_desc = row.prod_long_desc?.trim() || "";
            mapped.meta_title = row.meta_title?.trim() || "";
            mapped.meta_desc = row.meta_desc?.trim() || "";
            mapped.meta_keywords = row.meta_keywords?.trim() || "";

            const brandName = row.brand_name?.trim();
            const mfgName = row.mfg_name?.trim();
            const industryName = row.industry_name?.trim();
            mapped.industry_name = industryName || "";
            if (industryName) {
              const industryKey = industryName.toLowerCase().trim();
              if (!industriesToCreate.has(industryKey)) {
                industriesToCreate.set(industryKey, {
                  industry_code:
                    row.industry_code?.trim() ||
                    industryName
                      .substring(0, 4)
                      .toUpperCase()
                      .replace(/[^A-Z]/g, ""),
                  industry_name: industryName,
                });
              }
            }

            if (brandName) {
              mapped.brand_name = brandName;
              mapped.mfg_name = mfgName || brandName;
              const existingBrand = brands.find(
                (b) => b.brand_name.toLowerCase() === brandName.toLowerCase(),
              );
              if (existingBrand) {
                mapped.brand_code = existingBrand.brand_code;
              } else {
                // const brandCode = `BRND-${brandName
                //   .substring(0, 8)
                //   .toUpperCase()
                //   .replace(/[^A-Z0-9]/g, "")}`;
                // mapped.brand_code = brandCode;
                brandsToCreate.set(brandName, {
                  // brand_code: brandCode,
                  brand_name: brandName,
                  mfg_name: mfgName || brandName,
                });
              }
            }

            const vendorName = row.vendor_name?.trim();
            if (vendorName) {
              mapped.vendor_name = vendorName;
              const existingVendor = vendors.find(
                (v) => v.vendor_name.toLowerCase() === vendorName.toLowerCase(),
              );
              if (existingVendor) {
                mapped.vendor_code = existingVendor.vendor_code;
              } else {
                // const vendorCode = `VEND-${vendorName
                //   .substring(0, 8)
                //   .toUpperCase()
                //   .replace(/[^A-Z0-9]/g, "")}`;
                const vendorCode = "";
                mapped.vendor_code = vendorCode;
                if (vendorName) {
                  vendorsToCreate.set(vendorName.toLowerCase(), {
                    vendor_code: vendorCode,
                    vendor_name: vendorName,
                    industry_name: industryName,
                    contact_email: `info@${vendorName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
                    contact_phone: "000-000-0000",
                  });
                }
              }
            }

            // const industryName = row.industry_name?.trim();
            // mapped.industry_name = industryName || "";

            const categoryLevels: string[] = [];
            Object.keys(row).forEach((key) => {
              const categoryMatch = key.match(/^category[_\s]*(\d+)$/i);
              if (categoryMatch) {
                const level = parseInt(categoryMatch[1]);
                const value = row[key]?.trim();
                if (value) {
                  categoryLevels[level - 1] = value;
                  mapped[`category_${level}`] = value;
                }
              }
            });

            if (categoryLevels.length > 0) {
              const cat1 = categoryLevels[0];
              const breadcrumb = categoryLevels.filter(Boolean).join(" > ");
              const existingCategory = categories.find(
                (c) => c.category_1?.toLowerCase() === cat1.toLowerCase(),
              );

              if (existingCategory) {
                mapped.category_code = existingCategory.category_code;
              } else {
                const categoryCode = `CAT-${cat1
                  .substring(0, 8)
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")}`;
                mapped.category_code = categoryCode;
                const categoryData: any = {
                  category_code: categoryCode,
                  industry_name: industryName || "General",
                  breadcrumb: breadcrumb,
                };
                categoryLevels.forEach((cat, index) => {
                  if (cat) categoryData[`category_${index + 1}`] = cat;
                });
                categoriesToCreate.set(categoryCode, categoryData);
              }
            }

            Object.keys(row).forEach((key) => {
              const featureMatch = key.match(/^features?_?(\d+)$/i);
              if (featureMatch) {
                const num = featureMatch[1];
                const value = row[key]?.trim();
                if (value) mapped[`features_${num}`] = value;
              }
            });

            const attributeData = new Map();
            Object.keys(row).forEach((key) => {
              const nameMatch = key.match(/^attribute_?names?_?(\d+)$/i);
              const valueMatch = key.match(/^attribute_?values?_?(\d+)$/i);
              const uomMatch = key.match(/^attribute_?uoms?_?(\d+)$/i);

              if (nameMatch) {
                const num = nameMatch[1];
                const value = String(row[key] || "").trim();
                if (value) {
                  if (!attributeData.has(num)) attributeData.set(num, {});
                  attributeData.get(num).name = value;
                }
              }
              if (valueMatch) {
                const num = valueMatch[1];
                const value = String(row[key] || "").trim();
                if (value) {
                  if (!attributeData.has(num)) attributeData.set(num, {});
                  attributeData.get(num).value = value;
                }
              }
              if (uomMatch) {
                const num = uomMatch[1];
                const value = String(row[key] || "").trim();
                if (value) {
                  if (!attributeData.has(num)) attributeData.set(num, {});
                  attributeData.get(num).uom = value;
                }
              }
            });
            const attributesJson: Record<string, any> = {};
            attributeData.forEach((attr, num) => {
              if (attr.name && attr.value) {
                attributesJson[num] = {
                  name: attr.name,
                  value: attr.value,
                  uom: attr.uom || null,
                };
              }
            });
            if (Object.keys(attributesJson).length > 0) {
              mapped.attributes = attributesJson;
            }

            mapped.images = bundleAssets(row, "image");
            mapped.videos = bundleAssets(row, "video");

            let documents = bundleAssets(row, "document");

            if (Object.keys(documents).length === 0) {
              let docCount = 1;
              const allKeys = Object.keys(row);
              allKeys.forEach((key, idx) => {
                const value = String(row[key] || "").trim();
                if (value.toLowerCase().match(/^http.*\.pdf(\?.*)?$/i)) {
                  let docName = "";
                  if (idx > 0) {
                    const prevKey = allKeys[idx - 1];
                    const prevValue = String(row[prevKey] || "").trim();
                    if (prevValue && !prevValue.startsWith("http")) {
                      docName = prevValue;
                    }
                  }
                  if (!docName) {
                    docName = key.replace(/_/g, " ").replace(/url/i, "").trim();
                    docName =
                      docName.charAt(0).toUpperCase() + docName.slice(1);
                  }
                  // let name = key.replace(/_/g, " ").trim();

                  // if (!name || name.length > 50) {
                  //   name = `Document ${docCount}`;
                  // }

                  documents[docCount] = { name: docName, url: value };
                  docCount++;
                }
              });
            }
            mapped.documents = documents;

            return mapped;
          } catch (error: any) {
            console.error(`Error processing row ${index + 1}:`, error);
            importErrors.push(
              `Row ${index + 2}: Error processing data - ${error.message}`,
            );
            return null;
          }
        })
        .filter(Boolean);

      data.forEach((row: any, index: number) => {
        if (!row.product_name?.trim()) {
          importErrors.push(`Row ${index + 2}: Product Name is required`);
        } else {
          validData.push(row);
        }
      });

      if (importErrors.length > 0) {
        setToast({
          message: `Import failed with ${importErrors.length} errors. First error: ${importErrors[0]}`,
          type: "error",
        });
        return;
      }

      let createdBrands = 0;
      let createdVendors = 0;
      let createdCategories = 0;
      let createdIndustries = 0;
      let createdCount = 0;
      let skippedCount = 0;

      if (brandsToCreate.size > 0) {
        try {
          const existingBrands = await MasterAPI.getBrands();
          const existingCodes = new Set(
            existingBrands.map((b: any) => b.brand_code),
          );
          const newBrands = Array.from(brandsToCreate.values()).filter(
            (b) => !existingCodes.has(b.brand_code),
          );

          for (const brand of newBrands) {
            try {
              await MasterAPI.create("brands", brand);
              createdBrands++;
            } catch (err) {
              console.warn("Brand create failed", err);
            }
          }
        } catch (e) {
          console.error("Brand sync error", e);
        }
      }
      if (industriesToCreate.size > 0) {
        try {
          const existingIndustries = await MasterAPI.getIndustries();
          const existingNames = new Set(
            (existingIndustries || []).map((i: any) =>
              (i.industry_name || "").toLowerCase().trim(),
            ),
          );
          const newIndustries = Array.from(industriesToCreate.values()).filter(
            (i) => !existingNames.has((i.industry_name || "").toLowerCase()),
          );
          if (newIndustries.length > 0) {
            for (const ind of newIndustries) {
              try {
                await MasterAPI.create("industries", ind);
                createdIndustries++;
              } catch (error) {
                console.warn(
                  `Failed to create industry: ${ind.industry_name}`,
                  error,
                );
              }
            }
          }
        } catch (error) {
          console.error("Industry sync error", error);
        }
      }

      // if (vendorsToCreate.size > 0) {
      //   try {
      //     const existingVendors = await MasterAPI.getVendors();
      //     const existingCodes = new Set(
      //       existingVendors.map((v: any) => v.vendor_code),
      //     );
      //     const newVendors = Array.from(vendorsToCreate.values()).filter(
      //       (v) => !existingCodes.has(v.vendor_code),
      //     );

      //     for (const vendor of newVendors) {
      //       try {
      //         await MasterAPI.create("vendors", vendor);
      //         createdVendors++;
      //       } catch (err) {
      //         console.warn("Vendor create failed", err);
      //       }
      //     }
      //   } catch (e) {
      //     console.error("Vendor sync error", e);
      //   }
      // }
      // Create Vendors
          const latestIndustries = await MasterAPI.getIndustries();

      const industryNameToIdMap = new Map(
        (latestIndustries || [])
          .filter((i: any) => i.industry_name)
          .map((i: any) => [i.industry_name.toLowerCase().trim(), i.id])
      );
      if (vendorsToCreate.size > 0) {
        try {
          const industryNameToIdMap = new Map(
            (latestIndustries || [])
              .filter((i: any) => i.industry_name)
              .map((i: any) => [i.industry_name.toLowerCase().trim(), i.id]),
          );

          const existingVendors = await MasterAPI.getVendors();
          const existingNames = new Set(
            existingVendors.map((v: any) => v.vendor_name.toLowerCase().trim()),
          );

          const newVendors = Array.from(vendorsToCreate.values()).filter(
            (v) => !existingNames.has(v.vendor_name.toLowerCase()),
          );

          for (const vendor of newVendors) {
            try {
              const indName = (vendor as any).industry_name
                ?.toLowerCase()
                .trim();
              if (indName && industryNameToIdMap.has(indName)) {
                vendor.industry_id = industryNameToIdMap.get(indName);
              }

              await MasterAPI.create("vendors", vendor);
              createdVendors++;
            } catch (err) {
              console.warn("Vendor create failed", err);
            }
          }
        } catch (e) {
          console.error("Vendor sync error", e);
        }
      }
      if (categoriesToCreate.size > 0) {
        try {
          const existingCategories = await MasterAPI.getCategories();
          const existingCodes = new Set(
            (existingCategories || []).map((c: any) => c.category_code),
          );
          const newCategories = Array.from(categoriesToCreate.values()).filter(
            (c) => !existingCodes.has(c.category_code),
          );

          for (const category of newCategories) {
            try {
              const catIndName = (category as any).industry_name
                ?.toLowerCase()
                .trim();
              if (catIndName && industryNameToIdMap.has(catIndName)) {
                (category as any).industry_id =
                  industryNameToIdMap.get(catIndName);
              }

              await MasterAPI.create("categories", category);
              createdCategories++; // Use the variable that shows up in your toast!
            } catch (err) {
              console.warn("Category create failed", err);
            }
          }
        } catch (e) {
          console.error("Category sync error", e);
        }
      }

      let processedCount = 0;
      let errorCount = 0;
      const existingProductMap = new Map(
        products.map((p) => [p.mpn?.trim().toLowerCase(), p.product_code]),
      );

      for (const productData of validData) {
        if (!productData.product_code) {
          const mpnKey = productData.mpn?.trim().toLowerCase();
          if (mpnKey && existingProductMap.has(mpnKey)) {
            productData.product_code = existingProductMap.get(mpnKey);
          } else {
            productData.product_code = `PRD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          }
        }

        try {
          await ProductAPI.upsert(productData);
          processedCount++;
        } catch (e) {
          console.error(
            "Failed to import product:",
            productData.product_name,
            e,
          );
          errorCount++;
        }
      }
      loadData();

      const masterDataMessage = [];
      if (createdBrands > 0) masterDataMessage.push(`${createdBrands} brands`);
      if (createdVendors > 0)
        masterDataMessage.push(`${createdVendors} vendors`);
      if (createdCategories > 0)
        masterDataMessage.push(`${createdCategories} categories`);
      if (createdIndustries > 0) {
        masterDataMessage.push(`${createdIndustries} industries`);
      }
      const masterDataText =
        masterDataMessage.length > 0
          ? ` (Auto-created: ${masterDataMessage.join(", ")})`
          : "";

      setToast({
        message: `Import complete: ${processedCount} products processed, ${errorCount} failed${masterDataText}`,
        type: errorCount === 0 ? "success" : "error",
      });

      loadData();
    } catch (error: any) {
      setToast({ message: error.message || "Import failed", type: "error" });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };
  const downloadTemplate = () => {
    const template: any = {
      product_name: "Garmin GPSMAP 8617 Chartplotter",
      brand_name: "Garmin",
      mfg_name: "Garmin Ltd.",
      vendor_name: "Marine Electronics Distributor",
      industry_name: "Marine",

      "category 1": "Electronics",
      "category 2": "Marine Electronics",
      "category 3": "GPS & Chartplotters",
      "category 4": "17-inch Models",

      product_type: "Chartplotter",
      product_code: "",
      sku: "GPSMAP-8617",
      variant_sku: "",
      mpn: "010-02092-00",
      model_series: "GPSMAP 8600 Series",
      ean: "0753759197087",
      upc: "753759197087",
      unspc: "43191501",
      gtin: "00753759197087",
      prod_short_desc:
        "17-inch touchscreen chartplotter with worldwide basemap",
      prod_long_desc:
        "The GPSMAP 8617 features a 17-inch multi-touch widescreen display with worldwide basemap, built-in Wi-Fi and support for premium charts. Includes NMEA 2000 and NMEA 0183 network support for easy integration with compatible marine instruments.",
      price: "199.99",
      sale_price: "149.99",
      list_price: "210.00",
      base_price: "120.00",
      regular_price: "199.99",
      retail_price: "220.00",
      msrp: "249.99",
      map_price: "180.00",
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

      attribute_name1: "Screen Size",
      attribute_value1: "17",
      attribute_uom1: "inches",
      attribute_name2: "Display Type",
      attribute_value2: "Multi-touch LCD",
      attribute_uom2: "",
      attribute_name3: "Power Consumption",
      attribute_value3: "24",
      attribute_uom3: "watts",
      attribute_name4: "Operating Temperature",
      attribute_value4: "-15 to 55",
      attribute_uom4: "°C",
      attribute_name5: "Waterproof Rating",
      attribute_value5: "IPX7",
      attribute_uom5: "",
      attribute_name6: "Display Resolution",
      attribute_value6: "1920 x 1200",
      attribute_uom6: "pixels",
      attribute_name7: "Weight",
      attribute_value7: "4.2",
      attribute_uom7: "kg",

      meta_title:
        "Garmin GPSMAP 8617 17-inch Marine Chartplotter | Marine Electronics",
      meta_desc:
        "Professional 17-inch marine chartplotter with worldwide basemap, Wi-Fi, and premium chart support. Perfect for serious boaters and commercial vessels.",
      meta_keywords:
        "marine GPS, chartplotter, Garmin, navigation, marine electronics",

      related_products_1: "010-02091-00",
      related_products_2: "010-02093-00",
      related_products_3: "010-02094-00",

      pairs_well_with_1: "010-12234-00",
      pairs_well_with_2: "010-12345-00",
      pairs_well_with_3: "010-12456-00",

      image_name_1: "010-02092-00-Image-1",
      image_url_1: "https://example.com/images/gpsmap-8617-front.jpg",
      image_name_2: "010-02092-00-Image-2",
      image_url_2: "https://example.com/images/gpsmap-8617-side.jpg",
      image_name_3: "010-02092-00-Image-3",
      image_url_3: "https://example.com/images/gpsmap-8617-back.jpg",
      image_name_4: "010-02092-00-Image-4",
      image_url_4: "https://example.com/images/gpsmap-8617-screen.jpg",
      image_name_5: "010-02092-00-Image-5",
      image_url_5: "https://example.com/images/gpsmap-8617-installation.jpg",

      video_name_1: "010-02092-00-Video-1",
      video_url_1: "https://example.com/videos/gpsmap-8617-overview.mp4",
      video_name_2: "010-02092-00-Video-2",
      video_url_2: "https://example.com/videos/gpsmap-8617-installation.mp4",
      video_name_3: "010-02092-00-Video-3",
      video_url_3: "https://example.com/videos/gpsmap-8617-features.mp4",

      document_name_1: "010-02092-00-Manual",
      document_url_1: "https://example.com/docs/gpsmap-8617-manual.pdf",
      document_name_2: "010-02092-00-Installation-Guide",
      document_url_2: "https://example.com/docs/gpsmap-8617-install.pdf",
      document_name_3: "010-02092-00-Specifications",
      document_url_3: "https://example.com/docs/gpsmap-8617-specs.pdf",
      document_name_4: "010-02092-00-Quick-Start",
      document_url_4: "https://example.com/docs/gpsmap-8617-quickstart.pdf",
      document_name_5: "010-02092-00-Warranty",
      document_url_5: "https://example.com/docs/gpsmap-8617-warranty.pdf",
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
    // { key: "product_code", label: "Code", sortable: true },
    { key: "product_name", label: "Name", sortable: true },
    {
      key: "brand_name",
      label: "Brand",
      sortable: true,
      render: (_: any, row: any) => row.brand?.brand_name || "N/A",
    },
    {
      key: "vendor_name",
      label: "Vendor",
      sortable: true,
      render: (_: any, row: any) => row.vendor?.vendor_name || "N/A",
    },
    { key: "industry_name", label: "Industry", sortable: true },
    {
      key: "category",
      label: "Category",
      sortable: false,
      width: "400px",
      render: (_: any, row: Product) => (
        <span className="text-sm text-gray-600">
          {getCategoryBreadcrumb(row)}
        </span>
      ),
    },
    // { key: "product_type", label: "Type", sortable: true },
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
    { id: "pricing", label: "Pricing" },
    { id: "attributes", label: "Attributes" },
    { id: "variants", label: "Variants" },
    { id: "related", label: "Related" },
    { id: "assets", label: "Assets" },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
            <option value="" hidden>
              Industry
            </option>
            {[...industries]
              .sort((a, b) =>
                (a.industry_name || "").localeCompare(b.industry_name || ""),
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
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="" hidden>
              Brand
            </option>
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
            <option value="" hidden>
              Vendor
            </option>
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
            <option value="" hidden>
              Status
            </option>
            <option value="Base">Base</option>
            <option value="Parent">Parent</option>

            <option value="Variant">Variant</option>
          </select>
          <select
            value={category1Filter}
            onChange={(e) => {
              setCategory1Filter(e.target.value);
              setProductTypeFilter("");
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="" hidden>
              Category 1
            </option>
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
            <option value="" hidden>
              Product Type
            </option>
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
              <img
                src={CustomDownloadIcon}
                alt="Download"
                className="w-7 h-7 object-contain"
              />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500 italic">
          {searchTerm ||
          industryFilter ||
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
              setIndustryFilter("");
              setBrandFilter("");
              setVendorFilter("");
              setVariantStatusFilter("");
              setCategory1Filter("");
              setProductTypeFilter("");
            }}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
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
        <div className="p-6 pb-22 space-y-6">
          {activeTab === "basic" && (
            <div className="space-y-4">
              {/* <h3 className="font-semibold text-gray-900">Basic Information</h3> */}
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
          {activeTab === "attributes" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Product Attributes
              </h3>

              {formData.attributes &&
              Object.keys(formData.attributes).length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(formData.attributes).map(
                    ([key, attr]: any) => (
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
                                        // Auto-update UOM based on selection
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
                              onChange={(e) => {
                                if (!attr.options) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    attributes: {
                                      ...prev.attributes,
                                      [key]: {
                                        ...prev.attributes![key],
                                        uom: e.target.value,
                                      },
                                    },
                                  }));
                                }
                              }}
                              className={`w-full px-2 py-1 border border-gray-300 rounded ${attr.options ? "bg-gray-100 text-gray-500" : "bg-white"}`}
                            />
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                  <p>No dynamic attributes found for this product.</p>
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
