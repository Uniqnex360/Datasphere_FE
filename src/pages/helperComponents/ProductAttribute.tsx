import React, { useState, useEffect } from "react";
import { ProductAPI } from "../../lib/api";
import { MultiSelectObjects, Option } from "../../components/MultiSlectByID";
import { LucideSave } from "lucide-react";

type Attribute = {
  id: string;
  attribute_code: string;
  name: string;
  selected_values: Option[];
  options: Option[];
};

type Props = {
  product_id: string;
};

export const ProductAttributeUpdate: React.FC<Props> = ({ product_id }) => {
  const [data, setData] = useState<Attribute[]>([]);
  const [formData, setFormData] = useState<Record<string, Option[]>>({});
  const [status, setStatus] = useState<Record<string, string>>({});

  // Fetch product attributes on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await ProductAPI.getAll(0, 100, "", {
          product_code_q: product_id,
        });
        console.log("API result:", result);

        const productData = Array.isArray(result) ? result[0] : null;

        // Convert attributes object to array
        const attributes: Attribute[] = productData?.attributes
          ? Object.values(productData.attributes)
          : [];

        console.log("Attributes:", attributes);

        setData(attributes);

        // Initialize formData for each attribute
        const initFormData: Record<string, Option[]> = {};
        attributes.forEach((attr) => {
          if (attr.attribute_code) {
            initFormData[attr.id] = attr.selected_values || [];
          }
        });
        setFormData(initFormData);
      } catch (err) {
        console.error("Failed to fetch product attributes", err);
        setData([]);
        setFormData({});
      }
    };

    fetchData();
  }, [product_id]);

  // Handle select change
  const handleChange = (attrId: string, selected: Option[]) => {
    setFormData((prev) => ({ ...prev, [attrId]: selected }));
  };

  // Handle save button click
  const handleSave = async (attrId: string) => {
    const attr = data.find((a) => a.id === attrId);
    if (!attr || !attr.attribute_code) return;

    setStatus((prev) => ({ ...prev, [attrId]: "saving" }));

    try {
      await ProductAPI.updateAttribute({
        product_id,
        attribute_code: attr.attribute_code,
        attribute_id: attr.id,
        updatedValues: formData[attrId].map((v) => ({
          id: v.id,
          value: v.value,
          uom: v.uom,
        })),
      });

      setStatus((prev) => ({ ...prev, [attrId]: "saved" }));
      setTimeout(() => setStatus((prev) => ({ ...prev, [attrId]: "" })), 2000);
    } catch (error) {
      console.error("Failed to save attribute", error);
      setStatus((prev) => ({ ...prev, [attrId]: "error" }));
    }
  };

  return (
    <div className="space-y-4">
      {data
        .filter((attr) => attr.id && attr.attribute_code)
        .map((attr) => (
          <div
            key={attr.id}
            className="flex flex-col sm:flex-row sm:items-center gap-2 rounded"
          >
            <label className="w-full sm:w-40 text-sm font-semibold text-gray-700">
              {attr.name}
            </label>

            <div className="flex-1">
              <MultiSelectObjects
                options={attr.options || []}
                value={formData[attr.id] || []}
                onChange={(selected) => handleChange(attr.id, selected)}
                placeholder="Select values"
                searchable={false}
              />
            </div>

            <button
              onClick={() => handleSave(attr.id)}
              className="flex items-center gap-2 px-4 py-2 text-blue-500 rounded mt-2 sm:mt-0 hover:bg-blue-50"
            >
              <LucideSave className="w-4 h-4" />
              {status[attr.id] === "saving"
                ? "Saving..."
                : status[attr.id] === "saved"
                  ? "Saved!"
                  : status[attr.id] === "error"
                    ? "Error"
                    : "Save"}
            </button>
          </div>
        ))}
    </div>
  );
};
