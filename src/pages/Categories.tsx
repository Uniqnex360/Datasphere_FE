import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  FolderTree,
  Save,
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
  getCategoryLevel,
  findParentCategory,
  updateCategoryHierarchy,
  validateCategoryHierarchy,
} from "../utils/categoryHelper";
import { MasterAPI, ProductAPI } from "../lib/api";

interface Industry {
  code: string;
  name: string;
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({
    isOpen: false,
    category: null,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

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
        (i) => i.code === formData.industry_code,
      );
      if (industry) {
        setFormData((prev) => ({ ...prev, industry_name: industry.name }));
      }
    }
  }, [formData.industry_code, industries]);

  const loadIndustries = async () => {
    try {
      // const { data, error } = await supabase
      //   .from('industry_master')
      //   .select('industry_code, industry_name')
      //   .eq('is_active', true)
      //   .order('industry_name');
      const data = await MasterAPI.getIndustries();
      setIndustries(
        (data || []).map((i) => ({
          code: i.industry_code,
          name: i.industry_name,
        })),
      );
    } catch (error: any) {
      console.error("Error loading industries:", error.message);
    }
  };

  const loadCategories = async () => {
    try {
      // const { data, error } = await supabase
      //   .from('category_master')
      //   .select('*')
      //   .order('breadcrumb', { ascending: true });
      const data = await MasterAPI.getCategories();
      setCategories(data || []);
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = [...categories];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.category_code.toLowerCase().includes(term) ||
          c.breadcrumb.toLowerCase().includes(term) ||
          c.product_type.toLowerCase().includes(term),
      );
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

    if (!formData.industry_code?.trim()) {
      newErrors.industry_code = "Industry is required";
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
      const dataToSubmit: Partial<Category> = {
        ...formData,
        breadcrumb: generateBreadcrumb(formData as Category),
      };

      if (isEditing && selectedCategory) {
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
            const parentLevel = getCategoryLevel(parent);
            const categoryName = formData.category_1 || "";
            const updates = updateCategoryHierarchy(
              formData as Category,
              parent,
              categoryName,
            );
            Object.assign(dataToSubmit, updates);
          }
        }

        await MasterAPI.create("categories", dataToSubmit);

        setToast({ message: "Category added successfully", type: "success" });
      }

      setIsDrawerOpen(false);
      setIsEditing(false);
      resetForm();
      loadCategories();
    } catch (error: any) {
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
          delete categoryData.category_code;
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

          for (let level = 1; level <= 8; level++) {
            const catValue =
              categoryData[`category_${level}` as keyof Category];
            if (!catValue || !String(catValue).trim()) break;

            const parentData: Partial<Category> = {
              industry_code: categoryData.industry_code,
              industry_name: categoryData.industry_name,
            };

            for (let i = 1; i <= level; i++) {
              parentData[`category_${i}` as keyof Category] = categoryData[
                `category_${i}` as keyof Category
              ] as any;
            }

            for (let i = level + 1; i <= 8; i++) {
              parentData[`category_${i}` as keyof Category] = "" as any;
            }

            parentData.product_type =
              level === getCategoryLevel(categoryData as Category)
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

      if (industriesToCreate.size > 0) {
        const newIndustries = Array.from(industriesToCreate.values()).map(
          (ind) => ({
            industry_code: ind.industry_code,
            industry_name: ind.industry_name,
            description: ind.industry_name,
            is_active: true,
          }),
        );

        for (const ind of newIndustries) {
          await MasterAPI.create("industries", ind);
        }
        loadIndustries();
      }

      const allCategories = Array.from(parentCategories.values());
      for (const cat of allCategories) {
        await MasterAPI.create("categories", cat);
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
            {industries.map((industry) => (
              <option key={industry.code} value={industry.code}>
                {industry.name}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.industry_code}
                onChange={(e) =>
                  setFormData({ ...formData, industry_code: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry.code} value={industry.code}>
                    {industry.name}
                  </option>
                ))}
              </select>
              {errors.industry_code && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.industry_code}
                </p>
              )}
            </div>

            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={parentCategoryCode}
                  onChange={(e) => setParentCategoryCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None (Root Level)</option>
                  {categories.map((cat) => (
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

          <div className="flex gap-3 pt-4 border-t">
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
