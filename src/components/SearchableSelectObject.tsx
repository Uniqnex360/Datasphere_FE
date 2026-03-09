import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Option {
  key: string;
  value: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
}

export function SearchableSelectObject({
  options,
  value,
  onChange,
  placeholder = "Select...",
  error,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.key === value);

  const filteredOptions = options.filter((opt) =>
    opt.value.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearch(selectedOption?.value || "");
    }
  }, [value, isOpen]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className={`flex items-center w-full px-3 py-2 border rounded-lg cursor-text bg-white ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          className="flex-1 outline-none text-sm text-gray-900"
          placeholder={placeholder}
          value={isOpen ? search : selectedOption?.value || ""}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch("");
          }}
        />

        <div className="flex items-center gap-1 text-gray-400">
          {value && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setSearch("");
              }}
              className="hover:text-red-500"
            >
              <X size={14} />
            </button>
          )}

          <ChevronDown size={18} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.key}
                onClick={() => {
                  onChange(option.key);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                  value === option.key
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700"
                }`}
              >
                {option.value}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}