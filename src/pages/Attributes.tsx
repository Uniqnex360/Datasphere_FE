import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  X,
  CheckCircle,
  ChevronDown,
  Filter,
} from "lucide-react";

import { Attribute, AttributeValue } from "../types/attribute";
import CustomDownloadIcon from "../assets/download-custom.png";
import { Category } from "../types/category";
import Drawer from "../components/Drawer";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import DataTable from "../components/DataTable";
import { MasterAPI } from "../lib/api";
import { validateImportFormat } from "../utils/importValidator";
import { exportToExcel } from "../utils/ExcelHelper";
import { FilterSelect } from "../components/Filter";
import { parseCSV } from "../utils/csvHelper";

const findDuplicateAttribute = (
  allAttributes: Attribute[],
  attributeName: string,
  excludeCode?: string,
): Attribute | null => {
  return (
    allAttributes.find(
      (attr) =>
        attr.attribute_name.trim().toLowerCase() ===
          attributeName.trim().toLowerCase() &&
        attr.attribute_code !== excludeCode,
    ) || null
  );
};

// const generateAttributeCode = (allAttributes: Attribute[]): string => {
//   if (!allAttributes || allAttributes.length === 0) return "ATTR-000001";

//   const sorted = [...allAttributes]
//     .filter((a) => a.attribute_code && a.attribute_code.startsWith("ATTR-"))
//     .sort((a, b) => b.attribute_code.localeCompare(a.attribute_code));

//   if (sorted.length === 0) return "ATTR-000001";

//   const lastCode = sorted[0].attribute_code;
//   const match = lastCode.match(/ATTR-(\d+)/);

//   if (!match) return "ATTR-000001";

//   const lastNumber = parseInt(match[1], 10);
//   const nextNumber = lastNumber + 1;
//   return `ATTR-${String(nextNumber).padStart(6, "0")}`;
// };

const mergeAttributeValues = (
  existing: Attribute,
  newValues: AttributeValue[],
): { values: AttributeValue[]; usageCount: number } => {
  const existingValues: AttributeValue[] = [];

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

  while (merged.length < 50) {
    merged.push({ value: "", uom: "" });
  }

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
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
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
  const [tablefilteredAttributes, settablefilteredAttributes] = useState<
    Attribute[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [attributeTypeFilter, setAttributeTypeFilter] = useState("");
  const [dataTypeFilter, setDataTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState("attribute_code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<Attribute>>({
    attribute_name: "",
    description: "",
    applicable_categories: "",
    attribute_type: "",
    data_type: "",
    unit: "",
    filter: "No",
    filter_display_name: "",
    variants:false,
  });

  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>(
    Array.from({ length: 50 }, () => ({ value: "", uom: "" })),
  );
  const [showBulkCategoryDropdown, setShowBulkCategoryDropdown] =
    useState(false);
  const [bulkSelectedCategories, setBulkSelectedCategories] = useState<
    string[]
  >([]);
  const bulkCategoryRef = useRef<HTMLDivElement>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const getAppliedAttributesForCategory = (categoryCode: string): string[] => {
    const appliedNames: string[] = [];
    selectedCodes.forEach((code) => {
      const attr = attributes.find((a) => a.attribute_code === code);
      if (attr && attr.applicable_categories) {
        const cats = attr.applicable_categories.split(",").map((c) => c.trim());
        if (cats.includes(categoryCode)) {
          appliedNames.push(attr.attribute_name);
        }
      }
    });
    return appliedNames;
  };
  const availableCategories = categories.filter((cat) => {
    if (selectedCodes.size === 0) return true;
    const appliedAttributes = getAppliedAttributesForCategory(
      cat.category_code,
    );

    return appliedAttributes.length < selectedCodes.size;
  });

  useEffect(() => {
    loadAttributes();
    loadCategories();
  }, []);

  useEffect(() => {
    filterAndSortAttributes();
  }, [
    attributes,
    searchTerm,
    industryFilter,
    attributeTypeFilter,
    dataTypeFilter,
    categoryFilter,
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
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        bulkCategoryRef.current &&
        !bulkCategoryRef.current.contains(event.target as Node)
      ) {
        setShowBulkCategoryDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleBulkCategoryApply = async () => {
    const codes = Array.from(selectedCodes);
    const updates: Promise<any>[] = [];
    let alreadyUpdatedCount = 0;

    if (bulkSelectedCategories.length === 0) {
      setToast({
        message: "Please select at least one category to apply",
        type: "error",
      });
      return;
    }

    codes.forEach((code) => {
      const attr = attributes.find((a) => a.attribute_code === code);
      if (attr) {
        const currentCats = attr.applicable_categories
          ? attr.applicable_categories.split(",").filter((c) => c.trim())
          : [];

        const mergedSet = new Set([...currentCats, ...bulkSelectedCategories]);
        const finalCatsArray = Array.from(mergedSet);

        const currentCatsStr = currentCats.sort().join(",");
        const finalCatsStr = finalCatsArray.sort().join(",");

        if (currentCatsStr !== finalCatsStr) {
          updates.push(
            MasterAPI.update("attributes", code, {
              applicable_categories: finalCatsArray.join(","),
            }),
          );
        } else {
          alreadyUpdatedCount++;
        }
      }
    });

    if (updates.length === 0) {
      setToast({
        message: "No changes needed. Categories are already applied.",
        type: "success",
      });
      setShowBulkCategoryDropdown(false);
      setSelectedCodes(new Set());
      setBulkSelectedCategories([]);
      return;
    }

    try {
      setLoading(true);
      await Promise.all(updates);
      let msg = `Successfully updated ${updates.length} attribute${updates.length > 1 ? "s" : ""}.`;
      if (alreadyUpdatedCount > 0) {
        msg += ` (${alreadyUpdatedCount} ignored as they already had the category).`;
      }
      setToast({ message: msg, type: "success" });
      setSelectedCodes(new Set());
      setShowBulkCategoryDropdown(false);
      setBulkSelectedCategories([]);
      loadAttributes();
    } catch (error) {
      setToast({ message: "Bulk category update failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  const loadCategories = async () => {
    try {
      const data = await MasterAPI.getCategories();
      setCategories(data || []);
      const breadcrumbs = (data || []).map((item: any) => {
        return `${item.breadcrumb}`;
      });
      setCategoryOptions(breadcrumbs || []);
    } catch (error: any) {
      console.error("Error loading categories:", error);
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

    if (attributeTypeFilter) {
      filtered = filtered.filter(
        (a) => a.attribute_type === attributeTypeFilter,
      );
    }

    if (dataTypeFilter) {
      filtered = filtered.filter((a) => a.data_type === dataTypeFilter);
    }
     if (categoryFilter) {
      const targetCategory = categories.find((c) => c.breadcrumb === categoryFilter);
      
      if (targetCategory) {
        filtered = filtered.filter((a) => {
          if (!a.applicable_categories) return false;
          const appliedCats = a.applicable_categories.split(",").map((c) => c.trim());
          return appliedCats.includes(targetCategory.category_code);
        });
      }
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
    settablefilteredAttributes(filtered);
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

  const getEndCategory = (attribute: Attribute): string => {
    if (!attribute?.category_path) return "";

    const parts = attribute.category_path.split(">");
    return parts[parts.length - 1].trim();
  };

  const toggleSelect = (code: string) => {
    const newSet = new Set(selectedCodes);
    if (newSet.has(code)) newSet.delete(code);
    else newSet.add(code);
    setSelectedCodes(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedCodes.size === tablefilteredAttributes.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(
        new Set(tablefilteredAttributes.map((v) => v.attribute_code)),
      );
    }
  };

  const handleBulkStatusChange = async (active: boolean) => {
    const codes = Array.from(selectedCodes);
    try {
      setLoading(true);
      await Promise.all(
        codes.map((code) =>
          MasterAPI.update("attributes", code, { is_active: active }),
        ),
      );
      setToast({
        message: `Successfully updated ${codes.length} attributes`,
        type: "success",
      });
      setSelectedCodes(new Set());
    } catch (error) {
      setToast({ message: "Bulk update failed", type: "error" });
    } finally {
      setLoading(false);
    }
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
      console.log("final", selectedCategories, selectedCategories.join(","))
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
        const duplicate = findDuplicateAttribute(
          attributes,
          formData.attribute_name || "",
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
          console.log("update data", updateData)
          await MasterAPI.update(
            "attributes",
            duplicate.attribute_code,
            updateData,
          );

          setToast({
            message: `Values merged with existing attribute (Usage: ${usageCount})`,
            type: "success",
          });
        } else {
          // const attributeCode = generateAttributeCode(attributes);
          // dataToSubmit.attribute_code = attributeCode;
          dataToSubmit.usage_count = 1;
          await MasterAPI.create("attributes", dataToSubmit);

          setToast({
            message: `Attribute added successfully`,
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
      await MasterAPI.delete(
        "attributes",
        deleteModal.attribute.attribute_code,
      );

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
      description: "",
      applicable_categories: "",
      attribute_type: "",
      data_type: "",
      unit: "",
      filter: "No",
      filter_display_name: "",
      variants: false, 
    });
    setAttributeValues(
      Array.from({ length: 50 }, () => ({ value: "", uom: "" })),
    );
    setSelectedCategories([]);
    setErrors({});
  };

  const handleExport = () => {
    const export_data = filteredAttributes.filter((obj) =>
      selectedCodes.has(obj.attribute_code),
    );
    if (export_data.length === 0) {
      setToast({ message: "No data to export", type: "error" });
      return;
    }

    const exportColumns = [
      { header: "Category Name", key: "category_list_string" },
      { header: "Attribute Name", key: "attribute_name" },
      { header: "Attribute Type", key: "attribute_type" },
      { header: "Data Type", key: "data_type" },
      { header: "Unit", key: "unit" },
      { header: "Description", key: "description" },
      { header: "Filter", key: "filter" },
      { header: "Filter Display Name", key: "filter_display_name" },
    ];

    for (let attr = 1; attr <= 50; attr++) {
      exportColumns.push({
        header: `attribute_value_${attr.toString()}`,
        key: `attribute_value_${attr.toString()}`,
      });
      exportColumns.push({
        header: `attribute_uom_${attr.toString()}`,
        key: `attribute_uom_${attr.toString()}`,
      });
    }

    exportToExcel({
      data: export_data,
      fileName: "attributes.xlsx",
      columns: exportColumns,
      dropdowns: {
        category_path: categoryOptions,
        data_type: ["Text", "Number", "Decimal", "Boolean", "List"],
        filter: ["Yes", "No"],
        attribute_type: ["Multi-select", "Single-select"],
      },
    });
    setToast({ message: "Attributes exported successfully", type: "success" });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await parseCSV(file);

      if (data.length > 0) {
        console.log("CSV Column Names:", Object.keys(data[0]));
        console.log("First Row Sample:", data[0]);
      }

      const requiredColumns = ["attribute_name"];
      const validation = validateImportFormat(data, requiredColumns);
      if (!validation.isValid) {
        setToast({
          message: validation.errorMessage || "Import failed!",
          type: "error",
        });
        e.target.value = "";
        return;
      }

      let added = 0;
      let merged = 0;
      let errors = 0;
      let totalNewValues = 0;
      let totalIgnoredValues = 0;
      const importDetails: string[] = [];

      // let nextCodeNumber = 1;
      // const codes = attributes
      //   .map((a) => a.attribute_code)
      //   .filter((c) => c && c.startsWith("ATTR-"))
      //   .sort((a, b) => b.localeCompare(a));

      // if (codes.length > 0) {
      //   const match = codes[0].match(/ATTR-(\d+)/);
      //   if (match) nextCodeNumber = parseInt(match[1], 10) + 1;
      // }

      const currentAttributes = [...attributes];

      for (const row of data) {
        if (!row.attribute_name?.trim()) {
          errors++;
          continue;
        }

        try {
          const attributeData: any = {};
          attributeData.attribute_name = row.attribute_name;
          attributeData.description = row.description || "";
          attributeData.applicable_categories = row.applicable_categories || "";
          attributeData.attribute_type = row.attribute_type || "";
          attributeData.data_type = row.data_type || "";
          attributeData.unit = row.unit || "";
          attributeData.filter = row.filter || "No";
          attributeData.filter_display_name = row.filter_display_name || "";

          const newValues: AttributeValue[] = [];
          for (let i = 1; i <= 50; i++) {
            const val = row[`attribute_value_${i}`] || "";
            const uom = row[`attribute_uom_${i}`] || "";

            if (val && String(val).trim()) {
              newValues.push({
                value: String(val).trim(),
                uom: String(uom || "").trim(),
              });
            }

            attributeData[`attribute_value_${i}`] = val
              ? String(val).trim()
              : "";
            attributeData[`attribute_uom_${i}`] = uom ? String(uom).trim() : "";
          }

          const duplicate = findDuplicateAttribute(
            currentAttributes,
            row.attribute_name,
          );

          if (duplicate) {
            console.log(
              `Merging values for existing attribute: ${duplicate.attribute_name}`,
            );

            const existingValues: AttributeValue[] = [];
            for (let i = 1; i <= 50; i++) {
              const value =
                duplicate[`attribute_value_${i}` as keyof Attribute];
              const uom = duplicate[`attribute_uom_${i}` as keyof Attribute];
              if (value && String(value).trim()) {
                existingValues.push({
                  value: String(value).trim(),
                  uom: String(uom || "").trim(),
                });
              }
            }

            const mergedValues = [...existingValues];
            let newValuesAdded = 0;
            let ignoredValuesCount = 0;

            newValues.forEach((newVal) => {
              if (newVal.value.trim()) {
                const isDuplicate = existingValues.some(
                  (existing) =>
                    existing.value.toLowerCase().trim() ===
                      newVal.value.toLowerCase().trim() &&
                    existing.uom.toLowerCase().trim() ===
                      newVal.uom.toLowerCase().trim(),
                );

                if (!isDuplicate && mergedValues.length < 50) {
                  mergedValues.push(newVal);
                  newValuesAdded++;
                } else if (isDuplicate) {
                  ignoredValuesCount++;
                }
              }
            });

            while (mergedValues.length < 50) {
              mergedValues.push({ value: "", uom: "" });
            }

            const updateData: any = {
              ...duplicate,
              ...attributeData,
              usage_count: (duplicate.usage_count || 1) + 1,
            };
            delete updateData.attribute_code;

            mergedValues.forEach((item, idx) => {
              updateData[`attribute_value_${idx + 1}`] = item.value;
              updateData[`attribute_uom_${idx + 1}`] = item.uom;
            });

            await MasterAPI.update(
              "attributes",
              duplicate.attribute_code,
              updateData,
            );

            merged++;
            totalNewValues += newValuesAdded;
            totalIgnoredValues += ignoredValuesCount;

            if (newValuesAdded > 0 || ignoredValuesCount > 0) {
              importDetails.push(
                `${duplicate.attribute_name}: +${newValuesAdded} values, ${ignoredValuesCount} ignored`,
              );
            }

            const index = currentAttributes.findIndex(
              (attr) => attr.attribute_code === duplicate.attribute_code,
            );
            if (index !== -1) {
              currentAttributes[index] = {
                ...updateData,
                attribute_code: duplicate.attribute_code,
              };
            }
          } else {
            console.log(
              `Creating new attribute: ${attributeData.attribute_name}`,
            );

            // const attributeCode = `ATTR-${String(nextCodeNumber).padStart(6, "0")}`;
            // attributeData.attribute_code = attributeCode;
            attributeData.usage_count = 1;

            const createdAttr = await MasterAPI.create(
              "attributes",
              attributeData,
            );

            currentAttributes.push(createdAttr);

            added++;

            const valueCount = newValues.filter((v) => v.value.trim()).length;
            if (valueCount > 0) {
              importDetails.push(
                `${attributeData.attribute_name}: new attribute with ${valueCount} values`,
              );
            }
          }
        } catch (error: any) {
          console.error(
            `Error processing row for ${row.attribute_name}:`,
            error,
          );
          errors++;
          importDetails.push(`${row.attribute_name}: ERROR - ${error.message}`);
        }
      }

      let message = "";
      if (errors === 0) {
        if (added > 0 && merged > 0) {
          message = ` Import completed! ${added} new attributes added, ${merged} existing attributes updated with ${totalNewValues} new values (${totalIgnoredValues} duplicate values ignored)`;
        } else if (added > 0) {
          message = ` Import successful! ${added} new attributes added`;
        } else if (merged > 0) {
          message = ` Import completed! ${merged} attributes updated with ${totalNewValues} new values (${totalIgnoredValues} duplicate values ignored)`;
        } else {
          message = `ℹ No changes made - all attributes and values already exist`;
        }
      } else {
        message = ` Import completed with issues: ${added} added, ${merged} merged, ${errors} errors`;
      }

      console.log("Import Summary:", {
        added,
        merged,
        errors,
        totalNewValues,
        totalIgnoredValues,
        details: importDetails,
      });

      setToast({
        message,
        type: errors > 0 ? "error" : "success",
      });

      loadAttributes();
    } catch (error: any) {
      console.error("Import error:", error);
      setToast({ message: `Import error: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };
  const downloadTemplate = () => {
    function getBreadcrumbEndValues(categories: Category[]): string[] {
      return categories.map((cat) => {
        const parts = cat.breadcrumb.split(">").map((p) => p.trim());
        return parts[parts.length - 1];
      });
    }

    function getAttributeNames(attribute: Attribute[]): string[] {
      return attribute.map((attr) => attr.attribute_name);
    }

    const customeDownloadData = [
      {
        category_list_string: "Mobiles, Laptops, Tablets",
        attribute_name: "Capacity",
        attribute_type: "Multi-select",
        data_type: "Text",
        unit: "",
        description: "",
        filter: "Yes",
        filter_display_name: "RAM",
      },
    ];
    const customeDownloadColumns = [
      { header: "Category Name", key: "category_list_string" },
      { header: "Attribute Name", key: "attribute_name" },
      { header: "Attribute Type", key: "attribute_type" },
      { header: "Data Type", key: "data_type" },
      { header: "Unit", key: "unit" },
      { header: "Description", key: "description" },
      { header: "Filter", key: "filter" },
      { header: "Filter Display Name", key: "filter_display_name" },
    ];

    for (let attr = 1; attr <= 50; attr++) {
      customeDownloadColumns.push({
        header: `attribute_value_${attr.toString()}`,
        key: `attribute_value_${attr.toString()}`,
      });
      customeDownloadColumns.push({
        header: `attribute_uom_${attr.toString()}`,
        key: `attribute_uom_${attr.toString()}`,
      });
    }

    exportToExcel({
      data: customeDownloadData,
      fileName: "attribute_import_template.xlsx",
      columns: customeDownloadColumns,
      dropdowns: {
        category_list_string: getBreadcrumbEndValues(categories),
        attribute_name: getAttributeNames(attributes),
        data_type: ["Text", "Number", "Decimal", "Boolean", "List"],
        filter: ["Yes", "No"],
        attribute_type: ["Multi-select", "Single-select"],
      },
    });
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
    // { key: "attribute_code", label: "Code", sortable: true },
    {
      key: "selection",
      label: (
        <input
          type="checkbox"
          checked={
            selectedCodes.size === filteredAttributes.length &&
            filteredAttributes.length > 0
          }
          onChange={toggleSelectAll}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      ) as any,
      width: "100px",
      render: (_: any, row: Attribute) => (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedCodes.has(row.attribute_code)}
            onChange={() => toggleSelect(row.attribute_code)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      ),
    },
    { key: "attribute_name", label: "Name", sortable: true },
    { key: "attribute_type", label: "Attr Type", sortable: true },
    {
      key: "category_list_string",
      label: "Category",
    },
    {
      key: "value_count",
      label: "# Values",
      sortable: false,
      render: (_: any, row: Attribute) => getValueCount(row),
    },
    {
      key: "usage_count",
      label: "# of Categories",
      sortable: false,
      render: (_: any, row: Attribute) => {
        const categoryCount = row.applicable_categories
          ? row.applicable_categories.split(",").filter((c) => c.trim()).length
          : 0;

        return (
          <span
            className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
            title={categoryCount > 0 ? "Applied to Categories" : "Unused"}
          >
            {categoryCount}
          </span>
        );
      },
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
      <div className="flex items-center justify-between mb-[-24px]">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Attributes Master
          </h1>
          <p className="text-gray-600 mt-1">
            Define and manage product attributes
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1 justify-end">
          <div className="relative w-full md:w-[400px] lg:w-[500px] transition-all duration-300">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search attribute name..."
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
              setEditingAttribute(null);
              resetForm();
              setIsDrawerOpen(true);
            }}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-100 font-bold whitespace-nowrap"
          >
            <Plus size={20} />
            Add Attribute
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4 justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <FilterSelect
            options={categories.map((c)=>c.breadcrumb)}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Category"
            className="w-48 lg:w-64 truncate" 
            />
            <FilterSelect
              options={["Multi-select", "Single-select"]}
              value={attributeTypeFilter}
              onChange={setAttributeTypeFilter}
              placeholder="Attribute Type"
              className="mr-4"
            />
            <FilterSelect
              options={["Boolean", "Decimal", "List", "Number", "Text"]}
              value={dataTypeFilter}
              onChange={setDataTypeFilter}
              placeholder="Data Type"
            />
          </div>

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
              className="px-4 py-2 border border-gray-300 flex-shrink-0 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
          attributeTypeFilter ||
          categoryFilter||
          dataTypeFilter ? (
            <span>
              Showing <strong>{filteredAttributes.length}</strong> matching
              results out of {attributes.length} total attributes
            </span>
          ) : (
            <span>
              Showing all <strong>{attributes.length}</strong> attributes
            </span>
          )}
        </p>

        {(searchTerm ||
          industryFilter ||
          attributeTypeFilter ||
           categoryFilter||
          dataTypeFilter) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setIndustryFilter("");
              setAttributeTypeFilter("");
              setDataTypeFilter("");
              setCategoryFilter("")
            }}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>
      {selectedCodes.size > 0 && (
        <div className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
                {selectedCodes.size} selected
              </span>
              <p className="text-sm font-medium">Bulk Actions:</p>
            </div>

            <div className="flex items-center gap-3">
              <div ref={bulkCategoryRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (!showBulkCategoryDropdown) {
                      setBulkSelectedCategories([]);
                    }
                    setShowBulkCategoryDropdown(!showBulkCategoryDropdown);
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                >
                  <span>
                    {bulkSelectedCategories.length === 0
                      ? "Add Categories"
                      : `${bulkSelectedCategories.length} Selected to Add`}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      showBulkCategoryDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showBulkCategoryDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white text-gray-900 border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
                    <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            bulkSelectedCategories.length === categories.length
                          ) {
                            setBulkSelectedCategories([]);
                          } else {
                            setBulkSelectedCategories(
                              categories.map((c) => c.category_code),
                            );
                          }
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {bulkSelectedCategories.length === categories.length
                          ? "Clear All"
                          : "Select All"}
                      </button>
                      <span className="text-xs text-gray-500">
                        {bulkSelectedCategories.length} of {categories.length}
                      </span>
                    </div>

                    <div className="px-3 py-2 border-b border-gray-100">
                      <input
                        type="text"
                        placeholder="Search categories..."
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="overflow-y-auto max-h-64">
                      {categories.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-500">
                          No categories available
                        </div>
                      ) : (
                        availableCategories.map((cat) => {
                          const isSelected = bulkSelectedCategories.includes(
                            cat.category_code,
                          );
                          const appliedAttributes =
                            getAppliedAttributesForCategory(cat.category_code);

                          const isPartiallyApplied =
                            appliedAttributes.length > 0 &&
                            selectedCodes.size > 1;

                          const displayNames =
                            appliedAttributes.length > 2
                              ? `${appliedAttributes.slice(0, 2).join(", ")} +${appliedAttributes.length - 2}`
                              : appliedAttributes.join(", ");

                          return (
                            <label
                              key={cat.category_code}
                              className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                                isSelected ? "bg-blue-50" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setBulkSelectedCategories(
                                      bulkSelectedCategories.filter(
                                        (c) => c !== cat.category_code,
                                      ),
                                    );
                                  } else {
                                    setBulkSelectedCategories([
                                      ...bulkSelectedCategories,
                                      cat.category_code,
                                    ]);
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                              />
                              <span className="text-sm text-gray-700 flex-1 truncate">
                                {cat.breadcrumb}
                              </span>

                              {isPartiallyApplied && (
                                <span
                                  className="text-[10px] font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0 cursor-help"
                                  title={`Already applied to: ${appliedAttributes.join(", ")}`}
                                >
                                  Already in: {displayNames}
                                </span>
                              )}

                              {isSelected && (
                                <CheckCircle
                                  size={14}
                                  className="text-blue-600 flex-shrink-0 ml-2"
                                />
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>

                    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setBulkSelectedCategories([]);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Clear Selection
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowBulkCategoryDropdown(false);
                            setBulkSelectedCategories([]);
                          }}
                          className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkCategoryApply}
                          disabled={bulkSelectedCategories.length === 0}
                          className={`px-4 py-1.5 text-sm font-semibold rounded transition-colors ${
                            bulkSelectedCategories.length === 0
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          Apply to {selectedCodes.size} Attributes
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-white/20"></div>

              <button
                onClick={() => {
                  setSelectedCodes(new Set());
                  setBulkSelectedCategories([]);
                  setShowBulkCategoryDropdown(false);
                }}
                className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
          loadAttributes();
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
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attribute Display Name <span className="text-red-500">*</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable Categories ({categories.length})
              </label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No categories available
                  </p>
                ) : (
                  categories.map((cat) => (
                    <label
                      key={cat.breadcrumb}
                      className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        // checked={selectedCategories.includes(cat.breadcrumb)}
                        checked={selectedCategories.includes(cat.breadcrumb)}
                        onChange={() => toggleCategory(cat.breadcrumb)}
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
                      (c) => c.breadcrumb === code,
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
                <option value="text">Boolean </option>
                <option value="number"> Decimal </option>
                <option value="decimal">List </option>
                <option value="boolean">Number</option>
                <option value="list">Text</option>
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
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Variant</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variants
              </label>
              <select
                value={formData.variants?"Yes":"No"}
                onChange={(e) =>
                  setFormData({ ...formData, variants: e.target.value === "Yes" }) 
                }

                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            
          </div>
        </div>

        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6  shadow-lg flex gap-3">
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
