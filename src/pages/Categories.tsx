import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  FolderTree,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Category } from "../types/category";
import TreeView, { TreeNode } from "../components/TreeView";
import Drawer from "../components/Drawer";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import { exportToCSV, parseCSV } from "../utils/csvHelper";
import {
  buildCategoryTree,
  generateBreadcrumb,
  getCategoryName,
  findParentCategory,
  updateCategoryHierarchy,
  validateCategoryHierarchy,
} from "../utils/categoryHelper";
import { MasterAPI, ProductAPI } from "../lib/api";
import CustomDownloadIcon from "../assets/download-custom.png";
import { generateEntityCode } from "../utils/codeGenerator";
import { validateImportFormat } from "../utils/importValidator";
import { SearchableSelect } from "../components/SearchableSelect";
import { Industry } from "../types/industry";
import { useIndustryManager } from "../hooks/useIndustryManager";

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({ isOpen: false, category: null });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  const [formData, setFormData] = useState<Partial<Category>>({
    industry_code: "",
    industry_name: "",
    category_1: "",
    category_2: "",
    category_3: "",
    category_4: "",
    category_5: "",
    category_6: "",
    category_7: "",
    category_8: "",
    product_type: "",
    breadcrumb: "",
  });

  const [parentCategoryCode, setParentCategoryCode] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const {
    isCustom: isCustomIndustry,
    handleIndustryChange,
    setIsCustom: setIsCustomIndustry,
  } = useIndustryManager(industries, setFormData, setErrors, "industry_name");

  useEffect(() => {
    loadCategories();
    loadIndustries();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm, industryFilter]);

  useEffect(() => {
    if (formData.industry_code) {
      const industry = industries.find(
        (i) => i && i.industry_code === formData.industry_code,
      );
      if (industry) {
        setFormData((prev) => ({
          ...prev,
          industry_name: industry.industry_name,
        }));
      }
    }
  }, [formData.industry_code, industries]);
  useEffect(() => {
    if (parentCategoryCode && !isEditing) {
      const parent = categories.find(
        (c) => c.category_code === parentCategoryCode,
      );
      if (parent) {
        let lastParentLevel = 0;
        for (let i = 1; i <= 8; i++) {
          if (
            parent[`category_${i}` as keyof Category] &&
            String(parent[`category_${i}` as keyof Category]).trim()
          ) {
            lastParentLevel = i;
          } else {
            break;
          }
        }
        const newFormData: Partial<Category> = {
          ...formData,
          industry_code: parent.industry_code,
          industry_name: parent.industry_name,
        };
        for (let i = 1; i <= lastParentLevel; i++) {
          newFormData[`category_${i}` as keyof Category] =
            parent[`category_${i}` as keyof Category];
        }
        for (let i = lastParentLevel + 1; i <= 8; i++) {
          newFormData[`category_${i}` as keyof Category] = "";
        }
        setFormData(newFormData);
      }
    }
  }, [parentCategoryCode]);
  const loadIndustries = async () => {
    try {
      const data = await MasterAPI.getIndustries();
      if (data) {
        console.log("Industries loaded:", data);
        setIndustries(data || []);
        setIndustryOptions(data.map((i: any) => i.industry_name).sort());
      }
    } catch (error: any) {
      console.error("Error loading industries:", error.message);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await MasterAPI.getCategories();
      setCategories(data || []);
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = [...categories].filter((c) => c && c.category_code);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => {
        const code = (c.category_code || "").toLowerCase();
        const breadcrumb = (c.breadcrumb || "").toLowerCase();
        const type = (c.product_type || "").toLowerCase();
        return (
          code.includes(term) ||
          breadcrumb.includes(term) ||
          type.includes(term)
        );
      });
    }

    if (industryFilter) {
      filtered = filtered.filter((c) => c.industry_code === industryFilter);
    }

    setFilteredCategories(filtered);
  };

  const convertToTreeNodes = (
    tree: ReturnType<typeof buildCategoryTree>,
  ): TreeNode[] => {
    return tree.map((node) => ({
      id: node.category.category_code,
      label: getCategoryName(node.category),
      tag: node.category.product_type || undefined,
      children: convertToTreeNodes(node.children),
      data: node.category,
    }));
  };

  const handleCategorySelect = (id: string, data?: any) => {
    const category = data as Category;
    setSelectedCategory(category);
  };

  const handleDrop = async (draggedId: string, targetId: string) => {
    const draggedCategory = categories.find(
      (c) => c.category_code === draggedId,
    );
    const targetCategory = categories.find((c) => c.category_code === targetId);

    if (!draggedCategory || !targetCategory) return;

    const draggedName = getCategoryName(draggedCategory);
    const updates = updateCategoryHierarchy(
      draggedCategory,
      targetCategory,
      draggedName,
    );

    try {
      await MasterAPI.update("categories", draggedId, updates);

      setToast({ message: "Category moved successfully", type: "success" });
      loadCategories();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.industry_name?.trim()) {
      newErrors.industry_name = "Industry is required";
    }

    const hierarchyErrors = validateCategoryHierarchy(formData);
    if (hierarchyErrors.length > 0) {
      newErrors.hierarchy = hierarchyErrors.join(", ");
    }

    let hasAnyLevel = false;
    for (let i = 1; i <= 8; i++) {
      const level = formData[`category_${i}` as keyof Category];
      if (level && String(level).trim()) {
        hasAnyLevel = true;
        break;
      }
    }
    if (!hasAnyLevel) {
      newErrors.category_levels = "At least one category level is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      let industryCode = formData.industry_code;
      let industryName = formData.industry_name?.trim();

      if (!industryName) {
        setToast({ message: "Industry name is required", type: "error" });
        return;
      }

      if (isCustomIndustry) {
        const existingIndustry = industries.find(
          (i) => i.industry_name?.toLowerCase() === industryName?.toLowerCase(),
        );

        if (existingIndustry) {
          industryCode = existingIndustry.industry_code;
          console.log("Industry already exists, using:", industryCode);
        } else {
          if (!industryCode) {
            industryCode = generateEntityCode("industry", industryName || "");
          }

          const existingByCode = industries.find(
            (i) => i.industry_code === industryCode,
          );

          if (existingByCode) {
            industryCode = `${industryCode}-${Date.now().toString().slice(-4)}`;
          }

          try {
            const newIndustry = {
              industry_code: industryCode,
              industry_name: industryName,
              is_active: true,
            };
            console.log("Creating new industry:", newIndustry);
            await MasterAPI.create("industries", newIndustry);
            await loadIndustries();
          } catch (error: any) {
            if (error.message?.includes("already exists")) {
              console.log("Industry creation failed, looking for existing...");
              const refreshedIndustries = await MasterAPI.getIndustries();
              const found = refreshedIndustries.find(
                (i: any) =>
                  i.industry_name?.toLowerCase() ===
                  industryName?.toLowerCase(),
              );
              if (found) {
                industryCode = found.industry_code;
              } else {
                setToast({
                  message: `Failed to create industry: ${error.message}`,
                  type: "error",
                });
                return;
              }
            } else {
              setToast({
                message: `Failed to create industry: ${error.message}`,
                type: "error",
              });
              return;
            }
          }
        }
      } else {
        const selectedIndustry = industries.find(
          (i) => i.industry_name === industryName,
        );

        if (!selectedIndustry) {
          setToast({
            message: "Please select a valid industry",
            type: "error",
          });
          return;
        }

        industryCode = selectedIndustry.industry_code;
      }

      if (!industryCode || industryCode.trim() === "") {
        setToast({
          message: "Industry code is required",
          type: "error",
        });
        return;
      }

      const dataToSubmit: Partial<Category> = {
        ...formData,
        industry_code: industryCode,
        industry_name: industryName,
        breadcrumb: generateBreadcrumb(formData as Category),
        category_code:
          formData.category_code ||
          generateEntityCode("category", formData.category_1 || ""),
      };

      console.log("Submitting category with industry_code:", industryCode);

      if (isEditing && selectedCategory) {
        const conflictingCategory = categories.find(
          (c) =>
            c.breadcrumb === dataToSubmit.breadcrumb &&
            c.category_code !== selectedCategory.category_code,
        );
        if (conflictingCategory) {
          setToast({
            message: "A category with this hierarchy already exists",
            type: "error",
          });
          return;
        }
        await MasterAPI.update(
          "categories",
          selectedCategory.category_code,
          dataToSubmit,
        );
        setToast({ message: "Category updated successfully", type: "success" });
      } else {
        if (parentCategoryCode) {
          const parent = categories.find(
            (c) => c.category_code === parentCategoryCode,
          );
          if (parent) {
            const categoryName = formData.category_1 || "";
            const updates = updateCategoryHierarchy(
              formData as Category,
              parent,
              categoryName,
            );
            Object.assign(dataToSubmit, updates);
          }
        }

        const breadCrumb = generateBreadcrumb(dataToSubmit as Category);
        const existingCategory = categories.find(
          (c) => c.breadcrumb === breadCrumb,
        );
        if (existingCategory) {
          setToast({
            message: "A category with this hierarchy already exists!",
            type: "error",
          });
          return;
        }

        await MasterAPI.create("categories", dataToSubmit);
        setToast({ message: "Category added successfully", type: "success" });
      }

      setIsDrawerOpen(false);
      setIsEditing(false);
      setIsCustomIndustry(false);
      resetForm();
      loadCategories();
      setSelectedCategory(null);
    } catch (error: any) {
      console.error("Submit error:", error);
      setToast({ message: error.message, type: "error" });
    }
  };

  const handleEdit = () => {
    if (!selectedCategory) return;
    setIsEditing(true);
    setFormData(selectedCategory);
    setParentCategoryCode("");
    setErrors({});
  };

  const handleDelete = async () => {
    if (!deleteModal.category) return;

    try {
      const childCategories = categories.filter((c) => {
        const parent = findParentCategory(categories, c);
        return parent?.category_code === deleteModal.category?.category_code;
      });

      if (childCategories.length > 0) {
        setToast({
          message: "Cannot delete category with child categories",
          type: "error",
        });
        setDeleteModal({ isOpen: false, category: null });
        return;
      }

      const products = await ProductAPI.getAll(0, 1, {
        category_code: deleteModal.category.category_code,
      });

      if (Array.isArray(products) && products.length > 0) {
        setToast({
          message: "Cannot delete category linked to products",
          type: "error",
        });
        setDeleteModal({ isOpen: false, category: null });
        return;
      }

      await MasterAPI.delete("categories", deleteModal.category.category_code);

      setToast({ message: "Category deleted successfully", type: "success" });
      setDeleteModal({ isOpen: false, category: null });
      setSelectedCategory(null);
      loadCategories();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    }
  };

  const resetForm = () => {
    setFormData({
      category_code: "",
      industry_code: "",
      industry_name: "",
      category_1: "",
      category_2: "",
      category_3: "",
      category_4: "",
      category_5: "",
      category_6: "",
      category_7: "",
      category_8: "",
      product_type: "",
      breadcrumb: "",
    });
    setParentCategoryCode("");
    setErrors({});
  };

  const handleExport = () => {
    if (filteredCategories.length === 0) {
      setToast({ message: "No data to export", type: "error" });
      return;
    }
    exportToCSV(filteredCategories, "categories.csv");
    setToast({ message: "Categories exported successfully", type: "success" });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseCSV(file);
      const expectedColumns = [
        "industry_code",
        "industry_name",
        "category_1",
        "category_2",
        "category_3",
        "category_4",
        "category_5",
        "category_6",
        "category_7",
        "category_8",
        "product_type",
        "breadcrumb",
      ];
      const validation = validateImportFormat(data, expectedColumns);
      if (!validation.isValid) {
        setToast({
          message: validation.errorMessage || "Import failed!",
          type: "error",
        });
        e.target.value = "";
        return;
      }
      const validData: Partial<Category>[] = [];
      const importErrors: string[] = [];
      const parentCategories = new Map<string, Partial<Category>>();
      const industriesToCreate = new Map<
        string,
        { industry_code: string; industry_name: string }
      >();

      data.forEach((row, index) => {
        const rowErrors: string[] = [];

        const categoryData: Partial<Category> = {
          ...row,
          breadcrumb: generateBreadcrumb(row as Category),
        };

        if (
          categoryData.category_code === "" ||
          categoryData.category_code === undefined
        ) {
          categoryData.category_code = generateEntityCode(
            "category",
            categoryData.category_code || "",
          );
        }

        const hierarchyErrors = validateCategoryHierarchy(categoryData);
        if (hierarchyErrors.length > 0) {
          rowErrors.push(...hierarchyErrors);
        }

        if (rowErrors.length > 0) {
          importErrors.push(`Row ${index + 2}: ${rowErrors.join(", ")}`);
        } else {
          if (categoryData.industry_name && categoryData.industry_name.trim()) {
            const industryName = categoryData.industry_name.trim();
            const industryCode =
              categoryData.industry_code?.trim() ||
              industryName
                .substring(0, 4)
                .toUpperCase()
                .replace(/[^A-Z]/g, "");

            categoryData.industry_code = industryCode;

            if (!industriesToCreate.has(industryCode)) {
              industriesToCreate.set(industryCode, {
                industry_code: industryCode,
                industry_name: industryName,
              });
            }
          }
          const nonEmptyLevels = [];
          for (let level = 1; level <= 8; level++) {
            const catValue =
              categoryData[`category_${level}` as keyof Category];
            if (catValue && String(catValue).trim()) {
              nonEmptyLevels.push(level);
            }
          }

          for (const level of nonEmptyLevels) {
            const parentData: Partial<Category> = {
              industry_code: categoryData.industry_code,
              industry_name: categoryData.industry_name,
            };

            for (let i = 1; i <= 8; i++) {
              if (i <= level && nonEmptyLevels.includes(i)) {
                parentData[`category_${i}` as keyof Category] = categoryData[
                  `category_${i}` as keyof Category
                ] as any;
              } else {
                parentData[`category_${i}` as keyof Category] = "" as any;
              }
            }

            parentData.product_type =
              level === Math.max(...nonEmptyLevels)
                ? categoryData.product_type
                : "";
            parentData.breadcrumb = generateBreadcrumb(parentData as Category);

            const key = parentData.breadcrumb;
            if (!parentCategories.has(key!)) {
              parentCategories.set(key!, parentData);
            }
          }

          validData.push(categoryData);
        }
      });

      if (importErrors.length > 0) {
        setToast({
          message: `Import failed: ${importErrors.join("; ")}`,
          type: "error",
        });
        return;
      }
      const existingIndustries = await MasterAPI.getIndustries();
      const existingCodes = new Set(
        existingIndustries.map((ind: any) => ind.industry_code),
      );
      if (industriesToCreate.size > 0) {
        const newIndustries = Array.from(industriesToCreate.values()).filter(
          (ind) => !existingCodes.has(ind.industry_code),
        );

        for (const ind of newIndustries) {
          try {
            await MasterAPI.create("industries", ind);
          } catch (error) {
            console.warn(
              `Industry ${ind.industry_code} likely exists, skipping.`,
            );
          }
        }
        loadIndustries();
      }
      const existingCategories = new Set(
        categories.map((cat) => cat.breadcrumb),
      );
      const allCategories = Array.from(parentCategories.values());
      let createdCount = 0;
      let skippedCount = 0;
      for (const cat of allCategories) {
        if (!cat.category_code) {
          cat.category_code = generateEntityCode(
            "category",
            cat.category_1 || cat.industry_name || "",
          );
        }
        if (existingCategories.has(cat.breadcrumb)) {
          console.log(`Skipping breadcrumbs :${cat.breadcrumb}`);
          skippedCount++;
          continue;
        }
        await MasterAPI.create("categories", cat);
        createdCount++;
      }

      setToast({
        message: `${allCategories.length} categories imported (including parent categories)`,
        type: "success",
      });
      loadCategories();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    }

    e.target.value = "";
  };

  const downloadTemplate = () => {
    const template = [
      {
        industry_code: "HVAC",
        industry_name: "HVAC",
        category_1: "Air Conditioning",
        category_2: "Split Systems",
        category_3: "",
        category_4: "",
        category_5: "",
        category_6: "",
        category_7: "",
        category_8: "",
        product_type: "AC Unit",
        breadcrumb: "Air Conditioning > Split Systems",
      },
    ];
    exportToCSV(template, "category_import_template.csv");
  };

  const treeNodes = convertToTreeNodes(buildCategoryTree(filteredCategories));

   return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Build and manage hierarchical product categories
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
              setIsEditing(false);
              resetForm();
              setIsDrawerOpen(true);
            }}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-100 font-bold whitespace-nowrap"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
              
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Industries</option>
                {industries
                  .filter((ind) => ind && ind.industry_code)
                  .map((ind) => (
                    <option key={ind.industry_code} value={ind.industry_code}>
                      {ind.industry_name}
                    </option>
                  ))}
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
              title="Download template"
            >
              <img
                    src={CustomDownloadIcon}
                    className="w-5 h-5 object-contain opacity-70 hover:opacity-100"
                    alt="Template"
                  />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500 italic">
          {searchTerm || industryFilter ? (
            <span>
              Showing <strong>{filteredCategories.length}</strong> matching results out of {categories.length} total categories.
            </span>
          ) : (
            <span>Showing all <strong>{categories.length}</strong> categories</span>
          )}
        </p>

        {(searchTerm || industryFilter) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setIndustryFilter("");
            }}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">Category Tree</h2>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : treeNodes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No categories found.</div>
            ) : (
              <TreeView
                nodes={treeNodes}
                selectedId={selectedCategory?.category_code || null}
                onSelect={handleCategorySelect}
                onDrop={handleDrop}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Category Details</h2>
            <div className="flex gap-2">
              {selectedCategory && (
                <>
                  <button onClick={handleEdit} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-1">
                    <Edit size={16} /> Edit
                  </button>
                  <button onClick={() => setDeleteModal({ isOpen: true, category: selectedCategory })} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold flex items-center gap-1">
                    <Trash2 size={16} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="p-6">
            {selectedCategory ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Code</label>
                  <p className="px-3 py-2 bg-gray-50 border rounded-lg text-sm font-mono">{selectedCategory.category_code}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Hierarchy Path</label>
                  <p className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 font-medium">{selectedCategory.breadcrumb}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Industry</label>
                        <p className="px-3 py-2 bg-gray-50 border rounded-lg text-sm">{selectedCategory.industry_name || "-"}</p>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Product Type</label>
                        <p className="px-3 py-2 bg-gray-50 border rounded-lg text-sm">{selectedCategory.product_type || "-"}</p>
                    </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 italic">Select a category node to view details</div>
            )}
          </div>
        </div>
      </div>

      <Drawer
        isOpen={isDrawerOpen || isEditing}
        onClose={() => {
          setIsDrawerOpen(false);
          setIsEditing(false);
          resetForm();
        }}
        title={isEditing ? "Edit Category" : "Add Category"}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Code</label>
                  <input type="text" value={formData.category_code || ""} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                  <span>Industry <span className="text-red-500">*</span></span>
                  <button type="button" onClick={() => setIsCustomIndustry(!isCustomIndustry)} className="text-xs text-blue-600 font-bold">
                    {isCustomIndustry ? "Select Existing" : "+ Add New"}
                  </button>
                </label>

                {isCustomIndustry ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter new industry..."
                      value={formData.industry_name || ""}
                      onChange={(e) => handleIndustryChange(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                ) : (
                  <SearchableSelect
                    options={industryOptions}
                    value={formData.industry_name || ""}
                    onChange={(val) => handleIndustryChange(val)}
                    placeholder="Search Industry"
                    error={!!errors.industry_code}
                  />
                )}
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (Optional)</label>
                  <select
                    value={parentCategoryCode}
                    onChange={(e) => setParentCategoryCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Root Level</option>
                    {categories.filter(c => c && c.category_code).map((cat) => (
                      <option key={cat.category_code} value={cat.category_code}>{cat.breadcrumb}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
                  <div key={level}>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Category Level {level}</label>
                    <input
                      type="text"
                      value={formData[`category_${level}` as keyof Category] || ""}
                      onChange={(e) => setFormData({ ...formData, [`category_${level}`]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter name for level ${level}...`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                <input
                  type="text"
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                 <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Breadcrumb Preview</label>
                 <p className="text-xs font-medium text-gray-600">{generateBreadcrumb(formData as Category) || "No levels defined yet"}</p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex gap-3">
            <button
              onClick={() => { setIsDrawerOpen(false); setIsEditing(false); resetForm(); }}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors"
            >
              {isEditing ? "Update" : "Add"} Category
            </button>
          </div>
        </div>
      </Drawer>

     
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, category: null })}
        title="Delete Category"
        actions={
          <>
            <button onClick={() => setDeleteModal({ isOpen: false, category: null })} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
          </>
        }
      >
        <p className="text-gray-600">Are you sure you want to delete category <span className="font-bold">{deleteModal.category?.breadcrumb}</span>?</p>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
