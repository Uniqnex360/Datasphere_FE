import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  Sliders,
  X,
} from "lucide-react";
import { Attribute, AttributeValue } from "../types/attribute";
import { Category } from "../types/category";
import { Industry } from "../types/industry";
import Drawer from "../components/Drawer";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import DataTable from "../components/DataTable";
import { exportToCSV, parseCSV } from "../utils/csvHelper";
import { MasterAPI } from "../lib/api";
const findDuplicateAttribute = (
  allAttributes: Attribute[],
  attributeName: string,
  industryName: string,
  excludeCode?: string
): Attribute | null => {
  return allAttributes.find(attr => 
    attr.attribute_name.trim().toLowerCase() === attributeName.trim().toLowerCase() &&
    attr.industry_name.trim().toLowerCase() === industryName.trim().toLowerCase() &&
    attr.attribute_code !== excludeCode
  ) || null;
};

const generateAttributeCode = (allAttributes: Attribute[]): string => {
  if (!allAttributes || allAttributes.length === 0) return 'ATTR-000001';

  // Sort descending by code to find the highest current number
  const sorted = [...allAttributes]
    .filter(a => a.attribute_code && a.attribute_code.startsWith('ATTR-'))
    .sort((a, b) => b.attribute_code.localeCompare(a.attribute_code));

  if (sorted.length === 0) return 'ATTR-000001';

  const lastCode = sorted[0].attribute_code;
  const match = lastCode.match(/ATTR-(\d+)/);
  
  if (!match) return 'ATTR-000001';

  const lastNumber = parseInt(match[1], 10);
  const nextNumber = lastNumber + 1;
  return `ATTR-${String(nextNumber).padStart(6, '0')}`;
};
const mergeAttributeValues = (
  existing: Attribute,
  newValues: AttributeValue[],
): { values: AttributeValue[]; usageCount: number } => {
  const existingValues: AttributeValue[] = [];

  // Extract existing values
  for (let i = 1; i <= 50; i++) {
    const value = existing[`attribute_value_${i}` as keyof Attribute];
    const uom = existing[`attribute_uom_${i}` as keyof Attribute];
    if (value && String(value).trim()) {
      existingValues.push({
        value: String(value),
        uom: String(uom || ""),
      });
    }
  }

  // Merge unique values
  const merged = [...existingValues];
  let addedCount = 0;

  newValues.forEach((newVal) => {
    if (newVal.value.trim()) {
      const isDuplicate = merged.some(
        (existing) =>
          existing.value.toLowerCase().trim() ===
            newVal.value.toLowerCase().trim() &&
          existing.uom.toLowerCase().trim() === newVal.uom.toLowerCase().trim(),
      );
      if (!isDuplicate && merged.length < 50) {
        merged.push(newVal);
        addedCount++;
      }
    }
  });

  // Pad to 50 values
  while (merged.length < 50) {
    merged.push({ value: "", uom: "" });
  }

  // Increment usage count
  const currentCount = existing.usage_count || 0;
  const newUsageCount = currentCount + 1;

  return {
    values: merged.slice(0, 50),
    usageCount: newUsageCount,
  };
};

export function Attributes() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [filteredAttributes, setFilteredAttributes] = useState<Attribute[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(
    null,
  );
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    attribute: Attribute | null;
  }>({ isOpen: false, attribute: null });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [attributeTypeFilter, setAttributeTypeFilter] = useState("");
  const [dataTypeFilter, setDataTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState("attribute_code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [formData, setFormData] = useState<Partial<Attribute>>({
    attribute_name: "",
    industry_name: "",
    industry_attribute_name: "",
    description: "",
    applicable_categories: "",
    attribute_type: "",
    data_type: "",
    unit: "",
    filter: "No",
    filter_display_name: "",
  });

  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>(
    Array.from({ length: 50 }, () => ({ value: "", uom: "" })),
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Check if attribute already exists (by name + industry)

  // Merge values and increment usage count

  useEffect(() => {
    loadAttributes();
    loadCategories();
    loadIndustries();
  }, []);

  useEffect(() => {
    filterAndSortAttributes();
  }, [
    attributes,
    searchTerm,
    industryFilter,
    attributeTypeFilter,
    dataTypeFilter,
    sortKey,
    sortDirection,
  ]);

  const loadAttributes = async () => {
    try {
      const data = await MasterAPI.getAttributes();
      setAttributes(data || []);
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await MasterAPI.getCategories();
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error loading categories:", error);
    }
  };

  const loadIndustries = async () => {
    try {
      const data = await MasterAPI.getIndustries();
      setIndustries(data || []);
    } catch (error: any) {
      console.error("Error loading industries:", error);
    }
  };

  const filterAndSortAttributes = () => {
    let filtered = [...attributes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.attribute_code.toLowerCase().includes(term) ||
          a.attribute_name.toLowerCase().includes(term),
      );
    }

    if (industryFilter) {
      filtered = filtered.filter((a) => a.industry_name === industryFilter);
    }

    if (attributeTypeFilter) {
      filtered = filtered.filter(
        (a) => a.attribute_type === attributeTypeFilter,
      );
    }

    if (dataTypeFilter) {
      filtered = filtered.filter((a) => a.data_type === dataTypeFilter);
    }

    filtered.sort((a, b) => {
      const aVal = a[sortKey as keyof Attribute] || "";
      const bVal = b[sortKey as keyof Attribute] || "";
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredAttributes(filtered);
  };

  const getValueCount = (attribute: Attribute): number => {
    let count = 0;
    for (let i = 1; i <= 50; i++) {
      const value = attribute[`attribute_value_${i}` as keyof Attribute];
      if (value && String(value).trim()) {
        count++;
      }
    }
    return count;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.attribute_name?.trim()) {
      newErrors.attribute_name = "Attribute name is required";
    }

    if (
      (formData.attribute_type === "Multi-select" ||
        formData.data_type === "list") &&
      !attributeValues.some((v) => v.value.trim())
    ) {
      newErrors.values =
        "At least one value is required for Multi-select or list type";
    }

    if (formData.filter === "Yes" && !formData.filter_display_name?.trim()) {
      newErrors.filter_display_name =
        "Filter display name is required when filter is enabled";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

   const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const dataToSubmit: any = {
        ...formData,
        applicable_categories: selectedCategories.join(","),
      };

      attributeValues.forEach((item, index) => {
        dataToSubmit[`attribute_value_${index + 1}`] = item.value;
        dataToSubmit[`attribute_uom_${index + 1}`] = item.uom;
      });

      if (editingAttribute) {
        await MasterAPI.update(
          "attributes",
          editingAttribute.attribute_code,
          dataToSubmit,
        );
        setToast({
          message: "Attribute updated successfully",
          type: "success",
        });
      } else {
        // Use helper with local state
        const duplicate = findDuplicateAttribute(
          attributes,
          formData.attribute_name || "",
          formData.industry_name || "",
        );

        if (duplicate) {
          const { values: mergedValues, usageCount } = mergeAttributeValues(
            duplicate,
            attributeValues,
          );

          const updateData: any = {
            ...duplicate,
            ...dataToSubmit,
            usage_count: usageCount,
          };
          delete updateData.attribute_code; 
          
          mergedValues.forEach((item, index) => {
            updateData[`attribute_value_${index + 1}`] = item.value;
            updateData[`attribute_uom_${index + 1}`] = item.uom;
          });

          await MasterAPI.update("attributes", duplicate.attribute_code, updateData);

          setToast({
            message: `Values merged with existing attribute (Usage: ${usageCount})`,
            type: "success",
          });
        } else {
          const attributeCode = generateAttributeCode(attributes);
          dataToSubmit.attribute_code = attributeCode;
          dataToSubmit.usage_count = 1;

          await MasterAPI.create("attributes", dataToSubmit);
          
          setToast({
            message: `Attribute ${attributeCode} added successfully`,
            type: "success",
          });
        }
      }

      setIsDrawerOpen(false);
      setEditingAttribute(null);
      resetForm();
      loadAttributes();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    }
  };

  const handleEdit = (attribute: Attribute) => {
    setEditingAttribute(attribute);
    setFormData(attribute);

    const categories = attribute.applicable_categories
      ? attribute.applicable_categories.split(",").filter((c) => c.trim())
      : [];
    setSelectedCategories(categories);

    const values: AttributeValue[] = [];
    for (let i = 1; i <= 50; i++) {
      const value = attribute[`attribute_value_${i}` as keyof Attribute] || "";
      const uom = attribute[`attribute_uom_${i}` as keyof Attribute] || "";
      values.push({ value: String(value), uom: String(uom) });
    }
    setAttributeValues(values);

    setErrors({});
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.attribute) return;

    try {
      await MasterAPI.delete("attributes", deleteModal.attribute.attribute_code);

      setToast({ message: "Attribute deleted successfully", type: "success" });
      setDeleteModal({ isOpen: false, attribute: null });
      loadAttributes();
    } catch (error: any) {
      setToast({ message: "Delete failed", type: "error" });
    }
  };

  const resetForm = () => {
    setFormData({
      attribute_code: "",
      attribute_name: "",
      industry_name: "",
      industry_attribute_name: "",
      description: "",
      applicable_categories: "",
      attribute_type: "",
      data_type: "",
      unit: "",
      filter: "No",
      filter_display_name: "",
    });
    setAttributeValues(
      Array.from({ length: 50 }, () => ({ value: "", uom: "" })),
    );
    setSelectedCategories([]);
    setErrors({});
  };

  const handleExport = () => {
    if (filteredAttributes.length === 0) {
      setToast({ message: "No data to export", type: "error" });
      return;
    }
    exportToCSV(filteredAttributes, "attributes.csv");
    setToast({ message: "Attributes exported successfully", type: "success" });
  };

 const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await parseCSV(file);
      let added = 0;
      let merged = 0;
      let errors = 0;

      // 1. Get initial code state from current list
      let nextCodeNumber = 1;
      const codes = attributes
        .map(a => a.attribute_code)
        .filter(c => c && c.startsWith("ATTR-"))
        .sort((a, b) => b.localeCompare(a));
      
      if (codes.length > 0) {
        const match = codes[0].match(/ATTR-(\d+)/);
        if (match) nextCodeNumber = parseInt(match[1], 10) + 1;
      }

      // Clone attributes to track updates within the loop
      const currentAttributes = [...attributes];

      for (const row of data) {
        if (!row.attribute_name?.trim()) {
          errors++;
          continue;
        }

        const attributeData: any = {};
        // Map row to data object
        Object.keys(row).forEach(k => attributeData[k] = row[k]);

        // Clean empty values 1-50
        for (let i = 1; i <= 50; i++) {
          if (!attributeData[`attribute_value_${i}`]) attributeData[`attribute_value_${i}`] = "";
          if (!attributeData[`attribute_uom_${i}`]) attributeData[`attribute_uom_${i}`] = "";
        }

        const duplicate = findDuplicateAttribute(
          currentAttributes,
          row.attribute_name,
          row.industry_name || "",
        );

        if (duplicate) {
          // Merge Logic
          const newValues: AttributeValue[] = [];
          for (let i = 1; i <= 50; i++) {
            if (attributeData[`attribute_value_${i}`]) {
                newValues.push({
                    value: attributeData[`attribute_value_${i}`],
                    uom: attributeData[`attribute_uom_${i}`] || ""
                });
            }
          }

          const { values: mergedValues, usageCount } = mergeAttributeValues(
            duplicate,
            newValues,
          );

          const updateData: any = {
            ...duplicate,
            ...attributeData,
            usage_count: usageCount,
          };
          delete updateData.attribute_code;

          mergedValues.forEach((item, idx) => {
            updateData[`attribute_value_${idx + 1}`] = item.value;
            updateData[`attribute_uom_${idx + 1}`] = item.uom;
          });

          await MasterAPI.update("attributes", duplicate.attribute_code, updateData);
          merged++;
        } else {
          // Create Logic
          const attributeCode = `ATTR-${String(nextCodeNumber).padStart(6, "0")}`;
          attributeData.attribute_code = attributeCode;
          attributeData.usage_count = 1;

          await MasterAPI.create("attributes", attributeData);
          
          // Update trackers
          nextCodeNumber++;
          currentAttributes.push(attributeData);
          added++;
        }
      }

      setToast({
        message: `Import: ${added} added, ${merged} merged`,
        type: "success",
      });

      loadAttributes();
    } catch (error: any) {
      setToast({ message: `Import error: ${error.message}`, type: "error" });
    } finally {
        setLoading(false);
        e.target.value = "";
    }
  };
  const downloadTemplate = () => {
    const template: any = {
      attribute_name: "Example Attribute",
      industry_name: "HVAC",
      industry_attribute_name: "",
      description: "Sample description",
      applicable_categories: "CAT001,CAT002",
      attribute_type: "Multi-select",
      data_type: "list",
      unit: "",
      filter: "Yes",
      filter_display_name: "Example Filter",
    };

    for (let i = 1; i <= 50; i++) {
      template[`attribute_value_${i}`] = i === 1 ? "Value 1" : "";
      template[`attribute_uom_${i}`] = i === 1 ? "UOM 1" : "";
    }

    exportToCSV([template], "attribute_import_template.csv");
  };

  const toggleCategory = (categoryCode: string) => {
    if (selectedCategories.includes(categoryCode)) {
      setSelectedCategories(
        selectedCategories.filter((c) => c !== categoryCode),
      );
    } else {
      setSelectedCategories([...selectedCategories, categoryCode]);
    }
  };

  const addMoreValues = () => {
    const firstEmptyIndex = attributeValues.findIndex((v) => !v.value.trim());
    if (firstEmptyIndex !== -1 && firstEmptyIndex < 45) {
      return;
    }
  };

  const clearAllValues = () => {
    setAttributeValues(
      Array.from({ length: 50 }, () => ({ value: "", uom: "" })),
    );
  };

  const updateValue = (
    index: number,
    field: "value" | "uom",
    newValue: string,
  ) => {
    const updated = [...attributeValues];
    updated[index][field] = newValue;
    setAttributeValues(updated);
  };

  const showValueMatrix =
    formData.attribute_type === "Multi-select" || formData.data_type === "list";

  const columns = [
    { key: "attribute_code", label: "Code", sortable: true },
    { key: "attribute_name", label: "Name", sortable: true },
    { key: "industry_name", label: "Industry", sortable: true },
    { key: "attribute_type", label: "Attr Type", sortable: true },
    { key: "data_type", label: "Data Type", sortable: true },
    {
      key: "value_count",
      label: "# Values",
      sortable: false,
      render: (_: any, row: Attribute) => getValueCount(row),
    },
    {
      key: "usage_count",
      label: "Used",
      sortable: true,
      render: (value: number) => (
        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
          {value || 1}×
        </span>
      ),
    },
    {
      key: "filter",
      label: "Filter",
      sortable: false,
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value === "Yes"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_: any, row: Attribute) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => setDeleteModal({ isOpen: true, attribute: row })}
            className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Attributes Master
          </h1>
          <p className="text-gray-600 mt-1">
            Define and manage product attributes
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAttribute(null);
            resetForm();
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Attribute
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search code or name..."
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
            value={attributeTypeFilter}
            onChange={(e) => setAttributeTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Attribute Types</option>
            <option value="Multi-select">Multi-select</option>
            <option value="Single-select">Single-select</option>
          </select>
          <select
            value={dataTypeFilter}
            onChange={(e) => setDataTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Data Types</option>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="decimal">Decimal</option>
            <option value="boolean">Boolean</option>
            <option value="list">List</option>
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
              <Sliders size={20} />
            </button>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredAttributes}
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
          setEditingAttribute(null);
          resetForm();
        }}
        title={editingAttribute ? "Edit Attribute" : "Add Attribute"}
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              Attribute Definition
            </h3>
            {editingAttribute && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attribute Code
                </label>
                <input
                  type="text"
                  value={formData.attribute_code || ""}
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
                Attribute Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.attribute_name}
                onChange={(e) =>
                  setFormData({ ...formData, attribute_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.attribute_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.attribute_name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <select
                value={formData.industry_name}
                onChange={(e) =>
                  setFormData({ ...formData, industry_name: e.target.value })
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
                Industry Attribute Name
              </label>
              <input
                type="text"
                value={formData.industry_attribute_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    industry_attribute_name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              Applicability & Type
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable Categories
              </label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No categories available
                  </p>
                ) : (
                  categories.map((cat) => (
                    <label
                      key={cat.category_code}
                      className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.category_code)}
                        onChange={() => toggleCategory(cat.category_code)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {cat.breadcrumb}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {selectedCategories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCategories.map((code) => {
                    const cat = categories.find(
                      (c) => c.category_code === code,
                    );
                    return (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {cat?.breadcrumb || code}
                        <button
                          onClick={() => toggleCategory(code)}
                          className="hover:text-blue-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attribute Type
              </label>
              <select
                value={formData.attribute_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attribute_type: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select type</option>
                <option value="Multi-select">Multi-select</option>
                <option value="Single-select">Single-select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Type
              </label>
              <select
                value={formData.data_type}
                onChange={(e) =>
                  setFormData({ ...formData, data_type: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select data type</option>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="decimal">Decimal</option>
                <option value="boolean">Boolean</option>
                <option value="list">List</option>
              </select>
            </div>
            {(formData.data_type === "number" ||
              formData.data_type === "decimal") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., kg, cm, lbs"
                />
              </div>
            )}
          </div>

          {showValueMatrix && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Attribute Value Matrix
                </h3>
                <button
                  onClick={clearAllValues}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              </div>
              {errors.values && (
                <p className="text-red-500 text-sm">{errors.values}</p>
              )}
              <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        #
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Value
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        UOM
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attributeValues.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) =>
                              updateValue(index, "value", e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.uom}
                            onChange={(e) =>
                              updateValue(index, "uom", e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Filter Controls</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter
              </label>
              <select
                value={formData.filter}
                onChange={(e) =>
                  setFormData({ ...formData, filter: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            {formData.filter === "Yes" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.filter_display_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      filter_display_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.filter_display_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.filter_display_name}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                setEditingAttribute(null);
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
              {editingAttribute ? "Update" : "Add"} Attribute
            </button>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, attribute: null })}
        title="Delete Attribute"
        actions={
          <>
            <button
              onClick={() => setDeleteModal({ isOpen: false, attribute: null })}
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
          Are you sure you want to delete attribute{" "}
          <span className="font-semibold">
            {deleteModal.attribute?.attribute_name}
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
