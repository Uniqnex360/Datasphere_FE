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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Category Management
          </h1>
          <p className="text-gray-600 mt-1">
            Build and manage hierarchical product categories
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            resetForm();
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search categories..."
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
            {industries &&
              industries
                .filter((industry) => industry && industry.industry_code)
                .map((industry) => (
                  <option
                    key={industry.industry_code}
                    value={industry.industry_code}
                  >
                    {industry.industry_name}
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
              <FolderTree size={20} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500 italic">
          {searchTerm || industryFilter ? (
            <span>
              Showing <strong>{filteredCategories.length}</strong> matching
              results out of {categories.length} total categories.
            </span>
          ) : (
            <span>
              Showing all <strong>{categories.length}</strong> categories.
            </span>
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
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Category Tree
            </h2>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : treeNodes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No categories found. Add your first category to get started.
              </div>
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

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Category Details
            </h2>
            <div className="flex gap-2">
              {selectedCategory && (
                <>
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save size={16} className="inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      setDeleteModal({
                        isOpen: true,
                        category: selectedCategory,
                      })
                    }
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={16} className="inline mr-1" />
                    Delete
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-4">
            {selectedCategory ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Code
                  </label>
                  <input
                    type="text"
                    value={selectedCategory.category_code}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={selectedCategory.industry_name || "-"}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => {
                  const value =
                    selectedCategory[`category_${level}` as keyof Category];
                  if (!value || !String(value).trim()) return null;

                  return (
                    <div key={level}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Level {level}
                      </label>
                      <input
                        type="text"
                        value={String(value)}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  );
                })}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Type
                  </label>
                  <input
                    type="text"
                    value={selectedCategory.product_type || "-"}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breadcrumb
                  </label>
                  <input
                    type="text"
                    value={selectedCategory.breadcrumb}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Select a category from the tree to view details
              </div>
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
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Code
                </label>
                <input
                  type="text"
                  value={formData.category_code || ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated upon creation
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                <span className="flex items-center gap-2">
                  Industry <span className="text-red-500">*</span>
                  {isCustomIndustry && formData.industry_name?.trim() && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
                      New
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomIndustry(!isCustomIndustry);
                    if (isCustomIndustry)
                      setFormData({
                        ...formData,
                        industry_name: "",
                        industry_code: "",
                      });
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {isCustomIndustry ? <X size={12} /> : <Plus size={12} />}
                  {isCustomIndustry ? "Select List" : "Add New"}
                </button>
              </label>

              {isCustomIndustry ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter new industry name..."
                      value={formData.industry_name || ""}
                      onChange={(e) => handleIndustryChange(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && e.currentTarget.blur()
                      }
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.industry_code
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200"
                      title="Confirmed"
                    >
                      <CheckCircle size={20} />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 italic flex items-center gap-1">
                    <AlertCircle size={10} /> This will be added to Master Data
                    on save.
                  </p>
                </div>
              ) : (
                <SearchableSelect
                  options={industryOptions}
                  value={formData.industry_name || ""}
                  onChange={(val) => handleIndustryChange(val)}
                  placeholder="Select or Search Industry"
                  onAddNew={() => setIsCustomIndustry(true)}
                  error={!!errors.industry_code}
                />
              )}

              {errors.industry_code && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.industry_code}
                </p>
              )}
            </div>

            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category (Optional)
                  {parentCategoryCode && (
                    <span className="ml-2 text-xs text-blue-600">
                      (Parent levels auto-filled below)
                    </span>
                  )}
                </label>
                <select
                  value={parentCategoryCode}
                  onChange={(e) => {
                    const newParentCode = e.target.value;
                    setParentCategoryCode(newParentCode);

                    if (newParentCode) {
                      const parent = categories.find(
                        (c) => c.category_code === newParentCode,
                      );
                      if (parent) {
                        const newFormData: Partial<Category> = {
                          category_code: formData.category_code || "",
                          industry_code: parent.industry_code || "",
                          industry_name: parent.industry_name || "",
                          product_type: "",
                          breadcrumb: "",
                        };

                        for (let i = 1; i <= 8; i++) {
                          const levelKey = `category_${i}` as keyof Category;
                          const levelValue = parent[levelKey];
                          if (levelValue && String(levelValue).trim()) {
                            newFormData[levelKey] = levelValue;
                          } else {
                            newFormData[levelKey] = "" as any;
                          }
                        }

                        setFormData(newFormData);
                      }
                    } else {
                      resetForm();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None (Root Level)</option>
                  {categories
                    .filter((cat) => cat && cat.category_code) // ✅ Safety filter
                    .sort((a, b) =>
                      (a.breadcrumb || "").localeCompare(b.breadcrumb || ""),
                    )
                    .map((cat) => (
                      <option key={cat.category_code} value={cat.category_code}>
                        {cat.breadcrumb}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
              <div key={level}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Level {level}
                </label>
                <input
                  type="text"
                  value={formData[`category_${level}` as keyof Category] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [`category_${level}`]: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}

            {errors.category_levels && (
              <p className="text-red-500 text-sm">{errors.category_levels}</p>
            )}
            {errors.hierarchy && (
              <p className="text-red-500 text-sm">{errors.hierarchy}</p>
            )}

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
                Breadcrumb (Auto-generated)
              </label>
              <input
                type="text"
                value={generateBreadcrumb(formData as Category)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>
          </div>


            <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6  shadow-lg flex gap-3">
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                setIsEditing(false);
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
              {isEditing ? "Update" : "Add"} Category
            </button>
        </div>
      </Drawer>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, category: null })}
        title="Delete Category"
        actions={
          <>
            <button
              onClick={() => setDeleteModal({ isOpen: false, category: null })}
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
          Are you sure you want to delete category{" "}
          <span className="font-semibold">
            {deleteModal.category?.breadcrumb}
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
