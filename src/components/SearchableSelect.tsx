import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onAddNew?: () => void;
  error?: boolean;
}
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  onAddNew,
  error,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  );
  useEffect(() => {
    function handleClickOutSide(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutSide);
    return () => document.removeEventListener("mousedown", handleClickOutSide);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearch(value || "");
    }
  }, [value, isOpen]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className={`flex items-center w-full px-3 py-2 border rounded-lg cursor-text focus-within:ring-2 focus-within:ring-blue-500 bg-white ${
          error
            ? "border-red-500 focus-within:border-red-500"
            : "border-gray-300 focus-within:border-blue-500"
        }`}
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
          placeholder={placeholder}
          value={isOpen ? search : value || ""}
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
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option}
                onClick={() => {
                  onChange(option);
                  setSearch("");
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                  value === option
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700"
                }`}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No results found
              {onAddNew && (
                <button
                  onClick={() => {
                    onAddNew();
                    setIsOpen(false);
                  }}
                  className="text-blue-600 hover:underline ml-1"
                >
                  Add "{search}"?
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
